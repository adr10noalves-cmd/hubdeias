import React, { useState } from 'react';
import {
  IdeaCategory,
  IDEA_CATEGORIES,
  IAItem,
  IdeaItem,
  StudyItem,
} from '../../types';
import {
  structureProjectWithAI,
  commitStructuredProjectToFirestore,
  StructuredProjectProposal,
} from '../../services/aiCoCreationService';
import {
  Sparkles,
  X,
  Send,
  CheckCircle2,
  Layers,
  Target,
  AlertCircle,
  Users,
  Cpu,
  Bookmark,
  Calendar,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Edit3,
  Check,
  Zap,
  Workflow,
  ShieldCheck,
  FileCode2,
  Copy,
} from 'lucide-react';

interface AICoCreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: IAItem[];
  existingProjects?: Array<{ title: string; category: string }>;
  onProjectCreated: (created: {
    idea: IdeaItem;
    createdStudies: StudyItem[];
  }) => void;
}

const QUICK_PROMPTS = [
  'Sistema SaaS para controle de laudos de SST com verificação de normas',
  'Automação de extração de dados de PDFs e planilhas com relatórios executivos',
  'Plataforma para gestão de tarefas críticas com alertas automáticos',
  'Agente de IA para suporte técnico inteligente e documentação de sistemas',
];

export const AICoCreateProjectModal: React.FC<AICoCreateProjectModalProps> = ({
  isOpen,
  onClose,
  catalog,
  existingProjects = [],
  onProjectCreated,
}) => {
  const [userRequest, setUserRequest] = useState('');
  const [categoryHint, setCategoryHint] = useState<string>('Projeto');
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [savingToDb, setSavingToDb] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Proposta gerada pela IA
  const [proposal, setProposal] = useState<StructuredProjectProposal | null>(null);
  const [autoCreateStudies, setAutoCreateStudies] = useState(true);
  const [expandedStageIndex, setExpandedStageIndex] = useState<number | null>(0);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (customRequest?: string) => {
    const textToUse = customRequest || userRequest;
    if (!textToUse.trim()) return;

    setLoading(true);
    setSuccessMessage(null);

    try {
      const result = await structureProjectWithAI({
        userRequest: textToUse.trim(),
        categoryHint,
        catalog,
        existingProjects,
      });
      setProposal(result);
    } catch (err) {
      console.error('Erro ao estruturar projeto:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refinePrompt.trim() || !proposal) return;

    setRefining(true);
    try {
      const combinedPrompt = `PROJETO ATUAL PROPOSTO:\nTítulo: ${proposal.title}\nObjetivo: ${proposal.objective}\nProblema: ${proposal.problemSolved}\nTecnologias: ${proposal.relatedTechnologies.join(', ')}\n\nAJUSTES SOLICITADOS PELO USUÁRIO:\n${refinePrompt.trim()}`;
      const result = await structureProjectWithAI({
        userRequest: combinedPrompt,
        categoryHint: proposal.category,
        catalog,
        existingProjects,
      });
      setProposal(result);
      setRefinePrompt('');
    } catch (err) {
      console.error('Erro ao refinar proposta:', err);
    } finally {
      setRefining(false);
    }
  };

  const handleCommitToDatabase = async () => {
    if (!proposal) return;

    setSavingToDb(true);
    try {
      const createdData = await commitStructuredProjectToFirestore({
        proposal,
        autoCreateStudies,
      });

      setSuccessMessage(
        `Projeto "${createdData.idea.title}" estruturado e atrelado com sucesso ao Firestore!`
      );

      // Notifica o componente pai após breve feedback visual
      setTimeout(() => {
        onProjectCreated({
          idea: createdData.idea,
          createdStudies: createdData.createdStudies,
        });
        handleClose();
      }, 1200);
    } catch (err) {
      console.error('Erro ao salvar no Firestore:', err);
      alert('Erro ao salvar no Firestore. Verifique a conexão com a nuvem.');
    } finally {
      setSavingToDb(false);
    }
  };

  const handleClose = () => {
    setUserRequest('');
    setProposal(null);
    setSuccessMessage(null);
    setRefinePrompt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950/95 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900 via-cyan-950/30 to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Arquiteto de Ideias & Projetos com IA
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold uppercase tracking-wider">
                  Co-Criação Groq + Firestore
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Fale em linguagem natural: a IA estrutura o projeto, roadmap, tecnologias, estudos e atrela tudo no banco de dados.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Caixa de Entrada do Pedido em Linguagem Natural */}
          <div className="space-y-3 p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30">
            <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
              <span>O que você quer criar, automatizar ou resolver?</span>
              <span className="text-slate-500 font-normal lowercase">linguagem natural</span>
            </label>

            <textarea
              rows={3}
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              placeholder="Ex: Quero criar um sistema de controle de laudos de SST para canteiros de obras com envio de lembretes por WhatsApp e conferência com as NRs..."
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all resize-none"
            />

            {/* Sugestões rápidas de 1 clique */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Ideias rápidas para inspirar:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUserRequest(prompt);
                      handleGenerate(prompt);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-all text-left"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Controles de Disparo */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Categoria recomendada:</span>
                <select
                  value={categoryHint}
                  onChange={(e) => setCategoryHint(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:border-cyan-400"
                >
                  {IDEA_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={loading || !userRequest.trim()}
                onClick={() => handleGenerate()}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white tracking-wide transition-all ${
                  loading || !userRequest.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Estruturando Projeto com Groq...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>{proposal ? 'Re-estruturar com IA' : 'Estruturar Projeto com IA'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback de Sucesso */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {/* Estrutura Gerada Pela IA */}
          {proposal && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Header da Proposta */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {proposal.category}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Estágio: {proposal.stage}
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Prioridade: {proposal.priority}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white">{proposal.title}</h3>
                  <p className="text-xs text-slate-300 mt-1">{proposal.description}</p>
                </div>
              </div>

              {/* Grid de Objetivo & Problema Resolvido */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> Objetivo Central
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {proposal.objective}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Problema que Resolve
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {proposal.problemSolved}
                  </p>
                </div>
              </div>

              {/* Público & Persona */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Público-Alvo e Usuários
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {proposal.targetAudience}
                </p>
              </div>

              {/* Conceito & Aplicação Prática Gerados pela IA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4" /> Conceito & Mecânica Central
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-200 font-medium bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      {proposal.concept?.summary || proposal.description}
                    </p>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div><strong className="text-cyan-300">Valor Central:</strong> {proposal.concept?.coreValue}</div>
                      <div><strong className="text-indigo-300">Mecânica:</strong> {proposal.concept?.mechanics}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/30 space-y-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Workflow className="w-4 h-4" /> Aplicação Prática no Mundo Real
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <ul className="space-y-1 text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      {(proposal.application?.realWorldUseCases || []).slice(0, 3).map((uc, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-indigo-400">•</span>
                          <span>{uc}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-[11px] text-slate-400 truncate">
                      <strong className="text-amber-300">Arquitetura:</strong> {proposal.application?.architecture}
                    </div>
                  </div>
                </div>
              </div>

              {/* Etapas do Projeto & Prompts de Execução */}
              {proposal.stages && proposal.stages.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileCode2 className="w-4 h-4" /> Etapas do Projeto & Prompts de IA ({proposal.stages.length} Etapas)
                    </span>
                    <span className="text-[11px] text-slate-400">Clique para ver o prompt de cada etapa</span>
                  </div>

                  <div className="space-y-2">
                    {proposal.stages.map((stg, idx) => {
                      const isExp = expandedStageIndex === idx;
                      const isCopied = copiedPromptIndex === idx;

                      return (
                        <div key={stg.id || idx} className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                          <div
                            onClick={() => setExpandedStageIndex(isExp ? null : idx)}
                            className="p-3 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-900/60"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                                {stg.order || idx + 1}
                              </span>
                              <span className="text-xs font-bold text-white truncate">{stg.title}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{stg.phase}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(stg.prompt);
                                setCopiedPromptIndex(idx);
                                setTimeout(() => setCopiedPromptIndex(null), 2000);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{isCopied ? 'Copiado' : 'Copiar Prompt'}</span>
                            </button>
                          </div>

                          {isExp && (
                            <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 text-xs space-y-2">
                              <div className="text-[11px] text-slate-400">
                                <strong>Entregável:</strong> {stg.deliverable}
                              </div>
                              <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-[11px] text-cyan-200 whitespace-pre-wrap">
                                {stg.prompt}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tecnologias & IAs do Catálogo Recomendadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" /> Stack Tecnológica Recomendada
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {proposal.relatedTechnologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4" /> IAs do Catálogo para Acelerar
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {proposal.relatedIANames.map((iaName, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        {iaName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Roadmap nos 4 Horizontes */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Roadmap Estratégico (4 Horizontes)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {proposal.roadmap.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-amber-300">{item.stageTitle}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">{item.goal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diário de Bordo Inicial & Estudos Recomendados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Diário */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4" /> Registro Inicial do Diário de Bordo
                  </span>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/20 text-xs text-purple-200/90 leading-relaxed italic">
                    "{proposal.initialDiaryLog.text}"
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    Impacto: {proposal.initialDiaryLog.impact}
                  </span>
                </div>

                {/* Estudos */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Estudos Recomendados
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCreateStudies}
                        onChange={(e) => setAutoCreateStudies(e.target.checked)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>Criar no Banco de Estudos</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    {proposal.suggestedStudies.map((study, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/20 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-300">{study.theme}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            {study.level}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">{study.objective}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Área de Refinamento / Chat com a IA */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" /> Quer ajustar ou refinar essa proposta antes de salvar?
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                    placeholder="Ex: Altere para mobile app, adicione foco em clínicas médicas e sugira FastAPI..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    disabled={refining || !refinePrompt.trim()}
                    onClick={handleRefine}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    {refining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Refinar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer com Botão de Ação Suprema: Salvar e Atrelar no Banco */}
        <div className="px-6 py-4 border-t border-cyan-500/20 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Persistência garantida em coleções reais do Firestore (`ideas`, `idea_versions`, `evolution_logs`, `studies`).</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>

            {proposal && (
              <button
                type="button"
                disabled={savingToDb}
                onClick={handleCommitToDatabase}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-black text-sm tracking-wide shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {savingToDb ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Atrelando no Banco de Dados Firestore...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Salvar e Atrelar Tudo no Firestore</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
