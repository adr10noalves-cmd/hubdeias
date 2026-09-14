import React from 'react';
import { Scale, ArrowRight, X } from 'lucide-react';
import { IAItem } from '../types';

interface FloatingCompareBarProps {
  compareIds: Set<number>;
  ias: IAItem[];
  onOpenCompare: () => void;
  onClearCompare: () => void;
}

export const FloatingCompareBar: React.FC<FloatingCompareBarProps> = ({
  compareIds,
  ias,
  onOpenCompare,
  onClearCompare,
}) => {
  if (compareIds.size === 0) return null;

  const selectedIAs = ias.filter((i) => compareIds.has(i.id));

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-3 px-4 shadow-[0_10px_40px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
          <Scale className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
            <span>Comparando ({compareIds.size}/2):</span>
            <span className="text-indigo-300 font-semibold truncate">
              {selectedIAs.map((i) => i.name).join(' vs ')}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {compareIds.size === 1
              ? 'Selecione mais 1 IA em qualquer card'
              : 'Pronto para visualizar o comparativo'}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenCompare}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-[0_2px_10px_rgba(99,102,241,0.4)] transition-all"
        >
          <span>Comparar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onClearCompare}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Limpar seleção"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
