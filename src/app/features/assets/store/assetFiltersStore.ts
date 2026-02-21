/**
 * Asset Filters Store
 *
 * Manages filter state for the asset manager: category, type, search, sort.
 */

import { create } from 'zustand';
import type { AssetType } from '@/app/types/Asset';

export interface AssetFiltersState {
  // Type filter - matches MongoDB 'type' field directly
  assetType: AssetType | null;

  // Subcategory filter (optional)
  subcategory: string | null;

  // Search
  searchQuery: string;
  searchMode: 'text' | 'semantic';
  isSearching: boolean;

  // Sort
  sortBy: 'created_at' | 'name' | 'type';
  sortOrder: 'asc' | 'desc';

  // Pagination
  page: number;
  limit: number;
}

export interface AssetFiltersActions {
  // Type actions
  setAssetType: (type: AssetType | null) => void;

  // Subcategory actions
  setSubcategory: (subcategory: string | null) => void;

  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchMode: (mode: 'text' | 'semantic') => void;
  toggleSearchMode: () => void;
  setIsSearching: (isSearching: boolean) => void;
  clearSearch: () => void;

  // Sort actions
  setSortBy: (sortBy: 'created_at' | 'name' | 'type') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  toggleSortOrder: () => void;

  // Pagination actions
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setLimit: (limit: number) => void;

  // Reset
  resetFilters: () => void;
  resetPagination: () => void;
}

const initialState: AssetFiltersState = {
  assetType: null,
  subcategory: null,
  searchQuery: '',
  searchMode: 'text',
  isSearching: false,
  sortBy: 'created_at',
  sortOrder: 'desc',
  page: 1,
  limit: 24,
};

export const useAssetFiltersStore = create<AssetFiltersState & AssetFiltersActions>()((set, get) => ({
  ...initialState,

  // Type actions
  setAssetType: (type) =>
    set({
      assetType: type,
      subcategory: null, // Reset subcategory when type changes
      page: 1, // Reset pagination
    }),

  // Subcategory actions
  setSubcategory: (subcategory) =>
    set({
      subcategory,
      page: 1, // Reset pagination
    }),

  // Search actions
  setSearchQuery: (query) => set({ searchQuery: query, page: 1 }),

  setSearchMode: (mode) => set({ searchMode: mode }),

  toggleSearchMode: () =>
    set((state) => ({
      searchMode: state.searchMode === 'text' ? 'semantic' : 'text',
    })),

  setIsSearching: (isSearching) => set({ isSearching }),

  clearSearch: () =>
    set({
      searchQuery: '',
      isSearching: false,
      page: 1,
    }),

  // Sort actions
  setSortBy: (sortBy) => set({ sortBy, page: 1 }),

  setSortOrder: (order) => set({ sortOrder: order }),

  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),

  // Pagination actions
  setPage: (page) => set({ page }),

  nextPage: () => set((state) => ({ page: state.page + 1 })),

  prevPage: () =>
    set((state) => ({
      page: Math.max(1, state.page - 1),
    })),

  setLimit: (limit) => set({ limit, page: 1 }),

  // Reset
  resetFilters: () =>
    set({
      assetType: null,
      subcategory: null,
      searchQuery: '',
      searchMode: 'text',
      isSearching: false,
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
    }),

  resetPagination: () => set({ page: 1 }),
}));

// Selectors
export const selectAssetType = (state: AssetFiltersState) => state.assetType;
export const selectSubcategory = (state: AssetFiltersState) => state.subcategory;
export const selectSearchQuery = (state: AssetFiltersState) => state.searchQuery;
export const selectSearchMode = (state: AssetFiltersState) => state.searchMode;
export const selectIsSearching = (state: AssetFiltersState) => state.isSearching;
export const selectSortBy = (state: AssetFiltersState) => state.sortBy;
export const selectSortOrder = (state: AssetFiltersState) => state.sortOrder;
export const selectPage = (state: AssetFiltersState) => state.page;
export const selectLimit = (state: AssetFiltersState) => state.limit;

// Combined selector for API query params
export const selectQueryParams = (state: AssetFiltersState) => ({
  type: state.assetType || undefined,
  subcategory: state.subcategory || undefined,
  page: state.page,
  limit: state.limit,
  sortBy: state.sortBy,
  sortOrder: state.sortOrder,
  search: state.searchQuery || undefined,
});
