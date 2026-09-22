import React, { useState } from 'react';
import {
  Code,
  FileText,
  Layers,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  X,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { ProjectDeliverable, DeliverableType } from '../../types';

interface ProjectDeliverablesSectionProps {
  projectId: string;
  deliverables: ProjectDeliverable[];
  onSaveDeliverable: (deliverable: ProjectDeliverable) => void;
  onDeleteDeliverable: (id: string) => void;
}

export const ProjectDeliverablesSection: React.FC<ProjectDeliverablesSectionProps> = ({
  projectId,
  deliverables,
  onSaveDeliverable,
  onDeleteDeliverable,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<ProjectDeliverable | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DeliverableType>('CODIGO');
  const [language, setLanguage] = useState('typescript');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const handleOpenNew = () => {
    setTitle('');
    setType('CODIGO');
    setLanguage('typescript');
    setPath('src/');
    setDescription('');
    setContent('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newDeliverable: ProjectDeliverable = {
      id: `deliv-${Date.now()}`,
      projectId,
      name: title.trim(),
      title: title.trim(),
      type,
      language: language.trim() || undefined,
      path: path.trim() || undefined,
      description: description.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    onSaveDeliverable(newDeliverable);
    setIsModalOpen(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (dType: DeliverableType) => {
    switch (dType) {
      case 'CODIGO':
      case 'COMPONENTE':
      case 'SCHEMA':
        return <Code className="w-4 h-4 text-cyan-400" />;
      case 'DOCUMENTACAO':
      case 'ESPECIFICACAO':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'PROMPT':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Layers className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Entregáveis & Código Gerado</h3>
            <p className="text-slate-400 text-xs">Artefatos de software, componentes e especificações produzidos pelo Agente</p>
          </div>
        </div>
        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" /> Novo Entregável
        </button>
      </div>

      {deliverables.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
          Nenhum entregável de código ou artefato registrado ainda. Peça ao Agente Executor no Debate para gerar um componente ou script.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {deliverables.map((deliv) => (
            <div
              key={deliv.id}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3 relative group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {getTypeIcon(deliv.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs sm:text-sm">{deliv.title}</h4>
                    {deliv.path && (
                      <p className="text-[11px] text-cyan-400/80 font-mono truncate max-w-[200px]">
                        {deliv.path}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                  {deliv.language || deliv.type}
                </span>
              </div>

              {deliv.description && (
                <p className="text-slate-400 text-xs line-clamp-2">{deliv.description}</p>
              )}

              {/* Preview do código */}
              <div className="bg-slate-900/90 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 max-h-28 overflow-y-auto border border-slate-800/80">
                <pre className="whitespace-pre-wrap">{deliv.content.slice(0, 300)}{deliv.content.length > 300 ? '...' : ''}</pre>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                <span className="text-slate-500">
                  {new Date(deliv.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(deliv.id, deliv.content)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                  >
                    {copiedId === deliv.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === deliv.id ? 'Copiado!' : 'Copiar'}
                  </button>
                  <button
                    onClick={() => setSelectedDeliverable(deliv)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 text-xs flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ver Completo
                  </button>
                  <button
                    onClick={() => onDeleteDeliverable(deliv.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 opacity-60 hover:opacity-100 transition-opacity"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de visualização detalhada */}
      {selectedDeliverable && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  {getTypeIcon(selectedDeliverable.type)}
                  {selectedDeliverable.title}
                </h3>
                {selectedDeliverable.path && (
                  <p className="text-xs text-cyan-400 font-mono">{selectedDeliverable.path}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy('modal', selectedDeliverable.content)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5"
                >
                  {copiedId === 'modal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === 'modal' ? 'Copiado' : 'Copiar Código'}
                </button>
                <button
                  onClick={() => setSelectedDeliverable(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {selectedDeliverable.description && (
              <p className="text-slate-400 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                {selectedDeliverable.description}
              </p>
            )}

            <div className="flex-1 overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-200">
              <pre className="whitespace-pre-wrap">{selectedDeliverable.content}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cadastro de entregável */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Registrar Novo Entregável de Software</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título do Artefato *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Serviço de Autenticação JWT"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as DeliverableType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CODIGO">Código</option>
                    <option value="COMPONENTE">Componente</option>
                    <option value="SCHEMA">Schema / Banco</option>
                    <option value="DOCUMENTACAO">Documentação</option>
                    <option value="ESPECIFICACAO">Especificação</option>
                    <option value="PROMPT">Prompt de Sistema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Linguagem</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="typescript, sql, json..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Caminho / Path</label>
                  <input
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="src/services/auth.ts"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Descrição Curta</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Finalidade do componente ou arquivo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Conteúdo / Código Fonte *</label>
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="// Cole ou escreva aqui o código gerado..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
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
                  Salvar Entregável
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
