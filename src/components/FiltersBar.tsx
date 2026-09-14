import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';
import { CATEGORIES, IACategory, IADifficulty, IAPricing } from '../types';
import { categoryIcons } from '../utils/helpers';

interface FiltersBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (value: string) => void;
  selectedPricing: string;
  onPricingChange: (value: string) => void;
  selectedLevel: string;
  onLevelChange: (value: string) => void;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedPricing,
  onPricingChange,
  selectedLevel,
  onLevelChange,
  onClearFilters,
  filteredCount,
  totalCount,
}) => {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(selectedCategory) ||
    Boolean(selectedDifficulty) ||
    Boolean(selectedPricing) ||
    Boolean(selectedLevel);

  return (
    <section className="bg-[#091024]/90 backdrop-blur-md border border-cyan-500/25 rounded-3xl p-4 sm:p-5 mb-8 shadow-[0_4px_25px_rgba(0,0,0,0.35)] space-y-3.5">
      {/* Search & Main Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search input */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome ou finalidade (ex: slide, redação, tirar fundo, site...)"
            className="w-full bg-[#040a18]/90 border border-cyan-500/25 focus:border-cyan-400 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-cyan-500/15"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category selector */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full bg-[#040a18]/90 border border-cyan-500/25 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-200 outline-none transition-all cursor-pointer"
          >
            <option value="">📂 Todas as categorias</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {categoryIcons[cat]} {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty selector */}
        <div className="md:col-span-2">
          <select
            value={selectedDifficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="w-full bg-[#040a18]/90 border border-cyan-500/25 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-200 outline-none transition-all cursor-pointer"
          >
            <option value="">⚡ Dificuldade: Todas</option>
            <option value="Iniciante">🟢 Fácil (Iniciante)</option>
            <option value="Intermediário">🔵 Intermediário</option>
            <option value="Avançado">🟣 Avançado</option>
          </select>
        </div>

        {/* Pricing selector */}
        <div className="md:col-span-2">
          <select
            value={selectedPricing}
            onChange={(e) => onPricingChange(e.target.value)}
            className="w-full bg-[#040a18]/90 border border-cyan-500/25 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-200 outline-none transition-all cursor-pointer"
          >
            <option value="">💳 Preço: Todos</option>
            <option value="Gratuito">100% Gratuito</option>
            <option value="Freemium (Grátis + Pago)">Freemium (Grátis + Pago)</option>
            <option value="Pago com Teste Grátis">Pago c/ Teste Grátis</option>
            <option value="Pago">Pago</option>
          </select>
        </div>
      </div>

      {/* Category Pills & Quick Filter Controls */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Quick Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => onCategoryChange('')}
            className={`px-3 py-1 rounded-full transition-all text-xs font-semibold ${
              !selectedCategory
                ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,212,255,0.4)]'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Todas ({totalCount})
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(isSelected ? '' : cat)}
                className={`px-2.5 py-1 rounded-full transition-all text-[11px] font-medium inline-flex items-center gap-1 ${
                  isSelected
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200'
                    : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-slate-300'
                }`}
              >
                <span>{categoryIcons[cat]}</span>
                <span className="hidden sm:inline">{cat.split(' / ')[0]}</span>
                <span className="sm:hidden">{cat.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 hover:underline font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Exibindo <b className="text-cyan-400 font-bold text-sm">{filteredCount}</b> de {totalCount}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

