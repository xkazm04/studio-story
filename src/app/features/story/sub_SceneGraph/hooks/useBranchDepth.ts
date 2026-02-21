/**
 * Branch Depth Hook
 * Calculates branch depth progression for progress visualization
 */

import { useMemo } from 'react';
import { SceneAnalysis } from './useSceneGraphData';

export interface BranchDepthData {
  /** Current depth of the selected scene (0-indexed from root) */
  currentDepth: number;
  /** Maximum depth reachable in the story from root */
  maxDepthInBranch: number;
  /** Whether the current scene is a terminal scene (dead end) */
  isTerminal: boolean;
  /** Progress percentage (0-100) */
  progressPercent: number;
}

/**
 * Calculate the maximum depth reachable from a starting scene via DFS
 */
function getMaxDepthFromScene(
  sceneId: string,
  depthMap: Map<string, number>,
  childrenMap: Map<string, string[]>,
  visited: Set<string> = new Set()
): number {
  if (visited.has(sceneId)) return depthMap.get(sceneId) ?? 0;
  visited.add(sceneId);

  const sceneDepth = depthMap.get(sceneId) ?? 0;
  const children = childrenMap.get(sceneId) || [];

  if (children.length === 0) {
    return sceneDepth;
  }

  let maxChildDepth = sceneDepth;
  for (const childId of children) {
    const childMaxDepth = getMaxDepthFromScene(childId, depthMap, childrenMap, visited);
    maxChildDepth = Math.max(maxChildDepth, childMaxDepth);
  }

  return maxChildDepth;
}

/**
 * Build children map from scene analysis
 */
function buildChildrenMap(
  choiceCount: Map<string, number>,
  depthMap: Map<string, number>
): Map<string, string[]> {
  const childrenMap = new Map<string, string[]>();

  // Initialize empty arrays for all scenes
  for (const sceneId of depthMap.keys()) {
    childrenMap.set(sceneId, []);
  }

  return childrenMap;
}

/**
 * useBranchDepth - Hook to calculate branch depth progression data
 *
 * Computes the current scene's depth and the maximum depth reachable
 * in the story for progress visualization.
 *
 * @param currentSceneId The currently selected scene ID
 * @param firstSceneId The root/first scene ID of the story
 * @param analysis Scene analysis containing depth and children maps
 * @returns BranchDepthData with current depth, max depth, and terminal status
 */
export function useBranchDepth(
  currentSceneId: string | null,
  firstSceneId: string | null,
  analysis: SceneAnalysis
): BranchDepthData {
  return useMemo(() => {
    const defaultData: BranchDepthData = {
      currentDepth: 0,
      maxDepthInBranch: 0,
      isTerminal: false,
      progressPercent: 0,
    };

    if (!currentSceneId || !firstSceneId) {
      return defaultData;
    }

    const currentDepth = analysis.depthMap.get(currentSceneId) ?? 0;
    const isTerminal = analysis.deadEndScenes.has(currentSceneId);

    // Find max depth in the entire graph
    let maxDepth = 0;
    for (const depth of analysis.depthMap.values()) {
      maxDepth = Math.max(maxDepth, depth);
    }

    // Calculate progress percentage
    const progressPercent = maxDepth > 0
      ? Math.round((currentDepth / maxDepth) * 100)
      : 0;

    return {
      currentDepth,
      maxDepthInBranch: maxDepth,
      isTerminal,
      progressPercent,
    };
  }, [currentSceneId, firstSceneId, analysis]);
}

/**
 * Calculate depth statistics for the entire graph
 */
export function useGraphDepthStats(analysis: SceneAnalysis) {
  return useMemo(() => {
    let maxDepth = 0;
    let totalScenes = 0;
    const scenesByDepth = new Map<number, number>();

    for (const [sceneId, depth] of analysis.depthMap.entries()) {
      maxDepth = Math.max(maxDepth, depth);
      totalScenes++;

      const count = scenesByDepth.get(depth) || 0;
      scenesByDepth.set(depth, count + 1);
    }

    // Calculate average branching factor
    let totalBranches = 0;
    for (const count of analysis.choiceCount.values()) {
      totalBranches += count;
    }
    const avgBranching = totalScenes > 0
      ? totalBranches / totalScenes
      : 0;

    return {
      maxDepth,
      totalScenes,
      scenesByDepth,
      avgBranching: Math.round(avgBranching * 10) / 10,
      orphanCount: analysis.orphanedScenes.size,
      deadEndCount: analysis.deadEndScenes.size,
      incompleteCount: analysis.incompleteScenes.size,
    };
  }, [analysis]);
}
