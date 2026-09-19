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

// ==========================================
// 💡 MEMÓRIA ESTRATÉGICA: IDEIAS, EVOLUÇÃO E ESTUDOS
// ==========================================

export type IdeaCategory =
  | 'Projeto'
  | 'Estudo'
  | 'IA'
  | 'SST'
  | 'Automação'
  | 'Negócios'
  | 'Software'
  | 'Pesquisa'
  | 'Produto'
  | 'Outros';

export const IDEA_CATEGORIES: IdeaCategory[] = [
  'Projeto',
  'Estudo',
  'IA',
  'SST',
  'Automação',
  'Negócios',
  'Software',
  'Pesquisa',
  'Produto',
  'Outros',
];

export type IdeaStage =
  | '1. Ideia'
  | '2. Exploração'
  | '3. Planejamento'
  | '4. Protótipo'
  | '5. Desenvolvimento'
  | '6. Teste'
  | '7. Validação'
  | '8. Produção'
  | '9. Evolução';

export const IDEA_STAGES: IdeaStage[] = [
  '1. Ideia',
  '2. Exploração',
  '3. Planejamento',
  '4. Protótipo',
  '5. Desenvolvimento',
  '6. Teste',
  '7. Validação',
  '8. Produção',
  '9. Evolução',
];

export type IdeaPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';
export const IDEA_PRIORITIES: IdeaPriority[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

export type IdeaStatus =
  | 'Rascunho'
  | 'Ativa'
  | 'Em Progresso'
  | 'Pausada'
  | 'Concluída'
  | 'Arquivada';

export const IDEA_STATUSES: IdeaStatus[] = [
  'Rascunho',
  'Ativa',
  'Em Progresso',
  'Pausada',
  'Concluída',
  'Arquivada',
];

export interface RoadmapItem {
  id: string;
  stageTitle: string; // Ex: "Atual", "Próxima Evolução", "Depois", "Futuro"
  goal: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
}

export interface ProjectConcept {
  summary: string;          // O conceito central transformado pela IA
  coreValue: string;        // Proposta e tese de valor central
  mechanics: string;        // Princípios de funcionamento e mecânica conceitual
  marketFit?: string;       // Diferencial de mercado e posicionamento
}

export interface ProjectApplication {
  realWorldUseCases: string[]; // Casos de uso práticos no mundo real
  userFlow: string[];          // Fluxo do usuário passo a passo
  businessRules: string[];     // Regras de negócio essenciais
  architecture: string;        // Arquitetura prática de funcionamento
}

export interface ProjectStagePrompt {
  id: string;
  order: number;
  title: string;              // Ex: "Etapa 1: Concepção & Modelagem" ... "Etapa Final: Produção & Lançamento"
  phase: string;              // 'Concepção' | 'Arquitetura' | 'Backend' | 'Frontend' | 'Integrações' | 'Testes' | 'Deploy Final'
  objective: string;          // Objetivo específico desta etapa
  deliverable: string;        // O que é entregue ao final da etapa
  prompt: string;             // O PROMPT PRONTO e completo para executar esta etapa com IAs
  recommendedTools: string[]; // Ferramentas/IAs ideais para esta etapa
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  executionOutput?: string;   // Saída/código/artefato gerado pela IA ao executar o prompt
}

export interface ProjectRevision {
  id: string;
  ideaId: string;
  userId?: string;
  revisionNumber: number;      // 1, 2, 3... ilimitado/infinito
  userRequest: string;         // O que o usuário pediu para a IA melhorar
  improvementSummary: string;  // Resumo analítico do que a IA aprimorou
  conceptChanges?: string;     // Como o conceito evoluiu
  applicationChanges?: string; // Como a aplicação evoluiu
  stagesChangedCount: number;
  modelUsed?: string;
  createdAt: string;
}

export interface IdeaItem {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: IdeaCategory;
  objective: string;
  problemSolved: string;
  targetAudience: string;
  stage: IdeaStage;
  priority: IdeaPriority;
  status: IdeaStatus;
  relatedTechnologies: string[];
  relatedIANames: string[];
  currentVersion: string; // Ex: "V1", "V2", "V3"
  revisionsCount?: number; // Quantidade de revisões infinitas realizadas com a IA
  concept?: ProjectConcept; // Conceito teórico e arquitetura de valor gerada pela IA
  application?: ProjectApplication; // Aplicação prática no mundo real gerada pela IA
  stages?: ProjectStagePrompt[]; // As etapas e cada prompt até a etapa final
  observations?: string;
  nextSteps?: string;
  roadmap?: RoadmapItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IdeaVersion {
  id: string;
  ideaId: string;
  userId?: string;
  version: string;
  changedSummary: string; // O que mudou
  changeReason: string; // Motivo da mudança
  decisionTaken: string; // Decisão tomada
  nextStep: string; // Próximo passo
  observations?: string;
  createdAt: string;
}

export type EvolutionLogCategory =
  | 'Descoberta'
  | 'Decisão'
  | 'Aprendizado'
  | 'Obstáculo'
  | 'Teste'
  | 'Ideia'
  | 'Validação'
  | 'Marco';

export const EVOLUTION_LOG_CATEGORIES: EvolutionLogCategory[] = [
  'Descoberta',
  'Decisão',
  'Aprendizado',
  'Obstáculo',
  'Teste',
  'Ideia',
  'Validação',
  'Marco',
];

export interface EvolutionLog {
  id: string;
  ideaId: string;
  userId?: string;
  text: string;
  category: EvolutionLogCategory;
  impact: string; // Impacto na ideia/projeto
  createdAt: string;
}

export type StudyLevel = 'Iniciante' | 'Intermediário' | 'Avançado';
export const STUDY_LEVELS: StudyLevel[] = ['Iniciante', 'Intermediário', 'Avançado'];

export interface StudyItem {
  id: string;
  userId?: string;
  theme: string;
  objective: string;
  level: StudyLevel;
  acquiredKnowledge: string;
  doubts: string;
  sources: string[];
  toolsUsed: string[];
  exercises: string;
  conclusions: string;
  nextSubjects: string;
  progress: number; // 0-100
  relatedProjectIds: string[]; // IDs das ideias/projetos relacionados
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 🤖 NÚCLEO INTELIGENTE DE ORQUESTRAÇÃO DO HUB
// ==========================================

export type AssistantMode =
  | 'CONVERSATION'
  | 'PLANNING'
  | 'SIMULATION'
  | 'EVOLUTION';

export type AssistantIntent =
  | 'pergunta'
  | 'ideia'
  | 'projeto'
  | 'estudo'
  | 'tarefa'
  | 'problema'
  | 'decisao'
  | 'solicitacao_analise'
  | 'solicitacao_execucao'
  | 'pedido_planejamento'
  | 'pedido_simulacao'
  | 'atualizacao_projeto';

export type ExecutionValidationStatus =
  | 'resposta_recebida'
  | 'resposta_validada'
  | 'erro'
  | 'execucao_incompleta'
  | 'resultado_pendente'
  | 'falha_validacao';

export interface TaskPlanStep {
  stepNumber: number;
  title: string;
  deliverable: string;
  prompt: string;
  toolRecommendation: string;
  testsValidation: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
}

export interface TaskPlan {
  objective: string;
  steps: TaskPlanStep[];
  testingCriteria: string;
  productionNotes: string;
  nextEvolution: string;
}

export interface ContextualPromptData {
  context: string;
  objective: string;
  problem: string;
  environment: string;
  constraints: string[];
  task: string;
  acceptanceCriteria: string[];
  expectedResult: string;
  fullPromptText: string;
}

export interface AIModelRecommendation {
  modelId: string;
  modelName: string;
  provider: 'Groq' | 'Gemini' | 'Anthropic' | 'OpenAI' | 'Local' | 'GEMINI' | 'GROQ';
  costTier: 'FREE' | 'LOW' | 'MEDIUM' | 'HIGH';
  specialtyMatch: string;
  reasoning: string;
}

export interface StructuredAssistantContext {
  projectId?: string;
  projectTitle?: string;
  projectDescription?: string;
  currentStage?: string;
  currentVersion?: string;
  objective?: string;
  lastEvolution?: string;
  currentProblems?: string[];
  decisions?: string[];
  nextSteps?: string[];
  relatedStudies?: Array<{ id?: string; theme: string; level: string; progress: number }>;
  recentLogs?: Array<{ text: string; category: string; createdAt: string }>;
  summaryForAI: string;
}

export interface ProjectLearningEntry {
  id: string;
  projectId: string;
  learned: string;         // "O que aprendemos?"
  workedWell: string;      // "O que funcionou?"
  didNotWork: string;      // "O que não funcionou?"
  neededChanges: string;   // "O que precisa ser alterado?"
  nextStep: string;        // "Qual é o próximo passo?"
  createdAt: string;
}

export interface OperationalExecutionRecord {
  id: string;
  userId?: string;
  projectId?: string;
  projectTitle?: string;
  studyId?: string;
  mode: AssistantMode;
  isSimulation: boolean;
  taskTitle: string;
  intent: AssistantIntent;
  modelUsed: string;
  prompt: string;
  result: string;
  status: ExecutionValidationStatus;
  validationNotes?: string;
  error?: string;
  decision?: string;
  nextStep?: string;
  learning?: ProjectLearningEntry;
  durationMs: number;
  estimatedTimeSavedMin?: number;
  costUsd?: number;
  createdAt: string;
}

export type ProjectHubStatus =
  | 'Ideia'
  | 'Planejamento'
  | 'Em desenvolvimento'
  | 'Em teste'
  | 'Concluído'
  | 'Em evolução';

export const PROJECT_HUB_STATUSES: ProjectHubStatus[] = [
  'Ideia',
  'Planejamento',
  'Em desenvolvimento',
  'Em teste',
  'Concluído',
  'Em evolução',
];

export interface ProjectHistoryItem {
  id: string;
  date: string;
  description: string;
  author?: string;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  sender: 'user' | 'ai';
  text: string;
  createdAt: string;
  aiModel?: string;
}

export interface ProjectDecision {
  id: string;
  projectId: string;
  decision: string;
  reason: string;
  date: string;
  responsible: string;
  impact: string;
  status: 'Ativa' | 'Revisada' | 'Revogada';
}

export interface ProjectMission {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  createdAt: string;
  dueDate?: string;
  notes?: string;
}

export interface ProjectSuggestion {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: string;
  status: 'Nova' | 'Analisada' | 'Adicionada' | 'Ignorada';
  createdAt: string;
}

export interface ProjectHubItem {
  id: string;
  name: string;
  description: string;
  objective: string;
  expectedResult?: string;
  createdAt: string;
  updatedAt: string;
  status: ProjectHubStatus;
  currentStage: string;
  nextAction: string;
  progress: number; // 0 a 100
  aiTools: string[];
  notes: string;
  history: ProjectHistoryItem[];
}

// --- TIPOS DE AUTENTICAÇÃO E SEGURANÇA (GUARDIÃO & CENTRAL DE SEGURANÇA) ---

export type UserRole = 'ADMIN' | 'OPERATOR' | 'USER' | 'GUEST';

export type UserStatus = 'active' | 'suspended' | 'locked';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string; // Armazenado com salt/hash seguro
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  lockedUntil?: string | null;
  failedAttempts: number;
}

export type SecurityEventType =
  | 'LOGIN_SUCESSO'
  | 'LOGIN_FALHA'
  | 'CONTA_BLOQUEADA'
  | 'CONTA_DESBLOQUEADA'
  | 'LOGOUT'
  | 'PASSKEY_CRIADA'
  | 'PASSKEY_REMOVIDA'
  | 'SESSAO_REVOGADA'
  | 'ACESSO_NEGADO'
  | 'ACESSO_ADMINISTRATIVO'
  | 'ALTERACAO_DE_SENHA'
  | 'USUARIO_CRIADO'
  | 'USUARIO_DESATIVADO';

export interface SecurityEvent {
  id: string;
  userId?: string;
  username: string;
  event: SecurityEventType;
  severity: 'info' | 'warn' | 'danger';
  metadata: string;
  timestamp: string;
  ip?: string;
  device?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  device: string;
}

export interface PasskeyCredential {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName: string;
  createdAt: string;
  revokedAt?: string | null;
}




