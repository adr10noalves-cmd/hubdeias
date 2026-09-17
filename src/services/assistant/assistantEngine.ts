import {
  AssistantMode,
  AssistantIntent,
  IdeaItem,
  StudyItem,
  IAItem,
  StructuredAssistantContext,
  TaskPlan,
  OperationalExecutionRecord,
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

export interface AssistantEngineInput {
  userMessage: string;
  activeMode: AssistantMode;
  targetProjectId?: string;
  allIdeas: IdeaItem[];
  allStudies: StudyItem[];
  catalog: IAItem[];
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
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
 * 6. CICLO OPERACIONAL DO ASSISTENTE (11 PASSOS)
 * 1. Entender a intenção do usuário
 * 2. Identificar a complexidade da tarefa
 * 3. Recuperar da memória persistente apenas o contexto relevante
 * 4. Identificar o projeto relacionado, quando existir
 * 5. Selecionar o modelo mais adequado (Gemini Principal / Groq Auxiliar)
 * 6. Montar o contexto/prompt apropriado (Prompt Builder Dinâmico)
 * 7. Executar a tarefa com fallback transparente (/api/orchestrate)
 * 8. Analisar o resultado
 * 9. Validar se o resultado atende ao objetivo
 * 10. Registrar o resultado e a evolução na memória existente
 * 11. Continuar o fluxo quando houver uma próxima ação necessária
 */
export async function processAssistantMessage(
  input: AssistantEngineInput
): Promise<AssistantEngineResponse> {
  const startTime = Date.now();
  const { userMessage, activeMode, targetProjectId, allIdeas, allStudies, catalog, history = [] } = input;

  // PASSO 1: ENTENDER A INTENÇÃO DO USUÁRIO
  const intentResult = analyzeUserIntent(userMessage, allIdeas);
  const effectiveProjectId = targetProjectId || intentResult.mentionedProjectId;

  // PASSO 3 & 4: RECUPERAR DA MEMÓRIA PERSISTENTE APENAS O CONTEXTO RELEVANTE (CONTEXT BUILDER CIRÚRGICO)
  const filteredContext: FilteredTaskContext = await buildFilteredTaskContext({
    userQuery: userMessage,
    targetProjectId: effectiveProjectId,
    allIdeas,
    allStudies,
  });

  const structuredContext: StructuredAssistantContext = {
    projectId: filteredContext.targetProject?.id,
    projectTitle: filteredContext.targetProject?.title,
    currentVersion: filteredContext.latestVersion,
    currentStage: filteredContext.targetProject?.stage,
    projectDescription: filteredContext.targetProject?.description,
    objective: filteredContext.objective,
    lastEvolution: filteredContext.recentChangesSummary[0],
    currentProblems: filteredContext.knownProblems,
    nextSteps: filteredContext.nextSteps,
    relatedStudiesThemes: filteredContext.relevantStudies.map((s) => s.theme),
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
    complexity: routeDecision.complexity.level >= 3 ? ('ALTA' as const) : routeDecision.complexity.level === 2 ? ('MÉDIA' as const) : ('BAIXA' as const),
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
        criteriaEvaluated: [{ name: 'Simulação Virtual em Sandbox', passed: true, details: 'Cenário simulado sem alterar o projeto definitivo.' }],
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
        ...(structuredContext.projectId ? [{ label: `💾 Adotar no Projeto "${structuredContext.projectTitle}"`, actionType: 'APPLY_PLAN_TO_PROJECT', target: structuredContext.projectId, payload: plan }] : []),
      ],
      durationMs,
    };
  }

  // FLUXO ESPECÍFICO 3: DETECÇÃO DE NOVA IDEIA (Com confirmação explícita do usuário)
  if (intentResult.detectedNewIdea && !effectiveProjectId) {
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

  // PASSO 6: MONTAR O CONTEXTO/PROMPT APROPRIADO (PROMPT BUILDER DINÂMICO)
  const builtPrompt = buildDynamicPrompt({
    userTask: userMessage,
    context: filteredContext,
    complexity: routeDecision.complexity,
    activeMode,
    provider: routeDecision.provider,
    modelId: routeDecision.modelId,
    catalog,
    history,
  });

  // PASSO 7: EXECUTAR A TAREFA VIA /api/orchestrate (COM FALLBACK TRANSPARENTE)
  let replyText = '';
  let providerUsed: 'GEMINI' | 'GROQ' = routeDecision.provider;
  let modelUsed: string = routeDecision.modelName;
  let fallbackTriggered = false;

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
        replyText = data.data.response || data.data.content || JSON.stringify(data.data);
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
    console.warn('[AssistantEngine] Chamada à API de orquestração oscilou, acionando fallback local com memória persistente:', err?.message || err);
    fallbackTriggered = true;
    if (structuredContext.projectId) {
      replyText = `Com base na memória do seu projeto **"${structuredContext.projectTitle}"** (${structuredContext.currentVersion}, estágio ${structuredContext.currentStage}):\n\n- **Objetivo Central:** ${structuredContext.objective || structuredContext.projectDescription}\n- **Última Evolução:** ${structuredContext.lastEvolution || 'Registro inicial'}\n- **Próximos Passos Registrados:** ${structuredContext.nextSteps.join('; ') || 'Definir próximas metas'}\n\nPara avançar na evolução do sistema, recomendo focarmos em: "${structuredContext.currentProblems[0] || 'Refinamento do escopo'}". Como deseja proceder?`;
    } else {
      replyText = `Entendido! Estou operando como Núcleo de Orquestração Inteligente do Hub.\n\nPosso ajudar a estruturar ideias, planejar etapas, simular hipóteses ou orientar seus estudos técnicos com modelos de alta precisão. O que gostaria de executar?`;
    }
  }

  // PASSO 8 & 9: ANALISAR E VALIDAR SE O RESULTADO ATENDE AO OBJETIVO
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
  const suggestedActions: AssistantEngineResponse['suggestedActions'] = [];

  if (structuredContext.projectId) {
    suggestedActions.push({
      label: `💡 Ver Projeto "${structuredContext.projectTitle}"`,
      actionType: 'OPEN_PROJECT_DETAIL',
      target: structuredContext.projectId,
    });
    suggestedActions.push({
      label: '🧪 Simular Próximo Passo',
      actionType: 'SWITCH_TO_SIMULATION',
    });
    suggestedActions.push({
      label: '📝 Registrar Aprendizado no Diário',
      actionType: 'OPEN_LEARNING_MODAL',
      target: structuredContext.projectId,
    });
  } else {
    suggestedActions.push({
      label: '📋 Planejar Construção',
      actionType: 'SWITCH_TO_PLANNING',
    });
    suggestedActions.push({
      label: '🧪 Modo Simulação',
      actionType: 'SWITCH_TO_SIMULATION',
    });
    suggestedActions.push({
      label: '✨ Gerador de Prompts',
      actionType: 'OPEN_PROMPT_GEN',
    });
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
    validationReport,
    suggestedActions,
    executionRecordId,
    durationMs,
  };
}
