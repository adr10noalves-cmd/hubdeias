import { FilteredTaskContext } from './contextBuilder';
import { TaskComplexityAnalysis } from './taskComplexity';
import { AssistantMode, IAItem } from '../../types';

export interface PromptBuilderInput {
  userTask: string;
  context: FilteredTaskContext;
  complexity: TaskComplexityAnalysis;
  activeMode: AssistantMode;
  provider: 'GEMINI' | 'GROQ';
  modelId: string;
  catalog: IAItem[];
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface BuiltPromptResult {
  systemPrompt: string;
  userPrompt: string;
  formatInstruction: 'JSON_STRICT' | 'MARKDOWN_STRUCTURED';
  maxTokensExpected: number;
}

/**
 * 13. PROMPT BUILDER DINÂMICO
 * Gera prompts sob medida considerando a complexidade, modelo, modo e contexto filtrado.
 */
export function buildDynamicPrompt(input: PromptBuilderInput): BuiltPromptResult {
  const { userTask, context, complexity, activeMode, provider, modelId, catalog, history = [] } = input;

  const relevantCatalogSlice = catalog
    .slice(0, 15)
    .map((i) => `- ${i.name} (${i.category}): ${i.specialty}`)
    .join('\n');

  // Diretrizes por Provedor & Modelo
  const providerDirective = provider === 'GEMINI'
    ? `VOCÊ É O GEMINI (${modelId}), MODELO PRINCIPAL DE RACIOCÍNIO PROFUNDO, ARQUITETURA E PLANEJAMENTO DO HUB.
Foque em: rigor técnico, consistência arquitetural, raciocínio lógico em etapas e precisão conceitual. Não invente capacidades que não foram confirmadas no contexto.`
    : `VOCÊ É O MODELO AUXILIAR GROQ (${modelId}), FOCADO EM VELOCIDADE, TRANSFORMAÇÃO E SÍNTESE EFICIENTE.
Foque em: agilidade, concisão, estrutura direta e execução prática sem enrolação.`;

  // Seção de Contexto Filtrado
  const contextSection = context.targetProject
    ? `\n--- CONTEXTO CIRÚRGICO DO PROJETO EM FOCO ---
${context.contextSummaryText}
---------------------------------------------`
    : `\n--- AMBIENTE OPERACIONAL ---
Operando no catálogo geral de inteligências artificiais e banco de estudos do Hub.
---------------------------`;

  // Histórico Recente Relevante
  const recentHistoryFormatted = history.length > 0
    ? `\n--- DIÁLOGO RECENTE (ÚLTIMAS INTERAÇÕES) ---
${history.slice(-4).map((h) => `${h.role === 'user' ? 'Usuário' : 'Orquestrador'}: ${h.content.slice(0, 300)}`).join('\n')}
--------------------------------------------`
    : '';

  // Modo Simulação vs Modo Real
  const modeInstruction = activeMode === 'SIMULATION'
    ? `⚠️ MODO SIMULAÇÃO ATIVO (SANDBOX VIRTUAL):
Você está simulando o comportamento de execução de forma preditiva. Analise o fluxo de dados projetado, preveja gargalos e avalie riscos ANTES que qualquer código vá para produção. Deixe explícito que este é um teste em ambiente virtual.`
    : `✅ MODO EXECUÇÃO REAL / CONVERSAÇÃO:
Gere recomendações, planos ou decisões com precisão para implementação prática imediata pelo usuário no Hub.`;

  const systemPrompt = `${providerDirective}

NÍVEL DE COMPLEXIDADE DETERMINADO: Nível ${complexity.level} (${complexity.levelName}) - Score ${complexity.score}/100
MOTIVO DA ESCOLHA DO MODELO: ${complexity.reasoning}

${modeInstruction}

${contextSection}

FERRAMENTAS ÚTEIS DISPONÍVEIS NO CATÁLOGO DO HUB:
${relevantCatalogSlice}

DIRETRIZES DE RESPOSTA:
1. Responda em Português do Brasil (pt-BR) com alto nível de clareza e estrutura.
2. Respeite estritamente a arquitetura existente e as decisões históricas registradas na memória.
3. Não invente soluções que contradigam o histórico do projeto.
4. Conclua sempre com 1 ou 2 próximos passos objetivos.

FORMATO DE RETORNO EXIGIDO:
Retorne EXCLUSIVAMENTE em formato JSON com as seguintes chaves:
{
  "response": "Resposta em Markdown rica, analítica e com formatação elegante",
  "keyTakeaways": ["Ponto chave 1", "Ponto chave 2"],
  "nextAction": "Próxima ação recomendada imediata",
  "suggestedActions": [
    { "label": "Rótulo do botão", "actionType": "TIPO_ACAO", "target": "id opcional" }
  ]
}`;

  const userPrompt = `${recentHistoryFormatted}

SOLICITAÇÃO DO USUÁRIO:
"${userTask}"`;

  const maxTokensExpected = complexity.level >= 3 ? 3000 : 1500;

  return {
    systemPrompt,
    userPrompt,
    formatInstruction: 'JSON_STRICT',
    maxTokensExpected,
  };
}
