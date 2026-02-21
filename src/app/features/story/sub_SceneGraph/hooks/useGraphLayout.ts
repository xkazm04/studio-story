/**
 * Graph Layout Hook
 * Creates hierarchical layout using dagre for scene graph visualization
 */

import dagre from 'dagre';
import { Scene } from '@/app/types/Scene';
import { SceneChoice } from '@/app/types/SceneChoice';
import {
  NodeDimensions,
  BASE_NODE_WIDTH,
  NODE_HEADER_HEIGHT,
  MIN_TITLE_HEIGHT,
  NODE_FOOTER_HEIGHT,
  NODE_PADDING_Y,
} from '../lib/nodeDimensions';
import { SceneAnalysis } from './useSceneGraphData';

// Default node dimensions
export const NODE_WIDTH = BASE_NODE_WIDTH;
export const NODE_HEIGHT = NODE_HEADER_HEIGHT + MIN_TITLE_HEIGHT + NODE_FOOTER_HEIGHT + NODE_PADDING_Y;

// Layout spacing optimized for decision trees
export const RANK_SEPARATION = 250;
export const NODE_SEPARATION = 60;
export const EDGE_SEPARATION = 25;

// Edge styling for visual hierarchy
export const EDGE_COLORS = {
  branch1: { hue: 220, sat: 60, light: 50 },
  branch2: { hue: 160, sat: 50, light: 45 },
  branch3: { hue: 280, sat: 50, light: 55 },
  single: { hue: 210, sat: 30, light: 55 },
};

export interface NodePosition {
  x: number;
  y: number;
}

export interface LayoutResult {
  nodePositions: Map<string, NodePosition>;
}

/**
 * Creates a hierarchical layout optimized for decision trees
 * Left-to-right flow with depth-based ranking
 */
export function createHierarchicalLayout(
  scenes: Scene[],
  choices: SceneChoice[],
  analysis: SceneAnalysis,
  nodeDimensions?: Map<string, NodeDimensions>
): LayoutResult {
  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: 'LR',
    align: 'UL',
    ranksep: RANK_SEPARATION,
    nodesep: NODE_SEPARATION,
    edgesep: EDGE_SEPARATION,
    marginx: 80,
    marginy: 80,
    ranker: 'tight-tree',
  });

  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes with depth-aware sizing
  scenes.forEach(scene => {
    const depth = analysis.depthMap.get(scene.id) ?? 999;
    const dimensions = nodeDimensions?.get(scene.id);
    const nodeWidth = dimensions?.width ?? NODE_WIDTH;
    const nodeHeight = dimensions?.height ?? NODE_HEIGHT;

    g.setNode(scene.id, {
      width: nodeWidth,
      height: nodeHeight,
      rank: depth,
    });
  });

  // Group edges by source for branch ordering
  const edgesBySource = new Map<string, SceneChoice[]>();
  choices
    .filter(choice => choice.target_scene_id && scenes.find(s => s.id === choice.target_scene_id))
    .forEach(choice => {
      const existing = edgesBySource.get(choice.scene_id) || [];
      existing.push(choice);
      edgesBySource.set(choice.scene_id, existing);
    });

  // Add edges sorted by order_index
  edgesBySource.forEach((choiceList, sourceId) => {
    const sortedChoices = choiceList.sort((a, b) => a.order_index - b.order_index);
    const branchCount = sortedChoices.length;

    sortedChoices.forEach((choice, index) => {
      let weight = 1;
      if (branchCount > 1) {
        weight = branchCount === 2
          ? (index === 0 ? 1.5 : 0.5)
          : (index === 0 ? 2 : index === branchCount - 1 ? 0.5 : 1);
      }

      g.setEdge(sourceId, choice.target_scene_id!, {
        weight,
        minlen: 1,
        labelpos: 'c',
      });
    });
  });

  dagre.layout(g);

  // Extract positions
  const nodePositions = new Map<string, NodePosition>();
  scenes.forEach(scene => {
    const nodeWithPosition = g.node(scene.id);
    if (nodeWithPosition) {
      const dimensions = nodeDimensions?.get(scene.id);
      const nodeWidth = dimensions?.width ?? NODE_WIDTH;
      const nodeHeight = dimensions?.height ?? NODE_HEIGHT;
      nodePositions.set(scene.id, {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      });
    }
  });

  return { nodePositions };
}

/**
 * Get edge color based on branch index
 */
export function getEdgeColor(branchIndex: number, totalBranches: number): string {
  if (totalBranches === 1) {
    const { hue, sat, light } = EDGE_COLORS.single;
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  }

  const colors = [EDGE_COLORS.branch1, EDGE_COLORS.branch2, EDGE_COLORS.branch3];
  const color = colors[Math.min(branchIndex, colors.length - 1)];
  return `hsl(${color.hue}, ${color.sat}%, ${color.light}%)`;
}

/**
 * Calculate relative positions for small node additions
 */
export function calculateRelativePositions(
  scene: Scene,
  allChoices: SceneChoice[],
  analysis: SceneAnalysis,
  existingPositions: Map<string, NodePosition>,
  nodeDimensions?: Map<string, NodeDimensions>
): NodePosition {
  const dimensions = nodeDimensions?.get(scene.id);
  const nodeWidth = dimensions?.width ?? NODE_WIDTH;
  const nodeHeight = dimensions?.height ?? NODE_HEIGHT;

  // Find parent node
  const parentChoice = allChoices.find(c => c.target_scene_id === scene.id);
  const parentId = parentChoice?.scene_id;

  if (parentId && existingPositions.has(parentId)) {
    const parentPos = existingPositions.get(parentId)!;
    const parentDimensions = nodeDimensions?.get(parentId);
    const parentWidth = parentDimensions?.width ?? NODE_WIDTH;

    // Get siblings for vertical offset
    const siblings = allChoices
      .filter(c => c.scene_id === parentId && c.target_scene_id)
      .sort((a, b) => a.order_index - b.order_index);

    const siblingIndex = siblings.findIndex(c => c.target_scene_id === scene.id);
    const siblingCount = siblings.length;

    const totalHeight = (siblingCount - 1) * (nodeHeight + NODE_SEPARATION);
    const startY = parentPos.y - totalHeight / 2;
    const yOffset = siblingIndex * (nodeHeight + NODE_SEPARATION);

    return {
      x: parentPos.x + RANK_SEPARATION + parentWidth,
      y: startY + yOffset,
    };
  }

  // Fallback to depth-based positioning
  const depth = analysis.depthMap.get(scene.id) ?? 0;
  return {
    x: 80 + depth * (RANK_SEPARATION + nodeWidth),
    y: 80,
  };
}
