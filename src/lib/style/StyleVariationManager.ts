/**
 * StyleVariationManager - Dynamic Style Evolution System
 *
 * Manages style variations across story eras, mood-based adaptations,
 * and scene-specific rules while maintaining visual coherence.
 */

import {
  type StyleDNAConfig,
  type LightingProfile,
  type MoodDefinition,
  DEFAULT_LIGHTING,
} from './StyleDNA';
import { colorTheory, type ColorPalette } from './ColorTheory';

// ============================================================================
// Types
// ============================================================================

export type StoryEra =
  | 'prologue'
  | 'act1'
  | 'act2-rising'
  | 'act2-midpoint'
  | 'act2-falling'
  | 'act3'
  | 'climax'
  | 'epilogue';

export type EmotionalMood =
  | 'neutral'
  | 'joyful'
  | 'melancholic'
  | 'tense'
  | 'romantic'
  | 'mysterious'
  | 'triumphant'
  | 'fearful'
  | 'peaceful'
  | 'angry'
  | 'hopeful'
  | 'desperate';

export type SceneType =
  | 'action'
  | 'dialogue'
  | 'romance'
  | 'mystery'
  | 'comedy'
  | 'tragedy'
  | 'battle'
  | 'flashback'
  | 'dream'
  | 'revelation'
  | 'transition'
  | 'establishing';

export interface EraVariation {
  era: StoryEra;
  name: string;
  description: string;
  colorShift: {
    saturation: number; // -50 to +50
    brightness: number; // -50 to +50
    warmth: number; // -50 to +50
    contrast: number; // -50 to +50
  };
  lightingAdjustments: Partial<LightingProfile>;
  moodOverlay?: Partial<MoodDefinition>;
  enabled: boolean;
}

export interface MoodAdaptation {
  mood: EmotionalMood;
  name: string;
  colorShift: {
    hueRotation: number; // -180 to +180
    saturation: number; // -50 to +50
    brightness: number; // -50 to +50
  };
  lightingMod: {
    intensity: number; // -30 to +30
    contrast: number; // -30 to +30
    warmth: number; // -50 to +50
  };
  keywords: string[];
  avoidKeywords: string[];
}

export interface SceneTypeRule {
  sceneType: SceneType;
  name: string;
  description: string;
  priority: number; // Higher overrides lower
  colorMods: {
    saturation: number;
    brightness: number;
    contrast: number;
  };
  lightingOverrides: Partial<LightingProfile>;
  compositionHints: string[];
  keywords: string[];
  enabled: boolean;
}

export interface StyleTransition {
  id: string;
  fromEra?: StoryEra;
  toEra?: StoryEra;
  fromMood?: EmotionalMood;
  toMood?: EmotionalMood;
  duration: 'instant' | 'gradual' | 'fade';
  steps: number; // Number of intermediate frames for gradual
}

export interface VariationResult {
  baseStyle: Partial<StyleDNAConfig>;
  appliedEra?: EraVariation;
  appliedMood?: MoodAdaptation;
  appliedSceneTypes: SceneTypeRule[];
  finalColorPalette: Partial<ColorPalette>;
  finalLighting: LightingProfile;
  additionalKeywords: string[];
  avoidKeywords: string[];
  promptModifier: string;
}

export interface StyleVariationConfig {
  id: string;
  name: string;
  baseStyleId: string;
  eraVariations: EraVariation[];
  moodAdaptations: Map<EmotionalMood, MoodAdaptation>;
  sceneTypeRules: Map<SceneType, SceneTypeRule>;
  transitions: StyleTransition[];
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_ERA_VARIATIONS: EraVariation[] = [
  {
    era: 'prologue',
    name: 'Prologue',
    description: 'Muted, nostalgic opening',
    colorShift: { saturation: -15, brightness: -5, warmth: 10, contrast: -10 },
    lightingAdjustments: { type: 'soft', contrast: 40 },
    moodOverlay: { primary: 'nostalgic', intensity: 2 },
    enabled: true,
  },
  {
    era: 'act1',
    name: 'Act 1 - Setup',
    description: 'Clear, establishing visuals',
    colorShift: { saturation: 0, brightness: 5, warmth: 5, contrast: 0 },
    lightingAdjustments: { type: 'natural', intensity: 70 },
    enabled: true,
  },
  {
    era: 'act2-rising',
    name: 'Act 2 - Rising Action',
    description: 'Building intensity',
    colorShift: { saturation: 10, brightness: 0, warmth: 0, contrast: 10 },
    lightingAdjustments: { contrast: 55 },
    enabled: true,
  },
  {
    era: 'act2-midpoint',
    name: 'Act 2 - Midpoint',
    description: 'Peak dramatic tension',
    colorShift: { saturation: 15, brightness: -5, warmth: -5, contrast: 20 },
    lightingAdjustments: { type: 'dramatic', contrast: 70 },
    moodOverlay: { intensity: 4 },
    enabled: true,
  },
  {
    era: 'act2-falling',
    name: 'Act 2 - Falling Action',
    description: 'Darker, uncertain period',
    colorShift: { saturation: -10, brightness: -15, warmth: -15, contrast: 15 },
    lightingAdjustments: { type: 'dramatic', shadows: { softness: 30, depth: 70 } },
    moodOverlay: { primary: 'tense', intensity: 4 },
    enabled: true,
  },
  {
    era: 'act3',
    name: 'Act 3 - Resolution',
    description: 'High contrast, clear stakes',
    colorShift: { saturation: 5, brightness: 0, warmth: 0, contrast: 25 },
    lightingAdjustments: { type: 'cinematic', contrast: 75 },
    enabled: true,
  },
  {
    era: 'climax',
    name: 'Climax',
    description: 'Maximum visual intensity',
    colorShift: { saturation: 20, brightness: -10, warmth: 0, contrast: 30 },
    lightingAdjustments: { type: 'dramatic', intensity: 85, contrast: 80 },
    moodOverlay: { intensity: 5 },
    enabled: true,
  },
  {
    era: 'epilogue',
    name: 'Epilogue',
    description: 'Soft, resolved conclusion',
    colorShift: { saturation: -5, brightness: 10, warmth: 20, contrast: -15 },
    lightingAdjustments: { type: 'soft', preferredTimeOfDay: 'golden-hour' },
    moodOverlay: { primary: 'peaceful', intensity: 3 },
    enabled: true,
  },
];

export const DEFAULT_MOOD_ADAPTATIONS: MoodAdaptation[] = [
  {
    mood: 'neutral',
    name: 'Neutral',
    colorShift: { hueRotation: 0, saturation: 0, brightness: 0 },
    lightingMod: { intensity: 0, contrast: 0, warmth: 0 },
    keywords: [],
    avoidKeywords: [],
  },
  {
    mood: 'joyful',
    name: 'Joyful',
    colorShift: { hueRotation: 10, saturation: 20, brightness: 15 },
    lightingMod: { intensity: 15, contrast: -10, warmth: 25 },
    keywords: ['bright', 'warm', 'cheerful', 'vibrant colors'],
    avoidKeywords: ['dark', 'gloomy', 'muted'],
  },
  {
    mood: 'melancholic',
    name: 'Melancholic',
    colorShift: { hueRotation: -20, saturation: -25, brightness: -15 },
    lightingMod: { intensity: -15, contrast: -10, warmth: -20 },
    keywords: ['muted', 'desaturated', 'soft shadows', 'overcast'],
    avoidKeywords: ['bright', 'vibrant', 'saturated'],
  },
  {
    mood: 'tense',
    name: 'Tense',
    colorShift: { hueRotation: -10, saturation: -10, brightness: -10 },
    lightingMod: { intensity: 0, contrast: 25, warmth: -15 },
    keywords: ['high contrast', 'harsh shadows', 'stark lighting'],
    avoidKeywords: ['soft', 'gentle', 'peaceful'],
  },
  {
    mood: 'romantic',
    name: 'Romantic',
    colorShift: { hueRotation: 15, saturation: 10, brightness: 5 },
    lightingMod: { intensity: -10, contrast: -15, warmth: 30 },
    keywords: ['soft glow', 'warm', 'intimate', 'dreamy bokeh'],
    avoidKeywords: ['harsh', 'cold', 'clinical'],
  },
  {
    mood: 'mysterious',
    name: 'Mysterious',
    colorShift: { hueRotation: -30, saturation: -15, brightness: -20 },
    lightingMod: { intensity: -20, contrast: 20, warmth: -25 },
    keywords: ['shadowy', 'obscured', 'fog', 'mysterious lighting'],
    avoidKeywords: ['clear', 'bright', 'well-lit'],
  },
  {
    mood: 'triumphant',
    name: 'Triumphant',
    colorShift: { hueRotation: 20, saturation: 25, brightness: 20 },
    lightingMod: { intensity: 25, contrast: 15, warmth: 20 },
    keywords: ['golden light', 'radiant', 'epic', 'heroic lighting'],
    avoidKeywords: ['dim', 'dark', 'muted'],
  },
  {
    mood: 'fearful',
    name: 'Fearful',
    colorShift: { hueRotation: -40, saturation: -20, brightness: -25 },
    lightingMod: { intensity: -25, contrast: 30, warmth: -30 },
    keywords: ['dark', 'ominous', 'deep shadows', 'unsettling'],
    avoidKeywords: ['bright', 'warm', 'comforting'],
  },
  {
    mood: 'peaceful',
    name: 'Peaceful',
    colorShift: { hueRotation: 5, saturation: -5, brightness: 10 },
    lightingMod: { intensity: -5, contrast: -20, warmth: 15 },
    keywords: ['soft', 'gentle', 'serene', 'calm lighting'],
    avoidKeywords: ['harsh', 'dramatic', 'intense'],
  },
  {
    mood: 'angry',
    name: 'Angry',
    colorShift: { hueRotation: -5, saturation: 15, brightness: -10 },
    lightingMod: { intensity: 10, contrast: 30, warmth: 10 },
    keywords: ['intense', 'harsh', 'red tones', 'aggressive lighting'],
    avoidKeywords: ['soft', 'peaceful', 'gentle'],
  },
  {
    mood: 'hopeful',
    name: 'Hopeful',
    colorShift: { hueRotation: 15, saturation: 10, brightness: 15 },
    lightingMod: { intensity: 10, contrast: -5, warmth: 20 },
    keywords: ['dawn light', 'warm', 'uplifting', 'rays of light'],
    avoidKeywords: ['dark', 'gloomy', 'bleak'],
  },
  {
    mood: 'desperate',
    name: 'Desperate',
    colorShift: { hueRotation: -25, saturation: -15, brightness: -20 },
    lightingMod: { intensity: -15, contrast: 25, warmth: -20 },
    keywords: ['harsh', 'stark', 'cold', 'unforgiving light'],
    avoidKeywords: ['warm', 'comfortable', 'soft'],
  },
];

export const DEFAULT_SCENE_TYPE_RULES: SceneTypeRule[] = [
  {
    sceneType: 'action',
    name: 'Action Scene',
    description: 'Dynamic, high-energy visuals',
    priority: 3,
    colorMods: { saturation: 15, brightness: 0, contrast: 20 },
    lightingOverrides: { type: 'dramatic', contrast: 70 },
    compositionHints: ['dynamic angles', 'motion blur', 'tight framing'],
    keywords: ['dynamic', 'motion', 'energy', 'action shot'],
    enabled: true,
  },
  {
    sceneType: 'dialogue',
    name: 'Dialogue Scene',
    description: 'Clear, character-focused',
    priority: 1,
    colorMods: { saturation: 0, brightness: 5, contrast: -5 },
    lightingOverrides: { type: 'soft' },
    compositionHints: ['medium shots', 'eye-level', 'clear faces'],
    keywords: ['conversational', 'intimate', 'character focus'],
    enabled: true,
  },
  {
    sceneType: 'romance',
    name: 'Romance Scene',
    description: 'Soft, intimate atmosphere',
    priority: 2,
    colorMods: { saturation: 5, brightness: 5, contrast: -15 },
    lightingOverrides: { type: 'soft', highlights: { bloom: 50, specularity: 30 } },
    compositionHints: ['shallow depth', 'soft focus', 'warm tones'],
    keywords: ['romantic', 'soft glow', 'intimate', 'dreamy'],
    enabled: true,
  },
  {
    sceneType: 'mystery',
    name: 'Mystery Scene',
    description: 'Shadowy, intriguing visuals',
    priority: 2,
    colorMods: { saturation: -15, brightness: -20, contrast: 25 },
    lightingOverrides: { type: 'noir', shadows: { softness: 20, depth: 80 } },
    compositionHints: ['obscured elements', 'silhouettes', 'partial views'],
    keywords: ['mysterious', 'shadowy', 'noir', 'intriguing'],
    enabled: true,
  },
  {
    sceneType: 'comedy',
    name: 'Comedy Scene',
    description: 'Bright, clear, energetic',
    priority: 1,
    colorMods: { saturation: 15, brightness: 15, contrast: -10 },
    lightingOverrides: { type: 'natural', intensity: 75 },
    compositionHints: ['wide shots', 'clear staging', 'expressive'],
    keywords: ['bright', 'cheerful', 'clear', 'lively'],
    enabled: true,
  },
  {
    sceneType: 'tragedy',
    name: 'Tragedy Scene',
    description: 'Heavy, emotional weight',
    priority: 3,
    colorMods: { saturation: -20, brightness: -15, contrast: 15 },
    lightingOverrides: { type: 'dramatic', preferredTimeOfDay: 'dusk' },
    compositionHints: ['isolated subjects', 'heavy shadows', 'weight'],
    keywords: ['somber', 'heavy', 'emotional', 'tragic'],
    enabled: true,
  },
  {
    sceneType: 'battle',
    name: 'Battle Scene',
    description: 'Chaotic, intense combat',
    priority: 4,
    colorMods: { saturation: 10, brightness: -10, contrast: 30 },
    lightingOverrides: { type: 'dramatic', intensity: 80, contrast: 80 },
    compositionHints: ['chaos', 'multiple focal points', 'scale'],
    keywords: ['epic', 'chaotic', 'intense', 'battle'],
    enabled: true,
  },
  {
    sceneType: 'flashback',
    name: 'Flashback Scene',
    description: 'Memory-like, nostalgic',
    priority: 2,
    colorMods: { saturation: -25, brightness: -5, contrast: -15 },
    lightingOverrides: { type: 'soft', highlights: { bloom: 40, specularity: 20 } },
    compositionHints: ['soft edges', 'vignette', 'faded'],
    keywords: ['nostalgic', 'memory', 'faded', 'dreamlike'],
    enabled: true,
  },
  {
    sceneType: 'dream',
    name: 'Dream Sequence',
    description: 'Surreal, ethereal quality',
    priority: 3,
    colorMods: { saturation: 10, brightness: 10, contrast: -20 },
    lightingOverrides: { type: 'soft', highlights: { bloom: 60, specularity: 40 } },
    compositionHints: ['surreal elements', 'soft focus', 'floating'],
    keywords: ['dreamlike', 'ethereal', 'surreal', 'soft glow'],
    enabled: true,
  },
  {
    sceneType: 'revelation',
    name: 'Revelation Scene',
    description: 'Dramatic reveal moment',
    priority: 4,
    colorMods: { saturation: 15, brightness: 5, contrast: 25 },
    lightingOverrides: { type: 'dramatic', direction: 'back' },
    compositionHints: ['dramatic framing', 'spotlight', 'focus'],
    keywords: ['dramatic', 'revelation', 'spotlight', 'intense'],
    enabled: true,
  },
  {
    sceneType: 'transition',
    name: 'Transition Scene',
    description: 'Neutral, bridging moments',
    priority: 0,
    colorMods: { saturation: 0, brightness: 0, contrast: 0 },
    lightingOverrides: {},
    compositionHints: ['establishing', 'neutral', 'bridging'],
    keywords: ['neutral', 'calm', 'transition'],
    enabled: true,
  },
  {
    sceneType: 'establishing',
    name: 'Establishing Shot',
    description: 'Wide, contextual view',
    priority: 1,
    colorMods: { saturation: 5, brightness: 5, contrast: 5 },
    lightingOverrides: { type: 'natural' },
    compositionHints: ['wide angle', 'environment focus', 'scale'],
    keywords: ['wide shot', 'establishing', 'environment', 'scale'],
    enabled: true,
  },
];

// ============================================================================
// StyleVariationManager Class
// ============================================================================

export class StyleVariationManager {
  private static instance: StyleVariationManager;
  private configs: Map<string, StyleVariationConfig> = new Map();
  private activeConfigId: string | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): StyleVariationManager {
    if (!StyleVariationManager.instance) {
      StyleVariationManager.instance = new StyleVariationManager();
    }
    return StyleVariationManager.instance;
  }

  // -------------------------------------------------------------------------
  // Configuration Management
  // -------------------------------------------------------------------------

  createConfig(name: string, baseStyleId: string): StyleVariationConfig {
    const id = `style_var_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();

    const config: StyleVariationConfig = {
      id,
      name,
      baseStyleId,
      eraVariations: [...DEFAULT_ERA_VARIATIONS],
      moodAdaptations: new Map(DEFAULT_MOOD_ADAPTATIONS.map(m => [m.mood, m])),
      sceneTypeRules: new Map(DEFAULT_SCENE_TYPE_RULES.map(r => [r.sceneType, r])),
      transitions: [],
      createdAt: now,
      updatedAt: now,
    };

    this.configs.set(id, config);
    this.saveToStorage();
    return config;
  }

  getConfig(id: string): StyleVariationConfig | undefined {
    return this.configs.get(id);
  }

  getAllConfigs(): StyleVariationConfig[] {
    return Array.from(this.configs.values());
  }

  updateConfig(id: string, updates: Partial<StyleVariationConfig>): StyleVariationConfig | undefined {
    const config = this.configs.get(id);
    if (!config) return undefined;

    const updated: StyleVariationConfig = {
      ...config,
      ...updates,
      updatedAt: Date.now(),
    };

    this.configs.set(id, updated);
    this.saveToStorage();
    return updated;
  }

  deleteConfig(id: string): boolean {
    const deleted = this.configs.delete(id);
    if (deleted) {
      if (this.activeConfigId === id) {
        this.activeConfigId = null;
      }
      this.saveToStorage();
    }
    return deleted;
  }

  setActiveConfig(id: string | null): void {
    this.activeConfigId = id;
    this.saveToStorage();
  }

  getActiveConfig(): StyleVariationConfig | undefined {
    if (!this.activeConfigId) return undefined;
    return this.configs.get(this.activeConfigId);
  }

  // -------------------------------------------------------------------------
  // Era Variation Management
  // -------------------------------------------------------------------------

  updateEraVariation(configId: string, era: StoryEra, updates: Partial<EraVariation>): boolean {
    const config = this.configs.get(configId);
    if (!config) return false;

    const index = config.eraVariations.findIndex(v => v.era === era);
    if (index === -1) return false;

    config.eraVariations[index] = { ...config.eraVariations[index], ...updates };
    config.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  getEraVariation(configId: string, era: StoryEra): EraVariation | undefined {
    const config = this.configs.get(configId);
    return config?.eraVariations.find(v => v.era === era);
  }

  // -------------------------------------------------------------------------
  // Mood Adaptation Management
  // -------------------------------------------------------------------------

  updateMoodAdaptation(configId: string, mood: EmotionalMood, updates: Partial<MoodAdaptation>): boolean {
    const config = this.configs.get(configId);
    if (!config) return false;

    const existing = config.moodAdaptations.get(mood);
    if (!existing) return false;

    config.moodAdaptations.set(mood, { ...existing, ...updates });
    config.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  getMoodAdaptation(configId: string, mood: EmotionalMood): MoodAdaptation | undefined {
    const config = this.configs.get(configId);
    return config?.moodAdaptations.get(mood);
  }

  // -------------------------------------------------------------------------
  // Scene Type Rules Management
  // -------------------------------------------------------------------------

  updateSceneTypeRule(configId: string, sceneType: SceneType, updates: Partial<SceneTypeRule>): boolean {
    const config = this.configs.get(configId);
    if (!config) return false;

    const existing = config.sceneTypeRules.get(sceneType);
    if (!existing) return false;

    config.sceneTypeRules.set(sceneType, { ...existing, ...updates });
    config.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  getSceneTypeRule(configId: string, sceneType: SceneType): SceneTypeRule | undefined {
    const config = this.configs.get(configId);
    return config?.sceneTypeRules.get(sceneType);
  }

  // -------------------------------------------------------------------------
  // Style Application
  // -------------------------------------------------------------------------

  applyVariations(
    baseStyle: Partial<StyleDNAConfig>,
    configId: string,
    options: {
      era?: StoryEra;
      mood?: EmotionalMood;
      sceneTypes?: SceneType[];
    }
  ): VariationResult {
    const config = this.configs.get(configId);
    const { era, mood, sceneTypes = [] } = options;

    // Start with base values
    let saturationMod = 0;
    let brightnessMod = 0;
    let contrastMod = 0;
    let warmthMod = 0;
    let hueRotation = 0;
    let lightingMods: Partial<LightingProfile> = {};
    const additionalKeywords: string[] = [];
    const avoidKeywords: string[] = [];

    let appliedEra: EraVariation | undefined;
    let appliedMood: MoodAdaptation | undefined;
    const appliedSceneTypes: SceneTypeRule[] = [];

    // Apply era variation
    if (era && config) {
      const eraVar = config.eraVariations.find(v => v.era === era && v.enabled);
      if (eraVar) {
        appliedEra = eraVar;
        saturationMod += eraVar.colorShift.saturation;
        brightnessMod += eraVar.colorShift.brightness;
        contrastMod += eraVar.colorShift.contrast;
        warmthMod += eraVar.colorShift.warmth;
        lightingMods = { ...lightingMods, ...eraVar.lightingAdjustments };
      }
    }

    // Apply mood adaptation
    if (mood && config) {
      const moodAdapt = config.moodAdaptations.get(mood);
      if (moodAdapt) {
        appliedMood = moodAdapt;
        hueRotation += moodAdapt.colorShift.hueRotation;
        saturationMod += moodAdapt.colorShift.saturation;
        brightnessMod += moodAdapt.colorShift.brightness;
        warmthMod += moodAdapt.lightingMod.warmth;
        additionalKeywords.push(...moodAdapt.keywords);
        avoidKeywords.push(...moodAdapt.avoidKeywords);
      }
    }

    // Apply scene type rules (sorted by priority)
    if (sceneTypes.length > 0 && config) {
      const rules = sceneTypes
        .map(st => config.sceneTypeRules.get(st))
        .filter((r): r is SceneTypeRule => r !== undefined && r.enabled)
        .sort((a, b) => b.priority - a.priority);

      for (const rule of rules) {
        appliedSceneTypes.push(rule);
        saturationMod += rule.colorMods.saturation;
        brightnessMod += rule.colorMods.brightness;
        contrastMod += rule.colorMods.contrast;
        lightingMods = { ...lightingMods, ...rule.lightingOverrides };
        additionalKeywords.push(...rule.keywords);
      }
    }

    // Apply color modifications
    const finalColorPalette = this.applyColorModifications(
      baseStyle.colorPalette,
      { saturationMod, brightnessMod, hueRotation }
    );

    // Apply lighting modifications
    const finalLighting = this.applyLightingModifications(
      baseStyle.lighting || DEFAULT_LIGHTING,
      lightingMods,
      contrastMod
    );

    // Generate prompt modifier
    const promptModifier = this.generatePromptModifier(
      appliedEra,
      appliedMood,
      appliedSceneTypes,
      additionalKeywords
    );

    return {
      baseStyle,
      appliedEra,
      appliedMood,
      appliedSceneTypes,
      finalColorPalette,
      finalLighting,
      additionalKeywords: [...new Set(additionalKeywords)],
      avoidKeywords: [...new Set(avoidKeywords)],
      promptModifier,
    };
  }

  private applyColorModifications(
    palette: ColorPalette | undefined,
    mods: { saturationMod: number; brightnessMod: number; hueRotation: number }
  ): Partial<ColorPalette> {
    if (!palette) {
      return {};
    }

    const modifyColor = (hex: string): string => {
      let modified = hex;

      if (mods.hueRotation !== 0) {
        modified = colorTheory.shiftHue(modified, mods.hueRotation);
      }

      if (mods.saturationMod > 0) {
        modified = colorTheory.saturate(modified, mods.saturationMod);
      } else if (mods.saturationMod < 0) {
        modified = colorTheory.desaturate(modified, Math.abs(mods.saturationMod));
      }

      if (mods.brightnessMod > 0) {
        modified = colorTheory.lighten(modified, mods.brightnessMod);
      } else if (mods.brightnessMod < 0) {
        modified = colorTheory.darken(modified, Math.abs(mods.brightnessMod));
      }

      return modified;
    };

    return {
      primary: modifyColor(palette.primary),
      secondary: palette.secondary ? modifyColor(palette.secondary) : undefined,
      accent: palette.accent ? modifyColor(palette.accent) : undefined,
      harmony: palette.harmony,
      temperature: palette.temperature,
    };
  }

  private applyLightingModifications(
    baseLighting: LightingProfile,
    mods: Partial<LightingProfile>,
    contrastMod: number
  ): LightingProfile {
    return {
      ...baseLighting,
      ...mods,
      contrast: Math.max(0, Math.min(100, baseLighting.contrast + contrastMod)),
      shadows: {
        ...baseLighting.shadows,
        ...mods.shadows,
      },
      highlights: {
        ...baseLighting.highlights,
        ...mods.highlights,
      },
    };
  }

  private generatePromptModifier(
    era: EraVariation | undefined,
    mood: MoodAdaptation | undefined,
    sceneTypes: SceneTypeRule[],
    keywords: string[]
  ): string {
    const parts: string[] = [];

    if (era) {
      parts.push(`${era.name.toLowerCase()} atmosphere`);
    }

    if (mood && mood.mood !== 'neutral') {
      parts.push(`${mood.name.toLowerCase()} mood`);
    }

    if (sceneTypes.length > 0) {
      const primaryScene = sceneTypes[0];
      parts.push(`${primaryScene.name.toLowerCase()}`);
    }

    if (keywords.length > 0) {
      parts.push(keywords.slice(0, 3).join(', '));
    }

    return parts.join(', ');
  }

  // -------------------------------------------------------------------------
  // Preview Generation
  // -------------------------------------------------------------------------

  previewVariation(
    baseStyle: Partial<StyleDNAConfig>,
    configId: string,
    options: {
      era?: StoryEra;
      mood?: EmotionalMood;
      sceneTypes?: SceneType[];
    }
  ): {
    before: { colors: string[]; lighting: string; mood: string };
    after: { colors: string[]; lighting: string; mood: string; modifiers: string };
  } {
    const result = this.applyVariations(baseStyle, configId, options);

    const before = {
      colors: baseStyle.colorPalette
        ? [baseStyle.colorPalette.primary, baseStyle.colorPalette.secondary, baseStyle.colorPalette.accent].filter(Boolean) as string[]
        : [],
      lighting: baseStyle.lighting?.type || 'natural',
      mood: baseStyle.mood?.primary || 'neutral',
    };

    const after = {
      colors: [result.finalColorPalette.primary, result.finalColorPalette.secondary, result.finalColorPalette.accent].filter(Boolean) as string[],
      lighting: result.finalLighting.type,
      mood: result.appliedMood?.name || before.mood,
      modifiers: result.promptModifier,
    };

    return { before, after };
  }

  // -------------------------------------------------------------------------
  // Transition Helpers
  // -------------------------------------------------------------------------

  addTransition(configId: string, transition: Omit<StyleTransition, 'id'>): StyleTransition | undefined {
    const config = this.configs.get(configId);
    if (!config) return undefined;

    const newTransition: StyleTransition = {
      ...transition,
      id: `trans_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    };

    config.transitions.push(newTransition);
    config.updatedAt = Date.now();
    this.saveToStorage();
    return newTransition;
  }

  removeTransition(configId: string, transitionId: string): boolean {
    const config = this.configs.get(configId);
    if (!config) return false;

    const index = config.transitions.findIndex(t => t.id === transitionId);
    if (index === -1) return false;

    config.transitions.splice(index, 1);
    config.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  // -------------------------------------------------------------------------
  // Storage
  // -------------------------------------------------------------------------

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('styleVariation_configs');
      if (stored) {
        const data = JSON.parse(stored);

        // Reconstruct configs with Map objects
        for (const [id, config] of Object.entries(data.configs || {})) {
          const typedConfig = config as StyleVariationConfig & {
            moodAdaptations: [EmotionalMood, MoodAdaptation][];
            sceneTypeRules: [SceneType, SceneTypeRule][];
          };

          this.configs.set(id, {
            ...typedConfig,
            moodAdaptations: new Map(typedConfig.moodAdaptations || []),
            sceneTypeRules: new Map(typedConfig.sceneTypeRules || []),
          });
        }

        this.activeConfigId = data.activeConfigId || null;
      }
    } catch (err) {
      console.error('Failed to load StyleVariationManager from storage:', err);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Convert Maps to arrays for JSON serialization
      const configsForStorage: Record<string, unknown> = {};

      for (const [id, config] of this.configs) {
        configsForStorage[id] = {
          ...config,
          moodAdaptations: Array.from(config.moodAdaptations.entries()),
          sceneTypeRules: Array.from(config.sceneTypeRules.entries()),
        };
      }

      const data = {
        configs: configsForStorage,
        activeConfigId: this.activeConfigId,
      };

      localStorage.setItem('styleVariation_configs', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save StyleVariationManager to storage:', err);
    }
  }
}

// Export singleton instance
export const styleVariationManager = StyleVariationManager.getInstance();
