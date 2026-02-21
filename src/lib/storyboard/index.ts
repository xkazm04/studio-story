/**
 * Storyboard Library
 *
 * AI-powered shot suggestion and cinematography recommendation system
 * for professional storyboard creation.
 */

export {
  shotSuggester,
  ShotSuggesterClass,
  type ShotType,
  type CameraAngle,
  type CameraMovement,
  type TransitionType,
  type SceneMood,
  type ActionType,
  type ShotSuggestion,
  type AlternativeShot,
  type SceneAnalysis,
  type KeyMoment,
  type ShotLibraryEntry,
  type SuggestOptions,
} from './ShotSuggester';

export {
  cinematographyAdvisor,
  CinematographyAdvisor,
  type TechniqueCategory,
  type EmotionalGoal,
  type CinematographyTechnique,
  type TechniqueRecommendation,
  type CompositionRule,
  type StyleReference,
  type CinematographyAdvice,
  type SceneStyleGuide,
} from './CinematographyAdvisor';

export {
  boardExporter,
  BoardExporter,
  type ExportFormat,
  type PageOrientation,
  type PageSize,
  type GridLayout,
  type ExportOptions,
  type StoryboardExportData,
  type ExportResult,
} from './BoardExporter';

export {
  timingController,
  TimingController,
  DEFAULT_CONFIG as TIMING_CONFIG,
  DEFAULT_KEN_BURNS,
  DEFAULT_TIMING,
  TRANSITION_PRESETS,
  EASING_FUNCTIONS,
  type TransitionType as AnimaticTransitionType,
  type EasingType,
  type KenBurnsEffect,
  type PanelTiming,
  type AudioMarker,
  type AudioTrack,
  type TimelineState,
  type TimingControllerConfig,
} from './TimingController';

export {
  animaticExporter,
  AnimaticExporter,
  DEFAULT_EXPORT_SETTINGS,
  RESOLUTION_MAP,
  QUALITY_BITRATE_MAP,
  type ExportFormat as AnimaticExportFormat,
  type ExportQuality,
  type ExportResolution,
  type ExportSettings,
  type PanelData,
  type ExportProgress,
  type ExportResult as AnimaticExportResult,
} from './AnimaticExporter';
