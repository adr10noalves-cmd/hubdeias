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
    const { name, email, role, password, toggleLock, status } = req.body || {};
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.trim();
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;

    if (password && typeof password === 'string' && password.trim().length > 0) {
      const { salt, hash } = hashPassword(password);
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
      metadata: `Conta de usuário ${user.username} atualizada.`,
    });

    res.status(200).json({ success: true, user });
    return;
  }

  if (req.method === 'DELETE') {
    const index = db.users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      const removed = db.users.splice(index, 1)[0];
      saveDB(db);
      logSecurityEventServer({
        username: removed.username,
        event: 'USUARIO_DESATIVADO',
        severity: 'warn',
        metadata: `Usuário ${removed.username} removido.`,
      });
    }
    res.status(200).json({ success: true });
    return;
  }

  res.status(405).json({ error: 'Método não permitido.' });
}
