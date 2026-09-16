import express from 'express';
import path from 'path';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// Chave da Groq obtida das variáveis de ambiente (com fallback para a chave fornecida)
const GROQ_API_KEY =
  process.env.GROQ_API_KEY || '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';

// Status da integração Groq
app.get('/api/groq/status', (req, res) => {
  res.json({
    status: 'ok',
    configured: Boolean(GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')),
    engine: 'Groq Cloud Inference',
    models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
  });
});

const GROQ_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

// Helper compartilhado para chamadas resilientes à Groq
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
      console.warn(`[Groq Model ${model}] falha de conexão:`, e);
    }
  }

  if (!groqResponse) {
    throw new Error('Todos os modelos Groq retornaram erro ou quota esgotada.');
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
      throw new Error('Não foi possível fazer o parse do JSON da Groq');
    }
  }

  return { parsed, modelUsed };
}

// Endpoint Central de Comando de IA (V2.4)
app.post('/api/groq/command', async (req, res) => {
  const { action, payload } = req.body || {};

  if (!action) {
    res.status(400).json({ error: 'Parâmetro "action" é obrigatório.' });
    return;
  }

  if (!GROQ_API_KEY) {
    res.status(503).json({
      success: false,
      fallback: true,
      error: 'GROQ_API_KEY não configurada no servidor',
    });
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
  "confidence": number,
  "targetIA": string | null,
  "selectedAIs": string[],
  "extractedTask": string
}`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, `Comando do usuário: "${userPrompt}"`, 512);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'central_chat': {
        const { message, history, catalog } = payload || {};
        const userMsg = String(message || '');
        const chatHistory = Array.isArray(history) ? history : [];
        const catalogList = Array.isArray(catalog) ? catalog : [];
        
        const catalogSummary = catalogList
          .map((item: any) => `- ${item.name} (Cat: ${item.category}, Esp: ${item.specialty}, Nível: ${item.level}, Preço: ${item.pricing}, Link: ${item.link}, Diferencial: ${item.differential})`)
          .join('\n');

        const systemPrompt = `Você é a "CENTRAL IA — ASSISTENTE INTELIGENTE DO HUB ESTRATÉGICO DE IAs".
Sua missão é atuar como uma assistente tecnológica premium, inteligente, didática, objetiva, prestativa e profissional dentro do Hub.

Você conhece profundamente o catálogo de IAs do Hub e deve usá-lo como fonte oficial.

CONHECIMENTO DO CATÁLOGO DO HUB:
${catalogSummary}

SUAS CAPACIDADES E MODOS DE ATUAÇÃO:
1. EXPLICAR E ENSINAR: Explicar conceitos de IA, machine learning, RAG, agentes, programação e estudos de forma progressiva (conceito -> explicação -> exemplo -> aplicação). Se o usuário pedir para aprofundar, forneça mais profundidade técnica.
2. ENCONTRAR IA: Quando o usuário precisar de uma ferramenta para uma tarefa específica, consulte o catálogo acima e indique as melhores opções com os links exatos.
3. CRIAR PROMPTS: Quando o usuário quiser criar prompts, oriente-o a utilizar a ferramenta de Geração de Prompts do Hub e forneça uma sugestão inicial.
4. COMPARAR: Quando o usuário quiser comparar IAs, destaque as diferenças objetivas com base no catálogo.
5. ESTRATÉGIA DE HUB: Oriente o usuário sobre como navegar, buscar, filtrar e cadastrar IAs no Hub.

DIRETRIZES DE RESPOSTA:
- Responda de forma natural, fluida e amigável, em Português do Brasil (pt-BR).
- Seja objetiva por padrão, mas aprofunde quando solicitado.
- NUNCA invente IAs que não existam no catálogo fornecido quando perguntado sobre o Hub.
- Quando pertinente, sugira ações internas com tags de ação formatadas assim: [ACTION:OPEN_CATALOG] ou [ACTION:OPEN_PROMPT_GEN] ou [ACTION:OPEN_COMPARE] ou [ACTION:OPEN_AI:NomeDaIA].

Retorne em formato JSON estrito:
{
  "response": "Texto principal da resposta da assistente com explicações e orientações em PT-BR",
  "suggestedActions": [
    {
      "label": "Rótulo do botão de ação",
      "actionType": "OPEN_CATALOG" | "OPEN_PROMPT_GEN" | "OPEN_COMPARE" | "OPEN_AI",
      "target": "Nome da IA ou parâmetro opcional"
    }
  ],
  "intentDetected": "explain" | "teach" | "find_ai" | "prompt" | "compare" | "study" | "strategy"
}`;

        const formattedHistory = chatHistory
          .slice(-6) // últimas 6 mensagens para manter contexto
          .map((h: any) => `${h.role === 'user' ? 'Usuário' : 'Central IA'}: ${h.content}`)
          .join('\n');

        const userPrompt = `HISTÓRICO RECENTE DA CONVERSA:\n${formattedHistory}\n\nNOVA MENSAGEM DO USUÁRIRO: "${userMsg}"`;

        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 2048);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'generate_prompt': {
        const { objective, targetIA, level, desiredResult, language } = payload || {};
        const chosenLang = language === 'en' ? 'Inglês' : 'Português do Brasil (pt-BR)';
        const currentLevel = level || 'Intermediário';

        const systemPrompt = `Você é o CENTRAL DE IA — PROMPT ARCHITECT INTELIGENTE DE ALTA PRECISÃO.
Sua missão absoluta é converter a solicitação em linguagem natural de um usuário em um prompt profissional e altamente eficaz para a IA de destino, calibrado exatamente para o nível selecionado: "${currentLevel}".

⚠️ DIRETRIZES POR NÍVEL DE SOPHISTICAÇÃO:

1. NÍVEL INICIANTE:
   - Foco em simplicidade, clareza didática, tom guiado e explicações passo a passo fáceis de acompanhar. O prompt deve ser direto e sem excessos de jargões técnicos.

2. NÍVEL INTERMEDIÁRIO:
   - Foco em estruturação equilibrada, divisão lógica de etapas, formatação clara em Markdown e critérios de qualidade bem definidos.

3. NÍVEL AVANÇADO:
   - Foco em rigor técnico, tratamento de ambiguidades, profundidade executiva e validação, obedecendo estritamente à regra: "APROFUNDE A SOLUÇÃO, NÃO INVENTE A SOLUÇÃO."
   - Preserve a liberdade da IA de destino para escolher arquiteturas e tecnologias, a menos que o usuário as tenha especificado explicitamente. Não adicione suposições arbitrárias ou complexidade artificial.

REGRAS GERAIS:
- Distinção rigorosa de intenções (CRIAR ≠ ANALISAR ≠ REVISAR ≠ RESUMIR, etc.).
- Princípio de não suposição: nunca invente dados, nomes ou leis específicas ausentes.
- Idioma estrito: 100% em Português do Brasil (pt-BR).

CAMPOS DE RETORNO OBRIGATÓRIOS (JSON estrito):
- "prompt": O texto completo do prompt profissional otimizado.
- "intent": A intenção principal identificada.
- "targetAI": "${targetIA || 'Geral'}".
- "needsClarification": boolean.
- "clarificationQuestion": string.
- "improvements": Array de 3 a 5 strings listando as melhorias aplicadas.
- "objective": Objetivo sintetizado.
- "summary": Resumo executivo.
- "role": Papel da IA.
- "instructions": Array de passos.
- "constraints": Array de restrições.
- "responseFormat": Formato de saída.
- "qualityCriteria": Critério de aprovação.

Retorne EXCLUSIVAMENTE em JSON estrito.`;
        const userPrompt = `SOLICITAÇÃO DO USUÁRIO: "${objective || ''}"\nIA DE DESTINO: "${targetIA || 'Geral'}"\nNÍVEL SELECIONADO: "${currentLevel}"\nRESULTADO DESEJADO: "${desiredResult || 'Alta precisão'}"\nIDIOMA OBRIGATÓRIO: Português do Brasil (pt-BR)`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 2560);
        res.json({ success: true, ...parsed, modelUsed });
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

      case 'evolve_idea_analysis': {
        const { idea, historyVersions, evolutionLogs, relatedStudies, catalog, userQuestion } = payload || {};
        const q = userQuestion ? String(userQuestion) : 'Como posso evoluir esse projeto/ideia estrategicamente?';
        const catalogList = Array.isArray(catalog) ? catalog : [];
        const catalogSummary = catalogList
          .slice(0, 40)
          .map((i: any) => `- ${i.name} (${i.category}): ${i.specialty}`)
          .join('\n');

        const versionsSummary = Array.isArray(historyVersions) && historyVersions.length > 0
          ? historyVersions.map((v: any) => `[${v.version}] Mudança: ${v.changedSummary} | Motivo: ${v.changeReason} | Decisão: ${v.decisionTaken}`).join('\n')
          : 'Nenhuma versão anterior registrada.';

        const logsSummary = Array.isArray(evolutionLogs) && evolutionLogs.length > 0
          ? evolutionLogs.slice(-10).map((l: any) => `[${l.category}] ${l.text} (Impacto: ${l.impact})`).join('\n')
          : 'Nenhum log do diário registrado.';

        const studiesSummary = Array.isArray(relatedStudies) && relatedStudies.length > 0
          ? relatedStudies.map((s: any) => `- Estudo: ${s.theme} (Nível: ${s.level}, Progresso: ${s.progress}%). Aprendizado: ${s.acquiredKnowledge}. Dúvidas: ${s.doubts}`).join('\n')
          : 'Nenhum estudo vinculado ainda.';

        const systemPrompt = `Você é o ASSISTENTE DE EVOLUÇÃO ESTRATÉGICA DE PROJETOS E IDEIAS do Hub drico IAS.
Sua função é analisar profundamente o contexto armazenado do projeto do usuário:
- Objetivo original e problema que pretende resolver
- Estágio de maturidade atual (1. Ideia até 9. Evolução)
- Histórico de versões anteriores
- Diário de bordo (pensamentos, descobertas, obstáculos, decisões)
- Estudos e conhecimentos adquiridos relacionados
- Tecnologias e IAs relacionadas

REGRAS:
1. Responda em Português do Brasil (pt-BR) com tom profissional, prático, objetivo e visionário.
2. Analise os gargalos e proponha passos de evolução reais e viáveis.
3. Se houver IAs no catálogo que acelerem o projeto, cite-as expressamente.
4. NUNCA altere ou sobrescreva dados do usuário. Suas propostas devem vir em formato de sugestões estruturadas para o usuário aceitar, editar ou rejeitar.

Retorne em formato JSON estrito:
{
  "summaryAnalysis": "Diagnóstico do estado atual do projeto/ideia com pontos fortes e principais desafios",
  "suggestedEvolutions": [
    {
      "title": "Título da evolução recomendada",
      "changeReason": "Por que essa mudança é estratégica",
      "decisionTaken": "Decisão técnica ou de produto proposta",
      "nextStep": "Próxima ação prática a executar",
      "impact": "Alto impacto na arquitetura / validação / negócio"
    }
  ],
  "suggestedRoadmap": [
    {
      "stageTitle": "Atual",
      "goal": "Meta clara e mensurável",
      "status": "Pendente"
    }
  ],
  "recommendedStudies": [
    {
      "theme": "Nome do tema a estudar",
      "objective": "Objetivo de aprendizado para destravar o projeto",
      "recommendedTools": ["NomeIA1", "NomeIA2"]
    }
  ],
  "recommendedCatalogTools": ["Nome da IA do catálogo útil para esta fase"]
}`;

        const userPrompt = `PROJETO/IDEIA ANALISADO:
- Título: ${idea?.title || 'Sem título'}
- Categoria: ${idea?.category || 'Projeto'}
- Estágio de Maturidade: ${idea?.stage || '1. Ideia'}
- Status: ${idea?.status || 'Ativa'}
- Versão Atual: ${idea?.currentVersion || 'V1'}
- Objetivo: ${idea?.objective || 'Não informado'}
- Problema que Resolve: ${idea?.problemSolved || 'Não informado'}
- Público-Alvo: ${idea?.targetAudience || 'Não informado'}
- Tecnologias: ${Array.isArray(idea?.relatedTechnologies) ? idea.relatedTechnologies.join(', ') : 'Nenhuma'}
- IAs Relacionadas: ${Array.isArray(idea?.relatedIANames) ? idea.relatedIANames.join(', ') : 'Nenhuma'}
- Observações: ${idea?.observations || 'Nenhuma'}
- Próximos Passos: ${idea?.nextSteps || 'Nenhum'}

HISTÓRICO DE VERSÕES:
${versionsSummary}

DIÁRIO DE EVOLUÇÃO (ÚLTIMAS NOTAS):
${logsSummary}

ESTUDOS VINCULADOS:
${studiesSummary}

CATÁLOGO DE IAs DISPONÍVEL NO HUB:
${catalogSummary}

PERGUNTA ESPECÍFICA DO USUÁRIO: "${q}"`;

        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 2048);
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
});

// Endpoint de Descoberta e Curadoria com a Groq (V2.3 - mantido para retrocompatibilidade)
app.post('/api/groq/discover', async (req, res) => {
  try {
    const { taskDescription, currentCatalogIAs } = req.body;

    if (!taskDescription || typeof taskDescription !== 'string') {
      res.status(400).json({ error: 'taskDescription é obrigatório' });
      return;
    }

    if (!GROQ_API_KEY) {
      res.status(503).json({
        success: false,
        fallback: true,
        error: 'GROQ_API_KEY não configurada no servidor',
      });
      return;
    }

    // Nomes e links já presentes no catálogo para evitar duplicatas
    const existingNamesList = Array.isArray(currentCatalogIAs)
      ? currentCatalogIAs.map((item: any) => `${item.name} (${item.url || ''})`).join(', ')
      : '';

    const systemPrompt = `Você é o Motor de Inteligência e Curador Oficial de Inteligências Artificiais do "HUB ESTRATÉGICO DE IAs".
Sua função é identificar possíveis IAs reais, existentes e comprovadas no mundo real para atender à necessidade informada pelo usuário.

REGRAS RÍGIDAS DE CURADORIA:
1. NÃO invente ferramentas, nomes, URLs, capacidades ou planos inexistentes. Se não tiver certeza absoluta sobre a ferramenta ou sua URL oficial, NÃO inclua.
2. A nova IA DEVE possuir modalidade gratuita:
   - "FREE": 100% gratuita utilizável.
   - "FREEMIUM": plano gratuito funcional contínuo relevante (com limitações claras).
   - "TRIAL": período de testes temporário (NÃO recomendada para o hub).
   - "PAID": estritamente paga sem gratuidade contínua (NÃO recomendada para o hub).
3. Não indique ferramentas que já existam no catálogo atual informado.
4. Avalie o qualityScore de 0 a 100 com rigor técnico (apenas ferramentas excepcionais devem receber >= 80).
5. Retorne no MÁXIMO 5 candidatos.

Formato OBRIGATÓRIO (JSON puro):
{
  "candidates": [
    {
      "name": "Nome real da ferramenta",
      "officialUrl": "https://url-oficial-real.com",
      "category": "MODELOS GERAIS / MULTIMODAL | PESQUISA INTELIGENTE | CÓDIGO & ENGENHARIA | AUTOMAÇÃO & EXECUÇÃO | IMAGEM & CRIATIVIDADE | VÍDEO & PRODUÇÃO | ÁUDIO & MÚSICA | PRODUTIVIDADE EMPRESARIAL",
      "specialty": "Especialidade principal em 1 frase",
      "differential": "O diferencial prático da ferramenta",
      "level": "Elite | Alta Performance | Especializada",
      "pricingType": "FREE | FREEMIUM | TRIAL | PAID | UNKNOWN",
      "qualityScore": 85,
      "reason": "Por que foi encontrada e por que atende à necessidade",
      "whyDiscovered": "Por que esta ferramenta foi recomendada para esta necessidade específica",
      "whyBetter": "Vantagem clara sobre opções gerais ou convencionais",
      "paraQueServe": "Descrição concisa de qual gargalo a ferramenta resolve",
      "quandoUsar": "Quando o usuário deve acionar esta ferramenta",
      "quandoNaoUsar": "Cenários onde outra IA é mais indicada",
      "pontosFortes": "Destaques e recursos de alto impacto",
      "limitacoes": "Restrições do plano gratuito ou limites conhecidos",
      "exemploPrompt": "Exemplo prático de prompt otimizado para esta IA"
    }
  ]
}`;

    const userPrompt = `Necessidade / Tarefa solicitada pelo usuário:
"${taskDescription}"

Catálogo já existente (NÃO DUPLICAR):
${existingNamesList || 'Nenhuma informada'}

Retorne os candidatos a novas IAs em formato JSON estrito conforme solicitado.`;

    const GROQ_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
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
            max_tokens: 2048,
          }),
        });

        if (resp.ok) {
          groqResponse = resp;
          modelUsed = model;
          break;
        } else {
          console.warn(`[Groq Model ${model}] retornou status ${resp.status}, tentando próximo modelo...`);
        }
      } catch (e) {
        console.warn(`[Groq Model ${model}] falha de conexão:`, e);
      }
    }

    if (!groqResponse) {
      res.status(502).json({
        success: false,
        fallback: true,
        error: 'Todos os modelos Groq retornaram erro ou quota esgotada.',
      });
      return;
    }

    const data = await groqResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      res.status(502).json({
        success: false,
        fallback: true,
        error: 'Resposta vazia da API Groq',
      });
      return;
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      // Tenta extrair bloco json se houver markdown
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Não foi possível fazer o parse do JSON retornado pela Groq');
      }
    }

    const candidates = Array.isArray(parsed.candidates) ? parsed.candidates : [];

    res.json({
      success: true,
      candidates,
      modelUsed: data.model || 'qwen/qwen3.8-27b',
    });
  } catch (err: any) {
    console.error('[Server /api/groq/discover error]:', err);
    res.status(500).json({
      success: false,
      fallback: true,
      error: err?.message || 'Erro interno no servidor de curadoria',
    });
  }
});

// Middleware Vite e Servidor
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HUB ESTRATÉGICO DE IAs] Servidor rodando na porta ${PORT}`);
  });
}

startServer();
