/**
 * Narrative Synthesis Service
 *
 * Uses LLM to synthesize updated character descriptions, scene descriptors,
 * and dialogue cues when character appearance changes
 */

import { logger } from '@/app/utils/logger';

export interface AppearanceData {
  gender?: string;
  age?: string;
  skin_color?: string;
  body_type?: string;
  height?: string;
  face_shape?: string;
  eye_color?: string;
  hair_color?: string;
  hair_style?: string;
  facial_hair?: string;
  face_features?: string;
  clothing_style?: string;
  clothing_color?: string;
  clothing_accessories?: string;
  custom_features?: string;
}

export interface CharacterContext {
  name: string;
  type?: string;
  appearance: AppearanceData;
  changedFields: string[];
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface NarrativeUpdate {
  originalContent: string;
  updatedContent: string;
  confidence: number;
}

/**
 * Build appearance description from appearance data
 */
function buildAppearanceDescription(appearance: AppearanceData): string {
  const parts: string[] = [];

  if (appearance.gender) parts.push(`${appearance.gender}`);
  if (appearance.age) parts.push(`${appearance.age}`);
  if (appearance.height) parts.push(`${appearance.height} height`);
  if (appearance.body_type) parts.push(`${appearance.body_type} build`);
  if (appearance.skin_color) parts.push(`${appearance.skin_color} skin`);
  if (appearance.eye_color) parts.push(`${appearance.eye_color} eyes`);
  if (appearance.hair_color && appearance.hair_style)
    parts.push(`${appearance.hair_color} ${appearance.hair_style} hair`);
  else if (appearance.hair_color) parts.push(`${appearance.hair_color} hair`);
  else if (appearance.hair_style) parts.push(`${appearance.hair_style} hair`);
  if (appearance.facial_hair) parts.push(`${appearance.facial_hair}`);
  if (appearance.face_features) parts.push(`${appearance.face_features}`);
  if (appearance.clothing_style) parts.push(`wearing ${appearance.clothing_style}`);
  if (appearance.clothing_color) parts.push(`in ${appearance.clothing_color}`);
  if (appearance.clothing_accessories) parts.push(`with ${appearance.clothing_accessories}`);
  if (appearance.custom_features) parts.push(appearance.custom_features);

  return parts.join(', ');
}

/**
 * Build change summary for LLM context
 */
function buildChangeSummary(
  changedFields: string[],
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): string {
  const changes = changedFields.map((field) => {
    const oldVal = oldValues[field];
    const newVal = newValues[field];
    return `- ${field}: changed from "${oldVal || 'none'}" to "${newVal || 'none'}"`;
  });

  return changes.join('\n');
}

/**
 * Generate system prompt for narrative synthesis
 */
function generateSystemPrompt(): string {
  return `You are a narrative consistency assistant. Your job is to update story text when a character's appearance changes.

RULES:
1. Preserve the original narrative voice, tone, and style
2. Only update appearance-related descriptions
3. Keep all plot points, actions, and dialogue intact
4. Maintain the same level of detail as the original
5. Do not add new information beyond the appearance change
6. If the original text doesn't mention appearance, only add minimal description if absolutely necessary
7. Return ONLY the updated text, no explanations or commentary`;
}

/**
 * Generate user prompt for updating content
 */
function generateUpdatePrompt(
  characterContext: CharacterContext,
  originalContent: string,
  targetType: string
): string {
  const appearanceDesc = buildAppearanceDescription(characterContext.appearance);
  const changeSummary = buildChangeSummary(
    characterContext.changedFields,
    characterContext.oldValues,
    characterContext.newValues
  );

  return `Character: ${characterContext.name}
New Appearance: ${appearanceDesc}

Changes Made:
${changeSummary}

Target Type: ${targetType}

Original Content:
"""
${originalContent}
"""

Please update the content above to reflect the character's new appearance. Maintain the original style and only change appearance-related descriptions.`;
}

/**
 * Call LLM API to synthesize updated narrative
 */
async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    // Use the LLM API endpoint
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for consistency
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content || data.message || '';
  } catch (error) {
    logger.error('Error calling LLM API', error);
    throw error;
  }
}

/**
 * Synthesize updated content for a scene description
 */
export async function synthesizeSceneUpdate(
  characterContext: CharacterContext,
  originalContent: string
): Promise<NarrativeUpdate> {
  try {
    const systemPrompt = generateSystemPrompt();
    const userPrompt = generateUpdatePrompt(characterContext, originalContent, 'scene');

    const updatedContent = await callLLM(systemPrompt, userPrompt);

    return {
      originalContent,
      updatedContent,
      confidence: 0.85, // Default confidence
    };
  } catch (error) {
    logger.error('Error synthesizing scene update', error);
    throw error;
  }
}

/**
 * Synthesize updated content for a beat description
 */
export async function synthesizeBeatUpdate(
  characterContext: CharacterContext,
  originalContent: string
): Promise<NarrativeUpdate> {
  try {
    const systemPrompt = generateSystemPrompt();
    const userPrompt = generateUpdatePrompt(characterContext, originalContent, 'beat');

    const updatedContent = await callLLM(systemPrompt, userPrompt);

    return {
      originalContent,
      updatedContent,
      confidence: 0.85,
    };
  } catch (error) {
    logger.error('Error synthesizing beat update', error);
    throw error;
  }
}

/**
 * Synthesize updated content for character bio/trait
 */
export async function synthesizeCharacterBioUpdate(
  characterContext: CharacterContext,
  originalContent: string
): Promise<NarrativeUpdate> {
  try {
    const systemPrompt = generateSystemPrompt();
    const userPrompt = generateUpdatePrompt(characterContext, originalContent, 'character bio');

    const updatedContent = await callLLM(systemPrompt, userPrompt);

    return {
      originalContent,
      updatedContent,
      confidence: 0.9, // Higher confidence for character bios
    };
  } catch (error) {
    logger.error('Error synthesizing character bio update', error);
    throw error;
  }
}

/**
 * Synthesize updated content for dialogue cues
 */
export async function synthesizeDialogueUpdate(
  characterContext: CharacterContext,
  originalContent: string
): Promise<NarrativeUpdate> {
  try {
    const systemPrompt = generateSystemPrompt();
    const userPrompt = generateUpdatePrompt(characterContext, originalContent, 'dialogue');

    const updatedContent = await callLLM(systemPrompt, userPrompt);

    return {
      originalContent,
      updatedContent,
      confidence: 0.8,
    };
  } catch (error) {
    logger.error('Error synthesizing dialogue update', error);
    throw error;
  }
}

/**
 * Synthesize update based on target type
 */
export async function synthesizeUpdate(
  targetType: string,
  characterContext: CharacterContext,
  originalContent: string
): Promise<NarrativeUpdate> {
  switch (targetType) {
    case 'scene':
      return synthesizeSceneUpdate(characterContext, originalContent);
    case 'beat':
      return synthesizeBeatUpdate(characterContext, originalContent);
    case 'character_bio':
      return synthesizeCharacterBioUpdate(characterContext, originalContent);
    case 'dialogue':
      return synthesizeDialogueUpdate(characterContext, originalContent);
    default:
      throw new Error(`Unknown target type: ${targetType}`);
  }
}

/**
 * Validate that the update is appropriate
 */
export function validateUpdate(original: string, updated: string): boolean {
  // Basic validation: updated content should be similar length (within 50%)
  const lengthRatio = updated.length / original.length;
  if (lengthRatio < 0.5 || lengthRatio > 1.5) {
    logger.warn('Update validation failed: length ratio out of bounds', {
      original: original.length,
      updated: updated.length,
      ratio: lengthRatio,
    });
    return false;
  }

  // Ensure it's not empty
  if (updated.trim().length === 0) {
    logger.warn('Update validation failed: empty content');
    return false;
  }

  return true;
}

export const narrativeSynthesisService = {
  synthesizeSceneUpdate,
  synthesizeBeatUpdate,
  synthesizeCharacterBioUpdate,
  synthesizeDialogueUpdate,
  synthesizeUpdate,
  validateUpdate,
  buildAppearanceDescription,
};
