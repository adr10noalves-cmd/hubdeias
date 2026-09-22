import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  CheckCircle,
  ShieldCheck,
  GraduationCap,
  ListTodo,
  Code2,
  Bug,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ProjectHubItem,
  ProjectMessage,
  ProjectDecision,
  ProjectMission,
  ProjectCompleteState,
} from '../../types';
import { executeHubTool } from '../../services/assistant/hubToolRegistry';
import { publishHubEvent } from '../../services/assistant/hubEventBus';

interface ProjectDebateChatProps {
  project: ProjectHubItem;
  messages: ProjectMessage[];
  completeState?: ProjectCompleteState;
  onSendMessage: (text: string, aiResponseText: string) => void;
  onAddDecision: (decision: ProjectDecision) => void;
  onStateChanged?: () => void;
}

const QUICK_QUERIES = [
  'Em que ponto estamos?',
  'O que falta?',
  'O que você recomenda melhorar?',
  'Por que você fez isso?',
  'Quais problemas foram encontrados?',
  'Quais são as próximas etapas?',
  'Quero mudar essa parte.',
  'Vamos criar uma nova versão.',
  'Essa arquitetura ainda faz sentido?',
  'Quero adicionar uma nova funcionalidade.',
];

export const ProjectDebateChat: React.FC<ProjectDebateChatProps> = ({
  project,
  messages,
  completeState,
  onSendMessage,
  onAddDecision,
  onStateChanged,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activePersonaFilter, setActivePersonaFilter] = useState<'TODOS' | 'EXECUTOR' | 'PROFESSOR' | 'ARQUITETO'>('TODOS');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessageWithPrompt = async (userPromptText: string) => {
    if (!userPromptText.trim() || isTyping) return;

    const userText = userPromptText.trim();
    setInputText('');
    setIsTyping(true);

    try {
      // Monta o resumo detalhado do projeto para o contexto profundo da IA
      const decisionsSummary = (completeState?.decisions || [])
        .slice(0, 8)
        .map((d) => `- [${d.status}] ${d.decision} (Motivo: ${d.reason})`)
        .join('\n');

      const missionsSummary = (completeState?.missions || [])
        .slice(0, 8)
        .map((m) => `- [${m.status}] ${m.title}`)
        .join('\n');

      const deliverablesSummary = (completeState?.deliverables || [])
        .slice(0, 5)
        .map((d) => `- [${d.type}] ${d.title} (${d.path || 'sem caminho'})`)
        .join('\n');

      const testsSummary = (completeState?.tests || [])
        .slice(0, 5)
        .map((t) => `- [${t.status}] ${t.name}${t.errorFound ? ` (Erro: ${t.errorFound})` : ''}`)
        .join('\n');

      const systemPrompt = `VOCÊ É O AGENTE INTEGRADO DO PROJETO "${project.name}" NO HUB 2.0.
SEUS 4 PAPÉIS SIMULTÂNEOS:
1. AGENTE EXECUTOR: executa tarefas autorizadas, gera código, componentes e atualiza o projeto.
2. AGENTE PROFESSOR: após implementar ou explicar, detalha pedagogicamente:
   - O QUE FOI FEITO
   - POR QUE FOI FEITO
   - COMO FUNCIONA
   - O QUE FOI TESTADO
   - O QUE FOI ALTERADO
   - O QUE AINDA FALTA
   - O QUE PODE EVOLUIR
3. AGENTE ARQUITETO: debate alternativas com profundidade, aponta riscos e segue o rigor:
   - REQUISITO DO USUÁRIO vs INFERÊNCIA NECESSÁRIA vs SUGESTÃO DA IA vs DECISÃO APROVADA.
4. ACOMPANHADOR DE PROJETOS: acompanha o ciclo de vida completo (Ideia -> Debate -> Planejamento -> Aprovação -> Execução -> Teste -> Correção -> Implantação -> Acompanhamento -> Análise -> Evolução -> Novo debate).

DADOS DO PROJETO ATUAL:
- Nome: "${project.name}" (ID: "${project.id}")
- Objetivo: "${project.objective}"
- Status Operacional: "${project.status}"
- Etapa Atual: "${project.currentStage}"
- Progresso: ${project.progress}%
- Próxima Ação Cadastrada: "${project.nextAction || 'Não definida'}"

DECISÕES REGISTRADAS NO PROJETO:
${decisionsSummary || 'Nenhuma decisão formal ainda.'}

MISSÕES / TAREFAS ATUAIS:
${missionsSummary || 'Nenhuma missão cadastrada ainda.'}

ENTREGÁVEIS DE CÓDIGO EXISTENTES:
${deliverablesSummary || 'Nenhum entregável de código registrado.'}

TESTES DE QUALIDADE REGISTRADOS:
${testsSummary || 'Nenhum teste executado registrado.'}

DIRETRIZES DE RETORNO:
- Responda em JSON estrito contendo:
  {
    "response": "Sua resposta analítica, executiva ou pedagógica em Markdown elegante e didático",
    "toolCall": {
      "name": "project_propose_decision" | "project_add_mission" | "project_save_deliverable" | "project_record_test" | "project_record_pedagogy" | "project_register_version" | null,
      "parameters": {}
    },
    "suggestedDecision": "Caso você sugira uma decisão formal, descreva-a sucintamente aqui",
    "suggestedMission": "Caso recomende uma nova tarefa prática, descreva-a aqui"
  }
- Se o usuário autorizar ou solicitar algo concreto, use o toolCall apropriado para gravar no projeto.
- Seja competente, direto e acolhedor pedagogicamente. Nunca invente dados que contrariem o projeto.`;

      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'GEMINI',
          modelId: 'gemini-2.5-pro',
          systemPrompt,
          userPrompt: userText,
          complexityLevel: 4,
          activeMode: 'DEBATE_PROJECT',
        }),
      });

      let data: any = null;
      try {
        const rawText = await res.text();
        data = JSON.parse(rawText);
      } catch {
        data = { success: false, error: 'Resposta não pôde ser interpretada como JSON' };
      }

      let aiReply = '';
      let toolCall = null;

      if (data.success && data.data) {
        aiReply = data.data.response || data.data.text || JSON.stringify(data.data);
        toolCall = data.data.toolCall;
      } else {
        aiReply = `Erro na resposta da IA: ${data.error || 'Falha temporária'}.`;
      }

      // Se a IA disparou uma ferramenta do projeto, executa
      if (toolCall && toolCall.name && toolCall.parameters) {
        try {
          const paramsWithProject = {
            projectId: project.id,
            ...toolCall.parameters,
          };
          const toolResult = await executeHubTool(toolCall.name, paramsWithProject);
          if (toolResult.success) {
            aiReply += `\n\n> ⚡ **Ação do Agente no Projeto:** ${toolResult.message}`;
            if (onStateChanged) onStateChanged();
          }
        } catch (e: any) {
          console.warn('Erro ao executar toolCall do projeto:', e);
        }
      }

      onSendMessage(userText, aiReply);
    } catch (err: any) {
      onSendMessage(userText, `Erro de conexão com o servidor de IA: ${err?.message || 'Erro'}`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;
    sendMessageWithPrompt(inputText);
  };

  const handleRegisterDecisionFromMessage = (text: string) => {
    const newDecision: ProjectDecision = {
      id: `dec-${Date.now()}`,
      projectId: project.id,
      decision: text.slice(0, 100).replace(/^[#*>\s-]+/, '') + (text.length > 100 ? '...' : ''),
      reason: 'Proposta acordada durante debate no projeto.',
      date: new Date().toLocaleDateString(),
      responsible: 'Usuário & Agente',
      impact: 'Evolução arquitetural.',
      status: 'SUGESTÃO',
    };
    onAddDecision(newDecision);
    if (onStateChanged) onStateChanged();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
      {/* Header com Papéis Integrados */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm sm:text-base">Agente Integrado do Projeto</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                Gemini 2.5 Pro
              </span>
            </div>
            <p className="text-slate-400 text-xs flex items-center gap-2 mt-0.5">
              <span className="text-cyan-400 font-semibold">Executor</span> •
              <span className="text-amber-400 font-semibold">Professor</span> •
              <span className="text-purple-400 font-semibold">Arquiteto</span> •
              <span className="text-emerald-400 font-semibold">Acompanhador</span>
            </p>
          </div>
        </div>

        {/* Status operacional */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono">
            Etapa: <strong className="text-white">{project.currentStage}</strong>
          </span>
        </div>
      </div>

      {/* Barra de Consultas e Atalhos Rápidos */}
      <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-cyan-400" /> Perguntas Rápidas:
        </span>
        {QUICK_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendMessageWithPrompt(q)}
            disabled={isTyping}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 text-[11px] font-medium border border-slate-800 whitespace-nowrap shrink-0 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-950/40 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700 mx-auto flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-300 text-sm">Debate com a IA pronto para começar!</p>
            <p className="max-w-md mx-auto text-slate-400">
              Pergunte em que ponto estamos, solicite planejamento, crie entregáveis ou clique em uma das perguntas rápidas acima.
            </p>
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
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2.5 ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-xs shadow-lg'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-xs shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/10 text-[11px] gap-2">
                  <span className="opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRegisterDecisionFromMessage(msg.text)}
                        className="px-2 py-0.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-700/50 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        title="Registrar ponto como Decisão em Sugestão"
                      >
                        <ShieldCheck className="w-3 h-3" /> Propor Decisão
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
              <span className="ml-2 font-medium text-slate-300">
                Agente Integrado analisando contexto, arquitetura e execução...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Converse com o Agente sobre "${project.name}" (ex: "vamos criar a tela de pedidos")...`}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isTyping}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" /> Enviar
        </button>
      </form>
    </div>
  );
};
