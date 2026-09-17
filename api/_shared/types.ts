export type EngineStatus =
  | 'disponível'
  | 'configurando'
  | 'executando'
  | 'concluído'
  | 'erro'
  | 'indisponível';

export type EngineProvider = 'GEMINI' | 'GROQ' | 'AUTO' | 'SYSTEM-FALLBACK';

export interface EngineDiagnostic {
  provider: 'GEMINI' | 'GROQ';
  status: EngineStatus;
  configured: boolean;
  httpStatus?: number;
  message: string;
  probableCause?: string;
  models: string[];
  defaultModel: string;
  lastTested?: string;
}

export interface EngineTestResult {
  provider: 'GEMINI' | 'GROQ';
  status: EngineStatus;
  testPassed: boolean;
  message: string; // '✓ MOTOR FUNCIONAL' | '✕ MOTOR COM ERRO'
  responseSnippet?: string;
  modelUsed?: string;
  latencyMs: number;
  httpStatus?: number;
  diagnostic: string;
  probableCause?: string;
}

export interface NormalizedAIResponse {
  success: boolean;
  data: any;
  text?: string;
  providerUsed: 'GEMINI' | 'GROQ' | 'SYSTEM-FALLBACK';
  modelUsed: string;
  status: EngineStatus;
  fallbackTriggered: boolean;
  primaryError?: string;
  diagnostic?: {
    httpStatus?: number;
    message: string;
    probableCause?: string;
  };
  latencyMs: number;
}

export interface OrchestrationRequest {
  provider?: 'GEMINI' | 'GROQ' | 'AUTO';
  modelId?: string;
  systemPrompt?: string;
  userPrompt: string;
  complexityLevel?: number;
  activeMode?: string;
  allowFallback?: boolean;
  jsonMode?: boolean;
}
