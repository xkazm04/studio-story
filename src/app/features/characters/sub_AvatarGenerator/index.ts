/**
 * Avatar Generator Module
 * Character avatar generation with style presets, expressions, poses, and batch generation
 */

export { default as AvatarGenerator } from './AvatarGenerator';
export { default as StyleSelector } from './components/StyleSelector';
export { default as ReferenceSelector } from './components/ReferenceSelector';
export { default as AvatarGrid } from './components/AvatarGrid';
export { default as CurrentAvatar } from './components/CurrentAvatar';

// Multi-pose avatar system components
export { default as ExpressionLibrary } from './components/ExpressionLibrary';
export { default as PoseSelector } from './components/PoseSelector';
export { default as IntensityControl } from './components/IntensityControl';
export { default as BatchGenerator } from './components/BatchGenerator';
export { default as ExpressionBlender } from './components/ExpressionBlender';
export { default as AvatarSheetExporter } from './components/AvatarSheetExporter';

// Avatar evolution & timeline system components
export { default as AvatarTimeline } from './components/AvatarTimeline';
export { default as AgeProgressor } from './components/AgeProgressor';
export { default as TransformationTracker } from './components/TransformationTracker';
export { default as ComparisonView } from './components/ComparisonView';
export { default as EvolutionExporter } from './components/EvolutionExporter';

// Cross-character style consistency components
export { default as StyleDefinition } from './components/StyleDefinition';
export { default as CastPreview } from './components/CastPreview';
export { default as StyleTransfer } from './components/StyleTransfer';
export { default as ConsistencyChecker } from './components/ConsistencyChecker';
export { default as BatchStyler } from './components/BatchStyler';

// Type exports
export type {
  Expression,
  ExpressionCategory,
  ExpressionLibraryProps,
} from './components/ExpressionLibrary';
export type {
  Pose,
  Angle,
  PoseCategory,
  PoseSelectorProps,
} from './components/PoseSelector';
export type {
  IntensityLevel,
  IntensityControlProps,
} from './components/IntensityControl';
export type {
  BatchItem,
  BatchItemStatus,
  BatchProgress,
  BatchGeneratorProps,
} from './components/BatchGenerator';
export type {
  BlendedExpression,
  BlendResult,
  ExpressionBlenderProps,
} from './components/ExpressionBlender';
export type {
  ExportSettings,
  ExportFormat,
  AvatarSheetItem,
  AvatarSheetExporterProps,
} from './components/AvatarSheetExporter';
export type { AvatarTimelineProps } from './components/AvatarTimeline';
export type { AgeProgressorProps } from './components/AgeProgressor';
export type { TransformationTrackerProps } from './components/TransformationTracker';
export type {
  ComparisonMode,
  ComparisonPair,
  ComparisonViewProps,
} from './components/ComparisonView';
export type {
  ExportLayout,
  ExportSettings as EvolutionExportSettings,
  EvolutionExporterProps,
} from './components/EvolutionExporter';

// Style engine exports
export {
  ART_DIRECTION_PRESETS,
  DEFAULT_COLOR_PALETTE,
  DEFAULT_LIGHTING,
  createStyleDefinition,
  calculateStyleDeviation,
  generateStyledPrompt,
  generateConsistencyReport,
} from './lib/styleEngine';
export type {
  StyleDefinition as StyleDefinitionType,
  ArtDirection,
  ColorPaletteConstraint,
  LightingConstraint,
  CharacterStyleProfile,
  StyleConsistencyReport,
  StyleDeviation,
  ConsistencyLevel,
} from './lib/styleEngine';

// Default export for dynamic import
export { default } from './AvatarGenerator';
