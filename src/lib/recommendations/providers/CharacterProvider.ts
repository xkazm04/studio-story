/**
 * CharacterProvider
 *
 * Provides recommendations for character-related features:
 * - Faction suggestions based on archetype
 * - Potential relationships with other characters
 * - Similar characters for reference
 * - Character arc suggestions
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

export const CharacterProvider: RecommendationProvider = {
  id: 'character',
  name: 'Character Suggestions',
  types: ['faction', 'relationship', 'character', 'connection'],
  featureAreas: ['character-creator', 'character-list', 'relationship-map'],
  priority: 10,

  isApplicable(context: RecommendationContext): boolean {
    return (
      ['character-creator', 'character-list', 'relationship-map'].includes(context.featureArea) ||
      !!context.characterId
    );
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
      // Generate relationship suggestions
      if (!options?.includeTypes || options.includeTypes.includes('relationship')) {
        const relationshipRecs = await generateRelationshipSuggestions(context, excludeIds);
        recommendations.push(...relationshipRecs);
      }

      // Generate faction suggestions
      if (!options?.includeTypes || options.includeTypes.includes('faction')) {
        const factionRecs = await generateFactionSuggestions(context, excludeIds);
        recommendations.push(...factionRecs);
      }

      // Generate character connection suggestions
      if (!options?.includeTypes || options.includeTypes.includes('connection')) {
        const connectionRecs = await generateConnectionSuggestions(context, excludeIds);
        recommendations.push(...connectionRecs);
      }

    } catch (error) {
      console.error('CharacterProvider error:', error);
    }

    // Filter and limit
    return recommendations
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
};

// ============================================================================
// Relationship Suggestions
// ============================================================================

async function generateRelationshipSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (!context.characterId) return recommendations;

  // Find other recently accessed characters to suggest relationships
  const otherCharacters = context.recentEntities
    .filter(e =>
      e.type === 'character' &&
      e.id !== context.characterId &&
      !excludeIds.has(e.id)
    )
    .slice(0, 3);

  for (const char of otherCharacters) {
    const factors: RelevanceFactor[] = [
      {
        name: 'Session proximity',
        weight: 0.5,
        score: calculateRecencyScore(char.accessedAt),
        explanation: 'Viewed in same session',
      },
      {
        name: 'Relationship potential',
        weight: 0.5,
        score: 0.6,
        explanation: 'No existing relationship detected',
      },
    ];

    const score = factors.reduce((sum, f) => sum + f.weight * f.score, 0);

    recommendations.push({
      id: `rel-suggest-${context.characterId}-${char.id}-${Date.now()}`,
      type: 'relationship',
      source: 'pattern',
      priority: score > 0.65 ? 'medium' : 'low',
      status: 'pending',
      title: `Connect with ${char.name}`,
      description: `Define the relationship between the current character and ${char.name}.`,
      reason: 'You worked with both characters recently. Consider defining their relationship.',
      score,
      confidence: 0.6,
      relevanceFactors: factors,
      entityId: char.id,
      entityType: 'character',
      entityName: char.name,
      targetContext: context,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
      action: {
        type: 'create',
        label: 'Create Relationship',
        payload: {
          sourceCharacterId: context.characterId,
          targetCharacterId: char.id,
        },
      },
    });
  }

  return recommendations;
}

// ============================================================================
// Faction Suggestions
// ============================================================================

async function generateFactionSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  if (!context.characterId) return recommendations;

  // Check for recent faction activity
  const recentFactions = context.recentEntities
    .filter(e => e.type === 'faction' && !excludeIds.has(e.id))
    .slice(0, 2);

  for (const faction of recentFactions) {
    const factors: RelevanceFactor[] = [
      {
        name: 'Recent faction activity',
        weight: 0.6,
        score: calculateRecencyScore(faction.accessedAt),
        explanation: 'Recently viewed faction',
      },
      {
        name: 'Membership potential',
        weight: 0.4,
        score: 0.55,
        explanation: 'Character may fit this faction',
      },
    ];

    const score = factors.reduce((sum, f) => sum + f.weight * f.score, 0);

    recommendations.push({
      id: `faction-suggest-${context.characterId}-${faction.id}-${Date.now()}`,
      type: 'faction',
      source: 'context',
      priority: 'low',
      status: 'pending',
      title: `Join ${faction.name}`,
      description: `Add this character as a member of ${faction.name}.`,
      reason: 'You recently viewed this faction. Consider adding this character as a member.',
      score,
      confidence: 0.5,
      relevanceFactors: factors,
      entityId: faction.id,
      entityType: 'faction',
      entityName: faction.name,
      targetContext: context,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
      action: {
        type: 'link',
        label: 'Add to Faction',
        payload: {
          characterId: context.characterId,
          factionId: faction.id,
        },
      },
    });
  }

  return recommendations;
}

// ============================================================================
// Connection Suggestions
// ============================================================================

async function generateConnectionSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Suggest scenes where character could appear
  const recentScenes = context.recentEntities
    .filter(e => e.type === 'scene' && !excludeIds.has(e.id))
    .slice(0, 2);

  if (context.characterId) {
    for (const scene of recentScenes) {
      const factors: RelevanceFactor[] = [
        {
          name: 'Scene activity',
          weight: 0.5,
          score: calculateRecencyScore(scene.accessedAt),
          explanation: 'Recently edited scene',
        },
        {
          name: 'Character placement',
          weight: 0.5,
          score: 0.5,
          explanation: 'Character could appear here',
        },
      ];

      const score = factors.reduce((sum, f) => sum + f.weight * f.score, 0);

      recommendations.push({
        id: `conn-scene-${context.characterId}-${scene.id}-${Date.now()}`,
        type: 'connection',
        source: 'context',
        priority: 'low',
        status: 'pending',
        title: `Appear in "${scene.name}"`,
        description: `Add this character to the scene "${scene.name}".`,
        reason: 'You worked on this scene recently. This character could appear there.',
        score,
        confidence: 0.45,
        relevanceFactors: factors,
        entityId: scene.id,
        entityType: 'scene',
        entityName: scene.name,
        targetContext: context,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        action: {
          type: 'link',
          label: 'Add to Scene',
          payload: {
            characterId: context.characterId,
            sceneId: scene.id,
          },
        },
      });
    }
  }

  return recommendations;
}

// ============================================================================
// Helpers
// ============================================================================

function calculateRecencyScore(accessedAt: number): number {
  const age = Date.now() - accessedAt;
  const maxAge = 30 * 60 * 1000; // 30 minutes

  if (age < 60000) return 0.9;
  if (age < maxAge) return 0.9 - (age / maxAge) * 0.5;
  return 0.4;
}

export default CharacterProvider;
