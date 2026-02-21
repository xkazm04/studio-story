/**
 * Dataset hooks - re-export from integration layer
 *
 * These hooks now use the mockable query pattern to support both
 * mock data (NEXT_PUBLIC_USE_MOCK_DATA=true) and real Supabase data.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { datasetApi } from './integration/useDatasets';
import type { Dataset, DatasetImage, AudioTranscription } from '../types/Dataset';

// Re-export the API object
export { datasetApi };

// Re-export query hooks for backwards compatibility with direct hook imports
export const useDatasetsByProject = datasetApi.useDatasetsByProject;
export const useDataset = datasetApi.useDataset;
export const useDatasetImages = datasetApi.useDatasetImages;
export const useTranscriptions = datasetApi.useTranscriptions;

// Mutation hooks for backwards compatibility
export const useCreateDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dataset: Partial<Dataset>) => {
      return datasetApi.createDataset(dataset);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['datasets', 'project', data.project_id] });
    },
  });
};

export const useUpdateDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Dataset> }) => {
      return datasetApi.updateDataset(id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['datasets', 'project', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['datasets', data.id] });
    },
  });
};

export const useDeleteDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await datasetApi.deleteDataset(id);
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['datasets', 'project', data.projectId] });
    },
  });
};

export const useAddImageToDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: Partial<DatasetImage> & { dataset_id: string }) => {
      return datasetApi.addImageToDataset(image.dataset_id, image);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dataset-images', data.dataset_id] });
    },
  });
};

export const useRemoveImageFromDataset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ imageId, datasetId }: { imageId: string; datasetId: string }) => {
      await datasetApi.removeImageFromDataset(datasetId, imageId);
      return { imageId, datasetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dataset-images', data.datasetId] });
    },
  });
};

export const useCreateTranscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transcription: Partial<AudioTranscription>) => {
      return datasetApi.createTranscription(transcription);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcriptions'] });
    },
  });
};
