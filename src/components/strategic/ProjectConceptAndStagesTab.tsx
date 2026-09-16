import React, { useState, useEffect } from 'react';
import {
  IdeaItem,
  ProjectStagePrompt,
  ProjectRevision,
  IAItem,
} from '../../types';
import {
  requestInfiniteProjectRevisionWithAI,
  executeStagePromptWithAI,
  generateDefaultStagesWithPrompts,
} from '../../services/aiCoCreationService';
import {
  getProjectRevisionsFromFirestore,
  subscribeToProjectRevisions,
} from '../../services/strategicMemoryService';
import {
  Layers,
  Sparkles,
  Play,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Target,
  Workflow,
  ShieldCheck,
  FileCode2,
  ChevronDown,
  ChevronUp,
  History,
  Send,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ProjectConceptAndStagesTabProps {
  idea: IdeaItem;
  catalog: IAItem[];
  onUpdateIdea: (updated: IdeaItem) => void;
  onSelectInCatalog?: (toolName: string) => void;
}

export const ProjectConceptAndStagesTab: React.FC<ProjectConceptAndStagesTabProps> = ({
  idea,
  catalog,
  onUpdateIdea,
  onSelectInCatalog,
}) => {
  // Estado das etapas
  const stages: ProjectStagePrompt[] =
    idea.stages && idea.stages.length > 0
      ? idea.stages
      : generateDefaultStagesWithPrompts(idea.title, idea.relatedTechnologies || []);

  const [expandedStageId, setExpandedStageId] = useState<string | null>(stages[0]?.id || null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  // Execução de prompt com IA
  const [executingStageId, setExecutingStageId] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    stageId: string;
    stageTitle: string;
    outputType: string;
    resultContent: string;
    executionSummary: string;
    nextSuggestedAction: string;
  } | null>(null);

  // Revisões Infinitas
  const [revisions, setRevisions] = useState<ProjectRevision[]>([]);
  const [revisionPrompt, setRevisionPrompt] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState<string | null>(null);
  const [expandedRevisionId, setExpandedRevisionId] = useState<string | null>(null);

  // Escuta revisões em tempo real do Firestore
  useEffect(() => {
    if (!idea.id) return;
    const unsub = subscribeToProjectRevisions(idea.id, (revs) => {
      setRevisions(revs);
    });
    return () => unsub();
  }, [idea.id]);

  // Copiar prompt para clipboard
  const handleCopyPrompt = async (stageId: string, promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPromptId(stageId);
      setTimeout(() => setCopiedPromptId(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar prompt:', err);
    }
  };

  // Executar prompt de uma etapa com a IA
  const handleExecutePrompt = async (stage: ProjectStagePrompt) => {
    setExecutingStageId(stage.id);
    setExecutionResult(null);

    try {
      const result = await executeStagePromptWithAI({
        projectTitle: idea.title,
        stageTitle: stage.title,
        prompt: stage.prompt,
        executionContext: `Conceito: ${idea.concept?.summary || idea.description}. Tecnologias: ${(idea.relatedTechnologies || []).join(', ')}`,
      });

      setExecutionResult({
        stageId: stage.id,
        stageTitle: stage.title,
        outputType: result.outputType,
        resultContent: result.resultContent,
        executionSummary: result.executionSummary,
        nextSuggestedAction: result.nextSuggestedAction,
      });

      // Atualiza status da etapa para Concluído ou Em Andamento se necessário
      const updatedStages = stages.map((s) =>
        s.id === stage.id ? { ...s, status: 'Concluído' as const } : s
      );
      onUpdateIdea({ ...idea, stages: updatedStages });
    } catch (err) {
      console.error('Erro ao executar prompt:', err);
    } finally {
      setExecutingStageId(null);
    }
  };

  // Solicitar Revisão Infinita com a IA
  const handleRequestRevision = async () => {
    if (!revisionPrompt.trim() || isRevising) return;

    setIsRevising(true);
    setRevisionFeedback(null);

    try {
      const result = await requestInfiniteProjectRevisionWithAI({
        idea,
        userRequest: revisionPrompt.trim(),
        catalog,
      });

      onUpdateIdea(result.updatedIdea);
      setRevisionFeedback(
        `Revisão #${result.revision.revisionNumber} aplicada e atrelada com sucesso ao Firestore!`
      );
      setRevisionPrompt('');
      setTimeout(() => setRevisionFeedback(null), 5000);
    } catch (err) {
      console.error('Erro ao solicitar revisão:', err);
      setRevisionFeedback('Ocorreu um erro ao processar a revisão. Tente novamente.');
    } finally {
      setIsRevising(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. SEÇÃO CONCEITO & APLICAÇÃO PRÁTICA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bloco de Conceito */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Conceito & Tese de Valor
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
              Estratégico
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block mb-0.5">Resumo Conceitual:</span>
              <p className="text-slate-200 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                {idea.concept?.summary || idea.description || 'Conceito em fase de refinamento.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-bold text-[11px] block">Proposta de Valor:</span>
                <p className="text-slate-300 text-[11px] leading-snug">
                  {idea.concept?.coreValue || idea.objective || 'Resolução da dor central identificada.'}
                </p>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-indigo-400 font-bold text-[11px] block">Mecânica de Execução:</span>
                <p className="text-slate-300 text-[11px] leading-snug">
                  {idea.concept?.mechanics || 'Pipeline automatizado e rastreável.'}
                </p>
              </div>
            </div>

            {idea.concept?.marketFit && (
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-bold text-[11px] block mb-0.5">Diferencial & Market Fit:</span>
                <p className="text-slate-300 text-[11px] leading-snug">
                  {idea.concept.marketFit}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bloco de Aplicação Prática */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-indigo-400" />
              Aplicação Prática no Mundo Real
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
              Operacional
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Casos de uso */}
            <div>
              <span className="text-slate-400 font-semibold block mb-1">Casos de Uso Reais:</span>
              <ul className="space-y-1.5">
                {(idea.application?.realWorldUseCases || [
                  'Aplicação em rotinas operacionais diárias',
                  'Auditoria contínua e redução de inconformidades',
                ]).map((useCase, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-slate-300 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80"
                  >
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Regras e Arquitetura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Regras de Negócio:
                </span>
                <ul className="text-slate-300 text-[11px] space-y-1">
                  {(idea.application?.businessRules || ['Integridade prévia de dados']).slice(0, 2).map((rule, idx) => (
                    <li key={idx} className="truncate">• {rule}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-cyan-400 font-bold text-[11px] flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5" /> Arquitetura:
                </span>
                <p className="text-slate-300 text-[11px] line-clamp-3">
                  {idea.application?.architecture || 'Arquitetura modular em nuvem com agentes de IA.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ETAPAS SEQUENCIAIS COM PROMPTS PRONTOS */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              Esteira de Execução: Cada Etapa com seu Prompt de IA
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Copie o prompt pronto para usar em qualquer IA ou execute aqui mesmo com a IA do Hub.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total de Etapas:</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
              {stages.length}
            </span>
          </div>
        </div>

        {/* Lista de Etapas */}
        <div className="space-y-3">
          {stages.map((stage) => {
            const isExpanded = expandedStageId === stage.id;
            const isExecuting = executingStageId === stage.id;
            const isCopied = copiedPromptId === stage.id;

            return (
              <div
                key={stage.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'bg-slate-950/90 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header da Etapa */}
                <div
                  onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {stage.order}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">
                          {stage.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                          {stage.phase}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            stage.status === 'Concluído'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : stage.status === 'Em Andamento'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {stage.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {stage.objective}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyPrompt(stage.id, stage.prompt);
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Copiar Prompt da Etapa"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isExecuting}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecutePrompt(stage);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                      title="Executar este Prompt agora com IA"
                    >
                      {isExecuting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span className="hidden sm:inline">Executar com IA</span>
                    </button>

                    <div className="text-slate-400 pl-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expandido do Prompt */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="space-y-1">
                        <span className="text-slate-400 font-semibold">Entregável Esperado:</span>
                        <p className="text-slate-200 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                          {stage.deliverable || 'Artefato técnico ou funcional pronto para validação.'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400 font-semibold">IAs & Ferramentas Recomendadas:</span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(stage.recommendedTools || ['Claude 3.5 Sonnet', 'Cursor']).map((tool, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onSelectInCatalog && onSelectInCatalog(tool)}
                              className="text-[11px] px-2.5 py-1 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-medium hover:border-indigo-400 transition-colors flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-indigo-400" />
                              {tool}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Caixa com o Prompt Textual Completo */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                          <FileCode2 className="w-3.5 h-3.5" /> Prompt Formatado para o LLM
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPrompt(stage.id, stage.prompt)}
                          className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Prompt Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Prompt Completo</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/70 border border-slate-800 text-xs font-mono text-cyan-200/90 whitespace-pre-wrap leading-relaxed select-all">
                        {stage.prompt}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PAINEL DE RESULTADO DE EXECUÇÃO DE PROMPT (Se houver) */}
      {executionResult && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/40 space-y-3 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Entrega Gerada pela IA: {executionResult.stageTitle}
                </h4>
                <p className="text-xs text-slate-400">
                  {executionResult.executionSummary}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExecutionResult(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Fechar
            </button>
          </div>

          <div className="p-4 rounded-xl bg-black/80 border border-slate-800 text-xs font-mono text-emerald-300/95 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
            {executionResult.resultContent}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 text-xs">
            <span className="text-indigo-300 font-medium">
              Próximo passo: {executionResult.nextSuggestedAction}
            </span>
            <button
              type="button"
              onClick={() => handleCopyPrompt('result', executionResult.resultContent)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Entrega Técnica</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. SEÇÃO DE REVISÕES INFINITAS COM A IA */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              Revisões Infinitas com IA (Melhoria Contínua)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Peça melhorias ilimitadas: a IA aprimora o conceito, aplicação prática e as etapas, versionando tudo no Firestore.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Revisão Atual:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
              #{idea.revisionsCount || 1}
            </span>
          </div>
        </div>

        {/* Input de Solicitação de Revisão */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={revisionPrompt}
              onChange={(e) => setRevisionPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRequestRevision()}
              placeholder="Ex: Refine para arquitetura multi-tenant, adicione etapa de conformidade LGPD e prompt para Dockerfile..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30"
            />
            <button
              type="button"
              disabled={isRevising || !revisionPrompt.trim()}
              onClick={handleRequestRevision}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isRevising ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Revisando com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Aplicar Revisão</span>
                </>
              )}
            </button>
          </div>

          {/* Feedback de sucesso */}
          {revisionFeedback && (
            <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>{revisionFeedback}</span>
            </div>
          )}
        </div>

        {/* Histórico de Revisões Gravadas */}
        {revisions.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
              Histórico de Revisões Gravadas no Firestore ({revisions.length})
            </span>

            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
              {revisions.map((rev) => {
                const isRevExpanded = expandedRevisionId === rev.id;

                return (
                  <div
                    key={rev.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/20 space-y-1.5 text-xs"
                  >
                    <div
                      onClick={() => setExpandedRevisionId(isRevExpanded ? null : rev.id)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-300">
                          Revisão #{rev.revisionNumber}
                        </span>
                        <span className="text-slate-400 truncate max-w-[280px] sm:max-w-md">
                          "{rev.userRequest}"
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{new Date(rev.createdAt).toLocaleDateString('pt-BR')}</span>
                        {isRevExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    {isRevExpanded && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px]">
                        <p className="text-slate-300 font-medium">
                          {rev.improvementSummary}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-cyan-400 font-semibold block">Conceito Alterado:</span>
                            <span>{rev.conceptChanges}</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded border border-slate-800">
                            <span className="text-indigo-400 font-semibold block">Aplicação Alterada:</span>
                            <span>{rev.applicationChanges}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
