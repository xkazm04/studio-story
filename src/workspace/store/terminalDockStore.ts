/**
 * Terminal Dock Store — Manages terminal tabs
 *
 * Each tab represents an independent CLI session with its own context.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TerminalTab, SkillDomain } from '../types';

interface TerminalDockStoreState {
  tabs: TerminalTab[];
  activeTabId: string | null;
  isCollapsed: boolean;

  createTab: (opts?: { label?: string; domain?: SkillDomain | 'general'; isPinned?: boolean }) => TerminalTab;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabLabel: (tabId: string, label: string) => void;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  pinTab: (tabId: string, pinned: boolean) => void;
  getActiveTab: () => TerminalTab | undefined;
}

function makeTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function makeSessionId(): string {
  return `studio-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useTerminalDockStore = create<TerminalDockStoreState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      isCollapsed: false,

      createTab: (opts) => {
        const tab: TerminalTab = {
          id: makeTabId(),
          label: opts?.label ?? 'General',
          sessionId: makeSessionId(),
          domain: opts?.domain ?? 'general',
          createdAt: Date.now(),
          isPinned: opts?.isPinned ?? false,
        };

        set((state) => ({
          tabs: [...state.tabs, tab],
          activeTabId: tab.id,
          isCollapsed: false,
        }));

        return tab;
      },

      closeTab: (tabId) => {
        set((state) => {
          const idx = state.tabs.findIndex((t) => t.id === tabId);
          const remaining = state.tabs.filter((t) => t.id !== tabId);

          let nextActive = state.activeTabId;
          if (state.activeTabId === tabId) {
            if (remaining.length === 0) {
              nextActive = null;
            } else {
              const nextIdx = Math.min(idx, remaining.length - 1);
              nextActive = remaining[nextIdx]?.id ?? null;
            }
          }

          return {
            tabs: remaining,
            activeTabId: nextActive,
          };
        });
      },

      setActiveTab: (tabId) => {
        set({ activeTabId: tabId });
      },

      updateTabLabel: (tabId, label) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, label } : t
          ),
        }));
      },

      toggleCollapsed: () => {
        set((state) => ({ isCollapsed: !state.isCollapsed }));
      },

      setCollapsed: (collapsed) => {
        set({ isCollapsed: collapsed });
      },

      pinTab: (tabId, pinned) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === tabId ? { ...t, isPinned: pinned } : t
          ),
        }));
      },

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        return tabs.find((t) => t.id === activeTabId);
      },
    }),
    {
      name: 'studio-story-terminal-dock',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        isCollapsed: state.isCollapsed,
      }),
    }
  )
);
