/**
 * Asset Manager Store
 *
 * Manages UI state for the asset manager: view mode, selection, detail panel, navigation.
 * Also handles cross-panel communication via Zustand.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Asset } from '@/app/types/Asset';

export interface AssetManagerState {
  // View configuration
  viewMode: 'grid' | 'list';
  gridDensity: 'compact' | 'comfortable' | 'spacious';

  // Selection state
  selectedAssetIds: string[];
  selectionMode: boolean;

  // Detail panel (cross-panel communication)
  detailPanelOpen: boolean;
  activeAssetId: string | null;
  activeAsset: Asset | null; // Full asset data for detail view

  // Left panel navigation
  navCollapsed: boolean;
  leftPanelMode: 'overview' | 'assets'; // Switch left panel content

  // Expanded groups (for hierarchical navigation)
  expandedGroups: string[];

  // Feature active state (for panel coordination)
  isAssetFeatureActive: boolean;
}

export interface AssetManagerActions {
  // View actions
  setViewMode: (mode: 'grid' | 'list') => void;
  setGridDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;

  // Selection actions
  toggleSelectionMode: () => void;
  selectAsset: (id: string) => void;
  deselectAsset: (id: string) => void;
  toggleAssetSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // Detail panel actions (cross-panel)
  openDetail: (id: string, asset?: Asset) => void;
  closeDetail: () => void;
  setActiveAsset: (asset: Asset | null) => void;

  // Left panel actions
  setLeftPanelMode: (mode: 'overview' | 'assets') => void;

  // Navigation actions
  toggleNav: () => void;
  setNavCollapsed: (collapsed: boolean) => void;
  toggleGroup: (groupId: string) => void;
  expandGroup: (groupId: string) => void;
  collapseGroup: (groupId: string) => void;

  // Feature activation (for panel coordination)
  setAssetFeatureActive: (active: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState: AssetManagerState = {
  viewMode: 'grid',
  gridDensity: 'comfortable',
  selectedAssetIds: [],
  selectionMode: false,
  detailPanelOpen: false,
  activeAssetId: null,
  activeAsset: null,
  navCollapsed: false,
  leftPanelMode: 'overview',
  expandedGroups: ['character', 'story'], // Default expanded
  isAssetFeatureActive: false,
};

export const useAssetManagerStore = create<AssetManagerState & AssetManagerActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // View actions
      setViewMode: (mode) => set({ viewMode: mode }),
      setGridDensity: (density) => set({ gridDensity: density }),

      // Selection actions
      toggleSelectionMode: () =>
        set((state) => ({
          selectionMode: !state.selectionMode,
          selectedAssetIds: !state.selectionMode ? state.selectedAssetIds : [],
        })),

      selectAsset: (id) =>
        set((state) => ({
          selectedAssetIds: state.selectedAssetIds.includes(id)
            ? state.selectedAssetIds
            : [...state.selectedAssetIds, id],
        })),

      deselectAsset: (id) =>
        set((state) => ({
          selectedAssetIds: state.selectedAssetIds.filter((assetId) => assetId !== id),
        })),

      toggleAssetSelection: (id) => {
        const { selectedAssetIds } = get();
        if (selectedAssetIds.includes(id)) {
          set({ selectedAssetIds: selectedAssetIds.filter((assetId) => assetId !== id) });
        } else {
          set({ selectedAssetIds: [...selectedAssetIds, id] });
        }
      },

      selectAll: (ids) => set({ selectedAssetIds: ids }),

      clearSelection: () => set({ selectedAssetIds: [], selectionMode: false }),

      // Detail panel actions (cross-panel communication)
      openDetail: (id, asset) =>
        set({
          detailPanelOpen: true,
          activeAssetId: id,
          activeAsset: asset || null,
        }),

      closeDetail: () =>
        set({
          detailPanelOpen: false,
          activeAssetId: null,
          activeAsset: null,
        }),

      setActiveAsset: (asset) => set({ activeAsset: asset }),

      // Left panel mode
      setLeftPanelMode: (mode) => set({ leftPanelMode: mode }),

      // Navigation actions
      toggleNav: () => set((state) => ({ navCollapsed: !state.navCollapsed })),
      setNavCollapsed: (collapsed) => set({ navCollapsed: collapsed }),

      toggleGroup: (groupId) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.includes(groupId)
            ? state.expandedGroups.filter((g) => g !== groupId)
            : [...state.expandedGroups, groupId],
        })),

      expandGroup: (groupId) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.includes(groupId)
            ? state.expandedGroups
            : [...state.expandedGroups, groupId],
        })),

      collapseGroup: (groupId) =>
        set((state) => ({
          expandedGroups: state.expandedGroups.filter((g) => g !== groupId),
        })),

      // Feature activation
      setAssetFeatureActive: (active) =>
        set({
          isAssetFeatureActive: active,
          // Auto-open detail panel mode when feature becomes active
          leftPanelMode: active ? 'assets' : 'overview',
        }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'asset-manager-store',
      partialize: (state) => ({
        viewMode: state.viewMode,
        gridDensity: state.gridDensity,
        navCollapsed: state.navCollapsed,
        expandedGroups: state.expandedGroups,
        leftPanelMode: state.leftPanelMode,
      }),
    }
  )
);

// Selectors for optimized component re-renders
export const selectViewMode = (state: AssetManagerState) => state.viewMode;
export const selectGridDensity = (state: AssetManagerState) => state.gridDensity;
export const selectSelectedAssetIds = (state: AssetManagerState) => state.selectedAssetIds;
export const selectSelectionMode = (state: AssetManagerState) => state.selectionMode;
export const selectDetailPanelOpen = (state: AssetManagerState) => state.detailPanelOpen;
export const selectActiveAssetId = (state: AssetManagerState) => state.activeAssetId;
export const selectActiveAsset = (state: AssetManagerState) => state.activeAsset;
export const selectNavCollapsed = (state: AssetManagerState) => state.navCollapsed;
export const selectExpandedGroups = (state: AssetManagerState) => state.expandedGroups;
export const selectLeftPanelMode = (state: AssetManagerState) => state.leftPanelMode;
export const selectIsAssetFeatureActive = (state: AssetManagerState) => state.isAssetFeatureActive;
