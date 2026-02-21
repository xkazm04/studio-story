/**
 * CinematographyAdvisor - Professional cinematography technique recommendations
 *
 * Provides guidance on camera techniques, composition rules, and visual storytelling
 * principles based on scene content and desired emotional impact.
 */

import type {
  ShotType,
  CameraAngle,
  CameraMovement,
  ActionType,
  ShotSuggestion,
  SceneAnalysis,
  SceneMood,
} from './ShotSuggester';

// ============================================================================
// Types
// ============================================================================

export type TechniqueCategory =
  | 'framing'
  | 'lighting'
  | 'movement'
  | 'composition'
  | 'lens-choice'
  | 'color'
  | 'pacing';

export type EmotionalGoal =
  | 'tension'
  | 'intimacy'
  | 'power'
  | 'vulnerability'
  | 'isolation'
  | 'connection'
  | 'chaos'
  | 'calm'
  | 'mystery'
  | 'revelation'
  | 'joy'
  | 'sorrow';

export interface CinematographyTechnique {
  id: string;
  name: string;
  category: TechniqueCategory;
  description: string;
  whenToUse: string[];
  whenToAvoid: string[];
  emotionalImpact: EmotionalGoal[];
  examples: {
    film: string;
    scene: string;
  }[];
  tips: string[];
}

export interface TechniqueRecommendation {
  technique: CinematographyTechnique;
  relevanceScore: number; // 0-100
  reason: string;
  application: string;
}

export interface CompositionRule {
  id: string;
  name: string;
  description: string;
  visualGuide: string;
  bestFor: ActionType[];
  implementation: string;
}

export interface StyleReference {
  id: string;
  name: string;
  director?: string;
  cinematographer?: string;
  characteristics: string[];
  techniques: string[];
  mood: EmotionalGoal[];
  examples: string[];
}

export interface CinematographyAdvice {
  forShot: ShotSuggestion;
  techniques: TechniqueRecommendation[];
  compositionRules: CompositionRule[];
  styleReferences: StyleReference[];
  tips: string[];
}

export interface SceneStyleGuide {
  sceneId: string;
  primaryMood: EmotionalGoal;
  secondaryMood?: EmotionalGoal;
  colorPalette: string[];
  lightingStyle: string;
  pacing: 'slow' | 'moderate' | 'fast' | 'varied';
  keyTechniques: CinematographyTechnique[];
  styleReferences: StyleReference[];
  overarchingNotes: string[];
}

// ============================================================================
// Cinematography Techniques Database
// ============================================================================

const TECHNIQUES: CinematographyTechnique[] = [
  // Framing Techniques
  {
    id: 'rule-of-thirds',
    name: 'Rule of Thirds',
    category: 'framing',
    description: 'Place subjects along intersecting lines of a 3x3 grid',
    whenToUse: ['dialogue scenes', 'character introduction', 'balanced compositions'],
    whenToAvoid: ['symmetrical subjects', 'centered power shots'],
    emotionalImpact: ['calm', 'connection'],
    examples: [
      { film: 'The Shawshank Redemption', scene: 'Andy and Red conversation scenes' },
      { film: 'Lost in Translation', scene: 'Hotel bar conversations' },
    ],
    tips: [
      'Place eyes on the upper horizontal line',
      'Leave "looking room" in the direction the subject faces',
      'Use negative space intentionally',
    ],
  },
  {
    id: 'symmetry',
    name: 'Symmetrical Framing',
    category: 'framing',
    description: 'Center subjects with balanced elements on both sides',
    whenToUse: ['power shots', 'establishing authority', 'formality', 'unsettling tone'],
    whenToAvoid: ['natural/casual moments', 'dynamic action'],
    emotionalImpact: ['power', 'tension', 'mystery'],
    examples: [
      { film: 'The Grand Budapest Hotel', scene: 'Nearly every frame' },
      { film: 'The Shining', scene: 'Hallway and hotel lobby shots' },
    ],
    tips: [
      'Use architectural elements to reinforce symmetry',
      'Break symmetry slightly for unease',
      'Perfect symmetry can feel artificial - use intentionally',
    ],
  },
  {
    id: 'negative-space',
    name: 'Negative Space',
    category: 'framing',
    description: 'Emphasize emptiness around the subject',
    whenToUse: ['isolation', 'loneliness', 'contemplation', 'minimalist aesthetic'],
    whenToAvoid: ['busy action', 'crowded group scenes'],
    emotionalImpact: ['isolation', 'vulnerability', 'calm', 'sorrow'],
    examples: [
      { film: 'Her', scene: 'Theodore walking through the city' },
      { film: 'Gravity', scene: 'Astronaut floating in space' },
    ],
    tips: [
      'Use negative space to show emotional distance',
      'Balance negative space with subject placement',
      'Can emphasize a character feeling small in the world',
    ],
  },
  {
    id: 'dutch-angle',
    name: 'Dutch Angle / Canted Frame',
    category: 'framing',
    description: 'Tilt the camera to create diagonal horizon line',
    whenToUse: ['disorientation', 'psychological unease', 'tension', 'madness'],
    whenToAvoid: ['normal conversations', 'calm scenes', 'overuse'],
    emotionalImpact: ['tension', 'chaos', 'mystery'],
    examples: [
      { film: 'The Third Man', scene: 'Chase sequences' },
      { film: 'Thor', scene: 'Asgard throne room scenes' },
    ],
    tips: [
      'Use sparingly for maximum effect',
      'Angle should be noticeable (15-45 degrees)',
      'Combine with movement for dynamic unease',
    ],
  },
  {
    id: 'leading-lines',
    name: 'Leading Lines',
    category: 'composition',
    description: 'Use lines in the environment to guide viewer attention',
    whenToUse: ['guiding focus', 'creating depth', 'journey shots'],
    whenToAvoid: ['intimate close-ups', 'abstract moments'],
    emotionalImpact: ['connection', 'revelation'],
    examples: [
      { film: 'The Road', scene: 'Characters walking down highways' },
      { film: 'Inception', scene: 'Corridor fight scene' },
    ],
    tips: [
      'Roads, corridors, and fences make natural leading lines',
      'Lines can converge on the subject',
      'Diagonal lines create more energy than horizontal',
    ],
  },
  // Movement Techniques
  {
    id: 'push-in',
    name: 'Push In / Dolly Forward',
    category: 'movement',
    description: 'Camera moves toward the subject',
    whenToUse: ['building intensity', 'realization moments', 'focusing attention'],
    whenToAvoid: ['neutral information delivery', 'wide establishing'],
    emotionalImpact: ['tension', 'intimacy', 'revelation'],
    examples: [
      { film: 'Jaws', scene: 'Brody on the beach realization' },
      { film: 'Goodfellas', scene: 'Restaurant confrontations' },
    ],
    tips: [
      'Slow push-in builds subtle tension',
      'Fast push-in creates urgency',
      'End on eyes for maximum impact',
    ],
  },
  {
    id: 'tracking-shot',
    name: 'Tracking Shot',
    category: 'movement',
    description: 'Camera follows subject movement in parallel',
    whenToUse: ['following action', 'walking conversations', 'immersive sequences'],
    whenToAvoid: ['static emotional moments', 'quick cuts needed'],
    emotionalImpact: ['connection', 'tension', 'mystery'],
    examples: [
      { film: 'Goodfellas', scene: 'Copa cabana single take' },
      { film: '1917', scene: 'Continuous battlefield tracking' },
    ],
    tips: [
      'Match subject speed for smooth following',
      'Leading the subject creates anticipation',
      'Trailing the subject creates mystery',
    ],
  },
  {
    id: 'handheld',
    name: 'Handheld Camera',
    category: 'movement',
    description: 'Camera operated without stabilization for organic movement',
    whenToUse: ['documentary feel', 'chaos', 'intimate realism', 'tension'],
    whenToAvoid: ['formal/elegant scenes', 'establishing beauty'],
    emotionalImpact: ['tension', 'chaos', 'intimacy', 'vulnerability'],
    examples: [
      { film: 'The Bourne Identity', scene: 'Action sequences' },
      { film: 'The Office', scene: 'Documentary-style interviews' },
    ],
    tips: [
      'Subtle shake adds realism without distraction',
      'More shake for more chaos',
      'Keep subject in frame despite movement',
    ],
  },
  {
    id: 'crane-shot',
    name: 'Crane / Jib Shot',
    category: 'movement',
    description: 'Camera moves vertically or in sweeping arcs',
    whenToUse: ['reveals', 'epic scale', 'transitions', 'endings'],
    whenToAvoid: ['intimate conversations', 'simple coverage'],
    emotionalImpact: ['power', 'revelation', 'isolation', 'joy'],
    examples: [
      { film: 'Gone with the Wind', scene: 'Pullback revealing wounded soldiers' },
      { film: 'The Dark Knight', scene: 'Joker hanging from vehicle' },
    ],
    tips: [
      'Rising crane often signifies hope or revelation',
      'Descending crane can show fate closing in',
      'Combine with other movements for complex shots',
    ],
  },
  // Lighting Techniques
  {
    id: 'chiaroscuro',
    name: 'Chiaroscuro Lighting',
    category: 'lighting',
    description: 'Strong contrast between light and dark areas',
    whenToUse: ['drama', 'mystery', 'moral ambiguity', 'film noir'],
    whenToAvoid: ['light comedy', 'bright happy scenes'],
    emotionalImpact: ['mystery', 'tension', 'power'],
    examples: [
      { film: 'The Godfather', scene: 'Don Corleone office scenes' },
      { film: 'Blade Runner', scene: 'Tyrell Corporation interiors' },
    ],
    tips: [
      'Shadow can obscure as much as light reveals',
      'Use to show duality in character',
      'Pool of light draws focus naturally',
    ],
  },
  {
    id: 'silhouette',
    name: 'Silhouette',
    category: 'lighting',
    description: 'Subject backlit to appear as dark shape against bright background',
    whenToUse: ['mystery', 'dramatic entrances', 'anonymity', 'artistic shots'],
    whenToAvoid: ['need to see expressions', 'detailed action'],
    emotionalImpact: ['mystery', 'power', 'isolation'],
    examples: [
      { film: 'E.T.', scene: 'Bike flying across moon' },
      { film: 'The Dark Knight', scene: 'Batman rooftop poses' },
    ],
    tips: [
      'Strong backlight essential',
      'Recognizable shapes work best',
      'Use for iconic hero moments',
    ],
  },
  {
    id: 'motivated-lighting',
    name: 'Motivated Lighting',
    category: 'lighting',
    description: 'Light appears to come from visible or logical sources',
    whenToUse: ['realism', 'natural scenes', 'grounded storytelling'],
    whenToAvoid: ['stylized/abstract moments', 'dream sequences'],
    emotionalImpact: ['calm', 'connection'],
    examples: [
      { film: 'Barry Lyndon', scene: 'Candlelit interiors' },
      { film: 'The Revenant', scene: 'Campfire scenes' },
    ],
    tips: [
      'Place practical lights in frame',
      'Match color temperature to source',
      'Window light is versatile and beautiful',
    ],
  },
  // Lens Techniques
  {
    id: 'shallow-dof',
    name: 'Shallow Depth of Field',
    category: 'lens-choice',
    description: 'Keep subject sharp while background is blurred',
    whenToUse: ['isolating subjects', 'intimate moments', 'focusing attention'],
    whenToAvoid: ['showing environment context', 'group dynamics'],
    emotionalImpact: ['intimacy', 'isolation', 'vulnerability'],
    examples: [
      { film: 'Portrait of a Lady on Fire', scene: 'Character close-ups' },
      { film: 'The Social Network', scene: 'Deposition scenes' },
    ],
    tips: [
      'Wider aperture = shallower depth',
      'Longer lens enhances background blur',
      'Keep eyes sharp in shallow DOF portraits',
    ],
  },
  {
    id: 'wide-angle-distortion',
    name: 'Wide Angle Distortion',
    category: 'lens-choice',
    description: 'Use wide lens close to subject for exaggerated perspective',
    whenToUse: ['unease', 'comedy', 'surreal moments', 'emphasis'],
    whenToAvoid: ['flattering portraits', 'serious drama'],
    emotionalImpact: ['chaos', 'tension', 'vulnerability'],
    examples: [
      { film: 'A Clockwork Orange', scene: "Alex's monologues" },
      { film: 'Fear and Loathing in Las Vegas', scene: 'Drug sequences' },
    ],
    tips: [
      'Closer = more distortion',
      'Center subject to minimize distortion',
      'Edge distortion can be used creatively',
    ],
  },
  // Pacing Techniques
  {
    id: 'long-take',
    name: 'Long Take / Oner',
    category: 'pacing',
    description: 'Extended shot without cuts',
    whenToUse: ['building tension', 'immersion', 'showcasing performance', 'realism'],
    whenToAvoid: ['quick pacing needed', 'multiple angles required'],
    emotionalImpact: ['tension', 'connection', 'calm'],
    examples: [
      { film: 'Children of Men', scene: 'Car ambush sequence' },
      { film: 'Birdman', scene: 'Entire film appears as one take' },
    ],
    tips: [
      'Requires careful choreography',
      'Creates real-time tension',
      'Audience feels present in the moment',
    ],
  },
  {
    id: 'montage',
    name: 'Montage Sequence',
    category: 'pacing',
    description: 'Rapid succession of images to compress time or build meaning',
    whenToUse: ['time passage', 'training sequences', 'parallel action', 'emotional climax'],
    whenToAvoid: ['single continuous moment', 'dialogue-heavy scenes'],
    emotionalImpact: ['tension', 'joy', 'revelation'],
    examples: [
      { film: 'Rocky', scene: 'Training montage' },
      { film: 'Up', scene: 'Married life sequence' },
    ],
    tips: [
      'Each shot should advance story',
      'Music often drives montage rhythm',
      'Match visual rhythm to emotional beat',
    ],
  },
];

// ============================================================================
// Composition Rules
// ============================================================================

const COMPOSITION_RULES: CompositionRule[] = [
  {
    id: 'thirds',
    name: 'Rule of Thirds',
    description: 'Divide frame into 3x3 grid, place subjects at intersections',
    visualGuide: '|--|--|--|\n|--|--|--|\n|--|--|--|',
    bestFor: ['dialogue', 'emotional-beat', 'establishing'],
    implementation: 'Position subject eyes or key elements at grid intersection points',
  },
  {
    id: 'golden-ratio',
    name: 'Golden Ratio',
    description: 'Use 1.618 ratio spiral for natural, pleasing composition',
    visualGuide: 'Spiral leading to focal point',
    bestFor: ['reveal', 'emotional-beat', 'establishing'],
    implementation: 'Place key element where spiral naturally draws the eye',
  },
  {
    id: 'triangle',
    name: 'Triangle Composition',
    description: 'Arrange three elements in triangular formation for stability',
    visualGuide: 'Three points forming pyramid or inverted triangle',
    bestFor: ['dialogue', 'action'],
    implementation: 'Position three subjects or elements at triangle vertices',
  },
  {
    id: 'frame-within-frame',
    name: 'Frame Within Frame',
    description: 'Use environmental elements to create secondary frame around subject',
    visualGuide: 'Doorways, windows, or arches surrounding subject',
    bestFor: ['establishing', 'reveal', 'transition'],
    implementation: 'Position subject within doorway, window, or architectural element',
  },
  {
    id: 'headroom',
    name: 'Proper Headroom',
    description: 'Appropriate space above subject head based on shot size',
    visualGuide: 'Less space for close-ups, more for wide shots',
    bestFor: ['dialogue', 'emotional-beat', 'reaction'],
    implementation: 'Match headroom to emotional intent - less space feels claustrophobic',
  },
  {
    id: 'looking-room',
    name: 'Looking Room / Lead Room',
    description: 'Leave space in the direction subject is looking or moving',
    visualGuide: 'Empty space ahead of subject gaze/movement',
    bestFor: ['dialogue', 'action', 'reaction'],
    implementation: 'Place subject on opposite side from their look/movement direction',
  },
];

// ============================================================================
// Style References
// ============================================================================

const STYLE_REFERENCES: StyleReference[] = [
  {
    id: 'spielberg',
    name: 'Spielberg Style',
    director: 'Steven Spielberg',
    cinematographer: 'Janusz Kaminski',
    characteristics: [
      'Lens flares',
      'Motivated lighting',
      'Faces in wonder',
      'Long takes with dolly moves',
    ],
    techniques: ['push-in', 'motivated-lighting', 'shallow-dof'],
    mood: ['joy', 'revelation', 'connection'],
    examples: ["Schindler's List", 'Saving Private Ryan', 'E.T.'],
  },
  {
    id: 'nolan',
    name: 'Nolan Style',
    director: 'Christopher Nolan',
    cinematographer: 'Hoyte van Hoytema',
    characteristics: [
      'IMAX scale',
      'Practical effects',
      'Time manipulation',
      'Minimal close-ups',
    ],
    techniques: ['crane-shot', 'tracking-shot', 'long-take'],
    mood: ['tension', 'mystery', 'power'],
    examples: ['Interstellar', 'Dunkirk', 'The Dark Knight'],
  },
  {
    id: 'fincher',
    name: 'Fincher Style',
    director: 'David Fincher',
    cinematographer: 'Jeff Cronenweth',
    characteristics: [
      'Desaturated colors',
      'Precise camera moves',
      'Low-key lighting',
      'Meticulous framing',
    ],
    techniques: ['symmetry', 'push-in', 'chiaroscuro'],
    mood: ['tension', 'mystery', 'isolation'],
    examples: ['Se7en', 'Fight Club', 'Gone Girl'],
  },
  {
    id: 'kubrick',
    name: 'Kubrick Style',
    director: 'Stanley Kubrick',
    cinematographer: 'John Alcott',
    characteristics: [
      'Perfect symmetry',
      'Long tracking shots',
      'Wide angle lenses',
      'Natural lighting',
    ],
    techniques: ['symmetry', 'tracking-shot', 'wide-angle-distortion'],
    mood: ['tension', 'power', 'isolation', 'mystery'],
    examples: ['The Shining', '2001: A Space Odyssey', 'A Clockwork Orange'],
  },
  {
    id: 'wong-kar-wai',
    name: 'Wong Kar-wai Style',
    director: 'Wong Kar-wai',
    cinematographer: 'Christopher Doyle',
    characteristics: [
      'Saturated colors',
      'Step printing',
      'Handheld intimacy',
      'Reflections and frames',
    ],
    techniques: ['handheld', 'shallow-dof'],
    mood: ['intimacy', 'sorrow', 'mystery', 'connection'],
    examples: ['In the Mood for Love', 'Chungking Express', '2046'],
  },
  {
    id: 'wes-anderson',
    name: 'Wes Anderson Style',
    director: 'Wes Anderson',
    cinematographer: 'Robert Yeoman',
    characteristics: [
      'Centered compositions',
      'Pastel color palettes',
      'Whip pans',
      'Flat staging',
    ],
    techniques: ['symmetry', 'montage'],
    mood: ['joy', 'calm', 'connection'],
    examples: ['The Grand Budapest Hotel', 'Moonrise Kingdom', 'The Royal Tenenbaums'],
  },
];

// ============================================================================
// CinematographyAdvisor Class
// ============================================================================

class CinematographyAdvisor {
  private static instance: CinematographyAdvisor;
  private styleGuides: Map<string, SceneStyleGuide> = new Map();

  private constructor() {}

  static getInstance(): CinematographyAdvisor {
    if (!CinematographyAdvisor.instance) {
      CinematographyAdvisor.instance = new CinematographyAdvisor();
    }
    return CinematographyAdvisor.instance;
  }

  // -------------------------------------------------------------------------
  // Technique Access
  // -------------------------------------------------------------------------

  getAllTechniques(): CinematographyTechnique[] {
    return [...TECHNIQUES];
  }

  getTechniquesByCategory(category: TechniqueCategory): CinematographyTechnique[] {
    return TECHNIQUES.filter((t) => t.category === category);
  }

  getTechnique(id: string): CinematographyTechnique | undefined {
    return TECHNIQUES.find((t) => t.id === id);
  }

  getCompositionRules(): CompositionRule[] {
    return [...COMPOSITION_RULES];
  }

  getStyleReferences(): StyleReference[] {
    return [...STYLE_REFERENCES];
  }

  getStyleReference(id: string): StyleReference | undefined {
    return STYLE_REFERENCES.find((s) => s.id === id);
  }

  // -------------------------------------------------------------------------
  // Recommendation Generation
  // -------------------------------------------------------------------------

  getAdviceForShot(shot: ShotSuggestion): CinematographyAdvice {
    const techniques = this.recommendTechniques(shot);
    const compositionRules = this.getRelevantCompositionRules(shot);
    const styleReferences = this.findRelevantStyles(shot);
    const tips = this.generateShotTips(shot);

    return {
      forShot: shot,
      techniques,
      compositionRules,
      styleReferences,
      tips,
    };
  }

  private recommendTechniques(shot: ShotSuggestion): TechniqueRecommendation[] {
    const recommendations: TechniqueRecommendation[] = [];

    for (const technique of TECHNIQUES) {
      const score = this.calculateTechniqueRelevance(technique, shot);
      if (score > 30) {
        recommendations.push({
          technique,
          relevanceScore: score,
          reason: this.generateTechniqueReason(technique, shot),
          application: this.generateTechniqueApplication(technique, shot),
        });
      }
    }

    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5);
  }

  private calculateTechniqueRelevance(
    technique: CinematographyTechnique,
    shot: ShotSuggestion
  ): number {
    let score = 50; // Base score

    // Match shot type to technique category
    const shotTypeCategoryMap: Record<string, TechniqueCategory[]> = {
      'close-up': ['framing', 'lighting', 'lens-choice'],
      'extreme-close-up': ['framing', 'lighting', 'lens-choice'],
      wide: ['composition', 'lighting', 'movement'],
      'extreme-wide': ['composition', 'lighting', 'movement'],
      medium: ['framing', 'composition', 'movement'],
      pov: ['movement', 'lens-choice'],
      'over-shoulder': ['framing', 'composition'],
    };

    const relevantCategories = shotTypeCategoryMap[shot.shotType] || ['framing', 'composition'];
    if (relevantCategories.includes(technique.category)) {
      score += 20;
    }

    // Match movement
    if (shot.movement !== 'static' && technique.category === 'movement') {
      score += 15;
    }

    // Match angle
    if (shot.angle === 'dutch-angle' && technique.id === 'dutch-angle') {
      score += 30;
    }

    // Priority bonus
    if (shot.priority === 'essential') {
      score += 10;
    }

    return Math.min(100, score);
  }

  private generateTechniqueReason(
    technique: CinematographyTechnique,
    shot: ShotSuggestion
  ): string {
    const reasons: string[] = [];

    if (technique.whenToUse.length > 0) {
      reasons.push(`Ideal for ${technique.whenToUse[0]}`);
    }

    if (technique.emotionalImpact.length > 0) {
      reasons.push(`Creates ${technique.emotionalImpact[0]} feeling`);
    }

    return reasons.join('. ') || 'Standard cinematography technique';
  }

  private generateTechniqueApplication(
    technique: CinematographyTechnique,
    shot: ShotSuggestion
  ): string {
    const applications: Record<string, string> = {
      'rule-of-thirds': `Position subject at intersection point in this ${shot.shotType}`,
      symmetry: 'Center the composition with balanced elements on each side',
      'push-in': 'Start wider and slowly move camera toward subject',
      handheld: 'Use subtle organic movement to increase tension',
      chiaroscuro: 'Light subject strongly from one side, leaving other in shadow',
      'shallow-dof': 'Use wide aperture to blur background and isolate subject',
    };

    return applications[technique.id] || `Apply ${technique.name} to enhance this shot`;
  }

  private getRelevantCompositionRules(shot: ShotSuggestion): CompositionRule[] {
    // For close-ups, headroom and looking room are most relevant
    if (['close-up', 'extreme-close-up', 'medium-close'].includes(shot.shotType)) {
      return COMPOSITION_RULES.filter((r) =>
        ['headroom', 'looking-room', 'thirds'].includes(r.id)
      );
    }

    // For wide shots, frame within frame and leading lines
    if (['wide', 'extreme-wide'].includes(shot.shotType)) {
      return COMPOSITION_RULES.filter((r) =>
        ['frame-within-frame', 'golden-ratio', 'thirds'].includes(r.id)
      );
    }

    // Default to basic rules
    return COMPOSITION_RULES.filter((r) =>
      ['thirds', 'looking-room', 'headroom'].includes(r.id)
    );
  }

  private findRelevantStyles(shot: ShotSuggestion): StyleReference[] {
    const relevantStyles: StyleReference[] = [];

    for (const style of STYLE_REFERENCES) {
      let relevance = 0;

      // Check if shot movement matches style techniques
      if (shot.movement !== 'static') {
        const movementTechniques = ['tracking-shot', 'push-in', 'crane-shot', 'handheld'];
        if (style.techniques.some((t) => movementTechniques.includes(t))) {
          relevance += 1;
        }
      }

      // Check priority for dramatic styles
      if (shot.priority === 'essential') {
        if (style.mood.includes('tension') || style.mood.includes('revelation')) {
          relevance += 1;
        }
      }

      if (relevance > 0) {
        relevantStyles.push(style);
      }
    }

    // Return top 2 most relevant or default styles
    return relevantStyles.length > 0
      ? relevantStyles.slice(0, 2)
      : STYLE_REFERENCES.slice(0, 2);
  }

  private generateShotTips(shot: ShotSuggestion): string[] {
    const tips: string[] = [];

    // Shot type specific tips
    const shotTips: Record<string, string[]> = {
      'close-up': [
        'Keep eyes on the upper third line',
        'Watch for distracting background elements',
        'Use shallow depth of field to isolate subject',
      ],
      'extreme-close-up': [
        'Focus precisely - depth of field is very shallow',
        'Every detail matters at this scale',
        'Use for maximum emotional impact',
      ],
      wide: [
        'Ensure the frame establishes location clearly',
        'Use foreground elements to create depth',
        'Consider time of day for best lighting',
      ],
      'over-shoulder': [
        'Keep shoulder in soft focus',
        'Position speaker at comfortable conversation distance',
        'Match eye line between shots',
      ],
      pov: [
        'Match camera height to character eye level',
        'Include subtle camera shake for realism',
        'Cut to reaction shot after POV',
      ],
    };

    tips.push(...(shotTips[shot.shotType] || []));

    // Movement specific tips
    if (shot.movement === 'handheld') {
      tips.push('Keep movement subtle unless chaos is intended');
    }
    if (shot.movement === 'dolly-in' || shot.movement === 'tracking') {
      tips.push('Ensure smooth, motivated camera movement');
    }

    // Angle specific tips
    if (shot.angle === 'low-angle') {
      tips.push('Low angle adds power and authority to subject');
    }
    if (shot.angle === 'high-angle') {
      tips.push('High angle can diminish or observe subject');
    }

    return tips.slice(0, 4);
  }

  // -------------------------------------------------------------------------
  // Scene Style Guide Generation
  // -------------------------------------------------------------------------

  generateSceneStyleGuide(analysis: SceneAnalysis): SceneStyleGuide {
    const primaryMood = this.determinePrimaryMood(analysis);
    const secondaryMood = this.determineSecondaryMood(primaryMood);
    const colorPalette = this.suggestColorPalette(primaryMood);
    const lightingStyle = this.suggestLightingStyle(primaryMood);
    const pacing = analysis.pacing;
    const keyTechniques = this.selectKeyTechniques(primaryMood);
    const styleReferences = this.findStyleReferencesForMood(primaryMood);
    const overarchingNotes = this.generateOverarchingNotes(analysis, primaryMood);

    const guide: SceneStyleGuide = {
      sceneId: analysis.sceneId,
      primaryMood,
      secondaryMood,
      colorPalette,
      lightingStyle,
      pacing,
      keyTechniques,
      styleReferences,
      overarchingNotes,
    };

    this.styleGuides.set(analysis.sceneId, guide);
    return guide;
  }

  getSceneStyleGuide(sceneId: string): SceneStyleGuide | undefined {
    return this.styleGuides.get(sceneId);
  }

  private determinePrimaryMood(analysis: SceneAnalysis): EmotionalGoal {
    const moodMap: Record<SceneMood, EmotionalGoal> = {
      'tense': 'tension',
      'romantic': 'intimacy',
      'action': 'tension',
      'dramatic': 'power',
      'comedic': 'joy',
      'mysterious': 'mystery',
      'peaceful': 'calm',
      'sad': 'sorrow',
      'triumphant': 'joy',
      'horrific': 'tension',
      'neutral': 'connection',
    };

    return moodMap[analysis.overallMood] || 'connection';
  }

  private determineSecondaryMood(primary: EmotionalGoal): EmotionalGoal | undefined {
    const complementary: Record<EmotionalGoal, EmotionalGoal> = {
      tension: 'power',
      intimacy: 'vulnerability',
      power: 'isolation',
      vulnerability: 'connection',
      isolation: 'mystery',
      connection: 'calm',
      chaos: 'tension',
      calm: 'connection',
      mystery: 'revelation',
      revelation: 'joy',
      joy: 'connection',
      sorrow: 'isolation',
    };

    return complementary[primary];
  }

  private suggestColorPalette(mood: EmotionalGoal): string[] {
    const palettes: Record<EmotionalGoal, string[]> = {
      tension: ['#1a1a2e', '#16213e', '#e94560', '#0f3460'],
      intimacy: ['#f8edeb', '#fec89a', '#d8e2dc', '#ffe5d9'],
      power: ['#1a1a2e', '#d4af37', '#000000', '#4a4a4a'],
      vulnerability: ['#e8d5b7', '#b8c1cc', '#f2e9e4', '#c9ccd5'],
      isolation: ['#2c3e50', '#34495e', '#95a5a6', '#7f8c8d'],
      connection: ['#f5f0e1', '#e8d8c4', '#c9b99a', '#b5a88f'],
      chaos: ['#ff4757', '#2f3542', '#ffa502', '#1e90ff'],
      calm: ['#dfe6e9', '#b2bec3', '#636e72', '#2d3436'],
      mystery: ['#2c2c54', '#474787', '#aaabb8', '#706fd3'],
      revelation: ['#ffeaa7', '#fdcb6e', '#f9ca24', '#f0932b'],
      joy: ['#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1'],
      sorrow: ['#636e72', '#2d3436', '#b2bec3', '#dfe6e9'],
    };

    return palettes[mood] || palettes.connection;
  }

  private suggestLightingStyle(mood: EmotionalGoal): string {
    const styles: Record<EmotionalGoal, string> = {
      tension: 'High contrast with deep shadows',
      intimacy: 'Soft, warm motivated lighting',
      power: 'Strong key light with dramatic shadows',
      vulnerability: 'Soft diffused lighting',
      isolation: 'Cool tones with isolated pools of light',
      connection: 'Natural, balanced three-point lighting',
      chaos: 'Harsh, multiple sources, mixed temperatures',
      calm: 'Soft, even, natural lighting',
      mystery: 'Low-key with silhouettes',
      revelation: 'Gradually increasing brightness',
      joy: 'Bright, warm, high-key lighting',
      sorrow: 'Desaturated, overcast quality',
    };

    return styles[mood] || styles.connection;
  }

  private selectKeyTechniques(mood: EmotionalGoal): CinematographyTechnique[] {
    const moodTechniques: Record<EmotionalGoal, string[]> = {
      tension: ['push-in', 'handheld', 'dutch-angle', 'chiaroscuro'],
      intimacy: ['shallow-dof', 'push-in', 'motivated-lighting'],
      power: ['symmetry', 'crane-shot', 'silhouette'],
      vulnerability: ['shallow-dof', 'negative-space', 'handheld'],
      isolation: ['negative-space', 'silhouette', 'crane-shot'],
      connection: ['rule-of-thirds', 'tracking-shot', 'motivated-lighting'],
      chaos: ['handheld', 'dutch-angle', 'wide-angle-distortion'],
      calm: ['long-take', 'rule-of-thirds', 'motivated-lighting'],
      mystery: ['chiaroscuro', 'silhouette', 'negative-space'],
      revelation: ['push-in', 'crane-shot', 'shallow-dof'],
      joy: ['tracking-shot', 'montage', 'rule-of-thirds'],
      sorrow: ['negative-space', 'long-take', 'shallow-dof'],
    };

    const techniqueIds = moodTechniques[mood] || moodTechniques.connection;
    return techniqueIds
      .map((id) => TECHNIQUES.find((t) => t.id === id))
      .filter((t): t is CinematographyTechnique => t !== undefined)
      .slice(0, 3);
  }

  private findStyleReferencesForMood(mood: EmotionalGoal): StyleReference[] {
    return STYLE_REFERENCES.filter((style) => style.mood.includes(mood)).slice(0, 2);
  }

  private generateOverarchingNotes(
    analysis: SceneAnalysis,
    mood: EmotionalGoal
  ): string[] {
    const notes: string[] = [];

    notes.push(`Primary emotional tone: ${mood}`);

    if (analysis.coverageScore < 70) {
      notes.push('Consider adding more coverage shots for editorial flexibility');
    }

    if (analysis.keyMoments.some((m) => m.importance === 'critical')) {
      notes.push('This scene contains critical moments - ensure multiple coverage angles');
    }

    const hasAction = analysis.keyMoments.some((m) => m.type === 'action');
    const hasEmotion = analysis.keyMoments.some((m) => m.type === 'emotional-beat');

    if (hasAction && hasEmotion) {
      notes.push('Balance dynamic action shots with intimate emotional close-ups');
    }

    return notes;
  }
}

// Export singleton instance
export const cinematographyAdvisor = CinematographyAdvisor.getInstance();

// Export class for testing
export { CinematographyAdvisor };
