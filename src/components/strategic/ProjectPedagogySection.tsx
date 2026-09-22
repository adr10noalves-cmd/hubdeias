import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  X,
  CheckCircle,
} from 'lucide-react';
import { ProjectPedagogicalExplanation } from '../../types';

interface ProjectPedagogySectionProps {
  projectId: string;
  pedagogies: ProjectPedagogicalExplanation[];
  onSavePedagogy: (item: ProjectPedagogicalExplanation) => void;
  onDeletePedagogy: (id: string) => void;
  onRequestExplanation?: () => void;
}

export const ProjectPedagogySection: React.FC<ProjectPedagogySectionProps> = ({
  projectId,
  pedagogies,
  onSavePedagogy,
  onDeletePedagogy,
  onRequestExplanation,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [whatWasDone, setWhatWasDone] = useState('');
  const [whyWasDone, setWhyWasDone] = useState('');
  const [howItWorks, setHowItWorks] = useState('');
  const [whatWasTested, setWhatWasTested] = useState('');
  const [whatWasChanged, setWhatWasChanged] = useState('');
  const [whatIsMissing, setWhatIsMissing] = useState('');
  const [whatCanEvolve, setWhatCanEvolve] = useState('');
  const [conceptsTaught, setConceptsTaught] = useState('');
  const [complexityLevel, setComplexityLevel] = useState<'BASICO' | 'INTERMEDIARIO' | 'AVANCADO'>('INTERMEDIARIO');

  const handleOpenNew = () => {
    setTitle('');
    setWhatWasDone('');
    setWhyWasDone('');
    setHowItWorks('');
    setWhatWasTested('');
    setWhatWasChanged('');
    setWhatIsMissing('');
    setWhatCanEvolve('');
    setConceptsTaught('');
    setComplexityLevel('INTERMEDIARIO');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !whatWasDone.trim()) return;

    const conceptsList = conceptsTaught
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const newPedagogy: ProjectPedagogicalExplanation = {
      id: `ped-${Date.now()}`,
      projectId,
      title: title.trim(),
      whatWasDone: whatWasDone.trim(),
      whyDone: whyWasDone.trim(),
      whyWasDone: whyWasDone.trim(),
      howItWorks: howItWorks.trim(),
      whatWasTested: whatWasTested.trim() || undefined,
      whatWasChanged: whatWasChanged.trim() || undefined,
      whatIsMissing: whatIsMissing.trim() || undefined,
      whatCanEvolve: whatCanEvolve.trim() || undefined,
      conceptsTaught: conceptsList,
      complexityLevel,
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
    };

    onSavePedagogy(newPedagogy);
    setIsModalOpen(false);
  };

  const getComplexityBadge = (level: string) => {
    switch (level) {
      case 'BASICO':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'INTERMEDIARIO':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60';
      case 'AVANCADO':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">Lições do Agente Professor</h3>
            <p className="text-slate-400 text-xs">
              Explicação pedagógica transparente: o que foi feito, por que, como funciona e próximos passos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRequestExplanation && (
            <button
              onClick={onRequestExplanation}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Solicitar Aula da Etapa
            </button>
          )}
          <button
            onClick={handleOpenNew}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-600/20"
          >
            <Plus className="w-4 h-4" /> Nova Explicação
          </button>
        </div>
      </div>

      {pedagogies.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl space-y-2">
          <p>Nenhuma explicação pedagógica registrada ainda.</p>
          <p className="text-slate-400">
            O Agente Professor gera explicações completas após cada entrega ou decisão importante.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedagogies.map((ped) => (
            <div
              key={ped.id}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 space-y-4 relative group hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    {ped.title}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Registrado em {new Date(ped.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getComplexityBadge(
                      ped.complexityLevel
                    )}`}
                  >
                    Nível {ped.complexityLevel}
                  </span>
                  <button
                    onClick={() => onDeletePedagogy(ped.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Grade pedagógica dos 7 pilares */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 space-y-1">
                  <span className="font-bold text-cyan-400 block">1. O Que Foi Feito:</span>
                  <p className="text-slate-300">{ped.whatWasDone}</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 space-y-1">
                  <span className="font-bold text-purple-400 block">2. Por Que Foi Feito:</span>
                  <p className="text-slate-300">{ped.whyWasDone}</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 space-y-1 md:col-span-2">
                  <span className="font-bold text-emerald-400 block">3. Como Funciona (Arquitetura & Fluxo):</span>
                  <p className="text-slate-300 whitespace-pre-wrap">{ped.howItWorks}</p>
                </div>

                {ped.whatWasTested && (
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="font-bold text-amber-400 block">4. O Que Foi Testado:</span>
                    <p className="text-slate-300">{ped.whatWasTested}</p>
                  </div>
                )}

                {ped.whatWasChanged && (
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="font-bold text-blue-400 block">5. O Que Foi Alterado:</span>
                    <p className="text-slate-300">{ped.whatWasChanged}</p>
                  </div>
                )}

                {ped.whatIsMissing && (
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="font-bold text-rose-400 block">6. O Que Ainda Falta:</span>
                    <p className="text-slate-300">{ped.whatIsMissing}</p>
                  </div>
                )}

                {ped.whatCanEvolve && (
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 space-y-1">
                    <span className="font-bold text-indigo-400 block">7. O Que Pode Evoluir no Futuro:</span>
                    <p className="text-slate-300">{ped.whatCanEvolve}</p>
                  </div>
                )}
              </div>

              {/* Conceitos ensinados */}
              {ped.conceptsTaught && ped.conceptsTaught.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Conceitos Abordados:</span>
                  {ped.conceptsTaught.map((c, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/40"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de cadastro pedagógico */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Registrar Aula Pedagógica da Etapa</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Título da Lição *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Como funciona a arquitetura orientada a eventos no projeto"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nível Didático</label>
                  <select
                    value={complexityLevel}
                    onChange={(e) => setComplexityLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="BASICO">Básico (Acolhedor)</option>
                    <option value="INTERMEDIARIO">Intermediário</option>
                    <option value="AVANCADO">Avançado (Profundo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">1. O Que Foi Feito *</label>
                <textarea
                  required
                  rows={2}
                  value={whatWasDone}
                  onChange={(e) => setWhatWasDone(e.target.value)}
                  placeholder="Resumo objetivo das implementações..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">2. Por Que Foi Feito *</label>
                <textarea
                  required
                  rows={2}
                  value={whyWasDone}
                  onChange={(e) => setWhyWasDone(e.target.value)}
                  placeholder="A razão técnica e o benefício para o usuário..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">3. Como Funciona *</label>
                <textarea
                  required
                  rows={3}
                  value={howItWorks}
                  onChange={(e) => setHowItWorks(e.target.value)}
                  placeholder="Explicação do fluxo de dados e funcionamento prático..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">4. O Que Foi Testado</label>
                  <textarea
                    rows={2}
                    value={whatWasTested}
                    onChange={(e) => setWhatWasTested(e.target.value)}
                    placeholder="Quais cenários foram verificados..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">5. O Que Foi Alterado</label>
                  <textarea
                    rows={2}
                    value={whatWasChanged}
                    onChange={(e) => setWhatWasChanged(e.target.value)}
                    placeholder="Arquivos e componentes modificados..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">6. O Que Ainda Falta</label>
                  <textarea
                    rows={2}
                    value={whatIsMissing}
                    onChange={(e) => setWhatIsMissing(e.target.value)}
                    placeholder="Pendências imediatas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">7. O Que Pode Evoluir</label>
                  <textarea
                    rows={2}
                    value={whatCanEvolve}
                    onChange={(e) => setWhatCanEvolve(e.target.value)}
                    placeholder="Melhorias futuras recomendadas..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Conceitos Ensinados (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={conceptsTaught}
                  onChange={(e) => setConceptsTaught(e.target.value)}
                  placeholder="EventBus, LocalStorage, React Hooks, REST API"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
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
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20"
                >
                  Salvar Aula Pedagógica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
