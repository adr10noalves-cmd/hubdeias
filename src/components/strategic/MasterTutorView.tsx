import React, { useState, useRef, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  Send,
  Bot,
  User,
  BookOpen,
  HelpCircle,
  Layers,
  Terminal,
  Code2,
  Lightbulb,
  FolderGit2,
  CheckCircle2,
  Compass,
  Cpu,
  Brain,
  FileText,
  Workflow
} from 'lucide-react';
import { IdeaItem } from '../../types';
import { saveIdeaToFirestore } from '../../services/strategicMemoryService';

interface MasterMessage {
  id: string;
  sender: 'user' | 'master';
  text: string;
  timestamp: string;
  mode?: string;
  actionExecuted?: string;
}

const INITIAL_MESSAGES: MasterMessage[] = [
  {
    id: 'master-init',
    sender: 'master',
    text: 'Olá! Sou o **Mestre Universal**, a camada central de inteligência e orquestração do Hub.\n\nPosso conversar livremente sobre **qualquer assunto** (tecnologia, programação, ciência, filosofia, negócios, arquitetura, escrita ou ideias cotidianas), auxiliar no planejamento de projetos, gerar códigos e artefatos, ou utilizar as ferramentas do Hub (como salvar ideias e estruturar missões).\n\nComo posso ajudar você hoje?',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    mode: 'Universal (Geral)',
  },
];

export const MasterTutorView: React.FC = () => {
  const [messages, setMessages] = useState<MasterMessage[]>(() => {
    try {
      const raw = localStorage.getItem('hub_universal_master_sessions_v2');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_MESSAGES;
  });
  const [inputMessage, setInputMessage] = useState('');
  const [activeMode, setActiveMode] = useState<
    'Universal (Geral)' | 'Programador' | 'Arquiteto' | 'Pesquisador' | 'Professor' | 'Estrategista' | 'Criador'
  >('Universal (Geral)');
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

    const userMsg: MasterMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: activeMode,
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setIsThinking(true);

    let actionNotice = '';

    try {
      // Intention & Action Detection (e.g. Save Idea)
      const lower = userText.toLowerCase();
      if (lower.includes('guarde essa ideia') || lower.includes('salve essa ideia') || lower.includes('salve esta ideia') || lower.includes('guarde esta ideia')) {
        const titleMatch = userText.match(/"([^"]+)"/) || userText.match(/'([^']+)'/);
        const title = titleMatch ? titleMatch[1] : userText.slice(0, 40) + '...';
        const newIdea: IdeaItem = {
          id: `idea-${Date.now()}`,
          title: title.trim(),
          description: userText,
          category: 'Software',
          objective: 'Desenvolver e validar nova ideia registrada pelo Mestre',
          problemSolved: 'Otimização e inovação no escopo estratégico',
          targetAudience: 'Geral',
          stage: '1. Ideia',
          priority: 'Alta',
          status: 'Ativa',
          relatedTechnologies: [],
          relatedIANames: [],
          currentVersion: 'V1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveIdeaToFirestore(newIdea);
        actionNotice = `💡 **[Ação Automática Realizada]**: Ideia "${title}" salva com sucesso na Central de Ideias do Hub!`;
      }

      const systemPrompt = `Você é o Mestre Universal, a camada suprema de inteligência, orquestração e raciocínio do Hub Estratégico.
Modo de Atuação atual: "${activeMode}".
Diretrizes fundamentais:
1. Você é uma IA generalista de alto nível. Você pode conversar fluidamente e com profundidade sobre programação, tecnologia, ciência, filosofia, negócios, criatividade, escrita, estratégia, arquitetura ou qualquer outro tema.
2. Não fique preso a menus operacionais nem dê respostas robóticas como "Selecione uma opção". Responda de forma natural, inteligente, rica e estruturada em Markdown.
3. Se o usuário pedir para criar código, HTML, arquitetura, planejamento ou análises, forneça o material completo e refinado.
4. Se o usuário mencionar salvar ideias ou ações do Hub, execute-as e confirme.
Retorne obrigatoriamente um objeto JSON estrito contendo a chave "response" com o texto da resposta.`;

      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'GEMINI',
          modelId: 'gemini-3.8-flash',
          systemPrompt,
          userPrompt: userText,
          complexityLevel: 5,
          activeMode: 'UNIVERSAL_MASTER',
        }),
      });

      let masterReply = '';
      try {
        const rawText = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(rawText);
        } catch {
          data = { success: true, data: { response: rawText } };
        }

        if (data.success && (data.data || data.text)) {
          if (typeof data.data === 'string') {
            masterReply = data.data;
          } else if (data.data?.response) {
            masterReply = data.data.response;
          } else if (data.text) {
            masterReply = data.text;
          } else if (data.data?.text) {
            masterReply = data.data.text;
          } else if (data.data?.message) {
            masterReply = data.data.message;
          } else {
            masterReply = JSON.stringify(data.data, null, 2);
          }
        } else {
          masterReply = data.primaryError || data.error || data.diagnostic?.message || 'Processado com sucesso.';
        }
      } catch (parseErr: any) {
        masterReply = `Erro ao processar resposta: ${parseErr?.message || 'Falha ao decodificar'}`;
      }

      if (actionNotice) {
        masterReply = `${actionNotice}\n\n${masterReply}`;
      }

      const masterMsg: MasterMessage = {
        id: `msg-${Date.now()}-m`,
        sender: 'master',
        text: masterReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: activeMode,
        actionExecuted: actionNotice ? 'Idea Saved' : undefined,
      };

      const finalMsgs = [...updated, masterMsg];
      setMessages(finalMsgs);
      try {
        localStorage.setItem('hub_universal_master_sessions_v2', JSON.stringify(finalMsgs));
      } catch {}
    } catch (err: any) {
      const errorMsg: MasterMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'master',
        text: `Erro de comunicação com o orquestrador: ${err?.message || 'Erro desconhecido'}. Por favor, tente novamente.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: activeMode,
      };
      setMessages([...updated, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem('hub_universal_master_sessions_v2');
    } catch {}
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 shrink-0">
              <Crown className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-900 text-indigo-300 border border-indigo-700 uppercase tracking-widest">
                  Camada Universal de Inteligência do Hub
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Mestre Universal</h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Converse livremente sobre qualquer tema, desenvolva ideias, gere código, planeje projetos ou execute tarefas. O Mestre integra raciocínio avançado com acesso direto às ferramentas e memórias do Hub.
              </p>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-all shrink-0 self-start md:self-center"
          >
            Reiniciar Conversa
          </button>
        </div>
      </div>

      {/* Specialty Modes Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {(
          [
            'Universal (Geral)',
            'Programador',
            'Arquiteto',
            'Pesquisador',
            'Professor',
            'Estrategista',
            'Criador',
          ] as const
        ).map((mode) => (
          <button
            key={mode}
            onClick={() => setActiveMode(mode)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeMode === mode
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {mode === 'Universal (Geral)' && <Compass className="w-3.5 h-3.5" />}
            {mode === 'Programador' && <Code2 className="w-3.5 h-3.5" />}
            {mode === 'Arquiteto' && <Workflow className="w-3.5 h-3.5" />}
            {mode === 'Pesquisador' && <Brain className="w-3.5 h-3.5" />}
            {mode === 'Professor' && <BookOpen className="w-3.5 h-3.5" />}
            {mode === 'Estrategista' && <Cpu className="w-3.5 h-3.5" />}
            {mode === 'Criador' && <Sparkles className="w-3.5 h-3.5" />}
            <span className="truncate">{mode}</span>
          </button>
        ))}
      </div>

      {/* Chat Interface */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[600px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Modo Especializado: <strong className="text-indigo-300">{activeMode}</strong> (Orquestrador Universal Ativo)</span>
          </div>
          <div className="text-xs text-slate-400">
            {messages.length} interações na sessão
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
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-indigo-400'
                }`}
              >
                {m.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-lg'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs shadow-md'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 border-b border-white/10 pb-1 mb-1">
                  <span className="font-bold">{m.sender === 'user' ? 'Você' : `Mestre Universal (${m.mode || activeMode})`}</span>
                  <span>{m.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-xs p-4 text-slate-400 text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-2 font-medium text-slate-300">Mestre Universal raciocinando e estruturando resposta ({activeMode})...</span>
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
            placeholder={`Converse sobre qualquer tema ou solicite uma ação ("Guarde essa ideia: ...", "Crie um código...", "Explique...")`}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isThinking}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Enviar
          </button>
        </form>
      </div>
    </div>
  );
};
