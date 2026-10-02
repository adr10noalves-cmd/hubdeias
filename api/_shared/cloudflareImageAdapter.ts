export interface CloudflareImageResult {
  success: boolean;
  artifactType: 'image';
  imageBase64?: string;
  mimeType: string;
  filename: string;
  error?: string;
  provider: 'cloudflare';
  model: string;
  width?: number;
  height?: number;
  metadata?: any;
}

/**
 * Retorna diagnóstico seguro das credenciais server-side da Cloudflare
 * NUNCA expõe os valores reais das variáveis.
 */
export function getCloudflareHealthDiagnostics(params?: { accountId?: string; apiToken?: string }) {
  const accountId = params?.accountId?.trim() || process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = params?.apiToken?.trim() || process.env.CLOUDFLARE_API_TOKEN?.trim();

  const tokenConfigured = Boolean(apiToken && apiToken !== '');
  const accountConfigured = Boolean(accountId && accountId !== '');
  const configured = tokenConfigured && accountConfigured;

  const status: 'READY' | 'CONFIG_ERROR' = configured ? 'READY' : 'CONFIG_ERROR';

  return {
    tokenConfigured,
    accountConfigured,
    provider: 'cloudflare' as const,
    capability: 'GENERATE_IMAGE',
    model: '@cf/black-forest-labs/flux-1-schnell',
    status,
    configured,
  };
}

/**
 * Adaptador oficial para Geração de Imagem Nativa via Cloudflare Workers AI
 * Modelo oficial obrigatório: @cf/black-forest-labs/flux-1-schnell
 * Sem fallback para SVG, Canvas, Unsplash ou placeholders.
 */
export async function executeCloudflareImage(params: {
  prompt: string;
  accountId?: string;
  apiToken?: string;
}): Promise<CloudflareImageResult> {
  const modelId = '@cf/black-forest-labs/flux-1-schnell';
  const cleanAccount = (params.accountId?.trim() || process.env.CLOUDFLARE_ACCOUNT_ID?.trim()) || '';
  const cleanToken = (params.apiToken?.trim() || process.env.CLOUDFLARE_API_TOKEN?.trim()) || '';

  if (!cleanAccount || !cleanToken) {
    return {
      success: false,
      artifactType: 'image',
      mimeType: '',
      filename: '',
      error: 'As credenciais da Cloudflare Workers AI (CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN) não estão configuradas no ambiente server-side da Vercel.',
      provider: 'cloudflare',
      model: modelId,
    };
  }

  const cleanPrompt = (params.prompt || '').trim();
  if (!cleanPrompt) {
    return {
      success: false,
      artifactType: 'image',
      mimeType: '',
      filename: '',
      error: 'O prompt para geração de imagem não pode estar vazio.',
      provider: 'cloudflare',
      model: modelId,
    };
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${cleanAccount}/ai/run/${modelId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: cleanPrompt,
      }),
    });

    if (!response.ok) {
      let errText = `HTTP ${response.status}`;
      try {
        const errJson = (await response.json()) as any;
        errText = errJson.errors?.[0]?.message || JSON.stringify(errJson);
      } catch {
        errText = await response.text();
      }
      return {
        success: false,
        artifactType: 'image',
        mimeType: '',
        filename: '',
        error: `Falha na API da Cloudflare Workers AI (${response.status}): ${errText}`,
        provider: 'cloudflare',
        model: modelId,
      };
    }

    const contentType = response.headers.get('content-type') || '';

    // 1. Resposta em formato binário direto (image/png, image/jpeg ou stream)
    if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mime = contentType.includes('image/') ? contentType.split(';')[0] : 'image/png';
      const ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';
      const filename = `cloudflare_flux_${Date.now()}.${ext}`;

      return {
        success: true,
        artifactType: 'image',
        imageBase64: base64,
        mimeType: mime,
        filename,
        provider: 'cloudflare',
        model: modelId,
        metadata: {
          source: 'generated',
          prompt: cleanPrompt,
          model: modelId,
          bytes: Math.round((base64.length * 3) / 4),
        },
      };
    }

    // 2. Resposta em formato JSON com base64 em result.image
    const rawText = await response.text();
    let base64Image = '';
    let mimeType = 'image/png';

    try {
      const data = JSON.parse(rawText);
      if (data?.result?.image) {
        base64Image = data.result.image;
      } else if (typeof data?.result === 'string') {
        base64Image = data.result;
      } else if (data?.image) {
        base64Image = data.image;
      }
    } catch {
      // Se não for JSON, tenta tratar como binário retornado como texto
      base64Image = Buffer.from(rawText, 'binary').toString('base64');
    }

    if (!base64Image || base64Image.trim().length === 0) {
      return {
        success: false,
        artifactType: 'image',
        mimeType: '',
        filename: '',
        error: 'A API da Cloudflare Workers AI respondeu com sucesso mas não retornou bytes de imagem válidos.',
        provider: 'cloudflare',
        model: modelId,
      };
    }

    // Normalização de Data URI se necessário
    if (base64Image.startsWith('data:')) {
      const match = base64Image.match(/^data:([^;]+);base64,/);
      if (match && match[1]) {
        mimeType = match[1];
      }
      base64Image = base64Image.replace(/^data:[^;]+;base64,/, '');
    }

    const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
    const filename = `cloudflare_flux_${Date.now()}.${ext}`;

    return {
      success: true,
      artifactType: 'image',
      imageBase64: base64Image,
      mimeType,
      filename,
      provider: 'cloudflare',
      model: modelId,
      metadata: {
        source: 'generated',
        prompt: cleanPrompt,
        model: modelId,
        bytes: Math.round((base64Image.length * 3) / 4),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      artifactType: 'image',
      mimeType: '',
      filename: '',
      error: `Exceção ao chamar Cloudflare Workers AI: ${err?.message || err}`,
      provider: 'cloudflare',
      model: modelId,
    };
  }
}
