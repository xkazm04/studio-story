/**
 * useCharacters Hook
 *
 * Convenience wrapper for characterApi.useProjectCharacters
 */

import { characterApi } from './integration/useCharacters';

export const useCharacters = (projectId: string, enabled: boolean = true) => {
  return characterApi.useProjectCharacters(projectId, enabled);
};
