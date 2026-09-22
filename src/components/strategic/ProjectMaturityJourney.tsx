import React from 'react';
import {
  Lightbulb,
  MessageSquare,
  Compass,
  CheckCircle2,
  Code2,
  Bug,
  Wrench,
  Rocket,
  Activity,
  BarChart2,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { ProjectHubItem, ProjectCompleteState } from '../../types';

interface ProjectMaturityJourneyProps {
  project: ProjectHubItem;
  completeState?: ProjectCompleteState;
  onNavigateTab?: (tab: string) => void;
}

const LIFECYCLE_STAGES = [
  { id: 'ideia', label: 'Ideia', icon: Lightbulb },
  { id: 'debate', label: 'Debate', icon: MessageSquare },
  { id: 'planejamento', label: 'Planejamento', icon: Compass },
  { id: 'aprovacao', label: 'Aprovação', icon: CheckCircle2 },
  { id: 'execucao', label: 'Execução', icon: Code2 },
  { id: 'teste', label: 'Teste', icon: Bug },
  { id: 'correcao', label: 'Correção', icon: Wrench },
  { id: 'implantacao', label: 'Implantação', icon: Rocket },
  { id: 'acompanhamento', label: 'Acompanhamento', icon: Activity },
  { id: 'analise', label: 'Análise', icon: BarChart2 },
  { id: 'evolucao', label: 'Evolução', icon: TrendingUp },
  { id: 'novo_debate', label: 'Novo Debate', icon: RefreshCw },
];

export const ProjectMaturityJourney: React.FC<ProjectMaturityJourneyProps> = ({
  project,
  completeState,
  onNavigateTab,
}) => {
  // Mapeia o status / etapa atual para o ciclo de vida
  const getCurrentStageIndex = (): number => {
    const stage = (project.currentStage || '').toLowerCase();
    const status = (project.status || '').toLowerCase();

    if (stage.includes('ideia') || status === 'ideia') return 0;
    if (stage.includes('debate') || stage.includes('discussão')) return 1;
    if (stage.includes('planejamento') || status === 'planejamento') return 2;
    if (stage.includes('aprovação') || stage.includes('decisão')) return 3;
    if (stage.includes('desenvolvimento') || stage.includes('execução') || status === 'em desenvolvimento') return 4;
    if (stage.includes('teste') || status === 'em teste') return 5;
    if (stage.includes('correção') || stage.includes('ajuste')) return 6;
    if (stage.includes('implantação') || stage.includes('deploy') || status === 'concluído') return 7;
    if (stage.includes('acompanhamento') || status === 'operacional') return 8;
    if (stage.includes('análise') || stage.includes('métrica')) return 9;
    if (stage.includes('evolução') || stage.includes('v2')) return 10;
    return 2; // Default planejamento
  };

  const currentIdx = getCurrentStageIndex();

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'Concluído':
      case 'Operacional':
        return { text: 'text-emerald-400', bg: 'bg-emerald-950/80 border-emerald-800/60', label: '🟢 CONCLUÍDO / OPERACIONAL' };
      case 'Em desenvolvimento':
        return { text: 'text-blue-400', bg: 'bg-blue-950/80 border-blue-800/60', label: '🟡 EM ANDAMENTO' };
      case 'Planejamento':
      case 'Ideia':
        return { text: 'text-cyan-400', bg: 'bg-cyan-950/80 border-cyan-800/60', label: '🔵 EM DISCUSSÃO / PLANEJAMENTO' };
      case 'Pausado':
        return { text: 'text-rose-400', bg: 'bg-rose-950/80 border-rose-800/60', label: '🔴 BLOQUEADO / PAUSADO' };
      default:
        return { text: 'text-slate-400', bg: 'bg-slate-800 border-slate-700', label: '⚪ PENDENTE' };
    }
  };

  const statusBadge = getStatusColor(project.status);

  // Informações agregadas
  const lastDecision = completeState?.decisions?.[0]?.decision || 'Nenhuma decisão formal registrada';
  const latestVersion = completeState?.versions?.[0]?.version || 'v0.1.0 (Dev)';
  const deliverablesCount = completeState?.deliverables?.length || 0;
  const testsPassed = completeState?.tests?.filter((t) => t.status === 'PASSOU').length || 0;
  const testsTotal = completeState?.tests?.length || 0;
  const pendingTasks = completeState?.missions?.filter((m) => m.status !== 'Concluída').length || 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Cabeçalho do Painel de Acompanhamento */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Tag className="w-3 h-3 text-cyan-400" /> {latestVersion}
            </span>
          </div>
          <h2 className="text-lg font-black text-white">{project.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{project.objective}</p>
        </div>

        {/* Indicadores rápidos em cartões compactos */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center min-w-[80px]">
            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Progresso</span>
            <span className="text-base font-black text-cyan-400">{project.progress}%</span>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center min-w-[80px]">
            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Pendências</span>
            <span className={`text-base font-black ${pendingTasks > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {pendingTasks}
            </span>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center min-w-[80px]">
            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Entregáveis</span>
            <span className="text-base font-black text-purple-400">{deliverablesCount}</span>
          </div>

          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center min-w-[80px]">
            <span className="block text-[10px] text-slate-500 font-semibold uppercase">Testes</span>
            <span className="text-base font-black text-emerald-400">
              {testsTotal > 0 ? `${testsPassed}/${testsTotal}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Jornada do Ciclo Permanente de Evolução */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            Jornada de Maturidade (Ciclo Permanente de Evolução)
          </span>
          <span className="text-xs text-cyan-400 font-medium">
            Etapa Atual: <strong className="text-white">{project.currentStage}</strong>
          </span>
        </div>

        {/* Linha do tempo visual responsiva */}
        <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="flex items-center min-w-[800px] justify-between relative px-2">
            {/* Linha de conexão de fundo */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-800 z-0" />
            {/* Linha preenchida até a etapa atual */}
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-emerald-500 z-0 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, (currentIdx / (LIFECYCLE_STAGES.length - 1)) * 92))}%` }}
            />

            {LIFECYCLE_STAGES.map((st, idx) => {
              const Icon = st.icon;
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              const isFuture = idx > currentIdx;

              return (
                <div key={st.id} className="flex flex-col items-center relative z-10 group cursor-default">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 font-bold ring-4 ring-cyan-500/30 scale-110 shadow-lg shadow-cyan-500/30'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 border border-slate-700 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap transition-colors ${
                      isCurrent
                        ? 'text-cyan-300 font-bold'
                        : isPast
                        ? 'text-slate-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resumo de Estado da Etapa Atual */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Próxima Ação Imediata</span>
            <p className="text-slate-200 mt-0.5">{project.nextAction || 'Defina o próximo passo no Debate com a IA'}</p>
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-slate-400 uppercase text-[10px] block">Última Decisão Arquitetural</span>
            <p className="text-slate-200 mt-0.5 truncate max-w-sm" title={lastDecision}>
              {lastDecision}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
