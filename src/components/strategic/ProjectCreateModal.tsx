import React, { useState } from 'react';
import { X, Layers, Sparkles, Check } from 'lucide-react';
import { ProjectHubItem } from '../../types';

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: ProjectHubItem) => void;
}

export const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [expectedResult, setExpectedResult] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: ProjectHubItem = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Projeto criado no Hub de IAs',
      objective: objective.trim() || 'Definir objetivo principal',
      expectedResult: expectedResult.trim() || 'A definir',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Ideia',
      currentStage: 'Concepção e Ideação',
      nextAction: 'Estruturar requisitos iniciais e escopo',
      progress: 10,
      aiTools: ['Gemini 2.5 Pro'],
      notes: 'Projeto recém-criado na área Meus Projetos.',
      history: [
        {
          id: `hist-${Date.now()}`,
          date: new Date().toLocaleDateString(),
          description: 'Projeto criado com sucesso.',
          author: 'Usuário',
        },
      ],
    };

    onSave(newProject);
    setName('');
    setDescription('');
    setObjective('');
    setExpectedResult('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Novo Projeto no Hub</h3>
              <p className="text-slate-400 text-xs">Transforme uma ideia ou missão em um projeto acompanhado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">
              1. Nome do projeto <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Sistema de Controle de Contratos"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">
              2. O que quero construir? (Descrição)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente a solução..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs sm:text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">
              3. Qual problema quero resolver? (Objetivo)
            </label>
            <textarea
              rows={2}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex: Eliminar erros manuais e atrasos na validação..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs sm:text-sm resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold">
              4. Qual resultado espero?
            </label>
            <input
              type="text"
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="Ex: Aplicação web funcional em produção com relatórios automáticos"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs sm:text-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-cyan-500/20 flex items-center gap-2 text-xs sm:text-sm transition-all"
            >
              <Sparkles className="w-4 h-4" /> Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
