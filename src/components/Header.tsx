import React from 'react';
import { Sparkles, Layers, Cpu, Smile, Brain } from 'lucide-react';
import { IAItem } from '../types';

interface HeaderProps {
  ias: IAItem[];
  onOpenMotor?: () => void;
  onOpenCentralIA?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ ias, onOpenMotor, onOpenCentralIA }) => {
  const handleOpenCentral = onOpenCentralIA || onOpenMotor;
  const beginnerCount = ias.filter((i) => i.difficulty === 'Iniciante' || !i.difficulty).length;
  const freeCount = ias.filter(
    (i) => i.pricing === 'Gratuito' || i.pricing === 'Freemium (Grátis + Pago)' || !i.pricing
  ).length;

  return (
    <header className="pt-8 pb-6 text-center relative z-10">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/35 bg-cyan-500/10 text-cyan-300 text-xs font-bold tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(0,212,255,0.15)]">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>HUB ESTRATÉGICO DE IAs — V2.4 • CENTRAL DE COMANDO</span>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-indigo-400 mb-3">
        drico IAS
      </h1>

      <p className="max-w-2xl mx-auto text-cyan-200/90 text-base sm:text-lg font-medium mb-2">
        A sua central operacional e estratégica de Inteligências Artificiais.
      </p>

      <p className="max-w-3xl mx-auto text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
        Descubra em segundos <strong className="text-white font-semibold">o que cada IA faz</strong>,{' '}
        <strong className="text-cyan-300 font-semibold">para que serve</strong>, se tem versão gratuita e{' '}
        <strong className="text-emerald-300 font-semibold">qual a melhor ferramenta para o seu objetivo</strong> com a nossa Central de IA com motor Groq.
      </p>

      {/* CTA Hero Button: CENTRAL DE IA */}
      {handleOpenCentral && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={handleOpenCentral}
            className="group flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white font-black text-sm tracking-wide transition-all shadow-[0_0_30px_rgba(6,182,212,0.45)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] hover:scale-[1.04] active:scale-[0.98] border border-cyan-200/50"
          >
            <Brain className="w-5 h-5 text-cyan-200 stroke-[2.5] group-hover:scale-110 transition-transform animate-pulse" />
            <span>🧠 CENTRAL DE IA — ABRIR PAINEL OPERACIONAL</span>
          </button>
        </div>
      )}

      {/* Quick Stats Pill */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs sm:text-sm">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Total: <strong className="text-white font-bold">{ias.length}</strong> IAs catalogadas</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
          <Smile className="w-4 h-4 text-emerald-400" />
          <span>Fáceis para Iniciantes: <strong className="text-emerald-300 font-bold">{beginnerCount}</strong></span>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
          <Layers className="w-4 h-4 text-teal-400" />
          <span>Com Plano Gratuito/Freemium: <strong className="text-teal-300 font-bold">{freeCount}</strong></span>
        </div>
      </div>
    </header>
  );
};


