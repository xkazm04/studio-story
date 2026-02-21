/**
 * registerProviders
 *
 * Utility to register all recommendation providers with the engine
 */

import { recommendationEngine } from '../RecommendationEngine';
import { SceneEditorProvider } from './SceneEditorProvider';
import { CharacterProvider } from './CharacterProvider';
import { AssetProvider } from './AssetProvider';
import { RelationshipProvider } from './RelationshipProvider';

let isRegistered = false;

/**
 * Register all built-in recommendation providers
 */
export function registerAllProviders(): void {
  if (isRegistered) {
    return;
  }

  recommendationEngine.registerProvider(SceneEditorProvider);
  recommendationEngine.registerProvider(CharacterProvider);
  recommendationEngine.registerProvider(AssetProvider);
  recommendationEngine.registerProvider(RelationshipProvider);

  isRegistered = true;

  console.log('[Recommendations] Registered providers:', {
    count: recommendationEngine.getProviders().length,
    providers: recommendationEngine.getProviders().map(p => p.id),
  });
}

/**
 * Check if providers are registered
 */
export function areProvidersRegistered(): boolean {
  return isRegistered;
}

export default registerAllProviders;
