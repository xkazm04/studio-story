/**
 * DependencyGraph - Tracks entity relationships for impact analysis
 *
 * Provides:
 * - Entity relationship modeling (references, contains, belongs_to, etc.)
 * - Impact analysis: "What depends on this entity?"
 * - Bidirectional traversal for cascade detection
 * - Visualization support with graph export
 */

import { nanoid } from 'nanoid';
import {
  Dependency,
  DependencyType,
  EntityReference,
  EntityType,
  ImpactNode,
  ImpactAnalysis,
  CoordinationEventType,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const MAX_TRAVERSAL_DEPTH = 10;

// ============================================================================
// Predefined Dependency Rules
// ============================================================================

/**
 * Static dependency rules based on entity relationships in the schema
 */
export const ENTITY_DEPENDENCY_RULES: Record<
  EntityType,
  Array<{
    dependsOn: EntityType;
    type: DependencyType;
    description: string;
  }>
> = {
  character: [
    { dependsOn: 'project', type: 'belongs_to', description: 'Character belongs to project' },
    { dependsOn: 'faction', type: 'belongs_to', description: 'Character may belong to faction' },
  ],
  scene: [
    { dependsOn: 'project', type: 'belongs_to', description: 'Scene belongs to project' },
    { dependsOn: 'act', type: 'belongs_to', description: 'Scene belongs to act' },
    { dependsOn: 'character', type: 'references', description: 'Scene may reference characters' },
  ],
  act: [
    { dependsOn: 'project', type: 'belongs_to', description: 'Act belongs to project' },
  ],
  beat: [
    { dependsOn: 'project', type: 'belongs_to', description: 'Beat belongs to project' },
    { dependsOn: 'act', type: 'belongs_to', description: 'Beat may belong to act' },
    { dependsOn: 'scene', type: 'references', description: 'Beat may map to scene' },
    { dependsOn: 'beat', type: 'requires', description: 'Beat may depend on other beats' },
  ],
  faction: [
    { dependsOn: 'project', type: 'belongs_to', description: 'Faction belongs to project' },
    { dependsOn: 'faction', type: 'related_to', description: 'Faction may have relationships with other factions' },
  ],
  asset: [
    { dependsOn: 'character', type: 'references', description: 'Asset may be linked to character' },
    { dependsOn: 'scene', type: 'references', description: 'Asset may be used in scene' },
  ],
  relationship: [
    { dependsOn: 'character', type: 'requires', description: 'Relationship requires two characters' },
    { dependsOn: 'act', type: 'references', description: 'Relationship may be tied to act' },
  ],
  project: [],
};

/**
 * Reverse impact: when entity X changes, what entity types are affected?
 */
export const IMPACT_PROPAGATION: Record<
  EntityType,
  Array<{
    affects: EntityType;
    suggestedAction: 'update' | 'review' | 'regenerate' | 'notify';
    description: string;
  }>
> = {
  character: [
    { affects: 'scene', suggestedAction: 'review', description: 'Scenes referencing character may need updates' },
    { affects: 'relationship', suggestedAction: 'update', description: 'Relationships involving character need updates' },
    { affects: 'faction', suggestedAction: 'notify', description: 'Faction member list may change' },
    { affects: 'asset', suggestedAction: 'review', description: 'Character assets may need re-tagging' },
  ],
  scene: [
    { affects: 'beat', suggestedAction: 'review', description: 'Beat-scene mappings may need review' },
    { affects: 'asset', suggestedAction: 'notify', description: 'Scene assets may need updates' },
  ],
  act: [
    { affects: 'scene', suggestedAction: 'update', description: 'Scenes in act may be affected' },
    { affects: 'beat', suggestedAction: 'update', description: 'Beats in act may be affected' },
  ],
  beat: [
    { affects: 'beat', suggestedAction: 'review', description: 'Dependent beats may need updates' },
    { affects: 'scene', suggestedAction: 'notify', description: 'Mapped scenes may need review' },
  ],
  faction: [
    { affects: 'character', suggestedAction: 'update', description: 'Member characters may need updates' },
    { affects: 'faction', suggestedAction: 'notify', description: 'Related factions may be affected' },
  ],
  asset: [
    { affects: 'character', suggestedAction: 'notify', description: 'Characters using asset may need updates' },
    { affects: 'scene', suggestedAction: 'notify', description: 'Scenes using asset may need updates' },
  ],
  relationship: [
    { affects: 'character', suggestedAction: 'notify', description: 'Related characters may need notification' },
  ],
  project: [
    { affects: 'character', suggestedAction: 'update', description: 'Project style changes affect characters' },
    { affects: 'scene', suggestedAction: 'update', description: 'Project style changes affect scenes' },
    { affects: 'faction', suggestedAction: 'update', description: 'Project changes affect factions' },
  ],
};

// ============================================================================
// Dependency Graph Class
// ============================================================================

export class DependencyGraph {
  private dependencies: Map<string, Dependency> = new Map();
  private entityIndex: Map<string, Set<string>> = new Map(); // entityKey -> dependency IDs where entity is source
  private reverseIndex: Map<string, Set<string>> = new Map(); // entityKey -> dependency IDs where entity is target
  private debugMode = false;

  constructor(options?: { debugMode?: boolean }) {
    this.debugMode = options?.debugMode ?? false;
  }

  // ==========================================================================
  // Dependency Management
  // ==========================================================================

  /**
   * Add a dependency relationship between two entities
   */
  addDependency(
    sourceEntity: EntityReference,
    targetEntity: EntityReference,
    type: DependencyType,
    options?: {
      strength?: 'weak' | 'normal' | 'strong';
      description?: string;
    }
  ): string {
    const id = nanoid();
    const dependency: Dependency = {
      id,
      sourceEntity,
      targetEntity,
      type,
      metadata: {
        createdAt: Date.now(),
        strength: options?.strength ?? 'normal',
        description: options?.description,
      },
    };

    this.dependencies.set(id, dependency);

    // Update indices
    const sourceKey = this.getEntityKey(sourceEntity);
    const targetKey = this.getEntityKey(targetEntity);

    if (!this.entityIndex.has(sourceKey)) {
      this.entityIndex.set(sourceKey, new Set());
    }
    this.entityIndex.get(sourceKey)!.add(id);

    if (!this.reverseIndex.has(targetKey)) {
      this.reverseIndex.set(targetKey, new Set());
    }
    this.reverseIndex.get(targetKey)!.add(id);

    this.log(`Dependency added: ${sourceEntity.type}:${sourceEntity.id} --[${type}]--> ${targetEntity.type}:${targetEntity.id}`);

    return id;
  }

  /**
   * Remove a dependency by ID
   */
  removeDependency(dependencyId: string): boolean {
    const dependency = this.dependencies.get(dependencyId);
    if (!dependency) return false;

    const sourceKey = this.getEntityKey(dependency.sourceEntity);
    const targetKey = this.getEntityKey(dependency.targetEntity);

    this.entityIndex.get(sourceKey)?.delete(dependencyId);
    this.reverseIndex.get(targetKey)?.delete(dependencyId);
    this.dependencies.delete(dependencyId);

    this.log(`Dependency removed: ${dependencyId}`);
    return true;
  }

  /**
   * Remove all dependencies for an entity
   */
  removeEntityDependencies(entity: EntityReference): number {
    const key = this.getEntityKey(entity);
    let removed = 0;

    // Remove as source
    const sourceDepIds = this.entityIndex.get(key);
    if (sourceDepIds) {
      for (const id of sourceDepIds) {
        const dep = this.dependencies.get(id);
        if (dep) {
          const targetKey = this.getEntityKey(dep.targetEntity);
          this.reverseIndex.get(targetKey)?.delete(id);
          this.dependencies.delete(id);
          removed++;
        }
      }
      this.entityIndex.delete(key);
    }

    // Remove as target
    const targetDepIds = this.reverseIndex.get(key);
    if (targetDepIds) {
      for (const id of targetDepIds) {
        const dep = this.dependencies.get(id);
        if (dep) {
          const sourceKey = this.getEntityKey(dep.sourceEntity);
          this.entityIndex.get(sourceKey)?.delete(id);
          this.dependencies.delete(id);
          removed++;
        }
      }
      this.reverseIndex.delete(key);
    }

    return removed;
  }

  // ==========================================================================
  // Querying
  // ==========================================================================

  /**
   * Get all dependencies where entity is the source
   */
  getDependencies(entity: EntityReference): Dependency[] {
    const key = this.getEntityKey(entity);
    const depIds = this.entityIndex.get(key) ?? new Set();
    return Array.from(depIds)
      .map(id => this.dependencies.get(id))
      .filter((d): d is Dependency => d !== undefined);
  }

  /**
   * Get all dependencies where entity is the target (what depends on this entity)
   */
  getDependents(entity: EntityReference): Dependency[] {
    const key = this.getEntityKey(entity);
    const depIds = this.reverseIndex.get(key) ?? new Set();
    return Array.from(depIds)
      .map(id => this.dependencies.get(id))
      .filter((d): d is Dependency => d !== undefined);
  }

  /**
   * Check if a dependency exists between two entities
   */
  hasDependency(
    sourceEntity: EntityReference,
    targetEntity: EntityReference,
    type?: DependencyType
  ): boolean {
    const deps = this.getDependencies(sourceEntity);
    return deps.some(
      d =>
        d.targetEntity.id === targetEntity.id &&
        d.targetEntity.type === targetEntity.type &&
        (type === undefined || d.type === type)
    );
  }

  /**
   * Find dependency between two entities
   */
  findDependency(
    sourceEntity: EntityReference,
    targetEntity: EntityReference
  ): Dependency | undefined {
    const deps = this.getDependencies(sourceEntity);
    return deps.find(
      d =>
        d.targetEntity.id === targetEntity.id &&
        d.targetEntity.type === targetEntity.type
    );
  }

  // ==========================================================================
  // Impact Analysis
  // ==========================================================================

  /**
   * Analyze the impact of changes to an entity
   */
  analyzeImpact(
    entity: EntityReference,
    eventType: CoordinationEventType
  ): ImpactAnalysis {
    const affectedEntities: ImpactNode[] = [];
    const visited = new Set<string>();

    // Direct dependents from the graph
    this.traverseDependents(entity, visited, affectedEntities, [], 0, 'direct');

    // Static impact rules
    const staticImpacts = IMPACT_PROPAGATION[entity.type] ?? [];
    for (const impact of staticImpacts) {
      // Add as indirect impact if not already directly affected
      const existingDirect = affectedEntities.find(
        n => n.entity.type === impact.affects && n.impactLevel === 'direct'
      );
      if (!existingDirect) {
        affectedEntities.push({
          entity: {
            type: impact.affects,
            id: '*', // Wildcard - all entities of this type
            name: `All ${impact.affects}s`,
          },
          impactLevel: 'indirect',
          dependencyPath: [entity.id],
          suggestedAction: impact.suggestedAction,
        });
      }
    }

    return {
      sourceEntity: entity,
      eventType,
      affectedEntities,
      totalAffected: affectedEntities.length,
      analysisTimestamp: Date.now(),
    };
  }

  private traverseDependents(
    entity: EntityReference,
    visited: Set<string>,
    result: ImpactNode[],
    path: string[],
    depth: number,
    level: 'direct' | 'indirect'
  ): void {
    if (depth >= MAX_TRAVERSAL_DEPTH) return;

    const key = this.getEntityKey(entity);
    if (visited.has(key)) return;
    visited.add(key);

    const dependents = this.getDependents(entity);
    for (const dep of dependents) {
      const newPath = [...path, entity.id];

      result.push({
        entity: dep.sourceEntity,
        impactLevel: level,
        dependencyPath: newPath,
        suggestedAction: this.getSuggestedAction(dep.type),
      });

      // Recursively traverse
      this.traverseDependents(
        dep.sourceEntity,
        visited,
        result,
        newPath,
        depth + 1,
        'indirect'
      );
    }
  }

  private getSuggestedAction(
    depType: DependencyType
  ): 'update' | 'review' | 'regenerate' | 'notify' {
    switch (depType) {
      case 'requires':
        return 'update';
      case 'contains':
        return 'update';
      case 'belongs_to':
        return 'update';
      case 'affects':
        return 'regenerate';
      case 'references':
        return 'review';
      case 'related_to':
        return 'notify';
      default:
        return 'review';
    }
  }

  /**
   * Get entities that would be affected by deleting the given entity
   */
  getDeleteImpact(entity: EntityReference): EntityReference[] {
    const affected: EntityReference[] = [];
    const visited = new Set<string>();

    this.collectCascadeDeletes(entity, visited, affected);

    return affected;
  }

  private collectCascadeDeletes(
    entity: EntityReference,
    visited: Set<string>,
    result: EntityReference[]
  ): void {
    const key = this.getEntityKey(entity);
    if (visited.has(key)) return;
    visited.add(key);

    const dependents = this.getDependents(entity);
    for (const dep of dependents) {
      // Only cascade for 'requires' and 'belongs_to' dependencies
      if (dep.type === 'requires' || dep.type === 'belongs_to') {
        result.push(dep.sourceEntity);
        this.collectCascadeDeletes(dep.sourceEntity, visited, result);
      }
    }
  }

  // ==========================================================================
  // Bulk Operations
  // ==========================================================================

  /**
   * Register all dependencies for an entity based on static rules
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
    const rules = ENTITY_DEPENDENCY_RULES[entity.type];

    for (const rule of rules) {
      switch (rule.dependsOn) {
        case 'project':
          if (relatedEntities.projectId) {
            this.addDependency(
              entity,
              { type: 'project', id: relatedEntities.projectId },
              rule.type,
              { description: rule.description }
            );
          }
          break;
        case 'faction':
          if (relatedEntities.factionId) {
            this.addDependency(
              entity,
              { type: 'faction', id: relatedEntities.factionId },
              rule.type,
              { description: rule.description }
            );
          }
          break;
        case 'act':
          if (relatedEntities.actId) {
            this.addDependency(
              entity,
              { type: 'act', id: relatedEntities.actId },
              rule.type,
              { description: rule.description }
            );
          }
          break;
        case 'scene':
          for (const sceneId of relatedEntities.sceneIds ?? []) {
            this.addDependency(
              entity,
              { type: 'scene', id: sceneId },
              rule.type,
              { description: rule.description }
            );
          }
          break;
        case 'character':
          for (const charId of relatedEntities.characterIds ?? []) {
            this.addDependency(
              entity,
              { type: 'character', id: charId },
              rule.type,
              { description: rule.description }
            );
          }
          break;
        case 'beat':
          for (const beatId of relatedEntities.beatIds ?? []) {
            this.addDependency(
              entity,
              { type: 'beat', id: beatId },
              rule.type,
              { description: rule.description }
            );
          }
          break;
      }
    }
  }

  // ==========================================================================
  // Visualization Support
  // ==========================================================================

  /**
   * Export graph data for visualization
   */
  exportForVisualization(): {
    nodes: Array<{ id: string; type: EntityType; name?: string }>;
    edges: Array<{
      source: string;
      target: string;
      type: DependencyType;
      strength?: string;
    }>;
  } {
    const nodes = new Map<string, { id: string; type: EntityType; name?: string }>();
    const edges: Array<{
      source: string;
      target: string;
      type: DependencyType;
      strength?: string;
    }> = [];

    for (const dep of this.dependencies.values()) {
      // Add nodes
      const sourceKey = this.getEntityKey(dep.sourceEntity);
      const targetKey = this.getEntityKey(dep.targetEntity);

      if (!nodes.has(sourceKey)) {
        nodes.set(sourceKey, {
          id: sourceKey,
          type: dep.sourceEntity.type,
          name: dep.sourceEntity.name,
        });
      }

      if (!nodes.has(targetKey)) {
        nodes.set(targetKey, {
          id: targetKey,
          type: dep.targetEntity.type,
          name: dep.targetEntity.name,
        });
      }

      // Add edge
      edges.push({
        source: sourceKey,
        target: targetKey,
        type: dep.type,
        strength: dep.metadata?.strength,
      });
    }

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  /**
   * Get subgraph for a specific entity (entity and all connected nodes)
   */
  getSubgraph(
    entity: EntityReference,
    maxDepth: number = 2
  ): ReturnType<typeof this.exportForVisualization> {
    const visited = new Set<string>();
    const relevantDeps = new Set<string>();

    this.collectConnectedDependencies(entity, visited, relevantDeps, 0, maxDepth);

    const nodes = new Map<string, { id: string; type: EntityType; name?: string }>();
    const edges: Array<{
      source: string;
      target: string;
      type: DependencyType;
      strength?: string;
    }> = [];

    for (const depId of relevantDeps) {
      const dep = this.dependencies.get(depId);
      if (!dep) continue;

      const sourceKey = this.getEntityKey(dep.sourceEntity);
      const targetKey = this.getEntityKey(dep.targetEntity);

      if (!nodes.has(sourceKey)) {
        nodes.set(sourceKey, {
          id: sourceKey,
          type: dep.sourceEntity.type,
          name: dep.sourceEntity.name,
        });
      }

      if (!nodes.has(targetKey)) {
        nodes.set(targetKey, {
          id: targetKey,
          type: dep.targetEntity.type,
          name: dep.targetEntity.name,
        });
      }

      edges.push({
        source: sourceKey,
        target: targetKey,
        type: dep.type,
        strength: dep.metadata?.strength,
      });
    }

    return {
      nodes: Array.from(nodes.values()),
      edges,
    };
  }

  private collectConnectedDependencies(
    entity: EntityReference,
    visited: Set<string>,
    deps: Set<string>,
    depth: number,
    maxDepth: number
  ): void {
    if (depth >= maxDepth) return;

    const key = this.getEntityKey(entity);
    if (visited.has(key)) return;
    visited.add(key);

    // Outgoing dependencies
    const outgoing = this.entityIndex.get(key) ?? new Set();
    for (const depId of outgoing) {
      deps.add(depId);
      const dep = this.dependencies.get(depId);
      if (dep) {
        this.collectConnectedDependencies(dep.targetEntity, visited, deps, depth + 1, maxDepth);
      }
    }

    // Incoming dependencies
    const incoming = this.reverseIndex.get(key) ?? new Set();
    for (const depId of incoming) {
      deps.add(depId);
      const dep = this.dependencies.get(depId);
      if (dep) {
        this.collectConnectedDependencies(dep.sourceEntity, visited, deps, depth + 1, maxDepth);
      }
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private getEntityKey(entity: EntityReference): string {
    return `${entity.type}:${entity.id}`;
  }

  private log(message: string): void {
    if (this.debugMode) {
      console.log(`[DependencyGraph] ${message}`);
    }
  }

  /**
   * Get total number of dependencies
   */
  size(): number {
    return this.dependencies.size;
  }

  /**
   * Clear all dependencies
   */
  clear(): void {
    this.dependencies.clear();
    this.entityIndex.clear();
    this.reverseIndex.clear();
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Get all dependencies (for serialization)
   */
  getAllDependencies(): Dependency[] {
    return Array.from(this.dependencies.values());
  }

  /**
   * Load dependencies from serialized data
   */
  loadDependencies(dependencies: Dependency[]): void {
    this.clear();
    for (const dep of dependencies) {
      this.dependencies.set(dep.id, dep);

      const sourceKey = this.getEntityKey(dep.sourceEntity);
      const targetKey = this.getEntityKey(dep.targetEntity);

      if (!this.entityIndex.has(sourceKey)) {
        this.entityIndex.set(sourceKey, new Set());
      }
      this.entityIndex.get(sourceKey)!.add(dep.id);

      if (!this.reverseIndex.has(targetKey)) {
        this.reverseIndex.set(targetKey, new Set());
      }
      this.reverseIndex.get(targetKey)!.add(dep.id);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let dependencyGraphInstance: DependencyGraph | null = null;

export function getDependencyGraph(
  options?: ConstructorParameters<typeof DependencyGraph>[0]
): DependencyGraph {
  if (!dependencyGraphInstance) {
    dependencyGraphInstance = new DependencyGraph(options);
  }
  return dependencyGraphInstance;
}

export function resetDependencyGraph(): void {
  if (dependencyGraphInstance) {
    dependencyGraphInstance.clear();
    dependencyGraphInstance = null;
  }
}

export default DependencyGraph;
