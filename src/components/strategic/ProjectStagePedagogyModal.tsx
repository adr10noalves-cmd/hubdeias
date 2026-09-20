import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Bot,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';
import { ProjectHubItem } from '../../types';

interface ProjectStagePedagogyModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectHubItem;
  onOpenLearningModal: () => void;
}

export const ProjectStagePedagogyModal: React.FC<ProjectStagePedagogyModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenLearningModal,
}) => {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  if (!isOpen) return null;

  const handleAskTutor = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'GEMINI',
          modelId: 'gemini-3.8-flash',
          systemPrompt: `Você é o Receptor Mestre / Tutor Pedagógico do Hub de IAs. O usuário está no projeto "${project.name}" (Objetivo: ${project.objective}), atualmente na etapa: "${project.currentStage}" (Status: ${project.status}, Progresso: ${project.progress}%).
          
Explique de forma altamente didática, clara e estruturada:
1. O que significa esta etapa tecnicamente e conceitualmente?
2. Por que ela é indispensável para o sucesso do projeto?
3. O que o Executor de IA precisa do usuário ou do código para concluir essa etapa?
4. Qual lição prática ou aprendizado profissional o usuário leva dessa etapa?

Seja objetivo, elegante e direto em Markdown com tópicos claros. Retorne um JSON com a propriedade "response".`,
          userPrompt: `Explique detalhadamente a etapa atual: "${project.currentStage}"`,
          complexityLevel: 4,
          activeMode: 'PEDAGOGICAL_EXPLANATION',
        }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { success: true, data: { response: raw } };
      }

      if (data.success && data.data?.response) {
        setAiExplanation(data.data.response);
      } else if (data.data?.text) {
        setAiExplanation(data.data.text);
      } else if (typeof data.data === 'string') {
        setAiExplanation(data.data);
      } else {
        setAiExplanation('Não foi possível carregar a explicação da IA no momento.');
      }
    } catch (err: any) {
      setAiExplanation(`Falha ao conectar ao serviço pedagógico: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/50 uppercase tracking-wider">
                  Guia Pedagógico da Etapa
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {project.status} ({project.progress}%)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                Entender: {project.currentStage}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar e voltar à execução"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin text-slate-300 text-xs sm:text-sm leading-relaxed">
          {/* Box de Resumo Pedagógico Inicial */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">
                  O que significa esta etapa?
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Na fase <strong className="text-cyan-400 font-semibold">{project.status}</strong>, o foco principal é transformar o objetivo (<em className="text-slate-200">"{project.objective}"</em>) em componentes funcionais através de entregas incrementais.
                </p>
              </div>
            </div>
          </div>

          {/* Grade de 3 Pilares */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5" /> 1. Por que é necessária?
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                Evita retrabalho estrutural ao garantir que a arquitetura e as regras atendam aos requisitos antes do avanço.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" /> 2. O que o Executor precisa?
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                Diretrizes claras, decisões validadas e resposta às missões prioritárias em andamento.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> 3. O que você aprende?
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-normal">
                Domínio dos padrões arquiteturais, engenharia de prompt especializada e gestão tática com IAs.
              </p>
            </div>
          </div>

          {/* Aprofundamento com IA sob demanda */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/20 to-indigo-950/20 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-xs sm:text-sm">
                  Explicação Profunda sob Demanda (Tutor Gemini)
                </span>
              </div>
              <button
                onClick={handleAskTutor}
                disabled={isLoadingAi}
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isLoadingAi ? 'Analisando etapa...' : 'Gerar Explicação Didática'}
              </button>
            </div>

            {aiExplanation && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {aiExplanation}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 italic text-center sm:text-left">
            "Executar primeiro. Explicar quando necessário. Aprofundar quando desejar."
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                onClose();
                onOpenLearningModal();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Registrar Aprendizado Formal
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              Voltar à Execução
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
