/**
 * StyleInjector - Automatic Style Prompt Enhancement
 *
 * Takes StyleDNA configurations and automatically injects style
 * parameters into image generation prompts for consistent output.
 */

import {
  StyleDNA,
  styleDNA,
  type StyleDNAConfig,
  type LightingProfile,
  type TextureProfile,
  type CompositionRules,
  type MoodDefinition,
} from './StyleDNA';
import { ColorTheory, colorTheory, type ColorPalette } from './ColorTheory';

// ============================================================================
// Types
// ============================================================================

export type InjectionMode =
  | 'prefix'   // Style goes before the main prompt
  | 'suffix'   // Style goes after the main prompt
  | 'wrap'     // Style wraps the main prompt
  | 'blend';   // Style is blended throughout

export type InjectionSection =
  | 'color'
  | 'lighting'
  | 'texture'
  | 'composition'
  | 'mood'
  | 'keywords';

export interface InjectionOptions {
  mode?: InjectionMode;
  strength?: number; // 0-100, how strongly to apply style
  sections?: InjectionSection[]; // Which sections to include
  preserveOriginal?: boolean; // Keep original prompt emphasis
  maxLength?: number; // Maximum prompt length
}

export interface InjectedPrompt {
  original: string;
  enhanced: string;
  styleSegments: {
    section: InjectionSection;
    text: string;
    weight: number;
  }[];
  metadata: {
    configId: string;
    configName: string;
    injectionMode: InjectionMode;
    strength: number;
    sectionsIncluded: InjectionSection[];
  };
}

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  defaultStyle?: string;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_OPTIONS: Required<InjectionOptions> = {
  mode: 'prefix',
  strength: 75,
  sections: ['color', 'lighting', 'texture', 'composition', 'mood', 'keywords'],
  preserveOriginal: true,
  maxLength: 2000,
};

const ALL_SECTIONS: InjectionSection[] = [
  'color',
  'lighting',
  'texture',
  'composition',
  'mood',
  'keywords',
];

// ============================================================================
// StyleInjector Class
// ============================================================================

export class StyleInjector {
  private static instance: StyleInjector;
  private styleDNA: StyleDNA;
  private colorTheory: ColorTheory;
  private templates: Map<string, PromptTemplate> = new Map();

  private constructor() {
    this.styleDNA = StyleDNA.getInstance();
    this.colorTheory = ColorTheory.getInstance();
    this.initializeTemplates();
  }

  static getInstance(): StyleInjector {
    if (!StyleInjector.instance) {
      StyleInjector.instance = new StyleInjector();
    }
    return StyleInjector.instance;
  }

  // -------------------------------------------------------------------------
  // Main Injection Methods
  // -------------------------------------------------------------------------

  inject(prompt: string, options?: InjectionOptions): InjectedPrompt | null {
    const config = this.styleDNA.getActiveConfig();
    if (!config || !config.autoInject) {
      return null;
    }

    return this.injectWithConfig(prompt, config, options);
  }

  injectWithConfig(
    prompt: string,
    config: StyleDNAConfig,
    options?: InjectionOptions
  ): InjectedPrompt {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Scale strength by config's injection strength
    const effectiveStrength = (opts.strength / 100) * (config.injectionStrength / 100);

    // Generate style segments
    const styleSegments = this.generateStyleSegments(config, opts.sections, effectiveStrength);

    // Combine segments based on mode
    const styleText = this.combineSegments(styleSegments);

    // Apply injection mode
    const enhanced = this.applyInjectionMode(
      prompt,
      styleText,
      opts.mode,
      opts.preserveOriginal,
      opts.maxLength
    );

    return {
      original: prompt,
      enhanced,
      styleSegments,
      metadata: {
        configId: config.id,
        configName: config.name,
        injectionMode: opts.mode,
        strength: Math.round(effectiveStrength * 100),
        sectionsIncluded: opts.sections,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Style Segment Generation
  // -------------------------------------------------------------------------

  private generateStyleSegments(
    config: StyleDNAConfig,
    sections: InjectionSection[],
    strength: number
  ): InjectedPrompt['styleSegments'] {
    const segments: InjectedPrompt['styleSegments'] = [];

    for (const section of sections) {
      let text = '';
      const weight = strength;

      switch (section) {
        case 'color':
          text = this.generateColorSegment(config.colorPalette);
          break;
        case 'lighting':
          text = this.generateLightingSegment(config.lighting);
          break;
        case 'texture':
          text = this.generateTextureSegment(config.texture);
          break;
        case 'composition':
          text = this.generateCompositionSegment(config.composition);
          break;
        case 'mood':
          text = this.generateMoodSegment(config.mood);
          break;
        case 'keywords':
          text = this.generateKeywordsSegment(
            config.styleKeywords,
            config.avoidKeywords,
            config.artisticInfluences
          );
          break;
      }

      if (text.trim()) {
        segments.push({ section, text: text.trim(), weight });
      }
    }

    return segments;
  }

  private generateColorSegment(palette: ColorPalette): string {
    return this.colorTheory.generateColorPrompt(palette);
  }

  private generateLightingSegment(lighting: LightingProfile): string {
    const parts: string[] = [];

    // Lighting type
    const lightingDescriptions: Record<string, string> = {
      natural: 'natural lighting',
      dramatic: 'dramatic lighting with strong contrasts',
      soft: 'soft diffused lighting',
      harsh: 'harsh directional lighting',
      ambient: 'ambient environmental lighting',
      rim: 'rim lighting highlighting edges',
      volumetric: 'volumetric lighting with visible light rays',
      cinematic: 'cinematic film lighting',
      noir: 'film noir style lighting with deep shadows',
    };

    parts.push(lightingDescriptions[lighting.type] || `${lighting.type} lighting`);

    // Direction
    const directionDescriptions: Record<string, string> = {
      front: 'front-lit',
      side: 'side lighting',
      back: 'backlit',
      top: 'top-down lighting',
      bottom: 'underlighting',
      'three-point': 'three-point studio lighting',
      rembrandt: 'Rembrandt lighting',
    };

    if (lighting.direction !== 'three-point') {
      parts.push(directionDescriptions[lighting.direction] || lighting.direction);
    }

    // Contrast
    if (lighting.contrast > 70) {
      parts.push('high contrast');
    } else if (lighting.contrast < 30) {
      parts.push('low contrast');
    }

    // Time of day
    const timeDescriptions: Record<string, string> = {
      dawn: 'dawn light',
      morning: 'morning light',
      noon: 'midday sun',
      afternoon: 'afternoon light',
      'golden-hour': 'golden hour lighting',
      dusk: 'dusk light',
      night: 'nighttime',
      midnight: 'midnight darkness',
    };

    if (lighting.preferredTimeOfDay !== 'golden-hour') {
      parts.push(timeDescriptions[lighting.preferredTimeOfDay] || lighting.preferredTimeOfDay);
    }

    // Shadow quality
    if (lighting.shadows.softness > 70) {
      parts.push('soft shadows');
    } else if (lighting.shadows.softness < 30) {
      parts.push('hard shadows');
    }

    if (lighting.shadows.depth > 70) {
      parts.push('deep shadows');
    }

    // Highlights
    if (lighting.highlights.bloom > 50) {
      parts.push('blooming highlights');
    }

    if (lighting.highlights.specularity > 70) {
      parts.push('specular highlights');
    }

    return parts.join(', ');
  }

  private generateTextureSegment(texture: TextureProfile): string {
    const parts: string[] = [];

    // Primary texture style
    const textureDescriptions: Record<string, string> = {
      smooth: 'smooth clean textures',
      rough: 'rough organic textures',
      organic: 'organic natural textures',
      geometric: 'geometric patterns',
      painterly: 'painterly brush strokes',
      digital: 'clean digital art style',
      'film-grain': 'film grain texture',
      watercolor: 'watercolor texture',
      'oil-paint': 'oil painting texture',
      'pencil-sketch': 'pencil sketch texture',
    };

    parts.push(textureDescriptions[texture.primary] || texture.primary);

    // Secondary texture
    if (texture.secondary && texture.secondary !== texture.primary) {
      parts.push(`with ${textureDescriptions[texture.secondary] || texture.secondary} elements`);
    }

    // Grain
    if (texture.grain > 50) {
      parts.push('visible grain');
    }

    // Detail level
    if (texture.detail > 80) {
      parts.push('highly detailed');
    } else if (texture.detail < 30) {
      parts.push('minimalist detail');
    }

    // Material preferences
    if (texture.materialPreferences.length > 0) {
      parts.push(`featuring ${texture.materialPreferences.slice(0, 3).join(', ')} materials`);
    }

    return parts.join(', ');
  }

  private generateCompositionSegment(composition: CompositionRules): string {
    const parts: string[] = [];

    // Layout
    const layoutDescriptions: Record<string, string> = {
      'rule-of-thirds': 'rule of thirds composition',
      'golden-ratio': 'golden ratio composition',
      centered: 'centered composition',
      diagonal: 'diagonal composition',
      symmetrical: 'symmetrical composition',
      asymmetrical: 'dynamic asymmetrical composition',
      framing: 'natural framing elements',
      'leading-lines': 'leading lines guiding the eye',
    };

    parts.push(layoutDescriptions[composition.primaryLayout] || composition.primaryLayout);

    // Aspect ratio
    if (composition.aspectRatio !== '16:9') {
      parts.push(`${composition.aspectRatio} aspect ratio`);
    }

    // Depth of field
    const dofDescriptions: Record<string, string> = {
      deep: 'deep focus throughout',
      shallow: 'shallow depth of field',
      selective: 'selective focus',
      'tilt-shift': 'tilt-shift effect',
    };

    if (composition.depthOfField !== 'selective') {
      parts.push(dofDescriptions[composition.depthOfField] || composition.depthOfField);
    }

    // Negative space
    if (composition.negativeSpacePreference > 70) {
      parts.push('generous negative space');
    }

    return parts.join(', ');
  }

  private generateMoodSegment(mood: MoodDefinition): string {
    const parts: string[] = [];

    // Primary mood
    parts.push(`${mood.primary} atmosphere`);

    // Secondary mood
    if (mood.secondary) {
      parts.push(`with ${mood.secondary} undertones`);
    }

    // Emotional tone
    if (mood.emotionalTone && mood.emotionalTone !== mood.primary) {
      parts.push(`evoking ${mood.emotionalTone}`);
    }

    // Intensity modifiers
    if (mood.intensity >= 4) {
      parts.unshift('intensely');
    } else if (mood.intensity <= 2) {
      parts.unshift('subtly');
    }

    return parts.join(' ');
  }

  private generateKeywordsSegment(
    styleKeywords: string[],
    avoidKeywords: string[],
    artisticInfluences: string[]
  ): string {
    const parts: string[] = [];

    // Style keywords
    if (styleKeywords.length > 0) {
      parts.push(styleKeywords.slice(0, 5).join(', '));
    }

    // Artistic influences
    if (artisticInfluences.length > 0) {
      parts.push(`influenced by ${artisticInfluences.slice(0, 3).join(', ')}`);
    }

    // Negative prompt elements are handled separately
    // avoidKeywords would be used for negative prompts

    return parts.join(', ');
  }

  // -------------------------------------------------------------------------
  // Segment Combination
  // -------------------------------------------------------------------------

  private combineSegments(segments: InjectedPrompt['styleSegments']): string {
    if (segments.length === 0) return '';

    // Order by importance
    const sectionOrder: InjectionSection[] = [
      'mood',
      'lighting',
      'color',
      'texture',
      'composition',
      'keywords',
    ];

    const ordered = [...segments].sort((a, b) => {
      return sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section);
    });

    return ordered.map(s => s.text).join(', ');
  }

  private applyInjectionMode(
    original: string,
    style: string,
    mode: InjectionMode,
    preserveOriginal: boolean,
    maxLength: number
  ): string {
    if (!style) return original;

    let result: string;

    switch (mode) {
      case 'prefix':
        result = `${style}, ${original}`;
        break;

      case 'suffix':
        result = `${original}, ${style}`;
        break;

      case 'wrap':
        result = `${style}, ${original}, maintaining ${style.split(',')[0]}`;
        break;

      case 'blend':
        // Insert style keywords throughout the prompt
        const words = original.split(' ');
        const styleWords = style.split(', ');
        const interval = Math.ceil(words.length / (styleWords.length + 1));

        const blended: string[] = [];
        let styleIdx = 0;

        for (let i = 0; i < words.length; i++) {
          blended.push(words[i]);
          if ((i + 1) % interval === 0 && styleIdx < styleWords.length) {
            blended.push(styleWords[styleIdx++]);
          }
        }

        // Add remaining style words at the end
        while (styleIdx < styleWords.length) {
          blended.push(styleWords[styleIdx++]);
        }

        result = blended.join(' ');
        break;

      default:
        result = `${style}, ${original}`;
    }

    // Truncate if needed
    if (result.length > maxLength) {
      if (preserveOriginal) {
        // Prioritize original prompt
        const availableForStyle = maxLength - original.length - 2;
        if (availableForStyle > 50) {
          result = `${style.slice(0, availableForStyle)}..., ${original}`;
        } else {
          result = original.slice(0, maxLength);
        }
      } else {
        result = result.slice(0, maxLength - 3) + '...';
      }
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Negative Prompt Generation
  // -------------------------------------------------------------------------

  generateNegativePrompt(config: StyleDNAConfig): string {
    const negatives: string[] = [...config.avoidKeywords];

    // Add implicit negatives based on style choices
    if (config.lighting.type === 'soft') {
      negatives.push('harsh lighting', 'high contrast');
    }

    if (config.texture.primary === 'smooth') {
      negatives.push('rough texture', 'visible brush strokes');
    }

    if (config.mood.primary === 'calm') {
      negatives.push('chaotic', 'busy', 'cluttered');
    }

    // Standard quality negatives
    negatives.push(
      'low quality',
      'blurry',
      'distorted',
      'deformed'
    );

    return [...new Set(negatives)].join(', ');
  }

  // -------------------------------------------------------------------------
  // Template System
  // -------------------------------------------------------------------------

  private initializeTemplates(): void {
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'scene',
        name: 'Scene Description',
        template: '{setting} with {characters}, {action}, {mood}',
        variables: ['setting', 'characters', 'action', 'mood'],
      },
      {
        id: 'character-portrait',
        name: 'Character Portrait',
        template: 'Portrait of {character}, {expression}, {lighting}, {background}',
        variables: ['character', 'expression', 'lighting', 'background'],
      },
      {
        id: 'environment',
        name: 'Environment',
        template: '{location}, {time_of_day}, {weather}, {atmosphere}',
        variables: ['location', 'time_of_day', 'weather', 'atmosphere'],
      },
      {
        id: 'action-shot',
        name: 'Action Shot',
        template: '{character} {action} in {setting}, dynamic pose, {emotion}',
        variables: ['character', 'action', 'setting', 'emotion'],
      },
    ];

    defaultTemplates.forEach(t => this.templates.set(t.id, t));
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  applyTemplate(
    templateId: string,
    variables: Record<string, string>,
    options?: InjectionOptions
  ): InjectedPrompt | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    // Fill in template variables
    let prompt = template.template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    // Remove unfilled variables
    prompt = prompt.replace(/\{[^}]+\}/g, '').replace(/,\s*,/g, ',').trim();

    return this.inject(prompt, options);
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------

  getSectionDescription(section: InjectionSection): string {
    const descriptions: Record<InjectionSection, string> = {
      color: 'Color palette and harmony',
      lighting: 'Lighting type and direction',
      texture: 'Texture and material style',
      composition: 'Layout and framing rules',
      mood: 'Atmosphere and emotional tone',
      keywords: 'Style keywords and influences',
    };
    return descriptions[section];
  }

  getAllSections(): InjectionSection[] {
    return [...ALL_SECTIONS];
  }

  previewInjection(config: StyleDNAConfig, sections?: InjectionSection[]): string {
    const segments = this.generateStyleSegments(
      config,
      sections || ALL_SECTIONS,
      config.injectionStrength / 100
    );
    return this.combineSegments(segments);
  }
}

// Export singleton instance
export const styleInjector = StyleInjector.getInstance();
