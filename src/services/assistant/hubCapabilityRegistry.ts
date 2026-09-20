import { UserRole } from '../../types';

export interface HubCapability {
  id: string;
  name: string;
  description: string;
  route: string;
  section?: string;
  actions: string[];
  requiredPermissions: UserRole[];
  keywords: string[];
  contextHelp: string;
  toolsAvailable: string[];
}

/**
 * REGISTRO CENTRAL DE CAPACIDADES DO HUB 2.0
 * Fonte de verdade estruturada para que o Orquestrador / Auxiliar Mestre
 * conheça profundamente todas as áreas, permissões, objetivos e ações possíveis.
 */
export const HUB_CAPABILITIES: HubCapability[] = [
  {
    id: 'catalog',
    name: 'Catálogo de IAs',
    description: 'Repositório operacional de todas as ferramentas de Inteligência Artificial cadastradas no Hub.',
    route: 'catalog',
    actions: [
      'Visualizar todas as IAs cadastradas',
      'Filtrar por categoria (Texto, Imagem, Vídeo, Código, etc.)',
      'Filtrar por nível de experiência (Iniciante, Intermediário, Avançado)',
      'Filtrar por modelo de preço (Gratuito, Freemium, Pago)',
      'Buscar IAs por palavras-chave, diferenciais ou casos de uso',
      'Abrir a Ficha Operacional de qualquer IA',
      'Adicionar IAs para comparação lado a lado',
      'Cadastrar uma nova IA no catálogo',
      'Editar ou excluir IAs existentes',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER', 'GUEST'],
    keywords: ['catálogo', 'catalogo', 'ferramentas', 'ias', 'inteligencias', 'modelos', 'ia de codigo', 'ia de imagem', 'buscar ia'],
    contextHelp: 'Esta é a biblioteca principal de IAs do Hub. Use os filtros superiores para segmentar por categoria ou nível, ou clique em qualquer card para ver a Ficha Operacional.',
    toolsAvailable: ['search_ai_catalog', 'navigate_to', 'create_ai_entry'],
  },
  {
    id: 'projects',
    name: 'Gestão de Projetos Estratégicos',
    description: 'Central onde os projetos reais do usuário são acompanhados, organizados por maturidade e executados.',
    route: 'projects',
    actions: [
      'Listar todos os projetos em andamento, teste, desenvolvimento ou concluídos',
      'Criar novo projeto com objetivo, resultado esperado e ferramentas vinculadas',
      'Filtrar projetos por status da jornada de maturidade',
      'Visualizar barra de progresso e próxima ação de cada projeto',
      'Abrir a visão aprofundada do Projeto (Agente Executor, Missões e Decisões)',
      'Excluir projetos',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER'],
    keywords: ['projetos', 'projeto', 'execução', 'meus projetos', 'gerenciar projetos', 'novo projeto', 'maturidade'],
    contextHelp: 'Área de acompanhamento executivo dos seus projetos reais. Mostra o funil de maturidade e os marcos de cada iniciativa.',
    toolsAvailable: ['navigate_to', 'open_project', 'search_hub'],
  },
  {
    id: 'project_detail',
    name: 'Agente Executor & Detalhes do Projeto',
    description: 'Ambiente operacional detalhado de um projeto específico, contendo Terminal de Debate com Gemini, Missões, Decisões Técnicas, Roadmap e Sugestões.',
    route: 'projects',
    section: 'project_detail',
    actions: [
      'Debater estratégias e códigos diretamente com o Executor Gemini Pro',
      'Gerenciar Missões (tarefas em andamento, pendentes, concluídas com prioridade)',
      'Registrar e validar Decisões Técnicas e Arquiteturais',
      'Visualizar e avançar a Próxima Ação Imediata (Widget de Próxima Ação)',
      'Acompanhar o Roadmap em etapas de evolução',
      'Consultar a explicação pedagógica da Etapa Atual ("Entender esta Etapa")',
      'Registrar aprendizados na memória do projeto',
      'Converter sugestões de IA em novas missões de trabalho',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER'],
    keywords: ['executor', 'detalhes do projeto', 'missões', 'missoes', 'decisões', 'decisoes', 'roadmap', 'etapa atual', 'próxima ação', 'proxima acao'],
    contextHelp: 'Você está dentro do Agente Executor do projeto. Aqui você interage com a IA sobre o objetivo, resolve decisões pendentes e avança as missões.',
    toolsAvailable: ['get_current_project', 'get_project_status', 'get_project_missions', 'get_project_decisions', 'navigate_to'],
  },
  {
    id: 'ideas',
    name: 'Central de Ideias & Projetos Conceituais',
    description: 'Banco de ideação, incubação de projetos e histórico de evolução conceitual.',
    route: 'ideas',
    actions: [
      'Registrar novas ideias de soluções, negócios ou ferramentas',
      'Filtrar ideias por estágio e prioridade',
      'Avançar versões conceituais de ideias (V1, V2, etc.)',
      'Vincular tecnologias e IAs recomendadas a uma ideia',
      'Registrar aprendizados e obstáculos superados',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER'],
    keywords: ['ideias', 'ideia', 'central de ideias', 'conceito', 'incubaçao', 'novas ideias'],
    contextHelp: 'Espaço para registrar e maturar ideias antes de transformá-las em projetos consolidados.',
    toolsAvailable: ['navigate_to', 'search_hub'],
  },
  {
    id: 'studies',
    name: 'Banco de Estudos Tecnológicos',
    description: 'Base de conhecimento de temas, tecnologias e conceitos estudados pelo usuário.',
    route: 'studies',
    actions: [
      'Criar fichas de estudo sobre modelos de IA, linguagens, arquiteturas e frameworks',
      'Acompanhar progresso percentual de estudo de cada tema',
      'Registrar anotações, referências e aprendizados adquiridos',
      'Filtrar estudos por nível de complexidade',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER', 'GUEST'],
    keywords: ['estudos', 'estudo', 'banco de estudos', 'aprendizado', 'pesquisa', 'conhecimento'],
    contextHelp: 'Área dedicada à documentação do seu aprendizado e pesquisa sobre tecnologias e inteligências artificiais.',
    toolsAvailable: ['navigate_to', 'search_hub'],
  },
  {
    id: 'diary',
    name: 'Diário de Bordo & Evolução',
    description: 'Linha do tempo consolidada de percepções, descobertas, obstáculos e decisões estratégicas de todos os projetos.',
    route: 'diary',
    actions: [
      'Visualizar registros cronológicos de evolução',
      'Filtrar logs por tipo: Descoberta, Obstáculo, Decisão Estratégica, Marco',
      'Compreender o histórico acumulado de reflexões da equipe',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER'],
    keywords: ['diario', 'diário', 'diário de bordo', 'pensamentos', 'descobertas', 'histórico geral', 'linha do tempo'],
    contextHelp: 'Reúne os pensamentos e marcos registrados ao longo do desenvolvimento de todas as suas iniciativas.',
    toolsAvailable: ['navigate_to'],
  },
  {
    id: 'dashboard',
    name: 'Dashboard de Indicadores & Métricas',
    description: 'Painel executivo com visão holística da maturidade de projetos, funil de ideias, ritmo de evolução e alertas.',
    route: 'dashboard',
    actions: [
      'Analisar funil de maturidade (Ideia -> Planejamento -> Desenvolvimento -> Produção)',
      'Verificar distribuição de esforço e estudos ativos',
      'Identificar gargalos ou projetos sem próxima ação definida',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER'],
    keywords: ['dashboard', 'metricas', 'métricas', 'indicadores', 'graficos', 'estatisticas', 'visão executiva'],
    contextHelp: 'Apresenta relatórios visuais sobre o ritmo de entrega e o estado dos seus projetos e estudos.',
    toolsAvailable: ['navigate_to'],
  },
  {
    id: 'master',
    name: 'O Mestre do Sistema',
    description: 'Visão executiva e estratégica do ecossistema, orientando tomadas de decisão de alto nível.',
    route: 'master',
    actions: [
      'Consultar diretrizes estratégicas de negócio e tecnologia',
      'Alinhamento dos objetivos com as melhores práticas de IA',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR'],
    keywords: ['mestre', 'mestre do sistema', 'liderança', 'estrategia', 'governanca'],
    contextHelp: 'Painel estratégico de supervisão de alto nível do Hub.',
    toolsAvailable: ['navigate_to'],
  },
  {
    id: 'receptor',
    name: 'Receptor Mestre',
    description: 'Canal de entrada e triagem de novas demandas, dados externos e estímulos para o ecossistema.',
    route: 'receptor',
    actions: [
      'Receber novos inputs e qualificá-los',
      'Direcionar estímulos para projetos existentes ou novos estudos',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER'],
    keywords: ['receptor', 'receptor mestre', 'triagem', 'entrada de dados', 'demandas'],
    contextHelp: 'Ponto de captura e triagem de novas solicitações e insumos.',
    toolsAvailable: ['navigate_to'],
  },
  {
    id: 'comparator',
    name: 'Comparador de IAs Lado a Lado',
    description: 'Modal de comparação analítica entre duas ou mais ferramentas de IA cadastradas.',
    route: 'modal',
    section: 'compare_modal',
    actions: [
      'Comparar diferenciais, prós, contras, preços e especialidades entre 2 a 4 IAs',
      'Exportar ou limpar comparação',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER', 'GUEST'],
    keywords: ['comparar', 'comparador', 'versus', 'vs', 'qual melhor entre', 'comparar ias'],
    contextHelp: 'Permite colocar até 4 modelos de IA lado a lado para avaliar prós, contras, custos e especialidades.',
    toolsAvailable: ['navigate_to'],
  },
  {
    id: 'motor_estrategico',
    name: 'Motor Estratégico ("Qual IA devo usar?")',
    description: 'Assistente consultor especializado em orientar a melhor escolha de IA para uma necessidade pontual.',
    route: 'modal',
    section: 'motor_modal',
    actions: [
      'Descrever uma necessidade em linguagem natural e receber 3 recomendações ranqueadas',
      'Explorar árvore de decisão por objetivo (Texto, Imagem, Dados, Código)',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER', 'GUEST'],
    keywords: ['motor', 'motor estratégico', 'qual ia usar', 'recomendar', 'escolher ia', 'qual a melhor'],
    contextHelp: 'Diga o que você precisa fazer e o motor aponta a melhor ferramenta do catálogo com justificativa.',
    toolsAvailable: ['navigate_to', 'search_ai_catalog'],
  },
  {
    id: 'cadastro_ia',
    name: 'Cadastro de Nova IA',
    description: 'Formulário oficial para adicionar uma nova inteligência artificial ao catálogo.',
    route: 'modal',
    section: 'add_ia_modal',
    actions: [
      'Cadastrar nome, categoria, nível, especialidade, preço, link oficial e diferenciais de uma IA',
      'Salvar diretamente no Firestore e localStorage',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR'],
    keywords: ['cadastrar ia', 'adicionar ia', 'nova ia', 'incluir ferramenta', 'salvar ia'],
    contextHelp: 'Abre o formulário para registrar uma nova ferramenta no banco de dados do catálogo.',
    toolsAvailable: ['create_ai_entry', 'navigate_to'],
  },
  {
    id: 'security_center',
    name: 'Centro de Segurança & Guardião',
    description: 'Módulo de gestão de acessos, papéis de usuário (Admin/Operador/Usuário), logs de segurança e sessões.',
    route: 'modal',
    section: 'security_center_modal',
    actions: [
      'Gerenciar contas de usuários e permissões de acesso',
      'Visualizar trilha de auditoria de eventos de segurança',
      'Configurar autenticação com senha ou Passkey FIDO2',
    ],
    requiredPermissions: ['ADMIN'],
    keywords: ['segurança', 'usuarios', 'permissões', 'guardiao', 'senhas', 'auditoria'],
    contextHelp: 'Área restrita a Administradores para gestão de credenciais e auditoria de segurança.',
    toolsAvailable: ['navigate_to'],
  },
  {
    id: 'busca_global',
    name: 'Busca Inteligente Cruzada (Ctrl+K)',
    description: 'Buscador universal em tempo real que localiza IAs, ideias, projetos e estudos instantaneamente.',
    route: 'modal',
    section: 'global_search_modal',
    actions: [
      'Buscar em todo o ecossistema com uma única pesquisa',
      'Navegar com teclas de seta e abrir o registro desejado',
    ],
    requiredPermissions: ['ADMIN', 'OPERATOR', 'USER', 'GUEST'],
    keywords: ['busca', 'pesquisa', 'ctrl k', 'procurar', 'localizar'],
    contextHelp: 'Atalho rápido para encontrar qualquer entidade dentro do Hub.',
    toolsAvailable: ['search_hub', 'navigate_to'],
  },
];

/**
 * Funções utilitárias de consulta ao mapa de capacidades
 */
export function getAllCapabilities(): HubCapability[] {
  return HUB_CAPABILITIES;
}

export function findCapabilityById(id: string): HubCapability | undefined {
  return HUB_CAPABILITIES.find((c) => c.id === id);
}

export function findCapabilityByRoute(route: string, section?: string): HubCapability | undefined {
  if (section) {
    const match = HUB_CAPABILITIES.find((c) => c.route === route && c.section === section);
    if (match) return match;
  }
  return HUB_CAPABILITIES.find((c) => c.route === route);
}

export function searchCapabilities(query: string): HubCapability[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return HUB_CAPABILITIES.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q) || q.includes(k)) ||
      c.actions.some((a) => a.toLowerCase().includes(q))
    );
  });
}

/**
 * Gera um resumo conciso e estruturado das capacidades do Hub para injeção no prompt do Orquestrador.
 * Mantém o tamanho do prompt sob controle, oferecendo a visão exata do que existe no Hub.
 */
export function getCapabilitiesSummaryForPrompt(userRole: UserRole = 'USER'): string {
  const accessible = HUB_CAPABILITIES.filter((c) => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'OPERATOR') return !c.requiredPermissions.includes('ADMIN') || c.requiredPermissions.includes('OPERATOR');
    return c.requiredPermissions.includes('USER') || c.requiredPermissions.includes('GUEST');
  });

  return accessible
    .map((c) => {
      const actionsList = c.actions.slice(0, 3).join('; ');
      return `• [${c.id}] ${c.name} (Rota: "${c.route}"): ${c.description} Ações principais: ${actionsList}.`;
    })
    .join('\n');
}
