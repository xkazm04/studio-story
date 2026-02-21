/**
 * UsageTracker - Asset usage tracking and reference counting system
 *
 * Tracks where assets are used throughout the application, maintains
 * reference counts, detects orphaned assets, and enables bidirectional
 * navigation between assets and their usage locations.
 */

export type UsageEntityType = 'character' | 'scene' | 'beat' | 'project' | 'faction' | 'location';

export type UsageFieldType =
  | 'avatar_url'
  | 'body_url'
  | 'transparent_avatar_url'
  | 'transparent_body_url'
  | 'image_url'
  | 'background_url'
  | 'prop'
  | 'location_image'
  | 'custom';

export interface AssetUsageLocation {
  /** Unique ID for this usage instance */
  id: string;
  /** The asset ID being used */
  assetId: string;
  /** Type of entity using the asset */
  entityType: UsageEntityType;
  /** ID of the entity using the asset */
  entityId: string;
  /** Display name of the entity */
  entityName: string;
  /** Field where the asset is used */
  fieldType: UsageFieldType;
  /** Project ID for context */
  projectId?: string;
  /** Project name for display */
  projectName?: string;
  /** When this usage was first tracked */
  trackedAt: number;
  /** URL path for navigation */
  navigationPath?: string;
}

export interface AssetUsageSummary {
  assetId: string;
  totalReferences: number;
  usageByType: Record<UsageEntityType, number>;
  usageByField: Record<UsageFieldType, number>;
  locations: AssetUsageLocation[];
  lastUsedAt?: number;
  isOrphan: boolean;
}

export interface OrphanAsset {
  assetId: string;
  assetName: string;
  assetType: string;
  createdAt?: string;
  daysSinceCreation?: number;
}

export interface UsageAnalytics {
  totalAssets: number;
  totalReferences: number;
  orphanCount: number;
  usageDistribution: Record<UsageEntityType, number>;
  topUsedAssets: Array<{ assetId: string; assetName: string; count: number }>;
  recentlyUsedAssets: Array<{ assetId: string; assetName: string; lastUsed: number }>;
  unusedDuration: {
    lessThan7Days: number;
    lessThan30Days: number;
    moreThan30Days: number;
  };
}

const STORAGE_KEY = 'story-asset-usage';
const ANALYTICS_CACHE_KEY = 'story-asset-analytics';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class UsageTrackerImpl {
  private usageMap: Map<string, AssetUsageLocation[]> = new Map();
  private listeners: Set<() => void> = new Set();
  private analyticsCache: { data: UsageAnalytics | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.usageMap = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load asset usage data:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const obj = Object.fromEntries(this.usageMap);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      // Invalidate analytics cache
      this.analyticsCache = { data: null, timestamp: 0 };
    } catch (error) {
      console.warn('Failed to save asset usage data:', error);
    }
  }

  private notify(): void {
    this.listeners.forEach(listener => listener());
  }

  private generateUsageId(
    assetId: string,
    entityType: UsageEntityType,
    entityId: string,
    fieldType: UsageFieldType
  ): string {
    return `${assetId}:${entityType}:${entityId}:${fieldType}`;
  }

  /**
   * Track an asset being used in a specific location
   */
  trackUsage(usage: Omit<AssetUsageLocation, 'id' | 'trackedAt'>): void {
    const id = this.generateUsageId(
      usage.assetId,
      usage.entityType,
      usage.entityId,
      usage.fieldType
    );

    const existingLocations = this.usageMap.get(usage.assetId) || [];

    // Check if this exact usage already exists
    const existingIndex = existingLocations.findIndex(loc => loc.id === id);

    const newLocation: AssetUsageLocation = {
      ...usage,
      id,
      trackedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing
      existingLocations[existingIndex] = newLocation;
    } else {
      // Add new
      existingLocations.push(newLocation);
    }

    this.usageMap.set(usage.assetId, existingLocations);
    this.saveToStorage();
    this.notify();
  }

  /**
   * Remove a specific usage reference
   */
  removeUsage(
    assetId: string,
    entityType: UsageEntityType,
    entityId: string,
    fieldType: UsageFieldType
  ): void {
    const id = this.generateUsageId(assetId, entityType, entityId, fieldType);
    const locations = this.usageMap.get(assetId);

    if (locations) {
      const filtered = locations.filter(loc => loc.id !== id);
      if (filtered.length > 0) {
        this.usageMap.set(assetId, filtered);
      } else {
        this.usageMap.delete(assetId);
      }
      this.saveToStorage();
      this.notify();
    }
  }

  /**
   * Remove all usage references for an entity (when entity is deleted)
   */
  removeEntityUsages(entityType: UsageEntityType, entityId: string): void {
    let changed = false;

    for (const [assetId, locations] of this.usageMap.entries()) {
      const filtered = locations.filter(
        loc => !(loc.entityType === entityType && loc.entityId === entityId)
      );

      if (filtered.length !== locations.length) {
        changed = true;
        if (filtered.length > 0) {
          this.usageMap.set(assetId, filtered);
        } else {
          this.usageMap.delete(assetId);
        }
      }
    }

    if (changed) {
      this.saveToStorage();
      this.notify();
    }
  }

  /**
   * Remove all usages for a specific asset
   */
  removeAssetUsages(assetId: string): void {
    if (this.usageMap.has(assetId)) {
      this.usageMap.delete(assetId);
      this.saveToStorage();
      this.notify();
    }
  }

  /**
   * Get usage summary for a specific asset
   */
  getAssetUsageSummary(assetId: string): AssetUsageSummary {
    const locations = this.usageMap.get(assetId) || [];

    const usageByType: Record<UsageEntityType, number> = {
      character: 0,
      scene: 0,
      beat: 0,
      project: 0,
      faction: 0,
      location: 0,
    };

    const usageByField: Partial<Record<UsageFieldType, number>> = {};

    let lastUsedAt: number | undefined;

    locations.forEach(loc => {
      usageByType[loc.entityType]++;
      usageByField[loc.fieldType] = (usageByField[loc.fieldType] || 0) + 1;
      if (!lastUsedAt || loc.trackedAt > lastUsedAt) {
        lastUsedAt = loc.trackedAt;
      }
    });

    return {
      assetId,
      totalReferences: locations.length,
      usageByType,
      usageByField: usageByField as Record<UsageFieldType, number>,
      locations,
      lastUsedAt,
      isOrphan: locations.length === 0,
    };
  }

  /**
   * Get all usage locations for an asset
   */
  getAssetUsages(assetId: string): AssetUsageLocation[] {
    return this.usageMap.get(assetId) || [];
  }

  /**
   * Get reference count for an asset
   */
  getReferenceCount(assetId: string): number {
    return this.usageMap.get(assetId)?.length || 0;
  }

  /**
   * Check if an asset is orphaned (no references)
   */
  isOrphan(assetId: string): boolean {
    return this.getReferenceCount(assetId) === 0;
  }

  /**
   * Get all orphaned assets from provided asset list
   */
  detectOrphans(
    assets: Array<{ _id: string; name: string; type: string; created_at?: string }>
  ): OrphanAsset[] {
    const now = Date.now();

    return assets
      .filter(asset => this.isOrphan(asset._id))
      .map(asset => {
        let daysSinceCreation: number | undefined;
        if (asset.created_at) {
          const createdTime = new Date(asset.created_at).getTime();
          daysSinceCreation = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));
        }

        return {
          assetId: asset._id,
          assetName: asset.name,
          assetType: asset.type,
          createdAt: asset.created_at,
          daysSinceCreation,
        };
      });
  }

  /**
   * Get usage analytics for all tracked assets
   */
  getAnalytics(
    allAssets?: Array<{ _id: string; name: string; type: string; created_at?: string }>
  ): UsageAnalytics {
    const now = Date.now();

    // Return cached if valid
    if (
      this.analyticsCache.data &&
      now - this.analyticsCache.timestamp < CACHE_DURATION
    ) {
      return this.analyticsCache.data;
    }

    const usageDistribution: Record<UsageEntityType, number> = {
      character: 0,
      scene: 0,
      beat: 0,
      project: 0,
      faction: 0,
      location: 0,
    };

    const assetUsageCounts: Map<string, { name: string; count: number; lastUsed: number }> =
      new Map();

    let totalReferences = 0;

    for (const [assetId, locations] of this.usageMap.entries()) {
      totalReferences += locations.length;

      let assetLastUsed = 0;
      locations.forEach(loc => {
        usageDistribution[loc.entityType]++;
        if (loc.trackedAt > assetLastUsed) {
          assetLastUsed = loc.trackedAt;
        }
      });

      const existing = assetUsageCounts.get(assetId);
      assetUsageCounts.set(assetId, {
        name: locations[0]?.entityName || assetId,
        count: locations.length,
        lastUsed: assetLastUsed,
      });
    }

    // Sort by usage count
    const topUsedAssets = Array.from(assetUsageCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([assetId, data]) => ({
        assetId,
        assetName: data.name,
        count: data.count,
      }));

    // Sort by last used
    const recentlyUsedAssets = Array.from(assetUsageCounts.entries())
      .sort((a, b) => b[1].lastUsed - a[1].lastUsed)
      .slice(0, 10)
      .map(([assetId, data]) => ({
        assetId,
        assetName: data.name,
        lastUsed: data.lastUsed,
      }));

    // Calculate orphan stats if assets provided
    let orphanCount = 0;
    const unusedDuration = {
      lessThan7Days: 0,
      lessThan30Days: 0,
      moreThan30Days: 0,
    };

    if (allAssets) {
      const orphans = this.detectOrphans(allAssets);
      orphanCount = orphans.length;

      orphans.forEach(orphan => {
        if (orphan.daysSinceCreation !== undefined) {
          if (orphan.daysSinceCreation < 7) {
            unusedDuration.lessThan7Days++;
          } else if (orphan.daysSinceCreation < 30) {
            unusedDuration.lessThan30Days++;
          } else {
            unusedDuration.moreThan30Days++;
          }
        }
      });
    }

    const analytics: UsageAnalytics = {
      totalAssets: allAssets?.length || this.usageMap.size,
      totalReferences,
      orphanCount,
      usageDistribution,
      topUsedAssets,
      recentlyUsedAssets,
      unusedDuration,
    };

    // Cache result
    this.analyticsCache = { data: analytics, timestamp: now };

    return analytics;
  }

  /**
   * Build navigation path for a usage location
   */
  buildNavigationPath(usage: AssetUsageLocation): string {
    const basePath = usage.projectId ? `/project/${usage.projectId}` : '';

    switch (usage.entityType) {
      case 'character':
        return `${basePath}/characters/${usage.entityId}`;
      case 'scene':
        return `${basePath}/scenes/${usage.entityId}`;
      case 'beat':
        return `${basePath}/beats/${usage.entityId}`;
      case 'faction':
        return `${basePath}/factions/${usage.entityId}`;
      case 'location':
        return `${basePath}/locations/${usage.entityId}`;
      case 'project':
        return `/project/${usage.entityId}`;
      default:
        return usage.navigationPath || '#';
    }
  }

  /**
   * Check if safe to delete asset
   */
  canSafelyDelete(assetId: string): {
    canDelete: boolean;
    referenceCount: number;
    locations: AssetUsageLocation[];
    warning?: string;
  } {
    const locations = this.getAssetUsages(assetId);
    const referenceCount = locations.length;

    if (referenceCount === 0) {
      return { canDelete: true, referenceCount, locations };
    }

    const entityTypes = new Set(locations.map(l => l.entityType));
    const warning = `This asset is used in ${referenceCount} place(s): ${Array.from(
      entityTypes
    ).join(', ')}. Deleting it may break these references.`;

    return { canDelete: false, referenceCount, locations, warning };
  }

  /**
   * Bulk track usages (for initial scan or sync)
   */
  bulkTrackUsages(usages: Array<Omit<AssetUsageLocation, 'id' | 'trackedAt'>>): void {
    usages.forEach(usage => {
      const id = this.generateUsageId(
        usage.assetId,
        usage.entityType,
        usage.entityId,
        usage.fieldType
      );

      const locations = this.usageMap.get(usage.assetId) || [];
      const existingIndex = locations.findIndex(loc => loc.id === id);

      const newLocation: AssetUsageLocation = {
        ...usage,
        id,
        trackedAt: Date.now(),
      };

      if (existingIndex >= 0) {
        locations[existingIndex] = newLocation;
      } else {
        locations.push(newLocation);
      }

      this.usageMap.set(usage.assetId, locations);
    });

    this.saveToStorage();
    this.notify();
  }

  /**
   * Clear all tracked usage data
   */
  clearAll(): void {
    this.usageMap.clear();
    this.saveToStorage();
    this.notify();
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all tracked asset IDs
   */
  getTrackedAssetIds(): string[] {
    return Array.from(this.usageMap.keys());
  }
}

// Singleton instance
export const UsageTracker = new UsageTrackerImpl();

// Export for type use
export type { UsageTrackerImpl };
