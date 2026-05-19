/**
 * Audio Production Zustand Store
 *
 * Persists in-flight narration state to localStorage so users can
 * resume interrupted TTS production sessions after page refresh.
 * Heavy data (audio URLs, waveforms) lives in Supabase; this store
 * tracks the active session ID, line statuses, and selection state.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ScriptLineSnapshot } from '../../types/NarrationSession';

interface AudioProductionState {
  /** Currently-active narration session ID (from Supabase) */
  activeSessionId: string | null;
  /** Project this session belongs to */
  activeProjectId: string | null;
  /** Scene this session is for (null for ad-hoc scripts) */
  activeSceneId: string | null;

  /** In-flight script line statuses — fast local cache while generating */
  lineStatuses: Record<string, ScriptLineSnapshot>;
  /** Which take is selected per line (lineId → takeId) */
  selectedTakes: Record<string, string>;

  /** Whether a generation batch is running (survives refresh as a flag) */
  generationInProgress: boolean;
  /** Index of the line we were generating when the session was interrupted */
  lastGeneratedLineIdx: number;

  // ─── Actions ────────────────────────────────────────────

  /** Start or resume a session */
  setActiveSession: (sessionId: string, projectId: string, sceneId?: string | null) => void;
  /** Clear the active session (e.g., navigating away) */
  clearActiveSession: () => void;
  /** Bulk-set line statuses (e.g., after loading from Supabase) */
  setLineStatuses: (statuses: Record<string, ScriptLineSnapshot>) => void;
  /** Update a single line's status */
  updateLineStatus: (lineId: string, update: Partial<ScriptLineSnapshot>) => void;
  /** Record which take is selected for a line */
  selectTake: (lineId: string, takeId: string) => void;
  /** Mark generation progress */
  setGenerationProgress: (inProgress: boolean, lastIdx?: number) => void;
}

export const useAudioProductionStore = create<AudioProductionState>()(
  persist(
    (set) => ({
      activeSessionId: null,
      activeProjectId: null,
      activeSceneId: null,
      lineStatuses: {},
      selectedTakes: {},
      generationInProgress: false,
      lastGeneratedLineIdx: -1,

      setActiveSession: (sessionId, projectId, sceneId) =>
        set({
          activeSessionId: sessionId,
          activeProjectId: projectId,
          activeSceneId: sceneId ?? null,
        }),

      clearActiveSession: () =>
        set({
          activeSessionId: null,
          activeProjectId: null,
          activeSceneId: null,
          lineStatuses: {},
          selectedTakes: {},
          generationInProgress: false,
          lastGeneratedLineIdx: -1,
        }),

      setLineStatuses: (statuses) =>
        set({ lineStatuses: statuses }),

      updateLineStatus: (lineId, update) =>
        set((state) => ({
          lineStatuses: {
            ...state.lineStatuses,
            [lineId]: { ...state.lineStatuses[lineId]!, ...update },
          },
        })),

      selectTake: (lineId, takeId) =>
        set((state) => ({
          selectedTakes: { ...state.selectedTakes, [lineId]: takeId },
        })),

      setGenerationProgress: (inProgress, lastIdx) =>
        set({
          generationInProgress: inProgress,
          ...(lastIdx !== undefined ? { lastGeneratedLineIdx: lastIdx } : {}),
        }),
    }),
    {
      name: 'studio-story-audio-production',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        activeProjectId: state.activeProjectId,
        activeSceneId: state.activeSceneId,
        lineStatuses: state.lineStatuses,
        selectedTakes: state.selectedTakes,
        generationInProgress: state.generationInProgress,
        lastGeneratedLineIdx: state.lastGeneratedLineIdx,
      }),
    }
  )
);

export type { AudioProductionState };
