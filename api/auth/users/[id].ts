import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadDB, saveDB, hashPassword, logSecurityEventServer } from '../../../server/authEngine.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  const db = loadDB();
  const user = db.users.find((u: any) => u.id === id);
  if (!user) {
    res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    return;
  }

  if (req.method === 'PATCH') {
    const { username, name, email, role, password, toggleLock, status } = req.body || {};

    if (username !== undefined && String(username).trim().length > 0) {
      const cleanUser = String(username).trim();
      if (cleanUser.toLowerCase() !== user.username.toLowerCase()) {
        const exists = db.users.some((u: any) => u.id !== user.id && u.username.toLowerCase() === cleanUser.toLowerCase());
        if (exists) {
          res.status(400).json({ success: false, error: 'Este nome de usuário já está em uso por outra conta.' });
          return;
        }
        user.username = cleanUser;
      }
    }

    if (name !== undefined) user.name = String(name).trim();
    if (email !== undefined) user.email = String(email).trim();
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;

    if (password && typeof password === 'string' && password.trim().length > 0) {
      const { salt, hash } = hashPassword(password.trim());
      user.passwordHash = `${salt}:${hash}`;
    }

    if (toggleLock) {
      user.status = user.status === 'locked' || user.status === 'suspended' ? 'active' : 'locked';
      user.failedAttempts = 0;
      user.lockedUntil = null;
    }

    user.updatedAt = new Date().toISOString();
    saveDB(db);

    logSecurityEventServer({
      userId: user.id,
      username: user.username,
      event: 'ALTERACAO_DE_SENHA',
      severity: 'info',
      metadata: `Conta de usuário ${user.username} atualizada por administrador.`,
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        updatedAt: user.updatedAt,
      },
    });
    return;
  }

  if (req.method === 'DELETE') {
    const index = db.users.findIndex((u: any) => u.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
      return;
    }
    const removed = db.users[index];
    if (removed.username === 'admin') {
      res.status(400).json({ success: false, error: 'A conta mestre do administrador não pode ser excluída.' });
      return;
    }

    db.users.splice(index, 1);
    saveDB(db);

    logSecurityEventServer({
      userId: removed.id,
      username: removed.username,
      event: 'USUARIO_DESATIVADO',
      severity: 'warn',
      metadata: `Usuário ${removed.username} excluído do sistema por administrador.`,
    });

    res.status(200).json({ success: true });
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}
