import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  X,
  Play,
  MessageSquare,
  CheckSquare,
  XCircle,
} from 'lucide-react';
import { ProjectDecision, ProjectDecisionStatus } from '../../types';

interface ProjectDecisionsSectionProps {
  projectId: string;
  decisions: ProjectDecision[];
  onSaveDecision: (decision: ProjectDecision) => void;
  onDeleteDecision: (id: string) => void;
}

export const ProjectDecisionsSection: React.FC<ProjectDecisionsSectionProps> = ({
  projectId,
  decisions,
  onSaveDecision,
  onDeleteDecision,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [decisionText, setDecisionText] = useState('');
  const [reason, setReason] = useState('');
  const [responsible, setResponsible] = useState('Equipe Técnica');
  const [impact, setImpact] = useState('');
  const [status, setStatus] = useState<ProjectDecisionStatus>('SUGESTÃO');

  const handleOpenNew = () => {
    setEditingId(null);
    setDecisionText('');
    setReason('');
    setResponsible('Equipe Técnica');
    setImpact('');
    setStatus('SUGESTÃO');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: ProjectDecision) => {
    setEditingId(d.id);
    setDecisionText(d.decision);
    setReason(d.reason);
    setResponsible(d.responsible);
    setImpact(d.impact);
    setStatus(d.status);
    setIsModalOpen(true);
  };

  const handleQuickStatus = (d: ProjectDecision, newStatus: ProjectDecisionStatus) => {
    onSaveDecision({
      ...d,
      status: newStatus,
    });
  };

  const getStatusBadge = (st: ProjectDecisionStatus) => {
    switch (st) {
      case 'SUGESTÃO':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      case 'EM DISCUSSÃO':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'APROVADA':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60';
      case 'EM EXECUÇÃO':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60 animate-pulse';
      case 'CONCLUÍDA':
      case 'Ativa':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'Revisada':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'Revogada':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionText.trim()) return;

    const newDecision: ProjectDecision = {
      id: editingId || `dec-${Date.now()}`,
      projectId,
      decision: decisionText.trim(),
      reason: reason.trim() || 'Não especificado',
      date: new Date().toLocaleDateString(),
      responsible: responsible.trim() || 'Equipe',
      impact: impact.trim() || 'Geral',
      status,
    };

    onSaveDecision(newDecision);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Ciclo de Decisões e Aprovações</h3>
            <p className="text-slate-400 text-xs">
              Fluxo: <span className="text-purple-400">Sugestão</span> → <span className="text-amber-400">Em Discussão</span> → <span className="text-cyan-400">Aprovada</span> → <span className="text-blue-400">Em Execução</span> → <span className="text-emerald-400">Concluída</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" /> Propor Decisão
        </button>
      </div>

      {decisions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
          Nenhuma decisão ou proposta registrada. Debata com o Agente e registre aqui.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {decisions.map((d) => (
            <div key={d.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3 relative group">
              <div className="flex items-start justify-between gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(d.status)}`}>
                  {d.status}
                </span>
                <span className="text-[11px] text-slate-500">{d.date}</span>
              </div>

              <div>
                <h4 className="font-bold text-white text-xs sm:text-sm mb-1">{d.decision}</h4>
                <p className="text-slate-400 text-xs"><strong className="text-slate-300">Motivo:</strong> {d.reason}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <div>Resp: <span className="text-slate-300">{d.responsible}</span></div>
                <div className="truncate max-w-[150px]" title={d.impact}>Impacto: <span className="text-cyan-300">{d.impact}</span></div>
              </div>

              {/* Botões de ação do ciclo de decisão */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-800/40">
                {(d.status === 'SUGESTÃO' || d.status === 'EM DISCUSSÃO') && (
                  <>
                    <button
                      onClick={() => handleQuickStatus(d, 'APROVADA')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700/50 text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" /> Aprovar Implementação
                    </button>
                    {d.status === 'SUGESTÃO' && (
                      <button
                        onClick={() => handleQuickStatus(d, 'EM DISCUSSÃO')}
                        className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-700/50 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" /> Continuar Debatendo
                      </button>
                    )}
                    <button
                      onClick={() => handleQuickStatus(d, 'Revogada')}
                      className="px-2 py-1 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-800/40 text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3 h-3" /> Cancelar
                    </button>
                  </>
                )}

                {d.status === 'APROVADA' && (
                  <button
                    onClick={() => handleQuickStatus(d, 'EM EXECUÇÃO')}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-700/50 text-[11px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3 h-3" /> Iniciar Execução
                  </button>
                )}

                {d.status === 'EM EXECUÇÃO' && (
                  <button
                    onClick={() => handleQuickStatus(d, 'CONCLUÍDA')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700/50 text-[11px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <CheckSquare className="w-3 h-3" /> Concluir Execução
                  </button>
                )}
              </div>

              <div className="absolute top-3 right-3 hidden group-hover:flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 shadow-md">
                <button
                  onClick={() => handleOpenEdit(d)}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteDecision(d.id)}
                  className="p-1 text-rose-400 hover:text-rose-300"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingId ? 'Editar Decisão' : 'Propor Nova Decisão'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Decisão / Proposta Técnica *</label>
                <input
                  type="text"
                  required
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  placeholder="Ex: Usar PostgreSQL com Drizzle em vez de MongoDB..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Justificativa Técnica</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Por que essa escolha é ideal? Quais alternativas foram descartadas?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Responsável / Autor</label>
                  <input
                    type="text"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Impacto no Projeto</label>
                  <input
                    type="text"
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    placeholder="Ex: Baixa latência, migração futura..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Estado do Fluxo de Aprovação</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectDecisionStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="SUGESTÃO">SUGESTÃO (Proposta inicial da IA ou equipe)</option>
                  <option value="EM DISCUSSÃO">EM DISCUSSÃO (Em análise e debate)</option>
                  <option value="APROVADA">APROVADA (Autorizada pelo usuário)</option>
                  <option value="EM EXECUÇÃO">EM EXECUÇÃO (Em desenvolvimento ativo)</option>
                  <option value="CONCLUÍDA">CONCLUÍDA (Implementada com sucesso)</option>
                  <option value="Ativa">Ativa (Vigente)</option>
                  <option value="Revisada">Revisada (Atualizada posteriormente)</option>
                  <option value="Revogada">Revogada (Cancelada)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
                >
                  {editingId ? 'Salvar Alterações' : 'Registrar Decisão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
