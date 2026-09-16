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
import { buildContextualMemory, saveExecutionRecord } from './memoryManager';
import { analyzeUserIntent, IntentAnalysisResult } from './intentAnalyzer';
import { buildStructuredTaskPlan } from './taskPlanner';
import { routeAITask, RouterAnalysisResult } from './aiRouter';
import { executeScenarioSimulation, SimulationResult } from './simulationEngine';
import { validateExecutionOutput, ValidationReport } from './validationManager';

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
  routing: RouterAnalysisResult;
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
  modelUsed: string;
  durationMs: number;
}

/**
 * 22. ARQUITETURA MODULAR: Assistant Engine
 * Núcleo unificado de orquestração do HUB de IAs.
 */
export async function processAssistantMessage(
  input: AssistantEngineInput
): Promise<AssistantEngineResponse> {
  const startTime = Date.now();
  const { userMessage, activeMode, targetProjectId, allIdeas, allStudies, catalog, history = [] } = input;

  // 1. IDENTIFICA INTENÇÃO & PROJETOS MENCIONADOS
  const intentResult = analyzeUserIntent(userMessage, allIdeas);
  const effectiveProjectId = targetProjectId || intentResult.mentionedProjectId;

  // 2. RECUPERAÇÃO CONTEXTUAL DA MEMÓRIA PERSISTENTE
  const context = await buildContextualMemory({
    userQuery: userMessage,
    targetProjectId: effectiveProjectId,
    allIdeas,
    allStudies,
  });

  // 3. ROTEAMENTO INTELIGENTE DE IA
  const isSim = activeMode === 'SIMULATION' || intentResult.isAskingForSimulation;
  const routing = routeAITask({
    taskText: userMessage,
    isSimulation: isSim,
    catalogIAs: catalog,
  });

  // 4. FLUXO POR MODO

  // MODO A: SIMULAÇÃO
  if (isSim) {
    const simResult = await executeScenarioSimulation({
      objective: userMessage,
      context,
      modelId: routing.recommendedModel.modelId,
    });

    const durationMs = Date.now() - startTime;
    return {
      mode: 'SIMULATION',
      intent: intentResult.intent,
      intentDetails: intentResult,
      context,
      routing,
      replyText: `### 🧪 SIMULAÇÃO DE CENÁRIO (AMBIENTE GROQ)\n\n*Aviso: Este é um resultado de simulação virtual, não uma execução em produção.*\n\n${simResult.simulatedOutput}\n\n**Pontos Fortes Identificados:**\n${simResult.simulatedStrengths.map((s) => `- ${s}`).join('\n')}\n\n**Riscos & Cuidados:**\n${simResult.simulatedRisks.map((r) => `- ${r}`).join('\n')}`,
      simulationResult: simResult,
      validationReport: {
        status: 'resposta_validada',
        passed: true,
        score: 100,
        criteriaEvaluated: [{ name: 'Simulação Virtual em Sandbox', passed: true, details: 'Cenário processado e salvo como simulação.' }],
        summary: 'Simulação completada com êxito no ambiente Groq.',
        recommendations: ['Executar em ambiente real quando o planejamento estiver aprovado.'],
      },
      suggestedActions: [
        { label: '📋 Transformar em Plano de Etapas', actionType: 'SWITCH_TO_PLANNING' },
        { label: '💾 Registrar Próximo Passo no Projeto', actionType: 'SAVE_NEXT_STEP', target: effectiveProjectId },
      ],
      modelUsed: simResult.modelUsed,
      durationMs,
    };
  }

  // MODO B: PLANEJAMENTO
  if (activeMode === 'PLANNING' || intentResult.isAskingForPlanning) {
    const plan = buildStructuredTaskPlan({
      objective: userMessage,
      projectName: context.projectTitle,
      contextSummary: context.summaryForAI,
    });

    const replyText = `### 📋 Plano Operacional Estruturado\n\n**Objetivo:** ${plan.objective}\n${context.projectTitle ? `*Vinculado ao Projeto: ${context.projectTitle}*\n` : ''}\n${plan.steps.map((stg) => `**Etapa ${stg.stepNumber}: ${stg.title}**\n- Entregável: ${stg.deliverable}\n- IA Recomendada: \`${stg.toolRecommendation}\`\n- Teste de Validação: ${stg.testsValidation}`).join('\n\n')}\n\n**Critérios de Testes:** ${plan.testingCriteria}\n**Diretriz de Produção:** ${plan.productionNotes}\n**Próxima Evolução:** ${plan.nextEvolution}`;

    const durationMs = Date.now() - startTime;
    return {
      mode: 'PLANNING',
      intent: 'pedido_planejamento',
      intentDetails: intentResult,
      context,
      routing,
      replyText,
      plan,
      suggestedActions: [
        { label: '🧪 Simular Cenário com Groq', actionType: 'SIMULATE_CURRENT_PLAN' },
        { label: '✨ Copiar Prompt da Etapa 1', actionType: 'COPY_PROMPT_STEP_1', payload: plan.steps[0]?.prompt },
        ...(context.projectId ? [{ label: `💾 Adotar no Projeto "${context.projectTitle}"`, actionType: 'APPLY_PLAN_TO_PROJECT', target: context.projectId, payload: plan }] : []),
      ],
      modelUsed: routing.recommendedModel.modelName,
      durationMs,
    };
  }

  // MODO C: DETECÇÃO DE NOVA IDEIA (Confirmação obrigatória do usuário)
  if (intentResult.detectedNewIdea && !effectiveProjectId) {
    const candidate = intentResult.detectedNewIdea;
    const replyText = `Percebi que você compartilhou uma nova ideia promissora:\n\n**Título Sugerido:** ${candidate.suggestedTitle}\n**Categoria:** ${candidate.category}\n**Descrição:** "${candidate.description}"\n\n**Quer que eu registre essa ideia no HUB?**\nAssim podemos acompanhar sua evolução desde o estágio inicial, criar planos de ação e relacionar com estudos.`;

    const durationMs = Date.now() - startTime;
    return {
      mode: 'CONVERSATION',
      intent: 'ideia',
      intentDetails: intentResult,
      context,
      routing,
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
      modelUsed: routing.recommendedModel.modelName,
      durationMs,
    };
  }

  // MODO D: CONVERSAÇÃO / EVOLUÇÃO / EXECUÇÃO COM MEMÓRIA PERSISTENTE
  // Consulta o backend com o contexto inteligente injetado
  let replyText = '';
  let modelUsed = routing.recommendedModel.modelName;

  try {
    const resp = await fetch('/api/groq/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'central_chat',
        payload: {
          message: userMessage,
          history,
          catalog,
          contextSummary: context.summaryForAI,
          activeMode,
          intent: intentResult.intent,
        },
      }),
    });

    if (resp.ok) {
      const data = await resp.json();
      replyText = data.response || data.content || '';
      if (data.modelUsed) modelUsed = data.modelUsed;
    } else {
      throw new Error(`Erro ${resp.status}`);
    }
  } catch (err) {
    console.warn('[AssistantEngine] Chamada à API oscilou, gerando resposta com memória local:', err);
    if (context.projectId) {
      replyText = `Com base na memória do seu projeto **"${context.projectTitle}"** (${context.currentVersion}, estágio ${context.currentStage}):\n\n- **Objetivo Central:** ${context.objective || context.projectDescription}\n- **Última Evolução:** ${context.lastEvolution}\n- **Próximos Passos Sugeridos:** ${context.nextSteps.join('; ') || 'Definir próximas metas'}\n\nPara avançar, recomendo focarmos em: "${context.currentProblems[0] || 'Refinamento do escopo'}". O que gostaria de executar agora?`;
    } else {
      replyText = `Entendido! Estou operando como Núcleo de Orquestração do Hub.\n\nPosso ajudar a estruturar ideias, planejar etapas de desenvolvimento, simular cenários com modelos Groq ou acompanhar seus estudos. Como prefere começar?`;
    }
  }

  // Validação da Execução
  const validationReport = validateExecutionOutput({
    rawOutput: replyText,
    expectedDeliverable: 'Resposta contextualizada e acionável',
  });

  // Registro Operacional Automático
  const durationMs = Date.now() - startTime;
  const executionRecordId = `exec-${Date.now()}`;
  const record: OperationalExecutionRecord = {
    id: executionRecordId,
    projectId: context.projectId,
    projectTitle: context.projectTitle,
    mode: activeMode,
    isSimulation: false,
    taskTitle: userMessage.slice(0, 70),
    intent: intentResult.intent,
    modelUsed,
    prompt: userMessage,
    result: replyText,
    status: validationReport.status,
    validationNotes: validationReport.summary,
    nextStep: context.nextSteps[0],
    durationMs,
    estimatedTimeSavedMin: 10,
    costUsd: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveExecutionRecord(record);
  } catch (e) {
    console.warn('[AssistantEngine] Não foi possível persistir execução no banco:', e);
  }

  // Sugestões de ações contextuais
  const suggestedActions: AssistantEngineResponse['suggestedActions'] = [];

  if (context.projectId) {
    suggestedActions.push({
      label: `💡 Ver Projeto "${context.projectTitle}"`,
      actionType: 'OPEN_PROJECT_DETAIL',
      target: context.projectId,
    });
    suggestedActions.push({
      label: '🧪 Simular Próximo Passo',
      actionType: 'SWITCH_TO_SIMULATION',
    });
    suggestedActions.push({
      label: '📝 Registrar Aprendizado',
      actionType: 'OPEN_LEARNING_MODAL',
      target: context.projectId,
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
    context,
    routing,
    replyText,
    validationReport,
    suggestedActions,
    executionRecordId,
    modelUsed,
    durationMs,
  };
}
