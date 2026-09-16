import { TaskPlan, TaskPlanStep, ContextualPromptData } from '../../types';

/**
 * 7. PLANEJADOR
 * Transforma uma solicitação "Quero construir X" em um plano executável estruturado:
 * OBJETIVO -> ETAPA 1 -> ETAPA 2 -> ETAPA 3 -> TESTES -> VALIDAÇÃO -> PRODUÇÃO -> PRÓXIMA EVOLUÇÃO
 */
export function buildStructuredTaskPlan(params: {
  objective: string;
  projectName?: string;
  contextSummary?: string;
  suggestedSteps?: TaskPlanStep[];
}): TaskPlan {
  const { objective, projectName, contextSummary, suggestedSteps } = params;

  if (suggestedSteps && suggestedSteps.length > 0) {
    return {
      objective,
      steps: suggestedSteps,
      testingCriteria: 'Validação funcional com testes unitários, testes de carga pontuais e conferência de regras de negócio.',
      productionNotes: 'Garantir variáveis de ambiente no servidor, observabilidade e isolamento de banco de dados.',
      nextEvolution: 'Monitoramento contínuo de métricas reais de uso e refinamento da esteira operacional.',
    };
  }

  // Gera etapas padrão inteligentes e calibradas
  const steps: TaskPlanStep[] = [
    {
      stepNumber: 1,
      title: 'Concepção, Escopo & Modelagem de Dados',
      deliverable: 'Esquema de dados formal, definição de entidades e regras de integridade.',
      prompt: generateContextualPromptText({
        context: projectName ? `Projeto: ${projectName}. ${contextSummary || ''}` : 'HUB Estratégico',
        objective: `Definir a modelagem de dados e regras para: "${objective}"`,
        problem: 'Evitar retrabalho de refatoração garantindo schema consistente desde o início.',
        environment: 'TypeScript, Node.js, Firestore / PostgreSQL',
        constraints: ['Nenhum dado mockado', 'Campos com tipagem estrita', 'Compatibilidade com regras de segurança'],
        task: 'Desenhar as interfaces TypeScript e estrutura de coleções necessárias.',
        acceptanceCriteria: ['Interfaces exportadas sem erros de tipagem', 'Campos de auditoria createdAt e updatedAt inclusos'],
        expectedResult: 'Código TypeScript puro com interfaces prontas para uso.',
      }),
      toolRecommendation: 'Claude 3.7 Sonnet / ChatGPT',
      testsValidation: 'Checagem de consistência de tipos com tsc --noEmit.',
      status: 'Pendente',
    },
    {
      stepNumber: 2,
      title: 'Implementação do Motor Operacional & Serviços',
      deliverable: 'Serviços de persistência e orquestração conectados com validação de erros.',
      prompt: generateContextualPromptText({
        context: `Contexto do objetivo: ${objective}`,
        objective: 'Implementar a lógica de negócio e serviços de persistência resilientes.',
        problem: 'Chamadas assíncronas podem falhar por latência ou concorrência.',
        environment: 'Full-stack (Express + React + Firebase)',
        constraints: ['Tratamento de exceções com try/catch', 'Fallback para cache local se offline'],
        task: 'Escrever as funções de leitura, escrita e transações do fluxo.',
        acceptanceCriteria: ['Zero crash em caso de falha de conexão', 'Retornos tipados'],
        expectedResult: 'Módulos de serviço testados e exportados.',
      }),
      toolRecommendation: 'Groq Cloud Inference (velocidade) / Claude 3.7 Sonnet',
      testsValidation: 'Simulação de chamadas com payload válido e payload corrompido.',
      status: 'Pendente',
    },
    {
      stepNumber: 3,
      title: 'Interface do Usuário & Interação Reativa',
      deliverable: 'Componente visual responsivo, acessível e integrado aos serviços.',
      prompt: generateContextualPromptText({
        context: `Objetivo da UI: ${objective}`,
        objective: 'Criar os componentes de tela com feedback em tempo real e estados de loading.',
        problem: 'Usuário precisa de clareza se a operação está sendo executada, concluída ou em erro.',
        environment: 'React, Tailwind CSS, Lucide Icons',
        constraints: ['Design escuro sofisticado sem contraste excessivo', 'Botões com touch target >= 44px'],
        task: 'Construir a view interativa com inputs validados e botões de ação explícitos.',
        acceptanceCriteria: ['Feedback visual imediato', 'Zero travamentos de re-render'],
        expectedResult: 'Componente React TSX limpo e desacoplado.',
      }),
      toolRecommendation: 'Gemini 2.5 Pro / Claude 3.7 Sonnet',
      testsValidation: 'Renderização em desktop e mobile com validação de acessibilidade.',
      status: 'Pendente',
    },
    {
      stepNumber: 4,
      title: 'Bateria de Testes, Validação & Hardening',
      deliverable: 'Suíte de testes de validação com simulação de cenários reais.',
      prompt: generateContextualPromptText({
        context: `Cenário de teste para: ${objective}`,
        objective: 'Testar e validar ponta a ponta todas as regras de negócio.',
        problem: 'Identificar gargalos de borda e inconsistências antes de ir para produção.',
        environment: 'Ambiente de Testes / Sandbox',
        constraints: ['Testar cenários com falhas forçadas', 'Verificar permissões de segurança'],
        task: 'Executar testes funcionais e auditar conformidade de dados.',
        acceptanceCriteria: ['Todos os fluxos principais aprovados sem exceções não tratadas'],
        expectedResult: 'Relatório de validação com checklist de conformidade.',
      }),
      toolRecommendation: 'Groq (Modo Simulação rápida) / Auditor SST',
      testsValidation: 'Execução de simulação com dados extremos.',
      status: 'Pendente',
    },
  ];

  return {
    objective,
    steps,
    testingCriteria: 'Testes de integração com validação de payload, integridade de tipos e verificação de regras de acesso.',
    productionNotes: 'Validação de variáveis de ambiente no container, build de produção sem avisos e monitoramento de logs.',
    nextEvolution: 'Acompanhar tempo economizado pelo usuário e registrar aprendizado para refinamento contínuo.',
  };
}

/**
 * 11. GERADOR DE PROMPTS CONTEXTUAIS
 * Estrutura formal obrigatória:
 * CONTEXTO
 * OBJETIVO
 * PROBLEMA
 * AMBIENTE
 * RESTRIÇÕES
 * TAREFA
 * CRITÉRIOS DE ACEITAÇÃO
 * RESULTADO ESPERADO
 */
export function generateContextualPromptText(params: {
  context: string;
  objective: string;
  problem: string;
  environment: string;
  constraints: string[];
  task: string;
  acceptanceCriteria: string[];
  expectedResult: string;
}): string {
  const constraintsList = params.constraints.map((c) => `- ${c}`).join('\n');
  const criteriaList = params.acceptanceCriteria.map((a) => `- ${a}`).join('\n');

  return `
[CONTEXTO ESTRATÉGICO]
${params.context}

[OBJETIVO]
${params.objective}

[PROBLEMA / GARGALO A RESOLVER]
${params.problem}

[AMBIENTE TÉCNICO]
${params.environment}

[RESTRIÇÕES RÍGIDAS]
${constraintsList}

[TAREFA EXATA]
${params.task}

[CRITÉRIOS DE ACEITAÇÃO & VALIDAÇÃO]
${criteriaList}

[RESULTADO ESPERADO]
${params.expectedResult}
`.trim();
}
