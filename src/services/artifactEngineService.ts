import { ArtifactItem, ArtifactVersion } from './capabilityRegistryService';
import { generateNativeImageReal } from './nativeImageGenerator';
import { createRealZipBlob, ZipFileInput } from './zipGenerator';
export type { ArtifactItem, ArtifactVersion };

const ARTIFACT_STORAGE_KEY = 'hub_universal_artifacts_v1';

export function getStoredArtifacts(): ArtifactItem[] {
  try {
    const raw = localStorage.getItem(ARTIFACT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveArtifact(
  item: Omit<ArtifactItem, 'id' | 'version' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    version?: number;
    history?: ArtifactVersion[];
  }
): ArtifactItem {
  const all = getStoredArtifacts();
  const now = new Date().toISOString();

  const existingIndex = item.id ? all.findIndex((a) => a.id === item.id) : -1;

  let saved: ArtifactItem;
  if (existingIndex >= 0) {
    const existing = all[existingIndex];
    const prevHistory = existing.history || [];

    // Preserva o estado anterior no histórico de versionamento antes de sobrescrever
    const newHistory: ArtifactVersion[] = [
      ...prevHistory,
      {
        version: existing.version || 1,
        title: existing.title,
        content: existing.content,
        assets: { ...(existing.assets || {}) },
        updatedAt: existing.updatedAt || now,
        metadata: { ...(existing.metadata || {}) },
      },
    ];

    saved = {
      ...existing,
      ...item,
      version: (existing.version || 1) + 1,
      updatedAt: now,
      history: newHistory,
    };
    all[existingIndex] = saved;
  } else {
    saved = {
      id: item.id || `artifact-${Date.now()}`,
      title: item.title,
      type: item.type,
      content: item.content,
      version: item.version || 1,
      origin: item.origin || 'Mestre Universal',
      createdAt: now,
      updatedAt: now,
      assets: item.assets || {},
      metadata: item.metadata || {},
      history: item.history || [],
    };
    all.unshift(saved);
  }

  try {
    localStorage.setItem(ARTIFACT_STORAGE_KEY, JSON.stringify(all));
  } catch {}

  return saved;
}

/**
 * Reverte o artefato especificado para a versão imediatamente anterior
 */
export function revertArtifactToPreviousVersion(artifactId: string): ArtifactItem | null {
  const all = getStoredArtifacts();
  const index = all.findIndex((a) => a.id === artifactId);
  if (index < 0) return null;

  const current = all[index];
  const history = [...(current.history || [])];
  if (history.length === 0) return null;

  const previous = history.pop()!;
  const restored: ArtifactItem = {
    ...current,
    title: previous.title || current.title,
    content: previous.content,
    assets: previous.assets || {},
    metadata: {
      ...(previous.metadata || {}),
      revertedFromVersion: current.version,
    },
    version: (current.version || 1) + 1,
    updatedAt: new Date().toISOString(),
    history,
  };

  all[index] = restored;
  try {
    localStorage.setItem(ARTIFACT_STORAGE_KEY, JSON.stringify(all));
  } catch {}

  return restored;
}

export async function generateNativeImagePrompt(prompt: string) {
  // GERAÇÃO REAL NATIVA VIA CLOUDFLARE WORKERS AI (FLUX.1 SCHNELL) — PROIBIDO UNSPLASH / STOCK
  return await generateNativeImageReal(prompt);
}

/**
 * Converte base64/DataURI em array binário Uint8Array
 */
export function base64ToUint8Array(dataUriOrBase64: string): Uint8Array {
  let raw = dataUriOrBase64;
  if (raw.includes('base64,')) {
    raw = raw.split('base64,')[1];
  }
  raw = raw.replace(/[\r\n\s]/g, '');
  const chars = atob(raw);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) {
    bytes[i] = chars.charCodeAt(i);
  }
  return bytes;
}

export async function exportArtifactAsFile(artifact: ArtifactItem) {
  let mime = 'text/plain;charset=utf-8';
  let ext = 'txt';

  if (artifact.type === 'html' || artifact.type === 'project') {
    mime = 'text/html;charset=utf-8';
    ext = 'html';
  } else if (artifact.type === 'code') {
    mime = 'text/javascript;charset=utf-8';
    ext = 'js';
  } else if (artifact.type === 'data' || artifact.type === 'report') {
    mime = 'application/json;charset=utf-8';
    ext = 'json';
  } else if (artifact.type === 'image') {
    let rawContent = artifact.content || '';
    if (rawContent.includes('<img')) {
      const match = rawContent.match(/src=["']([^"']+)["']/);
      if (match && match[1]) rawContent = match[1];
    }
    if (rawContent.includes('base64,')) {
      const parts = rawContent.split('base64,');
      rawContent = parts[1];
      const mimeMatch = parts[0].match(/data:([^;]+)/);
      if (mimeMatch && mimeMatch[1]) {
        mime = mimeMatch[1];
      }
    } else {
      mime = artifact.metadata?.mimeType || 'image/png';
    }
    ext = mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : 'png';

    try {
      const byteArray = base64ToUint8Array(rawContent);
      const blob = new Blob([byteArray], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${artifact.version}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    } catch (e) {
      console.warn('Erro ao decodificar imagem binária para download:', e);
    }
  }

  const blob = new Blob([artifact.content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${artifact.version}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * EXPORTAÇÃO REAL DE PROJETO EM FORMATO ZIP COMPLETO
 * Empacota index.html, assets/ binários reais, README.md
 */
export async function exportProjectRealZip(artifact: ArtifactItem) {
  const files: ZipFileInput[] = [];

  // 1. Arquivo Principal index.html
  // Assegura que referências de imagem usem caminhos relativos para os assets locais do ZIP
  let cleanHtml = artifact.content;
  if (artifact.assets && Object.keys(artifact.assets).length > 0) {
    for (const [filename, assetData] of Object.entries(artifact.assets)) {
      if (typeof assetData === 'string' && assetData.startsWith('data:')) {
        // Substitui data URIs pelo caminho local correspondente no ZIP para deixar o index.html limpo e independente
        cleanHtml = cleanHtml.split(assetData).join(`assets/${filename}`);
      }
    }
  }

  files.push({
    path: 'index.html',
    data: cleanHtml,
  });

  // 2. README.md explicativo
  const readmeContent = `# ${artifact.title}
Projeto gerado pelo **Estúdio Universal Multimodal (Hub 2.0)**
Versão: v${artifact.version}
Data de Geração: ${new Date(artifact.createdAt).toLocaleString('pt-BR')}

## Estrutura do Pacote
- \`index.html\`: Código completo do sistema/página web com Tailwind CSS e JavaScript interativo.
- \`assets/\`: Imagens e recursos binários gerados nativamente por inteligência artificial (Cloudflare Workers AI - Flux.1 Schnell).

## Como Executar
Basta abrir o arquivo \`index.html\` em qualquer navegador moderno. Todas as imagens e scripts funcionam offline sem dependência de servidores externos.
`;
  files.push({
    path: 'README.md',
    data: readmeContent,
  });

  // 3. Pasta /assets com as imagens binárias reais
  if (artifact.assets && Object.keys(artifact.assets).length > 0) {
    for (const [name, val] of Object.entries(artifact.assets)) {
      if (typeof val === 'string' && val.length > 0) {
        const cleanName = name.replace(/^assets\//, '');
        try {
          const binary = base64ToUint8Array(val);
          files.push({
            path: `assets/${cleanName}`,
            data: binary,
          });
        } catch (e) {
          console.warn(`Erro ao empacotar asset ${name} no ZIP:`, e);
        }
      }
    }
  }

  // Gera o arquivo ZIP binário autêntico
  const zipBlob = createRealZipBlob(files);
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = artifact.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  a.download = `${safeTitle}_v${artifact.version}_projeto_completo.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
