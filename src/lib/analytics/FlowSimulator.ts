'use strict';

import type { Scene } from '@/app/types/Scene';
import type { SceneChoice } from '@/app/types/SceneChoice';

// Types for flow simulation
export interface SimulationConfig {
  iterations: number;
  playerBehavior: PlayerBehaviorModel;
  randomSeed?: number;
}

export interface PlayerBehaviorModel {
  type: 'uniform' | 'weighted' | 'exploration' | 'optimal';
  explorationFactor?: number; // 0-1, higher = more exploration
  choiceWeights?: Map<string, number>; // Custom weights per choice
  preferredTags?: string[]; // Tags that influence choice
}

export interface FlowResult {
  sceneVisits: Map<string, number>;
  choiceSelections: Map<string, number>;
  pathFrequencies: Map<string, number>;
  averagePathLength: number;
  medianPathLength: number;
  completionRate: number;
  dropOffPoints: DropOffPoint[];
  criticalPaths: CriticalPath[];
  bottlenecks: Bottleneck[];
}

export interface DropOffPoint {
  sceneId: string;
  sceneName: string;
  dropOffRate: number;
  totalVisits: number;
  exits: number;
}

export interface CriticalPath {
  path: string[];
  frequency: number;
  percentage: number;
}

export interface Bottleneck {
  sceneId: string;
  sceneName: string;
  throughput: number;
  isRequired: boolean;
}

export interface CoverageReport {
  totalScenes: number;
  reachableScenes: number;
  visitedScenes: number;
  coveragePercentage: number;
  unreachableScenes: UnreachableScene[];
  rarelyVisitedScenes: RarelyVisitedScene[];
  neverVisitedScenes: string[];
  depthDistribution: Map<number, number>;
}

export interface UnreachableScene {
  sceneId: string;
  sceneName: string;
  reason: 'orphaned' | 'gated' | 'hidden';
}

export interface RarelyVisitedScene {
  sceneId: string;
  sceneName: string;
  visitRate: number;
  depth: number;
}

export interface DecisionDistribution {
  sceneId: string;
  sceneName: string;
  choices: ChoiceDistribution[];
  totalDecisions: number;
  entropy: number; // Measure of decision randomness
}

export interface ChoiceDistribution {
  choiceId: string;
  label: string;
  targetSceneId: string | null;
  selections: number;
  percentage: number;
  appealScore: number;
}

export interface HeatmapData {
  nodes: NodeHeat[];
  edges: EdgeHeat[];
  maxVisits: number;
  minVisits: number;
}

export interface NodeHeat {
  sceneId: string;
  visits: number;
  normalizedHeat: number; // 0-1
  heatColor: string;
}

export interface EdgeHeat {
  choiceId: string;
  sourceId: string;
  targetId: string;
  selections: number;
  normalizedHeat: number;
  heatColor: string;
}

export interface PathStatistics {
  shortestPath: number;
  longestPath: number;
  averagePath: number;
  medianPath: number;
  standardDeviation: number;
  pathLengthDistribution: Map<number, number>;
}

// Simple seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
}

/**
 * FlowSimulator - Monte Carlo simulation for player behavior modeling
 *
 * Simulates player flow through branching narratives to:
 * - Predict decision distributions
 * - Identify bottlenecks and critical paths
 * - Calculate coverage metrics
 * - Generate heatmap data for visualization
 */
class FlowSimulatorClass {
  private static instance: FlowSimulatorClass;

  private constructor() {}

  static getInstance(): FlowSimulatorClass {
    if (!FlowSimulatorClass.instance) {
      FlowSimulatorClass.instance = new FlowSimulatorClass();
    }
    return FlowSimulatorClass.instance;
  }

  /**
   * Run Monte Carlo simulation for player flow
   */
  simulate(
    scenes: Scene[],
    choices: SceneChoice[],
    firstSceneId: string | null,
    config: SimulationConfig
  ): FlowResult {
    const sceneMap = new Map(scenes.map(s => [s.id, s]));
    const choicesByScene = this.buildChoiceIndex(choices);
    const rng = new SeededRandom(config.randomSeed ?? Date.now());

    const sceneVisits = new Map<string, number>();
    const choiceSelections = new Map<string, number>();
    const pathCounts = new Map<string, number>();
    const pathLengths: number[] = [];
    let completions = 0;

    // Initialize counts
    scenes.forEach(s => sceneVisits.set(s.id, 0));
    choices.forEach(c => choiceSelections.set(c.id, 0));

    if (!firstSceneId) {
      return this.createEmptyResult();
    }

    // Run simulations
    for (let i = 0; i < config.iterations; i++) {
      const { path, completed } = this.simulateSingleRun(
        firstSceneId,
        sceneMap,
        choicesByScene,
        config.playerBehavior,
        rng
      );

      // Record visits
      path.forEach(sceneId => {
        sceneVisits.set(sceneId, (sceneVisits.get(sceneId) ?? 0) + 1);
      });

      // Record path
      const pathKey = path.join('->');
      pathCounts.set(pathKey, (pathCounts.get(pathKey) ?? 0) + 1);
      pathLengths.push(path.length);

      if (completed) {
        completions++;
      }
    }

    // Calculate statistics
    const sortedLengths = [...pathLengths].sort((a, b) => a - b);
    const avgLength = pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length;
    const medianLength = sortedLengths[Math.floor(sortedLengths.length / 2)];

    // Find critical paths (top 10 most common)
    const criticalPaths = this.findCriticalPaths(pathCounts, config.iterations);

    // Find bottlenecks
    const bottlenecks = this.findBottlenecks(sceneVisits, sceneMap, config.iterations);

    // Find drop-off points
    const dropOffPoints = this.findDropOffPoints(
      sceneVisits,
      choicesByScene,
      sceneMap,
      config.iterations
    );

    return {
      sceneVisits,
      choiceSelections,
      pathFrequencies: pathCounts,
      averagePathLength: avgLength,
      medianPathLength: medianLength,
      completionRate: completions / config.iterations,
      dropOffPoints,
      criticalPaths,
      bottlenecks,
    };
  }

  /**
   * Simulate a single player run through the narrative
   */
  private simulateSingleRun(
    startSceneId: string,
    sceneMap: Map<string, Scene>,
    choicesByScene: Map<string, SceneChoice[]>,
    behavior: PlayerBehaviorModel,
    rng: SeededRandom
  ): { path: string[]; completed: boolean; choicesMade: string[] } {
    const path: string[] = [];
    const choicesMade: string[] = [];
    const visited = new Set<string>();
    let currentSceneId: string | null = startSceneId;
    const maxSteps = 1000; // Prevent infinite loops
    let steps = 0;

    while (currentSceneId && steps < maxSteps) {
      path.push(currentSceneId);
      visited.add(currentSceneId);
      steps++;

      const sceneChoices = choicesByScene.get(currentSceneId) ?? [];

      if (sceneChoices.length === 0) {
        // Dead end - narrative complete
        return { path, completed: true, choicesMade };
      }

      // Filter choices with valid targets that haven't been visited (to avoid loops)
      const validChoices = sceneChoices.filter(
        c => c.target_scene_id && !visited.has(c.target_scene_id)
      );

      if (validChoices.length === 0) {
        // All paths lead to visited scenes - stuck
        return { path, completed: false, choicesMade };
      }

      // Select next choice based on behavior model
      const selectedChoice = this.selectChoice(validChoices, behavior, rng);
      choicesMade.push(selectedChoice.id);
      currentSceneId = selectedChoice.target_scene_id;
    }

    return { path, completed: false, choicesMade };
  }

  /**
   * Select a choice based on player behavior model
   */
  private selectChoice(
    choices: SceneChoice[],
    behavior: PlayerBehaviorModel,
    rng: SeededRandom
  ): SceneChoice {
    switch (behavior.type) {
      case 'uniform':
        return choices[Math.floor(rng.next() * choices.length)];

      case 'weighted':
        return this.selectWeighted(choices, behavior.choiceWeights ?? new Map(), rng);

      case 'exploration':
        return this.selectExploration(choices, behavior.explorationFactor ?? 0.5, rng);

      case 'optimal':
        // Always pick first choice (assuming ordered by preference)
        return choices[0];

      default:
        return choices[Math.floor(rng.next() * choices.length)];
    }
  }

  private selectWeighted(
    choices: SceneChoice[],
    weights: Map<string, number>,
    rng: SeededRandom
  ): SceneChoice {
    const weightedChoices = choices.map(c => ({
      choice: c,
      weight: weights.get(c.id) ?? 1,
    }));

    const totalWeight = weightedChoices.reduce((sum, wc) => sum + wc.weight, 0);
    let random = rng.next() * totalWeight;

    for (const wc of weightedChoices) {
      random -= wc.weight;
      if (random <= 0) {
        return wc.choice;
      }
    }

    return choices[choices.length - 1];
  }

  private selectExploration(
    choices: SceneChoice[],
    explorationFactor: number,
    rng: SeededRandom
  ): SceneChoice {
    // Higher exploration = more likely to pick later options
    // Lower exploration = more likely to pick first option
    const weights = choices.map((_, index) => {
      const position = index / (choices.length - 1 || 1);
      return 1 - explorationFactor + explorationFactor * 2 * position;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = rng.next() * totalWeight;

    for (let i = 0; i < choices.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return choices[i];
      }
    }

    return choices[choices.length - 1];
  }

  /**
   * Calculate decision distribution for each scene
   */
  calculateDecisionDistribution(
    scenes: Scene[],
    choices: SceneChoice[],
    flowResult: FlowResult
  ): DecisionDistribution[] {
    const choicesByScene = this.buildChoiceIndex(choices);
    const distributions: DecisionDistribution[] = [];

    for (const scene of scenes) {
      const sceneChoices = choicesByScene.get(scene.id) ?? [];
      if (sceneChoices.length === 0) continue;

      const totalDecisions = sceneChoices.reduce(
        (sum, c) => sum + (flowResult.choiceSelections.get(c.id) ?? 0),
        0
      );

      const choiceDistributions: ChoiceDistribution[] = sceneChoices.map(choice => {
        const selections = flowResult.choiceSelections.get(choice.id) ?? 0;
        const percentage = totalDecisions > 0 ? (selections / totalDecisions) * 100 : 0;

        return {
          choiceId: choice.id,
          label: choice.label,
          targetSceneId: choice.target_scene_id,
          selections,
          percentage,
          appealScore: this.calculateAppealScore(choice, selections, totalDecisions),
        };
      });

      // Calculate entropy (measure of decision randomness)
      const entropy = this.calculateEntropy(choiceDistributions);

      distributions.push({
        sceneId: scene.id,
        sceneName: scene.name,
        choices: choiceDistributions,
        totalDecisions,
        entropy,
      });
    }

    return distributions;
  }

  private calculateAppealScore(
    choice: SceneChoice,
    selections: number,
    totalDecisions: number
  ): number {
    if (totalDecisions === 0) return 0.5;

    // Base appeal from selection rate
    const selectionRate = selections / totalDecisions;

    // Adjust based on label length (shorter labels often more appealing)
    const labelFactor = Math.max(0.8, 1 - choice.label.length / 100);

    return Math.min(1, selectionRate * labelFactor);
  }

  private calculateEntropy(choices: ChoiceDistribution[]): number {
    if (choices.length <= 1) return 0;

    const probabilities = choices
      .map(c => c.percentage / 100)
      .filter(p => p > 0);

    if (probabilities.length === 0) return 0;

    const entropy = -probabilities.reduce(
      (sum, p) => sum + p * Math.log2(p),
      0
    );

    // Normalize by max possible entropy
    const maxEntropy = Math.log2(choices.length);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  /**
   * Generate heatmap data for visualization
   */
  generateHeatmapData(
    scenes: Scene[],
    choices: SceneChoice[],
    flowResult: FlowResult
  ): HeatmapData {
    const visits = Array.from(flowResult.sceneVisits.values());
    const maxVisits = Math.max(...visits, 1);
    const minVisits = Math.min(...visits.filter(v => v > 0), 1);

    const nodes: NodeHeat[] = scenes.map(scene => {
      const sceneVisits = flowResult.sceneVisits.get(scene.id) ?? 0;
      const normalizedHeat = maxVisits > minVisits
        ? (sceneVisits - minVisits) / (maxVisits - minVisits)
        : sceneVisits > 0 ? 1 : 0;

      return {
        sceneId: scene.id,
        visits: sceneVisits,
        normalizedHeat,
        heatColor: this.getHeatColor(normalizedHeat),
      };
    });

    const selections = Array.from(flowResult.choiceSelections.values());
    const maxSelections = Math.max(...selections, 1);
    const minSelections = Math.min(...selections.filter(s => s > 0), 1);

    const edges: EdgeHeat[] = choices
      .filter(c => c.target_scene_id)
      .map(choice => {
        const choiceSelections = flowResult.choiceSelections.get(choice.id) ?? 0;
        const normalizedHeat = maxSelections > minSelections
          ? (choiceSelections - minSelections) / (maxSelections - minSelections)
          : choiceSelections > 0 ? 1 : 0;

        return {
          choiceId: choice.id,
          sourceId: choice.scene_id,
          targetId: choice.target_scene_id!,
          selections: choiceSelections,
          normalizedHeat,
          heatColor: this.getHeatColor(normalizedHeat),
        };
      });

    return { nodes, edges, maxVisits, minVisits };
  }

  private getHeatColor(normalizedHeat: number): string {
    // Cold (blue) to hot (red) gradient
    if (normalizedHeat < 0.25) {
      return `rgba(59, 130, 246, ${0.3 + normalizedHeat * 2})`; // Blue
    } else if (normalizedHeat < 0.5) {
      return `rgba(34, 197, 94, ${0.5 + normalizedHeat})`; // Green
    } else if (normalizedHeat < 0.75) {
      return `rgba(234, 179, 8, ${0.6 + normalizedHeat * 0.4})`; // Yellow
    } else {
      return `rgba(239, 68, 68, ${0.7 + normalizedHeat * 0.3})`; // Red
    }
  }

  /**
   * Generate coverage report
   */
  generateCoverageReport(
    scenes: Scene[],
    choices: SceneChoice[],
    firstSceneId: string | null,
    flowResult: FlowResult
  ): CoverageReport {
    const reachableScenes = this.findReachableScenes(scenes, choices, firstSceneId);
    const visitedScenes = new Set(
      Array.from(flowResult.sceneVisits.entries())
        .filter(([_, visits]) => visits > 0)
        .map(([id]) => id)
    );

    const unreachableScenes: UnreachableScene[] = scenes
      .filter(s => !reachableScenes.has(s.id))
      .map(s => ({
        sceneId: s.id,
        sceneName: s.name,
        reason: 'orphaned' as const,
      }));

    const totalVisits = Array.from(flowResult.sceneVisits.values()).reduce((a, b) => a + b, 0);
    const avgVisits = totalVisits / scenes.length;

    const rarelyVisitedScenes: RarelyVisitedScene[] = scenes
      .filter(s => {
        const visits = flowResult.sceneVisits.get(s.id) ?? 0;
        return visits > 0 && visits < avgVisits * 0.1;
      })
      .map(s => ({
        sceneId: s.id,
        sceneName: s.name,
        visitRate: (flowResult.sceneVisits.get(s.id) ?? 0) / totalVisits,
        depth: this.calculateDepth(s.id, scenes, choices, firstSceneId),
      }));

    const neverVisitedScenes = scenes
      .filter(s => (flowResult.sceneVisits.get(s.id) ?? 0) === 0)
      .map(s => s.id);

    const depthDistribution = this.calculateDepthDistribution(scenes, choices, firstSceneId);

    return {
      totalScenes: scenes.length,
      reachableScenes: reachableScenes.size,
      visitedScenes: visitedScenes.size,
      coveragePercentage: scenes.length > 0 ? (visitedScenes.size / scenes.length) * 100 : 0,
      unreachableScenes,
      rarelyVisitedScenes,
      neverVisitedScenes,
      depthDistribution,
    };
  }

  /**
   * Calculate path statistics
   */
  calculatePathStatistics(flowResult: FlowResult): PathStatistics {
    const pathLengths: number[] = [];

    flowResult.pathFrequencies.forEach((count, pathKey) => {
      const length = pathKey.split('->').length;
      for (let i = 0; i < count; i++) {
        pathLengths.push(length);
      }
    });

    if (pathLengths.length === 0) {
      return {
        shortestPath: 0,
        longestPath: 0,
        averagePath: 0,
        medianPath: 0,
        standardDeviation: 0,
        pathLengthDistribution: new Map(),
      };
    }

    const sorted = [...pathLengths].sort((a, b) => a - b);
    const avg = pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length;
    const variance = pathLengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / pathLengths.length;

    const distribution = new Map<number, number>();
    pathLengths.forEach(length => {
      distribution.set(length, (distribution.get(length) ?? 0) + 1);
    });

    return {
      shortestPath: sorted[0],
      longestPath: sorted[sorted.length - 1],
      averagePath: avg,
      medianPath: sorted[Math.floor(sorted.length / 2)],
      standardDeviation: Math.sqrt(variance),
      pathLengthDistribution: distribution,
    };
  }

  // Helper methods

  private buildChoiceIndex(choices: SceneChoice[]): Map<string, SceneChoice[]> {
    const index = new Map<string, SceneChoice[]>();
    choices.forEach(choice => {
      const existing = index.get(choice.scene_id) ?? [];
      existing.push(choice);
      index.set(choice.scene_id, existing);
    });
    return index;
  }

  private findCriticalPaths(
    pathCounts: Map<string, number>,
    totalIterations: number
  ): CriticalPath[] {
    return Array.from(pathCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pathKey, frequency]) => ({
        path: pathKey.split('->'),
        frequency,
        percentage: (frequency / totalIterations) * 100,
      }));
  }

  private findBottlenecks(
    sceneVisits: Map<string, number>,
    sceneMap: Map<string, Scene>,
    totalIterations: number
  ): Bottleneck[] {
    return Array.from(sceneVisits.entries())
      .filter(([_, visits]) => visits > totalIterations * 0.8) // 80%+ visits
      .map(([sceneId, visits]) => ({
        sceneId,
        sceneName: sceneMap.get(sceneId)?.name ?? 'Unknown',
        throughput: visits / totalIterations,
        isRequired: visits === totalIterations,
      }))
      .sort((a, b) => b.throughput - a.throughput);
  }

  private findDropOffPoints(
    sceneVisits: Map<string, number>,
    choicesByScene: Map<string, SceneChoice[]>,
    sceneMap: Map<string, Scene>,
    totalIterations: number
  ): DropOffPoint[] {
    const dropOffs: DropOffPoint[] = [];

    sceneVisits.forEach((visits, sceneId) => {
      const choices = choicesByScene.get(sceneId) ?? [];
      if (choices.length === 0) {
        // Dead end scenes are natural endpoints, not drop-offs
        return;
      }

      // Calculate expected exits vs actual
      const scene = sceneMap.get(sceneId);
      if (!scene || visits < totalIterations * 0.1) return;

      // High visit count but low continuation could indicate drop-off
      const exitRate = 1 - (visits / totalIterations);
      if (exitRate > 0.3) {
        dropOffs.push({
          sceneId,
          sceneName: scene.name,
          dropOffRate: exitRate,
          totalVisits: visits,
          exits: Math.floor(visits * exitRate),
        });
      }
    });

    return dropOffs.sort((a, b) => b.dropOffRate - a.dropOffRate);
  }

  private findReachableScenes(
    scenes: Scene[],
    choices: SceneChoice[],
    firstSceneId: string | null
  ): Set<string> {
    if (!firstSceneId) return new Set();

    const reachable = new Set<string>();
    const queue = [firstSceneId];
    const choicesByScene = this.buildChoiceIndex(choices);

    while (queue.length > 0) {
      const sceneId = queue.shift()!;
      if (reachable.has(sceneId)) continue;
      reachable.add(sceneId);

      const sceneChoices = choicesByScene.get(sceneId) ?? [];
      sceneChoices.forEach(choice => {
        if (choice.target_scene_id && !reachable.has(choice.target_scene_id)) {
          queue.push(choice.target_scene_id);
        }
      });
    }

    return reachable;
  }

  private calculateDepth(
    targetSceneId: string,
    scenes: Scene[],
    choices: SceneChoice[],
    firstSceneId: string | null
  ): number {
    if (!firstSceneId || targetSceneId === firstSceneId) return 0;

    const choicesByScene = this.buildChoiceIndex(choices);
    const depths = new Map<string, number>();
    const queue = [{ id: firstSceneId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depths.has(id)) continue;
      depths.set(id, depth);

      if (id === targetSceneId) return depth;

      const sceneChoices = choicesByScene.get(id) ?? [];
      sceneChoices.forEach(choice => {
        if (choice.target_scene_id && !depths.has(choice.target_scene_id)) {
          queue.push({ id: choice.target_scene_id, depth: depth + 1 });
        }
      });
    }

    return depths.get(targetSceneId) ?? -1;
  }

  private calculateDepthDistribution(
    scenes: Scene[],
    choices: SceneChoice[],
    firstSceneId: string | null
  ): Map<number, number> {
    const distribution = new Map<number, number>();

    scenes.forEach(scene => {
      const depth = this.calculateDepth(scene.id, scenes, choices, firstSceneId);
      if (depth >= 0) {
        distribution.set(depth, (distribution.get(depth) ?? 0) + 1);
      }
    });

    return distribution;
  }

  private createEmptyResult(): FlowResult {
    return {
      sceneVisits: new Map(),
      choiceSelections: new Map(),
      pathFrequencies: new Map(),
      averagePathLength: 0,
      medianPathLength: 0,
      completionRate: 0,
      dropOffPoints: [],
      criticalPaths: [],
      bottlenecks: [],
    };
  }
}

export const flowSimulator = FlowSimulatorClass.getInstance();
export default flowSimulator;
