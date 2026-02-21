/**
 * Character Creator Library Functions
 */

export {
  appearanceFormConfig,
  getFieldValue,
  setFieldValue,
  type FormFieldConfig,
  type FormSectionConfig,
  type FieldType,
  type SectionColor,
} from './formConfig';

export {
  generateFacialFeaturesPrompt,
  generateClothingPrompt,
  generateFullPrompt,
} from './promptGenerators';

export { randomizeCharacter } from './randomizer';

export { useAppearanceForm } from './useAppearanceForm';
