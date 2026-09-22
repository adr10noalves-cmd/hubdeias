import React, { useState } from 'react';
import {
  GitBranch,
  Tag,
  Rocket,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  X,
  Server,
  FileText,
} from 'lucide-react';
import { ProjectVersion, ProjectDeploymentStatus } from '../../types';

interface ProjectVersionsSectionProps {
  projectId: string;
  versions: ProjectVersion[];
  onSaveVersion: (version: ProjectVersion) => void;
  onDeleteVersion: (id: string) => void;
}

export const ProjectVersionsSection: React.FC<ProjectVersionsSectionProps> = ({
  projectId,
  versions,
  onSaveVersion,
  onDeleteVersion,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [versionTag, setVersionTag] = useState('v1.0.0');
  const [title, setTitle] = useState('');
  const [changelog, setChangelog] = useState('');
  const [deploymentStatus, setDeploymentStatus] = useState<ProjectDeploymentStatus>('LOCAL');
  const [significantChanges, setSignificantChanges] = useState('');
  const [pendingForNext, setPendingForNext] = useState('');

  const handleOpenNew = () => {
    // Sugere próximo número de versão baseado nas existentes
    if (versions.length > 0) {
      const last = versions[0].version;
      const parts = last.replace('v', '').split('.').map(Number);
      if (parts.length === 3 && !isNaN(parts[1])) {
        parts[1] += 1;
        setVersionTag(`v${parts[0]}.${parts[1]}.0`);
      } else {
        setVersionTag(`v1.${versions.length}.0`);
      }
    } else {
      setVersionTag('v1.0.0');
    }

    setTitle('');
    setChangelog('');
    setDeploymentStatus('LOCAL');
    setSignificantChanges('');
    setPendingForNext('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionTag.trim() || !title.trim()) return;

    const changelogList = changelog
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const changesList = significantChanges
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const pendingList = pendingForNext
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const newVersion: ProjectVersion = {
      id: `ver-${Date.now()}`,
      projectId,
      version: versionTag.trim(),
      title: title.trim(),
      date: new Date().toLocaleDateString(),
      releasedAt: new Date().toISOString(),
      changes: changesList.join('; ') || title.trim(),
      changelog: changelogList.length > 0 ? changelogList : [title.trim()],
      reason: 'Evolução planejada do projeto',
      result: 'Sucesso',
      status: 'Lançada',
      deploymentStatus,
      significantChanges: changesList,
      pendingForNext: pendingList,
    };

    onSaveVersion(newVersion);
    setIsModalOpen(false);
  };

  const getDeployBadge = (st?: ProjectDeploymentStatus) => {
    switch (st) {
      case 'PRODUCAO':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'HOMOLOGACAO':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
      case 'LOCAL':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'FALHA':
        return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Versões & Implantações</h3>
            <p className="text-slate-400 text-xs">
              Histórico formal de versões (releases), changelogs e ambientes de entrega
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Registrar Versão
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
          Nenhuma versão registrada. Registre a v1.0.0 quando a primeira versão funcional estiver pronta.
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((ver, idx) => (
            <div
              key={ver.id}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-3 relative group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-800 text-blue-300 font-mono font-bold text-xs flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {ver.version}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm sm:text-base">{ver.title}</h4>
                    <span className="text-xs text-slate-500">
                      Lançado em {new Date(ver.releasedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${getDeployBadge(
                      ver.deploymentStatus
                    )}`}
                  >
                    <Server className="w-3 h-3" /> {ver.deploymentStatus || 'LOCAL'}
                  </span>
                  <button
                    onClick={() => onDeleteVersion(ver.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Changelog */}
              {ver.changelog && ver.changelog.length > 0 && (
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-cyan-400" /> O Que Mudou (Changelog):
                  </span>
                  <ul className="list-disc list-inside text-xs text-slate-300 space-y-0.5 pl-1">
                    {ver.changelog.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mudanças significativas & Pendências */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {ver.significantChanges && ver.significantChanges.length > 0 && (
                  <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-2.5 text-cyan-200">
                    <span className="font-bold block mb-1 text-cyan-400">Mudanças de Impacto:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {ver.significantChanges.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {ver.pendingForNext && ver.pendingForNext.length > 0 && (
                  <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-2.5 text-amber-200">
                    <span className="font-bold block mb-1 text-amber-400">Pendências para Próxima Versão:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {ver.pendingForNext.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de cadastro de versão */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Registrar Nova Versão do Projeto</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tag da Versão *</label>
                  <input
                    type="text"
                    required
                    value={versionTag}
                    onChange={(e) => setVersionTag(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título / Resumo da Versão *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: MVP Inicial com Autenticação e Dashboard"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ambiente de Implantação</label>
                <select
                  value={deploymentStatus}
                  onChange={(e) => setDeploymentStatus(e.target.value as ProjectDeploymentStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="LOCAL">LOCAL (Ambiente de desenvolvimento)</option>
                  <option value="HOMOLOGACAO">HOMOLOGAÇÃO (Staging / Testes)</option>
                  <option value="PRODUCAO">PRODUÇÃO (No ar para usuários)</option>
                  <option value="FALHA">FALHA (Ocorreu erro no deploy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Changelog (um item por linha)
                </label>
                <textarea
                  rows={3}
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  placeholder="- Implementado backend com rotas de API&#10;- Criado componente de autenticação&#10;- Adicionado suporte a dark mode"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mudanças de Impacto</label>
                  <textarea
                    rows={2}
                    value={significantChanges}
                    onChange={(e) => setSignificantChanges(e.target.value)}
                    placeholder="Migração de banco, quebra de contrato..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pendências para Próxima</label>
                  <textarea
                    rows={2}
                    value={pendingForNext}
                    onChange={(e) => setPendingForNext(e.target.value)}
                    placeholder="Adicionar testes E2E, refatorar..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                >
                  Salvar Versão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
