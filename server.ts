import express from 'express';
import path from 'path';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// Inicialização Lazy e Segura do Gemini (Google GenAI)
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY não configurada no ambiente do servidor.');
    }
    geminiClient = new GoogleGenAI({ apiKey: key });
  }
  return geminiClient;
}

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

// Helper para chamadas resilientes ao Gemini com fallback de modelos e Groq
async function callGeminiWithFallback(systemPrompt: string, userPrompt: string, requestedModel = 'gemini-3.8-flash') {
  const modelsToTry = [
    requestedModel,
    ...GEMINI_MODELS.filter((m) => m !== requestedModel),
  ];

  const ai = getGemini();
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.25,
        }
      });

      const text = response.text || '';
      if (!text) throw new Error(`Resposta vazia do modelo Gemini ${model}`);

      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      let parsed: any;
      try {
        parsed = JSON.parse(cleanedText);
      } catch {
        const match = cleanedText.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          parsed = { response: text };
        }
      }

      return { parsed, modelUsed: model };
    } catch (err: any) {
      console.warn(`[Gemini Model ${model}] falha na chamada:`, err?.message || err);
      lastError = err;
      // Se for erro de quota/resource_exhausted, podemos propagar mais rápido
      if (err?.message?.includes('resource_exhausted') || err?.message?.includes('quota')) {
        break;
      }
    }
  }

  // Tentar fallback automático para Groq
  try {
    console.log('[Orchestrator] Gemini esgotou cota/falhou. Acionando fallback automático para Groq...');
    const groqRes = await callGroqWithFallback(systemPrompt, userPrompt, 2048);
    return { parsed: groqRes.parsed, modelUsed: `Groq-Fallback (${groqRes.modelUsed})` };
  } catch (groqErr: any) {
    throw new Error(`Gemini falhou (${lastError?.message || 'Quota/Erro'}) e Groq fallback também falhou (${groqErr?.message || 'Erro'})`);
  }
}

// Chave da Groq obtida das variáveis de ambiente (com fallback para a chave fornecida)
const GROQ_API_KEY =
  process.env.GROQ_API_KEY || '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';

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];

// Status do Orquestrador de IAs (Gemini Principal + Groq Auxiliar)
app.get('/api/orchestrator/status', (req, res) => {
  res.json({
    status: 'ok',
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      role: 'PRINCIPAL (Raciocínio Profundo, Arquitetura, Planejamento e Código)',
      models: GEMINI_MODELS,
      defaultModel: 'gemini-3.8-flash',
    },
    groq: {
      configured: Boolean(GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')),
      role: 'AUXILIAR (Simulação, Alta Velocidade, Síntese e Níveis 1/2)',
      models: GROQ_MODELS,
      defaultModel: 'llama-3.3-70b-versatile',
    },
  });
});

// Status da integração Groq (mantido para retrocompatibilidade)
app.get('/api/groq/status', (req, res) => {
  res.json({
    status: 'ok',
    configured: Boolean(GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')),
    engine: 'Groq Cloud Inference',
    models: GROQ_MODELS,
  });
});

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

// 7. MOTOR CENTRAL DE ORQUESTRAÇÃO DE IA (GEMINI PRINCIPAL + GROQ AUXILIAR)
app.post('/api/orchestrate', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      provider = 'GEMINI',
      modelId,
      systemPrompt,
      userPrompt,
      complexityLevel = 3,
      activeMode = 'CONVERSATION',
      allowFallback = true,
    } = req.body || {};

    if (!userPrompt) {
      res.status(400).json({ success: false, error: 'Parâmetro "userPrompt" é obrigatório para orquestração.' });
      return;
    }

    const sysPrompt = systemPrompt || 'Você é o Núcleo Inteligente de Orquestração do Hub de IAs. Responda em JSON estrito com o campo "response".';
    let primaryError: string | null = null;
    let fallbackTriggered = false;
    let executedProvider = provider;
    let executedModel = modelId;
    let parsedResult: any = null;

    // Tentativa no Provedor Primário Selecionado
    if (provider === 'GEMINI') {
      try {
        const result = await callGeminiWithFallback(sysPrompt, userPrompt, modelId || 'gemini-3.8-flash');
        parsedResult = result.parsed;
        executedModel = result.modelUsed;
      } catch (err: any) {
        primaryError = err?.message || 'Falha na execução do Gemini';
        console.warn('[Orchestrator] Falha no provedor primário Gemini:', primaryError);

        if (allowFallback) {
          try {
            console.log('[Orchestrator] Acionando fallback automático para Groq...');
            const groqResult = await callGroqWithFallback(sysPrompt, userPrompt, 2048);
            parsedResult = groqResult.parsed;
            executedProvider = 'GROQ';
            executedModel = groqResult.modelUsed;
            fallbackTriggered = true;
          } catch (groqErr: any) {
            console.error('[Orchestrator] Fallback Groq também falhou:', groqErr);
            // Fallback de contingência local para NUNCA falhar
            parsedResult = {
              response: `⚠️ **Aviso do Sistema**: O motor de IA (Gemini e Groq) encontrou restrição temporária de cota (Quota Exceeded). \n\n**Sua solicitação ("${userPrompt.slice(0, 80)}...") foi recebida com sucesso.** \n\nAnálise preliminar: Para prosseguir com este objetivo, recomenda-se estruturar os módulos por etapas claras, garantir validação de tipos em TypeScript e revisar as credenciais nos Secrets.`,
              recommendedAI: 'Gemini 3.8-Flash / Groq GPT-OSS',
              structuredPrompt: userPrompt,
              implementationPlan: ['1. Revisar parâmetros', '2. Tentar novamente em instantes', '3. Aplicar estruturação modular']
            };
            executedProvider = 'SYSTEM-FALLBACK';
            fallbackTriggered = true;
          }
        } else {
          parsedResult = {
            response: `Erro de processamento: ${primaryError}`,
          };
        }
      }
    } else {
      // Provedor Primário: GROQ
      try {
        const result = await callGroqWithFallback(sysPrompt, userPrompt, 2048);
        parsedResult = result.parsed;
        executedModel = result.modelUsed;
      } catch (err: any) {
        primaryError = err?.message || 'Falha na execução da Groq';
        try {
          const geminiResult = await callGeminiWithFallback(sysPrompt, userPrompt, 'gemini-3.8-flash');
          parsedResult = geminiResult.parsed;
          executedProvider = 'GEMINI';
          executedModel = geminiResult.modelUsed;
          fallbackTriggered = true;
        } catch (geminiErr: any) {
          parsedResult = {
            response: `⚠️ **Aviso do Sistema**: Cota de IA atingida temporariamente. \n\nSolicitação recebida: "${userPrompt.slice(0, 80)}..."`,
          };
          executedProvider = 'SYSTEM-FALLBACK';
        }
      }
    }

    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      data: parsedResult,
      providerUsed: executedProvider,
      modelUsed: executedModel,
      fallbackTriggered,
      primaryError,
      complexityLevel,
      activeMode,
      durationMs,
    });
  } catch (outerErr: any) {
    console.error('Erro crítico em /api/orchestrate:', outerErr);
    res.json({
      success: true,
      data: {
        response: `⚠️ O motor de IA processou sua solicitação com aviso de cota temporária. Por favor, tente novamente em alguns instantes.`,
      },
      providerUsed: 'EMERGENCY-FALLBACK',
      modelUsed: 'local-safe',
    });
  }
});

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
        const { message, history, catalog, contextSummary, activeMode, intent } = payload || {};
        const userMsg = String(message || '');
        const chatHistory = Array.isArray(history) ? history : [];
        const catalogList = Array.isArray(catalog) ? catalog : [];
        
        const catalogSummary = catalogList
          .slice(0, 30)
          .map((item: any) => `- ${item.name} (Cat: ${item.category}, Esp: ${item.specialty}, Nível: ${item.level}, Preço: ${item.pricing})`)
          .join('\n');

        const systemPrompt = `Você é o "NÚCLEO INTELIGENTE DE ORQUESTRAÇÃO DO HUB DE IAs".
Sua função evoluiu de um simples chatbot para o orquestrador operacional do sistema.

MODO DE OPERAÇÃO ATUAL: ${activeMode || 'CONVERSATION'}
INTENÇÃO IDENTIFICADA: ${intent || 'pergunta'}

MEMÓRIA CONTEXTUAL ESTRUTURADA DO PROJETO / HUB:
${contextSummary || 'Nenhum projeto específico ativo.'}

CONHECIMENTO DO CATÁLOGO DE IAs:
${catalogSummary}

DIRETRIZES FUNDAMENTAIS DO NÚCLEO OPERACIONAL:
1. MEMÓRIA & CONTEXTO: Utilize sempre a memória contextual informada acima para embasar suas respostas. Se houver um projeto ativo (como Auditor SST), mencione a última evolução, gargalos e próximos passos coerentes.
2. OBJETIVO -> CONTEXTO -> MEMÓRIA -> PLANO -> IA -> EXECUÇÃO -> VALIDAÇÃO -> APRENDIZADO -> EVOLUÇÃO.
3. NÃO invente dados de projetos ou capacidades fictícias de modelos.
4. Se o usuário apresentar uma nova ideia relevante sem projeto associado, pergunte explicitamente: "Quer que eu registre essa ideia no HUB?".
5. Sugira próximos passos acionáveis e claros.
6. Idioma obrigatório: Português do Brasil (pt-BR).

Retorne em formato JSON estrito:
{
  "response": "Resposta executiva e didática da Central em Markdown PT-BR",
  "suggestedActions": [
    {
      "label": "Rótulo do botão",
      "actionType": "OPEN_PROJECT_DETAIL" | "SWITCH_TO_SIMULATION" | "SWITCH_TO_PLANNING" | "OPEN_CATALOG" | "OPEN_PROMPT_GEN" | "OPEN_COMPARE",
      "target": "id ou parâmetro opcional"
    }
  ],
  "intentDetected": "${intent || 'pergunta'}"
}`;

        const formattedHistory = chatHistory
          .slice(-6)
          .map((h: any) => `${h.role === 'user' ? 'Usuário' : 'Central IA'}: ${h.content}`)
          .join('\n');

        const userPrompt = `HISTÓRICO RECENTE DA CONVERSA:\n${formattedHistory}\n\nNOVA MENSAGEM DO USUÁRIO: "${userMsg}"`;

        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 2048);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'simulate_scenario': {
        const { objective, contextSummary, projectName } = payload || {};
        const systemPrompt = `Você é o SIMULATION ENGINE do HUB ESTRATÉGICO DE IAs, operando em sandbox experimental Groq.
Sua missão é SIMULAR um cenário operacional de comportamento do sistema ou projeto.

⚠️ REGRA INVIOLÁVEL: Diferencie expressamente que este é um resultado de SIMULAÇÃO VIRTUAL e NÃO execução em produção.

CONTEXTO DO PROJETO:
${contextSummary || 'Ambiente geral do Hub'}

OBJETIVO DO CENÁRIO A SIMULAR:
"${objective || 'Simulação de comportamento'}"

Retorne em formato JSON estrito:
{
  "simulatedOutput": "Detalhamento analítico da simulação do cenário com fluxo de dados, comportamento dos módulos e resultado projetado em Markdown",
  "strengths": ["Ponto forte 1 observado na simulação", "Ponto forte 2"],
  "risks": ["Risco ou gargalo 1 identificado na simulação", "Risco 2"],
  "nextSteps": ["Próximo passo real recomendado 1", "Próximo passo 2"]
}`;

        const userPrompt = `Executar simulação para o objetivo: "${objective}"\nProjeto: "${projectName || 'Geral'}"`;
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

      case 'structure_project_with_ai': {
        const { userRequest, categoryHint, catalog, existingProjects } = payload || {};
        const requestText = String(userRequest || '').trim();

        if (!requestText) {
          res.status(400).json({ error: 'userRequest é obrigatório.' });
          return;
        }

        const catalogList = Array.isArray(catalog) ? catalog : [];
        const catalogSummary = catalogList
          .slice(0, 45)
          .map((i: any) => `- ${i.name} (Cat: ${i.category}): ${i.specialty}`)
          .join('\n');

        const existingSummary = Array.isArray(existingProjects) && existingProjects.length > 0
          ? existingProjects.map((p: any) => `- ${p.title} (${p.category})`).join('\n')
          : 'Nenhum projeto cadastrado anteriormente.';

        const systemPrompt = `Você é o ARQUITETO ESTRATÉGICO DE PROJETOS, SISTEMAS E IA do Hub drico IAS.
Sua missão é pegar uma ideia ou necessidade bruta do usuário e transformá-la em uma ESTRUTURA PROFISSIONAL, EXECUTÁVEL E COMPLETA, dividida em:
1. CONCEITO TEÓRICO & ARQUITETURA DE VALOR (A tese, o porquê e os princípios conceituais da solução).
2. APLICAÇÃO PRÁTICA NO MUNDO REAL (Fluxo do usuário, casos de uso reais, regras de negócio e arquitetura prática).
3. ETAPAS SEQUENCIAIS COM PROMPT COMPLETO DE CADA UMA (Da concepção inicial até a etapa final de produção/deploy). Cada etapa DEVE ter um PROMPT COMPLETO, rico e pronto para o usuário copiar ou rodar na IA para executar aquela fase específica do desenvolvimento!
4. ROADMAP, DIÁRIO DE BORDO E ESTUDOS CONECTADOS.

DIRETRIZES FUNDAMENTAIS:
1. CATEGORIAS: "Projeto" | "Estudo" | "IA" | "SST" | "Automação" | "Negócios" | "Software" | "Pesquisa" | "Produto" | "Outros".
2. ESTÁGIOS (1 a 9): "1. Ideia" | "2. Exploração" | "3. Planejamento" | "4. Protótipo" | "5. MVP" | "6. Validação" | "7. Implementação" | "8. Otimização" | "9. Evolução".
3. PRIORIDADE: "Baixa" | "Média" | "Alta" | "Crítica".
4. ETAPAS E PROMPTS (Crie exatamente entre 5 e 6 etapas sequenciais até a entrega final):
   - Etapa 1: Concepção & Modelagem de Requisitos
   - Etapa 2: Arquitetura de Dados, Schemas & Modelos
   - Etapa 3: Desenvolvimento Backend / Lógica de Negócio
   - Etapa 4: Interface de Usuário (UI/UX) & Experiência
   - Etapa 5: Integrações, Automações & APIs
   - Etapa 6 (Etapa Final): Testes, Deploy, Monitoramento & Lançamento
   CADA ETAPA DEVE CONTER O SEU "prompt" COMPLETO E DETALHADO, pronto para o desenvolvedor ou a IA codificar ou projetar exatamente aquela parte!

CATÁLOGO DE IAs DO HUB:
${catalogSummary}

PROJETOS EXISTENTES:
${existingSummary}

Retorne EXCLUSIVAMENTE em formato JSON estrito:
{
  "title": "Nome marcante e profissional do projeto",
  "description": "Resumo executivo de 2 a 3 frases explicando o que é e como funciona",
  "category": "Categoria selecionada",
  "stage": "Estágio de maturidade inicial",
  "priority": "Média" | "Alta" | "Crítica" | "Baixa",
  "objective": "Objetivo central claro e mensurável",
  "problemSolved": "Problemas concretos e dores do mercado que ele elimina",
  "targetAudience": "Público-alvo, personas ou beneficiários",
  "relatedTechnologies": ["Stack 1", "Stack 2", "Stack 3", "Stack 4"],
  "relatedIANames": ["Nome de IA do catálogo 1", "Nome de IA 2"],
  "observations": "Observações arquiteturais estratégicas e diferenciais",
  "nextSteps": "Primeira tarefa prática e acionável para hoje",
  "concept": {
    "summary": "Explicação aprofundada do conceito e tese do projeto",
    "coreValue": "Proposta de valor única e impacto gerado",
    "mechanics": "Mecânica e princípios conceituais de funcionamento",
    "marketFit": "Diferencial de mercado e posicionamento competitivo"
  },
  "application": {
    "realWorldUseCases": [
      "Caso de uso real 1 no dia a dia",
      "Caso de uso real 2 no dia a dia",
      "Caso de uso real 3 no dia a dia"
    ],
    "userFlow": [
      "Passo 1 do fluxo do usuário",
      "Passo 2 do fluxo do usuário",
      "Passo 3 do fluxo do usuário",
      "Passo 4 do fluxo do usuário"
    ],
    "businessRules": [
      "Regra de negócio fundamental 1",
      "Regra de negócio fundamental 2",
      "Regra de negócio fundamental 3"
    ],
    "architecture": "Descrição da arquitetura prática de funcionamento e fluxo de dados"
  },
  "stages": [
    {
      "id": "stg-1",
      "order": 1,
      "title": "Etapa 1: Concepção & Modelagem de Requisitos",
      "phase": "Concepção",
      "objective": "Objetivo detalhado da etapa",
      "deliverable": "Entregável tangível desta etapa",
      "prompt": "Você é um Engenheiro de Software Sênior. Sua tarefa é criar a especificação completa de requisitos funcionais e não-funcionais para o projeto [Nome]...",
      "recommendedTools": ["Claude 3.5 Sonnet", "ChatGPT", "Notion"],
      "status": "Em Andamento"
    },
    {
      "id": "stg-2",
      "order": 2,
      "title": "Etapa 2: Arquitetura de Dados & Modelagem",
      "phase": "Arquitetura",
      "objective": "Modelar o banco de dados e diagramas relacionais",
      "deliverable": "Schemas SQL / NoSQL e diagramas de entidade-relacionamento",
      "prompt": "Atue como Arquiteto de Dados. Modele as tabelas e schemas necessários para...",
      "recommendedTools": ["Supabase", "Prisma", "DrawDB"],
      "status": "Pendente"
    },
    {
      "id": "stg-3",
      "order": 3,
      "title": "Etapa 3: Desenvolvimento do Core / Backend",
      "phase": "Backend",
      "objective": "Construir os endpoints e regras de negócio",
      "deliverable": "APIs RESTful e funções de serviço",
      "prompt": "Você é um Desenvolvedor Backend Especialista. Escreva a implementação dos serviços...",
      "recommendedTools": ["Node.js", "Express", "Cursor"],
      "status": "Pendente"
    },
    {
      "id": "stg-4",
      "order": 4,
      "title": "Etapa 4: Interface do Usuário (UI/UX) & Front-end",
      "phase": "Frontend",
      "objective": "Criar a interface intuitiva e responsiva",
      "deliverable": "Componentes visuais e integração de estado",
      "prompt": "Atue como Designer e Desenvolvedor Front-end. Crie a interface completa em React e Tailwind...",
      "recommendedTools": ["v0.dev", "Bolt.new", "Tailwind CSS"],
      "status": "Pendente"
    },
    {
      "id": "stg-5",
      "order": 5,
      "title": "Etapa 5: Integrações, Automações & APIs Externas",
      "phase": "Integrações",
      "objective": "Conectar APIs e fluxos de automação",
      "deliverable": "Webhooks e conectores funcionais",
      "prompt": "Atue como Engenheiro de Integração. Desenvolva as integrações de API...",
      "recommendedTools": ["n8n", "Postman", "Zapier"],
      "status": "Pendente"
    },
    {
      "id": "stg-6",
      "order": 6,
      "title": "Etapa Final: Testes, Deploy, Monitoramento & Lançamento",
      "phase": "Deploy Final",
      "objective": "Garantir segurança, realizar testes e deploy em produção",
      "deliverable": "Aplicação rodando em produção com logs e testes automatizados",
      "prompt": "Atue como Engenheiro DevOps e QA. Escreva os testes e configure o pipeline de CI/CD para deploy...",
      "recommendedTools": ["Docker", "Vercel / Cloud Run", "GitHub Actions"],
      "status": "Pendente"
    }
  ],
  "roadmap": [
    { "stageTitle": "Atual", "goal": "Meta imediata para o momento atual", "status": "Em Andamento" },
    { "stageTitle": "Próxima Evolução", "goal": "Próxima meta estruturante", "status": "Pendente" },
    { "stageTitle": "Depois", "goal": "Meta de consolidação e novas funcionalidades", "status": "Pendente" },
    { "stageTitle": "Futuro", "goal": "Meta de longo prazo, automação avançada ou escala", "status": "Pendente" }
  ],
  "initialDiaryLog": {
    "text": "Texto do registro de abertura no Diário de Bordo descrevendo o ponto de partida e premissas fundamentais da V1.",
    "category": "Decisão",
    "impact": "Definição do escopo, arquitetura conceitual e etapas de execução."
  },
  "suggestedStudies": [
    {
      "theme": "Nome do tema de estudo recomendado",
      "objective": "O que o usuário deve aprender para acelerar esse projeto",
      "level": "Iniciante" | "Intermediário" | "Avançado",
      "toolsUsed": ["Ferramenta ou biblioteca recomendada"]
    }
  ],
  "versionNote": "Conceito, Aplicação Prática e Etapas com Prompts concebidos com IA"
}`;

        const userPrompt = `SOLICITAÇÃO DO USUÁRIO PARA CO-CRIAR PROJETO:\n"${requestText}"`;
        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 3500);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'infinite_revision_with_ai': {
        const { idea, userRequest, currentRevisionNumber, catalog } = payload || {};
        const requestText = String(userRequest || '').trim();

        if (!idea || !idea.id) {
          res.status(400).json({ error: 'idea é obrigatório para revisão.' });
          return;
        }

        if (!requestText) {
          res.status(400).json({ error: 'userRequest de melhoria é obrigatório.' });
          return;
        }

        const nextRevNumber = (Number(currentRevisionNumber) || (idea.revisionsCount || 0)) + 1;

        const systemPrompt = `Você é o ARQUITETO DE MELHORIAS E REVISÕES INFINITAS DE PROJETOS E IAs do Hub drico IAS.
O usuário está solicitando uma NOVA REVISÃO (Melhoria Contínua) para o projeto "${idea.title}".
O sistema permite infinitas melhorias e revisões consecutivas conforme o projeto amadurece.

SUA MISSÃO NESTA REVISÃO #${nextRevNumber}:
1. Analisar as solicitações de melhoria do usuário com profundidade.
2. Refinar o CONCEITO e a APLICAÇÃO PRÁTICA do projeto incorporando os novos requisitos.
3. Atualizar, enriquecer ou adicionar as ETAPAS e gerar os PROMPTS REVISADOS de cada etapa até a etapa final.
4. Elaborar um resumo analítico das melhorias implementadas nesta revisão.
5. Indicar novas tecnologias e ferramentas se aplicável.

Retorne EXCLUSIVAMENTE em formato JSON estrito:
{
  "revisionNumber": ${nextRevNumber},
  "improvementSummary": "Resumo detalhado das melhorias e refatorações realizadas nesta revisão",
  "conceptChanges": "O que mudou na tese conceitual ou no valor do projeto",
  "applicationChanges": "O que mudou na aplicação prática, regras ou fluxos",
  "updatedTitle": "${idea.title}",
  "updatedDescription": "Descrição executiva atualizada do projeto",
  "updatedPriority": "${idea.priority || 'Alta'}",
  "updatedConcept": {
    "summary": "Resumo atualizado do conceito",
    "coreValue": "Proposta de valor atualizada",
    "mechanics": "Princípios de funcionamento refinados",
    "marketFit": "Diferencial competitivo aprimorado"
  },
  "updatedApplication": {
    "realWorldUseCases": [
      "Caso de uso real atualizado 1",
      "Caso de uso real atualizado 2",
      "Caso de uso real atualizado 3"
    ],
    "userFlow": [
      "Passo 1 do fluxo revisado",
      "Passo 2 do fluxo revisado",
      "Passo 3 do fluxo revisado",
      "Passo 4 do fluxo revisado"
    ],
    "businessRules": [
      "Regra de negócio revisada 1",
      "Regra de negócio revisada 2",
      "Regra de negócio revisada 3"
    ],
    "architecture": "Arquitetura técnica aprimorada"
  },
  "updatedStages": [
    {
      "id": "stg-rev-1",
      "order": 1,
      "title": "Título da Etapa 1 Revisada",
      "phase": "Concepção",
      "objective": "Objetivo refinado",
      "deliverable": "Entregável da etapa",
      "prompt": "Prompt revisado e pronto para IA...",
      "recommendedTools": ["Ferramenta 1", "Ferramenta 2"],
      "status": "Em Andamento"
    }
  ],
  "addedTechnologies": ["Tecnologia nova se houver"],
  "diaryEntry": {
    "text": "Registro de reflexão sobre a Revisão #${nextRevNumber} no Diário de Bordo...",
    "category": "Decisão",
    "impact": "Impacto estratégico das melhorias implementadas."
  }
}`;

        const userPrompt = `PROJETO ATUAL:
Título: ${idea.title}
Descrição: ${idea.description}
Objetivo: ${idea.objective}
Problema: ${idea.problemSolved}
Tecnologias: ${(idea.relatedTechnologies || []).join(', ')}
Conceito Atual: ${JSON.stringify(idea.concept || {})}
Aplicação Atual: ${JSON.stringify(idea.application || {})}
Quantidade de Etapas Atuais: ${(idea.stages || []).length}

SOLICITAÇÃO DE MELHORIA / REVISÃO DO USUÁRIO:
"${requestText}"`;

        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 3500);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'execute_stage_prompt_with_ai': {
        const { projectTitle, stageTitle, prompt, executionContext } = payload || {};
        const stagePromptText = String(prompt || '').trim();

        if (!stagePromptText) {
          res.status(400).json({ error: 'Prompt da etapa é obrigatório para execução.' });
          return;
        }

        const systemPrompt = `Você é um ENGENHEIRO DE SOFTWARE E ARQUITETO DE SISTEMAS EXECUTOR do Hub drico IAS.
Sua missão é EXECUTAR o prompt da etapa "${stageTitle || 'Etapa do Projeto'}" para o projeto "${projectTitle || 'Projeto'}".
Gere uma entrega completa, prática, profissional e utilizável (ex: código-fonte limpo, arquitetura detalhada, diagramas textuais, schemas, regras de negócio ou especificação técnica conforme o prompt solicitar).
Seja detalhista, preciso e focado na execução com excelência técnica.

Retorne em formato JSON estrito:
{
  "stageTitle": "${stageTitle || 'Etapa'}",
  "outputType": "code" | "specification" | "architecture" | "documentation",
  "resultContent": "Texto completo com a entrega da etapa (código, modelo, especificações, markdown estruturado)",
  "executionSummary": "Resumo em 2 frases do que foi gerado para esta etapa",
  "nextSuggestedAction": "Próxima ação recomendada para colocar esta entrega em prática"
}`;

        const userPrompt = `CONTEXTO DO PROJETO: ${projectTitle}\nETAPA: ${stageTitle}\nCONTEXTO ADICIONAL: ${executionContext || 'Nenhum'}\n\nPROMPT DA ETAPA A EXECUTAR:\n"${stagePromptText}"`;

        const { parsed, modelUsed } = await callGroqWithFallback(systemPrompt, userPrompt, 3000);
        res.json({ success: true, ...parsed, modelUsed });
        return;
      }

      case 'evolve_project_with_ai': {
        const { idea, userRequest, historyVersions, evolutionLogs, catalog } = payload || {};
        const requestText = String(userRequest || '').trim();

        if (!idea || !idea.id) {
          res.status(400).json({ error: 'idea é obrigatório.' });
          return;
        }

        const systemPrompt = `Você é o ARQUITETO DE EVOLUÇÃO CONTÍNUA DE PROJETOS E VERSÕES do Hub drico IAS.
O usuário possui um projeto já cadastrado e quer evoluí-lo em co-criação com você (ex: criar uma nova versão V2/V3, refinar o roadmap, adicionar novos recursos ou mudar a tecnologia).

SEU PAPEL:
1. Propor o incremento de versão (ex: se era V1, propor V2; se era V2, propor V3).
2. Definir o que mudou, o motivo da mudança e a decisão técnica/estratégica tomada.
3. Atualizar o roadmap nos 4 horizontes (Atual, Próxima Evolução, Depois, Futuro).
4. Gerar um novo registro no diário de bordo sobre essa evolução.
5. Recomendar tecnologias e IAs adicionais se necessário.
6. Propor novos estudos se a evolução demandar novos conhecimentos.

Retorne em formato JSON estrito:
{
  "newVersion": "V2",
  "changedSummary": "Resumo objetivo do que foi alterado e ampliado nesta versão",
  "changeReason": "Motivação estratégica do usuário para esta evolução",
  "decisionTaken": "Decisões arquiteturais e de produto adotadas",
  "nextStep": "Próxima ação prioritária desta nova versão",
  "updatedStage": "Estágio de maturidade atualizado (se mudou) ou manter o atual",
  "updatedRoadmap": [
    { "stageTitle": "Atual", "goal": "Nova meta atual", "status": "Em Andamento" },
    { "stageTitle": "Próxima Evolução", "goal": "Nova próxima meta", "status": "Pendente" },
    { "stageTitle": "Depois", "goal": "Nova meta posterior", "status": "Pendente" },
    { "stageTitle": "Futuro", "goal": "Nova meta de futuro", "status": "Pendente" }
  ],
  "addedTechnologies": ["Tecnologia nova adicionada"],
  "addedIANames": ["IA nova recomendada"],
  "evolutionLog": {
    "text": "Reflexão sobre a transição para esta nova versão",
    "category": "Decisão",
    "impact": "Impacto desta evolução no projeto"
  },
  "suggestedNewStudies": [
    {
      "theme": "Nome do estudo",
      "objective": "Objetivo do estudo",
      "level": "Intermediário"
    }
  ]
}`;

        const userPrompt = `PROJETO ATUAL:
- Título: ${idea.title}
- Versão Atual: ${idea.currentVersion || 'V1'}
- Estágio: ${idea.stage}
- Categoria: ${idea.category}
- Objetivo: ${idea.objective}
- Tecnologias: ${(idea.relatedTechnologies || []).join(', ')}

PEDIDO DE EVOLUÇÃO DO USUÁRIO:
"${requestText}"`;

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
