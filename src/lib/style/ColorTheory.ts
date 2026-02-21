/**
 * ColorTheory - Advanced Color Palette Management
 *
 * Provides color theory utilities including harmony detection,
 * palette generation, and color analysis for style consistency.
 */

// ============================================================================
// Types
// ============================================================================

export type ColorHarmony =
  | 'monochromatic'
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic'
  | 'square'
  | 'custom';

export type ColorTemperature = 'warm' | 'cool' | 'neutral';

export type ColorMood =
  | 'energetic'
  | 'calm'
  | 'mysterious'
  | 'romantic'
  | 'professional'
  | 'playful'
  | 'dramatic'
  | 'natural';

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface ColorSwatch {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  name?: string;
  role?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'background' | 'text';
}

export interface ColorPalette {
  id: string;
  name: string;
  harmony: ColorHarmony;
  temperature: ColorTemperature;
  mood?: ColorMood;

  // Core colors
  primary: string;
  secondary?: string;
  accent?: string;

  // Extended palette
  swatches: ColorSwatch[];

  // Derived colors
  backgrounds: {
    primary: string;
    secondary: string;
    tertiary: string;
  };

  // Text colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };

  // UI colors
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
}

export interface ColorRule {
  type: 'contrast' | 'saturation' | 'lightness' | 'temperature';
  constraint: 'min' | 'max' | 'range';
  value: number | [number, number];
  description: string;
}

export interface PaletteConstraints {
  rules: ColorRule[];
  allowedHarmonies?: ColorHarmony[];
  preferredTemperature?: ColorTemperature;
  preferredMood?: ColorMood;
}

// ============================================================================
// Color Utility Functions
// ============================================================================

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(rgb: RGB): string {
  return '#' + [rgb.r, rgb.g, rgb.b]
    .map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
    .join('');
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const luminance = (rgb: RGB) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function getColorTemperature(hex: string): ColorTemperature {
  const rgb = hexToRgb(hex);
  const warmth = rgb.r - rgb.b;

  if (warmth > 30) return 'warm';
  if (warmth < -30) return 'cool';
  return 'neutral';
}

function getHueDifference(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

// ============================================================================
// ColorTheory Class
// ============================================================================

export class ColorTheory {
  private static instance: ColorTheory;
  private palettes: Map<string, ColorPalette> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ColorTheory {
    if (!ColorTheory.instance) {
      ColorTheory.instance = new ColorTheory();
    }
    return ColorTheory.instance;
  }

  // -------------------------------------------------------------------------
  // Color Conversions
  // -------------------------------------------------------------------------

  hexToRgb(hex: string): RGB {
    return hexToRgb(hex);
  }

  rgbToHex(rgb: RGB): string {
    return rgbToHex(rgb);
  }

  hexToHsl(hex: string): HSL {
    return rgbToHsl(hexToRgb(hex));
  }

  hslToHex(hsl: HSL): string {
    return rgbToHex(hslToRgb(hsl));
  }

  // -------------------------------------------------------------------------
  // Harmony Detection
  // -------------------------------------------------------------------------

  detectHarmony(colors: string[]): ColorHarmony {
    if (colors.length < 2) return 'monochromatic';

    const hslColors = colors.map(c => this.hexToHsl(c));
    const hues = hslColors.map(c => c.h);

    // Check for monochromatic (all similar hues)
    const hueRange = Math.max(...hues) - Math.min(...hues);
    if (hueRange < 30 || hueRange > 330) return 'monochromatic';

    // Check for complementary (opposite hues)
    if (colors.length === 2) {
      const hueDiff = getHueDifference(hues[0], hues[1]);
      if (hueDiff >= 150 && hueDiff <= 210) return 'complementary';
      if (hueDiff <= 60) return 'analogous';
    }

    // Check for triadic (120° apart)
    if (colors.length >= 3) {
      const sortedHues = [...hues].sort((a, b) => a - b);
      const diff1 = getHueDifference(sortedHues[0], sortedHues[1]);
      const diff2 = getHueDifference(sortedHues[1], sortedHues[2]);

      if (diff1 >= 100 && diff1 <= 140 && diff2 >= 100 && diff2 <= 140) {
        return 'triadic';
      }
    }

    // Check for analogous (adjacent hues)
    const maxDiff = hues.reduce((max, h, i) => {
      if (i === 0) return max;
      return Math.max(max, getHueDifference(h, hues[i - 1]));
    }, 0);

    if (maxDiff <= 60) return 'analogous';

    // Check for split-complementary
    if (colors.length >= 3) {
      const primary = hues[0];
      const others = hues.slice(1);
      const complement = (primary + 180) % 360;

      const isNearComplement = others.every(h => {
        const diff = getHueDifference(h, complement);
        return diff <= 45;
      });

      if (isNearComplement) return 'split-complementary';
    }

    return 'custom';
  }

  // -------------------------------------------------------------------------
  // Palette Generation
  // -------------------------------------------------------------------------

  createPalette(colors: string[], name?: string): ColorPalette {
    const id = `palette_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const primary = colors[0] || '#3b82f6';
    const secondary = colors[1];
    const accent = colors[2];

    const harmony = this.detectHarmony(colors);
    const temperature = this.getAverageTemperature(colors);

    const swatches: ColorSwatch[] = colors.map((hex, i) => ({
      hex,
      rgb: hexToRgb(hex),
      hsl: rgbToHsl(hexToRgb(hex)),
      role: i === 0 ? 'primary' : i === 1 ? 'secondary' : i === 2 ? 'accent' : 'neutral',
    }));

    const primaryHsl = this.hexToHsl(primary);

    const palette: ColorPalette = {
      id,
      name: name || `Palette ${id.slice(-6)}`,
      harmony,
      temperature,
      primary,
      secondary,
      accent,
      swatches,
      backgrounds: {
        primary: this.hslToHex({ ...primaryHsl, s: 10, l: 8 }),
        secondary: this.hslToHex({ ...primaryHsl, s: 12, l: 12 }),
        tertiary: this.hslToHex({ ...primaryHsl, s: 15, l: 18 }),
      },
      text: {
        primary: this.hslToHex({ ...primaryHsl, s: 10, l: 95 }),
        secondary: this.hslToHex({ ...primaryHsl, s: 10, l: 70 }),
        muted: this.hslToHex({ ...primaryHsl, s: 10, l: 50 }),
      },
    };

    this.palettes.set(id, palette);
    this.saveToStorage();
    return palette;
  }

  generateHarmoniousPalette(baseColor: string, harmony: ColorHarmony): ColorPalette {
    const baseHsl = this.hexToHsl(baseColor);
    const colors: string[] = [baseColor];

    switch (harmony) {
      case 'monochromatic':
        colors.push(
          this.hslToHex({ ...baseHsl, l: Math.min(baseHsl.l + 20, 90) }),
          this.hslToHex({ ...baseHsl, l: Math.max(baseHsl.l - 20, 10) })
        );
        break;

      case 'complementary':
        colors.push(this.hslToHex({ ...baseHsl, h: (baseHsl.h + 180) % 360 }));
        break;

      case 'analogous':
        colors.push(
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 30) % 360 }),
          this.hslToHex({ ...baseHsl, h: (baseHsl.h - 30 + 360) % 360 })
        );
        break;

      case 'triadic':
        colors.push(
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 120) % 360 }),
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 240) % 360 })
        );
        break;

      case 'split-complementary':
        colors.push(
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 150) % 360 }),
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 210) % 360 })
        );
        break;

      case 'tetradic':
        colors.push(
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 90) % 360 }),
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 180) % 360 }),
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 270) % 360 })
        );
        break;

      case 'square':
        colors.push(
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 90) % 360 }),
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 180) % 360 }),
          this.hslToHex({ ...baseHsl, h: (baseHsl.h + 270) % 360 })
        );
        break;

      default:
        break;
    }

    return this.createPalette(colors, `${harmony} palette`);
  }

  // -------------------------------------------------------------------------
  // Color Analysis
  // -------------------------------------------------------------------------

  getContrastRatio(color1: string, color2: string): number {
    return getContrastRatio(color1, color2);
  }

  isAccessible(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }

  getColorTemperature(hex: string): ColorTemperature {
    return getColorTemperature(hex);
  }

  getAverageTemperature(colors: string[]): ColorTemperature {
    if (colors.length === 0) return 'neutral';

    let warmCount = 0;
    let coolCount = 0;

    colors.forEach(color => {
      const temp = this.getColorTemperature(color);
      if (temp === 'warm') warmCount++;
      else if (temp === 'cool') coolCount++;
    });

    if (warmCount > coolCount) return 'warm';
    if (coolCount > warmCount) return 'cool';
    return 'neutral';
  }

  // -------------------------------------------------------------------------
  // Color Adjustment
  // -------------------------------------------------------------------------

  lighten(hex: string, amount: number): string {
    const hsl = this.hexToHsl(hex);
    return this.hslToHex({
      ...hsl,
      l: Math.min(100, hsl.l + amount),
    });
  }

  darken(hex: string, amount: number): string {
    const hsl = this.hexToHsl(hex);
    return this.hslToHex({
      ...hsl,
      l: Math.max(0, hsl.l - amount),
    });
  }

  saturate(hex: string, amount: number): string {
    const hsl = this.hexToHsl(hex);
    return this.hslToHex({
      ...hsl,
      s: Math.min(100, hsl.s + amount),
    });
  }

  desaturate(hex: string, amount: number): string {
    const hsl = this.hexToHsl(hex);
    return this.hslToHex({
      ...hsl,
      s: Math.max(0, hsl.s - amount),
    });
  }

  shiftHue(hex: string, degrees: number): string {
    const hsl = this.hexToHsl(hex);
    return this.hslToHex({
      ...hsl,
      h: (hsl.h + degrees + 360) % 360,
    });
  }

  mix(color1: string, color2: string, weight: number = 0.5): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    return this.rgbToHex({
      r: Math.round(rgb1.r * (1 - weight) + rgb2.r * weight),
      g: Math.round(rgb1.g * (1 - weight) + rgb2.g * weight),
      b: Math.round(rgb1.b * (1 - weight) + rgb2.b * weight),
    });
  }

  // -------------------------------------------------------------------------
  // Palette Management
  // -------------------------------------------------------------------------

  getPalette(id: string): ColorPalette | undefined {
    return this.palettes.get(id);
  }

  getAllPalettes(): ColorPalette[] {
    return Array.from(this.palettes.values());
  }

  deletePalette(id: string): boolean {
    const deleted = this.palettes.delete(id);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  // -------------------------------------------------------------------------
  // Prompt Generation
  // -------------------------------------------------------------------------

  generateColorPrompt(palette: ColorPalette): string {
    const parts: string[] = [];

    // Main colors
    const colorDescriptions: string[] = [];
    if (palette.primary) {
      const temp = this.getColorTemperature(palette.primary);
      colorDescriptions.push(`${temp} ${this.describeColor(palette.primary)} as the primary color`);
    }
    if (palette.secondary) {
      colorDescriptions.push(`${this.describeColor(palette.secondary)} as secondary`);
    }
    if (palette.accent) {
      colorDescriptions.push(`${this.describeColor(palette.accent)} accents`);
    }

    if (colorDescriptions.length > 0) {
      parts.push(`Color palette with ${colorDescriptions.join(', ')}`);
    }

    // Harmony
    if (palette.harmony !== 'custom') {
      parts.push(`${palette.harmony} color harmony`);
    }

    // Temperature
    parts.push(`${palette.temperature} color temperature`);

    // Mood
    if (palette.mood) {
      parts.push(`${palette.mood} mood`);
    }

    return parts.join(', ');
  }

  private describeColor(hex: string): string {
    const hsl = this.hexToHsl(hex);

    // Determine color name based on hue
    const hueNames: [number, string][] = [
      [15, 'red'],
      [45, 'orange'],
      [75, 'yellow'],
      [150, 'green'],
      [195, 'cyan'],
      [240, 'blue'],
      [285, 'purple'],
      [330, 'pink'],
      [360, 'red'],
    ];

    let colorName = 'neutral';
    if (hsl.s > 10) {
      for (const [maxHue, name] of hueNames) {
        if (hsl.h <= maxHue) {
          colorName = name;
          break;
        }
      }
    }

    // Add modifiers
    const modifiers: string[] = [];
    if (hsl.l < 30) modifiers.push('dark');
    else if (hsl.l > 70) modifiers.push('light');
    if (hsl.s < 30) modifiers.push('muted');
    else if (hsl.s > 70) modifiers.push('vibrant');

    return [...modifiers, colorName].join(' ');
  }

  // -------------------------------------------------------------------------
  // Storage
  // -------------------------------------------------------------------------

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('colorTheory_palettes');
      if (stored) {
        const data = JSON.parse(stored);
        this.palettes = new Map(Object.entries(data));
      }
    } catch (err) {
      console.error('Failed to load ColorTheory from storage:', err);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = Object.fromEntries(this.palettes);
      localStorage.setItem('colorTheory_palettes', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save ColorTheory to storage:', err);
    }
  }
}

// Export singleton instance
export const colorTheory = ColorTheory.getInstance();
