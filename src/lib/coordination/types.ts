/**
 * Cross-Feature State Coordination Hub - Event Types and Schema Definitions
 *
 * This module defines the event taxonomy for automatic propagation of changes
 * across characters, scenes, factions, and assets with dependency tracking.
 */

// ============================================================================
// Entity Types
// ============================================================================

export type EntityType =
  | 'character'
  | 'scene'
  | 'act'
  | 'beat'
  | 'faction'
  | 'asset'
  | 'relationship'
  | 'project';

export type EntityId = string;

export interface EntityReference {
  type: EntityType;
  id: EntityId;
  name?: string;
  projectId?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export type EventAction = 'created' | 'updated' | 'deleted';

export type CharacterEventType =
  | 'CHARACTER_CREATED'
  | 'CHARACTER_UPDATED'
  | 'CHARACTER_DELETED'
  | 'CHARACTER_FACTION_CHANGED'
  | 'CHARACTER_AVATAR_CHANGED'
  | 'CHARACTER_VOICE_CHANGED'
  | 'CHARACTER_APPEARANCE_CHANGED';

export type SceneEventType =
  | 'SCENE_CREATED'
  | 'SCENE_UPDATED'
  | 'SCENE_DELETED'
  | 'SCENE_REORDERED'
  | 'SCENE_CONTENT_CHANGED'
  | 'SCENE_IMAGE_CHANGED';

export type ActEventType =
  | 'ACT_CREATED'
  | 'ACT_UPDATED'
  | 'ACT_DELETED'
  | 'ACT_REORDERED';

export type BeatEventType =
  | 'BEAT_CREATED'
  | 'BEAT_UPDATED'
  | 'BEAT_DELETED'
  | 'BEAT_COMPLETED'
  | 'BEAT_DEPENDENCY_ADDED'
  | 'BEAT_DEPENDENCY_REMOVED'
  | 'BEAT_SCENE_MAPPING_CHANGED';

export type FactionEventType =
  | 'FACTION_CREATED'
  | 'FACTION_UPDATED'
  | 'FACTION_DELETED'
  | 'FACTION_MEMBER_ADDED'
  | 'FACTION_MEMBER_REMOVED'
  | 'FACTION_LORE_CHANGED'
  | 'FACTION_EVENT_ADDED'
  | 'FACTION_RELATIONSHIP_CHANGED';

export type AssetEventType =
  | 'ASSET_UPLOADED'
  | 'ASSET_UPDATED'
  | 'ASSET_DELETED'
  | 'ASSET_TAGGED'
  | 'ASSET_LINKED'
  | 'ASSET_UNLINKED';

export type RelationshipEventType =
  | 'RELATIONSHIP_CREATED'
  | 'RELATIONSHIP_UPDATED'
  | 'RELATIONSHIP_DELETED';

export type ProjectEventType =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_DELETED'
  | 'PROJECT_STYLE_CHANGED';

export type CoordinationEventType =
  | CharacterEventType
  | SceneEventType
  | ActEventType
  | BeatEventType
  | FactionEventType
  | AssetEventType
  | RelationshipEventType
  | ProjectEventType;

// ============================================================================
// Event Payloads
// ============================================================================

export interface BaseEventPayload {
  entityId: EntityId;
  entityType: EntityType;
  projectId: string;
  timestamp: number;
  source: string; // Component/hook that triggered the event
}

export interface CharacterPayload extends BaseEventPayload {
  entityType: 'character';
  changes?: {
    name?: { old?: string; new: string };
    factionId?: { old?: string | null; new: string | null };
    avatar?: { old?: string; new: string };
    voice?: { old?: string; new: string };
    type?: { old?: string; new: string };
    appearance?: { old?: unknown; new: unknown };
    factionRole?: { old?: string; new: string };
    factionRank?: { old?: number; new: number };
  };
}

export interface ScenePayload extends BaseEventPayload {
  entityType: 'scene';
  actId?: string;
  changes?: {
    name?: { old?: string; new: string };
    content?: { old?: string; new: string };
    description?: { old?: string; new: string };
    order?: { old?: number; new: number };
    image?: { old?: string; new: string };
    speaker?: { old?: string; new: string };
  };
}

export interface ActPayload extends BaseEventPayload {
  entityType: 'act';
  changes?: {
    name?: { old?: string; new: string };
    order?: { old?: number; new: number };
  };
}

export interface BeatPayload extends BaseEventPayload {
  entityType: 'beat';
  actId?: string;
  changes?: {
    name?: { old?: string; new: string };
    completed?: { old?: boolean; new: boolean };
    order?: { old?: number; new: number };
    duration?: { old?: number; new: number };
  };
  relatedBeatId?: string; // For dependency events
  relatedSceneId?: string; // For mapping events
}

export interface FactionPayload extends BaseEventPayload {
  entityType: 'faction';
  changes?: {
    name?: { old?: string; new: string };
    description?: { old?: string; new: string };
    branding?: { old?: unknown; new: unknown };
  };
  relatedCharacterId?: string; // For member events
  relatedFactionId?: string; // For relationship events
}

export interface AssetPayload extends BaseEventPayload {
  entityType: 'asset';
  changes?: {
    name?: { old?: string; new: string };
    type?: { old?: string; new: string };
    tags?: { old?: string[]; new: string[] };
  };
  linkedEntityId?: string;
  linkedEntityType?: EntityType;
}

export interface RelationshipPayload extends BaseEventPayload {
  entityType: 'relationship';
  characterAId: string;
  characterBId: string;
  changes?: {
    type?: { old?: string; new: string };
    description?: { old?: string; new: string };
  };
}

export interface ProjectPayload extends BaseEventPayload {
  entityType: 'project';
  changes?: {
    name?: { old?: string; new: string };
    artStyle?: { old?: unknown; new: unknown };
  };
}

export type EventPayload =
  | CharacterPayload
  | ScenePayload
  | ActPayload
  | BeatPayload
  | FactionPayload
  | AssetPayload
  | RelationshipPayload
  | ProjectPayload;

// ============================================================================
// Coordination Event
// ============================================================================

export interface CoordinationEvent {
  id: string;
  type: CoordinationEventType;
  payload: EventPayload;
  metadata: {
    createdAt: number;
    processedAt?: number;
    acknowledged: boolean;
    retryCount: number;
    priority: 'low' | 'normal' | 'high';
    batchId?: string; // For grouping related events
  };
}

// ============================================================================
// Event Subscription
// ============================================================================

export type EventHandler<T extends EventPayload = EventPayload> = (
  event: CoordinationEvent & { payload: T }
) => void | Promise<void>;

export interface Subscription {
  id: string;
  eventTypes: CoordinationEventType[];
  entityTypes?: EntityType[];
  projectId?: string; // Optional: only receive events for specific project
  handler: EventHandler;
  priority: number;
  label: string; // For debugging
}

// ============================================================================
// Dependency Types
// ============================================================================

export type DependencyType =
  | 'references'      // Entity A references Entity B (weak dependency)
  | 'contains'        // Entity A contains Entity B (parent-child)
  | 'belongs_to'      // Entity A belongs to Entity B
  | 'affects'         // Changes to A affect B
  | 'requires'        // Entity A requires Entity B to exist
  | 'related_to';     // Bidirectional relationship

export interface Dependency {
  id: string;
  sourceEntity: EntityReference;
  targetEntity: EntityReference;
  type: DependencyType;
  metadata?: {
    createdAt: number;
    strength: 'weak' | 'normal' | 'strong';
    description?: string;
  };
}

// ============================================================================
// Impact Analysis
// ============================================================================

export interface ImpactNode {
  entity: EntityReference;
  impactLevel: 'direct' | 'indirect';
  dependencyPath: string[]; // Chain of entity IDs from source
  affectedFields?: string[];
  suggestedAction?: 'update' | 'review' | 'regenerate' | 'notify';
}

export interface ImpactAnalysis {
  sourceEntity: EntityReference;
  eventType: CoordinationEventType;
  affectedEntities: ImpactNode[];
  totalAffected: number;
  analysisTimestamp: number;
}

// ============================================================================
// Undo/Redo Support
// ============================================================================

export interface EventHistoryEntry {
  event: CoordinationEvent;
  reversedBy?: string; // ID of the event that reversed this one
  undoData?: unknown; // Data needed to undo this event
}

export interface UndoContext {
  canUndo: boolean;
  canRedo: boolean;
  undoStack: EventHistoryEntry[];
  redoStack: EventHistoryEntry[];
  lastUndoTimestamp?: number;
}

// ============================================================================
// Query Key Mapping
// ============================================================================

export interface QueryKeyMapping {
  eventType: CoordinationEventType;
  queryKeys: (payload: EventPayload) => string[][];
}

// ============================================================================
// Coordination State
// ============================================================================

export interface CoordinationState {
  // Event queue
  pendingEvents: CoordinationEvent[];
  processedEventCount: number;
  lastEventTimestamp?: number;

  // Subscriptions
  subscriptions: Map<string, Subscription>;

  // Dependencies
  dependencies: Dependency[];

  // Undo/Redo
  undoContext: UndoContext;

  // Processing state
  isProcessing: boolean;
  processingBatchId?: string;

  // Debugging
  debugMode: boolean;
  eventLog: CoordinationEvent[];
  maxLogSize: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type EntityTypeFromEvent<T extends CoordinationEventType> =
  T extends CharacterEventType ? 'character' :
  T extends SceneEventType ? 'scene' :
  T extends ActEventType ? 'act' :
  T extends BeatEventType ? 'beat' :
  T extends FactionEventType ? 'faction' :
  T extends AssetEventType ? 'asset' :
  T extends RelationshipEventType ? 'relationship' :
  T extends ProjectEventType ? 'project' :
  EntityType;

export type PayloadFromEntityType<T extends EntityType> =
  T extends 'character' ? CharacterPayload :
  T extends 'scene' ? ScenePayload :
  T extends 'act' ? ActPayload :
  T extends 'beat' ? BeatPayload :
  T extends 'faction' ? FactionPayload :
  T extends 'asset' ? AssetPayload :
  T extends 'relationship' ? RelationshipPayload :
  T extends 'project' ? ProjectPayload :
  EventPayload;
