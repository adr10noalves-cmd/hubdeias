import { EngineStatus, EngineTestResult } from './types.js';

export const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

export interface GroqExecutionResult {
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
 * Executa requisição ao motor Groq com fallback em cadeia de modelos ultra-rápidos
 */
export async function executeGroq(params: {
  systemPrompt: string;
  userPrompt: string;
  modelId?: string;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<GroqExecutionResult> {
  const start = Date.now();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      content: '',
      modelUsed: params.modelId || DEFAULT_GROQ_MODEL,
      latencyMs: Date.now() - start,
      status: 'indisponível',
      httpStatus: 401,
      error: 'GROQ_API_KEY não configurada no ambiente.',
      probableCause:
        'Variável GROQ_API_KEY ausente ou vazia. Configure em Vercel -> Settings -> Environment Variables ou no arquivo .env.',
    };
  }

  const requested = params.modelId || DEFAULT_GROQ_MODEL;
  const modelsToTry = [
    requested,
    ...GROQ_MODELS.filter((m) => m !== requested),
  ];

  let groqResponse: Response | null = null;
  let modelUsed = requested;
  let lastHttpStatus: number | undefined;
  let lastErrorText = '';

  for (const model of modelsToTry) {
    try {
      const bodyPayload: any = {
        model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt },
        ],
        temperature: 0.2,
        max_tokens: Math.max(params.maxTokens || 2048, 500),
      };

      if (params.jsonMode) {
        bodyPayload.response_format = { type: 'json_object' };
      }

      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (resp.ok) {
        groqResponse = resp;
        modelUsed = model;
        break;
      } else {
        lastHttpStatus = resp.status;
        const errBody = await resp.text().catch(() => '');
        lastErrorText = `Status ${resp.status}: ${errBody.slice(0, 150)}`;
        if (resp.status === 401 || resp.status === 403 || resp.status === 429) {
          break; // Chave inválida ou limite excedido: não adianta tentar outros modelos Groq
        }
      }
    } catch (e: any) {
      lastErrorText = e?.message || 'Falha de conexão com api.groq.com';
    }
  }

  if (!groqResponse) {
    let probableCause = 'Falha ao conectar com os servidores da Groq.';
    if (lastHttpStatus === 429) {
      probableCause = 'Limite de requisições por minuto da Groq atingido (HTTP 429).';
    } else if (lastHttpStatus === 401 || lastHttpStatus === 403) {
      probableCause = 'Chave GROQ_API_KEY inválida ou revogada.';
    }

    return {
      success: false,
      content: '',
      modelUsed,
      latencyMs: Date.now() - start,
      status: 'erro',
      httpStatus: lastHttpStatus || 500,
      error: lastErrorText || 'Nenhum modelo Groq pôde processar a requisição.',
      probableCause,
    };
  }

  let data: any = null;
  try {
    data = await groqResponse.json();
  } catch (parseErr: any) {
    return {
      success: false,
      content: '',
      modelUsed,
      latencyMs: Date.now() - start,
      status: 'erro',
      error: 'Resposta da Groq não pôde ser interpretada como JSON.',
      probableCause: 'Corrupção de payload retornado pelo gateway Groq.',
    };
  }

  const content = data?.choices?.[0]?.message?.content || '';
  if (!content) {
    return {
      success: false,
      content: '',
      modelUsed,
      latencyMs: Date.now() - start,
      status: 'erro',
      error: 'Resposta vazia retornada pela API Groq.',
      probableCause: 'O modelo completou a requisição sem gerar tokens de saída.',
    };
  }

  let parsed: any = null;
  let clean = content.trim();
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
        parsed = { response: content };
      }
    } else {
      parsed = { response: content };
    }
  }

  return {
    success: true,
    content,
    parsed,
    modelUsed,
    latencyMs: Date.now() - start,
    status: 'concluído',
  };
}

/**
 * Realiza o teste individual oficial do Motor Groq
 * Prompt: "Responda apenas: MOTOR GROQ FUNCIONAL."
 */
export async function testGroq(): Promise<EngineTestResult> {
  const start = Date.now();
  const res = await executeGroq({
    systemPrompt: 'Você é o validador do Motor Groq do Hub de IAs. Responda estritamente o que foi solicitado sem explicações adicionais.',
    userPrompt: 'Responda apenas: MOTOR GROQ FUNCIONAL.',
    modelId: DEFAULT_GROQ_MODEL,
    maxTokens: 500,
  });

  const latencyMs = Date.now() - start;

  if (res.success && res.content) {
    const isExact = res.content.includes('MOTOR GROQ FUNCIONAL');
    return {
      provider: 'GROQ',
      status: 'disponível',
      testPassed: true,
      message: '✓ MOTOR FUNCIONAL',
      responseSnippet: res.content.trim().slice(0, 100),
      modelUsed: res.modelUsed,
      latencyMs,
      diagnostic: isExact
        ? 'Motor Groq respondendo em alta velocidade (Inference Engine operacional).'
        : `Motor Groq respondeu com sucesso: "${res.content.trim().slice(0, 60)}"`,
    };
  }

  return {
    provider: 'GROQ',
    status: res.status === 'indisponível' ? 'indisponível' : 'erro',
    testPassed: false,
    message: '✕ MOTOR COM ERRO',
    modelUsed: res.modelUsed,
    latencyMs,
    httpStatus: res.httpStatus,
    diagnostic: `Status: ${res.error || 'Falha na requisição'}${res.httpStatus ? ` (HTTP ${res.httpStatus})` : ''}`,
    probableCause: res.probableCause || 'Verifique a variável GROQ_API_KEY no ambiente.',
  };
}
