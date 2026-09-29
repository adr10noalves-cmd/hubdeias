import { ArtifactItem } from './capabilityRegistryService';

export interface GeneratedImageResult {
  success: boolean;
  imageBase64?: string;
  mimeType: string;
  filename: string;
  error?: string;
  source: 'generated' | 'external' | 'search';
  provider: string;
  model: string;
  width?: number;
  height?: number;
}

/**
 * ADAPTER DE GERAÇÃO VISUAL NATIVA REAL VIA CLOUDFLARE WORKERS AI
 * Com Trace ID e Diagnóstico Seguro [CLOUDFLARE IMAGE DEBUG]
 */
export async function generateNativeImageReal(prompt: string, width = 1024, height = 1024): Promise<GeneratedImageResult> {
  const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let apiToken = '';
  let accountId = '';
  try {
    const raw = localStorage.getItem('hub_orchestrator_settings_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      apiToken = parsed.cloudflareApiToken || '';
      accountId = parsed.cloudflareAccountId || '';
    }
  } catch {}

  const envToken = Boolean(apiToken || (typeof process !== 'undefined' && process.env?.CLOUDFLARE_API_TOKEN));
  const envAccount = Boolean(accountId || (typeof process !== 'undefined' && process.env?.CLOUDFLARE_ACCOUNT_ID));

  console.log('[CLOUDFLARE IMAGE DEBUG]', {
    traceId,
    envToken,
    envAccount,
    method: 'POST',
    endpoint: '/api/image/generate',
  });

  try {
    const response = await fetch('/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, width, height, apiToken, accountId }),
    });

    const contentType = response.headers.get('content-type') || '';
    
    if (!response.ok) {
      let errText = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        errText = errJson.error || errText;
      } catch {}

      console.warn('[CLOUDFLARE IMAGE DEBUG] Failed:', {
        traceId,
        status: response.status,
        responseError: errText,
      });

      return {
        success: false,
        mimeType: '',
        filename: '',
        error: `Falha ao gerar imagem via Cloudflare Workers AI: ${errText}`,
        source: 'generated',
        provider: 'cloudflare',
        model: '@cf/black-forest-labs/flux-1-schnell',
      };
    }

    const data = await response.json();

    const imageReceived = Boolean(data.success && data.imageBase64);
    const imageBytes = imageReceived ? Math.round((data.imageBase64.length * 3) / 4) : 0;

    console.log('[CLOUDFLARE IMAGE DEBUG] Success:', {
      traceId,
      status: response.status,
      responseType: contentType,
      model: data.model || '@cf/black-forest-labs/flux-1-schnell',
      imageReceived,
      imageBytes,
    });

    if (!imageReceived) {
      return {
        success: false,
        mimeType: '',
        filename: '',
        error: data.error || 'A geração de imagem não retornou dados binários válidos.',
        source: 'generated',
        provider: data.provider || 'cloudflare',
        model: data.model || '@cf/black-forest-labs/flux-1-schnell',
      };
    }

    return {
      success: true,
      imageBase64: data.imageBase64,
      mimeType: data.mimeType || 'image/png',
      filename: data.filename || `cloudflare_flux_${Date.now()}.png`,
      source: 'generated',
      provider: data.provider || 'cloudflare',
      model: data.model || '@cf/black-forest-labs/flux-1-schnell',
      width: data.width || width,
      height: data.height || height,
    };
  } catch (err: any) {
    console.error('[CLOUDFLARE IMAGE DEBUG] Exception:', {
      traceId,
      error: err?.message,
    });
    return {
      success: false,
      mimeType: '',
      filename: '',
      error: `Erro de conexão ao solicitar geração de imagem: ${err?.message || err}`,
      source: 'generated',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
    };
  }
}
