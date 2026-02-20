/**
 * Asset types from MongoDB
 * These match the actual data stored in the database
 */
export type AssetType =
  | 'Equipment'
  | 'Body'
  | 'Clothing'
  | 'Accessories'
  | 'Background'
  | 'Scene'
  | 'Props'
  | 'Location';

/**
 * All possible asset types (for filtering)
 */
export const ASSET_TYPES: AssetType[] = [
  'Equipment',
  'Body',
  'Clothing',
  'Accessories',
  'Background',
  'Scene',
  'Props',
  'Location',
];

/**
 * Asset category (high-level grouping - not used in current MongoDB schema)
 */
export type AssetCategory = 'character' | 'story' | 'all';

export interface Asset {
  _id: string;
  name: string;
  type: AssetType | string;
  subcategory?: string;
  gen: string;
  description?: string;
  image_url?: string;
  metadata?: {
    tags?: string[];
    compatible_with?: string[];
  };
  created_at?: string; // ISO string format from backend e.g. "2023-05-14T00:00:00Z"
  updated_at?: string;

  image_data_base64?: string | null;
  image_content_type?: string | null;

  searchSimilarity?: number;
}

export interface SimilarAsset {
    id: string;
    name: string;
    type: string;
    description?: string;
    image_url?: string;
    similarity: number;
    similarity_mongo?: number;
}

export interface PaginatedAsset {
  assets: Asset[];
  total_assets: number;
  total_pages: number;
  current_page: number;
  page_size: number;
}

export interface AssetGroup {
  id: string;
  name: string;
  assets: Asset[];
  subcategories?: Record<string, Asset[]>;
}

export interface AssetBatchResponse {
  assets: Asset[];
  batch_id: string;
  total_assets: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  cache_key: string;
}

// Types for semantic search
export interface AssetSearchQuery {
  query: string;
  limit?: number;
  min_score?: number;
  asset_type?: string;
}

export interface AssetSearchResult {
  asset: Asset;
  similarity_mongo: number;
}

