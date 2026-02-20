import { CharRelationship } from '../../types/Character';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockCharRelationships } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const RELATIONSHIPS_URL = `${API_BASE_URL}/relationships`;

export const relationshipApi = {
  // Get all relationships for a character
  useCharacterRelationships: (characterId: string, enabled: boolean = true) => {
    return createMockableQuery<CharRelationship[]>(
      ['relationships', 'character', characterId],
      () => createFilteredMockQueryFn(
        mockCharRelationships,
        r => r.character_a_id === characterId || r.character_b_id === characterId
      ),
      `${RELATIONSHIPS_URL}?characterId=${characterId}`,
      enabled && !!characterId
    );
  },

  // Get a single relationship
  useRelationship: (id: string, enabled: boolean = true) => {
    return createMockableQuery<CharRelationship>(
      ['relationships', id],
      () => createSingleMockQueryFn(mockCharRelationships, r => r.id === id, 'Relationship not found'),
      `${RELATIONSHIPS_URL}/${id}`,
      enabled && !!id
    );
  },

  // Create relationship
  createRelationship: async (data: {
    character_a_id: string;
    character_b_id: string;
    description: string;
    event_date?: string;
    relationship_type?: string;
  }) => {
    return apiFetch<CharRelationship>({
      url: RELATIONSHIPS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update relationship
  updateRelationship: async (id: string, data: Partial<CharRelationship>) => {
    return apiFetch<CharRelationship>({
      url: `${RELATIONSHIPS_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete relationship
  deleteRelationship: async (id: string) => {
    return apiFetch<void>({
      url: `${RELATIONSHIPS_URL}/${id}`,
      method: 'DELETE',
    });
  },
};
