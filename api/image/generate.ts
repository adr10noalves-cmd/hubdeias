import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeCloudflareImage } from '../_shared/cloudflareImageAdapter.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuração rigorosa de cabeçalhos CORS
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
    res.status(405).json({
      success: false,
      artifactType: 'image',
      error: 'Método não permitido. Utilize POST para o endpoint /api/image/generate.',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
    });
    return;
  }

  // Leitura segura das variáveis de ambiente em RUNTIME da Vercel
  const envToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const envAccountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();

  // Suporte complementar a credenciais passadas na sessão (para testes de governança no modal)
  const clientToken = typeof req.body?.apiToken === 'string' ? req.body.apiToken.trim() : '';
  const clientAccountId = typeof req.body?.accountId === 'string' ? req.body.accountId.trim() : '';

  const activeToken = envToken || clientToken;
  const activeAccountId = envAccountId || clientAccountId;

  if (!activeToken || !activeAccountId) {
    res.status(400).json({
      success: false,
      artifactType: 'image',
      error: 'Credenciais da Cloudflare Workers AI (CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID) não configuradas no runtime da Vercel.',
      status: 'CONFIG_ERROR',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
    });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    res.status(400).json({
      success: false,
      artifactType: 'image',
      error: 'Parâmetro "prompt" é obrigatório para geração de imagem.',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
    });
    return;
  }

  try {
    const result = await executeCloudflareImage({
      prompt: prompt.trim(),
      accountId: activeAccountId,
      apiToken: activeToken,
    });

    if (!result.success) {
      res.status(502).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err: any) {
    console.error('[Vercel /api/image/generate error]:', err?.message);
    res.status(500).json({
      success: false,
      artifactType: 'image',
      error: err?.message || 'Erro interno ao processar geração de imagem na Vercel.',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
    });
  }
}
