/**
 * SceneEditorProvider
 *
 * Provides recommendations for the scene editor:
 * - Characters that could appear in the current scene
 * - Similar scenes for reference
 * - Location suggestions
 * - Narrative connections
 */

import type {
  RecommendationProvider,
  RecommendationContext,
  Recommendation,
  ProviderOptions,
  RelevanceFactor,
} from '../types';

// ============================================================================
// Provider Implementation
// ============================================================================

export const SceneEditorProvider: RecommendationProvider = {
  id: 'scene-editor',
  name: 'Scene Editor Suggestions',
  types: ['character', 'scene', 'location', 'narrative', 'asset'],
  featureAreas: ['scene-editor'],
  priority: 10,

  isApplicable(context: RecommendationContext): boolean {
    return context.featureArea === 'scene-editor' && !!context.sceneId;
  },

  async generate(
    context: RecommendationContext,
    options?: ProviderOptions
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const limit = options?.limit ?? 5;
    const minScore = options?.minScore ?? 0.3;
    const excludeIds = new Set(options?.excludeIds ?? []);

    try {
      // Generate character suggestions for this scene
      if (!options?.includeTypes || options.includeTypes.includes('character')) {
        const characterRecs = await generateCharacterSuggestions(context, excludeIds);
        recommendations.push(...characterRecs);
      }

      // Generate scene connection suggestions
      if (!options?.includeTypes || options.includeTypes.includes('scene')) {
        const sceneRecs = await generateSceneSuggestions(context, excludeIds);
        recommendations.push(...sceneRecs);
      }

      // Generate location suggestions
      if (!options?.includeTypes || options.includeTypes.includes('location')) {
        const locationRecs = await generateLocationSuggestions(context, excludeIds);
        recommendations.push(...locationRecs);
      }

      // Generate narrative suggestions
      if (!options?.includeTypes || options.includeTypes.includes('narrative')) {
        const narrativeRecs = await generateNarrativeSuggestions(context, excludeIds);
        recommendations.push(...narrativeRecs);
      }

    } catch (error) {
      console.error('SceneEditorProvider error:', error);
    }

    // Filter and limit
    return recommendations
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
};

// ============================================================================
// Character Suggestions
// ============================================================================

async function generateCharacterSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Check recent entities for characters that haven't been added to scene
  const recentCharacters = context.recentEntities
    .filter(e => e.type === 'character' && !excludeIds.has(e.id))
    .slice(0, 3);

  for (const char of recentCharacters) {
    const factors: RelevanceFactor[] = [
      {
        name: 'Recent activity',
        weight: 0.4,
        score: calculateRecencyScore(char.accessedAt),
        explanation: 'Recently viewed character',
      },
      {
        name: 'Context relevance',
        weight: 0.6,
        score: 0.6,
        explanation: 'Active in your current session',
      },
    ];

    const score = factors.reduce((sum, f) => sum + f.weight * f.score, 0);

    recommendations.push({
      id: `scene-char-${char.id}-${Date.now()}`,
      type: 'character',
      source: 'context',
      priority: score > 0.7 ? 'high' : 'medium',
      status: 'pending',
      title: `Add ${char.name}`,
      description: `Include ${char.name} in this scene based on your recent work.`,
      reason: 'You recently viewed this character. They might be relevant to the current scene.',
      score,
      confidence: 0.7,
      relevanceFactors: factors,
      entityId: char.id,
      entityType: 'character',
      entityName: char.name,
      targetContext: context,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
      action: {
        type: 'insert',
        label: 'Add to Scene',
        payload: { characterId: char.id, sceneId: context.sceneId },
      },
    });
  }

  return recommendations;
}

// ============================================================================
// Scene Suggestions
// ============================================================================

async function generateSceneSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Suggest linking to recent scenes
  const recentScenes = context.recentEntities
    .filter(e => e.type === 'scene' && e.id !== context.sceneId && !excludeIds.has(e.id))
    .slice(0, 2);

  for (const scene of recentScenes) {
    const factors: RelevanceFactor[] = [
      {
        name: 'Session context',
        weight: 0.5,
        score: 0.65,
        explanation: 'Part of current work session',
      },
      {
        name: 'Potential connection',
        weight: 0.5,
        score: 0.55,
        explanation: 'May have narrative connection',
      },
    ];

    const score = factors.reduce((sum, f) => sum + f.weight * f.score, 0);

    recommendations.push({
      id: `scene-link-${scene.id}-${Date.now()}`,
      type: 'scene',
      source: 'pattern',
      priority: 'low',
      status: 'pending',
      title: `Link to "${scene.name}"`,
      description: `Create a choice that leads to "${scene.name}".`,
      reason: 'You worked on this scene recently. Consider creating a narrative connection.',
      score,
      confidence: 0.5,
      relevanceFactors: factors,
      entityId: scene.id,
      entityType: 'scene',
      entityName: scene.name,
      targetContext: context,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
      action: {
        type: 'link',
        label: 'Create Choice',
        payload: { sourceSceneId: context.sceneId, targetSceneId: scene.id },
      },
    });
  }

  return recommendations;
}

// ============================================================================
// Location Suggestions
// ============================================================================

async function generateLocationSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  // Location suggestions would typically come from analyzing scene content
  // For now, return empty - would be populated by content analysis
  return [];
}

// ============================================================================
// Narrative Suggestions
// ============================================================================

async function generateNarrativeSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Check for potential dead-end warning
  const recentSceneViews = context.recentEntities
    .filter(e => e.type === 'scene')
    .length;

  if (recentSceneViews < 2 && context.sceneId) {
    recommendations.push({
      id: `narrative-deadend-${context.sceneId}-${Date.now()}`,
      type: 'narrative',
      source: 'gap',
      priority: 'medium',
      status: 'pending',
      title: 'Add branching choices',
      description: 'This scene may need choices to continue the story flow.',
      reason: 'Scenes without choices create dead ends in the narrative.',
      score: 0.55,
      confidence: 0.6,
      relevanceFactors: [
        {
          name: 'Story flow',
          weight: 1,
          score: 0.55,
          explanation: 'Prevents narrative dead ends',
        },
      ],
      entityId: context.sceneId,
      entityType: 'scene',
      entityName: 'Current Scene',
      targetContext: context,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
      action: {
        type: 'create',
        label: 'Add Choice',
        payload: { sceneId: context.sceneId },
      },
    });
  }

  return recommendations;
}

// ============================================================================
// Helpers
// ============================================================================

function calculateRecencyScore(accessedAt: number): number {
  const age = Date.now() - accessedAt;
  const maxAge = 30 * 60 * 1000; // 30 minutes

  if (age < 60000) return 0.9; // Very recent
  if (age < maxAge) return 0.9 - (age / maxAge) * 0.5;
  return 0.4;
}

export default SceneEditorProvider;
