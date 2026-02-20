import { Trait } from '../../types/Character';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockTraits } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const TRAITS_URL = `${API_BASE_URL}/traits`;

export const traitApi = {
  // Get all traits for a character
  useCharacterTraits: (characterId: string, enabled: boolean = true) => {
    return createMockableQuery<Trait[]>(
      ['traits', 'character', characterId],
      () => createFilteredMockQueryFn(mockTraits, t => t.character_id === characterId),
      `${TRAITS_URL}?characterId=${characterId}`,
      enabled && !!characterId
    );
  },

  // Get a single trait
  useTrait: (id: string, enabled: boolean = true) => {
    return createMockableQuery<Trait>(
      ['traits', id],
      () => createSingleMockQueryFn(mockTraits, t => t.id === id, 'Trait not found'),
      `${TRAITS_URL}/${id}`,
      enabled && !!id
    );
  },

  // Create trait
  createTrait: async (data: {
    character_id: string;
    type: string;
    description: string;
  }) => {
    return apiFetch<Trait>({
      url: TRAITS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update trait
  updateTrait: async (id: string, data: Partial<Trait>) => {
    return apiFetch<Trait>({
      url: `${TRAITS_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete trait
  deleteTrait: async (id: string) => {
    return apiFetch<void>({
      url: `${TRAITS_URL}/${id}`,
      method: 'DELETE',
    });
  },
};
