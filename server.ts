import express from 'express';
import path from 'path';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import {
  orchestrateExecution,
  getOrchestratorDiagnostics,
  runIndividualEngineTest,
} from './api/_shared/orchestratorCore';
import { handleGroqCommand } from './api/_shared/commandHandler';
import { GROQ_MODELS, DEFAULT_GROQ_MODEL, executeGroq } from './api/_shared/groqAdapter';
import { GEMINI_MODELS, DEFAULT_GEMINI_MODEL, executeGemini } from './api/_shared/geminiAdapter';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// CORS local para ambiente de desenvolvimento
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 1. ENDPOINT CENTRAL DE ORQUESTRAÇÃO DE IA (GEMINI PRINCIPAL + GROQ AUXILIAR)
app.post('/api/orchestrate', async (req, res) => {
  try {
    const result = await orchestrateExecution(req.body || {});
    res.json(result);
  } catch (err: any) {
    console.error('[Server /api/orchestrate error]:', err);
    res.status(500).json({
      success: false,
      data: null,
      providerUsed: 'SYSTEM-FALLBACK',
      modelUsed: 'none',
      status: 'erro',
      fallbackTriggered: false,
      primaryError: err?.message || 'Erro interno na orquestração.',
      diagnostic: {
        message: 'Falha no processador central.',
        probableCause: err?.message,
      },
      latencyMs: 0,
    });
  }
});

// 2. DIAGNÓSTICO DO ESTADO DOS MOTORES
app.get('/api/orchestrator/status', (req, res) => {
  const diag = getOrchestratorDiagnostics();
  res.json(diag);
});

// 3. TESTE INDIVIDUAL DOS MOTORES DE IA
app.all('/api/orchestrator/test', async (req, res) => {
  const engine = (req.body?.engine || req.query?.engine || 'GEMINI') as 'GEMINI' | 'GROQ';
  if (engine !== 'GEMINI' && engine !== 'GROQ') {
    res.status(400).json({ error: 'Parâmetro "engine" deve ser "GEMINI" ou "GROQ".' });
    return;
  }

  try {
    const testResult = await runIndividualEngineTest(engine);
    res.json(testResult);
  } catch (err: any) {
    res.status(500).json({
      provider: engine,
      status: 'erro',
      testPassed: false,
      message: '✕ MOTOR COM ERRO',
      diagnostic: `Erro durante teste do motor: ${err?.message || 'Falha desconhecida'}`,
      latencyMs: 0,
    });
  }
});

// 4. RETROCOMPATIBILIDADE: STATUS GROQ
app.get('/api/groq/status', (req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  const isConfigured = Boolean(groqKey && groqKey.startsWith('gsk_'));

  res.json({
    status: isConfigured ? 'ok' : 'unconfigured',
    configured: isConfigured,
    engine: 'Groq Cloud Inference',
    models: GROQ_MODELS,
    defaultModel: DEFAULT_GROQ_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// 5. RETROCOMPATIBILIDADE: COMANDOS GROQ COM RESILIÊNCIA E FALLBACK
app.post('/api/groq/command', async (req, res) => {
  const { action, payload } = req.body || {};

  if (!action) {
    res.status(400).json({ error: 'Parâmetro "action" é obrigatório.' });
    return;
  }

  try {
    const result = await handleGroqCommand(action, payload);
    res.json(result);
  } catch (error: any) {
    console.error(`[Server /api/groq/command error - ${action}]:`, error);
    res.status(500).json({
      success: false,
      fallback: true,
      error: error?.message || 'Erro ao processar comando de IA.',
    });
  }
});

// 6. RETROCOMPATIBILIDADE: DESCOBERTA E CURADORIA DE IAS
app.post('/api/groq/discover', async (req, res) => {
  try {
    const { taskDescription, currentCatalogIAs } = req.body || {};

    if (!taskDescription || typeof taskDescription !== 'string') {
      res.status(400).json({ error: 'taskDescription é obrigatório' });
      return;
    }

    const existingNamesList = Array.isArray(currentCatalogIAs)
      ? currentCatalogIAs.map((item: any) => `${item.name} (${item.url || ''})`).join(', ')
      : '';

    const systemPrompt = `Você é o Curador Oficial de Inteligências Artificiais do "HUB ESTRATÉGICO DE IAs".
Indique de 1 a 3 ferramentas reais existentes para a tarefa solicitada.
Retorne obrigatoriamente um objeto JSON com chave "candidates".`;

    const userPrompt = `TAREFA: "${taskDescription}"\nCATÁLOGO JÁ EXISTENTE: ${existingNamesList || 'Nenhum'}`;

    // Tenta Groq com fallback para Gemini
    let execRes = await executeGroq({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      maxTokens: 2500,
    });

    if (!execRes.success) {
      execRes = await executeGemini({
        systemPrompt,
        userPrompt,
        jsonMode: true,
      });
    }

    if (!execRes.success) {
      res.status(502).json({
        success: false,
        fallback: true,
        error: execRes.error || 'Falha na descoberta de IAs.',
      });
      return;
    }

    const parsed = execRes.parsed || {};
    const candidates = Array.isArray(parsed.candidates)
      ? parsed.candidates
      : Array.isArray(parsed)
      ? parsed
      : [];

    res.json({
      success: true,
      candidates,
      modelUsed: execRes.modelUsed,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      fallback: true,
      error: err?.message || 'Erro no servidor de curadoria.',
    });
  }
});

// 7. MIDDLEWARE VITE E INICIALIZAÇÃO DO SERVIDOR
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HUB ESTRATÉGICO DE IAs] Servidor rodando com sucesso na porta ${PORT}`);
  });
}

startServer();
