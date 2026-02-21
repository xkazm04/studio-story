/**
 * CoordinationHub - Central orchestrator for cross-feature state coordination
 *
 * Combines EventBus and DependencyGraph to provide:
 * - Automatic event propagation based on dependencies
 * - Impact analysis before changes
 * - Undo/redo support through event history
 * - TanStack Query cache invalidation
 * - Debug tooling and activity logging
 */

import { nanoid } from 'nanoid';
import { EventBus, getEventBus, resetEventBus } from './EventBus';
import { DependencyGraph, getDependencyGraph, resetDependencyGraph, IMPACT_PROPAGATION } from './DependencyGraph';
import {
  CoordinationEvent,
  CoordinationEventType,
  EventPayload,
  EntityReference,
  EntityType,
  ImpactAnalysis,
  EventHistoryEntry,
  UndoContext,
  Dependency,
  CharacterPayload,
  ScenePayload,
  FactionPayload,
  BeatPayload,
} from './types';

// ============================================================================
// Types
// ============================================================================

export interface CoordinationHubOptions {
  debugMode?: boolean;
  maxUndoHistory?: number;
  enablePersistence?: boolean;
  storageKey?: string;
  onCacheInvalidation?: (queryKeys: string[][]) => void;
}

export interface PendingChange {
  id: string;
  entity: EntityReference;
  eventType: CoordinationEventType;
  payload: Partial<EventPayload>;
  impact: ImpactAnalysis;
  createdAt: number;
}

// ============================================================================
// Query Key Mappings
// ============================================================================

/**
 * Maps event types to TanStack Query keys that should be invalidated
 */
const QUERY_KEY_MAPPINGS: Record<
  CoordinationEventType,
  (payload: EventPayload) => string[][]
> = {
  // Character events
  CHARACTER_CREATED: (p) => [
    ['characters', 'project', p.projectId],
    ['characters', 'list'],
  ],
  CHARACTER_UPDATED: (p) => [
    ['characters', p.entityId],
    ['characters', 'project', p.projectId],
    ['characters', 'list'],
  ],
  CHARACTER_DELETED: (p) => [
    ['characters', p.entityId],
    ['characters', 'project', p.projectId],
    ['characters', 'list'],
  ],
  CHARACTER_FACTION_CHANGED: (p) => {
    const cp = p as CharacterPayload;
    const keys: string[][] = [
      ['characters', p.entityId],
      ['characters', 'project', p.projectId],
    ];
    if (cp.changes?.factionId?.old) {
      keys.push(['factions', cp.changes.factionId.old, 'summary']);
      keys.push(['characters', 'faction', cp.changes.factionId.old]);
    }
    if (cp.changes?.factionId?.new) {
      keys.push(['factions', cp.changes.factionId.new, 'summary']);
      keys.push(['characters', 'faction', cp.changes.factionId.new]);
    }
    return keys;
  },
  CHARACTER_AVATAR_CHANGED: (p) => [
    ['characters', p.entityId],
    ['avatars', p.entityId],
  ],
  CHARACTER_VOICE_CHANGED: (p) => [
    ['characters', p.entityId],
    ['voices', p.entityId],
  ],
  CHARACTER_APPEARANCE_CHANGED: (p) => [
    ['characters', p.entityId],
    ['appearances', p.entityId],
  ],

  // Scene events
  SCENE_CREATED: (p) => {
    const sp = p as ScenePayload;
    return [
      ['scenes', 'project', p.projectId],
      ['scenes', 'act', sp.actId ?? ''],
      ['scenes', 'list'],
    ];
  },
  SCENE_UPDATED: (p) => {
    const sp = p as ScenePayload;
    return [
      ['scenes', p.entityId],
      ['scenes', 'project', p.projectId],
      ['scenes', 'act', sp.actId ?? ''],
    ];
  },
  SCENE_DELETED: (p) => {
    const sp = p as ScenePayload;
    return [
      ['scenes', p.entityId],
      ['scenes', 'project', p.projectId],
      ['scenes', 'act', sp.actId ?? ''],
      ['beat-scene-mappings', 'scene', p.entityId],
    ];
  },
  SCENE_REORDERED: (p) => {
    const sp = p as ScenePayload;
    return [
      ['scenes', 'project', p.projectId],
      ['scenes', 'act', sp.actId ?? ''],
    ];
  },
  SCENE_CONTENT_CHANGED: (p) => [
    ['scenes', p.entityId],
  ],
  SCENE_IMAGE_CHANGED: (p) => [
    ['scenes', p.entityId],
    ['scene-images', p.entityId],
  ],

  // Act events
  ACT_CREATED: (p) => [
    ['acts', 'project', p.projectId],
    ['acts', 'list'],
  ],
  ACT_UPDATED: (p) => [
    ['acts', p.entityId],
    ['acts', 'project', p.projectId],
  ],
  ACT_DELETED: (p) => [
    ['acts', p.entityId],
    ['acts', 'project', p.projectId],
    ['scenes', 'act', p.entityId],
    ['beats', 'act', p.entityId],
  ],
  ACT_REORDERED: (p) => [
    ['acts', 'project', p.projectId],
  ],

  // Beat events
  BEAT_CREATED: (p) => {
    const bp = p as BeatPayload;
    return [
      ['beats', 'project', p.projectId],
      ['beats', 'act', bp.actId ?? ''],
      ['beats', 'list'],
    ];
  },
  BEAT_UPDATED: (p) => {
    const bp = p as BeatPayload;
    return [
      ['beats', p.entityId],
      ['beats', 'project', p.projectId],
      ['beats', 'act', bp.actId ?? ''],
    ];
  },
  BEAT_DELETED: (p) => {
    const bp = p as BeatPayload;
    return [
      ['beats', p.entityId],
      ['beats', 'project', p.projectId],
      ['beats', 'act', bp.actId ?? ''],
      ['beat-dependencies', p.entityId],
      ['beat-scene-mappings', 'beat', p.entityId],
    ];
  },
  BEAT_COMPLETED: (p) => [
    ['beats', p.entityId],
    ['beats', 'project', p.projectId],
    ['beat-pacing', p.projectId],
  ],
  BEAT_DEPENDENCY_ADDED: (p) => {
    const bp = p as BeatPayload;
    return [
      ['beat-dependencies', p.entityId],
      ['beat-dependencies', bp.relatedBeatId ?? ''],
      ['beat-dependencies', 'project', p.projectId],
    ];
  },
  BEAT_DEPENDENCY_REMOVED: (p) => {
    const bp = p as BeatPayload;
    return [
      ['beat-dependencies', p.entityId],
      ['beat-dependencies', bp.relatedBeatId ?? ''],
      ['beat-dependencies', 'project', p.projectId],
    ];
  },
  BEAT_SCENE_MAPPING_CHANGED: (p) => {
    const bp = p as BeatPayload;
    return [
      ['beat-scene-mappings', 'beat', p.entityId],
      ['beat-scene-mappings', 'scene', bp.relatedSceneId ?? ''],
      ['beat-scene-mappings', 'project', p.projectId],
    ];
  },

  // Faction events
  FACTION_CREATED: (p) => [
    ['factions', 'project', p.projectId],
    ['factions', 'list'],
  ],
  FACTION_UPDATED: (p) => [
    ['factions', p.entityId],
    ['factions', p.entityId, 'summary'],
    ['factions', 'project', p.projectId],
  ],
  FACTION_DELETED: (p) => [
    ['factions', p.entityId],
    ['factions', p.entityId, 'summary'],
    ['factions', 'project', p.projectId],
    ['characters', 'faction', p.entityId],
    ['faction-relationships', p.entityId],
  ],
  FACTION_MEMBER_ADDED: (p) => {
    const fp = p as FactionPayload;
    return [
      ['factions', p.entityId, 'summary'],
      ['characters', 'faction', p.entityId],
      ['characters', fp.relatedCharacterId ?? ''],
    ];
  },
  FACTION_MEMBER_REMOVED: (p) => {
    const fp = p as FactionPayload;
    return [
      ['factions', p.entityId, 'summary'],
      ['characters', 'faction', p.entityId],
      ['characters', fp.relatedCharacterId ?? ''],
    ];
  },
  FACTION_LORE_CHANGED: (p) => [
    ['factions', p.entityId, 'summary'],
    ['faction-lore', p.entityId],
  ],
  FACTION_EVENT_ADDED: (p) => [
    ['factions', p.entityId, 'summary'],
    ['faction-events', p.entityId],
  ],
  FACTION_RELATIONSHIP_CHANGED: (p) => {
    const fp = p as FactionPayload;
    return [
      ['faction-relationships', p.entityId],
      ['faction-relationships', fp.relatedFactionId ?? ''],
    ];
  },

  // Asset events
  ASSET_UPLOADED: (p) => [
    ['assets', 'list'],
    ['assets', 'project', p.projectId],
  ],
  ASSET_UPDATED: (p) => [
    ['assets', p.entityId],
    ['assets', 'project', p.projectId],
  ],
  ASSET_DELETED: (p) => [
    ['assets', p.entityId],
    ['assets', 'project', p.projectId],
    ['assets', 'list'],
  ],
  ASSET_TAGGED: (p) => [
    ['assets', p.entityId],
    ['assets', 'search'],
  ],
  ASSET_LINKED: (p) => [
    ['assets', p.entityId],
    ['asset-links', p.entityId],
  ],
  ASSET_UNLINKED: (p) => [
    ['assets', p.entityId],
    ['asset-links', p.entityId],
  ],

  // Relationship events
  RELATIONSHIP_CREATED: (p) => [
    ['relationships', 'project', p.projectId],
    ['character-relationships'],
  ],
  RELATIONSHIP_UPDATED: (p) => [
    ['relationships', p.entityId],
    ['character-relationships'],
  ],
  RELATIONSHIP_DELETED: (p) => [
    ['relationships', p.entityId],
    ['relationships', 'project', p.projectId],
    ['character-relationships'],
  ],

  // Project events
  PROJECT_CREATED: () => [
    ['projects', 'list'],
  ],
  PROJECT_UPDATED: (p) => [
    ['projects', p.entityId],
    ['projects', 'list'],
  ],
  PROJECT_DELETED: (p) => [
    ['projects', p.entityId],
    ['projects', 'list'],
    ['characters', 'project', p.entityId],
    ['scenes', 'project', p.entityId],
    ['factions', 'project', p.entityId],
    ['beats', 'project', p.entityId],
    ['acts', 'project', p.entityId],
  ],
  PROJECT_STYLE_CHANGED: (p) => [
    ['projects', p.entityId],
    ['project-style', p.entityId],
  ],
};

// ============================================================================
// Coordination Hub Class
// ============================================================================

export class CoordinationHub {
  private eventBus: EventBus;
  private dependencyGraph: DependencyGraph;
  private undoContext: UndoContext;
  private maxUndoHistory: number;
  private pendingChanges: Map<string, PendingChange> = new Map();
  private debugMode: boolean;
  private enablePersistence: boolean;
  private storageKey: string;
  private onCacheInvalidation?: (queryKeys: string[][]) => void;
  private activityLog: Array<{
    timestamp: number;
    type: string;
    description: string;
    entityId?: string;
    entityType?: EntityType;
  }> = [];
  private maxActivityLogSize = 200;

  constructor(options?: CoordinationHubOptions) {
    this.debugMode = options?.debugMode ?? false;
    this.maxUndoHistory = options?.maxUndoHistory ?? 50;
    this.enablePersistence = options?.enablePersistence ?? false;
    this.storageKey = options?.storageKey ?? 'coordination-hub-state';
    this.onCacheInvalidation = options?.onCacheInvalidation;

    this.eventBus = getEventBus({
      debugMode: this.debugMode,
      onEventProcessed: (event) => this.handleEventProcessed(event),
    });

    this.dependencyGraph = getDependencyGraph({
      debugMode: this.debugMode,
    });

    this.undoContext = {
      canUndo: false,
      canRedo: false,
      undoStack: [],
      redoStack: [],
    };

    // Load persisted state if enabled
    if (this.enablePersistence) {
      this.loadState();
    }

    // Subscribe to all events for cache invalidation
    this.setupCacheInvalidation();

    this.log('CoordinationHub initialized');
  }

  // ==========================================================================
  // Event Emission with Impact Analysis
  // ==========================================================================

  /**
   * Emit an event with automatic dependency tracking and cache invalidation
   */
  emit(
    type: CoordinationEventType,
    payload: Partial<EventPayload>,
    options?: {
      skipImpactAnalysis?: boolean;
      debounceKey?: string;
      debounceMs?: number;
      undoable?: boolean;
      undoData?: unknown;
    }
  ): string {
    const eventId = this.eventBus.emit(type, payload, {
      debounceKey: options?.debounceKey,
      debounceMs: options?.debounceMs,
    });

    // Add to undo stack if undoable
    if (options?.undoable !== false) {
      const event: CoordinationEvent = {
        id: eventId,
        type,
        payload: {
          ...payload,
          timestamp: Date.now(),
        } as EventPayload,
        metadata: {
          createdAt: Date.now(),
          acknowledged: false,
          retryCount: 0,
          priority: 'normal',
        },
      };

      this.addToUndoStack({
        event,
        undoData: options?.undoData,
      });
    }

    // Log activity
    this.logActivity('event_emitted', `${type} emitted`, payload.entityId, payload.entityType as EntityType);

    return eventId;
  }

  /**
   * Preview impact before making a change
   */
  previewImpact(
    entity: EntityReference,
    eventType: CoordinationEventType
  ): ImpactAnalysis {
    return this.dependencyGraph.analyzeImpact(entity, eventType);
  }

  /**
   * Stage a change for later execution (for bulk operations with preview)
   */
  stageChange(
    entity: EntityReference,
    eventType: CoordinationEventType,
    payload: Partial<EventPayload>
  ): string {
    const id = nanoid();
    const impact = this.previewImpact(entity, eventType);

    const pendingChange: PendingChange = {
      id,
      entity,
      eventType,
      payload,
      impact,
      createdAt: Date.now(),
    };

    this.pendingChanges.set(id, pendingChange);
    return id;
  }

  /**
   * Execute a staged change
   */
  executeChange(changeId: string): boolean {
    const change = this.pendingChanges.get(changeId);
    if (!change) return false;

    this.emit(change.eventType, change.payload as EventPayload);
    this.pendingChanges.delete(changeId);
    return true;
  }

  /**
   * Execute all staged changes
   */
  executeAllChanges(): number {
    const count = this.pendingChanges.size;
    const batchId = this.eventBus.startBatch(100);

    for (const change of this.pendingChanges.values()) {
      this.emit(change.eventType, change.payload as EventPayload);
    }

    this.eventBus.endBatch();
    this.pendingChanges.clear();

    return count;
  }

  /**
   * Cancel a staged change
   */
  cancelChange(changeId: string): boolean {
    return this.pendingChanges.delete(changeId);
  }

  /**
   * Get all pending changes
   */
  getPendingChanges(): PendingChange[] {
    return Array.from(this.pendingChanges.values());
  }

  // ==========================================================================
  // Subscription Management
  // ==========================================================================

  /**
   * Subscribe to events
   */
  subscribe(
    eventTypes: CoordinationEventType | CoordinationEventType[],
    handler: (event: CoordinationEvent) => void | Promise<void>,
    options?: {
      entityTypes?: EntityType[];
      projectId?: string;
      priority?: number;
      label?: string;
    }
  ): string {
    return this.eventBus.subscribe(eventTypes, handler, options);
  }

  /**
   * Subscribe to all events of a specific entity type
   */
  subscribeToEntity(
    entityType: EntityType,
    handler: (event: CoordinationEvent) => void | Promise<void>,
    options?: {
      projectId?: string;
      label?: string;
    }
  ): string {
    return this.eventBus.subscribeToEntityType(entityType, handler, options);
  }

  /**
   * Unsubscribe
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.eventBus.unsubscribe(subscriptionId);
  }

  // ==========================================================================
  // Dependency Management
  // ==========================================================================

  /**
   * Register a dependency between entities
   */
  registerDependency(
    sourceEntity: EntityReference,
    targetEntity: EntityReference,
    type: 'references' | 'contains' | 'belongs_to' | 'affects' | 'requires' | 'related_to',
    options?: {
      strength?: 'weak' | 'normal' | 'strong';
      description?: string;
    }
  ): string {
    return this.dependencyGraph.addDependency(sourceEntity, targetEntity, type, options);
  }

  /**
   * Remove a dependency
   */
  removeDependency(dependencyId: string): boolean {
    return this.dependencyGraph.removeDependency(dependencyId);
  }

  /**
   * Register all standard dependencies for an entity
   */
  registerEntityDependencies(
    entity: EntityReference,
    relatedEntities: {
      projectId?: string;
      factionId?: string;
      actId?: string;
      sceneIds?: string[];
      characterIds?: string[];
      beatIds?: string[];
    }
  ): void {
    this.dependencyGraph.registerEntityDependencies(entity, relatedEntities);
  }

  /**
   * Remove all dependencies for an entity
   */
  removeEntityDependencies(entity: EntityReference): number {
    return this.dependencyGraph.removeEntityDependencies(entity);
  }

  /**
   * Get all dependencies for an entity
   */
  getDependencies(entity: EntityReference): Dependency[] {
    return this.dependencyGraph.getDependencies(entity);
  }

  /**
   * Get entities that depend on this entity
   */
  getDependents(entity: EntityReference): Dependency[] {
    return this.dependencyGraph.getDependents(entity);
  }

  // ==========================================================================
  // Undo/Redo Support
  // ==========================================================================

  /**
   * Undo the last action
   */
  undo(): boolean {
    if (!this.undoContext.canUndo || this.undoContext.undoStack.length === 0) {
      return false;
    }

    const entry = this.undoContext.undoStack.pop()!;
    this.undoContext.redoStack.push(entry);
    this.updateUndoState();

    // Emit reverse event based on the original event
    const reverseEvent = this.createReverseEvent(entry);
    if (reverseEvent) {
      this.eventBus.emit(reverseEvent.type, reverseEvent.payload);
      this.logActivity('undo', `Undid ${entry.event.type}`, entry.event.payload.entityId, entry.event.payload.entityType);
    }

    return true;
  }

  /**
   * Redo the last undone action
   */
  redo(): boolean {
    if (!this.undoContext.canRedo || this.undoContext.redoStack.length === 0) {
      return false;
    }

    const entry = this.undoContext.redoStack.pop()!;
    this.undoContext.undoStack.push(entry);
    this.updateUndoState();

    // Re-emit the original event
    this.eventBus.emit(entry.event.type, entry.event.payload);
    this.logActivity('redo', `Redid ${entry.event.type}`, entry.event.payload.entityId, entry.event.payload.entityType);

    return true;
  }

  /**
   * Get undo context
   */
  getUndoContext(): UndoContext {
    return { ...this.undoContext };
  }

  private addToUndoStack(entry: EventHistoryEntry): void {
    this.undoContext.undoStack.push(entry);

    // Limit stack size
    if (this.undoContext.undoStack.length > this.maxUndoHistory) {
      this.undoContext.undoStack = this.undoContext.undoStack.slice(-this.maxUndoHistory);
    }

    // Clear redo stack on new action
    this.undoContext.redoStack = [];
    this.updateUndoState();
  }

  private updateUndoState(): void {
    this.undoContext.canUndo = this.undoContext.undoStack.length > 0;
    this.undoContext.canRedo = this.undoContext.redoStack.length > 0;
    this.undoContext.lastUndoTimestamp = Date.now();

    if (this.enablePersistence) {
      this.saveState();
    }
  }

  private createReverseEvent(
    entry: EventHistoryEntry
  ): { type: CoordinationEventType; payload: EventPayload } | null {
    const { event, undoData } = entry;

    // Map event types to their reverse actions
    const reverseMap: Partial<Record<CoordinationEventType, CoordinationEventType>> = {
      CHARACTER_CREATED: 'CHARACTER_DELETED',
      CHARACTER_DELETED: 'CHARACTER_CREATED',
      SCENE_CREATED: 'SCENE_DELETED',
      SCENE_DELETED: 'SCENE_CREATED',
      BEAT_CREATED: 'BEAT_DELETED',
      BEAT_DELETED: 'BEAT_CREATED',
      FACTION_CREATED: 'FACTION_DELETED',
      FACTION_DELETED: 'FACTION_CREATED',
      ASSET_UPLOADED: 'ASSET_DELETED',
      ASSET_DELETED: 'ASSET_UPLOADED',
    };

    const reverseType = reverseMap[event.type];
    if (reverseType) {
      return {
        type: reverseType,
        payload: undoData ? { ...event.payload, ...(undoData as object) } : event.payload,
      };
    }

    // For update events, use the undo data to restore previous state
    if (event.type.includes('UPDATED') || event.type.includes('CHANGED')) {
      if (undoData) {
        return {
          type: event.type,
          payload: { ...event.payload, ...(undoData as object) },
        };
      }
    }

    return null;
  }

  // ==========================================================================
  // Cache Invalidation
  // ==========================================================================

  private setupCacheInvalidation(): void {
    // Subscribe to all events and invalidate relevant query keys
    const allEventTypes: CoordinationEventType[] = Object.keys(QUERY_KEY_MAPPINGS) as CoordinationEventType[];

    this.eventBus.subscribe(allEventTypes, (event) => {
      const getKeys = QUERY_KEY_MAPPINGS[event.type];
      if (getKeys) {
        const keys = getKeys(event.payload);
        this.onCacheInvalidation?.(keys);
        this.log(`Cache invalidation triggered for ${keys.length} query keys`);
      }
    }, {
      priority: 100, // High priority to run before other handlers
      label: 'cache-invalidation',
    });
  }

  /**
   * Get query keys that would be invalidated by an event
   */
  getAffectedQueryKeys(
    eventType: CoordinationEventType,
    payload: EventPayload
  ): string[][] {
    const getKeys = QUERY_KEY_MAPPINGS[eventType];
    return getKeys ? getKeys(payload) : [];
  }

  // ==========================================================================
  // Event Processing Callback
  // ==========================================================================

  private handleEventProcessed(event: CoordinationEvent): void {
    this.log(`Event processed: ${event.type}`);

    // Persist state if enabled
    if (this.enablePersistence) {
      this.saveState();
    }
  }

  // ==========================================================================
  // Activity Logging
  // ==========================================================================

  private logActivity(
    type: string,
    description: string,
    entityId?: string,
    entityType?: EntityType
  ): void {
    this.activityLog.push({
      timestamp: Date.now(),
      type,
      description,
      entityId,
      entityType,
    });

    // Limit log size
    if (this.activityLog.length > this.maxActivityLogSize) {
      this.activityLog = this.activityLog.slice(-this.maxActivityLogSize);
    }
  }

  /**
   * Get activity log
   */
  getActivityLog(): typeof this.activityLog {
    return [...this.activityLog];
  }

  /**
   * Get recent activity (last N items)
   */
  getRecentActivity(count: number = 10): typeof this.activityLog {
    return this.activityLog.slice(-count);
  }

  // ==========================================================================
  // Persistence
  // ==========================================================================

  private saveState(): void {
    if (typeof window === 'undefined') return;

    try {
      const state = {
        undoContext: {
          ...this.undoContext,
          undoStack: this.undoContext.undoStack.slice(-20), // Only save recent
          redoStack: this.undoContext.redoStack.slice(-20),
        },
        dependencies: this.dependencyGraph.getAllDependencies(),
        activityLog: this.activityLog.slice(-50),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('[CoordinationHub] Failed to save state:', error);
    }
  }

  private loadState(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state = JSON.parse(saved);

        if (state.undoContext) {
          this.undoContext = {
            ...this.undoContext,
            ...state.undoContext,
          };
        }

        if (state.dependencies) {
          this.dependencyGraph.loadDependencies(state.dependencies);
        }

        if (state.activityLog) {
          this.activityLog = state.activityLog;
        }

        this.log('State loaded from storage');
      }
    } catch (error) {
      console.warn('[CoordinationHub] Failed to load state:', error);
    }
  }

  /**
   * Clear persisted state
   */
  clearPersistedState(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  // ==========================================================================
  // Visualization Support
  // ==========================================================================

  /**
   * Export dependency graph for visualization
   */
  exportDependencyGraph(): ReturnType<DependencyGraph['exportForVisualization']> {
    return this.dependencyGraph.exportForVisualization();
  }

  /**
   * Get subgraph for a specific entity
   */
  getEntitySubgraph(
    entity: EntityReference,
    maxDepth?: number
  ): ReturnType<DependencyGraph['getSubgraph']> {
    return this.dependencyGraph.getSubgraph(entity, maxDepth);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private log(message: string): void {
    if (this.debugMode) {
      console.log(`[CoordinationHub] ${message}`);
    }
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.eventBus.setDebugMode(enabled);
    this.dependencyGraph.setDebugMode(enabled);
  }

  /**
   * Get event log
   */
  getEventLog(): CoordinationEvent[] {
    return this.eventBus.getEventLog();
  }

  /**
   * Wait for all pending events to be processed
   */
  async flush(): Promise<void> {
    await this.eventBus.flush();
  }

  /**
   * Reset the hub (clear all state)
   */
  reset(): void {
    resetEventBus();
    resetDependencyGraph();
    this.undoContext = {
      canUndo: false,
      canRedo: false,
      undoStack: [],
      redoStack: [],
    };
    this.pendingChanges.clear();
    this.activityLog = [];
    this.clearPersistedState();

    // Reinitialize
    this.eventBus = getEventBus({ debugMode: this.debugMode });
    this.dependencyGraph = getDependencyGraph({ debugMode: this.debugMode });
    this.setupCacheInvalidation();

    this.log('Hub reset');
  }

  /**
   * Destroy the hub
   */
  destroy(): void {
    this.eventBus.destroy();
    this.dependencyGraph.clear();
    this.pendingChanges.clear();
    this.activityLog = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let hubInstance: CoordinationHub | null = null;

export function getCoordinationHub(options?: CoordinationHubOptions): CoordinationHub {
  if (!hubInstance) {
    hubInstance = new CoordinationHub(options);
  }
  return hubInstance;
}

export function resetCoordinationHub(): void {
  if (hubInstance) {
    hubInstance.destroy();
    hubInstance = null;
  }
  resetEventBus();
  resetDependencyGraph();
}

export default CoordinationHub;
