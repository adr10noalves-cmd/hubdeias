import {
  AssistantMode,
  AssistantIntent,
  IdeaItem,
  ProjectHubItem,
  StudyItem,
  IAItem,
  StructuredAssistantContext,
  TaskPlan,
  OperationalExecutionRecord,
  UserRole,
  UserAdaptiveProfile,
  AIExperienceLevel,
} from '../../types';
import { saveExecutionRecord } from './memoryManager';
import { analyzeUserIntent, IntentAnalysisResult } from './intentAnalyzer';
import { buildStructuredTaskPlan } from './taskPlanner';
import { routeAITaskOrchestrated, ModelRouteDecision } from './aiRouter';
import { executeScenarioSimulation, SimulationResult } from './simulationEngine';
import { validateExecutionOutput, ValidationReport } from './validationManager';
import { buildFilteredTaskContext, FilteredTaskContext } from './contextBuilder';
import { buildDynamicPrompt } from './promptBuilder';
import { TaskComplexityAnalysis } from './taskComplexity';
import {
  executeHubTool,
  ToolExecutionResult,
  HubToolContext,
  HubToolNavigationHandlers,
  HubToolDataMutationHandlers,
} from './hubToolRegistry';
import { publishHubEvent } from './hubEventBus';
import { MainHubView } from '../../components/strategic/StrategicNavTabs';
import { getUserAdaptiveProfile, saveUserAdaptiveProfile } from '../authService';

export interface AssistantEngineInput {
  userMessage: string;
  activeMode: AssistantMode;
  targetProjectId?: string;
  allIdeas: IdeaItem[];
  allProjects?: ProjectHubItem[];
  allStudies: StudyItem[];
  catalog: IAItem[];
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  // Consciência contextual global do Hub
  currentRoute?: MainHubView;
  currentSection?: string;
  currentProject?: ProjectHubItem | null;
  currentUserRole?: UserRole;
  adaptiveProfile?: UserAdaptiveProfile | null;
  navigationHandlers?: HubToolNavigationHandlers;
  dataMutationHandlers?: HubToolDataMutationHandlers;
}

export interface AssistantEngineResponse {
  mode: AssistantMode;
  intent: AssistantIntent;
  intentDetails: IntentAnalysisResult;
  context: StructuredAssistantContext;
  routing: {
    recommendedModel: {
      modelId: string;
      modelName: string;
      provider: string;
      costTier: string;
      specialtyMatch: string;
      reasoning: string;
    };
    alternativeModels: any[];
    taskType: any;
    complexity: 'BAIXA' | 'MÉDIA' | 'ALTA';
    estimatedCost: 'GRATUITO' | 'BAIXO' | 'MÉDIO';
    executionStrategy: string;
  };
  complexityAnalysis: TaskComplexityAnalysis;
  providerUsed: 'GEMINI' | 'GROQ';
  modelUsed: string;
  fallbackTriggered: boolean;
  replyText: string;
  toolExecution?: ToolExecutionResult;
  plan?: TaskPlan;
  simulationResult?: SimulationResult;
  validationReport?: ValidationReport;
  contextualPrompt?: string;
  pendingConfirmation?: {
    type: 'REGISTER_NEW_IDEA' | 'EVOLVE_IDEA_VERSION' | 'CREATE_STUDY';
    title: string;
    description: string;
    suggestedPayload: any;
    promptQuestion: string;
  };
  suggestedActions: Array<{
    label: string;
    actionType: string;
    target?: string;
    payload?: any;
  }>;
  executionRecordId?: string;
  durationMs: number;
}

/**
 * CICLO OPERACIONAL DO AUXILIAR MESTRE DO HUB 2.0
 * 1. Entender a intenção do usuário (incluindo dúvidas do sistema, navegação e comandos de ação)
 * 2. Identificar a complexidade da tarefa
 * 3. Recuperar da memória persistente apenas o contexto relevante
 * 4. Identificar o projeto relacionado e a tela atual do usuário
 * 5. Selecionar o modelo mais adequado (Gemini Principal / Groq Auxiliar)
 * 6. Montar o prompt dinâmico com o mapa de capacidades e ferramentas controladas
 * 7. Executar a tarefa com fallback transparente (/api/orchestrate)
 * 8. Executar ferramentas internas autorizadas (navegação, busca, cadastro de IA)
 * 9. Analisar e validar a resposta
 * 10. Registrar o resultado na memória persistente
 * 11. Oferecer continuidade e próximas ações precisas
 */
export async function processAssistantMessage(
  input: AssistantEngineInput
): Promise<AssistantEngineResponse> {
  const startTime = Date.now();
  const {
    userMessage,
    activeMode,
    targetProjectId,
    allIdeas,
    allProjects = [],
    allStudies,
    catalog,
    history = [],
    currentRoute = 'catalog',
    currentSection,
    currentProject = null,
    currentUserRole = 'USER',
    navigationHandlers,
    dataMutationHandlers,
  } = input;

  // PASSO 1: ENTENDER A INTENÇÃO DO USUÁRIO
  const intentResult = analyzeUserIntent(userMessage, allIdeas, allProjects);
  const effectiveProjectId = targetProjectId || intentResult.mentionedProjectId || currentProject?.id;

  // RECUPERAR E CALIBRAR O PERFIL ADAPTATIVO DO USUÁRIO
  let currentAdaptiveProfile = input.adaptiveProfile || (await getUserAdaptiveProfile());
  let adaptiveAdjustmentNote: string | undefined;

  // SE O USUÁRIO DEFINIU OU AJUSTOU O PERFIL DINAMICAMENTE
  if (intentResult.adaptiveAdjustment) {
    const adj = intentResult.adaptiveAdjustment;
    if (adj.type === 'SET_EXPERIENCE_LEVEL' && adj.targetLevel) {
      currentAdaptiveProfile = await saveUserAdaptiveProfile({
        aiExperienceLevel: adj.targetLevel,
        explanationDepth:
          adj.targetDepth ||
          (adj.targetLevel === 'INICIANTE'
            ? 'detalhada'
            : adj.targetLevel === 'AVANÇADO'
            ? 'objetiva'
            : 'equilibrada'),
        preferredInteractionStyle:
          adj.targetStyle ||
          (adj.targetLevel === 'INICIANTE'
            ? 'orientador'
            : adj.targetLevel === 'AVANÇADO'
            ? 'direto'
            : 'estrategico'),
        proactivityLevel:
          adj.targetLevel === 'INICIANTE'
            ? 'alto'
            : adj.targetLevel === 'AVANÇADO'
            ? 'baixo'
            : 'equilibrado',
        lastExplicitAdjustment: `Definido explicitamente para ${adj.targetLevel}`,
      });

      let responseText = '';
      let actions: AssistantEngineResponse['suggestedActions'] = [];

      if (adj.targetLevel === 'INICIANTE') {
        responseText = `Perfeito! Configurei seu perfil de interação como **INICIANTE** 🌱.\n\nA partir de agora, vou conduzir nossa parceria com orientação detalhada e acolhedora:\n- **Conceitos primeiro**: Explico o significado e fundamentos antes de usar termos técnicos;\n- **Ensino contínuo**: Mostro o passo a passo enquanto avançamos juntos;\n- **Próximos passos claros**: Antecipo dúvidas e indico o caminho mais seguro e direto;\n- **Recursos do Hub**: Conecto você aos estudos práticos e fichas didáticas do catálogo;\n- **Transparência**: Explico sempre o porquê de cada decisão ou ferramenta sugerida.\n\n💡 *Dica: Se a qualquer momento quiser ir mais direto ao ponto, basta me dizer "não precisa explicar tanto"!*\n\nPor onde você gostaria de começar agora?`;
        actions = [
          { label: '❓ O que posso fazer aqui?', actionType: 'ASK_WHAT_CAN_I_DO' },
          { label: '📚 Explorar Catálogo Didático', actionType: 'NAVIGATE_CATALOG' },
          { label: '🚀 Conhecer Meus Projetos', actionType: 'NAVIGATE_PROJECTS' },
          { label: '📖 Ver Banco de Estudos', actionType: 'NAVIGATE_STUDIES' },
        ];
      } else if (adj.targetLevel === 'INTERMEDIÁRIO') {
        responseText = `Excelente! Configurei seu perfil de interação como **INTERMEDIÁRIO** ⚡.\n\nNossa dinâmica manterá um equilíbrio estratégico entre ação e fundamentação:\n- **Decisões fundamentadas**: Explico trade-offs técnicos e motivos de escolhas relevantes, sem me prender a conceitos básicos que você já domina;\n- **Alternativas de ferramentas**: Sugiro IAs e abordagens comparativas para cada desafio;\n- **Aprofundamento sob demanda**: Detalho fluxos técnicos sempre que você solicitar;\n- **Agilidade operacional**: Assumo tarefas simples e cadastros quando você autorizar.\n\nComo posso apoiar seus projetos agora?`;
        actions = [
          { label: '🚀 Ir para Projetos', actionType: 'NAVIGATE_PROJECTS' },
          { label: '⚖️ Comparar IAs do Catálogo', actionType: 'OPEN_COMPARE' },
          { label: '📋 Planejar Construção', actionType: 'SWITCH_TO_PLANNING' },
          { label: '➕ Cadastrar Nova IA', actionType: 'OPEN_ADD_IA' },
        ];
      } else {
        // AVANÇADO
        responseText = `Entendido! Configurei seu perfil de interação como **AVANÇADO** 🚀.\n\nModo de alta densidade técnica e máxima eficiência ativado:\n- **Direto ao ponto**: Zero explicações conceituais básicas e sem preâmbulos desnecessários;\n- **Profundidade de engenharia**: Foco em arquitetura, APIs, automações, context windows, latência e custo;\n- **Autonomia operacional**: Maior iniciativa para tarefas de baixo risco no ecossistema;\n- **Decisões e otimizações**: Foco em trade-offs de infraestrutura, pipelines e escala.\n\nQual arquitetura ou projeto vamos analisar ou executar?`;
        actions = [
          { label: '🚀 Terminal de Projetos', actionType: 'NAVIGATE_PROJECTS' },
          { label: '🧪 Simular Sandbox Groq', actionType: 'SWITCH_TO_SIMULATION' },
          { label: '➕ Cadastrar Nova IA', actionType: 'OPEN_ADD_IA' },
          { label: '🧠 Memória Operacional & Métricas', actionType: 'OPEN_MEMORY_MODAL' },
        ];
      }

      const durationMs = Date.now() - startTime;
      return {
        mode: activeMode,
        intent: 'atualizacao_projeto',
        intentDetails: intentResult,
        context: {
          projectId: currentProject?.id,
          projectTitle: currentProject?.name,
          currentVersion: 'V1',
          currentStage: currentProject?.currentStage,
          objective: currentProject?.objective,
          currentProblems: [],
          nextSteps: [],
          relatedStudies: [],
          summaryForAI: '',
        },
        routing: {
          recommendedModel: {
            modelId: 'gemini-2.5-flash',
            modelName: 'Gemini 2.5 Flash',
            provider: 'GEMINI',
            costTier: 'FREE',
            specialtyMatch: 'Geral e Calibração',
            reasoning: 'Rápido e preciso para preferências do usuário',
          },
          alternativeModels: [
            {
              modelId: 'llama-3.3-70b-versatile',
              modelName: 'Llama 3.3 70B',
              provider: 'GROQ',
              costTier: 'FREE',
              specialtyMatch: 'Fallback',
              reasoning: 'Alta velocidade',
            },
          ],
          taskType: 'GERAL',
          complexity: 'BAIXA',
          estimatedCost: 'GRATUITO',
          executionStrategy: 'FAST',
        },
        complexityAnalysis: {
          level: 1,
          levelName: 'SIMPLES',
          score: 10,
          factors: ['Calibração de perfil adaptativo'],
          recommendedProvider: 'GEMINI',
          recommendedModelId: 'gemini-2.5-flash',
          recommendedModelName: 'Gemini 2.5 Flash',
          reasoning: 'Calibração do perfil adaptativo do usuário',
        },
        providerUsed: 'GEMINI',
        modelUsed: 'gemini-2.5-flash',
        fallbackTriggered: false,
        replyText: responseText,
        validationReport: {
          status: 'resposta_validada',
          passed: true,
          score: 100,
          criteriaEvaluated: [
            { name: 'Perfil Adaptativo Calibrado', passed: true, details: 'Salvo com sucesso na memória do usuário.' },
          ],
          summary: `Perfil adaptativo atualizado para ${adj.targetLevel} com sucesso.`,
          recommendations: ['As próximas interações seguirão a profundidade e estilo selecionados.'],
        },
        suggestedActions: actions,
        durationMs,
      };
    } else if (adj.type === 'EXPLAIN_LIKE_BEGINNER') {
      currentAdaptiveProfile = await saveUserAdaptiveProfile({
        explanationDepth: 'detalhada',
        preferredInteractionStyle: 'orientador',
        lastExplicitAdjustment: 'EXPLAIN_LIKE_BEGINNER',
      });
      adaptiveAdjustmentNote =
        'O usuário solicitou explicitamente: "Explique como se eu estivesse começando / como iniciante". Reduza o nível de abstração, evite termos em inglês desnecessários, ensine os fundamentos com clareza e acolhimento didático.';
    } else if (adj.type === 'REDUCE_EXPLANATION') {
      currentAdaptiveProfile = await saveUserAdaptiveProfile({
        explanationDepth: 'objetiva',
        preferredInteractionStyle: 'direto',
        lastExplicitAdjustment: 'REDUCE_EXPLANATION',
      });
      adaptiveAdjustmentNote =
        'O usuário solicitou explicitamente: "Não precisa explicar tanto / vá direto ao ponto". Seja extremamente conciso, direto e sem introduções ou explicações conceituais.';
    } else if (adj.type === 'INCREASE_EXPLANATION') {
      currentAdaptiveProfile = await saveUserAdaptiveProfile({
        explanationDepth: 'detalhada',
        lastExplicitAdjustment: 'INCREASE_EXPLANATION',
      });
      adaptiveAdjustmentNote =
        'O usuário solicitou explicitamente: "Quero entender por que você fez isso / explique o motivo". Detalhe minuciosamente a lógica, justificativa e critérios da decisão técnica.';
    }
  }

  // Contexto de ferramentas (quando handlers estiverem disponíveis)
  const toolContext: HubToolContext | null =
    navigationHandlers && dataMutationHandlers
      ? {
          currentUserRole,
          currentRoute,
          currentSection,
          currentProject,
          allProjects,
          allIdeas,
          allStudies,
          catalog,
          navigationHandlers,
          dataMutationHandlers,
        }
      : null;

  // PASSO 3 & 4: RECUPERAR DA MEMÓRIA PERSISTENTE APENAS O CONTEXTO RELEVANTE (CONTEXT BUILDER CIRÚRGICO)
  const filteredContext: FilteredTaskContext = await buildFilteredTaskContext({
    userQuery: userMessage,
    targetProjectId: effectiveProjectId,
    allIdeas,
    allStudies,
  });

  const structuredContext: StructuredAssistantContext = {
    projectId: filteredContext.targetProject?.id || currentProject?.id,
    projectTitle: filteredContext.targetProject?.title || currentProject?.name,
    currentVersion: filteredContext.latestVersion,
    currentStage: filteredContext.targetProject?.stage || currentProject?.currentStage,
    projectDescription: filteredContext.targetProject?.description || currentProject?.description,
    objective: filteredContext.objective || currentProject?.objective,
    lastEvolution: filteredContext.recentChangesSummary[0],
    currentProblems: filteredContext.knownProblems,
    nextSteps: filteredContext.nextSteps,
    relatedStudies: filteredContext.relevantStudies.map((s) => ({
      theme: s.theme,
      level: s.level,
      progress: s.progress,
    })),
    summaryForAI: filteredContext.contextSummaryText,
  };

  // PASSO 2 & 5: SELEÇÃO INTELIGENTE DE MODELO (MODEL ROUTER)
  const isSimulation = activeMode === 'SIMULATION' || intentResult.isAskingForSimulation;
  const routeDecision: ModelRouteDecision = routeAITaskOrchestrated({
    userTask: userMessage,
    context: filteredContext,
    isSimulation,
    catalogIAs: catalog,
  });

  const legacyRouting = {
    recommendedModel: routeDecision.recommendedModel,
    alternativeModels: routeDecision.alternativeModels,
    taskType: routeDecision.complexity.level >= 3 ? ('CÓDIGO' as const) : ('GERAL' as const),
    complexity:
      routeDecision.complexity.level >= 3
        ? ('ALTA' as const)
        : routeDecision.complexity.level === 2
        ? ('MÉDIA' as const)
        : ('BAIXA' as const),
    estimatedCost: 'GRATUITO' as const,
    executionStrategy: routeDecision.executionStrategy,
  };

  // FLUXO ESPECÍFICO 1: SIMULAÇÃO ISOLADA EM SANDBOX GROQ
  if (isSimulation) {
    const simResult = await executeScenarioSimulation({
      objective: userMessage,
      context: structuredContext,
      modelId: routeDecision.modelId,
    });

    const durationMs = Date.now() - startTime;
    return {
      mode: 'SIMULATION',
      intent: intentResult.intent,
      intentDetails: intentResult,
      context: structuredContext,
      routing: legacyRouting,
      complexityAnalysis: routeDecision.complexity,
      providerUsed: 'GROQ',
      modelUsed: simResult.modelUsed,
      fallbackTriggered: false,
      replyText: `### 🧪 SIMULAÇÃO DE CENÁRIO (SANDBOX GROQ)\n\n*⚠️ Aviso Importante: Este é um resultado de simulação virtual preditiva, não uma execução em produção.*\n\n${simResult.simulatedOutput}\n\n**Pontos Fortes Identificados:**\n${simResult.simulatedStrengths.map((s) => `- ${s}`).join('\n')}\n\n**Riscos & Gargalos Analisados:**\n${simResult.simulatedRisks.map((r) => `- ${r}`).join('\n')}`,
      simulationResult: simResult,
      validationReport: {
        status: 'resposta_validada',
        passed: true,
        score: 100,
        criteriaEvaluated: [
          { name: 'Simulação Virtual em Sandbox', passed: true, details: 'Cenário simulado sem alterar o projeto definitivo.' },
        ],
        summary: 'Simulação virtual concluída no motor de alta velocidade Groq.',
        recommendations: ['Avaliar os riscos antes de aplicar no projeto real.'],
      },
      suggestedActions: [
        { label: '📋 Transformar em Plano Estruturado', actionType: 'SWITCH_TO_PLANNING' },
        ...(effectiveProjectId ? [{ label: '💾 Registrar Aprendizado no Diário', actionType: 'OPEN_LEARNING_MODAL', target: effectiveProjectId }] : []),
      ],
      durationMs,
    };
  }

  // FLUXO ESPECÍFICO 2: PLANEJAMENTO ESTRUTURADO (GEMINI PRINCIPAL)
  if (activeMode === 'PLANNING' || intentResult.isAskingForPlanning) {
    const plan = buildStructuredTaskPlan({
      objective: userMessage,
      projectName: structuredContext.projectTitle,
      contextSummary: structuredContext.summaryForAI,
    });

    const replyText = `### 📋 Plano Operacional Estruturado\n\n**Objetivo:** ${plan.objective}\n${structuredContext.projectTitle ? `*Vinculado ao Projeto: ${structuredContext.projectTitle}*\n` : ''}\n${plan.steps.map((stg) => `**Etapa ${stg.stepNumber}: ${stg.title}**\n- Entregável: ${stg.deliverable}\n- IA Recomendada: \`${stg.toolRecommendation}\`\n- Validação: ${stg.testsValidation}`).join('\n\n')}\n\n**Critérios de Teste:** ${plan.testingCriteria}\n**Notas Técnicas:** ${plan.productionNotes}\n**Próxima Evolução:** ${plan.nextEvolution}`;

    const durationMs = Date.now() - startTime;
    return {
      mode: 'PLANNING',
      intent: 'pedido_planejamento',
      intentDetails: intentResult,
      context: structuredContext,
      routing: legacyRouting,
      complexityAnalysis: routeDecision.complexity,
      providerUsed: 'GEMINI',
      modelUsed: 'gemini-2.5-pro',
      fallbackTriggered: false,
      replyText,
      plan,
      suggestedActions: [
        { label: '🧪 Simular Cenário com Groq', actionType: 'SIMULATE_CURRENT_PLAN' },
        { label: '✨ Copiar Prompt da Etapa 1', actionType: 'COPY_PROMPT_STEP_1', payload: plan.steps[0]?.prompt },
        ...(structuredContext.projectId
          ? [{ label: `💾 Adotar no Projeto "${structuredContext.projectTitle}"`, actionType: 'APPLY_PLAN_TO_PROJECT', target: structuredContext.projectId, payload: plan }]
          : []),
      ],
      durationMs,
    };
  }

  // FLUXO ESPECÍFICO 3: DETECÇÃO DE NOVA IDEIA (Com confirmação explícita do usuário)
  if (intentResult.detectedNewIdea && !effectiveProjectId && !intentResult.isAskingToRegisterAI) {
    const candidate = intentResult.detectedNewIdea;
    const replyText = `Percebi que você compartilhou uma nova ideia promissora:\n\n**Título Sugerido:** ${candidate.suggestedTitle}\n**Categoria:** ${candidate.category}\n**Descrição:** "${candidate.description}"\n\n**Quer que eu registre essa ideia no HUB?**\nAssim podemos acompanhar sua evolução desde o estágio inicial, criar planos de ação e relacionar com estudos.`;

    const durationMs = Date.now() - startTime;
    return {
      mode: 'CONVERSATION',
      intent: 'ideia',
      intentDetails: intentResult,
      context: structuredContext,
      routing: legacyRouting,
      complexityAnalysis: routeDecision.complexity,
      providerUsed: 'GEMINI',
      modelUsed: 'gemini-2.5-flash',
      fallbackTriggered: false,
      replyText,
      pendingConfirmation: {
        type: 'REGISTER_NEW_IDEA',
        title: candidate.suggestedTitle,
        description: candidate.description,
        suggestedPayload: {
          title: candidate.suggestedTitle,
          description: candidate.description,
          category: candidate.category,
        },
        promptQuestion: 'Deseja confirmar o cadastro desta ideia na Central de Projetos?',
      },
      suggestedActions: [
        { label: '✅ Sim, Registrar no HUB', actionType: 'CONFIRM_REGISTER_IDEA', payload: candidate },
        { label: '✏️ Ajustar antes de salvar', actionType: 'EDIT_IDEA_BEFORE_SAVING', payload: candidate },
      ],
      durationMs,
    };
  }

  // PASSO 6: MONTAR O CONTEXTO/PROMPT COM CAPACIDADES, FERRAMENTAS E CONTEXTO DA TELA
  const builtPrompt = buildDynamicPrompt({
    userTask: userMessage,
    context: filteredContext,
    complexity: routeDecision.complexity,
    activeMode,
    provider: routeDecision.provider,
    modelId: routeDecision.modelId,
    catalog,
    currentRoute,
    currentSection,
    currentProject,
    currentUserRole,
    adaptiveProfile: currentAdaptiveProfile,
    adaptiveAdjustmentNote,
    history,
  });

  // PASSO 7: EXECUTAR A TAREFA VIA /api/orchestrate (COM FALLBACK TRANSPARENTE)
  let replyText = '';
  let providerUsed: 'GEMINI' | 'GROQ' = routeDecision.provider;
  let modelUsed: string = routeDecision.modelName;
  let fallbackTriggered = false;
  let parsedToolCall: { name: string; params: any } | null = null;

  try {
    const response = await fetch('/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: routeDecision.provider,
        modelId: routeDecision.modelId,
        systemPrompt: builtPrompt.systemPrompt,
        userPrompt: builtPrompt.userPrompt,
        complexityLevel: routeDecision.complexity.level,
        activeMode,
        allowFallback: true,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        // Se a resposta vier estruturada (JSON parseado pelo orchestratorCore)
        const responseData = data.data;
        if (typeof responseData === 'object' && responseData !== null) {
          replyText = responseData.response || responseData.content || '';
          if (responseData.toolCall && responseData.toolCall.name) {
            parsedToolCall = {
              name: responseData.toolCall.name,
              params: responseData.toolCall.parameters || responseData.toolCall.params || {},
            };
          }
        }
        if (!replyText) {
          replyText = data.text || JSON.stringify(responseData);
        }

        providerUsed = data.providerUsed || routeDecision.provider;
        modelUsed = data.modelUsed || routeDecision.modelId;
        fallbackTriggered = Boolean(data.fallbackTriggered);
      } else {
        throw new Error(data.error || 'Resposta sem dados do orquestrador');
      }
    } else {
      throw new Error(`Servidor retornou status ${response.status}`);
    }
  } catch (err: any) {
    console.warn('[AssistantEngine] Falha na API de orquestração, operando com motor inteligente contextual:', err?.message || err);
    fallbackTriggered = true;

    // Resposta contextual de fallback baseada na tela e no projeto
    if (intentResult.isAskingForSystemHelp) {
      if (currentRoute === 'projects' && currentProject) {
        replyText = `Você está dentro do **Agente Executor do Projeto "${currentProject.name}"**.\n\n**O que você pode fazer nesta tela:**\n- Debater estratégia e código diretamente com a IA no Terminal de Debate;\n- Criar, priorizar e concluir **Missões de Trabalho** na coluna central;\n- Tomar e documentar **Decisões Técnicas** com justificativa;\n- Visualizar a **Próxima Ação Imediata** recomendada;\n- Acompanhar a régua da **Jornada de Maturidade** do projeto.\n\nSua próxima ação registrada é: **"${currentProject.nextAction || 'Definir primeiro entregável'}"**.`;
      } else if (currentRoute === 'catalog') {
        replyText = `Você está no **Catálogo de IAs do Hub**.\n\n**O que você pode fazer nesta tela:**\n- Explorar mais de ${catalog.length} ferramentas categorizadas;\n- Filtrar por especialidade (Código, Imagem, Texto, Produtividade, etc.);\n- Filtrar por nível de experiência ou modelo de preço;\n- Clicar em qualquer card para abrir a **Ficha Operacional detalhada**;\n- Selecionar até 2 IAs para comparação lado a lado;\n- Cadastrar uma nova IA clicando no botão "+ Cadastrar IA" ou pedindo para mim: *"Cadastre o Claude"*!`;
      } else if (currentRoute === 'projects') {
        replyText = `Você está na área de **Gestão de Projetos Estratégicos**.\n\n**O que você pode fazer nesta tela:**\n- Visualizar todos os seus projetos divididos pelo funil de maturidade;\n- Criar novos projetos com objetivo e resultado esperado claros;\n- Clicar em qualquer projeto para abrir o **Agente Executor**, missões e decisões;\n- Acompanhar percentuais de progresso e próximas ações.`;
      } else {
        replyText = `Você está na visão **"${currentRoute}"** do Hub.\n\nSou o **Auxiliar Mestre do Hub 2.0**. Posso guiar você em qualquer área do sistema, sugerir a melhor IA para sua tarefa, abrir projetos existentes ou cadastrar novas ferramentas no catálogo. Como posso te ajudar agora?`;
      }
    } else if (currentProject) {
      replyText = `Com base no projeto ativo **"${currentProject.name}"** (Etapa: ${currentProject.currentStage}, ${currentProject.progress}% concluído):\n\n- **Objetivo:** ${currentProject.objective || currentProject.description}\n- **Próxima Ação:** ${currentProject.nextAction || 'Não definida'}\n- **Ferramentas Vinculadas:** ${currentProject.aiTools?.join(', ') || 'Nenhuma'}\n\nPara avançar na maturidade deste projeto, recomendo focar na próxima ação imediata. Deseja debater essa etapa com o Executor?`;
    } else {
      replyText = `Olá! Sou o **Auxiliar Mestre do Hub 2.0**.\n\nConheço todas as telas e recursos do ecossistema. Posso ajudar você a:\n- **Navegar**: *"Me leve aos projetos"*, *"Abrir catálogo"*, *"Ver estudos"*\n- **Executar Projetos**: *"Abra o projeto [Nome]"*, *"O que faço agora?"*\n- **Consultar e Cadastrar IAs**: *"Qual IA usar para código?"*, *"Cadastre esta IA: Cursor"*\n- **Compreender o Hub**: *"O que posso fazer aqui?"*, *"Como funciona o roadmap?"*`;
    }
  }

  // PASSO 8: EXECUÇÃO CONTROLADA DE FERRAMENTAS (HUB TOOL LAYER)
  let toolExecution: ToolExecutionResult | undefined;

  // Decide qual toolCall executar: a identificada pelo modelo OU a identificada com alta confiança pelo analisador de intenção
  const toolToRun =
    parsedToolCall ||
    (intentResult.suggestedToolCall && intentResult.confidence >= 0.9 ? intentResult.suggestedToolCall : null);

  if (toolToRun && toolContext) {
    publishHubEvent('executor_started', {
      toolName: toolToRun.name,
      params: toolToRun.params,
    });

    try {
      toolExecution = await executeHubTool(toolToRun.name, toolToRun.params, toolContext);

      // Se a ferramenta foi executada com sucesso, complementamos a resposta para o usuário de forma elegante
      if (toolExecution.success) {
        publishHubEvent('executor_completed', {
          toolName: toolToRun.name,
          result: toolExecution,
        });

        if (toolToRun.name === 'create_ai_entry') {
          replyText = `⚡ **IA Cadastrada com Sucesso!**\n\n${toolExecution.message}\n\nA nova ferramenta já está disponível no catálogo e pronta para ser utilizada nos seus projetos e estudos.`;
        } else if (toolToRun.name === 'open_project') {
          replyText = `📂 **Abrindo Projeto...**\n\n${toolExecution.message}\n\n${replyText}`;
        } else if (toolToRun.name === 'navigate_to') {
          replyText = `🧭 **Navegação Realizada**\n\n${toolExecution.message}\n\n${replyText}`;
        }
      } else if (toolExecution.message) {
        publishHubEvent('executor_failed', {
          toolName: toolToRun.name,
          error: toolExecution.message,
        });

        // Se houve erro ou aviso de permissão/duplicidade na ferramenta
        if (toolToRun.name === 'create_ai_entry' && toolExecution.message.includes('já está cadastrada')) {
          replyText = `ℹ️ **Verificação de Catálogo:**\n\n${toolExecution.message}\n\nVocê pode consultar a ficha dela no Catálogo de IAs.`;
        }
      }
    } catch (toolErr: any) {
      console.warn('[AssistantEngine] Erro ao executar ferramenta do Hub:', toolErr);
      publishHubEvent('executor_failed', {
        toolName: toolToRun.name,
        error: toolErr.message || 'Falha na execução da ferramenta',
      });
    }
  }

  // PASSO 9: VALIDAR SE O RESULTADO ATENDE AO OBJETIVO
  const validationReport = validateExecutionOutput({
    rawOutput: replyText,
    expectedDeliverable: 'Resposta contextualizada, rigorosa e acionável',
  });

  // PASSO 10: REGISTRAR O RESULTADO E A EVOLUÇÃO NA MEMÓRIA EXISTENTE
  const durationMs = Date.now() - startTime;
  const executionRecordId = `exec-${Date.now()}`;
  const record: OperationalExecutionRecord = {
    id: executionRecordId,
    projectId: structuredContext.projectId,
    projectTitle: structuredContext.projectTitle,
    mode: activeMode,
    isSimulation: false,
    taskTitle: userMessage.slice(0, 70),
    intent: intentResult.intent,
    modelUsed: `${providerUsed}: ${modelUsed}`,
    prompt: userMessage,
    result: replyText,
    status: validationReport.status,
    validationNotes: `Nível ${routeDecision.complexity.level} (${routeDecision.complexity.levelName}). Fallback: ${fallbackTriggered ? 'Sim' : 'Não'}. Validação: ${validationReport.summary}`,
    nextStep: structuredContext.nextSteps[0],
    durationMs,
    estimatedTimeSavedMin: routeDecision.complexity.level >= 3 ? 25 : 10,
    costUsd: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveExecutionRecord(record);
  } catch (e) {
    console.warn('[AssistantEngine] Não foi possível persistir execução no Firestore:', e);
  }

  // PASSO 11: CONTINUAR O FLUXO COM PRÓXIMAS AÇÕES SUGERIDAS (MANTENDO O USUÁRIO NO CONTROLE)
  // O Motor de Iniciativa considera o perfil: Iniciante (orientação/aprendizagem), Intermediário (equilibrado), Avançado (objetivo)
  const suggestedActions: AssistantEngineResponse['suggestedActions'] = [];
  const userLevel = currentAdaptiveProfile?.aiExperienceLevel || 'INTERMEDIÁRIO';

  if (currentProject) {
    suggestedActions.push({
      label: `💡 Ver Projeto "${currentProject.name}"`,
      actionType: 'OPEN_PROJECT_DETAIL',
      target: currentProject.id,
    });
    suggestedActions.push({
      label: '🧪 Simular Próximo Passo',
      actionType: 'SWITCH_TO_SIMULATION',
    });
    if (userLevel === 'INICIANTE') {
      suggestedActions.push({
        label: '❓ O que posso fazer nesta etapa?',
        actionType: 'ASK_WHAT_CAN_I_DO',
      });
    } else {
      suggestedActions.push({
        label: '📝 Registrar Aprendizado no Diário',
        actionType: 'OPEN_LEARNING_MODAL',
        target: currentProject.id,
      });
    }
  } else if (currentRoute === 'catalog') {
    suggestedActions.push({
      label: '➕ Cadastrar Nova IA',
      actionType: 'OPEN_ADD_IA',
    });
    suggestedActions.push({
      label: '⚖️ Comparar IAs',
      actionType: 'OPEN_COMPARE',
    });
    if (userLevel === 'INICIANTE') {
      suggestedActions.push({
        label: '📚 Ver Recursos de Estudo',
        actionType: 'NAVIGATE_STUDIES',
      });
    } else {
      suggestedActions.push({
        label: '🚀 Ir para Projetos',
        actionType: 'NAVIGATE_PROJECTS',
      });
    }
  } else {
    suggestedActions.push({
      label: '🚀 Ir para Projetos',
      actionType: 'NAVIGATE_PROJECTS',
    });
    if (userLevel === 'INICIANTE') {
      suggestedActions.push({
        label: '📚 Ver Recursos de Estudo',
        actionType: 'NAVIGATE_STUDIES',
      });
      suggestedActions.push({
        label: '❓ O que posso fazer aqui no Hub?',
        actionType: 'ASK_WHAT_CAN_I_DO',
      });
    } else {
      suggestedActions.push({
        label: '📚 Explorar Catálogo',
        actionType: 'NAVIGATE_CATALOG',
      });
      suggestedActions.push({
        label: '📋 Planejar Construção',
        actionType: 'SWITCH_TO_PLANNING',
      });
    }
  }

  return {
    mode: activeMode,
    intent: intentResult.intent,
    intentDetails: intentResult,
    context: structuredContext,
    routing: legacyRouting,
    complexityAnalysis: routeDecision.complexity,
    providerUsed,
    modelUsed,
    fallbackTriggered,
    replyText,
    toolExecution,
    validationReport,
    suggestedActions,
    executionRecordId,
    durationMs,
  };
}
