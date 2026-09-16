import {
  IdeaItem,
  IdeaVersion,
  EvolutionLog,
  StudyItem,
  IAItem,
  RoadmapItem,
} from '../types';

export interface EvolutionAISuggestion {
  title: string;
  changeReason: string;
  decisionTaken: string;
  nextStep: string;
  impact: string;
}

export interface RecommendedStudySuggestion {
  theme: string;
  objective: string;
  recommendedTools?: string[];
}

export interface EvolutionAIAnalysisResult {
  summaryAnalysis: string;
  suggestedEvolutions: EvolutionAISuggestion[];
  suggestedRoadmap: RoadmapItem[];
  recommendedStudies: RecommendedStudySuggestion[];
  recommendedCatalogTools: string[];
  modelUsed?: string;
  source: 'groq' | 'local_heuristic';
}

/**
 * Dispara a análise contextual do projeto/ideia com a IA.
 * Envia o histórico de versões, diário de bordo, estudos vinculados e catálogo de IAs.
 */
export async function analyzeIdeaEvolutionWithAI(params: {
  idea: IdeaItem;
  historyVersions: IdeaVersion[];
  evolutionLogs: EvolutionLog[];
  relatedStudies: StudyItem[];
  catalog: IAItem[];
  userQuestion?: string;
}): Promise<EvolutionAIAnalysisResult> {
  const { idea, historyVersions, evolutionLogs, relatedStudies, catalog, userQuestion } = params;

  try {
    const res = await fetch('/api/groq/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'evolve_idea_analysis',
        payload: {
          idea,
          historyVersions,
          evolutionLogs,
          relatedStudies,
          catalog: catalog.map((c) => ({
            name: c.name,
            category: c.category,
            specialty: c.specialty,
            level: c.level,
            link: c.link,
          })),
          userQuestion: userQuestion || 'Como posso evoluir esse projeto/ideia estrategicamente?',
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.suggestedEvolutions) {
        return {
          summaryAnalysis: data.summaryAnalysis || 'Análise concluída com sucesso.',
          suggestedEvolutions: Array.isArray(data.suggestedEvolutions) ? data.suggestedEvolutions : [],
          suggestedRoadmap: Array.isArray(data.suggestedRoadmap)
            ? data.suggestedRoadmap.map((r: any, idx: number) => ({
                id: r.id || `rm-sug-${Date.now()}-${idx}`,
                stageTitle: r.stageTitle || 'Próxima Evolução',
                goal: r.goal || '',
                status: r.status || 'Pendente',
              }))
            : [],
          recommendedStudies: Array.isArray(data.recommendedStudies) ? data.recommendedStudies : [],
          recommendedCatalogTools: Array.isArray(data.recommendedCatalogTools) ? data.recommendedCatalogTools : [],
          modelUsed: data.modelUsed || 'Groq Cloud',
          source: 'groq',
        };
      }
    }
  } catch (e) {
    console.warn('[AI Evolution Service] Fallback heurístico ativado:', e);
  }

  // Fallback heurístico inteligente baseado no estágio e objetivo
  return generateHeuristicEvolutionAnalysis(idea, relatedStudies, catalog);
}

function generateHeuristicEvolutionAnalysis(
  idea: IdeaItem,
  relatedStudies: StudyItem[],
  catalog: IAItem[]
): EvolutionAIAnalysisResult {
  const matchingTools = catalog
    .filter((c) => {
      const catMatches =
        idea.category === 'SST' || idea.category === 'Software' || idea.category === 'IA'
          ? c.category === 'CÓDIGO & ENGENHARIA' || c.category === 'AUTOMAÇÃO & EXECUÇÃO'
          : true;
      return catMatches;
    })
    .slice(0, 3)
    .map((c) => c.name);

  return {
    summaryAnalysis: `O projeto "${idea.title}" encontra-se no estágio "${idea.stage}". O objetivo de "${idea.objective || 'resolver este problema'}" possui alta viabilidade técnica. Para avançar para a próxima fase, o foco deve ser consolidar a arquitetura modular e validar o fluxo principal de uso.`,
    suggestedEvolutions: [
      {
        title: `Modularização e Testes de Validação no estágio ${idea.stage}`,
        changeReason: 'Garantir estabilidade antes de expandir novas funcionalidades.',
        decisionTaken: 'Dividir a solução em componentes independentes e testar com casos reais de borda.',
        nextStep: 'Documentar os parâmetros de entrada e criar um protótipo funcional mínimo validável.',
        impact: 'Redução de retrabalho e aumento de 60% na velocidade das iterações.',
      },
      {
        title: 'Integração com Ferramentas Especializadas de IA',
        changeReason: 'Aproveitar os modelos mais rápidos e precisos para o escopo do projeto.',
        decisionTaken: `Avaliar o uso de ${matchingTools.slice(0, 2).join(' e ') || 'modelos com RAG contextual'}.`,
        nextStep: 'Realizar benchmark com 5 prompts reais do projeto.',
        impact: 'Alta fidelidade nos resultados e automação de etapas manuais.',
      },
    ],
    suggestedRoadmap: [
      {
        id: `rm-${Date.now()}-1`,
        stageTitle: 'Atual',
        goal: `Estabilizar o protótipo funcional e resolver o problema: ${idea.problemSolved || 'principal gargalo'}`,
        status: 'Em Andamento',
      },
      {
        id: `rm-${Date.now()}-2`,
        stageTitle: 'Próxima Evolução',
        goal: 'Conectar com banco de dados em nuvem e histórico contínuo',
        status: 'Pendente',
      },
      {
        id: `rm-${Date.now()}-3`,
        stageTitle: 'Depois',
        goal: 'Adicionar orquestração de sub-agentes com monitoramento de métricas',
        status: 'Pendente',
      },
      {
        id: `rm-${Date.now()}-4`,
        stageTitle: 'Futuro',
        goal: 'Lançamento em produção com interface completa e multi-dispositivo',
        status: 'Pendente',
      },
    ],
    recommendedStudies: [
      {
        theme: `Boas Práticas de Arquitetura para ${idea.category}`,
        objective: 'Compreender os padrões de design mais robustos e seguros para este tipo de projeto.',
        recommendedTools: matchingTools,
      },
      {
        theme: 'Engenharia de Contexto e Recuperação Estruturada',
        objective: 'Evitar alucinações e perda de histórico de longo prazo.',
        recommendedTools: ['Claude 3.7 Sonnet', 'ChatGPT'],
      },
    ],
    recommendedCatalogTools: matchingTools,
    modelUsed: 'Motor Heurístico Estratégico do Hub',
    source: 'local_heuristic',
  };
}
