/**
 * Image hooks - re-export from integration layer
 *
 * These hooks now use the mockable query pattern to support both
 * mock data (NEXT_PUBLIC_USE_MOCK_DATA=true) and real Supabase data.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { imageApi } from './integration/useImages';
import type { GeneratedImage } from '../types/Image';

// Re-export the API object
export { imageApi };

// Re-export query hooks for backwards compatibility with direct hook imports
export const useImagesByProject = imageApi.useImagesByProject;
export const useImage = imageApi.useImage;
export const useImageVariants = imageApi.useImageVariants;

// Mutation hooks for backwards compatibility
export const useCreateImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: Partial<GeneratedImage>) => {
      return imageApi.createImage(image);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['images', 'project', data.project_id] });
    },
  });
};

export const useUpdateImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GeneratedImage> }) => {
      return imageApi.updateImage(id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['images', 'project', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['images', data.id] });
    },
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await imageApi.deleteImage(id);
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['images', 'project', data.projectId] });
    },
  });
};
