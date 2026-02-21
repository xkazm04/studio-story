/**
 * Cross-Feature State Coordination Hub
 *
 * Event-driven architecture for automatic propagation of changes
 * across characters, scenes, factions, and assets with dependency tracking.
 *
 * @example
 * // Basic usage
 * import { getCoordinationHub, useCoordination } from '@/lib/coordination';
 *
 * // In a component
 * const { emit, subscribe, previewImpact, undo, redo } = useCoordination({
 *   projectId: 'project-123',
 * });
 *
 * // Emit an event
 * emit('CHARACTER_UPDATED', {
 *   entityId: 'char-123',
 *   entityType: 'character',
 *   projectId: 'project-123',
 *   source: 'character-editor',
 *   changes: { name: { old: 'John', new: 'Jane' } },
 * });
 *
 * // Subscribe to events
 * useEffect(() => {
 *   return subscribe(['CHARACTER_UPDATED', 'CHARACTER_DELETED'], (event) => {
 *     console.log('Character changed:', event);
 *   });
 * }, [subscribe]);
 *
 * // Preview impact before making a change
 * const impact = previewImpact(
 *   { type: 'character', id: 'char-123', name: 'Jane' },
 *   'CHARACTER_DELETED'
 * );
 */

// Core classes
export { EventBus, getEventBus, resetEventBus } from './EventBus';
export {
  DependencyGraph,
  getDependencyGraph,
  resetDependencyGraph,
  ENTITY_DEPENDENCY_RULES,
  IMPACT_PROPAGATION,
} from './DependencyGraph';
export {
  CoordinationHub,
  getCoordinationHub,
  resetCoordinationHub,
} from './CoordinationHub';

// Integrations
export {
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
} from './queryIntegration';

export {
  coordination,
  createCharacterCoordinationConfig,
  createProjectCoordinationConfig,
  emitCharacterEvent,
  emitSceneEvent,
  emitFactionEvent,
  emitBeatEvent,
  emitAssetEvent,
  enhanceStoreWithCoordination,
} from './zustandMiddleware';

// Persistence
export {
  EventPersistence,
  getEventPersistence,
  resetEventPersistence,
} from './persistence';

// Types
export type {
  // Entity types
  EntityType,
  EntityId,
  EntityReference,

  // Event types
  EventAction,
  CoordinationEventType,
  CharacterEventType,
  SceneEventType,
  ActEventType,
  BeatEventType,
  FactionEventType,
  AssetEventType,
  RelationshipEventType,
  ProjectEventType,

  // Payloads
  BaseEventPayload,
  EventPayload,
  CharacterPayload,
  ScenePayload,
  ActPayload,
  BeatPayload,
  FactionPayload,
  AssetPayload,
  RelationshipPayload,
  ProjectPayload,

  // Events
  CoordinationEvent,

  // Subscriptions
  EventHandler,
  Subscription,

  // Dependencies
  DependencyType,
  Dependency,

  // Impact analysis
  ImpactNode,
  ImpactAnalysis,

  // Undo/Redo
  EventHistoryEntry,
  UndoContext,

  // Query mapping
  QueryKeyMapping,

  // State
  CoordinationState,

  // Utility types
  EntityTypeFromEvent,
  PayloadFromEntityType,
} from './types';

export type { Snapshot, PersistenceOptions } from './persistence';
export type { CoordinationConfig } from './zustandMiddleware';
export type { CoordinationHubOptions, PendingChange } from './CoordinationHub';
