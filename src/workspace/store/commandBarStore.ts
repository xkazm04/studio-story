/**
 * Command Bar Store — Single-session CLI with expand/collapse.
 *
 * Replaces the multi-tab terminalDockStore. One session, no tabs.
 * Expands on demand, collapses to a 36px input bar.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CommandBarStoreState {
  sessionId: string;
  isExpanded: boolean;
  _hasHydrated: boolean;

  expand: () => void;
  collapse: () => void;
  toggle: () => void;
  focusInput: () => void;
  resetSession: () => void;
}

function makeSessionId(): string {
  return `studio-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useCommandBarStore = create<CommandBarStoreState>()(
  persist(
    (set, get) => ({
      sessionId: makeSessionId(),
      isExpanded: false,
      _hasHydrated: false,

      expand: () => set({ isExpanded: true }),
      collapse: () => set({ isExpanded: false }),
      toggle: () => set((s) => ({ isExpanded: !s.isExpanded })),

      focusInput: () => {
        // Focus the command bar input element
        requestAnimationFrame(() => {
          const input = document.querySelector<HTMLElement>('[data-command-bar-input]');
          input?.focus();
        });
      },

      resetSession: () => set({ sessionId: makeSessionId() }),
    }),
    {
      name: 'studio-story-command-bar',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist expanded state — session regenerates on reload
        isExpanded: state.isExpanded,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Always generate a fresh session on reload
          state.sessionId = makeSessionId();
          state._hasHydrated = true;
        }
      },
    }
  )
);
