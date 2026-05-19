/**
 * Randomizer prompt generator — wraps buildRandomizerPrompt from randomizer.ts
 * into registry-compatible form.
 */

import type { PromptGeneratorDef } from '../PromptRegistry';
import { promptRegistry } from '../PromptRegistry';

// ============================================================================
// Input types
// ============================================================================

export interface RandomizerPromptInput {
  genre?: string;
  projectContext?: {
    title?: string;
    description?: string;
    genre?: string;
  };
}

// ============================================================================
// Generator: randomizer.character
// ============================================================================

export const randomizerCharacterDef: PromptGeneratorDef<RandomizerPromptInput> = {
  id: 'randomizer.character',
  entityType: 'randomizer',
  description: 'Ollama prompt for random character attribute generation',
  inputFields: [
    { path: 'genre', optional: true },
    { path: 'projectContext.title', optional: true },
    { path: 'projectContext.description', optional: true },
    { path: 'projectContext.genre', optional: true },
  ],
  dependencies: [],
  outputFormat: 'prose',
  generate(input) {
    const { genre = 'fantasy', projectContext } = input;

    const genreContext = projectContext?.genre || genre;
    const projectTitle = projectContext?.title ? ` for the project "${projectContext.title}"` : '';
    const projectDesc = projectContext?.description
      ? ` Project description: ${projectContext.description}`
      : '';

    return `You are a character designer for video games. Generate a random ${genreContext} character${projectTitle}.${projectDesc}

Create a complete character appearance with diverse, interesting attributes. Return ONLY a valid JSON object with this exact structure:
{
  "gender": "Male" or "Female",
  "age": "string",
  "skinColor": "string",
  "bodyType": "string",
  "height": "string",
  "face": {
    "shape": "string",
    "eyeColor": "string",
    "hairColor": "string",
    "hairStyle": "string",
    "facialHair": "string",
    "features": "string"
  },
  "clothing": {
    "style": "string",
    "color": "string",
    "accessories": "string"
  },
  "customFeatures": "string"
}

Guidelines:
- Make it creative and fitting for ${genreContext} genre
- Use diverse, interesting combinations
- Keep values concise (1-3 words typically)
- For customFeatures, provide 1-2 distinctive traits
- Return ONLY the JSON, no explanations or markdown`;
  },
};

// ============================================================================
// Registration
// ============================================================================

export function registerRandomizerGenerators(): void {
  promptRegistry.register(randomizerCharacterDef);
}
