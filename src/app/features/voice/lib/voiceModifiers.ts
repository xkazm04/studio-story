/**
 * Voice Modifiers — Shared emotion/delivery modifier library
 *
 * Voice-parameter modifiers and delivery presets for TTS generation.
 * Emotion list is derived from the canonical EmotionTaxonomy.
 */

import type { VoiceSettings } from '../types';
import {
  EMOTION_ENTRIES,
  EMOTION_VOICE_MODIFIERS,
  type EmotionType,
} from '@/lib/voice/EmotionTaxonomy';

export type { VoiceSettings };

/**
 * Emotion list for UI components (derived from EmotionTaxonomy).
 * Shape preserved for backward compatibility with ScriptEditor, TakesGallery, etc.
 */
export const EMOTIONS: readonly { type: string; label: string; color: string }[] =
  EMOTION_ENTRIES.map((e) => ({ type: e.type, label: e.label, color: e.tailwindColor }));

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

/** Additive voice_settings modifiers per emotion (scaled by intensity) — from taxonomy */
export const EMOTION_MODIFIERS: Record<string, Partial<VoiceSettings>> =
  EMOTION_VOICE_MODIFIERS as Record<string, Partial<VoiceSettings>>;

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
