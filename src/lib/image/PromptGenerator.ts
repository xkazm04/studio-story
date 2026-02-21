/**
 * PromptGenerator - Automatic Prompt Creation for Scene-to-Image Generation
 *
 * Takes parsed scene context and generates optimized image generation prompts
 * with character appearance injection, mood-based styling, and multi-shot variations.
 */

import type { ParsedSceneContext, CharacterPresence, DetectedMood, DetectedSetting } from './SceneParser';
import type { Appearance } from '@/app/types/Character';
import type { PromptComponents } from '@/app/types/Image';
import { StyleDNA, type StyleDNAConfig } from '@/lib/style/StyleDNA';

// ============================================================================
// Types
// ============================================================================

export interface GeneratedPrompt {
  id: string;
  main: string;
  negative: string;
  components: PromptComponents;
  shotType: ShotType;
  focusArea: FocusArea;
  confidence: number; // 0-1
  reasoning?: string;
}

export interface MultiShotResult {
  prompts: GeneratedPrompt[];
  recommendedShot: string;
  sceneId: string;
  sceneName: string;
}

export type ShotType =
  | 'establishing'     // Wide shot showing full environment
  | 'master'           // Full scene with all characters
  | 'medium'           // Characters from waist up
  | 'close-up'         // Focus on face/emotion
  | 'extreme-close-up' // Detail shot
  | 'over-shoulder'    // POV-style shot
  | 'reaction'         // Character reaction shot
  | 'detail'           // Object or environmental detail
  | 'action';          // Dynamic action moment

export type FocusArea =
  | 'character'
  | 'environment'
  | 'interaction'
  | 'object'
  | 'atmosphere';

export interface PromptGeneratorOptions {
  styleConfig?: StyleDNAConfig;
  qualityTags?: string[];
  negativeTags?: string[];
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
  includeCharacterDetails?: boolean;
  maxPromptLength?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_QUALITY_TAGS = [
  'masterpiece',
  'best quality',
  'highly detailed',
  'sharp focus',
  'professional',
];

const DEFAULT_NEGATIVE_TAGS = [
  'blurry',
  'low quality',
  'distorted',
  'deformed',
  'bad anatomy',
  'watermark',
  'signature',
  'text',
  'jpeg artifacts',
];

const SHOT_TYPE_PROMPTS: Record<ShotType, { camera: string; framing: string }> = {
  establishing: {
    camera: 'wide angle lens, establishing shot',
    framing: 'full environment visible, characters small in frame',
  },
  master: {
    camera: 'medium wide shot',
    framing: 'full scene composition, all characters visible',
  },
  medium: {
    camera: 'medium shot',
    framing: 'characters from waist up, clear expressions',
  },
  'close-up': {
    camera: 'close-up shot, shallow depth of field',
    framing: 'face and shoulders, emotional focus',
  },
  'extreme-close-up': {
    camera: 'extreme close-up, macro',
    framing: 'detail focus, dramatic impact',
  },
  'over-shoulder': {
    camera: 'over the shoulder shot',
    framing: 'POV perspective, character in foreground blur',
  },
  reaction: {
    camera: 'reaction shot, medium close-up',
    framing: 'emotional response visible, clear expression',
  },
  detail: {
    camera: 'detail shot, selective focus',
    framing: 'object or element emphasis, background blur',
  },
  action: {
    camera: 'dynamic angle, motion blur',
    framing: 'action frozen in time, dramatic composition',
  },
};

const MOOD_STYLE_MODIFIERS: Record<string, string[]> = {
  tense: ['dramatic lighting', 'high contrast', 'sharp shadows', 'desaturated'],
  peaceful: ['soft lighting', 'warm tones', 'gentle gradients', 'natural colors'],
  romantic: ['soft focus', 'warm golden light', 'bokeh', 'dreamy atmosphere'],
  mysterious: ['volumetric fog', 'rim lighting', 'deep shadows', 'muted colors'],
  joyful: ['bright lighting', 'vibrant colors', 'warm highlights', 'clear sky'],
  melancholic: ['overcast lighting', 'cool tones', 'soft shadows', 'muted palette'],
  dramatic: ['dramatic chiaroscuro', 'bold shadows', 'high contrast', 'cinematic'],
  eerie: ['unsettling lighting', 'greenish tint', 'harsh shadows', 'unnatural'],
  hopeful: ['golden hour light', 'lens flare', 'warm backlight', 'optimistic'],
  contemplative: ['soft diffused light', 'atmospheric haze', 'gentle tones'],
};

// ============================================================================
// PromptGenerator Class
// ============================================================================

export class PromptGenerator {
  private static instance: PromptGenerator;
  private styleDNA: StyleDNA;

  private constructor() {
    this.styleDNA = StyleDNA.getInstance();
  }

  static getInstance(): PromptGenerator {
    if (!PromptGenerator.instance) {
      PromptGenerator.instance = new PromptGenerator();
    }
    return PromptGenerator.instance;
  }

  /**
   * Generate multiple prompt variations for a scene
   */
  generateMultiShot(
    context: ParsedSceneContext,
    characterAppearances: Map<string, Appearance>,
    options: PromptGeneratorOptions = {}
  ): MultiShotResult {
    const shotTypes = this.determineShotTypes(context);
    const prompts: GeneratedPrompt[] = [];

    shotTypes.forEach((shotType, index) => {
      const prompt = this.generatePrompt(
        context,
        characterAppearances,
        shotType,
        options
      );
      prompts.push({
        ...prompt,
        id: `${context.sceneId}_shot_${index}`,
      });
    });

    return {
      prompts,
      recommendedShot: shotTypes[0],
      sceneId: context.sceneId,
      sceneName: context.sceneName,
    };
  }

  /**
   * Generate a single prompt for specific shot type
   */
  generatePrompt(
    context: ParsedSceneContext,
    characterAppearances: Map<string, Appearance>,
    shotType: ShotType,
    options: PromptGeneratorOptions = {}
  ): GeneratedPrompt {
    const focusArea = this.determineFocusArea(context, shotType);
    const components = this.buildPromptComponents(
      context,
      characterAppearances,
      shotType,
      focusArea,
      options
    );

    const mainPrompt = this.assembleMainPrompt(components, options);
    const negativePrompt = this.assembleNegativePrompt(context, options);
    const confidence = this.calculateConfidence(context, shotType);

    return {
      id: '',
      main: mainPrompt,
      negative: negativePrompt,
      components,
      shotType,
      focusArea,
      confidence,
      reasoning: this.generateReasoning(context, shotType, focusArea),
    };
  }

  /**
   * Build prompt components from scene context
   */
  private buildPromptComponents(
    context: ParsedSceneContext,
    characterAppearances: Map<string, Appearance>,
    shotType: ShotType,
    focusArea: FocusArea,
    options: PromptGeneratorOptions
  ): PromptComponents {
    // Art style
    const artstyle = this.buildArtStyleComponent(context, options);

    // Scenery
    const scenery = this.buildSceneryComponent(context, shotType);

    // Actors (characters)
    const actors = options.includeCharacterDetails !== false
      ? this.buildActorsComponent(context, characterAppearances, shotType)
      : this.buildSimpleActorsComponent(context);

    // Actions
    const actions = this.buildActionsComponent(context, shotType);

    // Camera
    const camera = this.buildCameraComponent(context, shotType, options);

    return { artstyle, scenery, actors, actions, camera };
  }

  /**
   * Build art style component
   */
  private buildArtStyleComponent(
    context: ParsedSceneContext,
    options: PromptGeneratorOptions
  ): string {
    const parts: string[] = [];

    // Add style DNA if available
    const activeStyle = options.styleConfig || this.styleDNA.getActiveConfig();
    if (activeStyle) {
      parts.push(...activeStyle.styleKeywords);
    }

    // Add mood-based style modifiers
    const moodModifiers = MOOD_STYLE_MODIFIERS[context.mood.primary] || [];
    parts.push(...moodModifiers.slice(0, 2));

    // Add quality tags
    const qualityTags = options.qualityTags || DEFAULT_QUALITY_TAGS;
    parts.push(...qualityTags.slice(0, 3));

    return parts.join(', ');
  }

  /**
   * Build scenery component
   */
  private buildSceneryComponent(
    context: ParsedSceneContext,
    shotType: ShotType
  ): string {
    const parts: string[] = [];

    // Location
    if (context.setting.location && context.setting.location !== 'unspecified location') {
      parts.push(context.setting.location);
    }

    // Interior/Exterior
    parts.push(context.setting.interior ? 'interior' : 'exterior');

    // Time of day and lighting
    if (context.setting.timeOfDay && context.setting.timeOfDay !== 'unknown') {
      parts.push(context.setting.timeOfDay);
    }
    if (context.setting.lighting) {
      parts.push(context.setting.lighting);
    }

    // Weather
    if (context.setting.weather) {
      parts.push(`${context.setting.weather} weather`);
    }

    // Atmospheric elements
    const atmosphereElements = context.visualElements
      .filter((el) => el.type === 'atmosphere')
      .map((el) => el.value);
    parts.push(...atmosphereElements.slice(0, 2));

    // For establishing shots, add more environment detail
    if (shotType === 'establishing' || shotType === 'master') {
      const locationElements = context.visualElements
        .filter((el) => el.type === 'location')
        .map((el) => el.value);
      parts.push(...locationElements.slice(0, 2));
    }

    return parts.join(', ');
  }

  /**
   * Build actors component with full character details
   */
  private buildActorsComponent(
    context: ParsedSceneContext,
    characterAppearances: Map<string, Appearance>,
    shotType: ShotType
  ): string {
    if (context.characters.length === 0) {
      return 'empty scene, no people';
    }

    const characterDescriptions: string[] = [];

    // Sort characters by position relevance for the shot type
    const sortedCharacters = this.sortCharactersByRelevance(
      context.characters,
      shotType
    );

    // Limit characters based on shot type
    const maxCharacters = shotType === 'close-up' || shotType === 'reaction' ? 1 : 3;
    const visibleCharacters = sortedCharacters.slice(0, maxCharacters);

    visibleCharacters.forEach((char) => {
      const appearance = characterAppearances.get(char.characterId);
      const desc = this.buildCharacterDescription(char, appearance, shotType);
      characterDescriptions.push(desc);
    });

    return characterDescriptions.join(', ');
  }

  /**
   * Build simple actors component without detailed appearances
   */
  private buildSimpleActorsComponent(context: ParsedSceneContext): string {
    if (context.characters.length === 0) {
      return 'empty scene';
    }

    const names = context.characters.map((c) => c.name);
    if (names.length === 1) {
      return `${names[0]}`;
    }
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }

  /**
   * Build detailed character description
   */
  private buildCharacterDescription(
    char: CharacterPresence,
    appearance: Appearance | undefined,
    shotType: ShotType
  ): string {
    const parts: string[] = [char.name];

    if (appearance) {
      // Physical attributes
      if (appearance.gender) parts.push(appearance.gender.toLowerCase());
      if (appearance.age) parts.push(appearance.age.toLowerCase());

      // For close-ups, focus on face
      if (shotType === 'close-up' || shotType === 'extreme-close-up') {
        if (appearance.face) {
          if (appearance.face.eyeColor) parts.push(`${appearance.face.eyeColor} eyes`);
          if (appearance.face.hairColor && appearance.face.hairStyle) {
            parts.push(`${appearance.face.hairColor} ${appearance.face.hairStyle} hair`);
          }
          if (appearance.face.features) parts.push(appearance.face.features);
        }
      } else {
        // For wider shots, include body and clothing
        if (appearance.bodyType) parts.push(appearance.bodyType);
        if (appearance.clothing) {
          if (appearance.clothing.style) parts.push(appearance.clothing.style);
          if (appearance.clothing.color) parts.push(`${appearance.clothing.color} clothing`);
        }
      }

      if (appearance.customFeatures) {
        parts.push(appearance.customFeatures);
      }
    }

    // Add emotion if detected
    if (char.emotion) {
      parts.push(`${char.emotion} expression`);
    }

    // Add position hint
    if (char.position && shotType === 'master') {
      parts.push(`in ${char.position}`);
    }

    return parts.join(', ');
  }

  /**
   * Build actions component
   */
  private buildActionsComponent(
    context: ParsedSceneContext,
    shotType: ShotType
  ): string {
    const parts: string[] = [];

    // Character actions
    context.characters.forEach((char) => {
      if (char.action) {
        parts.push(`${char.name} ${char.action}`);
      }
    });

    // Main action from scene
    if (context.mainAction) {
      parts.push(context.mainAction);
    }

    // For action shots, emphasize dynamism
    if (shotType === 'action') {
      parts.push('dynamic pose', 'motion captured');
    }

    // Emotional tone
    parts.push(context.mood.emotionalTone);

    // Key moment if available
    if (context.keyMoment && shotType !== 'establishing') {
      // Extract action-relevant words from key moment
      const actionWords = context.keyMoment
        .split(' ')
        .filter((w) => w.length > 4)
        .slice(0, 3);
      if (actionWords.length > 0) {
        parts.push(actionWords.join(' '));
      }
    }

    return parts.join(', ');
  }

  /**
   * Build camera component
   */
  private buildCameraComponent(
    context: ParsedSceneContext,
    shotType: ShotType,
    options: PromptGeneratorOptions
  ): string {
    const parts: string[] = [];

    // Shot type specifics
    const shotConfig = SHOT_TYPE_PROMPTS[shotType];
    parts.push(shotConfig.camera);
    parts.push(shotConfig.framing);

    // Aspect ratio hint
    if (options.aspectRatio) {
      const ratioHints: Record<string, string> = {
        '1:1': 'square composition',
        '16:9': 'cinematic widescreen',
        '9:16': 'portrait vertical',
        '4:3': 'classic aspect ratio',
        '3:4': 'portrait frame',
      };
      parts.push(ratioHints[options.aspectRatio] || '');
    }

    // Mood-based camera hints
    if (context.dramaticTension >= 4) {
      parts.push('dramatic angle');
    } else if (context.dramaticTension <= 2) {
      parts.push('neutral angle');
    }

    return parts.filter(Boolean).join(', ');
  }

  /**
   * Assemble final main prompt
   */
  private assembleMainPrompt(
    components: PromptComponents,
    options: PromptGeneratorOptions
  ): string {
    const maxLength = options.maxPromptLength || 500;

    // Combine components in optimal order
    const orderedParts = [
      components.artstyle,
      components.scenery,
      components.actors,
      components.actions,
      components.camera,
    ].filter(Boolean);

    let prompt = orderedParts.join(', ');

    // Truncate if needed while preserving complete phrases
    if (prompt.length > maxLength) {
      prompt = prompt.slice(0, maxLength);
      const lastComma = prompt.lastIndexOf(',');
      if (lastComma > maxLength - 50) {
        prompt = prompt.slice(0, lastComma);
      }
    }

    return prompt;
  }

  /**
   * Assemble negative prompt
   */
  private assembleNegativePrompt(
    context: ParsedSceneContext,
    options: PromptGeneratorOptions
  ): string {
    const parts = [...(options.negativeTags || DEFAULT_NEGATIVE_TAGS)];

    // Add style DNA avoid keywords
    const activeStyle = options.styleConfig || this.styleDNA.getActiveConfig();
    if (activeStyle?.avoidKeywords) {
      parts.push(...activeStyle.avoidKeywords);
    }

    // Add mood-opposite elements
    if (context.mood.primary === 'joyful') {
      parts.push('dark', 'gloomy', 'depressing');
    } else if (context.mood.primary === 'peaceful') {
      parts.push('chaotic', 'violent', 'aggressive');
    }

    return [...new Set(parts)].join(', ');
  }

  /**
   * Determine which shot types to generate for a scene
   */
  private determineShotTypes(context: ParsedSceneContext): ShotType[] {
    const shots: ShotType[] = [];

    // Always include a master shot
    shots.push('master');

    // Character-focused scenes
    if (context.characters.length > 0) {
      if (context.characters.length === 1) {
        shots.push('medium');
        if (context.mood.intensity >= 4) {
          shots.push('close-up');
        }
      } else if (context.characters.length >= 2) {
        shots.push('over-shoulder');
        shots.push('reaction');
      }
    }

    // Environment-heavy scenes
    const locationElements = context.visualElements.filter((e) => e.type === 'location');
    if (locationElements.length >= 2) {
      shots.unshift('establishing');
    }

    // Action scenes
    if (context.dramaticTension >= 4 || context.mainAction) {
      shots.push('action');
    }

    // Detail shots for scenes with important objects
    const objectElements = context.visualElements.filter((e) => e.type === 'object');
    if (objectElements.length >= 1) {
      shots.push('detail');
    }

    // Limit to 4 variations
    return [...new Set(shots)].slice(0, 4);
  }

  /**
   * Determine focus area for shot type
   */
  private determineFocusArea(
    context: ParsedSceneContext,
    shotType: ShotType
  ): FocusArea {
    switch (shotType) {
      case 'establishing':
        return 'environment';
      case 'close-up':
      case 'extreme-close-up':
      case 'reaction':
        return 'character';
      case 'over-shoulder':
        return 'interaction';
      case 'detail':
        return 'object';
      case 'action':
        return context.characters.length > 0 ? 'character' : 'atmosphere';
      default:
        return context.characters.length > 0 ? 'character' : 'environment';
    }
  }

  /**
   * Sort characters by relevance to shot type
   */
  private sortCharactersByRelevance(
    characters: CharacterPresence[],
    shotType: ShotType
  ): CharacterPresence[] {
    return [...characters].sort((a, b) => {
      // For close-ups, prefer foreground characters
      if (shotType === 'close-up' || shotType === 'reaction') {
        if (a.position === 'foreground' && b.position !== 'foreground') return -1;
        if (b.position === 'foreground' && a.position !== 'foreground') return 1;
      }

      // Prefer characters with actions
      if (a.action && !b.action) return -1;
      if (b.action && !a.action) return 1;

      // Prefer characters with emotions
      if (a.emotion && !b.emotion) return -1;
      if (b.emotion && !a.emotion) return 1;

      return 0;
    });
  }

  /**
   * Calculate confidence score for generated prompt
   */
  private calculateConfidence(
    context: ParsedSceneContext,
    shotType: ShotType
  ): number {
    let confidence = 0.5;

    // More visual elements = higher confidence
    confidence += Math.min(0.2, context.visualElements.length * 0.04);

    // Characters with details = higher confidence
    const charsWithDetails = context.characters.filter(
      (c) => c.action || c.emotion
    ).length;
    confidence += Math.min(0.15, charsWithDetails * 0.05);

    // Strong mood detection = higher confidence
    if (context.mood.primary !== 'neutral') {
      confidence += 0.1;
    }

    // Good setting info = higher confidence
    if (context.setting.location !== 'unspecified location') {
      confidence += 0.05;
    }

    return Math.min(0.95, confidence);
  }

  /**
   * Generate reasoning for prompt choices
   */
  private generateReasoning(
    context: ParsedSceneContext,
    shotType: ShotType,
    focusArea: FocusArea
  ): string {
    const reasons: string[] = [];

    reasons.push(`Shot type: ${shotType} - ${SHOT_TYPE_PROMPTS[shotType].framing}`);
    reasons.push(`Focus: ${focusArea}`);
    reasons.push(`Mood: ${context.mood.primary} (intensity ${context.mood.intensity})`);

    if (context.characters.length > 0) {
      reasons.push(`Characters: ${context.characters.map((c) => c.name).join(', ')}`);
    }

    if (context.setting.location !== 'unspecified location') {
      reasons.push(`Location: ${context.setting.location}`);
    }

    return reasons.join(' | ');
  }

  /**
   * Refine an existing prompt with AI suggestions
   */
  refinePrompt(
    currentPrompt: string,
    context: ParsedSceneContext,
    feedback: 'more_detail' | 'simpler' | 'more_mood' | 'more_action'
  ): string {
    let refined = currentPrompt;

    switch (feedback) {
      case 'more_detail':
        // Add more visual elements
        const extraElements = context.visualElements
          .filter((e) => !currentPrompt.includes(e.value))
          .slice(0, 3)
          .map((e) => e.value);
        if (extraElements.length > 0) {
          refined += `, ${extraElements.join(', ')}`;
        }
        break;

      case 'simpler':
        // Reduce to core elements
        const parts = refined.split(',').map((p) => p.trim());
        refined = parts.slice(0, Math.ceil(parts.length / 2)).join(', ');
        break;

      case 'more_mood':
        // Add mood color suggestions
        refined += `, ${context.mood.colorSuggestions.join(', ')}`;
        refined += `, ${context.mood.emotionalTone} atmosphere`;
        break;

      case 'more_action':
        // Emphasize action elements
        const actions = context.visualElements
          .filter((e) => e.type === 'action')
          .map((e) => e.value);
        if (actions.length > 0) {
          refined += `, ${actions.join(', ')}, dynamic composition, motion`;
        }
        break;
    }

    return refined;
  }
}

// Export singleton instance
export const promptGenerator = PromptGenerator.getInstance();
