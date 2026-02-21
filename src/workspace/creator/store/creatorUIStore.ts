'use client';

import { create } from 'zustand';
import type { CategoryId } from '../types';

type ViewportTab = 'avatar' | 'fullbody';

interface CreatorUIState {
  activeCategory: CategoryId | null;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  showPromptPreview: boolean;
  zoom: number;
  isGenerating: boolean;
  generationStep: number;
  generationProgress: number;
  viewportTab: ViewportTab;
  generatedImageUrl: string | null;
  generationError: string | null;

  setActiveCategory: (categoryId: CategoryId | null) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  togglePromptPreview: () => void;
  setZoom: (zoom: number) => void;
  startGeneration: () => void;
  updateGeneration: (step: number, progress: number) => void;
  finishGeneration: () => void;
  cancelGeneration: () => void;
  setViewportTab: (tab: ViewportTab) => void;
  setGeneratedImage: (url: string | null) => void;
  setGenerationError: (error: string | null) => void;
}

export const useCreatorUIStore = create<CreatorUIState>((set) => ({
  activeCategory: 'hair',
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  showPromptPreview: false,
  zoom: 100,
  isGenerating: false,
  generationStep: 0,
  generationProgress: 0,
  viewportTab: 'avatar',
  generatedImageUrl: null,
  generationError: null,

  setActiveCategory: (categoryId) => set({ activeCategory: categoryId }),
  toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
  toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen })),
  togglePromptPreview: () => set((s) => ({ showPromptPreview: !s.showPromptPreview })),
  setZoom: (zoom) => set({ zoom }),
  startGeneration: () =>
    set({ isGenerating: true, generationStep: 0, generationProgress: 0 }),
  updateGeneration: (step, progress) =>
    set({ generationStep: step, generationProgress: progress }),
  finishGeneration: () =>
    set({ isGenerating: false, generationStep: 0, generationProgress: 0 }),
  cancelGeneration: () =>
    set({ isGenerating: false, generationStep: 0, generationProgress: 0 }),
  setViewportTab: (tab) => set({ viewportTab: tab }),
  setGeneratedImage: (url) => set({ generatedImageUrl: url }),
  setGenerationError: (error) => set({ generationError: error }),
}));

// Selectors
export const selectIsGenerating = (state: CreatorUIState) => state.isGenerating;
export const selectActiveCategory = (state: CreatorUIState) => state.activeCategory;
export const selectZoom = (state: CreatorUIState) => state.zoom;
