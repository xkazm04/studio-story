/**
 * Audio Narration Library
 *
 * Comprehensive TTS production system with voice management,
 * SSML generation, and timing synchronization.
 */

export {
  narrationGenerator,
  NarrationGenerator,
  SSMLGenerator,
  TimingMarkerManager,
  VoiceManager,
  PRESET_VOICES,
  DEFAULT_VOICE_SETTINGS,
  DEFAULT_SSML_OPTIONS,
  DEFAULT_GENERATION_OPTIONS,
  type VoiceProvider,
  type VoiceConfig,
  type VoiceSettings,
  type CharacterVoiceAssignment,
  type EmotionVoiceOverride,
  type NarratorConfig,
  type TimingMarker,
  type NarrationBlock,
  type AudioData,
  type ChapterAudio,
  type SSMLOptions,
  type GenerationOptions,
  type NarrationProject,
} from './NarrationGenerator';
