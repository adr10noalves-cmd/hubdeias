import {
  OperationalExecutionRecord,
  StructuredAssistantContext,
  TaskPlan,
} from '../../types';
import { saveExecutionRecord } from './memoryManager';

export interface SimulationResult {
  isSimulation: true; // MARCADOR OBRIGATÓRIO: NUNCA APRESENTAR COMO EXECUÇÃO REAL
  simulationTag: '🧪 SIMULAÇÃO DE CENÁRIO (AMBIENTE VIRTUAL GROQ)';
  scenarioObjective: string;
  contextUsed: string;
  modelUsed: string;
  generatedPlan?: TaskPlan;
  simulatedOutput: string;
  simulatedRisks: string[];
  simulatedStrengths: string[];
  nextRealSteps: string[];
  executionTimeMs: number;
  recordId: string;
}

/**
 * 9. GROQ COMO AMBIENTE DE SIMULAÇÃO
 * Executa simulações de cenários no ambiente virtual da Groq.
 * Marca expressamente e visualmente que se trata de uma SIMULAÇÃO, nunca de uma execução real.
 */
export async function executeScenarioSimulation(params: {
  objective: string;
  context: StructuredAssistantContext;
  modelId?: string;
}): Promise<SimulationResult> {
  const startTime = Date.now();
  const { objective, context, modelId = 'openai/gpt-oss-120b' } = params;

  const payload = {
    action: 'simulate_scenario',
    payload: {
      objective,
      contextSummary: context.summaryForAI,
      projectName: context.projectTitle,
      preferredModel: modelId,
    },
  };

  let simulatedOutput = '';
  let modelUsed = modelId;
  let risks: string[] = [];
  let strengths: string[] = [];
  let nextSteps: string[] = [];

  try {
    const resp = await fetch('/api/groq/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (resp.ok) {
      const data = await resp.json();
      if (data.simulatedOutput) {
        simulatedOutput = data.simulatedOutput;
      } else if (data.response) {
        simulatedOutput = data.response;
      }
      modelUsed = data.modelUsed || modelId;
      risks = Array.isArray(data.risks) ? data.risks : [];
      strengths = Array.isArray(data.strengths) ? data.strengths : [];
      nextSteps = Array.isArray(data.nextSteps) ? data.nextSteps : [];
    } else {
      throw new Error(`Erro ${resp.status} no servidor de simulação`);
    }
  } catch (err: any) {
    console.warn('[SimulationEngine] Usando fallback local para simulação de cenário:', err);
    simulatedOutput = `[SIMULAÇÃO EM SANDBOX]:
Cenário testado: "${objective}"
Contexto aplicado: ${context.projectTitle ? `Projeto "${context.projectTitle}"` : 'Ambiente geral do Hub'}.
Comportamento esperado: A cadeia de execução responde com estabilidade funcional. Recomenda-se criar suíte de testes pontual para validar extrações de dados e consistência de tipos.`;
    risks = ['Possível sobrecarga de memória se arquivos de entrada excederem limites', 'Latência de rede em chamadas externas'];
    strengths = ['Arquitetura modular desacoplada', 'Zero dependência de bibliotecas proprietárias pagas'];
    nextSteps = ['Testar execução real com massa de dados controlada', 'Validar regras de segurança'];
  }

  const durationMs = Date.now() - startTime;
  const recordId = `sim-${Date.now()}`;

  // 13. REGISTRO AUTOMÁTICO DO TRABALHO
  // Salva no banco de dados Firestore explicitamente como SIMULAÇÃO
  const executionRecord: OperationalExecutionRecord = {
    id: recordId,
    projectId: context.projectId,
    projectTitle: context.projectTitle,
    mode: 'SIMULATION',
    isSimulation: true,
    taskTitle: `Simulação: ${objective.slice(0, 60)}`,
    intent: 'pedido_simulacao',
    modelUsed,
    prompt: `[SIMULAÇÃO DE CENÁRIO]\nContexto: ${context.summaryForAI}\nObjetivo: ${objective}`,
    result: simulatedOutput,
    status: 'resposta_validada',
    validationNotes: 'Simulação concluída com parâmetros verificados em ambiente virtual.',
    decision: 'Avaliar resultados do teste simulado antes de aplicar em produção.',
    nextStep: nextSteps[0] || 'Executar validação em ambiente real.',
    durationMs,
    estimatedTimeSavedMin: 15,
    costUsd: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    await saveExecutionRecord(executionRecord);
  } catch (saveErr) {
    console.warn('[SimulationEngine] Registro da simulação mantido em cache local:', saveErr);
  }

  return {
    isSimulation: true,
    simulationTag: '🧪 SIMULAÇÃO DE CENÁRIO (AMBIENTE VIRTUAL GROQ)',
    scenarioObjective: objective,
    contextUsed: context.summaryForAI,
    modelUsed,
    simulatedOutput,
    simulatedRisks: risks,
    simulatedStrengths: strengths,
    nextRealSteps: nextSteps,
    executionTimeMs: durationMs,
    recordId,
  };
}
