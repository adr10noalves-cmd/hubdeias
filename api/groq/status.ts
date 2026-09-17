import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GROQ_MODELS, DEFAULT_GROQ_MODEL } from '../_shared/groqAdapter';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  const isConfigured = Boolean(groqKey && groqKey.startsWith('gsk_'));

  res.json({
    status: isConfigured ? 'ok' : 'unconfigured',
    configured: isConfigured,
    engine: 'Groq Cloud Inference (Vercel Serverless Ready)',
    models: GROQ_MODELS,
    defaultModel: DEFAULT_GROQ_MODEL,
    timestamp: new Date().toISOString(),
  });
}
