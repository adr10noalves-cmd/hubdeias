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
  Zap
} from 'lucide-react';
import { 
  IAItem, 
  IdeaItem, 
  StudyItem, 
  EvolutionLog, 
  AssistantMode,
  TaskPlan
} from '../types';
import { 
  processAssistantMessage, 
  AssistantEngineResponse 
} from '../services/assistant/assistantEngine';
import { AssistantMemoryModal } from './strategic/AssistantMemoryModal';
import { ProjectLearningModal } from './strategic/ProjectLearningModal';
import { OrchestratorSettingsModal } from './strategic/OrchestratorSettingsModal';

interface CentralAICoordinatorProps {
  catalog: IAItem[];
  ideas?: IdeaItem[];
  studies?: StudyItem[];
  evolutionLogs?: EvolutionLog[];
  onOpenCatalogWithFilter?: (category: string) => void;
  onOpenPromptGen?: () => void;
  onOpenCompare?: () => void;
  onOpenAIDetail?: (ai: IAItem) => void;
  onOpenIdeaDetail?: (idea: IdeaItem) => void;
  onCreateIdea?: (idea: IdeaItem) => Promise<void> | void;
  onUpdateIdea?: (idea: IdeaItem) => Promise<void> | void;
  onSelectStudy?: (study: StudyItem) => void;
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
  pendingConfirmation?: {
    type: 'REGISTER_NEW_IDEA' | 'EVOLVE_IDEA_VERSION' | 'CREATE_STUDY';
    title: string;
    description: string;
    suggestedPayload: any;
    promptQuestion: string;
  };
  suggestedActions?: { label: string; actionType: string; target?: string; payload?: any }[];
  timestamp: Date;
}

export const CentralAICoordinator: React.FC<CentralAICoordinatorProps> = ({
  catalog,
  ideas = [],
  studies = [],
  evolutionLogs = [],
  onOpenCatalogWithFilter,
  onOpenPromptGen,
  onOpenCompare,
  onOpenAIDetail,
  onOpenIdeaDetail,
  onCreateIdea,
  onUpdateIdea,
  onSelectStudy,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<AssistantMode>('CONVERSATION');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<'IDLE' | 'THINKING' | 'SPEAKING' | 'ERROR' | 'ONLINE'>('ONLINE');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<string | null>(null);

  // Modais de suporte
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeLearningIdea, setActiveLearningIdea] = useState<IdeaItem | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: 'Olá! Sou o Núcleo de Orquestração Inteligente do Hub.\n\nOpero conectada à memória de seus projetos, estudos e catálogo de IAs. Posso ajudar a conceber ideias, planejar etapas, simular cenários de execução com a Groq e auditar resultados.\n\nO que você deseja construir ou evoluir hoje?',
      mode: 'CONVERSATION',
      suggestedActions: [
        { label: '📋 Planejar Construção', actionType: 'SWITCH_TO_PLANNING' },
        { label: '🧪 Simulação com Groq', actionType: 'SWITCH_TO_SIMULATION' },
        { label: '🧠 Ver Memória Ativa', actionType: 'OPEN_MEMORY_MODAL' },
      ],
      timestamp: new Date(),
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeProject = ideas.find((i) => i.id === selectedProjectId);

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

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      
      const engineResponse: AssistantEngineResponse = await processAssistantMessage({
        userMessage: text.trim(),
        activeMode: currentMode,
        targetProjectId: selectedProjectId,
        allIdeas: ideas,
        allStudies: studies,
        catalog,
        history: historyPayload,
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
        pendingConfirmation: engineResponse.pendingConfirmation,
        suggestedActions: engineResponse.suggestedActions,
        intentDetected: engineResponse.intent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStatus('SPEAKING');
      setTimeout(() => setStatus('ONLINE'), 3000);
    } catch (err: any) {
      console.error('[CentralAICoordinator handleSend Error]:', err);
      setStatus('ERROR');
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Houve uma oscilação na resposta do servidor. Seus dados e contexto de projeto permanecem seguros na memória local. Como prefere prosseguir?',
        suggestedActions: [
          { label: '🧠 Abrir Painel de Memória', actionType: 'OPEN_MEMORY_MODAL' },
          { label: '📂 Explorar Catálogo', actionType: 'OPEN_CATALOG' },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = async (actionType: string, target?: string, payload?: any) => {
    if (actionType === 'SWITCH_TO_PLANNING') {
      setActiveMode('PLANNING');
      handleSend('Por favor, monte o plano estruturado em etapas para construirmos o objetivo.', 'PLANNING');
    } else if (actionType === 'SWITCH_TO_SIMULATION') {
      setActiveMode('SIMULATION');
      handleSend('Simule o cenário operacional deste projeto no ambiente Groq para testarmos os riscos e fluxo de dados.', 'SIMULATION');
    } else if (actionType === 'OPEN_MEMORY_MODAL') {
      setIsMemoryModalOpen(true);
    } else if (actionType === 'OPEN_LEARNING_MODAL') {
      const ideaToLearn = ideas.find((i) => i.id === target) || activeProject;
      if (ideaToLearn) {
        setActiveLearningIdea(ideaToLearn);
        setIsLearningModalOpen(true);
      }
    } else if (actionType === 'OPEN_PROJECT_DETAIL' && target) {
      const found = ideas.find((i) => i.id === target);
      if (found && onOpenIdeaDetail) {
        onOpenIdeaDetail(found);
      }
    } else if (actionType === 'CONFIRM_REGISTER_IDEA' && payload) {
      // 4. REGISTRO COM CONFIRMAÇÃO DO USUÁRIO
      const newIdea: IdeaItem = {
        id: `idea-${Date.now()}`,
        title: payload.title || payload.suggestedTitle,
        description: payload.description,
        category: payload.category || 'Geral',
        objective: payload.description,
        problemSolved: 'Registrado via orquestrador do Hub',
        targetAudience: payload.targetAudience || 'Usuários do ecossistema',
        stage: '1. Ideia',
        priority: 'Média',
        status: 'Ativa',
        relatedTechnologies: [],
        relatedIANames: [],
        currentVersion: 'V1',
        observations: 'Cadastrado a partir de recomendação e confirmação do usuário no Assistente.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onCreateIdea) {
        await onCreateIdea(newIdea);
      }
      setSelectedProjectId(newIdea.id);

      setMessages((prev) => [
        ...prev,
        {
          id: `confirm-${Date.now()}`,
          role: 'assistant',
          content: `✅ A ideia **"${newIdea.title}"** foi cadastrada com sucesso no Firestore!\n\nEla agora está vinculada à memória ativa do Assistente como V1. Deseja que eu gere o plano de desenvolvimento em etapas?`,
          suggestedActions: [
            { label: '📋 Gerar Plano de Etapas', actionType: 'SWITCH_TO_PLANNING' },
            { label: '💡 Ver Detalhes da Ideia', actionType: 'OPEN_PROJECT_DETAIL', target: newIdea.id },
          ],
          timestamp: new Date(),
        }
      ]);
    } else if (actionType === 'APPLY_PLAN_TO_PROJECT' && target && payload) {
      const plan = payload as TaskPlan;
      const targetIdea = ideas.find((i) => i.id === target);
      if (targetIdea && onUpdateIdea) {
        const updated: IdeaItem = {
          ...targetIdea,
          roadmap: plan.steps.map((stg) => ({
            id: `rm-${stg.stepNumber}`,
            stageTitle: `Etapa ${stg.stepNumber}: ${stg.title}`,
            goal: stg.deliverable,
            status: stg.status,
          })),
          nextSteps: `Etapa 1: ${plan.steps[0]?.title || 'Iniciar desenvolvimento'}`,
          updatedAt: new Date().toISOString(),
        };
        await onUpdateIdea(updated);
        alert(`Plano em ${plan.steps.length} etapas adotado com sucesso no projeto "${targetIdea.title}"!`);
      }
    } else if (actionType === 'OPEN_CATALOG') {
      if (onOpenCatalogWithFilter) onOpenCatalogWithFilter(target || '');
      setIsOpen(false);
    } else if (actionType === 'OPEN_PROMPT_GEN') {
      if (onOpenPromptGen) onOpenPromptGen();
      setIsOpen(false);
    } else if (actionType === 'OPEN_COMPARE') {
      if (onOpenCompare) onOpenCompare();
      setIsOpen(false);
    }
  };

  const copyPromptText = (text: string, indexKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptIndex(indexKey);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Botão flutuante do Robô / Central IA */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-full shadow-2xl border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/20"
            title="Núcleo de Orquestração Inteligente do Hub"
            id="central-ia-floating-btn"
          >
            {/* Indicador de status pulse */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-inner text-white font-bold relative overflow-hidden">
              <Cpu className="w-5 h-5 animate-pulse text-white" />
            </div>

            <div className="flex flex-col text-left pr-1">
              <span className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-1">
                CENTRAL IA <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
              <span className="text-[11px] text-slate-300">
                {activeProject ? `🎯 ${activeProject.title.slice(0, 15)}...` : 'Orquestrador do Hub'}
              </span>
            </div>
          </button>
        )}

        {/* Janela Modal do Chat do Núcleo de Orquestração */}
        {isOpen && (
          <div className="w-[94vw] sm:w-[490px] h-[660px] max-h-[88vh] bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
            
            {/* Cabeçalho */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
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
                    CENTRAL IA <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-cyan-500/30">NÚCLEO HUB</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {status === 'THINKING' ? 'Consultando memória & inferindo...' : 'Orquestração, Memória & Simulação'}
                  </p>
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

                {/* Botão de Governança e Configurações */}
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

            {/* Seletor dos 4 Modos Operacionais */}
            <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-1 text-[11px]">
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
              {ideas.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(e.target.value || undefined)}
                    className="bg-slate-850 border border-slate-750 text-slate-300 text-[10px] rounded-lg px-2 py-1 outline-none max-w-[130px] truncate"
                  >
                    <option value="">🎯 Geral (Hub)</option>
                    {ideas.map((idea) => (
                      <option key={idea.id} value={idea.id}>
                        {idea.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Banner de Contexto Ativo */}
            {activeProject && (
              <div className="px-3 py-1.5 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center justify-between text-[11px] text-indigo-300">
                <span className="truncate">
                  🎯 <strong>{activeProject.title}</strong> ({activeProject.currentVersion || 'V1'})
                </span>
                <button
                  onClick={() => setSelectedProjectId(undefined)}
                  className="text-[10px] text-slate-400 hover:text-rose-300 underline ml-2"
                >
                  Desacoplar
                </button>
              </div>
            )}

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
                      <div className="mb-2 p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                        <FlaskConical className="w-4 h-4" />
                        <span>🧪 SIMULAÇÃO DE CENÁRIO (AMBIENTE VIRTUAL GROQ)</span>
                      </div>
                    )}

                    {/* Texto principal da mensagem */}
                    <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                    {/* Renderização de Plano em Etapas se houver */}
                    {m.plan && (
                      <div className="mt-3 pt-3 border-t border-slate-750 space-y-2">
                        <div className="font-bold text-cyan-300 text-xs flex items-center gap-1">
                          <ListOrdered className="w-3.5 h-3.5" /> Etapas do Plano:
                        </div>
                        {m.plan.steps.map((stg) => (
                          <div
                            key={stg.stepNumber}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">
                                Etapa {stg.stepNumber}: {stg.title}
                              </span>
                              <button
                                onClick={() => copyPromptText(stg.prompt, `step-${stg.stepNumber}`)}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] flex items-center gap-1 font-mono"
                                title="Copiar prompt da etapa"
                              >
                                {copiedPromptIndex === `step-${stg.stepNumber}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" /> Copiado
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" /> Copiar Prompt
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              IA: <code className="text-indigo-300">{stg.toolRecommendation}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Card de Confirmação para Registro de Ideia */}
                    {m.pendingConfirmation && (
                      <div className="mt-3 p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 space-y-2 text-xs">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {m.pendingConfirmation.promptQuestion}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          Título: <strong>{m.pendingConfirmation.title}</strong>
                        </div>
                      </div>
                    )}

                    {/* Ações sugeridas */}
                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-750/80 flex flex-wrap gap-1.5">
                        {m.suggestedActions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(act.actionType, act.target, act.payload)}
                            className="text-[11px] bg-indigo-600/30 hover:bg-indigo-600/50 text-cyan-300 hover:text-white border border-indigo-500/40 px-2.5 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 font-medium shadow-sm"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1.5 px-1 flex flex-wrap items-center gap-2">
                    <span className="text-slate-500">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {m.providerUsed && (
                      <span className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[9.5px] ${
                        m.providerUsed === 'GEMINI'
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      }`}>
                        {m.providerUsed === 'GEMINI' ? <Sparkles className="w-3 h-3 text-cyan-400" /> : <Zap className="w-3 h-3 text-amber-400" />}
                        {m.providerUsed === 'GEMINI' ? 'Gemini' : 'Groq'} • {m.modelUsed}
                      </span>
                    )}
                    {m.complexityLevel && (
                      <span className="text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded text-[9px] border border-slate-700/50">
                        Nível {m.complexityLevel}: {m.complexityLevelName}
                      </span>
                    )}
                    {m.fallbackTriggered && (
                      <span className="text-amber-300 bg-amber-950/60 border border-amber-800/50 px-1 py-0.5 rounded text-[9px]">
                        Fallback Ativo
                      </span>
                    )}
                    {m.durationMs && (
                      <span className="text-slate-500 text-[9px]">
                        {(m.durationMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center text-cyan-400">
                    <Cpu className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-850 border border-slate-750 px-4 py-3 rounded-2xl rounded-bl-xs text-xs text-slate-400 flex items-center gap-2">
                    <span className="animate-pulse">
                      {activeMode === 'SIMULATION'
                        ? 'Executando simulação de cenário no Groq...'
                        : 'Recuperando contexto e orquestrando resposta...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Sugestões Rápidas de Ação */}
            <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex gap-2 overflow-x-auto text-xs no-scrollbar">
              {[
                'Quero construir um novo projeto',
                'Simular cenário com Groq',
                'Quero melhorar meu Auditor SST',
                'Qual melhor IA para código?'
              ].map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="whitespace-nowrap bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 px-3 py-1 rounded-full border border-slate-700 transition-colors text-[11px]"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Caixa de Entrada */}
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
                    : 'Como o Núcleo pode ajudar seu projeto?'
                }
                className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-750 focus:outline-none focus:border-indigo-500 transition-colors"
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
                projectTitle: activeProject.title,
                projectDescription: activeProject.description,
                currentStage: activeProject.stage,
                currentVersion: activeProject.currentVersion || 'V1',
                objective: activeProject.objective,
                lastEvolution: activeProject.currentVersion || 'V1',
                currentProblems: activeProject.problemSolved ? [activeProject.problemSolved] : [],
                decisions: [],
                nextSteps: activeProject.nextSteps ? [activeProject.nextSteps] : [],
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
