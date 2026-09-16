import React, { useState } from 'react';
import { EvolutionLog, EvolutionLogCategory, EVOLUTION_LOG_CATEGORIES } from '../../types';
import { BookOpen, Plus, Send, Sparkles, Trash2, Tag, ArrowUpRight } from 'lucide-react';

interface IdeaDiaryTabProps {
  ideaId: string;
  logs: EvolutionLog[];
  onAddLog: (newLog: Omit<EvolutionLog, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteLog?: (id: string) => Promise<void>;
  disabled?: boolean;
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

export const IdeaDiaryTab: React.FC<IdeaDiaryTabProps> = ({
  ideaId,
  logs,
  onAddLog,
  onDeleteLog,
  disabled,
}) => {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<EvolutionLogCategory>('Descoberta');
  const [impact, setImpact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setSubmitting(true);
      await onAddLog({
        ideaId,
        text: text.trim(),
        category,
        impact: impact.trim() || 'Impacto direto no fluxo da ideia.',
      });
      setText('');
      setImpact('');
    } catch (err) {
      console.error('Erro ao adicionar nota ao diário:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Diário de Bordo & Pensamentos</span>
            <span className="text-xs text-slate-400">({logs.length} anotações)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registre descobertas do dia a dia, obstáculos encontrados e insights para nunca perder o raciocínio.
          </p>
        </div>
      </div>

      {/* Formulário de Nova Anotação */}
      {!disabled && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-300">Tipo de Nota:</span>
            <div className="flex flex-wrap gap-1.5">
              {EVOLUTION_LOG_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const style = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? `${style.bg} ${style.text} ${style.border} ring-1 ring-white/30 scale-105`
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            required
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="O que você descobriu, testou ou decidiu hoje sobre este projeto?"
            className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <input
              type="text"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="Impacto na ideia/projeto (ex: Evita retrabalho, melhora UX, etc.)"
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Gravando...' : 'Gravar no Diário'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Registros do Diário */}
      {logs.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">
            Nenhum pensamento ou descoberta anotada ainda para este projeto. Registre suas percepções para alimentar a memória estratégica!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const style = CATEGORY_COLORS[log.category] || CATEGORY_COLORS.Descoberta;
            return (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style.bg} ${style.text} ${style.border}`}
                    >
                      {log.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {onDeleteLog && !disabled && (
                    <button
                      type="button"
                      onClick={() => onDeleteLog(log.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      title="Excluir nota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {log.text}
                </p>

                {log.impact && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300/80 pt-1 border-t border-slate-800/60">
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
