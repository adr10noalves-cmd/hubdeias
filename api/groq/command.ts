import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleGroqCommand } from '../_shared/commandHandler.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
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

  const { action, payload } = req.body || {};

  if (!action) {
    res.status(400).json({ error: 'Parâmetro "action" é obrigatório.' });
    return;
  }

  try {
    const result = await handleGroqCommand(action, payload);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.status(200).json(result);
  } catch (error: any) {
    console.error(`[Vercel Groq Command API Error - ${action}]:`, error);
    res.status(500).json({
      success: false,
      fallback: true,
      error: error?.message || 'Erro ao processar comando com o motor de IA',
    });
  }
}
