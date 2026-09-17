import { ProjectHubItem } from '../types';

const PROJECTS_STORAGE_KEY = 'hub_projects_v1';

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
  // Se vazio, salva e retorna os iniciais
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
