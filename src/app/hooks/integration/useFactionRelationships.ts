import { FactionRelationship } from '../../types/Faction';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockFactionRelationships } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const FACTION_RELATIONSHIPS_URL = `${API_BASE_URL}/faction-relationships`;

export const factionRelationshipApi = {
  // Get all relationships for a faction
  useFactionRelationships: (factionId: string, enabled: boolean = true) => {
    return createMockableQuery<FactionRelationship[]>(
      ['factionRelationships', 'faction', factionId],
      () => createFilteredMockQueryFn(
        mockFactionRelationships,
        r => r.faction_a_id === factionId || r.faction_b_id === factionId
      ),
      `${FACTION_RELATIONSHIPS_URL}?factionId=${factionId}`,
      enabled && !!factionId
    );
  },

  // Get a single relationship
  useFactionRelationship: (id: string, enabled: boolean = true) => {
    return createMockableQuery<FactionRelationship>(
      ['factionRelationships', id],
      () => createSingleMockQueryFn(mockFactionRelationships, r => r.id === id, 'Faction relationship not found'),
      `${FACTION_RELATIONSHIPS_URL}/${id}`,
      enabled && !!id
    );
  },

  // Create faction relationship
  createFactionRelationship: async (data: {
    faction_a_id: string;
    faction_b_id: string;
    description: string;
    relationship_type?: string;
  }) => {
    return apiFetch<FactionRelationship>({
      url: FACTION_RELATIONSHIPS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update faction relationship
  updateFactionRelationship: async (id: string, data: Partial<FactionRelationship>) => {
    return apiFetch<FactionRelationship>({
      url: FACTION_RELATIONSHIPS_URL,
      method: 'PUT',
      body: data,
    });
  },

  // Delete faction relationship
  deleteFactionRelationship: async (id: string) => {
    return apiFetch<void>({
      url: FACTION_RELATIONSHIPS_URL,
      method: 'DELETE',
    });
  },
};
