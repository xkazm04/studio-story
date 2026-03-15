'use client';

import { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from '@/app/store/projectStore';
import { sceneApi } from './useScenes';
import { actApi } from './useActs';
import { beatApi } from './useBeats';
import { characterApi } from './useCharacters';
import { storyboardEngine } from '@/lib/image';
import type { StoryboardFrame, StoryboardActGroup } from '@/lib/image';
import type { Scene } from '@/app/types/Scene';

export interface UseStoryboardPipelineReturn {
  /** All act groups with their storyboard frames */
  actGroups: StoryboardActGroup[];
  /** Currently selected frame */
  selectedFrame: StoryboardFrame | null;
  /** Select a frame by scene ID */
  selectFrame: (sceneId: string) => void;
  /** Navigate to next/previous frame */
  nextFrame: () => void;
  prevFrame: () => void;
  /** Change the selected prompt variant for the current frame */
  selectPromptVariant: (index: number) => void;
  /** Save generated image back to scene */
  saveFrameImage: (sceneId: string, imageUrl: string, imagePrompt: string) => Promise<void>;
  /** Regenerate prompts for a specific frame */
  regenerateFrame: (sceneId: string) => void;
  /** Loading state */
  isLoading: boolean;
  /** Total frame count */
  totalFrames: number;
  /** Current frame index (across all acts) */
  currentFrameIndex: number;
}

export function useStoryboardPipeline(): UseStoryboardPipelineReturn {
  const { selectedProject, selectedAct } = useProjectStore();
  const projectId = selectedProject?.id || '';

  // Data fetching
  const { data: scenes = [], isLoading: loadingScenes } = sceneApi.useProjectScenes(
    projectId,
    !!projectId
  );
  const { data: acts = [], isLoading: loadingActs } = actApi.useProjectActs(
    projectId,
    !!projectId
  );
  const { data: beats = [], isLoading: loadingBeats } = beatApi.useGetBeats(
    projectId,
    !!projectId
  );
  const { data: characters = [], isLoading: loadingChars } = characterApi.useProjectCharacters(
    projectId,
    !!projectId
  );

  const isLoading = loadingScenes || loadingActs || loadingBeats || loadingChars;

  // State
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [promptVariants, setPromptVariants] = useState<Record<string, number>>({});

  // Build storyboard act groups
  const actGroups = useMemo(() => {
    if (!acts.length || !scenes.length) return [];

    const sortedActs = [...acts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // If a specific act is selected, only show that act
    const targetActs = selectedAct
      ? sortedActs.filter((a) => a.id === selectedAct.id)
      : sortedActs;

    return targetActs.map((act) =>
      storyboardEngine.generateActStoryboard(scenes, beats, characters, act)
    );
  }, [acts, scenes, beats, characters, selectedAct]);

  // Flatten all frames for navigation
  const allFrames = useMemo(
    () => actGroups.flatMap((g) => g.frames),
    [actGroups]
  );

  // Apply prompt variant overrides
  const framesWithVariants = useMemo(
    () =>
      allFrames.map((frame) => ({
        ...frame,
        selectedPromptIndex: promptVariants[frame.sceneId] ?? frame.selectedPromptIndex,
      })),
    [allFrames, promptVariants]
  );

  // Selected frame
  const selectedFrame = useMemo(() => {
    if (!selectedSceneId) return framesWithVariants[0] ?? null;
    return framesWithVariants.find((f) => f.sceneId === selectedSceneId) ?? null;
  }, [selectedSceneId, framesWithVariants]);

  const currentFrameIndex = useMemo(() => {
    if (!selectedFrame) return 0;
    return framesWithVariants.findIndex((f) => f.sceneId === selectedFrame.sceneId);
  }, [selectedFrame, framesWithVariants]);

  // Actions
  const selectFrame = useCallback((sceneId: string) => {
    setSelectedSceneId(sceneId);
  }, []);

  const nextFrame = useCallback(() => {
    const nextIdx = Math.min(currentFrameIndex + 1, framesWithVariants.length - 1);
    const next = framesWithVariants[nextIdx];
    if (next) setSelectedSceneId(next.sceneId);
  }, [currentFrameIndex, framesWithVariants]);

  const prevFrame = useCallback(() => {
    const prevIdx = Math.max(currentFrameIndex - 1, 0);
    const prev = framesWithVariants[prevIdx];
    if (prev) setSelectedSceneId(prev.sceneId);
  }, [currentFrameIndex, framesWithVariants]);

  const selectPromptVariant = useCallback(
    (index: number) => {
      if (!selectedFrame) return;
      setPromptVariants((prev) => ({
        ...prev,
        [selectedFrame.sceneId]: index,
      }));
    },
    [selectedFrame]
  );

  const saveFrameImage = useCallback(
    async (sceneId: string, imageUrl: string, imagePrompt: string) => {
      await sceneApi.updateScene(sceneId, {
        image_url: imageUrl,
        image_prompt: imagePrompt,
      });
    },
    []
  );

  const regenerateFrame = useCallback(
    (sceneId: string) => {
      // Clear variant override so the frame regenerates with fresh data
      setPromptVariants((prev) => {
        const next = { ...prev };
        delete next[sceneId];
        return next;
      });
    },
    []
  );

  return {
    actGroups,
    selectedFrame,
    selectFrame,
    nextFrame,
    prevFrame,
    selectPromptVariant,
    saveFrameImage,
    regenerateFrame,
    isLoading,
    totalFrames: framesWithVariants.length,
    currentFrameIndex,
  };
}
