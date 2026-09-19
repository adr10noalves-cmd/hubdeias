import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadDB, saveDB, logSecurityEventServer } from '../../../server/authEngine.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const { id } = req.query;
  const db = loadDB();
  const user = db.users.find((u: any) => u.id === id);
  if (!user) {
    res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    return;
  }

  user.status = user.status === 'locked' || user.status === 'suspended' ? 'active' : 'locked';
  user.failedAttempts = 0;
  user.lockedUntil = null;
  saveDB(db);

  logSecurityEventServer({
    userId: user.id,
    username: user.username,
    event: user.status === 'active' ? 'CONTA_DESBLOQUEADA' : 'CONTA_BLOQUEADA',
    severity: 'warn',
    metadata: `Status do usuário alterado para ${user.status}.`,
  });

  res.status(200).json({ success: true, status: user.status });
}
