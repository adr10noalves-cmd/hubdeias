import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executeCloudflareImage } from '../_shared/cloudflareImageAdapter.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const { prompt, width, height, accountId, apiToken } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ success: false, error: 'Parâmetro "prompt" é obrigatório para geração de imagem.' });
    return;
  }

  try {
    const result = await executeCloudflareImage({ prompt, width, height, accountId, apiToken });
    res.status(200).json(result);
  } catch (err: any) {
    console.error('[Vercel /api/image/generate error]:', err);
    res.status(500).json({
      success: false,
      error: err?.message || 'Erro interno ao gerar imagem na Cloudflare.',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
    });
  }
}
