/**
 * Character Creator Module
 * Modular components for character creation with AI-powered image extraction
 */

// Main form components
export { default as CharacterAppearanceForm } from './CharacterAppearanceForm';
export { default as CharacterAppearanceWithArchetypes } from './CharacterAppearanceWithArchetypes';

// UI Components
export {
  GenderSelector,
  FormField,
  FormSection,
  PromptGenerator,
  AppearancePreview,
  ImageGenerationPreview,
  CharacterImageUpload,
  CharacterImageExtraction,
  FormStepper,
  SteppedAppearanceForm,
} from './components';

// Library functions and configs
export {
  appearanceFormConfig,
  getFieldValue,
  setFieldValue,
  generateFacialFeaturesPrompt,
  generateClothingPrompt,
  generateFullPrompt,
  randomizeCharacter,
  useAppearanceForm,
  type FormFieldConfig,
  type FormSectionConfig,
  type FieldType,
  type SectionColor,
} from './lib';

// Types
export type { ImageExtractionConfig, ExtractionResult } from './types';
