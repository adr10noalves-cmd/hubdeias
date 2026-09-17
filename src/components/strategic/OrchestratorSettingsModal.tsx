import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  Zap,
  Sliders,
  Check,
  Activity,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  getOrchestratorSettings,
  saveOrchestratorSettings,
  OrchestratorSettings,
} from '../../services/assistant/orchestratorConfig';

interface EngineDiagnosticInfo {
  provider: 'GEMINI' | 'GROQ';
  status: 'disponível' | 'configurando' | 'executando' | 'concluído' | 'erro' | 'indisponível';
  configured: boolean;
  model: string;
  availableModels: string[];
  latencyMs?: number;
  diagnostic: {
    state: string;
    message: string;
    probableCause?: string;
    variableName?: string;
  };
}

interface EngineTestResult {
  provider: 'GEMINI' | 'GROQ';
  status: 'concluído' | 'erro';
  testPassed: boolean;
  message: string;
  diagnostic: string;
  latencyMs: number;
  modelUsed?: string;
  rawSnippet?: string;
}

interface OrchestratorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrchestratorSettingsModal: React.FC<OrchestratorSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<OrchestratorSettings>(getOrchestratorSettings());
  const [saved, setSaved] = useState(false);

  // Estados de Diagnóstico em Tempo Real
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [geminiDiag, setGeminiDiag] = useState<EngineDiagnosticInfo | null>(null);
  const [groqDiag, setGroqDiag] = useState<EngineDiagnosticInfo | null>(null);

  // Estados de Teste Individual
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<EngineTestResult | null>(null);

  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState<EngineTestResult | null>(null);

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/orchestrator/status');
      if (res.ok) {
        const data = await res.json();
        if (data.engines) {
          setGeminiDiag(data.engines.GEMINI);
          setGroqDiag(data.engines.GROQ);
        }
      }
    } catch (e) {
      console.warn('[OrchestratorSettingsModal] Erro ao carregar diagnóstico:', e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setGeminiTestResult(null);
      setGroqTestResult(null);
    }
  }, [isOpen]);

  const handleTestEngine = async (engine: 'GEMINI' | 'GROQ') => {
    if (engine === 'GEMINI') {
      setTestingGemini(true);
      setGeminiTestResult(null);
    } else {
      setTestingGroq(true);
      setGroqTestResult(null);
    }

    try {
      const res = await fetch('/api/orchestrator/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine }),
      });
      const data: EngineTestResult = await res.json();

      if (engine === 'GEMINI') {
        setGeminiTestResult(data);
      } else {
        setGroqTestResult(data);
      }
    } catch (err: any) {
      const fallbackFail: EngineTestResult = {
        provider: engine,
        status: 'erro',
        testPassed: false,
        message: '✕ MOTOR COM ERRO',
        diagnostic: `Falha na requisição local: ${err?.message || 'Erro de rede'}`,
        latencyMs: 0,
      };
      if (engine === 'GEMINI') {
        setGeminiTestResult(fallbackFail);
      } else {
        setGroqTestResult(fallbackFail);
      }
    } finally {
      if (engine === 'GEMINI') {
        setTestingGemini(false);
      } else {
        setTestingGroq(false);
      }
      fetchStatus();
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    saveOrchestratorSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'disponível':
      case 'concluído':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px] uppercase">
            Disponível
          </span>
        );
      case 'configurando':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[10px] uppercase">
            Configurando
          </span>
        );
      case 'executando':
        return (
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-[10px] uppercase animate-pulse">
            Executando
          </span>
        );
      case 'indisponível':
        return (
          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600 font-semibold text-[10px] uppercase">
            Indisponível
          </span>
        );
      case 'erro':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-[10px] uppercase">
            Erro
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                Diagnóstico & Governança de IA
              </h3>
              <p className="text-slate-400 text-xs">
                Auditoria em tempo real, testes individuais e alternância Gemini / Groq
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchStatus}
              disabled={loadingStatus}
              title="Atualizar Diagnóstico"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
          {/* SEÇÃO 1: MOTOR PRINCIPAL GEMINI */}
          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-sm">MOTOR GEMINI (Principal)</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(testingGemini ? 'executando' : geminiDiag?.status)}
                <label className="relative inline-flex items-center cursor-pointer ml-1">
                  <input
                    type="checkbox"
                    checked={settings.geminiEnabled}
                    onChange={(e) => setSettings({ ...settings, geminiEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Motor analítico central para arquitetura de software, programação complexa, raciocínio lógico em etapas e evolução de projetos.
            </p>

            {/* Diagnóstico Técnico do Gemini */}
            {geminiDiag && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Status Operacional:</span>
                  <span className="text-slate-200">{geminiDiag.diagnostic.message}</span>
                </div>
                {geminiDiag.diagnostic.probableCause && (
                  <div className="text-amber-400/90 text-[10.5px]">
                    <strong>Causa provável:</strong> {geminiDiag.diagnostic.probableCause}
                  </div>
                )}
                {geminiDiag.diagnostic.variableName && (
                  <div className="text-slate-400 text-[10px]">
                    Variável requerida: <code className="text-cyan-400">{geminiDiag.diagnostic.variableName}</code>
                  </div>
                )}
              </div>
            )}

            {/* Teste Individual Gemini */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Modelo:</span>
                <select
                  value={settings.geminiDefaultModel}
                  onChange={(e) => setSettings({ ...settings, geminiDefaultModel: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Padrão Recomendado)</option>
                  <option value="gemini-flash-latest">Gemini Flash Latest</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultra-rápido)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                </select>
              </div>

              <button
                onClick={() => handleTestEngine('GEMINI')}
                disabled={testingGemini}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {testingGemini ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando Gemini...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> TESTAR GEMINI
                  </>
                )}
              </button>
            </div>

            {/* Resultado do Teste Gemini */}
            {geminiTestResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  geminiTestResult.testPassed
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    {geminiTestResult.testPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    {geminiTestResult.message}
                  </span>
                  {geminiTestResult.latencyMs > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {geminiTestResult.latencyMs}ms
                    </span>
                  )}
                </div>
                <div className="text-[11px] opacity-90">{geminiTestResult.diagnostic}</div>
              </div>
            )}
          </div>

          {/* SEÇÃO 2: MOTOR AUXILIAR GROQ */}
          <div className="p-4 rounded-xl bg-slate-850/80 border border-slate-750 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-sm">MOTOR GROQ (Auxiliar & Sandbox)</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(testingGroq ? 'executando' : groqDiag?.status)}
                <label className="relative inline-flex items-center cursor-pointer ml-1">
                  <input
                    type="checkbox"
                    checked={settings.groqEnabled}
                    onChange={(e) => setSettings({ ...settings, groqEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Motor de alta velocidade com hardware LPU para tarefas de triagem rápida, classificação, transformações e simulações em sandbox.
            </p>

            {/* Diagnóstico Técnico do Groq */}
            {groqDiag && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Status Operacional:</span>
                  <span className="text-slate-200">{groqDiag.diagnostic.message}</span>
                </div>
                {groqDiag.diagnostic.probableCause && (
                  <div className="text-amber-400/90 text-[10.5px]">
                    <strong>Causa provável:</strong> {groqDiag.diagnostic.probableCause}
                  </div>
                )}
                {groqDiag.diagnostic.variableName && (
                  <div className="text-slate-400 text-[10px]">
                    Variável requerida: <code className="text-amber-400">{groqDiag.diagnostic.variableName}</code>
                  </div>
                )}
              </div>
            )}

            {/* Teste Individual Groq */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Modelo:</span>
                <select
                  value={settings.groqDefaultModel}
                  onChange={(e) => setSettings({ ...settings, groqDefaultModel: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="openai/gpt-oss-120b">Groq GPT-OSS 120B (Padrão Recomendado)</option>
                  <option value="openai/gpt-oss-20b">Groq GPT-OSS 20B (Ultra-Rápido)</option>
                  <option value="qwen/qwen3.8-27b">Groq Qwen 3.8 27B</option>
                  <option value="llama-3.3-70b-versatile">Groq Llama 3.3 70B</option>
                </select>
              </div>

              <button
                onClick={() => handleTestEngine('GROQ')}
                disabled={testingGroq}
                className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {testingGroq ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando Groq...
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> TESTAR GROQ
                  </>
                )}
              </button>
            </div>

            {/* Resultado do Teste Groq */}
            {groqTestResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  groqTestResult.testPassed
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    {groqTestResult.testPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                    {groqTestResult.message}
                  </span>
                  {groqTestResult.latencyMs > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {groqTestResult.latencyMs}ms
                    </span>
                  )}
                </div>
                <div className="text-[11px] opacity-90">{groqTestResult.diagnostic}</div>
              </div>
            )}
          </div>

          {/* DIRETRIZES DE FALLBACK E SEGURANÇA */}
          <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-750 space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Resiliência & Governança
            </span>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">Fallback Automático Transparente</div>
                <div className="text-[11px] text-slate-400">
                  Se o Gemini falhar por limite ou cota, o Groq assume a tarefa automaticamente sem interrupções.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.fallbackEnabled}
                onChange={(e) => setSettings({ ...settings, fallbackEnabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/50 flex items-start gap-2 text-[11px] text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Segurança das Credenciais:</strong> As chamadas à API são intermediadas exclusivamente pelo backend server-side. As variáveis <code className="text-cyan-300">GEMINI_API_KEY</code> e <code className="text-amber-300">GROQ_API_KEY</code> nunca são expostas ao cliente ou ao console.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" /> Salvo!
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
