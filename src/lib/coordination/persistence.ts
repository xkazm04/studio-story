/**
 * Event Persistence for Undo/Redo Support
 *
 * Provides:
 * - Event history storage in IndexedDB for persistence across sessions
 * - Event replay for state reconstruction
 * - Snapshot management for efficient undo/redo
 * - Export/import for project backup
 */

import {
  CoordinationEvent,
  CoordinationEventType,
  EventPayload,
  EventHistoryEntry,
  Dependency,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const DB_NAME = 'story-coordination-db';
const DB_VERSION = 1;
const EVENTS_STORE = 'events';
const SNAPSHOTS_STORE = 'snapshots';
const DEPENDENCIES_STORE = 'dependencies';
const MAX_EVENTS_PER_PROJECT = 1000;

// ============================================================================
// Types
// ============================================================================

export interface Snapshot {
  id: string;
  projectId: string;
  timestamp: number;
  eventIndex: number; // Index of last event in this snapshot
  state: Record<string, unknown>;
  description?: string;
}

export interface PersistenceOptions {
  maxEventsPerProject?: number;
  autoSnapshot?: boolean;
  snapshotInterval?: number; // Events between auto-snapshots
}

// ============================================================================
// IndexedDB Helpers
// ============================================================================

let dbInstance: IDBDatabase | null = null;

async function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Events store
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const eventsStore = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
        eventsStore.createIndex('projectId', 'payload.projectId', { unique: false });
        eventsStore.createIndex('timestamp', 'metadata.createdAt', { unique: false });
        eventsStore.createIndex('type', 'type', { unique: false });
      }

      // Snapshots store
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        const snapshotsStore = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' });
        snapshotsStore.createIndex('projectId', 'projectId', { unique: false });
        snapshotsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Dependencies store
      if (!db.objectStoreNames.contains(DEPENDENCIES_STORE)) {
        const depsStore = db.createObjectStore(DEPENDENCIES_STORE, { keyPath: 'id' });
        depsStore.createIndex('projectId', 'sourceEntity.projectId', { unique: false });
      }
    };
  });
}

// ============================================================================
// Event Persistence Class
// ============================================================================

export class EventPersistence {
  private options: Required<PersistenceOptions>;
  private eventCount: Map<string, number> = new Map();

  constructor(options?: PersistenceOptions) {
    this.options = {
      maxEventsPerProject: options?.maxEventsPerProject ?? MAX_EVENTS_PER_PROJECT,
      autoSnapshot: options?.autoSnapshot ?? true,
      snapshotInterval: options?.snapshotInterval ?? 100,
    };
  }

  // ==========================================================================
  // Event Storage
  // ==========================================================================

  /**
   * Save an event to persistent storage
   */
  async saveEvent(event: CoordinationEvent): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(EVENTS_STORE, 'readwrite');
    const store = tx.objectStore(EVENTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.put(event);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Track event count for this project
        const projectId = event.payload.projectId;
        const count = (this.eventCount.get(projectId) ?? 0) + 1;
        this.eventCount.set(projectId, count);

        // Cleanup old events if needed
        if (count > this.options.maxEventsPerProject) {
          this.cleanupOldEvents(projectId);
        }

        resolve();
      };
    });
  }

  /**
   * Save multiple events in a batch
   */
  async saveEvents(events: CoordinationEvent[]): Promise<void> {
    if (events.length === 0) return;

    const db = await openDatabase();
    const tx = db.transaction(EVENTS_STORE, 'readwrite');
    const store = tx.objectStore(EVENTS_STORE);

    return new Promise((resolve, reject) => {
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      for (const event of events) {
        store.put(event);
      }
    });
  }

  /**
   * Get events for a project
   */
  async getProjectEvents(
    projectId: string,
    options?: {
      limit?: number;
      since?: number;
      types?: CoordinationEventType[];
    }
  ): Promise<CoordinationEvent[]> {
    const db = await openDatabase();
    const tx = db.transaction(EVENTS_STORE, 'readonly');
    const store = tx.objectStore(EVENTS_STORE);
    const index = store.index('projectId');

    return new Promise((resolve, reject) => {
      const events: CoordinationEvent[] = [];
      const request = index.openCursor(IDBKeyRange.only(projectId));

      request.onerror = () => reject(request.error);
      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const event = cursor.value as CoordinationEvent;

          // Apply filters
          if (options?.since && event.metadata.createdAt < options.since) {
            cursor.continue();
            return;
          }

          if (options?.types && !options.types.includes(event.type)) {
            cursor.continue();
            return;
          }

          events.push(event);

          if (options?.limit && events.length >= options.limit) {
            resolve(events);
            return;
          }

          cursor.continue();
        } else {
          resolve(events);
        }
      };
    });
  }

  /**
   * Get recent events across all projects
   */
  async getRecentEvents(limit: number = 50): Promise<CoordinationEvent[]> {
    const db = await openDatabase();
    const tx = db.transaction(EVENTS_STORE, 'readonly');
    const store = tx.objectStore(EVENTS_STORE);
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      const events: CoordinationEvent[] = [];
      const request = index.openCursor(null, 'prev'); // Descending order

      request.onerror = () => reject(request.error);
      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor && events.length < limit) {
          events.push(cursor.value);
          cursor.continue();
        } else {
          resolve(events);
        }
      };
    });
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(EVENTS_STORE, 'readwrite');
    const store = tx.objectStore(EVENTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(eventId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Cleanup old events for a project
   */
  private async cleanupOldEvents(projectId: string): Promise<void> {
    const events = await this.getProjectEvents(projectId);

    if (events.length <= this.options.maxEventsPerProject) return;

    // Sort by timestamp and remove oldest
    events.sort((a, b) => a.metadata.createdAt - b.metadata.createdAt);
    const toDelete = events.slice(0, events.length - this.options.maxEventsPerProject);

    const db = await openDatabase();
    const tx = db.transaction(EVENTS_STORE, 'readwrite');
    const store = tx.objectStore(EVENTS_STORE);

    for (const event of toDelete) {
      store.delete(event.id);
    }

    this.eventCount.set(projectId, this.options.maxEventsPerProject);
  }

  // ==========================================================================
  // Snapshot Management
  // ==========================================================================

  /**
   * Create a snapshot of current state
   */
  async createSnapshot(
    projectId: string,
    state: Record<string, unknown>,
    description?: string
  ): Promise<Snapshot> {
    const events = await this.getProjectEvents(projectId);
    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      projectId,
      timestamp: Date.now(),
      eventIndex: events.length - 1,
      state,
      description,
    };

    const db = await openDatabase();
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
    const store = tx.objectStore(SNAPSHOTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.put(snapshot);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(snapshot);
    });
  }

  /**
   * Get snapshots for a project
   */
  async getProjectSnapshots(projectId: string): Promise<Snapshot[]> {
    const db = await openDatabase();
    const tx = db.transaction(SNAPSHOTS_STORE, 'readonly');
    const store = tx.objectStore(SNAPSHOTS_STORE);
    const index = store.index('projectId');

    return new Promise((resolve, reject) => {
      const snapshots: Snapshot[] = [];
      const request = index.openCursor(IDBKeyRange.only(projectId));

      request.onerror = () => reject(request.error);
      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          snapshots.push(cursor.value);
          cursor.continue();
        } else {
          resolve(snapshots.sort((a, b) => b.timestamp - a.timestamp));
        }
      };
    });
  }

  /**
   * Get the latest snapshot for a project
   */
  async getLatestSnapshot(projectId: string): Promise<Snapshot | null> {
    const snapshots = await this.getProjectSnapshots(projectId);
    return snapshots[0] ?? null;
  }

  /**
   * Delete a snapshot
   */
  async deleteSnapshot(snapshotId: string): Promise<void> {
    const db = await openDatabase();
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
    const store = tx.objectStore(SNAPSHOTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.delete(snapshotId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // ==========================================================================
  // Dependency Persistence
  // ==========================================================================

  /**
   * Save dependencies to persistent storage
   */
  async saveDependencies(dependencies: Dependency[]): Promise<void> {
    if (dependencies.length === 0) return;

    const db = await openDatabase();
    const tx = db.transaction(DEPENDENCIES_STORE, 'readwrite');
    const store = tx.objectStore(DEPENDENCIES_STORE);

    return new Promise((resolve, reject) => {
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      for (const dep of dependencies) {
        store.put(dep);
      }
    });
  }

  /**
   * Get dependencies for a project
   */
  async getProjectDependencies(projectId: string): Promise<Dependency[]> {
    const db = await openDatabase();
    const tx = db.transaction(DEPENDENCIES_STORE, 'readonly');
    const store = tx.objectStore(DEPENDENCIES_STORE);
    const index = store.index('projectId');

    return new Promise((resolve, reject) => {
      const dependencies: Dependency[] = [];
      const request = index.openCursor(IDBKeyRange.only(projectId));

      request.onerror = () => reject(request.error);
      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          dependencies.push(cursor.value);
          cursor.continue();
        } else {
          resolve(dependencies);
        }
      };
    });
  }

  /**
   * Clear dependencies for a project
   */
  async clearProjectDependencies(projectId: string): Promise<void> {
    const deps = await this.getProjectDependencies(projectId);

    const db = await openDatabase();
    const tx = db.transaction(DEPENDENCIES_STORE, 'readwrite');
    const store = tx.objectStore(DEPENDENCIES_STORE);

    for (const dep of deps) {
      store.delete(dep.id);
    }
  }

  // ==========================================================================
  // Export/Import
  // ==========================================================================

  /**
   * Export project data for backup
   */
  async exportProjectData(projectId: string): Promise<{
    events: CoordinationEvent[];
    snapshots: Snapshot[];
    dependencies: Dependency[];
    exportedAt: number;
  }> {
    const [events, snapshots, dependencies] = await Promise.all([
      this.getProjectEvents(projectId),
      this.getProjectSnapshots(projectId),
      this.getProjectDependencies(projectId),
    ]);

    return {
      events,
      snapshots,
      dependencies,
      exportedAt: Date.now(),
    };
  }

  /**
   * Import project data from backup
   */
  async importProjectData(data: {
    events: CoordinationEvent[];
    snapshots: Snapshot[];
    dependencies: Dependency[];
  }): Promise<void> {
    // Save events
    if (data.events.length > 0) {
      await this.saveEvents(data.events);
    }

    // Save snapshots
    if (data.snapshots.length > 0) {
      const db = await openDatabase();
      const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
      const store = tx.objectStore(SNAPSHOTS_STORE);

      for (const snapshot of data.snapshots) {
        store.put(snapshot);
      }
    }

    // Save dependencies
    if (data.dependencies.length > 0) {
      await this.saveDependencies(data.dependencies);
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Clear all data for a project
   */
  async clearProjectData(projectId: string): Promise<void> {
    const events = await this.getProjectEvents(projectId);
    const snapshots = await this.getProjectSnapshots(projectId);

    const db = await openDatabase();

    // Delete events
    const eventsTx = db.transaction(EVENTS_STORE, 'readwrite');
    const eventsStore = eventsTx.objectStore(EVENTS_STORE);
    for (const event of events) {
      eventsStore.delete(event.id);
    }

    // Delete snapshots
    const snapshotsTx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
    const snapshotsStore = snapshotsTx.objectStore(SNAPSHOTS_STORE);
    for (const snapshot of snapshots) {
      snapshotsStore.delete(snapshot.id);
    }

    // Delete dependencies
    await this.clearProjectDependencies(projectId);

    this.eventCount.delete(projectId);
  }

  /**
   * Clear all data
   */
  async clearAllData(): Promise<void> {
    const db = await openDatabase();

    const tx1 = db.transaction(EVENTS_STORE, 'readwrite');
    tx1.objectStore(EVENTS_STORE).clear();

    const tx2 = db.transaction(SNAPSHOTS_STORE, 'readwrite');
    tx2.objectStore(SNAPSHOTS_STORE).clear();

    const tx3 = db.transaction(DEPENDENCIES_STORE, 'readwrite');
    tx3.objectStore(DEPENDENCIES_STORE).clear();

    this.eventCount.clear();
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalEvents: number;
    totalSnapshots: number;
    totalDependencies: number;
    eventsByProject: Record<string, number>;
  }> {
    const db = await openDatabase();

    const eventCount = await this.countStore(db, EVENTS_STORE);
    const snapshotCount = await this.countStore(db, SNAPSHOTS_STORE);
    const depCount = await this.countStore(db, DEPENDENCIES_STORE);

    return {
      totalEvents: eventCount,
      totalSnapshots: snapshotCount,
      totalDependencies: depCount,
      eventsByProject: Object.fromEntries(this.eventCount),
    };
  }

  private async countStore(db: IDBDatabase, storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let persistenceInstance: EventPersistence | null = null;

export function getEventPersistence(options?: PersistenceOptions): EventPersistence {
  if (!persistenceInstance) {
    persistenceInstance = new EventPersistence(options);
  }
  return persistenceInstance;
}

export function resetEventPersistence(): void {
  persistenceInstance = null;
}

export default EventPersistence;
