import React, { useState } from 'react';
import { X, Scale, ExternalLink, Check, Sparkles, Gauge, CreditCard, CheckCircle2 } from 'lucide-react';
import { IAItem } from '../types';
import {
  categoryIcons,
  getLevelBadgeClass,
  getDifficultyBadgeClass,
  getPricingBadgeClass,
  resolveIADetails,
} from '../utils/helpers';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ias: IAItem[];
  compareIds: Set<number>;
  onToggleCompare: (id: number) => void;
  onClearCompare: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  ias,
  compareIds,
  onToggleCompare,
  onClearCompare,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const selectedIAs = ias.filter((i) => compareIds.has(i.id));

  const filteredList = ias.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const metrics = ['Geral', 'Código', 'Pesquisa', 'Criação', 'Automação'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0d1528] border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_25px_90px_rgba(0,0,0,0.85)] my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-300 font-display">
                ⚖️ Comparador Tático • drico IAS
              </h2>
              <p className="text-xs text-slate-400">
                Selecione até 2 IAs para comparar lado a lado facilidade, preços, diferenciais e melhores tarefas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1">
          {/* Selected Head-to-Head Section */}
          {selectedIAs.length === 2 ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedIAs.map((tool, idx) => {
                  const details = resolveIADetails(tool);
                  return (
                    <div
                      key={tool.id}
                      className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 relative space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            Opção {idx === 0 ? 'A' : 'B'}
                          </span>
                          <h3 className="text-xl font-black text-white font-display">
                            {tool.name}
                          </h3>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getLevelBadgeClass(
                            tool.level
                          )}`}
                        >
                          {tool.level}
                        </span>
                      </div>

                      {/* Badges: Dificuldade e Preço */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${getDifficultyBadgeClass(
                            details.difficulty
                          )}`}
                        >
                          <Gauge className="w-3 h-3" />
                          <span>Dificuldade: {details.difficulty}</span>
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${getPricingBadgeClass(
                            details.pricing
                          )}`}
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{details.pricing}</span>
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span>{categoryIcons[tool.category]}</span>
                        <span>{tool.category}</span>
                      </div>

                      {/* Details Box */}
                      <div className="space-y-2 text-xs">
                        <div className="bg-[#050b1a] p-2.5 rounded-xl border border-slate-800">
                          <strong className="text-cyan-300 block mb-0.5 font-bold">Para que serve:</strong>
                          <span className="text-slate-200">{details.whatIsItFor}</span>
                        </div>

                        <div className="bg-[#050b1a] p-2.5 rounded-xl border border-slate-800">
                          <strong className="text-teal-300 block mb-0.5 font-bold">Versão Grátis & Limitações:</strong>
                          <span className="text-slate-300">{details.pricingDetails}</span>
                        </div>

                        <div className="bg-[#050b1a] p-2.5 rounded-xl border border-slate-800">
                          <strong className="text-indigo-300 block mb-0.5 font-bold">Melhores Tarefas:</strong>
                          <ul className="space-y-1 mt-1">
                            {details.bestTasks.slice(0, 2).map((t, i) => (
                              <li key={i} className="flex items-center gap-1.5 text-slate-200 text-[11px]">
                                <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                                <span className="truncate">{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Competency bars */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Avaliação de Competência
                        </span>
                        {metrics.map((m) => {
                          const val = tool.scores[m] ?? 3;
                          return (
                            <div key={m} className="grid grid-cols-[65px_1fr_20px] items-center gap-2 text-xs">
                              <span className="text-slate-400 text-[11px]">{m}</span>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-cyan-400 rounded-full"
                                  style={{ width: `${val * 20}%` }}
                                />
                              </div>
                              <span className="text-right font-bold text-slate-200 text-xs">{val}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                        <a
                          href={tool.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold"
                        >
                          <span>Acessar {tool.name}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => onToggleCompare(tool.id)}
                          className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strategic Comparison Conclusion */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 via-indigo-950/50 to-cyan-950/50 border border-cyan-500/30 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <strong className="text-cyan-300 block mb-1 font-bold">
                    💡 Dica de Escolha para Iniciantes:
                  </strong>
                  <p>
                    Para o seu dia a dia, observe primeiro a <strong>Dificuldade</strong> e se o <strong>Plano Gratuito</strong> atende ao seu volume. Se busca rapidez em tarefas gerais, <strong>{selectedIAs[0].name}</strong> destaca-se por {selectedIAs[0].specialty.toLowerCase()}; já se você precisa de {selectedIAs[1].specialty.toLowerCase()}, opte por <strong>{selectedIAs[1].name}</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <p className="text-sm text-slate-300">
                {selectedIAs.length === 0
                  ? 'Nenhuma IA selecionada ainda. Marque 2 IAs na lista abaixo para comparar lado a lado.'
                  : `1 IA selecionada (${selectedIAs[0].name}). Escolha mais 1 IA para iniciar o comparativo.`}
              </p>
            </div>
          )}

          {/* Selection List */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Lista de IAs para Selecionar ({compareIds.size}/2 selecionadas)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por nome ou tarefa..."
                  className="bg-[#050b1a] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
                />
                {compareIds.size > 0 && (
                  <button
                    onClick={onClearCompare}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-1">
              {filteredList.map((tool) => {
                const isSelected = compareIds.has(tool.id);
                return (
                  <button
                    key={tool.id}
                    onClick={() => onToggleCompare(tool.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-400 text-white font-semibold'
                        : 'bg-[#050b1a] hover:bg-slate-800/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold truncate">{tool.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {tool.category.split(' / ')[0]}
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                        isSelected
                          ? 'bg-indigo-500 border-indigo-400 text-white'
                          : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-cyan-500/20 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

