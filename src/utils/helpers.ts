import { IACategory, IADifficulty, IALevel, IAPricing, IAItem } from '../types';

export const categoryIcons: Record<IACategory, string> = {
  'MODELOS GERAIS / MULTIMODAL': '🧠',
  'PESQUISA INTELIGENTE': '🔎',
  'CÓDIGO & ENGENHARIA': '💻',
  'AUTOMAÇÃO & EXECUÇÃO': '⚙️',
  'IMAGEM & CRIATIVIDADE': '🎨',
  'VÍDEO & PRODUÇÃO': '🎬',
  'ÁUDIO & MÚSICA': '🎧',
  'PRODUTIVIDADE EMPRESARIAL': '📊',
};

// Nomes amigáveis e curtos para iniciantes
export const friendlyCategoryLabels: Record<IACategory, string> = {
  'MODELOS GERAIS / MULTIMODAL': 'Conversas, Textos & Tarefas Gerais',
  'PESQUISA INTELIGENTE': 'Pesquisa com Fontes Confiáveis',
  'CÓDIGO & ENGENHARIA': 'Programação, Criação de Apps & Sites',
  'AUTOMAÇÃO & EXECUÇÃO': 'Automação de Tarefas & Agentes',
  'IMAGEM & CRIATIVIDADE': 'Criação e Edição de Imagens',
  'VÍDEO & PRODUÇÃO': 'Geração de Vídeos & Animações',
  'ÁUDIO & MÚSICA': 'Vozes, Narrações & Músicas',
  'PRODUTIVIDADE EMPRESARIAL': 'Produtividade, Planilhas & Documentos',
};

export function getLevelBadgeClass(level: IALevel): string {
  switch (level) {
    case 'Elite':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]';
    case 'Alta Performance':
      return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,212,255,0.15)]';
    case 'Especializada':
      return 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
}

export function getDifficultyBadgeClass(difficulty: IADifficulty): string {
  switch (difficulty) {
    case 'Iniciante':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    case 'Intermediário':
      return 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
    case 'Avançado':
      return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
}

export function getPricingBadgeClass(pricing: IAPricing): string {
  switch (pricing) {
    case 'Gratuito':
      return 'bg-teal-500/15 text-teal-300 border border-teal-500/30';
    case 'Freemium (Grátis + Pago)':
      return 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30';
    case 'Pago com Teste Grátis':
      return 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30';
    case 'Pago':
      return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
}

export function resolveIADetails(ia: IAItem) {
  // Infer difficulty if not set
  let difficulty: IADifficulty = ia.difficulty || 'Intermediário';
  if (!ia.difficulty) {
    if (['ChatGPT', 'Perplexity', 'Claude', 'You.com', 'Photoroom', 'Notion AI', 'Wispr Flow', 'Krea', 'YouCam AI Pro'].includes(ia.name)) {
      difficulty = 'Iniciante';
    } else if (['Cursor', 'Zapier', 'n8n', 'Manus IA', 'Replit', 'Phind', 'Make'].includes(ia.name)) {
      difficulty = 'Avançado';
    }
  }

  // Infer pricing if not set
  let pricing: IAPricing = ia.pricing || 'Freemium (Grátis + Pago)';
  if (!ia.pricing) {
    if (['Codeium', 'Stability AI'].includes(ia.name)) {
      pricing = 'Gratuito';
    } else if (['Midjourney', 'Synthesia', 'Runway', 'Sora', 'Veo 3.2'].includes(ia.name)) {
      pricing = 'Pago com Teste Grátis';
    }
  }

  // Infer what it is
  const whatIsIt =
    ia.whatIsIt ||
    `${ia.name} é uma ferramenta de inteligência artificial de categoria ${ia.category.toLowerCase()}, focada em ${ia.specialty.toLowerCase()}.`;

  // Infer what it's for
  const whatIsItFor =
    ia.whatIsItFor ||
    `Serve para ${ia.specialty.toLowerCase()}, oferecendo como diferencial: ${ia.differential.toLowerCase()}.`;

  // Infer best tasks
  const bestTasks =
    ia.bestTasks && ia.bestTasks.length > 0
      ? ia.bestTasks
      : [
          `Execução ágil de ${ia.specialty.toLowerCase()}`,
          `Aproveitar o diferencial: ${ia.differential}`,
          `Otimizar fluxos em ${ia.category.split(' / ')[0].toLowerCase()}`,
        ];

  // Infer pricing details
  const pricingDetails =
    ia.pricingDetails ||
    (pricing === 'Gratuito'
      ? 'Acesso gratuito disponível para uso individual.'
      : pricing === 'Freemium (Grátis + Pago)'
      ? 'Possui versão gratuita com limite diário/mensal de consultas e recursos premium opcionais.'
      : pricing === 'Pago com Teste Grátis'
      ? 'Oferece créditos iniciais ou período de teste gratuito para experimentar.'
      : 'Requer assinatura para uso contínuo.');

  // Infer key skills
  const keySkills =
    ia.keySkills && ia.keySkills.length > 0
      ? ia.keySkills
      : [ia.specialty.split(',')[0], ia.differential.split(',')[0], ia.category.split(' / ')[0]];

  // Beginner tip
  const beginnerTip =
    ia.beginnerTip ||
    `Comece fazendo perguntas ou pedidos diretos e claros. Descreva o que você precisa em português simples e ajuste o resultado pedindo melhorias.`;

  // Tags
  const tags =
    ia.tags && ia.tags.length > 0
      ? ia.tags
      : [ia.category.split(' / ')[0], difficulty, pricing, ia.level];

  return {
    difficulty,
    pricing,
    pricingDetails,
    whatIsIt,
    whatIsItFor,
    bestTasks,
    keySkills,
    beginnerTip,
    tags,
  };
}


