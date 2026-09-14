import React from 'react';
import {
  X,
  ExternalLink,
  Scale,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Zap,
  Tag,
  Lightbulb,
  ShieldCheck,
  CreditCard,
  Gauge,
} from 'lucide-react';
import { IAItem } from '../types';
import {
  categoryIcons,
  getLevelBadgeClass,
  getDifficultyBadgeClass,
  getPricingBadgeClass,
  resolveIADetails,
} from '../utils/helpers';

interface IADetailModalProps {
  ia: IAItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleCompare: (id: number) => void;
  isCompared: boolean;
  onEdit: (ia: IAItem) => void;
}

export const IADetailModal: React.FC<IADetailModalProps> = ({
  ia,
  isOpen,
  onClose,
  onToggleCompare,
  isCompared,
  onEdit,
}) => {
  if (!isOpen || !ia) return null;

  const details = resolveIADetails(ia);
  const scores = ia.scores || { Geral: 3, Código: 3, Pesquisa: 3, Criação: 3, Automação: 3 };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ia-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl bg-[#0d1528] border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_25px_90px_rgba(0,0,0,0.85)] my-6 max-h-[92vh] flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-cyan-500/20 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 font-medium inline-flex items-center gap-1.5">
                <span>{categoryIcons[ia.category]}</span>
                <span>{ia.category}</span>
              </span>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 ${getDifficultyBadgeClass(
                  details.difficulty
                )}`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Nível: {details.difficulty}</span>
              </span>

              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 ${getPricingBadgeClass(
                  details.pricing
                )}`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{details.pricing}</span>
              </span>
            </div>

            <h2 id="ia-detail-title" className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              {ia.name}
            </h2>

            <p className="text-sm font-semibold text-cyan-300">
              {ia.specialty}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto py-5 space-y-5 pr-1 text-sm text-slate-200">
          {/* Grid: O que é & Para que serve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#060c1c] border border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2 text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>1. O que é</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                {details.whatIsIt}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#060c1c] border border-cyan-500/20">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2 text-xs uppercase tracking-wider">
                <Zap className="w-4 h-4" />
                <span>2. Para que serve</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                {details.whatIsItFor}
              </p>
            </div>
          </div>

          {/* Melhor tipo de tarefa */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-slate-900/60 border border-cyan-500/30">
            <div className="flex items-center gap-2 text-cyan-300 font-bold mb-3 text-xs sm:text-sm uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>3. Melhores tarefas para utilizar</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {details.bestTasks.map((task, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 bg-[#040916]/80 p-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Principais Habilidades & Diferencial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#060c1c] border border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2 text-xs uppercase tracking-wider">
                <Tag className="w-4 h-4" />
                <span>4. Principais Habilidades</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {details.keySkills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs font-medium"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#060c1c] border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2 text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>5. Diferencial Competitivo</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {ia.differential}
              </p>
            </div>
          </div>

          {/* Versão Gratuita & Limitações + Dificuldade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#060c1c] border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold mb-2 text-xs uppercase tracking-wider">
                <CreditCard className="w-4 h-4" />
                <span>6. Versão Gratuita & Limitações</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-2">
                {details.pricingDetails}
              </p>
              <div className="inline-block text-[11px] font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                Modelo: {details.pricing}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#060c1c] border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2 text-xs uppercase tracking-wider">
                <Lightbulb className="w-4 h-4" />
                <span>7. Dica de Ouro para Iniciantes</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {details.beginnerTip}
              </p>
            </div>
          </div>

          {/* Competências técnicas */}
          <div className="p-4 rounded-2xl bg-[#060c1c] border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Avaliação de Competência
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${getLevelBadgeClass(ia.level)}`}>
                Classificação: {ia.level}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { label: 'Geral', val: scores.Geral ?? 3 },
                { label: 'Código', val: scores.Código ?? 3 },
                { label: 'Pesquisa', val: scores.Pesquisa ?? 3 },
                { label: 'Criação', val: scores.Criação ?? 3 },
                { label: 'Automação', val: scores.Automação ?? 3 },
              ].map((s) => (
                <div key={s.label} className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] text-slate-400 mb-1">{s.label}</div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1">
                    <div className="h-full bg-cyan-400" style={{ width: `${s.val * 20}%` }} />
                  </div>
                  <div className="text-xs font-bold text-cyan-300">{s.val} / 5</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleCompare(ia.id)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isCompared
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isCompared ? '✓ Selecionada para Comparar' : '⚖ Adicionar à Comparação'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(ia);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Editar Dados
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Fechar
            </button>

            <a
              href={ia.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(0,180,255,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Acessar Ferramenta Oficial</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
