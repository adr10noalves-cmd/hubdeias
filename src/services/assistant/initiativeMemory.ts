/**
 * MEMÓRIA DE INICIATIVA & REGRA ANTIRRUÍDO
 * 
 * Registra intervenções anteriores, perguntas feitas, explicações já dadas
 * e tempos de cooldown para garantir relevância e silêncio inteligente.
 */

export interface InitiativeQuestionRecord {
  id: string;
  topicKey: string;
  questionText: string;
  askedAt: number;
  answered: boolean;
  answeredAt?: number;
  userResponse?: string;
}

export interface InitiativeMemoryState {
  askedQuestions: Record<string, InitiativeQuestionRecord>;
  areaIntroductions: Record<string, number>; // rota -> timestamp em que foi apresentada
  lastInterventionTime: number; // timestamp global da última fala proativa
  silenceDecisionsCount: number; // estatística de vezes que optou por silêncio
  autonomousActionsCount: number;
}

const INITIATIVE_STORAGE_KEY = 'hub_initiative_memory_v1';

const DEFAULT_MEMORY: InitiativeMemoryState = {
  askedQuestions: {},
  areaIntroductions: {},
  lastInterventionTime: 0,
  silenceDecisionsCount: 0,
  autonomousActionsCount: 0,
};

export function getInitiativeMemory(): InitiativeMemoryState {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(INITIATIVE_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
      }
    }
  } catch (err) {
    console.warn('[InitiativeMemory] Falha ao ler memória de iniciativa:', err);
  }
  return { ...DEFAULT_MEMORY };
}

export function saveInitiativeMemory(state: InitiativeMemoryState): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(INITIATIVE_STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.error('[InitiativeMemory] Falha ao salvar memória de iniciativa:', err);
  }
}

/**
 * Registra que uma pergunta foi iniciada proativamente pelo assistente.
 */
export function recordProactiveQuestion(topicKey: string, questionText: string): void {
  const memory = getInitiativeMemory();
  const id = `q-${Date.now()}`;
  memory.askedQuestions[topicKey] = {
    id,
    topicKey,
    questionText,
    askedAt: Date.now(),
    answered: false,
  };
  memory.lastInterventionTime = Date.now();
  saveInitiativeMemory(memory);
}

/**
 * Registra a resposta do usuário a uma pergunta anterior.
 */
export function recordUserAnswerToQuestion(topicKey: string, answerText: string): void {
  const memory = getInitiativeMemory();
  if (memory.askedQuestions[topicKey]) {
    memory.askedQuestions[topicKey].answered = true;
    memory.askedQuestions[topicKey].answeredAt = Date.now();
    memory.askedQuestions[topicKey].userResponse = answerText;
    saveInitiativeMemory(memory);
  }
}

/**
 * Registra que uma área/rota do Hub já foi introduzida ao usuário.
 */
export function recordAreaIntroduction(route: string): void {
  const memory = getInitiativeMemory();
  memory.areaIntroductions[route] = Date.now();
  memory.lastInterventionTime = Date.now();
  saveInitiativeMemory(memory);
}

/**
 * Verifica se uma pergunta sobre um determinado tópico já foi feita recentemente.
 */
export function hasRecentlyAskedTopic(topicKey: string, cooldownMs = 1000 * 60 * 30): boolean {
  const memory = getInitiativeMemory();
  const record = memory.askedQuestions[topicKey];
  if (!record) return false;
  return Date.now() - record.askedAt < cooldownMs;
}

/**
 * Verifica se uma rota já foi introduzida.
 */
export function hasIntroducedArea(route: string): boolean {
  const memory = getInitiativeMemory();
  return Boolean(memory.areaIntroductions[route]);
}

/**
 * Registra uma decisão de silêncio (para métricas e auditoria de inteligência).
 */
export function recordSilenceDecision(): void {
  const memory = getInitiativeMemory();
  memory.silenceDecisionsCount = (memory.silenceDecisionsCount || 0) + 1;
  saveInitiativeMemory(memory);
}

/**
 * Registra uma execução autônoma bem-sucedida.
 */
export function recordAutonomousAction(): void {
  const memory = getInitiativeMemory();
  memory.autonomousActionsCount = (memory.autonomousActionsCount || 0) + 1;
  memory.lastInterventionTime = Date.now();
  saveInitiativeMemory(memory);
}
