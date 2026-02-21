/**
 * Style DNA Library
 *
 * Comprehensive visual fingerprinting system for capturing and applying
 * consistent art styles across all generated images in a story.
 */

// Style DNA - Main style definition system
export {
  styleDNA,
  StyleDNA,
  DEFAULT_LIGHTING,
  DEFAULT_TEXTURE,
  DEFAULT_COMPOSITION,
  DEFAULT_MOOD,
  type LightingType,
  type LightingDirection,
  type TimeOfDay,
  type TextureStyle,
  type CompositionType,
  type AspectRatio,
  type DepthOfField,
  type MoodIntensity,
  type LightingProfile,
  type TextureProfile,
  type CompositionRules,
  type MoodDefinition,
  type StyleReference,
  type ExtractedFeatures,
  type StyleDNAConfig,
  type StyleFingerprint,
} from './StyleDNA';

// Color Theory - Color palette management
export {
  colorTheory,
  ColorTheory,
  type ColorHarmony,
  type ColorTemperature,
  type ColorMood,
  type HSL,
  type RGB,
  type ColorSwatch,
  type ColorPalette,
  type ColorRule,
  type PaletteConstraints,
} from './ColorTheory';

// Style Injector - Automatic prompt enhancement
export {
  styleInjector,
  StyleInjector,
  type InjectionMode,
  type InjectionSection,
  type InjectionOptions,
  type InjectedPrompt,
  type PromptTemplate,
} from './StyleInjector';

// Style Variation Manager - Era, mood, and scene-type based variations
export {
  styleVariationManager,
  StyleVariationManager,
  DEFAULT_ERA_VARIATIONS,
  DEFAULT_MOOD_ADAPTATIONS,
  DEFAULT_SCENE_TYPE_RULES,
  type StoryEra,
  type EmotionalMood,
  type SceneType,
  type EraVariation,
  type MoodAdaptation,
  type SceneTypeRule,
  type StyleTransition,
  type VariationResult,
  type StyleVariationConfig,
} from './StyleVariationManager';
