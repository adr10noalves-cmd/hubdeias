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
 * ADAPTER DE GERAÇÃO VISUAL NATIVA (DESABILITADO POR AUSÊNCIA DE MODELO MULTIMODAL DE RASTERIZAÇÃO DE IMAGEM)
 * Conforme instrução rigorosa:
 * - GERAÇÃO DE IMAGENS NÃO POSSUI IMPLEMENTAÇÃO REAL NAS APIS ATUAIS DE TEXTO (Gemini Flash/Pro, Groq).
 * - O sistema PROÍBE terminantemente qualquer simulação via SVG programático, canvas local ou banco de stock (Unsplash).
 * - Quando solicitado, o sistema retorna insucesso declarando que a funcionalidade não está disponível na configuração atual.
 */
export async function generateNativeImageReal(prompt: string): Promise<GeneratedImageResult> {
  return {
    success: false,
    mimeType: '',
    filename: '',
    error: 'A geração de imagens por IA ainda não está disponível nesta configuração. As integrações atuais (Gemini/Groq) processam texto, código e raciocínio, mas não possuem um adapter de modelo visual raster nativo implementado. Nenhuma imagem foi simulada.',
    source: 'external',
    provider: 'NONE',
    model: 'NONE',
  };
}
