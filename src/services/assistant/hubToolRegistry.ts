import {
  UserRole,
  IAItem,
  ProjectHubItem,
  IdeaItem,
  StudyItem,
  IACategory,
  IALevel,
  CATEGORIES,
} from '../../types';
import { MainHubView } from '../../components/strategic/StrategicNavTabs';
import { getProjectMissions, getProjectDecisions } from '../projectsService';

export type ToolRiskLevel = 'READ' | 'NAVIGATION' | 'LOW_RISK_WRITE' | 'SENSITIVE' | 'DESTRUCTIVE';

export interface ToolExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  actionExecuted?: string;
  requiresConfirmation?: boolean;
  confirmationPayload?: any;
}

export interface HubToolNavigationHandlers {
  navigateToView: (view: MainHubView) => void;
  openProject: (projectId: string) => void;
  openAddIA: () => void;
  openGlobalSearch: () => void;
  openCompare: (ids?: number[]) => void;
  openAIDetail: (ia: IAItem) => void;
}

export interface HubToolDataMutationHandlers {
  saveIA: (ia: Partial<IAItem>) => Promise<IAItem | void>;
}

export interface HubToolContext {
  currentUserRole: UserRole;
  currentRoute: MainHubView;
  currentSection?: string;
  currentProject?: ProjectHubItem | IdeaItem | null;
  allProjects: ProjectHubItem[];
  allIdeas: IdeaItem[];
  allStudies: StudyItem[];
  catalog: IAItem[];
  navigationHandlers: HubToolNavigationHandlers;
  dataMutationHandlers: HubToolDataMutationHandlers;
}

export interface HubToolDefinition {
  name: string;
  description: string;
  parametersDescription: string;
  requiredPermission: UserRole;
  riskLevel: ToolRiskLevel;
  execute: (params: any, context: HubToolContext) => Promise<ToolExecutionResult> | ToolExecutionResult;
}

/**
 * REGISTRO CENTRAL DE FERRAMENTAS DO ORQUESTRADOR (HUB TOOL REGISTRY)
 * Camada intermediária que valida intenção, parâmetros e permissões
 * antes de acionar os serviços existentes da aplicação.
 */
export const HUB_TOOLS: Record<string, HubToolDefinition> = {
  // 1. NAVEGAÇÃO INTERNA
  navigate_to: {
    name: 'navigate_to',
    description: 'Navega para qualquer área oficial do Hub (ex: catalog, projects, ideas, studies, diary, dashboard, master, receptor, add_ia, compare, search).',
    parametersDescription: 'target: string ("catalog" | "projects" | "ideas" | "studies" | "diary" | "dashboard" | "master" | "receptor" | "add_ia" | "compare" | "search")',
    requiredPermission: 'USER',
    riskLevel: 'NAVIGATION',
    execute: (params, context) => {
      const rawTarget = String(params?.target || '').toLowerCase().trim();

      const validHubViews: MainHubView[] = [
        'catalog',
        'projects',
        'ideas',
        'studies',
        'diary',
        'dashboard',
        'master',
        'receptor',
      ];

      if (validHubViews.includes(rawTarget as MainHubView)) {
        context.navigationHandlers.navigateToView(rawTarget as MainHubView);
        return {
          success: true,
          actionExecuted: `navigate_${rawTarget}`,
          message: `Navegando para a área "${rawTarget}".`,
        };
      }

      if (rawTarget === 'add_ia' || rawTarget === 'cadastrar_ia' || rawTarget === 'novo_cadastro') {
        if (context.currentUserRole === 'GUEST' || context.currentUserRole === 'USER') {
          return {
            success: false,
            message: 'Apenas operadores ou administradores possuem autorização para cadastrar novas IAs.',
          };
        }
        context.navigationHandlers.openAddIA();
        return {
          success: true,
          actionExecuted: 'open_modal_add_ia',
          message: 'Abrindo o formulário de cadastro de nova IA.',
        };
      }

      if (rawTarget === 'compare' || rawTarget === 'comparador') {
        context.navigationHandlers.openCompare();
        return {
          success: true,
          actionExecuted: 'open_modal_compare',
          message: 'Abrindo o comparador de IAs.',
        };
      }

      if (rawTarget === 'search' || rawTarget === 'busca_global') {
        context.navigationHandlers.openGlobalSearch();
        return {
          success: true,
          actionExecuted: 'open_modal_search',
          message: 'Abrindo a busca inteligente global.',
        };
      }

      return {
        success: false,
        message: `Destino de navegação desconhecido: "${rawTarget}". Destinos válidos: ${validHubViews.join(', ')}.`,
      };
    },
  },

  // 2. BUSCA GERAL NO HUB
  search_hub: {
    name: 'search_hub',
    description: 'Pesquisa transversal em todo o ecossistema (catálogo de IAs, projetos, ideias e estudos).',
    parametersDescription: 'query: string',
    requiredPermission: 'USER',
    riskLevel: 'READ',
    execute: (params, context) => {
      const q = String(params?.query || '').toLowerCase().trim();
      if (!q) {
        return { success: false, message: 'Termo de busca vazio.' };
      }

      const matchingIAs = context.catalog
        .filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.specialty.toLowerCase().includes(q))
        .slice(0, 5);

      const matchingProjects = context.allProjects
        .filter((p) => p.name.toLowerCase().includes(q) || p.objective.toLowerCase().includes(q))
        .slice(0, 5);

      const matchingStudies = context.allStudies
        .filter((s) => s.theme.toLowerCase().includes(q) || (s.toolsUsed && s.toolsUsed.some((t) => t.toLowerCase().includes(q))))
        .slice(0, 5);

      return {
        success: true,
        message: `Encontrados ${matchingIAs.length} IA(s), ${matchingProjects.length} projeto(s) e ${matchingStudies.length} estudo(s).`,
        data: {
          ias: matchingIAs.map((i) => ({ id: i.id, name: i.name, category: i.category })),
          projects: matchingProjects.map((p) => ({ id: p.id, name: p.name, status: p.status, stage: p.currentStage })),
          studies: matchingStudies.map((s) => ({ id: s.id, theme: s.theme, progress: s.progress })),
        },
      };
    },
  },

  // 3. CONSULTA AO CATÁLOGO DE IAs
  search_ai_catalog: {
    name: 'search_ai_catalog',
    description: 'Consulta filtrada no catálogo de IAs por categoria, nível, preço ou termo técnico.',
    parametersDescription: 'query?: string, category?: string, level?: string, pricing?: string',
    requiredPermission: 'USER',
    riskLevel: 'READ',
    execute: (params, context) => {
      const q = String(params?.query || '').toLowerCase().trim();
      const cat = String(params?.category || '').trim();
      const level = String(params?.level || '').trim();
      const pricing = String(params?.pricing || '').trim();

      let results = context.catalog;

      if (cat) {
        results = results.filter((i) => i.category.toLowerCase() === cat.toLowerCase());
      }
      if (level) {
        results = results.filter((i) => i.level.toLowerCase() === level.toLowerCase());
      }
      if (pricing) {
        results = results.filter((i) => i.pricing.toLowerCase() === pricing.toLowerCase());
      }
      if (q) {
        results = results.filter((i) => {
          const haystack = `${i.name} ${i.category} ${i.specialty} ${i.differential}`.toLowerCase();
          return haystack.includes(q);
        });
      }

      return {
        success: true,
        message: `Encontradas ${results.length} ferramenta(s) no catálogo com os critérios fornecidos.`,
        data: results.slice(0, 10).map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          level: i.level,
          pricing: i.pricing,
          specialty: i.specialty,
          differential: i.differential,
          link: i.link,
        })),
      };
    },
  },

  // 4. OBTER PROJETO ATUAL
  get_current_project: {
    name: 'get_current_project',
    description: 'Recupera os detalhes completos do projeto que o usuário está visualizando ou trabalhando atualmente.',
    parametersDescription: 'Nenhum parâmetro obrigatório.',
    requiredPermission: 'USER',
    riskLevel: 'READ',
    execute: (_, context) => {
      if (!context.currentProject) {
        return {
          success: false,
          message: 'Nenhum projeto selecionado no momento. O usuário está fora da área detalhada de projetos.',
        };
      }

      const p = context.currentProject as ProjectHubItem;
      return {
        success: true,
        message: `Projeto atual em foco: "${p.name || (p as any).title}".`,
        data: {
          id: p.id,
          name: p.name || (p as any).title,
          objective: p.objective,
          description: p.description,
          status: p.status,
          currentStage: p.currentStage || (p as any).stage,
          progress: p.progress,
          nextAction: p.nextAction || (p as any).nextSteps,
          aiTools: p.aiTools || (p as any).relatedTechnologies || [],
        },
      };
    },
  },

  // 5. STATUS DO PROJETO
  get_project_status: {
    name: 'get_project_status',
    description: 'Retorna a maturidade, progresso percentual e etapa técnica atual de um projeto específico.',
    parametersDescription: 'projectId?: string, projectName?: string',
    requiredPermission: 'USER',
    riskLevel: 'READ',
    execute: (params, context) => {
      let target: ProjectHubItem | undefined;

      if (params?.projectId) {
        target = context.allProjects.find((p) => p.id === params.projectId);
      } else if (params?.projectName) {
        const nameLower = String(params.projectName).toLowerCase();
        target = context.allProjects.find((p) => p.name.toLowerCase().includes(nameLower));
      } else if (context.currentProject && 'status' in context.currentProject) {
        target = context.currentProject as ProjectHubItem;
      }

      if (!target) {
        return {
          success: false,
          message: 'Projeto não encontrado para consulta de status.',
        };
      }

      return {
        success: true,
        message: `Status do projeto "${target.name}": ${target.status} (${target.progress}% concluído).`,
        data: {
          id: target.id,
          name: target.name,
          status: target.status,
          currentStage: target.currentStage,
          progress: target.progress,
          nextAction: target.nextAction,
        },
      };
    },
  },

  // 6. MISSÕES DO PROJETO
  get_project_missions: {
    name: 'get_project_missions',
    description: 'Retorna as missões e tarefas em execução, pendentes ou concluídas de um projeto.',
    parametersDescription: 'projectId?: string',
    requiredPermission: 'USER',
    riskLevel: 'READ',
    execute: (params, context) => {
      const pid = params?.projectId || (context.currentProject ? context.currentProject.id : undefined);
      if (!pid) {
        return {
          success: false,
          message: 'ID do projeto não fornecido e nenhum projeto ativo.',
        };
      }

      const missions = getProjectMissions(pid);
      return {
        success: true,
        message: `Encontradas ${missions.length} missões para este projeto.`,
        data: missions,
      };
    },
  },

  // 7. DECISÕES DO PROJETO
  get_project_decisions: {
    name: 'get_project_decisions',
    description: 'Retorna o histórico de decisões arquiteturais e técnicas registradas no projeto.',
    parametersDescription: 'projectId?: string',
    requiredPermission: 'USER',
    riskLevel: 'READ',
    execute: (params, context) => {
      const pid = params?.projectId || (context.currentProject ? context.currentProject.id : undefined);
      if (!pid) {
        return {
          success: false,
          message: 'ID do projeto não fornecido e nenhum projeto ativo.',
        };
      }

      const decisions = getProjectDecisions(pid);
      return {
        success: true,
        message: `Encontradas ${decisions.length} decisões registradas no projeto.`,
        data: decisions,
      };
    },
  },

  // 8. ABRIR PROJETO ESPECÍFICO
  open_project: {
    name: 'open_project',
    description: 'Localiza e abre imediatamente a visão detalhada de um projeto no Hub.',
    parametersDescription: 'projectId?: string, projectName?: string',
    requiredPermission: 'USER',
    riskLevel: 'NAVIGATION',
    execute: (params, context) => {
      let target: ProjectHubItem | undefined;

      if (params?.projectId) {
        target = context.allProjects.find((p) => p.id === params.projectId);
      } else if (params?.projectName) {
        const nameLower = String(params.projectName).toLowerCase();
        target = context.allProjects.find((p) => p.name.toLowerCase().includes(nameLower));
      }

      if (!target) {
        return {
          success: false,
          message: `Projeto "${params?.projectName || params?.projectId}" não encontrado na sua lista de projetos.`,
        };
      }

      context.navigationHandlers.openProject(target.id);
      return {
        success: true,
        actionExecuted: 'open_project_detail',
        message: `Abrindo projeto "${target.name}".`,
        data: { id: target.id, name: target.name },
      };
    },
  },

  // 9. CADASTRO AUTÔNOMO DE NOVA IA
  create_ai_entry: {
    name: 'create_ai_entry',
    description: 'Cadastra uma nova ferramenta de IA no catálogo do Hub com validação de duplicidade e persistência oficial.',
    parametersDescription: 'name: string, category: string, specialty?: string, level?: string, pricing?: string, link?: string, differential?: string, whatIsIt?: string, whatIsItFor?: string',
    requiredPermission: 'OPERATOR',
    riskLevel: 'LOW_RISK_WRITE',
    execute: async (params, context) => {
      const rawName = String(params?.name || '').trim();
      if (!rawName) {
        return {
          success: false,
          message: 'O nome da IA é obrigatório para realizar o cadastro.',
        };
      }

      // 1. Verificação de Duplicidade no catálogo existente
      const existing = context.catalog.find(
        (i) => i.name.toLowerCase().trim() === rawName.toLowerCase()
      );
      if (existing) {
        return {
          success: false,
          message: `A IA "${existing.name}" já está cadastrada no Hub (Categoria: ${existing.category}, Nível: ${existing.level}). Não é necessário duplicar.`,
          data: existing,
        };
      }

      // 2. Validação e defaults de categoria e campos
      const category: IACategory = (CATEGORIES.includes(params?.category) ? params.category : CATEGORIES[0]);
      const level: IALevel = params?.level === 'Elite' || params?.level === 'Especializada' ? params.level : 'Alta Performance';
      const pricing = params?.pricing === 'Gratuito' || params?.pricing === 'Pago' ? params.pricing : 'Freemium (Grátis + Pago)';
      const specialty = String(params?.specialty || params?.whatIsIt || 'Assistente de Inteligência Artificial').trim();
      const differential = String(params?.differential || 'Ferramenta integrada ao catálogo estratégico do Hub').trim();
      const link = String(params?.link || `https://www.google.com/search?q=${encodeURIComponent(rawName)}`).trim();

      const newIAItem: Partial<IAItem> = {
        name: rawName,
        category,
        level,
        pricing,
        specialty,
        differential,
        link,
        whatIsIt: params?.whatIsIt || specialty,
        whatIsItFor: params?.whatIsItFor || `Execução e suporte em fluxos de ${category}`,
        beginnerTip: params?.beginnerTip || 'Comece explorando os comandos básicos na interface web.',
      };

      try {
        await context.dataMutationHandlers.saveIA(newIAItem);
        return {
          success: true,
          actionExecuted: 'created_new_ia',
          message: `A IA "${rawName}" foi cadastrada com sucesso no catálogo oficial do Hub (Categoria: ${category}, Nível: ${level}, Preço: ${pricing}).`,
          data: newIAItem,
        };
      } catch (err: any) {
        return {
          success: false,
          message: `Falha técnica ao persistir cadastro da IA: ${err?.message || 'Erro desconhecido'}.`,
        };
      }
    },
  },
};

/**
 * Executa uma ferramenta controlada verificando permissão e riscos.
 */
export async function executeHubTool(
  toolName: string,
  params: any,
  context: HubToolContext
): Promise<ToolExecutionResult> {
  const tool = HUB_TOOLS[toolName];
  if (!tool) {
    return {
      success: false,
      message: `Ferramenta interna desconhecida: "${toolName}".`,
    };
  }

  // Validação de Permissão (Hierarquia: ADMIN > OPERATOR > USER > GUEST)
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 4,
    OPERATOR: 3,
    USER: 2,
    GUEST: 1,
  };

  const userRank = roleHierarchy[context.currentUserRole] || 1;
  const reqRank = roleHierarchy[tool.requiredPermission] || 2;

  if (userRank < reqRank) {
    return {
      success: false,
      message: `Permissão insuficiente. Esta ação requer perfil "${tool.requiredPermission}", mas seu perfil atual é "${context.currentUserRole}".`,
    };
  }

  // Execução direta para ações READ, NAVIGATION e LOW_RISK_WRITE solicitadas
  try {
    return await tool.execute(params, context);
  } catch (err: any) {
    return {
      success: false,
      message: `Erro durante a execução da ferramenta "${toolName}": ${err?.message || 'Erro interno'}.`,
    };
  }
}

/**
 * Resumo descritivo das ferramentas para inclusão no prompt da IA
 */
export function getToolsPromptSummary(): string {
  return Object.values(HUB_TOOLS)
    .map(
      (t) =>
        `- Ferramenta "${t.name}" (Risco: ${t.riskLevel}, Permissão: ${t.requiredPermission}): ${t.description} Parâmetros esperados: [${t.parametersDescription}]`
    )
    .join('\n');
}
