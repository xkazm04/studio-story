/**
 * Node Dimension Calculator
 * Computes dynamic node dimensions based on title length
 */

// Base dimensions
export const BASE_NODE_WIDTH = 140;
export const MIN_NODE_WIDTH = 120;
export const MAX_NODE_WIDTH = 220;
export const NODE_PADDING_X = 16;
export const NODE_PADDING_Y = 8;

// Height calculations
export const NODE_HEADER_HEIGHT = 28;
export const NODE_FOOTER_HEIGHT = 32;
export const TITLE_LINE_HEIGHT = 16;
export const MIN_TITLE_HEIGHT = 32;
export const MAX_TITLE_LINES = 3;

// Font settings
export const TITLE_FONT_SIZE = 12;
const AVG_CHAR_WIDTH = 6.8;

export interface NodeDimensions {
  width: number;
  height: number;
}

/**
 * Estimates text width using average character width
 */
export function estimateTextWidth(text: string, fontSize: number = TITLE_FONT_SIZE): number {
  const scaledCharWidth = AVG_CHAR_WIDTH * (fontSize / 12);
  return text.length * scaledCharWidth;
}

/**
 * Calculates how many lines a title will need
 */
export function calculateTitleLines(title: string, availableWidth: number): number {
  if (!title || title.trim().length === 0) return 1;
  const textWidth = estimateTextWidth(title);
  return Math.min(Math.ceil(textWidth / availableWidth), MAX_TITLE_LINES);
}

/**
 * Computes optimal node dimensions based on title text
 */
export function computeNodeDimensions(title: string): NodeDimensions {
  const cleanTitle = title?.trim() || 'Untitled';
  const titleLength = cleanTitle.length;
  const textWidth = estimateTextWidth(cleanTitle);

  let nodeWidth: number;

  if (titleLength <= 12) {
    nodeWidth = MIN_NODE_WIDTH;
  } else if (titleLength <= 25) {
    const targetLineWidth = textWidth / 2;
    nodeWidth = Math.min(
      Math.max(targetLineWidth + NODE_PADDING_X, MIN_NODE_WIDTH),
      MAX_NODE_WIDTH
    );
  } else {
    const targetLineWidth = textWidth / 2.5;
    nodeWidth = Math.min(
      Math.max(targetLineWidth + NODE_PADDING_X, BASE_NODE_WIDTH),
      MAX_NODE_WIDTH
    );
  }

  nodeWidth = Math.round(nodeWidth / 10) * 10;

  const availableTextWidth = nodeWidth - NODE_PADDING_X;
  const titleLines = calculateTitleLines(cleanTitle, availableTextWidth);
  const titleHeight = Math.max(titleLines * TITLE_LINE_HEIGHT, MIN_TITLE_HEIGHT);
  const nodeHeight = NODE_HEADER_HEIGHT + titleHeight + NODE_FOOTER_HEIGHT + NODE_PADDING_Y;

  return { width: nodeWidth, height: nodeHeight };
}

/**
 * Pre-computes dimensions for multiple scenes
 */
export function computeBatchNodeDimensions(
  scenes: Array<{ id: string; name?: string }>
): Map<string, NodeDimensions> {
  const dimensionsMap = new Map<string, NodeDimensions>();
  for (const scene of scenes) {
    dimensionsMap.set(scene.id, computeNodeDimensions(scene.name || 'Untitled'));
  }
  return dimensionsMap;
}

/**
 * Gets dimension values for layout calculations
 */
export function getDimensionsForLayout(
  sceneId: string,
  dimensionsMap: Map<string, NodeDimensions>
): { width: number; height: number } {
  const dimensions = dimensionsMap.get(sceneId);
  if (dimensions) return dimensions;
  return {
    width: BASE_NODE_WIDTH,
    height: NODE_HEADER_HEIGHT + MIN_TITLE_HEIGHT + NODE_FOOTER_HEIGHT + NODE_PADDING_Y,
  };
}
