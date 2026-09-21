import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Zap,
  TrendingUp,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  Sparkles,
  BookOpen,
  Sliders,
} from 'lucide-react';
import {
  IdeaItem,
  StudyItem,
  OperationalExecutionRecord,
  StructuredAssistantContext,
  UserAdaptiveProfile,
  AIExperienceLevel,
  ExplanationDepth,
  PreferredInteractionStyle,
  ProactivityLevel,
} from '../../types';
import {
  getExecutionRecords,
  deleteExecutionRecord,
} from '../../services/assistant/memoryManager';
import { calculateOperationalMetrics } from '../../services/assistant/metricsManager';
import { getUserAdaptiveProfile, saveUserAdaptiveProfile } from '../../services/authService';

interface AssistantMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext?: StructuredAssistantContext | null;
  ideas: IdeaItem[];
  studies: StudyItem[];
  onOpenIdeaDetail?: (idea: IdeaItem) => void;
}

export const AssistantMemoryModal: React.FC<AssistantMemoryModalProps> = ({
  isOpen,
  onClose,
  currentContext,
  ideas,
  studies,
  onOpenIdeaDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'active_context' | 'history' | 'metrics' | 'adaptive_profile'>('active_context');
  const [records, setRecords] = useState<OperationalExecutionRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'SIMULATION' | 'REAL'>('ALL');
  const [adaptiveProfile, setAdaptiveProfile] = useState<UserAdaptiveProfile | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadHistory = async () => {
    setLoadingRecords(true);
    try {
      const [data, profile] = await Promise.all([
        getExecutionRecords(),
        getUserAdaptiveProfile(),
      ]);
      setRecords(data);
      setAdaptiveProfile(profile);
    } catch (err) {
      console.warn('[AssistantMemoryModal] Erro ao carregar histórico:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleUpdateExperience = async (level: AIExperienceLevel) => {
    setSavingProfile(true);
    try {
      const updated = await saveUserAdaptiveProfile({
        aiExperienceLevel: level,
        explanationDepth: level === 'INICIANTE' ? 'detalhada' : level === 'AVANÇADO' ? 'objetiva' : 'equilibrada',
        preferredInteractionStyle: level === 'INICIANTE' ? 'orientador' : level === 'AVANÇADO' ? 'direto' : 'estrategico',
        proactivityLevel: level === 'INICIANTE' ? 'alto' : level === 'AVANÇADO' ? 'baixo' : 'equilibrado',
        lastExplicitAdjustment: `Atualizado no painel de memória para ${level}`,
      });
      setAdaptiveProfile(updated);
    } catch (err) {
      console.error('Erro ao atualizar perfil adaptativo:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Deseja excluir este registro da memória operacional do Assistente?')) return;
    try {
      await deleteExecutionRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert('Erro ao excluir registro de memória.');
    }
  };

  if (!isOpen) return null;

  const metrics = calculateOperationalMetrics(records);
  const filteredRecords = records.filter((r) => {
    if (filterType === 'SIMULATION') return r.isSimulation;
    if (filterType === 'REAL') return !r.isSimulation;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Topo */}
        <div className="p-4 sm:p-5 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Memória Operacional do Assistente
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                  Firestore Persistente
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Controle de dados, auditoria de contexto, histórico de execuções e métricas de ROI
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

        {/* Abas */}
        <div className="px-4 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveTab('active_context')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'active_context'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🎯 Contexto Ativo em Memória
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📜 Histórico de Execuções ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'metrics'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Métricas & ROI Operacional
          </button>
          <button
            onClick={() => setActiveTab('adaptive_profile')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'adaptive_profile'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👤 Perfil Adaptativo de IA</span>
            {adaptiveProfile?.aiExperienceLevel && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                {adaptiveProfile.aiExperienceLevel}
              </span>
            )}
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs text-slate-300 custom-scrollbar">
          {/* ABA 1: CONTEXTO ATIVO */}
          {activeTab === 'active_context' && (
            <div className="space-y-4">
              {currentContext?.projectId ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
                      Projeto Vinculado à Memória
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-700/40 font-mono text-[10px]">
                      {currentContext.currentVersion || 'V1'} • {currentContext.currentStage}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">
                    {currentContext.projectTitle}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {currentContext.objective || currentContext.projectDescription}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <strong className="text-slate-400 block mb-1">Última Evolução:</strong>
                      <span className="text-slate-200">{currentContext.lastEvolution || 'Nenhuma'}</span>
                    </div>
                    <div>
                      <strong className="text-slate-400 block mb-1">Gargalos / Problemas:</strong>
                      <span className="text-rose-300">{currentContext.currentProblems.join('; ') || 'Nenhum crítico registrado'}</span>
                    </div>
                  </div>

                  {currentContext.relatedStudies.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <strong className="text-slate-400 block mb-1">Estudos Relacionados:</strong>
                      <div className="flex flex-wrap gap-1.5">
                        {currentContext.relatedStudies.map((s) => (
                          <span key={s.id} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                            {s.theme} ({s.progress}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                  <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p>Nenhum projeto específico ancorado na memória da sessão atual.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mencione um projeto (ex: "Quero melhorar meu Auditor SST") para ativar o contexto automaticamente.
                  </p>
                </div>
              )}

              {/* Lista de projetos disponíveis para ancorar */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-200">Projetos Disponíveis no HUB:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ideas.map((idea) => (
                    <div
                      key={idea.id}
                      onClick={() => onOpenIdeaDetail && onOpenIdeaDetail(idea)}
                      className="p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{idea.title}</div>
                        <div className="text-[11px] text-slate-400">{idea.category} • {idea.currentVersion || 'V1'}</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: HISTÓRICO DE EXECUÇÕES */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${
                      filterType === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Todas ({records.length})
                  </button>
                  <button
                    onClick={() => setFilterType('REAL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${
                      filterType === 'REAL' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Execuções Reais
                  </button>
                  <button
                    onClick={() => setFilterType('SIMULATION')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${
                      filterType === 'SIMULATION' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    🧪 Simulações
                  </button>
                </div>

                <button
                  onClick={loadHistory}
                  disabled={loadingRecords}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  title="Recarregar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingRecords ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                  Nenhuma execução gravada no histórico.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {rec.isSimulation ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-[10px]">
                              🧪 SIMULAÇÃO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                              EXECUÇÃO REAL
                            </span>
                          )}
                          <span className="font-bold text-white">{rec.taskTitle}</span>
                          {rec.projectTitle && (
                            <span className="text-[10px] text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded">
                              {rec.projectTitle}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteRecord(rec.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Excluir este registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-4">
                        <span>Modelo: {rec.modelUsed}</span>
                        <span>Duração: {rec.durationMs}ms</span>
                        <span>Status: <strong className="text-slate-200">{rec.status}</strong></span>
                        <span>{new Date(rec.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="p-2 bg-black/40 rounded-lg text-[11px] font-mono text-slate-300 max-h-24 overflow-y-auto whitespace-pre-wrap">
                        {rec.result}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: MÉTRICAS & ROI */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Tarefas Registradas
                  </span>
                  <span className="text-lg font-bold text-white">{metrics.totalExecutions}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Simulações Groq
                  </span>
                  <span className="text-lg font-bold text-amber-400">{metrics.totalSimulations}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Tempo Economizado
                  </span>
                  <span className="text-lg font-bold text-emerald-400">
                    {(metrics.totalTimeSavedMinutes / 60).toFixed(1)}h
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Taxa de Validação
                  </span>
                  <span className="text-lg font-bold text-cyan-400">
                    {metrics.totalExecutions > 0
                      ? `${Math.round((metrics.validatedCount / metrics.totalExecutions) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>

              {/* Box de ROI com a regra rígida de não inventar dados */}
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Retorno sobre Investimento (ROI)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Fórmula: ((Benefício - Inv) / Inv) × 100
                  </span>
                </div>

                {metrics.roiCalculation.canCalculate ? (
                  <div className="space-y-1">
                    <div className="text-2xl font-black text-emerald-400">
                      +{metrics.roiCalculation.roiPercentage}% ROI
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      {metrics.roiCalculation.explanation}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    {metrics.roiCalculation.explanation}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA 4: PERFIL ADAPTATIVO DE IA */}
          {activeTab === 'adaptive_profile' && (
            <div className="space-y-4">
              {/* Princípio de Conduta */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-cyan-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Princípio Fundamental de Personalização
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                    Dinâmico & Não-Rígido
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  A Central de IA não apenas ajusta o que diz, mas <strong>como participa</strong>: calibra quanto explica, quando pergunta, quando sugere, quando ensina, quando se aprofunda, quando fica em silêncio e quanta autonomia operacional assume.
                </p>
              </div>

              {/* Seletor dos 3 Níveis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                    Nível de Experiência Declarado com IA
                  </span>
                  {savingProfile && (
                    <span className="text-[10px] text-cyan-400 animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Salvando perfil...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {/* INICIANTE */}
                  <button
                    onClick={() => handleUpdateExperience('INICIANTE')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      adaptiveProfile?.aiExperienceLevel === 'INICIANTE'
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs flex items-center gap-1">
                        🌱 INICIANTE
                      </span>
                      {adaptiveProfile?.aiExperienceLevel === 'INICIANTE' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mb-2">
                      Estou começando e quero orientação mais detalhada.
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                      <div>• Explica conceitos antes de jargões</div>
                      <div>• Ensina o passo a passo enquanto executa</div>
                      <div>• Sugere próximos passos e antecipa dúvidas</div>
                      <div>• Acompanhamento acolhedor e próximo</div>
                    </div>
                  </button>

                  {/* INTERMEDIÁRIO */}
                  <button
                    onClick={() => handleUpdateExperience('INTERMEDIÁRIO')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      adaptiveProfile?.aiExperienceLevel === 'INTERMEDIÁRIO'
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs flex items-center gap-1">
                        ⚡ INTERMEDIÁRIO
                      </span>
                      {adaptiveProfile?.aiExperienceLevel === 'INTERMEDIÁRIO' && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mb-2">
                      Já utilizo IAs e conheço os principais conceitos.
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                      <div>• Equilíbrio entre ação e fundamentação</div>
                      <div>• Aprofundamento sob sua demanda</div>
                      <div>• Trade-offs e alternativas de ferramentas</div>
                      <div>• Autonomia em operações autorizadas</div>
                    </div>
                  </button>

                  {/* AVANÇADO */}
                  <button
                    onClick={() => handleUpdateExperience('AVANÇADO')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      adaptiveProfile?.aiExperienceLevel === 'AVANÇADO'
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs flex items-center gap-1">
                        🚀 AVANÇADO
                      </span>
                      {adaptiveProfile?.aiExperienceLevel === 'AVANÇADO' && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mb-2">
                      Tenho experiência com IA, APIs e automações e prefiro interação direta.
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                      <div>• Alta densidade técnica e máxima objetividade</div>
                      <div>• Zero explicações conceituais básicas</div>
                      <div>• Arquitetura, contexto, pipelines e latência</div>
                      <div>• Maior autonomia em tarefas de baixo risco</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Detalhes de Calibração Ativa */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Calibração da Participação do Assistente
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="block text-[10px] text-slate-500 uppercase">Profundidade</span>
                    <span className="text-xs font-bold text-slate-200 capitalize">
                      {adaptiveProfile?.explanationDepth || 'Equilibrada'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="block text-[10px] text-slate-500 uppercase">Estilo de Conduta</span>
                    <span className="text-xs font-bold text-slate-200 capitalize">
                      {adaptiveProfile?.preferredInteractionStyle || 'Estratégico'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="block text-[10px] text-slate-500 uppercase">Proatividade</span>
                    <span className="text-xs font-bold text-slate-200 capitalize">
                      {adaptiveProfile?.proactivityLevel || 'Equilibrado'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="block text-[10px] text-slate-500 uppercase">Persistência</span>
                    <span className="text-xs font-bold text-emerald-400">
                      Perfil Existente
                    </span>
                  </div>
                </div>

                {adaptiveProfile?.lastExplicitAdjustment && (
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span><strong>Último ajuste dinâmico:</strong> {adaptiveProfile.lastExplicitAdjustment}</span>
                    <span className="text-[10px] font-mono text-cyan-400">Em vigor</span>
                  </div>
                )}

                <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-800/40 text-[11px] text-slate-300 flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Adaptação contínua na conversa:</strong> Você também pode calibrar em tempo real no chat falando frases como <em>"Explique como se eu fosse iniciante"</em>, <em>"Não precisa explicar tanto"</em> ou <em>"Quero entender por que você fez isso"</em>. A sua preferência mais recente sempre prevalecerá.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-850 border-t border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Memória estruturada com controle total do usuário</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
