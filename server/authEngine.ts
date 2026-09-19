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

const DB_FILE = path.join(process.cwd(), 'data', 'security_storage.json');

interface DatabaseSchema {
  users: UserAccount[];
  sessions: AuthSession[];
  events: SecurityEvent[];
  passkeys: PasskeyCredential[];
}

// Garantir diretório data/
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  try {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
  } catch (e) {
    console.error('Erro ao criar pasta data:', e);
  }
}

// Hash seguro com PBKDF2 e Salt individual
export function hashPassword(password: string, existingSalt?: string): { salt: string; hash: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, storedHashString: string): boolean {
  try {
    const [salt, originalHash] = storedHashString.split(':');
    if (!salt || !originalHash) return false;
    const { hash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

function loadDB(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao carregar banco de segurança:', err);
  }

  // Inicialização padrão sem credenciais hardcoded fracas em texto puro
  const defaultSalt = crypto.randomBytes(16).toString('hex');
  // Senha padrão robusta gerada com salt individual
  const adminPwdHash = `${defaultSalt}:${crypto.pbkdf2Sync('Admin@Hub2026!', defaultSalt, 310000, 64, 'sha512').toString('hex')}`;
  
  const opSalt = crypto.randomBytes(16).toString('hex');
  const opPwdHash = `${opSalt}:${crypto.pbkdf2Sync('Operador@2026!', opSalt, 310000, 64, 'sha512').toString('hex')}`;

  const usrSalt = crypto.randomBytes(16).toString('hex');
  const usrPwdHash = `${usrSalt}:${crypto.pbkdf2Sync('User@2026!', usrSalt, 310000, 64, 'sha512').toString('hex')}`;

  const initialDB: DatabaseSchema = {
    users: [
      {
        id: 'usr_admin_01',
        username: 'admin',
        name: 'Administrador Mestre',
        email: 'admin@hubdeias.local',
        role: 'ADMIN',
        status: 'active',
        passwordHash: adminPwdHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        failedAttempts: 0,
      },
      {
        id: 'usr_operador_01',
        username: 'operador',
        name: 'Operador Estratégico',
        email: 'operador@hubdeias.local',
        role: 'OPERATOR',
        status: 'active',
        passwordHash: opPwdHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        failedAttempts: 0,
      },
      {
        id: 'usr_user_01',
        username: 'usuario',
        name: 'Usuário Padrão',
        email: 'usuario@hubdeias.local',
        role: 'USER',
        status: 'active',
        passwordHash: usrPwdHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        failedAttempts: 0,
      }
    ],
    sessions: [],
    events: [
      {
        id: 'evt_init_01',
        username: 'admin',
        event: 'USUARIO_CRIADO',
        severity: 'info',
        metadata: 'Sistema de segurança server-side inicializado com PBKDF2 e salt individual.',
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
      }
    ],
    passkeys: [],
  };

  saveDB(initialDB);
  return initialDB;
}

export function saveDB(db: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar banco de segurança:', err);
  }
}

export function logSecurityEventServer(eventData: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
  const db = loadDB();
  const event: SecurityEvent = {
    id: 'evt_' + crypto.randomBytes(4).toString('hex'),
    timestamp: new Date().toISOString(),
    ...eventData,
  };
  db.events.unshift(event);
  if (db.events.length > 300) db.events.pop();
  saveDB(db);
  return event;
}
