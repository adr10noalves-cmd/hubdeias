import { GoogleGenAI } from '@google/genai';
import { EngineStatus, EngineTestResult } from './types.js';

export const GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

export interface GeminiExecutionResult {
  success: boolean;
  content: string;
  parsed?: any;
  modelUsed: string;
  latencyMs: number;
  status: EngineStatus;
  httpStatus?: number;
  error?: string;
  probableCause?: string;
}

/**
 * Executa requisição ao motor Gemini com fallback em cadeia de modelos oficiais
 */
export async function executeGemini(params: {
  systemPrompt: string;
  userPrompt: string;
  modelId?: string;
  jsonMode?: boolean;
}): Promise<GeminiExecutionResult> {
  const start = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      success: false,
      content: '',
      modelUsed: params.modelId || DEFAULT_GEMINI_MODEL,
      latencyMs: Date.now() - start,
      status: 'indisponível',
      httpStatus: 401,
      error: 'GEMINI_API_KEY não configurada no ambiente.',
      probableCause:
        'Variável GEMINI_API_KEY ausente ou vazia. Configure em Vercel -> Settings -> Environment Variables ou no arquivo .env.',
    };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return {
      success: false,
      content: '',
      modelUsed: params.modelId || DEFAULT_GEMINI_MODEL,
      latencyMs: Date.now() - start,
      status: 'erro',
      error: 'Falha ao inicializar o cliente GoogleGenAI.',
      probableCause: 'Chave de API inválida ou biblioteca incompatível.',
    };
  }

  const requested = params.modelId || DEFAULT_GEMINI_MODEL;
  const modelsToTry = [
    requested,
    ...GEMINI_MODELS.filter((m) => m !== requested),
  ];

  let lastErr: any = null;
  let lastHttpStatus: number | undefined;

  for (const model of modelsToTry) {
    try {
      let responseText = '';
      
      // Tentativa 1: SDK oficial
      if (ai) {
        try {
          const config: any = {
            temperature: 0.25,
          };

          if (params.systemPrompt && params.systemPrompt.trim() !== '') {
            config.systemInstruction = params.systemPrompt;
          }

          if (params.jsonMode) {
            config.responseMimeType = 'application/json';
          }

          const response = await ai.models.generateContent({
            model,
            contents: params.userPrompt,
            config,
          });

          responseText = response.text || '';
        } catch (sdkErr: any) {
          // Fallback transparente para chamada direta via fetch REST oficial
          const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const contentsPayload: any[] = [];
          
          if (params.systemPrompt && params.systemPrompt.trim() !== '') {
            contentsPayload.push({
              role: 'user',
              parts: [{ text: `Instruções do Sistema:\n${params.systemPrompt}\n\nTarefa do Usuário:\n${params.userPrompt}` }],
            });
          } else {
            contentsPayload.push({
              role: 'user',
              parts: [{ text: params.userPrompt }],
            });
          }

          const restResp = await fetch(restUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contentsPayload,
              generationConfig: {
                temperature: 0.25,
                responseMimeType: params.jsonMode ? 'application/json' : undefined,
              },
            }),
          });

          if (!restResp.ok) {
            const errData = await restResp.json().catch(() => ({}));
            throw new Error(errData?.error?.message || `HTTP ${restResp.status} na API REST do Gemini`);
          }

          const restJson = await restResp.json();
          responseText = restJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } else {
        // Sem SDK, usar REST direto com fetch nativo (100% compativel com serverless Vercel)
        const restUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const contentsPayload: any[] = [];
        
        if (params.systemPrompt && params.systemPrompt.trim() !== '') {
          contentsPayload.push({
            role: 'user',
            parts: [{ text: `Instruções do Sistema:\n${params.systemPrompt}\n\nTarefa do Usuário:\n${params.userPrompt}` }],
          });
        } else {
          contentsPayload.push({
            role: 'user',
            parts: [{ text: params.userPrompt }],
          });
        }

        const restResp = await fetch(restUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: contentsPayload,
            generationConfig: {
              temperature: 0.25,
              responseMimeType: params.jsonMode ? 'application/json' : undefined,
            },
          }),
        });

        if (!restResp.ok) {
          const errData = await restResp.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `HTTP ${restResp.status} na API REST do Gemini`);
        }

        const restJson = await restResp.json();
        responseText = restJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      const text = responseText;
      if (!text || text.trim() === '') {
        throw new Error(`Resposta vazia retornada pelo modelo ${model}`);
      }

      let parsed: any = null;
      let clean = text.trim();
      if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/i, '').replace(/```$/i, '').trim();
      }

      try {
        parsed = JSON.parse(clean);
      } catch {
        const jsonMatch = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            parsed = { response: text };
          }
        } else {
          parsed = { response: text };
        }
      }

      return {
        success: true,
        content: text,
        parsed,
        modelUsed: model,
        latencyMs: Date.now() - start,
        status: 'concluído',
      };
    } catch (err: any) {
      lastErr = err;
      const errMsg = String(err?.message || err);

      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        lastHttpStatus = 429;
      } else if (errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API_KEY_INVALID')) {
        lastHttpStatus = 401;
        break; // Chave inválida não adianta tentar outros modelos Gemini
      } else if (errMsg.includes('400') || errMsg.includes('INVALID_ARGUMENT')) {
        lastHttpStatus = 400;
      } else if (errMsg.includes('503') || errMsg.includes('overloaded')) {
        lastHttpStatus = 503;
      }
    }
  }

  // Falha em todos os modelos Gemini
  const errMsg = String(lastErr?.message || lastErr || 'Erro desconhecido');
  let probableCause = 'Falha de comunicação com o serviço Gemini da Google.';

  if (lastHttpStatus === 429 || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
    probableCause = 'Limite de requisições ou cota da API Gemini atingido (HTTP 429). O sistema deve acionar fallback.';
  } else if (lastHttpStatus === 401 || errMsg.includes('API key') || errMsg.includes('unregistered')) {
    probableCause = 'Chave GEMINI_API_KEY inválida ou não autorizada no Google AI Studio / GCP Console.';
  } else if (lastHttpStatus === 400) {
    probableCause = 'Formato ou argumentos da requisição rejeitados pela API Gemini.';
  }

  return {
    success: false,
    content: '',
    modelUsed: requested,
    latencyMs: Date.now() - start,
    status: 'erro',
    httpStatus: lastHttpStatus || 500,
    error: errMsg,
    probableCause,
  };
}

/**
 * Realiza o teste individual oficial do Motor Gemini
 * Prompt: "Responda apenas: MOTOR GEMINI FUNCIONAL."
 */
export async function testGemini(): Promise<EngineTestResult> {
  const start = Date.now();
  const res = await executeGemini({
    systemPrompt: 'Você é o validador do Motor Gemini do Hub de IAs. Responda estritamente o que foi solicitado sem explicações adicionais.',
    userPrompt: 'Responda apenas: MOTOR GEMINI FUNCIONAL.',
    modelId: DEFAULT_GEMINI_MODEL,
  });

  const latencyMs = Date.now() - start;

  if (res.success && res.content) {
    const isExact = res.content.includes('MOTOR GEMINI FUNCIONAL');
    return {
      provider: 'GEMINI',
      status: 'disponível',
      testPassed: true,
      message: '✓ MOTOR FUNCIONAL',
      responseSnippet: res.content.trim().slice(0, 100),
      modelUsed: res.modelUsed,
      latencyMs,
      diagnostic: isExact
        ? 'Motor Gemini respondendo com perfeição aos prompts de validação.'
        : `Motor Gemini respondeu com sucesso: "${res.content.trim().slice(0, 60)}"`,
    };
  }

  return {
    provider: 'GEMINI',
    status: res.status === 'indisponível' ? 'indisponível' : 'erro',
    testPassed: false,
    message: '✕ MOTOR COM ERRO',
    modelUsed: res.modelUsed,
    latencyMs,
    httpStatus: res.httpStatus,
    diagnostic: `Status: ${res.error || 'Falha na requisição'}${res.httpStatus ? ` (HTTP ${res.httpStatus})` : ''}`,
    probableCause: res.probableCause || 'Verifique a variável GEMINI_API_KEY no ambiente.',
  };
}
