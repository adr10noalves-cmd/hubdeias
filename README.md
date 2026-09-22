# Hub Estratégico & Mestre Universal 🚀

Sistema completo de Gestão Estratégica, Projetos, Ideias, Estudos e Inteligência Artificial Avançada (Mestre Universal), desenvolvido em React 18, TypeScript, Tailwind CSS e Node.js/Express.

## 🌟 Principais Recursos

- **Mestre Universal do Hub**: Camada de inteligência generalista de alto nível com múltiplos modos de especialidade (Programador, Arquiteto, Pesquisador, Professor, Estrategista, Criador), capaz de conversar sobre qualquer tema, gerar código, planejar e executar ações.
- **Área de Projetos & Executor**: Gestão completa de ciclos de vida de projetos, missões, decisões estratégicas, roadmaps, deliverables, testes e versões.
- **Central de Ideias & Memória Estratégica**: Salvamento, recuperação e vinculação inteligente de ideias com persistência em tempo real.
- **Catálogo & Cadastro de IAs**: Ecossistema de inteligências artificiais com orquestração dinâmica.
- **Arquitetura Full-Stack**: Servidor Express integrado com Vite, suporte ao SDK Gemini e fallback para inferência avançada.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **Banco de Dados / Persistência**: Firebase Firestore & LocalStorage.
- **IA / Orquestração**: Google GenAI SDK (`@google/genai`) & Orquestrador customizado.

---

## 📦 Como Instalar e Executar Localmente

1. **Pré-requisitos**:
   - Node.js (v18+) instalado.
   - Gerenciador de pacotes npm.

2. **Instalar dependências**:
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**:
   Copie o arquivo `.env.example` para `.env` e preencha suas chaves:
   ```bash
   cp .env.example .env
   ```

4. **Executar em modo de desenvolvimento**:
   ```bash
   npm run dev
   ```
   O aplicativo estará disponível em `http://localhost:3000`.

5. **Gerar build de produção**:
   ```bash
   npm run build
   ```

---

## 🚀 CI/CD & GitHub Actions

Este repositório inclui workflows configurados em `.github/workflows/ci.yml` para validação automática de tipos (`tsc`) e build de produção a cada push ou pull request.

---

## 📄 Licença

Distribuído sob a licença MIT.
