import { 
  AssistantIntent, 
  IdeaItem, 
  ProjectHubItem,
  AIExperienceLevel,
  ExplanationDepth,
  PreferredInteractionStyle,
} from '../../types';

export interface AdaptiveAdjustment {
  type: 'SET_EXPERIENCE_LEVEL' | 'REDUCE_EXPLANATION' | 'INCREASE_EXPLANATION' | 'EXPLAIN_LIKE_BEGINNER';
  targetLevel?: AIExperienceLevel;
  targetDepth?: ExplanationDepth;
  targetStyle?: PreferredInteractionStyle;
  reason: string;
}

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
  isAskingForNavigation: boolean;
  targetNavigationRoute?: string;
  isAskingToOpenProject: boolean;
  isAskingForSystemHelp: boolean;
  isAskingToRegisterAI: boolean;
  extractedAICandidate?: {
    name: string;
    category?: string;
    specialty?: string;
    link?: string;
    pricing?: string;
    level?: string;
  };
  suggestedToolCall?: {
    name: string;
    params: any;
  };
  adaptiveAdjustment?: AdaptiveAdjustment;
  reasoning: string;
}

/**
 * RECONHECIMENTO DE INTENÇÃO & AUXILIAR MESTRE
 * Analisa a mensagem do usuário, detecta intenção, projetos mencionados,
 * pedidos de navegação, dúvidas sobre o sistema e comandos de ação (como cadastrar IA).
 */
export function analyzeUserIntent(
  userText: string,
  existingIdeas: IdeaItem[] = [],
  existingProjects: ProjectHubItem[] = []
): IntentAnalysisResult {
  const text = userText.trim();
  const lower = text.toLowerCase();

  // 1. Identifica menção a projeto existente (nas ideias ou nos projetos reais)
  let matchedProjectId: string | undefined;
  let matchedProjectTitle: string | undefined;

  // Primeiro busca em projetos reais
  for (const p of existingProjects) {
    const pLower = p.name.toLowerCase();
    if (lower.includes(pLower)) {
      matchedProjectId = p.id;
      matchedProjectTitle = p.name;
      break;
    }
    const words = pLower.split(' ').filter((w) => w.length >= 3);
    const matches = words.filter((w) => lower.includes(w));
    if (matches.length >= 2 || (words.length === 1 && matches.length === 1 && (lower.includes('projeto') || lower.includes('abrir')))) {
      matchedProjectId = p.id;
      matchedProjectTitle = p.name;
      break;
    }
  }

  // Se não achou em projetos, busca nas ideias
  if (!matchedProjectId) {
    for (const idea of existingIdeas) {
      const titleLower = idea.title.toLowerCase();
      if (lower.includes(titleLower)) {
        matchedProjectId = idea.id;
        matchedProjectTitle = idea.title;
        break;
      }
      const keywords = titleLower.split(' ').filter((w) => w.length >= 3);
      const matchedKeywords = keywords.filter((w) => lower.includes(w));
      if (matchedKeywords.length >= 2 || (keywords.length === 1 && matchedKeywords.length === 1 && lower.includes('projeto'))) {
        matchedProjectId = idea.id;
        matchedProjectTitle = idea.title;
        break;
      }
    }
  }

  // 2. Flags de navegação inteligente
  let isAskingForNavigation = false;
  let targetNavigationRoute: string | undefined;
  let isAskingToOpenProject = false;
  let suggestedToolCall: { name: string; params: any } | undefined;

  // Pedido explícito de abrir projeto: "abra meu projeto X", "quero trabalhar no projeto X", "ir para o projeto X"
  if (
    (lower.includes('abra o projeto') ||
      lower.includes('abra meu projeto') ||
      lower.includes('abrir projeto') ||
      lower.includes('trabalhar no projeto') ||
      lower.includes('me leve ao projeto') ||
      lower.includes('volte para meu projeto') ||
      lower.includes('voltar para o projeto')) &&
    matchedProjectId
  ) {
    isAskingToOpenProject = true;
    suggestedToolCall = {
      name: 'open_project',
      params: { projectId: matchedProjectId, projectName: matchedProjectTitle },
    };
  }

  // Pedidos de navegação entre telas: "me leve aos projetos", "ir para catálogo", "ver estudos", etc.
  if (!suggestedToolCall) {
    if (
      lower.includes('me leve aos projetos') ||
      lower.includes('ver meus projetos') ||
      lower.includes('ir para projetos') ||
      lower.includes('abrir projetos') ||
      lower.includes('tela de projetos') ||
      lower === 'projetos'
    ) {
      isAskingForNavigation = true;
      targetNavigationRoute = 'projects';
      suggestedToolCall = { name: 'navigate_to', params: { target: 'projects' } };
    } else if (
      lower.includes('me leve ao catálogo') ||
      lower.includes('ir para catálogo') ||
      lower.includes('ver catálogo') ||
      lower.includes('abrir catálogo') ||
      lower.includes('catálogo de ias') ||
      lower === 'catálogo' ||
      lower === 'catalogo'
    ) {
      isAskingForNavigation = true;
      targetNavigationRoute = 'catalog';
      suggestedToolCall = { name: 'navigate_to', params: { target: 'catalog' } };
    } else if (
      lower.includes('me leve aos estudos') ||
      lower.includes('ver estudos') ||
      lower.includes('ir para estudos') ||
      lower.includes('banco de estudos') ||
      lower === 'estudos'
    ) {
      isAskingForNavigation = true;
      targetNavigationRoute = 'studies';
      suggestedToolCall = { name: 'navigate_to', params: { target: 'studies' } };
    } else if (
      lower.includes('me leve ao diário') ||
      lower.includes('ir para diário') ||
      lower.includes('ver diário') ||
      lower.includes('abrir diário') ||
      lower.includes('diário de bordo') ||
      lower === 'diário' ||
      lower === 'diario'
    ) {
      isAskingForNavigation = true;
      targetNavigationRoute = 'diary';
      suggestedToolCall = { name: 'navigate_to', params: { target: 'diary' } };
    } else if (
      lower.includes('me leve ao dashboard') ||
      lower.includes('ir para dashboard') ||
      lower.includes('ver métricas') ||
      lower.includes('abrir dashboard') ||
      lower.includes('indicadores') ||
      lower === 'dashboard'
    ) {
      isAskingForNavigation = true;
      targetNavigationRoute = 'dashboard';
      suggestedToolCall = { name: 'navigate_to', params: { target: 'dashboard' } };
    } else if (
      lower.includes('me leve às ideias') ||
      lower.includes('ir para ideias') ||
      lower.includes('ver ideias') ||
      lower.includes('central de ideias')
    ) {
      isAskingForNavigation = true;
      targetNavigationRoute = 'ideas';
      suggestedToolCall = { name: 'navigate_to', params: { target: 'ideas' } };
    } else if (
      lower.includes('comparador') ||
      lower.includes('comparar ias') ||
      lower.includes('abrir comparador')
    ) {
      isAskingForNavigation = true;
      targetNavigationRoute = 'compare';
      suggestedToolCall = { name: 'navigate_to', params: { target: 'compare' } };
    } else if (
      lower.includes('abrir busca') ||
      lower.includes('busca global') ||
      lower.includes('pesquisa global')
    ) {
      isAskingForNavigation = true;
      targetNavigationRoute = 'search';
      suggestedToolCall = { name: 'navigate_to', params: { target: 'search' } };
    }
  }

  // 3. Flags de cadastro autônomo de IA
  let isAskingToRegisterAI = false;
  let extractedAICandidate: IntentAnalysisResult['extractedAICandidate'];

  const registerPatterns = [
    /cadastre (?:a|o|esta|uma nova)? ?ia:? (.+)/i,
    /adicione (?:a|o|esta|uma nova)? ?ia:? (.+)/i,
    /salve (?:a|o|esta|uma nova)? ?ia:? (.+)/i,
    /cadastrar ia (.+)/i,
    /adicionar ao cat[aá]logo (.+)/i,
    /cadastre (.+)/i,
    /adicione (.+)/i,
  ];

  if (
    lower.startsWith('cadastre') ||
    lower.startsWith('adicione') ||
    lower.startsWith('salve') ||
    lower.includes('cadastrar ia') ||
    lower.includes('adicionar ao catálogo')
  ) {
    for (const pattern of registerPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const payloadStr = match[1].trim();
        // Não confundir cadastro de projeto com cadastro de IA
        if (!lower.includes('projeto') && !lower.includes('estudo')) {
          isAskingToRegisterAI = true;

          // Extração básica de nome e campos
          let nameCandidate = payloadStr;
          let categoryCandidate = 'Geral';
          let specialtyCandidate = 'Assistente de IA';
          let linkCandidate = '';

          // Heurística de categoria
          if (lower.includes('código') || lower.includes('programação') || lower.includes('programar') || lower.includes('dev')) {
            categoryCandidate = 'Código';
            specialtyCandidate = 'Geração e auditoria de código';
          } else if (lower.includes('imagem') || lower.includes('foto') || lower.includes('design')) {
            categoryCandidate = 'Imagem';
            specialtyCandidate = 'Geração e manipulação de imagens';
          } else if (lower.includes('vídeo') || lower.includes('video')) {
            categoryCandidate = 'Vídeo';
            specialtyCandidate = 'Criação e edição de vídeos com IA';
          } else if (lower.includes('áudio') || lower.includes('audio') || lower.includes('voz') || lower.includes('música')) {
            categoryCandidate = 'Áudio';
            specialtyCandidate = 'Síntese de voz e processamento de áudio';
          } else if (lower.includes('produtividade') || lower.includes('documento') || lower.includes('pdf')) {
            categoryCandidate = 'Produtividade';
            specialtyCandidate = 'Produtividade e análise de documentos';
          } else if (lower.includes('chat') || lower.includes('conversa') || lower.includes('texto')) {
            categoryCandidate = 'Texto';
            specialtyCandidate = 'Modelos de linguagem e escrita';
          }

          // Se tiver URL no texto
          const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
          if (urlMatch) {
            linkCandidate = urlMatch[1];
          }

          // Limpa nome
          nameCandidate = nameCandidate
            .replace(/(no hub|ao catálogo|ao catalogo|no catálogo|no catalogo|com categoria .+|link .+)/gi, '')
            .replace(/[.,;:!?]+$/, '')
            .trim();

          // Se for algo curto como "o Claude", tira o artigo
          nameCandidate = nameCandidate.replace(/^(a |o |esta |este )/i, '').trim();

          if (nameCandidate.length > 0) {
            extractedAICandidate = {
              name: nameCandidate,
              category: categoryCandidate,
              specialty: specialtyCandidate,
              link: linkCandidate || undefined,
            };

            suggestedToolCall = {
              name: 'create_ai_entry',
              params: extractedAICandidate,
            };
          }
          break;
        }
      }
    }
  }

  // 4. Flags de dúvidas sobre o próprio sistema
  const isAskingForSystemHelp =
    lower.includes('o que posso fazer aqui') ||
    lower.includes('o que faço aqui') ||
    lower.includes('para que serve esta tela') ||
    lower.includes('como funciona esta tela') ||
    lower.includes('como crio um projeto') ||
    lower.includes('como criar um projeto') ||
    lower.includes('onde estão minhas missões') ||
    lower.includes('onde vejo minhas missões') ||
    lower.includes('como uso o executor') ||
    lower.includes('onde cadastro uma ia') ||
    lower.includes('como funciona o roadmap') ||
    lower.includes('o que faço agora') ||
    lower.includes('o que preciso fazer agora') ||
    lower === 'onde estou?' ||
    lower === 'onde estou';

  // 5. Flags tradicionais de modo e tipo
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

  // Detecção de nova ideia
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

  // 5.5. Reconhecimento de Perfil Adaptativo e Ajustes Dinâmicos
  let adaptiveAdjustment: AdaptiveAdjustment | undefined;

  // Detecção de definição explícita de nível
  const isDeclaringIniciante =
    lower === 'iniciante' ||
    lower.startsWith('iniciante') ||
    lower.includes('sou iniciante') ||
    lower.includes('nível iniciante') ||
    lower.includes('nivel iniciante') ||
    lower.includes('estou começando e quero orientação') ||
    lower.includes('mudar para iniciante') ||
    lower.includes('ajustar para iniciante');

  const isDeclaringIntermediario =
    lower === 'intermediário' ||
    lower === 'intermediario' ||
    lower.startsWith('intermediário') ||
    lower.startsWith('intermediario') ||
    lower.includes('sou intermediário') ||
    lower.includes('sou intermediario') ||
    lower.includes('nível intermediário') ||
    lower.includes('nivel intermediario') ||
    lower.includes('já utilizo ias e conheço os principais conceitos') ||
    lower.includes('mudar para intermediário') ||
    lower.includes('ajustar para intermediário');

  const isDeclaringAvancado =
    lower === 'avançado' ||
    lower === 'avancado' ||
    lower.startsWith('avançado') ||
    lower.startsWith('avancado') ||
    lower.includes('sou avançado') ||
    lower.includes('sou avancado') ||
    lower.includes('nível avançado') ||
    lower.includes('nivel avancado') ||
    lower.includes('tenho experiência com ia, ferramentas') ||
    lower.includes('mudar para avançado') ||
    lower.includes('ajustar para avançado');

  if (isDeclaringIniciante) {
    adaptiveAdjustment = {
      type: 'SET_EXPERIENCE_LEVEL',
      targetLevel: 'INICIANTE',
      targetDepth: 'detalhada',
      targetStyle: 'orientador',
      reason: 'Definição explícita de perfil de IA como INICIANTE (orientador, passo a passo, conceitos explicados).',
    };
  } else if (isDeclaringIntermediario) {
    adaptiveAdjustment = {
      type: 'SET_EXPERIENCE_LEVEL',
      targetLevel: 'INTERMEDIÁRIO',
      targetDepth: 'equilibrada',
      targetStyle: 'estrategico',
      reason: 'Definição explícita de perfil de IA como INTERMEDIÁRIO (estratégico, equilibrado, decisões fundamentadas).',
    };
  } else if (isDeclaringAvancado) {
    adaptiveAdjustment = {
      type: 'SET_EXPERIENCE_LEVEL',
      targetLevel: 'AVANÇADO',
      targetDepth: 'objetiva',
      targetStyle: 'direto',
      reason: 'Definição explícita de perfil de IA como AVANÇADO (direto, focado em arquitetura e alta eficiência).',
    };
  } else if (
    lower.includes('explique isso como se eu estivesse começando') ||
    lower.includes('como se eu estivesse comecando') ||
    lower.includes('me explique como um iniciante') ||
    lower.includes('explique como para um iniciante') ||
    lower.includes('explique como se eu fosse leigo') ||
    lower.includes('sou leigo nisso') ||
    lower.includes('explique do zero')
  ) {
    adaptiveAdjustment = {
      type: 'EXPLAIN_LIKE_BEGINNER',
      targetDepth: 'detalhada',
      targetStyle: 'orientador',
      reason: 'Ajuste dinâmico imediato: usuário solicitou explicação acessível e detalhada no nível iniciante.',
    };
  } else if (
    lower.includes('não precisa explicar tanto') ||
    lower.includes('nao precisa explicar tanto') ||
    lower.includes('menos explicação') ||
    lower.includes('menos explicacao') ||
    lower.includes('vá direto ao ponto') ||
    lower.includes('va direto ao ponto') ||
    lower.includes('seja mais direto') ||
    lower.includes('seja sucinto') ||
    lower.includes('menos texto') ||
    lower.includes('menos prolixo') ||
    lower.includes('sem rodeios')
  ) {
    adaptiveAdjustment = {
      type: 'REDUCE_EXPLANATION',
      targetDepth: 'objetiva',
      targetStyle: 'direto',
      reason: 'Ajuste dinâmico imediato: usuário solicitou objetividade máxima e menor profundidade de explicação.',
    };
  } else if (
    lower.includes('quero entender por que você fez isso') ||
    lower.includes('quero entender por que voce fez isso') ||
    lower.includes('por que você tomou essa decisão') ||
    lower.includes('por que voce tomou essa decisao') ||
    lower.includes('me explique o motivo') ||
    lower.includes('justifique essa escolha') ||
    lower.includes('por que essa decisão')
  ) {
    adaptiveAdjustment = {
      type: 'INCREASE_EXPLANATION',
      targetDepth: 'detalhada',
      reason: 'Ajuste dinâmico imediato: usuário solicitou justificativa e fundamentação detalhada da decisão tomada.',
    };
  }

  // 6. Classificação da Intenção
  let intent: AssistantIntent = 'pergunta';
  let confidence = 0.85;
  let reasoning = 'Consulta ou diálogo com o Auxiliar Mestre do Hub.';

  if (adaptiveAdjustment?.type === 'SET_EXPERIENCE_LEVEL') {
    intent = 'atualizacao_projeto';
    confidence = 0.98;
    reasoning = `Usuário definiu seu nível de experiência com IA como ${adaptiveAdjustment.targetLevel}.`;
  } else if (isAskingToRegisterAI) {
    intent = 'solicitacao_execucao';
    confidence = 0.95;
    reasoning = `Usuário solicitou o cadastro autônomo da IA "${extractedAICandidate?.name}".`;
  } else if (isAskingToOpenProject) {
    intent = 'solicitacao_execucao';
    confidence = 0.95;
    reasoning = `Usuário solicitou abertura direta do projeto "${matchedProjectTitle}".`;
  } else if (isAskingForNavigation) {
    intent = 'solicitacao_execucao';
    confidence = 0.92;
    reasoning = `Usuário solicitou navegação para a área "${targetNavigationRoute}".`;
  } else if (isAskingForSystemHelp) {
    intent = 'pergunta';
    confidence = 0.94;
    reasoning = 'Usuário pediu orientação pedagógica sobre o funcionamento, telas ou recursos do Hub.';
  } else if (isAskingForSimulation) {
    intent = 'pedido_simulacao';
    confidence = 0.95;
    reasoning = 'Usuário solicitou explicitamente simulação de cenário ou teste virtual.';
  } else if (isAskingForPlanning) {
    intent = 'pedido_planejamento';
    confidence = 0.92;
    reasoning = 'Usuário pediu estruturação em etapas de um novo objetivo ou construção.';
  } else if (detectedNewIdea && !matchedProjectId) {
    intent = 'ideia';
    confidence = 0.9;
    reasoning = 'Usuário descreveu uma possível nova ideia a ser registrada no Hub.';
  } else if (matchedProjectId && isAskingForEvolution) {
    intent = 'atualizacao_projeto';
    confidence = 0.95;
    reasoning = `Usuário quer evoluir ou avançar o projeto "${matchedProjectTitle}".`;
  } else if (matchedProjectId) {
    intent = 'projeto';
    confidence = 0.88;
    reasoning = `Conversa contextualizada sobre o projeto "${matchedProjectTitle}".`;
  }

  return {
    intent,
    confidence,
    mentionedProjectId: matchedProjectId,
    mentionedProjectTitle: matchedProjectTitle,
    detectedNewIdea,
    isAskingForSimulation,
    isAskingForPlanning,
    isAskingForEvolution,
    isAskingForNavigation,
    targetNavigationRoute,
    isAskingToOpenProject,
    isAskingForSystemHelp,
    isAskingToRegisterAI,
    extractedAICandidate,
    suggestedToolCall,
    adaptiveAdjustment,
    reasoning,
  };
}
