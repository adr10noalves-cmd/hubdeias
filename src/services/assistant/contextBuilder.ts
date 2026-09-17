import {
  IdeaItem,
  StudyItem,
  EvolutionLog,
  IdeaVersion,
  StructuredAssistantContext,
} from '../../types';
import {
  getIdeaVersionsFromFirestore,
  getEvolutionLogsFromFirestore,
} from '../strategicMemoryService';

export interface ContextFilterOptions {
  userQuery: string;
  targetProjectId?: string;
  allIdeas: IdeaItem[];
  allStudies: StudyItem[];
  maxRecentLogs?: number;
  maxVersions?: number;
}

export interface FilteredTaskContext {
  targetProject?: IdeaItem;
  objective: string;
  currentArchitecture?: string;
  latestVersion?: string;
  recentChangesSummary: string[];
  knownProblems: string[];
  pastDecisions: string[];
  nextSteps: string[];
  relevantStudies: Array<{ theme: string; level: string; progress: number; acquiredKnowledge?: string }>;
  contextSummaryText: string;
  tokensEstimated: number;
}

/**
 * 5. CONTEXT BUILDER CIRÚRGICO
 * Filtra da memória persistente única apenas os nós estritamente pertinentes à tarefa.
 * Não envia a memória inteira indiscriminadamente.
 */
export async function buildFilteredTaskContext(
  options: ContextFilterOptions
): Promise<FilteredTaskContext> {
  const {
    userQuery,
    targetProjectId,
    allIdeas,
    allStudies,
    maxRecentLogs = 3,
    maxVersions = 2,
  } = options;

  const queryLower = userQuery.toLowerCase().trim();

  // 1. Identifica projeto alvo: por ID explícito ou por menção semântica
  let targetProject = allIdeas.find((i) => i.id === targetProjectId);
  if (!targetProject) {
    targetProject = allIdeas.find((idea) => {
      const titleLower = idea.title.toLowerCase();
      return (
        queryLower.includes(titleLower) ||
        titleLower.split(' ').some((word) => word.length > 3 && queryLower.includes(word))
      );
    });
  }

  // Se não há projeto alvo, retorna contexto geral focado do Hub
  if (!targetProject) {
    const relevantStudies = allStudies
      .filter((s) => queryLower.includes(s.theme.toLowerCase()) || s.theme.split(' ').some((w) => w.length > 4 && queryLower.includes(w)))
      .slice(0, 3)
      .map((s) => ({
        theme: s.theme,
        level: s.level,
        progress: s.progress,
        acquiredKnowledge: s.acquiredKnowledge,
      }));

    const contextSummaryText = relevantStudies.length > 0
      ? `Estudos relevantes disponíveis: ${relevantStudies.map((s) => `"${s.theme}" (${s.level})`).join(', ')}.`
      : `Contexto operacional geral do Hub. Nenhum projeto específico selecionado.`;

    return {
      objective: 'Operação geral no Hub de IAs',
      recentChangesSummary: [],
      knownProblems: [],
      pastDecisions: [],
      nextSteps: [],
      relevantStudies,
      contextSummaryText,
      tokensEstimated: Math.round(contextSummaryText.length / 4),
    };
  }

  // 2. Extrai campos do projeto com filtragem seletiva
  const objective = targetProject.objective || targetProject.description || 'Objetivo não especificado';
  const currentArchitecture = targetProject.application?.architecture || 'Arquitetura base do sistema';

  const knownProblems: string[] = [];
  if (targetProject.problemSolved) knownProblems.push(targetProject.problemSolved);
  if (targetProject.observations && targetProject.observations.toLowerCase().includes('gargalo')) {
    knownProblems.push(targetProject.observations);
  }

  const nextSteps: string[] = [];
  if (targetProject.nextSteps) nextSteps.push(targetProject.nextSteps);

  // 3. Recupera histórico relevante de versões (limite estrito)
  let latestVersion = targetProject.currentVersion || 'V1';
  const recentChangesSummary: string[] = [];
  const pastDecisions: string[] = [];

  try {
    const versions: IdeaVersion[] = await getIdeaVersionsFromFirestore(targetProject.id);
    if (versions.length > 0) {
      latestVersion = versions[0].version;
      versions.slice(0, maxVersions).forEach((v) => {
        if (v.changedSummary) recentChangesSummary.push(`${v.version}: ${v.changedSummary}`);
        if (v.decisionTaken) pastDecisions.push(`${v.version}: ${v.decisionTaken}`);
      });
    }
  } catch (err) {
    console.warn('[ContextBuilder] Falha ao recuperar versões:', err);
  }

  // 4. Recupera diário de bordo (apenas decisões e aprendizados recentes)
  try {
    const logs: EvolutionLog[] = await getEvolutionLogsFromFirestore(targetProject.id);
    logs
      .filter((l) => l.category === 'Decisão' || l.category === 'Aprendizado' || l.category === 'Marco')
      .slice(0, maxRecentLogs)
      .forEach((l) => {
        if (l.category === 'Decisão') pastDecisions.push(l.text);
        else recentChangesSummary.push(l.text);
      });
  } catch (err) {
    console.warn('[ContextBuilder] Falha ao recuperar logs:', err);
  }

  // 5. Estudos estritamente relacionados
  const relevantStudies = allStudies
    .filter((s) => s.relatedProjectIds?.includes(targetProject!.id))
    .slice(0, 3)
    .map((s) => ({
      theme: s.theme,
      level: s.level,
      progress: s.progress,
      acquiredKnowledge: s.acquiredKnowledge,
    }));

  // 6. Montagem cirúrgica do resumo contextual sem ruído desnecessário
  const parts: string[] = [
    `PROJETO: ${targetProject.title} (${latestVersion}, Estágio: ${targetProject.stage})`,
    `OBJETIVO: ${objective}`,
    currentArchitecture ? `ARQUITETURA: ${currentArchitecture}` : '',
    knownProblems.length > 0 ? `PROBLEMAS/GARGALOS CONHECIDOS: ${knownProblems.join('; ')}` : '',
    pastDecisions.length > 0 ? `DECISÕES ANTERIORES: ${pastDecisions.slice(0, 3).join(' | ')}` : '',
    recentChangesSummary.length > 0 ? `ÚLTIMAS ALTERAÇÕES: ${recentChangesSummary.slice(0, 2).join(' | ')}` : '',
    nextSteps.length > 0 ? `PRÓXIMAS ETAPAS REGISTRADAS: ${nextSteps.join('; ')}` : '',
    relevantStudies.length > 0 ? `ESTUDOS RELACIONADOS: ${relevantStudies.map((s) => `${s.theme} (${s.progress}%)`).join(', ')}` : '',
  ].filter(Boolean);

  const contextSummaryText = parts.join('\n');

  return {
    targetProject,
    objective,
    currentArchitecture,
    latestVersion,
    recentChangesSummary,
    knownProblems,
    pastDecisions,
    nextSteps,
    relevantStudies,
    contextSummaryText,
    tokensEstimated: Math.round(contextSummaryText.length / 4),
  };
}
