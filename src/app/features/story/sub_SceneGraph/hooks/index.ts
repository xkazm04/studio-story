/**
 * Scene Graph Hooks
 * Re-exports all hooks for the scene graph visualization
 */

// Core data hook
export { useSceneGraphData } from './useSceneGraphData';
export type { SceneNodeData, SceneAnalysis } from './useSceneGraphData';

// Layout calculation
export { createHierarchicalLayout, calculateRelativePositions, getEdgeColor } from './useGraphLayout';
export type { NodePosition, LayoutResult } from './useGraphLayout';
export {
  NODE_WIDTH,
  NODE_HEIGHT,
  RANK_SEPARATION,
  NODE_SEPARATION,
  EDGE_SEPARATION,
  EDGE_COLORS,
} from './useGraphLayout';

// Path ancestry tracking
export { usePathAncestry } from './usePathAncestry';
export type { PathAncestryResult } from './usePathAncestry';

// Branch depth calculation
export { useBranchDepth, useGraphDepthStats } from './useBranchDepth';
export type { BranchDepthData } from './useBranchDepth';

// Keyboard navigation
export { useSceneGraphNavigation } from './useSceneGraphNavigation';
export type { NavigationMap, UseSceneGraphNavigationOptions } from './useSceneGraphNavigation';

// Graph validation
export { useGraphValidation } from './useGraphValidation';
export type {
  ValidationSeverity,
  ValidationCategory,
  ValidationIssue,
  ValidationStats,
  ValidationResult,
} from './useGraphValidation';
