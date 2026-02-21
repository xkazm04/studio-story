/**
 * StyleDNA - Comprehensive Visual Fingerprinting System
 *
 * Captures the visual DNA of a story including color theory, lighting preferences,
 * texture patterns, and composition rules for automatic application across all generated images.
 */

import { ColorTheory, type ColorPalette, type ColorHarmony } from './ColorTheory';

// ============================================================================
// Types
// ============================================================================

export type LightingType =
  | 'natural'
  | 'dramatic'
  | 'soft'
  | 'harsh'
  | 'ambient'
  | 'rim'
  | 'volumetric'
  | 'cinematic'
  | 'noir';

export type LightingDirection =
  | 'front'
  | 'side'
  | 'back'
  | 'top'
  | 'bottom'
  | 'three-point'
  | 'rembrandt';

export type TimeOfDay =
  | 'dawn'
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'golden-hour'
  | 'dusk'
  | 'night'
  | 'midnight';

export type TextureStyle =
  | 'smooth'
  | 'rough'
  | 'organic'
  | 'geometric'
  | 'painterly'
  | 'digital'
  | 'film-grain'
  | 'watercolor'
  | 'oil-paint'
  | 'pencil-sketch';

export type CompositionType =
  | 'rule-of-thirds'
  | 'golden-ratio'
  | 'centered'
  | 'diagonal'
  | 'symmetrical'
  | 'asymmetrical'
  | 'framing'
  | 'leading-lines';

export type AspectRatio =
  | '1:1'
  | '4:3'
  | '16:9'
  | '2.35:1'
  | '9:16'
  | '3:2';

export type DepthOfField =
  | 'deep'
  | 'shallow'
  | 'selective'
  | 'tilt-shift';

export type MoodIntensity = 1 | 2 | 3 | 4 | 5;

export interface LightingProfile {
  type: LightingType;
  direction: LightingDirection;
  intensity: number; // 0-100
  contrast: number; // 0-100
  preferredTimeOfDay: TimeOfDay;
  shadows: {
    softness: number; // 0-100
    depth: number; // 0-100
  };
  highlights: {
    bloom: number; // 0-100
    specularity: number; // 0-100
  };
}

export interface TextureProfile {
  primary: TextureStyle;
  secondary?: TextureStyle;
  grain: number; // 0-100
  detail: number; // 0-100
  smoothness: number; // 0-100
  materialPreferences: string[];
}

export interface CompositionRules {
  primaryLayout: CompositionType;
  secondaryLayout?: CompositionType;
  aspectRatio: AspectRatio;
  depthOfField: DepthOfField;
  focalPointBias: {
    x: number; // -1 to 1 (left to right)
    y: number; // -1 to 1 (top to bottom)
  };
  headroom: number; // 0-100
  leadingSpace: number; // 0-100
  negativeSpacePreference: number; // 0-100
}

export interface MoodDefinition {
  primary: string;
  secondary?: string;
  intensity: MoodIntensity;
  emotionalTone: string;
  atmosphere: string;
}

export interface StyleReference {
  id: string;
  imageUrl: string;
  weight: number; // 0-1 influence weight
  extractedFeatures?: ExtractedFeatures;
  addedAt: number;
}

export interface ExtractedFeatures {
  dominantColors: string[];
  colorHarmony: ColorHarmony;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  detectedStyle: string[];
  detectedMood: string[];
}

export interface StyleDNAConfig {
  id: string;
  name: string;
  description?: string;
  version: number;
  createdAt: number;
  updatedAt: number;

  // Core DNA Components
  colorPalette: ColorPalette;
  lighting: LightingProfile;
  texture: TextureProfile;
  composition: CompositionRules;
  mood: MoodDefinition;

  // Style References
  references: StyleReference[];

  // Custom Modifiers
  styleKeywords: string[];
  avoidKeywords: string[];
  artisticInfluences: string[];

  // Auto-injection settings
  autoInject: boolean;
  injectionStrength: number; // 0-100
}

export interface StyleFingerprint {
  hash: string;
  colorSignature: string;
  lightingSignature: string;
  textureSignature: string;
  compositionSignature: string;
  generatedAt: number;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_LIGHTING: LightingProfile = {
  type: 'natural',
  direction: 'three-point',
  intensity: 70,
  contrast: 50,
  preferredTimeOfDay: 'golden-hour',
  shadows: {
    softness: 60,
    depth: 50,
  },
  highlights: {
    bloom: 30,
    specularity: 40,
  },
};

export const DEFAULT_TEXTURE: TextureProfile = {
  primary: 'digital',
  grain: 10,
  detail: 70,
  smoothness: 50,
  materialPreferences: [],
};

export const DEFAULT_COMPOSITION: CompositionRules = {
  primaryLayout: 'rule-of-thirds',
  aspectRatio: '16:9',
  depthOfField: 'selective',
  focalPointBias: { x: 0, y: 0 },
  headroom: 50,
  leadingSpace: 50,
  negativeSpacePreference: 40,
};

export const DEFAULT_MOOD: MoodDefinition = {
  primary: 'atmospheric',
  intensity: 3,
  emotionalTone: 'contemplative',
  atmosphere: 'immersive',
};

// ============================================================================
// StyleDNA Class
// ============================================================================

export class StyleDNA {
  private static instance: StyleDNA;
  private colorTheory: ColorTheory;
  private configs: Map<string, StyleDNAConfig> = new Map();
  private activeConfigId: string | null = null;

  private constructor() {
    this.colorTheory = ColorTheory.getInstance();
    this.loadFromStorage();
  }

  static getInstance(): StyleDNA {
    if (!StyleDNA.instance) {
      StyleDNA.instance = new StyleDNA();
    }
    return StyleDNA.instance;
  }

  // -------------------------------------------------------------------------
  // Configuration Management
  // -------------------------------------------------------------------------

  createConfig(name: string, baseConfig?: Partial<StyleDNAConfig>): StyleDNAConfig {
    const id = `style_dna_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();

    const config: StyleDNAConfig = {
      id,
      name,
      description: baseConfig?.description || '',
      version: 1,
      createdAt: now,
      updatedAt: now,
      colorPalette: baseConfig?.colorPalette || this.colorTheory.createPalette([]),
      lighting: baseConfig?.lighting || { ...DEFAULT_LIGHTING },
      texture: baseConfig?.texture || { ...DEFAULT_TEXTURE },
      composition: baseConfig?.composition || { ...DEFAULT_COMPOSITION },
      mood: baseConfig?.mood || { ...DEFAULT_MOOD },
      references: baseConfig?.references || [],
      styleKeywords: baseConfig?.styleKeywords || [],
      avoidKeywords: baseConfig?.avoidKeywords || [],
      artisticInfluences: baseConfig?.artisticInfluences || [],
      autoInject: baseConfig?.autoInject ?? true,
      injectionStrength: baseConfig?.injectionStrength ?? 75,
    };

    this.configs.set(id, config);
    this.saveToStorage();
    return config;
  }

  getConfig(id: string): StyleDNAConfig | undefined {
    return this.configs.get(id);
  }

  getAllConfigs(): StyleDNAConfig[] {
    return Array.from(this.configs.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  updateConfig(id: string, updates: Partial<Omit<StyleDNAConfig, 'id' | 'createdAt'>>): StyleDNAConfig | undefined {
    const config = this.configs.get(id);
    if (!config) return undefined;

    const updated: StyleDNAConfig = {
      ...config,
      ...updates,
      version: config.version + 1,
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

  getActiveConfig(): StyleDNAConfig | undefined {
    if (!this.activeConfigId) return undefined;
    return this.configs.get(this.activeConfigId);
  }

  // -------------------------------------------------------------------------
  // Style Extraction from Reference Images
  // -------------------------------------------------------------------------

  async extractFromImage(imageUrl: string): Promise<ExtractedFeatures> {
    // Create a canvas to analyze the image
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Sample at reduced resolution for performance
          const sampleSize = 100;
          canvas.width = sampleSize;
          canvas.height = sampleSize;
          ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

          const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
          const features = this.analyzeImageData(imageData);
          resolve(features);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  private analyzeImageData(imageData: ImageData): ExtractedFeatures {
    const pixels = imageData.data;
    const colorCounts = new Map<string, number>();
    let totalR = 0, totalG = 0, totalB = 0;
    let minLum = 255, maxLum = 0;
    let totalSat = 0;

    // Analyze pixels
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Quantize color for counting
      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;
      const colorKey = `${qr},${qg},${qb}`;
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);

      totalR += r;
      totalG += g;
      totalB += b;

      // Calculate luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      minLum = Math.min(minLum, lum);
      maxLum = Math.max(maxLum, lum);

      // Calculate saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      totalSat += sat;
    }

    const pixelCount = pixels.length / 4;
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;

    // Get dominant colors
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => {
        const [r, g, b] = color.split(',').map(Number);
        return this.rgbToHex(r, g, b);
      });

    // Calculate metrics
    const brightness = ((avgR + avgG + avgB) / 3 / 255) * 100;
    const contrast = ((maxLum - minLum) / 255) * 100;
    const saturation = (totalSat / pixelCount) * 100;
    const warmth = this.calculateWarmth(avgR, avgG, avgB);

    // Detect color harmony
    const colorHarmony = this.colorTheory.detectHarmony(sortedColors);

    // Detect style and mood based on metrics
    const detectedStyle = this.inferStyle(brightness, contrast, saturation);
    const detectedMood = this.inferMood(brightness, warmth, saturation);

    return {
      dominantColors: sortedColors,
      colorHarmony,
      brightness,
      contrast,
      saturation,
      warmth,
      detectedStyle,
      detectedMood,
    };
  }

  private calculateWarmth(r: number, g: number, b: number): number {
    // Warmth scale: -100 (cool/blue) to +100 (warm/orange)
    const warmBias = (r - b) / 255;
    return warmBias * 100;
  }

  private inferStyle(brightness: number, contrast: number, saturation: number): string[] {
    const styles: string[] = [];

    if (contrast > 70) styles.push('high-contrast', 'dramatic');
    else if (contrast < 30) styles.push('low-contrast', 'soft');

    if (saturation > 70) styles.push('vibrant', 'colorful');
    else if (saturation < 30) styles.push('muted', 'desaturated');

    if (brightness > 70) styles.push('bright', 'airy');
    else if (brightness < 30) styles.push('dark', 'moody');

    return styles;
  }

  private inferMood(brightness: number, warmth: number, saturation: number): string[] {
    const moods: string[] = [];

    if (warmth > 30) moods.push('warm', 'inviting');
    else if (warmth < -30) moods.push('cool', 'mysterious');

    if (brightness > 60 && saturation > 50) moods.push('cheerful', 'energetic');
    else if (brightness < 40 && saturation < 40) moods.push('melancholic', 'introspective');

    if (saturation > 60 && warmth > 0) moods.push('passionate', 'intense');

    return moods;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  // -------------------------------------------------------------------------
  // Fingerprint Generation
  // -------------------------------------------------------------------------

  generateFingerprint(config: StyleDNAConfig): StyleFingerprint {
    const colorSig = this.generateColorSignature(config.colorPalette);
    const lightingSig = this.generateLightingSignature(config.lighting);
    const textureSig = this.generateTextureSignature(config.texture);
    const compositionSig = this.generateCompositionSignature(config.composition);

    const combinedSig = `${colorSig}|${lightingSig}|${textureSig}|${compositionSig}`;
    const hash = this.simpleHash(combinedSig);

    return {
      hash,
      colorSignature: colorSig,
      lightingSignature: lightingSig,
      textureSignature: textureSig,
      compositionSignature: compositionSig,
      generatedAt: Date.now(),
    };
  }

  private generateColorSignature(palette: ColorPalette): string {
    const colors = [palette.primary, palette.secondary, palette.accent].filter(Boolean);
    return colors.join('-') + `_${palette.harmony}`;
  }

  private generateLightingSignature(lighting: LightingProfile): string {
    return `${lighting.type}_${lighting.direction}_i${lighting.intensity}_c${lighting.contrast}`;
  }

  private generateTextureSignature(texture: TextureProfile): string {
    return `${texture.primary}_g${texture.grain}_d${texture.detail}`;
  }

  private generateCompositionSignature(composition: CompositionRules): string {
    return `${composition.primaryLayout}_${composition.aspectRatio}_${composition.depthOfField}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // -------------------------------------------------------------------------
  // Style Presets
  // -------------------------------------------------------------------------

  getPresets(): Array<{ id: string; name: string; config: Partial<StyleDNAConfig> }> {
    return [
      {
        id: 'cinematic-drama',
        name: 'Cinematic Drama',
        config: {
          lighting: {
            ...DEFAULT_LIGHTING,
            type: 'cinematic',
            direction: 'side',
            contrast: 75,
            shadows: { softness: 40, depth: 70 },
          },
          texture: {
            ...DEFAULT_TEXTURE,
            primary: 'film-grain',
            grain: 25,
          },
          composition: {
            ...DEFAULT_COMPOSITION,
            aspectRatio: '2.35:1',
            depthOfField: 'shallow',
          },
          mood: {
            primary: 'dramatic',
            intensity: 4,
            emotionalTone: 'tense',
            atmosphere: 'immersive',
          },
          styleKeywords: ['cinematic', 'dramatic lighting', 'film grain', 'shallow depth of field'],
        },
      },
      {
        id: 'fantasy-ethereal',
        name: 'Fantasy Ethereal',
        config: {
          lighting: {
            ...DEFAULT_LIGHTING,
            type: 'soft',
            direction: 'back',
            intensity: 60,
            highlights: { bloom: 60, specularity: 50 },
          },
          texture: {
            ...DEFAULT_TEXTURE,
            primary: 'painterly',
            smoothness: 70,
          },
          composition: {
            ...DEFAULT_COMPOSITION,
            primaryLayout: 'golden-ratio',
            negativeSpacePreference: 60,
          },
          mood: {
            primary: 'ethereal',
            secondary: 'mysterious',
            intensity: 4,
            emotionalTone: 'wonder',
            atmosphere: 'magical',
          },
          styleKeywords: ['ethereal', 'soft glow', 'magical', 'painterly', 'dreamy'],
        },
      },
      {
        id: 'noir-mystery',
        name: 'Noir Mystery',
        config: {
          lighting: {
            ...DEFAULT_LIGHTING,
            type: 'noir',
            direction: 'side',
            contrast: 90,
            shadows: { softness: 20, depth: 90 },
            preferredTimeOfDay: 'night',
          },
          texture: {
            ...DEFAULT_TEXTURE,
            primary: 'film-grain',
            grain: 40,
          },
          mood: {
            primary: 'mysterious',
            secondary: 'tense',
            intensity: 5,
            emotionalTone: 'suspenseful',
            atmosphere: 'dark',
          },
          styleKeywords: ['film noir', 'high contrast', 'dramatic shadows', 'moody', 'black and white influence'],
          avoidKeywords: ['bright', 'colorful', 'cheerful'],
        },
      },
      {
        id: 'watercolor-whimsy',
        name: 'Watercolor Whimsy',
        config: {
          lighting: {
            ...DEFAULT_LIGHTING,
            type: 'soft',
            intensity: 55,
            contrast: 35,
          },
          texture: {
            ...DEFAULT_TEXTURE,
            primary: 'watercolor',
            smoothness: 30,
            detail: 50,
          },
          mood: {
            primary: 'whimsical',
            intensity: 3,
            emotionalTone: 'playful',
            atmosphere: 'light',
          },
          styleKeywords: ['watercolor', 'soft edges', 'delicate', 'illustration', 'storybook'],
        },
      },
      {
        id: 'sci-fi-tech',
        name: 'Sci-Fi Tech',
        config: {
          lighting: {
            ...DEFAULT_LIGHTING,
            type: 'volumetric',
            direction: 'back',
            intensity: 80,
            highlights: { bloom: 50, specularity: 70 },
          },
          texture: {
            ...DEFAULT_TEXTURE,
            primary: 'digital',
            detail: 90,
            materialPreferences: ['metal', 'glass', 'holographic'],
          },
          composition: {
            ...DEFAULT_COMPOSITION,
            primaryLayout: 'leading-lines',
          },
          mood: {
            primary: 'futuristic',
            intensity: 4,
            emotionalTone: 'awe',
            atmosphere: 'technological',
          },
          styleKeywords: ['sci-fi', 'futuristic', 'neon', 'holographic', 'sleek', 'high-tech'],
        },
      },
    ];
  }

  createFromPreset(presetId: string, name?: string): StyleDNAConfig | undefined {
    const preset = this.getPresets().find(p => p.id === presetId);
    if (!preset) return undefined;

    return this.createConfig(name || preset.name, preset.config);
  }

  // -------------------------------------------------------------------------
  // Storage
  // -------------------------------------------------------------------------

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('styleDNA_configs');
      if (stored) {
        const data = JSON.parse(stored);
        this.configs = new Map(Object.entries(data.configs || {}));
        this.activeConfigId = data.activeConfigId || null;
      }
    } catch (err) {
      console.error('Failed to load StyleDNA from storage:', err);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        configs: Object.fromEntries(this.configs),
        activeConfigId: this.activeConfigId,
      };
      localStorage.setItem('styleDNA_configs', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save StyleDNA to storage:', err);
    }
  }
}

// Export singleton instance
export const styleDNA = StyleDNA.getInstance();
