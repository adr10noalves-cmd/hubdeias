import React, { useState } from 'react';
import { RoadmapItem } from '../../types';
import { Plus, Trash2, CheckCircle2, Clock, Circle, ArrowRight } from 'lucide-react';

interface RoadmapEditorProps {
  items: RoadmapItem[];
  onChange: (items: RoadmapItem[]) => void;
  disabled?: boolean;
}

const STAGE_PRESETS = ['Atual', 'Próxima Evolução', 'Depois', 'Futuro'];

export const RoadmapEditor: React.FC<RoadmapEditorProps> = ({ items, onChange, disabled }) => {
  const [newStageTitle, setNewStageTitle] = useState('Próxima Evolução');
  const [newGoal, setNewGoal] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;

    const newItem: RoadmapItem = {
      id: `rm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      stageTitle: newStageTitle,
      goal: newGoal.trim(),
      status: 'Pendente',
    };

    onChange([...items, newItem]);
    setNewGoal('');
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const nextStatus =
          item.status === 'Pendente'
            ? 'Em Andamento'
            : item.status === 'Em Andamento'
            ? 'Concluído'
            : 'Pendente';
        return { ...item, status: nextStatus };
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <span>🗺️ Roadmap de Evolução</span>
          <span className="text-xs font-normal text-slate-400">({items.length} etapas)</span>
        </h4>
      </div>

      {/* Lista de etapas */}
      {items.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-800 text-center text-xs text-slate-400">
          Nenhuma etapa de evolução definida ainda. Adicione marcos abaixo ou peça ao Assistente de IA para gerar um roadmap estratégico.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item, index) => {
            const isCompleted = item.status === 'Concluído';
            const isProgress = item.status === 'Em Andamento';

            return (
              <div
                key={item.id}
                className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                    : isProgress
                    ? 'bg-cyan-950/25 border-cyan-500/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleToggleStatus(item.id)}
                    className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors"
                    title={`Status: ${item.status}. Clique para alterar.`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isProgress ? (
                      <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                        {item.stageTitle}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isProgress
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className={`text-xs sm:text-sm ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                      {item.goal}
                    </p>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remover etapa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Adicionar nova etapa */}
      {!disabled && (
        <form onSubmit={handleAddItem} className="pt-2 flex flex-col sm:flex-row gap-2">
          <select
            value={newStageTitle}
            onChange={(e) => setNewStageTitle(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {STAGE_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Descreva a meta ou entregável desta etapa..."
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </form>
      )}
    </div>
  );
};
