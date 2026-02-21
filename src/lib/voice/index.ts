/**
 * Voice Production Pipeline Library
 *
 * Complete voice production system for generating dialogue,
 * assembling chapters, and exporting audio files.
 */

// Dialogue Generator
export {
  dialogueGenerator,
  DialogueGenerator,
  type DialogueLine,
  type AudioSegment,
  type SceneDialogueResult,
  type VoiceAssignment,
  type DialogueGeneratorOptions,
} from './DialogueGenerator';

// Chapter Assembler
export {
  chapterAssembler,
  ChapterAssembler,
  type ChapterAudio,
  type ChapterScene,
  type ChapterMetadata,
  type TransitionConfig,
  type AssemblyOptions,
  type AssemblyProgress,
} from './ChapterAssembler';

// Export Pipeline
export {
  exportPipeline,
  ExportPipeline,
  type AudioFormat,
  type MP3Quality,
  type AudioQualitySettings,
  type AudioMetadataTags,
  type ExportJob,
  type ExportOutput,
  type ExportProgress,
} from './ExportPipeline';

// Emotion Controller
export {
  emotionController,
  EmotionController,
  DEFAULT_EMOTION,
  DEFAULT_PACING,
  DEFAULT_PERFORMANCE,
  BUILTIN_PRESETS,
  type EmotionType,
  type EmotionConfig,
  type PacingConfig,
  type EmphasisMarker,
  type DeliveryPreset,
  type PerformanceVersion,
  type PerformanceConfig,
  type SSMLParameters,
} from './EmotionController';

// Voice Matcher
export {
  voiceMatcher,
  VoiceMatcher,
  DEFAULT_DIRECTION,
  type CharacterVoiceTraits,
  type VoiceProfile,
  type VoiceMatch,
  type AuditionConfig,
  type AuditionLine,
  type VoiceDirection,
  type CastingComparison,
  type VoiceLibraryFilter,
} from './VoiceMatcher';
