/**
 * TanStack Query Integration for Coordination Hub
 *
 * Provides automatic cache invalidation when coordination events occur.
 * Integrates with the existing queryHelpers pattern.
 */

import { QueryClient } from '@tanstack/react-query';
import { getCoordinationHub, CoordinationHub } from './CoordinationHub';
import { CoordinationEvent, CoordinationEventType, EventPayload } from './types';

// ============================================================================
// Query Client Integration
// ============================================================================

let queryClientRef: QueryClient | null = null;

/**
 * Initialize query integration with a QueryClient instance
 */
export function initializeQueryIntegration(queryClient: QueryClient): () => void {
  queryClientRef = queryClient;

  const hub = getCoordinationHub({
    onCacheInvalidation: (queryKeys) => {
      invalidateQueries(queryKeys);
    },
  });

  // Return cleanup function
  return () => {
    queryClientRef = null;
  };
}

/**
 * Invalidate queries by their keys
 */
export function invalidateQueries(queryKeys: string[][]): void {
  if (!queryClientRef) {
    console.warn('[QueryIntegration] QueryClient not initialized');
    return;
  }

  for (const key of queryKeys) {
    // Filter out empty strings from keys
    const cleanKey = key.filter(k => k !== '');
    if (cleanKey.length > 0) {
      queryClientRef.invalidateQueries({ queryKey: cleanKey });
    }
  }
}

/**
 * Invalidate all queries for a specific entity type
 */
export function invalidateEntityQueries(entityType: string): void {
  if (!queryClientRef) return;

  queryClientRef.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key[0] === entityType;
    },
  });
}

/**
 * Invalidate all queries for a specific project
 */
export function invalidateProjectQueries(projectId: string): void {
  if (!queryClientRef) return;

  queryClientRef.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key.includes(projectId);
    },
  });
}

// ============================================================================
// Event-Based Invalidation Helpers
// ============================================================================

/**
 * Create a mutation wrapper that automatically emits coordination events
 */
export function createCoordinatedMutation<TData, TVariables extends { projectId: string; entityId?: string }>(
  eventType: CoordinationEventType,
  entityType: EventPayload['entityType'],
  options?: {
    getEntityId?: (variables: TVariables, data: TData) => string;
    getChanges?: (variables: TVariables) => Record<string, unknown>;
    source?: string;
  }
) {
  return {
    onSuccess: (data: TData, variables: TVariables) => {
      const hub = getCoordinationHub();
      const entityId = options?.getEntityId?.(variables, data) ?? variables.entityId ?? '';

      hub.emit(eventType, {
        entityId,
        entityType,
        projectId: variables.projectId,
        source: options?.source ?? 'mutation',
        changes: options?.getChanges?.(variables),
      } as EventPayload);
    },
  };
}

// ============================================================================
// Optimistic Update Helpers
// ============================================================================

/**
 * Helper for optimistic updates with coordination
 */
export function createOptimisticUpdate<TData>(
  queryKey: string[],
  updateFn: (oldData: TData | undefined) => TData
): {
  onMutate: () => Promise<{ previousData: TData | undefined }>;
  onError: (err: unknown, variables: unknown, context: { previousData: TData | undefined } | undefined) => void;
  onSettled: () => void;
} {
  return {
    onMutate: async () => {
      if (!queryClientRef) {
        return { previousData: undefined };
      }

      // Cancel outgoing refetches
      await queryClientRef.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClientRef.getQueryData<TData>(queryKey);

      // Optimistically update
      queryClientRef.setQueryData<TData>(queryKey, (old) => updateFn(old));

      return { previousData };
    },
    onError: (
      _err: unknown,
      _variables: unknown,
      context: { previousData: TData | undefined } | undefined
    ) => {
      // Rollback on error
      if (context?.previousData !== undefined && queryClientRef) {
        queryClientRef.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Invalidate to refetch
      if (queryClientRef) {
        queryClientRef.invalidateQueries({ queryKey });
      }
    },
  };
}

// ============================================================================
// Subscription Hook Factory
// ============================================================================

/**
 * Create a subscription effect for React components
 *
 * Usage:
 * ```tsx
 * useEffect(() => {
 *   return createQuerySubscription(['characters', 'project', projectId], 'CHARACTER_UPDATED');
 * }, [projectId]);
 * ```
 */
export function createQuerySubscription(
  queryKey: string[],
  eventTypes: CoordinationEventType | CoordinationEventType[],
  options?: {
    projectId?: string;
    entityFilter?: (event: CoordinationEvent) => boolean;
  }
): () => void {
  const hub = getCoordinationHub();
  const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

  const subscriptionId = hub.subscribe(types, (event) => {
    // Apply custom filter if provided
    if (options?.entityFilter && !options.entityFilter(event)) {
      return;
    }

    // Invalidate the query
    if (queryClientRef) {
      queryClientRef.invalidateQueries({ queryKey });
    }
  }, {
    projectId: options?.projectId,
    label: `query-subscription-${queryKey.join('-')}`,
  });

  return () => {
    hub.unsubscribe(subscriptionId);
  };
}

// ============================================================================
// Batch Invalidation
// ============================================================================

/**
 * Batch multiple query invalidations into a single operation
 */
export function batchInvalidate(invalidations: Array<{
  queryKey: string[];
  exact?: boolean;
}>): void {
  if (!queryClientRef) return;

  for (const { queryKey, exact } of invalidations) {
    queryClientRef.invalidateQueries({
      queryKey,
      exact: exact ?? false,
    });
  }
}

/**
 * Create a batch of invalidations for related entities
 */
export function createRelatedInvalidations(
  entityType: string,
  entityId: string,
  projectId: string
): string[][] {
  const hub = getCoordinationHub();
  const entity = { type: entityType as EventPayload['entityType'], id: entityId };

  // Get dependent entities
  const dependents = hub.getDependents(entity);

  const keys: string[][] = [
    [entityType, entityId],
    [entityType, 'project', projectId],
  ];

  // Add keys for dependent entities
  for (const dep of dependents) {
    keys.push([dep.sourceEntity.type, dep.sourceEntity.id]);
  }

  return keys;
}

// ============================================================================
// Prefetch Integration
// ============================================================================

/**
 * Prefetch related queries when an entity is loaded
 */
export async function prefetchRelatedQueries<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  relatedKeys: string[][]
): Promise<void> {
  if (!queryClientRef) return;

  // Prefetch the main query
  await queryClientRef.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mark related queries for prefetch (they'll be fetched when accessed)
  for (const key of relatedKeys) {
    queryClientRef.prefetchQuery({
      queryKey: key,
      queryFn: async () => null, // Placeholder - actual fetch happens elsewhere
      staleTime: 0, // Will refetch when needed
    });
  }
}

// ============================================================================
// Query State Helpers
// ============================================================================

/**
 * Check if a query is stale
 */
export function isQueryStale(queryKey: string[]): boolean {
  if (!queryClientRef) return true;

  const state = queryClientRef.getQueryState(queryKey);
  if (!state) return true;

  const staleTime = 5 * 60 * 1000; // 5 minutes
  return Date.now() - state.dataUpdatedAt > staleTime;
}

/**
 * Get all active queries for an entity type
 */
export function getActiveQueriesForEntityType(entityType: string): string[][] {
  if (!queryClientRef) return [];

  const cache = queryClientRef.getQueryCache();
  const queries = cache.getAll();

  return queries
    .filter(q => {
      const key = q.queryKey;
      return Array.isArray(key) && key[0] === entityType && q.state.status !== 'pending';
    })
    .map(q => q.queryKey as string[]);
}

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Log all current cache entries (for debugging)
 */
export function debugLogCache(): void {
  if (!queryClientRef) {
    console.log('[QueryIntegration] No QueryClient initialized');
    return;
  }

  const cache = queryClientRef.getQueryCache();
  const queries = cache.getAll();

  console.group('[QueryIntegration] Cache Contents');
  for (const query of queries) {
    console.log({
      key: query.queryKey,
      status: query.state.status,
      dataUpdatedAt: new Date(query.state.dataUpdatedAt).toISOString(),
      isStale: query.isStale(),
    });
  }
  console.groupEnd();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalQueries: number;
  staleQueries: number;
  fetchingQueries: number;
  byEntityType: Record<string, number>;
} {
  if (!queryClientRef) {
    return { totalQueries: 0, staleQueries: 0, fetchingQueries: 0, byEntityType: {} };
  }

  const cache = queryClientRef.getQueryCache();
  const queries = cache.getAll();

  const stats = {
    totalQueries: queries.length,
    staleQueries: queries.filter(q => q.isStale()).length,
    fetchingQueries: queries.filter(q => q.state.status === 'pending').length,
    byEntityType: {} as Record<string, number>,
  };

  for (const query of queries) {
    const key = query.queryKey;
    if (Array.isArray(key) && typeof key[0] === 'string') {
      stats.byEntityType[key[0]] = (stats.byEntityType[key[0]] ?? 0) + 1;
    }
  }

  return stats;
}

export default {
  initializeQueryIntegration,
  invalidateQueries,
  invalidateEntityQueries,
  invalidateProjectQueries,
  createCoordinatedMutation,
  createOptimisticUpdate,
  createQuerySubscription,
  batchInvalidate,
  createRelatedInvalidations,
  prefetchRelatedQueries,
  isQueryStale,
  getActiveQueriesForEntityType,
  debugLogCache,
  getCacheStats,
};
