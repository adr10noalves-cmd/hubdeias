import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, Sparkles, Send, Bot, User, BookOpen, CheckCircle, HelpCircle, Layers } from 'lucide-react';

interface TutorMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
  mode?: string;
}

const INITIAL_MESSAGES: TutorMessage[] = [
  {
    id: 'tutor-1',
    sender: 'tutor',
    text: 'Olá! Sou o **Receptor Mestre**, seu agente pedagógico exclusivo potencializado pelo poder máximo do Gemini. Estou aqui para transformar qualquer complexidade em aprendizado claro, profundo e estruturado. Qual tema, tecnologia ou conceito você deseja dominar hoje?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    mode: 'Masterclass',
  },
];

export const MasterTutorView: React.FC = () => {
  const [messages, setMessages] = useState<TutorMessage[]>(() => {
    try {
      const raw = localStorage.getItem('hub_receptor_mestre_sessions_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_MESSAGES;
  });
  const [inputMessage, setInputMessage] = useState('');
  const [studyMode, setStudyMode] = useState<'Masterclass' | 'Plano de Estudos' | 'Quiz Interativo' | 'Resumo Prático'>('Masterclass');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isThinking) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const userMsg: TutorMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: studyMode,
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsThinking(true);

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'GEMINI',
          modelId: 'gemini-2.5-pro',
          systemPrompt: `Você é o Receptor Mestre, o agente pedagógico mais avançado do Hub, potencializado pelo motor máximo da Gemini. O usuário está estudando no modo "${studyMode}". Forneça uma resposta rica, profunda, estruturada em Markdown, didática e completa, explicando conceitos fundamentais e práticos. Retorne um JSON estrito com o campo "response".`,
          userPrompt: userText,
          complexityLevel: 5,
          activeMode: 'MASTER_TUTOR',
        }),
      });

      const data = await res.json();
      let tutorReply = '';
      if (data.success && data.data) {
        tutorReply = data.data.response || data.data.text || JSON.stringify(data.data);
      } else {
        tutorReply = `Erro na resposta do Receptor Mestre: ${data.error || 'Falha de conexão'}. Verifique se a GEMINI_API_KEY está configurada no ambiente.`;
      }

      const tutorMsg: TutorMessage = {
        id: `msg-${Date.now()}-t`,
        sender: 'tutor',
        text: tutorReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: studyMode,
      };

      const finalMsgs = [...updated, tutorMsg];
      setMessages(finalMsgs);
      try {
        localStorage.setItem('hub_receptor_mestre_sessions_v1', JSON.stringify(finalMsgs));
      } catch {}
    } catch (err: any) {
      const errorMsg: TutorMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'tutor',
        text: `Erro de comunicação com o motor Gemini: ${err?.message || 'Erro desconhecido'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: studyMode,
      };
      setMessages([...updated, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem('hub_receptor_mestre_sessions_v1');
    } catch {}
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 shrink-0">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-900 text-cyan-300 border border-cyan-700 uppercase tracking-widest">
                  Agente de Ensino Avançado (Gemini 2.5 Pro)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Receptor Mestre</h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Seu tutor de inteligência artificial dedicado ao aprendizado profundo. Utiliza o motor real da Gemini para masterclasses, planos de estudo, quizzes e explicações passo a passo.
              </p>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-all shrink-0 self-start md:self-center"
          >
            Reiniciar Sessão de Estudo
          </button>
        </div>
      </div>

      {/* Study Mode Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['Masterclass', 'Plano de Estudos', 'Quiz Interativo', 'Resumo Prático'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setStudyMode(mode)}
            className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              studyMode === mode
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {mode === 'Masterclass' && <Sparkles className="w-4 h-4" />}
            {mode === 'Plano de Estudos' && <BookOpen className="w-4 h-4" />}
            {mode === 'Quiz Interativo' && <HelpCircle className="w-4 h-4" />}
            {mode === 'Resumo Prático' && <Layers className="w-4 h-4" />}
            <span>{mode}</span>
          </button>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[550px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Modo Ativo: <strong className="text-cyan-300">{studyMode}</strong> (Motor Gemini 2.5 Pro)</span>
          </div>
          <div className="text-xs text-slate-400">
            {messages.length} mensagens na sessão
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/50 scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-cyan-400'
                }`}
              >
                {m.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-xs shadow-lg'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 border-b border-white/10 pb-1 mb-1">
                  <span className="font-bold">{m.sender === 'user' ? 'Você' : 'Receptor Mestre'}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-xs p-4 text-slate-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-medium text-slate-300">Gemini 2.5 Pro estruturando explicação pedagógica...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Pergunte ao Receptor Mestre (${studyMode})...`}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isThinking}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Perguntar
          </button>
        </form>
      </div>
    </div>
  );
};
