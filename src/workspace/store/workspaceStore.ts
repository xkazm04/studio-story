/**
 * Workspace Store — Manages dynamic panel layout
 *
 * Controls which panels are visible, their layout, and terminal-panel snapshots.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { resolveLayout, resolvePreferredLayout, autoCompactPanels } from '../engine/layoutEngine';
import type {
  WorkspacePanelInstance,
  WorkspaceLayout,
  PanelDirective,
  WorkspacePanelType,
  PanelRole,
  PanelDensity,
  WorkspaceSnapshot,
} from '../types';

interface WorkspaceStoreState {
  panels: WorkspacePanelInstance[];
  layout: WorkspaceLayout;
  terminalPanelSnapshots: Record<string, WorkspacePanelInstance[]>;
  linkedTerminalId: string | null;
  closedPanelHistory: Array<{
    panel: WorkspacePanelInstance;
    closedAt: number;
    expiresAt: number;
  }>;
  workflowContextStack: Array<{
    panels: WorkspacePanelInstance[];
    layout: WorkspaceLayout;
    createdAt: number;
  }>;
  /** ID of the panel that currently has user focus */
  focusedPanelId: string | null;
  /** Timestamp when the currently focused panel gained focus */
  focusedAt: number;
  /** Whether auto-density compaction is enabled */
  autoCompact: boolean;
  /** IDs of panels that were auto-compacted (density downgraded) */
  autoCompactedPanels: Set<string>;
  /** User-saved named workspace snapshots */
  namedSnapshots: WorkspaceSnapshot[];
  /** Currently active snapshot ID (null if workspace was modified after load) */
  activeSnapshotId: string | null;

  // Actions
  showPanels: (directives: PanelDirective[]) => void;
  hidePanels: (types: WorkspacePanelType[]) => void;
  closePanelById: (panelId: string) => void;
  reopenLastClosedPanel: () => void;
  replaceAllPanels: (directives: PanelDirective[], layout?: WorkspaceLayout) => void;
  popWorkflowContext: () => void;
  clearPanels: () => void;
  setLayout: (layout: WorkspaceLayout) => void;
  updatePanelProps: (panelId: string, props: Record<string, unknown>) => void;
  updatePanelDensity: (panelId: string, density: PanelDensity) => void;
  saveSnapshot: (terminalId: string) => void;
  restoreSnapshot: (terminalId: string) => void;
  setLinkedTerminal: (terminalId: string | null) => void;
  setFocusedPanel: (panelId: string | null) => void;
  /** Replace a panel in-place by ID, preserving its slot, role, and layout */
  swapPanelById: (panelId: string, newType: WorkspacePanelType) => void;
  /** Toggle auto-density compaction on/off */
  setAutoCompact: (enabled: boolean) => void;
  /** Re-run auto-compaction against current viewport dimensions */
  runAutoCompaction: (viewportWidth: number, viewportHeight: number) => void;
  /** Save current workspace as a named snapshot */
  saveNamedSnapshot: (name: string) => string;
  /** Load a named snapshot by ID */
  loadNamedSnapshot: (id: string) => void;
  /** Delete a named snapshot by ID */
  deleteNamedSnapshot: (id: string) => void;
  /** Rename a named snapshot */
  renameNamedSnapshot: (id: string, name: string) => void;

  // Derived
  getVisiblePanels: () => WorkspacePanelInstance[];
  getPanelByType: (type: WorkspacePanelType) => WorkspacePanelInstance | undefined;
}

const DEFAULT_ROLES: PanelRole[] = ['primary', 'secondary', 'tertiary', 'sidebar'];

/**
 * Generate a stable panel ID based on type.
 * Duplicate types get a numeric suffix: panel-scene-editor, panel-scene-editor-2, etc.
 */
function stablePanelId(type: WorkspacePanelType, usedIds: Set<string>): string {
  const base = `panel-${type}`;
  if (!usedIds.has(base)) {
    usedIds.add(base);
    return base;
  }
  let counter = 2;
  while (usedIds.has(`${base}-${counter}`)) counter++;
  const id = `${base}-${counter}`;
  usedIds.add(id);
  return id;
}

function directivesToPanels(
  directives: PanelDirective[],
  existingPanels: WorkspacePanelInstance[] = [],
): WorkspacePanelInstance[] {
  const maxSlot = existingPanels.length > 0
    ? Math.max(...existingPanels.map((p) => p.slotIndex))
    : -1;

  // Collect IDs already used by existing panels
  const usedIds = new Set(existingPanels.map((p) => p.id));

  return directives.map((d, i) => ({
    id: stablePanelId(d.type, usedIds),
    type: d.type,
    role: d.role ?? DEFAULT_ROLES[i] ?? 'secondary',
    props: d.props ?? {},
    slotIndex: maxSlot + 1 + i,
    density: d.density,
    dataSlice: d.dataSlice,
  }));
}

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  persist(
    (set, get) => ({
      panels: [],
      layout: 'single',
      terminalPanelSnapshots: {},
      linkedTerminalId: null,
      closedPanelHistory: [],
      workflowContextStack: [],
      focusedPanelId: null,
      focusedAt: 0,
      autoCompact: true,
      autoCompactedPanels: new Set<string>(),
      namedSnapshots: [],
      activeSnapshotId: null,

      showPanels: (directives) => {
        set((state) => {
          const existingTypes = new Set(state.panels.map((p) => p.type));

          const updatedPanels = state.panels.map((p) => {
            const match = directives.find((d) => d.type === p.type);
            if (match) {
              return {
                ...p,
                ...(match.props ? { props: { ...p.props, ...match.props } } : {}),
                ...(match.density !== undefined ? { density: match.density } : {}),
                ...(match.dataSlice !== undefined ? { dataSlice: match.dataSlice } : {}),
              };
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
            activeSnapshotId: null,
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
            activeSnapshotId: null,
          };
        });
      },

      closePanelById: (panelId) => {
        set((state) => {
          const panel = state.panels.find((p) => p.id === panelId);
          if (!panel) return state;
          const remaining = state.panels.filter((p) => p.id !== panelId);
          const now = Date.now();
          const history = [
            { panel, closedAt: now, expiresAt: now + 5 * 60 * 1000 },
            ...state.closedPanelHistory.filter((h) => h.expiresAt > now),
          ].slice(0, 5);
          return {
            panels: remaining,
            layout: resolvePreferredLayout(remaining, state.layout, 20),
            closedPanelHistory: history,
          };
        });
      },

      reopenLastClosedPanel: () => {
        set((state) => {
          const now = Date.now();
          const valid = state.closedPanelHistory.filter((h) => h.expiresAt > now);
          const next = valid[0];
          if (!next) return { closedPanelHistory: valid };
          const remainingHistory = valid.slice(1);
          const exists = state.panels.some((p) => p.id === next.panel.id);
          const panels = exists
            ? state.panels
            : [...state.panels, { ...next.panel, slotIndex: next.panel.slotIndex }].sort((a, b) => a.slotIndex - b.slotIndex);
          return {
            panels,
            layout: resolvePreferredLayout(panels, state.layout, 20),
            closedPanelHistory: remainingHistory,
          };
        });
      },

      replaceAllPanels: (directives, layout) => {
        const existing = get().panels;
        const previousLayout = get().layout;
        // Reuse existing panel instances when the type matches so React
        // preserves the component (stable key) across layout changes.
        const usedIds = new Set<string>();
        const newPanels = directives.map((d, i) => {
          const match = existing.find(
            (p) => p.type === d.type && !usedIds.has(p.id),
          );
          if (match) {
            usedIds.add(match.id);
            return {
              ...match,
              role: d.role ?? match.role,
              props: d.props ? { ...match.props, ...d.props } : match.props,
              slotIndex: i,
              density: d.density ?? match.density,
              dataSlice: d.dataSlice ?? match.dataSlice,
            };
          }
          const id = stablePanelId(d.type, usedIds);
          return {
            id,
            type: d.type,
            role: d.role ?? DEFAULT_ROLES[i] ?? ('secondary' as PanelRole),
            props: d.props ?? {},
            slotIndex: i,
            density: d.density,
            dataSlice: d.dataSlice,
          };
        });
        set((state) => ({
          panels: newPanels,
          layout: layout ?? resolveLayout(newPanels),
          workflowContextStack: [
            { panels: existing, layout: previousLayout, createdAt: Date.now() },
            ...state.workflowContextStack,
          ].slice(0, 10),
          activeSnapshotId: null,
        }));
      },

      popWorkflowContext: () => {
        set((state) => {
          if (state.workflowContextStack.length === 0) return state;
          const [top, ...rest] = state.workflowContextStack;
          return {
            panels: top.panels,
            layout: top.layout,
            workflowContextStack: rest,
          };
        });
      },

      clearPanels: () => {
        set({ panels: [], layout: 'single', activeSnapshotId: null });
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

      updatePanelDensity: (panelId, density) => {
        set((state) => ({
          panels: state.panels.map((p) =>
            p.id === panelId ? { ...p, density } : p
          ),
        }));
      },

      setLinkedTerminal: (terminalId) => {
        set({ linkedTerminalId: terminalId });
      },

      setFocusedPanel: (panelId) => {
        set({ focusedPanelId: panelId, focusedAt: panelId ? Date.now() : 0 });
      },

      swapPanelById: (panelId, newType) => {
        set((state) => {
          const idx = state.panels.findIndex((p) => p.id === panelId);
          if (idx === -1) return state;
          const old = state.panels[idx];
          const newPanel: WorkspacePanelInstance = {
            id: `panel-${newType}`,
            type: newType,
            role: old.role,
            props: {},
            slotIndex: old.slotIndex,
            density: old.density,
          };
          const panels = [...state.panels];
          panels[idx] = newPanel;
          return { panels };
        });
      },

      setAutoCompact: (enabled) => {
        set({ autoCompact: enabled });
        if (!enabled) {
          set({ autoCompactedPanels: new Set<string>() });
        }
      },

      runAutoCompaction: (viewportWidth, viewportHeight) => {
        const { panels, layout, autoCompact } = get();
        if (!autoCompact || panels.length === 0) {
          if (get().autoCompactedPanels.size > 0) {
            set({ autoCompactedPanels: new Set<string>() });
          }
          return;
        }
        const result = autoCompactPanels(panels, layout, viewportWidth, viewportHeight);
        if (result.compactedIds.size > 0 || get().autoCompactedPanels.size > 0) {
          set({ panels: result.panels, autoCompactedPanels: result.compactedIds });
        }
      },

      saveNamedSnapshot: (name) => {
        const { panels, layout } = get();
        const now = Date.now();
        const id = `snapshot-${now}`;
        const snapshot: WorkspaceSnapshot = {
          id,
          name,
          panels: panels.map((p) => ({ ...p })),
          layout,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          namedSnapshots: [...state.namedSnapshots, snapshot],
          activeSnapshotId: id,
        }));
        return id;
      },

      loadNamedSnapshot: (id) => {
        const { namedSnapshots } = get();
        const snapshot = namedSnapshots.find((s) => s.id === id);
        if (!snapshot) return;
        set({
          panels: snapshot.panels.map((p) => ({ ...p })),
          layout: snapshot.layout,
          activeSnapshotId: id,
        });
      },

      deleteNamedSnapshot: (id) => {
        set((state) => ({
          namedSnapshots: state.namedSnapshots.filter((s) => s.id !== id),
          activeSnapshotId: state.activeSnapshotId === id ? null : state.activeSnapshotId,
        }));
      },

      renameNamedSnapshot: (id, name) => {
        set((state) => ({
          namedSnapshots: state.namedSnapshots.map((s) =>
            s.id === id ? { ...s, name, updatedAt: Date.now() } : s
          ),
        }));
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
        namedSnapshots: state.namedSnapshots,
        activeSnapshotId: state.activeSnapshotId,
      }),
    }
  )
);
