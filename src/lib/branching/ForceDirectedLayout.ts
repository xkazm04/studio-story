/**
 * ForceDirectedLayout - Force-directed graph layout algorithm
 *
 * Uses physics simulation to position nodes:
 * - Nodes repel each other (prevent overlap)
 * - Edges act as springs (keep connected nodes at optimal distance)
 * - Optional gravity toward center
 * - Hierarchical bias (flow from start to end)
 */

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number | null; // Fixed x position
  fy?: number | null; // Fixed y position
  width: number;
  height: number;
  depth?: number; // Distance from root for hierarchical layout
  isFirst?: boolean;
  isDeadEnd?: boolean;
  isOrphaned?: boolean;
}

export interface LayoutEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
}

export interface LayoutConfig {
  // Force strengths
  repulsionStrength: number;      // Node repulsion (default: 500)
  attractionStrength: number;     // Edge attraction (default: 0.1)
  centeringStrength: number;      // Gravity toward center (default: 0.01)
  hierarchicalStrength: number;   // Pull toward depth-based Y (default: 0.5)

  // Distance constraints
  idealEdgeLength: number;        // Target edge length (default: 200)
  minNodeDistance: number;        // Minimum distance between nodes (default: 100)

  // Layout direction
  direction: 'LR' | 'TB' | 'RL' | 'BT';  // Left-Right, Top-Bottom, etc.

  // Simulation parameters
  iterations: number;             // Max iterations (default: 300)
  coolingFactor: number;          // Velocity dampening (default: 0.95)
  minVelocity: number;            // Stop threshold (default: 0.01)

  // Canvas bounds
  width: number;
  height: number;
  padding: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  repulsionStrength: 500,
  attractionStrength: 0.1,
  centeringStrength: 0.01,
  hierarchicalStrength: 0.5,
  idealEdgeLength: 200,
  minNodeDistance: 100,
  direction: 'LR',
  iterations: 300,
  coolingFactor: 0.95,
  minVelocity: 0.01,
  width: 1200,
  height: 800,
  padding: 50,
};

/**
 * ForceDirectedLayout class
 * Computes optimized node positions using force simulation
 */
export class ForceDirectedLayout {
  private nodes: Map<string, LayoutNode> = new Map();
  private edges: LayoutEdge[] = [];
  private config: LayoutConfig;
  private iteration: number = 0;
  private isRunning: boolean = false;

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize layout with nodes and edges
   */
  initialize(
    nodes: Array<{ id: string; width?: number; height?: number; isFirst?: boolean; isDeadEnd?: boolean; isOrphaned?: boolean }>,
    edges: Array<{ id: string; source: string; target: string; weight?: number }>
  ): void {
    this.nodes.clear();
    this.edges = [...edges];

    // Calculate depth for each node (BFS from first node)
    const depths = this.calculateDepths(nodes, edges);

    // Initialize node positions based on depth
    const { direction, width, height, padding } = this.config;
    const maxDepth = Math.max(...Array.from(depths.values()), 0);

    nodes.forEach((node, index) => {
      const depth = depths.get(node.id) ?? maxDepth + 1;
      let x: number, y: number;

      // Initial position based on depth and direction
      const depthRatio = maxDepth > 0 ? depth / maxDepth : 0;
      const randomOffset = () => (Math.random() - 0.5) * 100;

      switch (direction) {
        case 'LR':
          x = padding + depthRatio * (width - 2 * padding) + randomOffset();
          y = height / 2 + randomOffset();
          break;
        case 'RL':
          x = width - padding - depthRatio * (width - 2 * padding) + randomOffset();
          y = height / 2 + randomOffset();
          break;
        case 'TB':
          x = width / 2 + randomOffset();
          y = padding + depthRatio * (height - 2 * padding) + randomOffset();
          break;
        case 'BT':
          x = width / 2 + randomOffset();
          y = height - padding - depthRatio * (height - 2 * padding) + randomOffset();
          break;
      }

      this.nodes.set(node.id, {
        id: node.id,
        x,
        y,
        vx: 0,
        vy: 0,
        width: node.width ?? 180,
        height: node.height ?? 80,
        depth,
        isFirst: node.isFirst,
        isDeadEnd: node.isDeadEnd,
        isOrphaned: node.isOrphaned,
      });
    });

    this.iteration = 0;
  }

  /**
   * Calculate depth for each node using BFS
   */
  private calculateDepths(
    nodes: Array<{ id: string; isFirst?: boolean }>,
    edges: Array<{ source: string; target: string }>
  ): Map<string, number> {
    const depths = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Build adjacency list
    edges.forEach(edge => {
      if (!adjacency.has(edge.source)) {
        adjacency.set(edge.source, []);
      }
      adjacency.get(edge.source)!.push(edge.target);
    });

    // Find start node
    const startNode = nodes.find(n => n.isFirst);
    if (!startNode) {
      // Fallback: node with no incoming edges
      const hasIncoming = new Set(edges.map(e => e.target));
      const root = nodes.find(n => !hasIncoming.has(n.id));
      if (root) {
        depths.set(root.id, 0);
      }
      return depths;
    }

    // BFS from start
    const queue: Array<{ id: string; depth: number }> = [{ id: startNode.id, depth: 0 }];
    depths.set(startNode.id, 0);

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      const neighbors = adjacency.get(id) ?? [];

      for (const neighbor of neighbors) {
        if (!depths.has(neighbor)) {
          depths.set(neighbor, depth + 1);
          queue.push({ id: neighbor, depth: depth + 1 });
        }
      }
    }

    return depths;
  }

  /**
   * Run the simulation until stable or max iterations reached
   */
  run(): LayoutNode[] {
    this.isRunning = true;

    while (this.isRunning && this.iteration < this.config.iterations) {
      const totalVelocity = this.step();

      if (totalVelocity < this.config.minVelocity) {
        this.isRunning = false;
        break;
      }

      this.iteration++;
    }

    return Array.from(this.nodes.values());
  }

  /**
   * Run a single simulation step
   * Returns total velocity (for convergence detection)
   */
  step(): number {
    const nodes = Array.from(this.nodes.values());

    // Reset forces
    nodes.forEach(node => {
      if (node.fx !== undefined && node.fx !== null) return;
      node.vx = 0;
      node.vy = 0;
    });

    // Apply forces
    this.applyRepulsion(nodes);
    this.applyAttraction(nodes);
    this.applyCentering(nodes);
    this.applyHierarchical(nodes);
    this.applyBoundaryConstraints(nodes);

    // Update positions with cooling
    const coolingFactor = this.config.coolingFactor;
    let totalVelocity = 0;

    nodes.forEach(node => {
      if (node.fx !== undefined && node.fx !== null) {
        node.x = node.fx;
        node.y = node.fy ?? node.y;
        return;
      }

      // Apply velocity with dampening
      node.vx *= coolingFactor;
      node.vy *= coolingFactor;

      // Limit max velocity
      const maxVelocity = 50;
      const velocity = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (velocity > maxVelocity) {
        node.vx = (node.vx / velocity) * maxVelocity;
        node.vy = (node.vy / velocity) * maxVelocity;
      }

      node.x += node.vx;
      node.y += node.vy;

      totalVelocity += Math.abs(node.vx) + Math.abs(node.vy);
    });

    return totalVelocity;
  }

  /**
   * Apply node-node repulsion
   */
  private applyRepulsion(nodes: LayoutNode[]): void {
    const { repulsionStrength, minNodeDistance } = this.config;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        if (nodeA.fx !== undefined || nodeB.fx !== undefined) continue;

        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        // Minimum distance accounting for node sizes
        const combinedRadius = (nodeA.width + nodeB.width) / 2 + minNodeDistance;

        if (distance < combinedRadius * 3) {
          const force = repulsionStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;

          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }
    }
  }

  /**
   * Apply edge spring attraction
   */
  private applyAttraction(nodes: LayoutNode[]): void {
    const { attractionStrength, idealEdgeLength } = this.config;

    for (const edge of this.edges) {
      const source = this.nodes.get(edge.source);
      const target = this.nodes.get(edge.target);

      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;

      // Spring force toward ideal length
      const displacement = distance - idealEdgeLength;
      const force = displacement * attractionStrength * (edge.weight ?? 1);
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      if (source.fx === undefined || source.fx === null) {
        source.vx += fx;
        source.vy += fy;
      }
      if (target.fx === undefined || target.fx === null) {
        target.vx -= fx;
        target.vy -= fy;
      }
    }
  }

  /**
   * Apply centering force (gravity toward center)
   */
  private applyCentering(nodes: LayoutNode[]): void {
    const { centeringStrength, width, height } = this.config;
    const centerX = width / 2;
    const centerY = height / 2;

    for (const node of nodes) {
      if (node.fx !== undefined && node.fx !== null) continue;

      const dx = centerX - node.x;
      const dy = centerY - node.y;

      node.vx += dx * centeringStrength;
      node.vy += dy * centeringStrength;
    }
  }

  /**
   * Apply hierarchical force (pull toward depth-based position)
   */
  private applyHierarchical(nodes: LayoutNode[]): void {
    const { hierarchicalStrength, direction, width, height, padding } = this.config;
    const maxDepth = Math.max(...nodes.map(n => n.depth ?? 0), 0);

    if (maxDepth === 0) return;

    for (const node of nodes) {
      if (node.fx !== undefined && node.fx !== null) continue;
      if (node.depth === undefined) continue;

      const depthRatio = node.depth / maxDepth;
      let targetPos: number;

      switch (direction) {
        case 'LR':
          targetPos = padding + depthRatio * (width - 2 * padding);
          node.vx += (targetPos - node.x) * hierarchicalStrength;
          break;
        case 'RL':
          targetPos = width - padding - depthRatio * (width - 2 * padding);
          node.vx += (targetPos - node.x) * hierarchicalStrength;
          break;
        case 'TB':
          targetPos = padding + depthRatio * (height - 2 * padding);
          node.vy += (targetPos - node.y) * hierarchicalStrength;
          break;
        case 'BT':
          targetPos = height - padding - depthRatio * (height - 2 * padding);
          node.vy += (targetPos - node.y) * hierarchicalStrength;
          break;
      }
    }
  }

  /**
   * Keep nodes within canvas bounds
   */
  private applyBoundaryConstraints(nodes: LayoutNode[]): void {
    const { width, height, padding } = this.config;

    for (const node of nodes) {
      if (node.fx !== undefined && node.fx !== null) continue;

      const halfWidth = node.width / 2;
      const halfHeight = node.height / 2;

      // Bounce back from boundaries
      if (node.x - halfWidth < padding) {
        node.x = padding + halfWidth;
        node.vx = Math.abs(node.vx) * 0.5;
      }
      if (node.x + halfWidth > width - padding) {
        node.x = width - padding - halfWidth;
        node.vx = -Math.abs(node.vx) * 0.5;
      }
      if (node.y - halfHeight < padding) {
        node.y = padding + halfHeight;
        node.vy = Math.abs(node.vy) * 0.5;
      }
      if (node.y + halfHeight > height - padding) {
        node.y = height - padding - halfHeight;
        node.vy = -Math.abs(node.vy) * 0.5;
      }
    }
  }

  /**
   * Get current node positions
   */
  getPositions(): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    this.nodes.forEach((node, id) => {
      positions.set(id, { x: node.x, y: node.y });
    });
    return positions;
  }

  /**
   * Fix a node at a specific position
   */
  fixNode(id: string, x: number, y: number): void {
    const node = this.nodes.get(id);
    if (node) {
      node.fx = x;
      node.fy = y;
      node.x = x;
      node.y = y;
    }
  }

  /**
   * Release a fixed node
   */
  releaseNode(id: string): void {
    const node = this.nodes.get(id);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Get current iteration count
   */
  getIteration(): number {
    return this.iteration;
  }

  /**
   * Check if simulation is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * Create a new force-directed layout instance
 */
export function createForceDirectedLayout(config?: Partial<LayoutConfig>): ForceDirectedLayout {
  return new ForceDirectedLayout(config);
}

/**
 * Compute layout in one call (convenience function)
 */
export function computeForceDirectedLayout(
  nodes: Array<{ id: string; width?: number; height?: number; isFirst?: boolean; isDeadEnd?: boolean; isOrphaned?: boolean }>,
  edges: Array<{ id: string; source: string; target: string; weight?: number }>,
  config?: Partial<LayoutConfig>
): Map<string, { x: number; y: number }> {
  const layout = new ForceDirectedLayout(config);
  layout.initialize(nodes, edges);
  layout.run();
  return layout.getPositions();
}

export default ForceDirectedLayout;
