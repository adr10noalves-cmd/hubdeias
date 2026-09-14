import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ShieldAlert,
  Terminal,
  Target,
  Scale,
  Edit3,
  Layers,
  Info,
  Gauge,
  CreditCard,
} from 'lucide-react';
import { IAItem } from '../types';
import { resolveOperationalSheet, AUTO_GENERATED_LABEL } from '../utils/operationalSheet';
import {
  categoryIcons,
  getLevelBadgeClass,
  getDifficultyBadgeClass,
  getPricingBadgeClass,
  resolveIADetails,
} from '../utils/helpers';

interface FichaOperacionalModalProps {
  ia: IAItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleCompare?: (id: number) => void;
  isCompared?: boolean;
  onEdit?: (ia: IAItem) => void;
}

export const FichaOperacionalModal: React.FC<FichaOperacionalModalProps> = ({
  ia,
  isOpen,
  onClose,
  onToggleCompare,
  isCompared = false,
  onEdit,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !ia) return null;

  const sheet = resolveOperationalSheet(ia);
  const details = resolveIADetails(ia);

  const handleCopyPrompt = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(sheet.exemploPrompt);
      } else {
        // Fallback para navegadores legados / iframe restrito
        const textArea = document.createElement('textarea');
        textArea.value = sheet.exemploPrompt;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar prompt:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ficha-operacional-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-[#0b1325] border border-cyan-500/40 rounded-3xl shadow-[0_25px_90px_rgba(0,180,255,0.25)] my-auto max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top glowing cyan/indigo border strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 shrink-0" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-cyan-500/20 bg-[#070e1c] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider uppercase px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 shadow-[0_0_12px_rgba(0,212,255,0.2)]">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>FICHA OPERACIONAL PRÁTICA</span>
                </span>

                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 font-medium inline-flex items-center gap-1.5">
                  <span>{categoryIcons[ia.category]}</span>
                  <span>{ia.category}</span>
                </span>

                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${getLevelBadgeClass(
                    ia.level
                  )}`}
                >
                  Nível: {ia.level}
                </span>

                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-bold inline-flex items-center gap-1 ${getDifficultyBadgeClass(
                    details.difficulty
                  )}`}
                >
                  <Gauge className="w-3 h-3" />
                  <span>{details.difficulty}</span>
                </span>

                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-bold inline-flex items-center gap-1 ${getPricingBadgeClass(
                    details.pricing
                  )}`}
                >
                  <CreditCard className="w-3 h-3" />
                  <span>{details.pricing}</span>
                </span>
              </div>

              {/* NOME DA IA */}
              <h2
                id="ficha-operacional-title"
                className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-white tracking-tight pt-1"
              >
                {sheet.nome}
              </h2>

              {/* Especialidade & Link oficial */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm pt-0.5">
                <div className="text-cyan-300 font-semibold flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Especialidade:</span>
                  <span>{sheet.especialidade}</span>
                </div>

                <div className="text-slate-400 flex items-center gap-1.5">
                  <span className="font-medium">Link oficial:</span>
                  <a
                    href={sheet.linkOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-200 underline font-semibold flex items-center gap-1 truncate max-w-[220px] sm:max-w-[320px]"
                    title={sheet.linkOficial}
                  >
                    <span className="truncate">{sheet.linkOficial}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Fechar Ficha Operacional"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content: As 7 Seções Oficiais */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-5 text-slate-200 flex-1">
          {/* Seção 12 e 17: Metadados de Origem Groq Curator */}
          {ia.sourceType === 'groq_discovered' && (
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <span className="font-bold text-white text-sm block">IA Descoberta pelo Curador Inteligente Groq</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Qualidade estimada: <strong className="text-emerald-300 font-semibold">{ia.qualityScore ?? 85}%</strong> • Modelo: <strong className="text-cyan-300 font-semibold">{ia.pricingType || 'FREEMIUM'}</strong> • Descoberta em: {ia.discoveredAt ? new Date(ia.discoveredAt).toLocaleDateString() : 'Recente'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{ia.validationStatus === 'VALIDADA' ? '✓ Validada' : 'Necessita validação'}</span>
                </span>
              </div>
            </div>
          )}

          {/* Aviso Global caso haja campos automáticos provisórios */}
          {sheet.hasAnyAuto && (
            <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/25 flex items-center gap-2.5 text-xs text-cyan-300">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Dica:</strong> Seções com a etiqueta azul contêm{' '}
                <em>“{AUTO_GENERATED_LABEL}”</em> e podem ser enriquecidas a qualquer momento no botão <strong>Editar Dados</strong>.
              </span>
            </div>
          )}

          {/* SEÇÃO 1 — PARA QUE SERVE */}
          <section className="p-4 sm:p-5 rounded-2xl bg-[#060c1c] border border-cyan-500/25 shadow-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-cyan-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                <HelpCircle className="w-4.5 h-4.5 text-cyan-400" />
                <span>SEÇÃO 1 — PARA QUE SERVE</span>
              </div>
              {sheet.isParaQueServeAuto && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  {AUTO_GENERATED_LABEL}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {sheet.paraQueServe}
            </p>
          </section>

          {/* GRID: SEÇÃO 2 (QUANDO USAR) & SEÇÃO 3 (QUANDO NÃO USAR) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SEÇÃO 2 — QUANDO USAR */}
            <section className="p-4 sm:p-5 rounded-2xl bg-[#060c1c] border border-emerald-500/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                  <span>SEÇÃO 2 — QUANDO USAR</span>
                </div>
                {sheet.isQuandoUsarAuto && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    {AUTO_GENERATED_LABEL}
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {sheet.quandoUsar}
              </p>
            </section>

            {/* SEÇÃO 3 — QUANDO NÃO USAR */}
            <section className="p-4 sm:p-5 rounded-2xl bg-[#060c1c] border border-amber-500/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
                  <span>SEÇÃO 3 — QUANDO NÃO USAR</span>
                </div>
                {sheet.isQuandoNaoUsarAuto && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    {AUTO_GENERATED_LABEL}
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {sheet.quandoNaoUsar}
              </p>
            </section>
          </div>

          {/* GRID: SEÇÃO 4 (PONTOS FORTES) & SEÇÃO 5 (LIMITAÇÕES) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SEÇÃO 4 — PONTOS FORTES */}
            <section className="p-4 sm:p-5 rounded-2xl bg-[#060c1c] border border-indigo-500/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-indigo-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <Zap className="w-4.5 h-4.5 text-indigo-400" />
                  <span>SEÇÃO 4 — PONTOS FORTES</span>
                </div>
                {sheet.isPontosFortesAuto && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    {AUTO_GENERATED_LABEL}
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {sheet.pontosFortes}
              </p>
            </section>

            {/* SEÇÃO 5 — LIMITAÇÕES */}
            <section className="p-4 sm:p-5 rounded-2xl bg-[#060c1c] border border-rose-500/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-rose-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-400" />
                  <span>SEÇÃO 5 — LIMITAÇÕES</span>
                </div>
                {sheet.isLimitacoesAuto && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300">
                    {AUTO_GENERATED_LABEL}
                  </span>
                )}
              </div>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {sheet.limitacoes}
              </p>
            </section>
          </div>

          {/* SEÇÃO 6 — EXEMPLO PRÁTICO (COM BOTÃO COPIAR PROMPT) */}
          <section className="p-5 rounded-2xl bg-gradient-to-b from-[#060e22] to-[#040816] border-2 border-cyan-500/40 shadow-[0_8px_30px_rgba(0,180,255,0.15)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-cyan-300 font-black text-xs sm:text-sm uppercase tracking-wider">
                <Terminal className="w-4.5 h-4.5 text-cyan-400" />
                <span>SEÇÃO 6 — EXEMPLO PRÁTICO</span>
              </div>

              <div className="flex items-center gap-2">
                {sheet.isExemploPromptAuto && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    {AUTO_GENERATED_LABEL}
                  </span>
                )}

                {/* BOTÃO COPIAR PROMPT REQUISITADO */}
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-sm ${
                    copied
                      ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 hover:text-white hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                  title="Copiar prompt de exemplo para sua área de transferência"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      <span>Prompt copiado.</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-cyan-300 stroke-[2]" />
                      <span>📋 COPIAR PROMPT</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Copie e adapte o modelo de prompt abaixo para obter os melhores resultados com o {sheet.nome}:
            </p>

            <div className="relative rounded-xl bg-[#020611] border border-cyan-500/30 p-4 font-mono text-xs sm:text-sm text-cyan-100 whitespace-pre-wrap leading-relaxed shadow-inner">
              {sheet.exemploPrompt}
            </div>
          </section>

          {/* SEÇÃO 7 — RECOMENDAÇÃO ESTRATÉGICA */}
          <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/30 via-indigo-950/30 to-cyan-950/30 border border-indigo-500/40 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-300 font-black text-xs sm:text-sm uppercase tracking-wider">
                <Target className="w-4.5 h-4.5 text-indigo-400" />
                <span>SEÇÃO 7 — RECOMENDAÇÃO ESTRATÉGICA</span>
              </div>
              {sheet.isRecomendacaoEstrategicaAuto && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                  {AUTO_GENERATED_LABEL}
                </span>
              )}
            </div>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {sheet.recomendacaoEstrategica}
            </p>
          </section>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-cyan-500/20 bg-[#070e1c] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {onToggleCompare && (
              <button
                onClick={() => onToggleCompare(ia.id)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isCompared
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>{isCompared ? '✓ Comparando' : '⚖ Comparar'}</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(ia);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                title="Editar dados desta IA e personalizar os campos da ficha"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Editar Dados</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition-colors"
            >
              Fechar
            </button>

            <a
              href={sheet.linkOficial}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(0,180,255,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Abrir {sheet.nome}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
