/**
 * CanvasEngine - Professional Drawing Canvas Core System
 *
 * Provides high-performance drawing capabilities with pressure sensitivity,
 * smooth stroke rendering, and canvas state management.
 */

// ============================================================================
// Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
  pressure: number;
  tiltX?: number;
  tiltY?: number;
  timestamp: number;
}

export interface StrokePoint extends Point {
  size: number;
  opacity: number;
}

export interface Stroke {
  id: string;
  points: StrokePoint[];
  brush: BrushSettings;
  layerId: string;
  timestamp: number;
}

export interface BrushSettings {
  type: BrushType;
  size: number;
  minSize: number;
  maxSize: number;
  color: string;
  opacity: number;
  hardness: number;
  spacing: number;
  smoothing: number;
  pressureSizeEnabled: boolean;
  pressureOpacityEnabled: boolean;
  blendMode: BlendMode;
}

export type BrushType =
  | 'pencil'
  | 'pen'
  | 'brush'
  | 'airbrush'
  | 'marker'
  | 'charcoal'
  | 'watercolor'
  | 'eraser';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface CanvasState {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  backgroundColor: string;
}

export interface EngineConfig {
  maxUndoSteps: number;
  enablePressure: boolean;
  smoothingFactor: number;
  strokeStabilization: boolean;
  lazyRadius: number;
}

export interface DrawingEvent {
  type: 'start' | 'move' | 'end' | 'cancel';
  point: Point;
  pointerType: 'mouse' | 'pen' | 'touch';
}

type StrokeCallback = (stroke: Stroke) => void;
type CanvasChangeCallback = (state: CanvasState) => void;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BRUSH: BrushSettings = {
  type: 'pencil',
  size: 5,
  minSize: 1,
  maxSize: 100,
  color: '#ffffff',
  opacity: 1,
  hardness: 0.8,
  spacing: 0.1,
  smoothing: 0.5,
  pressureSizeEnabled: true,
  pressureOpacityEnabled: false,
  blendMode: 'normal',
};

const DEFAULT_CONFIG: EngineConfig = {
  maxUndoSteps: 50,
  enablePressure: true,
  smoothingFactor: 0.3,
  strokeStabilization: true,
  lazyRadius: 4,
};

const DEFAULT_STATE: CanvasState = {
  width: 1920,
  height: 1080,
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
  backgroundColor: '#0f172a',
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================================
// Stroke Stabilizer
// ============================================================================

class StrokeStabilizer {
  private points: Point[] = [];
  private readonly windowSize: number;

  constructor(windowSize: number = 4) {
    this.windowSize = windowSize;
  }

  add(point: Point): Point {
    this.points.push(point);
    if (this.points.length > this.windowSize) {
      this.points.shift();
    }

    // Return weighted average of recent points
    let sumX = 0, sumY = 0, sumPressure = 0, totalWeight = 0;

    for (let i = 0; i < this.points.length; i++) {
      const weight = (i + 1) / this.points.length;
      sumX += this.points[i].x * weight;
      sumY += this.points[i].y * weight;
      sumPressure += this.points[i].pressure * weight;
      totalWeight += weight;
    }

    return {
      x: sumX / totalWeight,
      y: sumY / totalWeight,
      pressure: sumPressure / totalWeight,
      tiltX: point.tiltX,
      tiltY: point.tiltY,
      timestamp: point.timestamp,
    };
  }

  reset(): void {
    this.points = [];
  }
}

// ============================================================================
// Lazy Brush (for smooth curves)
// ============================================================================

class LazyBrush {
  private pointerX: number = 0;
  private pointerY: number = 0;
  private brushX: number = 0;
  private brushY: number = 0;
  private radius: number;
  private isEnabled: boolean;

  constructor(radius: number = 4, enabled: boolean = true) {
    this.radius = radius;
    this.isEnabled = enabled;
  }

  update(x: number, y: number): { x: number; y: number } {
    this.pointerX = x;
    this.pointerY = y;

    if (!this.isEnabled) {
      this.brushX = x;
      this.brushY = y;
      return { x, y };
    }

    const dist = Math.sqrt(
      Math.pow(this.pointerX - this.brushX, 2) +
      Math.pow(this.pointerY - this.brushY, 2)
    );

    if (dist > this.radius) {
      const angle = Math.atan2(
        this.pointerY - this.brushY,
        this.pointerX - this.brushX
      );
      this.brushX = this.pointerX - Math.cos(angle) * this.radius;
      this.brushY = this.pointerY - Math.sin(angle) * this.radius;
    }

    return { x: this.brushX, y: this.brushY };
  }

  reset(x: number, y: number): void {
    this.pointerX = x;
    this.pointerY = y;
    this.brushX = x;
    this.brushY = y;
  }

  setRadius(radius: number): void {
    this.radius = radius;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

// ============================================================================
// Main Class
// ============================================================================

export class CanvasEngine {
  private static instance: CanvasEngine;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  private config: EngineConfig;
  private state: CanvasState;
  private brush: BrushSettings;

  private isDrawing: boolean = false;
  private currentStroke: Stroke | null = null;
  private currentLayerId: string = 'default';
  private stabilizer: StrokeStabilizer;
  private lazyBrush: LazyBrush;

  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];

  // Callbacks
  private onStrokeComplete: StrokeCallback | null = null;
  private onCanvasChange: CanvasChangeCallback | null = null;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.state = { ...DEFAULT_STATE };
    this.brush = { ...DEFAULT_BRUSH };
    this.stabilizer = new StrokeStabilizer();
    this.lazyBrush = new LazyBrush(this.config.lazyRadius);
  }

  static getInstance(): CanvasEngine {
    if (!CanvasEngine.instance) {
      CanvasEngine.instance = new CanvasEngine();
    }
    return CanvasEngine.instance;
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  initialize(canvas: HTMLCanvasElement, width?: number, height?: number): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (width) this.state.width = width;
    if (height) this.state.height = height;

    canvas.width = this.state.width;
    canvas.height = this.state.height;

    // Create offscreen canvas for compositing
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.state.width;
    this.offscreenCanvas.height = this.state.height;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');

    this.clear();
    this.saveUndoState();
  }

  dispose(): void {
    this.canvas = null;
    this.ctx = null;
    this.offscreenCanvas = null;
    this.offscreenCtx = null;
    this.undoStack = [];
    this.redoStack = [];
    this.currentStroke = null;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.lazyBrush.setRadius(this.config.lazyRadius);
    this.lazyBrush.setEnabled(this.config.strokeStabilization);
  }

  getConfig(): EngineConfig {
    return { ...this.config };
  }

  setBrush(brush: Partial<BrushSettings>): void {
    this.brush = { ...this.brush, ...brush };
  }

  getBrush(): BrushSettings {
    return { ...this.brush };
  }

  setState(state: Partial<CanvasState>): void {
    this.state = { ...this.state, ...state };
    this.onCanvasChange?.(this.state);
  }

  getState(): CanvasState {
    return { ...this.state };
  }

  setCurrentLayer(layerId: string): void {
    this.currentLayerId = layerId;
  }

  // ============================================================================
  // Drawing Events
  // ============================================================================

  handlePointerDown(event: PointerEvent): void {
    if (!this.canvas || !this.ctx) return;

    const point = this.getPointFromEvent(event);
    this.stabilizer.reset();
    this.lazyBrush.reset(point.x, point.y);

    this.isDrawing = true;
    this.saveUndoState();

    this.currentStroke = {
      id: generateId(),
      points: [],
      brush: { ...this.brush },
      layerId: this.currentLayerId,
      timestamp: Date.now(),
    };

    // Add initial point
    const strokePoint = this.createStrokePoint(point);
    this.currentStroke.points.push(strokePoint);

    // Draw initial dot
    this.drawPoint(strokePoint);
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.isDrawing || !this.currentStroke || !this.ctx) return;

    const rawPoint = this.getPointFromEvent(event);

    // Apply stabilization
    const stabilizedPoint = this.config.strokeStabilization
      ? this.stabilizer.add(rawPoint)
      : rawPoint;

    // Apply lazy brush
    const { x, y } = this.lazyBrush.update(stabilizedPoint.x, stabilizedPoint.y);
    const point: Point = { ...stabilizedPoint, x, y };

    const strokePoint = this.createStrokePoint(point);
    this.currentStroke.points.push(strokePoint);

    // Draw stroke segment
    const prevPoint = this.currentStroke.points[this.currentStroke.points.length - 2];
    if (prevPoint) {
      this.drawStrokeSegment(prevPoint, strokePoint);
    }
  }

  handlePointerUp(event: PointerEvent): void {
    if (!this.isDrawing || !this.currentStroke) return;

    this.isDrawing = false;
    this.stabilizer.reset();

    // Notify stroke completion
    if (this.currentStroke.points.length > 0) {
      this.onStrokeComplete?.(this.currentStroke);
    }

    this.currentStroke = null;
  }

  handlePointerCancel(): void {
    this.isDrawing = false;
    this.stabilizer.reset();
    this.currentStroke = null;
  }

  // ============================================================================
  // Point Processing
  // ============================================================================

  private getPointFromEvent(event: PointerEvent): Point {
    if (!this.canvas) {
      return { x: 0, y: 0, pressure: 0.5, timestamp: Date.now() };
    }

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    // Apply zoom and pan
    const x = ((event.clientX - rect.left) * scaleX - this.state.panX) / this.state.zoom;
    const y = ((event.clientY - rect.top) * scaleY - this.state.panY) / this.state.zoom;

    // Get pressure (default to 0.5 for mouse)
    let pressure = 0.5;
    if (this.config.enablePressure && event.pressure !== undefined) {
      pressure = event.pointerType === 'pen' ? event.pressure : 0.5;
    }

    return {
      x,
      y,
      pressure: clamp(pressure, 0.01, 1),
      tiltX: event.tiltX,
      tiltY: event.tiltY,
      timestamp: Date.now(),
    };
  }

  private createStrokePoint(point: Point): StrokePoint {
    const pressure = point.pressure;

    // Calculate size based on pressure
    let size = this.brush.size;
    if (this.brush.pressureSizeEnabled) {
      const sizeRange = this.brush.maxSize - this.brush.minSize;
      size = this.brush.minSize + sizeRange * pressure;
    }

    // Calculate opacity based on pressure
    let opacity = this.brush.opacity;
    if (this.brush.pressureOpacityEnabled) {
      opacity = this.brush.opacity * (0.3 + 0.7 * pressure);
    }

    return {
      ...point,
      size,
      opacity,
    };
  }

  // ============================================================================
  // Drawing Methods
  // ============================================================================

  private drawPoint(point: StrokePoint): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    ctx.save();

    // Apply blend mode
    ctx.globalCompositeOperation = this.brush.blendMode as GlobalCompositeOperation;

    // Set up brush appearance based on type
    const gradient = this.createBrushGradient(point);

    ctx.beginPath();
    ctx.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient || hexToRgba(this.brush.color, point.opacity);
    ctx.fill();

    ctx.restore();
  }

  private drawStrokeSegment(from: StrokePoint, to: StrokePoint): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const dist = distance(from, to);
    const spacing = Math.max(1, this.brush.size * this.brush.spacing);
    const steps = Math.ceil(dist / spacing);

    if (steps <= 0) return;

    ctx.save();
    ctx.globalCompositeOperation = this.brush.blendMode as GlobalCompositeOperation;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = lerp(from.x, to.x, t);
      const y = lerp(from.y, to.y, t);
      const size = lerp(from.size, to.size, t);
      const opacity = lerp(from.opacity, to.opacity, t);

      const interpolatedPoint: StrokePoint = {
        x,
        y,
        pressure: lerp(from.pressure, to.pressure, t),
        size,
        opacity,
        timestamp: Date.now(),
      };

      this.drawBrushDab(interpolatedPoint);
    }

    ctx.restore();
  }

  private drawBrushDab(point: StrokePoint): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    const radius = point.size / 2;

    switch (this.brush.type) {
      case 'pencil':
        this.drawPencilDab(ctx, point, radius);
        break;
      case 'pen':
        this.drawPenDab(ctx, point, radius);
        break;
      case 'brush':
        this.drawBrushStyleDab(ctx, point, radius);
        break;
      case 'airbrush':
        this.drawAirbrushDab(ctx, point, radius);
        break;
      case 'marker':
        this.drawMarkerDab(ctx, point, radius);
        break;
      case 'charcoal':
        this.drawCharcoalDab(ctx, point, radius);
        break;
      case 'watercolor':
        this.drawWatercolorDab(ctx, point, radius);
        break;
      case 'eraser':
        this.drawEraserDab(ctx, point, radius);
        break;
      default:
        this.drawDefaultDab(ctx, point, radius);
    }
  }

  private drawPencilDab(ctx: CanvasRenderingContext2D, point: StrokePoint, radius: number): void {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(this.brush.color, point.opacity * this.brush.hardness);
    ctx.fill();
  }

  private drawPenDab(ctx: CanvasRenderingContext2D, point: StrokePoint, radius: number): void {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(this.brush.color, point.opacity);
    ctx.fill();
  }

  private drawBrushStyleDab(ctx: CanvasRenderingContext2D, point: StrokePoint, radius: number): void {
    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, radius
    );
    gradient.addColorStop(0, hexToRgba(this.brush.color, point.opacity));
    gradient.addColorStop(this.brush.hardness, hexToRgba(this.brush.color, point.opacity * 0.5));
    gradient.addColorStop(1, hexToRgba(this.brush.color, 0));

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private drawAirbrushDab(ctx: CanvasRenderingContext2D, point: StrokePoint, radius: number): void {
    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, radius * 1.5
    );
    gradient.addColorStop(0, hexToRgba(this.brush.color, point.opacity * 0.3));
    gradient.addColorStop(0.5, hexToRgba(this.brush.color, point.opacity * 0.1));
    gradient.addColorStop(1, hexToRgba(this.brush.color, 0));

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private drawMarkerDab(ctx: CanvasRenderingContext2D, point: StrokePoint, radius: number): void {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(this.brush.color, point.opacity * 0.7);
    ctx.fill();
  }

  private drawCharcoalDab(ctx: CanvasRenderingContext2D, point: StrokePoint, radius: number): void {
    // Add texture noise for charcoal effect
    const noise = (Math.random() - 0.5) * radius * 0.3;

    ctx.beginPath();
    ctx.arc(point.x + noise, point.y + noise, radius * (0.8 + Math.random() * 0.4), 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(this.brush.color, point.opacity * (0.7 + Math.random() * 0.3));
    ctx.fill();
  }

  private drawWatercolorDab(ctx: CanvasRenderingContext2D, point: StrokePoint, radius: number): void {
    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, radius
    );
    const spreadOpacity = point.opacity * 0.3;
    gradient.addColorStop(0, hexToRgba(this.brush.color, spreadOpacity));
    gradient.addColorStop(0.7, hexToRgba(this.brush.color, spreadOpacity * 0.5));
    gradient.addColorStop(1, hexToRgba(this.brush.color, 0));

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  private drawEraserDab(ctx: CanvasRenderingContext2D, point: StrokePoint, radius: number): void {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    const gradient = ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, radius
    );
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(this.brush.hardness, `rgba(255,255,255,${this.brush.hardness})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }

  private drawDefaultDab(ctx: CanvasRenderingContext2D, point: StrokePoint, radius: number): void {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(this.brush.color, point.opacity);
    ctx.fill();
  }

  private createBrushGradient(point: StrokePoint): CanvasGradient | null {
    if (!this.ctx) return null;

    const radius = point.size / 2;
    const gradient = this.ctx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, radius
    );

    gradient.addColorStop(0, hexToRgba(this.brush.color, point.opacity));
    gradient.addColorStop(this.brush.hardness, hexToRgba(this.brush.color, point.opacity * 0.5));
    gradient.addColorStop(1, hexToRgba(this.brush.color, 0));

    return gradient;
  }

  // ============================================================================
  // Canvas Operations
  // ============================================================================

  clear(): void {
    if (!this.ctx) return;

    this.ctx.fillStyle = this.state.backgroundColor;
    this.ctx.fillRect(0, 0, this.state.width, this.state.height);
  }

  fill(color: string): void {
    if (!this.ctx) return;

    this.saveUndoState();
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.state.width, this.state.height);
  }

  drawImage(image: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width?: number, height?: number): void {
    if (!this.ctx) return;

    this.saveUndoState();

    if (width && height) {
      this.ctx.drawImage(image, x, y, width, height);
    } else {
      this.ctx.drawImage(image, x, y);
    }
  }

  getImageData(): ImageData | null {
    if (!this.ctx) return null;
    return this.ctx.getImageData(0, 0, this.state.width, this.state.height);
  }

  putImageData(imageData: ImageData, x: number = 0, y: number = 0): void {
    if (!this.ctx) return;
    this.ctx.putImageData(imageData, x, y);
  }

  toDataURL(type: string = 'image/png', quality?: number): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL(type, quality);
  }

  toBlob(callback: BlobCallback, type?: string, quality?: number): void {
    if (!this.canvas) return;
    this.canvas.toBlob(callback, type, quality);
  }

  // ============================================================================
  // Undo/Redo
  // ============================================================================

  private saveUndoState(): void {
    if (!this.ctx) return;

    const imageData = this.ctx.getImageData(0, 0, this.state.width, this.state.height);
    this.undoStack.push(imageData);

    // Limit undo stack size
    if (this.undoStack.length > this.config.maxUndoSteps) {
      this.undoStack.shift();
    }

    // Clear redo stack on new action
    this.redoStack = [];
  }

  undo(): boolean {
    if (this.undoStack.length <= 1 || !this.ctx) return false;

    const currentState = this.undoStack.pop()!;
    this.redoStack.push(currentState);

    const previousState = this.undoStack[this.undoStack.length - 1];
    this.ctx.putImageData(previousState, 0, 0);

    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0 || !this.ctx) return false;

    const state = this.redoStack.pop()!;
    this.undoStack.push(state);
    this.ctx.putImageData(state, 0, 0);

    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // ============================================================================
  // Zoom and Pan
  // ============================================================================

  setZoom(zoom: number): void {
    this.state.zoom = clamp(zoom, 0.1, 10);
    this.onCanvasChange?.(this.state);
  }

  zoomIn(factor: number = 1.2): void {
    this.setZoom(this.state.zoom * factor);
  }

  zoomOut(factor: number = 1.2): void {
    this.setZoom(this.state.zoom / factor);
  }

  resetZoom(): void {
    this.setZoom(1);
  }

  setPan(x: number, y: number): void {
    this.state.panX = x;
    this.state.panY = y;
    this.onCanvasChange?.(this.state);
  }

  pan(dx: number, dy: number): void {
    this.setPan(this.state.panX + dx, this.state.panY + dy);
  }

  resetPan(): void {
    this.setPan(0, 0);
  }

  // ============================================================================
  // Callbacks
  // ============================================================================

  onStrokeCompleteCallback(callback: StrokeCallback): void {
    this.onStrokeComplete = callback;
  }

  onCanvasChangeCallback(callback: CanvasChangeCallback): void {
    this.onCanvasChange = callback;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  isCurrentlyDrawing(): boolean {
    return this.isDrawing;
  }
}

// Export singleton instance
export const canvasEngine = CanvasEngine.getInstance();

// Export defaults
export { DEFAULT_BRUSH, DEFAULT_CONFIG, DEFAULT_STATE };
