/**
 * Root Store - Composing all store slices
 *
 * This file serves as the main entry point for the store architecture,
 * re-exporting individual slice stores and providing a combined interface
 * for components that need access to multiple domains.
 *
 * Pattern: Each slice is an independent Zustand store that can be used
 * separately, enabling better separation of concerns and easier testing.
 */

import { useProjectStore as useProjectStoreImpl, ProjectState } from './slices/projectSlice';
import {
  useCharacterStore as useCharacterStoreImpl,
  CharacterState,
  CHARACTER_TYPES,
  selectSelectedCharacterId,
  selectSetSelectedCharacter,
  selectProjectCharacters,
  selectFilters,
} from './slices/characterSlice';

// Export individual slice stores
export { useProjectStoreImpl as useProjectStore, type ProjectState };
export {
  useCharacterStoreImpl as useCharacterStore,
  type CharacterState,
  CHARACTER_TYPES,
  // Character selectors for optimized component rendering
  selectSelectedCharacterId,
  selectSetSelectedCharacter,
  selectProjectCharacters,
  selectFilters,
};

// Combined store interface for components that need both domains
// This is a convenience export - components should prefer importing
// individual slices directly for better tree-shaking
export interface RootStore {
  project: ProjectState;
  character: CharacterState;
}

// Utility hook for accessing all stores (use sparingly)
// Most components should import and use individual slices directly
export const useRootStore = (): RootStore => {
  const project = useProjectStoreImpl();
  const character = useCharacterStoreImpl();

  return {
    project,
    character,
  };
};
