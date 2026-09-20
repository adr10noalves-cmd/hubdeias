import { FilteredTaskContext } from './contextBuilder';
import { TaskComplexityAnalysis } from './taskComplexity';
import { AssistantMode, IAItem, ProjectHubItem, UserRole } from '../../types';
import { getCapabilitiesSummaryForPrompt } from './hubCapabilityRegistry';
import { getToolsPromptSummary } from './hubToolRegistry';
import { MainHubView } from '../../components/strategic/StrategicNavTabs';

export interface PromptBuilderInput {
  userTask: string;
  context: FilteredTaskContext;
  complexity: TaskComplexityAnalysis;
  activeMode: AssistantMode;
  provider: 'GEMINI' | 'GROQ';
  modelId: string;
  catalog: IAItem[];
  currentRoute?: MainHubView;
  currentSection?: string;
  currentProject?: ProjectHubItem | null;
  currentUserRole?: UserRole;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface BuiltPromptResult {
  systemPrompt: string;
  userPrompt: string;
  formatInstruction: 'JSON_STRICT' | 'MARKDOWN_STRUCTURED';
  maxTokensExpected: number;
}

/**
 * PROMPT BUILDER DO AUXILIAR MESTRE DO HUB
 * Gera prompts sob medida integrando:
 * - Mapa de capacidades reais do Hub;
 * - Registro de ferramentas autorizadas;
 * - Consciência da tela e do projeto ativo;
 * - Personalidade pedagógica e diretiva sem clichês.
 */
export function buildDynamicPrompt(input: PromptBuilderInput): BuiltPromptResult {
  const {
    userTask,
    context,
    complexity,
    activeMode,
    provider,
    modelId,
    catalog,
    currentRoute = 'catalog',
    currentSection,
    currentProject,
    currentUserRole = 'USER',
    history = [],
  } = input;

  const relevantCatalogSlice = catalog
    .slice(0, 20)
    .map((i) => `- ${i.name} (${i.category}): ${i.specialty} [${i.pricing}]`)
    .join('\n');

  // Mapa conciso das capacidades reais do Hub
  const capabilitiesSummary = getCapabilitiesSummaryForPrompt(currentUserRole);

  // Resumo das ferramentas controladas
  const toolsSummary = getToolsPromptSummary();

  // Diretrizes por Provedor & Modelo
  const providerDirective =
    provider === 'GEMINI'
      ? `VOCÊ É O AUXILIAR MESTRE DO HUB 2.0 (Motor Principal Gemini ${modelId}).
Sua missão é atuar como assistente inteligente global do ecossistema: compreendendo onde o usuário está, ensinando com clareza como o sistema funciona, orientando o próximo passo, ativando navegação inteligente e executando ações autorizadas.`
      : `VOCÊ É O AUXILIAR MESTRE DO HUB 2.0 (Motor de Alta Velocidade Groq ${modelId}).
Foque em respostas ágeis, precisas, comandos diretos, execução prática de ferramentas e orientação imediata ao usuário.`;

  // Bloco de Consciência Contextual da Tela
  const screenContext = `
--- CONSCIÊNCIA CONTEXTUAL DA TELA ATUAL ---
• Rota/Área Atual: "${currentRoute}"
• Sub-Seção: "${currentSection || 'Visão Principal'}"
• Perfil do Usuário: "${currentUserRole}"
• Projeto em Foco no Momento: ${
    currentProject
      ? `"${currentProject.name}" (Status: ${currentProject.status}, Etapa: ${currentProject.currentStage}, Progresso: ${currentProject.progress}%, Próxima Ação: "${currentProject.nextAction || 'Não definida'}")`
      : 'Nenhum projeto específico aberto na tela atual.'
  }
------------------------------------------`;

  // Bloco de Histórico do Projeto
  const projectMemoryContext = context.targetProject
    ? `\n--- DETALHES DO PROJETO EM FOCO ---
${context.contextSummaryText}
-----------------------------------`
    : '';

  // Histórico Recente Relevante
  const recentHistoryFormatted =
    history.length > 0
      ? `\n--- DIÁLOGO RECENTE (ÚLTIMAS INTERAÇÕES) ---
${history.slice(-5).map((h) => `${h.role === 'user' ? 'Usuário' : 'Auxiliar Mestre'}: ${h.content.slice(0, 300)}`).join('\n')}
--------------------------------------------`
      : '';

  // Modo Simulação vs Modo Real
  const modeInstruction =
    activeMode === 'SIMULATION'
      ? `⚠️ MODO SIMULAÇÃO ATIVO: Avalie fluxos, simule cenários de dados e aponte riscos antes de qualquer execução.`
      : `✅ MODO OPERACIONAL ATIVO: Responda de forma direta, oriente e execute ferramentas quando solicitado.`;

  const systemPrompt = `${providerDirective}

NÍVEL DE COMPLEXIDADE: Nível ${complexity.level} (${complexity.levelName})
${modeInstruction}

${screenContext}
${projectMemoryContext}

--- CAPACIDADES REAIS DO HUB ---
${capabilitiesSummary}
-------------------------------

--- FERRAMENTAS CONTROLADAS DO HUB (TOOL LAYER) ---
${toolsSummary}
---------------------------------------------------

--- IAs DISPONÍVEIS NO CATÁLOGO DO HUB (Amostra) ---
${relevantCatalogSlice}
---------------------------------------------------

DIRETRIZES FUNDAMENTAIS DO AUXILIAR MESTRE:
1. PERSONALIDADE: Transmita clareza, competência, naturalidade e capacidade pedagógica. NUNCA diga "Como modelo de linguagem...".
2. CONHECIMENTO DO HUB: Responda apenas com base nas funcionalidades REAIS descritas no mapa de capacidades acima. Não invente telas, botões ou comandos inexistentes.
3. CONTEXTO DA TELA: Se o usuário perguntar "O que posso fazer aqui?", explique o que é possível fazer na tela atual. Se perguntar "O que faço agora?" dentro de um projeto, oriente com base na Próxima Ação e Etapa Atual.
4. NAVEGAÇÃO & AÇÃO:
   - Se o usuário pedir para ir a alguma área ("me leve aos projetos", "ver catálogo", "abrir diário", etc.), recomende a navegação e informe o toolCall correspondente (ex: {"name": "navigate_to", "parameters": {"target": "projects"}}).
   - Se o usuário pedir para abrir um projeto específico ("abra o projeto X"), use {"name": "open_project", "parameters": {"projectName": "X"}}.
   - Se o usuário pedir para cadastrar uma nova IA ("cadastre o Cursor", "adicione o Claude"), use {"name": "create_ai_entry", "parameters": {"name": "...", "category": "..."}}.
5. SUCINTO E DIRETO: Prefira resposta direta + orientação + ação disponível. Evite palestras longas.
6. IDIOMA OBRIGATÓRIO: Português do Brasil (pt-BR).

FORMATO DE RETORNO EXIGIDO:
Retorne EXCLUSIVAMENTE em formato JSON estrito:
{
  "response": "Resposta do Auxiliar Mestre em Markdown elegante, natural e instrutivo",
  "toolCall": {
    "name": "navigate_to" | "open_project" | "create_ai_entry" | "search_ai_catalog" | "search_hub" | null,
    "parameters": {}
  },
  "keyTakeaways": ["Ponto principal 1", "Ponto principal 2"],
  "nextAction": "Próximo passo recomendado",
  "suggestedActions": [
    { "label": "Rótulo amigável do botão", "actionType": "TIPO_ACAO", "target": "alvo_opcional" }
  ]
}`;

  const userPrompt = `${recentHistoryFormatted}

MENSAGEM DO USUÁRIO:
"${userTask}"`;

  const maxTokensExpected = complexity.level >= 3 ? 3000 : 1500;

  return {
    systemPrompt,
    userPrompt,
    formatInstruction: 'JSON_STRICT',
    maxTokensExpected,
  };
}
