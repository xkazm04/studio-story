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

// Emotion Taxonomy (canonical source of truth for all emotion definitions)
export {
  type EmotionType,
  type EmotionEntry,
  type ValenceGroup,
  EMOTION_ENTRIES,
  ALL_EMOTION_TYPES,
  VALENCE_GROUPS,
  EMOTION_VOICE_MODIFIERS,
  EMOTION_SSML_MAP,
  COMPLEMENTARY_EMOTIONS,
  getEmotionEntry,
  getEmotionLabel,
  getEmotionHexColor,
  getEmotionTailwindColor,
  getEmotionIcon,
  suggestEmotions,
} from './EmotionTaxonomy';

// Emotion Controller
export {
  emotionController,
  EmotionController,
  DEFAULT_EMOTION,
  DEFAULT_PACING,
  DEFAULT_PERFORMANCE,
  BUILTIN_PRESETS,
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
  DEFAULT_PERFORMANCE_TUNING,
  type CharacterVoiceTraits,
  type VoiceProfile,
  type VoiceMatch,
  type AuditionConfig,
  type AuditionLine,
  type PerformanceTuning,
  type CastingComparison,
  type VoiceLibraryFilter,
} from './VoiceMatcher';
