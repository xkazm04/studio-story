/**
 * Form field configuration for Character Appearance
 * This config drives the form generation, making it easy to add/modify fields
 */

import { Appearance } from '@/app/types/Character';

export type FieldType = 'text' | 'textarea' | 'gender' | 'special-features';
export type SectionColor = 'blue' | 'purple' | 'green' | 'yellow' | 'orange' | 'pink' | 'gray';

export interface FormFieldConfig {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  path: string; // e.g., 'gender', 'face.eyeColor', 'clothing.style'
}

export interface FormSectionConfig {
  id: string;
  title: string;
  color: SectionColor;
  fields: FormFieldConfig[];
}

export const appearanceFormConfig: FormSectionConfig[] = [
  {
    id: 'basic',
    title: 'Basic Attributes',
    color: 'blue',
    fields: [
      { id: 'gender', label: 'Gender', type: 'gender', path: 'gender' },
      { id: 'age', label: 'Age', type: 'text', placeholder: 'e.g., Young, Adult, Elderly', path: 'age' },
      { id: 'skinColor', label: 'Skin Color', type: 'text', placeholder: 'e.g., Fair, Tan, Dark', path: 'skinColor' },
      { id: 'bodyType', label: 'Body Type', type: 'text', placeholder: 'e.g., Athletic, Slim, Muscular', path: 'bodyType' },
      { id: 'height', label: 'Height', type: 'text', placeholder: 'e.g., Short, Average, Tall', path: 'height' },
    ],
  },
  {
    id: 'facial',
    title: 'Facial Features',
    color: 'purple',
    fields: [
      { id: 'faceShape', label: 'Face Shape', type: 'text', placeholder: 'e.g., Oval, Round, Square', path: 'face.shape' },
      { id: 'eyeColor', label: 'Eye Color', type: 'text', placeholder: 'e.g., Blue, Brown, Green', path: 'face.eyeColor' },
      { id: 'hairColor', label: 'Hair Color', type: 'text', placeholder: 'e.g., Black, Blonde, Red', path: 'face.hairColor' },
      { id: 'hairStyle', label: 'Hair Style', type: 'text', placeholder: 'e.g., Short, Long, Curly', path: 'face.hairStyle' },
      { id: 'facialHair', label: 'Facial Hair', type: 'text', placeholder: 'e.g., Beard, Mustache, Clean-shaven', path: 'face.facialHair' },
      { id: 'features', label: 'Special Features', type: 'special-features', placeholder: 'Enter a short sentence (1-10 words) describing special features...', path: 'face.features' },
    ],
  },
  {
    id: 'clothing',
    title: 'Clothing & Style',
    color: 'green',
    fields: [
      { id: 'clothingStyle', label: 'Clothing Style', type: 'text', placeholder: 'e.g., Casual, Formal, Armor', path: 'clothing.style' },
      { id: 'clothingColor', label: 'Primary Colors', type: 'text', placeholder: 'e.g., Black, Blue, Red', path: 'clothing.color' },
      { id: 'accessories', label: 'Accessories', type: 'text', placeholder: 'e.g., Hat, Jewelry, Glasses', path: 'clothing.accessories' },
    ],
  },
  {
    id: 'custom',
    title: 'Additional Details',
    color: 'yellow',
    fields: [
      { id: 'customFeatures', label: 'Custom Features', type: 'textarea', placeholder: 'Any other distinctive features or characteristics...', path: 'customFeatures' },
    ],
  },
];

/**
 * Get field value from appearance object using path
 */
export function getFieldValue(appearance: Appearance, path: string): string {
  const parts = path.split('.');
  let value: unknown = appearance;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return '';
    }
  }

  return value ? String(value) : '';
}

/**
 * Set field value in appearance object using path
 */
export function setFieldValue(appearance: Appearance, path: string, value: string): Appearance {
  const parts = path.split('.');

  if (parts.length === 1) {
    return { ...appearance, [parts[0]]: value };
  }

  const [category, ...rest] = parts;
  const categoryKey = category as keyof Appearance;
  const categoryValue = { ...(appearance[categoryKey] as Record<string, unknown>) };

  let current: Record<string, unknown> = categoryValue;
  for (let i = 0; i < rest.length - 1; i++) {
    const existingValue = current[rest[i]];
    current[rest[i]] = typeof existingValue === 'object' && existingValue !== null
      ? { ...existingValue }
      : {};
    current = current[rest[i]] as Record<string, unknown>;
  }
  current[rest[rest.length - 1]] = value;

  return {
    ...appearance,
    [category]: categoryValue,
  };
}
