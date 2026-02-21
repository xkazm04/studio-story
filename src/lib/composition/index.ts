/**
 * Composition Library - Visual Composition Analysis and Guides
 *
 * Provides tools for composition overlays, focal point detection,
 * and layout suggestions for improved visual compositions.
 */

export {
  compositionOverlay,
  CompositionOverlay,
  type GridType,
  type SpiralOrientation,
  type DiagonalType,
  type Point,
  type Line,
  type GridConfig,
  type GridOverlay,
  type CompositionTemplate,
} from './CompositionOverlay';

export {
  focalPointDetector,
  FocalPointDetector,
  type FocalPoint,
  type VisualWeight,
  type BalanceAnalysis,
  type BalanceSuggestion,
  type DetectionOptions,
} from './FocalPointDetector';
