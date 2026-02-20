import { Dataset, DatasetImage, AudioTranscription } from '../../types/Dataset';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockDatasets, mockDatasetImages, mockAudioTranscriptions } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn, createMockQueryFn } from './queryHelpers';

const DATASETS_URL = `${API_BASE_URL}/datasets`;

export const datasetApi = {
  // Get all datasets for a project
  useDatasetsByProject: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<Dataset[]>(
      ['datasets', 'project', projectId],
      () => createFilteredMockQueryFn(mockDatasets as Dataset[], d => d.project_id === projectId),
      `${DATASETS_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get a single dataset by ID
  useDataset: (datasetId: string, enabled: boolean = true) => {
    return createMockableQuery<Dataset>(
      ['datasets', datasetId],
      () => createSingleMockQueryFn(mockDatasets as Dataset[], d => d.id === datasetId, 'Dataset not found'),
      `${DATASETS_URL}/${datasetId}`,
      enabled && !!datasetId
    );
  },

  // Get images for a dataset
  useDatasetImages: (datasetId: string, enabled: boolean = true) => {
    return createMockableQuery<DatasetImage[]>(
      ['dataset-images', datasetId],
      () => createFilteredMockQueryFn(mockDatasetImages as DatasetImage[], di => di.dataset_id === datasetId),
      `${DATASETS_URL}/${datasetId}/images`,
      enabled && !!datasetId
    );
  },

  // Get audio transcriptions
  useTranscriptions: (filters?: { filename?: string }, enabled: boolean = true) => {
    return createMockableQuery<AudioTranscription[]>(
      ['transcriptions', filters?.filename],
      () => {
        const filtered = filters?.filename
          ? (mockAudioTranscriptions as AudioTranscription[]).filter(t => t.filename === filters.filename)
          : (mockAudioTranscriptions as AudioTranscription[]);
        return createMockQueryFn(filtered);
      },
      filters?.filename
        ? `${DATASETS_URL}/transcriptions?filename=${filters.filename}`
        : `${DATASETS_URL}/transcriptions`,
      enabled
    );
  },

  // Create dataset
  createDataset: async (data: Partial<Dataset>) => {
    return apiFetch<Dataset>({
      url: DATASETS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update dataset
  updateDataset: async (id: string, data: Partial<Dataset>) => {
    return apiFetch<Dataset>({
      url: `${DATASETS_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete dataset
  deleteDataset: async (id: string) => {
    return apiFetch<void>({
      url: `${DATASETS_URL}/${id}`,
      method: 'DELETE',
    });
  },

  // Add image to dataset
  addImageToDataset: async (datasetId: string, image: Partial<DatasetImage>) => {
    return apiFetch<DatasetImage>({
      url: `${DATASETS_URL}/${datasetId}/images`,
      method: 'POST',
      body: image,
    });
  },

  // Remove image from dataset
  removeImageFromDataset: async (datasetId: string, imageId: string) => {
    return apiFetch<void>({
      url: `${DATASETS_URL}/${datasetId}/images/${imageId}`,
      method: 'DELETE',
    });
  },

  // Create transcription
  createTranscription: async (transcription: Partial<AudioTranscription>) => {
    return apiFetch<AudioTranscription>({
      url: `${DATASETS_URL}/transcriptions`,
      method: 'POST',
      body: transcription,
    });
  },
};
