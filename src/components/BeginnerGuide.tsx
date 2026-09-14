import React from 'react';
import {
  Compass,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { IACategory } from '../types';

interface BeginnerGuideProps {
  onSelectPurpose: (searchTerm: string, category?: IACategory) => void;
  onOpenDecision: () => void;
}

const COMMON_PURPOSES = [
  {
    icon: '✍️',
    title: 'Escrever ou revisar textos',
    search: 'redação escrita conversa',
    category: 'MODELOS GERAIS / MULTIMODAL' as IACategory,
    example: 'ChatGPT, Claude ou Gemini',
  },
  {
    icon: '🔎',
    title: 'Pesquisar com fontes reais',
    search: 'busca fontes citações',
    category: 'PESQUISA INTELIGENTE' as IACategory,
    example: 'Perplexity ou You.com',
  },
  {
    icon: '🎨',
    title: 'Criar fotos & arte visual',
    search: 'imagem fotos design',
    category: 'IMAGEM & CRIATIVIDADE' as IACategory,
    example: 'Midjourney ou Ideogram',
  },
  {
    icon: '🎬',
    title: 'Gerar vídeos e animações',
    search: 'vídeo animação cinema',
    category: 'VÍDEO & PRODUÇÃO' as IACategory,
    example: 'Runway, Veo ou Sora',
  },
  {
    icon: '🎧',
    title: 'Gerar vozes e músicas',
    search: 'voz música áudio sintetizador',
    category: 'ÁUDIO & MÚSICA' as IACategory,
    example: 'ElevenLabs ou Suno AI',
  },
  {
    icon: '📊',
    title: 'Organizar trabalho e planilhas',
    search: 'produtividade planilhas notas',
    category: 'PRODUTIVIDADE EMPRESARIAL' as IACategory,
    example: 'Notion AI ou Microsoft Copilot',
  },
  {
    icon: '💻',
    title: 'Criar sites, apps ou códigos',
    search: 'código programação web',
    category: 'CÓDIGO & ENGENHARIA' as IACategory,
    example: 'Cursor, Bolt ou v0',
  },
  {
    icon: '⚙️',
    title: 'Automatizar tarefas repetitivas',
    search: 'automação agentes tarefas',
    category: 'AUTOMAÇÃO & EXECUÇÃO' as IACategory,
    example: 'Zapier, Make ou n8n',
  },
];

export const BeginnerGuide: React.FC<BeginnerGuideProps> = ({
  onSelectPurpose,
  onOpenDecision,
}) => {
  return (
    <section className="mb-8 space-y-4">
      {/* Guia Introdutório para Iniciantes */}
      <div className="bg-gradient-to-r from-blue-950/40 via-cyan-950/30 to-indigo-950/40 border border-cyan-500/25 rounded-3xl p-5 sm:p-6 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Lightbulb className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Central drico IAS • Guia para Iniciantes
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                Como usar este Hub se você nunca usou IA?
              </h2>
            </div>
          </div>

          <button
            onClick={onOpenDecision}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-all shrink-0"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Ver Recomendação Passo a Passo</span>
          </button>
        </div>

        {/* 3 Passos Simples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
          <div className="bg-[#050b1a]/75 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs leading-relaxed">
              <strong className="text-white block font-semibold mb-0.5">
                Identifique a sua necessidade
              </strong>
              <span className="text-slate-300">
                Seja para redigir um e-mail, resumir um PDF ou gerar uma imagem, use as finalidades logo abaixo.
              </span>
            </div>
          </div>

          <div className="bg-[#050b1a]/75 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs leading-relaxed">
              <strong className="text-white block font-semibold mb-0.5">
                Observe os selos de Nível e Preço
              </strong>
              <span className="text-slate-300">
                Procure por selos verdes como <b className="text-emerald-400">Iniciante</b> e{' '}
                <b className="text-teal-400">Freemium/Grátis</b> para começar sem complicação.
              </span>
            </div>
          </div>

          <div className="bg-[#050b1a]/75 p-3.5 rounded-2xl border border-slate-800 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs leading-relaxed">
              <strong className="text-white block font-semibold mb-0.5">
                Abra os Detalhes da IA
              </strong>
              <span className="text-slate-300">
                Clique no card para ver o resumo completo: o que é, melhores tarefas e uma dica prática antes de acessar o site oficial.
              </span>
            </div>
          </div>
        </div>

        {/* Escolha por Finalidade (Atalhos Rápidos) */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>O que você quer fazer hoje? (Clique para filtrar)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {COMMON_PURPOSES.map((item) => (
              <button
                key={item.title}
                onClick={() => onSelectPurpose(item.search, item.category)}
                className="group p-2.5 rounded-xl bg-[#060d20] hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-left transition-all flex flex-col justify-between"
                title={`Filtrar IAs para: ${item.title} (Ex: ${item.example})`}
              >
                <div>
                  <span className="text-xl mb-1 block group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 leading-tight">
                    {item.title}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 truncate">
                  {item.example}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
