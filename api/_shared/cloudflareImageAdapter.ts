export interface CloudflareImageResult {
  success: boolean;
  imageBase64?: string;
  mimeType: string;
  filename: string;
  error?: string;
  provider: string;
  model: string;
  width?: number;
  height?: number;
  metadata?: any;
}

/**
 * Retorna diagnóstico seguro das credenciais server-side da Cloudflare
 */
export function getCloudflareHealthDiagnostics(params?: { accountId?: string; apiToken?: string }) {
  const accountId = params?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = params?.apiToken || process.env.CLOUDFLARE_API_TOKEN;

  const tokenConfigured = Boolean(apiToken && apiToken.trim() !== '');
  const accountConfigured = Boolean(accountId && accountId.trim() !== '');
  const configured = tokenConfigured && accountConfigured;

  let status = 'READY';
  if (!configured) {
    status = 'CONFIG_ERROR';
  }

  return {
    configured,
    tokenConfigured,
    accountConfigured,
    provider: 'cloudflare',
    capability: 'GENERATE_IMAGE',
    model: '@cf/black-forest-labs/flux-1-schnell',
    adapter: true,
    status,
  };
}

/**
 * Adaptador oficial para Geração de Imagem Nativa via Cloudflare Workers AI
 * Utiliza JSON payload e modelos oficiais (Flux.1 Schnell / SDXL Base 1.0)
 */
export async function executeCloudflareImage(params: {
  prompt: string;
  width?: number;
  height?: number;
  accountId?: string;
  apiToken?: string;
}): Promise<CloudflareImageResult> {
  const accountId = params.accountId || process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = params.apiToken || process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken || accountId.trim() === '' || apiToken.trim() === '') {
    return {
      success: false,
      mimeType: '',
      filename: '',
      error: 'As credenciais da Cloudflare Workers AI (CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN) não estão configuradas nas variáveis de ambiente da Vercel.',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
    };
  }

  const prompt = params.prompt || 'Professional high quality illustration';
  const width = params.width || 1024;
  const height = params.height || 1024;
  const cleanAccount = accountId.trim();
  const cleanToken = apiToken.trim();

  // Lista de modelos para teste em cadeia (caso o primeiro retorne 404/indisponível)
  const modelsToTry = [
    '@cf/black-forest-labs/flux-1-schnell',
    '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    '@cf/black-forest-labs/flux-2-klein-4b'
  ];

  let lastError = '';

  for (const modelId of modelsToTry) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${cleanAccount}/ai/run/${modelId}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          width,
          height,
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
        lastError = `Modelo ${modelId} falhou (${response.status}): ${errText}`;
        if (response.status === 404 || response.status === 400) {
          // Tenta próximo modelo da lista
          continue;
        }
        return {
          success: false,
          mimeType: '',
          filename: '',
          error: lastError,
          provider: 'cloudflare',
          model: modelId,
        };
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mime = contentType.includes('image/') ? contentType.split(';')[0] : 'image/png';
        const filename = `cloudflare_${modelId.split('/').pop()}_${Date.now()}.png`;

        return {
          success: true,
          imageBase64: base64,
          mimeType: mime,
          filename,
          provider: 'cloudflare',
          model: modelId,
          width,
          height,
        };
      }

      const data = (await response.json()) as any;

      let base64Image = '';
      if (data?.result?.image) {
        base64Image = data.result.image;
      } else if (typeof data?.result === 'string') {
        base64Image = data.result;
      } else if (data?.image) {
        base64Image = data.image;
      }

      if (!base64Image) {
        return {
          success: false,
          mimeType: '',
          filename: '',
          error: `A API da Cloudflare Workers AI (${modelId}) retornou sucesso mas sem dados de imagem válidos.`,
          provider: 'cloudflare',
          model: modelId,
          metadata: data,
        };
      }

      if (base64Image.startsWith('data:')) {
        const parts = base64Image.split(',');
        base64Image = parts[1] || base64Image;
      }

      const filename = `cloudflare_${modelId.split('/').pop()}_${Date.now()}.png`;
      return {
        success: true,
        imageBase64: base64Image,
        mimeType: 'image/png',
        filename,
        provider: 'cloudflare',
        model: modelId,
        width,
        height,
      };
    } catch (err: any) {
      lastError = `Exceção em ${modelId}: ${err?.message || err}`;
      continue;
    }
  }

  return {
    success: false,
    mimeType: '',
    filename: '',
    error: `Falha em todos os modelos testados da Cloudflare Workers AI. Último erro: ${lastError}`,
    provider: 'cloudflare',
    model: '@cf/black-forest-labs/flux-1-schnell',
  };
}
