import React, { useRef } from 'react';
import { Plus, Compass, Scale, Download, Upload, RotateCcw, Brain, Sparkles } from 'lucide-react';
import { FirebaseStatusBadge, SyncStatus } from './FirebaseStatusBadge';

interface ToolbarProps {
  onOpenCentralIA?: () => void;
  onOpenMotor: () => void;
  onOpenAddModal: () => void;
  onToggleDecision: () => void;
  isDecisionOpen: boolean;
  onOpenCompare: () => void;
  compareCount: number;
  onExportJSON: () => void;
  onImportJSON: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDefault: () => void;
  firebaseStatus?: SyncStatus;
  firebaseError?: string;
  onManualSyncFirestore?: () => void;
  iaCount?: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenCentralIA,
  onOpenMotor,
  onOpenAddModal,
  onToggleDecision,
  isDecisionOpen,
  onOpenCompare,
  compareCount,
  onExportJSON,
  onImportJSON,
  onResetDefault,
  firebaseStatus = 'idle',
  firebaseError,
  onManualSyncFirestore,
  iaCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCentral = onOpenCentralIA || onOpenMotor;

  return (
    <nav aria-label="Ações do catálogo" className="sticky top-3 z-40 bg-slate-900/85 backdrop-blur-xl border border-cyan-500/25 rounded-2xl p-3 sm:p-4 mb-6 shadow-[0_10px_35px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left main triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* BOTÃO PRINCIPAL: 🧠 CENTRAL DE IA (Substitui "ME AJUDE A ESCOLHER") */}
          <button
            onClick={handleOpenCentral}
            className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] hover:scale-[1.03] active:scale-[0.98] border border-cyan-200/50"
            title="Abrir Central de IA: Comandos, Estratégias, Prompts e Catálogo"
          >
            <Brain className="w-4.5 h-4.5 text-cyan-200 stroke-[2.5] animate-pulse" />
            <span>🧠 CENTRAL DE IA</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 text-white font-semibold text-xs sm:text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Cadastrar uma nova IA no catálogo"
          >
            <Plus className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
            <span>Nova IA</span>
          </button>

          <button
            onClick={onToggleDecision}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
              isDecisionOpen
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,212,255,0.25)]'
                : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
            }`}
            title="Abrir matriz rápida de categorias operacionais"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Matriz de Decisão</span>
            <span className="sm:hidden">Matriz</span>
          </button>

          <button
            onClick={onOpenCompare}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
              compareCount > 0
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-200 hover:border-slate-500'
            }`}
          >
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>Comparar</span>
            {compareCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">
                {compareCount}
              </span>
            )}
          </button>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <FirebaseStatusBadge
            status={firebaseStatus}
            errorMessage={firebaseError}
            onManualSync={onManualSyncFirestore}
            itemCount={iaCount}
          />

          <button
            onClick={onExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="Baixar backup do catálogo em formato JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            title="Importar catálogo em formato JSON"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Importar</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={onImportJSON}
          />

          <button
            onClick={onResetDefault}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/40 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            title="Restaurar catálogo padrão de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

