import { Project } from '../../types/Project';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mockProjects } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const PROJECTS_URL = `${API_BASE_URL}/projects`;

export const projectApi = {
  // Get all projects for a user
  useUserProjects: (userId: string, enabled: boolean = true) => {
    return createMockableQuery<Project[]>(
      ['projects', 'user', userId],
      () => createFilteredMockQueryFn(mockProjects, p => p.user_id === userId),
      `${PROJECTS_URL}?userId=${userId}`,
      enabled && !!userId
    );
  },

  // Get a single project
  useProject: (id: string, enabled: boolean = true) => {
    return createMockableQuery<Project>(
      ['projects', id],
      () => createSingleMockQueryFn(mockProjects, p => p.id === id, 'Project not found'),
      `${PROJECTS_URL}/${id}`,
      enabled && !!id
    );
  },

  // Create project
  createProject: async (data: {
    name: string;
    description?: string;
    user_id: string;
    type?: string;
  }) => {
    return apiFetch<Project>({
      url: PROJECTS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update project
  updateProject: async (id: string, data: Partial<Project>) => {
    return apiFetch<Project>({
      url: `${PROJECTS_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete project
  deleteProject: async (id: string) => {
    return apiFetch<void>({
      url: `${PROJECTS_URL}/${id}`,
      method: 'DELETE',
    });
  },

  // Mutation hooks
  useCreateProject: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: { name: string; description?: string; user_id: string; type?: string }) =>
        projectApi.createProject(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
    });
  },

  useUpdateProject: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
        projectApi.updateProject(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
    });
  },

  useDeleteProject: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => projectApi.deleteProject(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      },
    });
  },
};
