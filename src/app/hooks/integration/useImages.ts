import { GeneratedImage } from '../../types/Image';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockGeneratedImages } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const IMAGES_URL = `${API_BASE_URL}/images`;

export const imageApi = {
  // Get all generated images for a project
  useImagesByProject: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<GeneratedImage[]>(
      ['images', 'project', projectId],
      () => createFilteredMockQueryFn(mockGeneratedImages as GeneratedImage[], i => i.project_id === projectId),
      `${IMAGES_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get a single image by ID
  useImage: (imageId: string, enabled: boolean = true) => {
    return createMockableQuery<GeneratedImage>(
      ['images', imageId],
      () => createSingleMockQueryFn(mockGeneratedImages as GeneratedImage[], i => i.id === imageId, 'Image not found'),
      `${IMAGES_URL}/${imageId}`,
      enabled && !!imageId
    );
  },

  // Get image variants (child images)
  useImageVariants: (parentImageId: string, enabled: boolean = true) => {
    return createMockableQuery<GeneratedImage[]>(
      ['image-variants', parentImageId],
      () => createFilteredMockQueryFn(mockGeneratedImages as GeneratedImage[], i => i.parent_image_id === parentImageId),
      `${IMAGES_URL}/${parentImageId}/variants`,
      enabled && !!parentImageId
    );
  },

  // Create image record
  createImage: async (data: Partial<GeneratedImage>) => {
    return apiFetch<GeneratedImage>({
      url: IMAGES_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update image record
  updateImage: async (id: string, data: Partial<GeneratedImage>) => {
    return apiFetch<GeneratedImage>({
      url: `${IMAGES_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete image
  deleteImage: async (id: string) => {
    return apiFetch<void>({
      url: `${IMAGES_URL}/${id}`,
      method: 'DELETE',
    });
  },
};
