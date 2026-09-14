import { IAItem, IACategory, DiscoveredAICandidate, CandidateEvaluationResult } from '../types';

export const QUALITY_THRESHOLD = 80;

/**
 * Normaliza strings para comparação fonética/textual estrita (sem acentos, minúsculas, sem caracteres especiais).
 */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Normaliza URLs para comparação de duplicatas (remove protocolo, www, query e barras finais).
 */
export function normalizeUrl(url: string): string {
  try {
    let clean = url.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//, '');
    clean = clean.replace(/^www\./, '');
    clean = clean.split(/[?#]/)[0];
    clean = clean.replace(/\/+$/, '');
    return clean;
  } catch {
    return url.trim().toLowerCase();
  }
}

/**
 * Valida se uma URL oficial é válida e possui formato legítimo.
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.hostname && parsed.hostname.includes('.'));
  } catch {
    return false;
  }
}

/**
 * Verifica se um candidato já existe no catálogo do Hub.
 */
export function checkIsDuplicate(candidate: DiscoveredAICandidate, currentCatalog: IAItem[]): boolean {
  const normCandidateName = normalizeText(candidate.name);
  const normCandidateUrl = normalizeUrl(candidate.officialUrl);

  for (const item of currentCatalog) {
    const normItemName = normalizeText(item.name);
    const normItemUrl = normalizeUrl(item.link);

    // Comparação de Nome exato ou forte sobreposição
    if (normCandidateName === normItemName) return true;
    if (normCandidateName.length >= 4 && (normCandidateName.includes(normItemName) || normItemName.includes(normCandidateName))) {
      // Casos como "Claude 3.5 Sonnet" e "Claude" ou "Cursor IDE" e "Cursor"
      return true;
    }

    // Comparação de URL normalizada
    if (normCandidateUrl && normItemUrl) {
      if (normCandidateUrl === normItemUrl) return true;
      if (normCandidateUrl.split('/')[0] === normItemUrl.split('/')[0]) {
        // Mesmo domínio principal
        return true;
      }
    }
  }

  return false;
}

/**
 * Aplica os filtros táticos automáticos de qualidade, gratuidade, URL e duplicidade (Seção 7 e 8).
 */
export function evaluateCandidate(
  candidate: DiscoveredAICandidate,
  currentCatalog: IAItem[]
): CandidateEvaluationResult {
  // 1. Verificação de Duplicidade (Seção 8)
  if (checkIsDuplicate(candidate, currentCatalog)) {
    return {
      candidate,
      passed: false,
      status: 'REJECTED',
      rejectionReason: `Rejeitada: A ferramenta "${candidate.name}" já existe no catálogo do Hub (duplicata evitada).`,
      isDuplicate: true,
    };
  }

  // 2. Verificação de URL Válida (Seção 7)
  if (!isValidUrl(candidate.officialUrl)) {
    return {
      candidate,
      passed: false,
      status: 'REJECTED',
      rejectionReason: `Rejeitada: URL oficial ausente ou inválida ("${candidate.officialUrl || 'vazio'}").`,
    };
  }

  // 3. Regra de Gratuidade (Seção 3)
  // Permitido: FREE ou FREEMIUM (com plano gratuito funcional)
  // Rejeitado: TRIAL, PAID, UNKNOWN
  if (candidate.pricingType === 'TRIAL') {
    return {
      candidate,
      passed: false,
      status: 'REJECTED',
      rejectionReason: `Rejeitada: Possui apenas modalidade de teste temporário (TRIAL). Requisito: plano gratuito funcional contínuo.`,
    };
  }

  if (candidate.pricingType === 'PAID') {
    return {
      candidate,
      passed: false,
      status: 'REJECTED',
      rejectionReason: `Rejeitada: Ferramenta estritamente paga (PAID). Requisito: modalidade FREE ou FREEMIUM relevante.`,
    };
  }

  if (candidate.pricingType !== 'FREE' && candidate.pricingType !== 'FREEMIUM') {
    return {
      candidate,
      passed: false,
      status: 'REJECTED',
      rejectionReason: `Rejeitada: Modelo de acesso desconhecido (${candidate.pricingType || 'INDEFINIDO'}). Proteção contra dados não confirmados.`,
    };
  }

  // 4. Regra de Qualidade (Seção 2 - qualityThreshold >= 80)
  if (candidate.qualityScore < QUALITY_THRESHOLD) {
    return {
      candidate,
      passed: false,
      status: 'REJECTED',
      rejectionReason: `Rejeitada: Qualidade estimada (${candidate.qualityScore}%) abaixo do limiar de exigência (${QUALITY_THRESHOLD}%).`,
    };
  }

  // Aprovada pelos critérios automáticos
  return {
    candidate,
    passed: true,
    status: 'ACCEPTED',
  };
}

/**
 * Base de conhecimento local de IAs reais verificadas (para fallback do motor Groq quando offline ou simulando cenários).
 */
export const LOCAL_CURATED_DISCOVERY_POOL: DiscoveredAICandidate[] = [
  {
    name: 'Bolt.new',
    officialUrl: 'https://bolt.new',
    category: 'CÓDIGO & ENGENHARIA',
    specialty: 'Desenvolvimento e execução full-stack no navegador em WebContainers',
    differential: 'Permite criar, editar, rodar e hospedar apps Node/React inteiros a partir de um prompt sem configurar máquina local.',
    level: 'Alta Performance',
    pricingType: 'FREEMIUM',
    qualityScore: 92,
    reason: 'Excepcional para criação instantânea de aplicações completas no navegador com ambiente Linux real em WebContainers.',
    whyDiscovered: 'Atende perfeitamente a fluxos de criação acelerada de software que dispensam configuração manual de ambiente.',
    whyBetter: 'Diferente dos assistentes de chat comuns, entrega um ambiente executável completo com terminal, preview e deploy com 1 clique.',
    paraQueServe: 'Prototipar, construir e publicar aplicações web completas (front-end e back-end) diretamente pelo navegador usando linguagem natural.',
    quandoUsar: 'Ao precisar criar um MVP, landing page ou sistema web funcional em minutos sem abrir o VS Code.',
    quandoNaoUsar: 'Para projetos legados gigantescos que exigem bancos de dados proprietários internos não suportados no container.',
    pontosFortes: 'Ambiente WebContainers ultrarrápido; terminal funcional; preview instantâneo; plano gratuito diário.',
    limitacoes: 'Cotas diárias no plano gratuito de tokens de IA; projetos muito pesados podem atingir limites de memória no browser.',
    exemploPrompt: 'Crie um dashboard em React 19 com Tailwind CSS para monitorar métricas de vendas mensais com gráficos e modo escuro.',
  },
  {
    name: 'NotebookLM',
    officialUrl: 'https://notebooklm.google.com',
    category: 'PESQUISA INTELIGENTE',
    specialty: 'Síntese profunda de fontes documentais próprias e podcasts explicativos em áudio',
    differential: 'Raciocínio ancorado estritamente nas fontes enviadas (PDFs, Docs, vídeos) com citações verificáveis e Audio Overview.',
    level: 'Elite',
    pricingType: 'FREE',
    qualityScore: 95,
    reason: 'Elimina alucinações ao pesquisar exclusivamente dentro do material enviado pelo usuário com plano 100% gratuito.',
    whyDiscovered: 'A melhor alternativa quando o usuário precisa estudar livros, teses, relatórios corporativos ou transcrições sem erros de invenção.',
    whyBetter: 'Não alucina fatos externos; cada resposta aponta a página e o parágrafo exato da fonte citada, com recurso de podcast explicativo em áudio.',
    paraQueServe: 'Analisar e sintetizar até 50 documentos densos ao mesmo tempo, criando resumos, guias de estudo, cronologias e áudios didáticos.',
    quandoUsar: 'Para estudar apostilas, teses acadêmicas, contratos extensos, manuais técnicos ou relatórios financeiros.',
    quandoNaoUsar: 'Para bater papo genérico ou pesquisar eventos em tempo real fora dos documentos submetidos.',
    pontosFortes: 'Totalmente gratuito com Gemini 1.5 Pro no núcleo; citações confiáveis; Audio Overview em estilo podcast envolvente.',
    limitacoes: 'Restrito às fontes enviadas (não faz busca web aberta); requer login com conta Google.',
    exemploPrompt: 'Sintetize os três principais argumentos dos documentos anexados e crie uma tabela comparativa com citações diretas.',
  },
  {
    name: 'V0 by Vercel',
    officialUrl: 'https://v0.dev',
    category: 'CÓDIGO & ENGENHARIA',
    specialty: 'Geração de interfaces e componentes React modernos com Tailwind CSS e shadcn/ui',
    differential: 'Código React modular, limpo e estilizado pronto para copiar e colar em projetos Next.js e Vite.',
    level: 'Alta Performance',
    pricingType: 'FREEMIUM',
    qualityScore: 91,
    reason: 'Gera componentes de UI modernos com Tailwind com padrão de design profissional imediato.',
    whyDiscovered: 'Atende quem busca construir telas bonitas e responsivas rapidamente sem perder tempo desenhando CSS do zero.',
    whyBetter: 'Produz código React com design system de alto padrão compatível com a biblioteca padrão shadcn/ui.',
    paraQueServe: 'Transformar ideias em componentes UI utilizáveis, responsivos e acessíveis em React e Tailwind.',
    quandoUsar: 'Ao criar telas de login, tabelas, modais, formulários ou landing pages modernas.',
    quandoNaoUsar: 'Para desenvolver lógica pesada de backend, bancos de dados relacionais ou microsserviços.',
    pontosFortes: 'Design limpo e polido; exportação direta via CLI do shadcn; plano gratuito com créditos mensais renováveis.',
    limitacoes: 'Cota de gerações gratuitas por mês; focado estritamente na camada visual/componentes.',
    exemploPrompt: 'Desenvolva uma tabela moderna com filtros de busca, paginação, badges de status e botão de exportação CSV em Tailwind.',
  },
  {
    name: 'Krea AI',
    officialUrl: 'https://www.krea.ai',
    category: 'IMAGEM & CRIATIVIDADE',
    specialty: 'Geração de imagem em tempo real, upscaling generativo e aprimoramento visual',
    differential: 'Canvas interativo com renderização em tempo real conforme o usuário desenha formas e adiciona prompts.',
    level: 'Alta Performance',
    pricingType: 'FREEMIUM',
    qualityScore: 89,
    reason: 'Permite controle visual incomparável através do canvas em tempo real com plano gratuito utilizável.',
    whyDiscovered: 'Ideal para profissionais visuais que precisam de feedback instantâneo ao ajustar composições e traços.',
    whyBetter: 'Não obriga o usuário a esperar 30 segundos por geração: a imagem evolui em tempo real a cada traço no canvas.',
    paraQueServe: 'Criar artes conceituais, ilustrações, melhoria e ampliação (upscale) de fotos e texturas em tempo real.',
    quandoUsar: 'Durante sessões de ideação visual onde o posicionamento espacial exato dos elementos importa.',
    quandoNaoUsar: 'Para renderizações de texto complexo ou diagramas técnicos vetoriais.',
    pontosFortes: 'Interatividade em tempo real (< 100ms); upscaler generativo poderoso; plano freemium com cotas diárias.',
    limitacoes: 'Resolução máxima limitada no plano gratuito; exige conexão estável para o canvas ao vivo.',
    exemploPrompt: 'A realistic futuristic architectural building integrated with tropical nature, golden hour cinematic sunlight.',
  },
  {
    name: 'HuggingChat',
    officialUrl: 'https://huggingface.co/chat',
    category: 'MODELOS GERAIS / MULTIMODAL',
    specialty: 'Acesso a múltiplos modelos abertos de última geração com busca web opcional',
    differential: 'Interface aberta da HuggingFace permitindo alternar entre Llama 3.3, Qwen 2.5, DeepSeek e outros sem custo.',
    level: 'Alta Performance',
    pricingType: 'FREE',
    qualityScore: 90,
    reason: 'Plataforma 100% gratuita, sem anúncios, apoiando a comunidade de modelos abertos com navegação web.',
    whyDiscovered: 'Excelente alternativa aberta aos modelos proprietários fechados, sem barreiras de paywall.',
    whyBetter: 'Permite escolher qual arquitetura aberta utilizar para cada tarefa e ativar busca web com 1 clique.',
    paraQueServe: 'Redação, conversação, programação, pesquisa e tradução utilizando modelos abertos de topo.',
    quandoUsar: 'Quando quiser testar múltiplos modelos de pesos abertos sem pagar assinaturas mensais.',
    quandoNaoUsar: 'Para contextos com centenas de páginas onde modelos com 1 milhão de tokens são mandatórios.',
    pontosFortes: 'Totalmente gratuito; biblioteca de prompts e assistentes da comunidade; sem bloqueios artificiais.',
    limitacoes: 'Pode sofrer filas de espera em horários de pico nos servidores públicos.',
    exemploPrompt: 'Explique a diferença entre microserviços e monólitos modulares com vantagens e desvantagens para uma startup.',
  },
  {
    name: 'Phind',
    officialUrl: 'https://www.phind.com',
    category: 'PESQUISA INTELIGENTE',
    specialty: 'Mecanismo de busca e resolução técnica especializado para engenheiros e programadores',
    differential: 'Conecta documentações oficiais de APIs, GitHub e fóruns com síntese de código explicada.',
    level: 'Alta Performance',
    pricingType: 'FREEMIUM',
    qualityScore: 88,
    reason: 'Busca técnica com foco preciso em código e documentação técnica atualizada com plano gratuito.',
    whyDiscovered: 'Atende desenvolvedores que precisam de respostas rápidas ancoradas nas documentações mais recentes.',
    whyBetter: 'Mais focado em APIs e engenharia de software do que motores de pesquisa genéricos.',
    paraQueServe: 'Pesquisar erros de compilação, sintaxe de novas bibliotecas e arquiteturas de código com referências web.',
    quandoUsar: 'Ao encontrar um erro críptico de framework ou biblioteca nova.',
    quandoNaoUsar: 'Para pesquisa de notícias diárias, celebridades ou tarefas artísticas.',
    pontosFortes: 'Respostas técnicas com snippets de código limpos e links diretos para a documentação oficial.',
    limitacoes: 'Cota de perguntas em modelos mais avançados no plano gratuito.',
    exemploPrompt: 'Como configurar rotas protegidas no Next.js App Router com cookies e middleware no Next 15?',
  },
  // Casos para teste de rejeição de regras C, D, E
  {
    name: 'Midjourney v6 (Exemplo de Teste de IA Paga)',
    officialUrl: 'https://www.midjourney.com',
    category: 'IMAGEM & CRIATIVIDADE',
    specialty: 'Geração fotorrealista de altíssima fidelidade',
    differential: 'Referência estética de geração de imagens.',
    level: 'Elite',
    pricingType: 'PAID', // Deve ser rejeitada pela regra de gratuidade!
    qualityScore: 94,
    reason: 'Excelente qualidade estética, mas não possui plano gratuito contínuo.',
    whyDiscovered: 'Teste de curadoria de ferramentas comerciais.',
    whyBetter: 'Excepcional fotorrealismo.',
  },
  {
    name: 'Runway Gen-3 Trial (Exemplo de Teste de Apenas Trial)',
    officialUrl: 'https://runwayml.com',
    category: 'VÍDEO & PRODUÇÃO',
    specialty: 'Geração de vídeo de alta qualidade',
    differential: 'Modelos de difusão de vídeo de última geração.',
    level: 'Elite',
    pricingType: 'TRIAL', // Deve ser rejeitada pela regra de trial!
    qualityScore: 92,
    reason: 'Ferramenta de ponta, porém após o período de teste exige assinatura paga.',
    whyDiscovered: 'Teste de curadoria para desqualificação de planos meramente experimentais.',
    whyBetter: 'Liderança em vídeo generativo.',
  },
  {
    name: 'BasicTool AI (Exemplo de Teste de Baixa Qualidade)',
    officialUrl: 'https://basic-tool-example.ai',
    category: 'MODELOS GERAIS / MULTIMODAL',
    specialty: 'Assistente simples de texto',
    differential: 'Apenas uma interface genérica sobre modelos antigos.',
    level: 'Especializada',
    pricingType: 'FREE',
    qualityScore: 68, // Deve ser rejeitada pelo qualityThreshold < 80!
    reason: 'Ferramenta gratuita mas sem diferenciais ou robustez técnica.',
    whyDiscovered: 'Teste de filtro de qualidade mínima.',
    whyBetter: 'Nenhuma vantagem clara sobre as opções existentes.',
  },
];

/**
 * Função principal DISCOVERY MODE:
 * Solicita à API da Groq (ou fallback local se Groq estiver indisponível)
 * possíveis novas IAs para atender à necessidade específica do usuário.
 */
export async function discoverNewAI(
  taskDescription: string,
  currentCatalog: IAItem[]
): Promise<{
  source: 'groq_api' | 'local_curator';
  candidates: DiscoveredAICandidate[];
  evaluatedResults: CandidateEvaluationResult[];
  acceptedCandidates: DiscoveredAICandidate[];
  rejectedCandidates: CandidateEvaluationResult[];
  error?: string;
}> {
  let rawCandidates: DiscoveredAICandidate[] = [];
  let source: 'groq_api' | 'local_curator' = 'local_curator';

  // 1. Tentar chamar a API da Groq através do backend seguro (/api/groq/discover)
  try {
    const response = await fetch('/api/groq/discover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskDescription,
        currentCatalogIAs: currentCatalog.map((item) => ({
          name: item.name,
          url: item.link,
          category: item.category,
        })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.candidates) && data.candidates.length > 0) {
        rawCandidates = data.candidates.slice(0, 5);
        source = 'groq_api';
      }
    }
  } catch (err) {
    console.warn('[Discovery Engine] Backend Groq inacessível ou falhou, usando curador local seguro:', err);
  }

  // 2. Fallback: Se a Groq não retornou candidatos (ou rede offline / sem chave / erro),
  // aciona o curador local inteligente (Requisito H)
  if (rawCandidates.length === 0) {
    source = 'local_curator';
    rawCandidates = getLocalCuratedCandidates(taskDescription, currentCatalog);
  }

  // 3. Aplicação rigorosa dos Filtros Automáticos de Qualidade, Gratuidade, URL e Duplicidade
  const evaluatedResults = rawCandidates.map((candidate) =>
    evaluateCandidate(candidate, currentCatalog)
  );

  const acceptedCandidates = evaluatedResults
    .filter((r) => r.passed)
    .map((r) => r.candidate);

  const rejectedCandidates = evaluatedResults.filter((r) => !r.passed);

  return {
    source,
    candidates: rawCandidates,
    evaluatedResults,
    acceptedCandidates,
    rejectedCandidates,
  };
}

/**
 * Filtra a base local de curadoria inteligente de acordo com os termos da tarefa do usuário
 * e exclui duplicatas já existentes no catálogo.
 */
function getLocalCuratedCandidates(taskDescription: string, currentCatalog: IAItem[]): DiscoveredAICandidate[] {
  const normTask = taskDescription.toLowerCase();

  // Ordena por relevância textual com a tarefa
  const candidates = [...LOCAL_CURATED_DISCOVERY_POOL].sort((a, b) => {
    let scoreA = a.qualityScore;
    let scoreB = b.qualityScore;

    const textA = `${a.name} ${a.category} ${a.specialty} ${a.differential} ${a.reason}`.toLowerCase();
    const textB = `${b.name} ${b.category} ${b.specialty} ${b.differential} ${b.reason}`.toLowerCase();

    // Palavras-chave da tarefa
    const words = normTask.split(/\s+/).filter((w) => w.length > 3);
    for (const w of words) {
      if (textA.includes(w)) scoreA += 15;
      if (textB.includes(w)) scoreB += 15;
    }

    return scoreB - scoreA;
  });

  return candidates.slice(0, 5);
}

/**
 * Converte um candidato aprovado em um item completo de IAItem pronto para o catálogo e localStorage.
 */
export function convertCandidateToIAItem(
  candidate: DiscoveredAICandidate,
  existingIAs: IAItem[]
): IAItem {
  const maxId = existingIAs.reduce((max, item) => Math.max(max, item.id || 0), 0);
  const newId = maxId + 1;
  const nowIso = new Date().toISOString();

  const pricingLabel = candidate.pricingType === 'FREE' ? 'Gratuito' : 'Freemium (Grátis + Pago)';

  return {
    id: newId,
    name: candidate.name,
    category: candidate.category,
    specialty: candidate.specialty,
    differential: candidate.differential,
    level: candidate.level,
    link: candidate.officialUrl,
    scores: {
      Geral: Math.round(candidate.qualityScore / 20),
      Código: candidate.category === 'CÓDIGO & ENGENHARIA' ? 5 : 3,
      Pesquisa: candidate.category === 'PESQUISA INTELIGENTE' ? 5 : 3,
      Criação: candidate.category === 'IMAGEM & CRIATIVIDADE' || candidate.category === 'VÍDEO & PRODUÇÃO' ? 5 : 3,
      Automação: candidate.category === 'AUTOMAÇÃO & EXECUÇÃO' ? 5 : 3,
      Produtividade: candidate.category === 'PRODUTIVIDADE EMPRESARIAL' ? 5 : 4,
    },
    difficulty: candidate.level === 'Elite' ? 'Avançado' : 'Intermediário',
    pricing: pricingLabel,
    pricingDetails: candidate.pricingType === 'FREE' ? 'Modalidade 100% gratuita utilizável' : 'Plano gratuito funcional contínuo com recursos premium opcionais',
    whatIsIt: candidate.specialty,
    whatIsItFor: candidate.paraQueServe || candidate.reason,
    bestTasks: [
      candidate.specialty,
      `Uso focado em: ${candidate.category.toLowerCase()}`,
      `Diferencial operacional: ${candidate.differential}`,
    ],
    keySkills: ['Curadoria Groq', candidate.category, candidate.pricingType],
    beginnerTip: `Ferramenta descoberta pelo Curador Inteligente Groq com qualidade estimada de ${candidate.qualityScore}%.`,
    tags: ['Groq Curator', candidate.category, candidate.pricingType, 'Descoberta Automática'],
    isFeaturedForBeginners: candidate.pricingType === 'FREE',

    // Ficha Operacional V2.2
    paraQueServe: candidate.paraQueServe || candidate.reason,
    quandoUsar: candidate.quandoUsar || `Indicado quando você busca alta qualidade em ${candidate.category.toLowerCase()}.`,
    quandoNaoUsar: candidate.quandoNaoUsar || 'Quando a tarefa puder ser resolvida com as ferramentas gerais já consolidadas no seu catálogo.',
    melhorPara: candidate.specialty,
    pontosFortes: candidate.pontosFortes || candidate.differential,
    limitacoes: candidate.limitacoes || 'Consulte limites de cota operacional diária na documentação oficial.',
    exemploPrompt: candidate.exemploPrompt || `Atue como especialista em ${candidate.specialty} e resolva o seguinte objetivo com precisão: [insira seu contexto aqui].`,
    observacaoEstrategica: candidate.whyBetter || candidate.reason,

    // Metadados Groq Curator V2.3
    sourceType: 'groq_discovered',
    discoveredAt: nowIso,
    lastValidated: nowIso,
    pricingType: candidate.pricingType,
    qualityScore: candidate.qualityScore,
    whyDiscovered: candidate.whyDiscovered || candidate.reason,
    whyBetter: candidate.whyBetter || 'Apresenta alta especialização e plano gratuito funcional relevante.',
    validationStatus: 'NECESSITA_VALIDACAO', // Conforme seção 17: Marcar "Necessita validação"
  };
}
