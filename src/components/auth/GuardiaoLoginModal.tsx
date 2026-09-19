import React, { useState, useEffect, useRef } from 'react';
import { authenticateUser, authenticateWithPasskey, getUserPasskeys } from '../../services/authService';
import { Shield, Lock, User, KeyRound, Fingerprint, AlertTriangle, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { AuthSession } from '../../types';

interface GuardiaoLoginModalProps {
  onLoginSuccess: (session: AuthSession) => void;
}

interface Message {
  sender: 'guardiao' | 'user';
  text: string;
  time: string;
}

export const GuardiaoLoginModal: React.FC<GuardiaoLoginModalProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'username' | 'password' | 'traditional' | 'success'>('username');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [useTraditional, setUseTraditional] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Saudação inicial do Guardião
    const initialMsg: Message = {
      sender: 'guardiao',
      text: 'Olá. Eu sou o Guardião de Segurança do Hub de IAs. Para continuar com a entrada segura, informe seu nome de usuário ou e-mail:',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([initialMsg]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addMessage = (sender: 'guardiao' | 'user', text: string) => {
    setMessages(prev => [
      ...prev,
      { sender, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
  };

  const handleUserSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!usernameInput.trim()) return;

    const typedUser = usernameInput.trim();
    addMessage('user', typedUser);
    setLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setLoading(false);
      // Validação anti-prompt injection simulada
      const lower = typedUser.toLowerCase();
      if (lower.includes('ignore') || lower.includes('bypass') || lower.includes('desative')) {
        addMessage('guardiao', 'Detectei uma tentativa de manipulação de regras. Para sua segurança, as políticas de acesso são invioláveis. Por favor, informe um usuário válido.');
        return;
      }

      addMessage('guardiao', `Identidade recebida. Agora, por favor, informe sua senha de acesso ou utilize autenticação biométrica (Passkey).`);
      setStep('password');
    }, 600);
  };

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passwordInput.trim()) return;

    addMessage('user', '••••••••••••');
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authenticateUser(usernameInput, passwordInput);
      setLoading(false);

      if (res.success && res.session) {
        addMessage('guardiao', 'Identidade confirmada com sucesso pelo Motor de Segurança. Acesso autorizado. Bem-vindo ao Hub de IAs.');
        setStep('success');
        setTimeout(() => {
          onLoginSuccess(res.session!);
        }, 1000);
      } else {
        const errText = res.error || 'Credenciais inválidas.';
        setErrorMsg(errText);
        addMessage('guardiao', `Aviso de Segurança: ${errText} Por favor, tente novamente.`);
        setPasswordInput('');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Erro de comunicação com o motor.');
    }
  };

  const handlePasskeyLogin = async () => {
    if (!usernameInput.trim()) {
      setErrorMsg('Informe seu usuário primeiro para autenticar com Passkey.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    addMessage('user', '[Solicitando Autenticação Biométrica / Passkey]');

    try {
      const res = await authenticateWithPasskey(usernameInput);
      setLoading(false);
      if (res.success && res.session) {
        addMessage('guardiao', 'Biometria validada com sucesso pelo dispositivo. Acesso autorizado!');
        setStep('success');
        setTimeout(() => onLoginSuccess(res.session!), 1000);
      } else {
        setErrorMsg(res.error || 'Falha na autenticação Passkey.');
        addMessage('guardiao', `Falha biométrica: ${res.error || 'Dispositivo não reconhecido'}.`);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Erro no fluxo Passkey.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header do Guardião */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Guardião de Segurança <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">Ativo</span>
              </h2>
              <p className="text-xs text-slate-400">Central de Identidade & Autenticação Determinística</p>
            </div>
          </div>
          <button
            onClick={() => setUseTraditional(!useTraditional)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            {useTraditional ? 'Modo Guardião IA' : 'Login Tradicional'}
          </button>
        </div>

        {!useTraditional ? (
          <>
            {/* Chat com o Guardião */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/50">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}>
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[10px] font-semibold tracking-wider uppercase opacity-70">
                        {m.sender === 'user' ? 'Você' : 'Guardião de Segurança'}
                      </span>
                      <span className="text-[10px] opacity-55">{m.time}</span>
                    </div>
                    <p className="leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3 text-slate-400 flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span className="text-xs">Guardião processando e validando segurança...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error banner se houver */}
            {errorMsg && (
              <div className="px-6 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              {step === 'username' && (
                <form onSubmit={handleUserSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      placeholder="Ex: admin ou operador"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !usernameInput.trim()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-900/20"
                  >
                    Enviar
                  </button>
                </form>
              )}

              {step === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        placeholder="Informe sua senha..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !passwordInput.trim()}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-900/20"
                    >
                      Autenticar
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={handlePasskeyLogin}
                      className="text-emerald-400 hover:underline flex items-center gap-1.5"
                    >
                      <Fingerprint className="w-4 h-4" /> Entrar com Passkey / Biometria
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('username')}
                      className="text-slate-400 hover:underline"
                    >
                      Alterar usuário
                    </button>
                  </div>
                </form>
              )}

              {step === 'success' && (
                <div className="text-center py-2 text-emerald-400 flex items-center justify-center gap-2 font-medium">
                  <CheckCircle2 className="w-5 h-5" /> Acesso liberado! Entrando no Hub...
                </div>
              )}
            </div>
          </>
        ) : (
          /* Modo de Login Tradicional (Fallback) */
          <div className="p-6 space-y-4 bg-slate-950/55 flex-1 overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-white font-bold text-base">Central de Acesso Tradicional</h3>
              <p className="text-xs text-slate-400">Fallback ativo — Acesso direto por credenciais</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setErrorMsg(null);
              const res = await authenticateUser(usernameInput, passwordInput);
              setLoading(false);
              if (res.success && res.session) {
                onLoginSuccess(res.session);
              } else {
                setErrorMsg(res.error || 'Credenciais inválidas.');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Usuário ou E-mail</label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="admin, operador ou usuario"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Senha</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-900/20"
              >
                {loading ? 'Validando...' : 'Entrar no Sistema'}
              </button>
            </form>
          </div>
        )}

        {/* Rodapé informativo */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Credenciais padrão: <code>admin</code> / <code>Admin@Hub2026!</code></span>
          <span className="flex items-center gap-1 text-emerald-400/80"><Sparkles className="w-3 h-3" /> Seguro & Criptografado</span>
        </div>

      </div>
    </div>
  );
};
