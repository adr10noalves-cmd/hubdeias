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
  * Adaptador oficial para Geração de Imagem Nativa via Cloudflare Workers AI
  * Utiliza o modelo FLUX.2 Klein 4B (@cf/black-forest-labs/flux-2-klein-4b)
  * Utiliza fetch e FormData nativos do Node.js (sem dependências externas de pacotes ESM).
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
      error: 'As credenciais da Cloudflare Workers AI (CLOUDFLARE_ACCOUNT_ID e CLOUDFLARE_API_TOKEN) não estão configuradas nas variáveis de ambiente da Vercel ou nas Configurações do Hub.',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-2-klein-4b',
    };
  }

  const prompt = params.prompt || 'Professional high quality illustration';
  const width = params.width || 1024;
  const height = params.height || 1024;

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId.trim()}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`;

  try {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('width', String(width));
    formData.append('height', String(height));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken.trim()}`,
      },
      body: formData,
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
        mimeType: '',
        filename: '',
        error: `Falha na Cloudflare Workers AI API: ${errText}`,
        provider: 'cloudflare',
        model: '@cf/black-forest-labs/flux-2-klein-4b',
      };
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mime = contentType.includes('image/') ? contentType.split(';')[0] : 'image/png';
      const filename = `cloudflare_flux_${Date.now()}.png`;

      return {
        success: true,
        imageBase64: base64,
        mimeType: mime,
        filename,
        provider: 'cloudflare',
        model: '@cf/black-forest-labs/flux-2-klein-4b',
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
        error: 'A API da Cloudflare Workers AI retornou sucesso mas nenhum dado de imagem válido.',
        provider: 'cloudflare',
        model: '@cf/black-forest-labs/flux-2-klein-4b',
        metadata: data,
      };
    }

    if (base64Image.startsWith('data:')) {
      const parts = base64Image.split(',');
      base64Image = parts[1] || base64Image;
    }

    const filename = `cloudflare_flux_${Date.now()}.png`;
    return {
      success: true,
      imageBase64: base64Image,
      mimeType: 'image/png',
      filename,
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-2-klein-4b',
      width,
      height,
    };
  } catch (err: any) {
    return {
      success: false,
      mimeType: '',
      filename: '',
      error: `Exceção ao executar Cloudflare Workers AI: ${err?.message || err}`,
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-2-klein-4b',
    };
  }
}
