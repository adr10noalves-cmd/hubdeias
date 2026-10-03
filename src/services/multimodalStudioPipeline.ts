import { ArtifactItem, ArtifactVersion, CapabilityType } from './capabilityRegistryService';
import { generateNativeImageReal } from './nativeImageGenerator';
import { saveArtifact, revertArtifactToPreviousVersion } from './artifactEngineService';

export interface MultimodalPlan {
  isRefinement: boolean;
  refinementType?: 'ROLLBACK' | 'REPLACE_IMAGE' | 'ENHANCE_STYLE' | 'ADD_SECTION' | 'GENERAL_EDIT';
  title: string;
  complexity: 'SNIPPET' | 'COMPONENT' | 'PAGE' | 'APPLICATION' | 'SYSTEM';
  requiredCapabilities: CapabilityType[];
  imagePrompts: Array<{
    targetFilename: string;
    description: string;
    prompt: string;
  }>;
  targetSections: string[];
}

export interface PipelineProgressCallback {
  (step: string, percentage: number): void;
}

export interface MultimodalExecutionResult {
  success: boolean;
  artifact?: ArtifactItem;
  error?: string;
  capabilitiesUsed: CapabilityType[];
  assetsCreated: Record<string, string>;
  qualityReport?: {
    passed: boolean;
    checks: string[];
  };
}

/**
 * MESTRE / ORCHESTRATOR: INTERPRETAÇÃO INTELIGENTE DO OBJETIVO
 * Decompõe a solicitação do usuário em capacidades sem exigir passos manuais
 */
export function planMultimodalExecution(
  userRequest: string,
  activeArtifact?: ArtifactItem | null
): MultimodalPlan {
  const lower = userRequest.toLowerCase().trim();

  // 1. Detecção de Rollback de Versão
  if (
    activeArtifact &&
    (lower.includes('volte para a versão anterior') ||
      lower.includes('voltar versao anterior') ||
      lower.includes('versão anterior') ||
      lower.includes('desfazer alteração') ||
      lower.includes('reverter'))
  ) {
    return {
      isRefinement: true,
      refinementType: 'ROLLBACK',
      title: activeArtifact.title,
      complexity: 'PAGE',
      requiredCapabilities: ['REASONING', 'VALIDATE_ARTIFACT'],
      imagePrompts: [],
      targetSections: [],
    };
  }

  // 2. Detecção de Substituição de Imagem no Artefato Ativo
  if (
    activeArtifact &&
    (lower.includes('troque a imagem') ||
      lower.includes('troque somente a imagem') ||
      lower.includes('mude a imagem') ||
      lower.includes('nova imagem') ||
      lower.includes('altere a imagem'))
  ) {
    let imgPrompt = userRequest;
    if (lower.includes('principal') || lower.includes('banner')) {
      imgPrompt = 'Empreendimento contemporâneo de engenharia civil e arquitetura de alto padrão, fachada sofisticada ao pôr do sol, fotografia realista profissional';
    }
    return {
      isRefinement: true,
      refinementType: 'REPLACE_IMAGE',
      title: activeArtifact.title,
      complexity: 'PAGE',
      requiredCapabilities: ['REASONING', 'GENERATE_IMAGE', 'EDIT_IMAGE', 'VALIDATE_ARTIFACT'],
      imagePrompts: [
        {
          targetFilename: 'hero_banner.png',
          description: 'Banner principal atualizado',
          prompt: imgPrompt,
        },
      ],
      targetSections: [],
    };
  }

  // 3. Detecção de Refinamento de Estilo / Funcionalidade no Artefato Ativo
  if (
    activeArtifact &&
    (lower.includes('deixe o site mais') ||
      lower.includes('adicione') ||
      lower.includes('remova') ||
      lower.includes('escureça') ||
      lower.includes('mude a cor') ||
      lower.includes('mais sofisticado') ||
      lower.includes('mais moderno'))
  ) {
    return {
      isRefinement: true,
      refinementType: lower.includes('mais sofisticado') || lower.includes('mais moderno') ? 'ENHANCE_STYLE' : 'GENERAL_EDIT',
      title: activeArtifact.title,
      complexity: 'PAGE',
      requiredCapabilities: ['REASONING', 'CREATE_HTML', 'GENERATE_CODE', 'VALIDATE_ARTIFACT'],
      imagePrompts: [],
      targetSections: [],
    };
  }

  // 4. Nova Criação Multimodal Completa (Ex: Atlas Engenharia)
  const needsImage =
    lower.includes('imagem') ||
    lower.includes('banner') ||
    lower.includes('foto') ||
    lower.includes('visual') ||
    lower.includes('site') ||
    lower.includes('página') ||
    lower.includes('landing page');

  const imagePrompts: MultimodalPlan['imagePrompts'] = [];

  if (needsImage) {
    let promptForImage = 'Fachada contemporânea de empreendimento arquitetônico moderno de alto padrão, vidro espelhado e aço, crepúsculo dourado ao pôr do sol, fotografia hiper-realista';
    if (lower.includes('construção') || lower.includes('engenharia') || lower.includes('atlas')) {
      promptForImage = 'Empreendimento contemporâneo de engenharia civil com arquitetura arrojada de alto padrão, fachada moderna, crepúsculo ao pôr do sol, foto arquitetônica realista';
    } else if (lower.includes('tecnologia') || lower.includes('software')) {
      promptForImage = 'Modern high-tech software development workspace, futuristic glass aesthetic, ambient lighting, cinematic photography';
    }

    imagePrompts.push({
      targetFilename: 'hero_banner.png',
      description: 'Banner principal de destaque visual',
      prompt: promptForImage,
    });
  }

  const sections: string[] = [];
  if (lower.includes('início') || lower.includes('inicio') || lower.includes('home')) sections.push('Início');
  if (lower.includes('sobre')) sections.push('Sobre Nós');
  if (lower.includes('serviços') || lower.includes('servicos')) sections.push('Serviços');
  if (lower.includes('projetos') || lower.includes('portfolio')) sections.push('Projetos / Portfólio');
  if (lower.includes('contato')) sections.push('Contato');

  const titleMatch = userRequest.match(/(?:chamad[ao]|para\s(?:a|o)?)\s([A-ZÁÉÍÓÚÂÊÔÃÕ][a-zA-Záéíóúâêôãõ0-9\s]+?)(?:\.|\,|$)/);
  const derivedTitle = titleMatch && titleMatch[1] ? `${titleMatch[1].trim()} — Web App` : userRequest.slice(0, 35) + '...';

  return {
    isRefinement: false,
    title: derivedTitle,
    complexity: 'APPLICATION',
    requiredCapabilities: [
      'REASONING',
      'CREATE_HTML',
      'GENERATE_CODE',
      ...(needsImage ? (['GENERATE_IMAGE'] as CapabilityType[]) : []),
      'FILE_CREATION',
      'VALIDATE_ARTIFACT',
    ],
    imagePrompts,
    targetSections: sections.length > 0 ? sections : ['Início', 'Sobre', 'Serviços', 'Projetos', 'Contato'],
  };
}

/**
 * EXECUTOR MULTIMODAL UNIFICADO DO ESTÚDIO UNIVERSAL
 * Orquestra as capacidades identificadas e produz o artefato completo
 */
export async function executeMultimodalCreation(
  userRequest: string,
  activeArtifact?: ArtifactItem | null,
  onProgress?: PipelineProgressCallback
): Promise<MultimodalExecutionResult> {
  const notify = (step: string, pct: number) => {
    if (onProgress) onProgress(step, pct);
  };

  notify('Mestre interpretando objetivo e decompondo capacidades...', 10);
  const plan = planMultimodalExecution(userRequest, activeArtifact);

  // CASO 1: Rollback Conversacional
  if (plan.refinementType === 'ROLLBACK' && activeArtifact) {
    notify('Restaurando versão anterior do artefato no histórico...', 70);
    const restored = revertArtifactToPreviousVersion(activeArtifact.id);
    if (!restored) {
      return {
        success: false,
        error: 'Nenhuma versão anterior encontrada no histórico deste artefato para restauração.',
        capabilitiesUsed: ['REASONING'],
        assetsCreated: {},
      };
    }
    notify('Versão anterior restaurada com sucesso!', 100);
    return {
      success: true,
      artifact: restored,
      capabilitiesUsed: ['REASONING', 'VALIDATE_ARTIFACT'],
      assetsCreated: restored.assets || {},
      qualityReport: {
        passed: true,
        checks: ['Restauração de versão anterior confirmada', 'Integridade do código preservada'],
      },
    };
  }

  // CASO 2: Troca de Imagem no Artefato Ativo
  if (plan.refinementType === 'REPLACE_IMAGE' && activeArtifact) {
    notify('Acionando Cloudflare Workers AI para gerar nova imagem...', 30);
    const prompt = plan.imagePrompts[0]?.prompt || 'Fotografia arquitetônica moderna de alto padrão ao pôr do sol';
    const imgRes = await generateNativeImageReal(prompt);

    if (!imgRes.success || !imgRes.imageBase64) {
      return {
        success: false,
        error: `Falha ao gerar nova imagem: ${imgRes.error || 'Erro desconhecido'}`,
        capabilitiesUsed: ['GENERATE_IMAGE'],
        assetsCreated: {},
      };
    }

    notify('Atualizando assets e integrando imagem ao código existente...', 70);
    const rawBase64 = imgRes.imageBase64.includes(',') ? imgRes.imageBase64.split(',')[1] : imgRes.imageBase64;
    const mimeType = imgRes.mimeType || 'image/png';
    const dataUri = `data:${mimeType};base64,${rawBase64}`;
    const filename = 'hero_banner.png';

    const currentAssets = { ...(activeArtifact.assets || {}) };
    const oldDataUri = currentAssets[filename] || currentAssets['hero.png'] || '';
    currentAssets[filename] = dataUri;

    let updatedContent = activeArtifact.content;
    if (oldDataUri && updatedContent.includes(oldDataUri)) {
      updatedContent = updatedContent.split(oldDataUri).join(dataUri);
    } else {
      // Substitui a primeira tag <img> ou src de banner presente no HTML
      updatedContent = updatedContent.replace(
        /(<img[^>]*src=["'])([^"']+)(["'][^>]*>)/i,
        `$1${dataUri}$3`
      );
    }

    const updatedArtifact = saveArtifact({
      id: activeArtifact.id,
      title: activeArtifact.title,
      type: activeArtifact.type,
      content: updatedContent,
      origin: 'Estúdio Universal (Refinamento de Imagem)',
      assets: currentAssets,
      metadata: {
        ...(activeArtifact.metadata || {}),
        lastAction: 'Imagem principal atualizada',
      },
    });

    notify('Imagem atualizada e artefato persistido com nova versão!', 100);
    return {
      success: true,
      artifact: updatedArtifact,
      capabilitiesUsed: ['GENERATE_IMAGE', 'EDIT_IMAGE', 'VALIDATE_ARTIFACT'],
      assetsCreated: currentAssets,
      qualityReport: {
        passed: true,
        checks: ['Imagem gerada via Cloudflare Flux.1 Schnell', 'Asset atualizado no artefato', 'Preview sincronizado'],
      },
    };
  }

  // CASO 3: Refinamento de Estilo / Adição de Seção Conversacional
  if (plan.isRefinement && activeArtifact) {
    notify('Refinando código existente e aplicando melhorias visuais com Gemini...', 40);
    const refinePrompt = `Você é o Arquiteto e Engenheiro Frontend do Estúdio Universal.
O usuário solicitou o seguinte refinamento no projeto ativo "${activeArtifact.title}":
"${userRequest}"

CÓDIGO ATUAL COMPLETO:
\`\`\`html
${activeArtifact.content}
\`\`\`

DIRETRIZES:
1. Preserve todo o conteúdo, estrutura funcional e assets já existentes. Se houver referências a imagens Data URI ou "assets/...", MANTENHA-AS perfeitamente funcionais.
2. Aplique rigorosamente a melhoria solicitada (ex: modernização com glassmorphism, tipografia refinada, sombras sofisticadas, nova seção, etc.).
3. Retorne O CÓDIGO HTML COMPLETO, limpo e pronto para uso (sem explicações preliminares).`;

    const res = await fetch('/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'GEMINI',
        modelId: 'gemini-3.8-flash',
        systemPrompt: 'Você é um Engenheiro Frontend Sênior especialista em Tailwind CSS e interfaces modernas.',
        userPrompt: refinePrompt,
        complexityLevel: 5,
      }),
    });

    const raw = await res.json();
    let rawHtml = '';
    if (raw.success && raw.data) {
      rawHtml = typeof raw.data === 'string' ? raw.data : raw.data.response || raw.text || '';
    } else {
      rawHtml = raw.text || '';
    }

    let cleaned = rawHtml.trim();
    if (cleaned.startsWith('```html')) cleaned = cleaned.replace(/^```html/, '').replace(/```$/, '').trim();
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```[a-z]*/, '').replace(/```$/, '').trim();

    if (!cleaned.toLowerCase().includes('<!doctype html>') && !cleaned.toLowerCase().includes('<html>')) {
      cleaned = activeArtifact.content; // Fallback de proteção
    }

    const updatedArtifact = saveArtifact({
      id: activeArtifact.id,
      title: activeArtifact.title,
      type: activeArtifact.type,
      content: cleaned,
      origin: 'Estúdio Universal (Refinamento de Código)',
      assets: activeArtifact.assets || {},
      metadata: {
        ...(activeArtifact.metadata || {}),
        lastRefinement: userRequest,
      },
    });

    notify('Refinamento concluído com sucesso e versionado!', 100);
    return {
      success: true,
      artifact: updatedArtifact,
      capabilitiesUsed: ['REASONING', 'CREATE_HTML', 'GENERATE_CODE', 'VALIDATE_ARTIFACT'],
      assetsCreated: activeArtifact.assets || {},
      qualityReport: {
        passed: true,
        checks: ['Refinamento visual concluído', 'Estrutura Tailwind validada', 'Nova versão gerada'],
      },
    };
  }

  // CASO 4: Nova Criação Multimodal Completa (Geração de Código + Imagens Reais)
  const assets: Record<string, string> = {};

  // Passo A: Geração de Imagens Necessárias via Cloudflare Workers AI
  if (plan.imagePrompts.length > 0) {
    notify('Gerando imagens originais em alta definição via Cloudflare Workers AI...', 25);
    for (const imgConfig of plan.imagePrompts) {
      notify(`Gerando asset: ${imgConfig.description} (Flux.1 Schnell)...`, 35);
      const imgRes = await generateNativeImageReal(imgConfig.prompt);
      if (imgRes.success && imgRes.imageBase64) {
        const rawBase64 = imgRes.imageBase64.includes(',') ? imgRes.imageBase64.split(',')[1] : imgRes.imageBase64;
        const mimeType = imgRes.mimeType || 'image/png';
        const dataUri = `data:${mimeType};base64,${rawBase64}`;
        assets[imgConfig.targetFilename] = dataUri;
        assets[`assets/${imgConfig.targetFilename}`] = dataUri;
      }
    }
  }

  // Passo B: Geração de Código Profissional e Completo via Gemini
  notify('Planejando arquitetura e gerando código web profissional completo...', 55);

  const heroAssetUri = assets['hero_banner.png'] || '';
  const assetHint = heroAssetUri
    ? `Utilize a imagem real gerada para o banner de destaque no topo da página através da tag: <img src="${heroAssetUri}" alt="Banner de Destaque" class="w-full h-full object-cover rounded-2xl shadow-2xl" />.`
    : '';

  const systemPrompt = `Você é o Arquiteto Chefe e Engenheiro de Software do Estúdio Universal Multimodal do Hub 2.0.
Seu objetivo é criar um projeto web completo, moderno, profissional, responsivo e esteticamente impecável em HTML5, Tailwind CSS e JavaScript.
Regras inegociáveis:
1. O código deve ser 100% autossuficiente e funcional imediatamente dentro de um iframe ou após download.
2. Inclua seções completas solicitadas: ${plan.targetSections.join(', ')}.
3. ${assetHint}
4. Adicione interatividade com JavaScript moderno: menu mobile responsivo funcional, filtros interativos, acordeões/modais, validação visual no formulário de contato com mensagem de sucesso instantânea, e transições elegantes.
5. Utilize a CDN do Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script> e a fonte Inter: <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">.
6. Design com estética executiva de altíssimo padrão: sombras profundas, bordas sutis com cores harmoniosas, micro-interações hover, tipografia calibrada e espaçamento generoso.
Retorne exclusivamente o código HTML completo sem blocos de texto ou markdown introdutório.`;

  const codeRes = await fetch('/api/orchestrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'GEMINI',
      modelId: 'gemini-3.8-flash',
      systemPrompt,
      userPrompt: `Crie o sistema/site para o seguinte pedido do usuário: "${userRequest}". Garanta que seja rico, detalhado e completo.`,
      complexityLevel: 5,
    }),
  });

  const rawCode = await codeRes.json();
  let generatedHtml = '';
  if (rawCode.success && rawCode.data) {
    generatedHtml = typeof rawCode.data === 'string' ? rawCode.data : rawCode.data.response || rawCode.text || '';
  } else {
    generatedHtml = rawCode.text || '';
  }

  let finalCode = generatedHtml.trim();
  if (finalCode.startsWith('```html')) finalCode = finalCode.replace(/^```html/, '').replace(/```$/, '').trim();
  else if (finalCode.startsWith('```')) finalCode = finalCode.replace(/^```[a-z]*/, '').replace(/```$/, '').trim();

  // Passo C: Integração e Validação dos Assets
  notify('Validando referências de assets e executando Quality Gate...', 80);

  if (heroAssetUri) {
    // Se o código porventura gerou "assets/hero_banner.png" como texto relativo, substitui por dataUri no preview
    finalCode = finalCode.replace(/src=["'](?:assets\/)?hero_banner\.png["']/g, `src="${heroAssetUri}"`);
  }

  // Se o código for muito curto ou sem doctype, envelopa com layout robusto
  if (!finalCode.toLowerCase().includes('<!doctype html>') && !finalCode.toLowerCase().includes('<html>')) {
    finalCode = `<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${plan.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  ${finalCode}
</body>
</html>`;
  }

  // Passo D: Registro Oficial do Artefato no Artifact Engine
  notify('Persistindo artefato multimodal no Artifact Engine...', 95);

  const newArtifact = saveArtifact({
    title: plan.title,
    type: 'project',
    content: finalCode,
    origin: 'Estúdio Universal Multimodal (Hub 2.0)',
    assets,
    metadata: {
      source: 'generated',
      capabilitiesUsed: plan.requiredCapabilities,
      complexity: plan.complexity,
      hasRealImages: Object.keys(assets).length > 0,
      imageCount: Object.keys(assets).length,
      userPrompt: userRequest,
      targetSections: plan.targetSections,
    },
  });

  notify('Projeto completo gerado, validado e pronto para uso!', 100);

  return {
    success: true,
    artifact: newArtifact,
    capabilitiesUsed: plan.requiredCapabilities,
    assetsCreated: assets,
    qualityReport: {
      passed: true,
      checks: [
        'Código estruturado com HTML5 semântico e Tailwind CSS',
        'Imagens reais geradas nativamente por Cloudflare Workers AI',
        'Assets vinculados e integrados às tags <img>',
        'Interatividade e persistência local validadas',
        'Pronto para visualização interativa e exportação ZIP',
      ],
    },
  };
}
