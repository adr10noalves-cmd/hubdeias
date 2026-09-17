export interface OrchestratorSettings {
  geminiEnabled: boolean;
  groqEnabled: boolean;
  defaultProvider: 'GEMINI' | 'GROQ' | 'AUTO';
  geminiDefaultModel: 'gemini-2.5-pro' | 'gemini-2.5-flash';
  groqDefaultModel: 'openai/gpt-oss-120b' | 'openai/gpt-oss-20b' | 'qwen/qwen3.8-27b';
  level1Provider: 'GROQ' | 'GEMINI';
  level2Provider: 'GROQ' | 'GEMINI';
  level3Provider: 'GEMINI' | 'GROQ';
  level4Provider: 'GEMINI';
  fallbackEnabled: boolean;
  strictContextFiltering: boolean;
  maxMemoryTokens: number;
}

const STORAGE_KEY = 'hub_orchestrator_settings_v1';

export const DEFAULT_ORCHESTRATOR_SETTINGS: OrchestratorSettings = {
  geminiEnabled: true,
  groqEnabled: true,
  defaultProvider: 'AUTO',
  geminiDefaultModel: 'gemini-2.5-pro',
  groqDefaultModel: 'openai/gpt-oss-120b',
  level1Provider: 'GROQ',
  level2Provider: 'GROQ',
  level3Provider: 'GEMINI',
  level4Provider: 'GEMINI',
  fallbackEnabled: true,
  strictContextFiltering: true,
  maxMemoryTokens: 3500,
};

export function getOrchestratorSettings(): OrchestratorSettings {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_ORCHESTRATOR_SETTINGS, ...parsed };
      }
    }
  } catch (e) {
    // Silencioso em ambientes sem localStorage
  }
  return { ...DEFAULT_ORCHESTRATOR_SETTINGS };
}

export function saveOrchestratorSettings(settings: Partial<OrchestratorSettings>): OrchestratorSettings {
  const current = getOrchestratorSettings();
  const updated: OrchestratorSettings = { ...current, ...settings };
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error('[OrchestratorSettings] Erro ao salvar configurações:', e);
  }
  return updated;
}
