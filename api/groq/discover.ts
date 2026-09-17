import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeGroq } from '../_shared/groqAdapter';
import { executeGemini } from '../_shared/geminiAdapter';

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

    // 1. Tenta Groq primeiro
    let executionResult = await executeGroq({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      maxTokens: 2500,
    });

    // 2. Se Groq falhar, fallback transparente para Gemini
    if (!executionResult.success) {
      console.warn('[Vercel Groq Discover] Falhou, tentando fallback para Gemini:', executionResult.error);
      const geminiResult = await executeGemini({
        systemPrompt,
        userPrompt,
        jsonMode: true,
      });

      if (geminiResult.success) {
        executionResult = {
          success: true,
          content: geminiResult.content,
          parsed: geminiResult.parsed,
          modelUsed: `${geminiResult.modelUsed} (Gemini Fallback)`,
          latencyMs: geminiResult.latencyMs,
          status: 'concluído',
        };
      }
    }

    if (!executionResult.success) {
      res.status(502).json({
        success: false,
        fallback: true,
        error: executionResult.error || 'Falha em todos os motores de descoberta.',
      });
      return;
    }

    const parsed = executionResult.parsed || {};
    const candidates = Array.isArray(parsed.candidates)
      ? parsed.candidates
      : Array.isArray(parsed)
      ? parsed
      : [];

    res.json({
      success: true,
      candidates,
      modelUsed: executionResult.modelUsed,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      fallback: true,
      error: error?.message || 'Erro interno no servidor de curadoria de IAs',
    });
  }
}
