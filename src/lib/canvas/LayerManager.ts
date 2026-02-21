/**
 * LayerManager - Multi-Layer Canvas Management System
 *
 * Provides professional layer handling with blend modes, opacity,
 * visibility, locking, and compositing support.
 */

import { type BlendMode } from './CanvasEngine';

// ============================================================================
// Types
// ============================================================================

export interface Layer {
  id: string;
  name: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  position: number;
  isBackground: boolean;
  thumbnail?: string;
  clippingMask?: boolean;
  parentId?: string;
}

export interface LayerGroup {
  id: string;
  name: string;
  layerIds: string[];
  collapsed: boolean;
  visible: boolean;
  locked: boolean;
}

export interface LayerState {
  layers: Layer[];
  groups: LayerGroup[];
  activeLayerId: string | null;
  selectedLayerIds: Set<string>;
}

export interface LayerManagerConfig {
  maxLayers: number;
  thumbnailSize: number;
  autoGenerateThumbnails: boolean;
}

type LayerChangeCallback = (state: LayerState) => void;
type ThumbnailUpdateCallback = (layerId: string, thumbnail: string) => void;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: LayerManagerConfig = {
  maxLayers: 100,
  thumbnailSize: 64,
  autoGenerateThumbnails: true,
};

const BLEND_MODE_MAP: Record<BlendMode, GlobalCompositeOperation> = {
  'normal': 'source-over',
  'multiply': 'multiply',
  'screen': 'screen',
  'overlay': 'overlay',
  'darken': 'darken',
  'lighten': 'lighten',
  'color-dodge': 'color-dodge',
  'color-burn': 'color-burn',
  'hard-light': 'hard-light',
  'soft-light': 'soft-light',
  'difference': 'difference',
  'exclusion': 'exclusion',
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Main Class
// ============================================================================

export class LayerManager {
  private static instance: LayerManager;

  private config: LayerManagerConfig;
  private width: number = 1920;
  private height: number = 1080;
  private layers: Map<string, Layer> = new Map();
  private groups: Map<string, LayerGroup> = new Map();
  private layerOrder: string[] = [];
  private activeLayerId: string | null = null;
  private selectedLayerIds: Set<string> = new Set();

  // Compositing
  private compositeCanvas: HTMLCanvasElement | null = null;
  private compositeCtx: CanvasRenderingContext2D | null = null;

  // Callbacks
  private onLayerChange: LayerChangeCallback | null = null;
  private onThumbnailUpdate: ThumbnailUpdateCallback | null = null;

  // Thumbnail generation debounce
  private thumbnailQueue: Set<string> = new Set();
  private thumbnailTimeout: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager();
    }
    return LayerManager.instance;
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  initialize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    // Create composite canvas
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = width;
    this.compositeCanvas.height = height;
    this.compositeCtx = this.compositeCanvas.getContext('2d');

    // Clear existing layers
    this.layers.clear();
    this.groups.clear();
    this.layerOrder = [];

    // Create default background layer
    this.createLayer('Background', { isBackground: true, locked: true });
  }

  dispose(): void {
    this.layers.forEach((layer) => {
      layer.canvas.remove();
    });
    this.layers.clear();
    this.groups.clear();
    this.layerOrder = [];
    this.activeLayerId = null;
    this.selectedLayerIds.clear();
    this.compositeCanvas = null;
    this.compositeCtx = null;
  }

  setConfig(config: Partial<LayerManagerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ============================================================================
  // Layer Creation & Deletion
  // ============================================================================

  createLayer(
    name?: string,
    options?: Partial<Omit<Layer, 'id' | 'canvas' | 'ctx'>>
  ): Layer {
    if (this.layers.size >= this.config.maxLayers) {
      throw new Error(`Maximum number of layers (${this.config.maxLayers}) reached`);
    }

    const id = generateId();
    const layerName = name || `Layer ${this.layers.size + 1}`;

    // Create off-screen canvas for this layer
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }

    // Fill background layer with color
    if (options?.isBackground) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    const layer: Layer = {
      id,
      name: layerName,
      canvas,
      ctx,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      position: this.layerOrder.length,
      isBackground: false,
      ...options,
    };

    this.layers.set(id, layer);
    this.layerOrder.push(id);

    // Set as active if first non-background layer
    if (!this.activeLayerId || (this.activeLayerId && this.getLayer(this.activeLayerId)?.isBackground)) {
      this.setActiveLayer(id);
    }

    this.queueThumbnailGeneration(id);
    this.notifyChange();

    return layer;
  }

  duplicateLayer(layerId: string): Layer | null {
    const source = this.layers.get(layerId);
    if (!source) return null;

    const newLayer = this.createLayer(`${source.name} Copy`, {
      visible: source.visible,
      opacity: source.opacity,
      blendMode: source.blendMode,
    });

    // Copy canvas content
    newLayer.ctx.drawImage(source.canvas, 0, 0);

    this.queueThumbnailGeneration(newLayer.id);
    this.notifyChange();

    return newLayer;
  }

  deleteLayer(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer || layer.isBackground) return false;

    // Remove from layer order
    const index = this.layerOrder.indexOf(layerId);
    if (index > -1) {
      this.layerOrder.splice(index, 1);
    }

    // Update positions
    this.updatePositions();

    // Clean up canvas
    layer.canvas.remove();
    this.layers.delete(layerId);

    // Update active layer if needed
    if (this.activeLayerId === layerId) {
      this.activeLayerId = this.layerOrder[Math.max(0, index - 1)] || null;
    }

    // Remove from selection
    this.selectedLayerIds.delete(layerId);

    this.notifyChange();
    return true;
  }

  mergeDown(layerId: string): boolean {
    const layerIndex = this.layerOrder.indexOf(layerId);
    if (layerIndex <= 0) return false;

    const topLayer = this.layers.get(layerId);
    const bottomLayerId = this.layerOrder[layerIndex - 1];
    const bottomLayer = this.layers.get(bottomLayerId);

    if (!topLayer || !bottomLayer || bottomLayer.locked) return false;

    // Composite top layer onto bottom layer
    bottomLayer.ctx.globalAlpha = topLayer.opacity;
    bottomLayer.ctx.globalCompositeOperation = BLEND_MODE_MAP[topLayer.blendMode];
    bottomLayer.ctx.drawImage(topLayer.canvas, 0, 0);
    bottomLayer.ctx.globalAlpha = 1;
    bottomLayer.ctx.globalCompositeOperation = 'source-over';

    // Delete top layer
    this.deleteLayer(layerId);
    this.queueThumbnailGeneration(bottomLayerId);

    return true;
  }

  mergeVisible(): Layer | null {
    const visibleLayers = this.layerOrder
      .map((id) => this.layers.get(id))
      .filter((layer): layer is Layer => layer !== undefined && layer.visible);

    if (visibleLayers.length === 0) return null;

    // Create new merged layer
    const mergedLayer = this.createLayer('Merged');

    // Composite all visible layers
    for (const layer of visibleLayers) {
      mergedLayer.ctx.globalAlpha = layer.opacity;
      mergedLayer.ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode];
      mergedLayer.ctx.drawImage(layer.canvas, 0, 0);
    }

    mergedLayer.ctx.globalAlpha = 1;
    mergedLayer.ctx.globalCompositeOperation = 'source-over';

    // Hide source layers (don't delete in case user wants to undo)
    for (const layer of visibleLayers) {
      if (!layer.isBackground) {
        layer.visible = false;
      }
    }

    this.queueThumbnailGeneration(mergedLayer.id);
    this.notifyChange();

    return mergedLayer;
  }

  flattenImage(): Layer | null {
    // Create composite of all visible layers
    const composite = this.getComposite();
    if (!composite) return null;

    // Clear all layers except background
    const nonBackgroundLayers = this.layerOrder.filter((id) => {
      const layer = this.layers.get(id);
      return layer && !layer.isBackground;
    });

    for (const id of nonBackgroundLayers) {
      this.deleteLayer(id);
    }

    // Create new flattened layer
    const flatLayer = this.createLayer('Flattened');
    flatLayer.ctx.drawImage(composite, 0, 0);

    this.queueThumbnailGeneration(flatLayer.id);
    this.notifyChange();

    return flatLayer;
  }

  // ============================================================================
  // Layer Access
  // ============================================================================

  getLayer(layerId: string): Layer | undefined {
    return this.layers.get(layerId);
  }

  getActiveLayer(): Layer | null {
    if (!this.activeLayerId) return null;
    return this.layers.get(this.activeLayerId) || null;
  }

  getAllLayers(): Layer[] {
    return this.layerOrder.map((id) => this.layers.get(id)!).filter(Boolean);
  }

  getVisibleLayers(): Layer[] {
    return this.getAllLayers().filter((layer) => layer.visible);
  }

  getLayerCount(): number {
    return this.layers.size;
  }

  // ============================================================================
  // Layer Selection & Activation
  // ============================================================================

  setActiveLayer(layerId: string): boolean {
    if (!this.layers.has(layerId)) return false;

    this.activeLayerId = layerId;
    this.notifyChange();
    return true;
  }

  getActiveLayerId(): string | null {
    return this.activeLayerId;
  }

  selectLayer(layerId: string, multi: boolean = false): void {
    if (!this.layers.has(layerId)) return;

    if (!multi) {
      this.selectedLayerIds.clear();
    }

    this.selectedLayerIds.add(layerId);
    this.setActiveLayer(layerId);
  }

  deselectLayer(layerId: string): void {
    this.selectedLayerIds.delete(layerId);
    this.notifyChange();
  }

  clearSelection(): void {
    this.selectedLayerIds.clear();
    this.notifyChange();
  }

  getSelectedLayerIds(): string[] {
    return Array.from(this.selectedLayerIds);
  }

  // ============================================================================
  // Layer Properties
  // ============================================================================

  setLayerName(layerId: string, name: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.name = name;
    this.notifyChange();
    return true;
  }

  setLayerVisibility(layerId: string, visible: boolean): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.visible = visible;
    this.notifyChange();
    return true;
  }

  toggleLayerVisibility(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.visible = !layer.visible;
    this.notifyChange();
    return true;
  }

  setLayerLocked(layerId: string, locked: boolean): boolean {
    const layer = this.layers.get(layerId);
    if (!layer || layer.isBackground) return false;

    layer.locked = locked;
    this.notifyChange();
    return true;
  }

  toggleLayerLocked(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer || layer.isBackground) return false;

    layer.locked = !layer.locked;
    this.notifyChange();
    return true;
  }

  setLayerOpacity(layerId: string, opacity: number): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.opacity = Math.max(0, Math.min(1, opacity));
    this.notifyChange();
    return true;
  }

  setLayerBlendMode(layerId: string, blendMode: BlendMode): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.blendMode = blendMode;
    this.notifyChange();
    return true;
  }

  // ============================================================================
  // Layer Ordering
  // ============================================================================

  moveLayerUp(layerId: string): boolean {
    const index = this.layerOrder.indexOf(layerId);
    if (index < 0 || index >= this.layerOrder.length - 1) return false;

    // Swap with layer above
    [this.layerOrder[index], this.layerOrder[index + 1]] =
      [this.layerOrder[index + 1], this.layerOrder[index]];

    this.updatePositions();
    this.notifyChange();
    return true;
  }

  moveLayerDown(layerId: string): boolean {
    const index = this.layerOrder.indexOf(layerId);
    const layer = this.layers.get(layerId);

    // Can't move below background
    if (index <= 0 || (index === 1 && this.layers.get(this.layerOrder[0])?.isBackground)) {
      return false;
    }

    // Can't move background layer
    if (layer?.isBackground) return false;

    // Swap with layer below
    [this.layerOrder[index], this.layerOrder[index - 1]] =
      [this.layerOrder[index - 1], this.layerOrder[index]];

    this.updatePositions();
    this.notifyChange();
    return true;
  }

  moveLayerToTop(layerId: string): boolean {
    const index = this.layerOrder.indexOf(layerId);
    if (index < 0 || index === this.layerOrder.length - 1) return false;

    this.layerOrder.splice(index, 1);
    this.layerOrder.push(layerId);

    this.updatePositions();
    this.notifyChange();
    return true;
  }

  moveLayerToBottom(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer || layer.isBackground) return false;

    const index = this.layerOrder.indexOf(layerId);
    if (index < 0) return false;

    // Find first non-background layer position
    const backgroundIndex = this.layerOrder.findIndex((id) =>
      this.layers.get(id)?.isBackground
    );
    const targetIndex = backgroundIndex >= 0 ? backgroundIndex + 1 : 0;

    if (index === targetIndex) return false;

    this.layerOrder.splice(index, 1);
    this.layerOrder.splice(targetIndex, 0, layerId);

    this.updatePositions();
    this.notifyChange();
    return true;
  }

  reorderLayer(layerId: string, newPosition: number): boolean {
    const index = this.layerOrder.indexOf(layerId);
    if (index < 0) return false;

    const layer = this.layers.get(layerId);
    if (layer?.isBackground) return false;

    // Clamp position
    const backgroundIndex = this.layerOrder.findIndex((id) =>
      this.layers.get(id)?.isBackground
    );
    const minPosition = backgroundIndex >= 0 ? backgroundIndex + 1 : 0;
    newPosition = Math.max(minPosition, Math.min(this.layerOrder.length - 1, newPosition));

    if (index === newPosition) return false;

    this.layerOrder.splice(index, 1);
    this.layerOrder.splice(newPosition, 0, layerId);

    this.updatePositions();
    this.notifyChange();
    return true;
  }

  private updatePositions(): void {
    this.layerOrder.forEach((id, index) => {
      const layer = this.layers.get(id);
      if (layer) {
        layer.position = index;
      }
    });
  }

  // ============================================================================
  // Compositing
  // ============================================================================

  getComposite(): HTMLCanvasElement | null {
    if (!this.compositeCanvas || !this.compositeCtx) return null;

    // Clear composite canvas
    this.compositeCtx.clearRect(0, 0, this.width, this.height);

    // Composite layers from bottom to top
    for (const id of this.layerOrder) {
      const layer = this.layers.get(id);
      if (!layer || !layer.visible) continue;

      this.compositeCtx.globalAlpha = layer.opacity;
      this.compositeCtx.globalCompositeOperation = BLEND_MODE_MAP[layer.blendMode];
      this.compositeCtx.drawImage(layer.canvas, 0, 0);
    }

    // Reset composite operation
    this.compositeCtx.globalAlpha = 1;
    this.compositeCtx.globalCompositeOperation = 'source-over';

    return this.compositeCanvas;
  }

  compositeToCanvas(targetCanvas: HTMLCanvasElement): void {
    const composite = this.getComposite();
    if (!composite) return;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.drawImage(composite, 0, 0, targetCanvas.width, targetCanvas.height);
  }

  // ============================================================================
  // Thumbnails
  // ============================================================================

  private queueThumbnailGeneration(layerId: string): void {
    if (!this.config.autoGenerateThumbnails) return;

    this.thumbnailQueue.add(layerId);

    if (this.thumbnailTimeout) {
      clearTimeout(this.thumbnailTimeout);
    }

    this.thumbnailTimeout = setTimeout(() => {
      this.processThumbnailQueue();
    }, 100);
  }

  private processThumbnailQueue(): void {
    for (const layerId of this.thumbnailQueue) {
      this.generateThumbnail(layerId);
    }
    this.thumbnailQueue.clear();
  }

  generateThumbnail(layerId: string): string | null {
    const layer = this.layers.get(layerId);
    if (!layer) return null;

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = this.config.thumbnailSize;
    thumbCanvas.height = this.config.thumbnailSize;
    const thumbCtx = thumbCanvas.getContext('2d');

    if (!thumbCtx) return null;

    // Calculate aspect ratio preserving dimensions
    const scale = Math.min(
      this.config.thumbnailSize / this.width,
      this.config.thumbnailSize / this.height
    );
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;
    const offsetX = (this.config.thumbnailSize - scaledWidth) / 2;
    const offsetY = (this.config.thumbnailSize - scaledHeight) / 2;

    // Draw checkerboard background for transparency
    this.drawCheckerboard(thumbCtx, this.config.thumbnailSize, this.config.thumbnailSize);

    // Draw scaled layer
    thumbCtx.drawImage(layer.canvas, offsetX, offsetY, scaledWidth, scaledHeight);

    const thumbnail = thumbCanvas.toDataURL('image/png');
    layer.thumbnail = thumbnail;

    this.onThumbnailUpdate?.(layerId, thumbnail);

    return thumbnail;
  }

  private drawCheckerboard(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const size = 8;
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#52525b';

    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        if ((x / size + y / size) % 2 === 0) {
          ctx.fillRect(x, y, size, size);
        }
      }
    }
  }

  // ============================================================================
  // Layer Groups
  // ============================================================================

  createGroup(name: string, layerIds: string[] = []): LayerGroup {
    const id = `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const group: LayerGroup = {
      id,
      name,
      layerIds,
      collapsed: false,
      visible: true,
      locked: false,
    };

    this.groups.set(id, group);

    // Update layer parent references
    for (const layerId of layerIds) {
      const layer = this.layers.get(layerId);
      if (layer) {
        layer.parentId = id;
      }
    }

    this.notifyChange();
    return group;
  }

  deleteGroup(groupId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    // Clear parent references
    for (const layerId of group.layerIds) {
      const layer = this.layers.get(layerId);
      if (layer) {
        layer.parentId = undefined;
      }
    }

    this.groups.delete(groupId);
    this.notifyChange();
    return true;
  }

  addLayerToGroup(layerId: string, groupId: string): boolean {
    const layer = this.layers.get(layerId);
    const group = this.groups.get(groupId);
    if (!layer || !group) return false;

    // Remove from current group if any
    if (layer.parentId) {
      const currentGroup = this.groups.get(layer.parentId);
      if (currentGroup) {
        currentGroup.layerIds = currentGroup.layerIds.filter((id) => id !== layerId);
      }
    }

    group.layerIds.push(layerId);
    layer.parentId = groupId;

    this.notifyChange();
    return true;
  }

  removeLayerFromGroup(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer || !layer.parentId) return false;

    const group = this.groups.get(layer.parentId);
    if (group) {
      group.layerIds = group.layerIds.filter((id) => id !== layerId);
    }

    layer.parentId = undefined;
    this.notifyChange();
    return true;
  }

  // ============================================================================
  // State
  // ============================================================================

  getState(): LayerState {
    return {
      layers: this.getAllLayers(),
      groups: Array.from(this.groups.values()),
      activeLayerId: this.activeLayerId,
      selectedLayerIds: new Set(this.selectedLayerIds),
    };
  }

  // ============================================================================
  // Callbacks
  // ============================================================================

  onLayerChangeCallback(callback: LayerChangeCallback): void {
    this.onLayerChange = callback;
  }

  onThumbnailUpdateCallback(callback: ThumbnailUpdateCallback): void {
    this.onThumbnailUpdate = callback;
  }

  private notifyChange(): void {
    this.onLayerChange?.(this.getState());
  }
}

// Export singleton instance
export const layerManager = LayerManager.getInstance();

// Export defaults
export { DEFAULT_CONFIG, BLEND_MODE_MAP };
