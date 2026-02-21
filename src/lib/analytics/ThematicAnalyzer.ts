/**
 * ThematicAnalyzer
 *
 * Extracts and tracks themes throughout the story.
 * Visualizes theme presence across the narrative.
 * Identifies thematic inconsistencies and abandoned threads.
 */

import type { Scene } from '@/app/types/Scene';
import type { Beat } from '@/app/types/Beat';

// ============================================================================
// Types
// ============================================================================

export type ThemeCategory =
  | 'universal'    // Love, death, coming-of-age, etc.
  | 'social'       // Power, class, justice, etc.
  | 'personal'     // Identity, growth, redemption, etc.
  | 'philosophical'; // Good vs evil, fate vs free will, etc.

export interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  keywords: string[];
  relatedThemes: string[];
  description: string;
}

export interface ThemePresence {
  themeId: string;
  themeName: string;
  category: ThemeCategory;
  occurrences: { position: number; sceneId: string; strength: number }[];
  totalOccurrences: number;
  presencePercentage: number; // % of story where theme appears
  averageStrength: number;    // 0-100
  trajectory: 'increasing' | 'decreasing' | 'steady' | 'fluctuating';
  firstAppearance: number;
  lastAppearance: number;
}

export interface ThematicThread {
  themeId: string;
  themeName: string;
  isComplete: boolean;       // Does it resolve?
  isAbandoned: boolean;      // Does it disappear without resolution?
  peakPosition: number;      // Where is it strongest?
  setupPosition: number;     // Where is it introduced?
  payoffPosition?: number;   // Where is it resolved?
  gapPositions: { start: number; end: number }[]; // Where does it disappear?
}

export interface ThematicIssue {
  type: 'abandoned' | 'introduced-late' | 'weak' | 'inconsistent' | 'competing' | 'unresolved';
  severity: 'critical' | 'warning' | 'info';
  themeId?: string;
  themeName?: string;
  position?: number;
  message: string;
  suggestion: string;
}

export interface ThematicAnalysisResult {
  detectedThemes: ThemePresence[];
  primaryTheme?: ThemePresence;
  secondaryThemes: ThemePresence[];
  threads: ThematicThread[];
  issues: ThematicIssue[];
  thematicScore: number;     // 0-100
  coherenceScore: number;    // How well themes work together
  developmentScore: number;  // How well themes are developed
  presenceMap: { position: number; themes: { id: string; strength: number }[] }[];
  recommendations: string[];
}

// ============================================================================
// Theme Library
// ============================================================================

const THEME_LIBRARY: Theme[] = [
  // Universal Themes
  {
    id: 'love',
    name: 'Love',
    category: 'universal',
    keywords: ['love', 'heart', 'romance', 'beloved', 'passion', 'affection', 'devotion', 'adore'],
    relatedThemes: ['sacrifice', 'loss', 'family'],
    description: 'The transformative and compelling nature of love',
  },
  {
    id: 'death',
    name: 'Death & Mortality',
    category: 'universal',
    keywords: ['death', 'dying', 'mortal', 'grave', 'end', 'loss', 'grief', 'funeral', 'eternal'],
    relatedThemes: ['loss', 'legacy', 'time'],
    description: 'Confronting mortality and its meaning',
  },
  {
    id: 'coming-of-age',
    name: 'Coming of Age',
    category: 'universal',
    keywords: ['grow', 'youth', 'innocent', 'mature', 'child', 'adult', 'learn', 'experience'],
    relatedThemes: ['identity', 'knowledge', 'change'],
    description: 'The journey from innocence to experience',
  },
  {
    id: 'loss',
    name: 'Loss & Grief',
    category: 'universal',
    keywords: ['loss', 'grief', 'mourn', 'gone', 'missing', 'empty', 'alone', 'sorrow'],
    relatedThemes: ['death', 'change', 'memory'],
    description: 'Processing loss and finding meaning after',
  },
  {
    id: 'hope',
    name: 'Hope',
    category: 'universal',
    keywords: ['hope', 'dream', 'future', 'believe', 'faith', 'possible', 'wish', 'aspire'],
    relatedThemes: ['perseverance', 'change', 'courage'],
    description: 'The power of hope to sustain and motivate',
  },
  {
    id: 'fear',
    name: 'Fear',
    category: 'universal',
    keywords: ['fear', 'afraid', 'terror', 'dread', 'anxiety', 'phobia', 'panic', 'horror'],
    relatedThemes: ['courage', 'survival', 'unknown'],
    description: 'Confronting fears and what they reveal',
  },

  // Social Themes
  {
    id: 'power',
    name: 'Power & Corruption',
    category: 'social',
    keywords: ['power', 'control', 'rule', 'corrupt', 'authority', 'dominate', 'oppress', 'tyrant'],
    relatedThemes: ['justice', 'freedom', 'responsibility'],
    description: 'The nature and corruption of power',
  },
  {
    id: 'justice',
    name: 'Justice',
    category: 'social',
    keywords: ['justice', 'fair', 'right', 'wrong', 'law', 'crime', 'punish', 'innocent', 'guilty'],
    relatedThemes: ['power', 'revenge', 'truth'],
    description: 'The pursuit and nature of justice',
  },
  {
    id: 'class',
    name: 'Class & Society',
    category: 'social',
    keywords: ['class', 'rich', 'poor', 'status', 'society', 'hierarchy', 'privilege', 'wealth'],
    relatedThemes: ['power', 'freedom', 'identity'],
    description: 'Social stratification and its effects',
  },
  {
    id: 'freedom',
    name: 'Freedom',
    category: 'social',
    keywords: ['freedom', 'free', 'liberty', 'escape', 'cage', 'prison', 'chains', 'liberate'],
    relatedThemes: ['power', 'identity', 'choice'],
    description: 'The value and pursuit of freedom',
  },
  {
    id: 'belonging',
    name: 'Belonging',
    category: 'social',
    keywords: ['belong', 'outsider', 'community', 'accept', 'reject', 'home', 'family', 'tribe'],
    relatedThemes: ['identity', 'family', 'isolation'],
    description: 'The need to belong and find community',
  },
  {
    id: 'war',
    name: 'War & Conflict',
    category: 'social',
    keywords: ['war', 'battle', 'fight', 'enemy', 'soldier', 'violence', 'peace', 'conflict'],
    relatedThemes: ['power', 'sacrifice', 'survival'],
    description: 'The causes and consequences of conflict',
  },

  // Personal Themes
  {
    id: 'identity',
    name: 'Identity',
    category: 'personal',
    keywords: ['identity', 'who', 'self', 'true', 'mask', 'authentic', 'discover', 'become'],
    relatedThemes: ['coming-of-age', 'belonging', 'truth'],
    description: 'Discovering and defining who we are',
  },
  {
    id: 'redemption',
    name: 'Redemption',
    category: 'personal',
    keywords: ['redeem', 'forgive', 'atone', 'save', 'guilt', 'second chance', 'restore', 'heal'],
    relatedThemes: ['guilt', 'change', 'sacrifice'],
    description: 'The possibility of redemption and forgiveness',
  },
  {
    id: 'sacrifice',
    name: 'Sacrifice',
    category: 'personal',
    keywords: ['sacrifice', 'give up', 'cost', 'price', 'selfless', 'martyr', 'trade', 'surrender'],
    relatedThemes: ['love', 'duty', 'courage'],
    description: 'What we give up for what we value',
  },
  {
    id: 'courage',
    name: 'Courage',
    category: 'personal',
    keywords: ['courage', 'brave', 'hero', 'face', 'stand', 'fearless', 'bold', 'dare'],
    relatedThemes: ['fear', 'sacrifice', 'change'],
    description: 'Finding courage in the face of fear',
  },
  {
    id: 'guilt',
    name: 'Guilt & Shame',
    category: 'personal',
    keywords: ['guilt', 'shame', 'regret', 'blame', 'fault', 'mistake', 'sorry', 'burden'],
    relatedThemes: ['redemption', 'truth', 'justice'],
    description: 'Carrying and confronting guilt',
  },
  {
    id: 'ambition',
    name: 'Ambition',
    category: 'personal',
    keywords: ['ambition', 'goal', 'success', 'achieve', 'drive', 'pursue', 'dream', 'aspire'],
    relatedThemes: ['power', 'sacrifice', 'identity'],
    description: 'The drive to achieve and its costs',
  },

  // Philosophical Themes
  {
    id: 'good-evil',
    name: 'Good vs Evil',
    category: 'philosophical',
    keywords: ['good', 'evil', 'moral', 'dark', 'light', 'virtue', 'sin', 'wicked', 'pure'],
    relatedThemes: ['justice', 'choice', 'redemption'],
    description: 'The nature and struggle of good and evil',
  },
  {
    id: 'fate-choice',
    name: 'Fate vs Free Will',
    category: 'philosophical',
    keywords: ['fate', 'destiny', 'choice', 'decide', 'predestined', 'chosen', 'prophecy', 'will'],
    relatedThemes: ['identity', 'courage', 'change'],
    description: 'Whether we control our destiny',
  },
  {
    id: 'truth',
    name: 'Truth & Deception',
    category: 'philosophical',
    keywords: ['truth', 'lie', 'deceive', 'honest', 'secret', 'reveal', 'hide', 'real', 'fake'],
    relatedThemes: ['identity', 'justice', 'trust'],
    description: 'The search for and value of truth',
  },
  {
    id: 'nature-nurture',
    name: 'Nature vs Nurture',
    category: 'philosophical',
    keywords: ['born', 'made', 'nature', 'nurture', 'inherit', 'teach', 'instinct', 'learned'],
    relatedThemes: ['identity', 'family', 'choice'],
    description: 'What shapes who we become',
  },
  {
    id: 'time',
    name: 'Time & Memory',
    category: 'philosophical',
    keywords: ['time', 'memory', 'past', 'future', 'remember', 'forget', 'moment', 'eternal'],
    relatedThemes: ['loss', 'change', 'legacy'],
    description: 'The passage of time and memory',
  },
  {
    id: 'knowledge',
    name: 'Knowledge & Ignorance',
    category: 'philosophical',
    keywords: ['know', 'learn', 'wisdom', 'ignorant', 'discover', 'understand', 'truth', 'secret'],
    relatedThemes: ['truth', 'power', 'change'],
    description: 'The pursuit and power of knowledge',
  },
];

// ============================================================================
// ThematicAnalyzer Class
// ============================================================================

class ThematicAnalyzerClass {
  private static instance: ThematicAnalyzerClass;
  private themeMap: Map<string, Theme>;

  private constructor() {
    this.themeMap = new Map(THEME_LIBRARY.map(t => [t.id, t]));
  }

  static getInstance(): ThematicAnalyzerClass {
    if (!ThematicAnalyzerClass.instance) {
      ThematicAnalyzerClass.instance = new ThematicAnalyzerClass();
    }
    return ThematicAnalyzerClass.instance;
  }

  // ============================================================================
  // Main Analysis
  // ============================================================================

  /**
   * Analyze themes throughout the story
   */
  analyzeThemes(
    scenes: Scene[],
    beats: Beat[]
  ): ThematicAnalysisResult {
    // Sort scenes
    const sortedScenes = this.sortScenes(scenes, beats);

    // Detect theme presence throughout story
    const detectedThemes = this.detectThemes(sortedScenes);

    // Identify primary and secondary themes
    const sortedByPresence = [...detectedThemes].sort((a, b) => b.presencePercentage - a.presencePercentage);
    const primaryTheme = sortedByPresence[0];
    const secondaryThemes = sortedByPresence.slice(1, 4);

    // Analyze thematic threads
    const threads = this.analyzeThreads(detectedThemes);

    // Find issues
    const issues = this.findThematicIssues(detectedThemes, threads);

    // Calculate scores
    const coherenceScore = this.calculateCoherence(detectedThemes);
    const developmentScore = this.calculateDevelopment(threads);
    const thematicScore = Math.round((coherenceScore + developmentScore) / 2);

    // Build presence map for visualization
    const presenceMap = this.buildPresenceMap(sortedScenes, detectedThemes);

    // Generate recommendations
    const recommendations = this.generateRecommendations(detectedThemes, threads, issues);

    return {
      detectedThemes,
      primaryTheme,
      secondaryThemes,
      threads,
      issues,
      thematicScore,
      coherenceScore,
      developmentScore,
      presenceMap,
      recommendations,
    };
  }

  // ============================================================================
  // Theme Detection
  // ============================================================================

  private detectThemes(scenes: Scene[]): ThemePresence[] {
    const presences: Map<string, ThemePresence> = new Map();

    scenes.forEach((scene, index) => {
      const position = scenes.length > 1 ? index / (scenes.length - 1) : 0.5;
      const content = `${scene.content || ''} ${scene.description || ''}`.toLowerCase();

      // Check each theme
      THEME_LIBRARY.forEach(theme => {
        const strength = this.calculateThemeStrength(content, theme);

        if (strength > 0) {
          if (!presences.has(theme.id)) {
            presences.set(theme.id, {
              themeId: theme.id,
              themeName: theme.name,
              category: theme.category,
              occurrences: [],
              totalOccurrences: 0,
              presencePercentage: 0,
              averageStrength: 0,
              trajectory: 'steady',
              firstAppearance: position,
              lastAppearance: position,
            });
          }

          const presence = presences.get(theme.id)!;
          presence.occurrences.push({ position, sceneId: scene.id, strength });
          presence.totalOccurrences++;
          presence.lastAppearance = position;
        }
      });
    });

    // Calculate final metrics
    presences.forEach(presence => {
      presence.presencePercentage = (presence.occurrences.length / scenes.length) * 100;
      presence.averageStrength = presence.occurrences.length > 0
        ? presence.occurrences.reduce((sum, o) => sum + o.strength, 0) / presence.occurrences.length
        : 0;
      presence.trajectory = this.calculateTrajectory(presence.occurrences);
    });

    return Array.from(presences.values())
      .filter(p => p.totalOccurrences >= 2) // Only themes that appear multiple times
      .sort((a, b) => b.presencePercentage - a.presencePercentage);
  }

  private calculateThemeStrength(content: string, theme: Theme): number {
    let matchCount = 0;
    let weightedScore = 0;

    theme.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        matchCount += matches.length;
        // Weight earlier keywords higher (they're more specific)
        const keywordIndex = theme.keywords.indexOf(keyword);
        const weight = 1 - (keywordIndex / theme.keywords.length) * 0.5;
        weightedScore += matches.length * weight;
      }
    });

    if (matchCount === 0) return 0;

    // Normalize to 0-100
    const normalizedScore = Math.min(100, weightedScore * 15);
    return Math.round(normalizedScore);
  }

  private calculateTrajectory(
    occurrences: { position: number; strength: number }[]
  ): ThemePresence['trajectory'] {
    if (occurrences.length < 3) return 'steady';

    const firstHalf = occurrences.filter(o => o.position < 0.5);
    const secondHalf = occurrences.filter(o => o.position >= 0.5);

    if (firstHalf.length === 0 || secondHalf.length === 0) return 'steady';

    const firstAvg = firstHalf.reduce((sum, o) => sum + o.strength, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, o) => sum + o.strength, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;

    if (diff > 15) return 'increasing';
    if (diff < -15) return 'decreasing';

    // Check for fluctuation
    let directionChanges = 0;
    for (let i = 2; i < occurrences.length; i++) {
      const prev = occurrences[i - 1].strength - occurrences[i - 2].strength;
      const curr = occurrences[i].strength - occurrences[i - 1].strength;
      if (prev * curr < 0) directionChanges++;
    }

    if (directionChanges >= occurrences.length / 3) return 'fluctuating';

    return 'steady';
  }

  // ============================================================================
  // Thread Analysis
  // ============================================================================

  private analyzeThreads(presences: ThemePresence[]): ThematicThread[] {
    return presences.map(presence => {
      const positions = presence.occurrences.map(o => o.position);

      // Find gaps in theme presence
      const gaps = this.findGaps(positions);

      // Determine if theme is abandoned (big gap at end)
      const isAbandoned = presence.lastAppearance < 0.7 &&
        gaps.some(g => g.end >= 0.9 && g.start <= 0.7);

      // Determine if theme resolves (strong presence at end)
      const lateOccurrences = presence.occurrences.filter(o => o.position > 0.8);
      const isComplete = lateOccurrences.length > 0 &&
        lateOccurrences.some(o => o.strength >= presence.averageStrength * 0.8);

      // Find peak
      const peakOccurrence = presence.occurrences.reduce(
        (max, o) => o.strength > max.strength ? o : max,
        presence.occurrences[0]
      );

      return {
        themeId: presence.themeId,
        themeName: presence.themeName,
        isComplete,
        isAbandoned,
        peakPosition: peakOccurrence?.position ?? 0.5,
        setupPosition: presence.firstAppearance,
        payoffPosition: isComplete ? presence.lastAppearance : undefined,
        gapPositions: gaps.filter(g => g.end - g.start > 0.2),
      };
    });
  }

  private findGaps(positions: number[]): { start: number; end: number }[] {
    if (positions.length < 2) return [];

    const sorted = [...positions].sort((a, b) => a - b);
    const gaps: { start: number; end: number }[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const gapSize = sorted[i] - sorted[i - 1];
      if (gapSize > 0.15) {
        gaps.push({ start: sorted[i - 1], end: sorted[i] });
      }
    }

    // Check for gap at the end
    if (sorted[sorted.length - 1] < 0.85) {
      gaps.push({ start: sorted[sorted.length - 1], end: 1.0 });
    }

    return gaps;
  }

  // ============================================================================
  // Issue Detection
  // ============================================================================

  private findThematicIssues(
    presences: ThemePresence[],
    threads: ThematicThread[]
  ): ThematicIssue[] {
    const issues: ThematicIssue[] = [];

    threads.forEach(thread => {
      // Check for abandoned themes
      if (thread.isAbandoned) {
        issues.push({
          type: 'abandoned',
          severity: 'warning',
          themeId: thread.themeId,
          themeName: thread.themeName,
          position: thread.gapPositions[0]?.start,
          message: `Theme "${thread.themeName}" is abandoned - disappears after ${Math.round(thread.gapPositions[0]?.start * 100)}% without resolution`,
          suggestion: 'Either resolve this theme or remove earlier references to avoid loose threads',
        });
      }

      // Check for late introduction
      if (thread.setupPosition > 0.5) {
        issues.push({
          type: 'introduced-late',
          severity: 'info',
          themeId: thread.themeId,
          themeName: thread.themeName,
          position: thread.setupPosition,
          message: `Theme "${thread.themeName}" is introduced late in the story`,
          suggestion: 'Consider foreshadowing this theme earlier, or evaluate if it\'s necessary',
        });
      }

      // Check for unresolved themes
      if (!thread.isComplete && !thread.isAbandoned && presences.find(p => p.themeId === thread.themeId)!.presencePercentage > 20) {
        issues.push({
          type: 'unresolved',
          severity: 'warning',
          themeId: thread.themeId,
          themeName: thread.themeName,
          message: `Theme "${thread.themeName}" appears prominently but may not resolve clearly`,
          suggestion: 'Add a scene near the end that addresses or resolves this theme',
        });
      }
    });

    // Check for weak themes (low strength throughout)
    presences.forEach(presence => {
      if (presence.averageStrength < 30 && presence.presencePercentage > 20) {
        issues.push({
          type: 'weak',
          severity: 'info',
          themeId: presence.themeId,
          themeName: presence.themeName,
          message: `Theme "${presence.themeName}" is present but not strongly developed`,
          suggestion: 'Strengthen this theme with more explicit scenes or dialogue about it',
        });
      }
    });

    // Check for competing themes (too many strong themes)
    const strongThemes = presences.filter(p => p.presencePercentage > 30);
    if (strongThemes.length > 4) {
      issues.push({
        type: 'competing',
        severity: 'warning',
        message: `Story has ${strongThemes.length} prominent themes - may dilute focus`,
        suggestion: 'Consider focusing on 2-3 primary themes for stronger impact',
      });
    }

    return issues;
  }

  // ============================================================================
  // Scoring
  // ============================================================================

  private calculateCoherence(presences: ThemePresence[]): number {
    if (presences.length === 0) return 50;

    let score = 70;

    // Check if themes are related
    const themeIds = presences.slice(0, 3).map(p => p.themeId);
    let relatedCount = 0;

    themeIds.forEach(id => {
      const theme = this.themeMap.get(id);
      if (theme) {
        themeIds.forEach(otherId => {
          if (otherId !== id && theme.relatedThemes.includes(otherId)) {
            relatedCount++;
          }
        });
      }
    });

    score += relatedCount * 5; // Bonus for related themes

    // Check for same-category themes
    const categories = presences.slice(0, 3).map(p => p.category);
    const uniqueCategories = new Set(categories).size;
    if (uniqueCategories === 1) score += 10;
    if (uniqueCategories === 2) score += 5;

    // Penalty for too many unrelated themes
    if (presences.length > 5 && relatedCount < 2) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateDevelopment(threads: ThematicThread[]): number {
    if (threads.length === 0) return 50;

    let score = 60;

    const completeThreads = threads.filter(t => t.isComplete).length;
    const abandonedThreads = threads.filter(t => t.isAbandoned).length;

    // Bonus for complete threads
    score += completeThreads * 10;

    // Penalty for abandoned threads
    score -= abandonedThreads * 15;

    // Bonus for good thread distribution (not all at same position)
    const peakPositions = threads.map(t => t.peakPosition);
    const positionVariance = this.calculateVariance(peakPositions);
    if (positionVariance > 0.05) score += 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  }

  // ============================================================================
  // Visualization Data
  // ============================================================================

  private buildPresenceMap(
    scenes: Scene[],
    presences: ThemePresence[]
  ): ThematicAnalysisResult['presenceMap'] {
    const topThemes = presences.slice(0, 5);

    return scenes.map((scene, index) => {
      const position = scenes.length > 1 ? index / (scenes.length - 1) : 0.5;

      const themes = topThemes
        .map(presence => {
          const occurrence = presence.occurrences.find(o => o.sceneId === scene.id);
          return occurrence
            ? { id: presence.themeId, strength: occurrence.strength }
            : null;
        })
        .filter((t): t is { id: string; strength: number } => t !== null);

      return { position, themes };
    });
  }

  // ============================================================================
  // Recommendations
  // ============================================================================

  private generateRecommendations(
    presences: ThemePresence[],
    threads: ThematicThread[],
    issues: ThematicIssue[]
  ): string[] {
    const recommendations: string[] = [];

    // Add issue-based recommendations
    issues
      .filter(i => i.severity !== 'info')
      .forEach(issue => recommendations.push(issue.suggestion));

    // Theme trajectory recommendations
    presences.slice(0, 3).forEach(presence => {
      if (presence.trajectory === 'decreasing') {
        recommendations.push(
          `Theme "${presence.themeName}" weakens through the story - consider building it toward the climax`
        );
      }
    });

    // Thread-based recommendations
    const threadsWithGaps = threads.filter(t => t.gapPositions.length > 0 && !t.isAbandoned);
    if (threadsWithGaps.length > 0) {
      recommendations.push(
        'Some themes have significant gaps - add scenes or references to maintain thematic continuity'
      );
    }

    // General recommendations
    if (presences.length < 2) {
      recommendations.push('Story may need stronger thematic content - consider what universal themes you want to explore');
    }

    return [...new Set(recommendations)].slice(0, 5);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private sortScenes(scenes: Scene[], beats: Beat[]): Scene[] {
    const actOrderMap = new Map<string, number>();
    beats.forEach(beat => {
      if (beat.act_id && beat.order !== undefined) {
        actOrderMap.set(beat.act_id, Math.min(actOrderMap.get(beat.act_id) ?? Infinity, beat.order));
      }
    });

    return [...scenes].sort((a, b) => {
      const orderA = (a.act_id ? actOrderMap.get(a.act_id) : undefined) ?? 0;
      const orderB = (b.act_id ? actOrderMap.get(b.act_id) : undefined) ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
  }

  // ============================================================================
  // Accessors
  // ============================================================================

  getThemeLibrary(): Theme[] {
    return [...THEME_LIBRARY];
  }

  getTheme(id: string): Theme | undefined {
    return this.themeMap.get(id);
  }

  getThemesByCategory(category: ThemeCategory): Theme[] {
    return THEME_LIBRARY.filter(t => t.category === category);
  }
}

// ============================================================================
// Export
// ============================================================================

export const thematicAnalyzer = ThematicAnalyzerClass.getInstance();

export { ThematicAnalyzerClass, THEME_LIBRARY };

export default thematicAnalyzer;
