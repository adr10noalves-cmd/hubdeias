import { ArtifactItem } from './capabilityRegistryService';
import { generateNativeImageReal } from './nativeImageGenerator';
export type { ArtifactItem };

const ARTIFACT_STORAGE_KEY = 'hub_universal_artifacts_v1';

export function getStoredArtifacts(): ArtifactItem[] {
  try {
    const raw = localStorage.getItem(ARTIFACT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveArtifact(item: Omit<ArtifactItem, 'id' | 'version' | 'createdAt' | 'updatedAt'> & { id?: string; version?: number }): ArtifactItem {
  const all = getStoredArtifacts();
  const now = new Date().toISOString();

  let existingIndex = item.id ? all.findIndex((a) => a.id === item.id) : -1;

  let saved: ArtifactItem;
  if (existingIndex >= 0) {
    const existing = all[existingIndex];
    saved = {
      ...existing,
      ...item,
      version: (existing.version || 1) + 1,
      updatedAt: now,
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
    };
    all.unshift(saved);
  }

  try {
    localStorage.setItem(ARTIFACT_STORAGE_KEY, JSON.stringify(all));
  } catch {}

  return saved;
}

export async function generateNativeImagePrompt(prompt: string) {
  // GERAÇÃO REAL NATIVA VIA CLOUDFLARE WORKERS AI (FLUX.2 KLEIN 4B) — PROIBIDO UNSPLASH / STOCK
  return await generateNativeImageReal(prompt);
}

export async function exportArtifactAsFile(artifact: ArtifactItem) {
  let mime = 'text/plain;charset=utf-8';
  let ext = 'txt';

  if (artifact.type === 'html') {
    mime = 'text/html;charset=utf-8';
    ext = 'html';
  } else if (artifact.type === 'code') {
    mime = 'text/javascript;charset=utf-8';
    ext = 'js';
  } else if (artifact.type === 'data' || artifact.type === 'report') {
    mime = 'application/json;charset=utf-8';
    ext = 'json';
  } else if (artifact.type === 'image') {
    mime = artifact.metadata?.mimeType || 'image/png';
    ext = 'png';
    try {
      let b64 = artifact.content;
      if (b64.includes(',')) b64 = b64.split(',')[1];
      const byteChars = atob(b64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNums[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNums);
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

export async function exportProjectZipSimulation(projectName: string, files: Record<string, string>) {
  // Simulação de pacote ZIP unificado contendo arquivos do projeto
  const summary = Object.entries(files)
    .map(([name, content]) => `=== ARQUIVO: ${name} ===\n${content}\n\n`)
    .join('\n');

  const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_completo.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
