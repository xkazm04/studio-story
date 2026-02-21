/**
 * Beat-to-Scene Mapping Service
 * AI-powered service for generating scene suggestions from story beats
 * Uses semantic analysis to map beats to existing scenes or suggest new ones
 */

import { Beat, BeatSceneSuggestion } from '@/app/types/Beat';
import { Scene } from '@/app/types/Scene';

export interface BeatSceneMappingRequest {
  beat: Beat;
  existingScenes?: Scene[];
  projectContext?: {
    projectId: string;
    genre?: string;
    theme?: string;
    setting?: string;
  };
  options?: {
    maxSuggestions?: number;
    includeNewScenes?: boolean;
    minConfidenceScore?: number;
  };
}

export interface BeatSceneMappingResponse {
  suggestions: BeatSceneSuggestion[];
  processingTime: number;
  model: string;
}

/**
 * Generate scene suggestions for a beat using AI
 */
export async function generateSceneSuggestions(
  request: BeatSceneMappingRequest
): Promise<BeatSceneMappingResponse> {
  const startTime = Date.now();
  const { beat, existingScenes = [], projectContext, options = {} } = request;

  const {
    maxSuggestions = 3,
    includeNewScenes = true,
    minConfidenceScore = 0.6
  } = options;

  try {
    // Prepare the context for AI
    const context = buildMappingContext(beat, existingScenes, projectContext);

    // Call AI service to generate suggestions
    const aiResponse = await callAIService(context, {
      maxSuggestions,
      includeNewScenes,
      minConfidenceScore
    });

    const processingTime = Date.now() - startTime;

    return {
      suggestions: aiResponse.suggestions,
      processingTime,
      model: aiResponse.model || 'openai-gpt-4'
    };
  } catch (error) {
    console.error('Error generating scene suggestions:', error);
    throw new Error('Failed to generate scene suggestions');
  }
}

/**
 * Build context for AI mapping request
 */
function buildMappingContext(
  beat: Beat,
  existingScenes: Scene[],
  projectContext?: BeatSceneMappingRequest['projectContext']
): string {
  let context = `# Beat Information\n`;
  context += `Name: ${beat.name}\n`;
  context += `Description: ${beat.description || 'No description provided'}\n`;
  context += `Type: ${beat.type}\n`;

  if (projectContext) {
    context += `\n# Project Context\n`;
    if (projectContext.genre) context += `Genre: ${projectContext.genre}\n`;
    if (projectContext.theme) context += `Theme: ${projectContext.theme}\n`;
    if (projectContext.setting) context += `Setting: ${projectContext.setting}\n`;
  }

  if (existingScenes.length > 0) {
    context += `\n# Existing Scenes (${existingScenes.length})\n`;
    existingScenes.forEach((scene, index) => {
      context += `\n## Scene ${index + 1}\n`;
      context += `Name: ${scene.name}\n`;
      if (scene.description) context += `Description: ${scene.description}\n`;
      if (scene.location) context += `Location: ${scene.location}\n`;
      if (scene.script) context += `Script Preview: ${scene.script.substring(0, 200)}...\n`;
    });
  }

  return context;
}

/**
 * Call AI service to generate scene suggestions
 */
async function callAIService(
  context: string,
  options: {
    maxSuggestions: number;
    includeNewScenes: boolean;
    minConfidenceScore: number;
  }
): Promise<{ suggestions: BeatSceneSuggestion[]; model: string }> {
  const { maxSuggestions, includeNewScenes } = options;

  // Make API call to backend endpoint
  const response = await fetch('/api/beat-scene-mapping', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context,
      maxSuggestions,
      includeNewScenes,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Calculate semantic similarity between beat and scene
 * This is a simplified version - in production, would use embeddings
 */
export function calculateSemanticSimilarity(
  beatText: string,
  sceneText: string
): number {
  // Normalize texts
  const beatWords = new Set(beatText.toLowerCase().split(/\s+/));
  const sceneWords = new Set(sceneText.toLowerCase().split(/\s+/));

  // Calculate Jaccard similarity
  const intersection = new Set(
    [...beatWords].filter(word => sceneWords.has(word))
  );
  const union = new Set([...beatWords, ...sceneWords]);

  return intersection.size / union.size;
}

/**
 * Rank suggestions by confidence and similarity
 */
export function rankSuggestions(
  suggestions: BeatSceneSuggestion[]
): BeatSceneSuggestion[] {
  return suggestions.sort((a, b) => {
    // Sort by confidence score (primary) and similarity score (secondary)
    const confidenceDiff = b.confidence_score - a.confidence_score;
    if (Math.abs(confidenceDiff) > 0.1) {
      return confidenceDiff;
    }
    return b.similarity_score - a.similarity_score;
  });
}
