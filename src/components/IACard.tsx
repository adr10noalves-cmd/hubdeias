import React from 'react';
import { ExternalLink, Scale, Check, Edit3, Trash2, Info, Gauge, CreditCard, BookOpen } from 'lucide-react';
import { IAItem } from '../types';
import {
  categoryIcons,
  getLevelBadgeClass,
  getDifficultyBadgeClass,
  getPricingBadgeClass,
  resolveIADetails,
} from '../utils/helpers';

interface IACardProps {
  ia: IAItem;
  isCompared: boolean;
  onToggleCompare: (id: number) => void;
  onOpenDetail: (ia: IAItem) => void;
  onEdit: (ia: IAItem) => void;
  onDelete: (id: number) => void;
}

export const IACard: React.FC<IACardProps> = ({
  ia,
  isCompared,
  onToggleCompare,
  onOpenDetail,
  onEdit,
  onDelete,
}) => {
  const details = resolveIADetails(ia);
  const scores = ia.scores || { Geral: 3, Código: 3, Pesquisa: 3, Criação: 3, Automação: 3 };
  const scoreBars = [
    { label: 'Geral', value: scores.Geral ?? 3 },
    { label: 'Código', value: scores.Código ?? 2 },
    { label: 'Pesquisa', value: scores.Pesquisa ?? 3 },
    { label: 'Criação', value: scores.Criação ?? 3 },
    { label: 'Automação', value: scores.Automação ?? 3 },
  ];

  return (
    <article className="group relative flex flex-col justify-between bg-gradient-to-b from-[#10192e]/90 to-[#0a101f]/95 border border-cyan-500/20 hover:border-cyan-400/60 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.45)] shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3
              onClick={() => onOpenDetail(ia)}
              className="text-lg font-bold text-white font-display tracking-tight truncate group-hover:text-cyan-200 transition-colors cursor-pointer"
              title="Clique para ver todos os detalhes da IA"
            >
              {ia.name}
            </h3>
            <p className="text-xs font-semibold text-cyan-400 line-clamp-1 mt-0.5 leading-snug">
              {ia.specialty}
            </p>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${getLevelBadgeClass(
              ia.level
            )}`}
          >
            {ia.level}
          </span>
        </div>

        {/* Quick Badges: Difficulty & Pricing */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${getDifficultyBadgeClass(
              details.difficulty
            )}`}
          >
            <Gauge className="w-3 h-3" />
            <span>{details.difficulty}</span>
          </span>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${getPricingBadgeClass(
              details.pricing
            )}`}
          >
            <CreditCard className="w-3 h-3" />
            <span>{details.pricing}</span>
          </span>

          {ia.sourceType === 'groq_discovered' && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              title={`Descoberta pelo Curador Groq (${ia.discoveredAt ? new Date(ia.discoveredAt).toLocaleDateString() : ''})`}
            >
              <span>⚡ Curadoria Groq</span>
            </span>
          )}
        </div>

        {/* Para que serve / O que é */}
        <div
          onClick={() => onOpenDetail(ia)}
          className="cursor-pointer my-2.5 text-xs text-slate-300 leading-relaxed bg-[#060c1c]/80 hover:bg-[#081228] border border-slate-800/90 rounded-xl p-2.5 min-h-[58px] flex flex-col justify-center transition-colors"
          title="Clique para ver o resumo completo"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            Melhor Utilização:
          </div>
          <span className="line-clamp-2 text-slate-200">
            {details.bestTasks[0] || details.whatIsItFor}
          </span>
        </div>

        {/* Category & Status Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[10px] font-medium text-slate-400 bg-slate-900 border border-slate-800 rounded-md px-2 py-0.5">
            {categoryIcons[ia.category]} {ia.category.split(' / ')[0]}
          </span>
          {isCompared && (
            <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-500/40 rounded-md px-2 py-0.5 flex items-center gap-1">
              <Check className="w-2.5 h-2.5 text-indigo-400" />
              Na comparação
            </span>
          )}
        </div>

        {/* Metric Bars */}
        <div className="space-y-1.5 mb-3 pt-2 border-t border-slate-800/60">
          {scoreBars.map((bar) => {
            const percentage = Math.min(100, Math.max(0, bar.value * 20));
            return (
              <div key={bar.label} className="grid grid-cols-[68px_1fr_20px] items-center gap-2 text-[11px] text-slate-400">
                <span className="truncate">{bar.label}</span>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-right font-semibold text-slate-300">{bar.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-slate-800/70 space-y-2">
        {/* BOTÃO OFICIAL REQUISITADO: VER FICHA OPERACIONAL */}
        <button
          onClick={() => onOpenDetail(ia)}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600/30 via-cyan-500/25 to-indigo-600/30 hover:from-blue-600/45 hover:via-cyan-500/40 hover:to-indigo-600/45 border border-cyan-400/50 hover:border-cyan-300 text-cyan-200 hover:text-white font-black text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(0,212,255,0.12)] hover:shadow-[0_0_22px_rgba(0,212,255,0.25)] hover:scale-[1.01] active:scale-[0.99]"
          title="Ver Ficha Operacional Prática com 7 seções e prompts"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
          <span>📘 VER FICHA OPERACIONAL</span>
        </button>

        {/* Link Oficial da Ferramenta */}
        <div className="flex items-center gap-2">
          <a
            href={ia.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 hover:text-cyan-300 font-bold text-xs transition-all"
            title="Abrir site oficial da ferramenta em nova aba"
          >
            <span>Acessar Site Oficial</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Secondary Tool actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => onToggleCompare(ia.id)}
            className={`flex-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
              isCompared
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isCompared ? 'Remover da comparação' : 'Adicionar para comparar'}
          >
            <Scale className="w-3 h-3" />
            <span>{isCompared ? 'Comparando' : 'Comparar'}</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(ia)}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
              title="Editar dados da IA"
            >
              <Edit3 className="w-3 h-3" />
            </button>

            <button
              onClick={() => onDelete(ia.id)}
              className="p-1.5 rounded-lg bg-slate-800/30 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/40 text-slate-500 hover:text-red-400 transition-colors"
              title="Excluir IA"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

