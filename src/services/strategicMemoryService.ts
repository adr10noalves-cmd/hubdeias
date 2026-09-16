import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  IdeaItem,
  IdeaVersion,
  EvolutionLog,
  StudyItem,
  RoadmapItem,
  ProjectRevision,
} from '../types';

const IDEAS_COLLECTION = 'ideas';
const VERSIONS_COLLECTION = 'idea_versions';
const LOGS_COLLECTION = 'evolution_logs';
const STUDIES_COLLECTION = 'studies';
const REVISIONS_COLLECTION = 'project_revisions';

const LOCAL_STORAGE_PREFIX = 'hub_strategic_memory_';

/**
 * Remove valores undefined de objetos recursivamente para evitar erros no Firestore.
 */
function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

// ==========================================
// 💡 CENTRAL DE IDEIAS E PROJETOS
// ==========================================

export async function getIdeasFromFirestore(): Promise<IdeaItem[]> {
  try {
    const colRef = collection(db, IDEAS_COLLECTION);
    const snap = await getDocs(colRef);
    const items: IdeaItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        ...data,
        id: docSnap.id,
      } as IdeaItem);
    });
    // Ordenar por data de atualização decrescente
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}ideas`, JSON.stringify(items));
    } catch {}
    return items;
  } catch (err) {
    console.warn('[Firestore] Falha ao ler ideias da nuvem, lendo cache local:', err);
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}ideas`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  }
}

export async function saveIdeaToFirestore(idea: IdeaItem): Promise<void> {
  try {
    const docRef = doc(db, IDEAS_COLLECTION, idea.id);
    const clean = cleanFirestoreData({
      ...idea,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, clean, { merge: true });
    // Atualizar cache local
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}ideas`);
      const list: IdeaItem[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex((i) => i.id === idea.id);
      if (idx >= 0) {
        list[idx] = clean as IdeaItem;
      } else {
        list.unshift(clean as IdeaItem);
      }
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}ideas`, JSON.stringify(list));
    } catch {}
  } catch (err) {
    console.error(`[Firestore saveIdea Error id=${idea.id}]:`, err);
    // Salvar no cache local para resiliência
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}ideas`);
      const list: IdeaItem[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex((i) => i.id === idea.id);
      if (idx >= 0) {
        list[idx] = idea;
      } else {
        list.unshift(idea);
      }
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}ideas`, JSON.stringify(list));
    } catch {}
    throw err;
  }
}

export async function deleteIdeaFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, IDEAS_COLLECTION, id);
    await deleteDoc(docRef);
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}ideas`);
      if (cached) {
        const list: IdeaItem[] = JSON.parse(cached);
        const filtered = list.filter((i) => i.id !== id);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}ideas`, JSON.stringify(filtered));
      }
    } catch {}
  } catch (err) {
    console.error(`[Firestore deleteIdea Error id=${id}]:`, err);
    throw err;
  }
}

export function subscribeToIdeas(
  onUpdate: (items: IdeaItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, IDEAS_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: IdeaItem[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          ...data,
          id: docSnap.id,
        } as IdeaItem);
      });
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}ideas`, JSON.stringify(items));
      } catch {}
      onUpdate(items);
    },
    (error) => {
      console.warn('[Firestore subscribeToIdeas Realtime Error]:', error);
      if (onError) onError(error);
    }
  );
}

// ==========================================
// 🧬 EVOLUÇÃO E VERSÕES (V1, V2, V3...)
// ==========================================

export async function getIdeaVersionsFromFirestore(ideaId: string): Promise<IdeaVersion[]> {
  try {
    const colRef = collection(db, VERSIONS_COLLECTION);
    const q = query(colRef, where('ideaId', '==', ideaId));
    const snap = await getDocs(q);
    const items: IdeaVersion[] = [];
    snap.forEach((docSnap) => {
      items.push({
        ...docSnap.data(),
        id: docSnap.id,
      } as IdeaVersion);
    });
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    console.warn(`[Firestore] Falha ao ler versões da ideia ${ideaId}:`, err);
    return [];
  }
}

export async function saveIdeaVersionToFirestore(version: IdeaVersion): Promise<void> {
  try {
    const docRef = doc(db, VERSIONS_COLLECTION, version.id);
    const clean = cleanFirestoreData({
      ...version,
      createdAt: version.createdAt || new Date().toISOString(),
    });
    await setDoc(docRef, clean, { merge: true });
  } catch (err) {
    console.error(`[Firestore saveIdeaVersion Error id=${version.id}]:`, err);
    throw err;
  }
}

export function subscribeToIdeaVersions(
  ideaId: string,
  onUpdate: (items: IdeaVersion[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, VERSIONS_COLLECTION);
  const q = query(colRef, where('ideaId', '==', ideaId));
  return onSnapshot(
    q,
    (snap) => {
      const items: IdeaVersion[] = [];
      snap.forEach((docSnap) => {
        items.push({
          ...docSnap.data(),
          id: docSnap.id,
        } as IdeaVersion);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      console.warn('[Firestore subscribeToIdeaVersions Error]:', error);
      if (onError) onError(error);
    }
  );
}

// ==========================================
// 🔄 REVISÕES INFINITAS COM IA
// ==========================================

export async function getProjectRevisionsFromFirestore(ideaId: string): Promise<ProjectRevision[]> {
  try {
    const colRef = collection(db, REVISIONS_COLLECTION);
    const q = query(colRef, where('ideaId', '==', ideaId));
    const snap = await getDocs(q);
    const items: ProjectRevision[] = [];
    snap.forEach((docSnap) => {
      items.push({
        ...docSnap.data(),
        id: docSnap.id,
      } as ProjectRevision);
    });
    items.sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0));
    return items;
  } catch (err) {
    console.warn(`[Firestore] Falha ao ler revisões da ideia ${ideaId}:`, err);
    return [];
  }
}

export async function saveProjectRevisionToFirestore(revision: ProjectRevision): Promise<void> {
  try {
    const docRef = doc(db, REVISIONS_COLLECTION, revision.id);
    const clean = cleanFirestoreData({
      ...revision,
      createdAt: revision.createdAt || new Date().toISOString(),
    });
    await setDoc(docRef, clean, { merge: true });
  } catch (err) {
    console.error(`[Firestore saveProjectRevision Error id=${revision.id}]:`, err);
    throw err;
  }
}

export function subscribeToProjectRevisions(
  ideaId: string,
  onUpdate: (items: ProjectRevision[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, REVISIONS_COLLECTION);
  const q = query(colRef, where('ideaId', '==', ideaId));
  return onSnapshot(
    q,
    (snap) => {
      const items: ProjectRevision[] = [];
      snap.forEach((docSnap) => {
        items.push({
          ...docSnap.data(),
          id: docSnap.id,
        } as ProjectRevision);
      });
      items.sort((a, b) => (b.revisionNumber || 0) - (a.revisionNumber || 0));
      onUpdate(items);
    },
    (error) => {
      console.warn('[Firestore subscribeToProjectRevisions Error]:', error);
      if (onError) onError(error);
    }
  );
}

// ==========================================
// 📔 DIÁRIO DE EVOLUÇÃO / DIÁRIO DE BORDO
// ==========================================

export async function getEvolutionLogsFromFirestore(ideaId?: string): Promise<EvolutionLog[]> {
  try {
    const colRef = collection(db, LOGS_COLLECTION);
    let snap;
    if (ideaId) {
      const q = query(colRef, where('ideaId', '==', ideaId));
      snap = await getDocs(q);
    } else {
      snap = await getDocs(colRef);
    }
    const items: EvolutionLog[] = [];
    snap.forEach((docSnap) => {
      items.push({
        ...docSnap.data(),
        id: docSnap.id,
      } as EvolutionLog);
    });
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (err) {
    console.warn('[Firestore] Falha ao ler logs de evolução:', err);
    return [];
  }
}

export async function saveEvolutionLogToFirestore(log: EvolutionLog): Promise<void> {
  try {
    const docRef = doc(db, LOGS_COLLECTION, log.id);
    const clean = cleanFirestoreData({
      ...log,
      createdAt: log.createdAt || new Date().toISOString(),
    });
    await setDoc(docRef, clean, { merge: true });
  } catch (err) {
    console.error(`[Firestore saveEvolutionLog Error id=${log.id}]:`, err);
    throw err;
  }
}

export async function deleteEvolutionLogFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, LOGS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`[Firestore deleteEvolutionLog Error id=${id}]:`, err);
    throw err;
  }
}

export function subscribeToEvolutionLogs(
  ideaId: string | undefined,
  onUpdate: (items: EvolutionLog[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, LOGS_COLLECTION);
  const q = ideaId ? query(colRef, where('ideaId', '==', ideaId)) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items: EvolutionLog[] = [];
      snap.forEach((docSnap) => {
        items.push({
          ...docSnap.data(),
          id: docSnap.id,
        } as EvolutionLog);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      console.warn('[Firestore subscribeToEvolutionLogs Error]:', error);
      if (onError) onError(error);
    }
  );
}

// ==========================================
// 📚 BANCO DE ESTUDOS
// ==========================================

export async function getStudiesFromFirestore(): Promise<StudyItem[]> {
  try {
    const colRef = collection(db, STUDIES_COLLECTION);
    const snap = await getDocs(colRef);
    const items: StudyItem[] = [];
    snap.forEach((docSnap) => {
      items.push({
        ...docSnap.data(),
        id: docSnap.id,
      } as StudyItem);
    });
    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}studies`, JSON.stringify(items));
    } catch {}
    return items;
  } catch (err) {
    console.warn('[Firestore] Falha ao ler estudos da nuvem, lendo cache local:', err);
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}studies`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  }
}

export async function saveStudyToFirestore(study: StudyItem): Promise<void> {
  try {
    const docRef = doc(db, STUDIES_COLLECTION, study.id);
    const clean = cleanFirestoreData({
      ...study,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, clean, { merge: true });
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}studies`);
      const list: StudyItem[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex((s) => s.id === study.id);
      if (idx >= 0) {
        list[idx] = clean as StudyItem;
      } else {
        list.unshift(clean as StudyItem);
      }
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}studies`, JSON.stringify(list));
    } catch {}
  } catch (err) {
    console.error(`[Firestore saveStudy Error id=${study.id}]:`, err);
    throw err;
  }
}

export async function deleteStudyFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, STUDIES_COLLECTION, id);
    await deleteDoc(docRef);
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}studies`);
      if (cached) {
        const list: StudyItem[] = JSON.parse(cached);
        const filtered = list.filter((s) => s.id !== id);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}studies`, JSON.stringify(filtered));
      }
    } catch {}
  } catch (err) {
    console.error(`[Firestore deleteStudy Error id=${id}]:`, err);
    throw err;
  }
}

export function subscribeToStudies(
  onUpdate: (items: StudyItem[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, STUDIES_COLLECTION);
  return onSnapshot(
    colRef,
    (snap) => {
      const items: StudyItem[] = [];
      snap.forEach((docSnap) => {
        items.push({
          ...docSnap.data(),
          id: docSnap.id,
        } as StudyItem);
      });
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}studies`, JSON.stringify(items));
      } catch {}
      onUpdate(items);
    },
    (error) => {
      console.warn('[Firestore subscribeToStudies Realtime Error]:', error);
      if (onError) onError(error);
    }
  );
}

// ==========================================
// 💡 EXEMPLO INICIAL / SEED DE DEMONSTRAÇÃO REAL
// ==========================================

export const initialIdeasSeed: IdeaItem[] = [
  {
    id: 'idea-auditor-sst',
    title: 'Auditor SST Inteligente',
    description: 'Plataforma para auditoria e conferência automática de documentação de Saúde e Segurança do Trabalho.',
    category: 'SST',
    objective: 'Automatizar a triagem, separação e conferência de conformidade de laudos como PGR, PCMSO e LTCAT.',
    problemSolved: 'Profissionais de SST gastam horas conferindo PDFs misturados com centenas de páginas manualmente.',
    targetAudience: 'Engenheiros de segurança do trabalho, clínicas ocupacionais e empresas com alto grau de risco.',
    stage: '4. Protótipo',
    priority: 'Alta',
    status: 'Em Progresso',
    relatedTechnologies: ['React', 'TypeScript', 'Node.js', 'Python', 'PyMuPDF'],
    relatedIANames: ['Claude 3.7 Sonnet', 'Gemini 2.5 Pro', 'ChatGPT'],
    currentVersion: 'V2',
    observations: 'Identificada necessidade de processar PDFs multifolhas sem perder o vínculo temporal.',
    nextSteps: 'Implementar parser com extração estruturada de tabelas e cruzamento de NRs.',
    roadmap: [
      { id: 'rm-1', stageTitle: 'Atual', goal: 'Separação automática de múltiplos documentos dentro de um único PDF', status: 'Em Andamento' },
      { id: 'rm-2', stageTitle: 'Próxima Evolução', goal: 'Identificação adaptativa dos tipos de laudos (PGR vs PCMSO)', status: 'Pendente' },
      { id: 'rm-3', stageTitle: 'Depois', goal: 'Auditoria de conformidade com NRs vigentes', status: 'Pendente' },
      { id: 'rm-4', stageTitle: 'Futuro', goal: 'Geração de relatório técnico assinado digitalmente', status: 'Pendente' },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const initialStudiesSeed: StudyItem[] = [
  {
    id: 'study-agentic-rag',
    theme: 'Arquitetura de Agentes de IA & RAG Estruturado',
    objective: 'Compreender a orquestração de múltiplos agentes especializados e recuperação contextual precisa.',
    level: 'Intermediário',
    acquiredKnowledge: 'Aprendi que um único modelo genérico falha em tarefas longas; a divisão em sub-agentes com responsabilidade única melhora a acurácia em mais de 70%.',
    doubts: 'Qual o melhor trade-off entre latência e orquestração determinística vs autônoma?',
    sources: ['Documentação LangGraph', 'Anthropic Building Effective Agents', 'Artigos arXiv'],
    toolsUsed: ['Claude 3.7 Sonnet', 'Groq', 'LangChain'],
    exercises: 'Construí um pipeline de classificação e roteamento de prompts de usuário.',
    conclusions: 'Para sistemas de produção, workflows semi-determinísticos são muito mais estáveis que agentes 100% autônomos.',
    nextSubjects: 'Memória persistente vetorial com embeddings compactos.',
    progress: 80,
    relatedProjectIds: ['idea-auditor-sst'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
