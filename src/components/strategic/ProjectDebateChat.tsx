import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, MessageSquare, CheckCircle, ShieldAlert } from 'lucide-react';
import { ProjectHubItem, ProjectMessage, ProjectDecision } from '../../types';

interface ProjectDebateChatProps {
  project: ProjectHubItem;
  messages: ProjectMessage[];
  onSendMessage: (text: string, aiResponseText: string) => void;
  onAddDecision: (decision: ProjectDecision) => void;
}

export const ProjectDebateChat: React.FC<ProjectDebateChatProps> = ({
  project,
  messages,
  onSendMessage,
  onAddDecision,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userText = inputText.trim();
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      let aiReply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('notificação') || lower.includes('notificacoes')) {
        aiReply = `Analisando o projeto **"${project.name}"** (Objetivo: ${project.objective}), a adição de notificações é altamente pertinente para engajar os usuários. Como o status atual é *${project.status}* e a etapa é *"${project.currentStage}"*, sugiro implementarmos via WebSockets ou Firebase Cloud Messaging na próxima versão. Deseja que eu registre uma decisão arquitetural ou crie uma missão para isso?`;
      } else if (lower.includes('banco') || lower.includes('dados') || lower.includes('firebase')) {
        aiReply = `Com base na arquitetura e no objetivo atual de "${project.name}", a persistência em nuvem (como Firestore) garante a integridade dos dados e sincronização em múltiplos dispositivos. Recomendo mantermos a camada de dados isolada em serviços dedicados.`;
      } else if (lower.includes('segurança') || lower.includes('lgpd')) {
        aiReply = `Para garantir conformidade e segurança em "${project.name}", devemos validar os acessos por papéis (RBAC) e criptografia em trânsito. Essa é uma excelente diretriz a ser registrada na seção de Decisões.`;
      } else {
        aiReply = `Compreendi sua questão sobre **"${project.name}"**. Analisando o contexto (Progresso atual: ${project.progress}%, Próxima ação: "${project.nextAction}"), esta alteração trará impacto positivo na eficiência. Recomendo avaliarmos as dependências técnicas antes de iniciar a codificação. Como deseja prosseguir?`;
      }

      onSendMessage(userText, aiReply);
      setIsTyping(false);
    }, 1000);
  };

  const handleRegisterDecisionFromPrompt = (text: string) => {
    const newDecision: ProjectDecision = {
      id: `dec-${Date.now()}`,
      projectId: project.id,
      decision: text.slice(0, 80) + '...',
      reason: 'Definido durante debate com a IA no projeto.',
      date: new Date().toLocaleDateString(),
      responsible: 'Equipe & Hub IA',
      impact: 'Alinhamento arquitetural e técnico.',
      status: 'Ativa',
    };
    onAddDecision(newDecision);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[550px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
              Debate com a IA <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">Contexto Ativo</span>
            </h3>
            <p className="text-slate-400 text-xs">Conversa exclusiva contextualizada sobre "{project.name}"</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Gemini & Groq Engine
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-950/40 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Nenhuma mensagem registrada ainda. Inicie o debate com a IA abaixo.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 border border-slate-700 text-cyan-400'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-xs shadow-lg'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] opacity-75">
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRegisterDecisionFromPrompt(msg.text)}
                        className="hover:underline flex items-center gap-1 text-cyan-300 font-semibold"
                        title="Transformar ponto desta resposta em Decisão"
                      >
                        <CheckCircle className="w-3 h-3" /> Registrar Decisão
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-xs p-4 text-slate-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-2 font-medium text-slate-300">Analisando contexto de {project.name}...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Converse com a IA sobre "${project.name}" (ex: "Quero adicionar notificações")...`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 shrink-0"
        >
          <Send className="w-4 h-4" /> Enviar
        </button>
      </form>
    </div>
  );
};
