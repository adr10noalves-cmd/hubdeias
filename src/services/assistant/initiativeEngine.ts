/**
 * MOTOR DE INICIATIVA — CONTROLADOR DE PRESENÇA DO HUB 2.0
 * 
 * Responsável pela autonomia de iniciativa da Central de IA:
 * 1. Aconteceu algo relevante?
 * 2. Isso exige ação?
 * 3. O usuário precisa saber?
 * 4. Preciso fazer uma pergunta?
 * 5. Posso resolver sozinho?
 * 6. Devo executar?
 * 7. Devo permanecer em silêncio?
 */

import {
  ProjectHubItem,
  ProjectMission,
  ProjectDecision,
  UserRole,
  UserAdaptiveProfile,
  StudyItem,
  IdeaItem,
  HubEventType,
  InitiativeDecisionType,
} from '../../types';
import { MainHubView } from '../../components/strategic/StrategicNavTabs';
import { HubEvent } from './hubEventBus';
import {
  getInitiativeMemory,
  recordSilenceDecision,
  hasRecentlyAskedTopic,
  recordProactiveQuestion,
  recordAutonomousAction,
  hasIntroducedArea,
  recordAreaIntroduction,
} from './initiativeMemory';
import {
  getProjectMissions,
  getProjectDecisions,
  saveProjectMission,
  saveSingleProject,
} from '../projectsService';

export interface InitiativeActionSuggestion {
  label: string;
  actionType: string;
  target?: string;
  payload?: any;
}

export interface InitiativeEvaluationResult {
  decision: InitiativeDecisionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  messageText?: string;
  topicKey?: string;
  suggestedActions?: InitiativeActionSuggestion[];
  autonomousExecutionSummary?: string;
  contextData?: Record<string, any>;
}

export interface InitiativeContext {
  currentRoute: MainHubView;
  currentProject: ProjectHubItem | null;
  allProjects: ProjectHubItem[];
  currentUserRole: UserRole;
  adaptiveProfile: UserAdaptiveProfile;
  studies?: StudyItem[];
  ideas?: IdeaItem[];
}

/**
 * Avalia o evento e o contexto real do Hub para tomar a decisão de iniciativa.
 */
export function evaluateInitiative(
  event: HubEvent,
  context: InitiativeContext
): InitiativeEvaluationResult {
  const memory = getInitiativeMemory();
  const { adaptiveProfile, currentProject, allProjects } = context;
  const userLevel = adaptiveProfile?.aiExperienceLevel || 'INTERMEDIÁRIO';
  const proactivity = adaptiveProfile?.proactivityLevel || 'equilibrado';

  const now = Date.now();
  const timeSinceLastIntervention = now - memory.lastInterventionTime;

  // REGRA DE COOLDOWN GLOBAL ANTI-RUÍDO (exceto falhas críticas de execução)
  const minimumCooldownMs = proactivity === 'alto' ? 30000 : proactivity === 'baixo' ? 90000 : 45000;
  const isCooldownActive = timeSinceLastIntervention < minimumCooldownMs;

  // =========================================================================
  // 1. EVENTO: ERRO DE EXECUÇÃO (Prioridade Crítica)
  // =========================================================================
  if (event.type === 'executor_failed' || event.type === 'repeated_error') {
    const errorMsg = event.payload?.error || event.payload?.errorContext || 'Falha de processamento';
    const topicKey = `error_${event.id}`;

    return {
      decision: 'SUGGEST',
      priority: 'critical',
      reason: 'Erro de execução detectado. Assistente oferece alternativa de resolução ou correção.',
      topicKey,
      messageText: `Encontrei um erro durante a execução (${errorMsg}). Já identifiquei uma alternativa segura e posso orientar ou tentar a correção imediata.`,
      suggestedActions: [
        { label: '🔧 Aplicar Alternativa Segura', actionType: 'APPLY_FIX', payload: { errorMsg } },
        { label: '🔄 Trocar Modelo de IA', actionType: 'SWITCH_MODEL' },
        { label: 'Entendi, vou verificar', actionType: 'DISMISS' },
      ],
    };
  }

  // Se o cooldown estiver ativo e não for crítico, respeita o silêncio inteligente
  if (isCooldownActive) {
    recordSilenceDecision();
    return {
      decision: 'SILENCE',
      priority: 'low',
      reason: `Silêncio inteligente: cooldown ativo (faltam ${Math.ceil((minimumCooldownMs - timeSinceLastIntervention) / 1000)}s).`,
    };
  }

  // Se o usuário configurou proatividade baixa, silencia sugestões triviais
  if (proactivity === 'baixo' && event.type !== 'mission_completed' && event.type !== 'mission_blocked') {
    recordSilenceDecision();
    return {
      decision: 'SILENCE',
      priority: 'low',
      reason: 'Proatividade baixa configurada pelo usuário: silêncio preservado para foco.',
    };
  }

  // =========================================================================
  // 2. EVENTO: PROJETO CRIADO OU ABERTO SEM MISSÕES / SEM PLANO DE EXECUÇÃO
  // =========================================================================
  if (event.type === 'project_created' || (event.type === 'project_opened' && event.payload?.project)) {
    const targetProject: ProjectHubItem = event.payload?.project || currentProject;
    if (targetProject && targetProject.id) {
      const missions = getProjectMissions(targetProject.id);
      const topicKey = `no_missions_${targetProject.id}`;

      if (missions.length === 0 && !hasRecentlyAskedTopic(topicKey, 1000 * 60 * 45)) {
        recordProactiveQuestion(
          topicKey,
          `Vi que este projeto ainda não possui um plano de execução. Qual resultado você pretende alcançar com ele? A partir disso posso estruturar as primeiras etapas.`
        );

        return {
          decision: 'ASK',
          priority: 'high',
          reason: 'Projeto sem missões cadastradas. Auxiliar Mestre pergunta sobre o objetivo para estruturar etapas.',
          topicKey,
          messageText: `Vi que o projeto "${targetProject.name}" ainda não possui um plano de execução detalhado.\n\nQual resultado você pretende alcançar com ele? A partir disso posso estruturar as primeiras etapas e indicar as IAs mais adequadas.`,
          suggestedActions: [
            { label: '🎯 Estruturar Primeiras Etapas', actionType: 'STRUCTURE_FIRST_STEPS', target: targetProject.id },
            { label: '📋 Gerar Roadmap Recomendado', actionType: 'GENERATE_ROADMAP', target: targetProject.id },
            { label: '💡 Ver IAs Ideais para Este Projeto', actionType: 'RECOMMEND_IAS', target: targetProject.id },
          ],
          contextData: { projectId: targetProject.id, projectName: targetProject.name },
        };
      }
    }
  }

  // =========================================================================
  // 3. EVENTO: MISSÃO CONCLUÍDA (Avaliação de Autonomia Operacional)
  // =========================================================================
  if (event.type === 'mission_completed') {
    const targetProject: ProjectHubItem = event.payload?.project || currentProject;
    const completedMission: ProjectMission = event.payload?.mission;

    if (targetProject && completedMission) {
      const allMissions = getProjectMissions(targetProject.id);
      const nextPending = allMissions.find((m) => m.id !== completedMission.id && m.status === 'Pendente');

      // Verifica se há decisões impeditivas
      const decisions = getProjectDecisions(targetProject.id);
      const hasBlockingDecision = decisions.some(
        (d) => d.status === 'Ativa' && d.decision.toLowerCase().includes('bloqueio')
      );

      // Autonomia Concedida: se perfil for AVANÇADO ou proatividade equilibrada/alta e sem bloqueios
      const canExecuteAutonomously = !hasBlockingDecision && nextPending && (userLevel === 'AVANÇADO' || proactivity !== 'baixo');

      if (canExecuteAutonomously) {
        // Execução Autônoma Real: Avança a próxima missão para "Em andamento"
        try {
          const updatedNext: ProjectMission = {
            ...nextPending,
            status: 'Em andamento',
          };
          saveProjectMission(updatedNext);

          // Atualiza a próxima ação do projeto
          const updatedProj: ProjectHubItem = {
            ...targetProject,
            currentStage: updatedNext.title,
            nextAction: updatedNext.description || updatedNext.title,
            updatedAt: new Date().toISOString(),
          };
          saveSingleProject(updatedProj);
          recordAutonomousAction();

          return {
            decision: 'EXECUTE',
            priority: 'high',
            reason: 'Missão concluída e próxima liberada sem bloqueios. Autonomia exercida com sucesso.',
            topicKey: `autonomy_advanced_${updatedNext.id}`,
            messageText: `Concluímos a missão "${completedMission.title}".\n\nA próxima missão ("${updatedNext.title}") já está liberada e não depende de nenhuma decisão pendente. Já dei continuidade ao projeto e iniciei esta etapa.`,
            suggestedActions: [
              { label: '👁️ Ver Missão em Andamento', actionType: 'VIEW_CURRENT_MISSION', target: updatedNext.id },
              { label: '🧪 Simular com IAs do Catálogo', actionType: 'SIMULATE_NEXT_STEP', target: updatedNext.id },
            ],
            autonomousExecutionSummary: `Avançada automaticamente missão "${updatedNext.title}" para Em andamento.`,
          };
        } catch (e) {
          console.error('[InitiativeEngine] Erro ao avançar missão autônoma:', e);
        }
      }

      // Se não executou automaticamente, informa e pergunta se deseja avançar
      return {
        decision: 'INFORM',
        priority: 'medium',
        reason: 'Missão concluída. Central informa e sugere próximos passos.',
        topicKey: `mission_done_${completedMission.id}`,
        messageText: nextPending
          ? `Concluímos com sucesso a missão "${completedMission.title}". A próxima etapa planejada é "${nextPending.title}". Quer que eu avance agora?`
          : `Concluímos a missão "${completedMission.title}". Todas as missões registradas para o projeto "${targetProject.name}" foram finalizadas!`,
        suggestedActions: nextPending
          ? [
              { label: `🚀 Iniciar "${nextPending.title}"`, actionType: 'START_NEXT_MISSION', target: nextPending.id },
              { label: '📝 Registrar Aprendizado no Diário', actionType: 'OPEN_LEARNING_MODAL', target: targetProject.id },
            ]
          : [
              { label: '🎉 Definir Nova Evolução do Projeto', actionType: 'PLAN_NEXT_EVOLUTION', target: targetProject.id },
              { label: '📊 Ver Resultados', actionType: 'VIEW_PROJECT_RESULTS', target: targetProject.id },
            ],
      };
    }
  }

  // =========================================================================
  // 4. EVENTO: USUÁRIO PARADO EM ETAPA COM DECISÃO PENDENTE
  // =========================================================================
  if (event.type === 'decision_required' || event.type === 'mission_blocked' || event.type === 'user_idle_in_stage') {
    const targetProject: ProjectHubItem = event.payload?.project || currentProject;
    if (targetProject) {
      const topicKey = `stuck_decision_${targetProject.id}`;
      if (!hasRecentlyAskedTopic(topicKey, 1000 * 60 * 60)) {
        recordProactiveQuestion(topicKey, `Decisão pendente no projeto ${targetProject.name}`);

        return {
          decision: 'ASK',
          priority: 'high',
          reason: 'Decisão pendente impedindo avanço do projeto. Central propõe análise conjunta.',
          topicKey,
          messageText: `Percebi que ainda estamos na etapa "${targetProject.currentStage || 'atual'}" do projeto "${targetProject.name}".\n\nExiste uma decisão técnica/estratégica pendente que pode estar impedindo o avanço. Quer analisar as alternativas comigo?`,
          suggestedActions: [
            { label: '⚖️ Analisar Decisão Pendente', actionType: 'ANALYZE_PENDING_DECISION', target: targetProject.id },
            { label: '📊 Simular Prós e Contras', actionType: 'SIMULATE_DECISION', target: targetProject.id },
            { label: '💬 Abrir Debate do Projeto', actionType: 'OPEN_DEBATE', target: targetProject.id },
          ],
        };
      }
    }
  }

  // =========================================================================
  // 5. EVENTO: ENTRADA EM UMA ÁREA PELA PRIMEIRA VEZ (Pedagogia & Ensino)
  // =========================================================================
  if (event.type === 'route_changed') {
    const toRoute = event.payload?.to as MainHubView;
    if (toRoute && !hasIntroducedArea(toRoute)) {
      // Didática e apresentação de áreas reservadas principalmente para Iniciantes ou Proatividade Alta
      if (userLevel === 'INICIANTE' || proactivity === 'alto') {
        recordAreaIntroduction(toRoute);

        let areaExplanation = '';
        let areaActionLabel = '🎓 Conhecer Esta Área';

        if (toRoute === 'projects') {
          areaExplanation = 'Essa área gerencia e acompanha as decisões e a execução dos seus projetos. Como é sua primeira vez aqui, posso te orientar em como estruturar suas iniciativas e definir missões claras.';
          areaActionLabel = '🚀 Ver Como Estruturar Projetos';
        } else if (toRoute === 'studies') {
          areaExplanation = 'Esta é a sua Central de Estudos e Aprendizagem. Aqui você aprofunda conhecimentos sobre ferramentas de IA, registra anotações conceituais e acompanha seu progresso pedagógico.';
          areaActionLabel = '📚 Explorar Trilha de Estudos';
        } else if (toRoute === 'ideas') {
          areaExplanation = 'Aqui é o seu Laboratório de Ideias. Você pode rascunhar novos conceitos, registrar problemas que deseja resolver e validá-los antes de transformar em projetos reais.';
          areaActionLabel = '💡 Como Validar uma Ideia';
        } else if (toRoute === 'catalog') {
          areaExplanation = 'Este é o Catálogo Estratégico de IAs do Hub. Você pode pesquisar ferramentas por especialidade, comparar modelos e encontrar a IA ideal para cada necessidade técnica.';
          areaActionLabel = '⚖️ Como Comparar Ferramentas';
        } else if (toRoute === 'dashboard') {
          areaExplanation = 'Este é o Painel de Controle Executivo. Ele consolida o progresso de todos os seus projetos, o funil de maturidade e as atividades mais recentes do Hub.';
          areaActionLabel = '📊 Entender os Indicadores';
        }

        if (areaExplanation) {
          return {
            decision: 'TEACH',
            priority: 'medium',
            reason: `Primeira visita à área "${toRoute}". Central oferece tour orientador compatível com o perfil.`,
            topicKey: `intro_${toRoute}`,
            messageText: `${areaExplanation}`,
            suggestedActions: [
              { label: areaActionLabel, actionType: 'TEACH_AREA', target: toRoute },
              { label: 'Entendi, obrigado', actionType: 'DISMISS' },
            ],
          };
        }
      }
    }
  }

  // =========================================================================
  // 6. EVENTO: USUÁRIO RETORNOU AO HUB (Retomada Inteligente de Projeto Ativo)
  // =========================================================================
  if (event.type === 'user_returned') {
    // Busca se há algum projeto em desenvolvimento com próxima ação definida
    const activeProjectWithNext = allProjects.find(
      (p) => p.status === 'Em desenvolvimento' && p.nextAction && p.nextAction.length > 5
    );

    if (activeProjectWithNext) {
      const topicKey = `resume_proj_${activeProjectWithNext.id}`;
      if (!hasRecentlyAskedTopic(topicKey, 1000 * 60 * 120)) { // 2 horas de cooldown
        recordProactiveQuestion(topicKey, `Retomada do projeto ${activeProjectWithNext.name}`);

        return {
          decision: 'ASK',
          priority: 'medium',
          reason: 'Usuário retornou ao Hub. Central sugere retomar projeto em andamento onde parou.',
          topicKey,
          messageText: `Quer retomar o projeto "${activeProjectWithNext.name}"?\n\nParamos na etapa "${activeProjectWithNext.currentStage || 'em andamento'}" e a próxima ação planejada é:\n👉 "${activeProjectWithNext.nextAction}".`,
          suggestedActions: [
            { label: '🚀 Continuar Este Projeto', actionType: 'OPEN_PROJECT', target: activeProjectWithNext.id },
            { label: '📋 Ver Missões do Projeto', actionType: 'VIEW_PROJECT_MISSIONS', target: activeProjectWithNext.id },
            { label: 'Mais tarde', actionType: 'DISMISS' },
          ],
        };
      }
    }
  }

  // =========================================================================
  // 7. REGRA GERAL: SILÊNCIO INTELIGENTE
  // =========================================================================
  recordSilenceDecision();
  return {
    decision: 'SILENCE',
    priority: 'low',
    reason: 'Nenhuma ação relevante com alto valor identificada no momento. Silêncio inteligente preservado.',
  };
}
