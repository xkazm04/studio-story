/**
 * PacingAnalyzer
 *
 * Analyzes story pacing through tension curve analysis.
 * Visualizes pacing as a line graph across story timeline.
 * Flags pacing issues and compares against genre templates.
 */

import type { Beat } from '@/app/types/Beat';
import type { Scene } from '@/app/types/Scene';

// ============================================================================
// Types
// ============================================================================

export type Genre =
  | 'action'
  | 'thriller'
  | 'romance'
  | 'comedy'
  | 'drama'
  | 'horror'
  | 'mystery'
  | 'scifi'
  | 'fantasy'
  | 'literary';

export interface TensionPoint {
  position: number; // 0-1 normalized position in story
  tension: number;  // 0-100 tension level
  beatId?: string;
  sceneId?: string;
  label?: string;
  beatType?: string;
}

export interface TensionCurve {
  points: TensionPoint[];
  averageTension: number;
  peakTension: number;
  peakPosition: number;
  valleys: { position: number; tension: number }[];
  peaks: { position: number; tension: number }[];
}

export interface PacingTemplate {
  id: Genre;
  name: string;
  description: string;
  targetCurve: { position: number; tension: number }[];
  characteristics: {
    averageTension: [number, number]; // min-max range
    peakPosition: [number, number];   // typical climax position range
    valleyDepth: number;              // how low valleys should go
    frequency: number;                // how often tension should oscillate
  };
}

export interface PacingIssue {
  type: 'flat' | 'early-climax' | 'late-climax' | 'no-peaks' | 'no-valleys' | 'monotonous' | 'jarring';
  severity: 'critical' | 'warning' | 'info';
  position?: number;
  message: string;
  suggestion: string;
}

export interface PacingAnalysisResult {
  tensionCurve: TensionCurve;
  genre: Genre | null;
  pacingScore: number;        // 0-100
  issues: PacingIssue[];
  templateComparison?: {
    template: PacingTemplate;
    similarity: number;       // 0-100
    deviations: { position: number; expected: number; actual: number }[];
  };
  recommendations: string[];
  statistics: {
    tensionRange: number;
    standardDeviation: number;
    oscillationFrequency: number;
    risingTrend: boolean;
  };
}

// ============================================================================
// Beat Tension Mapping
// ============================================================================

const BEAT_TYPE_TENSION: Record<string, number> = {
  // High tension beats
  action: 80,
  chase: 90,
  battle: 95,
  confrontation: 85,
  escape: 88,

  // Medium-high tension
  revelation: 70,
  plot_twist: 85,
  discovery: 65,
  decision: 60,
  moral_choice: 75,
  dilemma: 70,

  // Medium tension
  dialogue: 40,
  debate: 50,
  negotiation: 55,
  investigation: 45,

  // Low-medium tension
  emotional: 35,
  bonding: 30,
  romance: 35,
  reflection: 25,

  // Low tension
  setup: 20,
  exposition: 15,
  worldbuilding: 20,
  transition: 25,
  breather: 10,
  flashback: 30,

  // Climax-related
  payoff: 75,
  resolution: 40,
  callback: 55,
  foreshadowing: 35,

  // Default
  default: 50,
};

// ============================================================================
// Genre Templates
// ============================================================================

const PACING_TEMPLATES: Record<Genre, PacingTemplate> = {
  action: {
    id: 'action',
    name: 'Action/Adventure',
    description: 'High energy with frequent peaks and short valleys',
    targetCurve: [
      { position: 0.0, tension: 60 },
      { position: 0.1, tension: 70 },
      { position: 0.2, tension: 55 },
      { position: 0.3, tension: 80 },
      { position: 0.4, tension: 65 },
      { position: 0.5, tension: 75 },
      { position: 0.6, tension: 70 },
      { position: 0.7, tension: 85 },
      { position: 0.8, tension: 80 },
      { position: 0.9, tension: 95 },
      { position: 1.0, tension: 50 },
    ],
    characteristics: {
      averageTension: [60, 80],
      peakPosition: [0.85, 0.95],
      valleyDepth: 50,
      frequency: 0.15,
    },
  },
  thriller: {
    id: 'thriller',
    name: 'Thriller/Suspense',
    description: 'Steadily building tension with a late, intense climax',
    targetCurve: [
      { position: 0.0, tension: 40 },
      { position: 0.1, tension: 50 },
      { position: 0.2, tension: 55 },
      { position: 0.3, tension: 60 },
      { position: 0.4, tension: 65 },
      { position: 0.5, tension: 70 },
      { position: 0.6, tension: 75 },
      { position: 0.7, tension: 80 },
      { position: 0.8, tension: 85 },
      { position: 0.9, tension: 95 },
      { position: 1.0, tension: 40 },
    ],
    characteristics: {
      averageTension: [55, 75],
      peakPosition: [0.88, 0.95],
      valleyDepth: 40,
      frequency: 0.2,
    },
  },
  romance: {
    id: 'romance',
    name: 'Romance',
    description: 'Emotional waves with a midpoint crisis and satisfying resolution',
    targetCurve: [
      { position: 0.0, tension: 30 },
      { position: 0.1, tension: 45 },
      { position: 0.2, tension: 55 },
      { position: 0.3, tension: 50 },
      { position: 0.4, tension: 60 },
      { position: 0.5, tension: 75 },
      { position: 0.6, tension: 50 },
      { position: 0.7, tension: 65 },
      { position: 0.8, tension: 80 },
      { position: 0.9, tension: 70 },
      { position: 1.0, tension: 40 },
    ],
    characteristics: {
      averageTension: [45, 65],
      peakPosition: [0.75, 0.85],
      valleyDepth: 30,
      frequency: 0.25,
    },
  },
  comedy: {
    id: 'comedy',
    name: 'Comedy',
    description: 'Light overall tension with comedic peaks and quick recovery',
    targetCurve: [
      { position: 0.0, tension: 25 },
      { position: 0.1, tension: 40 },
      { position: 0.2, tension: 30 },
      { position: 0.3, tension: 50 },
      { position: 0.4, tension: 35 },
      { position: 0.5, tension: 55 },
      { position: 0.6, tension: 40 },
      { position: 0.7, tension: 60 },
      { position: 0.8, tension: 70 },
      { position: 0.9, tension: 65 },
      { position: 1.0, tension: 30 },
    ],
    characteristics: {
      averageTension: [35, 55],
      peakPosition: [0.7, 0.85],
      valleyDepth: 20,
      frequency: 0.15,
    },
  },
  drama: {
    id: 'drama',
    name: 'Drama',
    description: 'Emotional depth with meaningful build-up to catharsis',
    targetCurve: [
      { position: 0.0, tension: 30 },
      { position: 0.1, tension: 40 },
      { position: 0.2, tension: 50 },
      { position: 0.3, tension: 55 },
      { position: 0.4, tension: 60 },
      { position: 0.5, tension: 65 },
      { position: 0.6, tension: 70 },
      { position: 0.7, tension: 75 },
      { position: 0.8, tension: 85 },
      { position: 0.9, tension: 80 },
      { position: 1.0, tension: 45 },
    ],
    characteristics: {
      averageTension: [50, 70],
      peakPosition: [0.75, 0.9],
      valleyDepth: 35,
      frequency: 0.2,
    },
  },
  horror: {
    id: 'horror',
    name: 'Horror',
    description: 'Building dread with shock peaks and false calms',
    targetCurve: [
      { position: 0.0, tension: 35 },
      { position: 0.1, tension: 50 },
      { position: 0.2, tension: 40 },
      { position: 0.3, tension: 65 },
      { position: 0.4, tension: 50 },
      { position: 0.5, tension: 75 },
      { position: 0.6, tension: 55 },
      { position: 0.7, tension: 80 },
      { position: 0.8, tension: 70 },
      { position: 0.9, tension: 95 },
      { position: 1.0, tension: 60 },
    ],
    characteristics: {
      averageTension: [55, 75],
      peakPosition: [0.85, 0.95],
      valleyDepth: 40,
      frequency: 0.12,
    },
  },
  mystery: {
    id: 'mystery',
    name: 'Mystery',
    description: 'Intellectual tension building to revelation',
    targetCurve: [
      { position: 0.0, tension: 50 },
      { position: 0.1, tension: 55 },
      { position: 0.2, tension: 50 },
      { position: 0.3, tension: 60 },
      { position: 0.4, tension: 55 },
      { position: 0.5, tension: 65 },
      { position: 0.6, tension: 60 },
      { position: 0.7, tension: 70 },
      { position: 0.8, tension: 80 },
      { position: 0.9, tension: 90 },
      { position: 1.0, tension: 50 },
    ],
    characteristics: {
      averageTension: [50, 70],
      peakPosition: [0.85, 0.95],
      valleyDepth: 45,
      frequency: 0.18,
    },
  },
  scifi: {
    id: 'scifi',
    name: 'Science Fiction',
    description: 'Wonder and tension balanced with discovery moments',
    targetCurve: [
      { position: 0.0, tension: 40 },
      { position: 0.1, tension: 50 },
      { position: 0.2, tension: 55 },
      { position: 0.3, tension: 60 },
      { position: 0.4, tension: 55 },
      { position: 0.5, tension: 70 },
      { position: 0.6, tension: 65 },
      { position: 0.7, tension: 75 },
      { position: 0.8, tension: 85 },
      { position: 0.9, tension: 90 },
      { position: 1.0, tension: 50 },
    ],
    characteristics: {
      averageTension: [50, 70],
      peakPosition: [0.8, 0.92],
      valleyDepth: 40,
      frequency: 0.2,
    },
  },
  fantasy: {
    id: 'fantasy',
    name: 'Fantasy/Epic',
    description: 'Grand scale with multiple rising arcs leading to epic climax',
    targetCurve: [
      { position: 0.0, tension: 30 },
      { position: 0.1, tension: 45 },
      { position: 0.2, tension: 55 },
      { position: 0.3, tension: 50 },
      { position: 0.4, tension: 65 },
      { position: 0.5, tension: 60 },
      { position: 0.6, tension: 75 },
      { position: 0.7, tension: 70 },
      { position: 0.8, tension: 85 },
      { position: 0.9, tension: 95 },
      { position: 1.0, tension: 45 },
    ],
    characteristics: {
      averageTension: [50, 70],
      peakPosition: [0.88, 0.95],
      valleyDepth: 35,
      frequency: 0.18,
    },
  },
  literary: {
    id: 'literary',
    name: 'Literary Fiction',
    description: 'Subtle tension with emphasis on character over plot',
    targetCurve: [
      { position: 0.0, tension: 30 },
      { position: 0.1, tension: 35 },
      { position: 0.2, tension: 40 },
      { position: 0.3, tension: 45 },
      { position: 0.4, tension: 50 },
      { position: 0.5, tension: 55 },
      { position: 0.6, tension: 60 },
      { position: 0.7, tension: 65 },
      { position: 0.8, tension: 70 },
      { position: 0.9, tension: 65 },
      { position: 1.0, tension: 50 },
    ],
    characteristics: {
      averageTension: [40, 60],
      peakPosition: [0.7, 0.9],
      valleyDepth: 30,
      frequency: 0.25,
    },
  },
};

// ============================================================================
// PacingAnalyzer Class
// ============================================================================

class PacingAnalyzerClass {
  private static instance: PacingAnalyzerClass;

  private constructor() {}

  static getInstance(): PacingAnalyzerClass {
    if (!PacingAnalyzerClass.instance) {
      PacingAnalyzerClass.instance = new PacingAnalyzerClass();
    }
    return PacingAnalyzerClass.instance;
  }

  // ============================================================================
  // Main Analysis
  // ============================================================================

  /**
   * Analyze pacing and generate tension curve
   */
  analyzePacing(
    beats: Beat[],
    scenes: Scene[],
    genre?: Genre
  ): PacingAnalysisResult {
    // Build tension curve from beats
    const tensionCurve = this.buildTensionCurve(beats, scenes);

    // Find issues
    const issues = this.findPacingIssues(tensionCurve, genre);

    // Calculate statistics
    const statistics = this.calculateStatistics(tensionCurve);

    // Compare to template if genre specified
    let templateComparison: PacingAnalysisResult['templateComparison'];
    if (genre) {
      templateComparison = this.compareToTemplate(tensionCurve, PACING_TEMPLATES[genre]);
    }

    // Calculate score
    const pacingScore = this.calculatePacingScore(tensionCurve, issues, templateComparison);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, tensionCurve, genre);

    return {
      tensionCurve,
      genre: genre || null,
      pacingScore,
      issues,
      templateComparison,
      recommendations,
      statistics,
    };
  }

  /**
   * Build tension curve from beats
   */
  buildTensionCurve(beats: Beat[], scenes: Scene[]): TensionCurve {
    if (beats.length === 0) {
      return {
        points: [],
        averageTension: 0,
        peakTension: 0,
        peakPosition: 0,
        valleys: [],
        peaks: [],
      };
    }

    // Sort beats by order or creation time
    const sortedBeats = [...beats].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });

    // Generate tension points
    const points: TensionPoint[] = sortedBeats.map((beat, index) => {
      const position = sortedBeats.length > 1 ? index / (sortedBeats.length - 1) : 0.5;
      const beatType = beat.type || 'default';
      const baseTension = BEAT_TYPE_TENSION[beatType] ?? BEAT_TYPE_TENSION.default;

      // Adjust tension based on pacing_score if available (maps to 0-1 range)
      let tension = baseTension;
      if (beat.pacing_score !== undefined) {
        tension = baseTension * (0.5 + (beat.pacing_score / 100) * 0.5);
      }

      return {
        position,
        tension: Math.min(100, Math.max(0, tension)),
        beatId: beat.id,
        sceneId: undefined, // Scene linkage handled via BeatSceneMapping
        label: beat.name,
        beatType,
      };
    });

    // Calculate average and peak
    const tensions = points.map(p => p.tension);
    const averageTension = tensions.reduce((a, b) => a + b, 0) / tensions.length;
    const peakTension = Math.max(...tensions);
    const peakIndex = tensions.indexOf(peakTension);
    const peakPosition = points[peakIndex]?.position ?? 0;

    // Find peaks and valleys (local maxima and minima)
    const peaks: { position: number; tension: number }[] = [];
    const valleys: { position: number; tension: number }[] = [];

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1].tension;
      const curr = points[i].tension;
      const next = points[i + 1].tension;

      if (curr > prev && curr > next && curr - Math.min(prev, next) > 10) {
        peaks.push({ position: points[i].position, tension: curr });
      }
      if (curr < prev && curr < next && Math.max(prev, next) - curr > 10) {
        valleys.push({ position: points[i].position, tension: curr });
      }
    }

    return {
      points,
      averageTension,
      peakTension,
      peakPosition,
      peaks,
      valleys,
    };
  }

  // ============================================================================
  // Issue Detection
  // ============================================================================

  private findPacingIssues(curve: TensionCurve, genre?: Genre): PacingIssue[] {
    const issues: PacingIssue[] = [];
    const template = genre ? PACING_TEMPLATES[genre] : null;

    if (curve.points.length < 3) {
      issues.push({
        type: 'flat',
        severity: 'info',
        message: 'Not enough beats to analyze pacing effectively',
        suggestion: 'Add more story beats to get meaningful pacing analysis',
      });
      return issues;
    }

    // Check for flat pacing (low tension range)
    const tensionRange = curve.peakTension - Math.min(...curve.points.map(p => p.tension));
    if (tensionRange < 20) {
      issues.push({
        type: 'flat',
        severity: 'warning',
        message: 'Story pacing is very flat - tension stays relatively constant',
        suggestion: 'Add more variety with high-tension action or low-tension reflection moments',
      });
    }

    // Check for early climax
    if (curve.peakPosition < 0.5) {
      issues.push({
        type: 'early-climax',
        severity: 'warning',
        position: curve.peakPosition,
        message: `Peak tension occurs too early (${Math.round(curve.peakPosition * 100)}% through story)`,
        suggestion: 'Consider moving the climax later or adding a bigger peak near the end',
      });
    }

    // Check for late climax (if genre expects earlier)
    if (template && curve.peakPosition > template.characteristics.peakPosition[1]) {
      issues.push({
        type: 'late-climax',
        severity: 'info',
        position: curve.peakPosition,
        message: `For ${template.name}, climax may be too late`,
        suggestion: 'Consider building to climax earlier in the story',
      });
    }

    // Check for no significant peaks
    if (curve.peaks.length === 0 && curve.points.length > 5) {
      issues.push({
        type: 'no-peaks',
        severity: 'warning',
        message: 'No clear tension peaks found in the story',
        suggestion: 'Add dramatic moments or confrontations to create peaks',
      });
    }

    // Check for no valleys (reader fatigue)
    if (curve.valleys.length === 0 && curve.points.length > 5 && curve.averageTension > 60) {
      issues.push({
        type: 'no-valleys',
        severity: 'warning',
        message: 'No breather moments found - readers may feel exhausted',
        suggestion: 'Add quieter moments between intense scenes for reader recovery',
      });
    }

    // Check for monotonous pacing (low standard deviation)
    const stdDev = this.calculateStandardDeviation(curve.points.map(p => p.tension));
    if (stdDev < 10 && curve.points.length > 5) {
      issues.push({
        type: 'monotonous',
        severity: 'warning',
        message: 'Pacing feels monotonous - tension level stays too consistent',
        suggestion: 'Vary your beat types to create more dynamic pacing',
      });
    }

    // Check for jarring transitions (big jumps)
    for (let i = 1; i < curve.points.length; i++) {
      const diff = Math.abs(curve.points[i].tension - curve.points[i - 1].tension);
      if (diff > 50) {
        issues.push({
          type: 'jarring',
          severity: 'info',
          position: curve.points[i].position,
          message: `Jarring tension shift at ${Math.round(curve.points[i].position * 100)}%`,
          suggestion: 'Consider adding a transitional beat to smooth the tension change',
        });
      }
    }

    return issues;
  }

  // ============================================================================
  // Template Comparison
  // ============================================================================

  private compareToTemplate(
    curve: TensionCurve,
    template: PacingTemplate
  ): { template: PacingTemplate; similarity: number; deviations: { position: number; expected: number; actual: number }[] } {
    const deviations: { position: number; expected: number; actual: number }[] = [];

    // Sample the actual curve at template positions
    template.targetCurve.forEach(({ position, tension: expected }) => {
      const actual = this.interpolateTension(curve, position);
      if (Math.abs(actual - expected) > 15) {
        deviations.push({ position, expected, actual });
      }
    });

    // Calculate similarity score
    const totalDeviation = template.targetCurve.reduce((sum, { position, tension: expected }) => {
      const actual = this.interpolateTension(curve, position);
      return sum + Math.abs(actual - expected);
    }, 0);

    const maxPossibleDeviation = template.targetCurve.length * 100;
    const similarity = Math.max(0, 100 - (totalDeviation / maxPossibleDeviation) * 100);

    return { template, similarity: Math.round(similarity), deviations };
  }

  private interpolateTension(curve: TensionCurve, position: number): number {
    if (curve.points.length === 0) return 50;
    if (curve.points.length === 1) return curve.points[0].tension;

    // Find surrounding points
    let before = curve.points[0];
    let after = curve.points[curve.points.length - 1];

    for (let i = 0; i < curve.points.length - 1; i++) {
      if (curve.points[i].position <= position && curve.points[i + 1].position >= position) {
        before = curve.points[i];
        after = curve.points[i + 1];
        break;
      }
    }

    // Linear interpolation
    if (after.position === before.position) return before.tension;
    const t = (position - before.position) / (after.position - before.position);
    return before.tension + t * (after.tension - before.tension);
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  private calculateStatistics(curve: TensionCurve): PacingAnalysisResult['statistics'] {
    const tensions = curve.points.map(p => p.tension);

    if (tensions.length === 0) {
      return {
        tensionRange: 0,
        standardDeviation: 0,
        oscillationFrequency: 0,
        risingTrend: false,
      };
    }

    const min = Math.min(...tensions);
    const max = Math.max(...tensions);
    const tensionRange = max - min;
    const standardDeviation = this.calculateStandardDeviation(tensions);

    // Calculate oscillation frequency (direction changes per unit)
    let directionChanges = 0;
    for (let i = 2; i < tensions.length; i++) {
      const prevDirection = tensions[i - 1] - tensions[i - 2];
      const currDirection = tensions[i] - tensions[i - 1];
      if (prevDirection * currDirection < 0) {
        directionChanges++;
      }
    }
    const oscillationFrequency = tensions.length > 2 ? directionChanges / (tensions.length - 2) : 0;

    // Check if overall trend is rising
    const firstThird = tensions.slice(0, Math.floor(tensions.length / 3));
    const lastThird = tensions.slice(-Math.floor(tensions.length / 3));
    const firstAvg = firstThird.reduce((a, b) => a + b, 0) / (firstThird.length || 1);
    const lastAvg = lastThird.reduce((a, b) => a + b, 0) / (lastThird.length || 1);
    const risingTrend = lastAvg > firstAvg;

    return {
      tensionRange,
      standardDeviation,
      oscillationFrequency,
      risingTrend,
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private calculatePacingScore(
    curve: TensionCurve,
    issues: PacingIssue[],
    templateComparison?: PacingAnalysisResult['templateComparison']
  ): number {
    let score = 70; // Base score

    // Bonus for variety
    if (curve.peaks.length > 0) score += 10;
    if (curve.valleys.length > 0) score += 5;

    // Bonus for rising trend
    const stats = this.calculateStatistics(curve);
    if (stats.risingTrend) score += 10;

    // Penalty for issues
    issues.forEach(issue => {
      if (issue.severity === 'critical') score -= 20;
      if (issue.severity === 'warning') score -= 10;
      if (issue.severity === 'info') score -= 3;
    });

    // Template similarity bonus
    if (templateComparison) {
      score += (templateComparison.similarity - 50) * 0.2;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // ============================================================================
  // Recommendations
  // ============================================================================

  private generateRecommendations(
    issues: PacingIssue[],
    curve: TensionCurve,
    genre?: Genre
  ): string[] {
    const recommendations: string[] = [];

    // Add issue suggestions
    issues.forEach(issue => {
      if (issue.severity !== 'info') {
        recommendations.push(issue.suggestion);
      }
    });

    // Genre-specific recommendations
    if (genre) {
      const template = PACING_TEMPLATES[genre];
      if (curve.averageTension < template.characteristics.averageTension[0]) {
        recommendations.push(`For ${template.name}, consider raising overall tension with more dramatic beats`);
      }
      if (curve.averageTension > template.characteristics.averageTension[1]) {
        recommendations.push(`${template.name} typically has more breathing room - add reflective moments`);
      }
    }

    // General recommendations
    if (curve.points.length > 0 && curve.peakTension < 70) {
      recommendations.push('Your story could benefit from a stronger climax - consider a more intense peak moment');
    }

    return [...new Set(recommendations)].slice(0, 5);
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  getGenres(): Genre[] {
    return Object.keys(PACING_TEMPLATES) as Genre[];
  }

  getTemplate(genre: Genre): PacingTemplate {
    return PACING_TEMPLATES[genre];
  }

  getBeatTension(beatType: string): number {
    return BEAT_TYPE_TENSION[beatType] ?? BEAT_TYPE_TENSION.default;
  }
}

// ============================================================================
// Export
// ============================================================================

export const pacingAnalyzer = PacingAnalyzerClass.getInstance();

export { PacingAnalyzerClass, PACING_TEMPLATES, BEAT_TYPE_TENSION };

export default pacingAnalyzer;
