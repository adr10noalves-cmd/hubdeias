import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_KEY =
  process.env.GROQ_API_KEY || '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';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.json({
    status: 'ok',
    configured: Boolean(GROQ_API_KEY && GROQ_API_KEY.startsWith('gsk_')),
    engine: 'Groq Cloud Inference (Vercel Serverless Ready)',
    models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
    timestamp: new Date().toISOString(),
  });
}
