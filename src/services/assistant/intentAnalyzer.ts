import { AssistantIntent, IdeaItem } from '../../types';

export interface IntentAnalysisResult {
  intent: AssistantIntent;
  confidence: number;
  mentionedProjectId?: string;
  mentionedProjectTitle?: string;
  detectedNewIdea?: {
    suggestedTitle: string;
    description: string;
    category: string;
  };
  detectedStudyLink?: {
    topic: string;
  };
  isAskingForSimulation: boolean;
  isAskingForPlanning: boolean;
  isAskingForEvolution: boolean;
  reasoning: string;
}

/**
 * 3. RECONHECIMENTO DE INTENÇÃO & 4. IDEIAS
 * Analisa a mensagem do usuário, detecta intenção, projetos mencionados
 * e identifica se o usuário está propondo uma nova ideia relevante.
 */
export function analyzeUserIntent(
  userText: string,
  existingIdeas: IdeaItem[] = []
): IntentAnalysisResult {
  const text = userText.trim();
  const lower = text.toLowerCase();

  // 1. Identifica menção a projeto existente
  let matchedIdea: IdeaItem | undefined;
  for (const idea of existingIdeas) {
    const titleLower = idea.title.toLowerCase();
    if (lower.includes(titleLower)) {
      matchedIdea = idea;
      break;
    }
    // Verifica palavras-chave significativas do título (ex: "auditor sst" -> "auditor" e "sst")
    const keywords = titleLower.split(' ').filter((w) => w.length >= 3);
    const matchedKeywords = keywords.filter((w) => lower.includes(w));
    if (matchedKeywords.length >= 2 || (keywords.length === 1 && matchedKeywords.length === 1 && lower.includes('projeto'))) {
      matchedIdea = idea;
      break;
    }
  }

  // 2. Flags de modo e tipo
  const isAskingForSimulation =
    lower.includes('simul') ||
    lower.includes('testar cenário') ||
    lower.includes('cenário de') ||
    lower.includes('simule');

  const isAskingForPlanning =
    lower.includes('planej') ||
    lower.includes('etapas') ||
    lower.includes('roadmap') ||
    lower.includes('como construir') ||
    lower.includes('quero construir') ||
    lower.includes('passo a passo para criar');

  const isAskingForEvolution =
    lower.includes('evoluir') ||
    lower.includes('evolução') ||
    lower.includes('próximo passo') ||
    lower.includes('melhorar meu') ||
    lower.includes('revisar projeto') ||
    lower.includes('revisão');

  // 3. Detecção de nova ideia relevante ("Estou pensando em criar...", "Tive uma ideia de...", etc.)
  let detectedNewIdea: IntentAnalysisResult['detectedNewIdea'];
  const ideaPatterns = [
    /estou pensando em criar (.+)/i,
    /tive uma ideia (?:de|para) (.+)/i,
    /nova ideia:? (.+)/i,
    /quero criar um (?:sistema|app|ferramenta|projeto) (?:de|para) (.+)/i,
    /e se a gente fizesse (.+)/i,
  ];

  for (const pattern of ideaPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const captured = match[1].trim();
      const words = captured.split(' ');
      const suggestedTitle = words.slice(0, 5).join(' ').replace(/[.,;:!?]+$/, '');
      detectedNewIdea = {
        suggestedTitle: suggestedTitle.charAt(0).toUpperCase() + suggestedTitle.slice(1),
        description: text,
        category: lower.includes('sst')
          ? 'SST'
          : lower.includes('ia') || lower.includes('inteligência')
          ? 'IA'
          : lower.includes('automação')
          ? 'Automação'
          : 'Projeto',
      };
      break;
    }
  }

  // 4. Classificação da Intenção
  let intent: AssistantIntent = 'pergunta';
  let confidence = 0.85;
  let reasoning = 'Consulta ou dúvida geral.';

  if (isAskingForSimulation) {
    intent = 'pedido_simulacao';
    confidence = 0.95;
    reasoning = 'Usuário solicitou explicitamente simulação de cenário ou teste virtual.';
  } else if (isAskingForPlanning) {
    intent = 'pedido_planejamento';
    confidence = 0.92;
    reasoning = 'Usuário pediu estruturação em etapas de um novo objetivo ou construção.';
  } else if (detectedNewIdea && !matchedIdea) {
    intent = 'ideia';
    confidence = 0.9;
    reasoning = 'Usuário descreveu uma possível nova ideia a ser registrada no Hub.';
  } else if (matchedIdea && isAskingForEvolution) {
    intent = 'atualizacao_projeto';
    confidence = 0.95;
    reasoning = `Usuário quer evoluir ou avançar o projeto existente "${matchedIdea.title}".`;
  } else if (matchedIdea && (lower.includes('problema') || lower.includes('erro') || lower.includes('falha') || lower.includes('travou'))) {
    intent = 'problema';
    confidence = 0.9;
    reasoning = `Identificado relato de obstáculo ou problema no projeto "${matchedIdea.title}".`;
  } else if (matchedIdea && (lower.includes('decidi') || lower.includes('decisão') || lower.includes('escolhemos'))) {
    intent = 'decisao';
    confidence = 0.9;
    reasoning = `Registro de decisão técnica ou estratégica no projeto "${matchedIdea.title}".`;
  } else if (lower.includes('estudar') || lower.includes('estudo') || lower.includes('pesquisa sobre')) {
    intent = 'estudo';
    confidence = 0.88;
    reasoning = 'Usuário mencionou aprendizado ou estudo de um tema tecnológico.';
  } else if (lower.includes('execute') || lower.includes('gerar código') || lower.includes('fazer agora')) {
    intent = 'solicitacao_execucao';
    confidence = 0.88;
    reasoning = 'Solicitação de execução prática de uma tarefa.';
  } else if (lower.includes('analisar') || lower.includes('avalie') || lower.includes('auditar')) {
    intent = 'solicitacao_analise';
    confidence = 0.86;
    reasoning = 'Solicitação de análise crítica ou arquitetural.';
  } else if (matchedIdea) {
    intent = 'projeto';
    confidence = 0.85;
    reasoning = `Conversa contextualizada sobre o projeto "${matchedIdea.title}".`;
  }

  return {
    intent,
    confidence,
    mentionedProjectId: matchedIdea?.id,
    mentionedProjectTitle: matchedIdea?.title,
    detectedNewIdea,
    isAskingForSimulation,
    isAskingForPlanning,
    isAskingForEvolution,
    reasoning,
  };
}
