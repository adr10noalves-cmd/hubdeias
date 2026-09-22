import {
  ProjectHubItem,
  ProjectMessage,
  ProjectDecision,
  ProjectDecisionStatus,
  ProjectMission,
  ProjectSuggestion,
  ProjectDeliverable,
  ProjectVersion,
  ProjectTest,
  ProjectIssue,
  ProjectDeployment,
  ProjectRequirements,
  ProjectPedagogicalExplanation,
} from '../types';

const PROJECTS_STORAGE_KEY = 'hub_projects_v1';
const MESSAGES_STORAGE_KEY = 'hub_project_messages_v1';
const DECISIONS_STORAGE_KEY = 'hub_project_decisions_v1';
const MISSIONS_STORAGE_KEY = 'hub_project_missions_v1';
const SUGGESTIONS_STORAGE_KEY = 'hub_project_suggestions_v1';
const DELIVERABLES_STORAGE_KEY = 'hub_project_deliverables_v1';
const VERSIONS_STORAGE_KEY = 'hub_project_versions_v1';
const TESTS_STORAGE_KEY = 'hub_project_tests_v1';
const ISSUES_STORAGE_KEY = 'hub_project_issues_v1';
const DEPLOYMENTS_STORAGE_KEY = 'hub_project_deployments_v1';
const PEDAGOGIES_STORAGE_KEY = 'hub_project_pedagogies_v1';

export const INITIAL_PROJECTS: ProjectHubItem[] = [
  {
    id: 'proj-1',
    name: 'Assistente Inteligente de Compliance',
    description: 'Sistema autônomo de verificação de conformidade normativa para laudos de segurança do trabalho.',
    objective: 'Automatizar a análise de documentos técnicos comparando com as NRs vigentes.',
    expectedResult: 'Redução de 80% no tempo de auditoria de laudos PGR e PCMSO.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'Em desenvolvimento',
    currentStage: 'Desenvolvimento do Parser OCR e motor de regras',
    nextAction: 'Integrar validação da NR-01 na API backend',
    progress: 65,
    aiTools: ['Gemini 2.5 Pro', 'Groq GPT-OSS'],
    notes: 'Atenção especial à legibilidade de PDFs escaneados antigos.',
    history: [
      {
        id: 'hist-1',
        date: new Date(Date.now() - 86400000 * 5).toLocaleDateString(),
        description: 'Projeto criado a partir de ideia validada no Hub.',
        author: 'Usuário',
      },
      {
        id: 'hist-2',
        date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
        description: 'Arquitetura definida e aprovada. Iniciado desenvolvimento backend.',
        author: 'Hub IA',
      },
    ],
  },
  {
    id: 'proj-2',
    name: 'Dashboard Financeiro Preditivo',
    description: 'Plataforma de controle de fluxo de caixa e projeção de receitas com machine learning.',
    objective: 'Prever desequilíbrios financeiros com 30 dias de antecedência.',
    expectedResult: 'Alertas automatizados de fluxo de caixa e sugestões de corte de custos.',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'Planejamento',
    currentStage: 'Levantamento de requisitos de fontes de dados bancários',
    nextAction: 'Definir provedor de conexão Open Finance',
    progress: 25,
    aiTools: ['Gemini 2.5 Flash'],
    notes: 'Necessário garantir conformidade com LGPD para dados financeiros.',
    history: [
      {
        id: 'hist-3',
        date: new Date(Date.now() - 86400000 * 12).toLocaleDateString(),
        description: 'Ideia cadastrada e escopo inicial desenhado.',
        author: 'Usuário',
      },
    ],
  },
];

const INITIAL_MESSAGES: ProjectMessage[] = [
  {
    id: 'msg-1',
    projectId: 'proj-1',
    sender: 'ai',
    text: 'Olá! Sou o Assistente Especializado do projeto "Assistente Inteligente de Compliance". Como posso ajudar na evolução do seu projeto hoje?',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    aiModel: 'Gemini 2.5 Pro',
  },
];

const INITIAL_DECISIONS: ProjectDecision[] = [
  {
    id: 'dec-1',
    projectId: 'proj-1',
    decision: 'Utilizar Tesseract OCR combinado com Gemini Vision',
    reason: 'Garantir precisão superior na extração de texto de PDFs antigos escaneados.',
    date: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
    responsible: 'Equipe de Arquitetura',
    impact: 'Maior robustez na leitura de documentos de campo.',
    status: 'Ativa',
  },
];

const INITIAL_MISSIONS: ProjectMission[] = [
  {
    id: 'mission-1',
    projectId: 'proj-1',
    title: 'Configurar motor de regras da NR-01',
    description: 'Mapear obrigações da NR-01 para validação automatizada.',
    status: 'Em andamento',
    priority: 'Alta',
    createdAt: new Date(Date.now() - 86400000 * 4).toLocaleDateString(),
    dueDate: '2026-09-30',
    notes: 'Priorizar seções de PGR.',
  },
  {
    id: 'mission-2',
    projectId: 'proj-1',
    title: 'Desenvolver endpoint de upload seguro de PDF',
    description: 'Criar rota /api/upload validando formato e tamanho.',
    status: 'Concluída',
    priority: 'Urgente',
    createdAt: new Date(Date.now() - 86400000 * 5).toLocaleDateString(),
    dueDate: '2026-09-20',
    notes: 'Concluído com sucesso.',
  },
];

const INITIAL_SUGGESTIONS: ProjectSuggestion[] = [
  {
    id: 'sug-1',
    projectId: 'proj-1',
    title: 'Adicionar exportação em PDF do laudo auditado',
    description: 'Gerar relatório formatado com o parecer da IA para envio direto ao cliente.',
    category: 'Funcionalidade',
    status: 'Nova',
    createdAt: new Date().toLocaleDateString(),
  },
  {
    id: 'sug-2',
    projectId: 'proj-1',
    title: 'Implementar cache Redis para regras normativas',
    description: 'Acelerar consultas frequentes às NRs armazenadas em memória.',
    category: 'Desempenho',
    status: 'Nova',
    createdAt: new Date().toLocaleDateString(),
  },
];

export function getProjects(): ProjectHubItem[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler projetos do localStorage:', e);
  }
  saveProjects(INITIAL_PROJECTS);
  return INITIAL_PROJECTS;
}

export function saveProjects(projects: ProjectHubItem[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Erro ao salvar projetos no localStorage:', e);
  }
}

export function saveSingleProject(project: ProjectHubItem): void {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    projects.unshift(project);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  saveProjects(filtered);
}

// MESSAGES
export function getProjectMessages(projectId: string): ProjectMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    const all: ProjectMessage[] = raw ? JSON.parse(raw) : INITIAL_MESSAGES;
    return all.filter((m) => m.projectId === projectId);
  } catch (e) {
    return INITIAL_MESSAGES.filter((m) => m.projectId === projectId);
  }
}

export function saveProjectMessage(message: ProjectMessage): ProjectMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    const all: ProjectMessage[] = raw ? JSON.parse(raw) : INITIAL_MESSAGES;
    all.push(message);
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(all));
    return all.filter((m) => m.projectId === message.projectId);
  } catch (e) {
    console.error('Erro ao salvar mensagem:', e);
    return [];
  }
}

// DECISIONS
export function getProjectDecisions(projectId: string): ProjectDecision[] {
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    const all: ProjectDecision[] = raw ? JSON.parse(raw) : INITIAL_DECISIONS;
    return all.filter((d) => d.projectId === projectId);
  } catch (e) {
    return INITIAL_DECISIONS.filter((d) => d.projectId === projectId);
  }
}

export function saveProjectDecision(decision: ProjectDecision): ProjectDecision[] {
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    const all: ProjectDecision[] = raw ? JSON.parse(raw) : INITIAL_DECISIONS;
    const index = all.findIndex((d) => d.id === decision.id);
    if (index >= 0) {
      all[index] = decision;
    } else {
      all.unshift(decision);
    }
    localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(all));
    return all.filter((d) => d.projectId === decision.projectId);
  } catch (e) {
    console.error('Erro ao salvar decisão:', e);
    return [];
  }
}

export function deleteProjectDecision(id: string, projectId: string): ProjectDecision[] {
  try {
    const raw = localStorage.getItem(DECISIONS_STORAGE_KEY);
    const all: ProjectDecision[] = raw ? JSON.parse(raw) : INITIAL_DECISIONS;
    const filtered = all.filter((d) => d.id !== id);
    localStorage.setItem(DECISIONS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered.filter((d) => d.projectId === projectId);
  } catch (e) {
    return [];
  }
}

// MISSIONS
export function getProjectMissions(projectId: string): ProjectMission[] {
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
    const all: ProjectMission[] = raw ? JSON.parse(raw) : INITIAL_MISSIONS;
    return all.filter((m) => m.projectId === projectId);
  } catch (e) {
    return INITIAL_MISSIONS.filter((m) => m.projectId === projectId);
  }
}

export function saveProjectMission(mission: ProjectMission): ProjectMission[] {
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
    const all: ProjectMission[] = raw ? JSON.parse(raw) : INITIAL_MISSIONS;
    const index = all.findIndex((m) => m.id === mission.id);
    if (index >= 0) {
      all[index] = mission;
    } else {
      all.unshift(mission);
    }
    localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(all));
    return all.filter((m) => m.projectId === mission.projectId);
  } catch (e) {
    console.error('Erro ao salvar missão:', e);
    return [];
  }
}

export function deleteProjectMission(id: string, projectId: string): ProjectMission[] {
  try {
    const raw = localStorage.getItem(MISSIONS_STORAGE_KEY);
    const all: ProjectMission[] = raw ? JSON.parse(raw) : INITIAL_MISSIONS;
    const filtered = all.filter((m) => m.id !== id);
    localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered.filter((m) => m.projectId === projectId);
  } catch (e) {
    return [];
  }
}

// SUGGESTIONS
export function getProjectSuggestions(projectId: string): ProjectSuggestion[] {
  try {
    const raw = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    const all: ProjectSuggestion[] = raw ? JSON.parse(raw) : INITIAL_SUGGESTIONS;
    return all.filter((s) => s.projectId === projectId);
  } catch (e) {
    return INITIAL_SUGGESTIONS.filter((s) => s.projectId === projectId);
  }
}

export function saveProjectSuggestion(suggestion: ProjectSuggestion): ProjectSuggestion[] {
  try {
    const raw = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    const all: ProjectSuggestion[] = raw ? JSON.parse(raw) : INITIAL_SUGGESTIONS;
    const index = all.findIndex((s) => s.id === suggestion.id);
    if (index >= 0) {
      all[index] = suggestion;
    } else {
      all.unshift(suggestion);
    }
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(all));
    return all.filter((s) => s.projectId === suggestion.projectId);
  } catch (e) {
    console.error('Erro ao salvar sugestão:', e);
    return [];
  }
}

export function deleteProjectSuggestion(id: string, projectId: string): ProjectSuggestion[] {
  try {
    const raw = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    const all: ProjectSuggestion[] = raw ? JSON.parse(raw) : INITIAL_SUGGESTIONS;
    const filtered = all.filter((s) => s.id !== id);
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered.filter((s) => s.projectId === projectId);
  } catch (e) {
    return [];
  }
}

// =========================================================================
// DECISION WORKFLOW: SUGESTÃO -> EM DISCUSSÃO -> APROVADA -> EM EXECUÇÃO -> CONCLUÍDA
// =========================================================================
export function updateProjectDecisionStatus(
  decisionId: string,
  projectId: string,
  newStatus: ProjectDecisionStatus
): ProjectDecision[] {
  const current = getProjectDecisions(projectId);
  const found = current.find((d) => d.id === decisionId);
  if (found) {
    found.status = newStatus;
    saveProjectDecision(found);
    recordProjectActivity(
      projectId,
      `Decisão "${found.decision.slice(0, 40)}..." atualizada para o estado: [${newStatus}].`,
      'Agente Executor'
    );
  }
  return getProjectDecisions(projectId);
}

// =========================================================================
// ENTREGÁVEIS / ARQUIVOS GERADOS
// =========================================================================
const INITIAL_DELIVERABLES: ProjectDeliverable[] = [
  {
    id: 'deliv-1',
    projectId: 'proj-1',
    name: 'Parser OCR de Laudos PGR',
    type: 'Componente / Módulo Parser',
    description: 'Extração automatizada de seções de riscos físicos, químicos e biológicos.',
    createdAt: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
    content: '// Módulo de processamento OCR integrado com regex e verificação estruturada\nexport const parseLaudoPGR = (buffer: Buffer) => { ... }',
  },
  {
    id: 'deliv-2',
    projectId: 'proj-1',
    name: 'Validador de Artigos NR-01',
    type: 'Regra de Negócio / Schema',
    description: 'Matriz de compatibilidade normativa para matriz de risco de acidentes.',
    createdAt: new Date(Date.now() - 86400000).toLocaleDateString(),
    content: 'export const NR01_RULES = { matrizRisco: "5x5", prazoRevisaoAnual: true };',
  },
];

export function getProjectDeliverables(projectId: string): ProjectDeliverable[] {
  try {
    const raw = localStorage.getItem(DELIVERABLES_STORAGE_KEY);
    const all: ProjectDeliverable[] = raw ? JSON.parse(raw) : INITIAL_DELIVERABLES;
    return all.filter((d) => d.projectId === projectId);
  } catch {
    return INITIAL_DELIVERABLES.filter((d) => d.projectId === projectId);
  }
}

export function saveProjectDeliverable(item: ProjectDeliverable): ProjectDeliverable[] {
  try {
    const raw = localStorage.getItem(DELIVERABLES_STORAGE_KEY);
    const all: ProjectDeliverable[] = raw ? JSON.parse(raw) : INITIAL_DELIVERABLES;
    const idx = all.findIndex((d) => d.id === item.id);
    if (idx >= 0) all[idx] = item;
    else all.unshift(item);
    localStorage.setItem(DELIVERABLES_STORAGE_KEY, JSON.stringify(all));
    recordProjectActivity(
      item.projectId,
      `Novo entregável registrado: "${item.name}" (${item.type}).`,
      'Agente Executor'
    );
    return all.filter((d) => d.projectId === item.projectId);
  } catch (e) {
    console.error('Erro ao salvar entregável:', e);
    return [];
  }
}

export function deleteProjectDeliverable(id: string, projectId: string): ProjectDeliverable[] {
  try {
    const raw = localStorage.getItem(DELIVERABLES_STORAGE_KEY);
    const all: ProjectDeliverable[] = raw ? JSON.parse(raw) : INITIAL_DELIVERABLES;
    const filtered = all.filter((d) => d.id !== id);
    localStorage.setItem(DELIVERABLES_STORAGE_KEY, JSON.stringify(filtered));
    return filtered.filter((d) => d.projectId === projectId);
  } catch {
    return [];
  }
}

// =========================================================================
// CONTROLE DE VERSÕES
// =========================================================================
const INITIAL_VERSIONS: ProjectVersion[] = [
  {
    id: 'ver-1.0',
    projectId: 'proj-1',
    version: 'V1.0',
    date: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
    changes: 'Estrutura base da pipeline, upload de PDF e conexão inicial de IA.',
    reason: 'MVP funcional validado.',
    result: 'Pipeline básica pronta para homologação.',
    status: 'Lançada',
  },
  {
    id: 'ver-1.1',
    projectId: 'proj-1',
    version: 'V1.1',
    date: new Date().toLocaleDateString(),
    changes: 'Integração de regras normativas NR-01 e melhoria no filtro de ruído OCR.',
    reason: 'Aumento da precisão na identificação de graus de risco.',
    result: 'Em testes com laudos reais.',
    status: 'Em desenvolvimento',
  },
];

export function getProjectVersions(projectId: string): ProjectVersion[] {
  try {
    const raw = localStorage.getItem(VERSIONS_STORAGE_KEY);
    const all: ProjectVersion[] = raw ? JSON.parse(raw) : INITIAL_VERSIONS;
    return all.filter((v) => v.projectId === projectId);
  } catch {
    return INITIAL_VERSIONS.filter((v) => v.projectId === projectId);
  }
}

export function saveProjectVersion(item: ProjectVersion): ProjectVersion[] {
  try {
    const raw = localStorage.getItem(VERSIONS_STORAGE_KEY);
    const all: ProjectVersion[] = raw ? JSON.parse(raw) : INITIAL_VERSIONS;
    const idx = all.findIndex((v) => v.id === item.id || v.version === item.version);
    if (idx >= 0) all[idx] = item;
    else all.unshift(item);
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(all));

    // Atualiza a versão atual no projeto
    const projects = getProjects();
    const proj = projects.find((p) => p.id === item.projectId);
    if (proj) {
      proj.currentVersion = item.version;
      proj.updatedAt = new Date().toISOString();
      saveProjects(projects);
    }

    recordProjectActivity(
      item.projectId,
      `Marco de Versão registrado: [${item.version}] - ${item.changes.slice(0, 45)}...`,
      'Agente Arquiteto'
    );
    return all.filter((v) => v.projectId === item.projectId);
  } catch (e) {
    console.error('Erro ao salvar versão:', e);
    return [];
  }
}

// =========================================================================
// TESTES & RESULTADOS
// =========================================================================
const INITIAL_TESTS: ProjectTest[] = [
  {
    id: 'test-1',
    projectId: 'proj-1',
    name: 'Validação de Parser com PDF de 15 páginas',
    type: 'Integração',
    result: 'Passou',
    details: 'Extração concluída em 2.4s com 98% de fidelidade nas tabelas de risco.',
    date: new Date(Date.now() - 86400000).toLocaleDateString(),
  },
  {
    id: 'test-2',
    projectId: 'proj-1',
    name: 'Simulação de laudo escaneado com baixa iluminação',
    type: 'Funcional',
    result: 'Pendente',
    details: 'Aguardando lote de amostras de clientes piloto.',
    date: new Date().toLocaleDateString(),
  },
];

export function getProjectTests(projectId: string): ProjectTest[] {
  try {
    const raw = localStorage.getItem(TESTS_STORAGE_KEY);
    const all: ProjectTest[] = raw ? JSON.parse(raw) : INITIAL_TESTS;
    return all.filter((t) => t.projectId === projectId);
  } catch {
    return INITIAL_TESTS.filter((t) => t.projectId === projectId);
  }
}

export function saveProjectTest(item: ProjectTest): ProjectTest[] {
  try {
    const raw = localStorage.getItem(TESTS_STORAGE_KEY);
    const all: ProjectTest[] = raw ? JSON.parse(raw) : INITIAL_TESTS;
    const idx = all.findIndex((t) => t.id === item.id);
    if (idx >= 0) all[idx] = item;
    else all.unshift(item);
    localStorage.setItem(TESTS_STORAGE_KEY, JSON.stringify(all));
    recordProjectActivity(
      item.projectId,
      `Teste [${item.type}] "${item.name}": Resultado [${item.result}].`,
      'Agente Executor'
    );
    return all.filter((t) => t.projectId === item.projectId);
  } catch (e) {
    console.error('Erro ao salvar teste:', e);
    return [];
  }
}

// =========================================================================
// ERROS ENCONTRADOS E CORREÇÕES (ISSUES)
// =========================================================================
const INITIAL_ISSUES: ProjectIssue[] = [
  {
    id: 'iss-1',
    projectId: 'proj-1',
    title: 'Falha na leitura de rodapé de PDFs com carimbos sobrepostos',
    description: 'Caracteres do carimbo interferiam na extração do CNPJ da contratante.',
    errorFound: 'CNPJ extraído truncado ("12.345.../0001")',
    fixApplied: 'Aplicado pré-processamento de máscara morfológica antes do OCR.',
    status: 'Resolvido',
    date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
  },
];

export function getProjectIssues(projectId: string): ProjectIssue[] {
  try {
    const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
    const all: ProjectIssue[] = raw ? JSON.parse(raw) : INITIAL_ISSUES;
    return all.filter((i) => i.projectId === projectId);
  } catch {
    return INITIAL_ISSUES.filter((i) => i.projectId === projectId);
  }
}

export function saveProjectIssue(item: ProjectIssue): ProjectIssue[] {
  try {
    const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
    const all: ProjectIssue[] = raw ? JSON.parse(raw) : INITIAL_ISSUES;
    const idx = all.findIndex((i) => i.id === item.id);
    if (idx >= 0) all[idx] = item;
    else all.unshift(item);
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(all));
    recordProjectActivity(
      item.projectId,
      `Problema/Correção registrado: "${item.title}" [Status: ${item.status}].`,
      'Agente Executor'
    );
    return all.filter((i) => i.projectId === item.projectId);
  } catch (e) {
    console.error('Erro ao salvar issue:', e);
    return [];
  }
}

// =========================================================================
// IMPLANTAÇÕES (DEPLOYMENTS)
// =========================================================================
const INITIAL_DEPLOYMENTS: ProjectDeployment[] = [
  {
    id: 'dep-1',
    projectId: 'proj-1',
    version: 'V1.0',
    date: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
    status: 'Sucesso',
    changes: 'Publicação do motor em ambiente de homologação Cloud Run.',
    result: 'Serviço ativo e respondendo aos webhooks.',
    notes: 'Endpoints monitorados com logs estruturados.',
    nextEvolution: 'Configurar auto-scaling para picos de upload.',
  },
];

export function getProjectDeployments(projectId: string): ProjectDeployment[] {
  try {
    const raw = localStorage.getItem(DEPLOYMENTS_STORAGE_KEY);
    const all: ProjectDeployment[] = raw ? JSON.parse(raw) : INITIAL_DEPLOYMENTS;
    return all.filter((d) => d.projectId === projectId);
  } catch {
    return INITIAL_DEPLOYMENTS.filter((d) => d.projectId === projectId);
  }
}

export function saveProjectDeployment(item: ProjectDeployment): ProjectDeployment[] {
  try {
    const raw = localStorage.getItem(DEPLOYMENTS_STORAGE_KEY);
    const all: ProjectDeployment[] = raw ? JSON.parse(raw) : INITIAL_DEPLOYMENTS;
    const idx = all.findIndex((d) => d.id === item.id);
    if (idx >= 0) all[idx] = item;
    else all.unshift(item);
    localStorage.setItem(DEPLOYMENTS_STORAGE_KEY, JSON.stringify(all));
    recordProjectActivity(
      item.projectId,
      `Implantação [${item.version}]: Status [${item.status}] - ${item.result}.`,
      'Agente Acompanhador'
    );
    return all.filter((d) => d.projectId === item.projectId);
  } catch (e) {
    console.error('Erro ao salvar deployment:', e);
    return [];
  }
}

// =========================================================================
// AGENTE PROFESSOR: EXPLICAÇÕES PEDAGÓGICAS ESTRUTURADAS
// =========================================================================
const INITIAL_PEDAGOGIES: ProjectPedagogicalExplanation[] = [
  {
    id: 'ped-1',
    projectId: 'proj-1',
    title: 'Arquitetura do Pipeline Híbrido OCR + LLM',
    whatWasDone: 'Construção da esteira de ingestão de laudos técnicos em PDF.',
    whyDone: 'Modelos de linguagem puros não leem diretamente tabelas desestruturadas em PDFs escaneados com fidelidade garantida.',
    howItWorks: 'O arquivo passa pelo extrator ótico primeiro; o texto resultante é vetorizado e comparado com a base normativa NR-01 por similaridade semântica.',
    whatWasTested: 'Testado com 5 arquivos de diferentes clínicas ocupacionais com fontes variadas.',
    whatWasChanged: 'Adicionado filtro de pré-limpeza de ruídos antes do envio ao motor Gemini.',
    whatIsMissing: 'Conectar endpoint final de download do laudo corrigido.',
    whatCanEvolve: 'Treinar fine-tuning leve ou cache de embeddings para regras frequentes.',
    date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
  },
];

export function getProjectPedagogies(projectId: string): ProjectPedagogicalExplanation[] {
  try {
    const raw = localStorage.getItem(PEDAGOGIES_STORAGE_KEY);
    const all: ProjectPedagogicalExplanation[] = raw ? JSON.parse(raw) : INITIAL_PEDAGOGIES;
    return all.filter((p) => p.projectId === projectId);
  } catch {
    return INITIAL_PEDAGOGIES.filter((p) => p.projectId === projectId);
  }
}

export function saveProjectPedagogy(item: ProjectPedagogicalExplanation): ProjectPedagogicalExplanation[] {
  try {
    const raw = localStorage.getItem(PEDAGOGIES_STORAGE_KEY);
    const all: ProjectPedagogicalExplanation[] = raw ? JSON.parse(raw) : INITIAL_PEDAGOGIES;
    const idx = all.findIndex((p) => p.id === item.id);
    if (idx >= 0) all[idx] = item;
    else all.unshift(item);
    localStorage.setItem(PEDAGOGIES_STORAGE_KEY, JSON.stringify(all));
    recordProjectActivity(
      item.projectId,
      `Lição pedagógica documentada: "${item.title}".`,
      'Agente Professor'
    );
    return all.filter((p) => p.projectId === item.projectId);
  } catch (e) {
    console.error('Erro ao salvar pedagogia:', e);
    return [];
  }
}

// =========================================================================
// REQUISITOS (USUÁRIO vs INFERÊNCIA vs SUGESTÃO vs APROVADA)
// =========================================================================
export function getProjectRequirements(projectId: string): ProjectRequirements {
  const projects = getProjects();
  const proj = projects.find((p) => p.id === projectId);
  if (proj?.requirements) {
    return proj.requirements;
  }
  // Default seguro baseado no objetivo
  return {
    userRequirements: [
      proj?.objective || 'Definir escopo inicial do projeto com clareza.',
      ...(proj?.expectedResult ? [proj.expectedResult] : []),
    ],
    inferredRequirements: [
      'Garantir conformidade com leis e padrões de segurança aplicáveis.',
      'Persistência segura e recuperação do estado do projeto.',
    ],
    aiSuggestions: [
      'Adicionar telemetria de performance e relatórios em PDF.',
      'Configurar alertas preditivos de gargalos operacionais.',
    ],
    approvedDecisions: [
      'Arquitetura base aprovada pelo usuário.',
    ],
  };
}

export function deleteProjectVersion(id: string, projectId: string): ProjectVersion[] {
  try {
    const raw = localStorage.getItem(VERSIONS_STORAGE_KEY);
    const all: ProjectVersion[] = raw ? JSON.parse(raw) : INITIAL_VERSIONS;
    const filtered = all.filter((v) => v.id !== id);
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered.filter((v) => v.projectId === projectId);
  } catch {
    return [];
  }
}

export function deleteProjectTest(id: string, projectId: string): ProjectTest[] {
  try {
    const raw = localStorage.getItem(TESTS_STORAGE_KEY);
    const all: ProjectTest[] = raw ? JSON.parse(raw) : INITIAL_TESTS;
    const filtered = all.filter((t) => t.id !== id);
    localStorage.setItem(TESTS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered.filter((t) => t.projectId === projectId);
  } catch {
    return [];
  }
}

export function deleteProjectIssue(id: string, projectId: string): ProjectIssue[] {
  try {
    const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
    const all: ProjectIssue[] = raw ? JSON.parse(raw) : INITIAL_ISSUES;
    const filtered = all.filter((i) => i.id !== id);
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(filtered));
    return filtered.filter((i) => i.projectId === projectId);
  } catch {
    return [];
  }
}

export function deleteProjectDeployment(id: string, projectId: string): ProjectDeployment[] {
  try {
    const raw = localStorage.getItem(DEPLOYMENTS_STORAGE_KEY);
    const all: ProjectDeployment[] = raw ? JSON.parse(raw) : INITIAL_DEPLOYMENTS;
    const filtered = all.filter((d) => d.id !== id);
    localStorage.setItem(DEPLOYMENTS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered.filter((d) => d.projectId === projectId);
  } catch {
    return [];
  }
}

export function deleteProjectPedagogy(id: string, projectId: string): ProjectPedagogicalExplanation[] {
  try {
    const raw = localStorage.getItem(PEDAGOGIES_STORAGE_KEY);
    const all: ProjectPedagogicalExplanation[] = raw ? JSON.parse(raw) : INITIAL_PEDAGOGIES;
    const filtered = all.filter((p) => p.id !== id);
    localStorage.setItem(PEDAGOGIES_STORAGE_KEY, JSON.stringify(filtered));
    return filtered.filter((p) => p.projectId === projectId);
  } catch {
    return [];
  }
}

export function saveProjectRequirements(reqsOrProjectId: ProjectRequirements | string, reqsArg?: ProjectRequirements): ProjectRequirements {
  let targetProjectId = '';
  let finalReqs: ProjectRequirements;

  if (typeof reqsOrProjectId === 'string') {
    targetProjectId = reqsOrProjectId;
    finalReqs = reqsArg!;
  } else {
    targetProjectId = reqsOrProjectId.projectId || '';
    finalReqs = reqsOrProjectId;
  }

  const projects = getProjects();
  const proj = projects.find((p) => p.id === targetProjectId);
  if (proj) {
    proj.requirements = finalReqs;
    proj.updatedAt = new Date().toISOString();
    saveProjects(projects);
    recordProjectActivity(targetProjectId, 'Requisitos do projeto atualizados.', 'Agente Arquiteto');
  }
  return finalReqs;
}

// =========================================================================
// ATIVIDADE / HISTÓRICO RÁPIDO DO PROJETO
// =========================================================================
export function recordProjectActivity(projectId: string, description: string, author = 'Agente'): void {
  try {
    const projects = getProjects();
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      if (!Array.isArray(proj.history)) proj.history = [];
      proj.history.unshift({
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description,
        author,
      });
      proj.updatedAt = new Date().toISOString();
      saveProjects(projects);
    }
  } catch (e) {
    console.error('Erro ao registrar atividade:', e);
  }
}

// =========================================================================
// MOTOR DE ESTADO UNIFICADO DO PROJETO (PROJECT STATE AGGREGATOR)
// =========================================================================
export function getCompleteProjectState(projectId: string) {
  const projects = getProjects();
  const project = projects.find((p) => p.id === projectId) || INITIAL_PROJECTS[0];
  const missions = getProjectMissions(projectId);
  const decisions = getProjectDecisions(projectId);
  const suggestions = getProjectSuggestions(projectId);
  const deliverables = getProjectDeliverables(projectId);
  const versions = getProjectVersions(projectId);
  const tests = getProjectTests(projectId);
  const issues = getProjectIssues(projectId);
  const deployments = getProjectDeployments(projectId);
  const pedagogies = getProjectPedagogies(projectId);
  const requirements = getProjectRequirements(projectId);
  const messages = getProjectMessages(projectId);

  const completedMissions = missions.filter((m) => m.status === 'Concluída');
  const pendingMissions = missions.filter((m) => m.status === 'Pendente' || m.status === 'Em andamento');

  return {
    project,
    currentStatus: project.status,
    currentVersion: project.currentVersion || (versions[0]?.version ?? 'V1.0'),
    objectives: project.objective,
    requirements,
    tasks: missions,
    completedTasks: completedMissions,
    pendingTasks: pendingMissions,
    decisions,
    discussions: messages,
    deliverables,
    tests,
    issues,
    improvements: suggestions,
    deployments,
    pedagogies,
    lastActivity: project.history?.[0]?.description || 'Projeto inicializado',
    nextStep: project.nextAction || 'Definir próxima missão',
  };
}

