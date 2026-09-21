import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  RefreshCw, 
  Cpu, 
  Database,
  FlaskConical,
  ListOrdered,
  TrendingUp,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Sliders,
  Zap,
  Compass,
  PlusCircle,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { 
  IAItem, 
  IdeaItem, 
  StudyItem, 
  EvolutionLog, 
  AssistantMode,
  TaskPlan,
  ProjectHubItem,
  ProjectMission,
  UserRole,
  UserAdaptiveProfile,
  AIExperienceLevel,
  InitiativeDecisionType,
} from '../types';
import { 
  processAssistantMessage, 
  AssistantEngineResponse 
} from '../services/assistant/assistantEngine';
import { getUserAdaptiveProfile, saveUserAdaptiveProfile } from '../services/authService';
import { AssistantMemoryModal } from './strategic/AssistantMemoryModal';
import { ProjectLearningModal } from './strategic/ProjectLearningModal';
import { OrchestratorSettingsModal } from './strategic/OrchestratorSettingsModal';
import { MainHubView } from './strategic/StrategicNavTabs';
import { subscribeHubEvent, publishHubEvent, HubEvent } from '../services/assistant/hubEventBus';
import { evaluateInitiative } from '../services/assistant/initiativeEngine';
import { recordUserAnswerToQuestion } from '../services/assistant/initiativeMemory';
import { saveProjectMission, saveSingleProject, getProjectMissions } from '../services/projectsService';

interface CentralAICoordinatorProps {
  catalog: IAItem[];
  ideas?: IdeaItem[];
  projects?: ProjectHubItem[];
  studies?: StudyItem[];
  evolutionLogs?: EvolutionLog[];
  currentRoute?: MainHubView;
  currentSection?: string;
  currentProject?: ProjectHubItem | null;
  currentUserRole?: UserRole;
  onChangeView?: (view: MainHubView) => void;
  onOpenProject?: (projectId: string) => void;
  onOpenAddIA?: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenCatalogWithFilter?: (category: string) => void;
  onOpenPromptGen?: () => void;
  onOpenCompare?: (ids?: number[]) => void;
  onOpenAIDetail?: (ai: IAItem) => void;
  onOpenIdeaDetail?: (idea: IdeaItem) => void;
  onCreateIdea?: (idea: IdeaItem) => Promise<void> | void;
  onUpdateIdea?: (idea: IdeaItem) => Promise<void> | void;
  onSelectStudy?: (study: StudyItem) => void;
  onSaveIA?: (ia: Partial<IAItem>) => Promise<IAItem | void>;
  isOpenControlled?: boolean;
  onToggleOpenControlled?: (open: boolean) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: AssistantMode;
  isSimulation?: boolean;
  intentDetected?: string;
  modelUsed?: string;
  providerUsed?: 'GEMINI' | 'GROQ';
  complexityLevel?: number;
  complexityLevelName?: string;
  fallbackTriggered?: boolean;
  durationMs?: number;
  plan?: TaskPlan;
  validationReport?: any;
  toolExecution?: any;
  pendingConfirmation?: {
    type: 'REGISTER_NEW_IDEA' | 'EVOLVE_IDEA_VERSION' | 'CREATE_STUDY';
    title: string;
    description: string;
    suggestedPayload: any;
    promptQuestion: string;
  };
  suggestedActions?: { label: string; actionType: string; target?: string; payload?: any }[];
  isProactive?: boolean;
  proactiveDecision?: InitiativeDecisionType | string;
  proactiveTopicKey?: string;
  proactivePriority?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export const CentralAICoordinator: React.FC<CentralAICoordinatorProps> = ({
  catalog,
  ideas = [],
  projects = [],
  studies = [],
  evolutionLogs = [],
  currentRoute = 'catalog' as MainHubView,
  currentSection,
  currentProject = null,
  currentUserRole = 'USER' as UserRole,
  onChangeView,
  onOpenProject,
  onOpenAddIA,
  onOpenGlobalSearch,
  onOpenCatalogWithFilter,
  onOpenPromptGen,
  onOpenCompare,
  onOpenAIDetail,
  onOpenIdeaDetail,
  onCreateIdea,
  onUpdateIdea,
  onSelectStudy,
  onSaveIA,
  isOpenControlled,
  onToggleOpenControlled,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;

  const setIsOpen = (val: boolean) => {
    if (onToggleOpenControlled) {
      onToggleOpenControlled(val);
    } else {
      setInternalIsOpen(val);
    }
  };

  const [activeMode, setActiveMode] = useState<AssistantMode>('CONVERSATION');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'IDLE' | 'THINKING' | 'SPEAKING' | 'ERROR' | 'ONLINE'>('ONLINE');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<string | null>(null);

  // Sincroniza projeto selecionado com o projeto atual da tela caso mude
  useEffect(() => {
    if (currentProject && currentProject.id !== selectedProjectId) {
      setSelectedProjectId(currentProject.id);
    }
  }, [currentProject]);

  // Modais de suporte
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeLearningIdea, setActiveLearningIdea] = useState<IdeaItem | null>(null);
  const [adaptiveProfile, setAdaptiveProfile] = useState<UserAdaptiveProfile | null>(null);
  const [activeProactiveBubble, setActiveProactiveBubble] = useState<Message | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: 'Olá! Sou o **Auxiliar Mestre do Hub 2.0**.\n\nConheço profundamente todas as áreas do sistema, seus projetos ativos, estudos e o catálogo de ferramentas de IA.\n\nPosso direcionar você para qualquer área, orientar seu próximo passo ou executar ações como cadastrar uma nova IA no catálogo.\n\nComo posso te ajudar agora?',
      mode: 'CONVERSATION',
      suggestedActions: [
        { label: '❓ O que posso fazer aqui?', actionType: 'ASK_WHAT_CAN_I_DO' },
        { label: '🚀 Me leve aos Projetos', actionType: 'NAVIGATE_PROJECTS' },
        { label: '📚 Explorar Catálogo', actionType: 'NAVIGATE_CATALOG' },
        { label: '➕ Cadastrar Nova IA', actionType: 'OPEN_ADD_IA' },
      ],
      timestamp: new Date(),
    }
  ]);

  // Carrega o perfil adaptativo existente do usuário no Hub
  useEffect(() => {
    async function loadProfile() {
      try {
        const prof = await getUserAdaptiveProfile();
        setAdaptiveProfile(prof);

        // Se ainda não existir perfil cadastrado ou se o nível ainda não foi informado
        if (!prof || !prof.aiExperienceLevel) {
          setMessages([
            {
              id: 'msg-init-adaptive',
              role: 'assistant',
              content: 'Olá! Sou o **Auxiliar Mestre do Hub 2.0**.\n\nAntes de começarmos, qual é o seu nível de experiência com IA?\n\n- **INICIANTE**: Estou começando e quero orientação mais detalhada.\n- **INTERMEDIÁRIO**: Já utilizo IAs e conheço os principais conceitos.\n- **AVANÇADO**: Tenho experiência com IA, ferramentas, APIs, automações ou desenvolvimento e prefiro uma interação mais direta.',
              mode: 'CONVERSATION',
              suggestedActions: [
                { label: '🌱 INICIANTE — Quero orientação detalhada', actionType: 'SET_AI_EXPERIENCE', payload: 'INICIANTE' },
                { label: '⚡ INTERMEDIÁRIO — Conheço os conceitos', actionType: 'SET_AI_EXPERIENCE', payload: 'INTERMEDIÁRIO' },
                { label: '🚀 AVANÇADO — Interação direta e técnica', actionType: 'SET_AI_EXPERIENCE', payload: 'AVANÇADO' },
              ],
              timestamp: new Date(),
            }
          ]);
        }
      } catch (e) {
        console.warn('Erro ao carregar perfil adaptativo no CentralAICoordinator:', e);
      }
    }
    loadProfile();
  }, []);

  const activeProject =
    projects.find((p) => p.id === selectedProjectId) ||
    ideas.find((i) => i.id === selectedProjectId) ||
    currentProject;

  // =========================================================================
  // ⚡ MOTOR DE INICIATIVA PROATIVA & PRESENÇA PERMANENTE DO AUXILIAR MESTRE
  // =========================================================================
  useEffect(() => {
    const unsubscribe = subscribeHubEvent((event: HubEvent) => {
      // Prepara o contexto operacional atual do Hub
      const effectiveProj =
        activeProject && 'status' in activeProject
          ? (activeProject as ProjectHubItem)
          : currentProject;

      const evaluation = evaluateInitiative(event, {
        currentRoute,
        currentProject: effectiveProj,
        allProjects: projects,
        currentUserRole,
        adaptiveProfile: adaptiveProfile || {
          aiExperienceLevel: 'INTERMEDIÁRIO',
          explanationDepth: 'equilibrada',
          preferredInteractionStyle: 'estrategico',
          proactivityLevel: 'equilibrado',
          updatedAt: new Date().toISOString(),
        },
        studies,
        ideas,
      });

      // Se a decisão for diferente de SILENCE e houver mensagem
      if (evaluation.decision !== 'SILENCE' && evaluation.messageText) {
        const proactiveMsg: Message = {
          id: `proactive-${Date.now()}`,
          role: 'assistant',
          content: evaluation.messageText,
          mode: 'CONVERSATION',
          suggestedActions: evaluation.suggestedActions,
          isProactive: true,
          proactiveDecision: evaluation.decision,
          proactiveTopicKey: evaluation.topicKey,
          proactivePriority: evaluation.priority,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, proactiveMsg]);

        // Se a janela estiver fechada, apresenta o balão flutuante de iniciativa autônoma
        if (!isOpen) {
          setActiveProactiveBubble(proactiveMsg);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [
    currentRoute,
    activeProject,
    currentProject,
    projects,
    currentUserRole,
    adaptiveProfile,
    studies,
    ideas,
    isOpen,
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend?: string, overrideMode?: AssistantMode) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const currentMode = overrideMode || activeMode;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      mode: currentMode,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setStatus('THINKING');

    // Se a última mensagem for proativa com tópico registrado, atualiza na memória de iniciativa
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistantMsg?.isProactive && lastAssistantMsg.proactiveTopicKey) {
      recordUserAnswerToQuestion(lastAssistantMsg.proactiveTopicKey, text.trim());
    }

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      
      const engineResponse: AssistantEngineResponse = await processAssistantMessage({
        userMessage: text.trim(),
        activeMode: currentMode,
        targetProjectId: selectedProjectId,
        allIdeas: ideas,
        allProjects: projects,
        allStudies: studies,
        catalog,
        history: historyPayload,
        currentRoute,
        currentSection,
        currentProject: activeProject && 'status' in activeProject ? (activeProject as ProjectHubItem) : currentProject,
        currentUserRole,
        adaptiveProfile: adaptiveProfile || undefined,
        navigationHandlers: {
          navigateToView: (view) => {
            if (onChangeView) onChangeView(view);
          },
          openProject: (projectId) => {
            if (onOpenProject) onOpenProject(projectId);
            else if (onChangeView) {
              onChangeView('projects');
            }
          },
          openAddIA: () => {
            if (onOpenAddIA) onOpenAddIA();
          },
          openGlobalSearch: () => {
            if (onOpenGlobalSearch) onOpenGlobalSearch();
          },
          openCompare: (ids) => {
            if (onOpenCompare) onOpenCompare(ids);
          },
          openAIDetail: (ia) => {
            if (onOpenAIDetail) onOpenAIDetail(ia);
          },
        },
        dataMutationHandlers: {
          saveIA: async (iaData) => {
            if (onSaveIA) {
              return await onSaveIA(iaData);
            }
          },
        },
      });

      // Se o engine detectou automaticamente um projeto mencionado, atualiza o contexto ativo
      if (engineResponse.context?.projectId && !selectedProjectId) {
        setSelectedProjectId(engineResponse.context.projectId);
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: engineResponse.replyText,
        mode: engineResponse.mode,
        isSimulation: engineResponse.mode === 'SIMULATION',
        modelUsed: engineResponse.modelUsed,
        providerUsed: engineResponse.providerUsed,
        complexityLevel: engineResponse.complexityAnalysis?.level,
        complexityLevelName: engineResponse.complexityAnalysis?.levelName,
        fallbackTriggered: engineResponse.fallbackTriggered,
        durationMs: engineResponse.durationMs,
        plan: engineResponse.plan,
        validationReport: engineResponse.validationReport,
        toolExecution: engineResponse.toolExecution,
        pendingConfirmation: engineResponse.pendingConfirmation,
        suggestedActions: engineResponse.suggestedActions,
        intentDetected: engineResponse.intent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStatus('SPEAKING');
      setTimeout(() => setStatus('ONLINE'), 3000);

      // Atualiza o perfil adaptativo local caso tenha ocorrido calibração na interação
      getUserAdaptiveProfile().then((fresh) => {
        if (fresh) setAdaptiveProfile(fresh);
      }).catch(() => {});
    } catch (err: any) {
      console.error('[CentralAICoordinator handleSend Error]:', err);
      setStatus('ERROR');
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Houve uma oscilação na resposta do servidor. Seus dados e contexto de projeto permanecem seguros na memória local. Como prefere prosseguir?',
        suggestedActions: [
          { label: '🧠 Abrir Painel de Memória', actionType: 'OPEN_MEMORY_MODAL' },
          { label: '📂 Explorar Catálogo', actionType: 'NAVIGATE_CATALOG' },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = async (actionType: string, target?: string, payload?: any) => {
    if (actionType === 'SET_AI_EXPERIENCE' && payload) {
      const level = payload as AIExperienceLevel;
      const promptMap: Record<AIExperienceLevel, string> = {
        INICIANTE: 'Meu nível de experiência com IA é Iniciante. Estou começando e quero orientação mais detalhada.',
        INTERMEDIÁRIO: 'Meu nível de experiência com IA é Intermediário. Já utilizo IAs e conheço os principais conceitos.',
        AVANÇADO: 'Meu nível de experiência com IA é Avançado. Tenho experiência com IA, APIs e automações e prefiro uma interação mais direta.',
      };
      handleSend(promptMap[level] || `Meu nível de experiência com IA é ${level}`);
    } else if (actionType === 'ASK_WHAT_CAN_I_DO') {
      handleSend('O que posso fazer aqui nesta tela do Hub?');
    } else if (actionType === 'NAVIGATE_PROJECTS') {
      onChangeView?.('projects');
      handleSend('Me leve aos projetos');
    } else if (actionType === 'NAVIGATE_CATALOG') {
      onChangeView?.('catalog');
      handleSend('Me leve ao catálogo de IAs');
    } else if (actionType === 'NAVIGATE_STUDIES') {
      onChangeView?.('studies');
      handleSend('Me leve aos estudos');
    } else if (actionType === 'NAVIGATE_DIARY') {
      onChangeView?.('diary');
      handleSend('Me leve ao diário de bordo');
    } else if (actionType === 'OPEN_ADD_IA') {
      onOpenAddIA?.();
      handleSend('Quero cadastrar uma nova IA');
    } else if (actionType === 'OPEN_COMPARE') {
      onOpenCompare?.();
    } else if (actionType === 'SWITCH_TO_PLANNING') {
      setActiveMode('PLANNING');
      handleSend('Por favor, monte o plano estruturado em etapas para construirmos o objetivo.', 'PLANNING');
    } else if (actionType === 'SWITCH_TO_SIMULATION') {
      setActiveMode('SIMULATION');
      handleSend('Simule o cenário operacional deste projeto no ambiente Groq para testarmos os riscos e fluxo de dados.', 'SIMULATION');
    } else if (actionType === 'OPEN_MEMORY_MODAL') {
      setIsMemoryModalOpen(true);
    } else if (actionType === 'OPEN_LEARNING_MODAL') {
      const ideaToLearn = ideas.find((i) => i.id === target);
      if (ideaToLearn) {
        setActiveLearningIdea(ideaToLearn);
        setIsLearningModalOpen(true);
      }
    } else if (actionType === 'OPEN_PROJECT_DETAIL' && target) {
      if (onOpenProject) {
        onOpenProject(target);
      } else {
        const found = ideas.find((i) => i.id === target);
        if (found && onOpenIdeaDetail) {
          onOpenIdeaDetail(found);
        }
      }
    } else if (actionType === 'CONFIRM_REGISTER_IDEA' && payload) {
      const newIdea: IdeaItem = {
        id: `idea-${Date.now()}`,
        title: payload.title || payload.suggestedTitle,
        description: payload.description,
        category: payload.category || 'Outros',
        status: 'Ativa',
        stage: '1. Ideia',
        priority: 'Média',
        objective: payload.description,
        problemSolved: '',
        targetAudience: '',
        relatedTechnologies: [],
        relatedIANames: [],
        currentVersion: 'V1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (onCreateIdea) {
        await onCreateIdea(newIdea);
      }
      setSelectedProjectId(newIdea.id);
      const confirmMsg: Message = {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: `✅ Ideia **"${newIdea.title}"** registrada com sucesso na memória do Hub!\n\nDefinida como projeto ativo. Podemos começar a planejar suas etapas ou simular cenários.`,
        suggestedActions: [
          { label: '📋 Planejar Etapas com Gemini', actionType: 'SWITCH_TO_PLANNING' },
          { label: '🧪 Simular Cenário com Groq', actionType: 'SWITCH_TO_SIMULATION' },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } else if (actionType === 'SIMULATE_CURRENT_PLAN') {
      setActiveMode('SIMULATION');
      handleSend('Execute a simulação preditiva das etapas deste plano via Groq.', 'SIMULATION');
    } else if (actionType === 'OPEN_PROMPT_GEN') {
      if (onOpenPromptGen) onOpenPromptGen();
      setIsOpen(false);
    } else if (actionType === 'STRUCTURE_FIRST_STEPS') {
      const targetProj = projects.find((p) => p.id === target) || currentProject;
      if (targetProj) {
        // Cria 3 missões estruturantes iniciais
        const starterMissions: Array<Omit<ProjectMission, 'id'>> = [
          {
            projectId: targetProj.id,
            title: 'Mapeamento de Requisitos e Escopo Inicial',
            description: 'Delimitar objetivos específicos, restrições e casos de uso essenciais.',
            status: 'Em andamento',
            priority: 'Alta',
            createdAt: new Date().toLocaleDateString(),
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            notes: 'Missão gerada pelo Auxiliar Mestre para desbloqueio de planejamento.',
          },
          {
            projectId: targetProj.id,
            title: 'Seleção de Ferramentas de IA e Arquitetura',
            description: 'Identificar no catálogo as IAs mais eficientes para executar as tarefas do projeto.',
            status: 'Pendente',
            priority: 'Alta',
            createdAt: new Date().toLocaleDateString(),
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            notes: 'Consultar catálogo do Hub e avaliar trade-offs.',
          },
          {
            projectId: targetProj.id,
            title: 'Desenvolvimento do Protótipo e Validação',
            description: 'Construir a primeira versão funcional e testar com critérios objetivos.',
            status: 'Pendente',
            priority: 'Média',
            createdAt: new Date().toLocaleDateString(),
            dueDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
          },
        ];

        starterMissions.forEach((m) => {
          saveProjectMission({ ...m, id: `mission-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` });
        });

        const updatedProj: ProjectHubItem = {
          ...targetProj,
          currentStage: starterMissions[0].title,
          nextAction: starterMissions[0].description,
          status: 'Planejamento',
          updatedAt: new Date().toISOString(),
          history: [
            {
              id: `hist-${Date.now()}`,
              date: new Date().toLocaleDateString(),
              description: 'Plano inicial de execução estruturado pelo Auxiliar Mestre.',
              author: 'Auxiliar Mestre',
            },
            ...targetProj.history,
          ],
        };
        saveSingleProject(updatedProj);
        if (onOpenProject) {
          onOpenProject(targetProj.id);
        }

        const confirmMsg: Message = {
          id: `sys-${Date.now()}`,
          role: 'assistant',
          content: `🎯 **Plano de Execução Estruturado com Sucesso!**\n\nCriei 3 missões essenciais para o projeto **"${targetProj.name}"**:\n1. 🚀 **Mapeamento de Requisitos e Escopo Inicial** (Em andamento)\n2. ⚖️ **Seleção de Ferramentas de IA e Arquitetura** (Pendente)\n3. 🧪 **Desenvolvimento do Protótipo e Validação** (Pendente)\n\nO projeto foi atualizado para o status **Planejamento**. Como deseja conduzir o primeiro passo?`,
          suggestedActions: [
            { label: '📋 Planejar Etapa 1 com Gemini', actionType: 'SWITCH_TO_PLANNING' },
            { label: '🧪 Simular com Groq', actionType: 'SWITCH_TO_SIMULATION' },
            { label: '💡 Recomendar IAs do Catálogo', actionType: 'RECOMMEND_IAS', target: targetProj.id },
          ],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmMsg]);
      }
    } else if (actionType === 'GENERATE_ROADMAP') {
      const targetProj = projects.find((p) => p.id === target) || currentProject;
      handleSend(`Gere um roadmap detalhado com fases recomendadas para o projeto "${targetProj?.name || ''}".`, 'PLANNING');
    } else if (actionType === 'RECOMMEND_IAS') {
      const targetProj = projects.find((p) => p.id === target) || currentProject;
      handleSend(`Quais são as melhores inteligências artificiais do catálogo para atender aos objetivos do projeto "${targetProj?.name || ''}"?`);
    } else if (actionType === 'ANALYZE_PENDING_DECISION') {
      const targetProj = projects.find((p) => p.id === target) || currentProject;
      handleSend(`Quero analisar a decisão pendente no projeto "${targetProj?.name || ''}". Quais são os riscos e alternativas recomendadas?`);
    } else if (actionType === 'SIMULATE_DECISION') {
      const targetProj = projects.find((p) => p.id === target) || currentProject;
      handleSend(`Simule via sandbox preditivo os cenários de impacto para a decisão pendente do projeto "${targetProj?.name || ''}".`, 'SIMULATION');
    } else if (actionType === 'OPEN_DEBATE') {
      if (target && onOpenProject) onOpenProject(target);
      handleSend('Vamos abrir o debate estratégico deste projeto para deliberar sobre a próxima etapa.');
    } else if (actionType === 'VIEW_CURRENT_MISSION') {
      if (target && onOpenProject) onOpenProject(target);
      handleSend('Mostre os detalhes da missão em andamento e me oriente sobre sua execução prática.');
    } else if (actionType === 'START_NEXT_MISSION') {
      handleSend('Vamos iniciar a próxima missão planejada. O que precisamos fazer agora?');
    } else if (actionType === 'TEACH_AREA') {
      const routeName = target || currentRoute;
      handleSend(`Me explique como funciona a área "${routeLabels[routeName] || routeName}" do Hub e como posso aproveitá-la melhor.`);
    } else if (actionType === 'OPEN_PROJECT' && target) {
      if (onOpenProject) onOpenProject(target);
      handleSend(`Quero retomar este projeto. Onde paramos e qual a próxima ação imediata?`);
    } else if (actionType === 'APPLY_FIX') {
      handleSend('Por favor, aplique a alternativa de correção segura para resolver o erro de execução detectado.');
    } else if (actionType === 'SWITCH_MODEL') {
      handleSend('Por favor, alterne para o modelo alternativo mais adequado e execute a tarefa novamente.');
    } else if (actionType === 'DISMISS') {
      setActiveProactiveBubble(null);
    }
  };

  const copyPromptText = (text: string, indexKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(indexKey);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  // Mapeamento visual da rota para o cabeçalho
  const routeLabels: Record<string, string> = {
    catalog: 'Catálogo de IAs',
    projects: 'Gestão de Projetos',
    ideas: 'Central de Ideias',
    studies: 'Banco de Estudos',
    diary: 'Diário de Bordo',
    dashboard: 'Dashboard Executivo',
    master: 'O Mestre',
    receptor: 'Receptor Mestre',
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Balão Flutuante de Iniciativa Autônoma (quando fechado) */}
        {!isOpen && activeProactiveBubble && (
          <div className="mb-3 w-[92vw] max-w-sm sm:max-w-md bg-slate-900/98 backdrop-blur-xl border-2 border-indigo-500/60 rounded-2xl p-4 shadow-2xl shadow-indigo-950/80 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    Central de IA <Sparkles className="w-3 h-3 text-amber-400" />
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                    Iniciativa Autônoma • {activeProactiveBubble.proactiveDecision || 'Proatividade'}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveProactiveBubble(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                title="Dispensar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line mb-3">
              {activeProactiveBubble.content}
            </p>

            {activeProactiveBubble.suggestedActions && activeProactiveBubble.suggestedActions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeProactiveBubble.suggestedActions.map((act, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsOpen(true);
                      setActiveProactiveBubble(null);
                      handleActionClick(act.actionType, act.target, act.payload);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-950/90 hover:bg-indigo-900 text-cyan-300 hover:text-white rounded-lg border border-indigo-700/60 text-xs font-medium flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                  >
                    <span>{act.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={() => {
                    setIsOpen(true);
                    setActiveProactiveBubble(null);
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-medium transition-all"
                >
                  Abrir Conversa
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botão flutuante do Auxiliar Mestre / Central IA */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-full shadow-2xl border border-indigo-500/40 hover:border-cyan-400/60 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/30"
            title="Auxiliar Mestre do Hub 2.0"
            id="central-ia-floating-btn"
          >
            {/* Indicador de status pulse */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-inner text-white font-bold relative overflow-hidden">
              <Bot className="w-5 h-5 animate-pulse text-white" />
            </div>

            <div className="flex flex-col text-left pr-1">
              <span className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-1">
                CENTRAL IA <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
              <span className="text-[11px] text-slate-300 truncate max-w-[150px]">
                {currentProject
                  ? `🎯 ${currentProject.name}`
                  : routeLabels[currentRoute] || 'Auxiliar Mestre'}
              </span>
            </div>
          </button>
        )}

        {/* Janela Modal do Chat do Auxiliar Mestre */}
        {isOpen && (
          <div className="w-[94vw] sm:w-[500px] h-[680px] max-h-[88vh] bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
            
            {/* Cabeçalho */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                    status === 'THINKING' ? 'bg-amber-400 animate-bounce' :
                    status === 'ERROR' ? 'bg-rose-500' : 'bg-emerald-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                    CENTRAL DE IA <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-cyan-500/30">AUXILIAR MESTRE</span>
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span className="truncate max-w-[200px]">
                      {currentProject ? `Projeto: ${currentProject.name}` : `Tela: ${routeLabels[currentRoute] || currentRoute}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Botão de Memória Operacional */}
                <button
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-white rounded-lg border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Painel de Memória e Métricas"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Memória</span>
                </button>

                {/* Botão de Configurações */}
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Configurações do Orquestrador"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setMessages([messages[0]])}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Reiniciar conversa"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Faixa de Consciência Contextual */}
            <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-2 truncate">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Compass className="w-3 h-3" />
                  {routeLabels[currentRoute] || currentRoute}
                </span>
                {currentProject && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-indigo-300 font-medium truncate max-w-[180px]">
                      🎯 {currentProject.name} ({currentProject.currentStage})
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setIsMemoryModalOpen(true)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-all ${
                    adaptiveProfile?.aiExperienceLevel === 'INICIANTE'
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                      : adaptiveProfile?.aiExperienceLevel === 'AVANÇADO'
                      ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60'
                      : adaptiveProfile?.aiExperienceLevel === 'INTERMEDIÁRIO'
                      ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/60'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                  title="Clique para calibrar seu nível de experiência com IA no painel de memória"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>{adaptiveProfile?.aiExperienceLevel || 'Nível IA: Definir'}</span>
                </button>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  • {currentUserRole}
                </span>
              </div>
            </div>

            {/* Seletor dos 4 Modos Operacionais */}
            <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-1 text-[11px]">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveMode('CONVERSATION')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeMode === 'CONVERSATION'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  💬 Conversa
                </button>
                <button
                  onClick={() => setActiveMode('PLANNING')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeMode === 'PLANNING'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📋 Planejamento
                </button>
                <button
                  onClick={() => setActiveMode('SIMULATION')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeMode === 'SIMULATION'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🧪 Simulação Groq
                </button>
                <button
                  onClick={() => setActiveMode('EVOLUTION')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    activeMode === 'EVOLUTION'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🚀 Evolução
                </button>
              </div>

              {/* Seletor de Projeto Ativo */}
              {projects.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value || undefined)}
                    className="bg-slate-850 border border-slate-750 text-slate-300 text-[10px] rounded-lg px-2 py-1 outline-none max-w-[130px] truncate"
                  >
                    <option value="">🎯 Geral (Hub)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Corpo de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60 custom-scrollbar">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-md ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-br-xs'
                        : 'bg-slate-850 text-slate-200 border border-slate-750 rounded-bl-xs'
                    }`}
                  >
                    {/* Badge se for Simulação */}
                    {m.isSimulation && (
                      <div className="mb-2 flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded text-[10px] font-mono">
                        <FlaskConical className="w-3 h-3" />
                        SIMULAÇÃO VIRTUAL GROQ (NÃO ALTERA PRODUÇÃO)
                      </div>
                    )}

                    {/* Badge de Iniciativa Autônoma */}
                    {m.isProactive && (
                      <div className="mb-2.5 flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-amber-500/15 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-mono shadow-xs">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                          <span className="font-bold tracking-wider">INICIATIVA AUTÔNOMA DO MESTRE</span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 uppercase font-semibold">
                          {m.proactiveDecision || 'PROATIVIDADE'}
                        </span>
                      </div>
                    )}

                    {/* Badge de Execução de Ferramenta */}
                    {m.toolExecution && m.toolExecution.success && (
                      <div className="mb-2 flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded text-[10px] font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        AÇÃO INTERNA EXECUTADA: {m.toolExecution.actionExecuted || 'OK'}
                      </div>
                    )}

                    {/* Texto com quebras de linha e formatação */}
                    <div className="whitespace-pre-line space-y-2">
                      {m.content}
                    </div>

                    {/* Metadados Técnicos de Inferência */}
                    {m.role === 'assistant' && (m.modelUsed || m.complexityLevel) && (
                      <div className="mt-3 pt-2 border-t border-slate-750/70 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-cyan-400" />
                          {m.modelUsed || 'Gemini Pro'}
                        </span>
                        {m.durationMs && <span>⚡ {m.durationMs}ms</span>}
                      </div>
                    )}
                  </div>

                  {/* Ações sugeridas em botões clicáveis */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[92%]">
                      {m.suggestedActions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(act.actionType, act.target, act.payload)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-lg border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Auxiliar Mestre consultando o ecossistema do Hub...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Barra de atalhos rápidos contextuais */}
            <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
              <span className="text-[10px] text-slate-500 whitespace-nowrap">Atalhos:</span>
              <button
                onClick={() => handleSend('O que posso fazer aqui nesta tela?')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] whitespace-nowrap border border-slate-750 flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3 text-cyan-400" />
                O que posso fazer aqui?
              </button>
              <button
                onClick={() => handleSend('Me leve aos projetos')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] whitespace-nowrap border border-slate-750 flex items-center gap-1"
              >
                <FolderOpen className="w-3 h-3 text-indigo-400" />
                Ir para Projetos
              </button>
              <button
                onClick={() => handleSend('Qual IA do Hub é melhor para código?')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] whitespace-nowrap border border-slate-750 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                Qual IA usar?
              </button>
              <button
                onClick={() => onOpenAddIA?.()}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] whitespace-nowrap border border-slate-750 flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3 text-emerald-400" />
                Cadastrar IA
              </button>
            </div>

            {/* Input de Mensagem */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                  activeMode === 'PLANNING'
                    ? 'Descreva o que deseja construir...'
                    : activeMode === 'SIMULATION'
                    ? 'Qual cenário deseja simular?'
                    : 'Pergunte sobre o Hub, navegue ou comande...'
                }
                className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-750 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !inputMessage.trim()}
                className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-40 text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center"
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}
      </div>

      {/* MODAL DE CONTROLE DE MEMÓRIA E MÉTRICAS */}
      <AssistantMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        currentContext={
          activeProject
            ? {
                projectId: activeProject.id,
                projectTitle: 'name' in activeProject ? activeProject.name : activeProject.title,
                projectDescription: activeProject.description,
                currentStage: 'currentStage' in activeProject ? activeProject.currentStage : activeProject.stage,
                currentVersion: 'currentVersion' in activeProject ? (activeProject as any).currentVersion : 'V1',
                objective: activeProject.objective,
                lastEvolution: 'lastEvolution' in activeProject ? (activeProject as any).lastEvolution : 'V1',
                currentProblems: (activeProject as any).problemSolved ? [(activeProject as any).problemSolved] : [],
                decisions: [],
                nextSteps: (activeProject as any).nextSteps ? [(activeProject as any).nextSteps] : [],
                relatedStudies: studies
                  .filter((s) => s.relatedProjectIds?.includes(activeProject.id))
                  .map((s) => ({ id: s.id, theme: s.theme, level: s.level, progress: s.progress })),
                recentLogs: evolutionLogs
                  .filter((l) => l.ideaId === activeProject.id)
                  .slice(0, 3)
                  .map((l) => ({ text: l.text, category: l.category, createdAt: l.createdAt })),
                summaryForAI: '',
              }
            : null
        }
        ideas={ideas}
        studies={studies}
        onOpenIdeaDetail={(idea) => {
          setIsMemoryModalOpen(false);
          if (onOpenIdeaDetail) onOpenIdeaDetail(idea);
        }}
      />

      {/* MODAL DE APRENDIZADO DO PROJETO */}
      {activeLearningIdea && (
        <ProjectLearningModal
          isOpen={isLearningModalOpen}
          onClose={() => {
            setIsLearningModalOpen(false);
            setActiveLearningIdea(null);
          }}
          idea={activeLearningIdea}
          onSaved={() => {
            alert('Aprendizado gravado com sucesso na memória do projeto!');
          }}
        />
      )}

      {/* MODAL DE CONFIGURAÇÃO DO ORQUESTRADOR (GEMINI + GROQ) */}
      <OrchestratorSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </>
  );
};
