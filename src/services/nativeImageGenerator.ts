export interface GeneratedImageResult {
  success: boolean;
  artifactType: 'image';
  imageBase64?: string;
  mimeType: string;
  filename: string;
  error?: string;
  source: 'generated';
  provider: 'cloudflare';
  model: string;
  width?: number;
  height?: number;
  metadata?: any;
}

/**
 * ADAPTER OFICIAL DE GERAÇÃO VISUAL NATIVA REAL VIA CLOUDFLARE WORKERS AI (FLUX.1 SCHNELL)
 * Executa estritamente a chamada server-side: POST /api/image/generate
 * Sem fallback para SVG, Canvas, Unsplash ou placeholders.
 */
export async function generateNativeImageReal(prompt: string): Promise<GeneratedImageResult> {
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

  console.log('[CLOUDFLARE IMAGE DEBUG]', {
    traceId,
    method: 'POST',
    endpoint: '/api/image/generate',
    model: '@cf/black-forest-labs/flux-1-schnell',
  });

  try {
    const response = await fetch('/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        apiToken: apiToken ? apiToken.trim() : undefined,
        accountId: accountId ? accountId.trim() : undefined,
      }),
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
        artifactType: 'image',
        mimeType: '',
        filename: '',
        error: `Falha ao gerar imagem via Cloudflare Workers AI: ${errText}`,
        source: 'generated',
        provider: 'cloudflare',
        model: '@cf/black-forest-labs/flux-1-schnell',
      };
    }

    const data = await response.json();
    const imageReceived = Boolean(data.success && data.imageBase64 && data.imageBase64.length > 0);
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
        artifactType: 'image',
        mimeType: '',
        filename: '',
        error: data.error || 'A API respondeu com sucesso mas não retornou imagem válida.',
        source: 'generated',
        provider: 'cloudflare',
        model: data.model || '@cf/black-forest-labs/flux-1-schnell',
      };
    }

    return {
      success: true,
      artifactType: 'image',
      imageBase64: data.imageBase64,
      mimeType: data.mimeType || 'image/png',
      filename: data.filename || `cloudflare_flux_${Date.now()}.png`,
      source: 'generated',
      provider: 'cloudflare',
      model: data.model || '@cf/black-forest-labs/flux-1-schnell',
      metadata: data.metadata || {
        source: 'generated',
        provider: 'cloudflare',
        model: '@cf/black-forest-labs/flux-1-schnell',
        bytes: imageBytes,
      },
    };
  } catch (err: any) {
    console.error('[CLOUDFLARE IMAGE DEBUG] Exception:', {
      traceId,
      error: err?.message,
    });
    return {
      success: false,
      artifactType: 'image',
      mimeType: '',
      filename: '',
      error: `Erro de conexão ao solicitar geração de imagem: ${err?.message || err}`,
      source: 'generated',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-1-schnell',
    };
  }
}
