import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadDB, saveDB, verifyPassword, logSecurityEventServer, AuthSession } from '../../server/authEngine.js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' });
    return;
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
    return;
  }

  const db = loadDB();
  const cleanUser = String(username).trim().toLowerCase();
  const user = db.users.find((u: any) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser);

  const genericError = 'Não foi possível validar as credenciais informadas.';

  if (!user) {
    logSecurityEventServer({
      username: username,
      event: 'LOGIN_FALHA',
      severity: 'warn',
      metadata: 'Tentativa de login com identificador não reconhecido.',
    });
    res.status(401).json({ success: false, error: genericError });
    return;
  }

  if (user.status === 'locked' && user.lockedUntil) {
    const lockedUntilDate = new Date(user.lockedUntil);
    if (lockedUntilDate > new Date()) {
      const remainingMins = Math.ceil((lockedUntilDate.getTime() - Date.now()) / 60000);
      res.status(423).json({ success: false, lockedOut: true, error: `Conta bloqueada. Tente em ${remainingMins} min.` });
      return;
    } else {
      user.status = 'active';
      user.failedAttempts = 0;
      user.lockedUntil = null;
    }
  }

  if (user.status === 'suspended') {
    res.status(403).json({ success: false, error: 'Conta suspensa.' });
    return;
  }

  const isValid = verifyPassword(password, user.passwordHash);

  if (!isValid) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= 5) {
      user.status = 'locked';
      user.lockedUntil = new Date(Date.now() + 30 * 60000).toISOString();
    } else if (user.failedAttempts >= 3) {
      user.status = 'locked';
      user.lockedUntil = new Date(Date.now() + 5 * 60000).toISOString();
    }
    saveDB(db);
    res.status(401).json({ success: false, error: genericError });
    return;
  }

  user.failedAttempts = 0;
  user.status = 'active';
  user.lockedUntil = null;
  user.lastLogin = new Date().toISOString();

  const session: AuthSession = {
    id: 'ses_' + crypto.randomBytes(8).toString('hex'),
    userId: user.id,
    username: user.username,
    role: user.role,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    device: req.headers['user-agent']?.substring(0, 100) || 'Vercel Function',
  };

  db.sessions.push(session);
  saveDB(db);

  logSecurityEventServer({
    userId: user.id,
    username: user.username,
    event: 'LOGIN_SUCESSO',
    severity: 'info',
    metadata: `Autenticação bem-sucedida (${user.role}).`,
  });

  res.status(200).json({ success: true, session });
}
