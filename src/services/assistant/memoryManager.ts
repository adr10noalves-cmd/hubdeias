import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../../firebase';
import {
  IdeaItem,
  StudyItem,
  EvolutionLog,
  IdeaVersion,
  StructuredAssistantContext,
  OperationalExecutionRecord,
  ProjectLearningEntry,
} from '../../types';
import {
  getIdeaVersionsFromFirestore,
  getEvolutionLogsFromFirestore,
  saveIdeaVersionToFirestore,
  saveEvolutionLogToFirestore,
  saveIdeaToFirestore,
} from '../strategicMemoryService';

const EXECUTIONS_COLLECTION = 'operational_executions';
const LOCAL_STORAGE_PREFIX = 'hub_assistant_memory_';

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

/**
 * 1. MEMÓRIA DO ASSISTENTE & MEMÓRIA DE PROJETOS
 * Recupera apenas o contexto estritamente relevante (não envia todo o banco).
 */
export async function buildContextualMemory(params: {
  userQuery: string;
  targetProjectId?: string;
  allIdeas: IdeaItem[];
  allStudies: StudyItem[];
}): Promise<StructuredAssistantContext> {
  const { userQuery, targetProjectId, allIdeas, allStudies } = params;
  const qLower = userQuery.toLowerCase();

  // 1. Identifica projeto alvo
  let matchedIdea: IdeaItem | undefined;

  if (targetProjectId) {
    matchedIdea = allIdeas.find((i) => i.id === targetProjectId);
  }

  if (!matchedIdea) {
    // Busca por menção direta ao título ou termos característicos da ideia
    matchedIdea = allIdeas.find((idea) => {
      const titleLower = idea.title.toLowerCase();
      return (
        qLower.includes(titleLower) ||
        (idea.category && qLower.includes(idea.category.toLowerCase()) && titleLower.split(' ').some((w) => w.length > 3 && qLower.includes(w)))
      );
    });
  }

  // Se nenhum projeto for identificado, retorna contexto genérico do Hub
  if (!matchedIdea) {
    return {
      currentProblems: [],
      decisions: [],
      nextSteps: [],
      relatedStudies: [],
      recentLogs: [],
      summaryForAI: `Nenhum projeto específico ativo no momento. Catálogo geral e base de estudos disponíveis.`,
    };
  }

  // 2. Recupera versão mais recente e histórico da ideia
  let lastEvolution = matchedIdea.currentVersion || 'V1';
  let versions: IdeaVersion[] = [];
  try {
    versions = await getIdeaVersionsFromFirestore(matchedIdea.id);
    if (versions.length > 0) {
      const latest = versions[0];
      lastEvolution = `${latest.version}: ${latest.changedSummary} (Decisão: ${latest.decisionTaken})`;
    }
  } catch (err) {
    console.warn('[MemoryManager] Falha ao recuperar versões:', err);
  }

  // 3. Recupera diário de bordo recente (últimos 4 logs de alto impacto)
  let recentLogs: Array<{ text: string; category: string; createdAt: string }> = [];
  try {
    const logs = await getEvolutionLogsFromFirestore(matchedIdea.id);
    recentLogs = logs.slice(0, 4).map((l) => ({
      text: l.text,
      category: l.category,
      createdAt: l.createdAt,
    }));
  } catch (err) {
    console.warn('[MemoryManager] Falha ao recuperar logs:', err);
  }

  // 4. Recupera estudos vinculados ao projeto
  const relatedStudies = allStudies
    .filter((s) => s.relatedProjectIds?.includes(matchedIdea!.id))
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      theme: s.theme,
      level: s.level,
      progress: s.progress,
    }));

  // 5. Extrai problemas atuais, decisões e próximos passos
  const currentProblems: string[] = [];
  if (matchedIdea.problemSolved) {
    currentProblems.push(matchedIdea.problemSolved);
  }
  recentLogs
    .filter((l) => l.category === 'Obstáculo')
    .forEach((l) => currentProblems.push(l.text));

  const decisions: string[] = [];
  versions.forEach((v) => {
    if (v.decisionTaken) decisions.push(v.decisionTaken);
  });
  recentLogs
    .filter((l) => l.category === 'Decisão')
    .forEach((l) => decisions.push(l.text));

  const nextSteps: string[] = [];
  if (matchedIdea.nextSteps) {
    nextSteps.push(matchedIdea.nextSteps);
  }
  if (matchedIdea.roadmap && matchedIdea.roadmap.length > 0) {
    const pending = matchedIdea.roadmap.filter((r) => r.status !== 'Concluído');
    pending.slice(0, 2).forEach((p) => nextSteps.push(`[${p.stageTitle}] ${p.goal}`));
  }

  // 6. Constrói resumo contextual estruturado e compacto para o modelo
  const summaryForAI = `
PROJETO ATIVO:
- Nome: "${matchedIdea.title}" (Estágio: ${matchedIdea.stage}, Versão: ${matchedIdea.currentVersion || 'V1'})
- Objetivo Central: ${matchedIdea.objective || matchedIdea.description}
- Última Evolução: ${lastEvolution}
- Problema/Gargalo Atual: ${currentProblems.slice(0, 2).join('; ') || 'Nenhum crítico'}
- Decisões Registradas: ${decisions.slice(0, 2).join('; ') || 'Nenhuma registrada'}
- Próximos Passos: ${nextSteps.slice(0, 2).join('; ') || 'A definir'}
- Estudos Relacionados: ${relatedStudies.length > 0 ? relatedStudies.map((s) => `${s.theme} (${s.progress}%)`).join(', ') : 'Nenhum vinculado ainda'}
`.trim();

  return {
    projectId: matchedIdea.id,
    projectTitle: matchedIdea.title,
    projectDescription: matchedIdea.description,
    currentStage: matchedIdea.stage,
    currentVersion: matchedIdea.currentVersion || 'V1',
    objective: matchedIdea.objective,
    lastEvolution,
    currentProblems: currentProblems.slice(0, 3),
    decisions: decisions.slice(0, 3),
    nextSteps: nextSteps.slice(0, 3),
    relatedStudies,
    recentLogs,
    summaryForAI,
  };
}

/**
 * Registra o histórico operacional do assistente no Firestore.
 */
export async function saveExecutionRecord(
  record: OperationalExecutionRecord
): Promise<void> {
  try {
    const docRef = doc(db, EXECUTIONS_COLLECTION, record.id);
    const clean = cleanFirestoreData({
      ...record,
      createdAt: record.createdAt || new Date().toISOString(),
    });
    await setDoc(docRef, clean, { merge: true });

    // Cache local de segurança
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}executions`);
      const list: OperationalExecutionRecord[] = cached ? JSON.parse(cached) : [];
      list.unshift(clean as OperationalExecutionRecord);
      localStorage.setItem(
        `${LOCAL_STORAGE_PREFIX}executions`,
        JSON.stringify(list.slice(0, 50))
      );
    } catch {}
  } catch (err) {
    console.error('[MemoryManager saveExecutionRecord Error]:', err);
    // Salva ao menos no local storage
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}executions`);
      const list: OperationalExecutionRecord[] = cached ? JSON.parse(cached) : [];
      list.unshift(record);
      localStorage.setItem(
        `${LOCAL_STORAGE_PREFIX}executions`,
        JSON.stringify(list.slice(0, 50))
      );
    } catch {}
    throw err;
  }
}

/**
 * Recupera o histórico de execuções do assistente.
 */
export async function getExecutionRecords(
  projectId?: string
): Promise<OperationalExecutionRecord[]> {
  try {
    const colRef = collection(db, EXECUTIONS_COLLECTION);
    const snap = await getDocs(colRef);
    const items: OperationalExecutionRecord[] = [];
    snap.forEach((d) => {
      const data = d.data();
      items.push({
        ...data,
        id: d.id,
      } as OperationalExecutionRecord);
    });

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (projectId) {
      return items.filter((i) => i.projectId === projectId);
    }
    return items;
  } catch (err) {
    console.warn('[MemoryManager getExecutionRecords] Erro ao carregar do Firestore, lendo cache local:', err);
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}executions`);
      if (cached) {
        const list: OperationalExecutionRecord[] = JSON.parse(cached);
        if (projectId) return list.filter((i) => i.projectId === projectId);
        return list;
      }
    } catch {}
    return [];
  }
}

/**
 * Exclui um registro da memória operacional (Controle do Usuário).
 */
export async function deleteExecutionRecord(id: string): Promise<void> {
  try {
    const docRef = doc(db, EXECUTIONS_COLLECTION, id);
    await deleteDoc(docRef);
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}executions`);
      if (cached) {
        const list: OperationalExecutionRecord[] = JSON.parse(cached);
        const filtered = list.filter((i) => i.id !== id);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}executions`, JSON.stringify(filtered));
      }
    } catch {}
  } catch (err) {
    console.error('[MemoryManager deleteExecutionRecord Error]:', err);
    throw err;
  }
}

/**
 * 14. APRENDIZADO DO PROJETO
 * Registra o que aprendemos, o que funcionou e o que não funcionou.
 * Atualiza também a ideia e gera um log de diário de bordo.
 */
export async function registerProjectLearning(
  idea: IdeaItem,
  learning: Omit<ProjectLearningEntry, 'id' | 'createdAt'>
): Promise<void> {
  const entryId = `learn-${Date.now()}`;
  const now = new Date().toISOString();

  // 1. Gera log de aprendizado no diário de bordo
  await saveEvolutionLogToFirestore({
    id: `log-${Date.now()}`,
    ideaId: idea.id,
    text: `Aprendizado: ${learning.learned} | Funcionou: ${learning.workedWell} | Ajustar: ${learning.neededChanges}`,
    category: 'Aprendizado',
    impact: 'Atualização da memória de projeto após validação de execução',
    createdAt: now,
  });

  // 2. Atualiza os próximos passos da ideia no Firestore
  if (learning.nextStep) {
    const updatedIdea: IdeaItem = {
      ...idea,
      nextSteps: learning.nextStep,
      observations: idea.observations
        ? `${idea.observations}\n[Aprendizado ${now.split('T')[0]}]: ${learning.learned}`
        : `[Aprendizado ${now.split('T')[0]}]: ${learning.learned}`,
      updatedAt: now,
    };
    await saveIdeaToFirestore(updatedIdea);
  }
}
