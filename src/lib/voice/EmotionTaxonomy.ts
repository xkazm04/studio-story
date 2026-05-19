/**
 * EmotionTaxonomy — Single source of truth for emotion definitions.
 *
 * Every emotion type, label, color (hex + Tailwind), icon name, valence group,
 * voice-parameter modifier, SSML mapping, and adjacency graph lives here.
 * All consumers (EmotionController, voiceModifiers, emotionSuggestions,
 * EmotionPanel, ScriptEditor, etc.) import from this module.
 */

import type { VoiceSettings } from '@/app/features/voice/types';

// ---------------------------------------------------------------------------
// Master emotion type
// ---------------------------------------------------------------------------

export type EmotionType =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'surprised'
  | 'disgusted'
  | 'contemptuous'
  | 'excited'
  | 'tender'
  | 'anxious'
  | 'melancholy'
  | 'confident'
  | 'sarcastic'
  | 'whispered'
  | 'shouted';

// ---------------------------------------------------------------------------
// Per-emotion metadata
// ---------------------------------------------------------------------------

export interface EmotionEntry {
  type: EmotionType;
  label: string;
  /** Hex color for programmatic use (canvas, inline style) */
  hexColor: string;
  /** Tailwind bg-* class for quick UI badges */
  tailwindColor: string;
  /** Lucide icon name (kebab-case) */
  icon: string;
  /** Affective valence bucket */
  valence: 'positive' | 'neutral' | 'negative';
}

/**
 * Master emotion list — ordered by valence then frequency of use.
 * Every new emotion goes here; no other file should define emotion entries.
 */
export const EMOTION_ENTRIES: readonly EmotionEntry[] = [
  // Positive
  { type: 'happy',      label: 'Happy',        hexColor: '#fbbf24', tailwindColor: 'bg-yellow-400',  icon: 'smile',           valence: 'positive' },
  { type: 'excited',    label: 'Excited',       hexColor: '#fb923c', tailwindColor: 'bg-orange-400',  icon: 'star',            valence: 'positive' },
  { type: 'tender',     label: 'Tender',        hexColor: '#f9a8d4', tailwindColor: 'bg-pink-300',    icon: 'heart',           valence: 'positive' },
  { type: 'confident',  label: 'Confident',     hexColor: '#22c55e', tailwindColor: 'bg-emerald-400', icon: 'shield',          valence: 'positive' },
  // Neutral
  { type: 'neutral',    label: 'Neutral',       hexColor: '#94a3b8', tailwindColor: 'bg-slate-400',   icon: 'minus',           valence: 'neutral' },
  { type: 'surprised',  label: 'Surprised',     hexColor: '#f472b6', tailwindColor: 'bg-pink-400',    icon: 'zap',             valence: 'neutral' },
  { type: 'sarcastic',  label: 'Sarcastic',     hexColor: '#eab308', tailwindColor: 'bg-yellow-500',  icon: 'message-circle',  valence: 'neutral' },
  { type: 'whispered',  label: 'Whispered',     hexColor: '#cbd5e1', tailwindColor: 'bg-slate-300',   icon: 'volume',          valence: 'neutral' },
  { type: 'shouted',    label: 'Shouted',       hexColor: '#dc2626', tailwindColor: 'bg-red-600',     icon: 'volume-2',        valence: 'neutral' },
  // Negative
  { type: 'sad',           label: 'Sad',           hexColor: '#60a5fa', tailwindColor: 'bg-blue-400',    icon: 'frown',           valence: 'negative' },
  { type: 'angry',         label: 'Angry',         hexColor: '#ef4444', tailwindColor: 'bg-red-400',     icon: 'angry',           valence: 'negative' },
  { type: 'fearful',       label: 'Fearful',       hexColor: '#a855f7', tailwindColor: 'bg-violet-400',  icon: 'alert-triangle',  valence: 'negative' },
  { type: 'disgusted',     label: 'Disgusted',     hexColor: '#84cc16', tailwindColor: 'bg-lime-400',    icon: 'thumbs-down',     valence: 'negative' },
  { type: 'contemptuous',  label: 'Contemptuous',  hexColor: '#78716c', tailwindColor: 'bg-stone-500',   icon: 'eye-off',         valence: 'negative' },
  { type: 'anxious',       label: 'Anxious',       hexColor: '#c084fc', tailwindColor: 'bg-purple-400',  icon: 'activity',        valence: 'negative' },
  { type: 'melancholy',    label: 'Melancholy',    hexColor: '#6366f1', tailwindColor: 'bg-indigo-400',  icon: 'cloud-rain',      valence: 'negative' },
] as const;

/** All emotion type strings, derived from the master list. */
export const ALL_EMOTION_TYPES: readonly EmotionType[] =
  EMOTION_ENTRIES.map((e) => e.type);

// ---------------------------------------------------------------------------
// Fast lookup maps (derived once at module load)
// ---------------------------------------------------------------------------

const _byType = new Map<EmotionType, EmotionEntry>(
  EMOTION_ENTRIES.map((e) => [e.type, e]),
);

export function getEmotionEntry(type: EmotionType): EmotionEntry {
  return _byType.get(type) ?? _byType.get('neutral')!;
}

export function getEmotionLabel(type: EmotionType): string {
  return getEmotionEntry(type).label;
}

export function getEmotionHexColor(type: EmotionType): string {
  return getEmotionEntry(type).hexColor;
}

export function getEmotionTailwindColor(type: EmotionType): string {
  return getEmotionEntry(type).tailwindColor;
}

export function getEmotionIcon(type: EmotionType): string {
  return getEmotionEntry(type).icon;
}

// ---------------------------------------------------------------------------
// Valence groups (for UI grouping)
// ---------------------------------------------------------------------------

export interface ValenceGroup {
  label: string;
  valence: 'positive' | 'neutral' | 'negative';
  emotions: EmotionType[];
}

export const VALENCE_GROUPS: readonly ValenceGroup[] = [
  { label: 'Positive', valence: 'positive', emotions: EMOTION_ENTRIES.filter((e) => e.valence === 'positive').map((e) => e.type) },
  { label: 'Neutral',  valence: 'neutral',  emotions: EMOTION_ENTRIES.filter((e) => e.valence === 'neutral').map((e) => e.type) },
  { label: 'Negative', valence: 'negative', emotions: EMOTION_ENTRIES.filter((e) => e.valence === 'negative').map((e) => e.type) },
];

// ---------------------------------------------------------------------------
// Voice-parameter modifiers (additive, scaled by intensity)
// ---------------------------------------------------------------------------

export const EMOTION_VOICE_MODIFIERS: Record<EmotionType, Partial<VoiceSettings>> = {
  neutral:      {},
  happy:        { stability: -0.1, style: 0.2, speed: 0.1 },
  sad:          { style: -0.1, speed: -0.1 },
  angry:        { stability: -0.1, style: 0.3 },
  fearful:      { stability: -0.15, speed: 0.05 },
  surprised:    { stability: -0.1, style: 0.15, speed: 0.15 },
  disgusted:    { stability: -0.05, style: -0.1 },
  contemptuous: { stability: 0.05, style: -0.05, speed: -0.05 },
  excited:      { stability: -0.05, style: 0.25, speed: 0.15 },
  tender:       { stability: 0.1, style: 0.1, speed: -0.05 },
  anxious:      { stability: -0.15, speed: 0.1 },
  melancholy:   { style: -0.05, speed: -0.15 },
  confident:    { stability: 0.1, style: 0.15 },
  sarcastic:    { stability: 0.05, style: 0.2, speed: -0.05 },
  whispered:    { stability: 0.1, similarity_boost: 0.1, speed: -0.15 },
  shouted:      { stability: -0.1, style: 0.1, speed: 0.05 },
};

// ---------------------------------------------------------------------------
// SSML parameter mapping
// ---------------------------------------------------------------------------

export interface SSMLDefaults {
  rate: string;
  pitch: string;
  volume: string;
}

export const EMOTION_SSML_MAP: Record<EmotionType, SSMLDefaults> = {
  neutral:      { rate: 'medium',  pitch: 'medium', volume: 'medium' },
  happy:        { rate: '+10%',    pitch: '+10%',   volume: 'loud' },
  sad:          { rate: '-15%',    pitch: '-10%',   volume: 'soft' },
  angry:        { rate: '+5%',     pitch: '+15%',   volume: 'x-loud' },
  fearful:      { rate: '+20%',    pitch: '+20%',   volume: 'soft' },
  surprised:    { rate: '+15%',    pitch: '+25%',   volume: 'loud' },
  disgusted:    { rate: '-5%',     pitch: '-5%',    volume: 'medium' },
  contemptuous: { rate: '-10%',    pitch: '-5%',    volume: 'medium' },
  excited:      { rate: '+20%',    pitch: '+15%',   volume: 'loud' },
  tender:       { rate: '-10%',    pitch: '-5%',    volume: 'soft' },
  anxious:      { rate: '+15%',    pitch: '+10%',   volume: 'medium' },
  melancholy:   { rate: '-20%',    pitch: '-15%',   volume: 'soft' },
  confident:    { rate: 'medium',  pitch: '-5%',    volume: 'loud' },
  sarcastic:    { rate: '-5%',     pitch: '+5%',    volume: 'medium' },
  whispered:    { rate: '-15%',    pitch: '-10%',   volume: 'x-soft' },
  shouted:      { rate: '+10%',    pitch: '+20%',   volume: 'x-loud' },
};

// ---------------------------------------------------------------------------
// Adjacency / complementary graph (for smart suggestions)
// ---------------------------------------------------------------------------

export const COMPLEMENTARY_EMOTIONS: Record<EmotionType, EmotionType[]> = {
  neutral:      ['happy', 'sad', 'confident', 'tender'],
  happy:        ['excited', 'confident', 'tender', 'surprised'],
  sad:          ['melancholy', 'tender', 'anxious', 'whispered'],
  angry:        ['excited', 'confident', 'fearful', 'anxious'],
  fearful:      ['anxious', 'whispered', 'sad', 'surprised'],
  surprised:    ['excited', 'happy', 'fearful', 'anxious'],
  disgusted:    ['contemptuous', 'angry', 'sad', 'sarcastic'],
  contemptuous: ['disgusted', 'sarcastic', 'angry', 'confident'],
  excited:      ['happy', 'confident', 'angry', 'surprised'],
  tender:       ['sad', 'happy', 'melancholy', 'whispered'],
  anxious:      ['fearful', 'sad', 'angry', 'excited'],
  melancholy:   ['sad', 'tender', 'anxious', 'whispered'],
  confident:    ['excited', 'happy', 'angry', 'tender'],
  sarcastic:    ['contemptuous', 'happy', 'angry', 'confident'],
  whispered:    ['tender', 'sad', 'anxious', 'melancholy'],
  shouted:      ['angry', 'excited', 'fearful', 'surprised'],
};

/**
 * Suggest emotions for take generation.
 * Returns current emotion first, then complementary ones, then fills from the
 * master list up to `count`.
 */
export function suggestEmotions(current: EmotionType, count = 5): EmotionType[] {
  const result: EmotionType[] = [current];
  const complementary = COMPLEMENTARY_EMOTIONS[current] ?? [];

  for (const emo of complementary) {
    if (result.length >= count) break;
    if (!result.includes(emo)) result.push(emo);
  }

  for (const emo of ALL_EMOTION_TYPES) {
    if (result.length >= count) break;
    if (!result.includes(emo)) result.push(emo);
  }

  return result.slice(0, count);
}
