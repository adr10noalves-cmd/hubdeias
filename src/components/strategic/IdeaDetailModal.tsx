import React, { useState, useEffect, useRef } from 'react';
import {
  IdeaItem,
  IdeaVersion,
  EvolutionLog,
  StudyItem,
  IAItem,
  IdeaCategory,
  IDEA_CATEGORIES,
  IdeaStage,
  IDEA_STAGES,
  IdeaPriority,
  IDEA_PRIORITIES,
  IdeaStatus,
  IDEA_STATUSES,
  RoadmapItem,
} from '../../types';
import {
  saveIdeaToFirestore,
  getIdeaVersionsFromFirestore,
  saveIdeaVersionToFirestore,
  getEvolutionLogsFromFirestore,
  saveEvolutionLogToFirestore,
  deleteEvolutionLogFromFirestore,
  subscribeToIdeaVersions,
  subscribeToEvolutionLogs,
} from '../../services/strategicMemoryService';
import { AutoSaveIndicator, SaveState } from './AutoSaveIndicator';
import { MaturityStageBar } from './MaturityStageBar';
import { RoadmapEditor } from './RoadmapEditor';
import { IdeaEvolutionHistory } from './IdeaEvolutionHistory';
import { IdeaDiaryTab } from './IdeaDiaryTab';
import { AIEvolutionAssistantTab } from './AIEvolutionAssistantTab';
import { ProjectConceptAndStagesTab } from './ProjectConceptAndStagesTab';
import {
  X,
  Sparkles,
  LayoutList,
  History,
  BookOpen,
  MapPin,
  Brain,
  Layers,
  Link,
  Trash2,
  CheckCircle2,
  Clock,
  Tag,
  Plus,
  FileCode2,
} from 'lucide-react';

interface IdeaDetailModalProps {
  idea: IdeaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateIdea: (updated: IdeaItem) => void;
  onDeleteIdea?: (id: string) => void;
  studies: StudyItem[];
  catalog: IAItem[];
  onSelectInCatalog?: (toolName: string) => void;
}

type TabType = 'overview' | 'concept_stages' | 'evolution' | 'diary' | 'roadmap' | 'studies' | 'ai_assistant';

export const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({
  idea,
  isOpen,
  onClose,
  onUpdateIdea,
  onDeleteIdea,
  studies,
  catalog,
  onSelectInCatalog,
}) => {
  if (!isOpen || !idea) return null;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [formData, setFormData] = useState<IdeaItem>({ ...idea });
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [versions, setVersions] = useState<IdeaVersion[]>([]);
  const [logs, setLogs] = useState<EvolutionLog[]>([]);
  const [techInput, setTechInput] = useState('');
  const [selectedIAName, setSelectedIAName] = useState('');

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Carrega e assina versões e logs da ideia em tempo real
  useEffect(() => {
    if (!idea.id) return;
    setFormData({ ...idea });

    // Assinatura de versões em tempo real
    const unsubVersions = subscribeToIdeaVersions(idea.id, (loadedVersions) => {
      setVersions(loadedVersions);
    });

    // Assinatura do diário de bordo em tempo real
    const unsubLogs = subscribeToEvolutionLogs(idea.id, (loadedLogs) => {
      setLogs(loadedLogs);
    });

    return () => {
      unsubVersions();
      unsubLogs();
    };
  }, [idea.id]);

  // Função de auto-save com debounce de 800ms
  const triggerAutoSave = (updatedIdea: IdeaItem) => {
    setFormData(updatedIdea);
    onUpdateIdea(updatedIdea);
    setSaveState('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        await saveIdeaToFirestore(updatedIdea);
        setSaveState('saved');
      } catch (err) {
        console.error('Erro no auto-save:', err);
        setSaveState('error');
      }
    }, 800);
  };

  const handleChange = (field: keyof IdeaItem, value: any) => {
    const updated = {
      ...formData,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };
    triggerAutoSave(updated);
  };

  const handleAddTech = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
    e.preventDefault();
    if (!techInput.trim()) return;

    const current = formData.relatedTechnologies || [];
    if (!current.includes(techInput.trim())) {
      const next = [...current, techInput.trim()];
      handleChange('relatedTechnologies', next);
    }
    setTechInput('');
  };

  const handleRemoveTech = (tech: string) => {
    const current = formData.relatedTechnologies || [];
    handleChange('relatedTechnologies', current.filter((t) => t !== tech));
  };

  const handleAddIA = () => {
    if (!selectedIAName) return;
    const current = formData.relatedIANames || [];
    if (!current.includes(selectedIAName)) {
      const next = [...current, selectedIAName];
      handleChange('relatedIANames', next);
    }
    setSelectedIAName('');
  };

  const handleRemoveIA = (name: string) => {
    const current = formData.relatedIANames || [];
    handleChange('relatedIANames', current.filter((n) => n !== name));
  };

  // Vínculo bidirecional com Estudos
  const handleToggleStudyLink = (studyId: string) => {
    // Estudos relacionados a este projeto
    const study = studies.find((s) => s.id === studyId);
    if (!study) return;
    const isLinked = (study.relatedProjectIds || []).includes(formData.id);
    const updatedProjectIds = isLinked
      ? (study.relatedProjectIds || []).filter((id) => id !== formData.id)
      : [...(study.relatedProjectIds || []), formData.id];

    // Atualiza o estudo no Firestore
    import('../../services/strategicMemoryService').then(({ saveStudyToFirestore }) => {
      saveStudyToFirestore({
        ...study,
        relatedProjectIds: updatedProjectIds,
      });
    });
  };

  // Adicionar nova versão
  const handleAddVersion = async (versionData: Omit<IdeaVersion, 'id' | 'createdAt'>) => {
    const newVersion: IdeaVersion = {
      ...versionData,
      id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    await saveIdeaVersionToFirestore(newVersion);
    // Atualiza a versão atual na ideia
    handleChange('currentVersion', newVersion.version);
  };

  // Adicionar log ao diário
  const handleAddLog = async (logData: Omit<EvolutionLog, 'id' | 'createdAt'>) => {
    const newLog: EvolutionLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    await saveEvolutionLogToFirestore(newLog);
  };

  // Excluir log do diário
  const handleDeleteLog = async (logId: string) => {
    await deleteEvolutionLogFromFirestore(logId);
  };

  // Estudos vinculados a este projeto
  const linkedStudies = studies.filter((s) => (s.relatedProjectIds || []).includes(formData.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-slate-900/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-300">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {formData.category}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {formData.currentVersion || 'V1'}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    formData.status === 'Ativa' || formData.status === 'Em Progresso'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {formData.status}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white font-display tracking-tight mt-0.5">
                {formData.title || 'Projeto sem título'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AutoSaveIndicator state={saveState} />
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Maturity Stage Bar no topo */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80">
          <MaturityStageBar
            currentStage={formData.stage}
            onSelectStage={(newStage) => handleChange('stage', newStage)}
            interactive={true}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 overflow-x-auto bg-slate-900/60 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>Memória & Escopo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('concept_stages')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'concept_stages'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-indigo-300'
            }`}
          >
            <FileCode2 className="w-4 h-4 text-indigo-400" />
            <span>Conceito, Aplicação & Prompts ({formData.stages?.length || 6})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'evolution'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico de Evolução ({versions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diary')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'diary'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Diário de Bordo ({logs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Roadmap ({formData.roadmap?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('studies')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'studies'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-4 h-4" />
            <span>Estudos Conectados ({linkedStudies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_assistant')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'ai_assistant'
                ? 'border-purple-400 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-purple-300'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>Assistente IA de Evolução</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: VISÃO GERAL & MEMÓRIA CONTEXTUAL */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Título e Categoria */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Título da Ideia / Projeto *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Ex: Auditor SST Inteligente"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Categoria Estratégica *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value as IdeaCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-cyan-400"
                  >
                    {IDEA_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status e Prioridade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Status Operacional</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value as IdeaStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {IDEA_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value as IdeaPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    {IDEA_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Objetivo Principal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Objetivo Central</label>
                <textarea
                  rows={2}
                  value={formData.objective}
                  onChange={(e) => handleChange('objective', e.target.value)}
                  placeholder="Qual é a meta definitiva que este projeto pretende alcançar?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Problema que Resolve e Público-Alvo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Problema que Pretende Resolver</label>
                  <textarea
                    rows={3}
                    value={formData.problemSolved}
                    onChange={(e) => handleChange('problemSolved', e.target.value)}
                    placeholder="Qual dor ou gargalo específico é eliminado?"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Público-Alvo / Usuários Finais</label>
                  <textarea
                    rows={3}
                    value={formData.targetAudience}
                    onChange={(e) => handleChange('targetAudience', e.target.value)}
                    placeholder="Quem são os beneficiários (ex: engenheiros, analistas, empresas B2B)?"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Tecnologias Relacionadas */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Tecnologias & Frameworks Utilizados</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {(formData.relatedTechnologies || []).map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 text-cyan-300 text-xs font-semibold border border-slate-700"
                    >
                      <span>{tech}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={handleAddTech}
                      placeholder="Adicionar tech (Enter)..."
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddTech}
                      className="p-1 rounded bg-slate-800 text-cyan-400 hover:bg-slate-700 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* IAs do Catálogo Conectadas */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">IAs do Catálogo Relacionadas a este Projeto</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {(formData.relatedIANames || []).map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-950/40 text-indigo-300 text-xs font-semibold border border-indigo-500/40"
                    >
                      <button
                        type="button"
                        onClick={() => onSelectInCatalog?.(name)}
                        className="hover:underline"
                        title="Ver no catálogo"
                      >
                        {name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveIA(name)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <div className="flex items-center gap-1">
                    <select
                      value={selectedIAName}
                      onChange={(e) => setSelectedIAName(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="">Vincular IA do catálogo...</option>
                      {catalog.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.category})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddIA}
                      disabled={!selectedIAName}
                      className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
                    >
                      Vincular
                    </button>
                  </div>
                </div>
              </div>

              {/* Próximos Passos Imediatos */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cyan-300">Próximo Passo Imediato</label>
                <input
                  type="text"
                  value={formData.nextSteps || ''}
                  onChange={(e) => handleChange('nextSteps', e.target.value)}
                  placeholder="Qual ação prática você precisa executar logo a seguir?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-cyan-500/30 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              {/* Observações Gerais */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Observações Gerais</label>
                <textarea
                  rows={2}
                  value={formData.observations || ''}
                  onChange={(e) => handleChange('observations', e.target.value)}
                  placeholder="Anotações livres sobre o projeto..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Botão de Excluir Projeto */}
              {onDeleteIdea && (
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir o projeto "${formData.title}"?`)) {
                        onDeleteIdea(formData.id);
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Ideia / Projeto</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: CONCEITO, APLICAÇÃO PRÁTICA & PROMPTS DAS ETAPAS COM REVISÕES INFINITAS */}
          {activeTab === 'concept_stages' && (
            <ProjectConceptAndStagesTab
              idea={formData}
              catalog={catalog}
              onUpdateIdea={(updated) => {
                setFormData(updated);
                onUpdateIdea(updated);
              }}
              onSelectInCatalog={onSelectInCatalog}
            />
          )}

          {/* TAB 2: HISTÓRICO DE EVOLUÇÃO (V1, V2, V3...) */}
          {activeTab === 'evolution' && (
            <IdeaEvolutionHistory
              idea={formData}
              versions={versions}
              onAddVersion={handleAddVersion}
            />
          )}

          {/* TAB 3: DIÁRIO DE BORDO */}
          {activeTab === 'diary' && (
            <IdeaDiaryTab
              ideaId={formData.id}
              logs={logs}
              onAddLog={handleAddLog}
              onDeleteLog={handleDeleteLog}
            />
          )}

          {/* TAB 4: ROADMAP ESTRATÉGICO */}
          {activeTab === 'roadmap' && (
            <RoadmapEditor
              items={formData.roadmap || []}
              onChange={(updatedRoadmap) => handleChange('roadmap', updatedRoadmap)}
            />
          )}

          {/* TAB 5: ESTUDOS CONECTADOS (VÍNCULO BIDIRECIONAL) */}
          {activeTab === 'studies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Link className="w-4 h-4 text-cyan-400" />
                    <span>Estudos que Alimentam este Projeto</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecione quais temas do Banco de Estudos foram estudados e geraram conhecimento para este projeto.
                  </p>
                </div>
              </div>

              {studies.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                  Nenhum estudo cadastrado no banco de estudos. Crie novos estudos na aba "Banco de Estudos" para vinculá-los aqui!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studies.map((study) => {
                    const isLinked = (study.relatedProjectIds || []).includes(formData.id);
                    return (
                      <div
                        key={study.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isLinked
                            ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'bg-slate-900/70 border-slate-800 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                              {study.level} • {study.progress}% concluído
                            </span>
                            <h4 className="text-xs font-bold text-white leading-snug">
                              {study.theme}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleStudyLink(study.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                              isLinked
                                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isLinked ? '✓ Vinculado' : '+ Vincular'}
                          </button>
                        </div>

                        {study.acquiredKnowledge && (
                          <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                            "{study.acquiredKnowledge}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ASSISTENTE DE IA DE EVOLUÇÃO */}
          {activeTab === 'ai_assistant' && (
            <AIEvolutionAssistantTab
              idea={formData}
              historyVersions={versions}
              evolutionLogs={logs}
              relatedStudies={linkedStudies}
              catalog={catalog}
              onAcceptEvolutionAsVersion={async (sugData) => {
                await handleAddVersion({
                  ideaId: formData.id,
                  version: `V${versions.length + 2}`,
                  changedSummary: sugData.changedSummary,
                  changeReason: sugData.changeReason,
                  decisionTaken: sugData.decisionTaken,
                  nextStep: sugData.nextStep,
                  observations: sugData.observations,
                });
              }}
              onApplyRoadmapSuggestions={(suggestedRm) => {
                const merged = [...(formData.roadmap || []), ...suggestedRm];
                handleChange('roadmap', merged);
              }}
              onSelectInCatalog={onSelectInCatalog}
            />
          )}
        </div>
      </div>
    </div>
  );
};
