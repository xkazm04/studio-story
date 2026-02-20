import { GeneratedVideo, VideoStoryboard, StoryboardFrame } from '../../types/Video';
import { apiFetch, API_BASE_URL } from '../../utils/api';
import { mockGeneratedVideos, mockVideoStoryboards, mockStoryboardFrames } from '../../../../db/mockData';
import { createMockableQuery, createFilteredMockQueryFn, createSingleMockQueryFn } from './queryHelpers';

const VIDEOS_URL = `${API_BASE_URL}/videos`;
const STORYBOARDS_URL = `${API_BASE_URL}/storyboards`;

export const videoApi = {
  // Get all generated videos for a project
  useVideosByProject: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<GeneratedVideo[]>(
      ['videos', 'project', projectId],
      () => createFilteredMockQueryFn(mockGeneratedVideos as GeneratedVideo[], v => v.project_id === projectId),
      `${VIDEOS_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get a single video by ID
  useVideo: (videoId: string, enabled: boolean = true) => {
    return createMockableQuery<GeneratedVideo>(
      ['videos', videoId],
      () => createSingleMockQueryFn(mockGeneratedVideos as GeneratedVideo[], v => v.id === videoId, 'Video not found'),
      `${VIDEOS_URL}/${videoId}`,
      enabled && !!videoId
    );
  },

  // Get video variants (child videos)
  useVideoVariants: (parentVideoId: string, enabled: boolean = true) => {
    return createMockableQuery<GeneratedVideo[]>(
      ['video-variants', parentVideoId],
      () => createFilteredMockQueryFn(mockGeneratedVideos as GeneratedVideo[], v => v.parent_video_id === parentVideoId),
      `${VIDEOS_URL}/${parentVideoId}/variants`,
      enabled && !!parentVideoId
    );
  },

  // Get storyboards for a project
  useStoryboardsByProject: (projectId: string, enabled: boolean = true) => {
    return createMockableQuery<VideoStoryboard[]>(
      ['storyboards', 'project', projectId],
      () => createFilteredMockQueryFn(mockVideoStoryboards as VideoStoryboard[], s => s.project_id === projectId),
      `${STORYBOARDS_URL}?projectId=${projectId}`,
      enabled && !!projectId
    );
  },

  // Get storyboard frames
  useStoryboardFrames: (storyboardId: string, enabled: boolean = true) => {
    return createMockableQuery<StoryboardFrame[]>(
      ['storyboard-frames', storyboardId],
      async () => {
        // Map mock data to app type (order_index -> order)
        const filtered = mockStoryboardFrames.filter(f => f.storyboard_id === storyboardId);
        const mapped: StoryboardFrame[] = filtered.map(f => ({
          id: f.id,
          storyboard_id: f.storyboard_id,
          order: f.order_index,
          prompt: f.prompt,
          duration: f.duration,
          image_id: f.image_id,
          video_id: f.video_id,
          transition: f.transition,
          notes: f.notes,
        }));
        const { simulateApiCall } = await import('../../../../db/mockData');
        return simulateApiCall(mapped);
      },
      `${STORYBOARDS_URL}/${storyboardId}/frames`,
      enabled && !!storyboardId
    );
  },

  // Create video record
  createVideo: async (data: Partial<GeneratedVideo>) => {
    return apiFetch<GeneratedVideo>({
      url: VIDEOS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Update video record
  updateVideo: async (id: string, data: Partial<GeneratedVideo>) => {
    return apiFetch<GeneratedVideo>({
      url: `${VIDEOS_URL}/${id}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete video
  deleteVideo: async (id: string) => {
    return apiFetch<void>({
      url: `${VIDEOS_URL}/${id}`,
      method: 'DELETE',
    });
  },

  // Create storyboard
  createStoryboard: async (data: Partial<VideoStoryboard>) => {
    return apiFetch<VideoStoryboard>({
      url: STORYBOARDS_URL,
      method: 'POST',
      body: data,
    });
  },

  // Create storyboard frame
  createStoryboardFrame: async (storyboardId: string, frame: Partial<StoryboardFrame>) => {
    return apiFetch<StoryboardFrame>({
      url: `${STORYBOARDS_URL}/${storyboardId}/frames`,
      method: 'POST',
      body: frame,
    });
  },

  // Update storyboard frame
  updateStoryboardFrame: async (storyboardId: string, frameId: string, data: Partial<StoryboardFrame>) => {
    return apiFetch<StoryboardFrame>({
      url: `${STORYBOARDS_URL}/${storyboardId}/frames/${frameId}`,
      method: 'PUT',
      body: data,
    });
  },

  // Delete storyboard frame
  deleteStoryboardFrame: async (storyboardId: string, frameId: string) => {
    return apiFetch<void>({
      url: `${STORYBOARDS_URL}/${storyboardId}/frames/${frameId}`,
      method: 'DELETE',
    });
  },
};
