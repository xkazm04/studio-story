/**
 * ShotSuggester - Scene Analysis Engine for Storyboard Creation
 *
 * Analyzes scene content to suggest optimal shot types, compositions,
 * and visual storytelling approaches based on narrative context.
 */

import type { Scene } from '@/app/types/Scene';
import type { Character } from '@/app/types/Character';

// ============================================================================
// Types
// ============================================================================

export type ShotType =
  | 'extreme-wide'
  | 'wide'
  | 'full'
  | 'medium-wide'
  | 'medium'
  | 'medium-close'
  | 'close-up'
  | 'extreme-close-up'
  | 'over-shoulder'
  | 'two-shot'
  | 'group-shot'
  | 'pov'
  | 'insert'
  | 'cutaway';

export type CameraAngle =
  | 'eye-level'
  | 'high-angle'
  | 'low-angle'
  | 'birds-eye'
  | 'worms-eye'
  | 'dutch-angle'
  | 'overhead';

export type CameraMovement =
  | 'static'
  | 'pan-left'
  | 'pan-right'
  | 'tilt-up'
  | 'tilt-down'
  | 'dolly-in'
  | 'dolly-out'
  | 'tracking'
  | 'crane-up'
  | 'crane-down'
  | 'handheld'
  | 'steadicam'
  | 'zoom-in'
  | 'zoom-out'
  | 'whip-pan'
  | 'rack-focus';

export type TransitionType =
  | 'cut'
  | 'dissolve'
  | 'fade-in'
  | 'fade-out'
  | 'wipe'
  | 'match-cut'
  | 'jump-cut'
  | 'smash-cut'
  | 'j-cut'
  | 'l-cut';

export type SceneMood =
  | 'tense'
  | 'romantic'
  | 'action'
  | 'dramatic'
  | 'comedic'
  | 'mysterious'
  | 'peaceful'
  | 'sad'
  | 'triumphant'
  | 'horrific'
  | 'neutral';

export type ActionType =
  | 'dialogue'
  | 'action'
  | 'reaction'
  | 'reveal'
  | 'establishing'
  | 'transition'
  | 'emotional-beat'
  | 'climax'
  | 'resolution';

export interface ShotSuggestion {
  id: string;
  shotNumber: number;
  shotType: ShotType;
  angle: CameraAngle;
  movement: CameraMovement;
  duration: number; // seconds
  subject: string;
  action: string;
  actionType: ActionType;
  composition: string;
  focusPoint: string;
  transition: TransitionType;
  rationale: string;
  mood: SceneMood;
  priority: 'essential' | 'recommended' | 'optional';
  alternativeShots?: AlternativeShot[];
}

export interface AlternativeShot {
  shotType: ShotType;
  angle: CameraAngle;
  rationale: string;
}

export interface SceneAnalysis {
  sceneId: string;
  sceneName: string;
  overallMood: SceneMood;
  keyMoments: KeyMoment[];
  suggestedShots: ShotSuggestion[];
  coverageScore: number; // 0-100
  pacing: 'slow' | 'moderate' | 'fast' | 'varied';
  estimatedDuration: number; // seconds
  characterFocus: string[];
  visualThemes: string[];
}

export interface KeyMoment {
  id: string;
  description: string;
  type: ActionType;
  importance: 'critical' | 'major' | 'minor';
  suggestedShotCount: number;
  characters: string[];
}

export interface ShotLibraryEntry {
  shotType: ShotType;
  name: string;
  description: string;
  bestUsedFor: string[];
  commonPairings: ShotType[];
  emotionalImpact: string;
  technicalNotes: string;
  examples: string[];
}

export interface SuggestOptions {
  maxShots?: number;
  pacing?: 'slow' | 'moderate' | 'fast';
  style?: 'cinematic' | 'documentary' | 'intimate' | 'epic';
  includeAlternatives?: boolean;
  focusCharacters?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const SHOT_LIBRARY: Record<ShotType, ShotLibraryEntry> = {
  'extreme-wide': {
    shotType: 'extreme-wide',
    name: 'Extreme Wide Shot',
    description: 'Shows the full environment with characters as small figures',
    bestUsedFor: ['establishing location', 'epic moments', 'isolation', 'scale'],
    commonPairings: ['wide', 'medium'],
    emotionalImpact: 'Creates sense of scale, isolation, or epic grandeur',
    technicalNotes: 'Often used as opening shot or to show journey',
    examples: ['Lord of the Rings landscapes', 'Lawrence of Arabia desert'],
  },
  'wide': {
    shotType: 'wide',
    name: 'Wide Shot',
    description: 'Shows full subject in their environment',
    bestUsedFor: ['establishing scenes', 'action sequences', 'group dynamics'],
    commonPairings: ['medium', 'close-up'],
    emotionalImpact: 'Provides context and spatial awareness',
    technicalNotes: 'Standard establishing shot size',
    examples: ['Western showdowns', 'dance sequences'],
  },
  'full': {
    shotType: 'full',
    name: 'Full Shot',
    description: 'Shows complete figure from head to toe',
    bestUsedFor: ['character introduction', 'body language', 'costume reveal'],
    commonPairings: ['medium', 'medium-wide'],
    emotionalImpact: 'Lets audience take in full character presence',
    technicalNotes: 'Keep some headroom and legroom',
    examples: ['Fashion reveals', 'character entrances'],
  },
  'medium-wide': {
    shotType: 'medium-wide',
    name: 'Medium Wide Shot',
    description: 'Shows subject from knees up',
    bestUsedFor: ['walking and talking', 'casual interactions', 'transitions'],
    commonPairings: ['wide', 'medium'],
    emotionalImpact: 'Balanced view of character and environment',
    technicalNotes: 'Good for showing gestures and movement',
    examples: ['Walk and talk scenes', 'casual dialogue'],
  },
  'medium': {
    shotType: 'medium',
    name: 'Medium Shot',
    description: 'Shows subject from waist up',
    bestUsedFor: ['dialogue', 'natural conversation', 'everyday interaction'],
    commonPairings: ['close-up', 'over-shoulder'],
    emotionalImpact: 'Natural, comfortable viewing distance',
    technicalNotes: 'Most common shot type in narrative film',
    examples: ['News anchors', 'interview style'],
  },
  'medium-close': {
    shotType: 'medium-close',
    name: 'Medium Close-Up',
    description: 'Shows subject from chest up',
    bestUsedFor: ['emotional dialogue', 'important conversation', 'reaction'],
    commonPairings: ['close-up', 'medium'],
    emotionalImpact: 'Increased intimacy while maintaining context',
    technicalNotes: 'Good for subtle performance details',
    examples: ['Dramatic dialogue scenes', 'emotional reveals'],
  },
  'close-up': {
    shotType: 'close-up',
    name: 'Close-Up',
    description: 'Shows face or specific detail',
    bestUsedFor: ['emotional moments', 'important details', 'reactions'],
    commonPairings: ['medium', 'extreme-close-up'],
    emotionalImpact: 'Creates strong emotional connection',
    technicalNotes: 'Use sparingly for maximum impact',
    examples: ['Emotional reactions', 'dramatic moments'],
  },
  'extreme-close-up': {
    shotType: 'extreme-close-up',
    name: 'Extreme Close-Up',
    description: 'Shows small detail - eyes, hands, object',
    bestUsedFor: ['critical details', 'intense emotion', 'suspense'],
    commonPairings: ['close-up', 'wide'],
    emotionalImpact: 'Maximum intensity and focus',
    technicalNotes: 'Very powerful, use with purpose',
    examples: ['Eye detail in westerns', 'clock ticking'],
  },
  'over-shoulder': {
    shotType: 'over-shoulder',
    name: 'Over-the-Shoulder',
    description: 'Shows subject over shoulder of another character',
    bestUsedFor: ['dialogue scenes', 'confrontation', 'connection'],
    commonPairings: ['medium', 'close-up'],
    emotionalImpact: 'Creates sense of relationship between characters',
    technicalNotes: 'Standard dialogue coverage setup',
    examples: ['Conversation scenes', 'interview setups'],
  },
  'two-shot': {
    shotType: 'two-shot',
    name: 'Two Shot',
    description: 'Shows two characters in frame together',
    bestUsedFor: ['relationship dynamics', 'shared moments', 'confrontation'],
    commonPairings: ['close-up', 'over-shoulder'],
    emotionalImpact: 'Shows characters relationship visually',
    technicalNotes: 'Balance composition between characters',
    examples: ['Romantic scenes', 'buddy moments'],
  },
  'group-shot': {
    shotType: 'group-shot',
    name: 'Group Shot',
    description: 'Shows multiple characters together',
    bestUsedFor: ['ensemble scenes', 'meetings', 'reactions'],
    commonPairings: ['medium', 'close-up'],
    emotionalImpact: 'Shows group dynamics and unity/division',
    technicalNotes: 'Careful blocking needed for clarity',
    examples: ['Team assembles', 'family dinner'],
  },
  'pov': {
    shotType: 'pov',
    name: 'Point of View',
    description: 'Shows what character sees from their perspective',
    bestUsedFor: ['subjective experience', 'discovery', 'horror'],
    commonPairings: ['close-up', 'medium'],
    emotionalImpact: 'Puts audience in character shoes',
    technicalNotes: 'Needs setup shot to establish whose POV',
    examples: ['Horror reveals', 'discovery moments'],
  },
  'insert': {
    shotType: 'insert',
    name: 'Insert Shot',
    description: 'Close shot of object or detail relevant to scene',
    bestUsedFor: ['important props', 'clues', 'emphasis'],
    commonPairings: ['medium', 'close-up'],
    emotionalImpact: 'Draws attention to specific detail',
    technicalNotes: 'Should be motivated by scene action',
    examples: ['Letter reading', 'phone screen'],
  },
  'cutaway': {
    shotType: 'cutaway',
    name: 'Cutaway',
    description: 'Shot away from main action to something related',
    bestUsedFor: ['reactions', 'passage of time', 'context'],
    commonPairings: ['medium', 'wide'],
    emotionalImpact: 'Provides context or reaction',
    technicalNotes: 'Useful for editing and pacing',
    examples: ['Reaction shots', 'establishing details'],
  },
};

const ACTION_TO_SHOT_MAP: Record<ActionType, ShotType[]> = {
  'dialogue': ['medium', 'medium-close', 'over-shoulder', 'two-shot'],
  'action': ['wide', 'medium-wide', 'medium'],
  'reaction': ['close-up', 'medium-close', 'cutaway'],
  'reveal': ['wide', 'close-up', 'pov'],
  'establishing': ['extreme-wide', 'wide'],
  'transition': ['wide', 'medium-wide', 'cutaway'],
  'emotional-beat': ['close-up', 'extreme-close-up', 'medium-close'],
  'climax': ['close-up', 'wide', 'extreme-close-up'],
  'resolution': ['medium', 'wide', 'two-shot'],
};

const MOOD_TO_ANGLE_MAP: Record<SceneMood, CameraAngle[]> = {
  'tense': ['low-angle', 'dutch-angle', 'eye-level'],
  'romantic': ['eye-level', 'low-angle'],
  'action': ['low-angle', 'dutch-angle', 'eye-level'],
  'dramatic': ['low-angle', 'high-angle', 'eye-level'],
  'comedic': ['eye-level', 'high-angle'],
  'mysterious': ['dutch-angle', 'low-angle', 'high-angle'],
  'peaceful': ['eye-level', 'high-angle'],
  'sad': ['high-angle', 'eye-level'],
  'triumphant': ['low-angle', 'worms-eye'],
  'horrific': ['dutch-angle', 'low-angle', 'worms-eye'],
  'neutral': ['eye-level'],
};

const MOOD_KEYWORDS: Record<SceneMood, string[]> = {
  'tense': ['danger', 'threat', 'suspense', 'anxious', 'nervous', 'waiting', 'ticking'],
  'romantic': ['love', 'kiss', 'embrace', 'tender', 'intimate', 'together', 'heart'],
  'action': ['fight', 'chase', 'run', 'battle', 'explosion', 'crash', 'fast'],
  'dramatic': ['confront', 'reveal', 'shock', 'betray', 'truth', 'discover', 'realize'],
  'comedic': ['laugh', 'joke', 'funny', 'awkward', 'stumble', 'mishap', 'silly'],
  'mysterious': ['shadow', 'secret', 'hidden', 'unknown', 'strange', 'dark', 'clue'],
  'peaceful': ['calm', 'quiet', 'serene', 'gentle', 'rest', 'morning', 'sunset'],
  'sad': ['cry', 'loss', 'grief', 'mourn', 'alone', 'goodbye', 'miss'],
  'triumphant': ['victory', 'win', 'success', 'celebrate', 'overcome', 'achieve'],
  'horrific': ['horror', 'terror', 'scream', 'monster', 'blood', 'death', 'nightmare'],
  'neutral': [],
};

// ============================================================================
// ShotSuggester Class
// ============================================================================

export class ShotSuggester {
  private static instance: ShotSuggester;
  private analysisCache: Map<string, SceneAnalysis> = new Map();

  private constructor() {}

  static getInstance(): ShotSuggester {
    if (!ShotSuggester.instance) {
      ShotSuggester.instance = new ShotSuggester();
    }
    return ShotSuggester.instance;
  }

  // -------------------------------------------------------------------------
  // Main Analysis Methods
  // -------------------------------------------------------------------------

  /**
   * Analyze a scene and generate shot suggestions
   */
  analyzeScene(
    scene: Scene,
    characters: Character[] = [],
    options: SuggestOptions = {}
  ): SceneAnalysis {
    const cacheKey = `${scene.id}_${JSON.stringify(options)}`;

    // Check cache first
    const cached = this.analysisCache.get(cacheKey);
    if (cached) return cached;

    const sceneText = this.extractSceneText(scene);
    const overallMood = this.detectMood(sceneText);
    const keyMoments = this.identifyKeyMoments(scene, characters);
    const suggestedShots = this.generateShotList(
      scene,
      keyMoments,
      overallMood,
      characters,
      options
    );

    const analysis: SceneAnalysis = {
      sceneId: scene.id,
      sceneName: scene.name,
      overallMood,
      keyMoments,
      suggestedShots,
      coverageScore: this.calculateCoverageScore(keyMoments, suggestedShots),
      pacing: this.determinePacing(suggestedShots),
      estimatedDuration: suggestedShots.reduce((sum, shot) => sum + shot.duration, 0),
      characterFocus: this.extractCharacterFocus(scene, characters),
      visualThemes: this.identifyVisualThemes(sceneText, overallMood),
    };

    this.analysisCache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Get suggestions for a specific moment in the scene
   */
  suggestForMoment(
    momentDescription: string,
    mood: SceneMood = 'neutral',
    characters: string[] = []
  ): ShotSuggestion[] {
    const actionType = this.inferActionType(momentDescription);
    const suggestions: ShotSuggestion[] = [];
    const shotTypes = ACTION_TO_SHOT_MAP[actionType] || ['medium'];

    shotTypes.slice(0, 3).forEach((shotType, index) => {
      suggestions.push(this.createShotSuggestion(
        index + 1,
        shotType,
        actionType,
        momentDescription,
        mood,
        characters[0] || 'subject',
        index === 0 ? 'essential' : 'recommended'
      ));
    });

    return suggestions;
  }

  /**
   * Get the shot library for reference
   */
  getShotLibrary(): ShotLibraryEntry[] {
    return Object.values(SHOT_LIBRARY);
  }

  /**
   * Get details about a specific shot type
   */
  getShotDetails(shotType: ShotType): ShotLibraryEntry | undefined {
    return SHOT_LIBRARY[shotType];
  }

  // -------------------------------------------------------------------------
  // Analysis Helpers
  // -------------------------------------------------------------------------

  private extractSceneText(scene: Scene): string {
    const parts = [
      scene.name,
      scene.description,
      scene.content,
      scene.script,
      scene.message,
    ].filter(Boolean);
    return parts.join(' ').toLowerCase();
  }

  private detectMood(text: string): SceneMood {
    const moodScores: Record<SceneMood, number> = {
      'tense': 0,
      'romantic': 0,
      'action': 0,
      'dramatic': 0,
      'comedic': 0,
      'mysterious': 0,
      'peaceful': 0,
      'sad': 0,
      'triumphant': 0,
      'horrific': 0,
      'neutral': 1, // Base score
    };

    const lowerText = text.toLowerCase();

    for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          moodScores[mood as SceneMood] += 1;
        }
      }
    }

    const entries = Object.entries(moodScores);
    const maxEntry = entries.reduce((max, current) =>
      current[1] > max[1] ? current : max
    );

    return maxEntry[0] as SceneMood;
  }

  private identifyKeyMoments(scene: Scene, characters: Character[]): KeyMoment[] {
    const moments: KeyMoment[] = [];
    const text = this.extractSceneText(scene);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

    // Always include an establishing moment
    moments.push({
      id: `moment_establishing_${scene.id}`,
      description: `Establish ${scene.location || scene.name}`,
      type: 'establishing',
      importance: 'major',
      suggestedShotCount: 1,
      characters: [],
    });

    // Analyze sentences for key moments
    sentences.forEach((sentence, index) => {
      const actionType = this.inferActionType(sentence);
      const importance = this.determineImportance(sentence, actionType);

      if (importance !== 'minor' || moments.length < 3) {
        const mentionedCharacters = characters
          .filter(c => sentence.toLowerCase().includes(c.name.toLowerCase()))
          .map(c => c.name);

        moments.push({
          id: `moment_${index}_${scene.id}`,
          description: sentence.trim().slice(0, 100),
          type: actionType,
          importance,
          suggestedShotCount: importance === 'critical' ? 3 : importance === 'major' ? 2 : 1,
          characters: mentionedCharacters,
        });
      }
    });

    return moments.slice(0, 10); // Limit to 10 key moments
  }

  private inferActionType(text: string): ActionType {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('said') || lowerText.includes('asked') || lowerText.includes('replied') || lowerText.includes('spoke')) {
      return 'dialogue';
    }
    if (lowerText.includes('fight') || lowerText.includes('run') || lowerText.includes('chase') || lowerText.includes('jump')) {
      return 'action';
    }
    if (lowerText.includes('reveal') || lowerText.includes('discover') || lowerText.includes('find')) {
      return 'reveal';
    }
    if (lowerText.includes('react') || lowerText.includes('stare') || lowerText.includes('gasp')) {
      return 'reaction';
    }
    if (lowerText.includes('cry') || lowerText.includes('smile') || lowerText.includes('embrace')) {
      return 'emotional-beat';
    }
    if (lowerText.includes('enter') || lowerText.includes('arrive') || lowerText.includes('setting')) {
      return 'establishing';
    }
    if (lowerText.includes('finally') || lowerText.includes('at last') || lowerText.includes('showdown')) {
      return 'climax';
    }
    if (lowerText.includes('peace') || lowerText.includes('resolved') || lowerText.includes('end')) {
      return 'resolution';
    }

    return 'dialogue'; // Default
  }

  private determineImportance(text: string, actionType: ActionType): 'critical' | 'major' | 'minor' {
    const criticalKeywords = ['finally', 'reveal', 'truth', 'betray', 'love', 'death', 'discover'];
    const majorKeywords = ['important', 'must', 'never', 'always', 'remember'];

    const lowerText = text.toLowerCase();

    if (actionType === 'climax' || actionType === 'reveal') return 'critical';
    if (criticalKeywords.some(k => lowerText.includes(k))) return 'critical';
    if (majorKeywords.some(k => lowerText.includes(k))) return 'major';
    if (actionType === 'establishing') return 'major';

    return 'minor';
  }

  private generateShotList(
    scene: Scene,
    keyMoments: KeyMoment[],
    mood: SceneMood,
    characters: Character[],
    options: SuggestOptions
  ): ShotSuggestion[] {
    const { maxShots = 12, pacing = 'moderate', includeAlternatives = true } = options;
    const shots: ShotSuggestion[] = [];
    let shotNumber = 1;

    for (const moment of keyMoments) {
      const shotsForMoment = this.generateShotsForMoment(
        moment,
        mood,
        characters,
        shotNumber,
        includeAlternatives
      );

      shots.push(...shotsForMoment);
      shotNumber += shotsForMoment.length;

      if (shots.length >= maxShots) break;
    }

    // Adjust durations based on pacing
    const pacingMultiplier = pacing === 'slow' ? 1.5 : pacing === 'fast' ? 0.7 : 1;
    shots.forEach(shot => {
      shot.duration = Math.round(shot.duration * pacingMultiplier);
    });

    return shots.slice(0, maxShots);
  }

  private generateShotsForMoment(
    moment: KeyMoment,
    mood: SceneMood,
    characters: Character[],
    startingNumber: number,
    includeAlternatives: boolean
  ): ShotSuggestion[] {
    const shots: ShotSuggestion[] = [];
    const shotTypes = ACTION_TO_SHOT_MAP[moment.type] || ['medium'];
    const angles = MOOD_TO_ANGLE_MAP[mood] || ['eye-level'];

    const numShots = Math.min(moment.suggestedShotCount, shotTypes.length);

    for (let i = 0; i < numShots; i++) {
      const subject = moment.characters[0] || 'subject';
      const shot = this.createShotSuggestion(
        startingNumber + i,
        shotTypes[i % shotTypes.length],
        moment.type,
        moment.description,
        mood,
        subject,
        i === 0 ? 'essential' : 'recommended'
      );

      shot.angle = angles[i % angles.length];

      if (includeAlternatives && i === 0) {
        shot.alternativeShots = shotTypes.slice(1, 3).map(altType => ({
          shotType: altType,
          angle: angles[1] || angles[0],
          rationale: SHOT_LIBRARY[altType]?.bestUsedFor[0] || 'Alternative option',
        }));
      }

      shots.push(shot);
    }

    return shots;
  }

  private createShotSuggestion(
    shotNumber: number,
    shotType: ShotType,
    actionType: ActionType,
    description: string,
    mood: SceneMood,
    subject: string,
    priority: 'essential' | 'recommended' | 'optional'
  ): ShotSuggestion {
    const shotInfo = SHOT_LIBRARY[shotType];
    const angles = MOOD_TO_ANGLE_MAP[mood];

    return {
      id: `shot_${shotNumber}_${Date.now()}`,
      shotNumber,
      shotType,
      angle: angles[0] || 'eye-level',
      movement: this.suggestMovement(actionType, shotType),
      duration: this.suggestDuration(shotType, actionType),
      subject,
      action: description.slice(0, 100),
      actionType,
      composition: this.suggestComposition(shotType),
      focusPoint: subject,
      transition: shotNumber === 1 ? 'fade-in' : 'cut',
      rationale: shotInfo?.emotionalImpact || 'Standard shot choice',
      mood,
      priority,
    };
  }

  private suggestMovement(actionType: ActionType, shotType: ShotType): CameraMovement {
    if (actionType === 'action') return 'tracking';
    if (actionType === 'reveal') return 'dolly-in';
    if (actionType === 'emotional-beat') return 'static';
    if (actionType === 'establishing') return 'pan-right';
    if (shotType === 'close-up') return 'static';
    if (shotType === 'wide') return 'static';
    return 'static';
  }

  private suggestDuration(shotType: ShotType, actionType: ActionType): number {
    const baseDuration: Record<ShotType, number> = {
      'extreme-wide': 5,
      'wide': 4,
      'full': 3,
      'medium-wide': 3,
      'medium': 4,
      'medium-close': 3,
      'close-up': 2,
      'extreme-close-up': 2,
      'over-shoulder': 3,
      'two-shot': 4,
      'group-shot': 4,
      'pov': 2,
      'insert': 2,
      'cutaway': 2,
    };

    const actionModifier: Record<ActionType, number> = {
      'dialogue': 1.2,
      'action': 0.7,
      'reaction': 0.8,
      'reveal': 1.0,
      'establishing': 1.3,
      'transition': 0.8,
      'emotional-beat': 1.5,
      'climax': 1.2,
      'resolution': 1.3,
    };

    const base = baseDuration[shotType] || 3;
    const modifier = actionModifier[actionType] || 1;
    return Math.round(base * modifier);
  }

  private suggestComposition(shotType: ShotType): string {
    const compositions: Record<ShotType, string> = {
      'extreme-wide': 'Center subject small in frame, emphasize environment',
      'wide': 'Rule of thirds, balance subject with environment',
      'full': 'Center subject, allow headroom and footroom',
      'medium-wide': 'Rule of thirds, subject slightly off-center',
      'medium': 'Rule of thirds, looking room in direction of gaze',
      'medium-close': 'Center or slight offset, minimal headroom',
      'close-up': 'Eyes in upper third, tight framing',
      'extreme-close-up': 'Fill frame with detail, precise focus',
      'over-shoulder': 'Foreground shoulder creates depth, subject in focus',
      'two-shot': 'Balance both characters, maintain eye lines',
      'group-shot': 'Layer characters at different depths',
      'pov': 'Subjective framing matching character height',
      'insert': 'Clear, well-lit detail shot',
      'cutaway': 'Contextual framing relevant to scene',
    };
    return compositions[shotType] || 'Standard composition';
  }

  private calculateCoverageScore(moments: KeyMoment[], shots: ShotSuggestion[]): number {
    if (moments.length === 0) return 100;

    const criticalCovered = moments
      .filter(m => m.importance === 'critical')
      .every(m => shots.some(s => s.action.includes(m.description.slice(0, 20))));

    const majorCovered = moments
      .filter(m => m.importance === 'major')
      .filter(m => shots.some(s => s.action.includes(m.description.slice(0, 20)))).length;

    const majorCount = moments.filter(m => m.importance === 'major').length;

    const baseScore = criticalCovered ? 60 : 30;
    const majorBonus = majorCount > 0 ? (majorCovered / majorCount) * 30 : 30;
    const varietyBonus = new Set(shots.map(s => s.shotType)).size >= 3 ? 10 : 5;

    return Math.min(100, Math.round(baseScore + majorBonus + varietyBonus));
  }

  private determinePacing(shots: ShotSuggestion[]): 'slow' | 'moderate' | 'fast' | 'varied' {
    if (shots.length === 0) return 'moderate';

    const avgDuration = shots.reduce((sum, s) => sum + s.duration, 0) / shots.length;
    const durations = shots.map(s => s.duration);
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / shots.length;

    if (variance > 2) return 'varied';
    if (avgDuration < 2.5) return 'fast';
    if (avgDuration > 4) return 'slow';
    return 'moderate';
  }

  private extractCharacterFocus(scene: Scene, characters: Character[]): string[] {
    const text = this.extractSceneText(scene);
    return characters
      .filter(c => text.includes(c.name.toLowerCase()))
      .map(c => c.name);
  }

  private identifyVisualThemes(text: string, mood: SceneMood): string[] {
    const themes: string[] = [];

    // Add mood-based theme
    const moodThemes: Record<SceneMood, string> = {
      'tense': 'High contrast, tight framing',
      'romantic': 'Soft lighting, warm tones',
      'action': 'Dynamic angles, fast cuts',
      'dramatic': 'Strong shadows, deliberate pacing',
      'comedic': 'Bright lighting, wide framing',
      'mysterious': 'Low key lighting, obscured details',
      'peaceful': 'Natural light, open spaces',
      'sad': 'Muted colors, isolated framing',
      'triumphant': 'Low angles, golden light',
      'horrific': 'Dutch angles, darkness',
      'neutral': 'Balanced lighting',
    };
    themes.push(moodThemes[mood]);

    // Detect environmental themes
    if (text.includes('night') || text.includes('dark')) themes.push('Low-key lighting');
    if (text.includes('day') || text.includes('sun')) themes.push('Natural lighting');
    if (text.includes('rain') || text.includes('storm')) themes.push('Atmospheric effects');
    if (text.includes('crowd') || text.includes('city')) themes.push('Urban environment');
    if (text.includes('nature') || text.includes('forest')) themes.push('Natural setting');

    return themes.slice(0, 5);
  }

  // -------------------------------------------------------------------------
  // Cache Management
  // -------------------------------------------------------------------------

  clearCache(): void {
    this.analysisCache.clear();
  }

  clearCacheForScene(sceneId: string): void {
    for (const key of this.analysisCache.keys()) {
      if (key.startsWith(sceneId)) {
        this.analysisCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const shotSuggester = ShotSuggester.getInstance();

// Export class for testing
export { ShotSuggester as ShotSuggesterClass };
