import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserSettingsState {
  // Celebration settings
  celebrationsEnabled: boolean;
  setCelebrationsEnabled: (enabled: boolean) => void;

  // Track completed beats to show celebration only once
  celebratedBeats: Set<string>;
  markBeatCelebrated: (beatId: string) => void;
  isBeatCelebrated: (beatId: string) => boolean;
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set, get) => ({
      // Celebration settings
      celebrationsEnabled: true,
      setCelebrationsEnabled: (enabled) => set({ celebrationsEnabled: enabled }),

      // Track completed beats
      celebratedBeats: new Set<string>(),
      markBeatCelebrated: (beatId) => {
        const celebrated = new Set(get().celebratedBeats);
        celebrated.add(beatId);
        set({ celebratedBeats: celebrated });
      },
      isBeatCelebrated: (beatId) => get().celebratedBeats.has(beatId),
    }),
    {
      name: 'user-settings-storage',
      // Custom serialization for Set
      partialize: (state) => ({
        celebrationsEnabled: state.celebrationsEnabled,
        celebratedBeats: Array.from(state.celebratedBeats),
      }),
      // Custom deserialization for Set
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray((state as any).celebratedBeats)) {
          state.celebratedBeats = new Set((state as any).celebratedBeats);
        }
      },
    }
  )
);
