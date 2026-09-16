import React from 'react';
import { IdeaStage, IDEA_STAGES } from '../../types';

interface MaturityStageBarProps {
  currentStage: IdeaStage;
  onSelectStage?: (stage: IdeaStage) => void;
  interactive?: boolean;
}

export const MaturityStageBar: React.FC<MaturityStageBarProps> = ({
  currentStage,
  onSelectStage,
  interactive = false,
}) => {
  const currentIndex = IDEA_STAGES.indexOf(currentStage);

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-cyan-300">
          Maturidade: <strong className="text-white">{currentStage}</strong>
        </span>
        <span className="text-[11px] text-slate-400">
          Etapa {currentIndex + 1} de {IDEA_STAGES.length}
        </span>
      </div>

      {/* Grid de 9 blocos */}
      <div className="grid grid-cols-9 gap-1 sm:gap-1.5">
        {IDEA_STAGES.map((stage, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const stageNumber = idx + 1;
          const shortName = stage.replace(/^\d+\.\s*/, '');

          return (
            <button
              key={stage}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onSelectStage?.(stage)}
              title={`${stage} ${isCurrent ? '(Estágio Atual)' : ''}`}
              className={`group relative py-1 px-0.5 rounded flex flex-col items-center justify-center transition-all ${
                interactive ? 'cursor-pointer hover:scale-105' : 'cursor-default'
              } ${
                isCurrent
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.6)] ring-1 ring-white/60'
                  : isPassed
                  ? 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800/60 border border-slate-700/50 text-slate-400'
              }`}
            >
              <span className="text-[10px] sm:text-xs leading-none font-bold">
                {stageNumber}
              </span>
              <span className="hidden md:inline text-[9px] truncate max-w-full leading-tight opacity-80 mt-0.5">
                {shortName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
