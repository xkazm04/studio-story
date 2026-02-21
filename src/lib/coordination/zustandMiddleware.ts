/**
 * Zustand Middleware for Coordination Hub
 *
 * Provides automatic event emission when Zustand store state changes.
 * Tracks changes and emits appropriate coordination events.
 */

import { StateCreator, StoreMutatorIdentifier, Mutate, StoreApi } from 'zustand';
import { getCoordinationHub } from './CoordinationHub';
import { CoordinationEventType, EntityType, EventPayload } from './types';

// ============================================================================
// Types
// ============================================================================

export interface CoordinationConfig<T> {
  /**
   * Name of the store (for debugging)
   */
  storeName: string;

  /**
   * Entity type this store manages
   */
  entityType: EntityType;

  /**
   * Function to extract entity ID from state
   */
  getEntityId?: (state: T) => string | null;

  /**
   * Function to extract project ID from state
   */
  getProjectId?: (state: T) => string;

  /**
   * Map state changes to event types
   */
  eventMappings?: Array<{
    /**
     * Property path to watch (e.g., 'selectedCharacter', 'projectCharacters')
     */
    path: keyof T | string;

    /**
     * Event type to emit when this property changes
     */
    eventType: CoordinationEventType;

    /**
     * Custom condition for when to emit
     */
    shouldEmit?: (oldValue: unknown, newValue: unknown, state: T) => boolean;

    /**
     * Extract additional payload data
     */
    getPayload?: (oldValue: unknown, newValue: unknown, state: T) => Partial<EventPayload>;

    /**
     * Debounce key for high-frequency changes
     */
    debounceKey?: string;

    /**
     * Debounce delay in ms
     */
    debounceMs?: number;
  }>;

  /**
   * Enable debug logging
   */
  debug?: boolean;
}

type CoordinationMiddleware = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  config: CoordinationConfig<T>,
) => (
  initializer: StateCreator<T, Mps, Mcs>,
) => StateCreator<T, Mps, Mcs>;

// ============================================================================
// Middleware Implementation
// ============================================================================

/**
 * Zustand middleware that automatically emits coordination events on state changes
 *
 * Usage:
 * ```ts
 * const useCharacterStore = create<CharacterState>()(
 *   coordination({
 *     storeName: 'character',
 *     entityType: 'character',
 *     getProjectId: (state) => state.projectId,
 *     eventMappings: [
 *       {
 *         path: 'selectedCharacter',
 *         eventType: 'CHARACTER_UPDATED',
 *       },
 *     ],
 *   })(
 *     (set) => ({
 *       selectedCharacter: null,
 *       setSelectedCharacter: (id) => set({ selectedCharacter: id }),
 *     })
 *   )
 * );
 * ```
 */
export const coordination: CoordinationMiddleware = (config) => (initializer) => (set, get, store) => {
  const { storeName, entityType, eventMappings = [], debug = false } = config;

  const log = (message: string, ...args: unknown[]) => {
    if (debug) {
      console.log(`[Coordination:${storeName}] ${message}`, ...args);
    }
  };

  // Wrap the set function to intercept state changes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coordinatedSet = ((partial: any, replace: any) => {
    const prevState = get();

    // Call the original set
    (set as (partial: unknown, replace?: boolean) => void)(partial, replace);

    const nextState = get();

    // Check each mapping for changes
    for (const mapping of eventMappings) {
      const path = mapping.path as string;
      const oldValue = getNestedValue(prevState, path);
      const newValue = getNestedValue(nextState, path);

      // Skip if values are the same
      if (oldValue === newValue) {
        continue;
      }

      // Check custom condition
      if (mapping.shouldEmit && !mapping.shouldEmit(oldValue, newValue, nextState)) {
        continue;
      }

      // Emit the event
      const hub = getCoordinationHub();
      const entityId = config.getEntityId?.(nextState) ?? '';
      const projectId = config.getProjectId?.(nextState) ?? '';

      const basePayload: Partial<EventPayload> = {
        entityId,
        entityType,
        projectId,
        source: storeName,
      };

      const customPayload = mapping.getPayload?.(oldValue, newValue, nextState) ?? {};

      log(`Emitting ${mapping.eventType} for ${path} change`, { old: oldValue, new: newValue });

      hub.emit(mapping.eventType, {
        ...basePayload,
        ...customPayload,
        changes: {
          [path]: { old: oldValue, new: newValue },
        },
      } as EventPayload, {
        debounceKey: mapping.debounceKey,
        debounceMs: mapping.debounceMs,
      });
    }
  }) as typeof set;

  // Create store with wrapped set
  const state = initializer(coordinatedSet, get, store);

  return state;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get nested value from object using dot notation path
 */
function getNestedValue(obj: object, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

// ============================================================================
// Pre-built Configurations
// ============================================================================

/**
 * Character store coordination config
 */
export function createCharacterCoordinationConfig<T extends {
  selectedCharacter: string | null;
  projectCharacters: unknown[];
  activeType: string;
  factionId: string | undefined;
}>(
  getProjectId: (state: T) => string
): CoordinationConfig<T> {
  return {
    storeName: 'character',
    entityType: 'character',
    getEntityId: (state) => state.selectedCharacter,
    getProjectId,
    eventMappings: [
      {
        path: 'selectedCharacter',
        eventType: 'CHARACTER_UPDATED',
        shouldEmit: (oldValue, newValue) => oldValue !== null && newValue !== null,
        debounceKey: 'character-selection',
        debounceMs: 100,
      },
      {
        path: 'projectCharacters',
        eventType: 'CHARACTER_UPDATED',
        shouldEmit: (oldValue, newValue) => {
          // Only emit if array length changed (character added/removed)
          const oldLen = Array.isArray(oldValue) ? oldValue.length : 0;
          const newLen = Array.isArray(newValue) ? newValue.length : 0;
          return oldLen !== newLen;
        },
      },
      {
        path: 'factionId',
        eventType: 'CHARACTER_FACTION_CHANGED',
        shouldEmit: (oldValue, newValue) => oldValue !== newValue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getPayload: (oldValue, newValue, _state) => ({
          // Return empty - the changes are added automatically by the middleware
        }),
      },
    ],
  };
}

/**
 * Project store coordination config
 */
export function createProjectCoordinationConfig<T extends {
  selectedProject: { id: string } | null;
  selectedScene: { id: string } | null;
  selectedAct: { id: string } | null;
}>(
  getProjectId: (state: T) => string
): CoordinationConfig<T> {
  return {
    storeName: 'project',
    entityType: 'project',
    getEntityId: (state) => state.selectedProject?.id ?? null,
    getProjectId,
    eventMappings: [
      {
        path: 'selectedProject',
        eventType: 'PROJECT_UPDATED',
        shouldEmit: (oldValue, newValue) => {
          const oldId = (oldValue as { id: string } | null)?.id;
          const newId = (newValue as { id: string } | null)?.id;
          return oldId !== newId;
        },
      },
      {
        path: 'selectedScene',
        eventType: 'SCENE_UPDATED',
        shouldEmit: (oldValue, newValue) => {
          const oldId = (oldValue as { id: string } | null)?.id;
          const newId = (newValue as { id: string } | null)?.id;
          return oldId !== newId;
        },
        getPayload: (_old, newValue) => ({
          entityId: (newValue as { id: string } | null)?.id ?? '',
          entityType: 'scene',
        }),
      },
      {
        path: 'selectedAct',
        eventType: 'ACT_UPDATED',
        shouldEmit: (oldValue, newValue) => {
          const oldId = (oldValue as { id: string } | null)?.id;
          const newId = (newValue as { id: string } | null)?.id;
          return oldId !== newId;
        },
        getPayload: (_old, newValue) => ({
          entityId: (newValue as { id: string } | null)?.id ?? '',
          entityType: 'act',
        }),
      },
    ],
  };
}

// ============================================================================
// Manual Event Emission Helpers
// ============================================================================

/**
 * Emit a character event manually
 */
export function emitCharacterEvent(
  eventType: CoordinationEventType,
  characterId: string,
  projectId: string,
  changes?: Record<string, { old?: unknown; new: unknown }>
): string {
  const hub = getCoordinationHub();
  return hub.emit(eventType, {
    entityId: characterId,
    entityType: 'character',
    projectId,
    source: 'manual',
    changes,
  } as EventPayload);
}

/**
 * Emit a scene event manually
 */
export function emitSceneEvent(
  eventType: CoordinationEventType,
  sceneId: string,
  projectId: string,
  actId?: string,
  changes?: Record<string, { old?: unknown; new: unknown }>
): string {
  const hub = getCoordinationHub();
  return hub.emit(eventType, {
    entityId: sceneId,
    entityType: 'scene',
    projectId,
    actId,
    source: 'manual',
    changes,
  } as EventPayload);
}

/**
 * Emit a faction event manually
 */
export function emitFactionEvent(
  eventType: CoordinationEventType,
  factionId: string,
  projectId: string,
  options?: {
    relatedCharacterId?: string;
    relatedFactionId?: string;
    changes?: Record<string, { old?: unknown; new: unknown }>;
  }
): string {
  const hub = getCoordinationHub();
  return hub.emit(eventType, {
    entityId: factionId,
    entityType: 'faction',
    projectId,
    source: 'manual',
    ...options,
  } as EventPayload);
}

/**
 * Emit a beat event manually
 */
export function emitBeatEvent(
  eventType: CoordinationEventType,
  beatId: string,
  projectId: string,
  options?: {
    actId?: string;
    relatedBeatId?: string;
    relatedSceneId?: string;
    changes?: Record<string, { old?: unknown; new: unknown }>;
  }
): string {
  const hub = getCoordinationHub();
  return hub.emit(eventType, {
    entityId: beatId,
    entityType: 'beat',
    projectId,
    source: 'manual',
    ...options,
  } as EventPayload);
}

/**
 * Emit an asset event manually
 */
export function emitAssetEvent(
  eventType: CoordinationEventType,
  assetId: string,
  projectId: string,
  options?: {
    linkedEntityId?: string;
    linkedEntityType?: EntityType;
    changes?: Record<string, { old?: unknown; new: unknown }>;
  }
): string {
  const hub = getCoordinationHub();
  return hub.emit(eventType, {
    entityId: assetId,
    entityType: 'asset',
    projectId,
    source: 'manual',
    ...options,
  } as EventPayload);
}

// ============================================================================
// Store Enhancement Utility
// ============================================================================

/**
 * Enhance an existing store with coordination capabilities
 *
 * This is an alternative to using the middleware directly,
 * useful for existing stores that can't be easily modified.
 */
export function enhanceStoreWithCoordination<T extends object>(
  store: StoreApi<T>,
  config: CoordinationConfig<T>
): () => void {
  const { eventMappings = [], debug = false } = config;

  const log = (message: string, ...args: unknown[]) => {
    if (debug) {
      console.log(`[Coordination:${config.storeName}] ${message}`, ...args);
    }
  };

  let prevState = store.getState();

  // Subscribe to store changes
  const unsubscribe = store.subscribe((state) => {
    for (const mapping of eventMappings) {
      const path = mapping.path as string;
      const oldValue = getNestedValue(prevState, path);
      const newValue = getNestedValue(state, path);

      if (oldValue === newValue) {
        continue;
      }

      if (mapping.shouldEmit && !mapping.shouldEmit(oldValue, newValue, state)) {
        continue;
      }

      const hub = getCoordinationHub();
      const entityId = config.getEntityId?.(state) ?? '';
      const projectId = config.getProjectId?.(state) ?? '';

      const basePayload: Partial<EventPayload> = {
        entityId,
        entityType: config.entityType,
        projectId,
        source: config.storeName,
      };

      const customPayload = mapping.getPayload?.(oldValue, newValue, state) ?? {};

      log(`Emitting ${mapping.eventType} for ${path} change`);

      hub.emit(mapping.eventType, {
        ...basePayload,
        ...customPayload,
        changes: {
          [path]: { old: oldValue, new: newValue },
        },
      } as EventPayload, {
        debounceKey: mapping.debounceKey,
        debounceMs: mapping.debounceMs,
      });
    }

    prevState = state;
  });

  return unsubscribe;
}

export default coordination;
