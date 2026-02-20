/**
 * AppShellStore - Zustand store for AppShell state
 * Manages active feature, story subtab, layout mode, and panel context awareness
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type FeatureTab = 'characters' | 'scenes' | 'story' | 'assets' | 'voice' | 'datasets' | 'images';
export type StorySubtab = 'art-style' | 'beats' | 'scene-editor' | 'act-evaluation' | 'scene-graph' | 'prompt-composer' | 'story-script' | 'story-setup';
export type LayoutMode = 'v1' | 'v2';

interface AppShellState {
  // Active feature tab
  activeFeature: FeatureTab;
  setActiveFeature: (feature: FeatureTab) => void;

  // Story subtab (when story feature is active)
  storySubtab: StorySubtab;
  setStorySubtab: (subtab: StorySubtab) => void;

  // Layout mode (v1 = classic 3-panel, v2 = dynamic workspace)
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;

  // Helper selectors
  isStoryFeatureActive: () => boolean;
}

export const useAppShellStore = create<AppShellState>()(
  persist(
    (set, get) => ({
      // Active feature tab - default to characters
      activeFeature: 'characters',
      setActiveFeature: (feature) => set({ activeFeature: feature }),

      // Story subtab - default to scene-editor (Content)
      storySubtab: 'scene-editor',
      setStorySubtab: (subtab) => set({ storySubtab: subtab }),

      // Layout mode - default to v1 (classic panels)
      layoutMode: 'v1',
      setLayoutMode: (mode) => set({ layoutMode: mode }),

      // Helper selectors
      isStoryFeatureActive: () => get().activeFeature === 'story',
    }),
    {
      name: 'story-app-shell',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        layoutMode: state.layoutMode,
      }),
    }
  )
);
