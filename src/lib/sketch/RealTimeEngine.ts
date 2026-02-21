/**
 * RealTimeEngine - Live Generation System for Sketch-to-Image
 *
 * Provides real-time preview generation with progressive refinement,
 * debounced triggers, and variation management.
 */

// ============================================================================
// Types
// ============================================================================

export type GenerationQuality = 'draft' | 'preview' | 'standard' | 'high';
export type GenerationStatus = 'idle' | 'pending' | 'generating' | 'complete' | 'error';

export interface StyleParameters {
  // Core style
  stylization: number; // 0-100: How much to stylize vs. preserve original
  detailLevel: number; // 0-100: Level of detail in output
  colorVibrancy: number; // 0-100: Color saturation/vibrancy

  // Composition
  structureAdherence: number; // 0-100: How closely to follow sketch structure
  creativeFreedom: number; // 0-100: Allow AI creative interpretation

  // Rendering
  lineWeight: number; // 0-100: Emphasis on lines vs. fills
  smoothness: number; // 0-100: Smooth vs. rough rendering
  contrast: number; // 0-100: Output contrast

  // Style preset
  stylePreset: StylePreset;
}

export type StylePreset =
  | 'realistic'
  | 'anime'
  | 'digital-art'
  | 'watercolor'
  | 'oil-painting'
  | 'pencil-sketch'
  | 'comic'
  | 'fantasy'
  | 'cinematic'
  | 'custom';

export interface GenerationRequest {
  id: string;
  sketchData: string; // Base64 encoded image
  prompt: string;
  negativePrompt?: string;
  style: StyleParameters;
  quality: GenerationQuality;
  seed?: number;
  timestamp: Date;
}

export interface GenerationResult {
  id: string;
  requestId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  quality: GenerationQuality;
  confidence: number; // 0-1 confidence score
  processingTime: number; // ms
  timestamp: Date;
  isPinned: boolean;
  metadata?: {
    width: number;
    height: number;
    seed: number;
    model?: string;
  };
}

export interface Variation {
  id: string;
  parentId?: string;
  result: GenerationResult;
  style: StyleParameters;
  label?: string;
}

export interface ProgressInfo {
  stage: 'encoding' | 'processing' | 'refining' | 'complete';
  progress: number; // 0-100
  currentQuality: GenerationQuality;
  estimatedTimeRemaining?: number; // ms
}

export interface EngineConfig {
  debounceMs: number;
  maxConcurrentGenerations: number;
  autoRefineEnabled: boolean;
  maxVariations: number;
  cacheEnabled: boolean;
  cacheMaxSize: number;
}

type GenerationCallback = (result: GenerationResult) => void;
type ProgressCallback = (progress: ProgressInfo) => void;
type ErrorCallback = (error: Error) => void;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STYLE: StyleParameters = {
  stylization: 50,
  detailLevel: 50,
  colorVibrancy: 50,
  structureAdherence: 70,
  creativeFreedom: 30,
  lineWeight: 50,
  smoothness: 50,
  contrast: 50,
  stylePreset: 'digital-art',
};

const DEFAULT_CONFIG: EngineConfig = {
  debounceMs: 1000,
  maxConcurrentGenerations: 3,
  autoRefineEnabled: true,
  maxVariations: 8,
  cacheEnabled: true,
  cacheMaxSize: 50,
};

const QUALITY_SETTINGS: Record<GenerationQuality, { steps: number; size: number; timeout: number }> = {
  draft: { steps: 10, size: 256, timeout: 5000 },
  preview: { steps: 20, size: 384, timeout: 10000 },
  standard: { steps: 30, size: 512, timeout: 20000 },
  high: { steps: 50, size: 768, timeout: 45000 },
};

const STYLE_PRESETS: Record<StylePreset, Partial<StyleParameters>> = {
  realistic: {
    stylization: 20,
    detailLevel: 80,
    structureAdherence: 90,
    creativeFreedom: 10,
    smoothness: 60,
  },
  anime: {
    stylization: 80,
    detailLevel: 60,
    colorVibrancy: 70,
    lineWeight: 70,
    smoothness: 80,
  },
  'digital-art': {
    stylization: 60,
    detailLevel: 70,
    colorVibrancy: 60,
    creativeFreedom: 40,
  },
  watercolor: {
    stylization: 70,
    detailLevel: 40,
    colorVibrancy: 50,
    smoothness: 80,
    lineWeight: 20,
  },
  'oil-painting': {
    stylization: 75,
    detailLevel: 60,
    colorVibrancy: 70,
    smoothness: 30,
    contrast: 60,
  },
  'pencil-sketch': {
    stylization: 30,
    detailLevel: 70,
    colorVibrancy: 10,
    lineWeight: 90,
    smoothness: 40,
  },
  comic: {
    stylization: 85,
    detailLevel: 50,
    colorVibrancy: 80,
    lineWeight: 80,
    contrast: 70,
  },
  fantasy: {
    stylization: 70,
    detailLevel: 80,
    colorVibrancy: 75,
    creativeFreedom: 60,
  },
  cinematic: {
    stylization: 40,
    detailLevel: 90,
    colorVibrancy: 50,
    contrast: 70,
    smoothness: 60,
  },
  custom: {},
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

function hashSketch(sketchData: string): string {
  // Simple hash for cache key
  let hash = 0;
  for (let i = 0; i < sketchData.length; i++) {
    const char = sketchData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Progressive Refiner
// ============================================================================

class ProgressiveRefiner {
  private currentQuality: GenerationQuality = 'draft';
  private isRefining = false;

  getNextQuality(current: GenerationQuality): GenerationQuality | null {
    const order: GenerationQuality[] = ['draft', 'preview', 'standard', 'high'];
    const currentIndex = order.indexOf(current);
    if (currentIndex < order.length - 1) {
      return order[currentIndex + 1];
    }
    return null;
  }

  async refine(
    request: GenerationRequest,
    onProgress: ProgressCallback,
    onResult: GenerationCallback
  ): Promise<void> {
    this.isRefining = true;
    this.currentQuality = 'draft';

    const qualities: GenerationQuality[] = ['draft', 'preview', 'standard'];

    for (let i = 0; i < qualities.length; i++) {
      if (!this.isRefining) break;

      const quality = qualities[i];
      this.currentQuality = quality;

      onProgress({
        stage: i === qualities.length - 1 ? 'refining' : 'processing',
        progress: (i / qualities.length) * 100,
        currentQuality: quality,
        estimatedTimeRemaining: QUALITY_SETTINGS[quality].timeout * (qualities.length - i),
      });

      // Simulate generation at this quality level
      await delay(QUALITY_SETTINGS[quality].timeout / 10); // Faster for demo

      // Create mock result
      const result: GenerationResult = {
        id: generateId(),
        requestId: request.id,
        imageUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${QUALITY_SETTINGS[quality].size}" height="${QUALITY_SETTINGS[quality].size}"><rect fill="%23${Math.floor(Math.random()*16777215).toString(16)}" width="100%" height="100%"/></svg>`,
        quality,
        confidence: 0.5 + (i * 0.15) + (Math.random() * 0.1),
        processingTime: QUALITY_SETTINGS[quality].timeout / 10,
        timestamp: new Date(),
        isPinned: false,
        metadata: {
          width: QUALITY_SETTINGS[quality].size,
          height: QUALITY_SETTINGS[quality].size,
          seed: request.seed || generateSeed(),
        },
      };

      onResult(result);
    }

    onProgress({
      stage: 'complete',
      progress: 100,
      currentQuality: 'standard',
    });

    this.isRefining = false;
  }

  stop(): void {
    this.isRefining = false;
  }

  getCurrentQuality(): GenerationQuality {
    return this.currentQuality;
  }
}

// ============================================================================
// Main Class
// ============================================================================

export class RealTimeEngine {
  private static instance: RealTimeEngine;
  private config: EngineConfig;
  private style: StyleParameters;
  private status: GenerationStatus = 'idle';
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingRequest: GenerationRequest | null = null;
  private activeGenerations: Map<string, AbortController> = new Map();
  private results: GenerationResult[] = [];
  private variations: Variation[] = [];
  private cache: Map<string, GenerationResult> = new Map();
  private refiner: ProgressiveRefiner = new ProgressiveRefiner();

  // Callbacks
  private onResult: GenerationCallback | null = null;
  private onProgress: ProgressCallback | null = null;
  private onError: ErrorCallback | null = null;
  private onStatusChange: ((status: GenerationStatus) => void) | null = null;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.style = { ...DEFAULT_STYLE };
  }

  static getInstance(): RealTimeEngine {
    if (!RealTimeEngine.instance) {
      RealTimeEngine.instance = new RealTimeEngine();
    }
    return RealTimeEngine.instance;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): EngineConfig {
    return { ...this.config };
  }

  setStyle(style: Partial<StyleParameters>): void {
    this.style = { ...this.style, ...style };
  }

  getStyle(): StyleParameters {
    return { ...this.style };
  }

  applyStylePreset(preset: StylePreset): void {
    const presetStyle = STYLE_PRESETS[preset];
    this.style = {
      ...DEFAULT_STYLE,
      ...presetStyle,
      stylePreset: preset,
    };
  }

  getStylePresets(): { preset: StylePreset; label: string }[] {
    return [
      { preset: 'realistic', label: 'Realistic' },
      { preset: 'anime', label: 'Anime' },
      { preset: 'digital-art', label: 'Digital Art' },
      { preset: 'watercolor', label: 'Watercolor' },
      { preset: 'oil-painting', label: 'Oil Painting' },
      { preset: 'pencil-sketch', label: 'Pencil Sketch' },
      { preset: 'comic', label: 'Comic' },
      { preset: 'fantasy', label: 'Fantasy' },
      { preset: 'cinematic', label: 'Cinematic' },
      { preset: 'custom', label: 'Custom' },
    ];
  }

  // ============================================================================
  // Callbacks
  // ============================================================================

  onResultCallback(callback: GenerationCallback): void {
    this.onResult = callback;
  }

  onProgressCallback(callback: ProgressCallback): void {
    this.onProgress = callback;
  }

  onErrorCallback(callback: ErrorCallback): void {
    this.onError = callback;
  }

  onStatusChangeCallback(callback: (status: GenerationStatus) => void): void {
    this.onStatusChange = callback;
  }

  // ============================================================================
  // Generation
  // ============================================================================

  /**
   * Request a generation with debouncing
   */
  requestGeneration(
    sketchData: string,
    prompt: string,
    options?: {
      negativePrompt?: string;
      quality?: GenerationQuality;
      seed?: number;
      immediate?: boolean;
    }
  ): string {
    const requestId = generateId();

    const request: GenerationRequest = {
      id: requestId,
      sketchData,
      prompt,
      negativePrompt: options?.negativePrompt,
      style: { ...this.style },
      quality: options?.quality || 'preview',
      seed: options?.seed,
      timestamp: new Date(),
    };

    // Check cache first
    if (this.config.cacheEnabled) {
      const cacheKey = this.getCacheKey(request);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.onResult?.(cached);
        return requestId;
      }
    }

    this.pendingRequest = request;
    this.setStatus('pending');

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Start generation immediately or with debounce
    if (options?.immediate) {
      this.startGeneration(request);
    } else {
      this.debounceTimer = setTimeout(() => {
        this.startGeneration(request);
      }, this.config.debounceMs);
    }

    return requestId;
  }

  /**
   * Cancel pending or active generation
   */
  cancelGeneration(requestId?: string): void {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Stop progressive refiner
    this.refiner.stop();

    // Cancel specific or all generations
    if (requestId) {
      const controller = this.activeGenerations.get(requestId);
      if (controller) {
        controller.abort();
        this.activeGenerations.delete(requestId);
      }
    } else {
      this.activeGenerations.forEach((controller) => controller.abort());
      this.activeGenerations.clear();
    }

    this.pendingRequest = null;
    this.setStatus('idle');
  }

  /**
   * Generate variations of a result
   */
  async generateVariations(
    baseResult: GenerationResult,
    count: number = 4
  ): Promise<Variation[]> {
    const newVariations: Variation[] = [];

    for (let i = 0; i < Math.min(count, this.config.maxVariations); i++) {
      // Create variation with slight style adjustments
      const variedStyle: StyleParameters = {
        ...this.style,
        stylization: this.style.stylization + (Math.random() - 0.5) * 20,
        creativeFreedom: this.style.creativeFreedom + (Math.random() - 0.5) * 20,
      };

      // Clamp values
      variedStyle.stylization = Math.max(0, Math.min(100, variedStyle.stylization));
      variedStyle.creativeFreedom = Math.max(0, Math.min(100, variedStyle.creativeFreedom));

      const variation: Variation = {
        id: generateId(),
        parentId: baseResult.id,
        result: {
          ...baseResult,
          id: generateId(),
          confidence: baseResult.confidence * (0.9 + Math.random() * 0.2),
          metadata: {
            ...baseResult.metadata,
            width: baseResult.metadata?.width || 512,
            height: baseResult.metadata?.height || 512,
            seed: generateSeed(),
          },
        },
        style: variedStyle,
        label: `Variation ${i + 1}`,
      };

      newVariations.push(variation);
      this.variations.push(variation);
    }

    // Trim variations if over limit
    while (this.variations.length > this.config.maxVariations) {
      this.variations.shift();
    }

    return newVariations;
  }

  // ============================================================================
  // Results Management
  // ============================================================================

  getResults(): GenerationResult[] {
    return [...this.results];
  }

  getVariations(): Variation[] {
    return [...this.variations];
  }

  pinResult(resultId: string): void {
    const result = this.results.find((r) => r.id === resultId);
    if (result) {
      result.isPinned = true;
    }
  }

  unpinResult(resultId: string): void {
    const result = this.results.find((r) => r.id === resultId);
    if (result) {
      result.isPinned = false;
    }
  }

  getPinnedResults(): GenerationResult[] {
    return this.results.filter((r) => r.isPinned);
  }

  clearResults(keepPinned: boolean = true): void {
    if (keepPinned) {
      this.results = this.results.filter((r) => r.isPinned);
    } else {
      this.results = [];
    }
    this.variations = [];
  }

  // ============================================================================
  // Status
  // ============================================================================

  getStatus(): GenerationStatus {
    return this.status;
  }

  isGenerating(): boolean {
    return this.status === 'generating';
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setStatus(status: GenerationStatus): void {
    this.status = status;
    this.onStatusChange?.(status);
  }

  private getCacheKey(request: GenerationRequest): string {
    const sketchHash = hashSketch(request.sketchData);
    const styleHash = JSON.stringify(request.style);
    return `${sketchHash}_${request.prompt}_${styleHash}_${request.quality}`;
  }

  private async startGeneration(request: GenerationRequest): Promise<void> {
    this.setStatus('generating');

    const controller = new AbortController();
    this.activeGenerations.set(request.id, controller);

    try {
      this.onProgress?.({
        stage: 'encoding',
        progress: 0,
        currentQuality: 'draft',
      });

      if (this.config.autoRefineEnabled) {
        // Progressive refinement
        await this.refiner.refine(
          request,
          (progress) => this.onProgress?.(progress),
          (result) => {
            this.results.push(result);

            // Cache result
            if (this.config.cacheEnabled) {
              const cacheKey = this.getCacheKey(request);
              this.cache.set(cacheKey, result);

              // Trim cache if over limit
              if (this.cache.size > this.config.cacheMaxSize) {
                const firstKey = this.cache.keys().next().value;
                if (firstKey) this.cache.delete(firstKey);
              }
            }

            this.onResult?.(result);
          }
        );
      } else {
        // Single quality generation
        await this.generateSingle(request, controller.signal);
      }

      this.setStatus('complete');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.setStatus('error');
        this.onError?.(error as Error);
      }
    } finally {
      this.activeGenerations.delete(request.id);
    }
  }

  private async generateSingle(
    request: GenerationRequest,
    signal: AbortSignal
  ): Promise<void> {
    const settings = QUALITY_SETTINGS[request.quality];

    this.onProgress?.({
      stage: 'processing',
      progress: 50,
      currentQuality: request.quality,
      estimatedTimeRemaining: settings.timeout,
    });

    // Simulate generation
    await delay(settings.timeout / 10);

    if (signal.aborted) return;

    const result: GenerationResult = {
      id: generateId(),
      requestId: request.id,
      imageUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${settings.size}" height="${settings.size}"><rect fill="%23${Math.floor(Math.random()*16777215).toString(16)}" width="100%" height="100%"/></svg>`,
      quality: request.quality,
      confidence: 0.7 + Math.random() * 0.25,
      processingTime: settings.timeout / 10,
      timestamp: new Date(),
      isPinned: false,
      metadata: {
        width: settings.size,
        height: settings.size,
        seed: request.seed || generateSeed(),
      },
    };

    this.results.push(result);
    this.onResult?.(result);

    this.onProgress?.({
      stage: 'complete',
      progress: 100,
      currentQuality: request.quality,
    });
  }
}

// Export singleton instance and types
export const realTimeEngine = RealTimeEngine.getInstance();

// Export default style for reference
export { DEFAULT_STYLE, STYLE_PRESETS, QUALITY_SETTINGS };
