import { ExecutionValidationStatus } from '../../types';

export interface ValidationReport {
  status: ExecutionValidationStatus;
  passed: boolean;
  score: number; // 0-100
  criteriaEvaluated: Array<{
    name: string;
    passed: boolean;
    details: string;
  }>;
  summary: string;
  recommendations: string[];
}

/**
 * 12. EXECUÇÃO E VALIDAÇÃO
 * Avalia o resultado retornado por um modelo ou operação,
 * garantindo que não consideramos tarefa concluída apenas porque houve resposta HTTP 200.
 */
export function validateExecutionOutput(params: {
  rawOutput: string;
  expectedDeliverable?: string;
  hasError?: boolean;
  errorMessage?: string;
}): ValidationReport {
  const { rawOutput, expectedDeliverable, hasError, errorMessage } = params;

  if (hasError || !rawOutput || rawOutput.trim().length === 0) {
    return {
      status: 'erro',
      passed: false,
      score: 0,
      criteriaEvaluated: [
        { name: 'Disponibilidade de Resposta', passed: false, details: errorMessage || 'Nenhuma resposta válida recebida.' },
      ],
      summary: 'A execução falhou ou retornou conteúdo vazio.',
      recommendations: ['Tentar novamente com modelo alternativo', 'Verificar conectividade do servidor'],
    };
  }

  const text = rawOutput.trim();
  const criteriaEvaluated: ValidationReport['criteriaEvaluated'] = [];

  // Critério 1: Extensão mínima e consistência textual
  const hasMinLength = text.length >= 80;
  criteriaEvaluated.push({
    name: 'Profundidade Mínima do Conteúdo',
    passed: hasMinLength,
    details: hasMinLength ? `Texto com ${text.length} caracteres.` : 'Texto excessivamente curto ou vago.',
  });

  // Critério 2: Ausência de placeholders não resolvidos
  const hasPlaceholders = text.includes('TODO') || text.includes('[INSERIR AQUI]') || text.includes('[PREENCHER]');
  criteriaEvaluated.push({
    name: 'Conclusão Sem Pendências Explícitas',
    passed: !hasPlaceholders,
    details: hasPlaceholders ? 'A resposta contém trechos marcados para preenchimento manual.' : 'Nenhum placeholder pendente detectado.',
  });

  // Critério 3: Estrutura lógica e divisão em seções
  const hasStructure = text.includes('\n') && (text.includes('#') || text.includes('-') || text.includes(':'));
  criteriaEvaluated.push({
    name: 'Estruturação e Legibilidade',
    passed: hasStructure,
    details: hasStructure ? 'Conteúdo formatado com divisão lógica e tópicos.' : 'Texto em bloco único sem formatação estruturada.',
  });

  // Critério 4: Alinhamento com o entregável esperado (se fornecido)
  let deliverableMatch = true;
  if (expectedDeliverable) {
    const expWords = expectedDeliverable.toLowerCase().split(' ').filter((w) => w.length > 4);
    const matchedCount = expWords.filter((w) => text.toLowerCase().includes(w)).length;
    deliverableMatch = expWords.length === 0 || matchedCount >= 1;
    criteriaEvaluated.push({
      name: 'Aderência ao Entregável Solicitado',
      passed: deliverableMatch,
      details: deliverableMatch ? 'Conteúdo alinhado aos termos do entregável.' : 'Possível desvio do entregável esperado.',
    });
  }

  const passedCount = criteriaEvaluated.filter((c) => c.passed).length;
  const score = Math.round((passedCount / criteriaEvaluated.length) * 100);

  let status: ExecutionValidationStatus = 'resposta_recebida';
  let summary = 'Resposta recebida da IA e aguardando conferência final.';
  const recommendations: string[] = [];

  if (score >= 80 && !hasPlaceholders) {
    status = 'resposta_validada';
    summary = 'Execução validada com sucesso segundo os critérios operacionais.';
  } else if (hasPlaceholders || score < 60) {
    status = 'execucao_incompleta';
    summary = 'A resposta foi recebida mas apresenta lacunas ou requisitos incompletos.';
    recommendations.push('Solicitar refinamento focado nos pontos pendentes.');
  }

  return {
    status,
    passed: status === 'resposta_validada',
    score,
    criteriaEvaluated,
    summary,
    recommendations,
  };
}
