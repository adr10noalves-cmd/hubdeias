import { FilteredTaskContext } from './contextBuilder';
import { TaskComplexityAnalysis } from './taskComplexity';
import { 
  AssistantMode, 
  IAItem, 
  ProjectHubItem, 
  UserRole,
  UserAdaptiveProfile,
  AIExperienceLevel,
} from '../../types';
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
  adaptiveProfile?: UserAdaptiveProfile | null;
  adaptiveAdjustmentNote?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface BuiltPromptResult {
  systemPrompt: string;
  userPrompt: string;
  formatInstruction: 'JSON_STRICT' | 'MARKDOWN_STRUCTURED';
  maxTokensExpected: number;
}

/**
 * Gera as diretrizes de conduta e profundidade de acordo com o perfil adaptativo do usuário
 */
function getAdaptiveBehaviorDirectives(
  profile: UserAdaptiveProfile | null | undefined,
  adjustmentNote?: string
): string {
  const level: AIExperienceLevel = profile?.aiExperienceLevel || 'INTERMEDIÁRIO';
  const depth = profile?.explanationDepth || (level === 'INICIANTE' ? 'detalhada' : level === 'AVANÇADO' ? 'objetiva' : 'equilibrada');
  const style = profile?.preferredInteractionStyle || (level === 'INICIANTE' ? 'orientador' : level === 'AVANÇADO' ? 'direto' : 'estrategico');
  const proactivity = profile?.proactivityLevel || (level === 'INICIANTE' ? 'alto' : level === 'AVANÇADO' ? 'baixo' : 'equilibrado');

  let levelGuidelines = '';

  if (level === 'INICIANTE') {
    levelGuidelines = `
• CONDUTA PARA NÍVEL INICIANTE:
  - Explique conceitos antes de utilizar termos técnicos (ensine a lógica de forma acolhedora, acessível e sem presunções).
  - Ensine enquanto executa: ao sugerir um recurso ou IA, contextualize sucintamente para que serve.
  - Sugira próximos passos claros e antecipe dificuldades comuns.
  - Faça perguntas orientadoras (uma por vez) para guiar a reflexão sem sobrecarregar.
  - Explique resumidamente o porquê de cada decisão ou escolha tomada.
  - Ofereça e indique acesso aos recursos de aprendizagem e estudos já existentes no Hub.
  - Acompanhe o usuário de perto com proatividade orientadora.
  - Evite sobrecarregar o usuário com termos puramente técnicos, snippets de código intimidador ou detalhes de infraestrutura a menos que explicitamente solicitado.`;
  } else if (level === 'INTERMEDIÁRIO') {
    levelGuidelines = `
• CONDUTA PARA NÍVEL INTERMEDIÁRIO:
  - Equilibre execução prática com explicação de decisões relevantes.
  - Permita e ofereça aprofundamento técnico sob demanda ("Se quiser, posso detalhar a arquitetura ou o fluxo de dados...").
  - Sugira alternativas de ferramentas e trade-offs técnicos claros.
  - Faça perguntas estratégicas focadas no produto, viabilidade e maturidade do projeto.
  - Assuma tarefas operacionais simples quando autorizado.
  - Evite explicar conceitos básicos desnecessariamente (o usuário já sabe o que é LLM, API, prompt e fine-tuning).`;
  } else {
    // AVANÇADO
    levelGuidelines = `
• CONDUTA PARA NÍVEL AVANÇADO:
  - Comunicação altamente objetiva, sintética, precisa e densa em valor.
  - Reduza a zero explicações básicas ou conceituais.
  - Foco em discussões técnicas profundas: arquitetura de software, latência, custos, context windows, automações, pipelines, engenharia de contexto e APIs.
  - Apresente arquitetura, alternativas e implicações técnicas e de escala de forma estruturada.
  - Assuma maior iniciativa e autonomia operacional em operações de baixo risco.
  - Discuta otimizações e estratégias técnicas com prioridade máxima na eficiência.`;
  }

  const dynamicNoteBlock = adjustmentNote
    ? `\n⚡ AJUSTE DINÂMICO IMEDIATO REQUISITADO NESTA INTERAÇÃO:
${adjustmentNote}
(IMPORTANTE: A preferência explícita mais recente do usuário prevalece sobre o nível base!)`
    : '';

  return `
--- PERFIL ADAPTATIVO DO USUÁRIO & PARTICIPAÇÃO PERSONALIZADA ---
• Nível Declarado: ${level}
• Profundidade de Explicação Atual: ${depth}
• Estilo de Participação: ${style}
• Nível de Proatividade: ${proactivity}
${levelGuidelines}
${dynamicNoteBlock}
-----------------------------------------------------------------`;
}

/**
 * PROMPT BUILDER DO AUXILIAR MESTRE DO HUB
 * Gera prompts sob medida integrando:
 * - Mapa de capacidades reais do Hub;
 * - Registro de ferramentas autorizadas;
 * - Consciência da tela e do projeto ativo;
 * - Perfil adaptativo do usuário (Iniciante, Intermediário, Avançado);
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
    adaptiveProfile,
    adaptiveAdjustmentNote,
    history = [],
  } = input;

  // Diretrizes comportamentais adaptadas ao perfil de experiência do usuário
  const adaptiveDirectives = getAdaptiveBehaviorDirectives(adaptiveProfile, adaptiveAdjustmentNote);

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

${adaptiveDirectives}

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
