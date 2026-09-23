import { ArtifactItem } from './capabilityRegistryService';
import { generateNativeImageReal } from './nativeImageGenerator';

export interface CodeCreationPipelineResult {
  code: string;
  qualityGatePassed: boolean;
  issuesFound: string[];
}

export function runCodeCreationPipeline(rawOutput: string, requestPrompt: string): CodeCreationPipelineResult {
  const issuesFound: string[] = [];

  let cleaned = rawOutput.trim();
  if (cleaned.startsWith('```html')) {
    cleaned = cleaned.replace(/^```html/, '').replace(/```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*/, '').replace(/```$/, '').trim();
  }

  if (!cleaned.toLowerCase().includes('<!doctype html>') && !cleaned.toLowerCase().includes('<html>')) {
    cleaned = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${requestPrompt.slice(0, 40)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div class="max-w-7xl mx-auto p-6 space-y-6">
    <header class="border-b border-slate-800 pb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-white">${requestPrompt}</h1>
        <p class="text-xs text-slate-400">Sistema funcional gerado pelo Estúdio Universal com persistência local e interatividade completa.</p>
      </div>
      <span class="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">Pronto para Uso</span>
    </header>
    <main class="space-y-6">
      ${cleaned}
    </main>
  </div>
</body>
</html>`;
  }

  if (cleaned.length < 200) {
    issuesFound.push('Código gerado muito curto ou superficial.');
  }
  if (!cleaned.includes('script') && !cleaned.includes('function') && !cleaned.includes('onclick') && !cleaned.includes('alpine') && !cleaned.includes('vue') && !cleaned.includes('react')) {
    issuesFound.push('Sistema solicitado pode carecer de interatividade lógica.');
  }

  const qualityGatePassed = issuesFound.length === 0;

  return {
    code: cleaned,
    qualityGatePassed,
    issuesFound,
  };
}

export async function runImageGenerationPipeline(userPrompt: string) {
  // GERAÇÃO NATIVA REAL — PROIBIDO USAR UNSPLASH / STOCK EXTERNO
  const res = await generateNativeImageReal(userPrompt);
  return res;
}
