import React, { useState } from 'react';
import { ArrowRight, Check, Edit3, X, Sparkles } from 'lucide-react';
import { ProjectHubItem } from '../../types';

interface ProjectNextActionWidgetProps {
  project: ProjectHubItem;
  onUpdateNextAction: (newNextAction: string) => void;
}

export const ProjectNextActionWidget: React.FC<ProjectNextActionWidgetProps> = ({
  project,
  onUpdateNextAction,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [actionText, setActionText] = useState(project.nextAction);

  const handleAccept = () => {
    // Mantém ou confirma a próxima ação sugerida
    setIsEditing(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionText.trim()) return;
    onUpdateNextAction(actionText.trim());
    setIsEditing(false);
  };

  const handleIgnore = () => {
    onUpdateNextAction('Nenhuma ação pendente no momento.');
    setActionText('Nenhuma ação pendente no momento.');
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase tracking-wider">
              Próxima Ação Sugerida pela IA
            </span>
          </div>
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                className="bg-slate-950 border border-cyan-500/50 rounded-xl px-3 py-1.5 text-white text-xs sm:text-sm w-full sm:w-80 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shrink-0"
              >
                Salvar
              </button>
            </form>
          ) : (
            <p className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" /> {project.nextAction}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={handleAccept}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
          title="Aceitar sugestão"
        >
          <Check className="w-3.5 h-3.5" /> [ACEITAR]
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          title="Editar sugestão"
        >
          <Edit3 className="w-3.5 h-3.5" /> [EDITAR]
        </button>
        <button
          onClick={handleIgnore}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-medium transition-all"
          title="Ignorar sugestão"
        >
          [IGNORAR]
        </button>
      </div>
    </div>
  );
};
