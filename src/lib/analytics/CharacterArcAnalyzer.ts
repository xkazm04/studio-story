/**
 * CharacterArcAnalyzer
 *
 * Analyzes character development arcs across the story.
 * Tracks character "screen time", consistency, and relationship development.
 * Detects character inconsistencies and arc patterns.
 */

import type { Character } from '@/app/types/Character';
import type { Scene } from '@/app/types/Scene';
import type { Beat } from '@/app/types/Beat';

// ============================================================================
// Types
// ============================================================================

export type ArcType =
  | 'growth'       // Character improves/learns
  | 'fall'         // Character declines/corrupts
  | 'flat'         // Character stays the same (but affects others)
  | 'transformation' // Complete change of worldview
  | 'tragic'       // Rises then falls
  | 'redemption'   // Falls then rises
  | 'circular'     // Returns to starting point
  | 'undefined';   // Not enough data

export interface CharacterAppearance {
  sceneId: string;
  sceneName: string;
  beatId?: string;
  position: number;      // 0-1 normalized position in story
  role: 'protagonist' | 'supporting' | 'antagonist' | 'mentioned' | 'unknown';
  emotionalState?: string;
  actions?: string[];
  wordCount: number;
}

export interface CharacterScreenTime {
  characterId: string;
  characterName: string;
  appearances: CharacterAppearance[];
  totalScenes: number;
  percentageOfScenes: number;
  totalWordCount: number;
  averageWordsPerScene: number;
  firstAppearance: number;   // position 0-1
  lastAppearance: number;    // position 0-1
  presencePattern: 'continuous' | 'intermittent' | 'bookend' | 'front-loaded' | 'back-loaded';
}

export interface CharacterConsistencyIssue {
  characterId: string;
  characterName: string;
  type: 'trait-contradiction' | 'behavior-shift' | 'motivation-unclear' | 'relationship-inconsistent' | 'disappearance';
  severity: 'critical' | 'warning' | 'info';
  sceneId?: string;
  position?: number;
  message: string;
  suggestion: string;
}

export interface CharacterArc {
  characterId: string;
  characterName: string;
  arcType: ArcType;
  arcDescription: string;
  developmentScore: number;  // 0-100 how well developed the arc is
  keyMoments: { position: number; description: string; sceneId?: string }[];
  emotionalJourney: { position: number; state: string }[];
  recommendations: string[];
}

export interface RelationshipArc {
  character1Id: string;
  character2Id: string;
  character1Name: string;
  character2Name: string;
  interactionCount: number;
  relationshipProgression: { position: number; state: string }[];
  developmentScore: number;
  arcType: 'strengthening' | 'deteriorating' | 'static' | 'fluctuating' | 'transformative';
}

export interface CharacterAnalysisResult {
  screenTimeAnalysis: CharacterScreenTime[];
  arcs: CharacterArc[];
  consistencyIssues: CharacterConsistencyIssue[];
  relationshipArcs: RelationshipArc[];
  overallScore: number;
  castBalance: {
    score: number;
    dominantCharacter?: string;
    underusedCharacters: string[];
  };
  recommendations: string[];
}

// ============================================================================
// Arc Detection Patterns
// ============================================================================

const ARC_PATTERNS: Record<ArcType, {
  description: string;
  emotionalPattern: string[];
  keywords: string[];
}> = {
  growth: {
    description: 'Character learns, improves, and overcomes limitations',
    emotionalPattern: ['doubt', 'struggle', 'learning', 'confidence', 'mastery'],
    keywords: ['learn', 'grow', 'improve', 'overcome', 'realize', 'understand', 'change'],
  },
  fall: {
    description: 'Character declines morally or in capability',
    emotionalPattern: ['confidence', 'temptation', 'compromise', 'corruption', 'loss'],
    keywords: ['corrupt', 'fall', 'decline', 'lose', 'betray', 'abandon'],
  },
  flat: {
    description: 'Character remains steadfast and influences others',
    emotionalPattern: ['steadfast', 'consistent', 'unwavering'],
    keywords: ['steadfast', 'unwavering', 'consistent', 'true', 'anchored'],
  },
  transformation: {
    description: 'Character undergoes complete worldview change',
    emotionalPattern: ['belief', 'challenge', 'crisis', 'epiphany', 'new-identity'],
    keywords: ['transform', 'revelation', 'rebirth', 'new', 'realize', 'epiphany'],
  },
  tragic: {
    description: 'Character rises then falls due to fatal flaw',
    emotionalPattern: ['ambition', 'success', 'hubris', 'downfall', 'ruin'],
    keywords: ['hubris', 'pride', 'fall', 'flaw', 'downfall', 'tragic'],
  },
  redemption: {
    description: 'Character falls then rises through atonement',
    emotionalPattern: ['guilt', 'suffering', 'recognition', 'atonement', 'redemption'],
    keywords: ['redeem', 'atone', 'forgive', 'save', 'recover', 'restore'],
  },
  circular: {
    description: 'Character returns to starting point with new perspective',
    emotionalPattern: ['home', 'departure', 'journey', 'return', 'understanding'],
    keywords: ['return', 'home', 'beginning', 'circle', 'back'],
  },
  undefined: {
    description: 'Not enough information to determine arc',
    emotionalPattern: [],
    keywords: [],
  },
};

// ============================================================================
// CharacterArcAnalyzer Class
// ============================================================================

class CharacterArcAnalyzerClass {
  private static instance: CharacterArcAnalyzerClass;

  private constructor() {}

  static getInstance(): CharacterArcAnalyzerClass {
    if (!CharacterArcAnalyzerClass.instance) {
      CharacterArcAnalyzerClass.instance = new CharacterArcAnalyzerClass();
    }
    return CharacterArcAnalyzerClass.instance;
  }

  // ============================================================================
  // Main Analysis
  // ============================================================================

  /**
   * Analyze all characters in the story
   */
  analyzeCharacters(
    characters: Character[],
    scenes: Scene[],
    beats: Beat[]
  ): CharacterAnalysisResult {
    // Sort scenes by order
    const sortedScenes = this.sortScenes(scenes, beats);

    // Analyze screen time for each character
    const screenTimeAnalysis = characters.map(char =>
      this.analyzeScreenTime(char, sortedScenes, beats)
    );

    // Detect character arcs
    const arcs = characters.map(char =>
      this.detectArc(char, sortedScenes, beats)
    );

    // Find consistency issues
    const consistencyIssues = this.findConsistencyIssues(characters, sortedScenes, beats);

    // Analyze relationship arcs
    const relationshipArcs = this.analyzeRelationships(characters, sortedScenes, beats);

    // Analyze cast balance
    const castBalance = this.analyzeCastBalance(screenTimeAnalysis, scenes.length);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(arcs, consistencyIssues, castBalance);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      screenTimeAnalysis,
      arcs,
      consistencyIssues,
      castBalance
    );

    return {
      screenTimeAnalysis,
      arcs,
      consistencyIssues,
      relationshipArcs,
      overallScore,
      castBalance,
      recommendations,
    };
  }

  // ============================================================================
  // Screen Time Analysis
  // ============================================================================

  private analyzeScreenTime(
    character: Character,
    scenes: Scene[],
    beats: Beat[]
  ): CharacterScreenTime {
    const appearances: CharacterAppearance[] = [];
    let totalWordCount = 0;

    scenes.forEach((scene, index) => {
      const position = scenes.length > 1 ? index / (scenes.length - 1) : 0.5;
      const sceneContent = `${scene.content || ''} ${scene.description || ''}`.toLowerCase();
      const charName = character.name.toLowerCase();

      // Check if character appears in scene
      if (sceneContent.includes(charName)) {
        const wordCount = this.countCharacterWords(sceneContent, charName);
        totalWordCount += wordCount;

        // Find associated beat (via act relationship)
        const sceneBeat = beats.find(b => b.act_id === scene.act_id);

        appearances.push({
          sceneId: scene.id,
          sceneName: scene.name || `Scene ${index + 1}`,
          beatId: sceneBeat?.id,
          position,
          role: this.inferRole(character, sceneContent),
          wordCount,
        });
      }
    });

    const totalScenes = appearances.length;
    const percentageOfScenes = scenes.length > 0 ? (totalScenes / scenes.length) * 100 : 0;
    const averageWordsPerScene = totalScenes > 0 ? totalWordCount / totalScenes : 0;

    const positions = appearances.map(a => a.position);
    const firstAppearance = positions.length > 0 ? Math.min(...positions) : 0;
    const lastAppearance = positions.length > 0 ? Math.max(...positions) : 0;

    // Determine presence pattern
    const presencePattern = this.determinePresencePattern(appearances, scenes.length);

    return {
      characterId: character.id,
      characterName: character.name,
      appearances,
      totalScenes,
      percentageOfScenes,
      totalWordCount,
      averageWordsPerScene,
      firstAppearance,
      lastAppearance,
      presencePattern,
    };
  }

  private countCharacterWords(content: string, charName: string): number {
    // Simple heuristic: count words in sentences containing character name
    const sentences = content.split(/[.!?]+/);
    let count = 0;

    sentences.forEach(sentence => {
      if (sentence.toLowerCase().includes(charName)) {
        count += sentence.split(/\s+/).length;
      }
    });

    return count;
  }

  private inferRole(
    character: Character,
    sceneContent: string
  ): CharacterAppearance['role'] {
    // Use type if available (Character uses 'type' not 'archetype')
    if (character.type) {
      const typeLower = character.type.toLowerCase();
      if (typeLower.includes('hero') || typeLower.includes('protagonist')) return 'protagonist';
      if (typeLower.includes('villain') || typeLower.includes('antagonist')) return 'antagonist';
    }

    // Check scene content for role hints
    const charName = character.name.toLowerCase();
    const content = sceneContent.toLowerCase();

    // Simple keyword detection
    const protagonistKeywords = ['hero', 'save', 'protect', 'help'];
    const antagonistKeywords = ['villain', 'attack', 'threaten', 'oppose'];

    const charContext = this.getCharacterContext(content, charName);

    if (protagonistKeywords.some(kw => charContext.includes(kw))) return 'protagonist';
    if (antagonistKeywords.some(kw => charContext.includes(kw))) return 'antagonist';

    if (charContext.includes('said') || charContext.includes('replied')) return 'supporting';

    return 'unknown';
  }

  private getCharacterContext(content: string, charName: string): string {
    // Get ~50 characters around each mention of character
    const contexts: string[] = [];
    let pos = 0;

    while ((pos = content.indexOf(charName, pos)) !== -1) {
      const start = Math.max(0, pos - 50);
      const end = Math.min(content.length, pos + charName.length + 50);
      contexts.push(content.slice(start, end));
      pos += charName.length;
    }

    return contexts.join(' ');
  }

  private determinePresencePattern(
    appearances: CharacterAppearance[],
    totalScenes: number
  ): CharacterScreenTime['presencePattern'] {
    if (appearances.length === 0) return 'intermittent';
    if (appearances.length === totalScenes) return 'continuous';

    const positions = appearances.map(a => a.position);
    const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;

    // Check for bookend (appears at start and end but gaps in middle)
    const hasStart = positions.some(p => p < 0.2);
    const hasEnd = positions.some(p => p > 0.8);
    const hasMid = positions.some(p => p >= 0.2 && p <= 0.8);

    if (hasStart && hasEnd && !hasMid) return 'bookend';
    if (avgPosition < 0.4) return 'front-loaded';
    if (avgPosition > 0.6) return 'back-loaded';

    return 'intermittent';
  }

  // ============================================================================
  // Arc Detection
  // ============================================================================

  private detectArc(
    character: Character,
    scenes: Scene[],
    beats: Beat[]
  ): CharacterArc {
    const appearances = this.getCharacterAppearances(character, scenes, beats);
    const emotionalJourney = this.extractEmotionalJourney(character, appearances);
    const keyMoments = this.identifyKeyMoments(character, appearances);

    // Detect arc type
    const arcType = this.inferArcType(emotionalJourney, keyMoments);
    const arcPattern = ARC_PATTERNS[arcType];

    // Calculate development score
    const developmentScore = this.calculateDevelopmentScore(
      appearances.length,
      keyMoments.length,
      emotionalJourney.length
    );

    // Generate recommendations
    const recommendations = this.generateArcRecommendations(
      arcType,
      developmentScore,
      appearances.length
    );

    return {
      characterId: character.id,
      characterName: character.name,
      arcType,
      arcDescription: arcPattern.description,
      developmentScore,
      keyMoments,
      emotionalJourney,
      recommendations,
    };
  }

  private getCharacterAppearances(
    character: Character,
    scenes: Scene[],
    beats: Beat[]
  ): { scene: Scene; position: number; beat?: Beat }[] {
    const appearances: { scene: Scene; position: number; beat?: Beat }[] = [];
    const charName = character.name.toLowerCase();

    scenes.forEach((scene, index) => {
      const content = `${scene.content || ''} ${scene.description || ''}`.toLowerCase();
      if (content.includes(charName)) {
        const beat = beats.find(b => b.act_id === scene.act_id);
        appearances.push({
          scene,
          position: scenes.length > 1 ? index / (scenes.length - 1) : 0.5,
          beat,
        });
      }
    });

    return appearances;
  }

  private extractEmotionalJourney(
    character: Character,
    appearances: { scene: Scene; position: number; beat?: Beat }[]
  ): { position: number; state: string }[] {
    const journey: { position: number; state: string }[] = [];

    appearances.forEach(({ scene, position, beat }) => {
      // Try to infer emotional state from beat or scene
      let state = 'neutral';

      if (beat?.type === 'emotional') {
        state = 'emotional';
      } else {
        // Simple keyword detection
        const content = `${scene.content || ''} ${scene.description || ''}`.toLowerCase();
        const charContext = this.getCharacterContext(content, character.name.toLowerCase());

        if (charContext.match(/happy|joy|celebrate|smile|laugh/)) state = 'happy';
        else if (charContext.match(/sad|cry|grief|mourn|tear/)) state = 'sad';
        else if (charContext.match(/angry|rage|fury|frustrat/)) state = 'angry';
        else if (charContext.match(/fear|afraid|terrif|scare/)) state = 'afraid';
        else if (charContext.match(/confus|uncertain|doubt/)) state = 'uncertain';
        else if (charContext.match(/determin|resolv|commit/)) state = 'determined';
      }

      journey.push({ position, state });
    });

    return journey;
  }

  private identifyKeyMoments(
    character: Character,
    appearances: { scene: Scene; position: number; beat?: Beat }[]
  ): { position: number; description: string; sceneId?: string }[] {
    const keyMoments: { position: number; description: string; sceneId?: string }[] = [];

    appearances.forEach(({ scene, position, beat }) => {
      // Key moments are scenes with important beat types
      const isKeyBeat = beat && ['revelation', 'decision', 'payoff', 'emotional'].includes(beat.type || '');

      if (isKeyBeat) {
        keyMoments.push({
          position,
          description: beat?.name || scene.name || 'Key moment',
          sceneId: scene.id,
        });
      }
    });

    // Also check first and last appearances
    if (appearances.length > 0) {
      const first = appearances[0];
      if (!keyMoments.some(m => m.position === first.position)) {
        keyMoments.unshift({
          position: first.position,
          description: `First appearance: ${first.scene.name || 'Introduction'}`,
          sceneId: first.scene.id,
        });
      }
    }

    return keyMoments;
  }

  private inferArcType(
    emotionalJourney: { position: number; state: string }[],
    keyMoments: { position: number; description: string }[]
  ): ArcType {
    if (emotionalJourney.length < 2) return 'undefined';

    const states = emotionalJourney.map(e => e.state);
    const uniqueStates = new Set(states);

    // Check for flat arc (same emotional state throughout)
    if (uniqueStates.size <= 2) return 'flat';

    // Check for growth (ends more positive than starts)
    const positiveStates = ['happy', 'determined', 'confident', 'hopeful'];
    const negativeStates = ['sad', 'angry', 'afraid', 'uncertain', 'desperate'];

    const startState = states[0];
    const endState = states[states.length - 1];
    const midStates = states.slice(1, -1);

    const startsNegative = negativeStates.includes(startState);
    const endsPositive = positiveStates.includes(endState);
    const startsPositive = positiveStates.includes(startState);
    const endsNegative = negativeStates.includes(endState);

    // Check for redemption (negative -> negative -> positive)
    if (startsNegative && midStates.some(s => negativeStates.includes(s)) && endsPositive) {
      return 'redemption';
    }

    // Check for tragic (positive -> positive -> negative)
    if (startsPositive && midStates.some(s => positiveStates.includes(s)) && endsNegative) {
      return 'tragic';
    }

    // Check for growth (ends better than starts)
    if (endsPositive && !startsPositive) return 'growth';

    // Check for fall (ends worse than starts)
    if (endsNegative && !startsNegative) return 'fall';

    // Check for circular (similar start and end)
    if (startState === endState) return 'circular';

    // Check for transformation (complete change)
    if (uniqueStates.size >= 4) return 'transformation';

    return 'undefined';
  }

  private calculateDevelopmentScore(
    appearances: number,
    keyMoments: number,
    journeyPoints: number
  ): number {
    let score = 40; // Base score

    // Bonus for appearances
    if (appearances >= 3) score += 15;
    if (appearances >= 5) score += 10;
    if (appearances >= 10) score += 5;

    // Bonus for key moments
    score += Math.min(keyMoments * 5, 15);

    // Bonus for emotional variety
    score += Math.min(journeyPoints * 3, 15);

    return Math.min(100, score);
  }

  private generateArcRecommendations(
    arcType: ArcType,
    developmentScore: number,
    appearances: number
  ): string[] {
    const recommendations: string[] = [];

    if (arcType === 'undefined') {
      recommendations.push('Add more scenes with this character to develop their arc');
      recommendations.push('Include emotional moments that show character growth or change');
    }

    if (arcType === 'flat' && appearances > 3) {
      recommendations.push('Consider adding challenges that test this character\'s convictions');
    }

    if (developmentScore < 50) {
      recommendations.push('Add key moments (decisions, revelations) for this character');
    }

    if (appearances < 3) {
      recommendations.push('Character has limited screen time - consider expanding their role or making each appearance more impactful');
    }

    return recommendations;
  }

  // ============================================================================
  // Consistency Detection
  // ============================================================================

  private findConsistencyIssues(
    characters: Character[],
    scenes: Scene[],
    beats: Beat[]
  ): CharacterConsistencyIssue[] {
    const issues: CharacterConsistencyIssue[] = [];

    characters.forEach(character => {
      const appearances = this.getCharacterAppearances(character, scenes, beats);

      // Check for disappearance (character vanishes mid-story)
      if (appearances.length > 2) {
        const positions = appearances.map(a => a.position);
        const gaps = this.findLargeGaps(positions);

        gaps.forEach(gap => {
          if (gap.size > 0.3) {
            issues.push({
              characterId: character.id,
              characterName: character.name,
              type: 'disappearance',
              severity: gap.size > 0.5 ? 'warning' : 'info',
              position: gap.start,
              message: `${character.name} disappears for ${Math.round(gap.size * 100)}% of the story`,
              suggestion: 'Consider adding scenes or mentions to maintain character presence',
            });
          }
        });
      }

      // Check for abrupt behavior shifts
      const journey = this.extractEmotionalJourney(character, appearances);
      for (let i = 1; i < journey.length; i++) {
        const prev = journey[i - 1];
        const curr = journey[i];

        // If emotional state changes dramatically without a key moment
        const isAbrupt = this.isAbruptStateChange(prev.state, curr.state);
        if (isAbrupt && curr.position - prev.position < 0.1) {
          issues.push({
            characterId: character.id,
            characterName: character.name,
            type: 'behavior-shift',
            severity: 'info',
            position: curr.position,
            message: `${character.name} has abrupt emotional shift from ${prev.state} to ${curr.state}`,
            suggestion: 'Add transitional scenes to make the emotional change feel earned',
          });
        }
      }
    });

    return issues;
  }

  private findLargeGaps(positions: number[]): { start: number; end: number; size: number }[] {
    const sorted = [...positions].sort((a, b) => a - b);
    const gaps: { start: number; end: number; size: number }[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const size = sorted[i] - sorted[i - 1];
      if (size > 0.2) {
        gaps.push({ start: sorted[i - 1], end: sorted[i], size });
      }
    }

    return gaps;
  }

  private isAbruptStateChange(from: string, to: string): boolean {
    const positiveStates = ['happy', 'determined', 'confident', 'hopeful'];
    const negativeStates = ['sad', 'angry', 'afraid', 'desperate'];

    const fromPositive = positiveStates.includes(from);
    const fromNegative = negativeStates.includes(from);
    const toPositive = positiveStates.includes(to);
    const toNegative = negativeStates.includes(to);

    // Abrupt if jumping from very positive to very negative or vice versa
    return (fromPositive && toNegative) || (fromNegative && toPositive);
  }

  // ============================================================================
  // Relationship Analysis
  // ============================================================================

  private analyzeRelationships(
    characters: Character[],
    scenes: Scene[],
    beats: Beat[]
  ): RelationshipArc[] {
    const arcs: RelationshipArc[] = [];

    // Analyze pairs of characters
    for (let i = 0; i < characters.length; i++) {
      for (let j = i + 1; j < characters.length; j++) {
        const char1 = characters[i];
        const char2 = characters[j];

        const sharedScenes = this.findSharedScenes(char1, char2, scenes);
        if (sharedScenes.length >= 2) {
          const arc = this.analyzeRelationshipArc(char1, char2, sharedScenes, scenes.length);
          arcs.push(arc);
        }
      }
    }

    return arcs;
  }

  private findSharedScenes(
    char1: Character,
    char2: Character,
    scenes: Scene[]
  ): { scene: Scene; position: number }[] {
    const shared: { scene: Scene; position: number }[] = [];
    const name1 = char1.name.toLowerCase();
    const name2 = char2.name.toLowerCase();

    scenes.forEach((scene, index) => {
      const content = `${scene.content || ''} ${scene.description || ''}`.toLowerCase();
      if (content.includes(name1) && content.includes(name2)) {
        shared.push({
          scene,
          position: scenes.length > 1 ? index / (scenes.length - 1) : 0.5,
        });
      }
    });

    return shared;
  }

  private analyzeRelationshipArc(
    char1: Character,
    char2: Character,
    sharedScenes: { scene: Scene; position: number }[],
    totalScenes: number
  ): RelationshipArc {
    const progression: { position: number; state: string }[] = [];

    sharedScenes.forEach(({ scene, position }) => {
      const content = `${scene.content || ''} ${scene.description || ''}`.toLowerCase();

      // Simple relationship state detection
      let state = 'neutral';
      if (content.match(/love|together|kiss|embrace|partner/)) state = 'romantic';
      else if (content.match(/friend|ally|help|support|trust/)) state = 'allied';
      else if (content.match(/argue|fight|conflict|oppose|enemy/)) state = 'conflicted';
      else if (content.match(/betray|hate|rival|threaten/)) state = 'hostile';

      progression.push({ position, state });
    });

    // Determine arc type based on progression
    let arcType: RelationshipArc['arcType'] = 'static';
    if (progression.length >= 2) {
      const firstState = progression[0].state;
      const lastState = progression[progression.length - 1].state;

      const stateOrder = ['hostile', 'conflicted', 'neutral', 'allied', 'romantic'];
      const firstIndex = stateOrder.indexOf(firstState);
      const lastIndex = stateOrder.indexOf(lastState);

      if (lastIndex > firstIndex) arcType = 'strengthening';
      else if (lastIndex < firstIndex) arcType = 'deteriorating';
      else if (progression.some(p => p.state !== firstState)) arcType = 'fluctuating';

      // Check for transformative (big change)
      if (Math.abs(lastIndex - firstIndex) >= 2) arcType = 'transformative';
    }

    // Calculate development score
    const interactionDensity = sharedScenes.length / totalScenes;
    const developmentScore = Math.min(100, Math.round(
      30 + interactionDensity * 40 + progression.length * 10
    ));

    return {
      character1Id: char1.id,
      character2Id: char2.id,
      character1Name: char1.name,
      character2Name: char2.name,
      interactionCount: sharedScenes.length,
      relationshipProgression: progression,
      developmentScore,
      arcType,
    };
  }

  // ============================================================================
  // Cast Balance Analysis
  // ============================================================================

  private analyzeCastBalance(
    screenTimeData: CharacterScreenTime[],
    totalScenes: number
  ): CharacterAnalysisResult['castBalance'] {
    if (screenTimeData.length === 0) {
      return { score: 100, underusedCharacters: [] };
    }

    const percentages = screenTimeData.map(st => st.percentageOfScenes);
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    const max = Math.max(...percentages);

    // Find dominant character
    const dominantCharacter = max > avg * 2
      ? screenTimeData.find(st => st.percentageOfScenes === max)?.characterName
      : undefined;

    // Find underused characters (less than 1/3 of average)
    const underusedCharacters = screenTimeData
      .filter(st => st.percentageOfScenes < avg / 3)
      .map(st => st.characterName);

    // Calculate balance score
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / percentages.length;
    const score = Math.max(0, 100 - Math.sqrt(variance) * 2);

    return {
      score: Math.round(score),
      dominantCharacter,
      underusedCharacters,
    };
  }

  // ============================================================================
  // Scoring & Recommendations
  // ============================================================================

  private calculateOverallScore(
    arcs: CharacterArc[],
    issues: CharacterConsistencyIssue[],
    castBalance: CharacterAnalysisResult['castBalance']
  ): number {
    let score = 70;

    // Arc development bonus
    const avgArcScore = arcs.length > 0
      ? arcs.reduce((sum, a) => sum + a.developmentScore, 0) / arcs.length
      : 50;
    score += (avgArcScore - 50) * 0.3;

    // Issue penalties
    issues.forEach(issue => {
      if (issue.severity === 'critical') score -= 15;
      if (issue.severity === 'warning') score -= 8;
      if (issue.severity === 'info') score -= 3;
    });

    // Cast balance factor
    score += (castBalance.score - 50) * 0.2;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateRecommendations(
    screenTime: CharacterScreenTime[],
    arcs: CharacterArc[],
    issues: CharacterConsistencyIssue[],
    castBalance: CharacterAnalysisResult['castBalance']
  ): string[] {
    const recommendations: string[] = [];

    // Add arc recommendations
    arcs.forEach(arc => {
      if (arc.developmentScore < 50) {
        recommendations.push(`Develop ${arc.characterName}'s arc with more key moments and emotional variety`);
      }
    });

    // Add issue-based recommendations
    issues.forEach(issue => {
      if (issue.severity !== 'info') {
        recommendations.push(issue.suggestion);
      }
    });

    // Add balance recommendations
    if (castBalance.dominantCharacter) {
      recommendations.push(`${castBalance.dominantCharacter} dominates screen time - consider balancing with other characters`);
    }
    if (castBalance.underusedCharacters.length > 0) {
      recommendations.push(`Consider expanding roles for underused characters: ${castBalance.underusedCharacters.join(', ')}`);
    }

    return [...new Set(recommendations)].slice(0, 6);
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private sortScenes(scenes: Scene[], beats: Beat[]): Scene[] {
    // Sort by act/beat order if available, otherwise by creation
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

  getArcTypes(): { id: ArcType; name: string; description: string }[] {
    return Object.entries(ARC_PATTERNS).map(([id, pattern]) => ({
      id: id as ArcType,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      description: pattern.description,
    }));
  }
}

// ============================================================================
// Export
// ============================================================================

export const characterArcAnalyzer = CharacterArcAnalyzerClass.getInstance();

export { CharacterArcAnalyzerClass, ARC_PATTERNS };

export default characterArcAnalyzer;
