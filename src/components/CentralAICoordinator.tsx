import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Compass, 
  BookOpen, 
  Layers, 
  ExternalLink, 
  ArrowRight, 
  RefreshCw, 
  Cpu, 
  HelpCircle,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { IAItem } from '../types';
import { centralChat } from '../services/aiCentralService';

interface CentralAICoordinatorProps {
  catalog: IAItem[];
  onOpenCatalogWithFilter?: (category: string) => void;
  onOpenPromptGen?: () => void;
  onOpenCompare?: () => void;
  onOpenAIDetail?: (ai: IAItem) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: { label: string; actionType: string; target?: string }[];
  intentDetected?: string;
  timestamp: Date;
}

export const CentralAICoordinator: React.FC<CentralAICoordinatorProps> = ({
  catalog,
  onOpenCatalogWithFilter,
  onOpenPromptGen,
  onOpenCompare,
  onOpenAIDetail,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'THINKING' | 'SPEAKING' | 'ERROR' | 'ONLINE'>('ONLINE');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: 'Olá! Sou a Central IA.\n\nPosso explicar assuntos, ensinar, criar prompts, encontrar IAs, comparar ferramentas, gerar informações, ajudar nos estudos e orientar você dentro do Hub.\n\nO que você precisa?',
      suggestedActions: [
        { label: '📂 Explorar Catálogo', actionType: 'OPEN_CATALOG' },
        { label: '✨ Gerar Prompt de Alto Nível', actionType: 'OPEN_PROMPT_GEN' },
        { label: '⚖️ Comparar IAs', actionType: 'OPEN_COMPARE' },
      ],
      timestamp: new Date(),
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setStatus('THINKING');

    try {
      const historyPayload = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await centralChat(text, historyPayload, catalog);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        suggestedActions: result.suggestedActions,
        intentDetected: result.intentDetected,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStatus('SPEAKING');
      setTimeout(() => setStatus('ONLINE'), 3000);
    } catch (err: any) {
      setStatus('ERROR');
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, tive uma oscilação momentânea ao consultar o servidor de inteligência. No entanto, posso ajudar você utilizando nossos recursos locais! O que você deseja fazer?',
        suggestedActions: [
          { label: '📂 Abrir Catálogo', actionType: 'OPEN_CATALOG' },
          { label: '✨ Gerador de Prompts', actionType: 'OPEN_PROMPT_GEN' },
        ],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (actionType: string, target?: string) => {
    if (actionType === 'OPEN_CATALOG') {
      if (onOpenCatalogWithFilter) {
        onOpenCatalogWithFilter(target || '');
      }
      setIsOpen(false);
    } else if (actionType === 'OPEN_PROMPT_GEN') {
      if (onOpenPromptGen) {
        onOpenPromptGen();
      }
      setIsOpen(false);
    } else if (actionType === 'OPEN_COMPARE') {
      if (onOpenCompare) {
        onOpenCompare();
      }
      setIsOpen(false);
    } else if (actionType === 'OPEN_AI' && target) {
      const found = catalog.find((i) => i.name.toLowerCase() === target.toLowerCase());
      if (found && onOpenAIDetail) {
        onOpenAIDetail(found);
      } else if (onOpenCatalogWithFilter) {
        onOpenCatalogWithFilter('');
      }
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Botão flutuante do Robô / Central IA */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-full shadow-2xl border border-indigo-500/30 hover:border-indigo-400/60 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/20"
          title="Central IA — Assistente do Hub"
          id="central-ia-floating-btn"
        >
          {/* Indicador de status pulse */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-inner text-white font-bold relative overflow-hidden">
            <Cpu className="w-5 h-5 animate-pulse text-white" />
          </div>

          <div className="flex flex-col text-left pr-1">
            <span className="text-xs font-bold text-cyan-300 tracking-wider flex items-center gap-1">
              CENTRAL IA <Sparkles className="w-3 h-3 text-amber-400" />
            </span>
            <span className="text-[11px] text-slate-300">Assistente Inteligente</span>
          </div>
        </button>
      )}

      {/* Janela Modal do Chat da Central IA */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[440px] h-[600px] max-h-[85vh] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Cabeçalho */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                  status === 'THINKING' ? 'bg-amber-400 animate-bounce' :
                  status === 'ERROR' ? 'bg-rose-500' : 'bg-emerald-400'
                }`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                  CENTRAL IA <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-md font-mono">PRO</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {status === 'THINKING' ? 'Processando resposta...' : 'Assistente inteligente do Hub'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([messages[0]])}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Reiniciar conversa"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corpo de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60 custom-scrollbar">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-br-xs'
                      : 'bg-slate-850 text-slate-200 border border-slate-750 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{m.content}</div>

                  {/* Ações sugeridas */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-750/80 flex flex-wrap gap-2">
                      {m.suggestedActions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(act.actionType, act.target)}
                          className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-cyan-300 hover:text-white border border-indigo-500/40 px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 font-medium shadow-sm"
                        >
                          <span>{act.label}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-850 border border-slate-750 px-4 py-3 rounded-2xl rounded-bl-xs text-xs text-slate-400 flex items-center gap-2">
                  <span className="animate-pulse">Central IA está pensando e consultando o catálogo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas / Exemplos */}
          <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex gap-2 overflow-x-auto text-xs no-scrollbar">
            {[
              'Quero estudar IA',
              'Qual IA para vídeo?',
              'Compare Claude e ChatGPT',
              'Quero criar um prompt'
            ].map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="whitespace-nowrap bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-cyan-300 px-3 py-1 rounded-full border border-slate-700 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Caixa de Entrada */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="O que você precisa?"
              className="flex-1 bg-slate-950 text-white placeholder-slate-500 text-sm px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputMessage.trim()}
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-40 text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center"
              title="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
