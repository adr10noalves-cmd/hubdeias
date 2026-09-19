import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadDB, saveDB, logSecurityEventServer } from '../../server/authEngine.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { sessionId } = req.body || {};
  if (sessionId) {
    const db = loadDB();
    const session = db.sessions.find((s: any) => s.id === sessionId);
    if (session) {
      session.revokedAt = new Date().toISOString();
      saveDB(db);
      logSecurityEventServer({
        userId: session.userId,
        username: session.username,
        event: 'LOGOUT',
        severity: 'info',
        metadata: 'Sessão encerrada.',
      });
    }
  }
  res.status(200).json({ success: true });
}
