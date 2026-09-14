import React from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle, Cloud } from 'lucide-react';

export type SyncStatus = 'idle' | 'syncing' | 'connected' | 'error';

interface FirebaseStatusBadgeProps {
  status: SyncStatus;
  errorMessage?: string;
  onManualSync?: () => void;
  itemCount?: number;
}

export const FirebaseStatusBadge: React.FC<FirebaseStatusBadgeProps> = ({
  status,
  errorMessage,
  onManualSync,
  itemCount,
}) => {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all shadow-sm"
      style={{
        backgroundColor:
          status === 'connected'
            ? 'rgba(16, 185, 129, 0.12)'
            : status === 'syncing'
            ? 'rgba(6, 182, 212, 0.15)'
            : status === 'error'
            ? 'rgba(239, 68, 68, 0.12)'
            : 'rgba(51, 65, 85, 0.4)',
        borderColor:
          status === 'connected'
            ? 'rgba(52, 211, 153, 0.4)'
            : status === 'syncing'
            ? 'rgba(34, 211, 238, 0.4)'
            : status === 'error'
            ? 'rgba(248, 113, 113, 0.4)'
            : 'rgba(71, 85, 105, 0.4)',
      }}
    >
      <div className="flex items-center gap-1.5">
        {status === 'connected' && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-semibold">
              Firebase Nuvem Conectado
              {typeof itemCount === 'number' && ` (${itemCount})`}
            </span>
          </>
        )}

        {status === 'syncing' && (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="text-cyan-300 font-semibold">Sincronizando Firestore...</span>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-300 font-semibold" title={errorMessage || 'Erro de conexão'}>
              Modo Local (Firestore offline)
            </span>
          </>
        )}

        {status === 'idle' && (
          <>
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">Banco Local</span>
          </>
        )}
      </div>

      {onManualSync && (
        <button
          onClick={onManualSync}
          disabled={status === 'syncing'}
          className="ml-1 p-1 hover:bg-white/10 rounded-md text-slate-300 hover:text-white transition-colors disabled:opacity-40"
          title="Forçar sincronização manual com Firestore"
        >
          <RefreshCw className={`w-3 h-3 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};
