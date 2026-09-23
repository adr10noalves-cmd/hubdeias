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
}

/**
 * ADAPTER DE GERAÇÃO VISUAL REAL (DESABILITADO POR AUSÊNCIA DE MODELO NATIVO DE IMAGEM NAS APIs ATUAIS)
 * Conforme instrução rigorosa, a geração de imagens por IA não está disponível nas integrações atuais (Gemini/Groq text).
 * O sistema NÃO simula mais sucesso com SVGs locais ou URLs de stock.
 */
export async function generateNativeImageReal(prompt: string): Promise<GeneratedImageResult> {
  // Retorna insucesso explícito para evitar qualquer simulação visual ou template SVG falso.
  return {
    success: false,
    mimeType: '',
    filename: '',
    error: 'A geração de imagens por IA ainda não está disponível nesta configuração por ausência de um adapter multimodal de rasterização visual nativa.',
    source: 'external',
    provider: 'NONE',
    model: 'NONE',
  };
}
