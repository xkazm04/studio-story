/**
 * DependencyManager
 * Manages beat dependencies, prerequisite tracking, causality chains,
 * and narrative logic validation
 */

import { BeatDependency } from '@/app/types/Beat';

// ===== TYPES =====

export type DependencyType = 'sequential' | 'parallel' | 'causal';
export type DependencyStrength = 'required' | 'suggested' | 'optional';

export interface Dependency {
  id: string;
  sourceBeatId: string;
  targetBeatId: string;
  type: DependencyType;
  strength: DependencyStrength;
  description?: string;
}

export interface BeatNode {
  id: string;
  name: string;
  order: number;
  dependencies: string[]; // IDs of beats this beat depends on
  dependents: string[];   // IDs of beats that depend on this beat
}

export interface DependencyGraph {
  nodes: Map<string, BeatNode>;
  edges: Dependency[];
}

export interface ValidationError {
  type: 'cycle' | 'missing_prerequisite' | 'order_violation' | 'orphan' | 'strength_mismatch';
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedBeats: string[];
  suggestion?: string;
}

export interface CausalityChain {
  id: string;
  name: string;
  beats: string[]; // Ordered list of beat IDs in the chain
  isComplete: boolean;
  missingBeats?: string[];
}

export interface ImpactAnalysis {
  beatId: string;
  directlyAffected: string[];
  transitivelyAffected: string[];
  impactScore: number; // 0-100
  warnings: string[];
}

export interface TopologicalOrder {
  order: string[];
  levels: Map<string, number>; // Beat ID -> level in the graph
  hasValidOrder: boolean;
  cycles?: string[][];
}

// ===== DEPENDENCY MANAGER CLASS =====

export class DependencyManager {
  private dependencies: Map<string, Dependency>;
  private graph: DependencyGraph;

  constructor() {
    this.dependencies = new Map();
    this.graph = {
      nodes: new Map(),
      edges: [],
    };
  }

  /**
   * Initialize from existing beat dependencies
   */
  initializeFromBeats(
    beats: Array<{ id: string; name: string; order?: number }>,
    dependencies: BeatDependency[]
  ): void {
    this.dependencies.clear();
    this.graph.nodes.clear();
    this.graph.edges = [];

    // Create nodes for each beat
    for (const beat of beats) {
      this.graph.nodes.set(beat.id, {
        id: beat.id,
        name: beat.name,
        order: beat.order || 0,
        dependencies: [],
        dependents: [],
      });
    }

    // Add dependencies
    for (const dep of dependencies) {
      this.addDependency({
        id: dep.id,
        sourceBeatId: dep.source_beat_id,
        targetBeatId: dep.target_beat_id,
        type: dep.dependency_type,
        strength: dep.strength,
      });
    }
  }

  /**
   * Add a dependency between two beats
   */
  addDependency(dependency: Dependency): ValidationError | null {
    // Check for cycle before adding
    const wouldCreateCycle = this.wouldCreateCycle(
      dependency.sourceBeatId,
      dependency.targetBeatId
    );

    if (wouldCreateCycle) {
      return {
        type: 'cycle',
        severity: 'error',
        message: `Adding this dependency would create a circular dependency`,
        affectedBeats: [dependency.sourceBeatId, dependency.targetBeatId],
        suggestion: 'Review the dependency chain and remove conflicting dependencies',
      };
    }

    // Add to dependencies map
    this.dependencies.set(dependency.id, dependency);

    // Update graph
    this.graph.edges.push(dependency);

    const sourceNode = this.graph.nodes.get(dependency.sourceBeatId);
    const targetNode = this.graph.nodes.get(dependency.targetBeatId);

    if (sourceNode && !sourceNode.dependents.includes(dependency.targetBeatId)) {
      sourceNode.dependents.push(dependency.targetBeatId);
    }

    if (targetNode && !targetNode.dependencies.includes(dependency.sourceBeatId)) {
      targetNode.dependencies.push(dependency.sourceBeatId);
    }

    return null;
  }

  /**
   * Remove a dependency
   */
  removeDependency(dependencyId: string): void {
    const dependency = this.dependencies.get(dependencyId);
    if (!dependency) return;

    // Remove from dependencies map
    this.dependencies.delete(dependencyId);

    // Update graph edges
    this.graph.edges = this.graph.edges.filter(e => e.id !== dependencyId);

    // Update nodes
    const sourceNode = this.graph.nodes.get(dependency.sourceBeatId);
    const targetNode = this.graph.nodes.get(dependency.targetBeatId);

    if (sourceNode) {
      sourceNode.dependents = sourceNode.dependents.filter(
        id => id !== dependency.targetBeatId
      );
    }

    if (targetNode) {
      targetNode.dependencies = targetNode.dependencies.filter(
        id => id !== dependency.sourceBeatId
      );
    }
  }

  /**
   * Check if adding a dependency would create a cycle
   */
  wouldCreateCycle(fromBeatId: string, toBeatId: string): boolean {
    // If target can reach source, adding source->target would create cycle
    const visited = new Set<string>();
    const queue = [toBeatId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === fromBeatId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.graph.nodes.get(current);
      if (node) {
        queue.push(...node.dependents);
      }
    }

    return false;
  }

  /**
   * Detect all cycles in the graph
   */
  detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = this.graph.nodes.get(nodeId);
      if (node) {
        for (const dependentId of node.dependents) {
          if (!visited.has(dependentId)) {
            dfs(dependentId);
          } else if (recursionStack.has(dependentId)) {
            // Found a cycle
            const cycleStart = path.indexOf(dependentId);
            cycles.push([...path.slice(cycleStart), dependentId]);
          }
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
    };

    for (const nodeId of this.graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return cycles;
  }

  /**
   * Get topological ordering of beats
   */
  getTopologicalOrder(): TopologicalOrder {
    const cycles = this.detectCycles();
    if (cycles.length > 0) {
      return {
        order: [],
        levels: new Map(),
        hasValidOrder: false,
        cycles,
      };
    }

    const inDegree = new Map<string, number>();
    const levels = new Map<string, number>();
    const order: string[] = [];

    // Initialize in-degrees
    for (const nodeId of this.graph.nodes.keys()) {
      const node = this.graph.nodes.get(nodeId)!;
      inDegree.set(nodeId, node.dependencies.length);
    }

    // Find all nodes with no dependencies (in-degree 0)
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
        levels.set(nodeId, 0);
      }
    }

    // Process in topological order
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      const node = this.graph.nodes.get(current);
      if (node) {
        const currentLevel = levels.get(current) || 0;

        for (const dependentId of node.dependents) {
          const newDegree = (inDegree.get(dependentId) || 0) - 1;
          inDegree.set(dependentId, newDegree);

          // Update level to max of current level + 1 and existing level
          const existingLevel = levels.get(dependentId) || 0;
          levels.set(dependentId, Math.max(existingLevel, currentLevel + 1));

          if (newDegree === 0) {
            queue.push(dependentId);
          }
        }
      }
    }

    return {
      order,
      levels,
      hasValidOrder: order.length === this.graph.nodes.size,
    };
  }

  /**
   * Validate all dependencies and return errors
   */
  validate(beatOrders: Map<string, number>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for cycles
    const cycles = this.detectCycles();
    for (const cycle of cycles) {
      errors.push({
        type: 'cycle',
        severity: 'error',
        message: `Circular dependency detected: ${cycle.join(' → ')}`,
        affectedBeats: cycle,
        suggestion: 'Remove one of the dependencies to break the cycle',
      });
    }

    // Check for order violations (required dependencies not respected)
    for (const dependency of this.dependencies.values()) {
      if (dependency.strength === 'required') {
        const sourceOrder = beatOrders.get(dependency.sourceBeatId);
        const targetOrder = beatOrders.get(dependency.targetBeatId);

        if (sourceOrder !== undefined && targetOrder !== undefined) {
          if (sourceOrder >= targetOrder) {
            const sourceNode = this.graph.nodes.get(dependency.sourceBeatId);
            const targetNode = this.graph.nodes.get(dependency.targetBeatId);

            errors.push({
              type: 'order_violation',
              severity: 'error',
              message: `"${sourceNode?.name}" must come before "${targetNode?.name}" but is placed after`,
              affectedBeats: [dependency.sourceBeatId, dependency.targetBeatId],
              suggestion: `Move "${sourceNode?.name}" to position before "${targetNode?.name}"`,
            });
          }
        }
      }
    }

    // Check for orphan nodes (beats with dependencies to non-existent beats)
    for (const dependency of this.dependencies.values()) {
      if (!this.graph.nodes.has(dependency.sourceBeatId)) {
        errors.push({
          type: 'orphan',
          severity: 'error',
          message: `Dependency references non-existent beat: ${dependency.sourceBeatId}`,
          affectedBeats: [dependency.targetBeatId],
          suggestion: 'Remove this dependency or add the missing beat',
        });
      }
      if (!this.graph.nodes.has(dependency.targetBeatId)) {
        errors.push({
          type: 'orphan',
          severity: 'error',
          message: `Dependency references non-existent beat: ${dependency.targetBeatId}`,
          affectedBeats: [dependency.sourceBeatId],
          suggestion: 'Remove this dependency or add the missing beat',
        });
      }
    }

    // Check for suggested dependencies not respected (warnings only)
    for (const dependency of this.dependencies.values()) {
      if (dependency.strength === 'suggested') {
        const sourceOrder = beatOrders.get(dependency.sourceBeatId);
        const targetOrder = beatOrders.get(dependency.targetBeatId);

        if (sourceOrder !== undefined && targetOrder !== undefined) {
          if (sourceOrder >= targetOrder) {
            const sourceNode = this.graph.nodes.get(dependency.sourceBeatId);
            const targetNode = this.graph.nodes.get(dependency.targetBeatId);

            errors.push({
              type: 'order_violation',
              severity: 'warning',
              message: `Suggested: "${sourceNode?.name}" should come before "${targetNode?.name}"`,
              affectedBeats: [dependency.sourceBeatId, dependency.targetBeatId],
              suggestion: 'Consider reordering for better narrative flow',
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Get all dependencies for a specific beat
   */
  getBeatDependencies(beatId: string): {
    prerequisites: Dependency[];
    dependents: Dependency[];
  } {
    const prerequisites: Dependency[] = [];
    const dependents: Dependency[] = [];

    for (const dependency of this.dependencies.values()) {
      if (dependency.targetBeatId === beatId) {
        prerequisites.push(dependency);
      }
      if (dependency.sourceBeatId === beatId) {
        dependents.push(dependency);
      }
    }

    return { prerequisites, dependents };
  }

  /**
   * Get all prerequisite beats (transitive closure)
   */
  getAllPrerequisites(beatId: string): string[] {
    const prerequisites = new Set<string>();
    const queue = [beatId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = this.graph.nodes.get(current);

      if (node) {
        for (const depId of node.dependencies) {
          if (!prerequisites.has(depId)) {
            prerequisites.add(depId);
            queue.push(depId);
          }
        }
      }
    }

    return Array.from(prerequisites);
  }

  /**
   * Get all dependent beats (transitive closure)
   */
  getAllDependents(beatId: string): string[] {
    const dependents = new Set<string>();
    const queue = [beatId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = this.graph.nodes.get(current);

      if (node) {
        for (const depId of node.dependents) {
          if (!dependents.has(depId)) {
            dependents.add(depId);
            queue.push(depId);
          }
        }
      }
    }

    return Array.from(dependents);
  }

  /**
   * Analyze impact of removing or modifying a beat
   */
  analyzeImpact(beatId: string): ImpactAnalysis {
    const node = this.graph.nodes.get(beatId);
    const directlyAffected = node ? [...node.dependents] : [];
    const transitivelyAffected = this.getAllDependents(beatId).filter(
      id => !directlyAffected.includes(id)
    );

    const totalAffected = directlyAffected.length + transitivelyAffected.length;
    const totalBeats = this.graph.nodes.size;
    const impactScore = totalBeats > 0
      ? Math.round((totalAffected / totalBeats) * 100)
      : 0;

    const warnings: string[] = [];

    // Check for required dependencies
    const { dependents } = this.getBeatDependencies(beatId);
    const requiredDependents = dependents.filter(d => d.strength === 'required');

    if (requiredDependents.length > 0) {
      warnings.push(
        `${requiredDependents.length} beat(s) have a required dependency on this beat`
      );
    }

    if (impactScore > 50) {
      warnings.push('This beat affects more than half of the story');
    }

    return {
      beatId,
      directlyAffected,
      transitivelyAffected,
      impactScore,
      warnings,
    };
  }

  /**
   * Find causality chains in the graph
   */
  findCausalityChains(): CausalityChain[] {
    const chains: CausalityChain[] = [];
    const visited = new Set<string>();

    // Find all source nodes (nodes with no dependencies)
    const sourceNodes: string[] = [];
    for (const [nodeId, node] of this.graph.nodes.entries()) {
      if (node.dependencies.length === 0) {
        sourceNodes.push(nodeId);
      }
    }

    // Trace chains from each source node
    let chainId = 0;
    for (const sourceId of sourceNodes) {
      if (visited.has(sourceId)) continue;

      const chain: string[] = [];
      const queue = [sourceId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;

        visited.add(current);
        chain.push(current);

        const node = this.graph.nodes.get(current);
        if (node && node.dependents.length > 0) {
          // Follow the chain (if single dependent) or mark as branch point
          if (node.dependents.length === 1) {
            queue.push(node.dependents[0]);
          }
        }
      }

      if (chain.length > 1) {
        const sourceNode = this.graph.nodes.get(sourceId);
        chains.push({
          id: `chain_${chainId++}`,
          name: sourceNode?.name || `Chain ${chainId}`,
          beats: chain,
          isComplete: true,
        });
      }
    }

    return chains;
  }

  /**
   * Suggest optimal ordering based on dependencies
   */
  suggestOptimalOrder(): string[] {
    const topOrder = this.getTopologicalOrder();
    if (!topOrder.hasValidOrder) {
      return [];
    }

    // Sort by level first, then by current order within level
    const nodesWithLevels = Array.from(this.graph.nodes.entries()).map(
      ([id, node]) => ({
        id,
        level: topOrder.levels.get(id) || 0,
        currentOrder: node.order,
      })
    );

    nodesWithLevels.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.currentOrder - b.currentOrder;
    });

    return nodesWithLevels.map(n => n.id);
  }

  /**
   * Check if reordering a beat to a new position is valid
   */
  isValidReorder(beatId: string, newOrder: number, currentOrders: Map<string, number>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const node = this.graph.nodes.get(beatId);
    if (!node) {
      return { valid: false, errors: ['Beat not found'] };
    }

    // Get all prerequisite orders
    const prerequisites = this.getAllPrerequisites(beatId);
    for (const prereqId of prerequisites) {
      const prereqOrder = currentOrders.get(prereqId);
      if (prereqOrder !== undefined && prereqOrder >= newOrder) {
        const prereqNode = this.graph.nodes.get(prereqId);
        errors.push(`Cannot place before prerequisite "${prereqNode?.name}"`);
      }
    }

    // Get all dependent orders
    const dependents = this.getAllDependents(beatId);
    for (const depId of dependents) {
      const depOrder = currentOrders.get(depId);
      if (depOrder !== undefined && depOrder <= newOrder) {
        const depNode = this.graph.nodes.get(depId);
        errors.push(`Cannot place after dependent "${depNode?.name}"`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get dependency data for visualization
   */
  getVisualizationData(): {
    nodes: Array<{ id: string; name: string; level: number; dependencies: number; dependents: number }>;
    edges: Array<{ source: string; target: string; type: DependencyType; strength: DependencyStrength }>;
  } {
    const topOrder = this.getTopologicalOrder();

    const nodes = Array.from(this.graph.nodes.entries()).map(([id, node]) => ({
      id,
      name: node.name,
      level: topOrder.levels.get(id) || 0,
      dependencies: node.dependencies.length,
      dependents: node.dependents.length,
    }));

    const edges = this.graph.edges.map(e => ({
      source: e.sourceBeatId,
      target: e.targetBeatId,
      type: e.type,
      strength: e.strength,
    }));

    return { nodes, edges };
  }

  /**
   * Get all dependencies
   */
  getAllDependencies(): Dependency[] {
    return Array.from(this.dependencies.values());
  }

  /**
   * Get dependency by ID
   */
  getDependency(id: string): Dependency | undefined {
    return this.dependencies.get(id);
  }

  /**
   * Update an existing dependency
   */
  updateDependency(
    id: string,
    updates: Partial<Omit<Dependency, 'id'>>
  ): ValidationError | null {
    const existing = this.dependencies.get(id);
    if (!existing) return null;

    // If changing source or target, check for cycles
    if (updates.sourceBeatId || updates.targetBeatId) {
      const newSource = updates.sourceBeatId || existing.sourceBeatId;
      const newTarget = updates.targetBeatId || existing.targetBeatId;

      // Temporarily remove the dependency to check
      this.removeDependency(id);

      if (this.wouldCreateCycle(newSource, newTarget)) {
        // Restore the original dependency
        this.addDependency(existing);
        return {
          type: 'cycle',
          severity: 'error',
          message: 'This change would create a circular dependency',
          affectedBeats: [newSource, newTarget],
        };
      }

      // Re-add with new values
      return this.addDependency({
        ...existing,
        ...updates,
      });
    }

    // Update in place
    const updated = { ...existing, ...updates };
    this.dependencies.set(id, updated);

    // Update edge in graph
    const edgeIndex = this.graph.edges.findIndex(e => e.id === id);
    if (edgeIndex >= 0) {
      this.graph.edges[edgeIndex] = updated;
    }

    return null;
  }
}

// Export singleton instance
export const dependencyManager = new DependencyManager();

export default DependencyManager;
