/**
 * Scene Graph Navigation Hook
 * Provides keyboard navigation for traversing the story graph
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Node, useReactFlow } from 'reactflow';
import { SceneChoice } from '@/app/types/SceneChoice';
import { SceneNodeData } from './useSceneGraphData';

export interface NavigationMap {
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
  siblings: Map<string, string[]>;
  depthToNodes: Map<number, string[]>;
  nodeToDepth: Map<string, number>;
}

export interface UseSceneGraphNavigationOptions {
  enableKeyboardListeners?: boolean;
  onNodeActivate?: (nodeId: string) => void;
  centerOnNavigation?: boolean;
}

interface UseSceneGraphNavigationProps {
  nodes: Node<SceneNodeData>[];
  choices: SceneChoice[];
  currentSceneId: string | null;
  setCurrentSceneId: (id: string) => void;
  firstSceneId: string | null;
  options?: UseSceneGraphNavigationOptions;
}

/**
 * Build navigation maps for keyboard traversal
 */
function buildNavigationMap(
  nodes: Node<SceneNodeData>[],
  choices: SceneChoice[],
  firstSceneId: string | null
): NavigationMap {
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  const nodeToDepth = new Map<string, number>();
  const depthToNodes = new Map<number, string[]>();
  const siblings = new Map<string, string[]>();

  // Initialize empty arrays for all nodes
  nodes.forEach(node => {
    parents.set(node.id, []);
    children.set(node.id, []);
    nodeToDepth.set(node.id, node.data.depth);
  });

  // Build parent/child relationships from choices
  choices.forEach(choice => {
    if (choice.target_scene_id) {
      const sourceChildren = children.get(choice.scene_id) || [];
      if (!sourceChildren.includes(choice.target_scene_id)) {
        sourceChildren.push(choice.target_scene_id);
        children.set(choice.scene_id, sourceChildren);
      }

      const targetParents = parents.get(choice.target_scene_id) || [];
      if (!targetParents.includes(choice.scene_id)) {
        targetParents.push(choice.scene_id);
        parents.set(choice.target_scene_id, targetParents);
      }
    }
  });

  // Group nodes by depth
  nodes.forEach(node => {
    const depth = node.data.depth;
    const nodesAtDepth = depthToNodes.get(depth) || [];
    nodesAtDepth.push(node.id);
    depthToNodes.set(depth, nodesAtDepth);
  });

  // Sort nodes at each depth by y position
  const nodePositions = new Map(nodes.map(n => [n.id, n.position]));
  depthToNodes.forEach((nodeIds, depth) => {
    nodeIds.sort((a, b) => {
      const posA = nodePositions.get(a);
      const posB = nodePositions.get(b);
      return (posA?.y ?? 0) - (posB?.y ?? 0);
    });
    depthToNodes.set(depth, nodeIds);

    // Build sibling relationships
    nodeIds.forEach(nodeId => {
      siblings.set(nodeId, nodeIds.filter(id => id !== nodeId));
    });
  });

  return { parents, children, siblings, depthToNodes, nodeToDepth };
}

export function useSceneGraphNavigation({
  nodes,
  choices,
  currentSceneId,
  setCurrentSceneId,
  firstSceneId,
  options = {},
}: UseSceneGraphNavigationProps) {
  const {
    enableKeyboardListeners = true,
    onNodeActivate,
    centerOnNavigation = false,
  } = options;

  const navMapRef = useRef<NavigationMap | null>(null);

  let reactFlowInstance: ReturnType<typeof useReactFlow> | null = null;
  try {
    reactFlowInstance = useReactFlow();
  } catch {
    // Not inside ReactFlow provider
  }

  const navigationMap = useMemo(() => {
    const map = buildNavigationMap(nodes, choices, firstSceneId);
    navMapRef.current = map;
    return map;
  }, [nodes, choices, firstSceneId]);

  const { parents, children, depthToNodes, nodeToDepth } = navigationMap;

  // Directional navigation
  const navigateRight = useCallback((): string | null => {
    if (!currentSceneId) return null;
    const childNodes = children.get(currentSceneId) || [];
    return childNodes.length > 0 ? childNodes[0] : null;
  }, [currentSceneId, children]);

  const navigateLeft = useCallback((): string | null => {
    if (!currentSceneId) return null;
    const parentNodes = parents.get(currentSceneId) || [];
    return parentNodes.length > 0 ? parentNodes[0] : null;
  }, [currentSceneId, parents]);

  const navigateUp = useCallback((): string | null => {
    if (!currentSceneId) return null;
    const currentDepth = nodeToDepth.get(currentSceneId) ?? -1;
    const nodesAtDepth = depthToNodes.get(currentDepth) || [];
    const currentIndex = nodesAtDepth.indexOf(currentSceneId);
    return currentIndex > 0 ? nodesAtDepth[currentIndex - 1] : null;
  }, [currentSceneId, nodeToDepth, depthToNodes]);

  const navigateDown = useCallback((): string | null => {
    if (!currentSceneId) return null;
    const currentDepth = nodeToDepth.get(currentSceneId) ?? -1;
    const nodesAtDepth = depthToNodes.get(currentDepth) || [];
    const currentIndex = nodesAtDepth.indexOf(currentSceneId);
    return currentIndex < nodesAtDepth.length - 1 ? nodesAtDepth[currentIndex + 1] : null;
  }, [currentSceneId, nodeToDepth, depthToNodes]);

  // Shortcut navigation
  const jumpToStart = useCallback((): string | null => firstSceneId, [firstSceneId]);

  const navigateToNode = useCallback((nodeId: string) => {
    if (!nodeId) return;
    setCurrentSceneId(nodeId);

    if (centerOnNavigation && reactFlowInstance) {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        reactFlowInstance.setCenter(
          node.position.x + 70,
          node.position.y + 50,
          { duration: 300, zoom: reactFlowInstance.getZoom() }
        );
      }
    }
  }, [setCurrentSceneId, centerOnNavigation, reactFlowInstance, nodes]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!currentSceneId || !navMapRef.current) return;

    const target = event.target as HTMLElement;
    const isNodeFocused = target.hasAttribute('data-node-id');
    if (!isNodeFocused) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (onNodeActivate) onNodeActivate(currentSceneId);
      return;
    }

    let nodeId: string | null = null;
    switch (event.key) {
      case 'ArrowRight': nodeId = navigateRight(); break;
      case 'ArrowLeft': nodeId = navigateLeft(); break;
      case 'ArrowUp': nodeId = navigateUp(); break;
      case 'ArrowDown': nodeId = navigateDown(); break;
      case 'Home': nodeId = jumpToStart(); break;
    }

    if (nodeId) {
      event.preventDefault();
      navigateToNode(nodeId);
    }
  }, [currentSceneId, navigateRight, navigateLeft, navigateUp, navigateDown, jumpToStart, navigateToNode, onNodeActivate]);

  useEffect(() => {
    if (!enableKeyboardListeners) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enableKeyboardListeners]);

  return {
    navigateToNode,
    navigationMap,
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,
    jumpToStart,
  };
}
