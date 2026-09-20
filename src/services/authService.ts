import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserAccount, SecurityEvent, AuthSession, PasskeyCredential, UserRole } from '../types';

const CURRENT_SESSION_KEY = 'hub_de_ias_session_token';
const USERS_CACHE_KEY = 'hub_de_ias_users_cache_v3';
const EVENTS_CACHE_KEY = 'hub_de_ias_events_cache_v3';

// ============================================================================
// HASHING NATIVO E SEGURO (WEB CRYPTO API PBKDF2 COM SHA-512)
// Compatível 100% com navegadores modernos e Vercel Serverless
// ============================================================================

export async function hashPasswordClient(password: string, existingSalt?: string): Promise<{ salt: string; hash: string }> {
  const enc = new TextEncoder();
  const salt = existingSalt || Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const saltBuffer = enc.encode(salt);
  const passBuffer = enc.encode(password);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-512',
    },
    keyMaterial,
    512
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return { salt, hash };
}

export async function verifyPasswordClient(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !password) return false;

  // Suporte a senhas default durante primeiro acesso
  if (storedHash === 'Admin@Hub2026!' && password === 'Admin@Hub2026!') return true;
  if (storedHash === 'Operador@2026!' && password === 'Operador@2026!') return true;
  if (storedHash === 'User@2026!' && password === 'User@2026!') return true;

  // Formato seguro: salt:hash
  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const computed = await hashPasswordClient(password, salt);
    return computed.hash === hash;
  }

  // Fallback para hashes legados
  return storedHash === password;
}

// ============================================================================
// CONTAS PADRÃO DO SISTEMA (SEED INICIAL)
// ============================================================================

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr_admin_master',
    username: 'admin',
    name: 'Administrador Supremo',
    email: 'admin@hubdeias.com.br',
    role: 'ADMIN',
    status: 'active',
    passwordHash: 'Admin@Hub2026!',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    failedAttempts: 0,
  },
  {
    id: 'usr_operador_default',
    username: 'operador',
    name: 'Operador de Estratégias',
    email: 'operador@hubdeias.com.br',
    role: 'OPERATOR',
    status: 'active',
    passwordHash: 'Operador@2026!',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    failedAttempts: 0,
  },
  {
    id: 'usr_usuario_default',
    username: 'usuario',
    name: 'Pesquisador Geral',
    email: 'usuario@hubdeias.com.br',
    role: 'USER',
    status: 'active',
    passwordHash: 'User@2026!',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
    failedAttempts: 0,
  },
];

// Helper para cache local imediato
function getCachedUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_USERS;
}

function setCachedUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
  } catch {}
}

// ============================================================================
// CARREGAR E SINCRONIZAR USUÁRIOS
// ============================================================================

export async function getAllUsers(): Promise<UserAccount[]> {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);

    if (!snapshot.empty) {
      const firestoreUsers: UserAccount[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data() as UserAccount;
        return { ...d, id: docSnap.id };
      });
      setCachedUsers(firestoreUsers);
      return firestoreUsers;
    }

    // Se estiver vazio no Firestore, inicializa com as contas padrão protegidas
    console.log('[Auth] Inicializando contas padrão no Firestore...');
    for (const u of DEFAULT_USERS) {
      const { salt, hash } = await hashPasswordClient(u.passwordHash);
      const userToSave: UserAccount = {
        ...u,
        passwordHash: `${salt}:${hash}`,
      };
      await setDoc(doc(db, 'users', u.id), userToSave);
    }

    setCachedUsers(DEFAULT_USERS);
    return DEFAULT_USERS;
  } catch (err) {
    console.warn('[Auth] Erro ao buscar usuários no Firestore, usando cache local:', err);
    return getCachedUsers();
  }
}

// ============================================================================
// CRIAR NOVO USUÁRIO (PERSISTÊNCIA DEFINITIVA NO FIRESTORE + CACHE)
// ============================================================================

export async function createUser(data: {
  username: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const username = data.username.trim();
    const name = data.name.trim();
    const email = data.email.trim();
    const password = data.password.trim();
    const role = data.role || 'USER';

    if (!username || username.length < 3) {
      return { success: false, error: 'O identificador de usuário deve ter no mínimo 3 caracteres.' };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return { success: false, error: 'O login deve conter apenas letras, números, ponto, hífen ou underline.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' };
    }

    // Carregar usuários atuais para validação de duplicidade
    const currentUsers = await getAllUsers();
    const exists = currentUsers.some((u) => u.username.toLowerCase() === username.toLowerCase());
    if (exists) {
      return { success: false, error: `O nome de usuário "${username}" já está em uso.` };
    }

    // Gerar hash seguro PBKDF2
    const { salt, hash } = await hashPasswordClient(password);
    const userId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const newUser: UserAccount = {
      id: userId,
      username,
      name: name || username,
      email: email || '',
      role,
      status: 'active',
      passwordHash: `${salt}:${hash}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failedAttempts: 0,
      lockedUntil: null,
    };

    // 1. Salvar no Firestore
    await setDoc(doc(db, 'users', userId), newUser);

    // 2. Atualizar cache local
    const updatedUsers = [newUser, ...currentUsers.filter((u) => u.id !== userId)];
    setCachedUsers(updatedUsers);

    // 3. Registrar auditoria de segurança
    await logSecurityEvent({
      userId,
      username,
      event: 'USUARIO_CRIADO',
      severity: 'info',
      metadata: `Novo usuário criado com perfil ${role}`,
    });

    // 4. Notificar servidor Express se estiver disponível (opcional)
    try {
      fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    } catch {}

    return { success: true, user: newUser };
  } catch (err: any) {
    console.error('[Auth] Erro ao cadastrar usuário:', err);
    return { success: false, error: err?.message || 'Falha ao salvar o novo usuário.' };
  }
}

// ============================================================================
// EDITAR USUÁRIO EXISTENTE (PERSISTÊNCIA DEFINITIVA NO FIRESTORE + CACHE)
// ============================================================================

export async function updateUser(
  userId: string,
  updates: {
    username?: string;
    name?: string;
    email?: string;
    role?: UserRole;
    password?: string;
  }
): Promise<{ success: boolean; user?: UserAccount; error?: string }> {
  try {
    const currentUsers = await getAllUsers();
    const existingIndex = currentUsers.findIndex((u) => u.id === userId);

    if (existingIndex === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const targetUser = currentUsers[existingIndex];

    // Proteção de segurança: Não permitir rebaixar ou renomear o admin supremo
    if (targetUser.username === 'admin') {
      if (updates.username && updates.username.toLowerCase() !== 'admin') {
        return { success: false, error: 'Não é permitido alterar o identificador da conta mestre "admin".' };
      }
      if (updates.role && updates.role !== 'ADMIN') {
        return { success: false, error: 'A conta mestre "admin" não pode ter seu nível de privilégio alterado.' };
      }
    }

    // Validação de duplicidade se o username mudou
    if (updates.username && updates.username.trim().toLowerCase() !== targetUser.username.toLowerCase()) {
      const cleanUsername = updates.username.trim();
      if (cleanUsername.length < 3) {
        return { success: false, error: 'O identificador deve ter pelo menos 3 caracteres.' };
      }
      const duplicate = currentUsers.some(
        (u) => u.id !== userId && u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (duplicate) {
        return { success: false, error: `O nome de usuário "${cleanUsername}" já está em uso.` };
      }
    }

    // Montar objeto atualizado
    const updatedUser: UserAccount = {
      ...targetUser,
      updatedAt: new Date().toISOString(),
    };

    if (updates.username && updates.username.trim()) {
      updatedUser.username = updates.username.trim();
    }
    if (updates.name !== undefined) {
      updatedUser.name = updates.name.trim();
    }
    if (updates.email !== undefined) {
      updatedUser.email = updates.email.trim();
    }
    if (updates.role) {
      updatedUser.role = updates.role;
    }

    // Se uma nova senha foi informada, gerar novo salt e hash seguro
    if (updates.password && updates.password.trim()) {
      const pass = updates.password.trim();
      if (pass.length < 6) {
        return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
      }
      const { salt, hash } = await hashPasswordClient(pass);
      updatedUser.passwordHash = `${salt}:${hash}`;
      updatedUser.failedAttempts = 0;
      updatedUser.lockedUntil = null;
    }

    // 1. Gravar no Firestore
    await setDoc(doc(db, 'users', userId), updatedUser, { merge: true });

    // 2. Atualizar cache
    currentUsers[existingIndex] = updatedUser;
    setCachedUsers(currentUsers);

    // 3. Registrar auditoria
    await logSecurityEvent({
      userId,
      username: updatedUser.username,
      event: updates.password ? 'ALTERACAO_DE_SENHA' : 'ACESSO_ADMINISTRATIVO',
      severity: 'info',
      metadata: `Cadastro do usuário ${updatedUser.username} atualizado com sucesso`,
    });

    // 4. Notificar servidor Express se disponível
    try {
      fetch(`/api/auth/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch(() => {});
    } catch {}

    return { success: true, user: updatedUser };
  } catch (err: any) {
    console.error('[Auth] Erro ao atualizar usuário:', err);
    return { success: false, error: err?.message || 'Falha ao atualizar o cadastro do usuário.' };
  }
}

// ============================================================================
// EXCLUIR USUÁRIO
// ============================================================================

export async function deleteUser(userId: string, username: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (username === 'admin') {
      return { success: false, error: 'Não é permitido excluir o usuário mestre do administrador.' };
    }

    // 1. Remover do Firestore
    await deleteDoc(doc(db, 'users', userId));

    // 2. Atualizar cache local
    const currentUsers = await getAllUsers();
    const filtered = currentUsers.filter((u) => u.id !== userId);
    setCachedUsers(filtered);

    // 3. Registrar auditoria
    await logSecurityEvent({
      userId,
      username,
      event: 'USUARIO_DESATIVADO',
      severity: 'warn',
      metadata: `Usuário ${username} removido permanentemente`,
    });

    // 4. Notificar backend se disponível
    try {
      fetch(`/api/auth/users/${userId}`, { method: 'DELETE' }).catch(() => {});
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error('[Auth] Erro ao excluir usuário:', err);
    return { success: false, error: err?.message || 'Erro ao remover usuário.' };
  }
}

// ============================================================================
// BLOQUEAR / DESBLOQUEAR USUÁRIO
// ============================================================================

export async function toggleUserLock(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUsers = await getAllUsers();
    const user = currentUsers.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'Usuário não encontrado.' };

    if (user.username === 'admin') {
      return { success: false, error: 'Não é permitido bloquear a conta do administrador mestre.' };
    }

    const newStatus = user.status === 'locked' ? 'active' : 'locked';
    const updatedUser: UserAccount = {
      ...user,
      status: newStatus,
      lockedUntil: newStatus === 'locked' ? new Date(Date.now() + 86400000 * 365).toISOString() : null,
      failedAttempts: 0,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', userId), updatedUser, { merge: true });

    const updatedList = currentUsers.map((u) => (u.id === userId ? updatedUser : u));
    setCachedUsers(updatedList);

    await logSecurityEvent({
      userId,
      username: user.username,
      event: newStatus === 'locked' ? 'CONTA_BLOQUEADA' : 'CONTA_DESBLOQUEADA',
      severity: newStatus === 'locked' ? 'danger' : 'info',
      metadata: `Status alterado para ${newStatus}`,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[Auth] Erro ao alterar status:', err);
    return { success: false, error: err?.message || 'Falha ao alternar bloqueio.' };
  }
}

// ============================================================================
// AUDITORIA E LOGS DE SEGURANÇA
// ============================================================================

export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  try {
    const eventsCol = collection(db, 'security_events');
    const q = query(eventsCol, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const events: SecurityEvent[] = snapshot.docs.map((d) => ({
        ...(d.data() as SecurityEvent),
        id: d.id,
      }));
      localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(events));
      return events;
    }
  } catch (err) {
    console.warn('[Auth] Falha ao ler eventos do Firestore, usando cache:', err);
  }

  try {
    const raw = localStorage.getItem(EVENTS_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return [];
}

export async function logSecurityEvent(
  eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'device' | 'ip'>
): Promise<SecurityEvent> {
  const newEvent: SecurityEvent = {
    id: 'evt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    device: navigator.userAgent.substring(0, 100),
    ip: 'client-direct',
    ...eventData,
  };

  try {
    await setDoc(doc(db, 'security_events', newEvent.id), newEvent);
  } catch (e) {
    // Cache local em caso de erro de rede
    try {
      const current = JSON.parse(localStorage.getItem(EVENTS_CACHE_KEY) || '[]');
      localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify([newEvent, ...current].slice(0, 50)));
    } catch {}
  }

  return newEvent;
}

// ============================================================================
// SESSÃO DE USUÁRIO ATUAL (LOCALSTORAGE / SESSIONSTORAGE)
// ============================================================================

export function getCurrentSession(): AuthSession | null {
  try {
    const data = sessionStorage.getItem(CURRENT_SESSION_KEY) || localStorage.getItem(CURRENT_SESSION_KEY);
    if (!data) return null;
    const session: AuthSession = JSON.parse(data);
    if (new Date(session.expiresAt) < new Date() || session.revokedAt) {
      sessionStorage.removeItem(CURRENT_SESSION_KEY);
      localStorage.removeItem(CURRENT_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setCurrentSession(session: AuthSession): void {
  const serialized = JSON.stringify(session);
  sessionStorage.setItem(CURRENT_SESSION_KEY, serialized);
  localStorage.setItem(CURRENT_SESSION_KEY, serialized);
}

export async function clearCurrentSession(): Promise<void> {
  const session = getCurrentSession();
  if (session) {
    await logSecurityEvent({
      userId: session.userId,
      username: session.username,
      event: 'LOGOUT',
      severity: 'info',
      metadata: 'Sessão encerrada pelo usuário',
    });
  }
  sessionStorage.removeItem(CURRENT_SESSION_KEY);
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

// ============================================================================
// AUTENTICAÇÃO DO USUÁRIO (LOGIN COM GUARDIÃO)
// ============================================================================

export async function authenticateUser(
  usernameInput: string,
  passwordInput: string
): Promise<{
  success: boolean;
  session?: AuthSession;
  error?: string;
  lockedOut?: boolean;
  lockoutRemainingMinutes?: number;
}> {
  const cleanUsername = usernameInput.trim();
  const cleanPassword = passwordInput.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, error: 'Informe usuário e senha.' };
  }

  try {
    // 1. Carregar usuários (Firestore + Cache)
    const users = await getAllUsers();
    const user = users.find((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());

    if (!user) {
      await logSecurityEvent({
        username: cleanUsername,
        event: 'LOGIN_FALHA',
        severity: 'warn',
        metadata: 'Tentativa com usuário inexistente',
      });
      return { success: false, error: 'Identificador ou senha incorretos.' };
    }

    // 2. Verificar bloqueio por tentativas ou administrativo
    if (user.status === 'locked' || user.status === 'suspended') {
      if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
        const remainingMin = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
        return {
          success: false,
          error: `Conta bloqueada por segurança. Tente novamente em ${remainingMin} minuto(s).`,
          lockedOut: true,
          lockoutRemainingMinutes: remainingMin,
        };
      } else if (!user.lockedUntil) {
        return {
          success: false,
          error: 'Esta conta foi bloqueada por um administrador. Contate a equipe.',
          lockedOut: true,
        };
      }
    }

    // 3. Validar senha com PBKDF2 ou semente
    const passwordMatch = await verifyPasswordClient(cleanPassword, user.passwordHash);

    if (!passwordMatch) {
      const attempts = (user.failedAttempts || 0) + 1;
      const willLock = attempts >= 5 && user.username !== 'admin';

      const updatedUser: UserAccount = {
        ...user,
        failedAttempts: attempts,
        status: willLock ? 'locked' : user.status,
        lockedUntil: willLock ? new Date(Date.now() + 15 * 60000).toISOString() : null,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
      const updatedList = users.map((u) => (u.id === user.id ? updatedUser : u));
      setCachedUsers(updatedList);

      await logSecurityEvent({
        userId: user.id,
        username: user.username,
        event: willLock ? 'CONTA_BLOQUEADA' : 'LOGIN_FALHA',
        severity: willLock ? 'danger' : 'warn',
        metadata: willLock ? 'Bloqueio automático após 5 tentativas' : `Tentativa incorreta (${attempts}/5)`,
      });

      if (willLock) {
        return {
          success: false,
          error: 'Limite de 5 tentativas excedido. Conta bloqueada por 15 minutos.',
          lockedOut: true,
          lockoutRemainingMinutes: 15,
        };
      }

      return {
        success: false,
        error: `Senha incorreta. Restam ${5 - attempts} tentativa(s).`,
      };
    }

    // 4. Sucesso! Resetar tentativas e atualizar último login
    const updatedUser: UserAccount = {
      ...user,
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
    const updatedList = users.map((u) => (u.id === user.id ? updatedUser : u));
    setCachedUsers(updatedList);

    const session: AuthSession = {
      id: 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8),
      userId: user.id,
      username: user.username,
      role: user.role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 8 * 3600000).toISOString(), // 8 horas
      device: navigator.userAgent.substring(0, 80),
    };

    setCurrentSession(session);

    await logSecurityEvent({
      userId: user.id,
      username: user.username,
      event: 'LOGIN_SUCESSO',
      severity: 'info',
      metadata: `Login autorizado com perfil ${user.role}`,
    });

    return { success: true, session };
  } catch (err: any) {
    console.error('[Auth] Erro durante autenticação:', err);
    return { success: false, error: 'Erro de processamento na autenticação. Tente novamente.' };
  }
}

// ============================================================================
// SUPORTE A PASSKEYS (WEBAUTHN)
// ============================================================================

export async function registerPasskey(userId: string, username: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'Passkeys (WebAuthn) não são suportadas neste navegador.' };
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBuffer = new TextEncoder().encode(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Hub Estratégico de IAs', id: window.location.hostname },
        user: { id: userIdBuffer, name: username, displayName: username },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        timeout: 60000,
        attestation: 'direct',
      },
    })) as PublicKeyCredential | null;

    if (credential) {
      return { success: true };
    }
    return { success: false, error: 'Criação de Passkey cancelada.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao registrar Passkey.' };
  }
}

export function getUserPasskeys(userId: string): PasskeyCredential[] {
  return [];
}

export async function authenticateWithPasskey(
  usernameInput: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'Passkeys não suportadas.' };
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        rpId: window.location.hostname,
        userVerification: 'required',
      },
    });

    if (assertion) {
      return { success: false, error: 'Autenticação por Passkey requer validação.' };
    }
    return { success: false, error: 'Autenticação cancelada.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha na autenticação por Passkey.' };
  }
}
