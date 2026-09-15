import {
  IAItem,
  CentralIntent,
  RecommendedOption,
  PromptGenerationResult,
  ComparisonAIsResult,
  AIStrategyResult,
  CatalogQueryAnswer,
  DiscoveredAICandidate,
} from '../types';
import { LOCAL_CURATED_DISCOVERY_POOL } from '../utils/groqDiscovery';

// 12. ARQUITETURA CENTRALIZADA: groqClient()
export async function groqClient(action: string, payload: any): Promise<any> {
  const response = await fetch('/api/groq/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    let errorDetail = `Status ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.error || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  const data = await response.json();
  if (!data.success && data.error) {
    throw new Error(data.error);
  }
  return data;
}

// 11. COMANDO NATURAL: detectIntent()
export async function detectIntent(userPrompt: string): Promise<{
  intent: CentralIntent;
  confidence: number;
  targetIA?: string | null;
  selectedAIs?: string[];
  extractedTask?: string;
}> {
  const clean = (userPrompt || '').trim();

  try {
    const res = await groqClient('detect_intent', { userPrompt: clean });
    if (res && res.intent) {
      return {
        intent: res.intent,
        confidence: res.confidence ?? 0.95,
        targetIA: res.targetIA || null,
        selectedAIs: Array.isArray(res.selectedAIs) ? res.selectedAIs : [],
        extractedTask: res.extractedTask || clean,
      };
    }
  } catch (err) {
    console.warn('[detectIntent] Groq offline/falhou, acionando classificador semântico local:', err);
  }

  // Fallback heurístico inteligente
  const lower = clean.toLowerCase();

  if (
    lower.startsWith('compare') ||
    lower.includes(' vs ') ||
    lower.includes(' versus ') ||
    lower.includes('comparar ') ||
    lower.includes('qual é melhor entre')
  ) {
    return { intent: 'compare', confidence: 0.85, extractedTask: clean };
  }

  if (
    lower.includes('prompt') ||
    lower.includes('crie um prompt') ||
    lower.includes('gerar prompt') ||
    lower.includes('como pedir para')
  ) {
    return { intent: 'generate_prompt', confidence: 0.85, extractedTask: clean };
  }

  if (
    lower.startsWith('cadastre') ||
    lower.startsWith('adicione') ||
    lower.includes('cadastrar') ||
    lower.includes('adicionar ao catálogo')
  ) {
    return { intent: 'register_ai', confidence: 0.85, extractedTask: clean };
  }

  if (
    lower.includes('descubra') ||
    lower.includes('encontre novas') ||
    lower.includes('quais ias existem no mercado') ||
    lower.includes('buscar novas ias')
  ) {
    return { intent: 'discover_ai', confidence: 0.85, extractedTask: clean };
  }

  if (
    lower.includes('estratégia') ||
    lower.includes('pipeline') ||
    lower.includes('passo a passo') ||
    lower.includes('fluxo de trabalho') ||
    lower.includes('lançar um') ||
    lower.includes('etapas')
  ) {
    return { intent: 'build_strategy', confidence: 0.85, extractedTask: clean };
  }

  if (
    lower.startsWith('quais ias') ||
    lower.includes('no meu catálogo') ||
    lower.includes('eu tenho') ||
    lower.includes('estão cadastradas') ||
    lower.includes('quantas ias') ||
    lower.includes('qual ia de')
  ) {
    return { intent: 'query_catalog', confidence: 0.85, extractedTask: clean };
  }

  // Padrão de busca: encontrar melhor IA
  return { intent: 'recommend', confidence: 0.8, extractedTask: clean };
}

// 2. 🔎 ENCONTRAR MELHOR IA: recommendAI()
export async function recommendAI(
  taskDescription: string,
  catalog: IAItem[]
): Promise<{
  champion: RecommendedOption;
  second: RecommendedOption;
  third: RecommendedOption;
}> {
  try {
    const res = await groqClient('recommend', { taskDescription, catalog });
    if (res?.champion && res?.second && res?.third) {
      // Cruzar com os itens do catálogo
      const findItem = (name: string) =>
        catalog.find((i) => i.name.toLowerCase() === name.toLowerCase()) ||
        catalog.find((i) => i.name.toLowerCase().includes(name.toLowerCase()));

      return {
        champion: {
          rank: 'champion',
          titleBadge: '🏆 MELHOR IA',
          ...res.champion,
          iaItem: findItem(res.champion.name),
        },
        second: {
          rank: 'second',
          titleBadge: '🥈 SEGUNDA OPÇÃO',
          ...res.second,
          iaItem: findItem(res.second.name),
        },
        third: {
          rank: 'third',
          titleBadge: '🥉 TERCEIRA OPÇÃO',
          ...res.third,
          iaItem: findItem(res.third.name),
        },
      };
    }
  } catch (err) {
    console.warn('[recommendAI] Groq falhou, utilizando motor de pontuação local:', err);
  }

  // Fallback local robusto analisando todo o catálogo
  const lower = taskDescription.toLowerCase();
  const scored = catalog.map((item) => {
    let score = 50;
    const itemText = `${item.name} ${item.specialty} ${item.differential} ${item.whatIsItFor} ${item.bestTasks?.join(' ')} ${item.quandoUsar} ${item.category}`.toLowerCase();

    const terms = lower.split(/\s+/).filter((t) => t.length > 2);
    for (const term of terms) {
      if (itemText.includes(term)) score += 12;
    }
    if (item.level === 'Elite') score += 8;
    if (item.level === 'Alta Performance') score += 4;
    if (item.pricingType === 'FREE' || item.pricingType === 'FREEMIUM') score += 5;

    return { item, score: Math.min(score, 98) };
  });

  scored.sort((a, b) => b.score - a.score);

  const best1 = scored[0]?.item || catalog[0];
  const best2 = scored[1]?.item || catalog[1];
  const best3 = scored[2]?.item || catalog[2];

  return {
    champion: {
      rank: 'champion',
      titleBadge: '🏆 MELHOR IA',
      name: best1.name,
      specialty: best1.specialty,
      compatibility: scored[0]?.score || 95,
      reason: `Ferramenta de maior aderência operacional para "${taskDescription}". Seus diferenciais de ${best1.differential.toLowerCase()} oferecem a execução mais precisa.`,
      officialUrl: best1.link,
      iaItem: best1,
    },
    second: {
      rank: 'second',
      titleBadge: '🥈 SEGUNDA OPÇÃO',
      name: best2.name,
      specialty: best2.specialty,
      compatibility: scored[1]?.score || 88,
      reason: `Alternativa com excelente desempenho. ${best2.differential}.`,
      officialUrl: best2.link,
      iaItem: best2,
    },
    third: {
      rank: 'third',
      titleBadge: '🥉 TERCEIRA OPÇÃO',
      name: best3.name,
      specialty: best3.specialty,
      compatibility: scored[2]?.score || 82,
      reason: `Opção de apoio ou custo-benefício. ${best3.specialty}.`,
      officialUrl: best3.link,
      iaItem: best3,
    },
  };
}

// 3. ✍️ CRIAR PROMPT & 4. 🧠 GERADOR AUTOMÁTICO: generatePrompt()
export async function generatePrompt(params: {
  objective: string;
  targetIA?: string;
  level?: string;
  desiredResult?: string;
  language?: 'pt' | 'en';
}): Promise<PromptGenerationResult> {
  const targetIA = params.targetIA || 'Claude 3.5 Sonnet';
  const level = (params.level as any) || 'Intermediário';
  const language = params.language || 'pt';

  try {
    const res = await groqClient('generate_prompt', {
      objective: params.objective,
      targetIA,
      level,
      desiredResult: params.desiredResult,
      language,
    });
    if (res?.prompt) {
      return {
        prompt: res.prompt,
        objective: res.objective || params.objective,
        targetIA: res.targetIA || targetIA,
        level: (res.level as any) || level,
        desiredResult: res.desiredResult || params.desiredResult,
        role: res.role || 'Especialista Sênior',
        instructions: Array.isArray(res.instructions) ? res.instructions : [],
        constraints: Array.isArray(res.constraints) ? res.constraints : [],
        responseFormat: res.responseFormat || 'Estrutura Markdown limpa',
        qualityCriteria: res.qualityCriteria || 'Rigor técnico e ausência de alucinações',
      };
    }
  } catch (err) {
    console.warn('[generatePrompt] Groq falhou, utilizando gerador de prompt local:', err);
  }

  // Fallback local determinístico de alta qualidade
  const role = `Especialista Sênior em Engenharia de Soluções e ${params.objective.slice(0, 30)}`;
  const instructions = [
    `Analise profundamente o objetivo central: "${params.objective}".`,
    `Construa uma resposta lógica, clara e dividida em fases de execução.`,
    `Apresente exemplos práticos diretamente aplicáveis.`,
  ];
  const constraints = [
    'Não use jargões vagos ou clichês vazios.',
    'Forneça dados concretos e passos acionáveis.',
    'Se houver incertezas ou pré-requisitos, indique expressamente.',
  ];

  const fullPrompt = `# CONTEXTO & IDENTIDADE
Você é um ${role}. Sua missão é conduzir o usuário com rigor técnico e pragmatismo.

# OBJETIVO PRINCIPAL
${params.objective}

# DIRETRIZES DE EXECUÇÃO
1. ${instructions[0]}
2. ${instructions[1]}
3. ${instructions[2]}

# RESTRIÇÕES OBRIGATÓRIAS
- ${constraints[0]}
- ${constraints[1]}
- ${constraints[2]}

# FORMATO ESPERADO DA RESPOSTA
- Visão executiva inicial (1 parágrafo curto)
- Plano tático estruturado em etapas sequenciais
- Entregáveis práticos e código/artefatos quando aplicável
- Validação e critérios de conclusão

# RESULTADO DESEJADO
${params.desiredResult || 'Entrega com máxima profundidade e aplicabilidade imediata.'}`;

  return {
    prompt: fullPrompt,
    objective: params.objective,
    targetIA,
    level,
    desiredResult: params.desiredResult,
    role,
    instructions,
    constraints,
    responseFormat: 'Markdown estruturado com seções executivas',
    qualityCriteria: 'Clareza, aplicabilidade imediata e zero respostas genéricas',
  };
}

// 5. ⚖️ COMPARAR IAs: compareAIs()
export async function compareAIs(
  selectedIANames: string[],
  objective: string,
  catalog: IAItem[]
): Promise<ComparisonAIsResult> {
  const matched = catalog.filter((i) => selectedIANames.includes(i.name));

  try {
    const res = await groqClient('compare', {
      selectedIANames,
      objective,
      catalog: matched.length > 0 ? matched : catalog.slice(0, 4),
    });
    if (res?.verdict && res?.dimensions) {
      return res;
    }
  } catch (err) {
    console.warn('[compareAIs] Groq falhou, utilizando comparador matricial local:', err);
  }

  // Fallback matricial local
  const dims = [
    'Capacidade Geral',
    'Facilidade de Uso',
    'Criatividade',
    'Código & Engenharia',
    'Raciocínio Lógico',
    'Automação',
    'Adequação ao Objetivo',
  ];

  const compatibilityScores: Record<string, number> = {};
  const dimensions = dims.map((dim) => {
    const scores: Record<string, number> = {};
    const notes: Record<string, string> = {};

    selectedIANames.forEach((name, idx) => {
      const item = catalog.find((i) => i.name === name);
      let base = 80;
      if (item?.level === 'Elite') base += 10;
      if (dim === 'Código & Engenharia' && item?.category.includes('CÓDIGO')) base += 10;
      if (dim === 'Criatividade' && item?.category.includes('IMAGEM')) base += 10;
      if (dim === 'Facilidade de Uso' && item?.difficulty === 'Iniciante') base += 8;

      const score = Math.min(base - idx * 2, 98);
      scores[name] = score;
      notes[name] = `${item?.specialty || 'Capacidade operacional sólida'}`;

      compatibilityScores[name] = Math.round(
        (compatibilityScores[name] || 0) + score / dims.length
      );
    });

    return { dimension: dim, scores, notes };
  });

  const winner = selectedIANames[0] || 'IA 1';

  return {
    objective: objective || 'Comparação de capacidades operacionais',
    iasCompared: selectedIANames,
    dimensions,
    compatibilityScores,
    verdict: `Para o objetivo "${objective || 'operação geral'}", as ferramentas apresentam diferenciais complementares. Avalie o perfil de cada uma no relatório acima.`,
    recommendedWinner: winner,
    winnerReason: `Apresenta o equilíbrio mais favorável de recursos para esta finalidade específica.`,
  };
}

// 6. ➕ CADASTRAR NOVA IA: registerNewAI()
export async function registerNewAI(
  promptOrName: string,
  catalog: IAItem[]
): Promise<Partial<IAItem>> {
  try {
    const res = await groqClient('register_ai', { promptOrName, catalog });
    if (res?.newIA) {
      return res.newIA;
    }
  } catch (err) {
    console.warn('[registerNewAI] Groq falhou, estruturando rascunho de IA local:', err);
  }

  // Fallback local inteligente
  const cleanName = promptOrName.replace(/cadastre|adicione|novo|nova|ia/gi, '').trim() || 'Nova IA';
  return {
    name: cleanName,
    category: 'MODELOS GERAIS / MULTIMODAL',
    specialty: `Processamento avançado de inteligência artificial com foco em ${cleanName}`,
    differential: 'Integração de alta performance para fluxos de trabalho do hub',
    level: 'Alta Performance',
    difficulty: 'Intermediário',
    pricing: 'Freemium (Grátis + Pago)',
    pricingType: 'FREEMIUM',
    pricingDetails: 'Acesso gratuito com plano profissional opcional',
    link: 'https://exemplo.ai',
    whatIsIt: `${cleanName} é uma ferramenta de IA projetada para otimizar operações modernas.`,
    whatIsItFor: 'Automatizar e enriquecer tarefas do dia a dia com alta precisão.',
    paraQueServe: 'Aumentar a produtividade do usuário em tarefas chave.',
    quandoUsar: 'Sempre que precisar de respostas rápidas e estruturadas.',
    quandoNaoUsar: 'Para dados ultraconfidenciais sem validação de conformidade.',
    melhorPara: 'Profissionais, criadores e desenvolvedores.',
    pontosFortes: 'Velocidade de inferência e interface acessível.',
    limitacoes: 'Cotas de uso no plano gratuito.',
    exemploPrompt: `Atue como assistente especialista em ${cleanName} e estruture um plano de ação.`,
    bestTasks: ['Análise', 'Geração de conteúdo', 'Automação'],
  };
}

// 7. 🔍 DESCOBRIR NOVAS IAs: discoverNewAIs()
export async function discoverNewAIs(
  query: string,
  catalog: IAItem[]
): Promise<DiscoveredAICandidate[]> {
  try {
    const res = await groqClient('discover_ai', { query, catalog });
    if (Array.isArray(res?.candidates) && res.candidates.length > 0) {
      return res.candidates;
    }
  } catch (err) {
    console.warn('[discoverNewAIs] Groq falhou, utilizando repositório local de descoberta:', err);
  }

  // Fallback local usando pool curado
  const existingNames = new Set(catalog.map((i) => i.name.toLowerCase()));
  const filtered = LOCAL_CURATED_DISCOVERY_POOL.filter(
    (item) => !existingNames.has(item.name.toLowerCase())
  );

  return filtered.slice(0, 3);
}

// 8. 🧩 MONTAR ESTRATÉGIA: buildAIStrategy()
export async function buildAIStrategy(
  task: string,
  catalog: IAItem[]
): Promise<AIStrategyResult> {
  try {
    const res = await groqClient('build_strategy', { task, catalog });
    if (res?.steps && Array.isArray(res.steps)) {
      const stepsWithItems = res.steps.map((s: any) => ({
        ...s,
        iaItem: catalog.find(
          (i) => i.name.toLowerCase() === (s.recommendedIA || '').toLowerCase()
        ),
      }));
      return {
        ...res,
        steps: stepsWithItems,
      };
    }
  } catch (err) {
    console.warn('[buildAIStrategy] Groq falhou, gerando pipeline tático local:', err);
  }

  // Fallback de estratégia operacional utilizando IAs existentes no catálogo
  const findCatIA = (catKeywords: string[], defaultName: string) => {
    const found = catalog.find((i) =>
      catKeywords.some(
        (k) =>
          i.category.toLowerCase().includes(k) ||
          i.specialty.toLowerCase().includes(k) ||
          i.name.toLowerCase().includes(k)
      )
    );
    return found ? found.name : defaultName;
  };

  const researchIA = findCatIA(['pesquisa', 'busca', 'perplexity'], 'Perplexity AI');
  const creationIA = findCatIA(['gerais', 'claude', 'chatgpt'], 'Claude 3.5 Sonnet');
  const visualIA = findCatIA(['imagem', 'criatividade', 'recraft', 'midjourney'], 'Recraft AI');
  const videoIA = findCatIA(['vídeo', 'apresentação', 'gamma', 'runway'], 'Gamma App');
  const reviewIA = findCatIA(['automação', 'código', 'deepseek'], 'DeepSeek V3');

  const steps = [
    {
      stepNumber: 1,
      stageName: 'ETAPA 1: Pesquisa de Mercado e Validação de Escopo',
      goal: 'Identificar dores, benchmarks e referências reais com fontes confiáveis.',
      recommendedIA: researchIA,
      iaItem: catalog.find((i) => i.name === researchIA),
      whyThisIA: 'Capacidade de buscar informações em tempo real na web com citação de links.',
      expectedDeliverable: 'Dossiê com os 10 principais tópicos e referências validadas.',
      actionPrompt: `Faça uma pesquisa profunda e traga benchmarks para a seguinte tarefa: "${task}". Apresente dados recentes e citações de fontes.`,
    },
    {
      stepNumber: 2,
      stageName: 'ETAPA 2: Criação de Conteúdo e Arquitetura Central',
      goal: 'Escrever roteiros, códigos ou a estrutura completa da solução.',
      recommendedIA: creationIA,
      iaItem: catalog.find((i) => i.name === creationIA),
      whyThisIA: 'Raciocínio lógico refinado e escrita articulada sem prolixidade.',
      expectedDeliverable: 'Roteiro completo ou código base pronto para implementação.',
      actionPrompt: `Com base no tema "${task}", construa o outline detalhado e os capítulos/módulos essenciais com exemplos práticos.`,
    },
    {
      stepNumber: 3,
      stageName: 'ETAPA 3: Ativos Visuais e Identidade Gráfica',
      goal: 'Gerar ilustrações, capas, diagramas e interfaces visuais consistentes.',
      recommendedIA: visualIA,
      iaItem: catalog.find((i) => i.name === visualIA),
      whyThisIA: 'Geração de ativos visuais com vetor e design editorial de alto nível.',
      expectedDeliverable: 'Conjunto de imagens, capas ou slides visualmente alinhados.',
      actionPrompt: `Gere uma ilustração conceitual moderna e minimalista para representar: "${task}". Estilo limpo e paleta sofisticada.`,
    },
    {
      stepNumber: 4,
      stageName: 'ETAPA 4: Produção Multimídia / Apresentação',
      goal: 'Transformar a documentação em apresentações executivas ou formato de vídeo.',
      recommendedIA: videoIA,
      iaItem: catalog.find((i) => i.name === videoIA),
      whyThisIA: 'Diagramação automática e estética profissional em poucos cliques.',
      expectedDeliverable: 'Deck de slides interativo ou roteiro visual para produção.',
      actionPrompt: `Estruture uma apresentação interativa de 8 slides para expor: "${task}".`,
    },
    {
      stepNumber: 5,
      stageName: 'ETAPA 5: Revisão Crítica e Automação de Publicação',
      goal: 'Auditar a qualidade técnica, polir detalhes e conectar integrações.',
      recommendedIA: reviewIA,
      iaItem: catalog.find((i) => i.name === reviewIA),
      whyThisIA: 'Excelência analítica para encontrar inconsistências e automatizar passos.',
      expectedDeliverable: 'Checklist de lançamento validado e pronto para operar.',
      actionPrompt: `Atue como auditor sênior e revise criticamente o seguinte fluxo para "${task}". Aponte falhas e melhorias imediatas.`,
    },
  ];

  return {
    complexTask: task,
    overview: `Pipeline estratégico sequencial de 5 etapas desenhado para executar "${task}" aproveitando prioritariamente as ferramentas do seu catálogo.`,
    catalogCoverage: `${steps.length} de ${steps.length} etapas cobertas com IAs do catálogo`,
    steps,
  };
}

// 9. 📚 CONSULTAR HUB: queryCatalog()
export async function queryCatalog(
  question: string,
  catalog: IAItem[]
): Promise<CatalogQueryAnswer> {
  try {
    const res = await groqClient('query_catalog', { question, catalog });
    if (res?.answer) {
      return res;
    }
  } catch (err) {
    console.warn('[queryCatalog] Groq falhou, consultando catálogo localmente:', err);
  }

  // Fallback de consulta local
  const lower = question.toLowerCase();
  let matches: IAItem[] = [];

  if (lower.includes('gratuita') || lower.includes('grátis') || lower.includes('free')) {
    matches = catalog.filter((i) => i.pricingType === 'FREE' || i.pricingType === 'FREEMIUM');
  } else if (lower.includes('vídeo')) {
    matches = catalog.filter((i) => i.category.includes('VÍDEO'));
  } else if (lower.includes('programação') || lower.includes('código')) {
    matches = catalog.filter((i) => i.category.includes('CÓDIGO'));
  } else if (lower.includes('imagem') || lower.includes('foto')) {
    matches = catalog.filter((i) => i.category.includes('IMAGEM'));
  } else if (lower.includes('pesquisa')) {
    matches = catalog.filter((i) => i.category.includes('PESQUISA'));
  } else if (lower.includes('áudio') || lower.includes('música')) {
    matches = catalog.filter((i) => i.category.includes('ÁUDIO'));
  } else {
    matches = catalog.slice(0, 5);
  }

  const names = matches.map((m) => m.name);
  return {
    question,
    answer: `Encontramos ${matches.length} ferramentas no seu catálogo correspondentes à pergunta: ${names.join(', ')}.`,
    matchingIANames: names,
    highlights: matches.slice(0, 3).map((m) => `${m.name}: ${m.specialty} (${m.pricing})`),
  };
}
