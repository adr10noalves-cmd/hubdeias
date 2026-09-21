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
  BookOpen,
  GraduationCap,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import {
  ProjectHubItem,
  ProjectHubStatus,
  PROJECT_HUB_STATUSES,
  ProjectMessage,
  ProjectDecision,
  ProjectMission,
  ProjectSuggestion,
  RoadmapItem,
  IdeaItem,
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
import { ProjectStagePedagogyModal } from './ProjectStagePedagogyModal';
import { ProjectLearningModal } from './ProjectLearningModal';
import { RoadmapEditor } from './RoadmapEditor';
import { publishHubEvent } from '../../services/assistant/hubEventBus';

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
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>(project.roadmap || []);
  const [newHistoryText, setNewHistoryText] = useState('');

  // Modais pedagógicos e de aprendizado
  const [isPedagogyModalOpen, setIsPedagogyModalOpen] = useState(false);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);

  // Sub-abas de contexto na lateral (Roadmap, Histórico, Observações, IAs)
  const [contextTab, setContextTab] = useState<'roadmap' | 'historico' | 'observacoes' | 'ias'>('roadmap');

  // Controle de colapso da área de decisões quando não houver urgência
  const [isDecisionsExpanded, setIsDecisionsExpanded] = useState(true);

  // Workspace sub-states
  const [messages, setMessages] = useState<ProjectMessage[]>(() => getProjectMessages(project.id));
  const [decisions, setDecisions] = useState<ProjectDecision[]>(() => getProjectDecisions(project.id));
  const [missions, setMissions] = useState<ProjectMission[]>(() => getProjectMissions(project.id));
  const [suggestions, setSuggestions] = useState<ProjectSuggestion[]>(() => getProjectSuggestions(project.id));

  // Cálculo de decisões ativas
  const activeDecisionsCount = decisions.filter((d) => d.status === 'Ativa').length;

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
      name: name.trim(),
      description: description.trim(),
      objective: objective.trim(),
      status,
      currentStage: currentStage.trim(),
      nextAction: nextAction.trim(),
      progress: Number(progress),
      notes: notes.trim(),
      roadmap,
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    setIsEditing(false);
  };

  const handleUpdateRoadmap = (newRoadmap: RoadmapItem[]) => {
    setRoadmap(newRoadmap);
    const updated: ProjectHubItem = {
      ...project,
      roadmap: newRoadmap,
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);
    publishHubEvent('roadmap_updated', { project: updated, roadmap: newRoadmap });
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

    const updatedProject: ProjectHubItem = {
      ...project,
      history: [
        {
          id: `hist-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          description: `Debate com IA: "${userText.slice(0, 40)}..."`,
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
    publishHubEvent('decision_required', { project: updatedProject, decision });
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

    if (mission.status === 'Concluída') {
      publishHubEvent('mission_completed', { project: updatedProject, mission });
    } else {
      publishHubEvent('mission_created', { project: updatedProject, mission });
    }
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

  // Adaptador para o modal de aprendizagem oficial
  const ideaAdapter: IdeaItem = {
    id: project.id,
    title: project.name,
    description: project.description,
    objective: project.objective,
    category: 'Automação',
    problemSolved: project.expectedResult || project.description,
    targetAudience: 'Desenvolvedores e Usuários Estratégicos',
    stage: '5. Desenvolvimento',
    priority: 'Alta',
    status: 'Em Progresso',
    relatedTechnologies: project.aiTools || [],
    relatedIANames: project.aiTools || [],
    currentVersion: 'V1',
    observations: project.notes,
    nextSteps: project.nextAction,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };

  // Índice da fase atual do projeto
  const currentStatusIndex = PROJECT_HUB_STATUSES.indexOf(project.status);

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. TOPO UNIFICADO: NAVEGAÇÃO, IDENTIDADE & AÇÃO PEDAGÓGICA */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
        {/* Barra de Ações do Topo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all shadow-sm"
              title="Voltar aos Projetos"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeColor(
                    project.status
                  )}`}
                >
                  {project.status}
                </span>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Criado em {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {project.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap">
            {/* Botão Contextual: "Entender esta Etapa" */}
            <button
              onClick={() => setIsPedagogyModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 text-xs font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/20"
              title="Entender o significado pedagógico e técnico desta etapa"
            >
              <GraduationCap className="w-4 h-4 text-amber-400" />
              <span>Entender esta Etapa</span>
            </button>

            {/* Ação de Edição */}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveBasicInfo}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Salvar Alterações
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Projeto
              </button>
            )}
          </div>
        </div>

        {/* Formulário de Edição do Projeto (quando ativo) */}
        {isEditing ? (
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 animate-fadeIn">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Projeto</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Objetivo Central</label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm resize-none"
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
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectHubStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                >
                  {PROJECT_HUB_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
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
              <label className="block text-xs font-semibold text-slate-400 mb-1">Próxima Ação Sugerida</label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. O QUE ESTOU CONSTRUINDO? & ONDE ESTOU? (Exibição Estruturada) */
          /* ========================================================================= */
          <div className="space-y-5">
            {/* Bloco: O QUE ESTOU CONSTRUINDO? */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Target className="w-4 h-4" /> Objetivo do Projeto
              </div>
              <p className="text-white text-base sm:text-lg font-medium leading-relaxed">
                {project.objective}
              </p>
              {project.description && (
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed border-t border-slate-850 pt-2">
                  {project.description}
                </p>
              )}
            </div>

            {/* Bloco: ONDE ESTOU? (Jornada & Maturidade Real do Projeto) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/40 border border-slate-800/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Jornada de Maturidade
                  </span>
                  <span className="text-[11px] text-slate-400">
                    (Etapa {currentStatusIndex + 1} de {PROJECT_HUB_STATUSES.length})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium">Progresso Geral:</span>
                  <span className="font-bold text-cyan-400">{project.progress}%</span>
                </div>
              </div>

              {/* Trilho Visual dos 6 Estágios Oficiais */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {PROJECT_HUB_STATUSES.map((st, idx) => {
                  const isPast = idx < currentStatusIndex;
                  const isCurrent = idx === currentStatusIndex;

                  return (
                    <div
                      key={st}
                      className={`p-2 rounded-xl text-center flex flex-col justify-center items-center transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-600/30 border border-cyan-400/50 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30'
                          : isPast
                          ? 'bg-slate-950/60 border border-emerald-500/30 text-emerald-400 font-medium'
                          : 'bg-slate-950/40 border border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[10px]">
                        {isPast ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                        ) : null}
                        <span className="truncate">{st}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra de Progresso Suave */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              {/* Etapa Técnica Específica */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Etapa Atual:
                  </span>
                  <span className="text-white font-semibold text-xs sm:text-sm">
                    {project.currentStage}
                  </span>
                </div>
                <button
                  onClick={() => setIsPedagogyModalOpen(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 self-start sm:self-center transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  O que significa esta etapa?
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. O QUE PRECISO FAZER AGORA? (Próxima Ação com Destaque Central) */}
        {/* ========================================================================= */}
        <div className="pt-2">
          <ProjectNextActionWidget
            project={project}
            onUpdateNextAction={handleUpdateNextAction}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ÁREA DE ATENÇÃO: DECISÕES TÉCNICAS E ARQUITETURAIS */}
      {/* ========================================================================= */}
      {activeDecisionsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/50 uppercase tracking-wider">
                  Atenção Necessária
                </span>
                <span className="text-xs font-bold text-white">
                  {activeDecisionsCount} Decisão(ões) Ativa(s) Aguardando Validação
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Revise as escolhas arquiteturais para manter o executor e a equipe alinhados.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDecisionsExpanded(!isDecisionsExpanded)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 transition-all self-end sm:self-center shrink-0"
          >
            {isDecisionsExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Recolher Decisões
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Visualizar Decisões
              </>
            )}
          </button>
        </div>
      )}

      {/* Componente de Decisões */}
      {isDecisionsExpanded && (
        <ProjectDecisionsSection
          projectId={project.id}
          decisions={decisions}
          onSaveDecision={handleSaveDecision}
          onDeleteDecision={handleDeleteDecision}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. ÁREA PRINCIPAL DE TRABALHO & APOIO / CONTEXTO PROGRESSIVO */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal (2 Cols): Debate com Executor & Missões */}
        <div className="lg:col-span-2 space-y-6">
          {/* DEBATE COM A IA (Executor Central) */}
          <ProjectDebateChat
            project={project}
            messages={messages}
            onSendMessage={handleSendMessage}
            onAddDecision={handleSaveDecision}
          />

          {/* MISSÕES E TAREFAS EM EXECUÇÃO */}
          <ProjectMissionsSection
            projectId={project.id}
            missions={missions}
            onSaveMission={handleSaveMission}
            onDeleteMission={handleDeleteMission}
          />

          {/* 6. EVOLUÇÃO: OPORTUNIDADES E SUGESTÕES DA IA */}
          <ProjectSuggestionsSection
            projectId={project.id}
            suggestions={suggestions}
            onSaveSuggestion={handleSaveSuggestion}
            onDeleteSuggestion={handleDeleteSuggestion}
            onConvertToMission={handleConvertToMission}
          />
        </div>

        {/* Coluna Lateral de Apoio: Divulgação Progressiva em Abas */}
        <div className="space-y-6">
          {/* Card com Abas de Contexto */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Apoio & Contexto</span>
              </h3>
              <button
                onClick={() => setIsLearningModalOpen(true)}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                title="Registrar aprendizado formal da etapa"
              >
                <BookOpen className="w-3.5 h-3.5" /> + Aprendizado
              </button>
            </div>

            {/* Sub-Abas do Painel de Apoio */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setContextTab('roadmap')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  contextTab === 'roadmap'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Roadmap
              </button>
              <button
                type="button"
                onClick={() => setContextTab('historico')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  contextTab === 'historico'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Histórico
              </button>
              <button
                type="button"
                onClick={() => setContextTab('observacoes')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  contextTab === 'observacoes'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Notas
              </button>
              <button
                type="button"
                onClick={() => setContextTab('ias')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  contextTab === 'ias'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                IAs ({project.aiTools?.length || 0})
              </button>
            </div>

            {/* Conteúdo da Aba Selecionada */}
            <div className="pt-2 min-h-[320px]">
              {/* ABA 1: ROADMAP */}
              {contextTab === 'roadmap' && (
                <RoadmapEditor
                  items={roadmap}
                  onChange={handleUpdateRoadmap}
                />
              )}

              {/* ABA 2: HISTÓRICO / LINHA DO TEMPO */}
              {contextTab === 'historico' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Marcos registrados ({project.history.length})</span>
                  </div>

                  <form onSubmit={handleAddHistory} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newHistoryText}
                      onChange={(e) => setNewHistoryText(e.target.value)}
                      placeholder="Novo marco..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shrink-0 transition-all shadow-md"
                      title="Adicionar marco"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                    {project.history.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5"
                      >
                        <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-semibold text-cyan-300">
                              {item.author || 'Hub IA'}
                            </span>
                            <span>{item.date}</span>
                          </div>
                          <p className="text-white text-xs leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 3: OBSERVAÇÕES & NOTAS TÉCNICAS */}
              {contextTab === 'observacoes' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Diretrizes e Anotações Técnicas</span>
                  </div>

                  {isEditing ? (
                    <textarea
                      rows={10}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs resize-none focus:outline-none focus:border-cyan-500"
                      placeholder="Links, credenciais de desenvolvimento, decisões informais..."
                    />
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-xs whitespace-pre-wrap leading-relaxed min-h-[200px]">
                      {project.notes || 'Nenhuma observação registrada ainda.'}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 italic">
                    Clique em "Editar Projeto" no topo para alterar as observações.
                  </p>
                </div>
              )}

              {/* ABA 4: IAS UTILIZADAS */}
              {contextTab === 'ias' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    Modelos e Ferramentas Vinculados:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.aiTools && project.aiTools.length > 0 ? (
                      project.aiTools.map((tool, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" /> {tool}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        Nenhuma IA vinculada a este projeto.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. MODAIS PEDAGÓGICOS E MEMÓRIA DE APRENDIZADO */}
      {/* ========================================================================= */}
      <ProjectStagePedagogyModal
        isOpen={isPedagogyModalOpen}
        onClose={() => setIsPedagogyModalOpen(false)}
        project={project}
        onOpenLearningModal={() => setIsLearningModalOpen(true)}
      />

      <ProjectLearningModal
        isOpen={isLearningModalOpen}
        onClose={() => setIsLearningModalOpen(false)}
        idea={ideaAdapter}
        onSaved={() => {
          // Atualiza histórico localmente
          const updated: ProjectHubItem = {
            ...project,
            history: [
              {
                id: `hist-${Date.now()}`,
                date: new Date().toLocaleDateString(),
                description: 'Aprendizado formal registrado na memória do projeto.',
                author: 'Usuário',
              },
              ...project.history,
            ],
            updatedAt: new Date().toISOString(),
          };
          onUpdate(updated);
        }}
      />
    </div>
  );
};
