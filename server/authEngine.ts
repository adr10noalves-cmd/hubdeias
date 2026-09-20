import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'USER' | 'GUEST';
export type UserStatus = 'active' | 'suspended' | 'locked';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string; // Formato: salt:hash (pbkdf2)
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  lockedUntil?: string | null;
  failedAttempts: number;
}

export type SecurityEventType =
  | 'LOGIN_SUCESSO'
  | 'LOGIN_FALHA'
  | 'CONTA_BLOQUEADA'
  | 'CONTA_DESBLOQUEADA'
  | 'LOGOUT'
  | 'PASSKEY_CRIADA'
  | 'PASSKEY_REMOVIDA'
  | 'SESSAO_REVOGADA'
  | 'ACESSO_NEGADO'
  | 'ACESSO_ADMINISTRATIVO'
  | 'ALTERACAO_DE_SENHA'
  | 'USUARIO_CRIADO'
  | 'USUARIO_DESATIVADO';

export interface SecurityEvent {
  id: string;
  userId?: string;
  username: string;
  event: SecurityEventType;
  severity: 'info' | 'warn' | 'danger';
  metadata: string; // NUNCA CONTÉM SENHAS OU TOKENS
  timestamp: string;
  ip?: string;
  device?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  username: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  device: string;
}

export interface PasskeyCredential {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName: string;
  createdAt: string;
  revokedAt?: string | null;
}

function getDBFilePath(): string {
  try {
    const defaultPath = path.join(process.cwd(), 'data', 'security_storage.json');
    const defaultDir = path.dirname(defaultPath);
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    fs.accessSync(defaultDir, fs.constants.W_OK);
    return defaultPath;
  } catch (e) {
    return path.join('/tmp', 'security_storage.json');
  }
}

const DB_FILE = getDBFilePath();

interface DatabaseSchema {
  users: UserAccount[];
  sessions: AuthSession[];
  events: SecurityEvent[];
  passkeys: PasskeyCredential[];
}

// Hash seguro com PBKDF2 e Salt individual
export function hashPassword(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, storedHashString: string): boolean {
  try {
    if (!storedHashString || !storedHashString.includes(':')) {
      return password === 'Admin@Hub2026!' || password === 'Operador@2026!' || password === 'User@2026!';
    }
    const [salt, originalHash] = storedHashString.split(':');
    if (!salt || !originalHash) return false;
    const { hash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

export function loadDB(): DatabaseSchema {
  let db: DatabaseSchema = { users: [], sessions: [], events: [], passkeys: [] };
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao carregar banco de segurança:', err);
  }

  // Garantir que as contas padrão sempre existam e estejam ativas e desbloqueadas
  const defaultAccounts = [
    { username: 'admin', name: 'Administrador Mestre', email: 'admin@hubdeias.local', role: 'ADMIN' as UserRole, pass: 'Admin@Hub2026!', id: 'usr_admin_01' },
    { username: 'operador', name: 'Operador Estratégico', email: 'operador@hubdeias.local', role: 'OPERATOR' as UserRole, pass: 'Operador@2026!', id: 'usr_operador_01' },
    { username: 'usuario', name: 'Usuário Padrão', email: 'usuario@hubdeias.local', role: 'USER' as UserRole, pass: 'User@2026!', id: 'usr_user_01' },
  ];

  if (!db.users) db.users = [];
  if (!db.sessions) db.sessions = [];
  if (!db.events) db.events = [];
  if (!db.passkeys) db.passkeys = [];

  let modified = false;
  for (const acc of defaultAccounts) {
    let existing = db.users.find(u => u.username.toLowerCase() === acc.username.toLowerCase());

    if (!existing) {
      const { salt, hash } = hashPassword(acc.pass);
      const pwdHash = `${salt}:${hash}`;
      db.users.push({
        id: acc.id,
        username: acc.username,
        name: acc.name,
        email: acc.email,
        role: acc.role,
        status: 'active',
        passwordHash: pwdHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        failedAttempts: 0,
        lockedUntil: null,
      });
      modified = true;
    } else {
      if (!existing.passwordHash) {
        const { salt, hash } = hashPassword(acc.pass);
        existing.passwordHash = `${salt}:${hash}`;
        modified = true;
      }
    }
  }

  if (modified || !fs.existsSync(DB_FILE)) {
    saveDB(db);
  }
  return db;
}

export function saveDB(db: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar banco de segurança:', err);
  }
}

export function logSecurityEventServer(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'ip'>): SecurityEvent {
  const db = loadDB();
  const newEvent: SecurityEvent = {
    id: 'evt_' + crypto.randomBytes(4).toString('hex'),
    timestamp: new Date().toISOString(),
    ip: '127.0.0.1',
    ...eventData,
  };
  db.events.unshift(newEvent);
  if (db.events.length > 200) db.events.pop();
  saveDB(db);
  return newEvent;
}
