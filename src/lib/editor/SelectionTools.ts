/**
 * SelectionTools - Multi-Type Selection System for Image Editor
 *
 * Provides marquee, lasso, and magic wand selection tools with
 * support for add, subtract, and intersect operations.
 */

// ============================================================================
// Types
// ============================================================================

export type SelectionToolType = 'marquee' | 'ellipse' | 'lasso' | 'polygon' | 'magic-wand' | 'quick-select';
export type SelectionMode = 'new' | 'add' | 'subtract' | 'intersect';

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionPath {
  type: 'rect' | 'ellipse' | 'polygon';
  points: Point[];
  boundingBox: BoundingBox;
}

export interface Selection {
  id: string;
  paths: SelectionPath[];
  mask?: ImageData;
  boundingBox: BoundingBox;
  feather: number;
  antiAlias: boolean;
}

export interface MagicWandOptions {
  tolerance: number; // 0-255
  contiguous: boolean;
  antiAlias: boolean;
  sampleAllLayers: boolean;
}

export interface SelectionOptions {
  mode: SelectionMode;
  feather: number;
  antiAlias: boolean;
}

// ============================================================================
// Selection Tool State
// ============================================================================

export interface SelectionToolState {
  activeTool: SelectionToolType;
  currentSelection: Selection | null;
  isSelecting: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  pathPoints: Point[];
  options: SelectionOptions;
  magicWandOptions: MagicWandOptions;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `sel_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function calculateBoundingBox(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function pointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const { x, y } = point;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

function pointInEllipse(point: Point, center: Point, radiusX: number, radiusY: number): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
}

function getPixelColor(imageData: ImageData, x: number, y: number): [number, number, number, number] {
  const idx = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
  return [
    imageData.data[idx],
    imageData.data[idx + 1],
    imageData.data[idx + 2],
    imageData.data[idx + 3],
  ];
}

function colorDistance(c1: [number, number, number, number], c2: [number, number, number, number]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  );
}

// ============================================================================
// SelectionTools Class
// ============================================================================

export class SelectionTools {
  private static instance: SelectionTools;
  private state: SelectionToolState;
  private selectionHistory: Selection[] = [];
  private maxHistorySize = 20;
  private listeners: Set<(state: SelectionToolState) => void> = new Set();

  private constructor() {
    this.state = {
      activeTool: 'marquee',
      currentSelection: null,
      isSelecting: false,
      startPoint: null,
      currentPoint: null,
      pathPoints: [],
      options: {
        mode: 'new',
        feather: 0,
        antiAlias: true,
      },
      magicWandOptions: {
        tolerance: 32,
        contiguous: true,
        antiAlias: true,
        sampleAllLayers: false,
      },
    };
  }

  static getInstance(): SelectionTools {
    if (!SelectionTools.instance) {
      SelectionTools.instance = new SelectionTools();
    }
    return SelectionTools.instance;
  }

  // -------------------------------------------------------------------------
  // State Management
  // -------------------------------------------------------------------------

  getState(): SelectionToolState {
    return { ...this.state };
  }

  setTool(tool: SelectionToolType): void {
    this.state.activeTool = tool;
    this.notifyListeners();
  }

  setMode(mode: SelectionMode): void {
    this.state.options.mode = mode;
    this.notifyListeners();
  }

  setFeather(feather: number): void {
    this.state.options.feather = Math.max(0, Math.min(250, feather));
    this.notifyListeners();
  }

  setAntiAlias(antiAlias: boolean): void {
    this.state.options.antiAlias = antiAlias;
    this.notifyListeners();
  }

  setMagicWandOptions(options: Partial<MagicWandOptions>): void {
    this.state.magicWandOptions = { ...this.state.magicWandOptions, ...options };
    this.notifyListeners();
  }

  // -------------------------------------------------------------------------
  // Selection Creation
  // -------------------------------------------------------------------------

  startSelection(point: Point): void {
    this.state.isSelecting = true;
    this.state.startPoint = point;
    this.state.currentPoint = point;
    this.state.pathPoints = [point];
    this.notifyListeners();
  }

  updateSelection(point: Point): void {
    if (!this.state.isSelecting) return;

    this.state.currentPoint = point;

    if (this.state.activeTool === 'lasso' || this.state.activeTool === 'polygon') {
      this.state.pathPoints.push(point);
    }

    this.notifyListeners();
  }

  completeSelection(imageData?: ImageData): Selection | null {
    if (!this.state.isSelecting || !this.state.startPoint) {
      return null;
    }

    let selection: Selection | null = null;

    switch (this.state.activeTool) {
      case 'marquee':
        selection = this.createRectSelection();
        break;
      case 'ellipse':
        selection = this.createEllipseSelection();
        break;
      case 'lasso':
      case 'polygon':
        selection = this.createPolygonSelection();
        break;
      case 'magic-wand':
        if (imageData && this.state.startPoint) {
          selection = this.createMagicWandSelection(imageData, this.state.startPoint);
        }
        break;
    }

    if (selection) {
      this.applySelectionMode(selection);
    }

    this.state.isSelecting = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
    this.state.pathPoints = [];

    this.notifyListeners();
    return selection;
  }

  cancelSelection(): void {
    this.state.isSelecting = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
    this.state.pathPoints = [];
    this.notifyListeners();
  }

  // -------------------------------------------------------------------------
  // Selection Types
  // -------------------------------------------------------------------------

  private createRectSelection(): Selection {
    const { startPoint, currentPoint } = this.state;
    if (!startPoint || !currentPoint) {
      throw new Error('Start and current points required');
    }

    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    const points: Point[] = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];

    const path: SelectionPath = {
      type: 'rect',
      points,
      boundingBox: { x, y, width, height },
    };

    return {
      id: generateId(),
      paths: [path],
      boundingBox: path.boundingBox,
      feather: this.state.options.feather,
      antiAlias: this.state.options.antiAlias,
    };
  }

  private createEllipseSelection(): Selection {
    const { startPoint, currentPoint } = this.state;
    if (!startPoint || !currentPoint) {
      throw new Error('Start and current points required');
    }

    const x = Math.min(startPoint.x, currentPoint.x);
    const y = Math.min(startPoint.y, currentPoint.y);
    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.y - startPoint.y);

    // Generate ellipse points for path representation
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    const points: Point[] = [];
    const segments = 64;

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push({
        x: centerX + radiusX * Math.cos(angle),
        y: centerY + radiusY * Math.sin(angle),
      });
    }

    const path: SelectionPath = {
      type: 'ellipse',
      points,
      boundingBox: { x, y, width, height },
    };

    return {
      id: generateId(),
      paths: [path],
      boundingBox: path.boundingBox,
      feather: this.state.options.feather,
      antiAlias: this.state.options.antiAlias,
    };
  }

  private createPolygonSelection(): Selection {
    const { pathPoints } = this.state;
    if (pathPoints.length < 3) {
      throw new Error('At least 3 points required for polygon');
    }

    const boundingBox = calculateBoundingBox(pathPoints);

    const path: SelectionPath = {
      type: 'polygon',
      points: [...pathPoints],
      boundingBox,
    };

    return {
      id: generateId(),
      paths: [path],
      boundingBox,
      feather: this.state.options.feather,
      antiAlias: this.state.options.antiAlias,
    };
  }

  private createMagicWandSelection(imageData: ImageData, seedPoint: Point): Selection {
    const { tolerance, contiguous } = this.state.magicWandOptions;
    const { width, height } = imageData;

    const seedColor = getPixelColor(imageData, seedPoint.x, seedPoint.y);
    const visited = new Set<string>();
    const selected = new Set<string>();
    const points: Point[] = [];

    if (contiguous) {
      // Flood fill algorithm for contiguous selection
      const queue: Point[] = [{ x: Math.floor(seedPoint.x), y: Math.floor(seedPoint.y) }];

      while (queue.length > 0) {
        const point = queue.shift()!;
        const key = `${point.x},${point.y}`;

        if (visited.has(key)) continue;
        if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) continue;

        visited.add(key);

        const color = getPixelColor(imageData, point.x, point.y);
        const distance = colorDistance(color, seedColor);

        if (distance <= tolerance) {
          selected.add(key);
          points.push(point);

          // Add neighbors
          queue.push(
            { x: point.x + 1, y: point.y },
            { x: point.x - 1, y: point.y },
            { x: point.x, y: point.y + 1 },
            { x: point.x, y: point.y - 1 }
          );
        }
      }
    } else {
      // Non-contiguous: select all pixels with similar color
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = getPixelColor(imageData, x, y);
          const distance = colorDistance(color, seedColor);

          if (distance <= tolerance) {
            selected.add(`${x},${y}`);
            points.push({ x, y });
          }
        }
      }
    }

    const boundingBox = calculateBoundingBox(points);

    // Create mask from selected points
    const mask = new ImageData(width, height);
    for (let i = 0; i < mask.data.length; i += 4) {
      mask.data[i + 3] = 0; // Fully transparent
    }

    for (const key of selected) {
      const [x, y] = key.split(',').map(Number);
      const idx = (y * width + x) * 4;
      mask.data[idx] = 255;
      mask.data[idx + 1] = 255;
      mask.data[idx + 2] = 255;
      mask.data[idx + 3] = 255;
    }

    const path: SelectionPath = {
      type: 'polygon',
      points,
      boundingBox,
    };

    return {
      id: generateId(),
      paths: [path],
      mask,
      boundingBox,
      feather: this.state.options.feather,
      antiAlias: this.state.options.antiAlias,
    };
  }

  // -------------------------------------------------------------------------
  // Selection Operations
  // -------------------------------------------------------------------------

  private applySelectionMode(newSelection: Selection): void {
    const { mode } = this.state.options;
    const current = this.state.currentSelection;

    if (!current || mode === 'new') {
      this.pushToHistory();
      this.state.currentSelection = newSelection;
      return;
    }

    this.pushToHistory();

    // For add/subtract/intersect, we need to combine paths
    switch (mode) {
      case 'add':
        this.state.currentSelection = {
          ...current,
          id: generateId(),
          paths: [...current.paths, ...newSelection.paths],
          boundingBox: this.combineBoundingBoxes(current.boundingBox, newSelection.boundingBox),
        };
        break;

      case 'subtract':
        // Mark new paths as subtraction (handled during rendering)
        this.state.currentSelection = {
          ...current,
          id: generateId(),
          paths: [...current.paths, ...newSelection.paths.map(p => ({ ...p, subtract: true } as SelectionPath & { subtract: boolean }))],
        };
        break;

      case 'intersect':
        // Intersection requires mask computation
        this.state.currentSelection = this.intersectSelections(current, newSelection);
        break;
    }
  }

  private combineBoundingBoxes(b1: BoundingBox, b2: BoundingBox): BoundingBox {
    const x = Math.min(b1.x, b2.x);
    const y = Math.min(b1.y, b2.y);
    const maxX = Math.max(b1.x + b1.width, b2.x + b2.width);
    const maxY = Math.max(b1.y + b1.height, b2.y + b2.height);

    return {
      x,
      y,
      width: maxX - x,
      height: maxY - y,
    };
  }

  private intersectSelections(s1: Selection, s2: Selection): Selection {
    // Simplified intersection - returns the overlap bounding box
    const x = Math.max(s1.boundingBox.x, s2.boundingBox.x);
    const y = Math.max(s1.boundingBox.y, s2.boundingBox.y);
    const maxX = Math.min(
      s1.boundingBox.x + s1.boundingBox.width,
      s2.boundingBox.x + s2.boundingBox.width
    );
    const maxY = Math.min(
      s1.boundingBox.y + s1.boundingBox.height,
      s2.boundingBox.y + s2.boundingBox.height
    );

    const width = Math.max(0, maxX - x);
    const height = Math.max(0, maxY - y);

    return {
      id: generateId(),
      paths: s1.paths, // Keep original paths for now
      boundingBox: { x, y, width, height },
      feather: s1.feather,
      antiAlias: s1.antiAlias,
    };
  }

  // -------------------------------------------------------------------------
  // Selection Queries
  // -------------------------------------------------------------------------

  getCurrentSelection(): Selection | null {
    return this.state.currentSelection;
  }

  hasSelection(): boolean {
    return this.state.currentSelection !== null;
  }

  isPointInSelection(point: Point): boolean {
    const selection = this.state.currentSelection;
    if (!selection) return false;

    // Quick bounding box check
    const bb = selection.boundingBox;
    if (
      point.x < bb.x ||
      point.x > bb.x + bb.width ||
      point.y < bb.y ||
      point.y > bb.y + bb.height
    ) {
      return false;
    }

    // Check against paths
    for (const path of selection.paths) {
      if (path.type === 'rect') {
        const [tl, , br] = [path.points[0], path.points[1], path.points[2]];
        if (point.x >= tl.x && point.x <= br.x && point.y >= tl.y && point.y <= br.y) {
          return true;
        }
      } else if (path.type === 'ellipse') {
        const center = {
          x: path.boundingBox.x + path.boundingBox.width / 2,
          y: path.boundingBox.y + path.boundingBox.height / 2,
        };
        if (pointInEllipse(point, center, path.boundingBox.width / 2, path.boundingBox.height / 2)) {
          return true;
        }
      } else if (path.type === 'polygon') {
        if (pointInPolygon(point, path.points)) {
          return true;
        }
      }
    }

    return false;
  }

  // -------------------------------------------------------------------------
  // Selection Manipulation
  // -------------------------------------------------------------------------

  clearSelection(): void {
    if (this.state.currentSelection) {
      this.pushToHistory();
      this.state.currentSelection = null;
      this.notifyListeners();
    }
  }

  selectAll(width: number, height: number): void {
    this.pushToHistory();
    this.state.currentSelection = {
      id: generateId(),
      paths: [{
        type: 'rect',
        points: [
          { x: 0, y: 0 },
          { x: width, y: 0 },
          { x: width, y: height },
          { x: 0, y: height },
        ],
        boundingBox: { x: 0, y: 0, width, height },
      }],
      boundingBox: { x: 0, y: 0, width, height },
      feather: 0,
      antiAlias: true,
    };
    this.notifyListeners();
  }

  invertSelection(width: number, height: number): void {
    // For now, just select all if no selection, or clear if there is one
    if (this.state.currentSelection) {
      this.clearSelection();
    } else {
      this.selectAll(width, height);
    }
  }

  expandSelection(amount: number): void {
    const selection = this.state.currentSelection;
    if (!selection) return;

    this.pushToHistory();
    this.state.currentSelection = {
      ...selection,
      boundingBox: {
        x: selection.boundingBox.x - amount,
        y: selection.boundingBox.y - amount,
        width: selection.boundingBox.width + amount * 2,
        height: selection.boundingBox.height + amount * 2,
      },
    };
    this.notifyListeners();
  }

  contractSelection(amount: number): void {
    this.expandSelection(-amount);
  }

  // -------------------------------------------------------------------------
  // Selection Rendering
  // -------------------------------------------------------------------------

  getSelectionPath(ctx: CanvasRenderingContext2D): Path2D | null {
    const selection = this.state.currentSelection;
    if (!selection) return null;

    const path = new Path2D();

    for (const selPath of selection.paths) {
      if (selPath.type === 'rect') {
        const bb = selPath.boundingBox;
        path.rect(bb.x, bb.y, bb.width, bb.height);
      } else if (selPath.type === 'ellipse') {
        const bb = selPath.boundingBox;
        path.ellipse(
          bb.x + bb.width / 2,
          bb.y + bb.height / 2,
          bb.width / 2,
          bb.height / 2,
          0,
          0,
          Math.PI * 2
        );
      } else if (selPath.type === 'polygon' && selPath.points.length > 0) {
        path.moveTo(selPath.points[0].x, selPath.points[0].y);
        for (let i = 1; i < selPath.points.length; i++) {
          path.lineTo(selPath.points[i].x, selPath.points[i].y);
        }
        path.closePath();
      }
    }

    return path;
  }

  getPreviewPath(ctx: CanvasRenderingContext2D): Path2D | null {
    if (!this.state.isSelecting || !this.state.startPoint || !this.state.currentPoint) {
      return null;
    }

    const path = new Path2D();
    const { startPoint, currentPoint, activeTool, pathPoints } = this.state;

    switch (activeTool) {
      case 'marquee': {
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);
        path.rect(x, y, width, height);
        break;
      }

      case 'ellipse': {
        const x = Math.min(startPoint.x, currentPoint.x);
        const y = Math.min(startPoint.y, currentPoint.y);
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.y - startPoint.y);
        path.ellipse(
          x + width / 2,
          y + height / 2,
          width / 2,
          height / 2,
          0,
          0,
          Math.PI * 2
        );
        break;
      }

      case 'lasso':
      case 'polygon': {
        if (pathPoints.length > 0) {
          path.moveTo(pathPoints[0].x, pathPoints[0].y);
          for (let i = 1; i < pathPoints.length; i++) {
            path.lineTo(pathPoints[i].x, pathPoints[i].y);
          }
          if (activeTool === 'polygon') {
            path.closePath();
          }
        }
        break;
      }
    }

    return path;
  }

  // -------------------------------------------------------------------------
  // History
  // -------------------------------------------------------------------------

  private pushToHistory(): void {
    if (this.state.currentSelection) {
      this.selectionHistory.push({ ...this.state.currentSelection });
      if (this.selectionHistory.length > this.maxHistorySize) {
        this.selectionHistory.shift();
      }
    }
  }

  undoSelection(): boolean {
    const previous = this.selectionHistory.pop();
    if (previous) {
      this.state.currentSelection = previous;
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------------------------

  subscribe(callback: (state: SelectionToolState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((callback) => callback(state));
  }
}

// Export singleton instance
export const selectionTools = SelectionTools.getInstance();
