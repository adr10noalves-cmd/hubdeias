import { IAItem, IACategory } from '../types';

export interface OperationalSheetData {
  nome: string;
  categoria: IACategory;
  especialidade: string;
  nivel: string;
  linkOficial: string;

  // SEÇÃO 1 — PARA QUE SERVE
  paraQueServe: string;
  isParaQueServeAuto: boolean;

  // SEÇÃO 2 — QUANDO USAR
  quandoUsar: string;
  isQuandoUsarAuto: boolean;

  // SEÇÃO 3 — QUANDO NÃO USAR
  quandoNaoUsar: string;
  isQuandoNaoUsarAuto: boolean;

  // SEÇÃO 4 — PONTOS FORTES
  pontosFortes: string;
  isPontosFortesAuto: boolean;

  // SEÇÃO 5 — LIMITAÇÕES
  limitacoes: string;
  isLimitacoesAuto: boolean;

  // SEÇÃO 6 — EXEMPLO PRÁTICO
  exemploPrompt: string;
  isExemploPromptAuto: boolean;

  // SEÇÃO 7 — RECOMENDAÇÃO ESTRATÉGICA
  recomendacaoEstrategica: string;
  isRecomendacaoEstrategicaAuto: boolean;

  hasAnyAuto: boolean;
}

export const AUTO_GENERATED_LABEL = 'Descrição estratégica baseada nos dados cadastrados.';

export function resolveOperationalSheet(ia: IAItem): OperationalSheetData {
  const nome = ia.name || 'IA Sem Nome';
  const categoria = ia.category;
  const especialidade = ia.specialty || 'Inteligência Artificial';
  const nivel = ia.level || 'Alta Performance';
  const linkOficial = ia.link || 'https://';

  // 1. PARA QUE SERVE
  let paraQueServe = ia.paraQueServe?.trim();
  let isParaQueServeAuto = false;
  if (!paraQueServe) {
    isParaQueServeAuto = true;
    if (ia.whatIsItFor?.trim()) {
      paraQueServe = ia.whatIsItFor.trim();
    } else {
      paraQueServe = `Ferramenta de inteligência artificial na categoria de ${categoria.toLowerCase()}, projetada especialmente para ${especialidade.toLowerCase()}. Resolve gargalos operacionais e acelera a execução diária com qualidade consistente.`;
    }
  }

  // 2. QUANDO USAR
  let quandoUsar = ia.quandoUsar?.trim();
  let isQuandoUsarAuto = false;
  if (!quandoUsar) {
    isQuandoUsarAuto = true;
    if (ia.melhorPara?.trim()) {
      quandoUsar = ia.melhorPara.trim();
    } else if (ia.bestTasks && ia.bestTasks.length > 0) {
      quandoUsar = `Indicada prioritariamente para: ${ia.bestTasks.join(' • ')}. É a escolha ideal quando a sua principal demanda envolve ${especialidade.toLowerCase()}.`;
    } else {
      quandoUsar = `Mais indicada em projetos e tarefas focados em ${especialidade.toLowerCase()}, principalmente para fluxos que exigem padrão ${nivel} e assertividade na entrega.`;
    }
  }

  // 3. QUANDO NÃO USAR
  let quandoNaoUsar = ia.quandoNaoUsar?.trim();
  let isQuandoNaoUsarAuto = false;
  if (!quandoNaoUsar) {
    isQuandoNaoUsarAuto = true;
    switch (categoria) {
      case 'CÓDIGO & ENGENHARIA':
        quandoNaoUsar = `Evite utilizar para geração direta de ilustrações visuais, design gráfico puro ou mixagem de áudio/música. Para essas tarefas, prefira ferramentas dedicadas das categorias criativas.`;
        break;
      case 'IMAGEM & CRIATIVIDADE':
        quandoNaoUsar = `Não é recomendada para raciocínio matemático rigoroso, cálculos estatísticos ou depuração de arquiteturas de código fonte.`;
        break;
      case 'VÍDEO & PRODUÇÃO':
        quandoNaoUsar = `Evite para produção textual longa, relatórios densos ou consultas a documentações técnicas sem contexto audiovisual.`;
        break;
      case 'ÁUDIO & MÚSICA':
        quandoNaoUsar = `Não indicada para análise de planilhas financeiras, programação ou geração de imagens estáticas.`;
        break;
      case 'PESQUISA INTELIGENTE':
        quandoNaoUsar = `Não indicada para automações de infraestrutura técnica sem navegação, nem para renderização artística hiper-realista.`;
        break;
      case 'AUTOMAÇÃO & EXECUÇÃO':
        quandoNaoUsar = `Evite usar para bate-papo criativo informal ou redação puramente poética sem propósitos de integração e fluxo de trabalho.`;
        break;
      case 'PRODUTIVIDADE EMPRESARIAL':
        quandoNaoUsar = `Não é voltada para modelagem gráfica 3D pesada ou codificação de baixo nível.`;
        break;
      default:
        quandoNaoUsar = `Não recomendada quando a demanda exigir ferramentas altamente verticais de nichos opostos (como renderização física ou automações industriais específicas).`;
        break;
    }
  }

  // 4. PONTOS FORTES
  let pontosFortes = ia.pontosFortes?.trim();
  let isPontosFortesAuto = false;
  if (!pontosFortes) {
    isPontosFortesAuto = true;
    const skills = ia.keySkills && ia.keySkills.length > 0 ? ` [Competências: ${ia.keySkills.join(', ')}]` : '';
    pontosFortes = `Diferencial competitivo cadastrado: ${ia.differential}.${skills} Classificada no patamar ${nivel} do catálogo.`;
  }

  // 5. LIMITAÇÕES
  let limitacoes = ia.limitacoes?.trim();
  let isLimitacoesAuto = false;
  if (!limitacoes) {
    isLimitacoesAuto = true;
    const pricingNote = ia.pricingDetails ? ` Informação de plano: ${ia.pricingDetails}` : '';
    limitacoes = `Por ser uma solução de nível ${nivel} (${ia.pricing || 'Freemium'}), a precisão dos resultados depende da qualidade das instruções fornecidas pelo usuário e de eventuais cotas de uso.${pricingNote}`;
  }

  // 6. EXEMPLO PRÁTICO (PROMPT)
  let exemploPrompt = ia.exemploPrompt?.trim();
  let isExemploPromptAuto = false;
  if (!exemploPrompt) {
    isExemploPromptAuto = true;
    if (ia.beginnerTip?.trim()) {
      exemploPrompt = `Prompt recomendado para ${nome}:\n"${ia.beginnerTip.trim()}"`;
    } else {
      switch (categoria) {
        case 'CÓDIGO & ENGENHARIA':
          exemploPrompt = `Atue como engenheiro de software sênior. Analise o código a seguir, aponte potenciais falhas de segurança e gargalos de performance, e forneça a versão corrigida e refatorada com comentários explicativos:\n\n[Insira seu código aqui]`;
          break;
        case 'PESQUISA INTELIGENTE':
          exemploPrompt = `Faça um levantamento aprofundado com fontes confiáveis sobre [insira o tema da pesquisa]. Estruture a resposta com: 1) Resumo executivo, 2) Pontos de consenso científico, 3) Controvérsias ou desafios atuais, 4) Fontes e referências verificáveis.`;
          break;
        case 'IMAGEM & CRIATIVIDADE':
          exemploPrompt = `Crie uma imagem de altíssima qualidade de [descreva o sujeito/cena], iluminação volumétrica cinematográfica, composição em regra dos terços, riqueza de texturas e paleta de cores harmoniosa, estilo profissional em 8k.`;
          break;
        case 'VÍDEO & PRODUÇÃO':
          exemploPrompt = `Crie um roteiro dinâmico e prompt de vídeo para um clipe de 30 segundos sobre [assunto]: descreva o ângulo de câmera, iluminação suave, movimentos lentos e transições fluídas entre cada cena.`;
          break;
        case 'ÁUDIO & MÚSICA':
          exemploPrompt = `Componha uma faixa instrumental no estilo [descrever gênero musical], andamento moderado (110 BPM), com introdução atmosférica, clímax melódico inspirador e final suave.`;
          break;
        case 'AUTOMAÇÃO & EXECUÇÃO':
          exemploPrompt = `Esboce uma automação passo a passo que conecte [ferramenta de origem] com [ferramenta de destino]: quando um novo gatilho for disparado, valide os dados, formate a saída e envie uma notificação com o resumo da ação.`;
          break;
        case 'PRODUTIVIDADE EMPRESARIAL':
          exemploPrompt = `Organize e sintetize os seguintes apontamentos de reunião em três blocos claros: 1) Principais decisões tomadas, 2) Tarefas pendentes com os respectivos responsáveis, 3) Prazos e prioridades da semana:\n\n[Colar apontamentos aqui]`;
          break;
        default:
          exemploPrompt = `Atue como especialista em ${especialidade}. Preciso que você me auxilie a [descrever seu objetivo]. Forneça um guia passo a passo, recomendações práticas e exemplos aplicados para rápida implementação.`;
          break;
      }
    }
  }

  // 7. RECOMENDAÇÃO ESTRATÉGICA
  let recomendacaoEstrategica = ia.observacaoEstrategica?.trim();
  let isRecomendacaoEstrategicaAuto = false;
  if (!recomendacaoEstrategica) {
    isRecomendacaoEstrategicaAuto = true;
    recomendacaoEstrategica = `Dentro do Hub Estratégico, o ${nome} é posicionado como uma ferramenta de nível ${nivel} na categoria de ${categoria}. Sua principal fortaleza está em "${ia.differential}", tornando-a uma recomendação de alto retorno para quem prioriza excelência em ${especialidade.toLowerCase()}.`;
  }

  const hasAnyAuto =
    isParaQueServeAuto ||
    isQuandoUsarAuto ||
    isQuandoNaoUsarAuto ||
    isPontosFortesAuto ||
    isLimitacoesAuto ||
    isExemploPromptAuto ||
    isRecomendacaoEstrategicaAuto;

  return {
    nome,
    categoria,
    especialidade,
    nivel,
    linkOficial,
    paraQueServe,
    isParaQueServeAuto,
    quandoUsar,
    isQuandoUsarAuto,
    quandoNaoUsar,
    isQuandoNaoUsarAuto,
    pontosFortes,
    isPontosFortesAuto,
    limitacoes,
    isLimitacoesAuto,
    exemploPrompt,
    isExemploPromptAuto,
    recomendacaoEstrategica,
    isRecomendacaoEstrategicaAuto,
    hasAnyAuto,
  };
}
