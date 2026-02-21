/**
 * CompositionOverlay - Grid and Guide System for Visual Composition
 *
 * Provides various composition overlays including rule of thirds,
 * golden ratio, golden spiral, diagonal lines, and custom grids.
 */

// ============================================================================
// Types
// ============================================================================

export type GridType =
  | 'rule-of-thirds'
  | 'golden-ratio'
  | 'golden-spiral'
  | 'diagonal'
  | 'center-cross'
  | 'triangle'
  | 'phi-grid'
  | 'custom';

export type SpiralOrientation = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type DiagonalType = 'baroque' | 'sinister' | 'both';

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  start: Point;
  end: Point;
}

export interface GridConfig {
  type: GridType;
  visible: boolean;
  opacity: number;
  color: string;
  lineWidth: number;
  // Type-specific options
  spiralOrientation?: SpiralOrientation;
  diagonalType?: DiagonalType;
  customRows?: number;
  customCols?: number;
  showPowerPoints?: boolean;
}

export interface GridOverlay {
  lines: Line[];
  powerPoints: Point[];
  curves?: { type: 'arc' | 'spiral'; points: Point[] }[];
}

export interface CompositionTemplate {
  id: string;
  name: string;
  category: 'portrait' | 'landscape' | 'action' | 'dramatic' | 'balanced';
  description: string;
  focalAreas: { x: number; y: number; width: number; height: number; weight: number }[];
  suggestedGrids: GridType[];
  thumbnail?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PHI = 1.618033988749895; // Golden ratio
const PHI_INVERSE = 1 / PHI;

const DEFAULT_GRID_CONFIG: GridConfig = {
  type: 'rule-of-thirds',
  visible: true,
  opacity: 0.5,
  color: '#ffffff',
  lineWidth: 1,
  showPowerPoints: true,
};

// ============================================================================
// Grid Generation Functions
// ============================================================================

function generateRuleOfThirds(width: number, height: number): GridOverlay {
  const thirdW = width / 3;
  const thirdH = height / 3;

  const lines: Line[] = [
    // Vertical lines
    { start: { x: thirdW, y: 0 }, end: { x: thirdW, y: height } },
    { start: { x: thirdW * 2, y: 0 }, end: { x: thirdW * 2, y: height } },
    // Horizontal lines
    { start: { x: 0, y: thirdH }, end: { x: width, y: thirdH } },
    { start: { x: 0, y: thirdH * 2 }, end: { x: width, y: thirdH * 2 } },
  ];

  // Power points at intersections
  const powerPoints: Point[] = [
    { x: thirdW, y: thirdH },
    { x: thirdW * 2, y: thirdH },
    { x: thirdW, y: thirdH * 2 },
    { x: thirdW * 2, y: thirdH * 2 },
  ];

  return { lines, powerPoints };
}

function generateGoldenRatio(width: number, height: number): GridOverlay {
  const goldenW = width * PHI_INVERSE;
  const goldenH = height * PHI_INVERSE;

  const lines: Line[] = [
    // Vertical lines at golden ratio
    { start: { x: goldenW, y: 0 }, end: { x: goldenW, y: height } },
    { start: { x: width - goldenW, y: 0 }, end: { x: width - goldenW, y: height } },
    // Horizontal lines at golden ratio
    { start: { x: 0, y: goldenH }, end: { x: width, y: goldenH } },
    { start: { x: 0, y: height - goldenH }, end: { x: width, y: height - goldenH } },
  ];

  const powerPoints: Point[] = [
    { x: goldenW, y: goldenH },
    { x: width - goldenW, y: goldenH },
    { x: goldenW, y: height - goldenH },
    { x: width - goldenW, y: height - goldenH },
  ];

  return { lines, powerPoints };
}

function generateGoldenSpiral(
  width: number,
  height: number,
  orientation: SpiralOrientation = 'top-left'
): GridOverlay {
  const lines: Line[] = [];
  const spiralPoints: Point[] = [];

  // Generate golden rectangle divisions
  let rectX = 0;
  let rectY = 0;
  let rectW = width;
  let rectH = height;

  // 8 iterations of golden spiral subdivision
  for (let i = 0; i < 8; i++) {
    const isVertical = i % 2 === 0;

    if (isVertical) {
      const goldenW = rectW * PHI_INVERSE;

      // Add dividing line
      if (orientation === 'top-left' || orientation === 'bottom-left') {
        lines.push({
          start: { x: rectX + goldenW, y: rectY },
          end: { x: rectX + goldenW, y: rectY + rectH },
        });
        spiralPoints.push({ x: rectX + goldenW, y: rectY + rectH });
        rectX += goldenW;
        rectW -= goldenW;
      } else {
        lines.push({
          start: { x: rectX + rectW - goldenW, y: rectY },
          end: { x: rectX + rectW - goldenW, y: rectY + rectH },
        });
        spiralPoints.push({ x: rectX + rectW - goldenW, y: rectY });
        rectW -= goldenW;
      }
    } else {
      const goldenH = rectH * PHI_INVERSE;

      if (orientation === 'top-left' || orientation === 'top-right') {
        lines.push({
          start: { x: rectX, y: rectY + goldenH },
          end: { x: rectX + rectW, y: rectY + goldenH },
        });
        spiralPoints.push({ x: rectX, y: rectY + goldenH });
        rectY += goldenH;
        rectH -= goldenH;
      } else {
        lines.push({
          start: { x: rectX, y: rectY + rectH - goldenH },
          end: { x: rectX + rectW, y: rectY + rectH - goldenH },
        });
        spiralPoints.push({ x: rectX + rectW, y: rectY + rectH - goldenH });
        rectH -= goldenH;
      }
    }
  }

  // Center of spiral is also a power point
  const powerPoints: Point[] = spiralPoints.slice(0, 4);

  return {
    lines,
    powerPoints,
    curves: [{ type: 'spiral', points: spiralPoints }],
  };
}

function generateDiagonal(
  width: number,
  height: number,
  type: DiagonalType = 'both'
): GridOverlay {
  const lines: Line[] = [];

  // Baroque diagonal (bottom-left to top-right)
  if (type === 'baroque' || type === 'both') {
    lines.push({ start: { x: 0, y: height }, end: { x: width, y: 0 } });
  }

  // Sinister diagonal (top-left to bottom-right)
  if (type === 'sinister' || type === 'both') {
    lines.push({ start: { x: 0, y: 0 }, end: { x: width, y: height } });
  }

  // Power point at center
  const powerPoints: Point[] = [{ x: width / 2, y: height / 2 }];

  return { lines, powerPoints };
}

function generateCenterCross(width: number, height: number): GridOverlay {
  const centerX = width / 2;
  const centerY = height / 2;

  const lines: Line[] = [
    { start: { x: centerX, y: 0 }, end: { x: centerX, y: height } },
    { start: { x: 0, y: centerY }, end: { x: width, y: centerY } },
  ];

  const powerPoints: Point[] = [{ x: centerX, y: centerY }];

  return { lines, powerPoints };
}

function generateTriangle(width: number, height: number): GridOverlay {
  const centerX = width / 2;

  const lines: Line[] = [
    // Triangle from top center to bottom corners
    { start: { x: centerX, y: 0 }, end: { x: 0, y: height } },
    { start: { x: centerX, y: 0 }, end: { x: width, y: height } },
    { start: { x: 0, y: height }, end: { x: width, y: height } },
  ];

  // Power points at triangle vertices and centroid
  const powerPoints: Point[] = [
    { x: centerX, y: 0 },
    { x: 0, y: height },
    { x: width, y: height },
    { x: centerX, y: height * (2 / 3) }, // Centroid
  ];

  return { lines, powerPoints };
}

function generatePhiGrid(width: number, height: number): GridOverlay {
  // Phi grid divides using 1:1.618:1 ratio
  const phiUnit = width / (1 + PHI + 1);
  const leftLine = phiUnit;
  const rightLine = phiUnit + phiUnit * PHI;

  const phiUnitH = height / (1 + PHI + 1);
  const topLine = phiUnitH;
  const bottomLine = phiUnitH + phiUnitH * PHI;

  const lines: Line[] = [
    { start: { x: leftLine, y: 0 }, end: { x: leftLine, y: height } },
    { start: { x: rightLine, y: 0 }, end: { x: rightLine, y: height } },
    { start: { x: 0, y: topLine }, end: { x: width, y: topLine } },
    { start: { x: 0, y: bottomLine }, end: { x: width, y: bottomLine } },
  ];

  const powerPoints: Point[] = [
    { x: leftLine, y: topLine },
    { x: rightLine, y: topLine },
    { x: leftLine, y: bottomLine },
    { x: rightLine, y: bottomLine },
  ];

  return { lines, powerPoints };
}

function generateCustomGrid(
  width: number,
  height: number,
  rows: number = 3,
  cols: number = 3
): GridOverlay {
  const lines: Line[] = [];
  const powerPoints: Point[] = [];

  const cellW = width / cols;
  const cellH = height / rows;

  // Vertical lines
  for (let i = 1; i < cols; i++) {
    lines.push({
      start: { x: cellW * i, y: 0 },
      end: { x: cellW * i, y: height },
    });
  }

  // Horizontal lines
  for (let i = 1; i < rows; i++) {
    lines.push({
      start: { x: 0, y: cellH * i },
      end: { x: width, y: cellH * i },
    });
  }

  // Power points at intersections
  for (let row = 1; row < rows; row++) {
    for (let col = 1; col < cols; col++) {
      powerPoints.push({ x: cellW * col, y: cellH * row });
    }
  }

  return { lines, powerPoints };
}

// ============================================================================
// Composition Templates
// ============================================================================

const COMPOSITION_TEMPLATES: CompositionTemplate[] = [
  {
    id: 'portrait-centered',
    name: 'Centered Portrait',
    category: 'portrait',
    description: 'Subject centered with focus on face/upper body',
    focalAreas: [{ x: 0.3, y: 0.1, width: 0.4, height: 0.5, weight: 1 }],
    suggestedGrids: ['center-cross', 'rule-of-thirds'],
  },
  {
    id: 'portrait-rule-of-thirds',
    name: 'Off-Center Portrait',
    category: 'portrait',
    description: 'Subject placed at rule of thirds intersection',
    focalAreas: [{ x: 0.5, y: 0.1, width: 0.3, height: 0.5, weight: 1 }],
    suggestedGrids: ['rule-of-thirds', 'golden-ratio'],
  },
  {
    id: 'landscape-horizon',
    name: 'Landscape with Low Horizon',
    category: 'landscape',
    description: 'Emphasis on sky, horizon at lower third',
    focalAreas: [{ x: 0, y: 0.6, width: 1, height: 0.1, weight: 0.8 }],
    suggestedGrids: ['rule-of-thirds', 'golden-ratio'],
  },
  {
    id: 'landscape-depth',
    name: 'Landscape with Depth',
    category: 'landscape',
    description: 'Leading lines toward focal point',
    focalAreas: [{ x: 0.4, y: 0.2, width: 0.2, height: 0.2, weight: 1 }],
    suggestedGrids: ['golden-spiral', 'diagonal'],
  },
  {
    id: 'action-dynamic',
    name: 'Dynamic Action',
    category: 'action',
    description: 'Subject moving through frame with negative space',
    focalAreas: [
      { x: 0.1, y: 0.2, width: 0.3, height: 0.6, weight: 1 },
      { x: 0.5, y: 0.2, width: 0.4, height: 0.6, weight: 0.3 },
    ],
    suggestedGrids: ['diagonal', 'phi-grid'],
  },
  {
    id: 'dramatic-spiral',
    name: 'Dramatic Spiral',
    category: 'dramatic',
    description: 'Subject at golden spiral focal point',
    focalAreas: [{ x: 0.55, y: 0.55, width: 0.2, height: 0.2, weight: 1 }],
    suggestedGrids: ['golden-spiral', 'golden-ratio'],
  },
  {
    id: 'balanced-symmetry',
    name: 'Symmetrical Balance',
    category: 'balanced',
    description: 'Perfect symmetry with centered subject',
    focalAreas: [{ x: 0.35, y: 0.2, width: 0.3, height: 0.6, weight: 1 }],
    suggestedGrids: ['center-cross', 'phi-grid'],
  },
  {
    id: 'balanced-asymmetry',
    name: 'Asymmetrical Balance',
    category: 'balanced',
    description: 'Visual weight balanced through contrast',
    focalAreas: [
      { x: 0.1, y: 0.2, width: 0.25, height: 0.4, weight: 1 },
      { x: 0.65, y: 0.4, width: 0.15, height: 0.2, weight: 0.6 },
    ],
    suggestedGrids: ['rule-of-thirds', 'diagonal'],
  },
];

// ============================================================================
// Main Class
// ============================================================================

export class CompositionOverlay {
  private static instance: CompositionOverlay;
  private configs: Map<string, GridConfig> = new Map();

  private constructor() {
    // Initialize with default config
    this.configs.set('default', { ...DEFAULT_GRID_CONFIG });
  }

  static getInstance(): CompositionOverlay {
    if (!CompositionOverlay.instance) {
      CompositionOverlay.instance = new CompositionOverlay();
    }
    return CompositionOverlay.instance;
  }

  /**
   * Generate grid overlay for given dimensions
   */
  generateGrid(width: number, height: number, config?: Partial<GridConfig>): GridOverlay {
    const mergedConfig = { ...DEFAULT_GRID_CONFIG, ...config };

    switch (mergedConfig.type) {
      case 'rule-of-thirds':
        return generateRuleOfThirds(width, height);
      case 'golden-ratio':
        return generateGoldenRatio(width, height);
      case 'golden-spiral':
        return generateGoldenSpiral(width, height, mergedConfig.spiralOrientation);
      case 'diagonal':
        return generateDiagonal(width, height, mergedConfig.diagonalType);
      case 'center-cross':
        return generateCenterCross(width, height);
      case 'triangle':
        return generateTriangle(width, height);
      case 'phi-grid':
        return generatePhiGrid(width, height);
      case 'custom':
        return generateCustomGrid(
          width,
          height,
          mergedConfig.customRows || 3,
          mergedConfig.customCols || 3
        );
      default:
        return generateRuleOfThirds(width, height);
    }
  }

  /**
   * Draw grid overlay on canvas context
   */
  drawOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    config?: Partial<GridConfig>
  ): void {
    const mergedConfig = { ...DEFAULT_GRID_CONFIG, ...config };

    if (!mergedConfig.visible) return;

    const overlay = this.generateGrid(width, height, mergedConfig);

    ctx.save();
    ctx.globalAlpha = mergedConfig.opacity;
    ctx.strokeStyle = mergedConfig.color;
    ctx.lineWidth = mergedConfig.lineWidth;

    // Draw lines
    for (const line of overlay.lines) {
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();
    }

    // Draw power points
    if (mergedConfig.showPowerPoints) {
      ctx.fillStyle = mergedConfig.color;
      for (const point of overlay.powerPoints) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw curves (spiral)
    if (overlay.curves) {
      for (const curve of overlay.curves) {
        if (curve.type === 'spiral' && curve.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(curve.points[0].x, curve.points[0].y);

          for (let i = 1; i < curve.points.length; i++) {
            const prev = curve.points[i - 1];
            const curr = curve.points[i];
            const midX = (prev.x + curr.x) / 2;
            const midY = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
          }

          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  /**
   * Get all available grid types
   */
  getGridTypes(): { type: GridType; label: string; description: string }[] {
    return [
      {
        type: 'rule-of-thirds',
        label: 'Rule of Thirds',
        description: 'Classic composition grid dividing the frame into 9 equal parts',
      },
      {
        type: 'golden-ratio',
        label: 'Golden Ratio',
        description: 'Grid based on the golden ratio (1:1.618)',
      },
      {
        type: 'golden-spiral',
        label: 'Golden Spiral',
        description: 'Fibonacci spiral for dynamic compositions',
      },
      {
        type: 'diagonal',
        label: 'Diagonal',
        description: 'Diagonal lines for dynamic energy',
      },
      {
        type: 'center-cross',
        label: 'Center Cross',
        description: 'Simple center lines for symmetrical compositions',
      },
      {
        type: 'triangle',
        label: 'Triangle',
        description: 'Triangular composition for stability',
      },
      {
        type: 'phi-grid',
        label: 'Phi Grid',
        description: 'Grid using 1:1.618:1 proportions',
      },
      {
        type: 'custom',
        label: 'Custom Grid',
        description: 'Define your own row and column count',
      },
    ];
  }

  /**
   * Get composition templates
   */
  getTemplates(category?: CompositionTemplate['category']): CompositionTemplate[] {
    if (category) {
      return COMPOSITION_TEMPLATES.filter((t) => t.category === category);
    }
    return [...COMPOSITION_TEMPLATES];
  }

  /**
   * Get a specific template by ID
   */
  getTemplate(id: string): CompositionTemplate | undefined {
    return COMPOSITION_TEMPLATES.find((t) => t.id === id);
  }

  /**
   * Save custom grid configuration
   */
  saveConfig(name: string, config: GridConfig): void {
    this.configs.set(name, { ...config });
  }

  /**
   * Load saved grid configuration
   */
  loadConfig(name: string): GridConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * Get suggested grids for given aspect ratio
   */
  suggestGridsForAspectRatio(width: number, height: number): GridType[] {
    const ratio = width / height;

    if (ratio > 1.5) {
      // Wide/panoramic
      return ['rule-of-thirds', 'golden-spiral', 'diagonal'];
    } else if (ratio < 0.75) {
      // Tall/portrait
      return ['rule-of-thirds', 'center-cross', 'triangle'];
    } else if (Math.abs(ratio - 1) < 0.1) {
      // Square
      return ['rule-of-thirds', 'center-cross', 'diagonal'];
    } else {
      // Standard
      return ['rule-of-thirds', 'golden-ratio', 'phi-grid'];
    }
  }
}

// Export singleton instance
export const compositionOverlay = CompositionOverlay.getInstance();
