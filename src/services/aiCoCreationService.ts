import {
  IdeaItem,
  IdeaVersion,
  EvolutionLog,
  EvolutionLogCategory,
  StudyItem,
  IAItem,
  RoadmapItem,
  IdeaCategory,
  IdeaStage,
  IdeaPriority,
} from '../types';
import {
  saveIdeaToFirestore,
  saveIdeaVersionToFirestore,
  saveEvolutionLogToFirestore,
  saveStudyToFirestore,
} from './strategicMemoryService';

export interface StructuredProjectProposal {
  title: string;
  description: string;
  category: IdeaCategory;
  stage: IdeaStage;
  priority: IdeaPriority;
  objective: string;
  problemSolved: string;
  targetAudience: string;
  relatedTechnologies: string[];
  relatedIANames: string[];
  observations: string;
  nextSteps: string;
  roadmap: Array<{
    stageTitle: string;
    goal: string;
    status: 'Em Andamento' | 'Pendente' | 'Concluído';
  }>;
  initialDiaryLog: {
    text: string;
    category: EvolutionLogCategory;
    impact: string;
  };
  suggestedStudies: Array<{
    theme: string;
    objective: string;
    level: 'Iniciante' | 'Intermediário' | 'Avançado';
    toolsUsed?: string[];
  }>;
  versionNote: string;
  modelUsed?: string;
}

/**
 * Envia o pedido em linguagem natural do usuário para a IA estruturar o projeto completo.
 */
export async function structureProjectWithAI(params: {
  userRequest: string;
  categoryHint?: string;
  catalog: IAItem[];
  existingProjects?: Array<{ title: string; category: string }>;
}): Promise<StructuredProjectProposal> {
  const { userRequest, categoryHint, catalog, existingProjects } = params;

  try {
    const res = await fetch('/api/groq/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'structure_project_with_ai',
        payload: {
          userRequest,
          categoryHint,
          catalog: catalog.map((c) => ({
            name: c.name,
            category: c.category,
            specialty: c.specialty,
            level: c.level,
            link: c.link,
          })),
          existingProjects,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.title) {
        return {
          title: data.title,
          description: data.description || data.objective || '',
          category: data.category || 'Projeto',
          stage: data.stage || '1. Ideia',
          priority: data.priority || 'Média',
          objective: data.objective || '',
          problemSolved: data.problemSolved || '',
          targetAudience: data.targetAudience || '',
          relatedTechnologies: Array.isArray(data.relatedTechnologies) ? data.relatedTechnologies : [],
          relatedIANames: Array.isArray(data.relatedIANames) ? data.relatedIANames : [],
          observations: data.observations || '',
          nextSteps: data.nextSteps || '',
          roadmap: Array.isArray(data.roadmap)
            ? data.roadmap.map((r: any) => ({
                stageTitle: r.stageTitle || 'Atual',
                goal: r.goal || '',
                status: (r.status === 'Concluído' ? 'Concluído' : r.status === 'Em Andamento' ? 'Em Andamento' : 'Pendente') as 'Em Andamento' | 'Pendente' | 'Concluído',
              }))
            : [],
          initialDiaryLog: data.initialDiaryLog ? {
            text: data.initialDiaryLog.text || `Início do projeto "${data.title}".`,
            category: (data.initialDiaryLog.category as EvolutionLogCategory) || 'Decisão',
            impact: data.initialDiaryLog.impact || 'Definição da arquitetura inicial.',
          } : {
            text: `Início do projeto "${data.title}". Hipóteses e objetivos delimitados.`,
            category: 'Decisão',
            impact: 'Definição da arquitetura e direcionamento inicial.',
          },
          suggestedStudies: Array.isArray(data.suggestedStudies) ? data.suggestedStudies : [],
          versionNote: data.versionNote || 'V1 concebida com o Arquiteto de IA do Hub',
          modelUsed: data.modelUsed || 'Groq Cloud',
        };
      }
    }
  } catch (error) {
    console.warn('[AI Co-Creation Service] Erro ao chamar Groq, usando fallback estruturado:', error);
  }

  // Fallback heurístico estruturado caso a API esteja temporariamente instável
  return generateHeuristicStructuredProject(userRequest, categoryHint, catalog);
}

/**
 * Atrela e salva todo o projeto estruturado diretamente nas coleções do Firestore:
 * 1. IdeaItem -> collection('ideas')
 * 2. IdeaVersion (V1) -> collection('idea_versions')
 * 3. EvolutionLog (abertura) -> collection('evolution_logs')
 * 4. Studies (opcional) -> collection('studies') vinculados ao ID do projeto
 */
export async function commitStructuredProjectToFirestore(params: {
  proposal: StructuredProjectProposal;
  autoCreateStudies?: boolean;
}): Promise<{
  idea: IdeaItem;
  version: IdeaVersion;
  log: EvolutionLog;
  createdStudies: StudyItem[];
}> {
  const { proposal, autoCreateStudies = true } = params;
  const now = new Date().toISOString();
  const ideaId = `idea-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 1. Criar e salvar a Ideia
  const newIdea: IdeaItem = {
    id: ideaId,
    title: proposal.title,
    description: proposal.description,
    category: proposal.category,
    stage: proposal.stage,
    priority: proposal.priority,
    status: 'Ativa',
    objective: proposal.objective,
    problemSolved: proposal.problemSolved,
    targetAudience: proposal.targetAudience,
    relatedTechnologies: proposal.relatedTechnologies,
    relatedIANames: proposal.relatedIANames,
    observations: proposal.observations,
    nextSteps: proposal.nextSteps,
    currentVersion: 'V1',
    roadmap: proposal.roadmap.map((r, idx) => ({
      id: `rm-${Date.now()}-${idx + 1}`,
      stageTitle: r.stageTitle,
      goal: r.goal,
      status: r.status,
    })),
    createdAt: now,
    updatedAt: now,
  };

  await saveIdeaToFirestore(newIdea);

  // 2. Criar e salvar a Versão V1 no histórico
  const v1: IdeaVersion = {
    id: `ver-${ideaId}-v1`,
    ideaId: ideaId,
    version: 'V1',
    changedSummary: `Criação e estruturação inicial do projeto: ${proposal.title}`,
    changeReason: 'Concepção do escopo, requisitos funcionais e arquitetura de produto.',
    decisionTaken: `Adoção da stack [${proposal.relatedTechnologies.join(', ')}] e integração com IAs do Hub [${proposal.relatedIANames.join(', ')}].`,
    nextStep: proposal.nextSteps || 'Iniciar validação da hipótese técnica.',
    observations: proposal.versionNote,
    createdAt: now,
  };

  await saveIdeaVersionToFirestore(v1);

  // 3. Criar e salvar a primeira anotação reflexiva no Diário de Bordo
  const initialLog: EvolutionLog = {
    id: `log-${ideaId}-1`,
    ideaId: ideaId,
    text: proposal.initialDiaryLog.text,
    category: proposal.initialDiaryLog.category,
    impact: proposal.initialDiaryLog.impact,
    createdAt: now,
  };

  await saveEvolutionLogToFirestore(initialLog);

  // 4. Criar e salvar estudos recomendados no Banco de Estudos (já atrelados ao projeto!)
  const createdStudies: StudyItem[] = [];
  if (autoCreateStudies && proposal.suggestedStudies && proposal.suggestedStudies.length > 0) {
    for (let i = 0; i < proposal.suggestedStudies.length; i++) {
      const studySug = proposal.suggestedStudies[i];
      const studyItem: StudyItem = {
        id: `study-${Date.now()}-${i + 1}`,
        theme: studySug.theme,
        objective: studySug.objective,
        level: studySug.level || 'Intermediário',
        acquiredKnowledge: '',
        doubts: 'Identificar as melhores práticas e bibliotecas ideais para aplicar no projeto.',
        sources: ['Documentação oficial', 'Casos de uso práticos'],
        toolsUsed: studySug.toolsUsed || proposal.relatedIANames.slice(0, 2),
        exercises: `Prototipar módulo de teste para o projeto ${proposal.title}`,
        conclusions: '',
        nextSubjects: '',
        progress: 10,
        relatedProjectIds: [ideaId],
        createdAt: now,
        updatedAt: now,
      };

      try {
        await saveStudyToFirestore(studyItem);
        createdStudies.push(studyItem);
      } catch (err) {
        console.warn('[Firestore] Erro ao salvar estudo sugerido:', err);
      }
    }
  }

  return {
    idea: newIdea,
    version: v1,
    log: initialLog,
    createdStudies,
  };
}

/**
 * Fallback heurístico caso a Groq esteja temporariamente indisponível.
 */
function generateHeuristicStructuredProject(
  userRequest: string,
  categoryHint?: string,
  catalog: IAItem[] = []
): StructuredProjectProposal {
  const reqLower = userRequest.toLowerCase();

  // Detectar categoria aproximada
  let category: IdeaCategory = (categoryHint as IdeaCategory) || 'Projeto';
  if (reqLower.includes('sst') || reqLower.includes('segurança') || reqLower.includes('laudo') || reqLower.includes('nr')) {
    category = 'SST';
  } else if (reqLower.includes('automação') || reqLower.includes('automatizar') || reqLower.includes('bot') || reqLower.includes('fluxo')) {
    category = 'Automação';
  } else if (reqLower.includes('saas') || reqLower.includes('plataforma') || reqLower.includes('sistema')) {
    category = 'Software';
  } else if (reqLower.includes('estudo') || reqLower.includes('aprender') || reqLower.includes('curso')) {
    category = 'Estudo';
  }

  // Identificar ferramentas do catálogo úteis
  const relatedIANames = catalog
    .slice(0, 3)
    .map((c) => c.name);

  const cleanTitle = userRequest.length > 50 ? userRequest.substring(0, 47) + '...' : userRequest;

  return {
    title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
    description: `Projeto concebido para: ${userRequest}. Focado em alta eficiência e execução estruturada.`,
    category,
    stage: '1. Ideia',
    priority: 'Alta',
    objective: `Desenvolver e validar uma solução robusta para: ${userRequest}`,
    problemSolved: 'Elimina processos manuais, desperdício de tempo e falta de rastreabilidade de dados.',
    targetAudience: 'Profissionais e equipes que necessitam de mais agilidade e conformidade operacional.',
    relatedTechnologies: ['React', 'TypeScript', 'Node.js', 'Firebase Firestore'],
    relatedIANames: relatedIANames.length > 0 ? relatedIANames : ['Claude 3.7 Sonnet', 'Groq'],
    observations: 'Projeto estruturado com foco em entrega incremental, começando pelo MVP.',
    nextSteps: 'Definir o fluxo de usuário principal e iniciar o protótipo inicial da interface.',
    roadmap: [
      { stageTitle: 'Atual', goal: 'Mapeamento de requisitos e estrutura do MVP', status: 'Em Andamento' },
      { stageTitle: 'Próxima Evolução', goal: 'Construção da lógica de automação e integração de dados', status: 'Pendente' },
      { stageTitle: 'Depois', goal: 'Testes práticos com dados reais e refinamento da usabilidade', status: 'Pendente' },
      { stageTitle: 'Futuro', goal: 'Módulos avançados com agentes de IA e relatórios executivos', status: 'Pendente' },
    ],
    initialDiaryLog: {
      text: `Início do projeto "${cleanTitle}". Decidido avançar com escopo focado em entrega rápida de valor.`,
      category: 'Decisão',
      impact: 'Definição do direcionamento técnico inicial e metas dos 4 horizontes.',
    },
    suggestedStudies: [
      {
        theme: `Arquitetura e Fluxo de Dados para ${category}`,
        objective: 'Compreender os melhores padrões de arquitetura para implementar a solução de forma escalável.',
        level: 'Intermediário',
      },
    ],
    versionNote: 'V1 estruturada através do Arquiteto Estratégico de IA',
    modelUsed: 'Heurística Estratégica do Hub',
  };
}
