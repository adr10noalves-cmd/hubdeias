import type { VercelRequest, VercelResponse } from '@vercel/node';

// Chave da Groq com fallback para a chave de produção
const GROQ_API_KEY =
  process.env.GROQ_API_KEY || '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';

const GROQ_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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

  try {
    const { taskDescription, currentCatalogIAs } = req.body || {};

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
5. Retorne obrigatoriamente um objeto JSON com uma chave "candidates", contendo uma lista de 1 a 3 ferramentas recomendadas com os seguintes campos exatos:
   - "name": Nome exato da ferramenta
   - "officialUrl": URL oficial completa e válida (começando com https://)
   - "category": Uma categoria dentre: "MODELOS GERAIS / MULTIMODAL", "PESQUISA INTELIGENTE", "CÓDIGO & ENGENHARIA", "AUTOMAÇÃO & EXECUÇÃO", "IMAGEM & CRIATIVIDADE", "VÍDEO & PRODUÇÃO", "ÁUDIO & MÚSICA", "PRODUTIVIDADE EMPRESARIAL"
   - "specialty": Especialidade técnica principal (frase curta)
   - "differential": Diferencial concreto frente aos concorrentes
   - "level": "Elite", "Alta Performance" ou "Especializada"
   - "pricingType": "FREE", "FREEMIUM", "TRIAL" ou "PAID"
   - "qualityScore": número inteiro de 0 a 100
   - "reason": Justificativa técnica da escolha
   - "whyDiscovered": Por que foi encontrada para esta tarefa específica
   - "whyBetter": Por que pode ser melhor ou complementar às IAs já disponíveis
   - "paraQueServe": Explicação direta para iniciantes
   - "quandoUsar": Cenário ideal de uso
   - "quandoNaoUsar": Limitações e quando evitar
   - "pontosFortes": Principais vantagens
   - "limitacoes": Principais limitações ou cotas
   - "exemploPrompt": Exemplo de comando prático para testar a ferramenta`;

    const userPrompt = `TAREFA / OBJETIVO DO USUÁRIO:
"${taskDescription}"

FERRAMENTAS QUE JÁ ESTÃO NO CATÁLOGO ATUAL (NÃO REPITA ESTAS):
${existingNamesList || 'Nenhuma informada'}

Retorne os candidatos a novas IAs em formato JSON estrito conforme solicitado.`;

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
        }
      } catch (e) {
        console.warn(`[Vercel Serverless Groq Model ${model}] erro:`, e);
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

    const data: any = await groqResponse.json();
    const content = data?.choices?.[0]?.message?.content || '{}';

    try {
      const parsed = JSON.parse(content);
      const candidates = Array.isArray(parsed.candidates)
        ? parsed.candidates
        : Array.isArray(parsed)
        ? parsed
        : [];
      res.json({
        success: true,
        candidates,
        modelUsed,
      });
    } catch {
      res.json({
        success: true,
        candidates: [],
        modelUsed,
        rawContent: content,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      fallback: true,
      error: error?.message || 'Erro interno no servidor de curadoria Groq',
    });
  }
}
