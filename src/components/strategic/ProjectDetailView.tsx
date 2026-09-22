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
  Code2,
  Bug,
  Tag,
  FileCheck,
  Bot,
} from 'lucide-react';
import {
  ProjectHubItem,
  ProjectHubStatus,
  PROJECT_HUB_STATUSES,
  ProjectMessage,
  ProjectDecision,
  ProjectMission,
  ProjectSuggestion,
  ProjectDeliverable,
  ProjectTest,
  ProjectVersion,
  ProjectPedagogicalExplanation,
  ProjectRequirements,
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
  getProjectDeliverables,
  saveProjectDeliverable,
  deleteProjectDeliverable,
  getProjectTests,
  saveProjectTest,
  deleteProjectTest,
  getProjectVersions,
  saveProjectVersion,
  deleteProjectVersion,
  getProjectPedagogies,
  saveProjectPedagogy,
  deleteProjectPedagogy,
  getProjectRequirements,
  saveProjectRequirements,
  getCompleteProjectState,
} from '../../services/projectsService';
import { ProjectDebateChat } from './ProjectDebateChat';
import { ProjectDecisionsSection } from './ProjectDecisionsSection';
import { ProjectMissionsSection } from './ProjectMissionsSection';
import { ProjectSuggestionsSection } from './ProjectSuggestionsSection';
import { ProjectNextActionWidget } from './ProjectNextActionWidget';
import { ProjectStagePedagogyModal } from './ProjectStagePedagogyModal';
import { ProjectLearningModal } from './ProjectLearningModal';
import { RoadmapEditor } from './RoadmapEditor';
import { ProjectDeliverablesSection } from './ProjectDeliverablesSection';
import { ProjectTestsSection } from './ProjectTestsSection';
import { ProjectVersionsSection } from './ProjectVersionsSection';
import { ProjectPedagogySection } from './ProjectPedagogySection';
import { ProjectRequirementsSection } from './ProjectRequirementsSection';
import { ProjectMaturityJourney } from './ProjectMaturityJourney';
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

  // Aba principal de navegação do projeto
  const [mainTab, setMainTab] = useState<
    'agente' | 'requisitos' | 'decisoes' | 'entregaveis' | 'testes' | 'versoes' | 'licoes'
  >('agente');

  // Sub-abas de contexto na lateral (Roadmap, Histórico, Observações, IAs)
  const [contextTab, setContextTab] = useState<'roadmap' | 'historico' | 'observacoes' | 'ias'>('roadmap');

  // Workspace sub-states
  const [messages, setMessages] = useState<ProjectMessage[]>(() => getProjectMessages(project.id));
  const [decisions, setDecisions] = useState<ProjectDecision[]>(() => getProjectDecisions(project.id));
  const [missions, setMissions] = useState<ProjectMission[]>(() => getProjectMissions(project.id));
  const [suggestions, setSuggestions] = useState<ProjectSuggestion[]>(() => getProjectSuggestions(project.id));
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>(() => getProjectDeliverables(project.id));
  const [tests, setTests] = useState<ProjectTest[]>(() => getProjectTests(project.id));
  const [versions, setVersions] = useState<ProjectVersion[]>(() => getProjectVersions(project.id));
  const [pedagogies, setPedagogies] = useState<ProjectPedagogicalExplanation[]>(() => getProjectPedagogies(project.id));
  const [requirements, setRequirements] = useState<ProjectRequirements>(() => getProjectRequirements(project.id));

  // Recarregar tudo quando houver ação de ferramenta disparada
  const refreshAllState = () => {
    setMessages(getProjectMessages(project.id));
    setDecisions(getProjectDecisions(project.id));
    setMissions(getProjectMissions(project.id));
    setSuggestions(getProjectSuggestions(project.id));
    setDeliverables(getProjectDeliverables(project.id));
    setTests(getProjectTests(project.id));
    setVersions(getProjectVersions(project.id));
    setPedagogies(getProjectPedagogies(project.id));
    setRequirements(getProjectRequirements(project.id));
  };

  const completeState = getCompleteProjectState(project.id);

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
          description: `Decisão [${decision.status}]: "${decision.decision}"`,
          author: 'Equipe & IA',
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

  // Deliverable Handlers
  const handleSaveDeliverable = (item: ProjectDeliverable) => {
    const updated = saveProjectDeliverable(item);
    setDeliverables(updated);
  };

  const handleDeleteDeliverable = (id: string) => {
    const updated = deleteProjectDeliverable(id, project.id);
    setDeliverables(updated);
  };

  // Test Handlers
  const handleSaveTest = (item: ProjectTest) => {
    const updated = saveProjectTest(item);
    setTests(updated);
  };

  const handleDeleteTest = (id: string) => {
    const updated = deleteProjectTest(id, project.id);
    setTests(updated);
  };

  // Version Handlers
  const handleSaveVersion = (item: ProjectVersion) => {
    const updated = saveProjectVersion(item);
    setVersions(updated);
  };

  const handleDeleteVersion = (id: string) => {
    const updated = deleteProjectVersion(id, project.id);
    setVersions(updated);
  };

  // Pedagogy Handlers
  const handleSavePedagogy = (item: ProjectPedagogicalExplanation) => {
    const updated = saveProjectPedagogy(item);
    setPedagogies(updated);
  };

  const handleDeletePedagogy = (id: string) => {
    const updated = deleteProjectPedagogy(id, project.id);
    setPedagogies(updated);
  };

  // Requirements Handlers
  const handleSaveRequirements = (reqs: ProjectRequirements) => {
    const updated = saveProjectRequirements(project.id, reqs);
    setRequirements(updated);
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

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. TOPO UNIFICADO: NAVEGAÇÃO, IDENTIDADE & AÇÃO PEDAGÓGICA */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
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
        {isEditing && (
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
        )}

        {/* 2. JORNADA DE MATURIDADE & ACOMPANHAMENTO DO CICLO PERMANENTE */}
        <ProjectMaturityJourney
          project={project}
          completeState={completeState}
          onNavigateTab={(tab) => setMainTab(tab as any)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. MENU DE NAVEGAÇÃO DE ABAS DO PROJETO INTEGRADO */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-none shadow-lg">
        <button
          onClick={() => setMainTab('agente')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            mainTab === 'agente'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Central do Agente</span>
        </button>

        <button
          onClick={() => setMainTab('requisitos')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            mainTab === 'requisitos'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileCheck className="w-4 h-4 text-cyan-400" />
          <span>Matriz de Requisitos</span>
        </button>

        <button
          onClick={() => setMainTab('decisoes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            mainTab === 'decisoes'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Decisões ({decisions.length})</span>
        </button>

        <button
          onClick={() => setMainTab('entregaveis')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            mainTab === 'entregaveis'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Code2 className="w-4 h-4 text-emerald-400" />
          <span>Entregáveis & Código ({deliverables.length})</span>
        </button>

        <button
          onClick={() => setMainTab('testes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            mainTab === 'testes'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bug className="w-4 h-4 text-purple-400" />
          <span>Testes & Qualidade ({tests.length})</span>
        </button>

        <button
          onClick={() => setMainTab('versoes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            mainTab === 'versoes'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Tag className="w-4 h-4 text-blue-400" />
          <span>Versões & Deploy ({versions.length})</span>
        </button>

        <button
          onClick={() => setMainTab('licoes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            mainTab === 'licoes'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>Aulas do Professor ({pedagogies.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. ÁREA PRINCIPAL DE TRABALHO & APOIO LATERAL PROGRESSIVO */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal (2 Cols): Conteúdo da Aba Ativa */}
        <div className="lg:col-span-2 space-y-6">
          {/* ABA 1: CENTRAL DO AGENTE (DEBATE + MISSÕES + SUGESTÕES) */}
          {mainTab === 'agente' && (
            <>
              <ProjectDebateChat
                project={project}
                messages={messages}
                completeState={completeState}
                onSendMessage={handleSendMessage}
                onAddDecision={handleSaveDecision}
                onStateChanged={refreshAllState}
              />

              <ProjectMissionsSection
                projectId={project.id}
                missions={missions}
                onSaveMission={handleSaveMission}
                onDeleteMission={handleDeleteMission}
              />

              <ProjectSuggestionsSection
                projectId={project.id}
                suggestions={suggestions}
                onSaveSuggestion={handleSaveSuggestion}
                onDeleteSuggestion={handleDeleteSuggestion}
                onConvertToMission={handleConvertToMission}
              />
            </>
          )}

          {/* ABA 2: MATRIZ DE REQUISITOS (4 PILARES) */}
          {mainTab === 'requisitos' && (
            <ProjectRequirementsSection
              projectId={project.id}
              requirements={requirements}
              onSaveRequirements={handleSaveRequirements}
            />
          )}

          {/* ABA 3: DECISÕES ARQUITETURAIS */}
          {mainTab === 'decisoes' && (
            <ProjectDecisionsSection
              projectId={project.id}
              decisions={decisions}
              onSaveDecision={handleSaveDecision}
              onDeleteDecision={handleDeleteDecision}
            />
          )}

          {/* ABA 4: ENTREGÁVEIS & CÓDIGO */}
          {mainTab === 'entregaveis' && (
            <ProjectDeliverablesSection
              projectId={project.id}
              deliverables={deliverables}
              onSaveDeliverable={handleSaveDeliverable}
              onDeleteDeliverable={handleDeleteDeliverable}
            />
          )}

          {/* ABA 5: TESTES & QUALIDADE */}
          {mainTab === 'testes' && (
            <ProjectTestsSection
              projectId={project.id}
              tests={tests}
              onSaveTest={handleSaveTest}
              onDeleteTest={handleDeleteTest}
            />
          )}

          {/* ABA 6: VERSÕES & RELEASES */}
          {mainTab === 'versoes' && (
            <ProjectVersionsSection
              projectId={project.id}
              versions={versions}
              onSaveVersion={handleSaveVersion}
              onDeleteVersion={handleDeleteVersion}
            />
          )}

          {/* ABA 7: AULAS DO PROFESSOR */}
          {mainTab === 'licoes' && (
            <ProjectPedagogySection
              projectId={project.id}
              pedagogies={pedagogies}
              onSavePedagogy={handleSavePedagogy}
              onDeletePedagogy={handleDeletePedagogy}
              onRequestExplanation={() => setIsPedagogyModalOpen(true)}
            />
          )}
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
      {/* 5. MODAIS PEDAGÓGICOS E MEMÓRIA DE APRENDIZADO */}
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
