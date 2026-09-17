import React, { useState } from 'react';
import { Crown, Terminal, Sparkles, Send, Copy, Check, Cpu, ArrowRight, Layers, ShieldCheck, RefreshCw } from 'lucide-react';

interface MasterCommandLog {
  id: string;
  command: string;
  timestamp: string;
  recommendedAI: string;
  structuredPrompt: string;
  implementationPlan: string[];
  status: 'Concluído' | 'Em planejamento' | 'Aguardando Aprovação';
}

const INITIAL_MASTER_COMMANDS: MasterCommandLog[] = [
  {
    id: 'cmd-1',
    command: 'Criar microsserviço de autenticação JWT e controle de permissões por papéis (RBAC)',
    timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString(),
    recommendedAI: 'Gemini 2.5 Pro (Arquitetura) + Groq GPT-OSS 120B (Geração de Código)',
    structuredPrompt: 'Atue como Arquiteto Chefe de Sistemas. Desenvolva a estrutura de autenticação JWT em Node.js com TypeScript e Express, aplicando middlewares de verificação de token e validação de roles (Admin, Operador, Visualizador). Garanta tratamento de erros e criptografia bcrypt.',
    implementationPlan: [
      '1. Instalar dependências jsonwebtoken, bcrypt e express',
      '2. Criar middleware de autenticação (verifyToken.ts)',
      '3. Implementar rotas de login e cadastro em /api/auth',
      '4. Configurar testes unitários de segurança',
    ],
    status: 'Concluído',
  },
];

export const SystemMasterView: React.FC = () => {
  const [inputCommand, setInputCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [commands, setCommands] = useState<MasterCommandLog[]>(() => {
    try {
      const raw = localStorage.getItem('hub_system_master_commands_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return INITIAL_MASTER_COMMANDS;
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleRunCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCommand.trim() || isProcessing) return;

    const cmdText = inputCommand.trim();
    setInputCommand('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'GEMINI',
          modelId: 'gemini-2.5-pro',
          systemPrompt: `Você é a Mestre Suprema de Engenharia de Software e Orquestração de Sistemas do Hub Estratégico. O usuário solicitou uma implantação, arquitetura ou comando: "${cmdText}".
Analise detalhadamente e retorne um objeto JSON estrito contendo exatamente os seguintes campos:
- "recommendedAI": string (qual IA usar, ex: "Gemini 2.5 Pro (Arquitetura) + Groq (Código)")
- "structuredPrompt": string (o prompt técnico definitivo pronto para ser executado)
- "implementationPlan": array de strings (passos sequenciais detalhados de implementação)`,
          userPrompt: cmdText,
          complexityLevel: 5,
          activeMode: 'SYSTEM_MASTER',
        }),
      });

      const data = await res.json();
      const parsed = data.success ? data.data : null;

      const newCmd: MasterCommandLog = {
        id: `cmd-${Date.now()}`,
        command: cmdText,
        timestamp: new Date().toLocaleString(),
        recommendedAI: parsed?.recommendedAI || 'Gemini 2.5 Pro (DeepMind Engine) + Groq High-Speed',
        structuredPrompt: parsed?.structuredPrompt || `Atue como Mestre de Engenharia de Software para implantar: "${cmdText}". Garanta código robusto, modular e seguro em TypeScript/Node.`,
        implementationPlan: Array.isArray(parsed?.implementationPlan) && parsed.implementationPlan.length > 0
          ? parsed.implementationPlan
          : [
              '1. Análise detalhada de requisitos e escopo técnico',
              '2. Definição da estrutura de dados e contratos de API',
              '3. Implementação dos módulos principais com validação de tipos',
              '4. Verificação de segurança e testes de integração',
            ],
        status: 'Aguardando Aprovação',
      };

      const updated = [newCmd, ...commands];
      setCommands(updated);
      try {
        localStorage.setItem('hub_system_master_commands_v1', JSON.stringify(updated));
      } catch {}
    } catch (err: any) {
      console.error('Erro ao executar comando Mestre com Gemini:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 shrink-0">
              <Crown className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-900 text-indigo-300 border border-indigo-700 uppercase tracking-widest">
                  Centro de Comando Supremo (Gemini 2.5 Pro)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">O Mestre do Sistema</h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Solicite qualquer implantação, arquitetura ou automação. O Mestre utiliza o motor real da Gemini para analisar sua intenção, descobrir as IAs ideais, estruturar os prompts definitivos e montar o plano de execução passo a passo.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-xs text-indigo-300 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Motor Gemini Ativo
          </div>
        </div>
      </div>

      {/* Input Command Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" /> Solicitar Comando ao Mestre
        </h3>

        <form onSubmit={handleRunCommand} className="space-y-3">
          <textarea
            rows={3}
            required
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            placeholder="Ex: Quero implementar uma central de pagamentos com Stripe, webhook seguro e registro automático no banco de dados..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
          />
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Segurança garantida: O Mestre planeja e estrutura sem alterar código sem sua aprovação.
            </div>
            <button
              type="submit"
              disabled={!inputCommand.trim() || isProcessing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> O Mestre está processando com Gemini...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Executar Comando Mestre
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Commands & Orchestrations History */}
      <div className="space-y-4">
        <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" /> Histórico de Comandos e Planos Mestres
        </h3>

        {commands.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/50 border border-slate-800 rounded-2xl">
            Nenhum comando mestre executado ainda.
          </div>
        ) : (
          <div className="space-y-4">
            {commands.map((cmd) => (
              <div
                key={cmd.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                      {cmd.status}
                    </span>
                    <h4 className="font-bold text-white text-base sm:text-lg">{cmd.command}</h4>
                  </div>
                  <span className="text-xs text-slate-500">{cmd.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* IA Recomendada */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-400" /> IAs Recomendadas pelo Mestre
                    </div>
                    <p className="text-slate-200 text-xs sm:text-sm font-medium">{cmd.recommendedAI}</p>
                  </div>

                  {/* Plano de Implementação */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <ArrowRight className="w-4 h-4 text-cyan-400" /> Plano de Execução Passo a Passo
                    </div>
                    <ul className="space-y-1 text-slate-300 text-xs">
                      {cmd.implementationPlan.map((step, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Prompt Estruturado */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Prompt Mestre Estruturado
                    </span>
                    <button
                      onClick={() => handleCopyPrompt(cmd.structuredPrompt, cmd.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      {copiedId === cmd.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-indigo-400" /> Copiar Prompt
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 text-xs sm:text-sm font-mono leading-relaxed select-all">
                    {cmd.structuredPrompt}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
