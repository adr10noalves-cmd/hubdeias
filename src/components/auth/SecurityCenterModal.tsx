import React, { useState, useEffect } from 'react';
import { UserAccount, SecurityEvent, AuthSession } from '../../types';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  toggleUserLock, 
  getSecurityEvents 
} from '../../services/authService';
import { Shield, Users, Activity, Lock, Unlock, Key, Trash2, Plus, AlertCircle, CheckCircle2, X, Terminal, Server, Edit2 } from 'lucide-react';

interface SecurityCenterModalProps {
  currentUser: AuthSession;
  onClose: () => void;
}

export const SecurityCenterModal: React.FC<SecurityCenterModalProps> = ({ currentUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'status'>('status');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form novo usuário
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'OPERATOR' | 'USER' | 'GUEST'>('USER');

  // Form edição de usuário
  const [editUsername, setEditUsername] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'OPERATOR' | 'USER' | 'GUEST'>('USER');
  const [editPassword, setEditPassword] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'ADMIN';

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const loadedUsers = await getAllUsers();
      setUsers(loadedUsers);
      const loadedEvents = await getSecurityEvents();
      setEvents(loadedEvents);
    } catch (err) {
      console.error('Erro ao carregar dados de segurança:', err);
    }
  };

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('USER');
    setActionError(null);
    setShowNewUserModal(true);
  };

  const handleToggleLock = async (userId: string) => {
    if (!isAdmin) return;
    try {
      const res = await toggleUserLock(userId);
      if (res.success) {
        await loadSecurityData();
        setActionSuccess('Status da conta atualizado com sucesso.');
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setActionError(res.error || 'Erro ao alterar status da conta.');
      }
    } catch (err) {
      console.error('Erro ao alterar status do usuário:', err);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!isAdmin) return;
    if (username === 'admin') {
      setActionError('Não é permitido excluir a conta mestre do administrador.');
      setTimeout(() => setActionError(null), 4000);
      return;
    }
    const confirmed = typeof window !== 'undefined' && window.confirm ? window.confirm(`Tem certeza que deseja excluir o usuário "${username}"?`) : true;
    if (!confirmed) return;

    try {
      const res = await deleteUser(userId, username);
      if (res.success) {
        await loadSecurityData();
        setActionSuccess(`Usuário "${username}" removido com sucesso.`);
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        setActionError(res.error || 'Erro ao excluir usuário.');
      }
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      setActionError('Erro de conexão ao excluir usuário.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !newUsername.trim() || !newPassword.trim() || isSubmitting) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      const res = await createUser({
        username: newUsername.trim(),
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword.trim(),
        role: newRole,
      });

      if (res.success) {
        setShowNewUserModal(false);
        setNewUsername('');
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('USER');
        await loadSecurityData();
        setActionSuccess('Novo usuário cadastrado e salvo com sucesso!');
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        setActionError(res.error || 'Erro ao criar usuário.');
      }
    } catch (err: any) {
      setActionError('Erro de conexão ao criar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (user: UserAccount) => {
    setShowNewUserModal(false);
    setEditingUser(user);
    setEditUsername(user.username || '');
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditRole(user.role || 'USER');
    setEditPassword('');
    setActionError(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editingUser || isSubmitting) return;
    setActionError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
      };
      if (editUsername.trim() && editUsername.trim().toLowerCase() !== editingUser.username.toLowerCase()) {
        payload.username = editUsername.trim();
      }
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await updateUser(editingUser.id, payload);

      if (res.success) {
        setEditingUser(null);
        await loadSecurityData();
        setActionSuccess('Cadastro e credenciais atualizados com sucesso!');
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        setActionError(res.error || 'Erro ao atualizar usuário.');
      }
    } catch (err) {
      setActionError('Erro de conexão ao atualizar usuário.');
    } finally {
      setIsSubmitting(false);
    }
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
              <p className="text-xs text-slate-400">Auditoria, Identidade, Controle de Acesso e Contas Server-Side</p>
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
            <Server className="w-4 h-4" />
            Status do Servidor & Sockets
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'users' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Contas & Permissões ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
              activeTab === 'events' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Logs de Auditoria ({events.length})
          </button>
        </div>

        {/* Global Feedback notification */}
        {actionSuccess && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-6 py-2 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
          
          {/* TAB 1: STATUS DO SISTEMA */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400 font-medium uppercase">Motor de Criptografia</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">PBKDF2 SHA-512</span>
                  </div>
                  <p className="text-sm text-white font-semibold">Salt Individual por Usuário</p>
                  <p className="text-xs text-slate-400 mt-1">Derivação de chave de alta segurança server-side.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400 font-medium uppercase">Sessões & Autoridade</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Server-Side Session</span>
                  </div>
                  <p className="text-sm text-white font-semibold">Isolamento Completo</p>
                  <p className="text-xs text-slate-400 mt-1">Sessões geridas com expiração e revogação no servidor.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-400 font-medium uppercase">Proteção Guardião & IA</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Zero Credenciais na IA</span>
                  </div>
                  <p className="text-sm text-white font-semibold">Isolamento Estrito</p>
                  <p className="text-xs text-slate-400 mt-1">Senhas e hashes nunca passam por modelos externos.</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Sua Sessão Atual
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Usuário</span>
                    <span className="text-white font-bold">{currentUser.username}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Perfil (RBAC)</span>
                    <span className="text-emerald-400 font-bold">{currentUser.role}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">ID da Sessão</span>
                    <span className="text-slate-300 font-mono">{currentUser.id}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                    <span className="text-slate-400 block mb-1">Expiração</span>
                    <span className="text-slate-300">{new Date(currentUser.expiresAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTAS DE USUÁRIO */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Gerenciamento de Contas e Permissões</h3>
                  <p className="text-xs text-slate-400">Controle de acesso baseado em papéis (RBAC) e edição de credenciais</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={handleOpenNewUser}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-900/20"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Usuário
                  </button>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-[11px] text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Usuário</th>
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4">Papel (RBAC)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Último Login</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Ações de Gestão</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 text-white font-medium font-mono">{u.username}</td>
                        <td className="py-3 px-4 text-slate-300">{u.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                            u.role === 'OPERATOR' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Nunca'}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-medium transition inline-flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Editar / Senha
                            </button>
                            {u.username !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleToggleLock(u.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition ${
                                    u.status === 'active' ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  {u.status === 'active' ? 'Bloquear' : 'Desbloquear'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px] font-medium transition inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Excluir
                                </button>
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LOGS DE AUDITORIA */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Registro de Auditoria de Segurança</h3>
                <p className="text-xs text-slate-400">Eventos de autenticação, bloqueios e alterações registrados no servidor</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {events.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">Nenhum evento registrado.</div>
                ) : (
                  events.map(evt => (
                    <div key={evt.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-800/30 transition">
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          evt.severity === 'danger' ? 'bg-rose-500/10 text-rose-400' :
                          evt.severity === 'warn' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {evt.severity === 'danger' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{evt.event}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded font-mono">{evt.username}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">{evt.metadata}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal Novo Usuário */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Cadastrar Novo Usuário
            </h3>

            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nome de Usuário (Login)*</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="ex: analista"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="ex: Ana Souza"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="ex: ana@hubdeias.local"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Senha Inicial*</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••••••"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Perfil (RBAC)</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="USER">Usuário (USER)</option>
                  <option value="OPERATOR">Operador (OPERATOR)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs hover:bg-emerald-500 font-medium transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuário / Redefinir Senha */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-400" />
              Editar Conta: <span className="font-mono text-emerald-400">{editingUser.username}</span>
            </h3>

            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Login (Nome de Usuário)*</label>
                <input
                  type="text"
                  required
                  disabled={isSubmitting || editingUser.username === 'admin'}
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 font-mono disabled:opacity-60"
                  placeholder="ex: analista"
                />
                {editingUser.username === 'admin' && (
                  <span className="text-[10px] text-slate-500 mt-0.5 block">O login da conta mestre admin não pode ser alterado.</span>
                )}
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">E-mail</label>
                <input
                  type="email"
                  disabled={isSubmitting}
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Perfil (RBAC)</label>
                <select
                  disabled={isSubmitting || editingUser.username === 'admin'}
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-60"
                >
                  <option value="USER">Usuário (USER)</option>
                  <option value="OPERATOR">Operador (OPERATOR)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
                {editingUser.username === 'admin' && (
                  <span className="text-[10px] text-slate-500 mt-0.5 block">O papel da conta mestre admin é fixo.</span>
                )}
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nova Senha (Opcional — deixar em branco para manter a atual)</label>
                <input
                  type="password"
                  disabled={isSubmitting}
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  placeholder="Nova senha segura..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs hover:bg-blue-500 font-medium transition shadow-lg shadow-blue-900/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
