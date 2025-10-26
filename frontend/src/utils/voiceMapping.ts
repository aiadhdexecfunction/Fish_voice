// Voice model mapping between frontend voice tones and backend voice model IDs
export interface VoiceModel {
  id: string;
  title: string;
}

export type VoiceTone = 'ariana' | 'gordon' | 'snoop';

// Mapping from frontend voice tone to backend voice model ID
export const VOICE_TONE_TO_MODEL_ID: Record<VoiceTone, string> = {
  ariana: '5d8f5b86a3144c87b1dd1ecff9b86295', // ARIANA GRANDE
  gordon: 'b0247335c9a043b3ab0b21dabb6a9d60', // Gordan Ramsay
  snoop: '1a3dfc8c9f68498994a27f3f9b963d1c',  // dogg
};

// Mapping from backend voice model ID to frontend voice tone
export const MODEL_ID_TO_VOICE_TONE: Record<string, VoiceTone> = {
  '5d8f5b86a3144c87b1dd1ecff9b86295': 'ariana',
  'b0247335c9a043b3ab0b21dabb6a9d60': 'gordon',
  '1a3dfc8c9f68498994a27f3f9b963d1c': 'snoop',
};

// Get voice model ID from voice tone
export function getVoiceModelId(voiceTone: VoiceTone): string {
  return VOICE_TONE_TO_MODEL_ID[voiceTone];
}

// Get voice tone from voice model ID
export function getVoiceToneFromModelId(modelId: string): VoiceTone | null {
  return MODEL_ID_TO_VOICE_TONE[modelId] || null;
}

// Get voice tone display name
export function getVoiceToneDisplayName(voiceTone: VoiceTone): string {
  const displayNames: Record<VoiceTone, string> = {
    ariana: 'Ariana Grande',
    gordon: 'Gordon Ramsay',
    snoop: 'Snoop Dogg',
  };
  return displayNames[voiceTone];
}
