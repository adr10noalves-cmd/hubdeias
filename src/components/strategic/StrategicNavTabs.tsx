import React from 'react';
import {
  Cpu,
  Layers,
  GraduationCap,
  BookOpen,
  Activity,
  Search,
  Sparkles,
  Crown,
  Bot,
} from 'lucide-react';

export type MainHubView = 'catalog' | 'ideas' | 'projects' | 'studies' | 'diary' | 'dashboard' | 'master' | 'receptor';

interface StrategicNavTabsProps {
  currentView: MainHubView;
  onChangeView: (view: MainHubView) => void;
  onOpenGlobalSearch: () => void;
  onOpenCentralIA?: () => void;
  ideasCount: number;
  projectsCount: number;
  studiesCount: number;
  logsCount: number;
}

export const StrategicNavTabs: React.FC<StrategicNavTabsProps> = ({
  currentView,
  onChangeView,
  onOpenGlobalSearch,
  onOpenCentralIA,
  ideasCount,
  projectsCount,
  studiesCount,
  logsCount,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl mb-6 shadow-[0_10px_35px_rgba(0,0,0,0.5)]">
      {/* Abas Principais */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {/* Botão de Destaque: Central de I.A. após Login */}
        {onOpenCentralIA && (
          <button
            type="button"
            onClick={onOpenCentralIA}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-cyan-300/40 hover:scale-[1.02] active:scale-[0.98]"
            title="Abrir Central de I.A. Inteligente"
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
            <span>Central de I.A.</span>
          </button>
        )}

        {/* Aba 0: O Mestre do Sistema */}
        <button
          type="button"
          onClick={() => onChangeView('master')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            currentView === 'master'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]'
              : 'text-indigo-300 hover:text-white hover:bg-slate-800 border border-indigo-500/30'
          }`}
        >
          <Crown className="w-4 h-4 text-indigo-400" />
          <span>O Mestre do Sistema</span>
        </button>

        {/* Aba 0.5: Receptor Mestre */}
        <button
          type="button"
          onClick={() => onChangeView('receptor')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            currentView === 'receptor'
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]'
              : 'text-cyan-300 hover:text-white hover:bg-slate-800 border border-cyan-500/30'
          }`}
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>Receptor Mestre</span>
        </button>

        {/* Aba 1: Catálogo de IAs */}
        <button
          type="button"
          onClick={() => onChangeView('catalog')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            currentView === 'catalog'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Catálogo de IAs</span>
        </button>

        {/* Aba 2: Central de Ideias & Projetos */}
        <button
          type="button"
          onClick={() => onChangeView('ideas')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            currentView === 'ideas'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ideias & Projetos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold text-cyan-300 border border-slate-700">
            {ideasCount}
          </span>
        </button>

        {/* Aba 2.5: Meus Projetos (Fundação de Projetos Acompanhados) */}
        <button
          type="button"
          onClick={() => onChangeView('projects')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            currentView === 'projects'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Meus Projetos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold text-cyan-300 border border-slate-700">
            {projectsCount}
          </span>
        </button>

        {/* Aba 3: Banco de Estudos */}
        <button
          type="button"
          onClick={() => onChangeView('studies')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            currentView === 'studies'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Banco de Estudos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold text-indigo-300 border border-slate-700">
            {studiesCount}
          </span>
        </button>

        {/* Aba 4: Diário de Bordo */}
        <button
          type="button"
          onClick={() => onChangeView('diary')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            currentView === 'diary'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Diário de Bordo</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] font-bold text-emerald-300 border border-slate-700">
            {logsCount}
          </span>
        </button>

        {/* Aba 5: Dashboard de Evolução */}
        <button
          type="button"
          onClick={() => onChangeView('dashboard')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            currentView === 'dashboard'
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Dashboard de Evolução</span>
        </button>
      </div>

      {/* Botão de Busca Cruzada Global */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onOpenGlobalSearch}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-white text-xs font-semibold transition-all group"
          title="Buscar em ideias, estudos, tecnologias e anotações"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>Busca Inteligente</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-mono">
            Ctrl+K
          </kbd>
        </button>
      </div>
    </div>
  );
};
