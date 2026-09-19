import express from 'express';
import path from 'path';
import fs from 'fs';
import nodeCrypto from 'crypto';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import {
  orchestrateExecution,
  getOrchestratorDiagnostics,
  runIndividualEngineTest,
} from './api/_shared/orchestratorCore';
import { handleGroqCommand } from './api/_shared/commandHandler';
import { GROQ_MODELS, DEFAULT_GROQ_MODEL, executeGroq } from './api/_shared/groqAdapter';
import { GEMINI_MODELS, DEFAULT_GEMINI_MODEL, executeGemini } from './api/_shared/geminiAdapter';
import {
  verifyPassword,
  hashPassword,
  logSecurityEventServer,
  AuthSession,
  UserAccount,
} from './server/authEngine';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// CORS local para ambiente de desenvolvimento
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 1. ENDPOINT CENTRAL DE ORQUESTRAÇÃO DE IA (GEMINI PRINCIPAL + GROQ AUXILIAR)
app.post('/api/orchestrate', async (req, res) => {
  try {
    const result = await orchestrateExecution(req.body || {});
    res.json(result);
  } catch (err: any) {
    console.error('[Server /api/orchestrate error]:', err);
    res.status(500).json({
      success: false,
      data: null,
      providerUsed: 'SYSTEM-FALLBACK',
      modelUsed: 'none',
      status: 'erro',
      fallbackTriggered: false,
      primaryError: err?.message || 'Erro interno na orquestração.',
      diagnostic: {
        message: 'Falha no processador central.',
        probableCause: err?.message,
      },
      latencyMs: 0,
    });
  }
});

// 2. DIAGNÓSTICO DO ESTADO DOS MOTORES
app.get('/api/orchestrator/status', (req, res) => {
  const diag = getOrchestratorDiagnostics();
  res.json(diag);
});

// 3. TESTE INDIVIDUAL DOS MOTORES DE IA
app.all('/api/orchestrator/test', async (req, res) => {
  const engine = (req.body?.engine || req.query?.engine || 'GEMINI') as 'GEMINI' | 'GROQ';
  if (engine !== 'GEMINI' && engine !== 'GROQ') {
    res.status(400).json({ error: 'Parâmetro "engine" deve ser "GEMINI" ou "GROQ".' });
    return;
  }

  try {
    const testResult = await runIndividualEngineTest(engine);
    res.json(testResult);
  } catch (err: any) {
    res.status(500).json({
      provider: engine,
      status: 'erro',
      testPassed: false,
      message: '✕ MOTOR COM ERRO',
      diagnostic: `Erro durante teste do motor: ${err?.message || 'Falha desconhecida'}`,
      latencyMs: 0,
    });
  }
});

// 4. RETROCOMPATIBILIDADE: STATUS GROQ
app.get('/api/groq/status', (req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  const isConfigured = Boolean(groqKey && groqKey.startsWith('gsk_'));

  res.json({
    status: isConfigured ? 'ok' : 'unconfigured',
    configured: isConfigured,
    engine: 'Groq Cloud Inference',
    models: GROQ_MODELS,
    defaultModel: DEFAULT_GROQ_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// 5. RETROCOMPATIBILIDADE: COMANDOS GROQ COM RESILIÊNCIA E FALLBACK
app.post('/api/groq/command', async (req, res) => {
  const { action, payload } = req.body || {};

  if (!action) {
    res.status(400).json({ error: 'Parâmetro "action" é obrigatório.' });
    return;
  }

  try {
    const result = await handleGroqCommand(action, payload);
    res.json(result);
  } catch (error: any) {
    console.error(`[Server /api/groq/command error - ${action}]:`, error);
    res.status(500).json({
      success: false,
      fallback: true,
      error: error?.message || 'Erro ao processar comando de IA.',
    });
  }
});

// 6. RETROCOMPATIBILIDADE: DESCOBERTA E CURADORIA DE IAS
app.post('/api/groq/discover', async (req, res) => {
  try {
    const { taskDescription, currentCatalogIAs } = req.body || {};

    if (!taskDescription || typeof taskDescription !== 'string') {
      res.status(400).json({ error: 'taskDescription é obrigatório' });
      return;
    }

    const existingNamesList = Array.isArray(currentCatalogIAs)
      ? currentCatalogIAs.map((item: any) => `${item.name} (${item.url || ''})`).join(', ')
      : '';

    const systemPrompt = `Você é o Curador Oficial de Inteligências Artificiais do "HUB ESTRATÉGICO DE IAs".
Indique de 1 a 3 ferramentas reais existentes para a tarefa solicitada.
Retorne obrigatoriamente um objeto JSON com chave "candidates".`;

    const userPrompt = `TAREFA: "${taskDescription}"\nCATÁLOGO JÁ EXISTENTE: ${existingNamesList || 'Nenhum'}`;

    // Tenta Groq com fallback para Gemini
    let execRes = await executeGroq({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      maxTokens: 2500,
    });

    if (!execRes.success) {
      execRes = await executeGemini({
        systemPrompt,
        userPrompt,
        jsonMode: true,
      });
    }

    if (!execRes.success) {
      res.status(502).json({
        success: false,
        fallback: true,
        error: execRes.error || 'Falha na descoberta de IAs.',
      });
      return;
    }

    const parsed = execRes.parsed || {};
    const candidates = Array.isArray(parsed.candidates)
      ? parsed.candidates
      : Array.isArray(parsed)
      ? parsed
      : [];

    res.json({
      success: true,
      candidates,
      modelUsed: execRes.modelUsed,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      fallback: true,
      error: err?.message || 'Erro no servidor de curadoria.',
    });
  }
});

// --- ROTAS DA CENTRAL DE AUTENTICAÇÃO E MOTOR DE SEGURANÇA SERVER-SIDE ---
const DB_FILE = path.join(process.cwd(), 'data', 'security_storage.json');

function loadServerDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { users: [], sessions: [], events: [], passkeys: [] };
}

function saveServerDB(dbData: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  } catch (e) {}
}

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
    return;
  }

  const db = loadServerDB();
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
      logSecurityEventServer({
        userId: user.id,
        username: user.username,
        event: 'CONTA_BLOQUEADA',
        severity: 'danger',
        metadata: `Tentativa em conta bloqueada. Restam ${remainingMins} minutos.`,
      });
      res.status(423).json({ success: false, lockedOut: true, error: `Conta temporariamente bloqueada. Tente em ${remainingMins} min.` });
      return;
    } else {
      user.status = 'active';
      user.failedAttempts = 0;
      user.lockedUntil = null;
    }
  }

  if (user.status === 'suspended') {
    res.status(403).json({ success: false, error: 'Esta conta encontra-se suspensa pelo administrador.' });
    return;
  }

  const isValid = verifyPassword(password, user.passwordHash);

  if (!isValid) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    let lockoutMins = 0;

    if (user.failedAttempts >= 5) {
      lockoutMins = 30;
      user.status = 'locked';
      user.lockedUntil = new Date(Date.now() + lockoutMins * 60000).toISOString();
      logSecurityEventServer({
        userId: user.id,
        username: user.username,
        event: 'CONTA_BLOQUEADA',
        severity: 'danger',
        metadata: `Conta bloqueada por 30 minutos após ${user.failedAttempts} falhas.`,
      });
    } else if (user.failedAttempts >= 3) {
      lockoutMins = 5;
      user.status = 'locked';
      user.lockedUntil = new Date(Date.now() + lockoutMins * 60000).toISOString();
      logSecurityEventServer({
        userId: user.id,
        username: user.username,
        event: 'CONTA_BLOQUEADA',
        severity: 'warn',
        metadata: `Conta bloqueada por 5 minutos após ${user.failedAttempts} falhas.`,
      });
    } else {
      logSecurityEventServer({
        userId: user.id,
        username: user.username,
        event: 'LOGIN_FALHA',
        severity: 'warn',
        metadata: `Falha na senha (tentativa ${user.failedAttempts}/5).`,
      });
    }

    saveServerDB(db);

    if (user.status === 'locked') {
      res.status(423).json({ success: false, lockedOut: true, error: `Muitas tentativas incorretas. Conta bloqueada por ${lockoutMins} minutos.` });
      return;
    }

    res.status(401).json({ success: false, error: genericError });
    return;
  }

  user.failedAttempts = 0;
  user.status = 'active';
  user.lockedUntil = null;
  user.lastLogin = new Date().toISOString();

  const session: AuthSession = {
    id: 'ses_' + nodeCrypto.randomBytes(8).toString('hex'),
    userId: user.id,
    username: user.username,
    role: user.role,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    device: req.headers['user-agent']?.substring(0, 100) || 'Unknown device',
  };

  db.sessions.push(session);
  saveServerDB(db);

  logSecurityEventServer({
    userId: user.id,
    username: user.username,
    event: 'LOGIN_SUCESSO',
    severity: 'info',
    metadata: `Autenticação bem-sucedida com perfil ${user.role}.`,
  });

  res.json({ success: true, session });
});

app.post('/api/auth/logout', (req, res) => {
  const { sessionId } = req.body || {};
  if (sessionId) {
    const db = loadServerDB();
    const session = db.sessions.find((s: any) => s.id === sessionId);
    if (session) {
      session.revokedAt = new Date().toISOString();
      saveServerDB(db);
      logSecurityEventServer({
        userId: session.userId,
        username: session.username,
        event: 'LOGOUT',
        severity: 'info',
        metadata: 'Sessão encerrada por logout.',
      });
    }
  }
  res.json({ success: true });
});

app.get('/api/auth/users', (req, res) => {
  const db = loadServerDB();
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
  res.json(safeUsers);
});

app.post('/api/auth/users', (req, res) => {
  const { username, name, email, password, role } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
    return;
  }

  const db = loadServerDB();
  if (db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
    res.status(400).json({ success: false, error: 'Nome de usuário já existe.' });
    return;
  }

  const { salt, hash } = hashPassword(password);
  const newUser: UserAccount = {
    id: 'usr_' + nodeCrypto.randomBytes(4).toString('hex'),
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
  saveServerDB(db);

  logSecurityEventServer({
    username: newUser.username,
    event: 'USUARIO_CRIADO',
    severity: 'info',
    metadata: `Novo usuário ${newUser.username} criado com cargo ${newUser.role}.`,
  });

  res.json({ success: true, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
});

app.patch('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, role, password, toggleLock, status } = req.body || {};
  const db = loadServerDB();
  const user = db.users.find((u: any) => u.id === id);
  if (!user) {
    res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    return;
  }

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
  saveServerDB(db);

  logSecurityEventServer({
    userId: user.id,
    username: user.username,
    event: 'ALTERACAO_DE_SENHA',
    severity: 'info',
    metadata: `Conta de usuário ${user.username} atualizada por administrador.`,
  });

  res.json({ success: true, user });
});

app.delete('/api/auth/users/:id', (req, res) => {
  const { id } = req.params;
  const db = loadServerDB();
  const index = db.users.findIndex((u: any) => u.id === id);
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    return;
  }
  const removed = db.users.splice(index, 1)[0];
  saveServerDB(db);

  logSecurityEventServer({
    username: removed.username,
    event: 'USUARIO_DESATIVADO',
    severity: 'warn',
    metadata: `Usuário ${removed.username} removido do sistema.`,
  });

  res.json({ success: true });
});

app.get('/api/auth/events', (req, res) => {
  const db = loadServerDB();
  res.json(db.events || []);
});

// 7. MIDDLEWARE VITE E INICIALIZAÇÃO DO SERVIDOR
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HUB ESTRATÉGICO DE IAs] Servidor rodando com sucesso na porta ${PORT}`);
  });
}

startServer();
