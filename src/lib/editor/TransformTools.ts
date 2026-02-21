/**
 * TransformTools - Transform Operations for Image Editor
 *
 * Provides scale, rotate, skew, flip, and crop transformations
 * with non-destructive editing through operation stack.
 */

// ============================================================================
// Types
// ============================================================================

export type TransformToolType = 'move' | 'scale' | 'rotate' | 'skew' | 'crop' | 'perspective';
export type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotation';

export interface Point {
  x: number;
  y: number;
}

export interface TransformState {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // degrees
  skewX: number; // degrees
  skewY: number; // degrees
  originX: number; // 0-1
  originY: number; // 0-1
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface TransformOperation {
  id: string;
  type: 'translate' | 'scale' | 'rotate' | 'skew' | 'flip' | 'crop' | 'reset';
  timestamp: Date;
  params: Record<string, number | boolean | string>;
  previousState: TransformState;
}

export interface TransformHandle {
  position: HandlePosition;
  x: number;
  y: number;
  cursor: string;
}

export interface TransformConstraints {
  lockAspectRatio: boolean;
  lockPosition: boolean;
  lockRotation: boolean;
  snapToGrid: boolean;
  gridSize: number;
  snapToAngles: boolean;
  snapAngleIncrement: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TRANSFORM_STATE: TransformState = {
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  skewX: 0,
  skewY: 0,
  originX: 0.5,
  originY: 0.5,
};

const DEFAULT_CONSTRAINTS: TransformConstraints = {
  lockAspectRatio: false,
  lockPosition: false,
  lockRotation: false,
  snapToGrid: false,
  gridSize: 10,
  snapToAngles: false,
  snapAngleIncrement: 15,
};

const HANDLE_SIZE = 8;

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `transform_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

function snapToAngle(angle: number, increment: number): number {
  return Math.round(angle / increment) * increment;
}

function rotatePoint(point: Point, origin: Point, angleDeg: number): Point {
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = point.x - origin.x;
  const dy = point.y - origin.y;

  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

function getAngleBetweenPoints(p1: Point, p2: Point, origin: Point): number {
  const angle1 = Math.atan2(p1.y - origin.y, p1.x - origin.x);
  const angle2 = Math.atan2(p2.y - origin.y, p2.x - origin.x);
  return radToDeg(angle2 - angle1);
}

function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// ============================================================================
// TransformTools Class
// ============================================================================

export class TransformTools {
  private static instance: TransformTools;
  private state: TransformState;
  private activeTool: TransformToolType = 'move';
  private constraints: TransformConstraints;
  private operationHistory: TransformOperation[] = [];
  private redoStack: TransformOperation[] = [];
  private maxHistorySize = 50;
  private listeners: Set<(state: TransformState) => void> = new Set();

  // Interactive state
  private isTransforming = false;
  private startPoint: Point | null = null;
  private currentHandle: HandlePosition | null = null;
  private originalState: TransformState | null = null;

  // Bounds tracking
  private imageBounds = { width: 0, height: 0 };
  private cropRect: CropRect | null = null;

  private constructor() {
    this.state = { ...DEFAULT_TRANSFORM_STATE };
    this.constraints = { ...DEFAULT_CONSTRAINTS };
  }

  static getInstance(): TransformTools {
    if (!TransformTools.instance) {
      TransformTools.instance = new TransformTools();
    }
    return TransformTools.instance;
  }

  // -------------------------------------------------------------------------
  // State Management
  // -------------------------------------------------------------------------

  getState(): TransformState {
    return { ...this.state };
  }

  setTool(tool: TransformToolType): void {
    this.activeTool = tool;
    if (tool === 'crop') {
      this.initCrop();
    }
  }

  getTool(): TransformToolType {
    return this.activeTool;
  }

  setConstraints(constraints: Partial<TransformConstraints>): void {
    this.constraints = { ...this.constraints, ...constraints };
  }

  getConstraints(): TransformConstraints {
    return { ...this.constraints };
  }

  setImageBounds(width: number, height: number): void {
    this.imageBounds = { width, height };
    if (!this.cropRect) {
      this.cropRect = { x: 0, y: 0, width, height };
    }
  }

  // -------------------------------------------------------------------------
  // Transform Operations
  // -------------------------------------------------------------------------

  translate(dx: number, dy: number): void {
    if (this.constraints.lockPosition) return;

    const previousState = { ...this.state };

    if (this.constraints.snapToGrid) {
      dx = snapToGrid(dx, this.constraints.gridSize);
      dy = snapToGrid(dy, this.constraints.gridSize);
    }

    this.state.translateX += dx;
    this.state.translateY += dy;

    this.recordOperation('translate', { dx, dy }, previousState);
    this.notifyListeners();
  }

  scale(sx: number, sy: number, origin?: Point): void {
    const previousState = { ...this.state };

    if (this.constraints.lockAspectRatio) {
      const avg = (sx + sy) / 2;
      sx = avg;
      sy = avg;
    }

    // Clamp scale values
    sx = Math.max(0.01, Math.min(10, this.state.scaleX * sx)) / this.state.scaleX;
    sy = Math.max(0.01, Math.min(10, this.state.scaleY * sy)) / this.state.scaleY;

    this.state.scaleX *= sx;
    this.state.scaleY *= sy;

    // Adjust position if scaling from a specific origin
    if (origin) {
      const dx = origin.x - this.state.translateX;
      const dy = origin.y - this.state.translateY;
      this.state.translateX += dx - dx * sx;
      this.state.translateY += dy - dy * sy;
    }

    this.recordOperation('scale', { sx, sy, originX: origin?.x, originY: origin?.y }, previousState);
    this.notifyListeners();
  }

  rotate(degrees: number, origin?: Point): void {
    if (this.constraints.lockRotation) return;

    const previousState = { ...this.state };

    if (this.constraints.snapToAngles) {
      degrees = snapToAngle(degrees, this.constraints.snapAngleIncrement);
    }

    this.state.rotation = (this.state.rotation + degrees) % 360;

    // Adjust position if rotating around a specific origin
    if (origin) {
      const currentPos = { x: this.state.translateX, y: this.state.translateY };
      const rotated = rotatePoint(currentPos, origin, degrees);
      this.state.translateX = rotated.x;
      this.state.translateY = rotated.y;
    }

    this.recordOperation('rotate', { degrees, originX: origin?.x, originY: origin?.y }, previousState);
    this.notifyListeners();
  }

  skew(skewX: number, skewY: number): void {
    const previousState = { ...this.state };

    this.state.skewX += skewX;
    this.state.skewY += skewY;

    // Clamp skew values
    this.state.skewX = Math.max(-45, Math.min(45, this.state.skewX));
    this.state.skewY = Math.max(-45, Math.min(45, this.state.skewY));

    this.recordOperation('skew', { skewX, skewY }, previousState);
    this.notifyListeners();
  }

  flip(horizontal: boolean): void {
    const previousState = { ...this.state };

    if (horizontal) {
      this.state.scaleX *= -1;
    } else {
      this.state.scaleY *= -1;
    }

    this.recordOperation('flip', { horizontal }, previousState);
    this.notifyListeners();
  }

  reset(): void {
    const previousState = { ...this.state };
    this.state = { ...DEFAULT_TRANSFORM_STATE };
    this.recordOperation('reset', {}, previousState);
    this.notifyListeners();
  }

  // -------------------------------------------------------------------------
  // Crop Operations
  // -------------------------------------------------------------------------

  initCrop(): void {
    if (!this.cropRect) {
      this.cropRect = {
        x: 0,
        y: 0,
        width: this.imageBounds.width,
        height: this.imageBounds.height,
      };
    }
  }

  getCropRect(): CropRect | null {
    return this.cropRect ? { ...this.cropRect } : null;
  }

  setCropRect(rect: Partial<CropRect>): void {
    if (!this.cropRect) {
      this.initCrop();
    }

    this.cropRect = { ...this.cropRect!, ...rect };

    // Enforce aspect ratio if set
    if (this.cropRect.aspectRatio) {
      const currentRatio = this.cropRect.width / this.cropRect.height;
      if (currentRatio !== this.cropRect.aspectRatio) {
        // Adjust height to match aspect ratio
        this.cropRect.height = this.cropRect.width / this.cropRect.aspectRatio;
      }
    }

    // Clamp to image bounds
    this.cropRect.x = Math.max(0, Math.min(this.imageBounds.width - this.cropRect.width, this.cropRect.x));
    this.cropRect.y = Math.max(0, Math.min(this.imageBounds.height - this.cropRect.height, this.cropRect.y));
    this.cropRect.width = Math.min(this.imageBounds.width - this.cropRect.x, this.cropRect.width);
    this.cropRect.height = Math.min(this.imageBounds.height - this.cropRect.y, this.cropRect.height);
  }

  applyCrop(): CropRect | null {
    const crop = this.cropRect;
    if (!crop) return null;

    const previousState = { ...this.state };
    this.recordOperation('crop', {
      x: crop.x,
      y: crop.y,
      width: crop.width,
      height: crop.height,
    }, previousState);

    // Update image bounds after crop
    this.imageBounds = { width: crop.width, height: crop.height };

    // Reset crop rect
    this.cropRect = { x: 0, y: 0, width: crop.width, height: crop.height };

    return crop;
  }

  cancelCrop(): void {
    this.cropRect = { x: 0, y: 0, ...this.imageBounds };
  }

  // -------------------------------------------------------------------------
  // Interactive Transform
  // -------------------------------------------------------------------------

  startTransform(point: Point, handle?: HandlePosition): void {
    this.isTransforming = true;
    this.startPoint = point;
    this.currentHandle = handle || null;
    this.originalState = { ...this.state };
  }

  updateTransform(point: Point): void {
    if (!this.isTransforming || !this.startPoint || !this.originalState) return;

    const dx = point.x - this.startPoint.x;
    const dy = point.y - this.startPoint.y;

    // Reset to original state first
    this.state = { ...this.originalState };

    if (this.activeTool === 'move' || !this.currentHandle) {
      this.state.translateX += dx;
      this.state.translateY += dy;
    } else if (this.activeTool === 'scale') {
      this.handleScaleTransform(point, dx, dy);
    } else if (this.activeTool === 'rotate') {
      this.handleRotateTransform(point);
    } else if (this.activeTool === 'skew') {
      this.handleSkewTransform(dx, dy);
    } else if (this.activeTool === 'crop' && this.cropRect) {
      this.handleCropTransform(dx, dy);
    }

    this.notifyListeners();
  }

  endTransform(): TransformState | null {
    if (!this.isTransforming) return null;

    const result = { ...this.state };

    this.isTransforming = false;
    this.startPoint = null;
    this.currentHandle = null;
    this.originalState = null;

    return result;
  }

  private handleScaleTransform(point: Point, dx: number, dy: number): void {
    const handle = this.currentHandle;
    if (!handle || !this.originalState) return;

    let sx = 1;
    let sy = 1;
    const sensitivity = 0.01;

    switch (handle) {
      case 'e':
        sx = 1 + dx * sensitivity;
        break;
      case 'w':
        sx = 1 - dx * sensitivity;
        this.state.translateX += dx;
        break;
      case 's':
        sy = 1 + dy * sensitivity;
        break;
      case 'n':
        sy = 1 - dy * sensitivity;
        this.state.translateY += dy;
        break;
      case 'se':
        sx = 1 + dx * sensitivity;
        sy = 1 + dy * sensitivity;
        break;
      case 'nw':
        sx = 1 - dx * sensitivity;
        sy = 1 - dy * sensitivity;
        this.state.translateX += dx;
        this.state.translateY += dy;
        break;
      case 'ne':
        sx = 1 + dx * sensitivity;
        sy = 1 - dy * sensitivity;
        this.state.translateY += dy;
        break;
      case 'sw':
        sx = 1 - dx * sensitivity;
        sy = 1 + dy * sensitivity;
        this.state.translateX += dx;
        break;
    }

    if (this.constraints.lockAspectRatio) {
      const avg = (sx + sy) / 2;
      sx = avg;
      sy = avg;
    }

    sx = Math.max(0.1, Math.min(5, sx));
    sy = Math.max(0.1, Math.min(5, sy));

    this.state.scaleX = this.originalState.scaleX * sx;
    this.state.scaleY = this.originalState.scaleY * sy;
  }

  private handleRotateTransform(point: Point): void {
    if (!this.startPoint || !this.originalState) return;

    const center = {
      x: this.state.translateX + (this.imageBounds.width * this.state.scaleX) / 2,
      y: this.state.translateY + (this.imageBounds.height * this.state.scaleY) / 2,
    };

    const angle = getAngleBetweenPoints(this.startPoint, point, center);
    let newRotation = this.originalState.rotation + angle;

    if (this.constraints.snapToAngles) {
      newRotation = snapToAngle(newRotation, this.constraints.snapAngleIncrement);
    }

    this.state.rotation = newRotation % 360;
  }

  private handleSkewTransform(dx: number, dy: number): void {
    const handle = this.currentHandle;
    if (!handle || !this.originalState) return;

    const sensitivity = 0.1;

    if (handle === 'n' || handle === 's') {
      this.state.skewX = this.originalState.skewX + dx * sensitivity;
    } else if (handle === 'e' || handle === 'w') {
      this.state.skewY = this.originalState.skewY + dy * sensitivity;
    }

    this.state.skewX = Math.max(-45, Math.min(45, this.state.skewX));
    this.state.skewY = Math.max(-45, Math.min(45, this.state.skewY));
  }

  private handleCropTransform(dx: number, dy: number): void {
    if (!this.cropRect || !this.currentHandle) return;

    const handle = this.currentHandle;

    switch (handle) {
      case 'e':
        this.cropRect.width += dx;
        break;
      case 'w':
        this.cropRect.x += dx;
        this.cropRect.width -= dx;
        break;
      case 's':
        this.cropRect.height += dy;
        break;
      case 'n':
        this.cropRect.y += dy;
        this.cropRect.height -= dy;
        break;
      case 'se':
        this.cropRect.width += dx;
        this.cropRect.height += dy;
        break;
      case 'nw':
        this.cropRect.x += dx;
        this.cropRect.y += dy;
        this.cropRect.width -= dx;
        this.cropRect.height -= dy;
        break;
      case 'ne':
        this.cropRect.width += dx;
        this.cropRect.y += dy;
        this.cropRect.height -= dy;
        break;
      case 'sw':
        this.cropRect.x += dx;
        this.cropRect.width -= dx;
        this.cropRect.height += dy;
        break;
    }

    // Ensure minimum size
    this.cropRect.width = Math.max(10, this.cropRect.width);
    this.cropRect.height = Math.max(10, this.cropRect.height);

    // Clamp to bounds
    this.setCropRect(this.cropRect);
  }

  // -------------------------------------------------------------------------
  // Transform Handles
  // -------------------------------------------------------------------------

  getTransformHandles(): TransformHandle[] {
    const handles: TransformHandle[] = [];
    const { width, height } = this.imageBounds;
    const { scaleX, scaleY, translateX, translateY } = this.state;

    const w = width * Math.abs(scaleX);
    const h = height * Math.abs(scaleY);

    const positions: { pos: HandlePosition; x: number; y: number; cursor: string }[] = [
      { pos: 'nw', x: translateX, y: translateY, cursor: 'nw-resize' },
      { pos: 'n', x: translateX + w / 2, y: translateY, cursor: 'n-resize' },
      { pos: 'ne', x: translateX + w, y: translateY, cursor: 'ne-resize' },
      { pos: 'e', x: translateX + w, y: translateY + h / 2, cursor: 'e-resize' },
      { pos: 'se', x: translateX + w, y: translateY + h, cursor: 'se-resize' },
      { pos: 's', x: translateX + w / 2, y: translateY + h, cursor: 's-resize' },
      { pos: 'sw', x: translateX, y: translateY + h, cursor: 'sw-resize' },
      { pos: 'w', x: translateX, y: translateY + h / 2, cursor: 'w-resize' },
    ];

    // Add rotation handle above center top
    if (this.activeTool === 'rotate') {
      positions.push({
        pos: 'rotation',
        x: translateX + w / 2,
        y: translateY - 30,
        cursor: 'crosshair',
      });
    }

    for (const p of positions) {
      // Apply rotation to handle positions
      const rotated = rotatePoint(
        { x: p.x, y: p.y },
        { x: translateX + w / 2, y: translateY + h / 2 },
        this.state.rotation
      );

      handles.push({
        position: p.pos,
        x: rotated.x,
        y: rotated.y,
        cursor: p.cursor,
      });
    }

    return handles;
  }

  getCropHandles(): TransformHandle[] {
    if (!this.cropRect) return [];

    const { x, y, width, height } = this.cropRect;
    const handles: TransformHandle[] = [];

    const positions: { pos: HandlePosition; hx: number; hy: number; cursor: string }[] = [
      { pos: 'nw', hx: x, hy: y, cursor: 'nw-resize' },
      { pos: 'n', hx: x + width / 2, hy: y, cursor: 'n-resize' },
      { pos: 'ne', hx: x + width, hy: y, cursor: 'ne-resize' },
      { pos: 'e', hx: x + width, hy: y + height / 2, cursor: 'e-resize' },
      { pos: 'se', hx: x + width, hy: y + height, cursor: 'se-resize' },
      { pos: 's', hx: x + width / 2, hy: y + height, cursor: 's-resize' },
      { pos: 'sw', hx: x, hy: y + height, cursor: 'sw-resize' },
      { pos: 'w', hx: x, hy: y + height / 2, cursor: 'w-resize' },
    ];

    for (const p of positions) {
      handles.push({
        position: p.pos,
        x: p.hx,
        y: p.hy,
        cursor: p.cursor,
      });
    }

    return handles;
  }

  getHandleAtPoint(point: Point): HandlePosition | null {
    const handles = this.activeTool === 'crop' ? this.getCropHandles() : this.getTransformHandles();

    for (const handle of handles) {
      const dx = point.x - handle.x;
      const dy = point.y - handle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= HANDLE_SIZE) {
        return handle.position;
      }
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // Matrix Generation
  // -------------------------------------------------------------------------

  getTransformMatrix(): DOMMatrix {
    const { translateX, translateY, scaleX, scaleY, rotation, skewX, skewY, originX, originY } = this.state;
    const { width, height } = this.imageBounds;

    const matrix = new DOMMatrix();

    // Translate to origin
    const ox = width * originX;
    const oy = height * originY;

    matrix.translateSelf(translateX + ox, translateY + oy);
    matrix.rotateSelf(rotation);
    matrix.skewXSelf(skewX);
    matrix.skewYSelf(skewY);
    matrix.scaleSelf(scaleX, scaleY);
    matrix.translateSelf(-ox, -oy);

    return matrix;
  }

  getCSSTransform(): string {
    const { translateX, translateY, scaleX, scaleY, rotation, skewX, skewY } = this.state;

    return `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) skewX(${skewX}deg) skewY(${skewY}deg) scale(${scaleX}, ${scaleY})`;
  }

  // -------------------------------------------------------------------------
  // History
  // -------------------------------------------------------------------------

  private recordOperation(
    type: TransformOperation['type'],
    params: Record<string, number | boolean | string | undefined>,
    previousState: TransformState
  ): void {
    const cleanParams: Record<string, number | boolean | string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        cleanParams[key] = value;
      }
    }

    const operation: TransformOperation = {
      id: generateId(),
      type,
      timestamp: new Date(),
      params: cleanParams,
      previousState,
    };

    this.operationHistory.push(operation);
    this.redoStack = []; // Clear redo stack on new operation

    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory.shift();
    }
  }

  undo(): boolean {
    const operation = this.operationHistory.pop();
    if (!operation) return false;

    this.redoStack.push({
      ...operation,
      previousState: { ...this.state },
    });

    this.state = { ...operation.previousState };
    this.notifyListeners();
    return true;
  }

  redo(): boolean {
    const operation = this.redoStack.pop();
    if (!operation) return false;

    this.operationHistory.push({
      ...operation,
      previousState: { ...this.state },
    });

    // Re-apply the operation
    this.state = { ...operation.previousState };

    // Apply operation params to get new state
    // This is simplified - in a full implementation you'd re-execute the operation
    this.notifyListeners();
    return true;
  }

  getHistory(): TransformOperation[] {
    return [...this.operationHistory];
  }

  clearHistory(): void {
    this.operationHistory = [];
    this.redoStack = [];
  }

  canUndo(): boolean {
    return this.operationHistory.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // -------------------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------------------

  subscribe(callback: (state: TransformState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((callback) => callback(state));
  }
}

// Export singleton instance
export const transformTools = TransformTools.getInstance();
