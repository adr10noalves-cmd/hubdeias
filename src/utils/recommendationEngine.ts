import { IAItem, IACategory } from '../types';
import { resolveIADetails } from './helpers';

export type UserGoal =
  | 'Resolver uma tarefa geral'
  | 'Pesquisar, investigar ou estudar'
  | 'Criar ou corrigir código/sistema'
  | 'Automatizar processos'
  | 'Criar imagens/designs'
  | 'Criar vídeos'
  | 'Criar áudio/música/voz'
  | 'Trabalhar com produtividade empresarial';

export type UserLevel =
  | 'Iniciante'
  | 'Intermediário'
  | 'Avançado'
  | 'Qualquer nível';

export type UserPriority =
  | 'Melhor IA para a tarefa'
  | 'Facilidade de uso'
  | 'Criatividade'
  | 'Capacidade técnica';

export interface RecommendationCriteria {
  goal: UserGoal;
  userLevel: UserLevel;
  priority: UserPriority;
}

export interface AIRankingResult {
  ia: IAItem;
  score: number;
  adherencePercentage: number;
  reason: string;
  rank: 1 | 2 | 3;
}

export interface RecommendationResult {
  topMatch: AIRankingResult;
  alternative1: AIRankingResult;
  alternative2: AIRankingResult;
  allRanked: AIRankingResult[];
  totalEvaluated: number;
  criteria: RecommendationCriteria;
}

// Mapeamento direto de objetivos para categorias principais
const GOAL_CATEGORY_MAP: Record<UserGoal, IACategory> = {
  'Resolver uma tarefa geral': 'MODELOS GERAIS / MULTIMODAL',
  'Pesquisar, investigar ou estudar': 'PESQUISA INTELIGENTE',
  'Criar ou corrigir código/sistema': 'CÓDIGO & ENGENHARIA',
  'Automatizar processos': 'AUTOMAÇÃO & EXECUÇÃO',
  'Criar imagens/designs': 'IMAGEM & CRIATIVIDADE',
  'Criar vídeos': 'VÍDEO & PRODUÇÃO',
  'Criar áudio/música/voz': 'ÁUDIO & MÚSICA',
  'Trabalhar com produtividade empresarial': 'PRODUTIVIDADE EMPRESARIAL',
};

// Termos-chave por objetivo
const GOAL_KEYWORDS: Record<UserGoal, string[]> = {
  'Resolver uma tarefa geral': [
    'raciocínio', 'conversa', 'assistente', 'multimodal', 'geral', 'resumo', 'escrita', 'redação',
    'texto', 'chat', 'análise', 'lógica', 'solução', 'ideias'
  ],
  'Pesquisar, investigar ou estudar': [
    'pesquisa', 'fontes', 'citações', 'web', 'artigos', 'estudo', 'busca', 'verificação',
    'referências', 'tempo real', 'científico', 'notícias', 'links', 'confiável'
  ],
  'Criar ou corrigir código/sistema': [
    'código', 'desenvolvimento', 'programação', 'dev', 'software', 'debug', 'typescript', 'python',
    'ide', 'terminal', 'copilot', 'engenharia', 'full-stack', 'bugs', 'sistemas', 'api'
  ],
  'Automatizar processos': [
    'automação', 'agente', 'workflow', 'integração', 'rpa', 'execução', 'rotinas', 'operar',
    'fluxo', 'conectar', 'autônomo', 'processos', 'tarefas'
  ],
  'Criar imagens/designs': [
    'imagem', 'design', 'arte', 'vetorial', 'render', 'ilustração', 'fotorealismo', 'visual',
    'estilo', 'foto', 'logos', 'banners', 'criativo', 'pintura'
  ],
  'Criar vídeos': [
    'vídeo', 'animação', 'cinema', 'movimento', 'avatar', 'clip', 'lip-sync', 'motion',
    'cinematografia', 'edição', 'cenas', 'produção', 'câmera'
  ],
  'Criar áudio/música/voz': [
    'áudio', 'voz', 'música', 'tts', 'som', 'clone', 'dublagem', 'locução', 'stem',
    'efeitos sonoros', 'fala', 'instrumental', 'canção', 'narrativa'
  ],
  'Trabalhar com produtividade empresarial': [
    'produtividade', 'equipe', 'documentos', 'planilha', 'empresa', 'reunião', 'gestão',
    'organização', 'notion', 'workspace', 'office', 'transcrição', 'corporativo'
  ],
};

/**
 * Calcula a pontuação de aderência estratégica (0 a 100%) de uma IA
 * com base nos critérios escolhidos pelo usuário.
 */
export function calculateAIScore(
  ia: IAItem,
  criteria: RecommendationCriteria
): { score: number; reason: string } {
  const details = resolveIADetails(ia);
  const primaryCategory = GOAL_CATEGORY_MAP[criteria.goal];

  let rawScore = 0;

  // 1. Compatibilidade de Categoria (Até 45 pontos)
  if (ia.category === primaryCategory) {
    rawScore += 45;
  } else {
    // Sinergias secundárias entre categorias
    if (criteria.goal === 'Criar ou corrigir código/sistema' && ia.category === 'MODELOS GERAIS / MULTIMODAL') {
      rawScore += 30; // Modelos de ponta como Claude, GPT-4o, DeepSeek são excelentes em código
    } else if (criteria.goal === 'Pesquisar, investigar ou estudar' && ia.category === 'MODELOS GERAIS / MULTIMODAL') {
      rawScore += 26;
    } else if (criteria.goal === 'Resolver uma tarefa geral' && (ia.category === 'PESQUISA INTELIGENTE' || ia.category === 'PRODUTIVIDADE EMPRESARIAL')) {
      rawScore += 22;
    } else if (criteria.goal === 'Automatizar processos' && (ia.category === 'PRODUTIVIDADE EMPRESARIAL' || ia.category === 'CÓDIGO & ENGENHARIA')) {
      rawScore += 18;
    } else if (criteria.goal === 'Criar imagens/designs' && ia.category === 'VÍDEO & PRODUÇÃO') {
      rawScore += 16;
    } else if (criteria.goal === 'Criar vídeos' && ia.category === 'IMAGEM & CRIATIVIDADE') {
      rawScore += 16;
    } else {
      rawScore += 8; // Linha de base mínima
    }
  }

  // 2. Especialidade, Diferencial e Palavras-chave (Até 25 pontos)
  const keywords = GOAL_KEYWORDS[criteria.goal] || [];
  const searchableText = [
    ia.name,
    ia.specialty,
    ia.differential,
    details.whatIsIt,
    details.whatIsItFor,
    ...(details.bestTasks || []),
    ...(details.keySkills || []),
  ]
    .join(' ')
    .toLowerCase();

  let matchedKeywordsCount = 0;
  for (const kw of keywords) {
    if (searchableText.includes(kw.toLowerCase())) {
      matchedKeywordsCount++;
    }
  }

  const keywordPoints = Math.min(25, matchedKeywordsCount * 4 + 5);
  rawScore += keywordPoints;

  // 3. Nível do Usuário (Até 15 pontos)
  const diff = details.difficulty;
  if (criteria.userLevel === 'Iniciante') {
    if (diff === 'Iniciante') rawScore += 15;
    else if (diff === 'Intermediário') rawScore += 9;
    else rawScore += 3;
  } else if (criteria.userLevel === 'Intermediário') {
    if (diff === 'Intermediário') rawScore += 15;
    else if (diff === 'Iniciante') rawScore += 12;
    else rawScore += 9;
  } else if (criteria.userLevel === 'Avançado') {
    if (diff === 'Avançado') rawScore += 15;
    else if (ia.level === 'Elite') rawScore += 14;
    else if (diff === 'Intermediário') rawScore += 10;
    else rawScore += 6;
  } else {
    // Qualquer nível
    rawScore += 13;
  }

  // 4. Prioridade Escolhida (Até 15 pontos)
  if (criteria.priority === 'Melhor IA para a tarefa') {
    if (ia.level === 'Elite') rawScore += 15;
    else if (ia.level === 'Alta Performance') rawScore += 12;
    else rawScore += 9;
  } else if (criteria.priority === 'Facilidade de uso') {
    if (diff === 'Iniciante') rawScore += 14;
    else if (diff === 'Intermediário') rawScore += 8;
    else rawScore += 3;

    if (details.pricing === 'Gratuito' || details.pricing.includes('Freemium')) {
      rawScore += 1;
    }
  } else if (criteria.priority === 'Criatividade') {
    const criacaoScore = ia.scores?.Criação || 3;
    rawScore += Math.round((criacaoScore / 5) * 14);
    if (searchableText.includes('criativ') || searchableText.includes('arte') || searchableText.includes('estilo')) {
      rawScore += 1;
    }
  } else if (criteria.priority === 'Capacidade técnica') {
    const technicalScore = Math.max(ia.scores?.Código || 3, ia.scores?.Automação || 3, ia.scores?.Pesquisa || 3);
    rawScore += Math.round((technicalScore / 5) * 12);
    if (ia.level === 'Elite') rawScore += 3;
  }

  // Normalização para percentual de aderência (máximo 98%, mínimo proporcional)
  // Para ferramentas da mesma categoria, ajustamos para a faixa 85% - 98%
  let finalPercentage: number;
  if (ia.category === primaryCategory) {
    finalPercentage = Math.min(98, Math.max(76, Math.round(rawScore * 0.98)));
  } else {
    finalPercentage = Math.min(84, Math.max(45, Math.round(rawScore * 0.82)));
  }

  // Construção do motivo resumido personalizado da recomendação
  const reason = generateRecommendationReason(ia, details, criteria, finalPercentage);

  return {
    score: finalPercentage,
    reason,
  };
}

/**
 * Gera um motivo claro, objetivo e contextualizado da recomendação.
 */
function generateRecommendationReason(
  ia: IAItem,
  details: ReturnType<typeof resolveIADetails>,
  criteria: RecommendationCriteria,
  percentage: number
): string {
  const primaryCategory = GOAL_CATEGORY_MAP[criteria.goal];
  const isDirectCategory = ia.category === primaryCategory;

  const priorityPhrases: Record<UserPriority, string> = {
    'Melhor IA para a tarefa': `apresenta desempenho classificado como ${ia.level}`,
    'Facilidade de uso': `possui interface acessível (${details.difficulty}) e curva de aprendizado suave`,
    'Criatividade': `destaca-se por alta capacidade inventiva e expressividade`,
    'Capacidade técnica': `entrega alta precisão técnica e robustez de execução`,
  };

  const levelPhrases: Record<UserLevel, string> = {
    'Iniciante': 'ideal para quem busca simplicidade e resultados diretos',
    'Intermediário': 'excelente equilíbrio entre controle e agilidade operacional',
    'Avançado': 'atende perfeitamente a fluxos sofisticados e exigências profissionais',
    'Qualquer nível': 'versátil para qualquer perfil de usuário',
  };

  if (isDirectCategory) {
    return `${percentage}% de compatibilidade estimada. Desenvolvida especificamente para esta finalidade, ${priorityPhrases[criteria.priority]}. Seu principal diferencial é: "${ia.differential}", sendo ${levelPhrases[criteria.userLevel]}.`;
  } else {
    return `${percentage}% de compatibilidade estimada. Embora pertença a ${ia.category.toLowerCase()}, possui especialidade em "${ia.specialty}", respondendo com eficácia ao seu objetivo com ${priorityPhrases[criteria.priority]}.`;
  }
}

/**
 * Ordena e ranqueia as IAs do catálogo existente com base nos critérios.
 */
export function rankAIs(
  ias: IAItem[],
  criteria: RecommendationCriteria
): AIRankingResult[] {
  const scoredItems = ias.map((ia) => {
    const { score, reason } = calculateAIScore(ia, criteria);
    return {
      ia,
      score,
      adherencePercentage: score,
      reason,
      rank: 1 as 1 | 2 | 3,
    };
  });

  // Ordena por pontuação decrescente (e desempate por nível Elite -> Alta Performance -> Especializada)
  scoredItems.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    const levelWeight = { Elite: 3, 'Alta Performance': 2, Especializada: 1 };
    const weightA = levelWeight[a.ia.level] || 1;
    const weightB = levelWeight[b.ia.level] || 1;
    return weightB - weightA;
  });

  // Atribui os ranks para os primeiros itens
  return scoredItems.map((item, index) => {
    const rank = (index === 0 ? 1 : index === 1 ? 2 : 3) as 1 | 2 | 3;
    return {
      ...item,
      rank,
    };
  });
}

/**
 * Função principal do motor estratégico de recomendação ("Qual IA devo usar?").
 * Analisa as IAs do catálogo existente e retorna a melhor recomendação e alternativas.
 */
export function recommendationEngine(
  ias: IAItem[],
  criteria: RecommendationCriteria
): RecommendationResult {
  const ranked = rankAIs(ias, criteria);

  const topMatch = ranked[0];
  const alternative1 = ranked[1] || ranked[0];
  const alternative2 = ranked[2] || ranked[1] || ranked[0];

  return {
    topMatch,
    alternative1,
    alternative2,
    allRanked: ranked,
    totalEvaluated: ias.length,
    criteria,
  };
}
