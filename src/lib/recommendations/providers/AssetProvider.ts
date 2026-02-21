/**
 * AssetProvider
 *
 * Provides recommendations for asset-related features:
 * - Similar style assets
 * - Assets used in related scenes
 * - Style consistency suggestions
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

export const AssetProvider: RecommendationProvider = {
  id: 'asset',
  name: 'Asset Suggestions',
  types: ['asset', 'style'],
  featureAreas: ['asset-manager', 'storyboard', 'scene-editor'],
  priority: 8,

  isApplicable(context: RecommendationContext): boolean {
    return ['asset-manager', 'storyboard', 'scene-editor'].includes(context.featureArea);
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
      // Generate asset suggestions based on context
      if (!options?.includeTypes || options.includeTypes.includes('asset')) {
        const assetRecs = await generateAssetSuggestions(context, excludeIds);
        recommendations.push(...assetRecs);
      }

      // Generate style consistency suggestions
      if (!options?.includeTypes || options.includeTypes.includes('style')) {
        const styleRecs = await generateStyleSuggestions(context, excludeIds);
        recommendations.push(...styleRecs);
      }

    } catch (error) {
      console.error('AssetProvider error:', error);
    }

    // Filter and limit
    return recommendations
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
};

// ============================================================================
// Asset Suggestions
// ============================================================================

async function generateAssetSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Find recent assets to suggest for current context
  const recentAssets = context.recentEntities
    .filter(e => e.type === 'asset' && !excludeIds.has(e.id))
    .slice(0, 2);

  // If we're in scene editor, suggest recent assets
  if (context.featureArea === 'scene-editor' && context.sceneId) {
    for (const asset of recentAssets) {
      const factors: RelevanceFactor[] = [
        {
          name: 'Recent usage',
          weight: 0.5,
          score: calculateRecencyScore(asset.accessedAt),
          explanation: 'Recently viewed asset',
        },
        {
          name: 'Scene context',
          weight: 0.5,
          score: 0.55,
          explanation: 'May fit current scene',
        },
      ];

      const score = factors.reduce((sum, f) => sum + f.weight * f.score, 0);

      recommendations.push({
        id: `asset-scene-${asset.id}-${context.sceneId}-${Date.now()}`,
        type: 'asset',
        source: 'context',
        priority: 'low',
        status: 'pending',
        title: `Use "${asset.name}"`,
        description: `Add this asset to the current scene.`,
        reason: 'You recently viewed this asset. It might work for this scene.',
        score,
        confidence: 0.5,
        relevanceFactors: factors,
        entityId: asset.id,
        entityType: 'asset',
        entityName: asset.name,
        targetContext: context,
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
        action: {
          type: 'apply',
          label: 'Use Asset',
          payload: { assetId: asset.id, sceneId: context.sceneId },
        },
      });
    }
  }

  // For storyboard, suggest assets matching characters in the shot
  if (context.featureArea === 'storyboard') {
    const characterAssets = context.recentEntities
      .filter(e => e.type === 'asset' && !excludeIds.has(e.id))
      .slice(0, 2);

    for (const asset of characterAssets) {
      const factors: RelevanceFactor[] = [
        {
          name: 'Visual coherence',
          weight: 0.6,
          score: 0.6,
          explanation: 'Maintains visual style',
        },
        {
          name: 'Recent activity',
          weight: 0.4,
          score: calculateRecencyScore(asset.accessedAt),
          explanation: 'Recently used',
        },
      ];

      const score = factors.reduce((sum, f) => sum + f.weight * f.score, 0);

      recommendations.push({
        id: `asset-storyboard-${asset.id}-${Date.now()}`,
        type: 'asset',
        source: 'pattern',
        priority: 'low',
        status: 'pending',
        title: `Add "${asset.name}" to shot`,
        description: `Include this asset in the current storyboard shot.`,
        reason: 'This asset was recently used and may fit the current shot.',
        score,
        confidence: 0.45,
        relevanceFactors: factors,
        entityId: asset.id,
        entityType: 'asset',
        entityName: asset.name,
        targetContext: context,
        createdAt: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
        action: {
          type: 'apply',
          label: 'Add to Shot',
          payload: { assetId: asset.id },
        },
      });
    }
  }

  return recommendations;
}

// ============================================================================
// Style Suggestions
// ============================================================================

async function generateStyleSuggestions(
  context: RecommendationContext,
  excludeIds: Set<string>
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Style suggestions would analyze existing assets and detect patterns
  // For now, provide general style consistency reminder if multiple assets used

  const recentAssets = context.recentEntities.filter(e => e.type === 'asset');

  if (recentAssets.length >= 3) {
    recommendations.push({
      id: `style-consistency-${Date.now()}`,
      type: 'style',
      source: 'gap',
      priority: 'low',
      status: 'pending',
      title: 'Check style consistency',
      description: 'You\'ve used multiple assets recently. Consider reviewing their visual consistency.',
      reason: 'Multiple assets in a project should maintain consistent style.',
      score: 0.4,
      confidence: 0.4,
      relevanceFactors: [
        {
          name: 'Asset variety',
          weight: 1,
          score: 0.4,
          explanation: 'Multiple assets detected',
        },
      ],
      entityId: 'style-check',
      entityType: 'style',
      entityName: 'Style Review',
      targetContext: context,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
      action: {
        type: 'navigate',
        label: 'Review Styles',
        payload: { view: 'style-analysis' },
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
  const maxAge = 20 * 60 * 1000; // 20 minutes

  if (age < 60000) return 0.85;
  if (age < maxAge) return 0.85 - (age / maxAge) * 0.45;
  return 0.4;
}

export default AssetProvider;
