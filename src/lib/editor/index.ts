/**
 * Editor Library - Non-Destructive Image Editing System
 *
 * Provides professional-grade adjustment layers, color correction,
 * and filter processing for image editing.
 */

export {
  adjustmentStack,
  AdjustmentStack,
  DEFAULT_PARAMS,
  type BlendMode,
  type AdjustmentType,
  type AdjustmentParams,
  type AdjustmentLayer,
  type LayerStack,
  type HistoryEntry,
  type BrightnessContrastParams,
  type LevelsParams,
  type CurvesParams,
  type CurvePoint,
  type HSLParams,
  type ColorBalanceParams,
  type VibranceParams,
  type ExposureParams,
  type TemperatureParams,
  type BlurParams,
  type SharpenParams,
  type VignetteParams,
  type GrainParams,
  type ChromaticAberrationParams,
  type SplitToningParams,
  type GradientMapParams,
  type ColorLookupParams,
} from './AdjustmentStack';

export {
  colorCorrection,
  ColorCorrection,
  type ProcessingContext,
  type FilterResult,
} from './ColorCorrection';

export {
  selectionTools,
  SelectionTools,
  type SelectionToolType,
  type SelectionMode,
  type Point,
  type BoundingBox,
  type SelectionPath,
  type Selection,
  type MagicWandOptions,
  type SelectionOptions,
  type SelectionToolState,
} from './SelectionTools';

export {
  transformTools,
  TransformTools,
  type TransformToolType,
  type HandlePosition,
  type TransformState,
  type CropRect,
  type TransformOperation,
  type TransformHandle,
  type TransformConstraints,
} from './TransformTools';
