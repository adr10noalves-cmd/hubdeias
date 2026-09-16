import React, { useState } from 'react';
import {
  IdeaItem,
  StudyItem,
  EvolutionLog,
  IdeaVersion,
} from '../../types';
import {
  Search,
  X,
  Layers,
  GraduationCap,
  BookOpen,
  History,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: IdeaItem[];
  studies: StudyItem[];
  logs: EvolutionLog[];
  onSelectIdea: (idea: IdeaItem) => void;
  onSelectStudy: (study: StudyItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  ideas,
  studies,
  logs,
  onSelectIdea,
  onSelectStudy,
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const trimmedQuery = query.toLowerCase().trim();

  // Cruzamento de entidades
  const matchedIdeas = trimmedQuery
    ? ideas.filter(
        (i) =>
          i.title.toLowerCase().includes(trimmedQuery) ||
          (i.objective && i.objective.toLowerCase().includes(trimmedQuery)) ||
          (i.problemSolved && i.problemSolved.toLowerCase().includes(trimmedQuery)) ||
          (i.relatedTechnologies &&
            i.relatedTechnologies.some((t) => t.toLowerCase().includes(trimmedQuery))) ||
          (i.relatedIANames &&
            i.relatedIANames.some((ia) => ia.toLowerCase().includes(trimmedQuery)))
      )
    : [];

  const matchedStudies = trimmedQuery
    ? studies.filter(
        (s) =>
          s.theme.toLowerCase().includes(trimmedQuery) ||
          (s.objective && s.objective.toLowerCase().includes(trimmedQuery)) ||
          (s.acquiredKnowledge && s.acquiredKnowledge.toLowerCase().includes(trimmedQuery)) ||
          (s.toolsUsed && s.toolsUsed.some((t) => t.toLowerCase().includes(trimmedQuery)))
      )
    : [];

  const matchedLogs = trimmedQuery
    ? logs.filter(
        (l) =>
          l.text.toLowerCase().includes(trimmedQuery) ||
          (l.impact && l.impact.toLowerCase().includes(trimmedQuery)) ||
          l.category.toLowerCase().includes(trimmedQuery)
      )
    : [];

  const totalMatches = matchedIdeas.length + matchedStudies.length + matchedLogs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Input de Busca */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/90">
          <Search className="w-5 h-5 text-cyan-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar ideias, tecnologias, estudos, decisões ou anotações..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-white text-xs"
            >
              Limpar
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!trimmedQuery ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-cyan-400 opacity-60" />
              <p>Digite qualquer termo para buscar em toda a sua Memória Estratégica.</p>
              <p className="text-[11px] text-slate-600">
                Cruza projetos, banco de estudos, tecnologias e anotações do diário.
              </p>
            </div>
          ) : totalMatches === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ideias e Projetos */}
              {matchedIdeas.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Ideias & Projetos ({matchedIdeas.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {matchedIdeas.map((idea) => (
                      <div
                        key={idea.id}
                        onClick={() => {
                          onSelectIdea(idea);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <h5 className="text-xs font-bold text-white">{idea.title}</h5>
                          <span className="text-[11px] text-slate-400">
                            {idea.category} • {idea.stage}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estudos */}
              {matchedStudies.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Estudos & Aprendizados ({matchedStudies.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {matchedStudies.map((study) => (
                      <div
                        key={study.id}
                        onClick={() => {
                          onSelectStudy(study);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <h5 className="text-xs font-bold text-white">{study.theme}</h5>
                          <span className="text-[11px] text-slate-400">
                            {study.level} • {study.progress}% concluído
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-indigo-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Anotações no Diário */}
              {matchedLogs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Diário de Bordo & Decisões ({matchedLogs.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {matchedLogs.map((log) => {
                      const linked = ideas.find((i) => i.id === log.ideaId);
                      return (
                        <div
                          key={log.id}
                          onClick={() => {
                            if (linked) {
                              onSelectIdea(linked);
                              onClose();
                            }
                          }}
                          className="p-3 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-cyan-300">
                              {linked?.title || 'Projeto'} • {log.category}
                            </span>
                            <span className="text-slate-400">
                              {new Date(log.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 line-clamp-2">
                            "{log.text}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
