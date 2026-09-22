import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  ShieldCheck,
  Bug,
  Terminal,
  X,
  Play,
} from 'lucide-react';
import { ProjectTest, TestType, TestResultStatus } from '../../types';

interface ProjectTestsSectionProps {
  projectId: string;
  tests: ProjectTest[];
  onSaveTest: (test: ProjectTest) => void;
  onDeleteTest: (id: string) => void;
}

export const ProjectTestsSection: React.FC<ProjectTestsSectionProps> = ({
  projectId,
  tests,
  onSaveTest,
  onDeleteTest,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<TestType>('INTEGRACAO');
  const [status, setStatus] = useState<TestResultStatus>('PASSOU');
  const [scope, setScope] = useState('');
  const [executionDetails, setExecutionDetails] = useState('');
  const [errorFound, setErrorFound] = useState('');
  const [fixApplied, setFixApplied] = useState('');

  const handleOpenNew = () => {
    setName('');
    setType('INTEGRACAO');
    setStatus('PASSOU');
    setScope('');
    setExecutionDetails('');
    setErrorFound('');
    setFixApplied('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTest: ProjectTest = {
      id: `test-${Date.now()}`,
      projectId,
      name: name.trim(),
      type,
      status,
      result: (status === 'PASSOU' ? 'Passou' : status === 'FALHOU' ? 'Falhou' : 'Pendente') as any,
      details: executionDetails.trim() || 'Teste executado.',
      scope: scope.trim() || undefined,
      executionDetails: executionDetails.trim(),
      errorFound: errorFound.trim() || undefined,
      fixApplied: fixApplied.trim() || undefined,
      testedAt: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
    };

    onSaveTest(newTest);
    setIsModalOpen(false);
  };

  const getStatusBadge = (st: TestResultStatus) => {
    switch (st) {
      case 'PASSOU':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          classes: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
        };
      case 'FALHOU':
        return {
          icon: <XCircle className="w-4 h-4 text-rose-400" />,
          classes: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
        };
      case 'AVISO':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          classes: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-slate-400" />,
          classes: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  const passedCount = tests.filter((t) => t.status === 'PASSOU').length;
  const failedCount = tests.filter((t) => t.status === 'FALHOU').length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Garantia de Qualidade & Testes</h3>
            <p className="text-slate-400 text-xs">
              Validações, testes executados pelo Agente e histórico de falhas/correções
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tests.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold mr-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-400">
                {passedCount} Passou
              </span>
              {failedCount > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-rose-950 border border-rose-800 text-rose-400">
                  {failedCount} Falhou
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleOpenNew}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" /> Registrar Teste
          </button>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
          Nenhum teste registrado ainda. Solicite ao Agente no debate para testar endpoints, formulários ou lógica.
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const { icon, classes } = getStatusBadge(test.status);
            return (
              <div
                key={test.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2.5 relative group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {icon}
                    <div>
                      <h4 className="font-bold text-white text-sm">{test.name}</h4>
                      {test.scope && <p className="text-xs text-slate-400">Escopo: {test.scope}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                      {test.type}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${classes}`}>
                      {test.status}
                    </span>
                    <button
                      onClick={() => onDeleteTest(test.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {test.executionDetails && (
                  <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                    {test.executionDetails}
                  </p>
                )}

                {(test.errorFound || test.fixApplied) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                    {test.errorFound && (
                      <div className="bg-rose-950/30 border border-rose-900/40 rounded-lg p-2.5 text-rose-200">
                        <span className="font-bold flex items-center gap-1 text-rose-400 mb-1">
                          <Bug className="w-3.5 h-3.5" /> Problema Encontrado:
                        </span>
                        {test.errorFound}
                      </div>
                    )}
                    {test.fixApplied && (
                      <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-2.5 text-emerald-200">
                        <span className="font-bold flex items-center gap-1 text-emerald-400 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correção Aplicada:
                        </span>
                        {test.fixApplied}
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 pt-1">
                  Executado em: {new Date(test.testedAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de cadastro de teste */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Registrar Execução de Teste</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome do Teste / Cenário *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Validação de login com token inválido"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tipo de Teste</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TestType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="UNITARIO">Unitário</option>
                    <option value="INTEGRACAO">Integração</option>
                    <option value="FUNCIONAL">Funcional</option>
                    <option value="ESTRESSE">Estresse / Carga</option>
                    <option value="SEGURANCA">Segurança</option>
                    <option value="USABILIDADE">Usabilidade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Resultado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TestResultStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="PASSOU">PASSOU (Sucesso)</option>
                    <option value="FALHOU">FALHOU (Erro detectado)</option>
                    <option value="AVISO">AVISO (Inconclusivo / Alerta)</option>
                    <option value="BLOQUEADO">BLOQUEADO (Pré-requisito ausente)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Escopo / Módulo Testado</label>
                <input
                  type="text"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="Ex: API de pedidos, formulário de cadastro..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Detalhes da Execução</label>
                <textarea
                  rows={2}
                  value={executionDetails}
                  onChange={(e) => setExecutionDetails(e.target.value)}
                  placeholder="Comportamento observado, parâmetros testados..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Erro / Falha (se houver)</label>
                  <textarea
                    rows={2}
                    value={errorFound}
                    onChange={(e) => setErrorFound(e.target.value)}
                    placeholder="Mensagem de erro ou comportamento anômalo..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Correção Aplicada</label>
                  <textarea
                    rows={2}
                    value={fixApplied}
                    onChange={(e) => setFixApplied(e.target.value)}
                    placeholder="O que foi alterado para resolver..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
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
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
                >
                  Salvar Teste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
