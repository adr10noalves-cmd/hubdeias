import React, { useState } from 'react';
import {
  StudyItem,
  IdeaItem,
  IAItem,
  StudyLevel,
  STUDY_LEVELS,
} from '../../types';
import {
  saveStudyToFirestore,
  deleteStudyFromFirestore,
} from '../../services/strategicMemoryService';
import { AutoSaveIndicator, SaveState } from './AutoSaveIndicator';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Cpu,
  Layers,
  Link,
  Edit,
  X,
  HelpCircle,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface StudiesManagerProps {
  studies: StudyItem[];
  ideas: IdeaItem[];
  catalog: IAItem[];
  onOpenIdeaDetail?: (idea: IdeaItem) => void;
}

export const StudiesManager: React.FC<StudiesManagerProps> = ({
  studies,
  ideas,
  catalog,
  onOpenIdeaDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('TODOS');
  const [editingStudy, setEditingStudy] = useState<StudyItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // Filtragem dos estudos
  const filteredStudies = studies.filter((st) => {
    const matchesSearch =
      st.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.objective && st.objective.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (st.acquiredKnowledge && st.acquiredKnowledge.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = selectedLevel === 'TODOS' || st.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const handleCreateNew = () => {
    const newStudy: StudyItem = {
      id: `study-${Date.now()}`,
      theme: '',
      objective: '',
      level: 'Iniciante',
      acquiredKnowledge: '',
      doubts: '',
      sources: [],
      toolsUsed: [],
      exercises: '',
      conclusions: '',
      nextSubjects: '',
      progress: 10,
      relatedProjectIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingStudy(newStudy);
    setIsModalOpen(true);
  };

  const handleEdit = (study: StudyItem) => {
    setEditingStudy({ ...study });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, theme: string) => {
    if (confirm(`Deseja realmente remover o estudo "${theme}"?`)) {
      try {
        await deleteStudyFromFirestore(id);
      } catch (e) {
        console.error('Erro ao excluir estudo:', e);
      }
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudy || !editingStudy.theme.trim()) return;

    try {
      setSaveState('saving');
      await saveStudyToFirestore({
        ...editingStudy,
        theme: editingStudy.theme.trim(),
        updatedAt: new Date().toISOString(),
      });
      setSaveState('saved');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar estudo:', err);
      setSaveState('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por tema, aprendizado ou objetivo de estudo..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold"
          >
            <option value="TODOS">Todos os Níveis</option>
            {STUDY_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleCreateNew}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Estudo</span>
        </button>
      </div>

      {/* Grid de Estudos */}
      {filteredStudies.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/50 border border-dashed border-cyan-500/30 text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-slate-800 text-cyan-400 border border-cyan-500/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Nenhum estudo encontrado</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Organize o que você aprende ao longo do tempo. Conecte cada estudo com seus projetos reais.
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all"
          >
            Começar primeiro estudo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredStudies.map((study) => {
            // Projetos beneficiados por este estudo
            const benefitingIdeas = ideas.filter((i) =>
              (study.relatedProjectIds || []).includes(i.id)
            );

            return (
              <div
                key={study.id}
                className="p-5 rounded-2xl bg-slate-900/85 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {study.level}
                    </span>

                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleEdit(study)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 transition-colors"
                        title="Editar estudo"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(study.id, study.theme)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Excluir estudo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-200 transition-colors leading-snug">
                      {study.theme}
                    </h3>
                    {study.objective && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {study.objective}
                      </p>
                    )}
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Progresso do Aprendizado</span>
                      <span className="text-cyan-300 font-bold">{study.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, study.progress))}%` }}
                      />
                    </div>
                  </div>

                  {/* Conhecimento Adquirido */}
                  {study.acquiredKnowledge && (
                    <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Conhecimento consolidado:
                      </span>
                      <p className="text-xs text-slate-200 line-clamp-3 italic">
                        "{study.acquiredKnowledge}"
                      </p>
                    </div>
                  )}

                  {/* Dúvidas Atuais */}
                  {study.doubts && (
                    <div className="flex items-start gap-1.5 text-xs text-amber-300/90 pt-0.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">Dúvida: {study.doubts}</span>
                    </div>
                  )}

                  {/* Ferramentas e IAs Utilizadas */}
                  {study.toolsUsed && study.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {study.toolsUsed.map((tool, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vínculo com Projetos (Bidirecional) */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <Link className="w-3 h-3 text-cyan-400" />
                    <span>Projetos Beneficiados ({benefitingIdeas.length})</span>
                  </span>

                  {benefitingIdeas.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">
                      Ainda não vinculado a nenhum projeto.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {benefitingIdeas.map((idea) => (
                        <button
                          key={idea.id}
                          type="button"
                          onClick={() => onOpenIdeaDetail?.(idea)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 text-xs font-semibold border border-cyan-500/40 hover:scale-105 transition-all"
                          title="Abrir detalhes deste projeto"
                        >
                          {idea.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição do Estudo */}
      {isModalOpen && editingStudy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl my-auto rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">
                  {editingStudy.theme ? 'Editar Estudo' : 'Cadastrar Novo Estudo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Tema do Estudo *</label>
                <input
                  type="text"
                  required
                  value={editingStudy.theme}
                  onChange={(e) => setEditingStudy({ ...editingStudy, theme: e.target.value })}
                  placeholder="Ex: Arquiteturas de RAG Estruturado com Agentes"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Nível do Estudo</label>
                  <select
                    value={editingStudy.level}
                    onChange={(e) =>
                      setEditingStudy({ ...editingStudy, level: e.target.value as StudyLevel })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {STUDY_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    Progresso: {editingStudy.progress}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={editingStudy.progress}
                    onChange={(e) =>
                      setEditingStudy({ ...editingStudy, progress: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400 cursor-pointer pt-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Objetivo do Estudo</label>
                <input
                  type="text"
                  value={editingStudy.objective}
                  onChange={(e) => setEditingStudy({ ...editingStudy, objective: e.target.value })}
                  placeholder="O que você quer ser capaz de fazer após concluir este estudo?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Conhecimentos Adquiridos</label>
                <textarea
                  rows={3}
                  value={editingStudy.acquiredKnowledge}
                  onChange={(e) =>
                    setEditingStudy({ ...editingStudy, acquiredKnowledge: e.target.value })
                  }
                  placeholder="O que você aprendeu de mais valioso na prática?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Dúvidas & Pontos em Aberto</label>
                  <textarea
                    rows={2}
                    value={editingStudy.doubts}
                    onChange={(e) => setEditingStudy({ ...editingStudy, doubts: e.target.value })}
                    placeholder="Quais perguntas ainda não foram respondidas?"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Exercícios & Práticas</label>
                  <textarea
                    rows={2}
                    value={editingStudy.exercises}
                    onChange={(e) => setEditingStudy({ ...editingStudy, exercises: e.target.value })}
                    placeholder="Quais testes de código ou provas de conceito você executou?"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Conclusões Finais</label>
                <input
                  type="text"
                  value={editingStudy.conclusions}
                  onChange={(e) => setEditingStudy({ ...editingStudy, conclusions: e.target.value })}
                  placeholder="Veredito ou conclusão definitiva"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Relação Estudo -> Projetos (Vínculo Bidirecional) */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  <span>Vincular este Estudo a Projetos / Ideias:</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ideas.map((idea) => {
                    const isSelected = (editingStudy.relatedProjectIds || []).includes(idea.id);
                    return (
                      <button
                        key={idea.id}
                        type="button"
                        onClick={() => {
                          const current = editingStudy.relatedProjectIds || [];
                          const updated = isSelected
                            ? current.filter((id) => id !== idea.id)
                            : [...current, idea.id];
                          setEditingStudy({ ...editingStudy, relatedProjectIds: updated });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {idea.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  Salvar Estudo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
