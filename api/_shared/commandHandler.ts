import { executeGroq } from './groqAdapter';
import { executeGemini } from './geminiAdapter';

/**
 * Executa requisição com failover transparente entre Groq e Gemini
 */
async function callWithFallback(systemPrompt: string, userPrompt: string, maxTokens = 2048) {
  // 1. Tenta Groq primeiro (alta velocidade)
  const groqRes = await executeGroq({
    systemPrompt,
    userPrompt,
    jsonMode: true,
    maxTokens,
  });

  if (groqRes.success && groqRes.parsed) {
    return { parsed: groqRes.parsed, modelUsed: groqRes.modelUsed };
  }

  // 2. Se Groq falhou, tenta Gemini
  console.warn('[CommandHandler] Groq indisponível ou cota esgotada. Acionando fallback para Gemini...');
  const geminiRes = await executeGemini({
    systemPrompt,
    userPrompt,
    jsonMode: true,
  });

  if (geminiRes.success && geminiRes.parsed) {
    return { parsed: geminiRes.parsed, modelUsed: `${geminiRes.modelUsed} (Gemini Fallback)` };
  }

  throw new Error(
    `Falha em ambos os motores de IA. Groq: ${groqRes.error || 'Erro'}. Gemini: ${geminiRes.error || 'Erro'}`
  );
}

export async function handleGroqCommand(
  action: string,
  payload: any
): Promise<{ success: boolean; data?: any; error?: string; [key: string]: any }> {
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
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, `Comando do usuário: "${userPrompt}"`, 512);
      return { success: true, ...parsed, modelUsed };
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
1. MEMÓRIA & CONTEXTO: Utilize sempre a memória contextual informada acima para embasar suas respostas.
2. OBJETIVO -> CONTEXTO -> MEMÓRIA -> PLANO -> IA -> EXECUÇÃO -> VALIDAÇÃO -> APRENDIZADO -> EVOLUÇÃO.
3. NÃO invente dados de projetos ou capacidades fictícias de modelos.
4. Se o usuário apresentar uma nova ideia relevante sem projeto associado, pergunte: "Quer que eu registre essa ideia no HUB?".
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
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 2048);
      return { success: true, ...parsed, modelUsed };
    }

    case 'simulate_scenario': {
      const { objective, contextSummary, projectName } = payload || {};
      const systemPrompt = `Você é o SIMULATION ENGINE do HUB ESTRATÉGICO DE IAs, operando em sandbox experimental.
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
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 2048);
      return { success: true, ...parsed, modelUsed };
    }

    case 'generate_prompt': {
      const { objective, targetIA, level, desiredResult, language } = payload || {};
      const currentLevel = level || 'Intermediário';

      const systemPrompt = `Você é o CENTRAL DE IA — PROMPT ARCHITECT INTELIGENTE DE ALTA PRECISÃO.
Sua missão é converter a solicitação em linguagem natural de um usuário em um prompt profissional e altamente eficaz para a IA de destino: "${targetIA || 'Geral'}", nível: "${currentLevel}".

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
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 2560);
      return { success: true, ...parsed, modelUsed };
    }

    case 'compare': {
      const { selectedIANames, objective, catalog } = payload || {};
      const catalogList = Array.isArray(catalog) ? catalog : [];
      const targetNames: string[] = Array.isArray(selectedIANames) ? selectedIANames : [];
      const matchedIAs = catalogList.filter((item: any) => targetNames.includes(item.name));

      const systemPrompt = `Você é o Avaliador e Árbitro Técnico de IAs da CENTRAL DE COMANDO.
Compare as IAs selecionadas pelo usuário considerando o objetivo informado.

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
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 2048);
      return { success: true, ...parsed, modelUsed };
    }

    case 'register_ai': {
      const promptOrName = String(payload?.promptOrName || '');
      const systemPrompt = `Você é o Estruturador de Cadastros de IA da CENTRAL DE COMANDO.
O usuário solicitou o cadastro de uma nova IA.
Sua tarefa é interpretar a solicitação e retornar os dados estruturados para o catálogo.

Retorne em JSON estrito:
{
  "newIA": {
    "name": "Nome oficial da IA",
    "category": "MODELOS GERAIS / MULTIMODAL" | "PESQUISA INTELIGENTE" | "CÓDIGO & ENGENHARIA" | "AUTOMAÇÃO & EXECUÇÃO" | "IMAGEM & CRIATIVIDADE" | "VÍDEO & PRODUÇÃO" | "ÁUDIO & MÚSICA" | "PRODUTIVIDADE EMPRESARIAL",
    "specialty": "Especialidade principal em 1 frase",
    "differential": "Diferencial mais marcante",
    "level": "Elite" | "Alta Performance" | "Especializada",
    "difficulty": "Iniciante" | "Intermediário" | "Avançado",
    "pricing": "Descrição curta do plano",
    "pricingType": "FREE" | "FREEMIUM" | "TRIAL" | "PAID",
    "pricingDetails": "Detalhes de cotas",
    "link": "https://url-oficial-correta.com",
    "whatIsIt": "Explicação clara",
    "whatIsItFor": "Para que serve",
    "paraQueServe": "Resumo didático para iniciantes",
    "quandoUsar": "Cenário ideal",
    "quandoNaoUsar": "Quando não usar",
    "melhorPara": "Público ideal",
    "pontosFortes": "Pontos fortes",
    "limitacoes": "Limitações",
    "exemploPrompt": "Comando prático para testar",
    "bestTasks": ["Tarefa 1", "Tarefa 2"],
    "qualityScore": 85
  }
}`;
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, `SOLICITAÇÃO DE CADASTRO: "${promptOrName}"`, 1800);
      return { success: true, ...parsed, modelUsed };
    }

    case 'discover_ai': {
      const query = String(payload?.query || '');
      const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
      const catalogNames = catalog.map((i: any) => i.name).join(', ');

      const systemPrompt = `Você é o Curador de Descoberta de Novas IAs do "HUB ESTRATÉGICO DE IAs".
Retorne de 1 a 3 IAs reais que não estejam em: [${catalogNames}].

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
      "whyBetter": "Por que complementa o catálogo",
      "paraQueServe": "Para que serve",
      "quandoUsar": "Quando usar",
      "quandoNaoUsar": "Quando evitar",
      "pontosFortes": "Pontos fortes",
      "limitacoes": "Limitações",
      "exemploPrompt": "Exemplo de prompt prático"
    }
  ]
}`;
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, `PEDIDO DE DESCOBERTA: "${query}"`, 2048);
      return { success: true, ...parsed, modelUsed };
    }

    case 'build_strategy': {
      const task = String(payload?.task || '');
      const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
      const catalogSummary = catalog
        .map((i: any) => `- ${i.name} (Cat: ${i.category} | Esp: ${i.specialty} | Link: ${i.link})`)
        .join('\n');

      const systemPrompt = `Você é o Arquiteto e Estrategista Chefe de Inteligência Artificial do "HUB ESTRATÉGICO DE IAs".
Desenhe uma estratégia operacional sequencial em 3 a 5 etapas claras utilizando as IAs do catálogo do usuário.
Idioma obrigatório: Português do Brasil (pt-BR).

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
      const userPrompt = `TAREFA COMPLEXA: "${task}"\n\nCATÁLOGO DO USUÁRIO DISPONÍVEL:\n${catalogSummary}`;
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 2048);
      return { success: true, ...parsed, modelUsed };
    }

    case 'query_catalog': {
      const question = String(payload?.question || '');
      const catalog = Array.isArray(payload?.catalog) ? payload.catalog : [];
      const catalogList = catalog
        .map((i: any) => `- ${i.name} [${i.category}] (Nível: ${i.level}, Preço: ${i.pricing}, Especialidade: ${i.specialty})`)
        .join('\n');

      const systemPrompt = `Você é o Consultor Oficial do Catálogo de IAs do usuário.
Responda à pergunta do usuário sobre o que está cadastrado no catálogo.

Retorne em JSON estrito:
{
  "question": "${question}",
  "answer": "Resposta objetiva e clara citando as IAs do catálogo",
  "matchingIANames": ["NomeIA1", "NomeIA2"],
  "highlights": ["Destaque 1", "Destaque 2"]
}`;
      const userPrompt = `PERGUNTA DO USUÁRIO: "${question}"\n\nCATÁLOGO ATUAL DO USUÁRIO:\n${catalogList}`;
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 1500);
      return { success: true, ...parsed, modelUsed };
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
        ? historyVersions.map((v: any) => `[${v.version}] Mudança: ${v.changedSummary} | Motivo: ${v.changeReason}`).join('\n')
        : 'Nenhuma versão anterior registrada.';

      const systemPrompt = `Você é o ASSISTENTE DE EVOLUÇÃO ESTRATÉGICA DE PROJETOS E IDEIAS do Hub drico IAS.
Analise o contexto do projeto do usuário e forneça diretrizes de evolução em JSON estrito:
{
  "summaryAnalysis": "Diagnóstico do estado atual do projeto",
  "suggestedEvolutions": [
    {
      "title": "Título da evolução recomendada",
      "changeReason": "Por que essa mudança é estratégica",
      "decisionTaken": "Decisão técnica proposta",
      "nextStep": "Próxima ação prática",
      "impact": "Impacto na arquitetura / produto"
    }
  ],
  "suggestedRoadmap": [
    { "stageTitle": "Atual", "goal": "Meta clara", "status": "Pendente" }
  ],
  "recommendedStudies": [
    { "theme": "Nome do tema", "objective": "Objetivo de aprendizado", "recommendedTools": ["IA1"] }
  ],
  "recommendedCatalogTools": ["Nome da IA do catálogo"]
}`;

      const userPrompt = `PROJETO/IDEIA:
- Título: ${idea?.title || 'Sem título'}
- Estágio: ${idea?.stage || '1. Ideia'}
- Objetivo: ${idea?.objective || 'Não informado'}
- Versões anteriores:\n${versionsSummary}
- Catálogo:\n${catalogSummary}
- Dúvida do usuário: "${q}"`;

      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 2048);
      return { success: true, ...parsed, modelUsed };
    }

    case 'structure_project_with_ai': {
      const { userRequest, catalog, existingProjects } = payload || {};
      const requestText = String(userRequest || '').trim();

      if (!requestText) {
        return { success: false, error: 'userRequest é obrigatório.' };
      }

      const catalogList = Array.isArray(catalog) ? catalog : [];
      const catalogSummary = catalogList
        .slice(0, 45)
        .map((i: any) => `- ${i.name} (Cat: ${i.category}): ${i.specialty}`)
        .join('\n');

      const systemPrompt = `Você é o ARQUITETO ESTRATÉGICO DE PROJETOS, SISTEMAS E IA do Hub drico IAS.
Transforme a ideia em uma estrutura completa de projeto com etapas e prompts executáveis.

Retorne EXCLUSIVAMENTE em formato JSON estrito:
{
  "title": "Nome marcante e profissional do projeto",
  "description": "Resumo executivo de 2 a 3 frases",
  "category": "Software" | "Automação" | "Negócios" | "Estudo" | "IA" | "Produto",
  "stage": "1. Ideia",
  "priority": "Alta" | "Média" | "Crítica",
  "objective": "Objetivo central claro",
  "problemSolved": "Problemas concretos que resolve",
  "targetAudience": "Público-alvo",
  "relatedTechnologies": ["Stack 1", "Stack 2"],
  "relatedIANames": ["IA 1", "IA 2"],
  "observations": "Observações arquiteturais estratégicas",
  "nextSteps": "Primeira tarefa prática para hoje",
  "concept": {
    "summary": "Conceito e tese",
    "coreValue": "Proposta de valor",
    "mechanics": "Mecânica de funcionamento",
    "marketFit": "Diferencial de mercado"
  },
  "application": {
    "realWorldUseCases": ["Caso 1", "Caso 2"],
    "userFlow": ["Passo 1", "Passo 2", "Passo 3"],
    "businessRules": ["Regra 1", "Regra 2"],
    "architecture": "Descrição da arquitetura prática"
  },
  "stages": [
    {
      "id": "stg-1",
      "order": 1,
      "title": "Etapa 1: Concepção & Modelagem de Requisitos",
      "phase": "Concepção",
      "objective": "Objetivo da etapa",
      "deliverable": "Entregável tangível",
      "prompt": "Prompt completo e detalhado para a IA executar esta etapa...",
      "recommendedTools": ["ChatGPT", "Claude"],
      "status": "Em Andamento"
    },
    {
      "id": "stg-2",
      "order": 2,
      "title": "Etapa 2: Arquitetura de Dados & Modelagem",
      "phase": "Arquitetura",
      "objective": "Modelagem de dados",
      "deliverable": "Schemas e diagramas",
      "prompt": "Prompt para modelar schemas e banco de dados...",
      "recommendedTools": ["Supabase", "Prisma"],
      "status": "Pendente"
    },
    {
      "id": "stg-3",
      "order": 3,
      "title": "Etapa 3: Desenvolvimento do Core / Backend",
      "phase": "Backend",
      "objective": "Construção de endpoints",
      "deliverable": "APIs RESTful",
      "prompt": "Prompt para desenvolver a lógica de negócio...",
      "recommendedTools": ["Node.js", "Express"],
      "status": "Pendente"
    },
    {
      "id": "stg-4",
      "order": 4,
      "title": "Etapa 4: Interface do Usuário (UI/UX)",
      "phase": "Frontend",
      "objective": "Interface intuitiva",
      "deliverable": "Componentes em React e Tailwind",
      "prompt": "Prompt para construir a interface visual...",
      "recommendedTools": ["React", "Tailwind CSS"],
      "status": "Pendente"
    },
    {
      "id": "stg-5",
      "order": 5,
      "title": "Etapa Final: Deploy, Testes & Lançamento",
      "phase": "Deploy",
      "objective": "Publicação em produção",
      "deliverable": "Aplicação online",
      "prompt": "Prompt para pipeline de deploy e testes...",
      "recommendedTools": ["Vercel", "GitHub Actions"],
      "status": "Pendente"
    }
  ],
  "roadmap": [
    { "stageTitle": "Atual", "goal": "Meta imediata", "status": "Em Andamento" },
    { "stageTitle": "Próxima Evolução", "goal": "Próxima meta", "status": "Pendente" }
  ],
  "initialDiaryLog": {
    "text": "Abertura no Diário de Bordo descrevendo o ponto de partida.",
    "category": "Decisão",
    "impact": "Definição do escopo e arquitetura inicial."
  },
  "suggestedStudies": [
    {
      "theme": "Tema de estudo recomendado",
      "objective": "O que aprender para acelerar o projeto",
      "level": "Iniciante",
      "toolsUsed": ["Ferramenta"]
    }
  ],
  "versionNote": "Projeto concebido com IA"
}`;

      const userPrompt = `SOLICITAÇÃO DO USUÁRIO PARA CO-CRIAR PROJETO:\n"${requestText}"\n\nCATÁLOGO DO HUB:\n${catalogSummary}`;
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 3500);
      return { success: true, ...parsed, modelUsed };
    }

    case 'infinite_revision_with_ai': {
      const { idea, userRequest } = payload || {};
      const requestText = String(userRequest || '').trim();

      const systemPrompt = `Você é o ARQUITETO DE REVISÃO E OTIMIZAÇÃO INFINITA DE PROJETOS.
Analise a solicitação de revisão e retorne a versão aprimorada em JSON estrito com campos: "revisedConcept", "revisedApplication", "revisedStages", "addedOrImprovedStages", "nextActionImmediate", "reviewDiaryLog".`;

      const userPrompt = `PROJETO ATUAL:\nTítulo: ${idea?.title}\nObjetivo: ${idea?.objective}\nPEDIDO DE REVISÃO:\n"${requestText}"`;
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 3500);
      return { success: true, ...parsed, modelUsed };
    }

    case 'execute_stage_prompt_with_ai': {
      const { projectTitle, stageTitle, prompt, executionContext } = payload || {};
      const stagePromptText = String(prompt || '').trim();

      if (!stagePromptText) {
        return { success: false, error: 'Prompt da etapa é obrigatório para execução.' };
      }

      const systemPrompt = `Você é um ENGENHEIRO DE SOFTWARE E ARQUITETO DE SISTEMAS EXECUTOR do Hub drico IAS.
Sua missão é EXECUTAR o prompt da etapa "${stageTitle || 'Etapa'}" para o projeto "${projectTitle || 'Projeto'}".
Gere entrega prática e profissional.

Retorne em formato JSON estrito:
{
  "stageTitle": "${stageTitle || 'Etapa'}",
  "outputType": "code" | "specification" | "architecture" | "documentation",
  "resultContent": "Texto completo com a entrega da etapa",
  "executionSummary": "Resumo em 2 frases do que foi gerado",
  "nextSuggestedAction": "Próxima ação recomendada"
}`;

      const userPrompt = `PROJETO: ${projectTitle}\nETAPA: ${stageTitle}\nPROMPT DA ETAPA:\n"${stagePromptText}"`;
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 3000);
      return { success: true, ...parsed, modelUsed };
    }

    case 'evolve_project_with_ai': {
      const { idea, userRequest } = payload || {};
      const requestText = String(userRequest || '').trim();

      if (!idea || !idea.id) {
        return { success: false, error: 'idea é obrigatório.' };
      }

      const systemPrompt = `Você é o ARQUITETO DE EVOLUÇÃO CONTÍNUA DE PROJETOS E VERSÕES do Hub drico IAS.
Proponha a evolução do projeto para a próxima versão (V2/V3) em JSON estrito com campos: "newVersion", "changedSummary", "changeReason", "decisionTaken", "nextStep", "updatedRoadmap", "addedTechnologies", "evolutionLog", "suggestedNewStudies".`;

      const userPrompt = `PROJETO: ${idea.title} (${idea.currentVersion || 'V1'})\nPEDIDO DE EVOLUÇÃO:\n"${requestText}"`;
      const { parsed, modelUsed } = await callWithFallback(systemPrompt, userPrompt, 2048);
      return { success: true, ...parsed, modelUsed };
    }

    default:
      return { success: false, error: `Ação "${action}" não reconhecida.` };
  }
}
