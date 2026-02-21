/**
 * Character Appearance Service
 * Helper functions for working with character appearance data
 */

import { Appearance } from '@/app/types/Character';
import { Database } from '@/lib/supabase/database.types';

type CharAppearanceRow = Database['public']['Tables']['char_appearance']['Row'];
type CharAppearanceInsert = Database['public']['Tables']['char_appearance']['Insert'];

/**
 * Convert Appearance type to database row format
 */
export function appearanceToDbFormat(
  characterId: string,
  appearance: Partial<Appearance>,
  prompt?: string
): CharAppearanceInsert {
  return {
    character_id: characterId,
    gender: appearance.gender || null,
    age: appearance.age || null,
    skin_color: appearance.skinColor || null,
    body_type: appearance.bodyType || null,
    height: appearance.height || null,
    face_shape: appearance.face?.shape || null,
    eye_color: appearance.face?.eyeColor || null,
    hair_color: appearance.face?.hairColor || null,
    hair_style: appearance.face?.hairStyle || null,
    facial_hair: appearance.face?.facialHair || null,
    face_features: appearance.face?.features || null,
    clothing_style: appearance.clothing?.style || null,
    clothing_color: appearance.clothing?.color || null,
    clothing_accessories: appearance.clothing?.accessories || null,
    custom_features: appearance.customFeatures || null,
    prompt: prompt || null,
  };
}

/**
 * Convert database row to Appearance type
 */
export function dbFormatToAppearance(row: CharAppearanceRow | null): {
  appearance: Partial<Appearance>;
  prompt: string | null;
} {
  if (!row) {
    return {
      appearance: {},
      prompt: null,
    };
  }

  return {
    appearance: {
      gender: row.gender || '',
      age: row.age || '',
      skinColor: row.skin_color || '',
      bodyType: row.body_type || '',
      height: row.height || '',
      face: {
        shape: row.face_shape || '',
        eyeColor: row.eye_color || '',
        hairColor: row.hair_color || '',
        hairStyle: row.hair_style || '',
        facialHair: row.facial_hair || '',
        features: row.face_features || '',
      },
      clothing: {
        style: row.clothing_style || '',
        color: row.clothing_color || '',
        accessories: row.clothing_accessories || '',
      },
      customFeatures: row.custom_features || '',
    },
    prompt: row.prompt,
  };
}

/**
 * Save character appearance to database via API
 */
export async function saveCharacterAppearance(
  characterId: string,
  appearance: Partial<Appearance>,
  prompt?: string
): Promise<CharAppearanceRow> {
  const dbData = appearanceToDbFormat(characterId, appearance, prompt);

  const response = await fetch('/api/char-appearance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dbData),
  });

  if (!response.ok) {
    throw new Error('Failed to save character appearance');
  }

  return response.json();
}

/**
 * Fetch character appearance from database via API
 */
export async function fetchCharacterAppearance(
  characterId: string
): Promise<{ appearance: Partial<Appearance>; prompt: string | null }> {
  const response = await fetch(
    `/api/char-appearance?character_id=${characterId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch character appearance');
  }

  const data = await response.json();
  return dbFormatToAppearance(data);
}

/**
 * Delete character appearance from database via API
 */
export async function deleteCharacterAppearance(
  characterId: string
): Promise<void> {
  const response = await fetch(
    `/api/char-appearance?character_id=${characterId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete character appearance');
  }
}

