import React, { useState } from 'react';
import { IdeaItem, IdeaVersion } from '../../types';
import { GitCommit, Plus, History, Clock, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

interface IdeaEvolutionHistoryProps {
  idea: IdeaItem;
  versions: IdeaVersion[];
  onAddVersion: (newVersion: Omit<IdeaVersion, 'id' | 'createdAt'>) => Promise<void>;
  isLoading?: boolean;
}

export const IdeaEvolutionHistory: React.FC<IdeaEvolutionHistoryProps> = ({
  idea,
  versions,
  onAddVersion,
  isLoading,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [nextVersionNumber, setNextVersionNumber] = useState(`V${versions.length + 2}`);
  const [changedSummary, setChangedSummary] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [decisionTaken, setDecisionTaken] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changedSummary.trim()) return;

    try {
      setSubmitting(true);
      await onAddVersion({
        ideaId: idea.id,
        version: nextVersionNumber.trim() || `V${versions.length + 2}`,
        changedSummary: changedSummary.trim(),
        changeReason: changeReason.trim(),
        decisionTaken: decisionTaken.trim(),
        nextStep: nextStep.trim(),
        observations: observations.trim(),
      });
      setChangedSummary('');
      setChangeReason('');
      setDecisionTaken('');
      setNextStep('');
      setObservations('');
      setIsAdding(false);
    } catch (err) {
      console.error('Erro ao adicionar versão:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-cyan-400" />
            <span>Linha Temporal de Evolução</span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
              Versão Atual: {idea.currentVersion || 'V1'}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro cronológico das transformações, decisões tomadas e marcos do projeto.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => {
              setNextVersionNumber(`V${versions.length + 2}`);
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Nova Evolução</span>
          </button>
        )}
      </div>

      {/* Formulário de Registro de Nova Evolução */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-cyan-400" />
              <span>Novo Marco de Versão</span>
            </h4>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-semibold">Identificador:</label>
              <input
                type="text"
                value={nextVersionNumber}
                onChange={(e) => setNextVersionNumber(e.target.value)}
                placeholder="Ex: V2"
                className="w-20 px-2 py-1 rounded-lg bg-slate-800 border border-cyan-500/50 text-white text-xs font-bold text-center focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">O que mudou nesta versão? *</label>
            <input
              type="text"
              required
              value={changedSummary}
              onChange={(e) => setChangedSummary(e.target.value)}
              placeholder="Ex: Refatoramos o motor de OCR para trabalhar com processamento assíncrono."
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Motivo da mudança:</label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="Ex: Identificado travamento em PDFs com mais de 50 páginas."
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Decisão tomada:</label>
              <input
                type="text"
                value={decisionTaken}
                onChange={(e) => setDecisionTaken(e.target.value)}
                placeholder="Ex: Adotamos fila de processamento com chunking de 10 páginas."
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Próximo passo derivado:</label>
              <input
                type="text"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="Ex: Implementar cache de OCR no Firestore."
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Observações estratégicas:</label>
              <input
                type="text"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: Essa mudança viabilizou planos B2B."
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              {submitting ? 'Salvando...' : 'Salvar Versão'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Versões */}
      {versions.length === 0 ? (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">
            Ainda não há evoluções gravadas para este projeto. Registre quando fizer uma alteração importante de rumo ou arquitetura!
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-indigo-500 before:to-slate-800">
          {versions.map((ver) => (
            <div key={ver.id} className="relative group">
              {/* Ponto na timeline */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-[10px] text-cyan-300 font-bold group-hover:scale-125 transition-transform shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                <GitCommit className="w-3 h-3" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                      {ver.version}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {ver.changedSummary}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(ver.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {ver.changeReason && (
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <span className="text-slate-400 font-medium block text-[10px] uppercase">Motivo:</span>
                      <span className="text-slate-300">{ver.changeReason}</span>
                    </div>
                  )}
                  {ver.decisionTaken && (
                    <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
                      <span className="text-slate-400 font-medium block text-[10px] uppercase">Decisão:</span>
                      <span className="text-slate-300">{ver.decisionTaken}</span>
                    </div>
                  )}
                </div>

                {ver.nextStep && (
                  <div className="flex items-center gap-1.5 text-xs text-cyan-300/90 pt-1">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Próximo passo: <strong>{ver.nextStep}</strong></span>
                  </div>
                )}

                {ver.observations && (
                  <p className="text-xs text-slate-400 italic pt-1 border-t border-slate-800/80">
                    Obs: {ver.observations}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
