'use client';

import { create } from 'zustand';

export type ImageTab = 'avatar' | 'fullbody';
export type ImageStatus = 'pending' | 'polling' | 'complete' | 'failed';
export type ViewMode = 'single' | 'multi-generate' | 'selection';

export interface GeneratedImage {
  id: string;
  promptId: string;
  generationId: string;
  imageUrl: string;
  prompt: string;
  tab: ImageTab;
  status: ImageStatus;
  error?: string;
  selected: boolean;
}

interface CreatorImageState {
  images: GeneratedImage[];
  viewMode: ViewMode;
  isGenerating: boolean;
  imageCount: number;
  error: string | null;

  setViewMode: (mode: ViewMode) => void;
  setImageCount: (count: number) => void;
  setError: (error: string | null) => void;
  addImages: (images: GeneratedImage[]) => void;
  updateImageStatus: (
    id: string,
    updates: Partial<Pick<GeneratedImage, 'status' | 'imageUrl' | 'error' | 'generationId'>>
  ) => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  startGeneration: () => void;
  finishGeneration: () => void;
}

export const useCreatorImageStore = create<CreatorImageState>((set) => ({
  images: [],
  viewMode: 'single',
  isGenerating: false,
  imageCount: 4,
  error: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setImageCount: (count) => set({ imageCount: Math.max(1, Math.min(12, count)) }),
  setError: (error) => set({ error }),

  addImages: (newImages) =>
    set((state) => ({ images: [...state.images, ...newImages] })),

  updateImageStatus: (id, updates) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      ),
    })),

  toggleSelected: (id) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img
      ),
    })),

  selectAll: () =>
    set((state) => ({
      images: state.images.map((img) =>
        img.status === 'complete' ? { ...img, selected: true } : img
      ),
    })),

  deselectAll: () =>
    set((state) => ({
      images: state.images.map((img) => ({ ...img, selected: false })),
    })),

  removeImage: (id) =>
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
    })),

  clearImages: () => set({ images: [], viewMode: 'single', error: null }),

  startGeneration: () => set({ isGenerating: true, error: null }),
  finishGeneration: () => set({ isGenerating: false }),
}));

// ─── Selectors ───────────────────────────────────────────

export const selectCompletedImages = (state: CreatorImageState) =>
  state.images.filter((img) => img.status === 'complete');

export const selectSelectedImages = (state: CreatorImageState) =>
  state.images.filter((img) => img.selected && img.status === 'complete');

export const selectUnselectedImages = (state: CreatorImageState) =>
  state.images.filter((img) => !img.selected && img.status === 'complete');

export const selectGenerationProgress = (state: CreatorImageState) => {
  const total = state.images.length;
  if (total === 0) return { total: 0, completed: 0, failed: 0, pending: 0 };
  return {
    total,
    completed: state.images.filter((i) => i.status === 'complete').length,
    failed: state.images.filter((i) => i.status === 'failed').length,
    pending: state.images.filter((i) => i.status === 'pending' || i.status === 'polling').length,
  };
};
