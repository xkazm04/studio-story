/**
 * StyleEngine - Cross-Character Style Consistency Engine
 *
 * Ensures visual harmony across the entire character cast by:
 * - Defining project-wide style constraints
 * - Calculating style similarity scores between characters
 * - Detecting style deviations and conflicts
 * - Providing style transfer capabilities
 * - Managing color palette enforcement
 */

// ============================================================================
// Types
// ============================================================================

export type ArtDirection =
  | 'anime'
  | 'realistic'
  | 'painterly'
  | 'comic'
  | 'pixel'
  | 'chibi'
  | 'semi-realistic'
  | 'watercolor'
  | 'sketch'
  | 'custom';

export type ColorHarmonyType =
  | 'monochromatic'
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split-complementary'
  | 'tetradic';

export type LightingConsistency =
  | 'same'        // All characters share identical lighting
  | 'similar'     // Same type but slight variations
  | 'thematic'    // Varies by character role/faction
  | 'custom';     // User-defined per character

export type ConsistencyLevel = 'strict' | 'moderate' | 'loose';

export interface ColorPaletteConstraint {
  primaryColors: string[];      // Hex colors allowed as primaries
  secondaryColors: string[];    // Hex colors allowed as secondaries
  accentColors: string[];       // Hex colors for accents
  forbiddenColors: string[];    // Colors to avoid
  harmonyType: ColorHarmonyType;
  saturationRange: [number, number];  // 0-100
  brightnessRange: [number, number];  // 0-100
}

export interface LightingConstraint {
  type: string;
  direction: string;
  intensityRange: [number, number];
  shadowStyle: 'soft' | 'hard' | 'ambient';
  highlightStrength: number;  // 0-100
}

export interface StyleDefinition {
  id: string;
  name: string;
  description?: string;
  artDirection: ArtDirection;

  // Visual constraints
  colorPalette: ColorPaletteConstraint;
  lighting: LightingConstraint;

  // Prompt modifiers
  stylePromptPrefix: string;
  stylePromptSuffix: string;
  negativePrompt: string;

  // Style keywords
  styleKeywords: string[];
  avoidKeywords: string[];

  // Artistic references
  artisticInfluences: string[];
  referenceImages: StyleReferenceImage[];

  // Consistency settings
  consistencyLevel: ConsistencyLevel;
  lightingConsistency: LightingConsistency;

  // Metadata
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface StyleReferenceImage {
  id: string;
  url: string;
  characterId?: string;
  isReferenceCharacter: boolean;
  weight: number;  // 0-1
  extractedFeatures?: ExtractedStyleFeatures;
}

export interface ExtractedStyleFeatures {
  dominantColors: string[];
  colorHarmony: ColorHarmonyType;
  brightness: number;      // 0-100
  contrast: number;        // 0-100
  saturation: number;      // 0-100
  detectedArtStyle: ArtDirection[];
  styleVector?: number[];  // Numerical representation for comparison
}

export interface CharacterStyleProfile {
  characterId: string;
  characterName: string;
  avatarUrl?: string;
  thumbnailUrl?: string;

  // Style attributes
  extractedFeatures?: ExtractedStyleFeatures;
  appliedStyleId?: string;
  styleDeviationScore: number;  // 0-100, 0 = perfect match

  // Per-character overrides
  styleOverrides?: Partial<StyleDefinition>;

  // Metadata
  lastAnalyzedAt?: string;
  lastGeneratedAt?: string;
}

export interface StyleConsistencyReport {
  projectId: string;
  styleDefinitionId: string;
  analyzedAt: string;

  // Overall scores
  overallConsistencyScore: number;  // 0-100
  colorConsistencyScore: number;
  lightingConsistencyScore: number;
  artStyleConsistencyScore: number;

  // Character-level details
  characterScores: CharacterStyleScore[];

  // Issues detected
  deviations: StyleDeviation[];
  recommendations: StyleRecommendation[];
}

export interface CharacterStyleScore {
  characterId: string;
  characterName: string;
  overallScore: number;
  colorScore: number;
  lightingScore: number;
  artStyleScore: number;
  needsRegeneration: boolean;
}

export interface StyleDeviation {
  characterId: string;
  characterName: string;
  deviationType: 'color' | 'lighting' | 'artStyle' | 'composition';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface StyleRecommendation {
  type: 'regenerate' | 'adjust' | 'override';
  characterIds: string[];
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface BatchStyleConfig {
  styleDefinitionId: string;
  characterIds: string[];
  preserveIdentity: boolean;
  transferStrength: number;  // 0-100
  parallelGeneration: boolean;
  maxConcurrent: number;
}

export interface BatchStyleProgress {
  total: number;
  completed: number;
  failed: number;
  currentCharacterId?: string;
  currentCharacterName?: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  startedAt?: string;
  completedAt?: string;
  errors: Array<{ characterId: string; error: string }>;
}

// ============================================================================
// Preset Style Definitions
// ============================================================================

export const ART_DIRECTION_PRESETS: Record<ArtDirection, Partial<StyleDefinition>> = {
  anime: {
    artDirection: 'anime',
    stylePromptPrefix: 'anime style, high quality anime art, clean lines, vibrant colors,',
    stylePromptSuffix: ', anime aesthetic, japanese animation style',
    negativePrompt: 'realistic, photorealistic, western comic, 3d render, photograph',
    styleKeywords: ['anime', 'cel-shaded', 'large eyes', 'stylized features', 'vibrant'],
    avoidKeywords: ['realistic', 'photorealistic', 'hyper-detailed skin'],
    artisticInfluences: ['Studio Ghibli', 'Makoto Shinkai', 'Kyoto Animation'],
  },
  realistic: {
    artDirection: 'realistic',
    stylePromptPrefix: 'photorealistic portrait, highly detailed, lifelike,',
    stylePromptSuffix: ', professional photography, sharp focus, realistic lighting',
    negativePrompt: 'anime, cartoon, stylized, illustration, drawing, sketch',
    styleKeywords: ['photorealistic', 'detailed skin texture', 'natural lighting', 'lifelike'],
    avoidKeywords: ['anime', 'cartoon', 'cel-shaded', 'stylized'],
    artisticInfluences: ['Portrait photography', 'Renaissance portraiture'],
  },
  painterly: {
    artDirection: 'painterly',
    stylePromptPrefix: 'oil painting style, painterly, visible brushstrokes, artistic,',
    stylePromptSuffix: ', fine art portrait, classical painting technique',
    negativePrompt: 'photograph, photorealistic, anime, digital art, sharp edges',
    styleKeywords: ['painterly', 'brushstrokes', 'oil painting', 'artistic', 'textured'],
    avoidKeywords: ['photograph', 'digital', 'anime', 'flat colors'],
    artisticInfluences: ['John Singer Sargent', 'Rembrandt', 'Classical portraiture'],
  },
  comic: {
    artDirection: 'comic',
    stylePromptPrefix: 'comic book art style, bold lines, dynamic, western comic,',
    stylePromptSuffix: ', comic book aesthetic, graphic novel style',
    negativePrompt: 'anime, photorealistic, soft lines, watercolor, sketch',
    styleKeywords: ['comic book', 'bold outlines', 'dynamic pose', 'ink', 'graphic'],
    avoidKeywords: ['anime', 'photorealistic', 'watercolor'],
    artisticInfluences: ['Marvel Comics', 'DC Comics', 'Jim Lee', 'Alex Ross'],
  },
  pixel: {
    artDirection: 'pixel',
    stylePromptPrefix: 'pixel art, 16-bit style, retro gaming aesthetic, pixelated,',
    stylePromptSuffix: ', retro game character, pixel perfect',
    negativePrompt: 'high resolution, smooth, photorealistic, anti-aliased',
    styleKeywords: ['pixel art', '16-bit', '8-bit', 'retro', 'gaming'],
    avoidKeywords: ['smooth', 'photorealistic', 'high resolution'],
    artisticInfluences: ['Classic RPG sprites', 'Retro gaming'],
  },
  chibi: {
    artDirection: 'chibi',
    stylePromptPrefix: 'chibi style, super deformed, cute, big head small body,',
    stylePromptSuffix: ', kawaii, adorable character design',
    negativePrompt: 'realistic proportions, serious, photorealistic, dark',
    styleKeywords: ['chibi', 'cute', 'kawaii', 'big head', 'simplified'],
    avoidKeywords: ['realistic proportions', 'serious', 'dark', 'gritty'],
    artisticInfluences: ['Japanese chibi style', 'Nendoroid'],
  },
  'semi-realistic': {
    artDirection: 'semi-realistic',
    stylePromptPrefix: 'semi-realistic style, stylized realism, detailed but artistic,',
    stylePromptSuffix: ', balanced stylization, artistic portrait',
    negativePrompt: 'fully photorealistic, anime, cartoon, pixel art',
    styleKeywords: ['semi-realistic', 'stylized', 'artistic realism', 'balanced'],
    avoidKeywords: ['full photorealism', 'anime', 'cartoon'],
    artisticInfluences: ['Digital art masters', 'Concept art'],
  },
  watercolor: {
    artDirection: 'watercolor',
    stylePromptPrefix: 'watercolor painting, soft edges, color bleeding, artistic,',
    stylePromptSuffix: ', watercolor portrait, delicate brush technique',
    negativePrompt: 'sharp edges, digital art, photorealistic, hard lines',
    styleKeywords: ['watercolor', 'soft', 'flowing', 'delicate', 'transparent'],
    avoidKeywords: ['sharp', 'digital', 'hard edges', 'bold lines'],
    artisticInfluences: ['Traditional watercolor masters'],
  },
  sketch: {
    artDirection: 'sketch',
    stylePromptPrefix: 'pencil sketch, hand-drawn, artistic lines, sketchy style,',
    stylePromptSuffix: ', sketch portrait, artistic drawing',
    negativePrompt: 'colored, photorealistic, digital, clean lines',
    styleKeywords: ['sketch', 'pencil', 'hand-drawn', 'line art', 'graphite'],
    avoidKeywords: ['colored', 'digital', 'photorealistic'],
    artisticInfluences: ['Classical drawing techniques'],
  },
  custom: {
    artDirection: 'custom',
    stylePromptPrefix: '',
    stylePromptSuffix: '',
    negativePrompt: '',
    styleKeywords: [],
    avoidKeywords: [],
    artisticInfluences: [],
  },
};

export const DEFAULT_COLOR_PALETTE: ColorPaletteConstraint = {
  primaryColors: [],
  secondaryColors: [],
  accentColors: [],
  forbiddenColors: [],
  harmonyType: 'analogous',
  saturationRange: [30, 80],
  brightnessRange: [20, 90],
};

export const DEFAULT_LIGHTING: LightingConstraint = {
  type: 'natural',
  direction: 'three-point',
  intensityRange: [50, 80],
  shadowStyle: 'soft',
  highlightStrength: 50,
};

// ============================================================================
// Style Engine Functions
// ============================================================================

/**
 * Create a new style definition with defaults
 */
export function createStyleDefinition(
  name: string,
  artDirection: ArtDirection,
  overrides?: Partial<StyleDefinition>
): StyleDefinition {
  const preset = ART_DIRECTION_PRESETS[artDirection];
  const now = new Date().toISOString();

  return {
    id: `style-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    artDirection,
    colorPalette: DEFAULT_COLOR_PALETTE,
    lighting: DEFAULT_LIGHTING,
    stylePromptPrefix: preset.stylePromptPrefix || '',
    stylePromptSuffix: preset.stylePromptSuffix || '',
    negativePrompt: preset.negativePrompt || '',
    styleKeywords: preset.styleKeywords || [],
    avoidKeywords: preset.avoidKeywords || [],
    artisticInfluences: preset.artisticInfluences || [],
    referenceImages: [],
    consistencyLevel: 'moderate',
    lightingConsistency: 'similar',
    createdAt: now,
    updatedAt: now,
    version: 1,
    ...overrides,
  };
}

/**
 * Calculate color similarity between two hex colors
 */
export function calculateColorSimilarity(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  // Use weighted Euclidean distance in RGB space
  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;

  // Human eye is more sensitive to green, then red, then blue
  const distance = Math.sqrt(
    2 * rDiff * rDiff + 4 * gDiff * gDiff + 3 * bDiff * bDiff
  );

  // Normalize to 0-100 (max distance is ~764)
  const maxDistance = Math.sqrt(2 * 255 * 255 + 4 * 255 * 255 + 3 * 255 * 255);
  const similarity = 100 - (distance / maxDistance) * 100;

  return Math.round(similarity);
}

/**
 * Calculate palette similarity between two color arrays
 */
export function calculatePaletteSimilarity(
  palette1: string[],
  palette2: string[]
): number {
  if (palette1.length === 0 || palette2.length === 0) return 0;

  let totalSimilarity = 0;
  let comparisons = 0;

  for (const c1 of palette1) {
    let maxSim = 0;
    for (const c2 of palette2) {
      const sim = calculateColorSimilarity(c1, c2);
      maxSim = Math.max(maxSim, sim);
    }
    totalSimilarity += maxSim;
    comparisons++;
  }

  return comparisons > 0 ? Math.round(totalSimilarity / comparisons) : 0;
}

/**
 * Calculate overall style deviation score
 */
export function calculateStyleDeviation(
  profile: CharacterStyleProfile,
  definition: StyleDefinition
): number {
  if (!profile.extractedFeatures) return 100; // No features = maximum deviation

  const features = profile.extractedFeatures;
  let totalDeviation = 0;
  let weightSum = 0;

  // Color palette deviation (weight: 40%)
  if (definition.colorPalette.primaryColors.length > 0) {
    const paletteSim = calculatePaletteSimilarity(
      features.dominantColors,
      definition.colorPalette.primaryColors
    );
    totalDeviation += (100 - paletteSim) * 0.4;
    weightSum += 0.4;
  }

  // Art style match (weight: 35%)
  const styleMatch = features.detectedArtStyle.includes(definition.artDirection);
  totalDeviation += styleMatch ? 0 : 35;
  weightSum += 0.35;

  // Saturation range check (weight: 15%)
  const [minSat, maxSat] = definition.colorPalette.saturationRange;
  const satInRange = features.saturation >= minSat && features.saturation <= maxSat;
  totalDeviation += satInRange ? 0 : 15;
  weightSum += 0.15;

  // Brightness range check (weight: 10%)
  const [minBright, maxBright] = definition.colorPalette.brightnessRange;
  const brightInRange = features.brightness >= minBright && features.brightness <= maxBright;
  totalDeviation += brightInRange ? 0 : 10;
  weightSum += 0.1;

  return Math.min(100, Math.round(totalDeviation));
}

/**
 * Generate style-consistent prompt for a character
 */
export function generateStyledPrompt(
  basePrompt: string,
  definition: StyleDefinition,
  characterOverrides?: Partial<StyleDefinition>
): { prompt: string; negativePrompt: string } {
  const effectiveDefinition = {
    ...definition,
    ...characterOverrides,
  };

  // Build the full prompt
  const parts: string[] = [];

  // Add style prefix
  if (effectiveDefinition.stylePromptPrefix) {
    parts.push(effectiveDefinition.stylePromptPrefix);
  }

  // Add base prompt
  parts.push(basePrompt);

  // Add style keywords
  if (effectiveDefinition.styleKeywords.length > 0) {
    parts.push(effectiveDefinition.styleKeywords.join(', '));
  }

  // Add artistic influences
  if (effectiveDefinition.artisticInfluences.length > 0) {
    parts.push(`inspired by ${effectiveDefinition.artisticInfluences.join(', ')}`);
  }

  // Add lighting description
  const lightingDesc = `${effectiveDefinition.lighting.type} lighting, ${effectiveDefinition.lighting.direction} lighting direction, ${effectiveDefinition.lighting.shadowStyle} shadows`;
  parts.push(lightingDesc);

  // Add style suffix
  if (effectiveDefinition.stylePromptSuffix) {
    parts.push(effectiveDefinition.stylePromptSuffix);
  }

  // Build negative prompt
  const negativeParts: string[] = [];
  if (effectiveDefinition.negativePrompt) {
    negativeParts.push(effectiveDefinition.negativePrompt);
  }
  if (effectiveDefinition.avoidKeywords.length > 0) {
    negativeParts.push(effectiveDefinition.avoidKeywords.join(', '));
  }

  return {
    prompt: parts.filter(Boolean).join(', '),
    negativePrompt: negativeParts.filter(Boolean).join(', '),
  };
}

/**
 * Generate consistency report for a cast of characters
 */
export function generateConsistencyReport(
  projectId: string,
  definition: StyleDefinition,
  profiles: CharacterStyleProfile[]
): StyleConsistencyReport {
  const characterScores: CharacterStyleScore[] = [];
  const deviations: StyleDeviation[] = [];
  const recommendations: StyleRecommendation[] = [];

  let totalColorScore = 0;
  let totalLightingScore = 0;
  let totalArtStyleScore = 0;

  for (const profile of profiles) {
    const deviationScore = calculateStyleDeviation(profile, definition);
    const overallScore = 100 - deviationScore;

    // Calculate individual scores
    const colorScore = profile.extractedFeatures
      ? calculatePaletteSimilarity(
          profile.extractedFeatures.dominantColors,
          definition.colorPalette.primaryColors.length > 0
            ? definition.colorPalette.primaryColors
            : profile.extractedFeatures.dominantColors
        )
      : 0;

    const lightingScore = profile.extractedFeatures
      ? Math.round(profile.extractedFeatures.brightness)
      : 0;

    const artStyleScore = profile.extractedFeatures?.detectedArtStyle.includes(definition.artDirection)
      ? 100
      : 30;

    const needsRegeneration = overallScore < 60;

    characterScores.push({
      characterId: profile.characterId,
      characterName: profile.characterName,
      overallScore,
      colorScore,
      lightingScore,
      artStyleScore,
      needsRegeneration,
    });

    totalColorScore += colorScore;
    totalLightingScore += lightingScore;
    totalArtStyleScore += artStyleScore;

    // Detect specific deviations
    if (colorScore < 70 && profile.extractedFeatures) {
      deviations.push({
        characterId: profile.characterId,
        characterName: profile.characterName,
        deviationType: 'color',
        severity: colorScore < 50 ? 'high' : 'medium',
        description: `Color palette deviates ${100 - colorScore}% from project style`,
        suggestion: 'Regenerate with enforced color palette',
      });
    }

    if (artStyleScore < 70) {
      deviations.push({
        characterId: profile.characterId,
        characterName: profile.characterName,
        deviationType: 'artStyle',
        severity: 'high',
        description: `Art style doesn't match ${definition.artDirection} direction`,
        suggestion: `Regenerate with ${definition.artDirection} style preset`,
      });
    }
  }

  const profileCount = profiles.length || 1;

  // Generate recommendations
  const lowScoreCharacters = characterScores.filter(c => c.overallScore < 60);
  if (lowScoreCharacters.length > 0) {
    recommendations.push({
      type: 'regenerate',
      characterIds: lowScoreCharacters.map(c => c.characterId),
      description: `${lowScoreCharacters.length} characters need regeneration to match project style`,
      priority: 'high',
    });
  }

  const mediumScoreCharacters = characterScores.filter(c => c.overallScore >= 60 && c.overallScore < 80);
  if (mediumScoreCharacters.length > 0) {
    recommendations.push({
      type: 'adjust',
      characterIds: mediumScoreCharacters.map(c => c.characterId),
      description: `${mediumScoreCharacters.length} characters could benefit from style adjustments`,
      priority: 'medium',
    });
  }

  return {
    projectId,
    styleDefinitionId: definition.id,
    analyzedAt: new Date().toISOString(),
    overallConsistencyScore: Math.round(
      characterScores.reduce((sum, c) => sum + c.overallScore, 0) / profileCount
    ),
    colorConsistencyScore: Math.round(totalColorScore / profileCount),
    lightingConsistencyScore: Math.round(totalLightingScore / profileCount),
    artStyleConsistencyScore: Math.round(totalArtStyleScore / profileCount),
    characterScores,
    deviations,
    recommendations,
  };
}

/**
 * Prepare style transfer configuration
 */
export function prepareStyleTransfer(
  sourceProfile: CharacterStyleProfile,
  targetProfiles: CharacterStyleProfile[],
  definition: StyleDefinition,
  transferStrength: number
): { prompts: Map<string, { prompt: string; negativePrompt: string }> } {
  const prompts = new Map<string, { prompt: string; negativePrompt: string }>();

  for (const target of targetProfiles) {
    // Create a blended style that preserves character identity
    const basePrompt = `character portrait of ${target.characterName}`;

    const { prompt, negativePrompt } = generateStyledPrompt(
      basePrompt,
      definition
    );

    // Add identity preservation if strength is not 100%
    if (transferStrength < 100) {
      const preservationNote = `maintain distinct character features and identity,`;
      prompts.set(target.characterId, {
        prompt: `${preservationNote} ${prompt}`,
        negativePrompt,
      });
    } else {
      prompts.set(target.characterId, { prompt, negativePrompt });
    }
  }

  return { prompts };
}

// ============================================================================
// Utility Functions
// ============================================================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

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

/**
 * Check if a color is within the defined palette constraints
 */
export function isColorInPalette(
  color: string,
  palette: ColorPaletteConstraint,
  tolerance: number = 20
): boolean {
  const allAllowedColors = [
    ...palette.primaryColors,
    ...palette.secondaryColors,
    ...palette.accentColors,
  ];

  if (allAllowedColors.length === 0) return true;

  for (const allowedColor of allAllowedColors) {
    if (calculateColorSimilarity(color, allowedColor) >= (100 - tolerance)) {
      return true;
    }
  }

  // Check if in forbidden colors
  for (const forbidden of palette.forbiddenColors) {
    if (calculateColorSimilarity(color, forbidden) >= (100 - tolerance)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  PROJECT_STYLE: 'avatar-style-definition',
  CHARACTER_PROFILES: 'avatar-character-profiles',
  CONSISTENCY_REPORTS: 'avatar-consistency-reports',
} as const;

// ============================================================================
// Default Export
// ============================================================================

export default {
  createStyleDefinition,
  calculateColorSimilarity,
  calculatePaletteSimilarity,
  calculateStyleDeviation,
  generateStyledPrompt,
  generateConsistencyReport,
  prepareStyleTransfer,
  isColorInPalette,
  ART_DIRECTION_PRESETS,
  DEFAULT_COLOR_PALETTE,
  DEFAULT_LIGHTING,
  STORAGE_KEYS,
};
