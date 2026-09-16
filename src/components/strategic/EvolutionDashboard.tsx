import React from 'react';
import {
  IdeaItem,
  StudyItem,
  EvolutionLog,
  IDEA_STAGES,
} from '../../types';
import {
  Activity,
  Layers,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Flame,
} from 'lucide-react';

interface EvolutionDashboardProps {
  ideas: IdeaItem[];
  studies: StudyItem[];
  logs: EvolutionLog[];
  onOpenIdeaDetail?: (idea: IdeaItem) => void;
  onOpenStudyTab?: () => void;
  onOpenIdeasTab?: () => void;
}

export const EvolutionDashboard: React.FC<EvolutionDashboardProps> = ({
  ideas,
  studies,
  logs,
  onOpenIdeaDetail,
  onOpenStudyTab,
  onOpenIdeasTab,
}) => {
  const activeIdeas = ideas.filter((i) => i.status === 'Ativa' || i.status === 'Em Progresso');
  const inDevProjects = ideas.filter(
    (i) => i.stage === '4. Protótipo' || i.stage === '5. Desenvolvimento' || i.stage === '6. Teste'
  );
  const studiesInProgress = studies.filter((s) => s.progress < 100);

  // Ideias sem atualização há mais de 14 dias
  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const stalledIdeas = ideas.filter(
    (i) => new Date(i.updatedAt).getTime() < fourteenDaysAgo && i.status !== 'Concluída' && i.status !== 'Arquivada'
  );

  // Ideias com próximos passos definidos
  const ideasWithNextSteps = ideas.filter((i) => i.nextSteps && i.nextSteps.trim().length > 0);

  // Distribuição por estágio de maturidade (1 a 9)
  const stageCounts = IDEA_STAGES.map((stage) => ({
    stage,
    count: ideas.filter((i) => i.stage === stage).length,
  }));

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-1">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ideias & Projetos Ativos
            </span>
            <Layers className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-white font-display">
            {activeIdeas.length}
          </p>
          <span className="text-[11px] text-slate-400 block">
            De um total de {ideas.length} projetos
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-1">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Em Desenvolvimento
            </span>
            <Flame className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-white font-display">
            {inDevProjects.length}
          </p>
          <span className="text-[11px] text-slate-400 block">
            Estágios: Protótipo a Testes
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Estudos em Andamento
            </span>
            <GraduationCap className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-white font-display">
            {studiesInProgress.length}
          </p>
          <span className="text-[11px] text-slate-400 block">
            {studies.length} temas no banco
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-1">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Anotações no Diário
            </span>
            <Activity className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-white font-display">
            {logs.length}
          </p>
          <span className="text-[11px] text-slate-400 block">
            Descobertas e decisões salvas
          </span>
        </div>
      </div>

      {/* Alerta de Projetos sem Atualização Recente */}
      {stalledIdeas.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wide text-amber-300">
              Atenção: {stalledIdeas.length} {stalledIdeas.length === 1 ? 'projeto sem atualização recente' : 'projetos sem atualização recente'}
            </h4>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Estes projetos não recebem alterações há mais de 14 dias. Revise para manter a evolução contínua:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {stalledIdeas.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => onOpenIdeaDetail?.(i)}
                  className="px-2.5 py-1 rounded-lg bg-amber-900/40 hover:bg-amber-800/50 text-amber-100 text-xs font-semibold border border-amber-500/40 transition-all flex items-center gap-1"
                >
                  <span>{i.title}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Funil de Maturidade das Ideias (1 a 9) */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Matriz de Maturidade (9 Estágios Operacionais)</span>
          </span>
          <span className="text-xs text-slate-400 font-normal">
            Total: {ideas.length} ideias
          </span>
        </h3>

        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {stageCounts.map(({ stage, count }, idx) => {
            const shortName = stage.replace(/^\d+\.\s*/, '');
            const hasItems = count > 0;
            return (
              <div
                key={stage}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  hasItems
                    ? 'bg-cyan-950/30 border-cyan-500/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-bold block text-cyan-300">
                  #{idx + 1}
                </span>
                <span className="text-xl font-black font-display text-white block my-0.5">
                  {count}
                </span>
                <span className="text-[10px] truncate block text-slate-400 font-medium">
                  {shortName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Próximos Passos Consolidados & Últimas Anotações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Próximos Passos de Cada Ideia */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Próximos Passos Consolidados</span>
            </h3>
            <span className="text-xs text-slate-400">
              {ideasWithNextSteps.length} projetos com ações
            </span>
          </div>

          {ideasWithNextSteps.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Nenhum próximo passo definido. Abra um projeto para registrar a próxima ação prática!
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {ideasWithNextSteps.map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => onOpenIdeaDetail?.(idea)}
                  className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 cursor-pointer transition-all space-y-1 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">
                      {idea.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                      {idea.category} • {idea.stage}
                    </span>
                  </div>
                  <p className="text-xs text-white leading-relaxed flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{idea.nextSteps}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas Anotações do Diário */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Últimos Insights & Decisões</span>
            </h3>
            <span className="text-xs text-slate-400">Feed recente</span>
          </div>

          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Nenhum registro no diário ainda. Use a aba "Diário de Bordo" para gravar seus pensamentos!
            </p>
          ) : (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {logs.slice(0, 6).map((log) => {
                const linkedIdea = ideas.find((i) => i.id === log.ideaId);
                return (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-cyan-300">
                        {linkedIdea?.title || 'Projeto'} • {log.category}
                      </span>
                      <span className="text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                      "{log.text}"
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
