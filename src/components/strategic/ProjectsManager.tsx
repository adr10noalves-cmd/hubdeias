import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Calendar,
  ChevronRight,
  Sparkles,
  Target,
  Activity,
  Trash2,
} from 'lucide-react';
import { ProjectHubItem, ProjectHubStatus, PROJECT_HUB_STATUSES } from '../../types';
import { ProjectCreateModal } from './ProjectCreateModal';

interface ProjectsManagerProps {
  projects: ProjectHubItem[];
  onSelectProject: (project: ProjectHubItem) => void;
  onCreateProject: (project: ProjectHubItem) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({
  projects,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  const getStatusBadgeColor = (st: ProjectHubStatus) => {
    switch (st) {
      case 'Ideia':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/50';
      case 'Planejamento':
        return 'bg-blue-950/80 text-blue-300 border-blue-700/50';
      case 'Em desenvolvimento':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50';
      case 'Em teste':
        return 'bg-amber-950/80 text-amber-300 border-amber-700/50';
      case 'Concluído':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50';
      case 'Em evolução':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.objective.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'todos' || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & New Project Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Meus Projetos</h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                Transforme ideias e missões em projetos acompanhados pelo Hub de IAs
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all transform hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" /> Novo Projeto
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar projetos por nome, objetivo ou descrição..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedStatus('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === 'todos'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Todos ({projects.length})
          </button>
          {PROJECT_HUB_STATUSES.map((st) => {
            const count = projects.filter((p) => p.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedStatus === st
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-base">Nenhum projeto encontrado</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {projects.length === 0
              ? 'Você ainda não possui projetos cadastrados. Clique em "Novo Projeto" para começar.'
              : 'Nenhum projeto corresponde aos filtros selecionados.'}
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Criar Primeiro Projeto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeColor(project.status)}`}>
                    {project.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Deseja realmente excluir o projeto "${project.name}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Excluir projeto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 mt-1 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="text-cyan-400 font-semibold flex items-center gap-1">
                    <Target className="w-3 h-3" /> Objetivo:
                  </div>
                  <p className="line-clamp-2 text-slate-400">{project.objective}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Progresso</span>
                    <span className="text-cyan-400 font-bold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 p-0.5 border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                  <span className="truncate max-w-[180px]" title={project.currentStage}>
                    Etapa: <strong className="text-slate-200">{project.currentStage}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Abrir <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação de Projeto */}
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={onCreateProject}
      />
    </div>
  );
};
