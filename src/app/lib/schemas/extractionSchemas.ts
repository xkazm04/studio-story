/**
 * Extraction Schemas
 * Defines the structure for different types of image data extraction
 */

import { ExtractionSchema } from '../services/imageExtraction';
import { Appearance } from '@/app/types/Character';

/**
 * Schema for extracting game asset information from images
 */
export const assetExtractionSchema: ExtractionSchema = {
  name: 'Game Asset Extraction',
  description: 'Extract information about game assets (characters, items, environments) from the image',
  fields: [
    {
      name: 'name',
      type: 'string',
      description: 'The name or title of the asset',
      required: true,
    },
    {
      name: 'description',
      type: 'string',
      description: 'A detailed description of the asset',
      required: true,
    },
    {
      name: 'category',
      type: 'string',
      description: 'The category of the asset',
      required: false,
      options: ['character', 'item', 'weapon', 'environment', 'prop', 'vehicle', 'creature', 'other'],
    },
    {
      name: 'tags',
      type: 'array',
      description: 'Relevant tags for categorization and search',
      required: false,
    },
    {
      name: 'properties',
      type: 'object',
      description: 'Additional properties specific to the asset type',
      required: false,
    },
  ],
};

/**
 * Schema for extracting character appearance from portrait/image
 */
export const characterAppearanceSchema: ExtractionSchema = {
  name: 'Character Appearance Extraction',
  description: 'Extract detailed physical appearance information from a character portrait or image',
  fields: [
    {
      name: 'gender',
      type: 'string',
      description: 'The apparent gender of the character',
      required: false,
      options: ['Male', 'Female', 'Non-binary', 'Ambiguous'],
    },
    {
      name: 'age',
      type: 'string',
      description: 'The apparent age category of the character',
      required: false,
      options: ['Child', 'Young', 'Adult', 'Middle-aged', 'Elderly'],
    },
    {
      name: 'skinColor',
      type: 'string',
      description: 'The skin color or tone of the character',
      required: false,
    },
    {
      name: 'bodyType',
      type: 'string',
      description: 'The body type or build of the character',
      required: false,
      options: ['Slim', 'Athletic', 'Muscular', 'Average', 'Heavy', 'Stocky'],
    },
    {
      name: 'height',
      type: 'string',
      description: 'The apparent height of the character',
      required: false,
      options: ['Very Short', 'Short', 'Average', 'Tall', 'Very Tall'],
    },
    {
      name: 'face',
      type: 'object',
      description: 'Facial features of the character',
      required: true,
    },
    {
      name: 'face.shape',
      type: 'string',
      description: 'The shape of the face',
      required: false,
      options: ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Oblong'],
    },
    {
      name: 'face.eyeColor',
      type: 'string',
      description: 'The color of the eyes',
      required: false,
    },
    {
      name: 'face.hairColor',
      type: 'string',
      description: 'The color of the hair',
      required: false,
    },
    {
      name: 'face.hairStyle',
      type: 'string',
      description: 'The style or length of the hair',
      required: false,
      options: ['Bald', 'Very Short', 'Short', 'Medium', 'Long', 'Very Long', 'Curly', 'Wavy', 'Straight', 'Braided'],
    },
    {
      name: 'face.facialHair',
      type: 'string',
      description: 'Type of facial hair if present',
      required: false,
      options: ['Clean-shaven', 'Stubble', 'Goatee', 'Beard', 'Mustache', 'Full Beard'],
    },
    {
      name: 'face.features',
      type: 'string',
      description: 'Notable facial features (scars, tattoos, piercings, etc.)',
      required: false,
    },
    {
      name: 'clothing',
      type: 'object',
      description: 'Clothing and style information',
      required: true,
    },
    {
      name: 'clothing.style',
      type: 'string',
      description: 'The style of clothing worn',
      required: false,
      options: ['Casual', 'Formal', 'Armor', 'Robes', 'Uniform', 'Traditional', 'Fantasy', 'Sci-Fi', 'Modern'],
    },
    {
      name: 'clothing.color',
      type: 'string',
      description: 'Primary colors of the clothing',
      required: false,
    },
    {
      name: 'clothing.accessories',
      type: 'string',
      description: 'Accessories worn (jewelry, hat, glasses, etc.)',
      required: false,
    },
    {
      name: 'customFeatures',
      type: 'string',
      description: 'Any other distinctive or unique features not covered above',
      required: false,
    },
    {
      name: 'prompt',
      type: 'string',
      description: 'A detailed prompt to regenerate this person/character in different styles. Focus ONLY on the person/character (physical features, clothing, expression, pose), NOT on background, image style, or artistic elements. This should be usable to recreate the character consistently across different contexts.',
      required: false,
    },
  ],
};

/**
 * Helper function to convert extracted data to Appearance type
 */
export function extractedDataToAppearance(data: any): {
  appearance: Partial<Appearance>;
  prompt: string;
} {
  return {
    appearance: {
      gender: data.gender || '',
      age: data.age || '',
      skinColor: data.skinColor || '',
      bodyType: data.bodyType || '',
      height: data.height || '',
      face: {
        shape: data.face?.shape || '',
        eyeColor: data.face?.eyeColor || '',
        hairColor: data.face?.hairColor || '',
        hairStyle: data.face?.hairStyle || '',
        facialHair: data.face?.facialHair || '',
        features: data.face?.features || '',
      },
      clothing: {
        style: data.clothing?.style || '',
        color: data.clothing?.color || '',
        accessories: data.clothing?.accessories || '',
      },
      customFeatures: data.customFeatures || '',
    },
    prompt: data.prompt || '',
  };
}
