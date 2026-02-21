/**
 * StructureAnalyzer
 *
 * Analyzes story structure including act balance, beat distribution,
 * scene count, and word count analytics. Compares against target
 * structures like 3-act, 5-act, and hero's journey.
 */

import type { Act } from '@/app/types/Act';
import type { Beat } from '@/app/types/Beat';
import type { Scene } from '@/app/types/Scene';

// ============================================================================
// Types
// ============================================================================

export type StructureTemplate =
  | 'three-act'
  | 'five-act'
  | 'heros-journey'
  | 'save-the-cat'
  | 'seven-point'
  | 'fichtean-curve'
  | 'custom';

export interface ActTarget {
  name: string;
  percentageRange: [number, number]; // min-max % of total story
  description: string;
  expectedBeatTypes?: string[];
}

export interface StructureTemplateDefinition {
  id: StructureTemplate;
  name: string;
  description: string;
  acts: ActTarget[];
  totalActs: number;
  keyBeats: { position: number; name: string; description: string }[];
}

export interface ActAnalysis {
  actId: string;
  actName: string;
  order: number;
  beatCount: number;
  sceneCount: number;
  wordCount: number;
  percentageOfTotal: number;
  targetPercentage: number;
  deviation: number; // positive = too long, negative = too short
  isBalanced: boolean;
  beatTypeDistribution: Map<string, number>;
  missingExpectedBeats: string[];
}

export interface StructureIssue {
  type: 'imbalance' | 'missing-beat' | 'pacing' | 'structure';
  severity: 'critical' | 'warning' | 'info';
  actId?: string;
  message: string;
  suggestion: string;
  affectedRange?: { start: number; end: number };
}

export interface StructureAnalysisResult {
  template: StructureTemplate;
  templateName: string;
  overallScore: number; // 0-100
  totalActs: number;
  totalBeats: number;
  totalScenes: number;
  totalWords: number;
  actAnalyses: ActAnalysis[];
  issues: StructureIssue[];
  keyBeatPresence: { name: string; present: boolean; position?: number }[];
  structureCompliance: number; // 0-100 how well it matches template
  recommendations: string[];
}

export interface BeatDistributionResult {
  byCategory: Map<string, number>;
  bySubtype: Map<string, number>;
  balance: {
    action: number;
    dialogue: number;
    description: number;
    emotional: number;
  };
  balanceScore: number;
  recommendations: string[];
}

// ============================================================================
// Structure Templates
// ============================================================================

const STRUCTURE_TEMPLATES: Record<StructureTemplate, StructureTemplateDefinition> = {
  'three-act': {
    id: 'three-act',
    name: 'Three-Act Structure',
    description: 'Classic storytelling structure with setup, confrontation, and resolution',
    totalActs: 3,
    acts: [
      {
        name: 'Act 1 - Setup',
        percentageRange: [20, 30],
        description: 'Introduction, inciting incident, and first plot point',
        expectedBeatTypes: ['setup', 'revelation'],
      },
      {
        name: 'Act 2 - Confrontation',
        percentageRange: [45, 55],
        description: 'Rising action, midpoint, and complications',
        expectedBeatTypes: ['action', 'decision', 'emotional'],
      },
      {
        name: 'Act 3 - Resolution',
        percentageRange: [20, 30],
        description: 'Climax, falling action, and resolution',
        expectedBeatTypes: ['payoff', 'emotional', 'transition'],
      },
    ],
    keyBeats: [
      { position: 0.1, name: 'Inciting Incident', description: 'Event that sets the story in motion' },
      { position: 0.25, name: 'First Plot Point', description: 'Protagonist commits to the journey' },
      { position: 0.5, name: 'Midpoint', description: 'Major revelation or shift in direction' },
      { position: 0.75, name: 'Second Plot Point', description: 'Final push toward climax' },
      { position: 0.9, name: 'Climax', description: 'Peak of conflict and tension' },
    ],
  },
  'five-act': {
    id: 'five-act',
    name: 'Five-Act Structure (Freytag\'s Pyramid)',
    description: 'Classical dramatic structure with exposition, rising action, climax, falling action, and denouement',
    totalActs: 5,
    acts: [
      {
        name: 'Act 1 - Exposition',
        percentageRange: [15, 20],
        description: 'Introduction of characters, setting, and initial situation',
        expectedBeatTypes: ['setup', 'dialogue'],
      },
      {
        name: 'Act 2 - Rising Action',
        percentageRange: [20, 25],
        description: 'Complications and obstacles emerge',
        expectedBeatTypes: ['action', 'revelation', 'decision'],
      },
      {
        name: 'Act 3 - Climax',
        percentageRange: [15, 20],
        description: 'Peak of dramatic tension',
        expectedBeatTypes: ['action', 'emotional', 'payoff'],
      },
      {
        name: 'Act 4 - Falling Action',
        percentageRange: [20, 25],
        description: 'Consequences of climax unfold',
        expectedBeatTypes: ['emotional', 'revelation', 'decision'],
      },
      {
        name: 'Act 5 - Denouement',
        percentageRange: [15, 20],
        description: 'Resolution and final state',
        expectedBeatTypes: ['payoff', 'transition', 'emotional'],
      },
    ],
    keyBeats: [
      { position: 0.1, name: 'Hook', description: 'Initial engagement point' },
      { position: 0.2, name: 'Inciting Incident', description: 'Story catalyst' },
      { position: 0.4, name: 'Rising Complications', description: 'Obstacles increase' },
      { position: 0.5, name: 'Climax', description: 'Peak conflict' },
      { position: 0.7, name: 'Reversal', description: 'Major change in fortune' },
      { position: 0.9, name: 'Resolution', description: 'Final outcome' },
    ],
  },
  'heros-journey': {
    id: 'heros-journey',
    name: 'Hero\'s Journey',
    description: 'Joseph Campbell\'s monomyth structure with departure, initiation, and return',
    totalActs: 3,
    acts: [
      {
        name: 'Departure',
        percentageRange: [25, 35],
        description: 'Call to adventure, refusal, mentor, crossing threshold',
        expectedBeatTypes: ['setup', 'revelation', 'decision'],
      },
      {
        name: 'Initiation',
        percentageRange: [40, 50],
        description: 'Tests, allies, enemies, ordeal, reward',
        expectedBeatTypes: ['action', 'emotional', 'payoff'],
      },
      {
        name: 'Return',
        percentageRange: [20, 30],
        description: 'Road back, resurrection, return with elixir',
        expectedBeatTypes: ['action', 'payoff', 'transition'],
      },
    ],
    keyBeats: [
      { position: 0.05, name: 'Ordinary World', description: 'Hero\'s normal life' },
      { position: 0.1, name: 'Call to Adventure', description: 'Challenge presented' },
      { position: 0.15, name: 'Refusal of the Call', description: 'Initial hesitation' },
      { position: 0.2, name: 'Meeting the Mentor', description: 'Guidance received' },
      { position: 0.25, name: 'Crossing the Threshold', description: 'Entering the special world' },
      { position: 0.5, name: 'Ordeal', description: 'Greatest challenge faced' },
      { position: 0.6, name: 'Reward', description: 'Prize obtained' },
      { position: 0.75, name: 'The Road Back', description: 'Journey home begins' },
      { position: 0.9, name: 'Resurrection', description: 'Final test and transformation' },
      { position: 0.95, name: 'Return with Elixir', description: 'Hero returns changed' },
    ],
  },
  'save-the-cat': {
    id: 'save-the-cat',
    name: 'Save the Cat! Beat Sheet',
    description: 'Blake Snyder\'s screenplay structure with 15 beats',
    totalActs: 3,
    acts: [
      {
        name: 'Act 1 - Thesis',
        percentageRange: [20, 25],
        description: 'Opening, theme stated, setup, catalyst, debate',
        expectedBeatTypes: ['setup', 'dialogue', 'revelation'],
      },
      {
        name: 'Act 2 - Antithesis',
        percentageRange: [50, 55],
        description: 'Break into 2, B-story, fun & games, midpoint, bad guys close in, all is lost, dark night',
        expectedBeatTypes: ['action', 'emotional', 'decision'],
      },
      {
        name: 'Act 3 - Synthesis',
        percentageRange: [20, 25],
        description: 'Break into 3, finale, final image',
        expectedBeatTypes: ['action', 'payoff', 'emotional'],
      },
    ],
    keyBeats: [
      { position: 0.01, name: 'Opening Image', description: 'Visual that sets tone' },
      { position: 0.05, name: 'Theme Stated', description: 'What the story is about' },
      { position: 0.1, name: 'Setup', description: 'Status quo established' },
      { position: 0.12, name: 'Catalyst', description: 'Life-changing event' },
      { position: 0.17, name: 'Debate', description: 'Should they go?' },
      { position: 0.25, name: 'Break into Two', description: 'Enter the new world' },
      { position: 0.3, name: 'B Story', description: 'Love story or theme carrier' },
      { position: 0.35, name: 'Fun and Games', description: 'Promise of the premise' },
      { position: 0.5, name: 'Midpoint', description: 'Stakes raised' },
      { position: 0.55, name: 'Bad Guys Close In', description: 'Pressure mounts' },
      { position: 0.75, name: 'All Is Lost', description: 'Whiff of death' },
      { position: 0.8, name: 'Dark Night of the Soul', description: 'Lowest point' },
      { position: 0.85, name: 'Break into Three', description: 'Solution found' },
      { position: 0.9, name: 'Finale', description: 'Applying lessons' },
      { position: 0.99, name: 'Final Image', description: 'Opposite of opening' },
    ],
  },
  'seven-point': {
    id: 'seven-point',
    name: 'Seven-Point Story Structure',
    description: 'Dan Wells\' structure with hook, plot turns, pinches, midpoint, and resolution',
    totalActs: 3,
    acts: [
      {
        name: 'Beginning',
        percentageRange: [25, 30],
        description: 'Hook, Plot Turn 1',
        expectedBeatTypes: ['setup', 'revelation'],
      },
      {
        name: 'Middle',
        percentageRange: [45, 50],
        description: 'Pinch 1, Midpoint, Pinch 2',
        expectedBeatTypes: ['action', 'emotional', 'decision'],
      },
      {
        name: 'End',
        percentageRange: [20, 25],
        description: 'Plot Turn 2, Resolution',
        expectedBeatTypes: ['action', 'payoff'],
      },
    ],
    keyBeats: [
      { position: 0.0, name: 'Hook', description: 'Opposite state of resolution' },
      { position: 0.15, name: 'Plot Turn 1', description: 'Call to action' },
      { position: 0.35, name: 'Pinch 1', description: 'Bad guys apply pressure' },
      { position: 0.5, name: 'Midpoint', description: 'Move from reaction to action' },
      { position: 0.65, name: 'Pinch 2', description: 'Stakes raised, jaws tighten' },
      { position: 0.85, name: 'Plot Turn 2', description: 'Final piece of puzzle' },
      { position: 1.0, name: 'Resolution', description: 'Climax and ending' },
    ],
  },
  'fichtean-curve': {
    id: 'fichtean-curve',
    name: 'Fichtean Curve',
    description: 'Rising action structure with multiple crises leading to climax',
    totalActs: 1,
    acts: [
      {
        name: 'Rising Crises',
        percentageRange: [90, 100],
        description: 'Series of escalating crises leading to climax and resolution',
        expectedBeatTypes: ['action', 'decision', 'emotional', 'payoff'],
      },
    ],
    keyBeats: [
      { position: 0.1, name: 'Initial Crisis', description: 'First major conflict' },
      { position: 0.3, name: 'Rising Crisis 1', description: 'Escalation' },
      { position: 0.5, name: 'Rising Crisis 2', description: 'Higher stakes' },
      { position: 0.7, name: 'Rising Crisis 3', description: 'Near breaking point' },
      { position: 0.85, name: 'Climax', description: 'Peak of all crises' },
      { position: 0.95, name: 'Falling Action', description: 'Quick resolution' },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom Structure',
    description: 'User-defined structure',
    totalActs: 0,
    acts: [],
    keyBeats: [],
  },
};

// ============================================================================
// StructureAnalyzer Class
// ============================================================================

class StructureAnalyzerClass {
  private static instance: StructureAnalyzerClass;

  private constructor() {}

  static getInstance(): StructureAnalyzerClass {
    if (!StructureAnalyzerClass.instance) {
      StructureAnalyzerClass.instance = new StructureAnalyzerClass();
    }
    return StructureAnalyzerClass.instance;
  }

  // ============================================================================
  // Main Analysis
  // ============================================================================

  /**
   * Analyze story structure against a template
   */
  analyzeStructure(
    acts: Act[],
    beats: Beat[],
    scenes: Scene[],
    template: StructureTemplate = 'three-act'
  ): StructureAnalysisResult {
    const templateDef = STRUCTURE_TEMPLATES[template];
    const sortedActs = [...acts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Calculate totals
    const totalWords = this.calculateTotalWords(scenes, beats);
    const totalBeats = beats.length;
    const totalScenes = scenes.length;

    // Analyze each act
    const actAnalyses = this.analyzeActs(sortedActs, beats, scenes, templateDef, totalWords);

    // Find structural issues
    const issues = this.findStructuralIssues(actAnalyses, templateDef, beats);

    // Check key beat presence
    const keyBeatPresence = this.checkKeyBeats(beats, templateDef);

    // Calculate scores
    const structureCompliance = this.calculateCompliance(actAnalyses, keyBeatPresence, templateDef);
    const overallScore = this.calculateOverallScore(structureCompliance, issues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(actAnalyses, issues, keyBeatPresence, templateDef);

    return {
      template,
      templateName: templateDef.name,
      overallScore,
      totalActs: sortedActs.length,
      totalBeats,
      totalScenes,
      totalWords,
      actAnalyses,
      issues,
      keyBeatPresence,
      structureCompliance,
      recommendations,
    };
  }

  /**
   * Analyze beat distribution across categories
   */
  analyzeBeatDistribution(beats: Beat[]): BeatDistributionResult {
    const byCategory = new Map<string, number>();
    const bySubtype = new Map<string, number>();

    beats.forEach(beat => {
      const category = beat.type || 'uncategorized';
      const subtype = beat.type || 'unknown'; // Beat type doesn't have subtype

      byCategory.set(category, (byCategory.get(category) || 0) + 1);
      bySubtype.set(subtype, (bySubtype.get(subtype) || 0) + 1);
    });

    // Calculate balance percentages
    const total = beats.length || 1;
    const balance = {
      action: ((byCategory.get('action') || 0) / total) * 100,
      dialogue: ((byCategory.get('dialogue') || 0) / total) * 100,
      description: ((byCategory.get('setup') || 0) + (byCategory.get('transition') || 0)) / total * 100,
      emotional: ((byCategory.get('emotional') || 0) / total) * 100,
    };

    // Calculate balance score (how evenly distributed)
    const values = Object.values(balance);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const balanceScore = Math.max(0, 100 - Math.sqrt(variance) * 2);

    // Generate recommendations
    const recommendations: string[] = [];
    if (balance.action < 10) recommendations.push('Story may lack action - consider adding more dynamic scenes');
    if (balance.action > 50) recommendations.push('Story is very action-heavy - consider adding reflective moments');
    if (balance.dialogue < 10) recommendations.push('Very little dialogue - consider adding character conversations');
    if (balance.emotional < 5) recommendations.push('Story may feel emotionally flat - add emotional beats');
    if (balanceScore < 50) recommendations.push('Beat types are unbalanced - consider varying your beat types');

    return {
      byCategory,
      bySubtype,
      balance,
      balanceScore,
      recommendations,
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private analyzeActs(
    acts: Act[],
    beats: Beat[],
    scenes: Scene[],
    template: StructureTemplateDefinition,
    totalWords: number
  ): ActAnalysis[] {
    return acts.map((act, index) => {
      const actBeats = beats.filter(b => b.act_id === act.id);
      // Scenes are linked via act_id, not directly through beats
      const actScenes = scenes.filter(s => s.act_id === act.id);
      const wordCount = this.calculateActWordCount(actScenes, actBeats);
      const percentageOfTotal = totalWords > 0 ? (wordCount / totalWords) * 100 : 0;

      // Get target from template
      const targetAct = template.acts[index];
      const targetPercentage = targetAct
        ? (targetAct.percentageRange[0] + targetAct.percentageRange[1]) / 2
        : 100 / acts.length;

      const deviation = percentageOfTotal - targetPercentage;
      const isBalanced = targetAct
        ? percentageOfTotal >= targetAct.percentageRange[0] &&
          percentageOfTotal <= targetAct.percentageRange[1]
        : Math.abs(deviation) < 10;

      // Beat type distribution for this act
      const beatTypeDistribution = new Map<string, number>();
      actBeats.forEach(beat => {
        const type = beat.type || 'uncategorized';
        beatTypeDistribution.set(type, (beatTypeDistribution.get(type) || 0) + 1);
      });

      // Check for missing expected beats
      const missingExpectedBeats: string[] = [];
      if (targetAct?.expectedBeatTypes) {
        targetAct.expectedBeatTypes.forEach(expectedType => {
          if (!beatTypeDistribution.has(expectedType)) {
            missingExpectedBeats.push(expectedType);
          }
        });
      }

      return {
        actId: act.id,
        actName: act.name || `Act ${index + 1}`,
        order: act.order ?? index,
        beatCount: actBeats.length,
        sceneCount: actScenes.length,
        wordCount,
        percentageOfTotal,
        targetPercentage,
        deviation,
        isBalanced,
        beatTypeDistribution,
        missingExpectedBeats,
      };
    });
  }

  private findStructuralIssues(
    actAnalyses: ActAnalysis[],
    template: StructureTemplateDefinition,
    beats: Beat[]
  ): StructureIssue[] {
    const issues: StructureIssue[] = [];

    // Check act count
    if (template.id !== 'custom' && actAnalyses.length !== template.totalActs) {
      issues.push({
        type: 'structure',
        severity: 'warning',
        message: `Story has ${actAnalyses.length} acts, but ${template.name} expects ${template.totalActs}`,
        suggestion: `Consider restructuring to match the ${template.name} format`,
      });
    }

    // Check act balance
    actAnalyses.forEach(act => {
      if (!act.isBalanced) {
        const severity = Math.abs(act.deviation) > 20 ? 'critical' : 'warning';
        issues.push({
          type: 'imbalance',
          severity,
          actId: act.actId,
          message: `"${act.actName}" is ${act.deviation > 0 ? 'too long' : 'too short'} (${act.percentageOfTotal.toFixed(1)}% vs target ${act.targetPercentage.toFixed(1)}%)`,
          suggestion: act.deviation > 0
            ? 'Consider trimming scenes or moving content to other acts'
            : 'Consider expanding this act with additional scenes or beats',
        });
      }

      // Check for missing beat types
      act.missingExpectedBeats.forEach(beatType => {
        issues.push({
          type: 'missing-beat',
          severity: 'info',
          actId: act.actId,
          message: `"${act.actName}" is missing "${beatType}" beats`,
          suggestion: `Consider adding ${beatType} beats to strengthen this act`,
        });
      });
    });

    // Check for empty acts
    actAnalyses.forEach(act => {
      if (act.beatCount === 0) {
        issues.push({
          type: 'structure',
          severity: 'critical',
          actId: act.actId,
          message: `"${act.actName}" has no beats`,
          suggestion: 'Add beats to this act or consider removing it',
        });
      }
    });

    // Check for pacing issues - too many beats in one area
    if (beats.length > 10) {
      const firstHalf = beats.slice(0, beats.length / 2);
      const secondHalf = beats.slice(beats.length / 2);
      const ratio = firstHalf.length / secondHalf.length;

      if (ratio > 2) {
        issues.push({
          type: 'pacing',
          severity: 'warning',
          message: 'Story is front-loaded - first half has significantly more beats',
          suggestion: 'Consider distributing beats more evenly or expanding the second half',
        });
      } else if (ratio < 0.5) {
        issues.push({
          type: 'pacing',
          severity: 'warning',
          message: 'Story is back-loaded - second half has significantly more beats',
          suggestion: 'Consider adding more setup and development in the first half',
        });
      }
    }

    return issues;
  }

  private checkKeyBeats(
    beats: Beat[],
    template: StructureTemplateDefinition
  ): { name: string; present: boolean; position?: number }[] {
    // Simple heuristic: check if beat names/descriptions contain key beat keywords
    return template.keyBeats.map(keyBeat => {
      const keywords = keyBeat.name.toLowerCase().split(' ');
      const foundBeat = beats.find(beat => {
        const beatText = `${beat.name || ''} ${beat.description || ''}`.toLowerCase();
        return keywords.some(kw => beatText.includes(kw));
      });

      return {
        name: keyBeat.name,
        present: !!foundBeat,
        position: foundBeat
          ? beats.indexOf(foundBeat) / beats.length
          : undefined,
      };
    });
  }

  private calculateCompliance(
    actAnalyses: ActAnalysis[],
    keyBeatPresence: { name: string; present: boolean }[],
    template: StructureTemplateDefinition
  ): number {
    if (template.id === 'custom') return 100;

    // Act balance score (50% weight)
    const balancedActs = actAnalyses.filter(a => a.isBalanced).length;
    const actScore = actAnalyses.length > 0 ? (balancedActs / actAnalyses.length) * 50 : 50;

    // Key beat presence score (50% weight)
    const presentBeats = keyBeatPresence.filter(kb => kb.present).length;
    const beatScore = keyBeatPresence.length > 0 ? (presentBeats / keyBeatPresence.length) * 50 : 50;

    return Math.round(actScore + beatScore);
  }

  private calculateOverallScore(
    structureCompliance: number,
    issues: StructureIssue[]
  ): number {
    let score = structureCompliance;

    // Deduct for issues
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    score -= criticalCount * 15;
    score -= warningCount * 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateRecommendations(
    actAnalyses: ActAnalysis[],
    issues: StructureIssue[],
    keyBeatPresence: { name: string; present: boolean }[],
    template: StructureTemplateDefinition
  ): string[] {
    const recommendations: string[] = [];

    // Add issue-based recommendations
    issues.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'warning') {
        recommendations.push(issue.suggestion);
      }
    });

    // Add key beat recommendations
    const missingKeyBeats = keyBeatPresence.filter(kb => !kb.present);
    if (missingKeyBeats.length > 0 && missingKeyBeats.length <= 3) {
      recommendations.push(
        `Consider adding these key story beats: ${missingKeyBeats.map(kb => kb.name).join(', ')}`
      );
    } else if (missingKeyBeats.length > 3) {
      recommendations.push(
        `Story is missing ${missingKeyBeats.length} key beats from the ${template.name} structure`
      );
    }

    // General recommendations based on totals
    const totalBeats = actAnalyses.reduce((sum, a) => sum + a.beatCount, 0);
    if (totalBeats < 5) {
      recommendations.push('Story has very few beats - consider developing more story moments');
    }

    // Remove duplicates
    return [...new Set(recommendations)].slice(0, 5);
  }

  private calculateTotalWords(scenes: Scene[], beats: Beat[]): number {
    let total = 0;

    scenes.forEach(scene => {
      if (scene.content) {
        total += scene.content.split(/\s+/).length;
      }
      if (scene.description) {
        total += scene.description.split(/\s+/).length;
      }
    });

    beats.forEach(beat => {
      if (beat.description) {
        total += beat.description.split(/\s+/).length;
      }
    });

    return total;
  }

  private calculateActWordCount(scenes: Scene[], beats: Beat[]): number {
    let total = 0;

    scenes.forEach(scene => {
      if (scene.content) {
        total += scene.content.split(/\s+/).length;
      }
    });

    beats.forEach(beat => {
      if (beat.description) {
        total += beat.description.split(/\s+/).length;
      }
    });

    return total;
  }

  // ============================================================================
  // Template Access
  // ============================================================================

  getTemplates(): StructureTemplateDefinition[] {
    return Object.values(STRUCTURE_TEMPLATES).filter(t => t.id !== 'custom');
  }

  getTemplate(id: StructureTemplate): StructureTemplateDefinition {
    return STRUCTURE_TEMPLATES[id];
  }
}

// ============================================================================
// Export
// ============================================================================

export const structureAnalyzer = StructureAnalyzerClass.getInstance();

export { StructureAnalyzerClass, STRUCTURE_TEMPLATES };

export default structureAnalyzer;
