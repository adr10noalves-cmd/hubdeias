import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Clock, XCircle, AlertCircle, Trash2, Edit3, X } from 'lucide-react';
import { ProjectMission } from '../../types';

interface ProjectMissionsSectionProps {
  projectId: string;
  missions: ProjectMission[];
  onSaveMission: (mission: ProjectMission) => void;
  onDeleteMission: (id: string) => void;
}

export const ProjectMissionsSection: React.FC<ProjectMissionsSectionProps> = ({
  projectId,
  missions,
  onSaveMission,
  onDeleteMission,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada'>('Pendente');
  const [priority, setPriority] = useState<'Baixa' | 'Média' | 'Alta' | 'Urgente'>('Média');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenNew = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setStatus('Pendente');
    setPriority('Média');
    setDueDate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: ProjectMission) => {
    setEditingId(m.id);
    setTitle(m.title);
    setDescription(m.description);
    setStatus(m.status);
    setPriority(m.priority);
    setDueDate(m.dueDate || '');
    setNotes(m.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMission: ProjectMission = {
      id: editingId || `mission-${Date.now()}`,
      projectId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      createdAt: new Date().toLocaleDateString(),
      dueDate: dueDate || undefined,
      notes: notes || undefined,
    };

    onSaveMission(newMission);
    setIsModalOpen(false);
  };

  const handleStatusChange = (m: ProjectMission, newStatus: ProjectMission['status']) => {
    onSaveMission({ ...m, status: newStatus });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Missões e Tarefas do Projeto</h3>
            <p className="text-slate-400 text-xs">Planejamento e acompanhamento de entregas táticas</p>
          </div>
        </div>
        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Nova Missão
        </button>
      </div>

      {missions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
          Nenhuma missão cadastrada. Clique em "Nova Missão" para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {missions.map((m) => (
            <div
              key={m.id}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-slate-700 transition-all"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    m.status === 'Concluída'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800/50'
                      : m.status === 'Em andamento'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800/50'
                      : m.status === 'Cancelada'
                      ? 'bg-rose-950 text-rose-300 border-rose-800/50'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {m.status}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    m.priority === 'Urgente'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                      : m.priority === 'Alta'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}>
                    Prioridade: {m.priority}
                  </span>
                  {m.dueDate && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Prazo: {m.dueDate}
                    </span>
                  )}
                </div>

                <h4 className={`font-bold text-sm ${m.status === 'Concluída' ? 'line-through text-slate-500' : 'text-white'}`}>
                  {m.title}
                </h4>
                {m.description && <p className="text-slate-400 text-xs">{m.description}</p>}
                {m.notes && <p className="text-slate-500 text-[11px] italic">Obs: {m.notes}</p>}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <select
                  value={m.status}
                  onChange={(e) => handleStatusChange(m, e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Cancelada">Cancelada</option>
                </select>

                <button
                  onClick={() => handleOpenEdit(m)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteMission(m.id)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingId ? 'Editar Missão' : 'Nova Missão do Projeto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título da Missão *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Integrar autenticação OAuth"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descrição</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes sobre a entrega..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Prioridade</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Data Limite (Prazo)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Observações</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas extras"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
                >
                  Salvar Missão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
