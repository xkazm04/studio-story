/**
 * Character Randomizer Service
 * Uses Ollama to generate random character attributes for any video game genre
 */

import { Appearance } from '@/app/types/Character';

interface RandomizerOptions {
  genre?: string;
  projectContext?: {
    title?: string;
    description?: string;
    genre?: string;
  };
}

/**
 * Generate a prompt for Ollama to create random character attributes
 */
function buildRandomizerPrompt(options: RandomizerOptions): string {
  const { genre = 'fantasy', projectContext } = options;

  const genreContext = projectContext?.genre || genre;
  const projectTitle = projectContext?.title ? ` for the project "${projectContext.title}"` : '';
  const projectDesc = projectContext?.description ? ` Project description: ${projectContext.description}` : '';

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
}

/**
 * Call Ollama API to generate random character
 */
async function callOllamaRandomizer(prompt: string): Promise<string> {
  const response = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      systemPrompt: 'You are a creative character designer. Always return valid JSON only, no explanations.',
      temperature: 1.2,
      maxTokens: 1000,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.content || '';
}

function safeString(value: unknown, defaultValue = ''): string {
  return value ? String(value) : defaultValue;
}

function extractJSON(response: string): string {
  let jsonStr = response.trim();
  jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : jsonStr;
}

function normalizeGender(value: unknown): 'Male' | 'Female' {
  const gender = String(value);
  const lower = gender.toLowerCase();
  if (lower === 'male' || lower === 'female') {
    return (gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()) as 'Male' | 'Female';
  }
  return 'Male';
}

function parseRandomizerResponse(response: string): Partial<Appearance> {
  try {
    const jsonStr = extractJSON(response);
    const parsed = JSON.parse(jsonStr);
    const result: Partial<Appearance> = {};

    if (parsed.gender) result.gender = normalizeGender(parsed.gender);
    if (parsed.age) result.age = safeString(parsed.age);
    if (parsed.skinColor) result.skinColor = safeString(parsed.skinColor);
    if (parsed.bodyType) result.bodyType = safeString(parsed.bodyType);
    if (parsed.height) result.height = safeString(parsed.height);

    if (parsed.face) {
      result.face = {
        shape: safeString(parsed.face.shape),
        eyeColor: safeString(parsed.face.eyeColor),
        hairColor: safeString(parsed.face.hairColor),
        hairStyle: safeString(parsed.face.hairStyle),
        facialHair: safeString(parsed.face.facialHair),
        features: safeString(parsed.face.features),
      };
    }

    if (parsed.clothing) {
      result.clothing = {
        style: safeString(parsed.clothing.style),
        color: safeString(parsed.clothing.color),
        accessories: safeString(parsed.clothing.accessories),
      };
    }

    if (parsed.customFeatures) {
      result.customFeatures = safeString(parsed.customFeatures);
    }

    return result;
  } catch (error) {
    throw new Error('Failed to parse character data. Please try again.');
  }
}

/**
 * Main randomizer function
 * Generates random character appearance using Ollama
 */
export async function randomizeCharacter(options: RandomizerOptions = {}): Promise<Partial<Appearance>> {
  const prompt = buildRandomizerPrompt(options);
  const response = await callOllamaRandomizer(prompt);
  return parseRandomizerResponse(response);
}
