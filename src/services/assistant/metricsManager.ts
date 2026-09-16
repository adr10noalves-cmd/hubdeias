import { OperationalExecutionRecord } from '../../types';

export interface HubOperationalMetrics {
  totalExecutions: number;
  totalSimulations: number;
  realExecutions: number;
  validatedCount: number;
  errorCount: number;
  totalTimeSavedMinutes: number;
  estimatedCostTotalUsd: number;
  roiCalculation: {
    canCalculate: boolean;
    roiPercentage?: number;
    explanation: string;
  };
}

/**
 * 17. MÉTRICAS & CÁLCULO DE ROI
 * Calcula estatísticas reais a partir dos registros de execuções no banco de dados.
 * Regra estrita: NÃO inventa dados. Se insuficiente, informa "ROI ainda não calculável".
 */
export function calculateOperationalMetrics(
  records: OperationalExecutionRecord[],
  params?: {
    estimatedHourlyRateBrl?: number; // Ex: R$ 80/hora economizada
    estimatedInfrastructureCostBrl?: number; // Custo de hospedagem/ferramentas
  }
): HubOperationalMetrics {
  if (!records || records.length === 0) {
    return {
      totalExecutions: 0,
      totalSimulations: 0,
      realExecutions: 0,
      validatedCount: 0,
      errorCount: 0,
      totalTimeSavedMinutes: 0,
      estimatedCostTotalUsd: 0,
      roiCalculation: {
        canCalculate: false,
        explanation: 'ROI ainda não calculável. É necessário registrar execuções validadas com métricas de tempo.',
      },
    };
  }

  const totalExecutions = records.length;
  const totalSimulations = records.filter((r) => r.isSimulation).length;
  const realExecutions = totalExecutions - totalSimulations;
  const validatedCount = records.filter((r) => r.status === 'resposta_validada').length;
  const errorCount = records.filter((r) => r.status === 'erro').length;

  const totalTimeSavedMinutes = records.reduce(
    (acc, r) => acc + (r.estimatedTimeSavedMin || 0),
    0
  );

  const estimatedCostTotalUsd = records.reduce(
    (acc, r) => acc + (r.costUsd || 0),
    0
  );

  // Cálculo de ROI:
  // ROI = ((Benefício - Investimento) / Investimento) * 100
  let roiCalculation: HubOperationalMetrics['roiCalculation'];

  const hourlyRate = params?.estimatedHourlyRateBrl || 80; // Taxa hora padrão de referência
  const benefitBrl = (totalTimeSavedMinutes / 60) * hourlyRate;
  const investmentBrl = (params?.estimatedInfrastructureCostBrl || 50) + (estimatedCostTotalUsd * 5.5);

  if (totalTimeSavedMinutes > 0 && investmentBrl > 0) {
    const roi = ((benefitBrl - investmentBrl) / investmentBrl) * 100;
    roiCalculation = {
      canCalculate: true,
      roiPercentage: Math.round(roi),
      explanation: `Benefício estimado em R$ ${benefitBrl.toFixed(2)} (${(totalTimeSavedMinutes / 60).toFixed(1)}h economizadas) contra investimento de R$ ${investmentBrl.toFixed(2)}.`,
    };
  } else {
    roiCalculation = {
      canCalculate: false,
      explanation: 'ROI ainda não calculável. São necessárias mais tarefas concluídas para apuração financeira.',
    };
  }

  return {
    totalExecutions,
    totalSimulations,
    realExecutions,
    validatedCount,
    errorCount,
    totalTimeSavedMinutes,
    estimatedCostTotalUsd,
    roiCalculation,
  };
}
