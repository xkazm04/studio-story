/**
 * RelationshipProvider
 *
 * Provides recommendations for relationship-related features:
 * - Missing connections between characters
 * - Relationship pattern detection
 * - Group/faction relationships
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

export const RelationshipProvider: RecommendationProvider = {
  id: 'relationship',
  name: 'Relationship Suggestions',
  types: ['relationship', 'connection'],
  featureAreas: ['relationship-map', 'character-creator', 'character-list'],
  priority: 7,

  isApplicable(context: RecommendationContext): boolean {
    return (
      ['relationship-map', 'character-creator', 'character-list'].includes(context.featureArea) ||
      !!context.characterId
    );
  },

  async generate(
    context: RecommendationContext,
    options?: ProviderOptions
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const limit = options?.limit ?? 4;
    const minScore = options?.minScore ?? 0.3;
    const excludeIds = new Set(options?.excludeIds ?? []);

    try {
      // Generate relationship gap suggestions
      if (!options?.includeTypes || options.includeTypes.includes('relationship')) {
        const gapRecs = await generateRelationshipGapSuggestions(context, excludeIds);
        recommendations.push(...gapRecs);
      }

      // Generate connection pattern suggestions
      if (!options?.includeTypes || options.includeTypes.includes('connection')) {
        const patternRecs = await generateConnectionPatternSuggestions(context, excludeIds);
        recommendations.push(...patternRecs);
      }

    } catch (error) {
      console.error('RelationshipProvider error:', error);
    }

    // Filter and limit
    return recommendations
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
};

// ============================================================================
// Gap Suggestions
// ============================================================================

async function generateRelationshipGapSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Get characters accessed in the session
  const recentCharacters = context.recentEntities
    .filter(e => e.type === 'character')
    .slice(0, 5);

  // If multiple characters viewed but no relationships explored
  if (recentCharacters.length >= 2) {
    const hasViewedRelationships = context.recentEntities
      .some(e => e.type === 'relationship');

    if (!hasViewedRelationships) {
      // Suggest relationship review
      recommendations.push({
        id: `rel-gap-review-${Date.now()}`,
        type: 'relationship',
        source: 'gap',
        priority: 'medium',
        status: 'pending',
        title: 'Define character relationships',
        description: `You've viewed ${recentCharacters.length} characters. Consider defining their relationships.`,
        reason: 'Characters work better in stories when their relationships are defined.',
        score: 0.55,
        confidence: 0.6,
        relevanceFactors: [
          {
            name: 'Character activity',
            weight: 0.6,
            score: 0.7,
            explanation: 'Multiple characters viewed',
          },
          {
            name: 'Missing relationships',
            weight: 0.4,
            score: 0.5,
            explanation: 'No relationships defined recently',
          },
        ],
        entityId: 'relationship-map',
        entityType: 'relationship',
        entityName: 'Relationship Map',
        targetContext: context,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        action: {
          type: 'navigate',
          label: 'Open Relationship Map',
          payload: { view: 'relationship-map' },
        },
      });
    }

    // Suggest specific pairs that might need relationships
    if (recentCharacters.length >= 2) {
      const char1 = recentCharacters[0];
      const char2 = recentCharacters[1];

      const pairKey = [char1.id, char2.id].sort().join('-');
      if (!excludeIds.has(pairKey)) {
        recommendations.push({
          id: `rel-gap-pair-${pairKey}-${Date.now()}`,
          type: 'relationship',
          source: 'gap',
          priority: 'low',
          status: 'pending',
          title: `${char1.name} & ${char2.name}`,
          description: `Define the relationship between ${char1.name} and ${char2.name}.`,
          reason: 'These characters were viewed together but have no defined relationship.',
          score: 0.45,
          confidence: 0.5,
          relevanceFactors: [
            {
              name: 'Proximity',
              weight: 0.6,
              score: 0.6,
              explanation: 'Viewed in same session',
            },
            {
              name: 'Undefined connection',
              weight: 0.4,
              score: 0.4,
              explanation: 'No relationship exists',
            },
          ],
          entityId: pairKey,
          entityType: 'relationship',
          entityName: `${char1.name} - ${char2.name}`,
          targetContext: context,
          createdAt: Date.now(),
          expiresAt: Date.now() + 10 * 60 * 1000,
          action: {
            type: 'create',
            label: 'Create Relationship',
            payload: {
              character1Id: char1.id,
              character2Id: char2.id,
            },
          },
          metadata: {
            character1: char1,
            character2: char2,
          },
        });
      }
    }
  }

  return recommendations;
}

// ============================================================================
// Pattern Suggestions
// ============================================================================

async function generateConnectionPatternSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Look for faction patterns
  const recentFactions = context.recentEntities
    .filter(e => e.type === 'faction')
    .slice(0, 2);

  const recentCharacters = context.recentEntities
    .filter(e => e.type === 'character')
    .slice(0, 3);

  // If viewing both factions and characters, suggest faction relationships
  if (recentFactions.length > 0 && recentCharacters.length > 0) {
    const faction = recentFactions[0];
    const character = recentCharacters[0];

    const connKey = `${character.id}-${faction.id}`;
    if (!excludeIds.has(connKey)) {
      recommendations.push({
        id: `conn-faction-${connKey}-${Date.now()}`,
        type: 'connection',
        source: 'pattern',
        priority: 'low',
        status: 'pending',
        title: `Link ${character.name} to ${faction.name}`,
        description: `Consider whether ${character.name} has any connection to ${faction.name}.`,
        reason: 'You viewed both recently - they may have a narrative connection.',
        score: 0.4,
        confidence: 0.4,
        relevanceFactors: [
          {
            name: 'Session proximity',
            weight: 0.5,
            score: 0.5,
            explanation: 'Viewed in same session',
          },
          {
            name: 'Pattern match',
            weight: 0.5,
            score: 0.4,
            explanation: 'Character-faction pattern',
          },
        ],
        entityId: connKey,
        entityType: 'connection',
        entityName: `${character.name} - ${faction.name}`,
        targetContext: context,
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000,
        action: {
          type: 'link',
          label: 'Define Connection',
          payload: {
            characterId: character.id,
            factionId: faction.id,
          },
        },
      });
    }
  }

  return recommendations;
}

export default RelationshipProvider;
