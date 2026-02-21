/**
 * Asset Manager Types
 *
 * Extended types for the asset management module.
 */

import { Asset, AssetType, AssetCategory } from '@/app/types/Asset';

// Re-export base types
export type { Asset, AssetType, AssetCategory };
export type { PaginatedAsset, AssetGroup, AssetSearchQuery, AssetSearchResult } from '@/app/types/Asset';

/**
 * Category configuration with metadata
 */
export interface CategoryConfig {
  id: AssetType;
  label: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
}

/**
 * All asset type configurations
 */
export const ASSET_TYPE_CONFIGS: CategoryConfig[] = [
  { id: 'Body', label: 'Body', icon: 'User', color: 'blue' },
  { id: 'Equipment', label: 'Equipment', icon: 'Sword', color: 'red' },
  { id: 'Clothing', label: 'Clothing', icon: 'Shirt', color: 'green' },
  { id: 'Accessories', label: 'Accessories', icon: 'Gem', color: 'pink' },
  { id: 'Background', label: 'Background', icon: 'Image', color: 'purple' },
  { id: 'Scene', label: 'Scene', icon: 'Film', color: 'amber' },
  { id: 'Props', label: 'Props', icon: 'Box', color: 'orange' },
  { id: 'Location', label: 'Location', icon: 'MapPin', color: 'teal' },
];

/**
 * Character asset types (for grouping UI)
 */
export const CHARACTER_TYPES: AssetType[] = ['Body', 'Equipment', 'Clothing', 'Accessories'];

/**
 * Story asset types (for grouping UI)
 */
export const STORY_TYPES: AssetType[] = ['Background', 'Scene', 'Props', 'Location'];

/**
 * Asset filters state
 */
export interface AssetFilters {
  assetType: AssetType | null;
  subcategory: string | null;
  searchQuery: string;
  searchMode: 'text' | 'semantic';
  sortBy: 'created_at' | 'name' | 'type';
  sortOrder: 'asc' | 'desc';
}

/**
 * Default filter values
 */
export const DEFAULT_FILTERS: AssetFilters = {
  assetType: null,
  subcategory: null,
  searchQuery: '',
  searchMode: 'text',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

/**
 * Asset manager view state
 */
export interface AssetManagerState {
  viewMode: 'grid' | 'list';
  gridDensity: 'compact' | 'comfortable' | 'spacious';
  selectedAssetIds: Set<string>;
  selectionMode: boolean;
  detailPanelOpen: boolean;
  activeAssetId: string | null;
  navCollapsed: boolean;
}

/**
 * Default manager state
 */
export const DEFAULT_MANAGER_STATE: AssetManagerState = {
  viewMode: 'grid',
  gridDensity: 'comfortable',
  selectedAssetIds: new Set(),
  selectionMode: false,
  detailPanelOpen: false,
  activeAssetId: null,
  navCollapsed: false,
};

/**
 * Category counts response
 */
export interface CategoryCounts {
  byType: Record<string, number>;
  total: number;
}

/**
 * API query parameters
 */
export interface AssetQueryParams {
  type?: AssetType;
  subcategory?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Uploader state
 */
export interface UploaderState {
  files: File[];
  isUploading: boolean;
  isAnalyzing: boolean;
  uploadProgress: Record<string, number>;
  analysisResults: AnalysisResult[];
  error: string | null;
}

/**
 * Analysis result from AI
 */
export interface AnalysisResult {
  model: 'gemini' | 'groq' | 'openai';
  assets: DetectedAsset[];
  processingTime: number;
  error?: string;
}

/**
 * Detected asset from image analysis
 */
export interface DetectedAsset {
  name: string;
  description: string;
  category: string;
  tags: string[];
  properties?: Record<string, string>;
  confidence?: number;
}

/**
 * Model configuration for analysis
 */
export interface AnalysisConfig {
  gemini: { enabled: boolean };
  groq: { enabled: boolean };
  openai: { enabled: boolean };
}

export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  gemini: { enabled: false },
  groq: { enabled: true },
  openai: { enabled: false },
};
