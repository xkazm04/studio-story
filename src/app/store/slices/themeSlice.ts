import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme } from '@/lib/themes/ThemeTracker';
import { themeTracker } from '@/lib/themes/ThemeTracker';

interface ThemeState {
  themes: Theme[];
  addTheme: (theme: Omit<Theme, 'id'>) => void;
  updateTheme: (id: string, updates: Partial<Theme>) => void;
  removeTheme: (id: string) => void;
}

function syncToTracker(themes: Theme[]) {
  themeTracker.importData({ themes });
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themes: [],

      addTheme: (theme) => {
        const newTheme: Theme = { ...theme, id: `theme-${Date.now()}` };
        const themes = [...get().themes, newTheme];
        syncToTracker(themes);
        set({ themes });
      },

      updateTheme: (id, updates) => {
        const themes = get().themes.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        );
        syncToTracker(themes);
        set({ themes });
      },

      removeTheme: (id) => {
        const themes = get().themes.filter((t) => t.id !== id);
        syncToTracker(themes);
        set({ themes });
      },
    }),
    {
      name: 'story-themes',
    }
  )
);

// Sync rehydrated state to ThemeTracker singleton on module load
useThemeStore.subscribe((state) => {
  syncToTracker(state.themes);
});
