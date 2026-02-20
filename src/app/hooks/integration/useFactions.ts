import { Faction, FactionEvent, FactionAchievement, FactionLore, FactionMedia, FactionSummary, SemanticSearchResult, SemanticSearchRequest } from '../../types/Faction';
import { apiFetch, useApiGet, API_BASE_URL, USE_MOCK_DATA } from '../../utils/api';
import { useQuery } from '@tanstack/react-query';
import { mockFactions, mockFactionEvents, mockFactionAchievements, mockFactionLore, mockFactionMedia, simulateApiCall, mockCharacters } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const FACTIONS_URL = `${API_BASE_URL}/factions`;

export const factionApi = {
  // Get all factions for a project
  useFactions: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<Faction[]>(
      ['factions', 'project', projectId],
      () => createFilteredMockQueryFn(mockFactions, f => f.project_id === projectId),
      `${FACTIONS_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get a single faction
  useFaction: (id: string, enabled: boolean = true) => {
    return createMockableQuery<Faction>(
      ['factions', id],
      () => createSingleMockQueryFn(mockFactions, f => f.id === id, 'Faction not found'),
      `${FACTIONS_URL}/${id}`,
      enabled && !!id
    );
  },

  // Get faction summary (aggregated data - members, relationships, media, lore, achievements, events)
  useFactionSummary: (id: string, enabled: boolean = true) => {
    if (USE_MOCK_DATA) {
      return useQuery<FactionSummary>({
        queryKey: ['factions', id, 'summary'],
        queryFn: async () => {
          const faction = mockFactions.find(f => f.id === id);
          if (!faction) throw new Error('Faction not found');

          const members = mockCharacters
            .filter(c => c.faction_id === id)
            .map(c => ({
              id: c.id,
              name: c.name,
              avatar_url: c.avatar_url,
              faction_id: c.faction_id || undefined,
              faction_role: c.faction_role,
              faction_rank: c.faction_rank,
            }));

          const media = mockFactionMedia.filter(m => m.faction_id === id);
          const lore = mockFactionLore
            .filter(l => l.faction_id === id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const achievements = mockFactionAchievements
            .filter(a => a.faction_id === id)
            .sort((a, b) => new Date(b.earned_date).getTime() - new Date(a.earned_date).getTime());
          const events = mockFactionEvents
            .filter(e => e.faction_id === id)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          const summary: FactionSummary = {
            faction,
            members,
            relationships: [], // Mock doesn't have faction relationships data
            media,
            lore,
            achievements,
            events,
          };

          return simulateApiCall(summary);
        },
        enabled: enabled && !!id,
        staleTime: 5 * 60 * 1000,
      });
    }
    const url = `${FACTIONS_URL}/${id}/summary`;
    return useApiGet<FactionSummary>(url, enabled && !!id);
  },

  // Create faction
  createFaction: async (data: {
    name: string;
    project_id: string;
    description?: string;
  }) => {
    return apiFetch<Faction>({
      url: FACTIONS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update faction
  updateFaction: async (id: string, data: Partial<Faction>) => {
    return apiFetch<Faction>({
      url: `${FACTIONS_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete faction
  deleteFaction: async (id: string) => {
    return apiFetch<void>({
      url: `${FACTIONS_URL}/${id}`,
      method: 'DELETE',
    });
  },

  // Get faction media
  useFactionMedia: (factionId: string, enabled: boolean = true) => {
    return createMockableQuery<FactionMedia[]>(
      ['faction-media', factionId],
      () => createFilteredMockQueryFn(mockFactionMedia, m => m.faction_id === factionId),
      `${FACTIONS_URL}/${factionId}/media`,
      enabled && !!factionId
    );
  },

  // Upload faction media
  uploadFactionMedia: async (factionId: string, file: File, type: string, description: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('description', description);

    return apiFetch<FactionMedia>({
      url: `${FACTIONS_URL}/${factionId}/media`,
      method: 'POST',
      body: formData,
    });
  },

  // Delete faction media
  deleteFactionMedia: async (mediaId: string) => {
    return apiFetch<void>({
      url: `${API_BASE_URL}/faction-media/${mediaId}`,
      method: 'DELETE',
    });
  },

  // Get faction events
  useFactionEvents: (factionId: string, enabled: boolean = true) => {
    return createMockableQuery<FactionEvent[]>(
      ['faction-events', factionId],
      async () => {
        const filtered = mockFactionEvents
          .filter(e => e.faction_id === factionId)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return simulateApiCall(filtered);
      },
      `${FACTIONS_URL}/${factionId}/events`,
      enabled && !!factionId
    );
  },

  // Create faction event
  createFactionEvent: async (data: Omit<FactionEvent, 'id' | 'created_at'>) => {
    return apiFetch<FactionEvent>({
      url: `${FACTIONS_URL}/${data.faction_id}/events`,
      method: 'POST',
      body: data,
    });
  },

  // Update faction event
  updateFactionEvent: async (eventId: string, data: Partial<FactionEvent>) => {
    return apiFetch<FactionEvent>({
      url: `${API_BASE_URL}/faction-events/${eventId}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete faction event
  deleteFactionEvent: async (eventId: string) => {
    return apiFetch<void>({
      url: `${API_BASE_URL}/faction-events/${eventId}`,
      method: 'DELETE',
    });
  },

  // Get faction achievements
  useFactionAchievements: (factionId: string, enabled: boolean = true) => {
    return createMockableQuery<FactionAchievement[]>(
      ['faction-achievements', factionId],
      async () => {
        const filtered = mockFactionAchievements
          .filter(a => a.faction_id === factionId)
          .sort((a, b) => new Date(b.earned_date).getTime() - new Date(a.earned_date).getTime());
        return simulateApiCall(filtered);
      },
      `${FACTIONS_URL}/${factionId}/achievements`,
      enabled && !!factionId
    );
  },

  // Create faction achievement
  createFactionAchievement: async (data: Omit<FactionAchievement, 'id' | 'created_at'>) => {
    return apiFetch<FactionAchievement>({
      url: `${FACTIONS_URL}/${data.faction_id}/achievements`,
      method: 'POST',
      body: data,
    });
  },

  // Update faction achievement
  updateFactionAchievement: async (achievementId: string, data: Partial<FactionAchievement>) => {
    return apiFetch<FactionAchievement>({
      url: `${API_BASE_URL}/faction-achievements/${achievementId}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete faction achievement
  deleteFactionAchievement: async (achievementId: string) => {
    return apiFetch<void>({
      url: `${API_BASE_URL}/faction-achievements/${achievementId}`,
      method: 'DELETE',
    });
  },

  // Get faction lore
  useFactionLore: (factionId: string, enabled: boolean = true) => {
    return createMockableQuery<FactionLore[]>(
      ['faction-lore', factionId],
      async () => {
        const filtered = mockFactionLore
          .filter(l => l.faction_id === factionId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return simulateApiCall(filtered);
      },
      `${FACTIONS_URL}/${factionId}/lore`,
      enabled && !!factionId
    );
  },

  // Create faction lore
  createFactionLore: async (data: Omit<FactionLore, 'id'>) => {
    return apiFetch<FactionLore>({
      url: `${FACTIONS_URL}/${data.faction_id}/lore`,
      method: 'POST',
      body: data,
    });
  },

  // Update faction lore
  updateFactionLore: async (loreId: string, data: Partial<FactionLore>) => {
    return apiFetch<FactionLore>({
      url: `${API_BASE_URL}/faction-lore/${loreId}`,
      method: 'PUT',
      body: data,
    });
  },

  // Update faction lore with AI summary and tags
  updateFactionLoreWithAI: async (loreId: string, summary: string, tags: string[], ai_generated_at: string) => {
    return apiFetch<FactionLore>({
      url: `${API_BASE_URL}/faction-lore/${loreId}`,
      method: 'PUT',
      body: {
        summary,
        tags,
        ai_generated_at,
      },
    });
  },

  // Delete faction lore
  deleteFactionLore: async (loreId: string) => {
    return apiFetch<void>({
      url: `${API_BASE_URL}/faction-lore/${loreId}`,
      method: 'DELETE',
    });
  },

  // Update faction branding
  updateFactionBranding: async (factionId: string, branding: Partial<Faction['branding']>) => {
    return apiFetch<Faction>({
      url: `${FACTIONS_URL}/${factionId}/branding`,
      method: 'PUT',
      body: branding,
    });
  },

  // AI-powered faction generation
  generateFactionWithAI: async (prompt: string, factionType?: string, projectId?: string) => {
    return apiFetch<any>({
      url: `${API_BASE_URL}/ai/generate-faction`,
      method: 'POST',
      body: {
        prompt,
        faction_type: factionType,
        project_id: projectId,
      },
    });
  },

  // Semantic search across faction knowledge base
  semanticSearch: async (request: SemanticSearchRequest) => {
    if (USE_MOCK_DATA) {
      // Mock implementation for semantic search
      await simulateApiCall(null);

      const { query, faction_id, limit = 10, threshold = 0.7, types } = request;
      const results: SemanticSearchResult[] = [];

      // Search in lore
      if (!types || types.includes('lore')) {
        const lore = mockFactionLore.filter(l => l.faction_id === faction_id);
        lore.forEach(l => {
          const searchableContent = `${l.title} ${l.content}`.toLowerCase();
          const queryLower = query.toLowerCase();

          // Simple keyword matching for mock (in production, use actual embeddings)
          const words = queryLower.split(' ');
          const matchCount = words.filter(word => searchableContent.includes(word)).length;
          const similarity = matchCount / words.length;

          if (similarity >= threshold) {
            results.push({
              id: l.id,
              content: l.content,
              title: l.title,
              type: 'lore',
              category: l.category,
              similarity_score: similarity,
              metadata: {
                faction_id: l.faction_id,
                faction_name: mockFactions.find(f => f.id === faction_id)?.name || '',
                created_at: l.created_at,
              },
            });
          }
        });
      }

      // Search in media descriptions
      if (!types || types.includes('media')) {
        const media = mockFactionMedia.filter(m => m.faction_id === faction_id);
        media.forEach(m => {
          if (m.description) {
            const searchableContent = m.description.toLowerCase();
            const queryLower = query.toLowerCase();

            const words = queryLower.split(' ');
            const matchCount = words.filter(word => searchableContent.includes(word)).length;
            const similarity = matchCount / words.length;

            if (similarity >= threshold) {
              results.push({
                id: m.id,
                content: m.description,
                title: `${m.type} media`,
                type: 'media',
                similarity_score: similarity,
                metadata: {
                  faction_id: m.faction_id,
                  faction_name: mockFactions.find(f => f.id === faction_id)?.name || '',
                  created_at: m.uploaded_at,
                  url: m.url,
                },
              });
            }
          }
        });
      }

      // Search in events
      if (!types || types.includes('event')) {
        const events = mockFactionEvents.filter(e => e.faction_id === faction_id);
        events.forEach(e => {
          const searchableContent = `${e.title} ${e.description}`.toLowerCase();
          const queryLower = query.toLowerCase();

          const words = queryLower.split(' ');
          const matchCount = words.filter(word => searchableContent.includes(word)).length;
          const similarity = matchCount / words.length;

          if (similarity >= threshold) {
            results.push({
              id: e.id,
              content: e.description,
              title: e.title,
              type: 'event',
              similarity_score: similarity,
              metadata: {
                faction_id: e.faction_id,
                faction_name: mockFactions.find(f => f.id === faction_id)?.name || '',
                created_at: e.created_at,
                event_type: e.event_type,
              },
            });
          }
        });
      }

      // Search in achievements
      if (!types || types.includes('achievement')) {
        const achievements = mockFactionAchievements.filter(a => a.faction_id === faction_id);
        achievements.forEach(a => {
          const searchableContent = `${a.title} ${a.description}`.toLowerCase();
          const queryLower = query.toLowerCase();

          const words = queryLower.split(' ');
          const matchCount = words.filter(word => searchableContent.includes(word)).length;
          const similarity = matchCount / words.length;

          if (similarity >= threshold) {
            results.push({
              id: a.id,
              content: a.description,
              title: a.title,
              type: 'achievement',
              similarity_score: similarity,
              metadata: {
                faction_id: a.faction_id,
                faction_name: mockFactions.find(f => f.id === faction_id)?.name || '',
                created_at: a.created_at,
              },
            });
          }
        });
      }

      // Sort by similarity score and limit
      return results
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, limit);
    }

    return apiFetch<SemanticSearchResult[]>({
      url: `${API_BASE_URL}/factions/semantic-search`,
      method: 'POST',
      body: request,
    });
  },
};
