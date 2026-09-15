import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_KEY =
  process.env.GROQ_API_KEY || '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';

const GROQ_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

async function callGroqWithFallback(systemPrompt: string, userPrompt: string, maxTokens = 2048) {
  let groqResponse: Response | null = null;
  let modelUsed = '';

  for (const model of GROQ_MODELS) {
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: maxTokens,
        }),
      });

      if (resp.ok) {
        groqResponse = resp;
        modelUsed = model;
        break;
      } else {
        console.warn(`[Groq Model ${model}] retornou status ${resp.status}`);
      }
    } catch (e) {
      console.warn(`[Groq Model ${model}] erro de conexão:`, e);
    }
  }

  if (!groqResponse) {
    throw new Error('Todos os modelos Groq retornaram erro ou limite de requisições excedido.');
  }

  const data: any = await groqResponse.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Resposta vazia da API Groq');

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error('Não foi possível interpretar o JSON retornado pela Groq');
    }
  }

  return { parsed, modelUsed };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Use POST.' });
    return;
  }

  const { action, payload } = req.body || {};

  if (!action) {
    res.status(400).json({ error: 'Parâmetro "action" é obrigatório.' });
    return;
  }

  try {
    switch (action) {
      case 'detect_intent': {
        const userPrompt = String(payload?.userPrompt || '');
        const systemPrompt = `Você é o classificador semântico de intenções do "HUB ESTRATÉGICO DE IAs — CENTRAL DE COMANDO".
Analise o comando ou pergunta do usuário e classifique em UMA das seguintes intenções:
- "recommend": Encontrar, escolher ou recomendar a melhor IA para uma tarefa ou objetivo específico.
- "generate_prompt": Criar, otimizar, formatar ou melhorar um prompt para uma IA específica ou geral.
- "compare": Comparar duas ou mais IAs específicas em capacidades, programação, raciocínio ou adequação.
- "register_ai": Cadastrar, adicionar, incluir uma nova IA no catálogo do hub.
- "discover_ai": Descobrir, buscar novas IAs externas ou pesquisar novas ferramentas do mercado.
- "build_strategy": Montar uma estratégia, plano em etapas, pipeline ou fluxo operacional com múltiplas IAs.
- "query_catalog": Fazer uma pergunta sobre o catálogo atual (quais IAs tenho, quais gratuitas, qual a melhor de vídeo existente no catálogo, etc).

Retorne em formato JSON estrito:
{
  "intent": "recommend" | "generate_prompt" | "compare" | "register_ai" | "discover_ai" | "build_strategy" | "query_catalog",
  "confidence": number (entre 0 e 1),
  "targetIA": string | null (se o usuário mencionou uma IA específica),
  "selectedAIs": string[] (se o usuário mencionou IAs para comparar),
  "extractedTask": string (resumo do objetivo central)
}`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, `Comando do usuário: "${userPrompt}"`, 512);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'recommend': {
        const taskDescription = String(payload?.taskDescription || '');
        const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
        const catalogSummary = catalog
          .map((item: any) => `- ${item.name} | Cat: ${item.category} | Esp: ${item.specialty} | Nível: ${item.level} | Preço: ${item.pricing} | Link: ${item.link}`)
          .join('\n');

        const systemPrompt = `Você é o Especialista de Recomendação Estratégica do "HUB ESTRATÉGICO DE IAs".
Sua tarefa é analisar a necessidade do usuário e selecionar do CATÁLOGO as 3 melhores IAs:
1. 🏆 MELHOR IA (Campeã indiscutível para a tarefa)
2. 🥈 SEGUNDA OPÇÃO (Excelente alternativa com diferencial complementar)
3. 🥉 TERCEIRA OPÇÃO (Opção especializada ou econômica viável)

REGRA ABSOLUTA: Recomende APENAS IAs que estejam presentes na lista do catálogo fornecida. Não invente nomes de ferramentas fora do catálogo.
Avalie a compatibilidade estimada de 0 a 100% de forma realista.

Retorne em JSON estrito:
{
  "champion": {
    "name": "Nome da IA do catálogo",
    "specialty": "Especialidade principal",
    "compatibility": number (0-100),
    "reason": "Explicação estratégica detalhada de por que é a melhor",
    "officialUrl": "URL oficial da ferramenta"
  },
  "second": {
    "name": "Nome da segunda IA do catálogo",
    "specialty": "Especialidade principal",
    "compatibility": number (0-100),
    "reason": "Por que é uma ótima segunda opção",
    "officialUrl": "URL oficial da ferramenta"
  },
  "third": {
    "name": "Nome da terceira IA do catálogo",
    "specialty": "Especialidade principal",
    "compatibility": number (0-100),
    "reason": "Por que é uma boa terceira opção",
    "officialUrl": "URL oficial da ferramenta"
  }
}`;
        const userPrompt = `NECESSIDADE DO USUÁRIO: "${taskDescription}"\n\nCATÁLOGO DE IAs DISPONÍVEIS:\n${catalogSummary}`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 1500);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'generate_prompt': {
        const { objective, targetIA, level, desiredResult, language, originalPrompt, context, constraints, mode, refinementInstruction } = payload || {};
        const chosenLang = language === 'en' ? 'Inglês' : 'Português do Brasil (pt-BR)';
        const promptLevel = level || 'Profissional';
        
        const systemPrompt = `Você é um especialista em engenharia de prompts.
Sua função é transformar solicitações humanas em instruções claras, precisas, contextualizadas e eficazes para a IA de destino (${targetIA || 'Geral'}).
Preserve a intenção original do usuário rigorosamente. Não transforme um pedido simples em algo complexo que o usuário não pediu.
NÃO invente fatos ou dados fictícios. Quando faltar uma informação essencial, insira um marcador objetivo (ex: [INFORMAR PÚBLICO-ALVO], [INFORMAR PRAZO]) ou faça uma pergunta lógica.
Identifique lacunas importantes.
Adapte a estrutura e as diretrizes à capacidade da IA de destino:
- Se IA de programação: priorizar contexto técnico, arquitetura, requisitos, restrições, tecnologias, estrutura de arquivos e critérios de aceitação.
- Se IA de imagem: priorizar assunto, composição, ambiente, iluminação, estilo, enquadramento, proporção e elementos obrigatórios.
- Se IA de vídeo: priorizar cena, personagem, movimento, câmera, ambiente, iluminação, duração e estilo visual.
- Se IA de pesquisa: priorizar pergunta, escopo, profundidade, fontes e formato da resposta.
- Se IA de escrita: priorizar público, tom, objetivo, estrutura, tamanho e mensagem principal.

NÍVEL DO PROMPT: "${promptLevel}"
- Básico: prompt simples e direto.
- Profissional: prompt estruturado e detalhado.
- Especialista: prompt altamente contextualizado, com critérios, restrições, etapas e formato de saída rigorosos.

⚠️ REGRA OBRIGATÓRIA DE IDIOMA:
O prompt gerado no campo "improvedPrompt" E todos os campos explicativos (role, instructions, constraints, responseFormat, qualityCriteria, improvements, missingInformation) DEVEM OBRIGATORIAMENTE ESTAR EM ${chosenLang}.

Retorne em JSON estrito:
{
  "originalPrompt": "${originalPrompt || objective || ''}",
  "improvedPrompt": "Texto completo, robusto, aprimorado e formatado do prompt profissional pronto para copiar",
  "objective": "Objetivo sintetizado",
  "targetIA": "${targetIA || 'Geral'}",
  "promptLevel": "${promptLevel}",
  "role": "Papel e autoridade definidos para a IA",
  "instructions": ["Passo 1", "Passo 2", "Passo 3"],
  "constraints": ["Restrição 1", "Restrição 2"],
  "responseFormat": "Descrição do formato exigido",
  "qualityCriteria": "Critérios para considerar o resultado aprovado",
  "improvements": ["✓ objetivo esclarecido", "✓ contexto estruturado", "✓ requisitos organizados"],
  "missingInformation": []
}`;

        const userPrompt = `ORIGINAL / PEDIDO: "${originalPrompt || objective || ''}"
OBJETIVO INFORMADO: "${objective || ''}"
CONTEXTO: "${context || 'Não informado'}"
RESTRIÇÕES: "${constraints || 'Nenhuma especificada'}"
RESULTADO ESPERADO: "${desiredResult || 'Excelente e aplicável imediatamente'}"
IA DESTINO: "${targetIA || 'Geral'}"
NÍVEL: "${promptLevel}"
REFINAMENTO ADICIONAL (se houver): "${refinementInstruction || 'Nenhum'}"
IDIOMA OBRIGATÓRIO: ${chosenLang}`;

        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 2500);
        res.json({ 
          success: true, 
          prompt: parsed.improvedPrompt || parsed.prompt,
          ...parsed, 
          modelUsed 
        });
        return;
      }

      case 'compare': {
        const { selectedIANames, objective, catalog } = payload || {};
        const catalogList = Array.isArray(catalog) ? catalog : [];
        const targetNames: string[] = Array.isArray(selectedIANames) ? selectedIANames : [];
        const matchedIAs = catalogList.filter((item: any) => targetNames.includes(item.name));

        const systemPrompt = `Você é o Avaliador e Árbitro Técnico de IAs da CENTRAL DE COMANDO.
Compare as IAs selecionadas pelo usuário considerando o objetivo informado.
NÃO invente dados falsos ou benchmarks científicos fictícios.
Avalie as dimensões chave:
- Capacidade
- Facilidade
- Criatividade
- Código
- Raciocínio
- Automação
- Adequação ao objetivo
- Nível recomendado

Calcule uma "compatibilidade estimada" (0 a 100%) para cada IA em relação ao objetivo específico.
Apresente um veredito claro, recomendando qual é a vencedora para essa finalidade e o motivo.

Retorne em JSON estrito:
{
  "objective": "${objective || 'Comparação geral'}",
  "iasCompared": ${JSON.stringify(targetNames)},
  "compatibilityScores": { "NomeIA1": 92, "NomeIA2": 85 },
  "dimensions": [
    { "dimension": "Capacidade Geral", "scores": { "NomeIA1": 90, "NomeIA2": 85 }, "notes": { "NomeIA1": "Nota", "NomeIA2": "Nota" } },
    { "dimension": "Facilidade de Uso", "scores": { "NomeIA1": 85, "NomeIA2": 95 }, "notes": { "NomeIA1": "Nota", "NomeIA2": "Nota" } },
    { "dimension": "Criatividade", "scores": { "NomeIA1": 90, "NomeIA2": 80 }, "notes": { "NomeIA1": "Nota", "NomeIA2": "Nota" } },
    { "dimension": "Código & Engenharia", "scores": { "NomeIA1": 95, "NomeIA2": 80 }, "notes": { "NomeIA1": "Nota", "NomeIA2": "Nota" } },
    { "dimension": "Raciocínio Lógico", "scores": { "NomeIA1": 94, "NomeIA2": 88 }, "notes": { "NomeIA1": "Nota", "NomeIA2": "Nota" } },
    { "dimension": "Automação", "scores": { "NomeIA1": 80, "NomeIA2": 85 }, "notes": { "NomeIA1": "Nota", "NomeIA2": "Nota" } },
    { "dimension": "Adequação ao Objetivo", "scores": { "NomeIA1": 96, "NomeIA2": 82 }, "notes": { "NomeIA1": "Nota", "NomeIA2": "Nota" } }
  ],
  "verdict": "Veredito analítico comparando os pontos fortes e limitações de cada uma para este caso",
  "recommendedWinner": "Nome da IA mais indicada para o objetivo",
  "winnerReason": "Motivo estratégico da escolha da vencedora"
}`;
        const userPrompt = `OBJETIVO DA COMPARAÇÃO: "${objective || 'Qual a melhor opção?'}"\nIAs A COMPARAR: ${targetNames.join(', ')}\nDETALHES DO CATÁLOGO:\n${JSON.stringify(matchedIAs)}`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 2048);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'register_ai': {
        const promptOrName = String(payload?.promptOrName || '');
        const systemPrompt = `Você é o Estruturador de Cadastros de IA da CENTRAL DE COMANDO.
O usuário solicitou o cadastro de uma nova IA (ex: "Cadastre a Qwen", "Adicione o Claude", "Cadastre uma IA de vídeo gratuita").
Sua tarefa é interpretar a solicitação, identificar a ferramenta real no seu conhecimento e estruturar todos os dados necessários para o pré-cadastro no catálogo.

REGRAS:
1. NÃO cadastre silenciosamente. Esta resposta é APENAS UMA PRÉVIA ESTRUTURADA para confirmação do usuário.
2. Forneça dados reais e coerentes. URL oficial válida começando com https://.
3. Classifique a categoria estritamente dentre:
   - "MODELOS GERAIS / MULTIMODAL"
   - "PESQUISA INTELIGENTE"
   - "CÓDIGO & ENGENHARIA"
   - "AUTOMAÇÃO & EXECUÇÃO"
   - "IMAGEM & CRIATIVIDADE"
   - "VÍDEO & PRODUÇÃO"
   - "ÁUDIO & MÚSICA"
   - "PRODUTIVIDADE EMPRESARIAL"
4. Nível: "Elite", "Alta Performance" ou "Especializada".
5. PricingType: "FREE", "FREEMIUM", "TRIAL" ou "PAID".

Retorne em JSON estrito:
{
  "newIA": {
    "name": "Nome oficial da IA",
    "category": "CATEGORIA EXATA",
    "specialty": "Especialidade principal em 1 frase",
    "differential": "Diferencial mais marcante frente às concorrentes",
    "level": "Elite" | "Alta Performance" | "Especializada",
    "difficulty": "Iniciante" | "Intermediário" | "Avançado",
    "pricing": "Descrição curta do plano (ex: Gratuito / Freemium)",
    "pricingType": "FREE" | "FREEMIUM" | "TRIAL" | "PAID",
    "pricingDetails": "Detalhes de cotas ou planos pagos",
    "link": "https://url-oficial-correta.com",
    "whatIsIt": "Explicação clara e objetiva do que é a ferramenta",
    "whatIsItFor": "Para que serve e quando gera mais valor",
    "paraQueServe": "Resumo didático para iniciantes",
    "quandoUsar": "Cenário ideal de aplicação",
    "quandoNaoUsar": "Quando não é recomendada",
    "melhorPara": "Público e tarefas ideais",
    "pontosFortes": "Principais qualidades",
    "limitacoes": "Principais limitações conhecidas",
    "exemploPrompt": "Comando prático para testar a ferramenta",
    "bestTasks": ["Tarefa 1", "Tarefa 2", "Tarefa 3"],
    "qualityScore": 85
  }
}`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, `SOLICITAÇÃO DE CADASTRO: "${promptOrName}"`, 1800);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'discover_ai': {
        const query = String(payload?.query || '');
        const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
        const catalogNames = catalog.map((i: any) => i.name).join(', ');

        const systemPrompt = `Você é o Curador de Descoberta de Novas IAs do "HUB ESTRATÉGICO DE IAs".
O usuário deseja descobrir novas IAs do mercado (ex: "IAs gratuitas para vídeo", "Melhores IAs de programação").

REGRAS:
1. Encontre de 1 a 3 IAs REAIS, existentes e consolidadas que NÃO estejam nesta lista já cadastrada: [${catalogNames}].
2. Priorize opções com plano gratuito relevante ("FREE" ou "FREEMIUM").
3. Não invente URLs ou planos inexistentes.
4. Nota de qualidade estimada de 0 a 100.

Retorne em JSON estrito:
{
  "candidates": [
    {
      "name": "Nome",
      "officialUrl": "https://url-oficial.com",
      "category": "CATEGORIA EXATA",
      "specialty": "Especialidade técnica",
      "differential": "Diferencial",
      "level": "Alta Performance",
      "pricingType": "FREE" | "FREEMIUM",
      "qualityScore": 85,
      "reason": "Motivo da indicação",
      "whyDiscovered": "Por que atende à busca",
      "whyBetter": "Por que pode complementar o catálogo",
      "paraQueServe": "Para que serve",
      "quandoUsar": "Quando usar",
      "quandoNaoUsar": "Quando evitar",
      "pontosFortes": "Pontos fortes",
      "limitacoes": "Limitações",
      "exemploPrompt": "Exemplo de prompt prático"
    }
  ]
}`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, `PEDIDO DE DESCOBERTA: "${query}"`, 2048);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'build_strategy': {
        const task = String(payload?.task || '');
        const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
        const catalogSummary = catalog
          .map((i: any) => `- ${i.name} (Cat: ${i.category} | Esp: ${i.specialty} | Link: ${i.link})`)
          .join('\n');

        const systemPrompt = `Você é o Arquiteto e Estrategista Chefe de Inteligência Artificial do "HUB ESTRATÉGICO DE IAs".
O usuário informou uma tarefa complexa (ex: "Quero lançar um curso usando IA", "Quero criar um aplicativo SaaS completo", "Quero automatizar a produção de conteúdo do meu canal").

Sua missão é desenhar uma estratégia operacional sequencial (Pipeline) em 3 a 5 etapas claras:
- ETAPA 1: Pesquisa / Estratégia / Validação
- ETAPA 2: Criação / Engenharia / Roteiro / Conteúdo
- ETAPA 3: Ativos Visuais / Design / Imagem / Interface
- ETAPA 4: Produção Multimídia / Vídeo / Apresentação (se aplicável)
- ETAPA 5: Revisão / Automação / Lançamento / Monitoramento

REGRA DE OURO: A estratégia DEVE UTILIZAR PRIORITARIAMENTE AS IAs DO CATÁLOGO DO USUÁRIO.
TODOS OS CAMPOS (overview, stageName, goal, whyThisIA, expectedDeliverable e ESPECIALMENTE actionPrompt) DEVEM ESTAR RIGOROSAMENTE EM PORTUGUÊS DO BRASIL.
Nunca gere o "actionPrompt" em inglês.

Para cada etapa, indique:
- Nome da etapa em Português
- Objetivo da etapa em Português
- Qual IA do catálogo usar
- Por que essa IA é a melhor para essa etapa em Português
- Entregável esperado em Português
- Prompt de ação em Português do Brasil para copiar e rodar naquela IA

Retorne em JSON estrito:
{
  "complexTask": "${task}",
  "overview": "Visão geral estratégica da abordagem recomendada em Português",
  "catalogCoverage": "X de Y ferramentas já disponíveis no seu catálogo",
  "steps": [
    {
      "stepNumber": 1,
      "stageName": "Pesquisa e Planejamento",
      "goal": "Definir o escopo, público e conteúdo base",
      "recommendedIA": "Nome da IA do catálogo",
      "whyThisIA": "Justificativa da escolha em Português",
      "expectedDeliverable": "Documento de arquitetura / outline detalhado em Português",
      "actionPrompt": "Prompt em Português do Brasil pronto para executar nessa etapa na IA indicada"
    }
  ]
}`;
        const userPrompt = `TAREFA COMPLEXA: "${task}"\n\nCATÁLOGO DO USUÁRIO DISPONÍVEL:\n${catalogSummary}\n\nIDIOMA OBRIGATÓRIO: Português do Brasil (pt-BR)`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 2048);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'query_catalog': {
        const question = String(payload?.question || '');
        const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
        const catalogList = catalog
          .map((i: any) => `- ${i.name} [${i.category}] (Nível: ${i.level}, Preço: ${i.pricing}, Especialidade: ${i.specialty}, Link: ${i.link})`)
          .join('\n');

        const systemPrompt = `Você é o Consultor Oficial do Catálogo de IAs do usuário.
Responda à pergunta do usuário sobre o que está cadastrado no catálogo.

REGRAS:
1. Responda com base ESTRITAMENTE nos dados do catálogo informado. NÃO invente que o usuário tem uma IA se ela não estiver na lista.
2. Identifique os nomes exatos das IAs do catálogo que respondem à pergunta.
3. Responda de forma direta, executiva e prestativa.

Retorne em JSON estrito:
{
  "question": "${question}",
  "answer": "Resposta objetiva e clara citando as IAs do catálogo",
  "matchingIANames": ["NomeIA1", "NomeIA2"],
  "highlights": ["Destaque 1", "Destaque 2"]
}`;
        const userPrompt = `PERGUNTA DO USUÁRIO: "${question}"\n\nCATÁLOGO ATUAL DO USUÁRIO:\n${catalogList}`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 1500);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      default:
        res.status(400).json({ error: `Ação "${action}" não reconhecida.` });
        return;
    }
  } catch (error: any) {
    console.error(`[Groq Command API Error - ${action}]:`, error);
    res.status(500).json({
      success: false,
      fallback: true,
      error: error?.message || 'Erro ao processar comando com a Groq',
    });
  }
}
