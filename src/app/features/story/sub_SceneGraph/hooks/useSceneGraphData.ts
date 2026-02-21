/**
 * Scene Graph Data Hook
 * Converts scenes and choices to React Flow nodes and edges
 */

import { useMemo } from 'react';
import { Node, Edge, MarkerType } from 'reactflow';
import { Scene } from '@/app/types/Scene';
import { SceneChoice } from '@/app/types/SceneChoice';
import { computeBatchNodeDimensions, getDimensionsForLayout } from '../lib/nodeDimensions';

export interface SceneNodeData {
  label: string;
  scene: Scene;
  isFirst: boolean;
  isSelected: boolean;
  isOrphaned: boolean;
  isDeadEnd: boolean;
  isComplete: boolean;
  choiceCount: number;
  depth: number;
}

export interface SceneAnalysis {
  orphanedScenes: Set<string>;
  deadEndScenes: Set<string>;
  incompleteScenes: Set<string>;
  choiceCount: Map<string, number>;
  depthMap: Map<string, number>;
}

interface UseSceneGraphDataProps {
  scenes: Scene[];
  choices: SceneChoice[];
  firstSceneId: string | null;
  currentSceneId: string | null;
  collapsedNodes: Set<string>;
}

function analyzeScenes(
  scenes: Scene[],
  choices: SceneChoice[],
  firstSceneId: string | null
): SceneAnalysis {
  const orphanedScenes = new Set<string>();
  const deadEndScenes = new Set<string>();
  const incompleteScenes = new Set<string>();
  const choiceCount = new Map<string, number>();
  const depthMap = new Map<string, number>();

  const sceneIds = new Set(scenes.map(s => s.id));
  const hasIncoming = new Set<string>();
  const hasOutgoing = new Set<string>();

  // Analyze choices
  for (const choice of choices) {
    if (sceneIds.has(choice.scene_id)) {
      hasOutgoing.add(choice.scene_id);
      const count = choiceCount.get(choice.scene_id) || 0;
      choiceCount.set(choice.scene_id, count + 1);
    }
    if (choice.target_scene_id && sceneIds.has(choice.target_scene_id)) {
      hasIncoming.add(choice.target_scene_id);
    }
  }

  // Calculate depths using BFS
  if (firstSceneId && sceneIds.has(firstSceneId)) {
    const queue: Array<{ id: string; depth: number }> = [{ id: firstSceneId, depth: 0 }];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      depthMap.set(id, depth);

      // Find outgoing choices
      for (const choice of choices) {
        if (choice.scene_id === id && choice.target_scene_id && !visited.has(choice.target_scene_id)) {
          queue.push({ id: choice.target_scene_id, depth: depth + 1 });
        }
      }
    }
  }

  // Detect issues
  for (const scene of scenes) {
    // Orphaned: no incoming connections (except first scene)
    if (scene.id !== firstSceneId && !hasIncoming.has(scene.id)) {
      orphanedScenes.add(scene.id);
    }
    // Dead end: no outgoing choices
    if (!hasOutgoing.has(scene.id)) {
      deadEndScenes.add(scene.id);
    }
    // Incomplete: missing content or image
    if (!scene.content && !scene.description) {
      incompleteScenes.add(scene.id);
    }
  }

  return { orphanedScenes, deadEndScenes, incompleteScenes, choiceCount, depthMap };
}

export function useSceneGraphData({
  scenes,
  choices,
  firstSceneId,
  currentSceneId,
  collapsedNodes,
}: UseSceneGraphDataProps) {
  return useMemo(() => {
    if (scenes.length === 0) {
      return { nodes: [], edges: [], analysis: analyzeScenes([], [], null) };
    }

    const analysis = analyzeScenes(scenes, choices, firstSceneId);
    const dimensions = computeBatchNodeDimensions(scenes);

    // Create nodes
    const nodes: Node<SceneNodeData>[] = scenes.map((scene, index) => {
      const dims = getDimensionsForLayout(scene.id, dimensions);
      const depth = analysis.depthMap.get(scene.id) ?? index;

      return {
        id: scene.id,
        type: 'sceneNode',
        position: { x: depth * 280, y: index * 120 },
        data: {
          label: scene.name || 'Untitled',
          scene,
          isFirst: scene.id === firstSceneId,
          isSelected: scene.id === currentSceneId,
          isOrphaned: analysis.orphanedScenes.has(scene.id),
          isDeadEnd: analysis.deadEndScenes.has(scene.id),
          isComplete: !analysis.incompleteScenes.has(scene.id),
          choiceCount: analysis.choiceCount.get(scene.id) || 0,
          depth,
        },
        style: { width: dims.width, height: dims.height },
      };
    });

    // Create edges
    const edges: Edge[] = choices
      .filter(c => c.target_scene_id)
      .map(choice => ({
        id: choice.id,
        source: choice.scene_id,
        target: choice.target_scene_id!,
        label: choice.label,
        type: 'smoothstep',
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#64748b', strokeWidth: 2 },
      }));

    return { nodes, edges, analysis };
  }, [scenes, choices, firstSceneId, currentSceneId, collapsedNodes]);
}
