import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';
import { IdeaItem, ProjectLearningEntry } from '../../types';
import { registerProjectLearning } from '../../services/assistant/memoryManager';

interface ProjectLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: IdeaItem;
  onSaved?: () => void;
}

export const ProjectLearningModal: React.FC<ProjectLearningModalProps> = ({
  isOpen,
  onClose,
  idea,
  onSaved,
}) => {
  const [learned, setLearned] = useState('');
  const [workedWell, setWorkedWell] = useState('');
  const [didNotWork, setDidNotWork] = useState('');
  const [neededChanges, setNeededChanges] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learned.trim()) {
      alert('Por favor, informe o que foi aprendido.');
      return;
    }

    setSaving(true);
    try {
      await registerProjectLearning(idea, {
        projectId: idea.id,
        learned,
        workedWell,
        didNotWork,
        neededChanges,
        nextStep,
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      alert('Erro ao salvar aprendizado na memória do projeto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Registrar Aprendizado no Projeto
              </h2>
              <p className="text-xs text-slate-400">
                Alimente a memória estruturada de "{idea.title}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-slate-300">
          <div>
            <label className="font-bold text-slate-200 block mb-1">
              1. O que aprendemos com esta execução/etapa? *
            </label>
            <textarea
              value={learned}
              onChange={(e) => setLearned(e.target.value)}
              rows={2}
              required
              placeholder="Ex: A biblioteca X tem limitação de token para tabelas multifolhas..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-emerald-400 block mb-1">
                2. O que funcionou bem?
              </label>
              <textarea
                value={workedWell}
                onChange={(e) => setWorkedWell(e.target.value)}
                rows={2}
                placeholder="Ex: A extração via regex estruturado funcionou perfeitamente..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-rose-400 block mb-1">
                3. O que NÃO funcionou?
              </label>
              <textarea
                value={didNotWork}
                onChange={(e) => setDidNotWork(e.target.value)}
                rows={2}
                placeholder="Ex: Prompt genérico gerou alucinação de datas de laudos..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-amber-400 block mb-1">
              4. O que precisa ser alterado / refinado?
            </label>
            <textarea
              value={neededChanges}
              onChange={(e) => setNeededChanges(e.target.value)}
              rows={2}
              placeholder="Ex: Migrar a triagem preliminar para modelo Groq ultra-rápido..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-cyan-400 block mb-1">
              5. Qual é o próximo passo prático?
            </label>
            <input
              type="text"
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              placeholder="Ex: Implementar parser de tabelas e cruzar com NR-01..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-2"
            >
              {saving ? 'Gravando Memória...' : 'Salvar Aprendizado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
