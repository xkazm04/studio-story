/**
 * Writer Studio Theme Store
 * Global state for managing the writer studio visual theme
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WriterTheme = 'modern';

interface WriterThemeState {
  activeTheme: WriterTheme;
  setActiveTheme: (theme: WriterTheme) => void;
}

export const useWriterThemeStore = create<WriterThemeState>()(
  persist(
    (set) => ({
      activeTheme: 'modern',
      setActiveTheme: (theme) => set({ activeTheme: theme }),
    }),
    {
      name: 'writer-studio-theme',
    }
  )
);
