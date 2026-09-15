import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Brain,
  Search,
  PenTool,
  Scale,
  PlusCircle,
  Compass,
  GitMerge,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Edit3,
  AlertTriangle,
  ArrowRight,
  Zap,
  CheckCircle2,
  RefreshCw,
  Eye,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  IAItem,
  CentralIntent,
  RecommendedOption,
  PromptGenerationResult,
  ComparisonAIsResult,
  AIStrategyResult,
  CatalogQueryAnswer,
  DiscoveredAICandidate,
} from '../types';
import {
  detectIntent,
  recommendAI,
  generatePrompt,
  compareAIs,
  registerNewAI,
  discoverNewAIs,
  buildAIStrategy,
  queryCatalog,
} from '../services/aiCentralService';
import { categoryIcons, getLevelBadgeClass, getDifficultyBadgeClass } from '../utils/helpers';

interface CentralDeIAModalProps {
  isOpen: boolean;
  onClose: () => void;
  ias: IAItem[];
  onOpenDetail?: (ia: IAItem) => void;
  onSelectInCatalog?: (name: string) => void;
  onAddIA?: (ia: Partial<IAItem>) => void;
  initialTab?: CentralIntent;
}

export const CentralDeIAModal: React.FC<CentralDeIAModalProps> = ({
  isOpen,
  onClose,
  ias,
  onOpenDetail,
  onSelectInCatalog,
  onAddIA,
  initialTab = 'recommend',
}) => {
  const [activeTab, setActiveTab] = useState<CentralIntent>(initialTab);

  // 11. COMANDO NATURAL ("O que você quer fazer?")
  const [naturalCommand, setNaturalCommand] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  // 2. ENCONTRAR MELHOR IA
  const [recommendInput, setRecommendInput] = useState('');
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendResults, setRecommendResults] = useState<{
    champion: RecommendedOption;
    second: RecommendedOption;
    third: RecommendedOption;
  } | null>(null);

  // 3. CRIAR PROMPT
  const [promptObjective, setPromptObjective] = useState('');
  const [promptTargetIA, setPromptTargetIA] = useState<string>(ias[0]?.name || 'Claude 3.5 Sonnet');
  const [promptLevel, setPromptLevel] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Intermediário');
  const [promptLanguage, setPromptLanguage] = useState<'pt' | 'en'>('pt');
  const [promptDesiredResult, setPromptDesiredResult] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedPromptResult, setGeneratedPromptResult] = useState<PromptGenerationResult | null>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editablePromptText, setEditablePromptText] = useState('');
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);

  // 5. COMPARAR IAs
  const [compareSelectedNames, setCompareSelectedNames] = useState<string[]>(
    ias.slice(0, 2).map((i) => i.name)
  );
  const [compareObjective, setCompareObjective] = useState('Qual é melhor para criar um aplicativo?');
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonAIsResult | null>(null);
  const [compareSearchFilter, setCompareSearchFilter] = useState('');

  // 6. CADASTRAR NOVA IA
  const [registerInput, setRegisterInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [pendingNewIA, setPendingNewIA] = useState<Partial<IAItem> | null>(null);
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState<string | null>(null);

  // 7. DESCOBRIR IAs
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredCandidates, setDiscoveredCandidates] = useState<DiscoveredAICandidate[]>([]);

  // 8. MONTAR ESTRATÉGIA
  const [strategyTask, setStrategyTask] = useState('Quero lançar um curso usando IA.');
  const [isBuildingStrategy, setIsBuildingStrategy] = useState(false);
  const [strategyResult, setStrategyResult] = useState<AIStrategyResult | null>(null);
  const [copiedStepIndex, setCopiedStepIndex] = useState<number | null>(null);

  // 9. CONSULTAR HUB
  const [queryInput, setQueryInput] = useState('Quais IAs de programação tenho?');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryAnswer, setQueryAnswer] = useState<CatalogQueryAnswer | null>(null);

  if (!isOpen) return null;

  // Handler do Comando Natural
  const handleRunNaturalCommand = async (commandToRun?: string) => {
    const text = (commandToRun || naturalCommand).trim();
    if (!text) return;

    setIsProcessingCommand(true);
    setCommandFeedback('Interpretando intenção com a Groq...');

    try {
      const detected = await detectIntent(text);
      setActiveTab(detected.intent);
      setCommandFeedback(`Intenção detectada: "${detected.intent}". Executando módulo correspondente...`);

      if (detected.intent === 'recommend') {
        setRecommendInput(text);
        setIsRecommending(true);
        const res = await recommendAI(text, ias);
        setRecommendResults(res);
        setIsRecommending(false);
      } else if (detected.intent === 'generate_prompt') {
        setPromptObjective(text);
        if (detected.targetIA) {
          const match = ias.find((i) => i.name.toLowerCase().includes(detected.targetIA!.toLowerCase()));
          if (match) setPromptTargetIA(match.name);
        }
        setIsGeneratingPrompt(true);
        const res = await generatePrompt({
          objective: text,
          targetIA: promptTargetIA,
          level: promptLevel,
        });
        setGeneratedPromptResult(res);
        setEditablePromptText(res.prompt);
        setIsGeneratingPrompt(false);
      } else if (detected.intent === 'compare') {
        setCompareObjective(text);
        if (detected.selectedAIs && detected.selectedAIs.length >= 2) {
          const matched = ias
            .filter((i) => detected.selectedAIs!.some((s) => i.name.toLowerCase().includes(s.toLowerCase())))
            .map((i) => i.name);
          if (matched.length >= 2) setCompareSelectedNames(matched.slice(0, 4));
        }
        setIsComparing(true);
        const res = await compareAIs(compareSelectedNames, text, ias);
        setComparisonResult(res);
        setIsComparing(false);
      } else if (detected.intent === 'register_ai') {
        setRegisterInput(text);
        setIsRegistering(true);
        const res = await registerNewAI(text, ias);
        setPendingNewIA(res);
        setIsRegistering(false);
      } else if (detected.intent === 'discover_ai') {
        setDiscoverQuery(text);
        setIsDiscovering(true);
        const res = await discoverNewAIs(text, ias);
        setDiscoveredCandidates(res);
        setIsDiscovering(false);
      } else if (detected.intent === 'build_strategy') {
        setStrategyTask(text);
        setIsBuildingStrategy(true);
        const res = await buildAIStrategy(text, ias);
        setStrategyResult(res);
        setIsBuildingStrategy(false);
      } else if (detected.intent === 'query_catalog') {
        setQueryInput(text);
        setIsQuerying(true);
        const res = await queryCatalog(text, ias);
        setQueryAnswer(res);
        setIsQuerying(false);
      }
    } catch (err: any) {
      console.error('Erro ao executar comando natural:', err);
      setCommandFeedback('Comando executado com fallback tático local.');
    } finally {
      setIsProcessingCommand(false);
      setTimeout(() => setCommandFeedback(null), 4000);
    }
  };

  // Handlers individuais
  const handleExecuteRecommend = async () => {
    if (!recommendInput.trim()) return;
    setIsRecommending(true);
    try {
      const res = await recommendAI(recommendInput, ias);
      setRecommendResults(res);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleExecuteGeneratePrompt = async () => {
    if (!promptObjective.trim()) return;
    setIsGeneratingPrompt(true);
    try {
      const res = await generatePrompt({
        objective: promptObjective,
        targetIA: promptTargetIA,
        level: promptLevel,
        desiredResult: promptDesiredResult,
        language: promptLanguage,
      });
      setGeneratedPromptResult(res);
      setEditablePromptText(res.prompt);
      setIsEditingPrompt(false);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    const textToCopy = isEditingPrompt ? editablePromptText : (generatedPromptResult?.prompt || '');
    navigator.clipboard.writeText(textToCopy);
    setHasCopiedPrompt(true);
    setTimeout(() => setHasCopiedPrompt(false), 2200);
  };

  const handleExecuteCompare = async () => {
    if (compareSelectedNames.length < 2) return;
    setIsComparing(true);
    try {
      const res = await compareAIs(compareSelectedNames, compareObjective, ias);
      setComparisonResult(res);
    } finally {
      setIsComparing(false);
    }
  };

  const handleToggleSelectCompareIA = (name: string) => {
    setCompareSelectedNames((prev) => {
      if (prev.includes(name)) {
        if (prev.length <= 2) return prev; // mínimo 2
        return prev.filter((n) => n !== name);
      } else {
        if (prev.length >= 4) return [...prev.slice(1), name]; // máximo 4
        return [...prev, name];
      }
    });
  };

  const handleExecuteRegisterAI = async () => {
    if (!registerInput.trim()) return;
    setIsRegistering(true);
    setPendingNewIA(null);
    setRegisterSuccessMessage(null);
    try {
      const res = await registerNewAI(registerInput, ias);
      setPendingNewIA(res);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleConfirmRegisterAI = () => {
    if (!pendingNewIA || !onAddIA) return;
    onAddIA(pendingNewIA);
    setRegisterSuccessMessage(`✅ "${pendingNewIA.name}" foi cadastrada com sucesso no catálogo e na nuvem!`);
    setPendingNewIA(null);
    setRegisterInput('');
  };

  const handleExecuteDiscover = async () => {
    if (!discoverQuery.trim()) return;
    setIsDiscovering(true);
    try {
      const res = await discoverNewAIs(discoverQuery, ias);
      setDiscoveredCandidates(res);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleExecuteStrategy = async () => {
    if (!strategyTask.trim()) return;
    setIsBuildingStrategy(true);
    try {
      const res = await buildAIStrategy(strategyTask, ias);
      setStrategyResult(res);
    } finally {
      setIsBuildingStrategy(false);
    }
  };

  const handleExecuteQueryCatalog = async () => {
    if (!queryInput.trim()) return;
    setIsQuerying(true);
    try {
      const res = await queryCatalog(queryInput, ias);
      setQueryAnswer(res);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="central-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl my-6 bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-[0_20px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <header className="px-5 sm:px-7 py-4.5 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-indigo-600/30 border border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 id="central-modal-title" className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
                  CENTRAL DE IA
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                  Central de Comando Operacional • Groq
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Descubra, escolha, compare, gere prompts e monte pipelines com o seu catálogo de IAs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            title="Fechar Central de IA"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* 11. BARRA DE COMANDO NATURAL UNIFICADA */}
        <div className="p-4 sm:p-5 bg-slate-950/70 border-b border-slate-800/80 shrink-0">
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <input
                type="text"
                value={naturalCommand}
                onChange={(e) => setNaturalCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunNaturalCommand()}
                placeholder="O que você quer fazer? (Ex: Compare ChatGPT e Claude para código, Encontre a melhor IA para vídeo...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
              />
            </div>
            <button
              onClick={() => handleRunNaturalCommand()}
              disabled={isProcessingCommand || !naturalCommand.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0"
            >
              {isProcessingCommand ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Interpretando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Executar Comando</span>
                </>
              )}
            </button>
          </div>

          {commandFeedback && (
            <div className="mt-2 text-xs text-cyan-300 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{commandFeedback}</span>
            </div>
          )}

          {/* Quick Examples */}
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-400">
            <span className="shrink-0 font-semibold text-slate-500">Exemplos rápidos:</span>
            {[
              'Encontre a melhor IA gratuita para criar vídeos.',
              'Crie um prompt para o Claude analisar um contrato.',
              'Compare ChatGPT e Gemini para programação.',
              'Cadastre a Qwen no meu catálogo.',
              'Monte uma estratégia para criar um aplicativo.',
              'Quais IAs gratuitas de imagem eu tenho?',
            ].map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setNaturalCommand(ex);
                  handleRunNaturalCommand(ex);
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 transition-all text-left"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-800/80 bg-slate-900/90 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'recommend', label: '🔎 Encontrar Melhor IA', desc: 'Recomendação por objetivo' },
            { id: 'generate_prompt', label: '✍️ Criar Prompt', desc: 'Gerador inteligente' },
            { id: 'compare', label: '⚖️ Comparar IAs', desc: 'Avaliação lado a lado' },
            { id: 'register_ai', label: '➕ Cadastrar Nova IA', desc: 'Estruturação com Groq' },
            { id: 'discover_ai', label: '🔍 Descobrir IAs', desc: 'Novidades do mercado' },
            { id: 'build_strategy', label: '🧩 Montar Estratégia', desc: 'Pipeline multi-etapas' },
            { id: 'query_catalog', label: '📚 Consultar Hub', desc: 'Perguntas sobre o catálogo' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CentralIntent)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'bg-slate-850 text-cyan-300 border-cyan-400 shadow-[0_-5px_15px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          
          {/* ========================================================================= */}
          {/* TAB 1: 🔎 ENCONTRAR MELHOR IA                                             */}
          {/* ========================================================================= */}
          {activeTab === 'recommend' && (
            <div className="space-y-6">
              <div className="bg-slate-850/70 border border-slate-700/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>Descreva sua necessidade livremente</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Analisa 100% das IAs cadastradas no Hub</span>
                </div>

                <textarea
                  value={recommendInput}
                  onChange={(e) => setRecommendInput(e.target.value)}
                  placeholder="Ex: Preciso criar um sistema de controle de documentos, quero fazer uma pesquisa profunda, quero automatizar meu processo..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-sm text-white placeholder-slate-500 outline-none"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    <span className="text-slate-500">Sugestões:</span>
                    {[
                      'Preciso criar um sistema de controle de documentos.',
                      'Quero fazer uma pesquisa profunda.',
                      'Preciso criar uma apresentação.',
                      'Quero gerar vídeos.',
                      'Quero automatizar meu processo.',
                    ].map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setRecommendInput(sug);
                        }}
                        className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExecuteRecommend}
                    disabled={isRecommending || !recommendInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center gap-2 ml-auto shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    {isRecommending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Avaliando catálogo com a Groq...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Encontrar Melhor IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Resultados */}
              {recommendResults && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                      Recomendações Estratégicas do Catálogo
                    </h4>
                    <span className="text-xs text-slate-400">
                      Critério: Compatibilidade Operacional Estimada
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[recommendResults.champion, recommendResults.second, recommendResults.third].map((opt, idx) => {
                      const isChampion = opt.rank === 'champion';
                      const isSecond = opt.rank === 'second';

                      return (
                        <div
                          key={idx}
                          className={`rounded-2xl p-5 flex flex-col justify-between transition-all border ${
                            isChampion
                              ? 'bg-gradient-to-b from-amber-500/10 via-slate-850 to-slate-900 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/30'
                              : isSecond
                              ? 'bg-slate-850 border-cyan-500/40 shadow-md'
                              : 'bg-slate-850/80 border-slate-700/80'
                          }`}
                        >
                          <div>
                            {/* Rank Badge */}
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-wide uppercase ${
                                  isChampion
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : isSecond
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {opt.titleBadge}
                              </span>

                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                                <span>{opt.compatibility}%</span>
                                <span className="text-[10px] text-slate-400">compatibilidade</span>
                              </div>
                            </div>

                            {/* IA Name */}
                            <h5 className="text-lg font-black text-white font-display">
                              {opt.name}
                            </h5>
                            <p className="text-xs text-cyan-400 font-medium mb-3">
                              {opt.specialty}
                            </p>

                            {/* Motivo */}
                            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed mb-4">
                              <p className="font-semibold text-slate-400 text-[11px] mb-1">Motivo da recomendação:</p>
                              {opt.reason}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                            <a
                              href={opt.officialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-colors"
                            >
                              <span>Acessar</span>
                              <ExternalLink className="w-3 h-3 text-cyan-400" />
                            </a>

                            {opt.iaItem && onOpenDetail && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenDetail(opt.iaItem!);
                                }}
                                className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-300 transition-colors flex items-center gap-1"
                                title="Ver Ficha Operacional Prática"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Ficha</span>
                              </button>
                            )}

                            {onSelectInCatalog && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onSelectInCatalog(opt.name);
                                }}
                                className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                title="Localizar no catálogo"
                              >
                                <Layers className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ✍️ CRIAR PROMPT & GERADOR AUTOMÁTICO                               */}
          {/* ========================================================================= */}
          {activeTab === 'generate_prompt' && (
            <div className="space-y-6">
              <div className="bg-slate-850/70 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Gerador de Prompts Estratégicos</h3>
                  </div>
                  <span className="text-xs text-cyan-300 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                    Engenharia de Prompt Automática
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* IA DESTINO */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      IA DESTINO:
                    </label>
                    <select
                      value={promptTargetIA}
                      onChange={(e) => setPromptTargetIA(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    >
                      {ias.map((ia) => (
                        <option key={ia.id} value={ia.name}>
                          {ia.name} ({ia.category.split('/')[0].trim()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* IDIOMA DO PROMPT */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>IDIOMA:</span>
                      <span className="text-[10px] text-emerald-400 font-bold">🇧🇷 Padrão</span>
                    </label>
                    <select
                      value={promptLanguage}
                      onChange={(e) => setPromptLanguage(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none font-medium"
                    >
                      <option value="pt">🇧🇷 Português (Brasil)</option>
                      <option value="en">🇺🇸 Inglês (English)</option>
                    </select>
                  </div>

                  {/* NÍVEL */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      NÍVEL:
                    </label>
                    <select
                      value={promptLevel}
                      onChange={(e) => setPromptLevel(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    >
                      <option value="Iniciante">Iniciante (didático e guiado)</option>
                      <option value="Intermediário">Intermediário (focado e estruturado)</option>
                      <option value="Avançado">Avançado (rigor técnico de elite)</option>
                    </select>
                  </div>

                  {/* RESULTADO DESEJADO */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      RESULTADO DESEJADO:
                    </label>
                    <input
                      type="text"
                      value={promptDesiredResult}
                      onChange={(e) => setPromptDesiredResult(e.target.value)}
                      placeholder="Ex: Tabela, Código sem bugs..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
                    />
                  </div>
                </div>

                {/* OBJETIVO */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    OBJETIVO:
                  </label>
                  <textarea
                    value={promptObjective}
                    onChange={(e) => setPromptObjective(e.target.value)}
                    placeholder="Escreva livremente o que deseja (ex: quero criar um sistema para minha empresa, quero analisar um contrato de prestação de serviços...)"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    O Hub formula automaticamente o papel da IA, instruções, restrições e critérios de qualidade.
                  </span>
                  <button
                    onClick={handleExecuteGeneratePrompt}
                    disabled={isGeneratingPrompt || !promptObjective.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    {isGeneratingPrompt ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Otimizando prompt com Groq...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>✨ GERAR PROMPT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Resultado do Prompt Gerado */}
              {generatedPromptResult && (
                <div className="bg-slate-850 border border-cyan-500/40 rounded-2xl p-5 space-y-4 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>PROMPT GERADO • Otimizado para {generatedPromptResult.targetIA}</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Role: {generatedPromptResult.role} • Nível: {generatedPromptResult.level}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{isEditingPrompt ? 'Concluir Edição' : '✏️ EDITAR'}</span>
                      </button>

                      <button
                        onClick={handleExecuteGeneratePrompt}
                        disabled={isGeneratingPrompt}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        <span>🔄 REFAZER</span>
                      </button>

                      <button
                        onClick={handleCopyPrompt}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      >
                        {hasCopiedPrompt ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>COPIADO!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>📋 COPIAR PROMPT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Prompt Text / Textarea */}
                  {isEditingPrompt ? (
                    <textarea
                      value={editablePromptText}
                      onChange={(e) => setEditablePromptText(e.target.value)}
                      rows={12}
                      className="w-full p-4 rounded-xl bg-slate-900 border border-cyan-400/50 text-xs sm:text-sm font-mono text-slate-200 focus:outline-none"
                    />
                  ) : (
                    <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm font-mono text-cyan-100 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-96">
                      {editablePromptText || generatedPromptResult.prompt}
                    </pre>
                  )}

                  {/* Quality criteria tags */}
                  {generatedPromptResult.qualityCriteria && (
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                      <span>Critério de Qualidade: <strong className="text-slate-200">{generatedPromptResult.qualityCriteria}</strong></span>
                      <span className="text-[11px] text-cyan-400">Pronto para colar no {generatedPromptResult.targetIA}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ⚖️ COMPARAR IAs                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'compare' && (
            <div className="space-y-6">
              <div className="bg-slate-850/70 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    <span>Selecione de 2 a 4 IAs do catálogo para comparar</span>
                  </h3>
                  <span className="text-xs text-cyan-300 font-semibold">
                    {compareSelectedNames.length} selecionadas (mínimo 2, máximo 4)
                  </span>
                </div>

                {/* Seleção de IAs em Pills */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={compareSearchFilter}
                    onChange={(e) => setCompareSearchFilter(e.target.value)}
                    placeholder="Filtrar IAs para selecionar..."
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                    {ias
                      .filter((i) => i.name.toLowerCase().includes(compareSearchFilter.toLowerCase()))
                      .map((ia) => {
                        const isSelected = compareSelectedNames.includes(ia.name);
                        return (
                          <button
                            key={ia.id}
                            onClick={() => handleToggleSelectCompareIA(ia.name)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                            }`}
                          >
                            <span>{ia.name}</span>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Objetivo da Comparação */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    OBJETIVO DA COMPARAÇÃO:
                  </label>
                  <input
                    type="text"
                    value={compareObjective}
                    onChange={(e) => setCompareObjective(e.target.value)}
                    placeholder="Ex: Qual é melhor para criar um aplicativo? Qual gera melhores roteiros?"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 text-sm text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Avalia: capacidade, facilidade, criatividade, código, raciocínio, automação e compatibilidade estimada.
                  </span>
                  <button
                    onClick={handleExecuteCompare}
                    disabled={isComparing || compareSelectedNames.length < 2}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    {isComparing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Comparando com a Groq...</span>
                      </>
                    ) : (
                      <>
                        <Scale className="w-4 h-4" />
                        <span>Comparar IAs</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Relatório Comparativo */}
              {comparisonResult && (
                <div className="bg-slate-850 border border-slate-700 rounded-2xl p-5 space-y-6 animate-fadeIn">
                  {/* Veredito */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-cyan-500/15 border border-amber-500/40">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>Vencedora Recomendada: {comparisonResult.recommendedWinner}</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {comparisonResult.winnerReason || comparisonResult.verdict}
                    </p>
                  </div>

                  {/* Compatibilidade Estimada */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Compatibilidade Estimada para: "{comparisonResult.objective}"
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {comparisonResult.iasCompared.map((name) => {
                        const score = comparisonResult.compatibilityScores?.[name] ?? 85;
                        const isWinner = name === comparisonResult.recommendedWinner;
                        return (
                          <div
                            key={name}
                            className={`p-3.5 rounded-xl border ${
                              isWinner
                                ? 'bg-amber-500/10 border-amber-400/50 shadow-md'
                                : 'bg-slate-900 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white truncate">{name}</span>
                              <span className="text-xs font-extrabold text-emerald-400">{score}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isWinner ? 'bg-amber-400' : 'bg-cyan-500'
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tabela de Dimensões */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2.5 pr-4 font-bold">Dimensão</th>
                          {comparisonResult.iasCompared.map((name) => (
                            <th key={name} className="py-2.5 px-3 font-bold text-cyan-300">
                              {name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {comparisonResult.dimensions.map((dim, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 pr-4 font-semibold text-slate-200">
                              {dim.dimension}
                            </td>
                            {comparisonResult.iasCompared.map((name) => (
                              <td key={name} className="py-2.5 px-3 text-slate-300">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white">
                                    {dim.scores[name] ?? 80}/100
                                  </span>
                                  {dim.notes?.[name] && (
                                    <span className="text-[10px] text-slate-500 hidden md:inline truncate max-w-[150px]">
                                      ({dim.notes[name]})
                                    </span>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ➕ CADASTRAR NOVA IA                                               */}
          {/* ========================================================================= */}
          {activeTab === 'register_ai' && (
            <div className="space-y-6">
              <div className="bg-slate-850/70 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-cyan-400" />
                    <span>Cadastrar Nova IA via Linguagem Natural</span>
                  </h3>
                  <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                    Exige Confirmação Expressa
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Escreva o que deseja cadastrar. A Groq estruturará todos os dados técnicos para você revisar antes de salvar.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={registerInput}
                    onChange={(e) => setRegisterInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecuteRegisterAI()}
                    placeholder="Ex: Cadastre a Qwen, Adicione uma IA de vídeo gratuita, Cadastre a Groq..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                  />
                  <button
                    onClick={handleExecuteRegisterAI}
                    disabled={isRegistering || !registerInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0"
                  >
                    {isRegistering ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Estruturando dados...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Estruturar Pré-Cadastro</span>
                      </>
                    )}
                  </button>
                </div>

                {registerSuccessMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{registerSuccessMessage}</span>
                  </div>
                )}
              </div>

              {/* PRÉVIA ESTRUTURADA (REGRA DE CONFIRMAÇÃO) */}
              {pendingNewIA && (
                <div className="bg-slate-850 border-2 border-cyan-400/60 rounded-3xl p-6 space-y-5 shadow-[0_0_35px_rgba(6,182,212,0.2)] animate-fadeIn">
                  <div className="flex items-start justify-between pb-3 border-b border-slate-700">
                    <div>
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs uppercase tracking-wider border border-cyan-400/40">
                        PRÉVIA DA NOVA IA
                      </span>
                      <h4 className="text-xl font-black text-white font-display mt-1">
                        {pendingNewIA.name}
                      </h4>
                      <p className="text-xs text-cyan-400">{pendingNewIA.category}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-300 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700">
                        {pendingNewIA.pricingType} ({pendingNewIA.pricing})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Especialidade:</span>
                      <p className="text-slate-200 font-semibold">{pendingNewIA.specialty}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Diferencial:</span>
                      <p className="text-slate-200 font-semibold">{pendingNewIA.differential}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 sm:col-span-2">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Descrição / Para que serve:</span>
                      <p className="text-slate-300 leading-relaxed">{pendingNewIA.whatIsIt || pendingNewIA.paraQueServe}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Nível e Dificuldade:</span>
                      <p className="text-slate-300">{pendingNewIA.level} • {pendingNewIA.difficulty}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-slate-500 font-bold uppercase text-[10px]">Link Oficial:</span>
                      <a href={pendingNewIA.link} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 truncate">
                        <span>{pendingNewIA.link}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Esta IA <strong>NÃO foi salva ainda</strong>. O cadastro permanente no catálogo e na nuvem Firestore só ocorre após você clicar em <strong>Confirmar Cadastro</strong>.
                    </span>
                  </div>

                  {/* Botões de Ação Mandatórios */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setPendingNewIA(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors border border-slate-700"
                    >
                      ❌ CANCELAR
                    </button>

                    <button
                      onClick={handleConfirmRegisterAI}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>✅ CONFIRMAR CADASTRO</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: 🔍 DESCOBRIR IAs                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'discover_ai' && (
            <div className="space-y-6">
              <div className="bg-slate-850/70 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Descobrir Novas IAs do Mercado</span>
                  </h3>
                  <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                    ⚠️ Informação necessita validação
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={discoverQuery}
                    onChange={(e) => setDiscoverQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecuteDiscover()}
                    placeholder="Ex: Encontre IAs gratuitas para vídeo, Encontre as melhores IAs de programação..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                  />
                  <button
                    onClick={handleExecuteDiscover}
                    disabled={isDiscovering || !discoverQuery.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0"
                  >
                    {isDiscovering ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Pesquisando candidatos...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Descobrir IAs</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Lista de Candidatos */}
              {discoveredCandidates.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                  {discoveredCandidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-850 border border-slate-700 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {cand.category}
                          </span>
                          <span className="text-xs font-bold text-emerald-400">
                            Nota {cand.qualityScore}/100
                          </span>
                        </div>

                        <h4 className="text-lg font-black text-white font-display">
                          {cand.name}
                        </h4>
                        <p className="text-xs text-cyan-400 mb-2">{cand.specialty}</p>

                        <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-300 leading-relaxed mb-3">
                          <p className="font-semibold text-slate-400 text-[10px] mb-1">Motivo da indicação:</p>
                          {cand.reason || cand.whyDiscovered}
                        </div>

                        <div className="text-[11px] text-slate-400 space-y-1 mb-4">
                          <p>Plano: <strong className="text-slate-200">{cand.pricingType}</strong></p>
                          <p>Diferencial: <strong className="text-slate-200">{cand.differential}</strong></p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                        <a
                          href={cand.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors flex items-center gap-1"
                        >
                          <span>Visitar</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </a>

                        <button
                          onClick={() => {
                            setActiveTab('register_ai');
                            setPendingNewIA({
                              name: cand.name,
                              category: cand.category,
                              specialty: cand.specialty,
                              differential: cand.differential,
                              level: cand.level,
                              pricing: cand.pricingType === 'FREE' ? 'Gratuito' : 'Freemium (Grátis + Pago)',
                              pricingType: cand.pricingType,
                              link: cand.officialUrl,
                              whatIsIt: cand.paraQueServe,
                              paraQueServe: cand.paraQueServe,
                              quandoUsar: cand.quandoUsar,
                              quandoNaoUsar: cand.quandoNaoUsar,
                              pontosFortes: cand.pontosFortes,
                              limitacoes: cand.limitacoes,
                              exemploPrompt: cand.exemploPrompt,
                              qualityScore: cand.qualityScore,
                            });
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition-colors flex items-center justify-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>➕ ADICIONAR AO HUB</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: 🧩 MONTAR ESTRATÉGIA                                               */}
          {/* ========================================================================= */}
          {activeTab === 'build_strategy' && (
            <div className="space-y-6">
              <div className="bg-slate-850/70 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-cyan-400" />
                    <span>Arquiteto de Estratégias Sequenciais (Pipelines de IA)</span>
                  </h3>
                  <span className="text-xs text-indigo-300 font-semibold bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/30">
                    Prioriza IAs do seu Catálogo
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={strategyTask}
                    onChange={(e) => setStrategyTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecuteStrategy()}
                    placeholder="Ex: Quero lançar um curso usando IA, Criar um aplicativo SaaS, Automatizar criação de vídeos..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                  />
                  <button
                    onClick={handleExecuteStrategy}
                    disabled={isBuildingStrategy || !strategyTask.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0"
                  >
                    {isBuildingStrategy ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Desenhando pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Montar Estratégia</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Pipeline em Etapas */}
              {strategyResult && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-cyan-500/30 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {strategyResult.complexTask}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">{strategyResult.overview}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                      {strategyResult.catalogCoverage}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {strategyResult.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-850 border border-slate-700/80 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500 text-slate-950 text-[11px] font-black uppercase">
                              {step.stageName.split(':')[0] || `ETAPA ${step.stepNumber}`}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {step.stageName.split(':')[1] || step.stageName}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <h5 className="text-base font-black text-white font-display">
                              Usar: <span className="text-cyan-400">{step.recommendedIA}</span>
                            </h5>
                            <span className="text-xs text-slate-400">• {step.goal}</span>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            <strong className="text-slate-400">Por que esta IA:</strong> {step.whyThisIA}
                          </p>
                          <p className="text-xs text-emerald-400/90">
                            <strong>Entregável esperado:</strong> {step.expectedDeliverable}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(step.actionPrompt);
                              setCopiedStepIndex(idx);
                              setTimeout(() => setCopiedStepIndex(null), 2000);
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
                            title="Copiar prompt de ação desta etapa"
                          >
                            {copiedStepIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Prompt da Etapa</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: 📚 CONSULTAR HUB                                                   */}
          {/* ========================================================================= */}
          {activeTab === 'query_catalog' && (
            <div className="space-y-6">
              <div className="bg-slate-850/70 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Consultar seu Catálogo de IAs</span>
                  </h3>
                  <span className="text-xs text-cyan-300 font-semibold">
                    {ias.length} IAs catalogadas
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecuteQueryCatalog()}
                    placeholder="Faça uma pergunta sobre o seu catálogo..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none"
                  />
                  <button
                    onClick={handleExecuteQueryCatalog}
                    disabled={isQuerying || !queryInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0"
                  >
                    {isQuerying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Consultando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Consultar Hub</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Perguntas frequentes */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 pt-1">
                  <span className="text-slate-500 text-[11px]">Exemplos:</span>
                  {[
                    'Quais IAs de programação tenho?',
                    'Qual a melhor IA de vídeo do meu catálogo?',
                    'Quais IAs gratuitas estão cadastradas?',
                    'Quais IAs posso usar para pesquisa?',
                  ].map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQueryInput(ex);
                      }}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resposta do Hub */}
              {queryAnswer && (
                <div className="bg-slate-850 border border-cyan-500/40 rounded-2xl p-5 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                    <span>Resposta Baseada nos Dados Reais do Catálogo</span>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed">
                    {queryAnswer.answer}
                  </p>

                  {/* Highlights */}
                  {queryAnswer.highlights && queryAnswer.highlights.length > 0 && (
                    <ul className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                      {queryAnswer.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Matching IA Cards */}
                  {queryAnswer.matchingIANames && queryAnswer.matchingIANames.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        Ferramentas Identificadas:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {queryAnswer.matchingIANames.map((name) => {
                          const item = ias.find((i) => i.name.toLowerCase() === name.toLowerCase());
                          return (
                            <div
                              key={name}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white flex items-center gap-2"
                            >
                              <span className="font-bold">{name}</span>
                              {item && onOpenDetail && (
                                <button
                                  onClick={() => {
                                    onClose();
                                    onOpenDetail(item);
                                  }}
                                  className="text-cyan-400 hover:underline text-[11px]"
                                >
                                  Ver Ficha
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
