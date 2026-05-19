/**
 * CharacterThemeCarrierAnalyzer
 *
 * Bridges CharacterArcAnalyzer and ThematicAnalyzer to map which characters
 * carry which themes (Dramatica theory: every theme needs a character champion).
 * Cross-references scene-level presence data from both analyzers to produce
 * a correlation matrix, carrier assignments, and orphaned-theme warnings.
 */

import type { Character } from '@/app/types/Character';
import type { Scene } from '@/app/types/Scene';
import type { Beat } from '@/app/types/Beat';
import type { CharacterAnalysisResult, CharacterScreenTime } from './CharacterArcAnalyzer';
import type { ThematicAnalysisResult, ThemePresence } from './ThematicAnalyzer';
import type { AnalysisIssue } from './index';
import { sortScenes } from './utils';

// ============================================================================
// Types
// ============================================================================

export interface CharacterThemeCorrelation {
  characterId: string;
  characterName: string;
  themeId: string;
  themeName: string;
  coOccurrenceCount: number;
  correlationStrength: number; // 0-100
  arcAlignment: 'aligned' | 'opposed' | 'neutral';
}

export interface ThemeCarrier {
  themeId: string;
  themeName: string;
  primaryCarrier?: { characterId: string; characterName: string; strength: number };
  secondaryCarriers: { characterId: string; characterName: string; strength: number }[];
  isOrphaned: boolean;
}

export interface CharacterThematicProfile {
  characterId: string;
  characterName: string;
  carriedThemes: { themeId: string; themeName: string; strength: number }[];
  thematicWeight: number; // 0-100
  dominantTheme?: { themeId: string; themeName: string };
}

export interface CarrierIssue extends AnalysisIssue {
  type: 'orphaned-theme' | 'overloaded-carrier' | 'arc-theme-mismatch' | 'thematic-void';
  characterId?: string;
  themeId?: string;
}

export interface CarrierMapResult {
  matrix: CharacterThemeCorrelation[];
  carriers: ThemeCarrier[];
  profiles: CharacterThematicProfile[];
  orphanedThemes: ThemeCarrier[];
  issues: CarrierIssue[];
  insights: string[];
  carrierScore: number; // 0-100
}

// ============================================================================
// Arc–Theme alignment mapping
// ============================================================================

const ARC_THEME_AFFINITIES: Record<string, string[]> = {
  growth: ['coming-of-age', 'hope', 'courage', 'knowledge', 'identity'],
  fall: ['power', 'ambition', 'guilt', 'fear'],
  redemption: ['redemption', 'guilt', 'sacrifice', 'hope'],
  tragic: ['ambition', 'power', 'fate-choice', 'loss'],
  transformation: ['identity', 'truth', 'nature-nurture', 'change'],
  flat: ['justice', 'truth', 'courage'],
  circular: ['time', 'identity', 'belonging'],
};

// ============================================================================
// CharacterThemeCarrierAnalyzer Class
// ============================================================================

class CharacterThemeCarrierAnalyzerClass {
  /**
   * Analyze character-theme carrier relationships.
   * Accepts pre-computed results from both analyzers to avoid re-running them.
   */
  analyzeCarriers(
    characters: Character[],
    scenes: Scene[],
    beats: Beat[],
    characterResults: CharacterAnalysisResult,
    themeResults: ThematicAnalysisResult,
    options?: { preSorted?: boolean }
  ): CarrierMapResult {
    const sortedScenes = options?.preSorted ? scenes : sortScenes(scenes, beats);

    // Build scene-level presence maps for characters and themes
    const charSceneMap = this.buildCharacterSceneMap(characterResults.screenTimeAnalysis);
    const themeSceneMap = this.buildThemeSceneMap(themeResults.detectedThemes);

    // Compute correlation matrix
    const matrix = this.computeCorrelationMatrix(
      characterResults,
      themeResults,
      charSceneMap,
      themeSceneMap,
      sortedScenes.length
    );

    // Assign carriers per theme
    const carriers = this.assignCarriers(matrix, themeResults.detectedThemes);

    // Build per-character thematic profiles
    const profiles = this.buildProfiles(matrix, characterResults);

    // Identify orphaned themes
    const orphanedThemes = carriers.filter(c => c.isOrphaned);

    // Detect issues
    const issues = this.detectIssues(carriers, profiles, characterResults, themeResults);

    // Generate insights
    const insights = this.generateInsights(carriers, profiles, orphanedThemes, characterResults);

    // Overall score
    const carrierScore = this.calculateScore(carriers, profiles, issues);

    return {
      matrix,
      carriers,
      profiles,
      orphanedThemes,
      issues,
      insights,
      carrierScore,
    };
  }

  // ============================================================================
  // Scene-level presence maps
  // ============================================================================

  private buildCharacterSceneMap(
    screenTime: CharacterScreenTime[]
  ): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const st of screenTime) {
      map.set(st.characterId, new Set(st.appearances.map(a => a.sceneId)));
    }
    return map;
  }

  private buildThemeSceneMap(
    themes: ThemePresence[]
  ): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();
    for (const tp of themes) {
      map.set(tp.themeId, new Set(tp.occurrences.map(o => o.sceneId)));
    }
    return map;
  }

  // ============================================================================
  // Correlation matrix
  // ============================================================================

  private computeCorrelationMatrix(
    charResults: CharacterAnalysisResult,
    themeResults: ThematicAnalysisResult,
    charSceneMap: Map<string, Set<string>>,
    themeSceneMap: Map<string, Set<string>>,
    totalScenes: number
  ): CharacterThemeCorrelation[] {
    const correlations: CharacterThemeCorrelation[] = [];

    for (const st of charResults.screenTimeAnalysis) {
      const charScenes = charSceneMap.get(st.characterId);
      if (!charScenes || charScenes.size === 0) continue;

      for (const tp of themeResults.detectedThemes) {
        const themeScenes = themeSceneMap.get(tp.themeId);
        if (!themeScenes || themeScenes.size === 0) continue;

        // Count co-occurrences (scenes where both character and theme appear)
        let coCount = 0;
        for (const sceneId of charScenes) {
          if (themeScenes.has(sceneId)) coCount++;
        }

        if (coCount === 0) continue;

        // Correlation strength: Jaccard-inspired but weighted by theme strength in co-occurring scenes
        const unionSize = new Set([...charScenes, ...themeScenes]).size;
        const jaccardBase = coCount / unionSize;

        // Weight by how much of the theme's total presence overlaps with this character
        const themeOverlapRatio = coCount / themeScenes.size;

        // Combined strength (0-100)
        const correlationStrength = Math.round(
          Math.min(100, (jaccardBase * 40 + themeOverlapRatio * 60) * 100)
        );

        // Determine arc alignment
        const arc = charResults.arcs.find(a => a.characterId === st.characterId);
        const arcAlignment = this.determineArcAlignment(
          arc?.arcType ?? 'undefined',
          tp.themeId,
          tp.trajectory
        );

        correlations.push({
          characterId: st.characterId,
          characterName: st.characterName,
          themeId: tp.themeId,
          themeName: tp.themeName,
          coOccurrenceCount: coCount,
          correlationStrength,
          arcAlignment,
        });
      }
    }

    return correlations.sort((a, b) => b.correlationStrength - a.correlationStrength);
  }

  private determineArcAlignment(
    arcType: string,
    themeId: string,
    themeTrajectory: ThemePresence['trajectory']
  ): CharacterThemeCorrelation['arcAlignment'] {
    const affinities = ARC_THEME_AFFINITIES[arcType];
    if (!affinities) return 'neutral';

    if (affinities.includes(themeId)) {
      return 'aligned';
    }

    // Check for opposition: e.g. a 'growth' arc with a 'decreasing' hope theme
    const growthArcs = ['growth', 'redemption', 'transformation'];
    const declineArcs = ['fall', 'tragic'];

    if (growthArcs.includes(arcType) && themeTrajectory === 'decreasing') return 'opposed';
    if (declineArcs.includes(arcType) && themeTrajectory === 'increasing') return 'opposed';

    return 'neutral';
  }

  // ============================================================================
  // Carrier assignment
  // ============================================================================

  private assignCarriers(
    matrix: CharacterThemeCorrelation[],
    themes: ThemePresence[]
  ): ThemeCarrier[] {
    return themes.map(tp => {
      const themeCorrelations = matrix
        .filter(c => c.themeId === tp.themeId)
        .sort((a, b) => b.correlationStrength - a.correlationStrength);

      const primary = themeCorrelations[0];
      const secondaries = themeCorrelations.slice(1, 4);

      return {
        themeId: tp.themeId,
        themeName: tp.themeName,
        primaryCarrier: primary
          ? {
              characterId: primary.characterId,
              characterName: primary.characterName,
              strength: primary.correlationStrength,
            }
          : undefined,
        secondaryCarriers: secondaries.map(s => ({
          characterId: s.characterId,
          characterName: s.characterName,
          strength: s.correlationStrength,
        })),
        isOrphaned: !primary || primary.correlationStrength < 15,
      };
    });
  }

  // ============================================================================
  // Per-character profiles
  // ============================================================================

  private buildProfiles(
    matrix: CharacterThemeCorrelation[],
    charResults: CharacterAnalysisResult
  ): CharacterThematicProfile[] {
    return charResults.screenTimeAnalysis.map(st => {
      const charCorrelations = matrix
        .filter(c => c.characterId === st.characterId)
        .sort((a, b) => b.correlationStrength - a.correlationStrength);

      const carriedThemes = charCorrelations.map(c => ({
        themeId: c.themeId,
        themeName: c.themeName,
        strength: c.correlationStrength,
      }));

      // Thematic weight: average strength of top themes, scaled by count
      const topThemes = carriedThemes.slice(0, 3);
      const avgStrength = topThemes.length > 0
        ? topThemes.reduce((sum, t) => sum + t.strength, 0) / topThemes.length
        : 0;
      const countBonus = Math.min(20, carriedThemes.length * 5);
      const thematicWeight = Math.min(100, Math.round(avgStrength + countBonus));

      return {
        characterId: st.characterId,
        characterName: st.characterName,
        carriedThemes,
        thematicWeight,
        dominantTheme: carriedThemes[0]
          ? { themeId: carriedThemes[0].themeId, themeName: carriedThemes[0].themeName }
          : undefined,
      };
    });
  }

  // ============================================================================
  // Issue detection
  // ============================================================================

  private detectIssues(
    carriers: ThemeCarrier[],
    profiles: CharacterThematicProfile[],
    charResults: CharacterAnalysisResult,
    themeResults: ThematicAnalysisResult
  ): CarrierIssue[] {
    const issues: CarrierIssue[] = [];

    // Orphaned themes (no character champion)
    for (const carrier of carriers) {
      if (carrier.isOrphaned) {
        issues.push({
          type: 'orphaned-theme',
          severity: 'warning',
          themeId: carrier.themeId,
          message: `Theme "${carrier.themeName}" has no character champion — it appears in the story but isn't embodied by any character`,
          suggestion: `Assign a character to explicitly represent "${carrier.themeName}" through their actions, dialogue, or arc`,
        });
      }
    }

    // Overloaded carriers (one character carries too many themes)
    for (const profile of profiles) {
      const strongThemes = profile.carriedThemes.filter(t => t.strength >= 40);
      if (strongThemes.length >= 4) {
        issues.push({
          type: 'overloaded-carrier',
          severity: 'info',
          characterId: profile.characterId,
          message: `${profile.characterName} carries ${strongThemes.length} themes strongly — may dilute their thematic focus`,
          suggestion: `Consider redistributing some themes to other characters to sharpen ${profile.characterName}'s thematic identity`,
        });
      }
    }

    // Arc-theme mismatches
    for (const arc of charResults.arcs) {
      const profile = profiles.find(p => p.characterId === arc.characterId);
      if (!profile?.dominantTheme) continue;

      const affinities = ARC_THEME_AFFINITIES[arc.arcType];
      if (affinities && affinities.length > 0 && !affinities.includes(profile.dominantTheme.themeId)) {
        // Only flag if the arc is well-developed enough to matter
        if (arc.developmentScore >= 50) {
          issues.push({
            type: 'arc-theme-mismatch',
            severity: 'info',
            characterId: arc.characterId,
            themeId: profile.dominantTheme.themeId,
            message: `${arc.characterName}'s ${arc.arcType} arc doesn't naturally align with their dominant theme "${profile.dominantTheme.themeName}"`,
            suggestion: `Consider whether ${arc.characterName}'s arc could reinforce "${profile.dominantTheme.themeName}", or if a different theme fits their journey better`,
          });
        }
      }
    }

    // Characters with no thematic weight
    for (const profile of profiles) {
      const screenTime = charResults.screenTimeAnalysis.find(
        s => s.characterId === profile.characterId
      );
      if (screenTime && screenTime.percentageOfScenes >= 20 && profile.thematicWeight < 15) {
        issues.push({
          type: 'thematic-void',
          severity: 'warning',
          characterId: profile.characterId,
          message: `${profile.characterName} appears in ${screenTime.percentageOfScenes.toFixed(0)}% of scenes but carries almost no thematic weight`,
          suggestion: `Give ${profile.characterName} a clear thematic purpose — what idea or value do they represent?`,
        });
      }
    }

    return issues;
  }

  // ============================================================================
  // Insights
  // ============================================================================

  private generateInsights(
    carriers: ThemeCarrier[],
    profiles: CharacterThematicProfile[],
    orphanedThemes: ThemeCarrier[],
    charResults: CharacterAnalysisResult
  ): string[] {
    const insights: string[] = [];

    // Strongest character-theme pairing
    const allCarrierEntries = carriers
      .filter(c => c.primaryCarrier)
      .sort((a, b) => (b.primaryCarrier?.strength ?? 0) - (a.primaryCarrier?.strength ?? 0));

    if (allCarrierEntries[0]?.primaryCarrier) {
      const top = allCarrierEntries[0];
      insights.push(
        `${top.primaryCarrier!.characterName} is the strongest carrier of "${top.themeName}" (${top.primaryCarrier!.strength}% correlation)`
      );
    }

    // Characters with highest thematic weight
    const sortedProfiles = [...profiles].sort((a, b) => b.thematicWeight - a.thematicWeight);
    if (sortedProfiles[0] && sortedProfiles[0].thematicWeight > 30) {
      insights.push(
        `${sortedProfiles[0].characterName} has the highest thematic weight (${sortedProfiles[0].thematicWeight})`
      );
    }

    // Orphaned themes count
    if (orphanedThemes.length > 0) {
      insights.push(
        `${orphanedThemes.length} theme${orphanedThemes.length === 1 ? '' : 's'} lack${orphanedThemes.length === 1 ? 's' : ''} a character champion: ${orphanedThemes.map(t => t.themeName).join(', ')}`
      );
    }

    // Well-covered themes
    const wellCovered = carriers.filter(
      c => c.primaryCarrier && c.primaryCarrier.strength >= 50 && c.secondaryCarriers.length >= 1
    );
    if (wellCovered.length > 0) {
      insights.push(
        `${wellCovered.length} theme${wellCovered.length === 1 ? '' : 's'} ${wellCovered.length === 1 ? 'is' : 'are'} well-carried by multiple characters`
      );
    }

    // Characters with no thematic role
    const thematicVoids = profiles.filter(p => p.thematicWeight < 10);
    const significantVoids = thematicVoids.filter(p => {
      const st = charResults.screenTimeAnalysis.find(s => s.characterId === p.characterId);
      return st && st.percentageOfScenes >= 10;
    });
    if (significantVoids.length > 0) {
      insights.push(
        `${significantVoids.length} character${significantVoids.length === 1 ? '' : 's'} with notable screen time carry no thematic weight`
      );
    }

    return insights.slice(0, 5);
  }

  // ============================================================================
  // Scoring
  // ============================================================================

  private calculateScore(
    carriers: ThemeCarrier[],
    profiles: CharacterThematicProfile[],
    issues: CarrierIssue[]
  ): number {
    if (carriers.length === 0) return 50;

    let score = 60;

    // Bonus for themes with carriers
    const carriedCount = carriers.filter(c => !c.isOrphaned).length;
    const coverageRatio = carriedCount / carriers.length;
    score += coverageRatio * 20;

    // Bonus for profiles with thematic weight
    const weightedProfiles = profiles.filter(p => p.thematicWeight >= 20);
    if (weightedProfiles.length > 0) {
      score += Math.min(10, weightedProfiles.length * 3);
    }

    // Penalty for issues
    for (const issue of issues) {
      if (issue.severity === 'warning') score -= 5;
      if (issue.severity === 'info') score -= 2;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

// ============================================================================
// Export
// ============================================================================

export const characterThemeCarrierAnalyzer = new CharacterThemeCarrierAnalyzerClass();

export { CharacterThemeCarrierAnalyzerClass };

export default characterThemeCarrierAnalyzer;
