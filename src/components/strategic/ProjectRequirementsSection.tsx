import React, { useState } from 'react';
import {
  CheckSquare,
  ShieldCheck,
  Lightbulb,
  Cpu,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  X,
  FileCheck,
} from 'lucide-react';
import { ProjectRequirements } from '../../types';

interface ProjectRequirementsSectionProps {
  projectId: string;
  requirements: ProjectRequirements;
  onSaveRequirements: (reqs: ProjectRequirements) => void;
}

export const ProjectRequirementsSection: React.FC<ProjectRequirementsSectionProps> = ({
  projectId,
  requirements,
  onSaveRequirements,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'userRequirements' | 'necessaryInferences' | 'aiSuggestions' | 'approvedDecisions'
  >('userRequirements');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const currentList = requirements[activeCategory] || [];
    const updated = {
      ...requirements,
      projectId,
      [activeCategory]: [...currentList, newItemText.trim()],
      lastUpdated: new Date().toISOString(),
    };

    onSaveRequirements(updated);
    setNewItemText('');
    setIsModalOpen(false);
  };

  const handleDeleteItem = (
    category: 'userRequirements' | 'necessaryInferences' | 'aiSuggestions' | 'approvedDecisions',
    index: number
  ) => {
    const list = [...(requirements[category] || [])];
    list.splice(index, 1);
    onSaveRequirements({
      ...requirements,
      projectId,
      [category]: list,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handlePromoteSuggestion = (index: number) => {
    // Promove uma sugestão da IA para decisão aprovada!
    const suggestions = [...(requirements.aiSuggestions || [])];
    const item = suggestions[index];
    if (!item) return;

    suggestions.splice(index, 1);
    const approved = [...(requirements.approvedDecisions || []), item];

    onSaveRequirements({
      ...requirements,
      projectId,
      aiSuggestions: suggestions,
      approvedDecisions: approved,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Matriz de Requisitos & Decisões</h3>
            <p className="text-slate-400 text-xs">
              Distinção obrigatória entre o que você pediu, inferências necessárias, sugestões e decisões aprovadas
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" /> Adicionar Requisito
        </button>
      </div>

      {/* 4 Quadrantes com cores semânticas bem distintas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quadrante 1: REQUISITOS DO USUÁRIO */}
        <div className="bg-slate-950/80 border border-blue-800/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-900/30 pb-2.5">
            <span className="font-bold text-xs text-blue-300 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              1. Requisitos do Usuário ({requirements.userRequirements?.length || 0})
            </span>
            <span className="text-[10px] text-blue-400/80 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800/50">
              Solicitado Explicitamente
            </span>
          </div>
          {(!requirements.userRequirements || requirements.userRequirements.length === 0) ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">Nenhum requisito explícito registrado.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {requirements.userRequirements.map((req, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg bg-blue-950/20 border border-blue-900/30 group"
                >
                  <span className="flex-1">{req}</span>
                  <button
                    onClick={() => handleDeleteItem('userRequirements', i)}
                    className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quadrante 2: INFERÊNCIAS NECESSÁRIAS */}
        <div className="bg-slate-950/80 border border-indigo-800/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-900/30 pb-2.5">
            <span className="font-bold text-xs text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Cpu className="w-4 h-4 text-indigo-400" />
              2. Inferências Necessárias ({requirements.necessaryInferences?.length || 0})
            </span>
            <span className="text-[10px] text-indigo-400/80 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800/50">
              Indispensável p/ Executar
            </span>
          </div>
          {(!requirements.necessaryInferences || requirements.necessaryInferences.length === 0) ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">Nenhuma inferência técnica registrada.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {requirements.necessaryInferences.map((inf, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg bg-indigo-950/20 border border-indigo-900/30 group"
                >
                  <span className="flex-1">{inf}</span>
                  <button
                    onClick={() => handleDeleteItem('necessaryInferences', i)}
                    className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quadrante 3: SUGESTÕES DA IA */}
        <div className="bg-slate-950/80 border border-purple-800/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-900/30 pb-2.5">
            <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-purple-400" />
              3. Sugestões da IA ({requirements.aiSuggestions?.length || 0})
            </span>
            <span className="text-[10px] text-purple-400/80 bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-800/50">
              Propostas (Não Vinculantes)
            </span>
          </div>
          {(!requirements.aiSuggestions || requirements.aiSuggestions.length === 0) ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">Nenhuma sugestão pendente da IA.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-300">
              {requirements.aiSuggestions.map((sug, i) => (
                <li
                  key={i}
                  className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-900/30 space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex-1">{sug}</span>
                    <button
                      onClick={() => handleDeleteItem('aiSuggestions', i)}
                      className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handlePromoteSuggestion(i)}
                      className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700/50 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      title="Transformar esta sugestão em Decisão Aprovada"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Aprovar como Decisão
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quadrante 4: DECISÕES APROVADAS */}
        <div className="bg-slate-950/80 border border-emerald-800/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2.5">
            <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              4. Decisões Aprovadas ({requirements.approvedDecisions?.length || 0})
            </span>
            <span className="text-[10px] text-emerald-400/80 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
              Autorizado pelo Usuário
            </span>
          </div>
          {(!requirements.approvedDecisions || requirements.approvedDecisions.length === 0) ? (
            <p className="text-xs text-slate-500 italic py-3 text-center">Nenhuma decisão aprovada registrada ainda.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {requirements.approvedDecisions.map((dec, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30 group"
                >
                  <span className="flex-1 font-medium">{dec}</span>
                  <button
                    onClick={() => handleDeleteItem('approvedDecisions', i)}
                    className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de cadastro de item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Adicionar à Matriz de Requisitos</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Classificação Rigorosa *</label>
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="userRequirements">1. Requisito do Usuário (pedido por você)</option>
                  <option value="necessaryInferences">2. Inferência Necessária (indispensável tecnicamente)</option>
                  <option value="aiSuggestions">3. Sugestão da IA (ideia para aprovação posterior)</option>
                  <option value="approvedDecisions">4. Decisão Aprovada (formalmente autorizada)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descrição do Item *</label>
                <textarea
                  required
                  rows={3}
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Descreva o requisito, inferência técnica ou decisão..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
