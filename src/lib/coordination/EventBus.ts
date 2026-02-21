/**
 * EventBus - Central pub/sub system for cross-feature coordination
 *
 * Provides type-safe event emission and subscription with:
 * - Priority-based event processing
 * - Debouncing for high-frequency changes
 * - Cycle detection to prevent infinite loops
 * - Event batching for related changes
 * - Debug logging support
 */

import { nanoid } from 'nanoid';
import {
  CoordinationEvent,
  CoordinationEventType,
  EventPayload,
  EventHandler,
  Subscription,
  EntityType,
  BaseEventPayload,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DEBOUNCE_MS = 100;
const MAX_PROCESSING_DEPTH = 10; // Prevent cascade loops
const MAX_EVENT_QUEUE_SIZE = 1000;
const DEFAULT_BATCH_WINDOW_MS = 50;

// ============================================================================
// Event Bus Class
// ============================================================================

export class EventBus {
  private subscriptions: Map<string, Subscription> = new Map();
  private eventQueue: CoordinationEvent[] = [];
  private isProcessing = false;
  private processingDepth = 0;
  private currentBatchId: string | null = null;
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private eventLog: CoordinationEvent[] = [];
  private maxLogSize = 100;
  private debugMode = false;
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private processedEventHashes: Set<string> = new Set();
  private hashExpirationMs = 5000;

  // Callbacks for external integrations
  private onEventProcessed?: (event: CoordinationEvent) => void;
  private onBatchComplete?: (batchId: string, events: CoordinationEvent[]) => void;

  constructor(options?: {
    debugMode?: boolean;
    maxLogSize?: number;
    onEventProcessed?: (event: CoordinationEvent) => void;
    onBatchComplete?: (batchId: string, events: CoordinationEvent[]) => void;
  }) {
    this.debugMode = options?.debugMode ?? false;
    this.maxLogSize = options?.maxLogSize ?? 100;
    this.onEventProcessed = options?.onEventProcessed;
    this.onBatchComplete = options?.onBatchComplete;
  }

  // ==========================================================================
  // Subscription Management
  // ==========================================================================

  /**
   * Subscribe to events with optional filtering
   */
  subscribe(
    eventTypes: CoordinationEventType | CoordinationEventType[],
    handler: EventHandler,
    options?: {
      entityTypes?: EntityType[];
      projectId?: string;
      priority?: number;
      label?: string;
    }
  ): string {
    const id = nanoid();
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

    const subscription: Subscription = {
      id,
      eventTypes: types,
      entityTypes: options?.entityTypes,
      projectId: options?.projectId,
      handler,
      priority: options?.priority ?? 50,
      label: options?.label ?? `subscription-${id}`,
    };

    this.subscriptions.set(id, subscription);
    this.log(`Subscription added: ${subscription.label} for ${types.join(', ')}`);

    return id;
  }

  /**
   * Subscribe to all events of a specific entity type
   */
  subscribeToEntityType(
    entityType: EntityType,
    handler: EventHandler,
    options?: {
      projectId?: string;
      priority?: number;
      label?: string;
    }
  ): string {
    const eventTypeMap: Record<EntityType, CoordinationEventType[]> = {
      character: [
        'CHARACTER_CREATED', 'CHARACTER_UPDATED', 'CHARACTER_DELETED',
        'CHARACTER_FACTION_CHANGED', 'CHARACTER_AVATAR_CHANGED',
        'CHARACTER_VOICE_CHANGED', 'CHARACTER_APPEARANCE_CHANGED',
      ],
      scene: [
        'SCENE_CREATED', 'SCENE_UPDATED', 'SCENE_DELETED',
        'SCENE_REORDERED', 'SCENE_CONTENT_CHANGED', 'SCENE_IMAGE_CHANGED',
      ],
      act: ['ACT_CREATED', 'ACT_UPDATED', 'ACT_DELETED', 'ACT_REORDERED'],
      beat: [
        'BEAT_CREATED', 'BEAT_UPDATED', 'BEAT_DELETED', 'BEAT_COMPLETED',
        'BEAT_DEPENDENCY_ADDED', 'BEAT_DEPENDENCY_REMOVED', 'BEAT_SCENE_MAPPING_CHANGED',
      ],
      faction: [
        'FACTION_CREATED', 'FACTION_UPDATED', 'FACTION_DELETED',
        'FACTION_MEMBER_ADDED', 'FACTION_MEMBER_REMOVED',
        'FACTION_LORE_CHANGED', 'FACTION_EVENT_ADDED', 'FACTION_RELATIONSHIP_CHANGED',
      ],
      asset: [
        'ASSET_UPLOADED', 'ASSET_UPDATED', 'ASSET_DELETED',
        'ASSET_TAGGED', 'ASSET_LINKED', 'ASSET_UNLINKED',
      ],
      relationship: [
        'RELATIONSHIP_CREATED', 'RELATIONSHIP_UPDATED', 'RELATIONSHIP_DELETED',
      ],
      project: [
        'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'PROJECT_STYLE_CHANGED',
      ],
    };

    return this.subscribe(eventTypeMap[entityType], handler, {
      ...options,
      entityTypes: [entityType],
      label: options?.label ?? `${entityType}-subscriber`,
    });
  }

  /**
   * Unsubscribe by subscription ID
   */
  unsubscribe(subscriptionId: string): boolean {
    const sub = this.subscriptions.get(subscriptionId);
    if (sub) {
      this.subscriptions.delete(subscriptionId);
      this.log(`Subscription removed: ${sub.label}`);
      return true;
    }
    return false;
  }

  /**
   * Clear all subscriptions
   */
  clearSubscriptions(): void {
    this.subscriptions.clear();
    this.log('All subscriptions cleared');
  }

  // ==========================================================================
  // Event Emission
  // ==========================================================================

  /**
   * Emit a single event
   */
  emit<T extends EventPayload>(
    type: CoordinationEventType,
    payload: Omit<T, keyof BaseEventPayload> & Partial<BaseEventPayload>,
    options?: {
      priority?: 'low' | 'normal' | 'high';
      debounceKey?: string;
      debounceMs?: number;
      batchId?: string;
    }
  ): string {
    const eventId = nanoid();
    const timestamp = Date.now();

    const fullPayload: EventPayload = {
      entityId: '',
      entityType: this.getEntityTypeFromEventType(type),
      projectId: '',
      timestamp,
      source: 'unknown',
      ...payload,
    } as EventPayload;

    const event: CoordinationEvent = {
      id: eventId,
      type,
      payload: fullPayload,
      metadata: {
        createdAt: timestamp,
        acknowledged: false,
        retryCount: 0,
        priority: options?.priority ?? 'normal',
        batchId: options?.batchId ?? this.currentBatchId ?? undefined,
      },
    };

    // Debounce if requested
    if (options?.debounceKey) {
      this.emitDebounced(event, options.debounceKey, options.debounceMs);
      return eventId;
    }

    // Check for duplicate events (cycle prevention)
    const eventHash = this.generateEventHash(event);
    if (this.processedEventHashes.has(eventHash)) {
      this.log(`Duplicate event detected and skipped: ${type}`);
      return eventId;
    }

    this.queueEvent(event);
    return eventId;
  }

  /**
   * Emit multiple events as a batch
   */
  emitBatch(
    events: Array<{
      type: CoordinationEventType;
      payload: Partial<EventPayload>;
      priority?: 'low' | 'normal' | 'high';
    }>
  ): string {
    const batchId = nanoid();
    this.currentBatchId = batchId;

    for (const { type, payload, priority } of events) {
      this.emit(type, payload, { priority, batchId });
    }

    this.currentBatchId = null;
    this.log(`Batch emitted: ${batchId} with ${events.length} events`);

    return batchId;
  }

  /**
   * Start a batch window for automatic grouping
   */
  startBatch(windowMs: number = DEFAULT_BATCH_WINDOW_MS): string {
    const batchId = nanoid();
    this.currentBatchId = batchId;

    // Auto-close batch after window
    this.batchTimeout = setTimeout(() => {
      this.endBatch();
    }, windowMs);

    return batchId;
  }

  /**
   * End the current batch window
   */
  endBatch(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    const batchId = this.currentBatchId;
    this.currentBatchId = null;

    if (batchId) {
      const batchEvents = this.eventLog.filter(e => e.metadata.batchId === batchId);
      this.onBatchComplete?.(batchId, batchEvents);
    }
  }

  // ==========================================================================
  // Event Processing
  // ==========================================================================

  private queueEvent(event: CoordinationEvent): void {
    // Prevent queue overflow
    if (this.eventQueue.length >= MAX_EVENT_QUEUE_SIZE) {
      console.warn('[EventBus] Event queue overflow, dropping oldest events');
      this.eventQueue = this.eventQueue.slice(-MAX_EVENT_QUEUE_SIZE / 2);
    }

    this.eventQueue.push(event);
    this.addToLog(event);

    // Process immediately if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    // Check processing depth for cascade prevention
    if (this.processingDepth >= MAX_PROCESSING_DEPTH) {
      console.error('[EventBus] Max processing depth reached, possible cascade loop detected');
      this.eventQueue = [];
      this.processingDepth = 0;
      return;
    }

    this.isProcessing = true;
    this.processingDepth++;

    try {
      while (this.eventQueue.length > 0) {
        // Sort by priority (high first) then by creation time
        this.eventQueue.sort((a, b) => {
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          const priorityDiff =
            priorityOrder[a.metadata.priority] - priorityOrder[b.metadata.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.metadata.createdAt - b.metadata.createdAt;
        });

        const event = this.eventQueue.shift()!;
        await this.processEvent(event);

        // Track processed event hash temporarily
        const hash = this.generateEventHash(event);
        this.processedEventHashes.add(hash);
        setTimeout(() => this.processedEventHashes.delete(hash), this.hashExpirationMs);
      }
    } finally {
      this.isProcessing = false;
      this.processingDepth--;
    }
  }

  private async processEvent(event: CoordinationEvent): Promise<void> {
    const matchingSubscriptions = this.getMatchingSubscriptions(event);

    // Sort subscriptions by priority (higher number = higher priority)
    matchingSubscriptions.sort((a, b) => b.priority - a.priority);

    this.log(`Processing event: ${event.type} with ${matchingSubscriptions.length} subscribers`);

    for (const subscription of matchingSubscriptions) {
      try {
        await subscription.handler(event);
      } catch (error) {
        console.error(
          `[EventBus] Error in subscription ${subscription.label}:`,
          error
        );
        // Don't throw - continue processing other subscriptions
      }
    }

    event.metadata.processedAt = Date.now();
    event.metadata.acknowledged = true;
    this.onEventProcessed?.(event);
  }

  private getMatchingSubscriptions(event: CoordinationEvent): Subscription[] {
    const matches: Subscription[] = [];

    for (const subscription of this.subscriptions.values()) {
      // Check event type match
      if (!subscription.eventTypes.includes(event.type)) {
        continue;
      }

      // Check entity type filter
      if (
        subscription.entityTypes &&
        !subscription.entityTypes.includes(event.payload.entityType)
      ) {
        continue;
      }

      // Check project filter
      if (
        subscription.projectId &&
        subscription.projectId !== event.payload.projectId
      ) {
        continue;
      }

      matches.push(subscription);
    }

    return matches;
  }

  // ==========================================================================
  // Debouncing
  // ==========================================================================

  private emitDebounced(
    event: CoordinationEvent,
    key: string,
    delayMs: number = DEFAULT_DEBOUNCE_MS
  ): void {
    // Cancel existing debounce for this key
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.queueEvent(event);
    }, delayMs);

    this.debounceTimers.set(key, timer);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private getEntityTypeFromEventType(eventType: CoordinationEventType): EntityType {
    if (eventType.startsWith('CHARACTER_')) return 'character';
    if (eventType.startsWith('SCENE_')) return 'scene';
    if (eventType.startsWith('ACT_')) return 'act';
    if (eventType.startsWith('BEAT_')) return 'beat';
    if (eventType.startsWith('FACTION_')) return 'faction';
    if (eventType.startsWith('ASSET_')) return 'asset';
    if (eventType.startsWith('RELATIONSHIP_')) return 'relationship';
    if (eventType.startsWith('PROJECT_')) return 'project';
    return 'project'; // Default fallback
  }

  private generateEventHash(event: CoordinationEvent): string {
    // Create a hash based on type, entity, and changes
    return `${event.type}-${event.payload.entityId}-${event.payload.projectId}-${JSON.stringify(event.payload)}`;
  }

  private addToLog(event: CoordinationEvent): void {
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }
  }

  private log(message: string): void {
    if (this.debugMode) {
      console.log(`[EventBus] ${message}`);
    }
  }

  // ==========================================================================
  // Public Utilities
  // ==========================================================================

  /**
   * Get the event log for debugging
   */
  getEventLog(): CoordinationEvent[] {
    return [...this.eventLog];
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Check if there are pending events
   */
  hasPendingEvents(): boolean {
    return this.eventQueue.length > 0;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.eventQueue.length;
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Clear the event log
   */
  clearEventLog(): void {
    this.eventLog = [];
  }

  /**
   * Wait for all pending events to be processed
   */
  async flush(): Promise<void> {
    while (this.eventQueue.length > 0 || this.isProcessing) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Destroy the event bus and clean up
   */
  destroy(): void {
    this.clearSubscriptions();
    this.eventQueue = [];
    this.eventLog = [];
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let eventBusInstance: EventBus | null = null;

export function getEventBus(options?: ConstructorParameters<typeof EventBus>[0]): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus(options);
  }
  return eventBusInstance;
}

export function resetEventBus(): void {
  if (eventBusInstance) {
    eventBusInstance.destroy();
    eventBusInstance = null;
  }
}

export default EventBus;
