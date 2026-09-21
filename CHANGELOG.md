# Changelog - HUB 2.0 — Central Estratégica de IAs

Todas as alterações notáveis deste projeto são registradas neste arquivo.

---

## [2.1.0] - 2026-09-21

### ✨ Perfil Adaptativo do Usuário (Central de IA Estratégica)

Implementação do sistema dinâmico de adaptação do comportamento e participação da Central de IA conforme o nível de experiência do usuário com Inteligência Artificial.

#### Principais Recursos Adicionados:
- **Onboarding e Calibração Inicial Natural**:
  - Na primeira interação relevante em que o perfil do usuário ainda não possui o nível declarado, a Central acolhe com a pergunta: *"Antes de começarmos, qual é o seu nível de experiência com IA?"*.
  - Apresentação de opções interativas com 1 clique:
    - **INICIANTE**: Orientação didática, conceitos fundamentais antes de jargões técnicos, sugestão de próximos passos e antecipação de dúvidas.
    - **INTERMEDIÁRIO**: Equilíbrio estratégico entre execução e fundamentação, explicações de trade-offs sob demanda e alternativas comparativas.
    - **AVANÇADO**: Comunicação direta, objetiva e de alta densidade técnica (APIs, arquitetura, pipelines, latência e custo), com autonomia operacional em operações de baixo risco.
- **Adaptação Dinâmica em Tempo Real**:
  - O analisador de intenções (`intentAnalyzer.ts`) interpreta comandos imediatos como:
    - *"Explique isso como se eu estivesse começando"* -> Reduz abstração e ensina passo a passo.
    - *"Não precisa explicar tanto"* / *"Vá direto ao ponto"* -> Aumenta concisão e remove preâmbulos.
    - *"Quero entender por que você fez isso"* -> Detalha a justificativa lógica e técnica da ação tomada.
  - A preferência explícita mais recente prevalece dinamicamente.
- **Reutilização da Estrutura de Memória e Perfil Existente**:
  - Armazenamento persistido integrado às funções existentes (`getUserAdaptiveProfile` e `saveUserAdaptiveProfile` no `authService.ts`), sem criação de sistemas paralelos ou redundantes.
- **Princípio Fundamental & Dimensões de Participação**:
  - A Central não apenas personaliza o que diz, mas **como participa**: calibra quanto explica, quando pergunta, quando sugere, quando ensina, quando se aprofunda, quando fica em silêncio e quanto de autonomia operacional assume.
  - **Motor de Iniciativa Personalizado**: Sugestões de próximas ações e proatividade calibradas por nível (Iniciante: acompanhamento próximo e recursos de estudo; Intermediário: equilíbrio estratégico e maturidade; Avançado: objetividade e foco em execução sem ruído invasivo).
- **Transparência e Controle Visual**:
  - Nova aba **"👤 Perfil Adaptativo de IA"** no modal de memória operacional (`AssistantMemoryModal.tsx`), permitindo visualizar profundidade, estilo e proatividade ativos, além de alternar o nível a qualquer momento.
  - Indicador dinâmico no cabeçalho do `CentralAICoordinator.tsx` com o nível atual e atalho direto para recalibração.

#### Arquivos Modificados / Atualizados:
- `src/types.ts`: Definições tipadas de `UserAdaptiveProfile`, `AIExperienceLevel`, `ExplanationDepth`, `PreferredInteractionStyle` e `ProactivityLevel`.
- `src/services/authService.ts`: Funções de persistência e leitura integradas ao perfil do usuário no Firestore/LocalStorage.
- `src/services/assistant/intentAnalyzer.ts`: Detecção de comandos dinâmicos de calibração de profundidade e estilo na linguagem natural.
- `src/services/assistant/promptBuilder.ts`: Injeção contextual das diretrizes comportamentais específicas por nível de experiência na instrução do sistema.
- `src/services/assistant/assistantEngine.ts`: Orquestração da calibração automática, respostas guiadas por nível e roteamento de ações.
- `src/components/CentralAICoordinator.tsx`: Interface de boas-vindas com botões de seleção rápida e badge interativo no cabeçalho.
- `src/components/strategic/AssistantMemoryModal.tsx`: Aba dedicada para gestão, visualização e calibração das diretrizes do perfil adaptativo.
