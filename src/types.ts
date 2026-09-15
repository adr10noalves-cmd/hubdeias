export type IALevel = 'Elite' | 'Alta Performance' | 'Especializada';

export type IACategory =
  | 'MODELOS GERAIS / MULTIMODAL'
  | 'PESQUISA INTELIGENTE'
  | 'CÓDIGO & ENGENHARIA'
  | 'AUTOMAÇÃO & EXECUÇÃO'
  | 'IMAGEM & CRIATIVIDADE'
  | 'VÍDEO & PRODUÇÃO'
  | 'ÁUDIO & MÚSICA'
  | 'PRODUTIVIDADE EMPRESARIAL';

export type IADifficulty = 'Iniciante' | 'Intermediário' | 'Avançado';
export type IAPricing = 'Gratuito' | 'Freemium (Grátis + Pago)' | 'Pago com Teste Grátis' | 'Pago';

export interface IAScores {
  Geral: number;
  Código: number;
  Pesquisa: number;
  Criação: number;
  Automação: number;
  Produtividade?: number;
}

export interface IAItem {
  id: number;
  name: string;
  category: IACategory;
  specialty: string;
  differential: string;
  level: IALevel;
  link: string;
  scores: IAScores;
  // Campos V2.0 drico IAS para iniciantes:
  difficulty?: IADifficulty;
  pricing?: IAPricing;
  pricingDetails?: string;
  whatIsIt?: string;
  whatIsItFor?: string;
  bestTasks?: string[];
  keySkills?: string[];
  beginnerTip?: string;
  tags?: string[];
  isFeaturedForBeginners?: boolean;

  // NOVOS CAMPOS V2.2 — Ficha Operacional (Opcionais):
  paraQueServe?: string;
  quandoUsar?: string;
  quandoNaoUsar?: string;
  melhorPara?: string;
  pontosFortes?: string;
  limitacoes?: string;
  exemploPrompt?: string;
  observacaoEstrategica?: string;

  // NOVOS CAMPOS V2.3 — Groq Curator & Descoberta
  sourceType?: 'manual' | 'groq_discovered';
  discoveredAt?: string; // Data ISO da descoberta
  lastValidated?: string; // Data ISO da última validação de URL/plano
  pricingType?: 'FREE' | 'FREEMIUM' | 'TRIAL' | 'PAID' | 'UNKNOWN';
  qualityScore?: number; // Score de qualidade estimado (0-100)
  whyDiscovered?: string; // Por que foi encontrada
  whyBetter?: string; // Por que pode ser melhor que as opções atuais
  validationStatus?: 'VALIDADA' | 'NECESSITA_VALIDACAO';
}

export type PricingType = 'FREE' | 'FREEMIUM' | 'TRIAL' | 'PAID' | 'UNKNOWN';

export interface DiscoveredAICandidate {
  name: string;
  officialUrl: string;
  category: IACategory;
  specialty: string;
  differential: string;
  level: IALevel;
  pricingType: PricingType;
  qualityScore: number;
  reason: string;
  whyDiscovered?: string;
  whyBetter?: string;
  // Ficha prática pré-gerada
  paraQueServe?: string;
  quandoUsar?: string;
  quandoNaoUsar?: string;
  pontosFortes?: string;
  limitacoes?: string;
  exemploPrompt?: string;
}

export interface CandidateEvaluationResult {
  candidate: DiscoveredAICandidate;
  passed: boolean;
  status: 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
  isDuplicate?: boolean;
}

export const CATEGORIES: IACategory[] = [
  'MODELOS GERAIS / MULTIMODAL',
  'PESQUISA INTELIGENTE',
  'CÓDIGO & ENGENHARIA',
  'AUTOMAÇÃO & EXECUÇÃO',
  'IMAGEM & CRIATIVIDADE',
  'VÍDEO & PRODUÇÃO',
  'ÁUDIO & MÚSICA',
  'PRODUTIVIDADE EMPRESARIAL',
];

// Tipos da Central de Comando de IA (V2.4)
export type CentralIntent =
  | 'recommend'
  | 'generate_prompt'
  | 'compare'
  | 'register_ai'
  | 'discover_ai'
  | 'build_strategy'
  | 'query_catalog';

export interface RecommendedOption {
  rank: 'champion' | 'second' | 'third';
  titleBadge: string;
  name: string;
  specialty: string;
  compatibility: number; // 0-100% estimada
  reason: string;
  officialUrl: string;
  iaItem?: IAItem;
}

export interface PromptGenerationResult {
  prompt: string;
  objective: string;
  targetIA: string;
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  desiredResult?: string;
  role: string;
  instructions: string[];
  constraints: string[];
  responseFormat: string;
  qualityCriteria: string;
  summary?: string;
  improvements?: string[];
  needsClarification?: boolean;
  clarificationQuestion?: string;
}

export interface ComparisonDimensionScore {
  dimension: string;
  scores: Record<string, number>; // iaName -> score 1-100
  notes: Record<string, string>;
}

export interface ComparisonAIsResult {
  objective: string;
  iasCompared: string[];
  dimensions: ComparisonDimensionScore[];
  compatibilityScores: Record<string, number>; // compatibilidade estimada 0-100
  verdict: string;
  recommendedWinner: string;
  winnerReason: string;
}

export interface StrategyStep {
  stepNumber: number;
  stageName: string;
  goal: string;
  recommendedIA: string;
  iaItem?: IAItem;
  whyThisIA: string;
  expectedDeliverable: string;
  actionPrompt: string;
}

export interface AIStrategyResult {
  complexTask: string;
  overview: string;
  steps: StrategyStep[];
  catalogCoverage: string; // Ex: "5 de 5 ferramentas já no seu catálogo"
}

export interface CatalogQueryAnswer {
  question: string;
  answer: string;
  matchingIANames: string[];
  highlights: string[];
}

