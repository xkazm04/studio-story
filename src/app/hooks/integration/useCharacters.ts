import { Character } from '../../types/Character';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockCharacters } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const CHARACTERS_URL = `${API_BASE_URL}/characters`;

export const characterApi = {
  // Get all characters for a project
  useProjectCharacters: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<Character[]>(
      ['characters', 'project', projectId],
      () => createFilteredMockQueryFn(mockCharacters, c => c.project_id === projectId),
      `${CHARACTERS_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get a single character
  useGetCharacter: (id: string, enabled: boolean = true) => {
    return createMockableQuery<Character>(
      ['characters', id],
      () => createSingleMockQueryFn(mockCharacters, c => c.id === id, 'Character not found'),
      `${CHARACTERS_URL}/${id}`,
      enabled && !!id
    );
  },

  // Get characters by faction
  useCharactersByFaction: (factionId: string, enabled: boolean = true) => {
    return createMockableQuery<Character[]>(
      ['characters', 'faction', factionId],
      () => createFilteredMockQueryFn(mockCharacters, c => c.faction_id === factionId),
      `${CHARACTERS_URL}/faction/${factionId}`,
      enabled && !!factionId
    );
  },

  // Create character
  createCharacter: async (data: {
    name: string;
    project_id: string;
    type?: string;
    faction_id?: string;
  }) => {
    return apiFetch<Character>({
      url: CHARACTERS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update character
  updateCharacter: async (id: string, data: Partial<Character>) => {
    return apiFetch<Character>({
      url: `${CHARACTERS_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Update character avatar
  updateAvatar: async (id: string, avatar_url: string) => {
    return apiFetch<Character>({
      url: `${CHARACTERS_URL}/${id}/avatar`,
      method: 'PUT',
      body: { avatar_url },
    });
  },

  // Delete character
  deleteCharacter: async (id: string) => {
    return apiFetch<void>({
      url: `${CHARACTERS_URL}/${id}`,
      method: 'DELETE',
    });
  },
};
