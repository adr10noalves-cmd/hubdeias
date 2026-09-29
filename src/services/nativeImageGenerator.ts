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
 * ADAPTER DE GERAÇÃO VISUAL NATIVA REAL VIA CLOUDFLARE WORKERS AI (FLUX.2 KLEIN 4B)
 * Conforme instrução rigorosa:
 * - PROIBIDO usar Unsplash, SVG local, canvas ou placeholders simulados.
 * - Chama o endpoint server-side /api/image/generate que executa o modelo real via Cloudflare Workers AI.
 */
export async function generateNativeImageReal(prompt: string, width = 1024, height = 1024): Promise<GeneratedImageResult> {
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

  try {
    const response = await fetch('/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, width, height, apiToken, accountId }),
    });

    if (!response.ok) {
      let errText = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        errText = errJson.error || errText;
      } catch {}
      return {
        success: false,
        mimeType: '',
        filename: '',
        error: `Falha ao gerar imagem via Cloudflare Workers AI: ${errText}`,
        source: 'generated',
        provider: 'cloudflare',
        model: '@cf/black-forest-labs/flux-2-klein-4b',
      };
    }

    const data = await response.json();

    if (!data.success || !data.imageBase64) {
      return {
        success: false,
        mimeType: '',
        filename: '',
        error: data.error || 'A geração de imagem não retornou dados binários válidos.',
        source: 'generated',
        provider: data.provider || 'cloudflare',
        model: data.model || '@cf/black-forest-labs/flux-2-klein-4b',
      };
    }

    return {
      success: true,
      imageBase64: data.imageBase64,
      mimeType: data.mimeType || 'image/png',
      filename: data.filename || `cloudflare_flux_${Date.now()}.png`,
      source: 'generated',
      provider: data.provider || 'cloudflare',
      model: data.model || '@cf/black-forest-labs/flux-2-klein-4b',
      width: data.width || width,
      height: data.height || height,
    };
  } catch (err: any) {
    return {
      success: false,
      mimeType: '',
      filename: '',
      error: `Erro de conexão ao solicitar geração de imagem: ${err?.message || err}`,
      source: 'generated',
      provider: 'cloudflare',
      model: '@cf/black-forest-labs/flux-2-klein-4b',
    };
  }
}

