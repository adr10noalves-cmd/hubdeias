import React, { useState, useEffect, useMemo } from 'react';
import { IAItem, IACategory, CATEGORIES } from './types';
import { initialIAs } from './data/initialIAs';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { FiltersBar } from './components/FiltersBar';
import { StrategicDecisionPanel } from './components/StrategicDecisionPanel';
import { IACard } from './components/IACard';
import { IAModal } from './components/IAModal';
import { CompareModal } from './components/CompareModal';
import { FloatingCompareBar } from './components/FloatingCompareBar';
import { BeginnerGuide } from './components/BeginnerGuide';
import { FeaturedBeginnerSection } from './components/FeaturedBeginnerSection';
import { AboutSection } from './components/AboutSection';
import { IADetailModal } from './components/IADetailModal';
import { FichaOperacionalModal } from './components/FichaOperacionalModal';
import { StrategicMotorModal } from './components/StrategicMotorModal';
import { CentralDeIAModal } from './components/CentralDeIAModal';
import { CentralAICoordinator } from './components/CentralAICoordinator';
import { categoryIcons, resolveIADetails } from './utils/helpers';
import { Layers, Sparkles } from 'lucide-react';
import {
  getIAsFromFirestore,
  saveIAToFirestore,
  deleteIAFromFirestore,
  seedInitialIAs,
  subscribeToIAs,
} from './services/firestoreService';
import { SyncStatus } from './components/FirebaseStatusBadge';
import { StrategicNavTabs, MainHubView } from './components/strategic/StrategicNavTabs';
import { IdeasManager } from './components/strategic/IdeasManager';
import { StudiesManager } from './components/strategic/StudiesManager';
import { EvolutionDiaryGlobalView } from './components/strategic/EvolutionDiaryGlobalView';
import { EvolutionDashboard } from './components/strategic/EvolutionDashboard';
import { GlobalSearchModal } from './components/strategic/GlobalSearchModal';
import { IdeaDetailModal } from './components/strategic/IdeaDetailModal';
import { IdeaItem, StudyItem, EvolutionLog } from './types';
import {
  subscribeToIdeas,
  subscribeToStudies,
  subscribeToEvolutionLogs,
  saveIdeaToFirestore,
  deleteIdeaFromFirestore,
} from './services/strategicMemoryService';

const STORAGE_KEY = 'ias_v2';

export default function App() {
  const [ias, setIas] = useState<IAItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load IAs from localStorage', e);
    }
    return initialIAs;
  });

  // Estado de sincronização com o Firebase Firestore
  const [firebaseStatus, setFirebaseStatus] = useState<SyncStatus>('syncing');
  const [firebaseError, setFirebaseError] = useState<string | undefined>();

  // Sincronização e Realtime Listener com o Firestore
  useEffect(() => {
    let isMounted = true;

    // 1. Carregar do Firestore na montagem
    async function loadFirestore() {
      try {
        setFirebaseStatus('syncing');
        const remoteIAs = await getIAsFromFirestore();
        if (isMounted && remoteIAs.length > 0) {
          setIas(remoteIAs);
          setFirebaseStatus('connected');
          setFirebaseError(undefined);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteIAs));
          } catch {}
        }
      } catch (err: any) {
        console.warn('[Firestore] Erro ao carregar da nuvem, mantendo cache local:', err);
        if (isMounted) {
          setFirebaseStatus('error');
          setFirebaseError(err?.message || 'Falha ao conectar no Firestore');
        }
      }
    }

    loadFirestore();

    // 2. Assinatura em tempo real para sincronização com outros dispositivos / abas
    const unsubscribe = subscribeToIAs(
      (updatedList) => {
        if (isMounted && updatedList.length > 0) {
          setIas(updatedList);
          setFirebaseStatus('connected');
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
          } catch {}
        }
      },
      (error) => {
        if (isMounted) {
          console.warn('[Firestore Realtime Error]:', error);
          setFirebaseStatus('error');
          setFirebaseError(error.message);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Forçar sincronização manual
  const handleManualSyncFirestore = async () => {
    try {
      setFirebaseStatus('syncing');
      const remote = await getIAsFromFirestore();
      if (remote.length > 0) {
        setIas(remote);
      } else {
        await seedInitialIAs(ias);
      }
      setFirebaseStatus('connected');
      setFirebaseError(undefined);
    } catch (err: any) {
      setFirebaseStatus('error');
      setFirebaseError(err?.message || 'Falha ao sincronizar');
    }
  };

  // Navegação Principal do HUB (Catálogo vs Ideias & Projetos vs Banco de Estudos vs Diário vs Dashboard)
  const [currentHubView, setCurrentHubView] = useState<MainHubView>('catalog');

  // Estados de Memória Estratégica
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [studies, setStudies] = useState<StudyItem[]>([]);
  const [evolutionLogs, setEvolutionLogs] = useState<EvolutionLog[]>([]);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [selectedIdeaDetail, setSelectedIdeaDetail] = useState<IdeaItem | null>(null);
  const [isIdeaDetailOpen, setIsIdeaDetailOpen] = useState(false);

  // Subscriptions em tempo real para Memória Estratégica (Ideias, Estudos, Diário)
  useEffect(() => {
    const unsubIdeas = subscribeToIdeas((loadedIdeas) => {
      setIdeas(loadedIdeas);
    });

    const unsubStudies = subscribeToStudies((loadedStudies) => {
      setStudies(loadedStudies);
    });

    const unsubLogs = subscribeToEvolutionLogs(undefined, (loadedLogs) => {
      setEvolutionLogs(loadedLogs);
    });

    // Atalho global Ctrl+K / Cmd+K para busca inteligente
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubIdeas();
      unsubStudies();
      unsubLogs();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedPricing, setSelectedPricing] = useState<string>('');

  // Modals & Panels
  const [isCentralIAOpen, setIsCentralIAOpen] = useState(false);
  const [isMotorOpen, setIsMotorOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIA, setEditingIA] = useState<IAItem | null>(null);

  // Detail Modal (V2 drico IAS feature)
  const [detailIA, setDetailIA] = useState<IAItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Comparison State
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());

  // Persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ias));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }, [ias]);

  // Filtering Logic
  const filteredIAs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return ias.filter((item) => {
      const details = resolveIADetails(item);
      const haystack = [
        item.name,
        item.category,
        item.specialty,
        item.differential,
        details.whatIsIt,
        details.whatIsItFor,
        details.pricingDetails,
        details.beginnerTip,
        ...(details.bestTasks || []),
        ...(details.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = !q || haystack.includes(q);
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesLevel = !selectedLevel || item.level === selectedLevel;
      const matchesDifficulty = !selectedDifficulty || details.difficulty === selectedDifficulty;
      const matchesPricing =
        !selectedPricing ||
        details.pricing.includes(selectedPricing) ||
        details.pricing === selectedPricing;

      return matchesQuery && matchesCategory && matchesLevel && matchesDifficulty && matchesPricing;
    });
  }, [ias, searchTerm, selectedCategory, selectedLevel, selectedDifficulty, selectedPricing]);

  // Toggle comparison selection
  const handleToggleCompare = (id: number) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 2) {
          alert('Você pode selecionar no máximo 2 IAs simultaneamente para comparar.');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleClearCompare = () => {
    setCompareIds(new Set());
  };

  // Open detail modal
  const handleOpenDetail = (item: IAItem) => {
    setDetailIA(item);
    setIsDetailOpen(true);
  };

  // Open edit modal
  const handleEditIA = (item: IAItem) => {
    setEditingIA(item);
    setIsAddModalOpen(true);
  };

  // Add / Edit IA
  const handleSaveIA = (iaData: Partial<IAItem> & { id?: number }) => {
    if (iaData.id) {
      // Edit existing — Não apagar dados antigos quando uma IA for editada
      let updatedItemForCloud: IAItem | null = null;
      setIas((prev) =>
        prev.map((item) => {
          if (item.id === iaData.id) {
            const updated = { ...item };
            for (const [key, value] of Object.entries(iaData)) {
              if (value !== undefined) {
                // Preserva os dados antigos e atualiza apenas os definidos
                (updated as any)[key] = value;
              }
            }
            updatedItemForCloud = updated as IAItem;
            return updated as IAItem;
          }
          return item;
        })
      );

      if (updatedItemForCloud) {
        saveIAToFirestore(updatedItemForCloud).catch((err) =>
          console.warn('[Firestore] Salvo localmente, erro ao persistir nuvem:', err)
        );
      }

      if (detailIA?.id === iaData.id) {
        setDetailIA((prev) => {
          if (!prev) return null;
          const updated = { ...prev };
          for (const [key, value] of Object.entries(iaData)) {
            if (value !== undefined) {
              (updated as any)[key] = value;
            }
          }
          return updated as IAItem;
        });
      }
    } else {
      // Create new
      const nextId = ias.length > 0 ? Math.max(...ias.map((i) => i.id)) + 1 : 1;
      const newItem: IAItem = {
        id: nextId,
        name: iaData.name || 'Nova IA',
        category: iaData.category || CATEGORIES[0],
        specialty: iaData.specialty || '',
        differential: iaData.differential || '',
        level: iaData.level || 'Alta Performance',
        difficulty: iaData.difficulty || 'Iniciante',
        pricing: iaData.pricing || 'Freemium (Grátis + Pago)',
        pricingDetails: iaData.pricingDetails || 'Versão gratuita com limites diários.',
        whatIsIt: iaData.whatIsIt || '',
        whatIsItFor: iaData.whatIsItFor || '',
        bestTasks: iaData.bestTasks || [],
        beginnerTip: iaData.beginnerTip || '',
        link: iaData.link || 'https://',
        scores: iaData.scores || {
          Geral: 4,
          Código: 3,
          Pesquisa: 3,
          Criação: 3,
          Automação: 3,
        },
        // Novos campos V2.2
        paraQueServe: iaData.paraQueServe,
        quandoUsar: iaData.quandoUsar,
        quandoNaoUsar: iaData.quandoNaoUsar,
        melhorPara: iaData.melhorPara,
        pontosFortes: iaData.pontosFortes,
        limitacoes: iaData.limitacoes,
        exemploPrompt: iaData.exemploPrompt,
        observacaoEstrategica: iaData.observacaoEstrategica,
        // Novos metadados V2.3 Groq Curator
        sourceType: iaData.sourceType || 'manual',
        discoveredAt: iaData.discoveredAt,
        lastValidated: iaData.lastValidated,
        pricingType: iaData.pricingType,
        qualityScore: iaData.qualityScore,
        whyDiscovered: iaData.whyDiscovered,
        whyBetter: iaData.whyBetter,
        validationStatus: iaData.validationStatus,
      };
      setIas((prev) => [newItem, ...prev]);

      // Persistir nova IA no Firestore
      saveIAToFirestore(newItem).catch((err) =>
        console.warn('[Firestore] Salvo localmente, erro ao persistir nuvem:', err)
      );
    }
  };

  // Delete IA
  const handleDeleteIA = (id: number) => {
    const target = ias.find((i) => i.id === id);
    if (!target) return;
    if (window.confirm(`Tem certeza de que deseja remover "${target.name}" do catálogo?`)) {
      setIas((prev) => prev.filter((i) => i.id !== id));
      setCompareIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (detailIA?.id === id) {
        setIsDetailOpen(false);
        setDetailIA(null);
      }
      // Deletar também no Firestore
      deleteIAFromFirestore(id).catch((err) =>
        console.warn('[Firestore] Removido localmente, erro na nuvem:', err)
      );
    }
  };

  // Reset to original 55 IAs
  const handleResetDefault = () => {
    if (window.confirm('Deseja restaurar o catálogo de IAs para o padrão de fábrica do drico IAS? Suas alterações salvas serão substituídas.')) {
      setIas(initialIAs);
      setCompareIds(new Set());
      setSearchTerm('');
      setSelectedCategory('');
      setSelectedLevel('');
      setSelectedDifficulty('');
      setSelectedPricing('');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialIAs));
      // Re-popular Firestore na nuvem
      seedInitialIAs(initialIAs).catch((err) =>
        console.warn('[Firestore] Erro ao resetar nuvem:', err)
      );
    }
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedDifficulty('');
    setSelectedPricing('');
  };

  // Export JSON
  const handleExportJSON = () => {
    const jsonBlob = new Blob([JSON.stringify(ias, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `drico-ias-catalogo-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed)) {
          throw new Error('Formato inválido: o arquivo deve conter uma lista de IAs.');
        }
        setIas(parsed);
        setCompareIds(new Set());
        alert(`Sucesso! ${parsed.length} IAs importadas com êxito para o drico IAS.`);
      } catch (err) {
        alert('Erro ao importar JSON. Verifique se o arquivo possui a estrutura correta do HUB.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Categories to render
  const categoriesToDisplay = selectedCategory
    ? [selectedCategory as IACategory]
    : CATEGORIES;

  return (
    <div className="min-h-screen bg-[#070b18] text-[#e8eef6] bg-grid-pattern relative pb-20 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Header
          ias={ias}
          onOpenCentralIA={() => setIsCentralIAOpen(true)}
          onOpenMotor={() => setIsCentralIAOpen(true)}
        />

        {/* 🧭 NAVEGAÇÃO ESTRATÉGICA DO HUB (Catálogo vs Ideias & Projetos vs Banco de Estudos vs Diário vs Dashboard) */}
        <StrategicNavTabs
          currentView={currentHubView}
          onChangeView={setCurrentHubView}
          onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
          ideasCount={ideas.length}
          studiesCount={studies.length}
          logsCount={evolutionLogs.length}
        />

        {/* ========================================================================= */}
        {/* VISÃO 1: CATÁLOGO DE IAs (Totalmente preservado e original) */}
        {/* ========================================================================= */}
        {currentHubView === 'catalog' && (
          <>
            {/* Action Toolbar */}
            <Toolbar
              onOpenCentralIA={() => setIsCentralIAOpen(true)}
              onOpenMotor={() => setIsCentralIAOpen(true)}
              onOpenAddModal={() => {
                setEditingIA(null);
                setIsAddModalOpen(true);
              }}
              onToggleDecision={() => setIsDecisionOpen((prev) => !prev)}
              isDecisionOpen={isDecisionOpen}
              onOpenCompare={() => setIsCompareOpen(true)}
              compareCount={compareIds.size}
              onExportJSON={handleExportJSON}
              onImportJSON={handleImportJSON}
              onResetDefault={handleResetDefault}
              firebaseStatus={firebaseStatus}
              firebaseError={firebaseError}
              onManualSyncFirestore={handleManualSyncFirestore}
              iaCount={ias.length}
            />

            {/* Guia Didático para Iniciantes (V2.0) */}
            <BeginnerGuide
              onSelectPreset={(query, cat) => {
                setSearchTerm(query);
                if (cat) setSelectedCategory(cat);
                window.scrollTo({ top: 460, behavior: 'smooth' });
              }}
            />

            {/* Ferramentas Mais Recomendadas para Quem Está Começando (V2.0) */}
            <FeaturedBeginnerSection
              ias={ias}
              onOpenDetail={handleOpenDetail}
              onSelectIA={(tool) => {
                setSearchTerm(tool.name);
                window.scrollTo({ top: 560, behavior: 'smooth' });
              }}
            />

            {/* Filters com Dificuldade, Preço e Atalhos de Categorias (V2.0) */}
            <FiltersBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
              selectedPricing={selectedPricing}
              onPricingChange={setSelectedPricing}
              onResetFilters={handleResetFilters}
              filteredCount={filteredIAs.length}
              totalCount={ias.length}
            />

            {/* Strategic Decision Recommendation Matrix */}
            <StrategicDecisionPanel
              ias={ias}
              isOpen={isDecisionOpen}
              onClose={() => setIsDecisionOpen(false)}
              onSelectCategory={(category) => {
                setSelectedCategory(category);
                setIsDecisionOpen(false);
              }}
              onSelectIA={(tool) => {
                setSearchTerm(tool.name);
                setIsDecisionOpen(false);
              }}
            />

            {/* Main Catalog Grid */}
            <main className="space-y-10">
              {filteredIAs.length === 0 ? (
                <div className="bg-slate-900/50 border border-dashed border-cyan-500/30 rounded-3xl p-12 text-center my-8">
                  <div className="inline-flex p-3.5 rounded-2xl bg-slate-800 text-cyan-400 mb-3 border border-cyan-500/20">
                    <Layers className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-display">Nenhuma IA encontrada</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                    Não encontramos ferramentas correspondentes aos filtros selecionados. Tente buscar por outros termos de tarefa ou redefinir os filtros.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all hover:scale-[1.02]"
                  >
                    Limpar todos os filtros
                  </button>
                </div>
              ) : (
                categoriesToDisplay.map((cat) => {
                  const categoryItems = filteredIAs.filter((item) => item.category === cat);
                  if (categoryItems.length === 0) return null;

                  return (
                    <section key={cat} className="space-y-4">
                      {/* Category Title bar */}
                      <div className="flex items-end justify-between border-b border-cyan-500/20 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{categoryIcons[cat]}</span>
                          <h2 className="text-lg sm:text-xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
                            {cat}
                          </h2>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                          {categoryItems.length} {categoryItems.length === 1 ? 'ferramenta catalogada' : 'ferramentas catalogadas'}
                        </span>
                      </div>

                      {/* Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                        {categoryItems.map((ia) => (
                          <IACard
                            key={ia.id}
                            ia={ia}
                            isCompared={compareIds.has(ia.id)}
                            onToggleCompare={handleToggleCompare}
                            onOpenDetail={handleOpenDetail}
                            onEdit={(item) => {
                              setEditingIA(item);
                              setIsAddModalOpen(true);
                            }}
                            onDelete={handleDeleteIA}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })
              )}
            </main>

            {/* Sobre o Projeto drico IAS (V2.0) */}
            <AboutSection totalIAs={ias.length} />
          </>
        )}

        {/* ========================================================================= */}
        {/* VISÃO 2: CENTRAL DE IDEIAS & PROJETOS (Maturidade 1-9, Versões, Roadmap) */}
        {/* ========================================================================= */}
        {currentHubView === 'ideas' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-cyan-500/20 pb-4">
              <h2 className="text-2xl font-black text-white font-display tracking-tight flex items-center gap-2.5">
                <Layers className="w-6 h-6 text-cyan-400" />
                <span>Central de Ideias & Projetos</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Memória viva de todos os seus projetos. Acompanhe a evolução de 1 (Ideia) a 9 (Evolução Contínua) com histórico de versões.
              </p>
            </div>

            <IdeasManager
              ideas={ideas}
              studies={studies}
              catalog={ias}
              onSelectInCatalog={(toolName) => {
                setSearchTerm(toolName);
                setCurrentHubView('catalog');
                window.scrollTo({ top: 560, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISÃO 3: BANCO DE ESTUDOS (Conhecimentos, Níveis, Vínculo com Projetos) */}
        {/* ========================================================================= */}
        {currentHubView === 'studies' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-indigo-500/20 pb-4">
              <h2 className="text-2xl font-black text-white font-display tracking-tight flex items-center gap-2.5">
                <span className="text-indigo-400">📚</span>
                <span>Banco de Estudos & Conhecimento Estratégico</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Cadastre o que você estuda, registre aprendizados e conecte seus estudos com os projetos que eles alimentam.
              </p>
            </div>

            <StudiesManager
              studies={studies}
              ideas={ideas}
              catalog={ias}
              onOpenIdeaDetail={(idea) => {
                setSelectedIdeaDetail(idea);
                setIsIdeaDetailOpen(true);
              }}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISÃO 4: DIÁRIO DE BORDO GLOBAL (Pensamentos, Descobertas, Decisões) */}
        {/* ========================================================================= */}
        {currentHubView === 'diary' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-emerald-500/20 pb-4">
              <h2 className="text-2xl font-black text-white font-display tracking-tight flex items-center gap-2.5">
                <span className="text-emerald-400">📔</span>
                <span>Diário de Evolução & Pensamentos</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Linha do tempo consolidada de percepções, descobertas, obstáculos e decisões estratégicas de todos os seus projetos.
              </p>
            </div>

            <EvolutionDiaryGlobalView
              ideas={ideas}
              onOpenIdeaDetail={(idea) => {
                setSelectedIdeaDetail(idea);
                setIsIdeaDetailOpen(true);
              }}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISÃO 5: DASHBOARD DE EVOLUÇÃO (Funil de Maturidade, Métricas, Alertas) */}
        {/* ========================================================================= */}
        {currentHubView === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-purple-500/20 pb-4">
              <h2 className="text-2xl font-black text-white font-display tracking-tight flex items-center gap-2.5">
                <span className="text-purple-400">📊</span>
                <span>Dashboard de Evolução & Indicadores</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Visão executiva da maturidade dos seus projetos, estudos em andamento e próximos passos prioritários.
              </p>
            </div>

            <EvolutionDashboard
              ideas={ideas}
              studies={studies}
              logs={evolutionLogs}
              onOpenIdeaDetail={(idea) => {
                setSelectedIdeaDetail(idea);
                setIsIdeaDetailOpen(true);
              }}
              onOpenStudyTab={() => setCurrentHubView('studies')}
              onOpenIdeasTab={() => setCurrentHubView('ideas')}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-14 pt-8 border-t border-slate-800/80 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>HUB ESTRATÉGICO DE IAs — V2.1 • drico IAS</span>
          </div>
          <p className="text-slate-500">
            Catálogo operacional com motor de recomendação estratégica e persistência local via localStorage.
          </p>
        </footer>
      </div>

      {/* Floating Compare Action Bar */}
      <FloatingCompareBar
        compareIds={compareIds}
        ias={ias}
        onOpenCompare={() => setIsCompareOpen(true)}
        onClearCompare={handleClearCompare}
      />

      {/* 🧠 CENTRAL DE IA — Central Operacional de Inteligência Artificial */}
      <CentralDeIAModal
        isOpen={isCentralIAOpen}
        onClose={() => setIsCentralIAOpen(false)}
        ias={ias}
        onOpenDetail={handleOpenDetail}
        onSelectInCatalog={(name) => {
          setSearchTerm(name);
          window.scrollTo({ top: 580, behavior: 'smooth' });
        }}
        onAddIA={(newIA) => {
          handleSaveIA(newIA);
        }}
      />

      {/* 🎯 Motor Estratégico — "Qual IA devo usar?" (V2.1) + Curador Groq (V2.3) */}
      <StrategicMotorModal
        isOpen={isMotorOpen}
        onClose={() => setIsMotorOpen(false)}
        ias={ias}
        onOpenDetail={handleOpenDetail}
        onAddIA={(newIA) => {
          handleSaveIA(newIA);
        }}
        onSelectInCatalog={(name) => {
          setSearchTerm(name);
          window.scrollTo({ top: 580, behavior: 'smooth' });
        }}
      />

      {/* Ficha Operacional Prática V2.2 (7 Seções Estratégicas + Copiar Prompt) */}
      <FichaOperacionalModal
        isOpen={isDetailOpen}
        ia={detailIA}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailIA(null);
        }}
        isCompared={detailIA ? compareIds.has(detailIA.id) : false}
        onToggleCompare={(id) => handleToggleCompare(id)}
        onEdit={(ia) => handleEditIA(ia)}
      />

      {/* Add / Edit Modal */}
      <IAModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingIA(null);
        }}
        onSave={handleSaveIA}
        editingIA={editingIA}
      />

      {/* Compare Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        ias={ias}
        compareIds={compareIds}
        onToggleCompare={handleToggleCompare}
        onClearCompare={handleClearCompare}
      />

      {/* 🤖 CENTRAL IA — NÚCLEO INTELIGENTE DE ORQUESTRAÇÃO DO HUB */}
      <CentralAICoordinator
        catalog={ias}
        ideas={ideas}
        studies={studies}
        evolutionLogs={evolutionLogs}
        onOpenCatalogWithFilter={(cat) => {
          setSelectedCategory(cat);
          window.scrollTo({ top: 580, behavior: 'smooth' });
        }}
        onOpenPromptGen={() => setIsCentralIAOpen(true)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenAIDetail={(ai) => handleOpenDetail(ai)}
        onOpenIdeaDetail={(idea) => {
          setSelectedIdeaDetail(idea);
          setIsIdeaDetailOpen(true);
        }}
        onCreateIdea={async (newIdea) => {
          await saveIdeaToFirestore(newIdea);
          setIdeas((prev) => [newIdea, ...prev.filter((i) => i.id !== newIdea.id)]);
        }}
        onUpdateIdea={async (updated) => {
          await saveIdeaToFirestore(updated);
          setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        }}
        onSelectStudy={(study) => {
          setCurrentHubView('studies');
        }}
      />

      {/* 🔍 BUSCA INTELIGENTE CRUZADA GLOBAL (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        ideas={ideas}
        studies={studies}
        logs={evolutionLogs}
        onSelectIdea={(idea) => {
          setSelectedIdeaDetail(idea);
          setIsIdeaDetailOpen(true);
        }}
        onSelectStudy={(study) => {
          setCurrentHubView('studies');
        }}
      />

      {/* 💡 DETALHE E MEMÓRIA ESTRATÉGICA DA IDEIA */}
      <IdeaDetailModal
        isOpen={isIdeaDetailOpen}
        idea={selectedIdeaDetail}
        onClose={() => {
          setIsIdeaDetailOpen(false);
          setSelectedIdeaDetail(null);
        }}
        onUpdateIdea={(updated) => {
          setIdeas((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          setSelectedIdeaDetail(updated);
        }}
        onDeleteIdea={(id) => {
          setIdeas((prev) => prev.filter((i) => i.id !== id));
          setIsIdeaDetailOpen(false);
          setSelectedIdeaDetail(null);
          deleteIdeaFromFirestore(id).catch((e) =>
            console.warn('[Firestore] Erro ao deletar ideia:', e)
          );
        }}
        studies={studies}
        catalog={ias}
        onSelectInCatalog={(name) => {
          setSearchTerm(name);
          setCurrentHubView('catalog');
          setIsIdeaDetailOpen(false);
        }}
      />
    </div>
  );
}
