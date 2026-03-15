/**
 * useVNExportData — React hook for assembling Visual Novel export data
 *
 * Fetches scenes, acts, and choices via existing React Query hooks,
 * then assembles StoryExportData using buildVNExportScenes from vnExportBridge.
 * The `enabled` flag ensures no API calls happen until the user selects VN format.
 */

import { useMemo } from 'react';
import { sceneApi } from './useScenes';
import { actApi } from './useActs';
import { sceneChoiceApi } from './useSceneChoices';
import { buildVNExportScenes, type ExportSummary } from '@/lib/export/vnExportBridge';
import type { StoryExportData } from '@/lib/export/types';

export interface UseVNExportDataResult {
  storyExportData: StoryExportData | null;
  summary: ExportSummary | null;
  isLoading: boolean;
  error: Error | null;
}

export function useVNExportData(
  projectId: string,
  title: string,
  author: string,
  artStylePalette?: string[],
  enabled: boolean = false
): UseVNExportDataResult {
  const scenesQuery = sceneApi.useProjectScenes(projectId, enabled && !!projectId);
  const actsQuery = actApi.useProjectActs(projectId, enabled && !!projectId);
  const choicesQuery = sceneChoiceApi.useProjectChoices(projectId, enabled && !!projectId);

  const isLoading = scenesQuery.isLoading || actsQuery.isLoading || choicesQuery.isLoading;

  const error = (scenesQuery.error || actsQuery.error || choicesQuery.error) as Error | null;

  const result = useMemo(() => {
    if (!scenesQuery.data || !actsQuery.data || !choicesQuery.data) {
      return { storyExportData: null, summary: null };
    }

    const { scenes: exportScenes, summary } = buildVNExportScenes({
      scenes: scenesQuery.data.map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order ?? 0,
        act_id: s.act_id,
        script: s.script ?? null,
        content: s.content ?? null,
        image_url: s.image_url ?? null,
        audio_url: s.audio_url ?? null,
      })),
      acts: actsQuery.data.map((a) => ({
        id: a.id,
        order: a.order ?? 0,
      })),
      choices: choicesQuery.data,
      artStylePalette,
    });

    const storyExportData: StoryExportData = {
      title,
      author,
      scenes: exportScenes,
      ...(artStylePalette && artStylePalette.length >= 2
        ? {
            artStyle: {
              palette: artStylePalette,
              backgroundColor: artStylePalette[0],
              accentColor: artStylePalette[1],
            },
          }
        : {}),
    };

    return { storyExportData, summary };
  }, [scenesQuery.data, actsQuery.data, choicesQuery.data, title, author, artStylePalette]);

  return {
    storyExportData: result.storyExportData,
    summary: result.summary,
    isLoading,
    error,
  };
}
