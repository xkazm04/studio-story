/**
 * FocalPointDetector - Visual Weight Analysis for Composition
 *
 * Detects focal points in images/sketches using edge detection,
 * contrast analysis, and visual weight calculation.
 */

// ============================================================================
// Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface FocalPoint {
  id: string;
  x: number;
  y: number;
  weight: number; // 0-1 normalized weight
  radius: number;
  type: 'edge' | 'contrast' | 'center-of-mass' | 'intersection';
}

export interface VisualWeight {
  x: number;
  y: number;
  weight: number;
}

export interface BalanceAnalysis {
  centerOfMass: Point;
  horizontalBalance: number; // -1 (left heavy) to 1 (right heavy)
  verticalBalance: number; // -1 (top heavy) to 1 (bottom heavy)
  overallBalance: number; // 0-1 where 1 is perfectly balanced
  quadrantWeights: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  };
  suggestions: BalanceSuggestion[];
}

export interface BalanceSuggestion {
  type: 'move' | 'add' | 'remove' | 'resize';
  description: string;
  priority: 'low' | 'medium' | 'high';
  targetArea?: { x: number; y: number; width: number; height: number };
}

export interface DetectionOptions {
  edgeThreshold?: number;
  contrastThreshold?: number;
  minFocalSize?: number;
  maxFocalPoints?: number;
  gridResolution?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<DetectionOptions> = {
  edgeThreshold: 30,
  contrastThreshold: 50,
  minFocalSize: 20,
  maxFocalPoints: 5,
  gridResolution: 32,
};

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `focal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Apply Sobel edge detection to find edges
 */
function sobelEdgeDetection(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData;
  const edges = new Float32Array(width * height);

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  // Convert to grayscale first
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // Apply Sobel filter
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kernelIdx];
          gy += gray[idx] * sobelY[kernelIdx];
        }
      }

      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return edges;
}

/**
 * Calculate local contrast in regions
 */
function calculateLocalContrast(
  imageData: ImageData,
  gridSize: number
): { x: number; y: number; contrast: number }[] {
  const { width, height, data } = imageData;
  const results: { x: number; y: number; contrast: number }[] = [];

  const cellW = Math.floor(width / gridSize);
  const cellH = Math.floor(height / gridSize);

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const startX = gx * cellW;
      const startY = gy * cellH;

      let minLum = 255;
      let maxLum = 0;

      // Calculate min/max luminance in cell
      for (let y = startY; y < startY + cellH && y < height; y++) {
        for (let x = startX; x < startX + cellW && x < width; x++) {
          const idx = (y * width + x) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          minLum = Math.min(minLum, lum);
          maxLum = Math.max(maxLum, lum);
        }
      }

      const contrast = maxLum - minLum;
      results.push({
        x: startX + cellW / 2,
        y: startY + cellH / 2,
        contrast,
      });
    }
  }

  return results;
}

/**
 * Find local maxima in a 2D array
 */
function findLocalMaxima(
  values: Float32Array,
  width: number,
  height: number,
  threshold: number,
  minDistance: number
): Point[] {
  const maxima: Point[] = [];

  for (let y = minDistance; y < height - minDistance; y++) {
    for (let x = minDistance; x < width - minDistance; x++) {
      const idx = y * width + x;
      const value = values[idx];

      if (value < threshold) continue;

      // Check if local maximum
      let isMax = true;
      for (let dy = -minDistance; dy <= minDistance && isMax; dy++) {
        for (let dx = -minDistance; dx <= minDistance && isMax; dx++) {
          if (dx === 0 && dy === 0) continue;
          const neighborIdx = (y + dy) * width + (x + dx);
          if (values[neighborIdx] >= value) {
            isMax = false;
          }
        }
      }

      if (isMax) {
        maxima.push({ x, y });
      }
    }
  }

  return maxima;
}

/**
 * Calculate visual weight distribution
 */
function calculateVisualWeightGrid(
  imageData: ImageData,
  gridSize: number
): VisualWeight[][] {
  const { width, height, data } = imageData;
  const grid: VisualWeight[][] = [];

  const cellW = Math.floor(width / gridSize);
  const cellH = Math.floor(height / gridSize);

  for (let gy = 0; gy < gridSize; gy++) {
    const row: VisualWeight[] = [];
    for (let gx = 0; gx < gridSize; gx++) {
      const startX = gx * cellW;
      const startY = gy * cellH;

      let totalWeight = 0;
      let pixelCount = 0;

      for (let y = startY; y < startY + cellH && y < height; y++) {
        for (let x = startX; x < startX + cellW && x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3] / 255;

          // Visual weight factors:
          // 1. Darker areas have more weight
          const darkness = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          // 2. Saturated colors have more weight
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          // 3. Opacity affects weight
          const weight = (darkness * 0.5 + saturation * 0.3 + a * 0.2);

          totalWeight += weight;
          pixelCount++;
        }
      }

      row.push({
        x: startX + cellW / 2,
        y: startY + cellH / 2,
        weight: pixelCount > 0 ? totalWeight / pixelCount : 0,
      });
    }
    grid.push(row);
  }

  return grid;
}

// ============================================================================
// Main Class
// ============================================================================

export class FocalPointDetector {
  private static instance: FocalPointDetector;
  private options: Required<DetectionOptions>;

  private constructor() {
    this.options = { ...DEFAULT_OPTIONS };
  }

  static getInstance(): FocalPointDetector {
    if (!FocalPointDetector.instance) {
      FocalPointDetector.instance = new FocalPointDetector();
    }
    return FocalPointDetector.instance;
  }

  /**
   * Set detection options
   */
  setOptions(options: DetectionOptions): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Detect focal points in an image or canvas
   */
  detectFocalPoints(
    source: HTMLImageElement | HTMLCanvasElement | ImageData
  ): FocalPoint[] {
    // Get ImageData
    let imageData: ImageData;

    if (source instanceof ImageData) {
      imageData = source;
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
      canvas.height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(source, 0, 0);
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    const { width, height } = imageData;
    const focalPoints: FocalPoint[] = [];

    // 1. Edge detection for structural focal points
    const edges = sobelEdgeDetection(imageData);
    const edgeMaxima = findLocalMaxima(
      edges,
      width,
      height,
      this.options.edgeThreshold,
      this.options.minFocalSize
    );

    // Sort by edge strength and take top results
    const sortedEdgeMaxima = edgeMaxima
      .map((p) => ({ ...p, strength: edges[p.y * width + p.x] }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, Math.ceil(this.options.maxFocalPoints / 2));

    for (const point of sortedEdgeMaxima) {
      focalPoints.push({
        id: generateId(),
        x: point.x / width,
        y: point.y / height,
        weight: Math.min(point.strength / 255, 1),
        radius: this.options.minFocalSize / Math.min(width, height),
        type: 'edge',
      });
    }

    // 2. Contrast analysis for high-contrast regions
    const contrastRegions = calculateLocalContrast(imageData, this.options.gridResolution);
    const highContrast = contrastRegions
      .filter((r) => r.contrast > this.options.contrastThreshold)
      .sort((a, b) => b.contrast - a.contrast)
      .slice(0, Math.ceil(this.options.maxFocalPoints / 2));

    for (const region of highContrast) {
      // Avoid duplicates near edge focal points
      const isDuplicate = focalPoints.some((fp) => {
        const dx = fp.x * width - region.x;
        const dy = fp.y * height - region.y;
        return Math.sqrt(dx * dx + dy * dy) < this.options.minFocalSize * 2;
      });

      if (!isDuplicate) {
        focalPoints.push({
          id: generateId(),
          x: region.x / width,
          y: region.y / height,
          weight: Math.min(region.contrast / 255, 1),
          radius: (this.options.minFocalSize * 1.5) / Math.min(width, height),
          type: 'contrast',
        });
      }
    }

    // Limit total focal points
    return focalPoints
      .sort((a, b) => b.weight - a.weight)
      .slice(0, this.options.maxFocalPoints);
  }

  /**
   * Analyze composition balance
   */
  analyzeBalance(
    source: HTMLImageElement | HTMLCanvasElement | ImageData
  ): BalanceAnalysis {
    // Get ImageData
    let imageData: ImageData;
    let width: number;
    let height: number;

    if (source instanceof ImageData) {
      imageData = source;
      width = imageData.width;
      height = imageData.height;
    } else {
      const canvas = document.createElement('canvas');
      width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
      height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(source, 0, 0);
      imageData = ctx.getImageData(0, 0, width, height);
    }

    // Calculate visual weight grid
    const weightGrid = calculateVisualWeightGrid(imageData, this.options.gridResolution);

    // Calculate quadrant weights
    const halfGrid = Math.floor(this.options.gridResolution / 2);
    let topLeftWeight = 0;
    let topRightWeight = 0;
    let bottomLeftWeight = 0;
    let bottomRightWeight = 0;
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;

    for (let gy = 0; gy < weightGrid.length; gy++) {
      for (let gx = 0; gx < weightGrid[gy].length; gx++) {
        const cell = weightGrid[gy][gx];
        totalWeight += cell.weight;
        weightedX += cell.x * cell.weight;
        weightedY += cell.y * cell.weight;

        if (gy < halfGrid) {
          if (gx < halfGrid) {
            topLeftWeight += cell.weight;
          } else {
            topRightWeight += cell.weight;
          }
        } else {
          if (gx < halfGrid) {
            bottomLeftWeight += cell.weight;
          } else {
            bottomRightWeight += cell.weight;
          }
        }
      }
    }

    // Center of mass (normalized 0-1)
    const centerOfMass: Point = {
      x: totalWeight > 0 ? weightedX / totalWeight / width : 0.5,
      y: totalWeight > 0 ? weightedY / totalWeight / height : 0.5,
    };

    // Balance calculations
    const leftWeight = topLeftWeight + bottomLeftWeight;
    const rightWeight = topRightWeight + bottomRightWeight;
    const topWeight = topLeftWeight + topRightWeight;
    const bottomWeight = bottomLeftWeight + bottomRightWeight;

    const horizontalBalance = (rightWeight - leftWeight) / Math.max(leftWeight + rightWeight, 0.01);
    const verticalBalance = (bottomWeight - topWeight) / Math.max(topWeight + bottomWeight, 0.01);

    // Overall balance (1 = perfectly balanced, 0 = completely unbalanced)
    const overallBalance = 1 - (Math.abs(horizontalBalance) + Math.abs(verticalBalance)) / 2;

    // Generate suggestions
    const suggestions: BalanceSuggestion[] = [];

    if (Math.abs(horizontalBalance) > 0.3) {
      const heavySide = horizontalBalance > 0 ? 'right' : 'left';
      const lightSide = horizontalBalance > 0 ? 'left' : 'right';
      suggestions.push({
        type: 'move',
        description: `Composition is ${heavySide}-heavy. Consider adding visual weight to the ${lightSide} side.`,
        priority: Math.abs(horizontalBalance) > 0.5 ? 'high' : 'medium',
        targetArea: {
          x: horizontalBalance > 0 ? 0 : 0.6,
          y: 0.2,
          width: 0.4,
          height: 0.6,
        },
      });
    }

    if (Math.abs(verticalBalance) > 0.3) {
      const heavySide = verticalBalance > 0 ? 'bottom' : 'top';
      const lightSide = verticalBalance > 0 ? 'top' : 'bottom';
      suggestions.push({
        type: 'move',
        description: `Composition is ${heavySide}-heavy. Consider adding visual weight to the ${lightSide}.`,
        priority: Math.abs(verticalBalance) > 0.5 ? 'high' : 'medium',
        targetArea: {
          x: 0.2,
          y: verticalBalance > 0 ? 0 : 0.6,
          width: 0.6,
          height: 0.4,
        },
      });
    }

    // Check for empty quadrants
    const quadrants = [
      { weight: topLeftWeight, name: 'top-left', x: 0, y: 0 },
      { weight: topRightWeight, name: 'top-right', x: 0.5, y: 0 },
      { weight: bottomLeftWeight, name: 'bottom-left', x: 0, y: 0.5 },
      { weight: bottomRightWeight, name: 'bottom-right', x: 0.5, y: 0.5 },
    ];

    const maxQuadrantWeight = Math.max(...quadrants.map((q) => q.weight));
    for (const quadrant of quadrants) {
      if (quadrant.weight < maxQuadrantWeight * 0.2) {
        suggestions.push({
          type: 'add',
          description: `The ${quadrant.name} area is relatively empty. Consider adding a visual element for better balance.`,
          priority: 'low',
          targetArea: {
            x: quadrant.x,
            y: quadrant.y,
            width: 0.5,
            height: 0.5,
          },
        });
      }
    }

    // Normalize quadrant weights
    const totalQuadrantWeight = topLeftWeight + topRightWeight + bottomLeftWeight + bottomRightWeight;
    const normalize = (w: number) =>
      totalQuadrantWeight > 0 ? w / totalQuadrantWeight : 0.25;

    return {
      centerOfMass,
      horizontalBalance,
      verticalBalance,
      overallBalance,
      quadrantWeights: {
        topLeft: normalize(topLeftWeight),
        topRight: normalize(topRightWeight),
        bottomLeft: normalize(bottomLeftWeight),
        bottomRight: normalize(bottomRightWeight),
      },
      suggestions: suggestions.slice(0, 3), // Limit suggestions
    };
  }

  /**
   * Check if a point is near a composition grid power point
   */
  checkPowerPointAlignment(
    point: Point,
    gridType: 'rule-of-thirds' | 'golden-ratio',
    tolerance: number = 0.05
  ): { aligned: boolean; nearestPowerPoint: Point; distance: number } {
    // Generate power points for grid type
    let powerPoints: Point[];

    if (gridType === 'rule-of-thirds') {
      powerPoints = [
        { x: 1 / 3, y: 1 / 3 },
        { x: 2 / 3, y: 1 / 3 },
        { x: 1 / 3, y: 2 / 3 },
        { x: 2 / 3, y: 2 / 3 },
      ];
    } else {
      const phi = 0.618;
      powerPoints = [
        { x: phi, y: phi },
        { x: 1 - phi, y: phi },
        { x: phi, y: 1 - phi },
        { x: 1 - phi, y: 1 - phi },
      ];
    }

    let nearestPoint = powerPoints[0];
    let minDistance = Infinity;

    for (const pp of powerPoints) {
      const dx = point.x - pp.x;
      const dy = point.y - pp.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = pp;
      }
    }

    return {
      aligned: minDistance <= tolerance,
      nearestPowerPoint: nearestPoint,
      distance: minDistance,
    };
  }

  /**
   * Generate layout suggestions based on detected focal points and balance
   */
  generateLayoutSuggestions(
    focalPoints: FocalPoint[],
    balance: BalanceAnalysis
  ): BalanceSuggestion[] {
    const suggestions: BalanceSuggestion[] = [...balance.suggestions];

    // Check focal point alignment with rule of thirds
    for (const focal of focalPoints) {
      const alignment = this.checkPowerPointAlignment(
        { x: focal.x, y: focal.y },
        'rule-of-thirds'
      );

      if (!alignment.aligned && alignment.distance > 0.1) {
        const dx = alignment.nearestPowerPoint.x - focal.x;
        const dy = alignment.nearestPowerPoint.y - focal.y;

        let direction = '';
        if (Math.abs(dx) > 0.05) direction += dx > 0 ? 'right' : 'left';
        if (Math.abs(dy) > 0.05) direction += (direction ? ' and ' : '') + (dy > 0 ? 'down' : 'up');

        suggestions.push({
          type: 'move',
          description: `Consider moving focal point ${direction} to align with rule of thirds.`,
          priority: 'medium',
          targetArea: {
            x: alignment.nearestPowerPoint.x - 0.05,
            y: alignment.nearestPowerPoint.y - 0.05,
            width: 0.1,
            height: 0.1,
          },
        });
      }
    }

    // Remove duplicates and limit
    return suggestions
      .filter((s, i, arr) => arr.findIndex((x) => x.description === s.description) === i)
      .slice(0, 5);
  }
}

// Export singleton instance
export const focalPointDetector = FocalPointDetector.getInstance();
