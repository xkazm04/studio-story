/**
 * Canvas Library - Professional Drawing Canvas System
 */

export {
  canvasEngine,
  CanvasEngine,
  DEFAULT_BRUSH,
  DEFAULT_CONFIG as ENGINE_CONFIG,
  DEFAULT_STATE,
  type Point,
  type StrokePoint,
  type Stroke,
  type BrushSettings,
  type BrushType,
  type BlendMode,
  type CanvasState,
  type EngineConfig,
  type DrawingEvent,
} from './CanvasEngine';

export {
  layerManager,
  LayerManager,
  DEFAULT_CONFIG as LAYER_CONFIG,
  BLEND_MODE_MAP,
  type Layer,
  type LayerGroup,
  type LayerState,
  type LayerManagerConfig,
} from './LayerManager';
