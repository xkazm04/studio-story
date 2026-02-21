/**
 * SceneParser - Context Extraction Engine for Scene-to-Image Generation
 *
 * Analyzes scene text to extract visual elements, identifies characters,
 * detects mood and setting, and prepares structured data for prompt generation.
 */

import type { Scene } from '@/app/types/Scene';
import type { Character, Appearance } from '@/app/types/Character';
import type { Act } from '@/app/types/Act';

// ============================================================================
// Types
// ============================================================================

export interface VisualElement {
  type: 'character' | 'object' | 'location' | 'action' | 'atmosphere';
  value: string;
  confidence: number; // 0-1
  source: 'text' | 'inferred';
}

export interface DetectedMood {
  primary: string;
  secondary?: string;
  intensity: number; // 1-5
  emotionalTone: string;
  colorSuggestions: string[];
}

export interface DetectedSetting {
  location: string;
  timeOfDay?: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'unknown';
  weather?: string;
  season?: string;
  interior: boolean;
  lighting?: string;
}

export interface CharacterPresence {
  characterId: string;
  name: string;
  role?: string;
  action?: string;
  emotion?: string;
  position?: 'foreground' | 'midground' | 'background';
  appearance?: Appearance;
}

export interface ParsedSceneContext {
  sceneId: string;
  sceneName: string;
  actName?: string;

  // Core extracted elements
  visualElements: VisualElement[];
  characters: CharacterPresence[];
  setting: DetectedSetting;
  mood: DetectedMood;

  // Action and narrative
  mainAction?: string;
  keyMoment?: string;
  dramaticTension: number; // 1-5

  // Raw text for reference
  rawDescription: string;
  rawScript?: string;
}

// ============================================================================
// Mood Detection Patterns
// ============================================================================

const MOOD_PATTERNS: Record<string, { keywords: string[]; color: string[] }> = {
  tense: {
    keywords: ['danger', 'threat', 'fear', 'anxious', 'worried', 'nervous', 'confrontation', 'standoff', 'urgent'],
    color: ['dark red', 'deep shadows', 'muted tones', 'cold blue'],
  },
  peaceful: {
    keywords: ['calm', 'serene', 'quiet', 'gentle', 'peaceful', 'tranquil', 'rest', 'comfortable'],
    color: ['soft pastels', 'warm golden', 'light blue', 'sage green'],
  },
  romantic: {
    keywords: ['love', 'intimate', 'tender', 'passion', 'embrace', 'kiss', 'heart', 'longing'],
    color: ['warm pink', 'rose gold', 'soft candlelight', 'warm amber'],
  },
  mysterious: {
    keywords: ['secret', 'hidden', 'unknown', 'shadow', 'whisper', 'strange', 'curious', 'enigma'],
    color: ['deep purple', 'dark teal', 'misty gray', 'midnight blue'],
  },
  joyful: {
    keywords: ['happy', 'laugh', 'celebrate', 'joy', 'excited', 'delight', 'cheerful', 'bright'],
    color: ['bright yellow', 'warm orange', 'vivid colors', 'golden sunshine'],
  },
  melancholic: {
    keywords: ['sad', 'lonely', 'grief', 'loss', 'tears', 'sorrow', 'regret', 'remember'],
    color: ['muted blue', 'gray', 'desaturated', 'cool tones'],
  },
  dramatic: {
    keywords: ['conflict', 'battle', 'fight', 'clash', 'struggle', 'intense', 'powerful', 'explosive'],
    color: ['high contrast', 'dramatic shadows', 'bold colors', 'stark lighting'],
  },
  eerie: {
    keywords: ['creepy', 'haunted', 'ghost', 'dark', 'ominous', 'foreboding', 'sinister', 'unsettling'],
    color: ['sickly green', 'desaturated', 'harsh shadows', 'unnatural lighting'],
  },
  hopeful: {
    keywords: ['hope', 'dawn', 'new', 'beginning', 'promise', 'dream', 'aspire', 'future'],
    color: ['golden dawn', 'soft warmth', 'light breaking through', 'optimistic palette'],
  },
  contemplative: {
    keywords: ['think', 'ponder', 'reflect', 'consider', 'gaze', 'wonder', 'meditate', 'silence'],
    color: ['soft blue', 'gentle gray', 'subdued warmth', 'atmospheric haze'],
  },
};

// ============================================================================
// Time of Day Patterns
// ============================================================================

const TIME_PATTERNS: Record<string, string[]> = {
  dawn: ['dawn', 'sunrise', 'first light', 'daybreak', 'early morning'],
  morning: ['morning', 'breakfast', 'start of day'],
  noon: ['noon', 'midday', 'high sun', 'lunch'],
  afternoon: ['afternoon', 'late day'],
  evening: ['evening', 'sunset', 'dusk', 'twilight', 'dinner'],
  night: ['night', 'dark', 'midnight', 'moonlight', 'stars', 'late'],
};

// ============================================================================
// Weather Patterns
// ============================================================================

const WEATHER_KEYWORDS: Record<string, string[]> = {
  sunny: ['sun', 'sunny', 'bright', 'clear sky'],
  rainy: ['rain', 'raining', 'storm', 'wet', 'drizzle', 'downpour'],
  cloudy: ['cloud', 'overcast', 'gray sky', 'hazy'],
  snowy: ['snow', 'snowing', 'winter', 'frost', 'icy', 'cold'],
  foggy: ['fog', 'mist', 'misty', 'haze', 'visibility'],
  windy: ['wind', 'windy', 'breeze', 'gust', 'blowing'],
  stormy: ['thunder', 'lightning', 'storm', 'tempest'],
};

// ============================================================================
// Interior/Exterior Patterns
// ============================================================================

const INTERIOR_KEYWORDS = [
  'room', 'house', 'building', 'office', 'bedroom', 'kitchen', 'hall',
  'corridor', 'chamber', 'palace', 'castle', 'inside', 'interior',
  'tavern', 'inn', 'shop', 'library', 'temple', 'throne room',
];

const EXTERIOR_KEYWORDS = [
  'outside', 'outdoor', 'forest', 'field', 'mountain', 'river', 'lake',
  'ocean', 'beach', 'street', 'city', 'village', 'garden', 'road',
  'path', 'sky', 'cliff', 'valley', 'desert', 'meadow',
];

// ============================================================================
// Action Verbs for Visual Interest
// ============================================================================

const VISUAL_ACTIONS = [
  'fight', 'run', 'walk', 'stand', 'sit', 'lie', 'jump', 'fall',
  'climb', 'swim', 'fly', 'ride', 'hold', 'embrace', 'kiss',
  'look', 'watch', 'gaze', 'point', 'reach', 'grab', 'throw',
  'dance', 'sing', 'play', 'read', 'write', 'eat', 'drink',
];

// ============================================================================
// SceneParser Class
// ============================================================================

export class SceneParser {
  private static instance: SceneParser;

  private constructor() {}

  static getInstance(): SceneParser {
    if (!SceneParser.instance) {
      SceneParser.instance = new SceneParser();
    }
    return SceneParser.instance;
  }

  /**
   * Parse a scene and extract all visual context
   */
  parseScene(
    scene: Scene,
    characters: Character[],
    act?: Act
  ): ParsedSceneContext {
    const combinedText = this.getCombinedText(scene);
    const lowerText = combinedText.toLowerCase();

    // Extract all elements
    const visualElements = this.extractVisualElements(combinedText);
    const detectedCharacters = this.detectCharacters(combinedText, characters);
    const setting = this.detectSetting(combinedText, scene.location);
    const mood = this.detectMood(combinedText);
    const mainAction = this.detectMainAction(combinedText);
    const dramaticTension = this.calculateDramaticTension(combinedText, mood);

    return {
      sceneId: scene.id,
      sceneName: scene.name,
      actName: act?.name,
      visualElements,
      characters: detectedCharacters,
      setting,
      mood,
      mainAction,
      keyMoment: this.extractKeyMoment(combinedText),
      dramaticTension,
      rawDescription: scene.description || '',
      rawScript: scene.script,
    };
  }

  /**
   * Get combined text from all scene fields
   */
  private getCombinedText(scene: Scene): string {
    return [
      scene.name,
      scene.description,
      scene.content,
      scene.script,
      scene.location,
      scene.message,
    ]
      .filter(Boolean)
      .join(' ');
  }

  /**
   * Extract visual elements from text
   */
  private extractVisualElements(text: string): VisualElement[] {
    const elements: VisualElement[] = [];
    const lowerText = text.toLowerCase();

    // Look for location descriptions
    const locationMatches = this.extractLocations(text);
    locationMatches.forEach((loc) => {
      elements.push({
        type: 'location',
        value: loc,
        confidence: 0.8,
        source: 'text',
      });
    });

    // Look for objects
    const objects = this.extractObjects(text);
    objects.forEach((obj) => {
      elements.push({
        type: 'object',
        value: obj,
        confidence: 0.7,
        source: 'text',
      });
    });

    // Look for actions
    const actions = this.extractActions(text);
    actions.forEach((action) => {
      elements.push({
        type: 'action',
        value: action,
        confidence: 0.75,
        source: 'text',
      });
    });

    // Look for atmospheric descriptions
    const atmosphere = this.extractAtmosphere(text);
    atmosphere.forEach((atm) => {
      elements.push({
        type: 'atmosphere',
        value: atm,
        confidence: 0.7,
        source: 'text',
      });
    });

    return elements;
  }

  /**
   * Detect characters mentioned in the scene
   */
  private detectCharacters(
    text: string,
    projectCharacters: Character[]
  ): CharacterPresence[] {
    const presences: CharacterPresence[] = [];
    const lowerText = text.toLowerCase();

    projectCharacters.forEach((char) => {
      const charNameLower = char.name.toLowerCase();

      // Check if character is mentioned
      if (lowerText.includes(charNameLower)) {
        // Try to extract what the character is doing
        const action = this.extractCharacterAction(text, char.name);
        const emotion = this.extractCharacterEmotion(text, char.name);
        const position = this.inferCharacterPosition(text, char.name);

        presences.push({
          characterId: char.id,
          name: char.name,
          role: char.type,
          action,
          emotion,
          position,
        });
      }
    });

    return presences;
  }

  /**
   * Detect setting from text
   */
  private detectSetting(text: string, explicitLocation?: string): DetectedSetting {
    const lowerText = text.toLowerCase();

    // Determine if interior or exterior
    let interior = false;
    let interiorScore = 0;
    let exteriorScore = 0;

    INTERIOR_KEYWORDS.forEach((keyword) => {
      if (lowerText.includes(keyword)) interiorScore++;
    });

    EXTERIOR_KEYWORDS.forEach((keyword) => {
      if (lowerText.includes(keyword)) exteriorScore++;
    });

    interior = interiorScore > exteriorScore;

    // Detect time of day
    let timeOfDay: DetectedSetting['timeOfDay'] = 'unknown';
    for (const [time, keywords] of Object.entries(TIME_PATTERNS)) {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        timeOfDay = time as DetectedSetting['timeOfDay'];
        break;
      }
    }

    // Detect weather
    let weather: string | undefined;
    for (const [weatherType, keywords] of Object.entries(WEATHER_KEYWORDS)) {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        weather = weatherType;
        break;
      }
    }

    // Detect season
    const season = this.detectSeason(lowerText);

    // Infer lighting based on time and setting
    const lighting = this.inferLighting(timeOfDay, interior, weather);

    return {
      location: explicitLocation || this.extractMainLocation(text),
      timeOfDay,
      weather,
      season,
      interior,
      lighting,
    };
  }

  /**
   * Detect mood from text
   */
  private detectMood(text: string): DetectedMood {
    const lowerText = text.toLowerCase();
    let bestMood = 'neutral';
    let bestScore = 0;
    let colorSuggestions: string[] = [];

    // Score each mood pattern
    for (const [mood, pattern] of Object.entries(MOOD_PATTERNS)) {
      let score = 0;
      pattern.keywords.forEach((keyword) => {
        if (lowerText.includes(keyword)) score++;
      });

      if (score > bestScore) {
        bestScore = score;
        bestMood = mood;
        colorSuggestions = pattern.color;
      }
    }

    // Determine intensity based on language intensity
    const intensity = this.calculateMoodIntensity(lowerText);

    // Try to find secondary mood
    let secondaryMood: string | undefined;
    let secondBestScore = 0;
    for (const [mood, pattern] of Object.entries(MOOD_PATTERNS)) {
      if (mood === bestMood) continue;
      let score = 0;
      pattern.keywords.forEach((keyword) => {
        if (lowerText.includes(keyword)) score++;
      });
      if (score > secondBestScore) {
        secondBestScore = score;
        secondaryMood = score >= 1 ? mood : undefined;
      }
    }

    return {
      primary: bestMood,
      secondary: secondaryMood,
      intensity,
      emotionalTone: this.deriveEmotionalTone(bestMood, intensity),
      colorSuggestions,
    };
  }

  // -------------------------------------------------------------------------
  // Helper Methods
  // -------------------------------------------------------------------------

  private extractLocations(text: string): string[] {
    const locations: string[] = [];
    const patterns = [
      /(?:in|at|near|inside|outside|within)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\.|,|$|\s+and|\s+where)/gi,
      /(?:entered|arrived|reached)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\.|,|$)/gi,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const loc = match[1].trim();
        if (loc.length > 2 && loc.length < 50) {
          locations.push(loc);
        }
      }
    });

    return [...new Set(locations)].slice(0, 3);
  }

  private extractObjects(text: string): string[] {
    const objects: string[] = [];
    const commonObjects = [
      'sword', 'shield', 'book', 'torch', 'table', 'chair', 'door', 'window',
      'tree', 'flower', 'crown', 'throne', 'horse', 'carriage', 'ship', 'boat',
      'letter', 'scroll', 'map', 'key', 'chest', 'mirror', 'candle', 'fire',
    ];

    const lowerText = text.toLowerCase();
    commonObjects.forEach((obj) => {
      if (lowerText.includes(obj)) {
        objects.push(obj);
      }
    });

    return objects.slice(0, 5);
  }

  private extractActions(text: string): string[] {
    const actions: string[] = [];
    const lowerText = text.toLowerCase();

    VISUAL_ACTIONS.forEach((action) => {
      const patterns = [
        new RegExp(`\\b${action}s?\\b`, 'i'),
        new RegExp(`\\b${action}ing\\b`, 'i'),
        new RegExp(`\\b${action}ed\\b`, 'i'),
      ];

      if (patterns.some((p) => p.test(lowerText))) {
        actions.push(action);
      }
    });

    return actions.slice(0, 3);
  }

  private extractAtmosphere(text: string): string[] {
    const atmosphere: string[] = [];
    const atmosphericWords = [
      'dark', 'bright', 'dim', 'shadowy', 'misty', 'foggy', 'dusty',
      'smoky', 'glowing', 'sparkling', 'shimmering', 'looming',
      'ancient', 'crumbling', 'pristine', 'luxurious', 'decrepit',
    ];

    const lowerText = text.toLowerCase();
    atmosphericWords.forEach((word) => {
      if (lowerText.includes(word)) {
        atmosphere.push(word);
      }
    });

    return atmosphere.slice(0, 4);
  }

  private extractCharacterAction(text: string, characterName: string): string | undefined {
    const pattern = new RegExp(
      `${characterName}\\s+(?:is\\s+)?([a-zA-Z]+(?:ing|ed|s)?)`,
      'i'
    );
    const match = text.match(pattern);
    return match ? match[1] : undefined;
  }

  private extractCharacterEmotion(text: string, characterName: string): string | undefined {
    const emotions = ['angry', 'sad', 'happy', 'fearful', 'surprised', 'disgusted', 'contempt', 'nervous', 'calm', 'excited', 'worried', 'relieved'];
    const lowerText = text.toLowerCase();
    const charIndex = lowerText.indexOf(characterName.toLowerCase());

    if (charIndex === -1) return undefined;

    // Look in a window around the character mention
    const windowStart = Math.max(0, charIndex - 100);
    const windowEnd = Math.min(text.length, charIndex + 100);
    const window = lowerText.slice(windowStart, windowEnd);

    for (const emotion of emotions) {
      if (window.includes(emotion)) {
        return emotion;
      }
    }

    return undefined;
  }

  private inferCharacterPosition(
    text: string,
    characterName: string
  ): CharacterPresence['position'] {
    const lowerText = text.toLowerCase();
    const charIndex = lowerText.indexOf(characterName.toLowerCase());

    if (charIndex === -1) return 'midground';

    const window = lowerText.slice(
      Math.max(0, charIndex - 50),
      Math.min(text.length, charIndex + 50)
    );

    if (window.includes('close') || window.includes('face') || window.includes('focus')) {
      return 'foreground';
    }
    if (window.includes('distant') || window.includes('far') || window.includes('background')) {
      return 'background';
    }

    return 'midground';
  }

  private detectSeason(text: string): string | undefined {
    const seasons: Record<string, string[]> = {
      spring: ['spring', 'bloom', 'blossom', 'thaw', 'new growth'],
      summer: ['summer', 'hot', 'humid', 'scorching', 'sweltering'],
      autumn: ['autumn', 'fall', 'leaves falling', 'harvest', 'orange leaves'],
      winter: ['winter', 'cold', 'snow', 'frost', 'frozen', 'ice'],
    };

    for (const [season, keywords] of Object.entries(seasons)) {
      if (keywords.some((kw) => text.includes(kw))) {
        return season;
      }
    }

    return undefined;
  }

  private inferLighting(
    timeOfDay: DetectedSetting['timeOfDay'],
    interior: boolean,
    weather?: string
  ): string {
    if (interior) {
      if (timeOfDay === 'night') return 'candlelight, warm interior lighting';
      return 'soft indoor lighting';
    }

    switch (timeOfDay) {
      case 'dawn':
        return 'soft pink and orange dawn light';
      case 'morning':
        return 'bright morning light, clear';
      case 'noon':
        return 'harsh overhead sunlight';
      case 'afternoon':
        return 'warm afternoon sunlight';
      case 'evening':
        return 'golden hour lighting, warm tones';
      case 'night':
        return 'moonlight, cool blue tones';
      default:
        return weather === 'cloudy' ? 'diffused overcast lighting' : 'natural lighting';
    }
  }

  private extractMainLocation(text: string): string {
    const locations = this.extractLocations(text);
    return locations[0] || 'unspecified location';
  }

  private calculateMoodIntensity(text: string): number {
    let intensity = 3;

    // Intensifiers
    const intensifiers = ['very', 'extremely', 'incredibly', 'absolutely', 'utterly'];
    const dampeners = ['slightly', 'somewhat', 'a bit', 'mildly'];

    intensifiers.forEach((word) => {
      if (text.includes(word)) intensity = Math.min(5, intensity + 1);
    });

    dampeners.forEach((word) => {
      if (text.includes(word)) intensity = Math.max(1, intensity - 1);
    });

    // Exclamation marks increase intensity
    const exclamations = (text.match(/!/g) || []).length;
    if (exclamations > 2) intensity = Math.min(5, intensity + 1);

    return intensity as 1 | 2 | 3 | 4 | 5;
  }

  private deriveEmotionalTone(mood: string, intensity: number): string {
    const toneMap: Record<string, string[]> = {
      tense: ['uneasy', 'anxious', 'alarming', 'dire', 'critical'],
      peaceful: ['calm', 'serene', 'tranquil', 'blissful', 'idyllic'],
      romantic: ['tender', 'affectionate', 'passionate', 'ardent', 'fervent'],
      mysterious: ['curious', 'intriguing', 'enigmatic', 'cryptic', 'arcane'],
      joyful: ['pleased', 'happy', 'delighted', 'ecstatic', 'euphoric'],
      melancholic: ['wistful', 'sorrowful', 'grief-stricken', 'devastated', 'heartbroken'],
      dramatic: ['intense', 'gripping', 'explosive', 'climactic', 'earth-shattering'],
      eerie: ['unsettling', 'creepy', 'haunting', 'terrifying', 'nightmarish'],
      hopeful: ['optimistic', 'promising', 'inspiring', 'uplifting', 'triumphant'],
      contemplative: ['thoughtful', 'reflective', 'pensive', 'meditative', 'profound'],
    };

    const tones = toneMap[mood] || ['neutral', 'moderate', 'notable', 'significant', 'profound'];
    return tones[Math.min(intensity - 1, tones.length - 1)];
  }

  private detectMainAction(text: string): string | undefined {
    const actions = this.extractActions(text);
    return actions[0];
  }

  private extractKeyMoment(text: string): string | undefined {
    // Look for sentences with dramatic words
    const dramaticIndicators = [
      'suddenly', 'finally', 'at last', 'realized', 'discovered',
      'revealed', 'understood', 'moment', 'instant', 'then',
    ];

    const sentences = text.split(/[.!?]+/);

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (dramaticIndicators.some((ind) => lowerSentence.includes(ind))) {
        return sentence.trim();
      }
    }

    return undefined;
  }

  private calculateDramaticTension(text: string, mood: DetectedMood): number {
    let tension = 2;

    // High-tension moods
    if (['tense', 'dramatic', 'eerie'].includes(mood.primary)) {
      tension += 2;
    }

    // Low-tension moods
    if (['peaceful', 'contemplative'].includes(mood.primary)) {
      tension -= 1;
    }

    // Conflict indicators
    const conflictWords = ['fight', 'battle', 'argument', 'clash', 'confront', 'attack', 'defend'];
    conflictWords.forEach((word) => {
      if (text.toLowerCase().includes(word)) tension++;
    });

    // Clamp to 1-5
    return Math.max(1, Math.min(5, tension)) as 1 | 2 | 3 | 4 | 5;
  }
}

// Export singleton instance
export const sceneParser = SceneParser.getInstance();
