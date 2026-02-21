/**
 * Video hooks - re-export from integration layer
 *
 * These hooks now use the mockable query pattern to support both
 * mock data (NEXT_PUBLIC_USE_MOCK_DATA=true) and real Supabase data.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videoApi } from './integration/useVideos';
import type { GeneratedVideo, VideoStoryboard, StoryboardFrame } from '../types/Video';

// Re-export the API object
export { videoApi };

// Re-export query hooks for backwards compatibility with direct hook imports
export const useVideosByProject = videoApi.useVideosByProject;
export const useVideo = videoApi.useVideo;
export const useVideoVariants = videoApi.useVideoVariants;
export const useStoryboardsByProject = videoApi.useStoryboardsByProject;
export const useStoryboardFrames = videoApi.useStoryboardFrames;

// Mutation hooks for backwards compatibility
export const useCreateVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (video: Partial<GeneratedVideo>) => {
      return videoApi.createVideo(video);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['videos', 'project', data.project_id] });
    },
  });
};

export const useUpdateVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GeneratedVideo> }) => {
      return videoApi.updateVideo(id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['videos', 'project', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['videos', data.id] });
    },
  });
};

export const useDeleteVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await videoApi.deleteVideo(id);
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['videos', 'project', data.projectId] });
    },
  });
};

export const useCreateStoryboard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (storyboard: Partial<VideoStoryboard>) => {
      return videoApi.createStoryboard(storyboard);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['storyboards', 'project', data.project_id] });
    },
  });
};

export const useCreateStoryboardFrame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frame: Partial<StoryboardFrame> & { storyboard_id: string }) => {
      return videoApi.createStoryboardFrame(frame.storyboard_id, frame);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['storyboard-frames', data.storyboard_id] });
    },
  });
};

export const useUpdateStoryboardFrame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storyboardId, updates }: { id: string; storyboardId: string; updates: Partial<StoryboardFrame> }) => {
      return videoApi.updateStoryboardFrame(storyboardId, id, updates);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['storyboard-frames', data.storyboard_id] });
    },
  });
};

export const useDeleteStoryboardFrame = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storyboardId }: { id: string; storyboardId: string }) => {
      await videoApi.deleteStoryboardFrame(storyboardId, id);
      return { id, storyboardId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['storyboard-frames', data.storyboardId] });
    },
  });
};
