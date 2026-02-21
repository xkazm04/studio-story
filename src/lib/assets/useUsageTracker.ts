/**
 * React hooks for the asset usage tracking system
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  UsageTracker,
  AssetUsageLocation,
  AssetUsageSummary,
  OrphanAsset,
  UsageAnalytics,
  UsageEntityType,
  UsageFieldType,
} from './UsageTracker';

/**
 * Hook to get and track usage summary for a specific asset
 */
export function useAssetUsage(assetId: string | null): AssetUsageSummary | null {
  const [summary, setSummary] = useState<AssetUsageSummary | null>(null);

  useEffect(() => {
    if (!assetId) {
      setSummary(null);
      return;
    }

    const updateSummary = () => {
      const newSummary = UsageTracker.getAssetUsageSummary(assetId);
      setSummary(prev => {
        // Only update if data actually changed
        if (!prev || prev.totalReferences !== newSummary.totalReferences) {
          return newSummary;
        }
        return prev;
      });
    };

    updateSummary();
    const unsubscribe = UsageTracker.subscribe(updateSummary);
    return unsubscribe;
  }, [assetId]);

  return summary;
}

/**
 * Hook to track asset usage in a component
 */
export function useTrackUsage() {
  const trackUsage = useCallback(
    (
      assetId: string,
      entityType: UsageEntityType,
      entityId: string,
      entityName: string,
      fieldType: UsageFieldType,
      options?: {
        projectId?: string;
        projectName?: string;
        navigationPath?: string;
      }
    ) => {
      UsageTracker.trackUsage({
        assetId,
        entityType,
        entityId,
        entityName,
        fieldType,
        ...options,
      });
    },
    []
  );

  const removeUsage = useCallback(
    (
      assetId: string,
      entityType: UsageEntityType,
      entityId: string,
      fieldType: UsageFieldType
    ) => {
      UsageTracker.removeUsage(assetId, entityType, entityId, fieldType);
    },
    []
  );

  const removeEntityUsages = useCallback(
    (entityType: UsageEntityType, entityId: string) => {
      UsageTracker.removeEntityUsages(entityType, entityId);
    },
    []
  );

  return { trackUsage, removeUsage, removeEntityUsages };
}

/**
 * Hook to detect orphaned assets
 * Fixed to prevent infinite loops by:
 * 1. Memoizing asset IDs to stabilize the dependency
 * 2. Only updating state when orphan count actually changes
 * 3. Using a ref to track previous results
 */
export function useOrphanDetection(
  assets: Array<{ _id: string; name: string; type: string; created_at?: string }> | undefined
): {
  orphans: OrphanAsset[];
  orphanCount: number;
  isLoading: boolean;
} {
  const [orphans, setOrphans] = useState<OrphanAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const prevOrphanIdsRef = useRef<string>('');

  // Memoize asset IDs to stabilize the dependency
  const assetIds = useMemo(() => {
    if (!assets) return '';
    return assets.map(a => a._id).sort().join(',');
  }, [assets]);

  // Memoize the assets array reference based on content
  const stableAssets = useMemo(() => assets, [assetIds]);

  useEffect(() => {
    if (!stableAssets || stableAssets.length === 0) {
      setOrphans([]);
      setIsLoading(false);
      prevOrphanIdsRef.current = '';
      return;
    }

    const detectOrphans = () => {
      const detected = UsageTracker.detectOrphans(stableAssets);
      const newOrphanIds = detected.map(o => o.assetId).sort().join(',');

      // Only update state if orphan list actually changed
      if (newOrphanIds !== prevOrphanIdsRef.current) {
        prevOrphanIdsRef.current = newOrphanIds;
        setOrphans(detected);
      }
      setIsLoading(false);
    };

    setIsLoading(true);
    detectOrphans();
    const unsubscribe = UsageTracker.subscribe(detectOrphans);
    return unsubscribe;
  }, [stableAssets]);

  return {
    orphans,
    orphanCount: orphans.length,
    isLoading,
  };
}

/**
 * Hook to get usage analytics
 * Fixed to prevent infinite loops by stabilizing the assets dependency
 */
export function useUsageAnalytics(
  allAssets?: Array<{ _id: string; name: string; type: string; created_at?: string }>
): {
  analytics: UsageAnalytics | null;
  isLoading: boolean;
  refresh: () => void;
} {
  const [analytics, setAnalytics] = useState<UsageAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const prevAnalyticsRef = useRef<{ totalReferences: number; orphanCount: number } | null>(null);

  // Memoize asset IDs to stabilize the dependency
  const assetIds = useMemo(() => {
    if (!allAssets) return '';
    return allAssets.map(a => a._id).sort().join(',');
  }, [allAssets]);

  // Memoize the assets array reference based on content
  const stableAssets = useMemo(() => allAssets, [assetIds]);

  const refresh = useCallback(() => {
    const data = UsageTracker.getAnalytics(stableAssets);

    // Only update if data actually changed
    const newKey = { totalReferences: data.totalReferences, orphanCount: data.orphanCount };
    const prevKey = prevAnalyticsRef.current;

    if (!prevKey || prevKey.totalReferences !== newKey.totalReferences || prevKey.orphanCount !== newKey.orphanCount) {
      prevAnalyticsRef.current = newKey;
      setAnalytics(data);
    }
    setIsLoading(false);
  }, [stableAssets]);

  useEffect(() => {
    setIsLoading(true);
    refresh();
    const unsubscribe = UsageTracker.subscribe(refresh);
    return unsubscribe;
  }, [refresh]);

  return { analytics, isLoading, refresh };
}

/**
 * Hook to check if an asset can be safely deleted
 * Fixed to only update state when data actually changes
 */
export function useDeleteSafety(assetId: string | null): {
  canDelete: boolean;
  referenceCount: number;
  locations: AssetUsageLocation[];
  warning?: string;
} {
  const [safety, setSafety] = useState<{
    canDelete: boolean;
    referenceCount: number;
    locations: AssetUsageLocation[];
    warning?: string;
  }>({
    canDelete: true,
    referenceCount: 0,
    locations: [],
  });

  useEffect(() => {
    if (!assetId) {
      setSafety({ canDelete: true, referenceCount: 0, locations: [] });
      return;
    }

    const checkSafety = () => {
      const newSafety = UsageTracker.canSafelyDelete(assetId);
      // Only update if reference count changed
      setSafety(prev => prev.referenceCount !== newSafety.referenceCount ? newSafety : prev);
    };

    checkSafety();
    const unsubscribe = UsageTracker.subscribe(checkSafety);
    return unsubscribe;
  }, [assetId]);

  return safety;
}

/**
 * Hook to get reference count for an asset
 * Fixed to only update state when count actually changes
 */
export function useReferenceCount(assetId: string | null): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!assetId) {
      setCount(0);
      return;
    }

    const updateCount = () => {
      const newCount = UsageTracker.getReferenceCount(assetId);
      // Only update if count actually changed
      setCount(prev => prev !== newCount ? newCount : prev);
    };

    updateCount();
    const unsubscribe = UsageTracker.subscribe(updateCount);
    return unsubscribe;
  }, [assetId]);

  return count;
}

/**
 * Hook to get usage locations for navigation
 * Fixed to only update state when location count changes
 */
export function useUsageLocations(assetId: string | null): {
  locations: AssetUsageLocation[];
  buildPath: (location: AssetUsageLocation) => string;
} {
  const [locations, setLocations] = useState<AssetUsageLocation[]>([]);

  useEffect(() => {
    if (!assetId) {
      setLocations([]);
      return;
    }

    const updateLocations = () => {
      const newLocations = UsageTracker.getAssetUsages(assetId);
      // Only update if count changed
      setLocations(prev => prev.length !== newLocations.length ? newLocations : prev);
    };

    updateLocations();
    const unsubscribe = UsageTracker.subscribe(updateLocations);
    return unsubscribe;
  }, [assetId]);

  const buildPath = useCallback((location: AssetUsageLocation) => {
    return UsageTracker.buildNavigationPath(location);
  }, []);

  return { locations, buildPath };
}

/**
 * Hook for bulk scanning and tracking usages
 */
export function useBulkTracker() {
  const bulkTrack = useCallback(
    (usages: Array<Omit<AssetUsageLocation, 'id' | 'trackedAt'>>) => {
      UsageTracker.bulkTrackUsages(usages);
    },
    []
  );

  const clearAll = useCallback(() => {
    UsageTracker.clearAll();
  }, []);

  return { bulkTrack, clearAll };
}
