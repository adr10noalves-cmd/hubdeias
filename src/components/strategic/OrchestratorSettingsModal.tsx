import React, { useState } from 'react';
import { X, Cpu, ShieldCheck, Sparkles, Zap, Sliders, Check } from 'lucide-react';
import {
  getOrchestratorSettings,
  saveOrchestratorSettings,
  OrchestratorSettings,
} from '../../services/assistant/orchestratorConfig';

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

  if (!isOpen) return null;

  const handleSave = () => {
    saveOrchestratorSettings(settings);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                Configuração da Orquestração de IA
              </h3>
              <p className="text-slate-400 text-xs">
                Governança entre Modelo Principal (Gemini) e Auxiliar (Groq)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-300">
          {/* Card Provedor Principal: Gemini */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-sm">Gemini (Modelo Principal)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.geminiEnabled}
                  onChange={(e) => setSettings({ ...settings, geminiEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Designado para tarefas de Nível 3 e Nível 4: arquitetura de software, programação complexa, raciocínio lógico em etapas e evolução histórica de projetos.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Versão padrão:</span>
              <select
                value={settings.geminiDefaultModel}
                onChange={(e) => setSettings({ ...settings, geminiDefaultModel: e.target.value as any })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
              >
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Raciocínio Máximo)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Alta Agilidade)</option>
              </select>
            </div>
          </div>

          {/* Card Provedor Auxiliar: Groq */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-white text-sm">Groq (Modelo Auxiliar)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.groqEnabled}
                  onChange={(e) => setSettings({ ...settings, groqEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Motor de alta velocidade sem custo para Nível 1 e 2: simulações isoladas, transformações de texto, triagem rápida e classificação.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Versão padrão:</span>
              <select
                value={settings.groqDefaultModel}
                onChange={(e) => setSettings({ ...settings, groqDefaultModel: e.target.value as any })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs"
              >
                <option value="openai/gpt-oss-120b">Groq GPT-OSS 120B</option>
                <option value="openai/gpt-oss-20b">Groq GPT-OSS 20B (Ultra-Rápido)</option>
                <option value="qwen/qwen3.8-27b">Groq Qwen 3.8 27B</option>
              </select>
            </div>
          </div>

          {/* Políticas de Fallback e Contexto */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
            <span className="font-bold text-white text-xs uppercase tracking-wider text-slate-400">
              Diretrizes do Orquestrador
            </span>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-200">Fallback Automático Transparente</div>
                <div className="text-[11px] text-slate-400">
                  Se o modelo primário oscilar, aciona o provedor alternativo sem interromper a operação.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.fallbackEnabled}
                onChange={(e) => setSettings({ ...settings, fallbackEnabled: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-2.5">
              <div>
                <div className="font-medium text-slate-200">Filtragem Cirúrgica de Memória</div>
                <div className="text-[11px] text-slate-400">
                  Recupera apenas nós pertinentes da memória persistente, sem poluição de contexto.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.strictContextFiltering}
                onChange={(e) => setSettings({ ...settings, strictContextFiltering: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/50 flex items-start gap-2 text-[11px] text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Segurança Ativa:</strong> As chaves de API permanecem estritamente seguras no backend do servidor. Nenhuma credencial confidencial é exposta no navegador.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
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
