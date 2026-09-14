import React from 'react';
import { Sparkles, ArrowUpRight, Gauge, BookOpen } from 'lucide-react';
import { IAItem } from '../types';
import { categoryIcons, resolveIADetails } from '../utils/helpers';

interface FeaturedBeginnerSectionProps {
  ias: IAItem[];
  onOpenDetail: (ia: IAItem) => void;
  onSelectCategory: (cat: string) => void;
}

const FEATURED_NAMES = ['ChatGPT', 'Perplexity', 'Claude', 'Photoroom', 'Suno', 'Notion AI', 'Google Gemini'];

export const FeaturedBeginnerSection: React.FC<FeaturedBeginnerSectionProps> = ({
  ias,
  onOpenDetail,
  onSelectCategory,
}) => {
  // Find featured items from current catalog
  const featured = ias.filter((item) =>
    FEATURED_NAMES.some((n) => item.name.toLowerCase().includes(n.toLowerCase()))
  );

  if (featured.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-black font-display text-white">
            IAs Recomendadas para Começar (Iniciantes)
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline-block">
          Ferramentas fáceis de usar e com excelente versão gratuita
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {featured.slice(0, 4).map((ia) => {
          const details = resolveIADetails(ia);
          return (
            <div
              key={ia.id}
              onClick={() => onOpenDetail(ia)}
              className="group cursor-pointer rounded-2xl bg-gradient-to-b from-[#0b1428] to-[#060b18] border border-cyan-500/20 hover:border-cyan-400/50 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,212,255,0.12)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 inline-flex items-center gap-1">
                    <span>{categoryIcons[ia.category]}</span>
                    <span className="truncate max-w-[140px]">{ia.category.split(' / ')[0]}</span>
                  </span>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Fácil
                  </span>
                </div>

                <div className="flex items-start justify-between gap-1 mb-1">
                  <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                    {ia.name}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0 mt-0.5" />
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-3 leading-relaxed">
                  {details.whatIsItFor}
                </p>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-teal-400 font-semibold">{details.pricing}</span>
                <span className="text-cyan-400 group-hover:underline font-bold flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Ver Ficha
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
