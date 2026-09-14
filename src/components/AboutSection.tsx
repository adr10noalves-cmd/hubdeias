import React from 'react';
import { Sparkles, Shield, Cpu, Zap, Heart, Database, Lock } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section className="mt-16 mb-6 p-6 sm:p-8 rounded-3xl bg-[#080e22]/90 border border-cyan-500/20 shadow-xl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sobre o Projeto drico IAS</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display text-white">
            Democratizando a Inteligência Artificial
          </h2>
          <p className="text-slate-300 text-sm max-w-2xl mx-auto leading-relaxed">
            O <strong>drico IAS (Hub V2.0)</strong> foi criado com a missão de transformar o universo complexo da IA em uma experiência simples, prática e acessível para qualquer pessoa — mesmo sem nenhum conhecimento técnico prévio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#050b1a] border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-3">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Direto ao Ponto</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sem jargões complicados. Explicamos em linguagem humana o que cada ferramenta faz, para que serve e a melhor tarefa para usá-la.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050b1a] border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Transparência de Preço</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Saiba de imediato se a IA tem plano gratuito, se é freemium ou paga, evitando surpresas antes mesmo de se cadastrar.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#050b1a] border border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Privacidade & Autonomia</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O catálogo funciona localmente no seu próprio navegador via localStorage. Você pode cadastrar novas IAs, exportar e importar backups com total controle.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <span>
              <strong>Arquitetura Extensível:</strong> Novos dados e ferramentas podem ser cadastrados a qualquer momento pelo botão "Cadastrar IA" no topo da página.
            </span>
          </div>
          <span className="text-slate-400 text-[11px] shrink-0 font-medium">
            drico IAS • Hub Estratégico V2.0
          </span>
        </div>
      </div>
    </section>
  );
};
