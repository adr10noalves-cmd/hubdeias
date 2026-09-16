import React, { useState, useEffect } from 'react';
import {
  EvolutionLog,
  EvolutionLogCategory,
  EVOLUTION_LOG_CATEGORIES,
  IdeaItem,
} from '../../types';
import {
  getEvolutionLogsFromFirestore,
  saveEvolutionLogToFirestore,
  deleteEvolutionLogFromFirestore,
  subscribeToEvolutionLogs,
} from '../../services/strategicMemoryService';
import {
  BookOpen,
  Send,
  Trash2,
  Filter,
  Search,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
} from 'lucide-react';

interface EvolutionDiaryGlobalViewProps {
  ideas: IdeaItem[];
  onOpenIdeaDetail?: (idea: IdeaItem) => void;
}

const CATEGORY_COLORS: Record<EvolutionLogCategory, { bg: string; text: string; border: string }> = {
  Descoberta: { bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  Decisão: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  Aprendizado: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  Obstáculo: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
  Teste: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  Ideia: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
  Validação: { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/30' },
};

export const EvolutionDiaryGlobalView: React.FC<EvolutionDiaryGlobalViewProps> = ({
  ideas,
  onOpenIdeaDetail,
}) => {
  const [logs, setLogs] = useState<EvolutionLog[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  // Formulário rápido
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<EvolutionLogCategory>('Descoberta');
  const [targetIdeaId, setTargetIdeaId] = useState<string>(ideas[0]?.id || '');
  const [newImpact, setNewImpact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToEvolutionLogs(undefined, (loadedLogs) => {
      setLogs(loadedLogs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!targetIdeaId && ideas.length > 0) {
      setTargetIdeaId(ideas[0].id);
    }
  }, [ideas]);

  const handleCreateQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim() || !targetIdeaId) return;

    try {
      setSubmitting(true);
      const newLog: EvolutionLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ideaId: targetIdeaId,
        text: newText.trim(),
        category: newCategory,
        impact: newImpact.trim() || 'Impacto direto no fluxo da ideia.',
        createdAt: new Date().toISOString(),
      };
      await saveEvolutionLogToFirestore(newLog);
      setNewText('');
      setNewImpact('');
    } catch (err) {
      console.error('Erro ao salvar log no diário:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta anotação do diário?')) {
      await deleteEvolutionLogFromFirestore(id);
    }
  };

  // Filtragem
  const filteredLogs = logs.filter((log) => {
    const matchesIdea = selectedIdeaId === 'TODOS' || log.ideaId === selectedIdeaId;
    const matchesCategory = selectedCategory === 'TODAS' || log.category === selectedCategory;
    const matchesSearch =
      log.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.impact && log.impact.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesIdea && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Formulário Rápido de Captura em Tempo Real */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Captura Imediata de Pensamento ou Descoberta
          </h3>
        </div>

        <form onSubmit={handleCreateQuickLog} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Vincular ao Projeto:</label>
              <select
                value={targetIdeaId}
                onChange={(e) => setTargetIdeaId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {ideas.map((idea) => (
                  <option key={idea.id} value={idea.id}>
                    {idea.title} ({idea.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-semibold">Tipo de Nota:</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as EvolutionLogCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {EVOLUTION_LOG_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            required
            rows={2}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Ex: Hoje percebi que o Auditor de SST precisa separar documentos antes de analisar..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <input
              type="text"
              value={newImpact}
              onChange={(e) => setNewImpact(e.target.value)}
              placeholder="Impacto na ideia/projeto (ex: Evita retrabalho, melhora tempo de resposta)..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />

            <button
              type="submit"
              disabled={submitting || !newText.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Gravando...' : 'Gravar no Diário'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar pensamentos, aprendizados ou impactos..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedIdeaId}
            onChange={(e) => setSelectedIdeaId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
          >
            <option value="TODOS">Todos os Projetos</option>
            {ideas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.title}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
          >
            <option value="TODAS">Todas as Categorias</option>
            {EVOLUTION_LOG_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feed Cronológico */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs sm:text-sm text-slate-400">
            Nenhuma anotação encontrada para os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const linkedIdea = ideas.find((i) => i.id === log.ideaId);
            const style = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.Descoberta;

            return (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {log.category}
                    </span>

                    {linkedIdea && (
                      <button
                        type="button"
                        onClick={() => onOpenIdeaDetail?.(linkedIdea)}
                        className="text-xs font-semibold text-cyan-300 hover:underline flex items-center gap-1"
                      >
                        <span>Projeto: {linkedIdea.title}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(log.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Excluir nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {log.text}
                </p>

                {log.impact && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300/80 pt-1 border-t border-slate-800/80">
                    <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Impacto: {log.impact}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
