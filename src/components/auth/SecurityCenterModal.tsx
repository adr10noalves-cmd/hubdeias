import React, { useState } from 'react';
import { getAllUsers, saveAllUsers, getSecurityEvents } from '../../services/authService';
import { UserAccount, SecurityEvent, AuthSession } from '../../types';
import { Shield, Users, Activity, Lock, Unlock, Key, Trash2, Plus, AlertCircle, CheckCircle2, X, Terminal, Server } from 'lucide-react';

interface SecurityCenterModalProps {
  currentUser: AuthSession;
  onClose: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({ currentUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'status'>('status');
  const [users, setUsers] = useState<UserAccount[]>(getAllUsers());
  const [events, setEvents] = useState<SecurityEvent[]>(getSecurityEvents());
  const [showNewUserModal, setShowNewUserModal] = useState(false);

  // Form novo usuário
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'OPERATOR' | 'USER' | 'GUEST'>('USER');

  const isAdmin = currentUser.role === 'ADMIN';

  const handleToggleLock = (userId: string) => {
    if (!isAdmin) return;
    const updated = users.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'locked' || u.status === 'suspended' ? 'active' : 'locked';
        return { ...u, status: newStatus, failedAttempts: 0, lockedUntil: null };
      }
      return u;
    });
    setUsers(updated);
    saveAllUsers(updated);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newUsername || !newPassword) return;

    // Gerar hash simples
    const msgUint8 = new TextEncoder().encode(newPassword + 'hub-de-ias-salt-2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const passwordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const newUser: UserAccount = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      username: newUsername.trim(),
      name: newName.trim() || newUsername,
      email: newEmail.trim() || `${newUsername}@hubdeias.local`,
      role: newRole,
      status: 'active',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failedAttempts: 0,
    };

    const updated = [...users, newUser];
    setUsers(updated);
    saveAllUsers(updated);
    setShowNewUserModal(false);
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Central de Segurança & Painel do Guardião</h2>
              <p className="text-xs text-slate-400">Auditoria, Identidade, Controle de Acesso e Contas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'status' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Visão Geral & Sessão
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'users' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Gerenciamento de Usuários ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'events' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" /> Logs de Auditoria ({events.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
          
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuário Atual</span>
                  <p className="text-xl font-bold text-white mt-1">{currentUser.username}</p>
                  <span className="inline-block mt-2 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-mono">
                    Cargo: {currentUser.role}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sessão Segura</span>
                  <p className="text-sm font-mono text-emerald-300 mt-2 truncate">ID: {currentUser.id}</p>
                  <p className="text-xs text-slate-400 mt-1">Expira em: {new Date(currentUser.expiresAt).toLocaleTimeString()}</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status do Sistema</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-sm text-emerald-300 font-medium">Motor de Segurança Ativo</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Proteção contra tentativas & Passkeys</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-white font-bold text-sm mb-3">Diretrizes de Segurança Vigentes</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Isolamento estrito entre IA conversacional e motor de segurança determinístico.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Bloqueio progressivo ativado (3 falhas = 5 min, 5 falhas = 30 min).</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Senhas nunca são armazenadas em texto puro nem enviadas para modelos de IA.</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Suporte a Passkey / WebAuthn para autenticação biométrica em dispositivos compatíveis.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-sm">Usuários Cadastrados</h3>
                  <p className="text-xs text-slate-400">Gerencie contas, redefina estados e configure permissões</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setShowNewUserModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" /> Novo Usuário
                  </button>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="p-4">Usuário</th>
                      <th className="p-4">Nome</th>
                      <th className="p-4">Nível</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Falhas</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/50 transition">
                        <td className="p-4 font-mono font-medium text-emerald-400">{u.username}</td>
                        <td className="p-4">{u.name}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                            u.role === 'OPERATOR' ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            u.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{u.failedAttempts}</td>
                        <td className="p-4 text-right">
                          {isAdmin && u.username !== 'admin' && (
                            <button
                              onClick={() => handleToggleLock(u.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                u.status === 'locked' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300'
                              }`}
                            >
                              {u.status === 'locked' ? 'Desbloquear' : 'Bloquear'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-bold text-sm">Registro de Eventos de Segurança (Auditoria)</h3>
                <p className="text-xs text-slate-400">Histórico em tempo real de autenticações, bloqueios e acessos</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden font-mono text-xs">
                <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-800/60">
                  {events.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">Nenhum evento registrado até o momento.</div>
                  ) : (
                    events.map(ev => (
                      <div key={ev.id} className="p-3.5 flex items-start justify-between gap-4 hover:bg-slate-800/40 transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.severity === 'danger' ? 'bg-rose-500/20 text-rose-400' :
                              ev.severity === 'warn' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {ev.event}
                            </span>
                            <span className="text-slate-300 font-semibold">{ev.username}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-sans">{ev.metadata}</p>
                        </div>
                        <div className="text-right shrink-0 text-[10px] text-slate-500">
                          {new Date(ev.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Modal Novo Usuário */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-white font-bold text-base mb-1">Cadastrar Novo Usuário</h3>
            <p className="text-xs text-slate-400 mb-4">Insira as credenciais iniciais para o novo perfil.</p>
            
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome de Usuário</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="ex: ana.silva"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="ex: Ana Silva"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Senha Inicial</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nível de Acesso</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                >
                  <option value="USER">Usuário (USER)</option>
                  <option value="OPERATOR">Operador (OPERATOR)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                  <option value="GUEST">Convidado (GUEST)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition"
                >
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
