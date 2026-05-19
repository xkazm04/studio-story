import { create } from 'zustand';

interface PanelPaletteState {
  open: boolean;
  /** When set, the palette will swap this specific panel */
  targetPanelId: string | null;
  /** Open the palette. If targetPanelId is provided, swap that panel; otherwise swap the focused panel. */
  openPalette: (targetPanelId?: string) => void;
  closePalette: () => void;
}

export const usePanelPaletteStore = create<PanelPaletteState>()((set) => ({
  open: false,
  targetPanelId: null,
  openPalette: (targetPanelId) => set({ open: true, targetPanelId: targetPanelId ?? null }),
  closePalette: () => set({ open: false, targetPanelId: null }),
}));
