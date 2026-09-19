import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runIndividualEngineTest } from '../_shared/orchestratorCore.js';

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

  const engine = (req.body?.engine || req.query?.engine || 'GEMINI') as 'GEMINI' | 'GROQ';

  if (engine !== 'GEMINI' && engine !== 'GROQ') {
    res.status(400).json({ error: 'Parâmetro "engine" deve ser "GEMINI" ou "GROQ".' });
    return;
  }

  try {
    const result = await runIndividualEngineTest(engine);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({
      provider: engine,
      status: 'erro',
      testPassed: false,
      message: '✕ MOTOR COM ERRO',
      diagnostic: `Erro durante teste: ${err?.message || 'Falha desconhecida'}`,
      latencyMs: 0,
    });
  }
}
