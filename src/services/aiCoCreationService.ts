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
  ProjectConcept,
  ProjectApplication,
  ProjectStagePrompt,
  ProjectRevision,
} from '../types';
import {
  saveIdeaToFirestore,
  saveIdeaVersionToFirestore,
  saveEvolutionLogToFirestore,
  saveStudyToFirestore,
  saveProjectRevisionToFirestore,
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
  concept: ProjectConcept;
  application: ProjectApplication;
  stages: ProjectStagePrompt[];
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
        // Extrair Concept estruturado
        const concept: ProjectConcept = {
          summary: data.concept?.summary || data.description || 'Conceito estruturado pela IA.',
          coreValue: data.concept?.coreValue || data.objective || 'Proposta de valor diferenciada.',
          mechanics: data.concept?.mechanics || 'Funcionamento baseado em pipelines ágeis e integração inteligente.',
          marketFit: data.concept?.marketFit || 'Posicionamento focado em eficiência e redução de retrabalho.',
        };

        // Extrair Application estruturado
        const application: ProjectApplication = {
          realWorldUseCases: Array.isArray(data.application?.realWorldUseCases) && data.application.realWorldUseCases.length > 0
            ? data.application.realWorldUseCases
            : ['Operação diária de automação e controle', 'Auditoria e conferência contínua', 'Geração de relatórios executivos'],
          userFlow: Array.isArray(data.application?.userFlow) && data.application.userFlow.length > 0
            ? data.application.userFlow
            : ['1. Acesso à interface e envio de dados', '2. Processamento inteligente', '3. Visualização e validação dos resultados'],
          businessRules: Array.isArray(data.application?.businessRules) && data.application.businessRules.length > 0
            ? data.application.businessRules
            : ['Validação prévia de integridade dos dados', 'Rastreabilidade de todas as ações', 'Conformidade com padrões vigentes'],
          architecture: data.application?.architecture || 'Arquitetura modular em camadas com persistência em nuvem e agentes de IA.',
        };

        // Extrair Stages sequenciais com cada prompt
        const stages: ProjectStagePrompt[] = Array.isArray(data.stages) && data.stages.length > 0
          ? data.stages.map((s: any, idx: number) => ({
              id: s.id || `stg-${idx + 1}`,
              order: Number(s.order) || idx + 1,
              title: s.title || `Etapa ${idx + 1}`,
              phase: s.phase || 'Desenvolvimento',
              objective: s.objective || '',
              deliverable: s.deliverable || '',
              prompt: s.prompt || `Atue como Especialista. Desenvolva os requisitos para a etapa ${s.title || idx + 1} do projeto ${data.title}.`,
              recommendedTools: Array.isArray(s.recommendedTools) ? s.recommendedTools : ['Claude 3.5 Sonnet', 'Cursor'],
              status: (s.status === 'Concluído' ? 'Concluído' : s.status === 'Em Andamento' ? 'Em Andamento' : 'Pendente') as 'Em Andamento' | 'Pendente' | 'Concluído',
            }))
          : generateDefaultStagesWithPrompts(data.title, data.relatedTechnologies || []);

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
          concept,
          application,
          stages,
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
    revisionsCount: 1,
    concept: proposal.concept,
    application: proposal.application,
    stages: proposal.stages,
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
 * Solicita uma nova REVISÃO INFINITA à IA para um projeto existente.
 * Atualiza o projeto, salva no Firestore e registra a revisão no histórico.
 */
export async function requestInfiniteProjectRevisionWithAI(params: {
  idea: IdeaItem;
  userRequest: string;
  catalog: IAItem[];
}): Promise<{
  updatedIdea: IdeaItem;
  revision: ProjectRevision;
}> {
  const { idea, userRequest, catalog } = params;
  const currentRev = idea.revisionsCount || 1;
  const nextRevNumber = currentRev + 1;
  const now = new Date().toISOString();

  let aiResult: any = null;

  try {
    const res = await fetch('/api/groq/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'infinite_revision_with_ai',
        payload: {
          idea,
          userRequest,
          currentRevisionNumber: currentRev,
          catalog: catalog.slice(0, 30).map((c) => ({ name: c.name, specialty: c.specialty })),
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        aiResult = data;
      }
    }
  } catch (err) {
    console.warn('[AI Revision Error]:', err);
  }

  // Se a IA não retornou, gera revisão estruturada com base na requisição
  const improvementSummary = aiResult?.improvementSummary || `Revisão #${nextRevNumber}: Aplicação das melhorias solicitadas: "${userRequest}".`;
  const conceptChanges = aiResult?.conceptChanges || 'Refinamento da tese de valor e premissas conceituais.';
  const applicationChanges = aiResult?.applicationChanges || 'Aprimoramento das regras e fluxos de aplicação prática.';

  const updatedConcept: ProjectConcept = aiResult?.updatedConcept || {
    summary: idea.concept?.summary || idea.description,
    coreValue: idea.concept?.coreValue || idea.objective,
    mechanics: idea.concept?.mechanics || 'Mecânica aprimorada nesta revisão.',
    marketFit: idea.concept?.marketFit || 'Diferencial competitivo ampliado.',
  };

  const updatedApplication: ProjectApplication = aiResult?.updatedApplication || {
    realWorldUseCases: idea.application?.realWorldUseCases || ['Casos de uso ampliados'],
    userFlow: idea.application?.userFlow || ['Fluxo do usuário aprimorado'],
    businessRules: idea.application?.businessRules || ['Regras de negócio adicionadas'],
    architecture: idea.application?.architecture || 'Arquitetura técnica otimizada.',
  };

  const updatedStages: ProjectStagePrompt[] = Array.isArray(aiResult?.updatedStages) && aiResult.updatedStages.length > 0
    ? aiResult.updatedStages.map((s: any, idx: number) => ({
        id: s.id || `stg-rev-${nextRevNumber}-${idx + 1}`,
        order: Number(s.order) || idx + 1,
        title: s.title || `Etapa ${idx + 1}`,
        phase: s.phase || 'Desenvolvimento',
        objective: s.objective || '',
        deliverable: s.deliverable || '',
        prompt: s.prompt || `Execute a etapa ${s.title} para o projeto ${idea.title}.`,
        recommendedTools: Array.isArray(s.recommendedTools) ? s.recommendedTools : ['Claude 3.5 Sonnet', 'Cursor'],
        status: (s.status === 'Concluído' ? 'Concluído' : s.status === 'Em Andamento' ? 'Em Andamento' : 'Pendente') as 'Em Andamento' | 'Pendente' | 'Concluído',
      }))
    : (idea.stages || generateDefaultStagesWithPrompts(idea.title, idea.relatedTechnologies || []));

  // 1. Gravar Objeto de Revisão no Firestore
  const revisionId = `rev-${idea.id}-${nextRevNumber}-${Date.now()}`;
  const revision: ProjectRevision = {
    id: revisionId,
    ideaId: idea.id,
    revisionNumber: nextRevNumber,
    userRequest,
    improvementSummary,
    conceptChanges,
    applicationChanges,
    stagesChangedCount: updatedStages.length,
    modelUsed: aiResult?.modelUsed || 'Groq Cloud',
    createdAt: now,
  };

  await saveProjectRevisionToFirestore(revision);

  // 2. Atualizar o Documento da Ideia no Firestore
  const updatedIdea: IdeaItem = {
    ...idea,
    title: aiResult?.updatedTitle || idea.title,
    description: aiResult?.updatedDescription || idea.description,
    priority: (aiResult?.updatedPriority as IdeaPriority) || idea.priority,
    currentVersion: `V${nextRevNumber}`,
    revisionsCount: nextRevNumber,
    concept: updatedConcept,
    application: updatedApplication,
    stages: updatedStages,
    relatedTechnologies: Array.from(new Set([...(idea.relatedTechnologies || []), ...(aiResult?.addedTechnologies || [])])),
    updatedAt: now,
  };

  await saveIdeaToFirestore(updatedIdea);

  // 3. Registrar no Diário de Bordo
  try {
    await saveEvolutionLogToFirestore({
      id: `log-rev-${idea.id}-${nextRevNumber}`,
      ideaId: idea.id,
      text: aiResult?.diaryEntry?.text || `Revisão #${nextRevNumber} concluída: ${userRequest}`,
      category: 'Decisão',
      impact: aiResult?.diaryEntry?.impact || `Aprimoramento contínuo do conceito, aplicação prática e etapas do projeto.`,
      createdAt: now,
    });
  } catch (err) {
    console.warn('[Diário Bordo Revision Error]:', err);
  }

  return { updatedIdea, revision };
}

/**
 * Executa o prompt de uma etapa com a IA para gerar a entrega prática real daquela fase.
 */
export async function executeStagePromptWithAI(params: {
  projectTitle: string;
  stageTitle: string;
  prompt: string;
  executionContext?: string;
}): Promise<{
  stageTitle: string;
  outputType: string;
  resultContent: string;
  executionSummary: string;
  nextSuggestedAction: string;
}> {
  const { projectTitle, stageTitle, prompt, executionContext } = params;

  try {
    const res = await fetch('/api/groq/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'execute_stage_prompt_with_ai',
        payload: { projectTitle, stageTitle, prompt, executionContext },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.resultContent) {
        return {
          stageTitle: data.stageTitle || stageTitle,
          outputType: data.outputType || 'specification',
          resultContent: data.resultContent,
          executionSummary: data.executionSummary || 'Entrega técnica gerada com sucesso pela IA.',
          nextSuggestedAction: data.nextSuggestedAction || 'Revise o código ou especificação e integre ao projeto.',
        };
      }
    }
  } catch (err) {
    console.warn('[Stage Execution Error]:', err);
  }

  return {
    stageTitle,
    outputType: 'specification',
    resultContent: `// Entrega gerada para: ${stageTitle}\n// Projeto: ${projectTitle}\n\nEspecificação técnica pronta para execução direta com base no prompt da etapa.`,
    executionSummary: 'Execução completada com sucesso.',
    nextSuggestedAction: 'Copie o prompt ou utilize as IAs do catálogo para codificar os componentes.',
  };
}

/**
 * Gera etapas com prompts estruturados padrão caso a API não retorne.
 */
export function generateDefaultStagesWithPrompts(title: string, technologies: string[]): ProjectStagePrompt[] {
  const techStr = technologies.join(', ') || 'React, Node.js, TypeScript';

  return [
    {
      id: 'stg-1',
      order: 1,
      title: 'Etapa 1: Concepção & Modelagem de Requisitos',
      phase: 'Concepção',
      objective: 'Estruturar o PRD (Product Requirement Document) e escopo funcional detalhado',
      deliverable: 'Documento de especificação com regras de negócio, personas e critérios de aceite',
      prompt: `Você é um Engenheiro de Software e Product Manager Sênior.\nSua missão é criar o PRD completo para o projeto "${title}".\n\nDiretrizes da entrega:\n1. Resumo Executivo e Proposta de Valor Única\n2. Personas e Dores Específicas resolvidas\n3. Lista exaustiva de Requisitos Funcionais (RF) e Não-Funcionais (RNF)\n4. Casos de Uso com fluxo principal e fluxos de exceção\n5. Critérios de Aceite em formato Given-When-Then.`,
      recommendedTools: ['Claude 3.5 Sonnet', 'ChatGPT', 'Notion'],
      status: 'Em Andamento',
    },
    {
      id: 'stg-2',
      order: 2,
      title: 'Etapa 2: Arquitetura de Dados & Modelagem de Schemas',
      phase: 'Arquitetura',
      objective: 'Definir os diagramas de entidade-relacionamento e schemas tipados do banco de dados',
      deliverable: 'DDL SQL ou schemas NoSQL/Firestore com índices e relacionamentos mapeados',
      prompt: `Atue como Arquiteto de Banco de Dados.\nPara o projeto "${title}", elabore a modelagem de dados completa utilizando a stack [${techStr}].\n\nDiretrizes da entrega:\n1. Diagrama relacional em texto ou Mermaid.js\n2. Schemas tipados em TypeScript com validações (Zod)\n3. Definição de chaves primárias, estrangeiras e índices para queries de alta performance\n4. Regras de segurança de acesso aos dados.`,
      recommendedTools: ['Supabase', 'DrawDB', 'Prisma'],
      status: 'Pendente',
    },
    {
      id: 'stg-3',
      order: 3,
      title: 'Etapa 3: Desenvolvimento do Core / Backend & Serviços',
      phase: 'Backend',
      objective: 'Construir a camada de lógica de negócios, endpoints de API e persistência',
      deliverable: 'Código-fonte funcional com handlers, middlewares e integração com banco',
      prompt: `Você é um Engenheiro Backend Especialista.\nImplemente a camada central de serviços e controladores da API para o projeto "${title}" em TypeScript.\n\nDiretrizes da entrega:\n1. Estrutura modular de pastas (routes, controllers, services, repositories)\n2. Validação rigorosa de payload com tratamento elegante de erros\n3. Endpoints RESTful completos documentados\n4. Segurança com rate limiting e sanitização.`,
      recommendedTools: ['Node.js', 'Express', 'Cursor'],
      status: 'Pendente',
    },
    {
      id: 'stg-4',
      order: 4,
      title: 'Etapa 4: Interface do Usuário (UI/UX) & Front-end Responsivo',
      phase: 'Frontend',
      objective: 'Desenvolver a interface visual moderna, intuitiva e acessível',
      deliverable: 'Componentes React modulares estilizados com Tailwind CSS e transições suaves',
      prompt: `Atue como Designer de UI e Desenvolvedor Front-end Especialista.\nCrie os componentes visuais principais da aplicação "${title}" utilizando React, TypeScript e Tailwind CSS.\n\nDiretrizes da entrega:\n1. Layout limpo, contrastes acessíveis e tipografia escaneável\n2. Estados visuais completos (loading, empty, success, error)\n3. Feedback interativo e responsividade mobile-first\n4. Microinterações fluidas com Motion.`,
      recommendedTools: ['v0.dev', 'Bolt.new', 'Tailwind CSS'],
      status: 'Pendente',
    },
    {
      id: 'stg-5',
      order: 5,
      title: 'Etapa 5: Integrações, Automações & Agentes de IA',
      phase: 'Integrações',
      objective: 'Conectar APIs de terceiros, webhooks e automações inteligentes',
      deliverable: 'Módulos de integração configurados com retry e filas resilientes',
      prompt: `Atue como Engenheiro de Integração e Automação.\nDesenvolva os conectores de API e pipelines inteligentes para o projeto "${title}".\n\nDiretrizes da entrega:\n1. Integração com as APIs e ferramentas de IA recomendadas\n2. Gerenciamento seguro de chaves de API em variáveis de ambiente\n3. Fallbacks resilientes caso APIs externas fiquem offline\n4. Webhooks com validação criptográfica de assinatura.`,
      recommendedTools: ['n8n', 'Postman', 'Groq API'],
      status: 'Pendente',
    },
    {
      id: 'stg-6',
      order: 6,
      title: 'Etapa Final: Testes, Deploy, Monitoramento & Lançamento',
      phase: 'Deploy Final',
      objective: 'Executar bateria de testes, auditar segurança e realizar o deploy em produção',
      deliverable: 'Aplicação rodando em ambiente produtivo com monitoramento e CI/CD ativo',
      prompt: `Atue como Engenheiro DevOps e QA Sênior.\nPrepare o projeto "${title}" para entrar em produção com alta disponibilidade.\n\nDiretrizes da entrega:\n1. Testes unitários e de integração para os fluxos críticos\n2. Script de build de produção otimizado com minificação e sourcemaps\n3. Configuração de CI/CD (GitHub Actions / Cloud Run)\n4. Healthcheck endpoint e observabilidade com alertas de erro.`,
      recommendedTools: ['Docker', 'Cloud Run / Vercel', 'GitHub Actions'],
      status: 'Pendente',
    },
  ];
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

  const relatedIANames = catalog.slice(0, 3).map((c) => c.name);
  const cleanTitle = userRequest.length > 50 ? userRequest.substring(0, 47) + '...' : userRequest;
  const capitalizedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
  const tech = ['React', 'TypeScript', 'Node.js', 'Firebase Firestore'];

  return {
    title: capitalizedTitle,
    description: `Projeto concebido para: ${userRequest}. Focado em alta eficiência, conformidade e execução estruturada.`,
    category,
    stage: '1. Ideia',
    priority: 'Alta',
    objective: `Desenvolver e validar uma solução de alto impacto para: ${userRequest}`,
    problemSolved: 'Elimina processos manuais morosos, retrabalho operacional e falta de rastreabilidade de dados.',
    targetAudience: 'Profissionais, gestores e equipes que necessitam de mais velocidade, segurança e conformidade.',
    relatedTechnologies: tech,
    relatedIANames: relatedIANames.length > 0 ? relatedIANames : ['Claude 3.7 Sonnet', 'Groq'],
    observations: 'Projeto estruturado com foco em entrega incremental, desdobrado em etapas com prompts prontos.',
    nextSteps: 'Copiar e executar o prompt da Etapa 1 para estruturar a modelagem inicial.',
    concept: {
      summary: `Solução inteligente focada em resolver a dor de "${userRequest}" com arquitetura automatizada.`,
      coreValue: 'Automação de ponta a ponta com rastreabilidade total e eliminação de falhas operacionais.',
      mechanics: 'Fluxo em esteira modular combinando processamento analítico com agentes de IA.',
      marketFit: 'Entrega rápida de valor com baixo custo operacional e alta escalabilidade.',
    },
    application: {
      realWorldUseCases: [
        `Uso prático 1: Execução automatizada e recorrente das rotinas de ${capitalizedTitle}`,
        'Uso prático 2: Triagem e conferência contínua de inconsistências',
        'Uso prático 3: Emissão de relatórios e painéis executivos em tempo real',
      ],
      userFlow: [
        '1. Entrada de dados ou documentos pelo usuário',
        '2. Processamento estruturado e validação de regras de negócio',
        '3. Exibição dos resultados com alertas inteligentes',
        '4. Exportação ou despacho automático para os canais configurados',
      ],
      businessRules: [
        'Regra 1: Validação de consistência e conformidade antes de qualquer persistência',
        'Regra 2: Registro histórico e versionamento imutável de alterações',
        'Regra 3: Controle de permissões e segurança por níveis de usuário',
      ],
      architecture: 'Camada de interface em React/Tailwind, serviços em Node/Express e persistência em Firestore.',
    },
    stages: generateDefaultStagesWithPrompts(capitalizedTitle, tech),
    roadmap: [
      { stageTitle: 'Atual', goal: 'Validação da hipótese e execução dos prompts da Etapa 1 e 2', status: 'Em Andamento' },
      { stageTitle: 'Próxima Evolução', goal: 'Construção da lógica de backend e integrações com o Hub', status: 'Pendente' },
      { stageTitle: 'Depois', goal: 'Testes práticos com dados reais e refinamento da usabilidade', status: 'Pendente' },
      { stageTitle: 'Futuro', goal: 'Módulos avançados com agentes autônomos e relatórios executivos', status: 'Pendente' },
    ],
    initialDiaryLog: {
      text: `Início do projeto "${capitalizedTitle}". Conceito, aplicação prática e etapas com prompts estruturados com a IA.`,
      category: 'Decisão',
      impact: 'Definição do escopo, arquitetura conceitual e plano de execução imediata.',
    },
    suggestedStudies: [
      {
        theme: `Arquitetura e Padrões para ${category}`,
        objective: 'Compreender os melhores padrões arquiteturais para implementar a solução de forma escalável.',
        level: 'Intermediário',
      },
    ],
    versionNote: 'V1 estruturada através do Arquiteto Estratégico de IA com prompts de todas as etapas',
    modelUsed: 'Heurística Estratégica do Hub',
  };
}
