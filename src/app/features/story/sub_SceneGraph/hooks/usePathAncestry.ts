/**
 * Path Ancestry Hook
 * Calculates the ancestry path from root to selected scene
 */

import { useMemo } from 'react';
import { SceneChoice } from '@/app/types/SceneChoice';

export interface PathAncestryResult {
  /** Set of scene IDs on the path from root to current selection */
  pathNodeIds: Set<string>;
  /** Set of edge (choice) IDs on the path from root to current selection */
  pathEdgeIds: Set<string>;
  /** Ordered array of scene IDs from root to current */
  orderedPath: string[];
}

/**
 * Calculates the ancestry path from the root (first scene) to the currently selected scene.
 * Used to highlight the narrative lineage in the story graph.
 *
 * Uses BFS backwards from the selected scene to find the shortest path to root.
 *
 * @param currentSceneId The currently selected scene ID
 * @param firstSceneId The root/first scene ID of the story
 * @param choices All choices in the story (used to build parent map)
 * @returns PathAncestryResult with sets of scene and edge IDs on the path
 */
export function usePathAncestry(
  currentSceneId: string | null,
  firstSceneId: string | null,
  choices: SceneChoice[]
): PathAncestryResult {
  return useMemo(() => {
    const emptyResult: PathAncestryResult = {
      pathNodeIds: new Set(),
      pathEdgeIds: new Set(),
      orderedPath: [],
    };

    // If no selection or no root, return empty
    if (!currentSceneId || !firstSceneId) {
      return emptyResult;
    }

    // If the current scene IS the root, just return it
    if (currentSceneId === firstSceneId) {
      return {
        pathNodeIds: new Set([firstSceneId]),
        pathEdgeIds: new Set(),
        orderedPath: [firstSceneId],
      };
    }

    // Build parent map: childId -> { parentId, choiceId }
    const parentMap = new Map<string, { parentId: string; choiceId: string }[]>();

    for (const choice of choices) {
      if (choice.target_scene_id) {
        const parents = parentMap.get(choice.target_scene_id) || [];
        parents.push({ parentId: choice.scene_id, choiceId: choice.id });
        parentMap.set(choice.target_scene_id, parents);
      }
    }

    // BFS from currentSceneId backwards to find path to firstSceneId
    const queue: { nodeId: string; path: string[]; edgePath: string[] }[] = [
      { nodeId: currentSceneId, path: [currentSceneId], edgePath: [] },
    ];
    const visited = new Set<string>([currentSceneId]);

    while (queue.length > 0) {
      const { nodeId, path, edgePath } = queue.shift()!;

      // Check if we reached the root
      if (nodeId === firstSceneId) {
        const orderedPath = path.reverse();
        const reversedEdgePath = edgePath.reverse();

        return {
          pathNodeIds: new Set(orderedPath),
          pathEdgeIds: new Set(reversedEdgePath),
          orderedPath,
        };
      }

      // Get parents of current scene
      const parents = parentMap.get(nodeId) || [];

      for (const { parentId, choiceId } of parents) {
        if (!visited.has(parentId)) {
          visited.add(parentId);
          queue.push({
            nodeId: parentId,
            path: [...path, parentId],
            edgePath: [...edgePath, choiceId],
          });
        }
      }
    }

    // No path found (orphaned scene or disconnected graph)
    return {
      pathNodeIds: new Set([currentSceneId]),
      pathEdgeIds: new Set(),
      orderedPath: [currentSceneId],
    };
  }, [currentSceneId, firstSceneId, choices]);
}
