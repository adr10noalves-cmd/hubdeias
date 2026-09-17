import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Edit3,
  Layers,
  Plus,
  Sparkles,
  Target,
  FileText,
  Activity,
} from 'lucide-react';
import { ProjectHubItem, ProjectHubStatus, PROJECT_HUB_STATUSES } from '../../types';

interface ProjectDetailViewProps {
  project: ProjectHubItem;
  onBack: () => void;
  onUpdate: (updated: ProjectHubItem) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [objective, setObjective] = useState(project.objective);
  const [status, setStatus] = useState<ProjectHubStatus>(project.status);
  const [currentStage, setCurrentStage] = useState(project.currentStage);
  const [nextAction, setNextAction] = useState(project.nextAction);
  const [progress, setProgress] = useState(project.progress);
  const [notes, setNotes] = useState(project.notes);
  const [newHistoryText, setNewHistoryText] = useState('');

  const getStatusBadgeColor = (st: ProjectHubStatus) => {
    switch (st) {
      case 'Ideia':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/50';
      case 'Planejamento':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/50';
      case 'Em desenvolvimento':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50';
      case 'Em teste':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/50';
      case 'Concluído':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50';
      case 'Em evolução':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleSaveBasicInfo = () => {
    const updated: ProjectHubItem = {
      ...project,
      name,
      description,
      objective,
      status,
      currentStage,
      nextAction,
      progress: Number(progress),
      notes,
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setIsEditing(false);
  };

  const handleAddHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHistoryText.trim()) return;

    const newHistoryItem = {
      id: `hist-${Date.now()}`,
      date: new Date().toLocaleDateString(),
      description: newHistoryText.trim(),
      author: 'Usuário',
    };

    const updated: ProjectHubItem = {
      ...project,
      history: [newHistoryItem, ...project.history],
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setNewHistoryText('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Voltar para Meus Projetos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeColor(project.status)}`}>
                {project.status}
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Criado em {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              {project.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSaveBasicInfo}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-4 h-4" /> Salvar Alterações
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all"
            >
              <Edit3 className="w-4 h-4 text-cyan-400" /> Editar Projeto
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Principal de Resumo */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-5">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Projeto</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Objetivo</label>
                  <textarea
                    rows={2}
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectHubStatus)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                    >
                      {PROJECT_HUB_STATUSES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Progresso ({progress}%)</label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="w-full accent-cyan-500 mt-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Etapa Atual</label>
                  <input
                    type="text"
                    value={currentStage}
                    onChange={(e) => setCurrentStage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Próxima Ação</label>
                  <input
                    type="text"
                    value={nextAction}
                    onChange={(e) => setNextAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Target className="w-4 h-4" /> Objetivo do Projeto
                  </div>
                  <p className="text-white text-sm sm:text-base font-medium leading-relaxed bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                    {project.objective}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed pt-1">
                    {project.description}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" /> Progresso Geral
                    </span>
                    <span className="text-cyan-400 font-bold text-sm">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Etapa e Próxima Ação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Etapa Atual</div>
                    <div className="text-white font-medium text-xs sm:text-sm">{project.currentStage}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <div className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Próxima Ação
                    </div>
                    <div className="text-white font-medium text-xs sm:text-sm">{project.nextAction}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Linha do Tempo / Histórico de Evolução */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Histórico de Evolução (Linha do Tempo)
              </h3>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                {project.history.length} registros
              </span>
            </div>

            {/* Adicionar novo registro ao histórico */}
            <form onSubmit={handleAddHistory} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newHistoryText}
                onChange={(e) => setNewHistoryText(e.target.value)}
                placeholder="Adicionar nota ao histórico de evolução..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1 shrink-0 transition-all shadow-md shadow-cyan-600/20"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </form>

            <div className="space-y-3 pt-3">
              {project.history.map((item, idx) => (
                <div key={item.id || idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-cyan-300">{item.author || 'Hub IA'}</span>
                      <span>{item.date}</span>
                    </div>
                    <p className="text-white text-xs sm:text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: IA Tools & Observations / Notes */}
        <div className="space-y-6">
          {/* IAs Utilizadas */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" /> IA(s) Utilizadas
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {project.aiTools && project.aiTools.length > 0 ? (
                project.aiTools.map((tool, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" /> {tool}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">Nenhuma IA vinculada ainda</span>
              )}
            </div>
          </div>

          {/* Observações / Área de Registro */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Observações & Registro
            </h3>
            {isEditing ? (
              <textarea
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs sm:text-sm resize-none focus:outline-none focus:border-cyan-500"
                placeholder="Anotações importantes sobre o projeto..."
              />
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed min-h-[120px]">
                {project.notes || 'Nenhuma observação registrada.'}
              </div>
            )}
            <p className="text-[11px] text-slate-500 italic">
              Use esta área para salvar links, lembretes e diretrizes técnicas do projeto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
