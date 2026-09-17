import { AIModelRecommendation, IAItem } from '../../types';
import { analyzeTaskComplexity, TaskComplexityAnalysis, ComplexityLevel } from './taskComplexity';
import { getOrchestratorSettings, OrchestratorSettings } from './orchestratorConfig';
import { FilteredTaskContext } from './contextBuilder';

export interface ModelRouteDecision {
  provider: 'GEMINI' | 'GROQ';
  modelId: string;
  modelName: string;
  complexity: TaskComplexityAnalysis;
  reasoning: string;
  primaryFallback: {
    provider: 'GEMINI' | 'GROQ';
    modelId: string;
    modelName: string;
  };
  recommendedModel: AIModelRecommendation;
  alternativeModels: AIModelRecommendation[];
  executionStrategy: string;
  estimatedLatencyMs: number;
}

/**
 * 3. SELEÇÃO INTELIGENTE DE MODELO (MODEL ROUTER)
 * TASK → CLASSIFY → SCORE COMPLEXITY → CHECK CONTEXT → SELECT MODEL
 * 
 * Regras:
 * - NÍVEL 1 (Simples)      → Groq (alta velocidade, custo zero)
 * - NÍVEL 2 (Intermediário)→ Groq ou Gemini conforme configuração/carga
 * - NÍVEL 3 (Complexo)     → Gemini preferencialmente (arquitetura, programação, documentos)
 * - NÍVEL 4 (Estratégico)  → Gemini prioritariamente (evolução de projetos, memória histórica profunda)
 */
export function routeAITaskOrchestrated(params: {
  userTask: string;
  context: FilteredTaskContext;
  isSimulation?: boolean;
  catalogIAs?: IAItem[];
  previousErrorsCount?: number;
  customSettings?: OrchestratorSettings;
}): ModelRouteDecision {
  const {
    userTask,
    context,
    isSimulation = false,
    previousErrorsCount = 0,
    customSettings,
  } = params;

  const settings = customSettings || getOrchestratorSettings();

  // 1. ANÁLISE DE COMPLEXIDADE
  const complexity = analyzeTaskComplexity({
    userMessage: userTask,
    hasTargetProject: Boolean(context.targetProject),
    hasHistoricalMemory: (context.pastDecisions.length > 0 || context.recentChangesSummary.length > 0),
    isSimulation,
  });

  // 2. DECISÃO DE PROVEDOR BASEADO EM CONFIGURAÇÕES E NÍVEL
  let provider: 'GEMINI' | 'GROQ' = 'GEMINI';
  let modelId = 'gemini-2.5-pro';
  let modelName = 'Gemini 2.5 Pro (Google DeepMind)';
  let reasoning = '';

  // Modo Simulação força Groq em Sandbox
  if (isSimulation) {
    provider = 'GROQ';
    modelId = 'openai/gpt-oss-120b';
    modelName = 'Groq GPT-OSS 120B (Sandbox de Simulação)';
    reasoning = 'Simulação isolada de cenário executada no ambiente de alta velocidade Groq, preservando integridade de produção.';
  } else {
    // Roteamento pelos 4 Níveis Oficiais
    switch (complexity.level) {
      case 1: { // Nível 1 - Simples
        if (settings.groqEnabled && settings.level1Provider === 'GROQ') {
          provider = 'GROQ';
          modelId = settings.groqDefaultModel || 'openai/gpt-oss-20b';
          modelName = 'Groq GPT-OSS 20B (Ultra-Velocidade)';
          reasoning = 'Tarefa classificada como Nível 1 (Simples). Otimizada para retorno ultra-rápido com o motor Groq.';
        } else {
          provider = 'GEMINI';
          modelId = 'gemini-2.5-flash';
          modelName = 'Gemini 2.5 Flash';
          reasoning = 'Execução ágil via Gemini 2.5 Flash de baixa latência.';
        }
        break;
      }
      case 2: { // Nível 2 - Intermediário
        if (settings.groqEnabled && settings.level2Provider === 'GROQ') {
          provider = 'GROQ';
          modelId = 'openai/gpt-oss-120b';
          modelName = 'Groq GPT-OSS 120B';
          reasoning = 'Tarefa classificada como Nível 2 (Intermediária). Groq GPT-OSS 120B oferece alto desempenho e agilidade.';
        } else {
          provider = 'GEMINI';
          modelId = 'gemini-2.5-flash';
          modelName = 'Gemini 2.5 Flash';
          reasoning = 'Tarefa intermediária atribuída ao Gemini 2.5 Flash para geração consistente e estruturada.';
        }
        break;
      }
      case 3: { // Nível 3 - Complexo (Código, Arquitetura, Análise Documental)
        if (settings.geminiEnabled) {
          provider = 'GEMINI';
          modelId = settings.geminiDefaultModel || 'gemini-2.5-pro';
          modelName = 'Gemini 2.5 Pro (Engenharia & Raciocínio)';
          reasoning = 'Tarefa de Nível 3 (Complexa). Raciocínio analítico avançado e programação profunda direcionados ao modelo principal Gemini.';
        } else {
          provider = 'GROQ';
          modelId = 'openai/gpt-oss-120b';
          modelName = 'Groq GPT-OSS 120B (Fallback de Complexidade)';
          reasoning = 'Gemini desativado nas configurações; roteando excepcionalmente para Groq 120B.';
        }
        break;
      }
      case 4: { // Nível 4 - Estratégico (Evolução de Projetos, Memória Histórica)
        provider = 'GEMINI';
        modelId = 'gemini-2.5-pro';
        modelName = 'Gemini 2.5 Pro (Estratégia & Memória Longa)';
        reasoning = 'Tarefa de Nível 4 (Estratégica). Decisões fundamentais de arquitetura e evolução do projeto requerem a janela de contexto máxima e raciocínio profundo do Gemini.';
        break;
      }
    }
  }

  // Se houve falhas recentes com o provedor escolhido, aciona fallback preventivo
  if (previousErrorsCount > 0 && provider === 'GEMINI' && settings.groqEnabled) {
    provider = 'GROQ';
    modelId = 'openai/gpt-oss-120b';
    modelName = 'Groq GPT-OSS 120B (Fallback Resiliente)';
    reasoning += ` [Atenção: Redirecionado para Groq devido a ${previousErrorsCount} oscilação(ões) recente(s)].`;
  } else if (previousErrorsCount > 0 && provider === 'GROQ' && settings.geminiEnabled) {
    provider = 'GEMINI';
    modelId = 'gemini-2.5-flash';
    modelName = 'Gemini 2.5 Flash (Fallback Resiliente)';
    reasoning += ` [Atenção: Redirecionado para Gemini devido a ${previousErrorsCount} oscilação(ões) recente(s)].`;
  }

  // Configuração de Fallback Primário Bidirecional
  const primaryFallback: ModelRouteDecision['primaryFallback'] = provider === 'GEMINI'
    ? { provider: 'GROQ', modelId: 'openai/gpt-oss-120b', modelName: 'Groq GPT-OSS 120B (Fallback)' }
    : { provider: 'GEMINI', modelId: 'gemini-2.5-flash', modelName: 'Gemini 2.5 Flash (Fallback)' };

  const recommendedModel: AIModelRecommendation = {
    modelId,
    modelName,
    provider,
    costTier: 'FREE',
    specialtyMatch: complexity.levelName,
    reasoning,
  };

  const alternativeModels: AIModelRecommendation[] = [
    {
      modelId: primaryFallback.modelId,
      modelName: primaryFallback.modelName,
      provider: primaryFallback.provider,
      costTier: 'FREE',
      specialtyMatch: 'Fallback Automático Resiliente',
      reasoning: 'Garante continuidade operacional caso o provedor primário apresente oscilação.',
    },
  ];

  const estimatedLatencyMs = provider === 'GROQ' ? 650 : 1800;

  return {
    provider,
    modelId,
    modelName,
    complexity,
    reasoning,
    primaryFallback,
    recommendedModel,
    alternativeModels,
    executionStrategy: `Orquestração Nível ${complexity.level} (${complexity.levelName}) via ${provider} com fallback para ${primaryFallback.provider}.`,
    estimatedLatencyMs,
  };
}

// Mantém compatibilidade retroativa para módulos que chamavam routeAITask
export function routeAITask(params: {
  taskText: string;
  isSimulation?: boolean;
  catalogIAs?: IAItem[];
}) {
  const dummyContext: FilteredTaskContext = {
    objective: params.taskText,
    recentChangesSummary: [],
    knownProblems: [],
    pastDecisions: [],
    nextSteps: [],
    relevantStudies: [],
    contextSummaryText: '',
    tokensEstimated: 50,
  };
  const decision = routeAITaskOrchestrated({
    userTask: params.taskText,
    context: dummyContext,
    isSimulation: params.isSimulation,
    catalogIAs: params.catalogIAs,
  });

  return {
    recommendedModel: decision.recommendedModel,
    alternativeModels: decision.alternativeModels,
    taskType: decision.complexity.level >= 3 ? ('CÓDIGO' as const) : ('GERAL' as const),
    complexity: decision.complexity.level >= 3 ? ('ALTA' as const) : decision.complexity.level === 2 ? ('MÉDIA' as const) : ('BAIXA' as const),
    estimatedCost: 'GRATUITO' as const,
    executionStrategy: decision.executionStrategy,
  };
}
