import React, { useState } from 'react';
import {
  IdeaItem,
  IdeaCategory,
  IDEA_CATEGORIES,
  IdeaStage,
  IDEA_STAGES,
  IdeaPriority,
  IDEA_PRIORITIES,
  IdeaStatus,
  IDEA_STATUSES,
  StudyItem,
  IAItem,
} from '../../types';
import {
  saveIdeaToFirestore,
  deleteIdeaFromFirestore,
} from '../../services/strategicMemoryService';
import { MaturityStageBar } from './MaturityStageBar';
import { IdeaDetailModal } from './IdeaDetailModal';
import { AICoCreateProjectModal } from './AICoCreateProjectModal';
import {
  Plus,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Trash2,
  Edit,
  Tag,
  Cpu,
  CheckCircle2,
  Calendar,
  Wand2,
  Bot,
  Zap,
} from 'lucide-react';

interface IdeasManagerProps {
  ideas: IdeaItem[];
  studies: StudyItem[];
  catalog: IAItem[];
  onSelectInCatalog?: (toolName: string) => void;
}

export const IdeasManager: React.FC<IdeasManagerProps> = ({
  ideas,
  studies,
  catalog,
  onSelectInCatalog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [selectedStage, setSelectedStage] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');

  // Estado do Modal de Detalhes
  const [activeIdea, setActiveIdea] = useState<IdeaItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Estado do Modal de Co-Criação com IA
  const [isCoCreateModalOpen, setIsCoCreateModalOpen] = useState(false);

  // Estado do Modal de Criação Manual Rápida
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<IdeaCategory>('Ideia Geral');
  const [newObjective, setNewObjective] = useState('');
  const [newStage, setNewStage] = useState<IdeaStage>('1. Ideia');
  const [submitting, setSubmitting] = useState(false);

  // Filtragem
  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (idea.objective && idea.objective.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (idea.problemSolved && idea.problemSolved.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (idea.relatedTechnologies &&
        idea.relatedTechnologies.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCategory = selectedCategory === 'TODAS' || idea.category === selectedCategory;
    const matchesStage = selectedStage === 'TODOS' || idea.stage === selectedStage;
    const matchesStatus = selectedStatus === 'TODOS' || idea.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStage && matchesStatus;
  });

  const handleOpenDetail = (idea: IdeaItem) => {
    setActiveIdea(idea);
    setIsDetailModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSubmitting(true);
      const newIdea: IdeaItem = {
        id: `idea-${Date.now()}`,
        title: newTitle.trim(),
        description: newObjective.trim() || newTitle.trim(),
        category: newCategory,
        stage: newStage,
        objective: newObjective.trim(),
        problemSolved: '',
        targetAudience: '',
        status: 'Ativa',
        priority: 'Média',
        currentVersion: 'V1',
        relatedTechnologies: [],
        relatedIANames: [],
        roadmap: [
          {
            id: `rm-${Date.now()}-1`,
            stageTitle: 'Atual',
            goal: 'Estruturação do escopo e requisitos iniciais',
            status: 'Em Andamento',
          },
          {
            id: `rm-${Date.now()}-2`,
            stageTitle: 'Próxima Evolução',
            goal: 'Criação da primeira prova de conceito funcional',
            status: 'Pendente',
          },
        ],
        nextSteps: 'Definir arquitetura básica e validar hipóteses.',
        observations: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveIdeaToFirestore(newIdea);
      setNewTitle('');
      setNewObjective('');
      setIsCreatingNew(false);

      // Abre imediatamente os detalhes para preenchimento
      setActiveIdea(newIdea);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Erro ao criar nova ideia:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIdeaFromFirestore(id);
    } catch (err) {
      console.error('Erro ao deletar ideia:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner: Arquiteto de Ideias & Projetos com IA */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-cyan-950/40 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-300" />
              <span>Co-Criação Inteligente com IA</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Arquiteto de Ideias & Projetos com IA
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Diga o que deseja criar em linguagem natural: a IA analisa, estrutura o escopo completo, roadmap em 4 horizontes, stack de tecnologias, estudos recomendados e <strong className="text-cyan-300">atrela tudo diretamente no banco de dados Firestore</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsCoCreateModalOpen(true)}
              className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-[1.02] transition-all"
            >
              <Wand2 className="w-4 h-4 text-cyan-100 animate-spin-slow" />
              <span>Co-criar Projeto com IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, objetivo, problema resolvido ou tecnologia..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
          >
            <option value="TODAS">Todas Categorias</option>
            {IDEA_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Estágio */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
          >
            <option value="TODOS">Todos Estágios</option>
            {IDEA_STAGES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
          >
            <option value="TODOS">Todos Status</option>
            {IDEA_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Botão Co-criar com IA */}
          <button
            type="button"
            onClick={() => setIsCoCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(168,85,247,0.35)] hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>Co-criar com IA</span>
          </button>

          {/* Botão Nova Ideia Manual */}
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm tracking-wide transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Manual</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards de Ideias */}
      {filteredIdeas.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/50 border border-dashed border-cyan-500/30 text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-slate-800 text-cyan-400 border border-cyan-500/20">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum projeto encontrado</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Todas as suas ideias, projetos e sistemas ficam armazenados permanentemente nesta central para nunca se perderem no tempo.
          </p>
          <button
            type="button"
            onClick={() => setIsCreatingNew(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all"
          >
            Cadastrar Primeira Ideia
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredIdeas.map((idea) => {
            const isCompleted = idea.status === 'Concluída';
            const isPaused = idea.status === 'Pausada';

            return (
              <div
                key={idea.id}
                onClick={() => handleOpenDetail(idea)}
                className="p-5 rounded-3xl bg-slate-900/85 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4 group shadow-[0_4px_25px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)]"
              >
                <div className="space-y-3">
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {idea.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {idea.currentVersion || 'V1'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          idea.priority === 'Urgente'
                            ? 'bg-rose-500/20 text-rose-300'
                            : idea.priority === 'Alta'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idea.priority}
                      </span>
                    </div>
                  </div>

                  {/* Título & Objetivo */}
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug">
                      {idea.title}
                    </h3>
                    {idea.objective && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {idea.objective}
                      </p>
                    )}
                  </div>

                  {/* Barra de Maturidade Visual (1 a 9) */}
                  <div className="pt-1">
                    <MaturityStageBar currentStage={idea.stage} interactive={false} />
                  </div>

                  {/* Próximo Passo */}
                  {idea.nextSteps && (
                    <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-200 line-clamp-2 font-medium">
                        {idea.nextSteps}
                      </p>
                    </div>
                  )}

                  {/* IAs e Tecnologias */}
                  {(idea.relatedTechnologies?.length || idea.relatedIANames?.length) ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(idea.relatedIANames || []).slice(0, 2).map((ia) => (
                        <span
                          key={ia}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-950/50 text-indigo-300 border border-indigo-500/30"
                        >
                          IA: {ia}
                        </span>
                      ))}
                      {(idea.relatedTechnologies || []).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Footer do Card */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>
                      {new Date(idea.updatedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </span>

                  <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Abrir Memória</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação Rápida */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl my-auto rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Cadastrar Nova Ideia / Projeto</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Título do Projeto *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Auditor de SST Inteligente"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Categoria *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as IdeaCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                  >
                    {IDEA_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Estágio Inicial</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as IdeaStage)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
                  >
                    {IDEA_STAGES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Objetivo Central</label>
                <textarea
                  rows={3}
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Qual é a principal função e o valor desta ideia?"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                >
                  {submitting ? 'Criando...' : 'Criar e Abrir Memória'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Ideia */}
      {isDetailModalOpen && activeIdea && (
        <IdeaDetailModal
          idea={activeIdea}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setActiveIdea(null);
          }}
          onUpdateIdea={(updated) => {
            setActiveIdea(updated);
          }}
          onDeleteIdea={handleDelete}
          studies={studies}
          catalog={catalog}
          onSelectInCatalog={onSelectInCatalog}
        />
      )}

      {/* Modal de Co-Criação com IA (Arquiteto de Ideias & Projetos) */}
      {isCoCreateModalOpen && (
        <AICoCreateProjectModal
          isOpen={isCoCreateModalOpen}
          onClose={() => setIsCoCreateModalOpen(false)}
          catalog={catalog}
          existingProjects={ideas.map((i) => ({ title: i.title, category: i.category }))}
          onProjectCreated={(created) => {
            setActiveIdea(created.idea);
            setIsDetailModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
