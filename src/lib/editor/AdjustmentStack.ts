/**
 * AdjustmentStack - Non-Destructive Adjustment Layer Management
 *
 * Manages a stack of adjustment layers for non-destructive image editing.
 * Each layer contains adjustment parameters that are composed in order.
 */

// ============================================================================
// Types
// ============================================================================

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export type AdjustmentType =
  | 'brightness-contrast'
  | 'levels'
  | 'curves'
  | 'hsl'
  | 'color-balance'
  | 'vibrance'
  | 'exposure'
  | 'temperature'
  | 'blur'
  | 'sharpen'
  | 'vignette'
  | 'grain'
  | 'chromatic-aberration'
  | 'split-toning'
  | 'gradient-map'
  | 'color-lookup';

export interface BrightnessContrastParams {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
}

export interface LevelsParams {
  inputBlack: number; // 0 to 255
  inputWhite: number; // 0 to 255
  inputGamma: number; // 0.1 to 10
  outputBlack: number; // 0 to 255
  outputWhite: number; // 0 to 255
  channel: 'rgb' | 'red' | 'green' | 'blue';
}

export interface CurvePoint {
  x: number; // 0 to 255
  y: number; // 0 to 255
}

export interface CurvesParams {
  rgb: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface HSLParams {
  hue: number; // -180 to 180
  saturation: number; // -100 to 100
  lightness: number; // -100 to 100
  targetHue?: 'all' | 'reds' | 'oranges' | 'yellows' | 'greens' | 'cyans' | 'blues' | 'purples' | 'magentas';
}

export interface ColorBalanceParams {
  shadows: { cyan_red: number; magenta_green: number; yellow_blue: number };
  midtones: { cyan_red: number; magenta_green: number; yellow_blue: number };
  highlights: { cyan_red: number; magenta_green: number; yellow_blue: number };
  preserveLuminosity: boolean;
}

export interface VibranceParams {
  vibrance: number; // -100 to 100
  saturation: number; // -100 to 100
}

export interface ExposureParams {
  exposure: number; // -5 to 5
  offset: number; // -0.5 to 0.5
  gamma: number; // 0.1 to 10
}

export interface TemperatureParams {
  temperature: number; // -100 (cool) to 100 (warm)
  tint: number; // -100 (green) to 100 (magenta)
}

export interface BlurParams {
  type: 'gaussian' | 'box' | 'motion' | 'radial' | 'lens';
  radius: number; // 0 to 100
  angle?: number; // For motion blur, 0 to 360
  centerX?: number; // For radial blur, 0 to 1
  centerY?: number; // For radial blur, 0 to 1
}

export interface SharpenParams {
  amount: number; // 0 to 500
  radius: number; // 0.1 to 5
  threshold: number; // 0 to 255
  type: 'unsharp-mask' | 'high-pass' | 'smart';
}

export interface VignetteParams {
  amount: number; // -100 (lighten) to 100 (darken)
  midpoint: number; // 0 to 100
  roundness: number; // -100 to 100
  feather: number; // 0 to 100
  highlightPriority: boolean;
}

export interface GrainParams {
  amount: number; // 0 to 100
  size: number; // 0 to 100
  roughness: number; // 0 to 100
  monochromatic: boolean;
}

export interface ChromaticAberrationParams {
  redCyan: number; // -100 to 100
  blueYellow: number; // -100 to 100
}

export interface SplitToningParams {
  highlightHue: number; // 0 to 360
  highlightSaturation: number; // 0 to 100
  shadowHue: number; // 0 to 360
  shadowSaturation: number; // 0 to 100
  balance: number; // -100 to 100
}

export interface GradientMapParams {
  stops: Array<{ position: number; color: string }>;
  dithering: boolean;
}

export interface ColorLookupParams {
  lutId: string;
  intensity: number; // 0 to 100
}

export type AdjustmentParams =
  | { type: 'brightness-contrast'; params: BrightnessContrastParams }
  | { type: 'levels'; params: LevelsParams }
  | { type: 'curves'; params: CurvesParams }
  | { type: 'hsl'; params: HSLParams }
  | { type: 'color-balance'; params: ColorBalanceParams }
  | { type: 'vibrance'; params: VibranceParams }
  | { type: 'exposure'; params: ExposureParams }
  | { type: 'temperature'; params: TemperatureParams }
  | { type: 'blur'; params: BlurParams }
  | { type: 'sharpen'; params: SharpenParams }
  | { type: 'vignette'; params: VignetteParams }
  | { type: 'grain'; params: GrainParams }
  | { type: 'chromatic-aberration'; params: ChromaticAberrationParams }
  | { type: 'split-toning'; params: SplitToningParams }
  | { type: 'gradient-map'; params: GradientMapParams }
  | { type: 'color-lookup'; params: ColorLookupParams };

export interface AdjustmentLayer {
  id: string;
  name: string;
  type: AdjustmentType;
  adjustment: AdjustmentParams;
  visible: boolean;
  opacity: number; // 0 to 100
  blendMode: BlendMode;
  order: number;
  mask?: {
    enabled: boolean;
    inverted: boolean;
    feather: number;
  };
}

export interface LayerStack {
  id: string;
  name: string;
  layers: AdjustmentLayer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryEntry {
  id: string;
  action: 'add' | 'remove' | 'update' | 'reorder' | 'toggle-visibility';
  layerId: string;
  previousState?: AdjustmentLayer;
  newState?: AdjustmentLayer;
  timestamp: Date;
}

// ============================================================================
// Default Parameters
// ============================================================================

export const DEFAULT_PARAMS: Record<AdjustmentType, AdjustmentParams['params']> = {
  'brightness-contrast': { brightness: 0, contrast: 0 } as BrightnessContrastParams,
  levels: {
    inputBlack: 0,
    inputWhite: 255,
    inputGamma: 1,
    outputBlack: 0,
    outputWhite: 255,
    channel: 'rgb',
  } as LevelsParams,
  curves: {
    rgb: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    red: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    green: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
    blue: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
  } as CurvesParams,
  hsl: { hue: 0, saturation: 0, lightness: 0, targetHue: 'all' } as HSLParams,
  'color-balance': {
    shadows: { cyan_red: 0, magenta_green: 0, yellow_blue: 0 },
    midtones: { cyan_red: 0, magenta_green: 0, yellow_blue: 0 },
    highlights: { cyan_red: 0, magenta_green: 0, yellow_blue: 0 },
    preserveLuminosity: true,
  } as ColorBalanceParams,
  vibrance: { vibrance: 0, saturation: 0 } as VibranceParams,
  exposure: { exposure: 0, offset: 0, gamma: 1 } as ExposureParams,
  temperature: { temperature: 0, tint: 0 } as TemperatureParams,
  blur: { type: 'gaussian', radius: 0 } as BlurParams,
  sharpen: { amount: 0, radius: 1, threshold: 0, type: 'unsharp-mask' } as SharpenParams,
  vignette: {
    amount: 0,
    midpoint: 50,
    roundness: 0,
    feather: 50,
    highlightPriority: false,
  } as VignetteParams,
  grain: { amount: 0, size: 25, roughness: 50, monochromatic: false } as GrainParams,
  'chromatic-aberration': { redCyan: 0, blueYellow: 0 } as ChromaticAberrationParams,
  'split-toning': {
    highlightHue: 0,
    highlightSaturation: 0,
    shadowHue: 0,
    shadowSaturation: 0,
    balance: 0,
  } as SplitToningParams,
  'gradient-map': {
    stops: [
      { position: 0, color: '#000000' },
      { position: 1, color: '#ffffff' },
    ],
    dithering: true,
  } as GradientMapParams,
  'color-lookup': { lutId: '', intensity: 100 } as ColorLookupParams,
};

// ============================================================================
// AdjustmentStack Class
// ============================================================================

export class AdjustmentStack {
  private static instance: AdjustmentStack;
  private stacks: Map<string, LayerStack> = new Map();
  private history: Map<string, HistoryEntry[]> = new Map();
  private maxHistorySize = 50;
  private listeners: Map<string, Set<(stack: LayerStack) => void>> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): AdjustmentStack {
    if (!AdjustmentStack.instance) {
      AdjustmentStack.instance = new AdjustmentStack();
    }
    return AdjustmentStack.instance;
  }

  // -------------------------------------------------------------------------
  // Stack Management
  // -------------------------------------------------------------------------

  createStack(name?: string): LayerStack {
    const id = `stack_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const stack: LayerStack = {
      id,
      name: name || `Stack ${id.slice(-6)}`,
      layers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.stacks.set(id, stack);
    this.history.set(id, []);
    this.saveToStorage();
    return stack;
  }

  getStack(id: string): LayerStack | undefined {
    return this.stacks.get(id);
  }

  getAllStacks(): LayerStack[] {
    return Array.from(this.stacks.values());
  }

  deleteStack(id: string): boolean {
    const deleted = this.stacks.delete(id);
    this.history.delete(id);
    this.listeners.delete(id);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  duplicateStack(id: string): LayerStack | undefined {
    const original = this.stacks.get(id);
    if (!original) return undefined;

    const newStack = this.createStack(`${original.name} (Copy)`);
    newStack.layers = original.layers.map((layer) => ({
      ...layer,
      id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    }));

    this.stacks.set(newStack.id, newStack);
    this.saveToStorage();
    return newStack;
  }

  // -------------------------------------------------------------------------
  // Layer Management
  // -------------------------------------------------------------------------

  addLayer(stackId: string, type: AdjustmentType, name?: string): AdjustmentLayer | undefined {
    const stack = this.stacks.get(stackId);
    if (!stack) return undefined;

    const id = `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const defaultParams = DEFAULT_PARAMS[type];

    const layer: AdjustmentLayer = {
      id,
      name: name || this.getDefaultLayerName(type),
      type,
      adjustment: { type, params: JSON.parse(JSON.stringify(defaultParams)) } as AdjustmentParams,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      order: stack.layers.length,
    };

    stack.layers.push(layer);
    stack.updatedAt = new Date();

    this.addHistoryEntry(stackId, {
      id: `history_${Date.now()}`,
      action: 'add',
      layerId: id,
      newState: layer,
      timestamp: new Date(),
    });

    this.saveToStorage();
    this.notifyListeners(stackId);
    return layer;
  }

  updateLayer(
    stackId: string,
    layerId: string,
    updates: Partial<Omit<AdjustmentLayer, 'id' | 'type'>>
  ): AdjustmentLayer | undefined {
    const stack = this.stacks.get(stackId);
    if (!stack) return undefined;

    const layerIndex = stack.layers.findIndex((l) => l.id === layerId);
    if (layerIndex === -1) return undefined;

    const previousState = { ...stack.layers[layerIndex] };
    const updatedLayer = { ...stack.layers[layerIndex], ...updates };
    stack.layers[layerIndex] = updatedLayer;
    stack.updatedAt = new Date();

    this.addHistoryEntry(stackId, {
      id: `history_${Date.now()}`,
      action: 'update',
      layerId,
      previousState,
      newState: updatedLayer,
      timestamp: new Date(),
    });

    this.saveToStorage();
    this.notifyListeners(stackId);
    return updatedLayer;
  }

  removeLayer(stackId: string, layerId: string): boolean {
    const stack = this.stacks.get(stackId);
    if (!stack) return false;

    const layerIndex = stack.layers.findIndex((l) => l.id === layerId);
    if (layerIndex === -1) return false;

    const removedLayer = stack.layers[layerIndex];
    stack.layers.splice(layerIndex, 1);

    // Reorder remaining layers
    stack.layers.forEach((layer, index) => {
      layer.order = index;
    });

    stack.updatedAt = new Date();

    this.addHistoryEntry(stackId, {
      id: `history_${Date.now()}`,
      action: 'remove',
      layerId,
      previousState: removedLayer,
      timestamp: new Date(),
    });

    this.saveToStorage();
    this.notifyListeners(stackId);
    return true;
  }

  reorderLayers(stackId: string, layerIds: string[]): boolean {
    const stack = this.stacks.get(stackId);
    if (!stack) return false;

    const reorderedLayers: AdjustmentLayer[] = [];
    for (const id of layerIds) {
      const layer = stack.layers.find((l) => l.id === id);
      if (layer) {
        layer.order = reorderedLayers.length;
        reorderedLayers.push(layer);
      }
    }

    if (reorderedLayers.length !== stack.layers.length) return false;

    stack.layers = reorderedLayers;
    stack.updatedAt = new Date();

    this.saveToStorage();
    this.notifyListeners(stackId);
    return true;
  }

  toggleLayerVisibility(stackId: string, layerId: string): boolean {
    const stack = this.stacks.get(stackId);
    if (!stack) return false;

    const layer = stack.layers.find((l) => l.id === layerId);
    if (!layer) return false;

    const previousState = { ...layer };
    layer.visible = !layer.visible;
    stack.updatedAt = new Date();

    this.addHistoryEntry(stackId, {
      id: `history_${Date.now()}`,
      action: 'toggle-visibility',
      layerId,
      previousState,
      newState: layer,
      timestamp: new Date(),
    });

    this.saveToStorage();
    this.notifyListeners(stackId);
    return true;
  }

  duplicateLayer(stackId: string, layerId: string): AdjustmentLayer | undefined {
    const stack = this.stacks.get(stackId);
    if (!stack) return undefined;

    const originalLayer = stack.layers.find((l) => l.id === layerId);
    if (!originalLayer) return undefined;

    const newLayer: AdjustmentLayer = {
      ...JSON.parse(JSON.stringify(originalLayer)),
      id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name: `${originalLayer.name} (Copy)`,
      order: stack.layers.length,
    };

    stack.layers.push(newLayer);
    stack.updatedAt = new Date();

    this.addHistoryEntry(stackId, {
      id: `history_${Date.now()}`,
      action: 'add',
      layerId: newLayer.id,
      newState: newLayer,
      timestamp: new Date(),
    });

    this.saveToStorage();
    this.notifyListeners(stackId);
    return newLayer;
  }

  // -------------------------------------------------------------------------
  // Compositing
  // -------------------------------------------------------------------------

  getActiveAdjustments(stackId: string): AdjustmentLayer[] {
    const stack = this.stacks.get(stackId);
    if (!stack) return [];

    return stack.layers
      .filter((layer) => layer.visible && layer.opacity > 0)
      .sort((a, b) => a.order - b.order);
  }

  flattenStack(stackId: string): AdjustmentParams[] {
    return this.getActiveAdjustments(stackId).map((layer) => layer.adjustment);
  }

  // -------------------------------------------------------------------------
  // History
  // -------------------------------------------------------------------------

  undo(stackId: string): boolean {
    const history = this.history.get(stackId);
    if (!history || history.length === 0) return false;

    const lastEntry = history.pop();
    if (!lastEntry) return false;

    const stack = this.stacks.get(stackId);
    if (!stack) return false;

    switch (lastEntry.action) {
      case 'add':
        stack.layers = stack.layers.filter((l) => l.id !== lastEntry.layerId);
        break;
      case 'remove':
        if (lastEntry.previousState) {
          stack.layers.push(lastEntry.previousState);
          stack.layers.sort((a, b) => a.order - b.order);
        }
        break;
      case 'update':
      case 'toggle-visibility':
        if (lastEntry.previousState) {
          const index = stack.layers.findIndex((l) => l.id === lastEntry.layerId);
          if (index !== -1) {
            stack.layers[index] = lastEntry.previousState;
          }
        }
        break;
    }

    stack.updatedAt = new Date();
    this.saveToStorage();
    this.notifyListeners(stackId);
    return true;
  }

  getHistory(stackId: string): HistoryEntry[] {
    return this.history.get(stackId) || [];
  }

  clearHistory(stackId: string): void {
    this.history.set(stackId, []);
  }

  private addHistoryEntry(stackId: string, entry: HistoryEntry): void {
    let history = this.history.get(stackId);
    if (!history) {
      history = [];
      this.history.set(stackId, history);
    }

    history.push(entry);

    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  // -------------------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------------------

  subscribe(stackId: string, callback: (stack: LayerStack) => void): () => void {
    let listeners = this.listeners.get(stackId);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(stackId, listeners);
    }

    listeners.add(callback);

    return () => {
      listeners?.delete(callback);
    };
  }

  private notifyListeners(stackId: string): void {
    const stack = this.stacks.get(stackId);
    const listeners = this.listeners.get(stackId);

    if (stack && listeners) {
      listeners.forEach((callback) => callback(stack));
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private getDefaultLayerName(type: AdjustmentType): string {
    const names: Record<AdjustmentType, string> = {
      'brightness-contrast': 'Brightness/Contrast',
      levels: 'Levels',
      curves: 'Curves',
      hsl: 'Hue/Saturation',
      'color-balance': 'Color Balance',
      vibrance: 'Vibrance',
      exposure: 'Exposure',
      temperature: 'Temperature',
      blur: 'Blur',
      sharpen: 'Sharpen',
      vignette: 'Vignette',
      grain: 'Grain',
      'chromatic-aberration': 'Chromatic Aberration',
      'split-toning': 'Split Toning',
      'gradient-map': 'Gradient Map',
      'color-lookup': 'Color Lookup',
    };

    return names[type];
  }

  // -------------------------------------------------------------------------
  // Storage
  // -------------------------------------------------------------------------

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('adjustmentStack_stacks');
      if (stored) {
        const data = JSON.parse(stored) as Record<string, LayerStack>;
        this.stacks = new Map(
          Object.entries(data).map(([id, stack]) => [
            id,
            {
              ...stack,
              createdAt: new Date(stack.createdAt),
              updatedAt: new Date(stack.updatedAt),
            },
          ])
        );
      }
    } catch (err) {
      console.error('Failed to load AdjustmentStack from storage:', err);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = Object.fromEntries(this.stacks);
      localStorage.setItem('adjustmentStack_stacks', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save AdjustmentStack to storage:', err);
    }
  }

  // -------------------------------------------------------------------------
  // Import/Export
  // -------------------------------------------------------------------------

  exportStack(stackId: string): string | undefined {
    const stack = this.stacks.get(stackId);
    if (!stack) return undefined;

    return JSON.stringify(stack, null, 2);
  }

  importStack(json: string): LayerStack | undefined {
    try {
      const data = JSON.parse(json) as LayerStack;

      // Generate new IDs to avoid conflicts
      const newStack = this.createStack(data.name);
      newStack.layers = data.layers.map((layer, index) => ({
        ...layer,
        id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        order: index,
      }));

      this.stacks.set(newStack.id, newStack);
      this.saveToStorage();
      return newStack;
    } catch (err) {
      console.error('Failed to import stack:', err);
      return undefined;
    }
  }
}

// Export singleton instance
export const adjustmentStack = AdjustmentStack.getInstance();
