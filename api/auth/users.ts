import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadDB, saveDB, hashPassword, logSecurityEventServer, UserAccount } from '../../server/authEngine.js';
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

  const db = loadDB();

  if (req.method === 'GET') {
    const safeUsers = db.users.map((u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      failedAttempts: u.failedAttempts,
    }));
    res.status(200).json(safeUsers);
    return;
  }

  if (req.method === 'POST') {
    const { username, name, email, password, role } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
      return;
    }

    if (db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
      res.status(400).json({ success: false, error: 'Nome de usuário já existe.' });
      return;
    }

    const { salt, hash } = hashPassword(password);
    const newUser: UserAccount = {
      id: 'usr_' + crypto.randomBytes(4).toString('hex'),
      username: username.trim(),
      name: name?.trim() || username,
      email: email?.trim() || `${username}@hubdeias.local`,
      role: role || 'USER',
      status: 'active',
      passwordHash: `${salt}:${hash}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failedAttempts: 0,
    };

    db.users.push(newUser);
    saveDB(db);

    logSecurityEventServer({
      username: newUser.username,
      event: 'USUARIO_CRIADO',
      severity: 'info',
      metadata: `Usuário ${newUser.username} criado (${newUser.role}).`,
    });

    res.status(200).json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}
