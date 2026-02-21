'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getCoordinationHub, CoordinationHub } from '@/lib/coordination/CoordinationHub';
import { initializeQueryIntegration, invalidateQueries } from '@/lib/coordination/queryIntegration';
import {
  CoordinationEvent,
  CoordinationEventType,
  EntityReference,
  EntityType,
  EventPayload,
  ImpactAnalysis,
  UndoContext,
} from '@/lib/coordination/types';

// ============================================================================
// Main Coordination Hook
// ============================================================================

export interface UseCoordinationOptions {
  projectId?: string;
  debugMode?: boolean;
  enablePersistence?: boolean;
}

export interface UseCoordinationReturn {
  // Core functionality
  hub: CoordinationHub;
  emit: (
    type: CoordinationEventType,
    payload: Partial<EventPayload> & { entityId: string; entityType: EntityType; projectId: string; source: string },
    options?: {
      debounceKey?: string;
      debounceMs?: number;
      undoable?: boolean;
      undoData?: unknown;
    }
  ) => string;
  subscribe: (
    eventTypes: CoordinationEventType | CoordinationEventType[],
    handler: (event: CoordinationEvent) => void | Promise<void>,
    options?: {
      entityTypes?: EntityType[];
      priority?: number;
      label?: string;
    }
  ) => () => void;

  // Impact analysis
  previewImpact: (
    entity: EntityReference,
    eventType: CoordinationEventType
  ) => ImpactAnalysis;

  // Undo/Redo
  undo: () => boolean;
  redo: () => boolean;
  undoContext: UndoContext;

  // Activity
  getRecentActivity: (count?: number) => Array<{
    timestamp: number;
    type: string;
    description: string;
    entityId?: string;
    entityType?: EntityType;
  }>;

  // Debug
  getEventLog: () => CoordinationEvent[];
}

export function useCoordination(options?: UseCoordinationOptions): UseCoordinationReturn {
  const queryClient = useQueryClient();
  const hubRef = useRef<CoordinationHub | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [undoContext, setUndoContext] = useState<UndoContext>({
    canUndo: false,
    canRedo: false,
    undoStack: [],
    redoStack: [],
  });

  // Initialize hub and query integration
  useEffect(() => {
    const hub = getCoordinationHub({
      debugMode: options?.debugMode,
      enablePersistence: options?.enablePersistence,
      onCacheInvalidation: (queryKeys) => {
        invalidateQueries(queryKeys);
      },
    });

    hubRef.current = hub;
    cleanupRef.current = initializeQueryIntegration(queryClient);

    // Update undo context
    setUndoContext(hub.getUndoContext());

    // Subscribe to track undo context changes
    const subId = hub.subscribe(
      [
        'CHARACTER_CREATED', 'CHARACTER_UPDATED', 'CHARACTER_DELETED',
        'SCENE_CREATED', 'SCENE_UPDATED', 'SCENE_DELETED',
        'FACTION_CREATED', 'FACTION_UPDATED', 'FACTION_DELETED',
        'BEAT_CREATED', 'BEAT_UPDATED', 'BEAT_DELETED',
        'ASSET_UPLOADED', 'ASSET_UPDATED', 'ASSET_DELETED',
      ],
      () => {
        setUndoContext(hub.getUndoContext());
      },
      { label: 'undo-context-tracker', priority: -1 }
    );

    return () => {
      hub.unsubscribe(subId);
      cleanupRef.current?.();
    };
  }, [queryClient, options?.debugMode, options?.enablePersistence]);

  // Emit event
  const emit = useCallback(
    (
      type: CoordinationEventType,
      payload: Partial<EventPayload> & { entityId: string; entityType: EntityType; projectId: string; source: string },
      emitOptions?: {
        debounceKey?: string;
        debounceMs?: number;
        undoable?: boolean;
        undoData?: unknown;
      }
    ): string => {
      if (!hubRef.current) {
        console.warn('[useCoordination] Hub not initialized');
        return '';
      }

      // Add projectId if available
      const fullPayload = {
        ...payload,
        projectId: payload.projectId || options?.projectId || '',
      };

      return hubRef.current.emit(type, fullPayload as EventPayload, emitOptions);
    },
    [options?.projectId]
  );

  // Subscribe to events
  const subscribe = useCallback(
    (
      eventTypes: CoordinationEventType | CoordinationEventType[],
      handler: (event: CoordinationEvent) => void | Promise<void>,
      subscribeOptions?: {
        entityTypes?: EntityType[];
        priority?: number;
        label?: string;
      }
    ): (() => void) => {
      if (!hubRef.current) {
        console.warn('[useCoordination] Hub not initialized');
        return () => {};
      }

      const subscriptionId = hubRef.current.subscribe(eventTypes, handler, {
        ...subscribeOptions,
        projectId: options?.projectId,
      });

      return () => {
        hubRef.current?.unsubscribe(subscriptionId);
      };
    },
    [options?.projectId]
  );

  // Preview impact
  const previewImpact = useCallback(
    (entity: EntityReference, eventType: CoordinationEventType): ImpactAnalysis => {
      if (!hubRef.current) {
        return {
          sourceEntity: entity,
          eventType,
          affectedEntities: [],
          totalAffected: 0,
          analysisTimestamp: Date.now(),
        };
      }

      return hubRef.current.previewImpact(entity, eventType);
    },
    []
  );

  // Undo
  const undo = useCallback((): boolean => {
    if (!hubRef.current) return false;
    const result = hubRef.current.undo();
    setUndoContext(hubRef.current.getUndoContext());
    return result;
  }, []);

  // Redo
  const redo = useCallback((): boolean => {
    if (!hubRef.current) return false;
    const result = hubRef.current.redo();
    setUndoContext(hubRef.current.getUndoContext());
    return result;
  }, []);

  // Get recent activity
  const getRecentActivity = useCallback((count: number = 10) => {
    return hubRef.current?.getRecentActivity(count) ?? [];
  }, []);

  // Get event log
  const getEventLog = useCallback(() => {
    return hubRef.current?.getEventLog() ?? [];
  }, []);

  return {
    hub: hubRef.current!,
    emit,
    subscribe,
    previewImpact,
    undo,
    redo,
    undoContext,
    getRecentActivity,
    getEventLog,
  };
}

// ============================================================================
// Entity-Specific Hooks
// ============================================================================

/**
 * Hook for character coordination
 */
export function useCharacterCoordination(projectId: string) {
  const { emit, subscribe, previewImpact } = useCoordination({ projectId });

  const emitCharacterCreated = useCallback(
    (characterId: string, name?: string) => {
      return emit('CHARACTER_CREATED', {
        entityId: characterId,
        entityType: 'character',
        projectId,
        source: 'useCharacterCoordination',
        changes: name ? { name: { new: name } } : undefined,
      });
    },
    [emit, projectId]
  );

  const emitCharacterUpdated = useCallback(
    (characterId: string, changes: Record<string, { old?: unknown; new: unknown }>) => {
      return emit('CHARACTER_UPDATED', {
        entityId: characterId,
        entityType: 'character',
        projectId,
        source: 'useCharacterCoordination',
        changes,
      });
    },
    [emit, projectId]
  );

  const emitCharacterDeleted = useCallback(
    (characterId: string) => {
      return emit('CHARACTER_DELETED', {
        entityId: characterId,
        entityType: 'character',
        projectId,
        source: 'useCharacterCoordination',
      });
    },
    [emit, projectId]
  );

  const emitFactionChanged = useCallback(
    (characterId: string, oldFactionId?: string | null, newFactionId?: string | null) => {
      return emit('CHARACTER_FACTION_CHANGED', {
        entityId: characterId,
        entityType: 'character',
        projectId,
        source: 'useCharacterCoordination',
        changes: {
          factionId: { old: oldFactionId ?? null, new: newFactionId ?? null },
        },
      } as Partial<EventPayload> & { entityId: string; entityType: EntityType; projectId: string; source: string });
    },
    [emit, projectId]
  );

  const subscribeToCharacterEvents = useCallback(
    (handler: (event: CoordinationEvent) => void) => {
      return subscribe(
        [
          'CHARACTER_CREATED',
          'CHARACTER_UPDATED',
          'CHARACTER_DELETED',
          'CHARACTER_FACTION_CHANGED',
          'CHARACTER_AVATAR_CHANGED',
        ],
        handler,
        { entityTypes: ['character'], label: 'character-subscriber' }
      );
    },
    [subscribe]
  );

  const previewCharacterDeletion = useCallback(
    (characterId: string, name?: string) => {
      return previewImpact(
        { type: 'character', id: characterId, name },
        'CHARACTER_DELETED'
      );
    },
    [previewImpact]
  );

  return {
    emitCharacterCreated,
    emitCharacterUpdated,
    emitCharacterDeleted,
    emitFactionChanged,
    subscribeToCharacterEvents,
    previewCharacterDeletion,
  };
}

/**
 * Hook for scene coordination
 */
export function useSceneCoordination(projectId: string) {
  const { emit, subscribe, previewImpact } = useCoordination({ projectId });

  const emitSceneCreated = useCallback(
    (sceneId: string, actId: string, name?: string) => {
      return emit('SCENE_CREATED', {
        entityId: sceneId,
        entityType: 'scene',
        projectId,
        actId,
        source: 'useSceneCoordination',
        changes: name ? { name: { new: name } } : undefined,
      });
    },
    [emit, projectId]
  );

  const emitSceneUpdated = useCallback(
    (sceneId: string, actId?: string, changes?: Record<string, { old?: unknown; new: unknown }>) => {
      return emit('SCENE_UPDATED', {
        entityId: sceneId,
        entityType: 'scene',
        projectId,
        actId,
        source: 'useSceneCoordination',
        changes,
      });
    },
    [emit, projectId]
  );

  const emitSceneDeleted = useCallback(
    (sceneId: string, actId?: string) => {
      return emit('SCENE_DELETED', {
        entityId: sceneId,
        entityType: 'scene',
        projectId,
        actId,
        source: 'useSceneCoordination',
      });
    },
    [emit, projectId]
  );

  const subscribeToSceneEvents = useCallback(
    (handler: (event: CoordinationEvent) => void) => {
      return subscribe(
        [
          'SCENE_CREATED',
          'SCENE_UPDATED',
          'SCENE_DELETED',
          'SCENE_REORDERED',
          'SCENE_CONTENT_CHANGED',
        ],
        handler,
        { entityTypes: ['scene'], label: 'scene-subscriber' }
      );
    },
    [subscribe]
  );

  return {
    emitSceneCreated,
    emitSceneUpdated,
    emitSceneDeleted,
    subscribeToSceneEvents,
  };
}

/**
 * Hook for faction coordination
 */
export function useFactionCoordination(projectId: string) {
  const { emit, subscribe, previewImpact } = useCoordination({ projectId });

  const emitFactionCreated = useCallback(
    (factionId: string, name?: string) => {
      return emit('FACTION_CREATED', {
        entityId: factionId,
        entityType: 'faction',
        projectId,
        source: 'useFactionCoordination',
        changes: name ? { name: { new: name } } : undefined,
      });
    },
    [emit, projectId]
  );

  const emitFactionUpdated = useCallback(
    (factionId: string, changes?: Record<string, { old?: unknown; new: unknown }>) => {
      return emit('FACTION_UPDATED', {
        entityId: factionId,
        entityType: 'faction',
        projectId,
        source: 'useFactionCoordination',
        changes,
      });
    },
    [emit, projectId]
  );

  const emitMemberAdded = useCallback(
    (factionId: string, characterId: string) => {
      return emit('FACTION_MEMBER_ADDED', {
        entityId: factionId,
        entityType: 'faction',
        projectId,
        source: 'useFactionCoordination',
        relatedCharacterId: characterId,
      });
    },
    [emit, projectId]
  );

  const emitMemberRemoved = useCallback(
    (factionId: string, characterId: string) => {
      return emit('FACTION_MEMBER_REMOVED', {
        entityId: factionId,
        entityType: 'faction',
        projectId,
        source: 'useFactionCoordination',
        relatedCharacterId: characterId,
      });
    },
    [emit, projectId]
  );

  const subscribeToFactionEvents = useCallback(
    (handler: (event: CoordinationEvent) => void) => {
      return subscribe(
        [
          'FACTION_CREATED',
          'FACTION_UPDATED',
          'FACTION_DELETED',
          'FACTION_MEMBER_ADDED',
          'FACTION_MEMBER_REMOVED',
        ],
        handler,
        { entityTypes: ['faction'], label: 'faction-subscriber' }
      );
    },
    [subscribe]
  );

  const previewFactionDeletion = useCallback(
    (factionId: string, name?: string) => {
      return previewImpact(
        { type: 'faction', id: factionId, name },
        'FACTION_DELETED'
      );
    },
    [previewImpact]
  );

  return {
    emitFactionCreated,
    emitFactionUpdated,
    emitMemberAdded,
    emitMemberRemoved,
    subscribeToFactionEvents,
    previewFactionDeletion,
  };
}

/**
 * Hook for beat coordination
 */
export function useBeatCoordination(projectId: string) {
  const { emit, subscribe } = useCoordination({ projectId });

  const emitBeatCreated = useCallback(
    (beatId: string, actId?: string, name?: string) => {
      return emit('BEAT_CREATED', {
        entityId: beatId,
        entityType: 'beat',
        projectId,
        actId,
        source: 'useBeatCoordination',
        changes: name ? { name: { new: name } } : undefined,
      });
    },
    [emit, projectId]
  );

  const emitBeatUpdated = useCallback(
    (beatId: string, actId?: string, changes?: Record<string, { old?: unknown; new: unknown }>) => {
      return emit('BEAT_UPDATED', {
        entityId: beatId,
        entityType: 'beat',
        projectId,
        actId,
        source: 'useBeatCoordination',
        changes,
      });
    },
    [emit, projectId]
  );

  const emitBeatCompleted = useCallback(
    (beatId: string, completed: boolean) => {
      return emit('BEAT_COMPLETED', {
        entityId: beatId,
        entityType: 'beat',
        projectId,
        source: 'useBeatCoordination',
        changes: { completed: { new: completed } },
      });
    },
    [emit, projectId]
  );

  const emitBeatDependencyAdded = useCallback(
    (beatId: string, targetBeatId: string) => {
      return emit('BEAT_DEPENDENCY_ADDED', {
        entityId: beatId,
        entityType: 'beat',
        projectId,
        source: 'useBeatCoordination',
        relatedBeatId: targetBeatId,
      });
    },
    [emit, projectId]
  );

  const emitSceneMappingChanged = useCallback(
    (beatId: string, sceneId: string) => {
      return emit('BEAT_SCENE_MAPPING_CHANGED', {
        entityId: beatId,
        entityType: 'beat',
        projectId,
        source: 'useBeatCoordination',
        relatedSceneId: sceneId,
      });
    },
    [emit, projectId]
  );

  const subscribeToBeatEvents = useCallback(
    (handler: (event: CoordinationEvent) => void) => {
      return subscribe(
        [
          'BEAT_CREATED',
          'BEAT_UPDATED',
          'BEAT_DELETED',
          'BEAT_COMPLETED',
          'BEAT_DEPENDENCY_ADDED',
          'BEAT_DEPENDENCY_REMOVED',
          'BEAT_SCENE_MAPPING_CHANGED',
        ],
        handler,
        { entityTypes: ['beat'], label: 'beat-subscriber' }
      );
    },
    [subscribe]
  );

  return {
    emitBeatCreated,
    emitBeatUpdated,
    emitBeatCompleted,
    emitBeatDependencyAdded,
    emitSceneMappingChanged,
    subscribeToBeatEvents,
  };
}

// ============================================================================
// Event Subscription Hook
// ============================================================================

/**
 * Hook for subscribing to specific events
 */
export function useCoordinationSubscription(
  eventTypes: CoordinationEventType | CoordinationEventType[],
  handler: (event: CoordinationEvent) => void,
  options?: {
    projectId?: string;
    entityTypes?: EntityType[];
    enabled?: boolean;
  }
) {
  const { subscribe } = useCoordination({ projectId: options?.projectId });
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (options?.enabled === false) return;

    const unsubscribe = subscribe(
      eventTypes,
      (event) => handlerRef.current(event),
      { entityTypes: options?.entityTypes }
    );

    return unsubscribe;
  }, [subscribe, eventTypes, options?.entityTypes, options?.enabled]);
}

// ============================================================================
// Impact Preview Hook
// ============================================================================

/**
 * Hook for impact analysis with state management
 */
export function useImpactPreview(projectId: string) {
  const { previewImpact } = useCoordination({ projectId });
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = useCallback(
    async (entity: EntityReference, eventType: CoordinationEventType) => {
      setIsLoading(true);
      try {
        const result = previewImpact(entity, eventType);
        setImpact(result);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [previewImpact]
  );

  const clear = useCallback(() => {
    setImpact(null);
  }, []);

  return {
    impact,
    isLoading,
    analyze,
    clear,
  };
}

export default useCoordination;
