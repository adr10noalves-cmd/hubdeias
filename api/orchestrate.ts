import type { VercelRequest, VercelResponse } from '@vercel/node';
import { orchestrateExecution } from './_shared/orchestratorCore';

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

  try {
    const result = await orchestrateExecution(req.body || {});
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      data: null,
      providerUsed: 'SYSTEM-FALLBACK',
      modelUsed: 'none',
      status: 'erro',
      fallbackTriggered: false,
      primaryError: err?.message || 'Erro interno na orquestração de IA.',
      diagnostic: {
        message: 'Falha não tratada no servidor Vercel.',
        probableCause: err?.message,
      },
      latencyMs: 0,
    });
  }
}
