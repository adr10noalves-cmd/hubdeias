export type CapabilityType =
  | 'GENERAL_CHAT'
  | 'REASONING'
  | 'GENERATE_TEXT'
  | 'GENERATE_CODE'
  | 'CREATE_HTML'
  | 'ANALYZE_CODE'
  | 'GENERATE_IMAGE'
  | 'EDIT_IMAGE'
  | 'ANALYZE_IMAGE'
  | 'ANALYZE_DOCUMENT'
  | 'GENERATE_STRUCTURED_DATA'
  | 'RESEARCH'
  | 'LONG_CONTEXT'
  | 'TOOL_USE'
  | 'FILE_CREATION'
  | 'VALIDATE_ARTIFACT';

export interface ModelCapabilityProfile {
  providerName: string;
  modelId: string;
  displayName: string;
  capabilities: CapabilityType[];
  maxContextTokens: number;
  speedRank: 'Fast' | 'Balanced' | 'Deep';
  costRank: 'Free' | 'Low' | 'High';
  isAvailable: boolean;
}

export const CAPABILITY_REGISTRY: ModelCapabilityProfile[] = [
  {
    providerName: 'GEMINI',
    modelId: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash (Multimodal & Fast)',
    capabilities: [
      'GENERAL_CHAT',
      'REASONING',
      'GENERATE_TEXT',
      'GENERATE_CODE',
      'CREATE_HTML',
      'ANALYZE_CODE',
      'ANALYZE_IMAGE',
      'ANALYZE_DOCUMENT',
      'GENERATE_STRUCTURED_DATA',
      'RESEARCH',
      'LONG_CONTEXT',
      'TOOL_USE',
      'FILE_CREATION',
    ],
    maxContextTokens: 1048576,
    speedRank: 'Fast',
    costRank: 'Free',
    isAvailable: true,
  },
  {
    providerName: 'GEMINI',
    modelId: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro (Deep Reasoning & Architecture)',
    capabilities: [
      'GENERAL_CHAT',
      'REASONING',
      'GENERATE_TEXT',
      'GENERATE_CODE',
      'CREATE_HTML',
      'ANALYZE_CODE',
      'EDIT_IMAGE',
      'ANALYZE_IMAGE',
      'ANALYZE_DOCUMENT',
      'GENERATE_STRUCTURED_DATA',
      'RESEARCH',
      'LONG_CONTEXT',
      'TOOL_USE',
      'FILE_CREATION',
    ],
    maxContextTokens: 2097152,
    speedRank: 'Balanced',
    costRank: 'Free',
    isAvailable: true,
  },
  {
    providerName: 'GROQ',
    modelId: 'llama-3.3-70b-versatile',
    displayName: 'Groq Llama 3.3 70B (Ultra-Fast Reasoning)',
    capabilities: [
      'GENERAL_CHAT',
      'REASONING',
      'GENERATE_TEXT',
      'GENERATE_CODE',
      'CREATE_HTML',
      'ANALYZE_CODE',
      'GENERATE_STRUCTURED_DATA',
      'RESEARCH',
      'TOOL_USE',
    ],
    maxContextTokens: 128000,
    speedRank: 'Fast',
    costRank: 'Free',
    isAvailable: true,
  },
  {
    providerName: 'CLOUDFLARE',
    modelId: '@cf/black-forest-labs/flux-1-schnell',
    displayName: 'Cloudflare Workers AI (Flux.1 Schnell Real)',
    capabilities: ['GENERATE_IMAGE', 'EDIT_IMAGE'],
    maxContextTokens: 4096,
    speedRank: 'Fast',
    costRank: 'Free',
    isAvailable: true,
  },
];

export interface ArtifactVersion {
  version: number;
  content: string;
  title: string;
  assets?: Record<string, string>;
  updatedAt: string;
  changelog?: string;
  metadata?: Record<string, any>;
}

export interface ArtifactItem {
  id: string;
  title: string;
  type: 'html' | 'code' | 'image' | 'document' | 'report' | 'data' | 'project';
  content: string;
  version: number;
  origin: string;
  createdAt: string;
  updatedAt: string;
  assets?: Record<string, string>; // name -> url / base64
  metadata?: Record<string, any>;
  history?: ArtifactVersion[];
}

export function findModelsWithCapability(capability: CapabilityType): ModelCapabilityProfile[] {
  return CAPABILITY_REGISTRY.filter((m) => m.isAvailable && m.capabilities.includes(capability));
}

export function selectBestModelForTask(requiredCapabilities: CapabilityType[]): ModelCapabilityProfile {
  // Encontrar o modelo que suporta o maior número de capacidades necessárias
  let best = CAPABILITY_REGISTRY[0];
  let maxMatch = -1;

  for (const model of CAPABILITY_REGISTRY) {
    if (!model.isAvailable) continue;
    const matchCount = requiredCapabilities.filter((cap) => model.capabilities.includes(cap)).length;
    if (matchCount > maxMatch) {
      maxMatch = matchCount;
      best = model;
    }
  }

  return best;
}
