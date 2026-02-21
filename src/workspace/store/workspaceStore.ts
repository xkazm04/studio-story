/**
 * Workspace Store — Manages dynamic panel layout
 *
 * Controls which panels are visible, their layout, and terminal-panel snapshots.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { resolveLayout, resolvePreferredLayout } from '../engine/layoutEngine';
import type {
  WorkspacePanelInstance,
  WorkspaceLayout,
  PanelDirective,
  WorkspacePanelType,
  PanelRole,
} from '../types';

interface WorkspaceStoreState {
  panels: WorkspacePanelInstance[];
  layout: WorkspaceLayout;
  terminalPanelSnapshots: Record<string, WorkspacePanelInstance[]>;
  linkedTerminalId: string | null;

  // Actions
  showPanels: (directives: PanelDirective[]) => void;
  hidePanels: (types: WorkspacePanelType[]) => void;
  replaceAllPanels: (directives: PanelDirective[], layout?: WorkspaceLayout) => void;
  clearPanels: () => void;
  setLayout: (layout: WorkspaceLayout) => void;
  updatePanelProps: (panelId: string, props: Record<string, unknown>) => void;
  saveSnapshot: (terminalId: string) => void;
  restoreSnapshot: (terminalId: string) => void;
  setLinkedTerminal: (terminalId: string | null) => void;

  // Derived
  getVisiblePanels: () => WorkspacePanelInstance[];
  getPanelByType: (type: WorkspacePanelType) => WorkspacePanelInstance | undefined;
}

const DEFAULT_ROLES: PanelRole[] = ['primary', 'secondary', 'tertiary', 'sidebar'];

function directivesToPanels(
  directives: PanelDirective[],
  existingPanels: WorkspacePanelInstance[] = [],
): WorkspacePanelInstance[] {
  const maxSlot = existingPanels.length > 0
    ? Math.max(...existingPanels.map((p) => p.slotIndex))
    : -1;

  return directives.map((d, i) => ({
    id: `panel-${Date.now()}-${i}`,
    type: d.type,
    role: d.role ?? DEFAULT_ROLES[i] ?? 'secondary',
    props: d.props ?? {},
    slotIndex: maxSlot + 1 + i,
  }));
}

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  persist(
    (set, get) => ({
      panels: [],
      layout: 'single',
      terminalPanelSnapshots: {},
      linkedTerminalId: null,

      showPanels: (directives) => {
        set((state) => {
          const existingTypes = new Set(state.panels.map((p) => p.type));

          const updatedPanels = state.panels.map((p) => {
            const match = directives.find((d) => d.type === p.type);
            if (match?.props) {
              return { ...p, props: { ...p.props, ...match.props } };
            }
            return p;
          });

          const newDirectives = directives.filter((d) => !existingTypes.has(d.type));
          const propsChanged = updatedPanels.some((p, i) => p !== state.panels[i]);
          if (newDirectives.length === 0 && !propsChanged) return state;

          const newPanels = directivesToPanels(newDirectives, updatedPanels);
          const allPanels = [...updatedPanels, ...newPanels];
          return {
            panels: allPanels,
            layout:
              newPanels.length > 0
                ? resolvePreferredLayout(allPanels, state.layout, 35)
                : state.layout,
          };
        });
      },

      hidePanels: (types) => {
        set((state) => {
          const typeSet = new Set(types);
          const remaining = state.panels.filter((p) => !typeSet.has(p.type));
          return {
            panels: remaining,
            layout: resolvePreferredLayout(remaining, state.layout, 20),
          };
        });
      },

      replaceAllPanels: (directives, layout) => {
        const newPanels = directivesToPanels(directives);
        set({
          panels: newPanels,
          layout: layout ?? resolveLayout(newPanels),
        });
      },

      clearPanels: () => {
        set({ panels: [], layout: 'single' });
      },

      setLayout: (layout) => {
        set({ layout });
      },

      updatePanelProps: (panelId, props) => {
        set((state) => ({
          panels: state.panels.map((p) =>
            p.id === panelId ? { ...p, props: { ...p.props, ...props } } : p
          ),
        }));
      },

      saveSnapshot: (terminalId) => {
        const { panels } = get();
        set((state) => ({
          terminalPanelSnapshots: {
            ...state.terminalPanelSnapshots,
            [terminalId]: [...panels],
          },
        }));
      },

      restoreSnapshot: (terminalId) => {
        const { terminalPanelSnapshots } = get();
        const snapshot = terminalPanelSnapshots[terminalId];
        if (snapshot) {
          set({
            panels: [...snapshot],
            layout: resolveLayout(snapshot),
          });
        }
      },

      setLinkedTerminal: (terminalId) => {
        set({ linkedTerminalId: terminalId });
      },

      getVisiblePanels: () => get().panels,

      getPanelByType: (type) => get().panels.find((p) => p.type === type),
    }),
    {
      name: 'studio-story-workspace',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        panels: state.panels,
        layout: state.layout,
        terminalPanelSnapshots: state.terminalPanelSnapshots,
      }),
    }
  )
);
