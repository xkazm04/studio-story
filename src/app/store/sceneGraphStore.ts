/**
 * SceneGraphStore - Zustand store for Scene Graph state
 * Manages sidebar visibility, scene filtering, and UI state
 */

import { create } from 'zustand';

type FilterMode = 'all' | 'connected' | 'orphaned' | 'deadends';

interface SceneGraphState {
  // Sidebar visibility
  showOutline: boolean;
  setShowOutline: (show: boolean) => void;
  toggleOutline: () => void;

  // Scene filtering
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;

  // Diagnostics panel
  showDiagnostics: boolean;
  setShowDiagnostics: (show: boolean) => void;
  toggleDiagnostics: () => void;

  // AI panel
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  toggleAIPanel: () => void;

  // Analytics panel
  showAnalytics: boolean;
  setShowAnalytics: (show: boolean) => void;
  toggleAnalytics: () => void;

  // Heatmap overlay
  showHeatmap: boolean;
  setShowHeatmap: (show: boolean) => void;

  // State Debugger panel
  showDebugger: boolean;
  setShowDebugger: (show: boolean) => void;
  toggleDebugger: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useSceneGraphStore = create<SceneGraphState>((set) => ({
  // Sidebar visibility
  showOutline: true,
  setShowOutline: (show) => set({ showOutline: show }),
  toggleOutline: () => set((state) => ({ showOutline: !state.showOutline })),

  // Scene filtering
  filterMode: 'all',
  setFilterMode: (mode) => set({ filterMode: mode }),

  // Diagnostics panel
  showDiagnostics: false,
  setShowDiagnostics: (show) => set({ showDiagnostics: show }),
  toggleDiagnostics: () => set((state) => ({ showDiagnostics: !state.showDiagnostics })),

  // AI panel
  showAIPanel: false,
  setShowAIPanel: (show) => set({ showAIPanel: show }),
  toggleAIPanel: () => set((state) => ({ showAIPanel: !state.showAIPanel })),

  // Analytics panel
  showAnalytics: false,
  setShowAnalytics: (show) => set({ showAnalytics: show }),
  toggleAnalytics: () => set((state) => ({ showAnalytics: !state.showAnalytics })),

  // Heatmap overlay
  showHeatmap: false,
  setShowHeatmap: (show) => set({ showHeatmap: show }),

  // State Debugger panel
  showDebugger: false,
  setShowDebugger: (show) => set({ showDebugger: show }),
  toggleDebugger: () => set((state) => ({ showDebugger: !state.showDebugger })),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
