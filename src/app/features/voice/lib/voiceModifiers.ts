/**
 * Voice Modifiers — Shared emotion/delivery modifier library
 *
 * Canonical location for voice performance parameters.
 * Used by both sound-lab (standalone) and V2 voice panels.
 */

import type { VoiceSettings } from '../types';

export type { VoiceSettings };

export const EMOTIONS = [
  { type: 'neutral', label: 'Neutral', color: 'bg-slate-400' },
  { type: 'happy', label: 'Happy', color: 'bg-yellow-400' },
  { type: 'sad', label: 'Sad', color: 'bg-blue-400' },
  { type: 'angry', label: 'Angry', color: 'bg-red-400' },
  { type: 'fearful', label: 'Fear', color: 'bg-violet-400' },
  { type: 'surprised', label: 'Surprise', color: 'bg-pink-400' },
  { type: 'excited', label: 'Excited', color: 'bg-orange-400' },
  { type: 'tender', label: 'Tender', color: 'bg-pink-300' },
  { type: 'anxious', label: 'Anxious', color: 'bg-amber-400' },
  { type: 'melancholy', label: 'Melancholy', color: 'bg-indigo-400' },
  { type: 'confident', label: 'Confident', color: 'bg-emerald-400' },
  { type: 'whispered', label: 'Whisper', color: 'bg-gray-400' },
] as const;

export const DELIVERY_PRESETS = [
  { id: 'narration', label: 'Narration' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'intimate', label: 'Intimate' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'melancholic', label: 'Melancholic' },
  { id: 'comedic', label: 'Comedic' },
  { id: 'authoritative', label: 'Command' },
  { id: 'whisper', label: 'Whisper' },
];

/** Additive voice_settings modifiers per emotion (scaled by intensity) */
export const EMOTION_MODIFIERS: Record<string, Partial<VoiceSettings>> = {
  neutral: {},
  happy: { stability: -0.1, style: 0.2, speed: 0.1 },
  sad: { style: -0.1, speed: -0.1 },
  angry: { stability: -0.1, style: 0.3 },
  fearful: { stability: -0.15, speed: 0.05 },
  surprised: { stability: -0.1, style: 0.15, speed: 0.15 },
  excited: { stability: -0.05, style: 0.25, speed: 0.15 },
  tender: { stability: 0.1, style: 0.1, speed: -0.05 },
  anxious: { stability: -0.15, speed: 0.1 },
  melancholy: { style: -0.05, speed: -0.15 },
  confident: { stability: 0.1, style: 0.15 },
  whispered: { stability: 0.1, similarity_boost: 0.1, speed: -0.15 },
};

/** Additive delivery modifiers (applied at full weight) */
export const DELIVERY_MODIFIERS: Record<string, Partial<VoiceSettings>> = {
  narration: {},
  dramatic: { style: 0.15, stability: -0.05 },
  intimate: { stability: 0.1, speed: -0.1, style: 0.05 },
  urgent: { speed: 0.15, stability: -0.1 },
  melancholic: { speed: -0.1, style: -0.05 },
  comedic: { style: 0.2, speed: 0.05 },
  authoritative: { stability: 0.15, style: 0.1 },
  whisper: { stability: 0.1, similarity_boost: 0.1, speed: -0.15, style: -0.1 },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function applyModifiers(
  base: VoiceSettings,
  emotion: string,
  delivery: string,
  intensityPct: number,
): VoiceSettings {
  const emo = EMOTION_MODIFIERS[emotion] ?? {};
  const del = DELIVERY_MODIFIERS[delivery] ?? {};
  const scale = intensityPct / 100;

  return {
    stability: clamp(base.stability + (emo.stability ?? 0) * scale + (del.stability ?? 0), 0, 1),
    similarity_boost: clamp(base.similarity_boost + (emo.similarity_boost ?? 0) * scale + (del.similarity_boost ?? 0), 0, 1),
    style: clamp(base.style + (emo.style ?? 0) * scale + (del.style ?? 0), 0, 1),
    speed: clamp(base.speed + (emo.speed ?? 0) * scale + (del.speed ?? 0), 0.5, 2),
  };
}
