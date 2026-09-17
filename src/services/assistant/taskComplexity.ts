import { IdeaItem, StudyItem } from '../../types';

export type ComplexityLevel = 1 | 2 | 3 | 4;

export interface TaskComplexityAnalysis {
  level: ComplexityLevel;
  levelName: 'SIMPLES' | 'INTERMEDIÁRIO' | 'COMPLEXO' | 'ESTRATÉGICO';
  score: number; // 0 a 100
  factors: string[];
  recommendedProvider: 'GEMINI' | 'GROQ';
  recommendedModelId: string;
  recommendedModelName: string;
  reasoning: string;
}

/**
 * 4. NÍVEIS DE COMPLEXIDADE
 * NÍVEL 1 — SIMPLES: transformação, resumo, classificação, pequenas respostas (Groq)
 * NÍVEL 2 — INTERMEDIÁRIO: análise, comparação, organização, geração estruturada (Groq / Gemini)
 * NÍVEL 3 — COMPLEXO: arquitetura, programação, planejamento, análise documental (Gemini preferencialmente)
 * NÍVEL 4 — ESTRATÉGICO: evolução de projetos, decisões arquiteturais, memória histórica (Gemini prioritariamente)
 */
export function analyzeTaskComplexity(params: {
  userMessage: string;
  hasTargetProject: boolean;
  hasHistoricalMemory: boolean;
  isSimulation?: boolean;
}): TaskComplexityAnalysis {
  const { userMessage, hasTargetProject, hasHistoricalMemory, isSimulation = false } = params;
  const lower = userMessage.toLowerCase().trim();
  const words = lower.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const factors: string[] = [];
  let score = 20; // base intermediária-baixa

  // Fator: Simulação
  if (isSimulation) {
    return {
      level: 1,
      levelName: 'SIMPLES',
      score: 25,
      factors: ['Modo Simulação ativado: isolamento em sandbox de inferência ultra-rápida'],
      recommendedProvider: 'GROQ',
      recommendedModelId: 'openai/gpt-oss-120b',
      recommendedModelName: 'Groq GPT-OSS 120B (Sandbox Simulação)',
      reasoning: 'Simulações rápidas de hipóteses e cenários operam idealmente no motor Groq sem custo e com latência mínima.',
    };
  }

  // Fator: Estratégia, Planejamento e Evolução de Projetos (Nível 3 e 4)
  const strategicKeywords = [
    'plano', 'planejamento', 'plano estratégico', 'etapas', 'arquitetura', 'evolução',
    'evoluir projeto', 'evolução de projeto', 'arquitetura de sistema', 'decisão arquitetural',
    'próxima versão', 'v2', 'v3', 'roadmap', 'planejamento estratégico', 'diário de bordo',
    'integração entre sistemas', 'memória histórica', 'visão de futuro', 'mudança estrutural',
    'refatorar arquitetura', 'auditor sst'
  ];
  const hasStrategic = strategicKeywords.some((k) => lower.includes(k));
  if (hasStrategic && hasTargetProject) {
    score += 50;
    factors.push('Demanda planejamento de evolução com acoplamento à memória histórica do projeto');
  } else if (hasStrategic) {
    score += 40;
    factors.push('Termos de planejamento estruturado e arquitetura identificados');
  }

  // Fator: Código, Programação e Engenharia (Nível 3)
  const codingKeywords = [
    'código', 'typescript', 'javascript', 'react', 'node', 'express', 'firestore', 'api',
    'função', 'componente', 'bug', 'debug', 'refatorar', 'algoritmo', 'interface', 'endpoint',
    'autenticação', 'oauth', 'token', 'hook', 'useeffect', 'promisse', 'banco de dados'
  ];
  const hasCoding = codingKeywords.some((k) => lower.includes(k));
  if (hasCoding) {
    score += 35;
    factors.push('Requer raciocínio técnico de programação e regras estritas de engenharia de software');
  }

  // Fator: Análise documental profunda ou regras de negócio (Nível 3)
  const docKeywords = [
    'documento', 'laudo', 'nr-01', 'nr-09', 'sst', 'pgr', 'pcmso', 'norma', 'contrato',
    'análise técnica', 'auditoria', 'comparar requisitos', 'conformidade legal'
  ];
  const hasDoc = docKeywords.some((k) => lower.includes(k));
  if (hasDoc) {
    score += 25;
    factors.push('Análise de conformidade técnica, normas regulamentadoras ou requisitos documentais');
  }

  // Fator: Tarefas Simples (Nível 1)
  const simpleKeywords = [
    'resuma', 'resumir', 'traduza', 'classifique', 'categorize', 'o que é', 'quem é',
    'liste', 'formate', 'qual a diferença básica', 'corrija o português', 'sinônimo'
  ];
  const hasSimple = simpleKeywords.some((k) => lower.includes(k));
  if (hasSimple && wordCount < 20 && !hasStrategic && !hasCoding) {
    score -= 25;
    factors.push('Comando direto de transformação de texto, classificação ou síntese breve');
  }

  // Fator: Extensão do texto
  if (wordCount > 50) {
    score += 15;
    factors.push('Entrada longa com múltiplas restrições contextuais');
  } else if (wordCount < 8) {
    score -= 10;
    factors.push('Prompt conciso de objetivo único');
  }

  // Fator: Memória e histórico
  if (hasHistoricalMemory) {
    score += 15;
    factors.push('Existência de histórico prévio que necessita de contextualização');
  }

  // Clamp 0 a 100
  score = Math.max(5, Math.min(100, score));

  // Mapeamento para os 4 Níveis Oficiais
  if (score >= 75) {
    return {
      level: 4,
      levelName: 'ESTRATÉGICO',
      score,
      factors,
      recommendedProvider: 'GEMINI',
      recommendedModelId: 'gemini-2.5-pro',
      recommendedModelName: 'Gemini 2.5 Pro (Raciocínio Profundo & Memória)',
      reasoning: 'Decisões arquiteturais e evolução de projetos exigem a maior janela de contexto e profundidade analítica do Gemini.',
    };
  }

  if (score >= 50) {
    return {
      level: 3,
      levelName: 'COMPLEXO',
      score,
      factors,
      recommendedProvider: 'GEMINI',
      recommendedModelId: 'gemini-2.5-flash',
      recommendedModelName: 'Gemini 2.5 Flash (Engenharia & Raciocínio Rápido)',
      reasoning: 'Tarefas de programação, arquitetura e análise técnica têm como padrão o raciocínio rigoroso do Gemini.',
    };
  }

  if (score >= 30) {
    return {
      level: 2,
      levelName: 'INTERMEDIÁRIO',
      score,
      factors,
      recommendedProvider: 'GROQ',
      recommendedModelId: 'openai/gpt-oss-120b',
      recommendedModelName: 'Groq GPT-OSS 120B (Alta Performance)',
      reasoning: 'Equilíbrio entre resposta rápida e capacidade estruturada; executável com alta velocidade via Groq.',
    };
  }

  return {
    level: 1,
    levelName: 'SIMPLES',
    score,
    factors,
    recommendedProvider: 'GROQ',
    recommendedModelId: 'openai/gpt-oss-20b',
    recommendedModelName: 'Groq GPT-OSS 20B (Ultra-Velocidade)',
    reasoning: 'Tarefas simples de transformação, classificação e respostas imediatas são otimizadas para velocidade instantânea via Groq.',
  };
}
