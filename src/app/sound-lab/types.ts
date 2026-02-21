/**
 * Sound Lab — Type Definitions
 *
 * All types for the experimental voice & audio module.
 * Option A engine: ElevenLabs (TTS + Music + SFX) + BS-RoFormer (stems via HuggingFace).
 *
 * Voice/script types are canonical in @/app/features/voice/types.ts
 * and re-exported here for backward compatibility.
 */

export type {
  VoiceSettings,
  ScriptLine,
  ScriptLineTake,
} from '@/app/features/voice/types';

// ============ Tab Navigation ============

export type SoundLabTab = 'mixer' | 'composer' | 'beats' | 'lab';

// ============ Audio Asset Types ============

export type AudioAssetType = 'voice' | 'music' | 'sfx' | 'ambience';
export type StemType = 'vocals' | 'drums' | 'bass' | 'guitar' | 'piano' | 'other';
export type StemMode = '2stem' | '4stem' | '6stem';
export type MusicGenre = 'orchestral' | 'electronic' | 'ambient' | 'rock' | 'jazz' | 'cinematic';
export type MoodType = 'tense' | 'triumphant' | 'melancholy' | 'mysterious' | 'energetic' | 'peaceful';
export type VoiceProvider = 'elevenlabs' | 'fish-speech' | 'vibevoice' | 'bark' | 'custom';
export type StemProvider = 'huggingface' | 'elevenlabs';

// ============ Audio Assets ============

export interface AudioAsset {
  id: string;
  name: string;
  type: AudioAssetType;
  duration: number;
  waveformData: number[];
  audioUrl?: string;
  source?: 'beats' | 'composer' | 'lab';
}

export interface GeneratedAudioResult {
  name: string;
  type: AudioAssetType;
  audioUrl: string;
  duration: number;
}

export interface StemResult {
  type: StemType;
  waveformData: number[];
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface StemSeparationResult {
  type: StemType;
  audioUrl: string;
  label: string;
}

export const STEM_MODE_CONFIG: Record<StemMode, {
  label: string;
  description: string;
  stemTypes: StemType[];
  modelHint: string;
  providers: StemProvider[];
}> = {
  '2stem': {
    label: '2 Stems',
    description: 'Vocals + Instrumental',
    stemTypes: ['vocals', 'other'],
    modelHint: 'pcunwa/BS-Roformer-Inst-FNO',
    providers: ['elevenlabs', 'huggingface'],
  },
  '4stem': {
    label: '4 Stems',
    description: 'Vocals, Drums, Bass, Other',
    stemTypes: ['vocals', 'drums', 'bass', 'other'],
    modelHint: 'HiDolen/Mini-BS-RoFormer',
    providers: ['huggingface'],
  },
  '6stem': {
    label: '6 Stems',
    description: 'Vocals, Drums, Bass, Guitar, Piano, Other',
    stemTypes: ['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'],
    modelHint: 'jarredou/BS-ROFO-SW-Fixed',
    providers: ['elevenlabs', 'huggingface'],
  },
};

// ============ Timeline ============

export interface TimelineClip {
  id: string;
  assetId: string;
  lane: AudioAssetType;
  startTime: number;
  duration: number;
  name: string;
  audioUrl?: string;
  waveformData?: number[];
  gain?: number;      // 0-1, default 1.0
  fadeIn?: number;     // seconds, default 0
  fadeOut?: number;    // seconds, default 0
  locked?: boolean;    // prevents drag, resize, edit
  muted?: boolean;     // individual clip mute (renders opacity-40, silences playback)
  automation?: AutomationPoint[];  // gain automation envelope (e.g. from ducking)
}

export interface AutomationPoint {
  time: number;    // seconds, relative to clip start
  value: number;   // 0-1 normalized gain
}

export interface TimelineMarker {
  id: string;
  time: number;       // seconds
  label: string;
  color: string;      // Tailwind color class (e.g., 'bg-amber-400')
}

export interface LoopRegion {
  start: number;      // seconds
  end: number;        // seconds
}

export interface DuckingConfig {
  enabled: boolean;
  amount: number;      // 0-1, e.g., 0.25 = -12dB ducking
  attack: number;      // seconds (ramp down), default 0.2
  release: number;     // seconds (ramp back up), default 0.3
  sourceLane: AudioAssetType;  // lane that triggers ducking (default: 'voice')
  targetLane: AudioAssetType;  // lane that gets ducked (default: 'music')
}

export interface ClipSelection {
  selectedClipIds: Set<string>;
  lastSelectedId: string | null;
}

export interface SnapConfig {
  enabled: boolean;
  gridSize: number; // seconds
  presets: number[]; // [0.1, 0.25, 0.5, 1, 2, 5]
}

export const SNAP_PRESETS = [0.1, 0.25, 0.5, 1, 2, 5] as const;

export interface TrackGroup {
  type: AudioAssetType;
  label: string;
  collapsed: boolean;
  clips: TimelineClip[];
}

export interface TransportState {
  isPlaying: boolean;
  playheadPos: number;
  zoom: number;
  totalDuration: number;
}

// ============ Track Generator ============

export interface GenerationConfig {
  prompt: string;
  genre: MusicGenre;
  mood: MoodType;
  duration: number;
  instruments: string[];
  mode: AudioAssetType;
}

export interface GeneratedTrack {
  id: string;
  name: string;
  config: GenerationConfig;
  waveformData: number[];
  duration: number;
  createdAt: string;
}

// ============ Voice Types ============

export interface MockVoice {
  id: string;
  name: string;
  provider: VoiceProvider;
  gender: 'male' | 'female' | 'neutral';
  ageRange: string;
  description: string;
  tags: string[];
  stability: number;
  similarity: number;
  style: number;
  speed: number;
}

export interface MockCharacter {
  id: string;
  name: string;
  archetype: string;
  gender: string;
  ageRange: string;
  traits: string[];
  castVoiceId?: string;
}

export interface VoiceMatchResult {
  voice: MockVoice;
  score: number;
  matchReasons: string[];
}

// ============ Script-to-Narration Pipeline ============
// ScriptLine, ScriptLineTake are re-exported from @/app/features/voice/types above.
// NarrationResult stays here because it references AudioAsset (sound-lab specific).

export interface NarrationResult {
  clips: Array<{ asset: AudioAsset; startTime: number }>;
  totalDuration: number;
}

// ============ Beat Pattern Types ============

export type InstrumentType = 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | 'cymbal' | 'bass' | 'pad' | 'arp' | 'perc';

export interface BeatStep {
  active: boolean;
  velocity: number;    // 0-1
  accent?: boolean;
}

export interface BeatTrack {
  instrument: InstrumentType;
  steps: BeatStep[];
  volume: number;      // 0-1
  muted: boolean;
  pitch?: number;      // semitones offset from default
}

export interface BeatPattern {
  name: string;
  bpm: number;         // 60-200
  swing: number;       // 0-1 (0 = straight, 0.5 = heavy swing)
  stepsPerBeat: number; // 4 = 16th notes (default), 3 = triplets
  beats: number;       // beats per bar (default 4)
  bars: number;        // number of bars (default 2)
  tracks: BeatTrack[];
  genre?: string;
  mood?: string;
  reasoning?: string;  // AI's music theory explanation
}

export const INSTRUMENT_TYPE_STYLES: Record<InstrumentType, {
  label: string;
  textClass: string;
  bgClass: string;
  group: 'drums' | 'bass' | 'melodic';
}> = {
  kick:    { label: 'Kick',    textClass: 'text-orange-400',  bgClass: 'bg-orange-500/15', group: 'drums' },
  snare:   { label: 'Snare',   textClass: 'text-amber-400',   bgClass: 'bg-amber-500/15',  group: 'drums' },
  hihat:   { label: 'Hi-Hat',  textClass: 'text-yellow-400',  bgClass: 'bg-yellow-500/15', group: 'drums' },
  clap:    { label: 'Clap',    textClass: 'text-rose-400',    bgClass: 'bg-rose-500/15',   group: 'drums' },
  tom:     { label: 'Tom',     textClass: 'text-red-400',     bgClass: 'bg-red-500/15',    group: 'drums' },
  cymbal:  { label: 'Cymbal',  textClass: 'text-slate-300',   bgClass: 'bg-slate-500/15',  group: 'drums' },
  bass:    { label: 'Bass',    textClass: 'text-sky-400',     bgClass: 'bg-sky-500/15',    group: 'bass' },
  pad:     { label: 'Pad',     textClass: 'text-violet-400',  bgClass: 'bg-violet-500/15', group: 'melodic' },
  arp:     { label: 'Arp',     textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/15', group: 'melodic' },
  perc:    { label: 'Perc',    textClass: 'text-teal-400',    bgClass: 'bg-teal-500/15',   group: 'drums' },
};

// ============ Audio Analysis ============

export interface AudioDescriptor {
  brightness: number;     // 0-1, spectral centroid (0=bassy, 1=bright)
  noisiness: number;      // 0-1, spectral flatness (0=tonal, 1=noise)
  attack: number;         // 0-1, transient sharpness (0=slow pad, 1=click)
  sustain: number;        // 0-1, how long the tail lasts (0=short hit, 1=sustained)
  pitchHz: number | null; // estimated fundamental, null if unpitched
  description: string;    // human-readable for Claude: "bright percussive hit, ~8kHz"
}

// ============ Sample Bank ============

export interface BeatSample {
  id: string;
  name: string;
  audioUrl: string;
  descriptor?: AudioDescriptor;
  waveformData?: number[];
}

// ============ Extended Track Source ============

export interface BeatTrackSource {
  mode: 'synth' | 'sample';
  sampleId?: string;
}

export const TRACK_SOURCE_STYLES: Record<'synth' | 'sample', {
  label: string;
  textClass: string;
  bgClass: string;
}> = {
  synth:  { label: 'Synth',  textClass: 'text-amber-400',   bgClass: 'bg-amber-500/10' },
  sample: { label: 'Sample', textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' },
};

// ============ AI Director ============

export interface MockScene {
  id: string;
  name: string;
  setting: string;
  mood: string;
  characters: string[];
}

export interface AIAudioSuggestion {
  id: string;
  type: AudioAssetType;
  description: string;
  confidence: number;
  waveformData: number[];
}

// ============ Marker Colors ============

export const MARKER_COLORS = [
  'bg-amber-400',
  'bg-sky-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-rose-400',
] as const;

export const MARKER_STROKE_COLORS: Record<string, string> = {
  'bg-amber-400': '#fbbf24',
  'bg-sky-400': '#38bdf8',
  'bg-violet-400': '#a78bfa',
  'bg-emerald-400': '#34d399',
  'bg-rose-400': '#fb7185',
};

// ============ Track Type Color Map ============

/** Static color map — never use dynamic template literals with Tailwind */
export const TRACK_TYPE_STYLES: Record<AudioAssetType, {
  borderClass: string;
  bgClass: string;
  textClass: string;
  label: string;
}> = {
  voice: { borderClass: 'border-l-violet-400', bgClass: 'bg-violet-500/15', textClass: 'text-violet-400', label: 'Voice' },
  music: { borderClass: 'border-l-orange-400', bgClass: 'bg-orange-500/15', textClass: 'text-orange-400', label: 'Music' },
  sfx: { borderClass: 'border-l-sky-400', bgClass: 'bg-sky-500/15', textClass: 'text-sky-400', label: 'SFX' },
  ambience: { borderClass: 'border-l-teal-400', bgClass: 'bg-teal-500/15', textClass: 'text-teal-400', label: 'Ambience' },
};

export const STEM_TYPE_STYLES: Record<StemType, {
  borderClass: string;
  textClass: string;
  label: string;
}> = {
  vocals: { borderClass: 'border-l-violet-400', textClass: 'text-violet-400', label: 'Vocals' },
  drums: { borderClass: 'border-l-orange-400', textClass: 'text-orange-400', label: 'Drums' },
  bass: { borderClass: 'border-l-sky-400', textClass: 'text-sky-400', label: 'Bass' },
  guitar: { borderClass: 'border-l-amber-400', textClass: 'text-amber-400', label: 'Guitar' },
  piano: { borderClass: 'border-l-rose-400', textClass: 'text-rose-400', label: 'Piano' },
  other: { borderClass: 'border-l-teal-400', textClass: 'text-teal-400', label: 'Other' },
};

// ============ Composer CLI Types ============

export interface CompositionPlan {
  positive_global_styles: string;
  negative_global_styles: string;
  sections: { text: string; duration_ms: number }[];
  summary?: string;
}

export interface PromptIdea {
  id: string;
  text: string;
  label: string;
  duration_seconds: number;
  prompt_influence: number;
  status: 'idle' | 'generating' | 'done' | 'error';
  error?: string;
  result?: {
    audioUrl: string;
    duration: number;
    waveformData: number[];
  };
}

// ============ Lab Tab Types ============

export type LabPipeline = 'midi-bridge' | 'character-modify';
export type VelocityCurve = 'linear' | 'soft' | 'hard' | 'compressed';

// --- MIDI Bridge ---

export interface MidiNote {
  pitch: number;       // MIDI note number 0-127
  startTime: number;   // seconds
  duration: number;    // seconds
  velocity: number;    // 0-127
}

export interface MidiTrack {
  name: string;
  channel: number;
  notes: MidiNote[];
  instrument: number;  // GM program number 0-127
}

export interface MidiExtractionResult {
  tracks: MidiTrack[];
  tempo: number;
  duration: number;
}

export interface InstrumentSwap {
  trackIndex: number;
  originalInstrument: number;
  newInstrument: number;
  newInstrumentName: string;
  transposition?: number;
  velocityCurve?: VelocityCurve;
}

// --- Character Modify (DSP) ---

export interface SpectralFeatures {
  rms: number;
  spectralCentroid: number;
  spectralFlatness: number;
  spectralRolloff: number;
  mfcc: number[];
  zcr: number;
  energy: number;
  description: string;
  bpm?: number;           // detected tempo
  key?: string;           // e.g. "C", "F#"
  scale?: string;         // e.g. "major", "minor"
  keyStrength?: number;   // 0-1 confidence
  beats?: number[];       // beat positions in seconds
}

export interface GranularParams {
  grainSize: number;      // 0.01-0.5 seconds
  overlap: number;        // 0.1-2.0
  pitchShift: number;     // semitones (-24 to +24)
  playbackRate: number;   // 0.25-4.0
  randomness: number;     // 0-1
  reverse: boolean;
}

export interface DSPFilterParams {
  type: BiquadFilterType;
  frequency: number;
  Q: number;
  gain: number;
}

export interface DSPEffectChain {
  filters: DSPFilterParams[];
  granular: GranularParams;
  distortion: number;     // 0-1
  reverbMix: number;      // 0-1
  delayTime: number;      // seconds
  delayFeedback: number;  // 0-0.95
}

// --- Lab Style Maps ---

export const LAB_PIPELINE_STYLES: Record<LabPipeline, {
  label: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
}> = {
  'midi-bridge': {
    label: 'MIDI Bridge',
    textClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/15',
    borderClass: 'border-cyan-500/25',
    description: 'Extract MIDI from audio, resynthesize with new instruments',
  },
  'character-modify': {
    label: 'Character Modify',
    textClass: 'text-fuchsia-400',
    bgClass: 'bg-fuchsia-500/15',
    borderClass: 'border-fuchsia-500/25',
    description: 'Transform audio character via granular synthesis and DSP',
  },
};

// --- GM Instrument Names (128 General MIDI programs) ---

export const GM_INSTRUMENTS: string[] = [
  /* Piano */           'Acoustic Grand Piano','Bright Acoustic Piano','Electric Grand Piano','Honky-tonk Piano','Electric Piano 1','Electric Piano 2','Harpsichord','Clavinet',
  /* Chromatic Perc */  'Celesta','Glockenspiel','Music Box','Vibraphone','Marimba','Xylophone','Tubular Bells','Dulcimer',
  /* Organ */           'Drawbar Organ','Percussive Organ','Rock Organ','Church Organ','Reed Organ','Accordion','Harmonica','Tango Accordion',
  /* Guitar */          'Acoustic Guitar (nylon)','Acoustic Guitar (steel)','Electric Guitar (jazz)','Electric Guitar (clean)','Electric Guitar (muted)','Overdriven Guitar','Distortion Guitar','Guitar Harmonics',
  /* Bass */            'Acoustic Bass','Electric Bass (finger)','Electric Bass (pick)','Fretless Bass','Slap Bass 1','Slap Bass 2','Synth Bass 1','Synth Bass 2',
  /* Strings */         'Violin','Viola','Cello','Contrabass','Tremolo Strings','Pizzicato Strings','Orchestral Harp','Timpani',
  /* Ensemble */        'String Ensemble 1','String Ensemble 2','Synth Strings 1','Synth Strings 2','Choir Aahs','Voice Oohs','Synth Choir','Orchestra Hit',
  /* Brass */           'Trumpet','Trombone','Tuba','Muted Trumpet','French Horn','Brass Section','Synth Brass 1','Synth Brass 2',
  /* Reed */            'Soprano Sax','Alto Sax','Tenor Sax','Baritone Sax','Oboe','English Horn','Bassoon','Clarinet',
  /* Pipe */            'Piccolo','Flute','Recorder','Pan Flute','Blown Bottle','Shakuhachi','Whistle','Ocarina',
  /* Synth Lead */      'Lead 1 (square)','Lead 2 (sawtooth)','Lead 3 (calliope)','Lead 4 (chiff)','Lead 5 (charang)','Lead 6 (voice)','Lead 7 (fifths)','Lead 8 (bass+lead)',
  /* Synth Pad */       'Pad 1 (new age)','Pad 2 (warm)','Pad 3 (polysynth)','Pad 4 (choir)','Pad 5 (bowed)','Pad 6 (metallic)','Pad 7 (halo)','Pad 8 (sweep)',
  /* Synth FX */        'FX 1 (rain)','FX 2 (soundtrack)','FX 3 (crystal)','FX 4 (atmosphere)','FX 5 (brightness)','FX 6 (goblins)','FX 7 (echoes)','FX 8 (sci-fi)',
  /* Ethnic */          'Sitar','Banjo','Shamisen','Koto','Kalimba','Bagpipe','Fiddle','Shanai',
  /* Percussive */      'Tinkle Bell','Agogo','Steel Drums','Woodblock','Taiko Drum','Melodic Tom','Synth Drum','Reverse Cymbal',
  /* Sound FX */        'Guitar Fret Noise','Breath Noise','Seashore','Bird Tweet','Telephone Ring','Helicopter','Applause','Gunshot',
];

export type GMInstrumentFamily =
  | 'piano' | 'chromatic_percussion' | 'organ' | 'guitar'
  | 'bass' | 'strings' | 'ensemble' | 'brass'
  | 'reed' | 'pipe' | 'synth_lead' | 'synth_pad'
  | 'synth_effects' | 'ethnic' | 'percussive' | 'sound_effects';

export const GM_FAMILIES: { family: GMInstrumentFamily; label: string; range: [number, number] }[] = [
  { family: 'piano',                label: 'Piano',         range: [0, 7] },
  { family: 'chromatic_percussion', label: 'Chromatic Perc', range: [8, 15] },
  { family: 'organ',               label: 'Organ',          range: [16, 23] },
  { family: 'guitar',              label: 'Guitar',         range: [24, 31] },
  { family: 'bass',                label: 'Bass',           range: [32, 39] },
  { family: 'strings',             label: 'Strings',        range: [40, 47] },
  { family: 'ensemble',            label: 'Ensemble',       range: [48, 55] },
  { family: 'brass',               label: 'Brass',          range: [56, 63] },
  { family: 'reed',                label: 'Reed',           range: [64, 71] },
  { family: 'pipe',                label: 'Pipe',           range: [72, 79] },
  { family: 'synth_lead',          label: 'Synth Lead',     range: [80, 87] },
  { family: 'synth_pad',           label: 'Synth Pad',      range: [88, 95] },
  { family: 'synth_effects',       label: 'Synth FX',       range: [96, 103] },
  { family: 'ethnic',              label: 'Ethnic',         range: [104, 111] },
  { family: 'percussive',          label: 'Percussive',     range: [112, 119] },
  { family: 'sound_effects',       label: 'Sound FX',       range: [120, 127] },
];
