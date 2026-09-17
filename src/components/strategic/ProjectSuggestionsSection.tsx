import React, { useState } from 'react';
import { Lightbulb, Plus, Check, Eye, Trash2, X, Sparkles } from 'lucide-react';
import { ProjectSuggestion, ProjectMission } from '../../types';

interface ProjectSuggestionsSectionProps {
  projectId: string;
  suggestions: ProjectSuggestion[];
  onSaveSuggestion: (suggestion: ProjectSuggestion) => void;
  onDeleteSuggestion: (id: string) => void;
  onConvertToMission: (suggestion: ProjectSuggestion) => void;
}

export const ProjectSuggestionsSection: React.FC<ProjectSuggestionsSectionProps> = ({
  projectId,
  suggestions,
  onSaveSuggestion,
  onDeleteSuggestion,
  onConvertToMission,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Funcionalidade');
  const [analyzingSuggestion, setAnalyzingSuggestion] = useState<ProjectSuggestion | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newSugg: ProjectSuggestion = {
      id: `sug-${Date.now()}`,
      projectId,
      title: title.trim(),
      description: description.trim(),
      category,
      status: 'Nova',
      createdAt: new Date().toLocaleDateString(),
    };

    onSaveSuggestion(newSugg);
    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  const handleAnalyze = (s: ProjectSuggestion) => {
    setAnalyzingSuggestion(s);
    onSaveSuggestion({ ...s, status: 'Analisada' });
  };

  const handleAddMission = (s: ProjectSuggestion) => {
    onConvertToMission(s);
    onSaveSuggestion({ ...s, status: 'Adicionada' });
  };

  const handleIgnore = (s: ProjectSuggestion) => {
    onSaveSuggestion({ ...s, status: 'Ignorada' });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Ideias e Sugestões de Evolução</h3>
            <p className="text-slate-400 text-xs">Oportunidades identificadas pela IA para impulsionar o projeto</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" /> Nova Sugestão
        </button>
      </div>

      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
          Nenhuma sugestão registrada no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className={`bg-slate-950/70 border rounded-xl p-4 space-y-3 transition-all ${
                s.status === 'Ignorada'
                  ? 'opacity-50 border-slate-900'
                  : s.status === 'Adicionada'
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/50">
                  {s.category}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{s.status}</span>
              </div>

              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm mb-1">{s.title}</h4>
                <p className="text-slate-400 text-xs">{s.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAnalyze(s)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-medium flex items-center gap-1 transition-all"
                  >
                    <Eye className="w-3 h-3" /> [ANALISAR]
                  </button>
                  <button
                    onClick={() => handleAddMission(s)}
                    disabled={s.status === 'Adicionada'}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 text-[11px] font-medium flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" /> [ADICIONAR ÀS MISSÕES]
                  </button>
                </div>

                <button
                  onClick={() => handleIgnore(s)}
                  className="text-slate-500 hover:text-slate-300 text-[11px] font-medium"
                >
                  [IGNORAR]
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nova Sugestão */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Nova Sugestão de Evolução</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título da Sugestão *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Criar versão mobile responsiva"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descrição / Valor</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Qual o benefício desta melhoria?"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="Funcionalidade">Funcionalidade</option>
                  <option value="Segurança">Segurança</option>
                  <option value="Desempenho">Desempenho</option>
                  <option value="Arquitetura">Arquitetura</option>
                  <option value="Integração">Integração</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20"
                >
                  Salvar Sugestão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Analisar Sugestão */}
      {analyzingSuggestion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Análise de IA da Sugestão
              </h3>
              <button
                onClick={() => setAnalyzingSuggestion(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
              <p className="font-bold text-white">{analyzingSuggestion.title}</p>
              <p className="text-slate-400">{analyzingSuggestion.description}</p>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-cyan-400 font-bold text-xs">Parecer Técnico da IA:</div>
                <p className="text-slate-300">
                  Esta melhoria possui alta sinergia com o estágio atual do projeto. Implementá-la aumentará a robustez do produto final. Recomendo transformar em missão e priorizar na próxima sprint.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  handleAddMission(analyzingSuggestion);
                  setAnalyzingSuggestion(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> [ADICIONAR ÀS MISSÕES]
              </button>
              <button
                onClick={() => setAnalyzingSuggestion(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
