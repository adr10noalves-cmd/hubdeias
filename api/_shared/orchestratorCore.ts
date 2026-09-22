import {
  EngineDiagnostic,
  EngineTestResult,
  NormalizedAIResponse,
  OrchestrationRequest,
} from './types.js';
import {
  executeGemini,
  testGemini,
  GEMINI_MODELS,
  DEFAULT_GEMINI_MODEL,
} from './geminiAdapter.js';
import {
  executeGroq,
  testGroq,
  GROQ_MODELS,
  DEFAULT_GROQ_MODEL,
} from './groqAdapter.js';
import { applyGlobalPolicy } from './globalAICommunicationPolicy.js';

/**
 * CAMADA CENTRAL DE EXECUÇÃO DE MOTORES
 * Fluxo:
 * USUÁRIO -> HUB -> ORQUESTRADOR DE MOTORES -> MOTOR SELECIONADO -> API DO MODELO -> RESPOSTA NORMALIZADA -> HUB -> USUÁRIO
 */
export async function orchestrateExecution(
  request: OrchestrationRequest
): Promise<NormalizedAIResponse> {
  const start = Date.now();
  const {
    provider = 'GEMINI',
    modelId,
    systemPrompt = 'Você é o Núcleo Inteligente de Orquestração do Hub de IAs.',
    userPrompt,
    complexityLevel = 3,
    allowFallback = true,
    jsonMode = false,
  } = request;

  const resolvedSystemPrompt = applyGlobalPolicy(systemPrompt);

  if (!userPrompt || userPrompt.trim() === '') {
    return {
      success: false,
      data: null,
      text: '',
      providerUsed: 'SYSTEM-FALLBACK',
      modelUsed: 'none',
      status: 'erro',
      fallbackTriggered: false,
      primaryError: 'Prompt do usuário vazio ou ausente.',
      diagnostic: {
        message: 'userPrompt é obrigatório.',
        probableCause: 'Corpo da requisição sem o campo "userPrompt".',
      },
      latencyMs: 0,
    };
  }

  // Determinar o provedor inicial
  let primaryProvider: 'GEMINI' | 'GROQ' = 'GEMINI';
  if (provider === 'GROQ') {
    primaryProvider = 'GROQ';
  } else if (provider === 'AUTO') {
    // Tarefas complexas (nível >= 3) -> Gemini; tarefas rápidas -> Groq
    primaryProvider = complexityLevel >= 3 ? 'GEMINI' : 'GROQ';
  }

  // 1. Tentar Provedor Primário
  if (primaryProvider === 'GEMINI') {
    const geminiRes = await executeGemini({
      systemPrompt: resolvedSystemPrompt,
      userPrompt,
      modelId: modelId || DEFAULT_GEMINI_MODEL,
      jsonMode,
    });

    if (geminiRes.success) {
      return {
        success: true,
        data: geminiRes.parsed || { response: geminiRes.content },
        text: geminiRes.content,
        providerUsed: 'GEMINI',
        modelUsed: geminiRes.modelUsed,
        status: 'concluído',
        fallbackTriggered: false,
        latencyMs: Date.now() - start,
      };
    }

    const primaryError = geminiRes.error || 'Falha no motor Gemini';

    // 2. Acionar Fallback para Groq se permitido
    if (allowFallback) {
      const groqRes = await executeGroq({
        systemPrompt: resolvedSystemPrompt,
        userPrompt,
        modelId: DEFAULT_GROQ_MODEL,
        jsonMode,
      });

      if (groqRes.success) {
        return {
          success: true,
          data: groqRes.parsed || { response: groqRes.content },
          text: groqRes.content,
          providerUsed: 'GROQ',
          modelUsed: `${groqRes.modelUsed} (Fallback)`,
          status: 'concluído',
          fallbackTriggered: true,
          primaryError,
          diagnostic: {
            httpStatus: geminiRes.httpStatus,
            message: `Gemini falhou (${primaryError}). Resposta entregue com sucesso via Groq Fallback.`,
            probableCause: geminiRes.probableCause,
          },
          latencyMs: Date.now() - start,
        };
      }

      // Ambos falharam
      return {
        success: false,
        data: null,
        text: '',
        providerUsed: 'SYSTEM-FALLBACK',
        modelUsed: 'nenhum',
        status: 'erro',
        fallbackTriggered: true,
        primaryError: `Gemini falhou: ${geminiRes.error}. Groq fallback também falhou: ${groqRes.error}`,
        diagnostic: {
          httpStatus: geminiRes.httpStatus || groqRes.httpStatus || 500,
          message: 'Ambos os motores de IA falharam.',
          probableCause: `${geminiRes.probableCause || ''} | ${groqRes.probableCause || ''}`.trim(),
        },
        latencyMs: Date.now() - start,
      };
    }

    // Sem fallback
    return {
      success: false,
      data: null,
      text: '',
      providerUsed: 'GEMINI',
      modelUsed: geminiRes.modelUsed,
      status: geminiRes.status,
      fallbackTriggered: false,
      primaryError,
      diagnostic: {
        httpStatus: geminiRes.httpStatus,
        message: geminiRes.error || 'Erro no motor Gemini',
        probableCause: geminiRes.probableCause,
      },
      latencyMs: Date.now() - start,
    };
  } else {
    // Provedor Primário: GROQ
    const groqRes = await executeGroq({
      systemPrompt: resolvedSystemPrompt,
      userPrompt,
      modelId: modelId || DEFAULT_GROQ_MODEL,
      jsonMode,
    });

    if (groqRes.success) {
      return {
        success: true,
        data: groqRes.parsed || { response: groqRes.content },
        text: groqRes.content,
        providerUsed: 'GROQ',
        modelUsed: groqRes.modelUsed,
        status: 'concluído',
        fallbackTriggered: false,
        latencyMs: Date.now() - start,
      };
    }

    const primaryError = groqRes.error || 'Falha no motor Groq';

    // Fallback para Gemini
    if (allowFallback) {
      const geminiRes = await executeGemini({
        systemPrompt: resolvedSystemPrompt,
        userPrompt,
        modelId: DEFAULT_GEMINI_MODEL,
        jsonMode,
      });

      if (geminiRes.success) {
        return {
          success: true,
          data: geminiRes.parsed || { response: geminiRes.content },
          text: geminiRes.content,
          providerUsed: 'GEMINI',
          modelUsed: `${geminiRes.modelUsed} (Fallback)`,
          status: 'concluído',
          fallbackTriggered: true,
          primaryError,
          diagnostic: {
            httpStatus: groqRes.httpStatus,
            message: `Groq falhou (${primaryError}). Resposta entregue com sucesso via Gemini Fallback.`,
            probableCause: groqRes.probableCause,
          },
          latencyMs: Date.now() - start,
        };
      }

      return {
        success: false,
        data: null,
        text: '',
        providerUsed: 'SYSTEM-FALLBACK',
        modelUsed: 'nenhum',
        status: 'erro',
        fallbackTriggered: true,
        primaryError: `Groq falhou: ${groqRes.error}. Gemini fallback também falhou: ${geminiRes.error}`,
        diagnostic: {
          httpStatus: groqRes.httpStatus || geminiRes.httpStatus || 500,
          message: 'Ambos os motores de IA falharam.',
          probableCause: `${groqRes.probableCause || ''} | ${geminiRes.probableCause || ''}`.trim(),
        },
        latencyMs: Date.now() - start,
      };
    }

    return {
      success: false,
      data: null,
      text: '',
      providerUsed: 'GROQ',
      modelUsed: groqRes.modelUsed,
      status: groqRes.status,
      fallbackTriggered: false,
      primaryError,
      diagnostic: {
        httpStatus: groqRes.httpStatus,
        message: groqRes.error || 'Erro no motor Groq',
        probableCause: groqRes.probableCause,
      },
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Diagnóstico de Disponibilidade dos Motores
 */
export function getOrchestratorDiagnostics(): {
  status: 'ok' | 'warning' | 'error';
  gemini: any;
  groq: any;
  engines?: {
    GEMINI: any;
    GROQ: any;
  };
  timestamp: string;
} {
  const geminiKey = process.env.GEMINI_API_KEY;
  const isGeminiConfigured = Boolean(
    geminiKey && geminiKey.trim() !== '' && geminiKey !== 'MY_GEMINI_API_KEY'
  );

  const groqKey = process.env.GROQ_API_KEY;
  const isGroqConfigured = Boolean(
    groqKey && groqKey.trim() !== '' && groqKey.startsWith('gsk_')
  );

  const geminiDiag: any = {
    provider: 'GEMINI',
    status: isGeminiConfigured ? 'disponível' : 'indisponível',
    configured: isGeminiConfigured,
    model: DEFAULT_GEMINI_MODEL,
    availableModels: GEMINI_MODELS,
    message: isGeminiConfigured
      ? 'Motor Gemini configurado e pronto como Provedor Principal.'
      : 'Variável GEMINI_API_KEY não encontrada no ambiente.',
    diagnostic: {
      state: isGeminiConfigured ? 'disponível' : 'indisponível',
      message: isGeminiConfigured
        ? 'Motor operacional pronto para requisições de alto raciocínio.'
        : 'Variável GEMINI_API_KEY ausente ou não configurada.',
      probableCause: isGeminiConfigured
        ? undefined
        : 'Configure GEMINI_API_KEY nas variáveis de ambiente da plataforma (Vercel / Cloud Run).',
      variableName: 'GEMINI_API_KEY',
    },
    models: GEMINI_MODELS,
    defaultModel: DEFAULT_GEMINI_MODEL,
  };

  const groqDiag: any = {
    provider: 'GROQ',
    status: isGroqConfigured ? 'disponível' : 'indisponível',
    configured: isGroqConfigured,
    model: DEFAULT_GROQ_MODEL,
    availableModels: GROQ_MODELS,
    message: isGroqConfigured
      ? 'Motor Groq configurado e pronto como Provedor Auxiliar / Fallback.'
      : 'Variável GROQ_API_KEY não encontrada no ambiente.',
    diagnostic: {
      state: isGroqConfigured ? 'disponível' : 'indisponível',
      message: isGroqConfigured
        ? 'Motor operacional pronto para inferências ultrarrápidas.'
        : 'Variável GROQ_API_KEY ausente ou não configurada.',
      probableCause: isGroqConfigured
        ? undefined
        : 'Configure GROQ_API_KEY nas variáveis de ambiente da plataforma (Vercel / Cloud Run).',
      variableName: 'GROQ_API_KEY',
    },
    models: GROQ_MODELS,
    defaultModel: DEFAULT_GROQ_MODEL,
  };

  const overallStatus = isGeminiConfigured
    ? 'ok'
    : isGroqConfigured
    ? 'warning'
    : 'error';

  return {
    status: overallStatus,
    gemini: geminiDiag,
    groq: groqDiag,
    engines: {
      GEMINI: geminiDiag,
      GROQ: groqDiag,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Teste Individual de Motor
 */
export async function runIndividualEngineTest(
  engine: 'GEMINI' | 'GROQ'
): Promise<EngineTestResult> {
  if (engine === 'GEMINI') {
    return await testGemini();
  } else {
    return await testGroq();
  }
}
