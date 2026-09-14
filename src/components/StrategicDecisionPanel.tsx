import React from 'react';
import { Compass, X, ArrowRight, Star } from 'lucide-react';
import { IAItem, IACategory } from '../types';

interface StrategicDecisionPanelProps {
  ias: IAItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: IACategory) => void;
  onSelectIA: (ia: IAItem) => void;
}

const STRATEGIC_GROUPS: { label: string; icon: string; category: IACategory; desc: string }[] = [
  {
    label: 'Trabalho geral / raciocínio',
    icon: '💬',
    category: 'MODELOS GERAIS / MULTIMODAL',
    desc: 'Redação, síntese, raciocínio lógico e resolução de problemas complexos.',
  },
  {
    label: 'Pesquisa com fontes verificadas',
    icon: '🔎',
    category: 'PESQUISA INTELIGENTE',
    desc: 'Substituição da busca tradicional com citações reais e links em tempo real.',
  },
  {
    label: 'Criar sistemas, UI e código',
    icon: '💻',
    category: 'CÓDIGO & ENGENHARIA',
    desc: 'Programação autônoma, depuração, autocompletes e prototipagem ágil.',
  },
  {
    label: 'Automatizar fluxos e agentes',
    icon: '⚙️',
    category: 'AUTOMAÇÃO & EXECUÇÃO',
    desc: 'Agentes autônomos que operam ferramentas e conectam ecossistemas de apps.',
  },
  {
    label: 'Criar imagens artísticas & design',
    icon: '🎨',
    category: 'IMAGEM & CRIATIVIDADE',
    desc: 'Ilustração com alta estética, design vetorial, texto renderizado e upscaling.',
  },
  {
    label: 'Produzir e animar vídeos',
    icon: '🎬',
    category: 'VÍDEO & PRODUÇÃO',
    desc: 'Cinematografia generativa, avatares corporativos e efeitos visuais.',
  },
  {
    label: 'Voz realista, áudio & música',
    icon: '🎧',
    category: 'ÁUDIO & MÚSICA',
    desc: 'Clonagem e síntese de voz ultra-realista, composição musical e stems.',
  },
  {
    label: 'Produtividade de equipe & docs',
    icon: '📊',
    category: 'PRODUTIVIDADE EMPRESARIAL',
    desc: 'Organização de bases de conhecimento, planilhas e digitação por voz.',
  },
];

export const StrategicDecisionPanel: React.FC<StrategicDecisionPanelProps> = ({
  ias,
  isOpen,
  onClose,
  onSelectCategory,
  onSelectIA,
}) => {
  if (!isOpen) return null;

  return (
    <section className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-5 mb-8 shadow-[0_12px_45px_rgba(0,0,0,0.5)] transition-all">
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-cyan-300 font-display">
              🎯 Matriz de Decisão Estratégica
            </h2>
            <p className="text-xs text-slate-400">
              Escolha seu objetivo operacional para visualizar as IAs recomendadas para a missão
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fechar painel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {STRATEGIC_GROUPS.map((group) => {
          const categoryIAs = ias
            .filter((x) => x.category === group.category)
            .sort((a, b) => {
              const scoreA = (a.level === 'Elite' ? 10 : a.level === 'Alta Performance' ? 7 : 4) + (a.scores.Geral || 3);
              const scoreB = (b.level === 'Elite' ? 10 : b.level === 'Alta Performance' ? 7 : 4) + (b.scores.Geral || 3);
              return scoreB - scoreA;
            })
            .slice(0, 3);

          return (
            <div
              key={group.category}
              className="group flex flex-col justify-between bg-slate-950/60 hover:bg-slate-800/40 border border-cyan-500/15 hover:border-cyan-500/40 rounded-xl p-4 transition-all duration-200"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{group.icon}</span>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {group.label}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  {group.desc}
                </p>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Star className="w-3 h-3 text-cyan-400" />
                  <span>Destaques da categoria:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {categoryIAs.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => onSelectIA(tool)}
                      className="px-2 py-1 rounded bg-slate-800/80 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400/50 text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
                      title={`${tool.name} • ${tool.specialty}`}
                    >
                      {tool.name}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => onSelectCategory(group.category)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium pt-2 border-t border-slate-800/80 transition-colors"
                >
                  <span>Ver todas desta área</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
