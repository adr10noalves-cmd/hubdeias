import React from 'react';
import { CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

export type SaveState = 'saved' | 'saving' | 'error' | 'idle';

interface AutoSaveIndicatorProps {
  state: SaveState;
  lastSavedAt?: string;
  errorMessage?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  state,
  lastSavedAt,
  errorMessage,
}) => {
  if (state === 'idle' && !lastSavedAt) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300">
      {state === 'saving' && (
        <span className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/40 border-cyan-500/30">
          <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
          <span>Salvando no Firestore...</span>
        </span>
      )}
      {state === 'saved' && (
        <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Salvo na nuvem</span>
        </span>
      )}
      {state === 'error' && (
        <span
          className="flex items-center gap-1.5 text-rose-400 bg-rose-950/40 border-rose-500/30"
          title={errorMessage || 'Erro ao sincronizar'}
        >
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>Falha ao salvar (salvo localmente)</span>
        </span>
      )}
    </div>
  );
};
