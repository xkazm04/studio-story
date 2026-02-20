import { Act, ActCreateInput, ActUpdateInput } from '../../types/Act';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockActs } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const ACTS_URL = `${API_BASE_URL}/acts`;

export const actApi = {
  // Get all acts for a project
  useProjectActs: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<Act[]>(
      ['acts', 'project', projectId],
      () => createFilteredMockQueryFn(mockActs, (a: Act) => a.project_id === projectId),
      `${ACTS_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get a single act
  useAct: (id: string, enabled: boolean = true) => {
    return createMockableQuery<Act>(
      ['acts', id],
      () => createSingleMockQueryFn(mockActs, (a: Act) => a.id === id, 'Act not found'),
      `${ACTS_URL}/${id}`,
      enabled && !!id
    );
  },

  // Create act
  createAct: async (data: ActCreateInput) => {
    return apiFetch<Act>({
      url: ACTS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update act
  updateAct: async (id: string, data: ActUpdateInput) => {
    return apiFetch<Act>({
      url: `${ACTS_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Rename act
  renameAct: async (id: string, name: string) => {
    return apiFetch<Act>({
      url: `${ACTS_URL}/${id}`,
      method: 'PUT',
      body: { name },
    });
  },

  // Delete act
  deleteAct: async (id: string) => {
    return apiFetch<void>({
      url: `${ACTS_URL}/${id}`,
      method: 'DELETE',
    });
  },
};
