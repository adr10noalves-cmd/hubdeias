import React, { useState } from 'react';
import {
  IdeaItem,
  IdeaVersion,
  EvolutionLog,
  StudyItem,
  IAItem,
} from '../../types';
import {
  analyzeIdeaEvolutionWithAI,
  EvolutionAIAnalysisResult,
  EvolutionAISuggestion,
} from '../../services/aiEvolutionService';
import {
  Brain,
  Sparkles,
  Check,
  X,
  Edit3,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Cpu,
  Layers,
  MapPin,
  Save,
} from 'lucide-react';

interface AIEvolutionAssistantTabProps {
  idea: IdeaItem;
  historyVersions: IdeaVersion[];
  evolutionLogs: EvolutionLog[];
  relatedStudies: StudyItem[];
  catalog: IAItem[];
  onAcceptEvolutionAsVersion: (evolution: {
    changedSummary: string;
    changeReason: string;
    decisionTaken: string;
    nextStep: string;
    observations: string;
  }) => Promise<void>;
  onApplyRoadmapSuggestions: (suggestions: any[]) => void;
  onSelectInCatalog?: (toolName: string) => void;
}

export const AIEvolutionAssistantTab: React.FC<AIEvolutionAssistantTabProps> = ({
  idea,
  historyVersions,
  evolutionLogs,
  relatedStudies,
  catalog,
  onAcceptEvolutionAsVersion,
  onApplyRoadmapSuggestions,
  onSelectInCatalog,
}) => {
  const [userQuestion, setUserQuestion] = useState(
    'Como posso evoluir a arquitetura e os próximos passos deste projeto?'
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EvolutionAIAnalysisResult | null>(null);
  const [editingSuggestionIndex, setEditingSuggestionIndex] = useState<number | null>(null);
  const [editedSuggestion, setEditedSuggestion] = useState<EvolutionAISuggestion | null>(null);
  const [acceptedIndices, setAcceptedIndices] = useState<Set<number>>(new Set());
  const [savingVersion, setSavingVersion] = useState(false);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      const result = await analyzeIdeaEvolutionWithAI({
        idea,
        historyVersions,
        evolutionLogs,
        relatedStudies,
        catalog,
        userQuestion,
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error('Falha ao analisar evolução com IA:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveAsVersion = async (sug: EvolutionAISuggestion, index: number) => {
    try {
      setSavingVersion(true);
      await onAcceptEvolutionAsVersion({
        changedSummary: sug.title,
        changeReason: sug.changeReason,
        decisionTaken: sug.decisionTaken,
        nextStep: sug.nextStep,
        observations: `Sugerido pelo Assistente de IA de Evolução (${sug.impact})`,
      });
      setAcceptedIndices((prev) => new Set(prev).add(index));
    } catch (err) {
      console.error('Erro ao salvar versão sugerida:', err);
    } finally {
      setSavingVersion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com instruções */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-500/30 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Assistente de IA de Evolução Estratégica</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Memória Contextual Integrada
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              A IA analisa todo o histórico deste projeto: objetivo, versões anteriores, notas do diário e estudos vinculados.
            </p>
          </div>
        </div>

        {/* Campo de Pergunta / Prompt para a IA */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder="Qual conselho estratégico você deseja para este projeto?"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            disabled={analyzing}
            onClick={handleRunAnalysis}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-60 transition-all"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Analisando Contexto...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Analisar Evolução</span>
              </>
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>
            Contexto carregado: {historyVersions.length} versões • {evolutionLogs.length} notas no diário • {relatedStudies.length} estudos vinculados
          </span>
        </div>
      </div>

      {/* Resultados da Análise */}
      {analysisResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Diagnóstico da IA */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Diagnóstico do Projeto & Próximo Salto</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {analysisResult.summaryAnalysis}
            </p>
          </div>

          {/* Sugestões de Evolução (com Aceitar, Editar, Salvar como Nova Versão) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🧬 Evoluções Propostas pela IA</span>
                <span className="text-xs text-slate-400">
                  (A IA nunca sobrescreve seus dados diretamente)
                </span>
              </h4>
            </div>

            <div className="space-y-3">
              {analysisResult.suggestedEvolutions.map((sug, idx) => {
                const isEditing = editingSuggestionIndex === idx;
                const currentSug = isEditing && editedSuggestion ? editedSuggestion : sug;
                const isAccepted = acceptedIndices.has(idx);

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      isAccepted
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-300'
                        : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/30'
                    }`}
                  >
                    {isEditing ? (
                      /* Modo de Edição */
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={currentSug.title}
                          onChange={(e) =>
                            setEditedSuggestion({ ...currentSug, title: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-cyan-500/50 text-xs font-bold text-white"
                        />
                        <textarea
                          rows={2}
                          value={currentSug.changeReason}
                          onChange={(e) =>
                            setEditedSuggestion({ ...currentSug, changeReason: e.target.value })
                          }
                          placeholder="Motivo da mudança..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
                        />
                        <textarea
                          rows={2}
                          value={currentSug.decisionTaken}
                          onChange={(e) =>
                            setEditedSuggestion({ ...currentSug, decisionTaken: e.target.value })
                          }
                          placeholder="Decisão tomada..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSuggestionIndex(null);
                              setEditedSuggestion(null);
                            }}
                            className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              analysisResult.suggestedEvolutions[idx] = currentSug;
                              setEditingSuggestionIndex(null);
                              setEditedSuggestion(null);
                            }}
                            className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
                          >
                            Concluir Edição
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Modo de Visualização */
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h5 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>{sug.title}</span>
                              {isAccepted && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                  ✓ Salva no Histórico
                                </span>
                              )}
                            </h5>
                            <span className="text-[11px] text-cyan-300/90 font-medium">
                              {sug.impact}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSuggestionIndex(idx);
                                setEditedSuggestion({ ...sug });
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                              title="Editar antes de aplicar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">Editar</span>
                            </button>

                            <button
                              type="button"
                              disabled={savingVersion || isAccepted}
                              onClick={() => handleSaveAsVersion(sug, idx)}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] disabled:opacity-60"
                              title="Salva essa sugestão como nova versão V no histórico"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{isAccepted ? 'Salvo' : 'Salvar como Versão'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              Por que mudar:
                            </span>
                            <p className="text-slate-300">{sug.changeReason}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                              Decisão recomendada:
                            </span>
                            <p className="text-slate-300">{sug.decisionTaken}</p>
                          </div>
                        </div>

                        {sug.nextStep && (
                          <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-medium pt-1">
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>Próximo passo: {sug.nextStep}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sugestões de Roadmap */}
          {analysisResult.suggestedRoadmap && analysisResult.suggestedRoadmap.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Roadmap Estratégico Sugerido</span>
                </h4>
                <button
                  type="button"
                  onClick={() => onApplyRoadmapSuggestions(analysisResult.suggestedRoadmap)}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold"
                >
                  Importar para o Roadmap do Projeto
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {analysisResult.suggestedRoadmap.map((rm, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700 text-xs space-y-1">
                    <span className="font-bold text-cyan-300 text-[11px] px-2 py-0.5 rounded bg-slate-900">
                      {rm.stageTitle}
                    </span>
                    <p className="text-slate-200 pt-1">{rm.goal}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ferramentas e Estudos Recomendados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ferramentas do Catálogo de IAs */}
            {analysisResult.recommendedCatalogTools && analysisResult.recommendedCatalogTools.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>IAs Indicadas no seu Catálogo</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.recommendedCatalogTools.map((toolName, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectInCatalog?.(toolName)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-xs text-white hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 font-semibold transition-colors flex items-center gap-1"
                    >
                      <span>{toolName}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Estudos Sugeridos */}
            {analysisResult.recommendedStudies && analysisResult.recommendedStudies.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Estudos Recomendados para Destravar</span>
                </h4>
                <div className="space-y-1.5">
                  {analysisResult.recommendedStudies.map((std, idx) => (
                    <div key={idx} className="text-xs p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <strong className="text-white block">{std.theme}</strong>
                      <span className="text-slate-400 text-[11px]">{std.objective}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
