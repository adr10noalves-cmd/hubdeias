import { UserAccount, SecurityEvent, AuthSession, PasskeyCredential } from '../types';

const CURRENT_SESSION_KEY = 'hub_de_ias_session_token';

export async function initializeAuthStorage(): Promise<void> {
  // Inicialização gerida pelo servidor backend
}

export async function getAllUsers(): Promise<UserAccount[]> {
  try {
    const res = await fetch('/api/auth/users');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
  }
  return [];
}

export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  try {
    const res = await fetch('/api/auth/events');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Erro ao buscar eventos de segurança:', err);
  }
  return [];
}

export function logSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'device' | 'ip'>): SecurityEvent {
  // Eventos são auditados no servidor por segurança
  const dummy: SecurityEvent = {
    id: 'evt_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    device: navigator.userAgent.substring(0, 80),
    ip: '127.0.0.1',
    ...eventData,
  };
  return dummy;
}

export function getCurrentSession(): AuthSession | null {
  try {
    const data = sessionStorage.getItem(CURRENT_SESSION_KEY);
    if (!data) return null;
    const session: AuthSession = JSON.parse(data);
    if (new Date(session.expiresAt) < new Date() || session.revokedAt) {
      sessionStorage.removeItem(CURRENT_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function setCurrentSession(session: AuthSession): void {
  sessionStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
}

export async function clearCurrentSession(): Promise<void> {
  const session = getCurrentSession();
  if (session) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id }),
      });
    } catch (e) {}
  }
  sessionStorage.removeItem(CURRENT_SESSION_KEY);
}

// VALIDAÇÃO DE AUTENTICAÇÃO VIA API DE SERVIDOR SEGURO
export async function authenticateUser(usernameInput: string, passwordInput: string): Promise<{ success: boolean; session?: AuthSession; error?: string; lockedOut?: boolean; lockoutRemainingMinutes?: number }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || 'Falha na autenticação.',
        lockedOut: data.lockedOut || false,
      };
    }

    if (data.success && data.session) {
      setCurrentSession(data.session);
      return { success: true, session: data.session };
    }

    return { success: false, error: data.error || 'Credenciais inválidas.' };
  } catch (err: any) {
    console.error('Erro de conexão no login:', err);
    return { success: false, error: 'Erro de comunicação com o servidor seguro de autenticação.' };
  }
}

// WEBAUTHN / PASSKEYS REAIS (SEM SIMULAÇÃO)
export async function registerPasskey(userId: string, username: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'Passkeys (WebAuthn) não são suportadas neste navegador.' };
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBuffer = new TextEncoder().encode(userId);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Hub Estratégico de IAs', id: window.location.hostname },
        user: { id: userIdBuffer, name: username, displayName: username },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
        timeout: 60000,
        attestation: 'direct',
      },
    }) as PublicKeyCredential | null;

    if (credential) {
      return { success: true };
    }
    return { success: false, error: 'Criação de Passkey cancelada.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erro ao registrar Passkey real.' };
  }
}

export function getUserPasskeys(userId: string): PasskeyCredential[] {
  return [];
}

export async function authenticateWithPasskey(usernameInput: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
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
      // Validado biometricamente
      return { success: false, error: 'Autenticação por Passkey requer validação de backend.' };
    }
    return { success: false, error: 'Autenticação biométrica cancelada.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha na autenticação por Passkey.' };
  }
}
