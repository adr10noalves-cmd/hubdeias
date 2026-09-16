import { AIModelRecommendation, IAItem } from '../../types';

export interface RouterAnalysisResult {
  recommendedModel: AIModelRecommendation;
  alternativeModels: AIModelRecommendation[];
  taskType: 'CÓDIGO' | 'ANÁLISE' | 'DOCUMENTOS' | 'RACIOCÍNIO' | 'SIMULAÇÃO_RÁPIDA' | 'GERAL';
  complexity: 'BAIXA' | 'MÉDIA' | 'ALTA';
  estimatedCost: 'GRATUITO' | 'BAIXO' | 'MÉDIO';
  executionStrategy: string;
}

/**
 * 8. ROTEADOR DE IA
 * Analisa a complexidade e contexto da tarefa e roteia para o modelo ideal
 * entre os modelos disponíveis no backend (Groq e Gemini) e ferramentas do catálogo.
 */
export function routeAITask(params: {
  taskText: string;
  isSimulation?: boolean;
  catalogIAs?: IAItem[];
}): RouterAnalysisResult {
  const { taskText, isSimulation = false } = params;
  const lower = taskText.toLowerCase();

  // Identificação do tipo de tarefa
  let taskType: RouterAnalysisResult['taskType'] = 'GERAL';
  if (isSimulation) {
    taskType = 'SIMULAÇÃO_RÁPIDA';
  } else if (lower.includes('código') || lower.includes('typescript') || lower.includes('react') || lower.includes('bug') || lower.includes('função') || lower.includes('api')) {
    taskType = 'CÓDIGO';
  } else if (lower.includes('pdf') || lower.includes('laudo') || lower.includes('documento') || lower.includes('sst') || lower.includes('pgr') || lower.includes('pcmso')) {
    taskType = 'DOCUMENTOS';
  } else if (lower.includes('raciocínio') || lower.includes('lógica') || lower.includes('arquitetura') || lower.includes('estratégia')) {
    taskType = 'RACIOCÍNIO';
  } else if (lower.includes('analisar') || lower.includes('comparar') || lower.includes('auditar')) {
    taskType = 'ANÁLISE';
  }

  // Complexidade
  const wordsCount = taskText.split(' ').length;
  let complexity: RouterAnalysisResult['complexity'] = 'MÉDIA';
  if (wordsCount > 40 || taskType === 'DOCUMENTOS' || taskType === 'CÓDIGO') {
    complexity = 'ALTA';
  } else if (wordsCount < 12) {
    complexity = 'BAIXA';
  }

  // Roteamento baseado nos modelos disponíveis no servidor Groq e regras reais
  let recommendedModel: AIModelRecommendation;
  let alternativeModels: AIModelRecommendation[] = [];
  let executionStrategy = '';

  if (isSimulation) {
    recommendedModel = {
      modelId: 'openai/gpt-oss-120b',
      modelName: 'Groq GPT-OSS 120B (Inference Engine)',
      provider: 'Groq',
      costTier: 'FREE',
      specialtyMatch: 'Simulação ultra-rápida de cenários e respostas estruturadas',
      reasoning: 'Ambiente de inferência Groq com latência mínima para testes e validações preliminares.',
    };
    alternativeModels = [
      {
        modelId: 'qwen/qwen3.8-27b',
        modelName: 'Groq Qwen 3.8 27B',
        provider: 'Groq',
        costTier: 'FREE',
        specialtyMatch: 'Inferência leve para validação de hipóteses',
        reasoning: 'Opção de menor latência quando a carga é simples.',
      },
    ];
    executionStrategy = 'Executar em ambiente simulado isolado (Modo Simulação), sem persistência definitiva até a validação do usuário.';
  } else if (taskType === 'CÓDIGO') {
    recommendedModel = {
      modelId: 'openai/gpt-oss-120b',
      modelName: 'Groq GPT-OSS 120B (Code & Engineering)',
      provider: 'Groq',
      costTier: 'FREE',
      specialtyMatch: 'Geração de código TypeScript, depuração e arquitetura',
      reasoning: 'Alta capacidade de raciocínio de código com execução imediata via API Groq integrada.',
    };
    alternativeModels = [
      {
        modelId: 'gemini-2.5-pro',
        modelName: 'Gemini 2.5 Pro',
        provider: 'Gemini',
        costTier: 'FREE',
        specialtyMatch: 'Raciocínio longo e análise multimodal profunda',
        reasoning: 'Excelente para depuração de erros complexos com contexto amplo.',
      },
    ];
    executionStrategy = 'Gerar prompt estruturado com restrições rígidas de tipagem e executar com o modelo principal.';
  } else if (taskType === 'DOCUMENTOS') {
    recommendedModel = {
      modelId: 'openai/gpt-oss-120b',
      modelName: 'Groq GPT-OSS 120B / Claude 3.7 Sonnet',
      provider: 'Groq',
      costTier: 'FREE',
      specialtyMatch: 'Extração estruturada de regras, normas e documentos técnicos',
      reasoning: 'Precisão na leitura de requisitos normativos (NRs de SST) e regras contratuais.',
    };
    alternativeModels = [
      {
        modelId: 'qwen/qwen3.8-27b',
        modelName: 'Qwen 3.8 27B (Groq)',
        provider: 'Groq',
        costTier: 'FREE',
        specialtyMatch: 'Triagem e classificação rápida de textos',
        reasoning: 'Custo zero e velocidade para classificação preliminar de laudos.',
      },
    ];
    executionStrategy = 'Estruturar os critérios de aceitação e realizar validação cruzada das normas.';
  } else {
    recommendedModel = {
      modelId: 'openai/gpt-oss-120b',
      modelName: 'Groq GPT-OSS 120B',
      provider: 'Groq',
      costTier: 'FREE',
      specialtyMatch: 'Compreensão semântica, planejamento e memória estratégica',
      reasoning: 'Equilíbrio ideal entre velocidade, profundidade analítica e gratuidade no Hub.',
    };
    alternativeModels = [
      {
        modelId: 'openai/gpt-oss-20b',
        modelName: 'Groq GPT-OSS 20B',
        provider: 'Groq',
        costTier: 'FREE',
        specialtyMatch: 'Respostas ágeis para perguntas e consultas rápidas',
        reasoning: 'Latência ultrabaixa para chats interativos.',
      },
    ];
    executionStrategy = 'Injetar a memória contextual do projeto no prompt e responder de forma direta e aplicável.';
  }

  return {
    recommendedModel,
    alternativeModels,
    taskType,
    complexity,
    estimatedCost: 'GRATUITO',
    executionStrategy,
  };
}
