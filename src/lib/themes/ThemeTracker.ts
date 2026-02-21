/**
 * ThemeTracker
 * Core system for tracking story premise, themes, thematic coverage,
 * and premise fulfillment analysis
 */

// ===== PREMISE TYPES =====

export interface StoryPremise {
  id: string;
  projectId: string;

  // Who/What/Why/Stakes structure
  protagonist: string;           // Who is the story about?
  goal: string;                  // What do they want?
  motivation: string;            // Why do they want it?
  stakes: string;                // What happens if they fail?

  // Optional additional premise elements
  antagonist?: string;           // Who/what opposes them?
  setting?: string;              // Where/when does it take place?
  conflict?: string;             // Central conflict type

  // Premise statement (auto-generated or custom)
  statement?: string;            // Full premise statement

  createdAt: Date;
  updatedAt: Date;
}

export type ConflictType =
  | 'person_vs_person'
  | 'person_vs_self'
  | 'person_vs_nature'
  | 'person_vs_society'
  | 'person_vs_technology'
  | 'person_vs_supernatural'
  | 'person_vs_fate';

export const CONFLICT_TYPES: Record<ConflictType, { label: string; description: string }> = {
  person_vs_person: {
    label: 'Person vs Person',
    description: 'Protagonist against another character',
  },
  person_vs_self: {
    label: 'Person vs Self',
    description: 'Internal struggle or moral dilemma',
  },
  person_vs_nature: {
    label: 'Person vs Nature',
    description: 'Struggle against natural forces or environment',
  },
  person_vs_society: {
    label: 'Person vs Society',
    description: 'Against social norms, institutions, or systems',
  },
  person_vs_technology: {
    label: 'Person vs Technology',
    description: 'Conflict with machines, AI, or technological forces',
  },
  person_vs_supernatural: {
    label: 'Person vs Supernatural',
    description: 'Against gods, magic, or supernatural entities',
  },
  person_vs_fate: {
    label: 'Person vs Fate',
    description: 'Against destiny, prophecy, or inevitability',
  },
};

// ===== THEME TYPES =====

export type ThemeLevel = 'primary' | 'secondary' | 'motif';

export interface Theme {
  id: string;
  name: string;
  description: string;
  level: ThemeLevel;
  parentId?: string;          // For hierarchical themes
  keywords: string[];         // Keywords associated with theme
  symbol?: string;            // Visual symbol/icon
  color?: string;             // Color for UI representation
}

export interface ThemeHierarchy {
  id: string;
  projectId: string;
  themes: Theme[];
  createdAt: Date;
  updatedAt: Date;
}

// ===== SCENE TAGGING TYPES =====

export type ThemeRelevance = 'strong' | 'moderate' | 'subtle' | 'implicit';

export interface SceneThemeTag {
  id: string;
  sceneId: string;
  themeId: string;
  relevance: ThemeRelevance;
  notes?: string;              // How the theme appears in the scene
  timestamp?: number;          // Position in scene where theme appears
}

export interface SceneThemeTags {
  sceneId: string;
  sceneName: string;
  tags: SceneThemeTag[];
}

// ===== ANALYSIS TYPES =====

export interface ThemeCoverage {
  themeId: string;
  themeName: string;
  level: ThemeLevel;
  totalOccurrences: number;
  strongOccurrences: number;
  moderateOccurrences: number;
  subtleOccurrences: number;
  implicitOccurrences: number;
  sceneCount: number;
  coveragePercentage: number;  // Percentage of scenes that touch this theme
  distributionScore: number;   // How evenly distributed (0-100)
  gaps: ThemeGap[];            // Sections where theme is absent
}

export interface ThemeGap {
  startSceneIndex: number;
  endSceneIndex: number;
  sceneCount: number;
  severity: 'minor' | 'moderate' | 'significant';
}

export interface ThematicBalance {
  overallScore: number;        // 0-100
  primaryThemesCoverage: number;
  secondaryThemesCoverage: number;
  motifsCoverage: number;
  recommendations: BalanceRecommendation[];
}

export interface BalanceRecommendation {
  type: 'add_theme' | 'strengthen_theme' | 'distribute_theme' | 'reduce_theme';
  themeId?: string;
  themeName?: string;
  sceneRange?: { start: number; end: number };
  message: string;
  priority: 'high' | 'medium' | 'low';
}

// ===== PREMISE FULFILLMENT TYPES =====

export interface PremiseFulfillment {
  overallScore: number;        // 0-100
  componentScores: {
    protagonistDevelopment: number;
    goalPursuit: number;
    motivationExploration: number;
    stakesEscalation: number;
    conflictResolution: number;
  };
  milestones: FulfillmentMilestone[];
  issues: FulfillmentIssue[];
}

export interface FulfillmentMilestone {
  id: string;
  name: string;
  description: string;
  achieved: boolean;
  sceneId?: string;
  notes?: string;
}

export interface FulfillmentIssue {
  type: 'missing' | 'underdeveloped' | 'inconsistent' | 'unresolved';
  component: keyof PremiseFulfillment['componentScores'];
  message: string;
  suggestions: string[];
}

// ===== RELEVANCE WEIGHTS =====

const RELEVANCE_WEIGHTS: Record<ThemeRelevance, number> = {
  strong: 1.0,
  moderate: 0.7,
  subtle: 0.4,
  implicit: 0.2,
};

// ===== THEME TRACKER CLASS =====

export class ThemeTracker {
  private premise: StoryPremise | null = null;
  private themes: Map<string, Theme> = new Map();
  private sceneTags: Map<string, SceneThemeTag[]> = new Map();
  private scenes: Array<{ id: string; name: string; order: number }> = [];

  constructor() {}

  // ===== PREMISE METHODS =====

  setPremise(premise: StoryPremise): void {
    this.premise = premise;
  }

  getPremise(): StoryPremise | null {
    return this.premise;
  }

  generatePremiseStatement(premise: Partial<StoryPremise>): string {
    const parts: string[] = [];

    if (premise.protagonist) {
      parts.push(premise.protagonist);
    }

    if (premise.goal) {
      parts.push(`must ${premise.goal}`);
    }

    if (premise.antagonist) {
      parts.push(`while facing ${premise.antagonist}`);
    }

    if (premise.motivation) {
      parts.push(`because ${premise.motivation}`);
    }

    if (premise.stakes) {
      parts.push(`or else ${premise.stakes}`);
    }

    return parts.join(' ') + '.';
  }

  // ===== THEME METHODS =====

  addTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }

  removeTheme(themeId: string): void {
    this.themes.delete(themeId);
    // Remove all tags for this theme
    for (const [sceneId, tags] of this.sceneTags.entries()) {
      this.sceneTags.set(
        sceneId,
        tags.filter(t => t.themeId !== themeId)
      );
    }
  }

  getTheme(themeId: string): Theme | undefined {
    return this.themes.get(themeId);
  }

  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  getThemesByLevel(level: ThemeLevel): Theme[] {
    return this.getAllThemes().filter(t => t.level === level);
  }

  getThemeHierarchy(): Map<string, Theme[]> {
    const hierarchy = new Map<string, Theme[]>();

    // Root themes (no parent)
    const rootThemes = this.getAllThemes().filter(t => !t.parentId);
    hierarchy.set('root', rootThemes);

    // Child themes
    for (const theme of this.getAllThemes()) {
      if (theme.parentId) {
        const siblings = hierarchy.get(theme.parentId) || [];
        siblings.push(theme);
        hierarchy.set(theme.parentId, siblings);
      }
    }

    return hierarchy;
  }

  // ===== SCENE METHODS =====

  setScenes(scenes: Array<{ id: string; name: string; order: number }>): void {
    this.scenes = scenes.sort((a, b) => a.order - b.order);
  }

  // ===== TAGGING METHODS =====

  tagScene(sceneId: string, tag: Omit<SceneThemeTag, 'id'>): SceneThemeTag {
    const newTag: SceneThemeTag = {
      ...tag,
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    const existing = this.sceneTags.get(sceneId) || [];
    existing.push(newTag);
    this.sceneTags.set(sceneId, existing);

    return newTag;
  }

  removeTag(sceneId: string, tagId: string): void {
    const tags = this.sceneTags.get(sceneId);
    if (tags) {
      this.sceneTags.set(
        sceneId,
        tags.filter(t => t.id !== tagId)
      );
    }
  }

  updateTag(sceneId: string, tagId: string, updates: Partial<SceneThemeTag>): void {
    const tags = this.sceneTags.get(sceneId);
    if (tags) {
      this.sceneTags.set(
        sceneId,
        tags.map(t => t.id === tagId ? { ...t, ...updates } : t)
      );
    }
  }

  getSceneTags(sceneId: string): SceneThemeTag[] {
    return this.sceneTags.get(sceneId) || [];
  }

  getTagsForTheme(themeId: string): SceneThemeTag[] {
    const allTags: SceneThemeTag[] = [];
    for (const tags of this.sceneTags.values()) {
      allTags.push(...tags.filter(t => t.themeId === themeId));
    }
    return allTags;
  }

  // ===== COVERAGE ANALYSIS =====

  analyzeThemeCoverage(themeId: string): ThemeCoverage | null {
    const theme = this.themes.get(themeId);
    if (!theme) return null;

    const tags = this.getTagsForTheme(themeId);
    const sceneIds = new Set(tags.map(t => t.sceneId));

    // Count by relevance
    const strongOccurrences = tags.filter(t => t.relevance === 'strong').length;
    const moderateOccurrences = tags.filter(t => t.relevance === 'moderate').length;
    const subtleOccurrences = tags.filter(t => t.relevance === 'subtle').length;
    const implicitOccurrences = tags.filter(t => t.relevance === 'implicit').length;

    // Calculate coverage percentage
    const coveragePercentage = this.scenes.length > 0
      ? (sceneIds.size / this.scenes.length) * 100
      : 0;

    // Find gaps
    const gaps = this.findThemeGaps(themeId);

    // Calculate distribution score
    const distributionScore = this.calculateDistributionScore(themeId);

    return {
      themeId,
      themeName: theme.name,
      level: theme.level,
      totalOccurrences: tags.length,
      strongOccurrences,
      moderateOccurrences,
      subtleOccurrences,
      implicitOccurrences,
      sceneCount: sceneIds.size,
      coveragePercentage,
      distributionScore,
      gaps,
    };
  }

  private findThemeGaps(themeId: string): ThemeGap[] {
    const gaps: ThemeGap[] = [];
    const tags = this.getTagsForTheme(themeId);
    const taggedSceneIds = new Set(tags.map(t => t.sceneId));

    let gapStart: number | null = null;

    for (let i = 0; i < this.scenes.length; i++) {
      const scene = this.scenes[i];
      const hasTheme = taggedSceneIds.has(scene.id);

      if (!hasTheme && gapStart === null) {
        gapStart = i;
      } else if (hasTheme && gapStart !== null) {
        const gapLength = i - gapStart;
        gaps.push({
          startSceneIndex: gapStart,
          endSceneIndex: i - 1,
          sceneCount: gapLength,
          severity: this.getGapSeverity(gapLength),
        });
        gapStart = null;
      }
    }

    // Handle gap at end
    if (gapStart !== null) {
      const gapLength = this.scenes.length - gapStart;
      gaps.push({
        startSceneIndex: gapStart,
        endSceneIndex: this.scenes.length - 1,
        sceneCount: gapLength,
        severity: this.getGapSeverity(gapLength),
      });
    }

    return gaps;
  }

  private getGapSeverity(sceneCount: number): 'minor' | 'moderate' | 'significant' {
    const totalScenes = this.scenes.length;
    const percentage = (sceneCount / totalScenes) * 100;

    if (percentage > 30) return 'significant';
    if (percentage > 15) return 'moderate';
    return 'minor';
  }

  private calculateDistributionScore(themeId: string): number {
    if (this.scenes.length === 0) return 0;

    const tags = this.getTagsForTheme(themeId);
    if (tags.length === 0) return 0;

    // Divide story into segments
    const segmentCount = Math.min(5, this.scenes.length);
    const segmentSize = Math.ceil(this.scenes.length / segmentCount);
    const segments: number[] = new Array(segmentCount).fill(0);

    // Count weighted occurrences per segment
    for (const tag of tags) {
      const sceneIndex = this.scenes.findIndex(s => s.id === tag.sceneId);
      if (sceneIndex >= 0) {
        const segmentIndex = Math.min(
          Math.floor(sceneIndex / segmentSize),
          segmentCount - 1
        );
        segments[segmentIndex] += RELEVANCE_WEIGHTS[tag.relevance];
      }
    }

    // Calculate variance from ideal distribution
    const totalWeight = segments.reduce((a, b) => a + b, 0);
    const idealPerSegment = totalWeight / segmentCount;

    if (idealPerSegment === 0) return 0;

    const variance = segments.reduce((sum, count) => {
      return sum + Math.pow(count - idealPerSegment, 2);
    }, 0) / segmentCount;

    // Convert variance to score (lower variance = higher score)
    const maxVariance = Math.pow(idealPerSegment, 2) * segmentCount;
    const normalizedVariance = maxVariance > 0 ? variance / maxVariance : 0;

    return Math.round((1 - normalizedVariance) * 100);
  }

  // ===== THEMATIC BALANCE ANALYSIS =====

  analyzeThematicBalance(): ThematicBalance {
    const primaryThemes = this.getThemesByLevel('primary');
    const secondaryThemes = this.getThemesByLevel('secondary');
    const motifs = this.getThemesByLevel('motif');

    const primaryCoverage = this.calculateLevelCoverage(primaryThemes);
    const secondaryCoverage = this.calculateLevelCoverage(secondaryThemes);
    const motifsCoverage = this.calculateLevelCoverage(motifs);

    // Overall score weighted by importance
    const overallScore = Math.round(
      primaryCoverage * 0.5 +
      secondaryCoverage * 0.3 +
      motifsCoverage * 0.2
    );

    const recommendations = this.generateBalanceRecommendations();

    return {
      overallScore,
      primaryThemesCoverage: primaryCoverage,
      secondaryThemesCoverage: secondaryCoverage,
      motifsCoverage: motifsCoverage,
      recommendations,
    };
  }

  private calculateLevelCoverage(themes: Theme[]): number {
    if (themes.length === 0) return 100; // No themes = no issues

    const coverages = themes.map(t => {
      const analysis = this.analyzeThemeCoverage(t.id);
      return analysis ? analysis.coveragePercentage : 0;
    });

    return Math.round(coverages.reduce((a, b) => a + b, 0) / coverages.length);
  }

  private generateBalanceRecommendations(): BalanceRecommendation[] {
    const recommendations: BalanceRecommendation[] = [];

    for (const theme of this.getAllThemes()) {
      const coverage = this.analyzeThemeCoverage(theme.id);
      if (!coverage) continue;

      // Check for undercoverage
      const expectedCoverage = theme.level === 'primary' ? 60 :
                              theme.level === 'secondary' ? 40 : 20;

      if (coverage.coveragePercentage < expectedCoverage * 0.5) {
        recommendations.push({
          type: 'strengthen_theme',
          themeId: theme.id,
          themeName: theme.name,
          message: `"${theme.name}" appears in only ${Math.round(coverage.coveragePercentage)}% of scenes. Consider strengthening its presence.`,
          priority: theme.level === 'primary' ? 'high' : 'medium',
        });
      }

      // Check for significant gaps
      const significantGaps = coverage.gaps.filter(g => g.severity === 'significant');
      for (const gap of significantGaps) {
        recommendations.push({
          type: 'distribute_theme',
          themeId: theme.id,
          themeName: theme.name,
          sceneRange: { start: gap.startSceneIndex, end: gap.endSceneIndex },
          message: `"${theme.name}" is absent from scenes ${gap.startSceneIndex + 1}-${gap.endSceneIndex + 1}. Consider adding thematic elements.`,
          priority: theme.level === 'primary' ? 'high' : 'low',
        });
      }

      // Check for poor distribution
      if (coverage.distributionScore < 40 && coverage.totalOccurrences > 3) {
        recommendations.push({
          type: 'distribute_theme',
          themeId: theme.id,
          themeName: theme.name,
          message: `"${theme.name}" is unevenly distributed. Try spreading thematic elements more evenly.`,
          priority: 'medium',
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  // ===== PREMISE FULFILLMENT ANALYSIS =====

  analyzePremiseFulfillment(): PremiseFulfillment {
    const milestones = this.identifyMilestones();
    const componentScores = this.calculateComponentScores();
    const issues = this.identifyFulfillmentIssues(componentScores);

    const overallScore = Math.round(
      (componentScores.protagonistDevelopment +
       componentScores.goalPursuit +
       componentScores.motivationExploration +
       componentScores.stakesEscalation +
       componentScores.conflictResolution) / 5
    );

    return {
      overallScore,
      componentScores,
      milestones,
      issues,
    };
  }

  private identifyMilestones(): FulfillmentMilestone[] {
    const milestones: FulfillmentMilestone[] = [
      {
        id: 'protagonist_intro',
        name: 'Protagonist Introduction',
        description: 'Protagonist is introduced with clear characterization',
        achieved: this.scenes.length > 0,
      },
      {
        id: 'goal_established',
        name: 'Goal Established',
        description: 'Protagonist\'s goal is clearly presented',
        achieved: this.scenes.length > 1,
      },
      {
        id: 'stakes_revealed',
        name: 'Stakes Revealed',
        description: 'What the protagonist stands to lose is shown',
        achieved: this.scenes.length > 2,
      },
      {
        id: 'midpoint_escalation',
        name: 'Midpoint Escalation',
        description: 'Stakes are raised at the story midpoint',
        achieved: this.scenes.length > Math.floor(this.scenes.length / 2),
      },
      {
        id: 'climax_reached',
        name: 'Climax Reached',
        description: 'Story builds to climactic confrontation',
        achieved: this.scenes.length > Math.floor(this.scenes.length * 0.8),
      },
      {
        id: 'resolution_achieved',
        name: 'Resolution Achieved',
        description: 'Premise question is answered',
        achieved: this.scenes.length > Math.floor(this.scenes.length * 0.9),
      },
    ];

    return milestones;
  }

  private calculateComponentScores(): PremiseFulfillment['componentScores'] {
    // Base scores on scene count and theme coverage
    const sceneProgress = Math.min(100, this.scenes.length * 10);
    const themeCoverage = this.analyzeThematicBalance().overallScore;

    return {
      protagonistDevelopment: Math.round((sceneProgress + themeCoverage) / 2),
      goalPursuit: Math.round(sceneProgress * 0.8),
      motivationExploration: Math.round(themeCoverage * 0.9),
      stakesEscalation: Math.round((sceneProgress + themeCoverage) / 2 * 0.85),
      conflictResolution: this.scenes.length >= 10 ? 70 : Math.round(sceneProgress * 0.5),
    };
  }

  private identifyFulfillmentIssues(
    scores: PremiseFulfillment['componentScores']
  ): FulfillmentIssue[] {
    const issues: FulfillmentIssue[] = [];

    if (scores.protagonistDevelopment < 50) {
      issues.push({
        type: 'underdeveloped',
        component: 'protagonistDevelopment',
        message: 'Protagonist development needs more attention',
        suggestions: [
          'Add scenes showing character growth',
          'Include internal conflict moments',
          'Show how events change the protagonist',
        ],
      });
    }

    if (scores.goalPursuit < 50) {
      issues.push({
        type: 'missing',
        component: 'goalPursuit',
        message: 'Goal pursuit is unclear or underexplored',
        suggestions: [
          'Add obstacles that directly challenge the goal',
          'Show active pursuit of the objective',
          'Include setbacks and progress markers',
        ],
      });
    }

    if (scores.motivationExploration < 50) {
      issues.push({
        type: 'underdeveloped',
        component: 'motivationExploration',
        message: 'Character motivation needs deeper exploration',
        suggestions: [
          'Add backstory scenes explaining the why',
          'Show emotional stakes through action',
          'Create moments of doubt that reinforce motivation',
        ],
      });
    }

    if (scores.stakesEscalation < 50) {
      issues.push({
        type: 'underdeveloped',
        component: 'stakesEscalation',
        message: 'Stakes need to be raised throughout the story',
        suggestions: [
          'Increase consequences at key turning points',
          'Add ticking clock elements',
          'Make failures have lasting impact',
        ],
      });
    }

    if (scores.conflictResolution < 50 && this.scenes.length > 5) {
      issues.push({
        type: 'unresolved',
        component: 'conflictResolution',
        message: 'Story may lack satisfying resolution',
        suggestions: [
          'Plan climax that addresses central conflict',
          'Ensure protagonist agency in resolution',
          'Connect resolution to premise question',
        ],
      });
    }

    return issues;
  }

  // ===== EXPORT/IMPORT =====

  exportData(): {
    premise: StoryPremise | null;
    themes: Theme[];
    sceneTags: Array<{ sceneId: string; tags: SceneThemeTag[] }>;
  } {
    return {
      premise: this.premise,
      themes: this.getAllThemes(),
      sceneTags: Array.from(this.sceneTags.entries()).map(([sceneId, tags]) => ({
        sceneId,
        tags,
      })),
    };
  }

  importData(data: {
    premise?: StoryPremise | null;
    themes?: Theme[];
    sceneTags?: Array<{ sceneId: string; tags: SceneThemeTag[] }>;
  }): void {
    if (data.premise) {
      this.premise = data.premise;
    }

    if (data.themes) {
      this.themes.clear();
      for (const theme of data.themes) {
        this.themes.set(theme.id, theme);
      }
    }

    if (data.sceneTags) {
      this.sceneTags.clear();
      for (const { sceneId, tags } of data.sceneTags) {
        this.sceneTags.set(sceneId, tags);
      }
    }
  }
}

// Export singleton instance
export const themeTracker = new ThemeTracker();

export default ThemeTracker;
