import {
  ProjectHubItem,
  ProjectMessage,
  ProjectDecision,
  ProjectMission,
  ProjectSuggestion,
} from '../types';

const PROJECTS_STORAGE_KEY = 'hub_projects_v1';
const MESSAGES_STORAGE_KEY = 'hub_project_messages_v1';
const DECISIONS_STORAGE_KEY = 'hub_project_decisions_v1';
const MISSIONS_STORAGE_KEY = 'hub_project_missions_v1';
const SUGGESTIONS_STORAGE_KEY = 'hub_project_suggestions_v1';

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

