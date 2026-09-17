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
  MessageSquare,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react';
import {
  ProjectHubItem,
  ProjectHubStatus,
  PROJECT_HUB_STATUSES,
  ProjectMessage,
  ProjectDecision,
  ProjectMission,
  ProjectSuggestion,
} from '../../types';
import {
  getProjectMessages,
  saveProjectMessage,
  getProjectDecisions,
  saveProjectDecision,
  deleteProjectDecision,
  getProjectMissions,
  saveProjectMission,
  deleteProjectMission,
  getProjectSuggestions,
  saveProjectSuggestion,
  deleteProjectSuggestion,
} from '../../services/projectsService';
import { ProjectDebateChat } from './ProjectDebateChat';
import { ProjectDecisionsSection } from './ProjectDecisionsSection';
import { ProjectMissionsSection } from './ProjectMissionsSection';
import { ProjectSuggestionsSection } from './ProjectSuggestionsSection';
import { ProjectNextActionWidget } from './ProjectNextActionWidget';

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

  // Workspace sub-states
  const [messages, setMessages] = useState<ProjectMessage[]>(() => getProjectMessages(project.id));
  const [decisions, setDecisions] = useState<ProjectDecision[]>(() => getProjectDecisions(project.id));
  const [missions, setMissions] = useState<ProjectMission[]>(() => getProjectMissions(project.id));
  const [suggestions, setSuggestions] = useState<ProjectSuggestion[]>(() => getProjectSuggestions(project.id));

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

  // Message Handlers
  const handleSendMessage = (userText: string, aiResponseText: string) => {
    const userMsg: ProjectMessage = {
      id: `msg-${Date.now()}-u`,
      projectId: project.id,
      sender: 'user',
      text: userText,
      createdAt: new Date().toISOString(),
    };
    const aiMsg: ProjectMessage = {
      id: `msg-${Date.now()}-ai`,
      projectId: project.id,
      sender: 'ai',
      text: aiResponseText,
      createdAt: new Date(Date.now() + 500).toISOString(),
      aiModel: 'Gemini 2.5 Pro',
    };

    saveProjectMessage(userMsg);
    const updatedMsgs = saveProjectMessage(aiMsg);
    setMessages(updatedMsgs);

    // Add history log
    const updatedProject: ProjectHubItem = {
      ...project,
      history: [
        {
          id: `hist-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          description: `Debate com IA realizado: "${userText.slice(0, 40)}..."`,
          author: 'Hub IA',
        },
        ...project.history,
      ],
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updatedProject);
  };

  // Decision Handlers
  const handleSaveDecision = (decision: ProjectDecision) => {
    const updated = saveProjectDecision(decision);
    setDecisions(updated);

    const updatedProject: ProjectHubItem = {
      ...project,
      history: [
        {
          id: `hist-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          description: `Decisão registrada: "${decision.decision}"`,
          author: 'Equipe',
        },
        ...project.history,
      ],
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updatedProject);
  };

  const handleDeleteDecision = (id: string) => {
    const updated = deleteProjectDecision(id, project.id);
    setDecisions(updated);
  };

  // Mission Handlers
  const handleSaveMission = (mission: ProjectMission) => {
    const updated = saveProjectMission(mission);
    setMissions(updated);

    const updatedProject: ProjectHubItem = {
      ...project,
      history: [
        {
          id: `hist-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          description: `Missão atualizada/criada: "${mission.title}" (${mission.status})`,
          author: 'Equipe',
        },
        ...project.history,
      ],
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updatedProject);
  };

  const handleDeleteMission = (id: string) => {
    const updated = deleteProjectMission(id, project.id);
    setMissions(updated);
  };

  // Suggestion Handlers
  const handleSaveSuggestion = (suggestion: ProjectSuggestion) => {
    const updated = saveProjectSuggestion(suggestion);
    setSuggestions(updated);
  };

  const handleDeleteSuggestion = (id: string) => {
    const updated = deleteProjectSuggestion(id, project.id);
    setSuggestions(updated);
  };

  const handleConvertToMission = (suggestion: ProjectSuggestion) => {
    const newMission: ProjectMission = {
      id: `mission-${Date.now()}`,
      projectId: project.id,
      title: suggestion.title,
      description: suggestion.description,
      status: 'Pendente',
      priority: 'Alta',
      createdAt: new Date().toLocaleDateString(),
      notes: `Convertido a partir da Sugestão da IA (${suggestion.category})`,
    };
    handleSaveMission(newMission);
    handleSaveSuggestion({ ...suggestion, status: 'Adicionada' });
  };

  const handleUpdateNextAction = (newNextAction: string) => {
    setNextAction(newNextAction);
    const updated: ProjectHubItem = {
      ...project,
      nextAction: newNextAction,
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
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

      {/* PRÓXIMA AÇÃO WIDGET */}
      <ProjectNextActionWidget
        project={project}
        onUpdateNextAction={handleUpdateNextAction}
      />

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Debate, Missions, Decisions, Suggestions */}
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

                {/* Etapa Atual */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Etapa Atual</div>
                  <div className="text-white font-medium text-xs sm:text-sm">{project.currentStage}</div>
                </div>
              </>
            )}
          </div>

          {/* DEBATE COM A IA */}
          <ProjectDebateChat
            project={project}
            messages={messages}
            onSendMessage={handleSendMessage}
            onAddDecision={handleSaveDecision}
          />

          {/* MISSÕES */}
          <ProjectMissionsSection
            projectId={project.id}
            missions={missions}
            onSaveMission={handleSaveMission}
            onDeleteMission={handleDeleteMission}
          />

          {/* DECISÕES */}
          <ProjectDecisionsSection
            projectId={project.id}
            decisions={decisions}
            onSaveDecision={handleSaveDecision}
            onDeleteDecision={handleDeleteDecision}
          />

          {/* IDEIAS DE EVOLUÇÃO */}
          <ProjectSuggestionsSection
            projectId={project.id}
            suggestions={suggestions}
            onSaveSuggestion={handleSaveSuggestion}
            onDeleteSuggestion={handleDeleteSuggestion}
            onConvertToMission={handleConvertToMission}
          />
        </div>

        {/* Right Col: Timeline History, IA Tools & Observations / Notes */}
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

          {/* Linha do Tempo / Histórico de Evolução */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Histórico (Linha do Tempo)
              </h3>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                {project.history.length}
              </span>
            </div>

            <form onSubmit={handleAddHistory} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newHistoryText}
                onChange={(e) => setNewHistoryText(e.target.value)}
                placeholder="Novo marco..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shrink-0 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-3 pt-2 max-h-[400px] overflow-y-auto scrollbar-thin">
              {project.history.map((item, idx) => (
                <div key={item.id || idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-cyan-300">{item.author || 'Hub IA'}</span>
                      <span>{item.date}</span>
                    </div>
                    <p className="text-white text-xs leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
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
              Use esta área para salvar links, lembretes e diretrizes técnicas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
