'use client';

/**
 * useProactiveMuse — Background story analysis hook.
 *
 * Monitors the project store for the selected project and subscribes
 * to story data (characters, scenes, beats, acts, relationships) via
 * React Query. When data changes, runs StoryAnalyzer rules and
 * surfaces MuseInsight cards through the agentStore.
 *
 * Analysis is debounced (5s) to avoid running on every keystroke.
 * Uses content hashing to skip re-analysis when nothing changed.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useAgentStore } from './store/agentStore';
import { analyzeStory, snapshotHash } from './StoryAnalyzer';
import type { StorySnapshot } from './StoryAnalyzer';
import { API_BASE_URL } from '@/app/utils/api';

const ANALYSIS_DEBOUNCE_MS = 5000;

/**
 * Attempt to read cached React Query data for a given key.
 * Returns undefined if no data is cached.
 */
function getCachedData<T>(queryClient: ReturnType<typeof useQueryClient>, key: string): T | undefined {
  return queryClient.getQueryData<T>([key]);
}

interface MinimalCharacter {
  id: string;
  name: string;
  type?: string | null;
  faction_id?: string | null;
}

interface MinimalScene {
  id: string;
  name: string;
  content?: string | null;
  act_id?: string | null;
  order?: number;
}

interface MinimalBeat {
  id: string;
  name: string;
  description?: string | null;
  act_id?: string | null;
  completed?: boolean;
  order?: number;
}

interface MinimalAct {
  id: string;
  name: string;
  order?: number;
}

interface MinimalRelationship {
  id: string;
  character_id_1: string;
  character_id_2: string;
  type?: string | null;
}

export function useProactiveMuse() {
  const queryClient = useQueryClient();
  const selectedProject = useProjectStore((s) => s.selectedProject);
  const setMuseInsights = useAgentStore((s) => s.setMuseInsights);
  const clearMuseInsights = useAgentStore((s) => s.clearMuseInsights);

  const lastHashRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runAnalysis = useCallback(() => {
    if (!selectedProject?.id) {
      clearMuseInsights();
      return;
    }

    const projectId = selectedProject.id;
    const baseUrl = API_BASE_URL;

    // Read from React Query cache — no additional network calls
    const characters = getCachedData<MinimalCharacter[]>(queryClient, `${baseUrl}/characters?project_id=${projectId}`) ?? [];
    const scenes = getCachedData<MinimalScene[]>(queryClient, `${baseUrl}/scenes?project_id=${projectId}`) ?? [];
    const beats = getCachedData<MinimalBeat[]>(queryClient, `${baseUrl}/beats?project_id=${projectId}`) ?? [];
    const acts = getCachedData<MinimalAct[]>(queryClient, `${baseUrl}/acts?project_id=${projectId}`) ?? [];
    const relationships = getCachedData<MinimalRelationship[]>(queryClient, `${baseUrl}/relationships?project_id=${projectId}`) ?? [];

    const snapshot: StorySnapshot = {
      projectId,
      characters,
      scenes,
      beats,
      acts,
      relationships,
    };

    // Skip if nothing changed
    const hash = snapshotHash(snapshot);
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;

    // Run analysis
    const insights = analyzeStory(snapshot);
    setMuseInsights(insights);
  }, [selectedProject?.id, queryClient, setMuseInsights, clearMuseInsights]);

  // Subscribe to React Query cache changes
  useEffect(() => {
    if (!selectedProject?.id) return;

    const scheduleAnalysis = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(runAnalysis, ANALYSIS_DEBOUNCE_MS);
    };

    // Run once immediately on project change
    runAnalysis();

    // Subscribe to query cache changes
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'success') {
        const key = event.query.queryKey[0];
        if (typeof key === 'string' && key.includes(selectedProject.id)) {
          scheduleAnalysis();
        }
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [selectedProject?.id, queryClient, runAnalysis]);

  // Clear insights when project changes
  useEffect(() => {
    lastHashRef.current = '';
  }, [selectedProject?.id]);
}
