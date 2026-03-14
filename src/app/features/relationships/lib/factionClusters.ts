import { Node } from 'reactflow';
import { CharacterNodeData } from '../types';
import { Faction } from '@/app/types/Faction';

/** Default color palette for factions without an explicit color */
export const FACTION_COLOR_PALETTE = [
  '#06b6d4', // cyan-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
] as const;

export interface FactionCluster {
  factionId: string;
  factionName: string;
  color: string;
  hullPath: string;
  labelPosition: { x: number; y: number };
}

interface Point {
  x: number;
  y: number;
}

// ------------------------------------------------------------------
// Convex hull (Graham scan) for small point sets
// ------------------------------------------------------------------

function cross(O: Point, A: Point, B: Point): number {
  return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
}

function grahamScan(points: Point[]): Point[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 1) return pts;

  // Build lower hull
  const lower: Point[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  // Build upper hull
  const upper: Point[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  // Remove the last point of each half because it repeats at the other end
  lower.pop();
  upper.pop();

  return [...lower, ...upper];
}

// ------------------------------------------------------------------
// Hull expansion — offset each vertex radially outward from centroid
// ------------------------------------------------------------------

function centroid(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function expandHull(hull: Point[], padding: number): Point[] {
  const c = centroid(hull);
  return hull.map((p) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: p.x + (dx / dist) * padding,
      y: p.y + (dy / dist) * padding,
    };
  });
}

// ------------------------------------------------------------------
// For <3 members: padded bounding shape
// ------------------------------------------------------------------

function boundingRectPath(points: Point[], padding: number): string {
  if (points.length === 0) return '';
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs) - padding;
  const maxX = Math.max(...xs) + padding;
  const minY = Math.min(...ys) - padding;
  const maxY = Math.max(...ys) + padding;

  // Rounded rectangle approximation via SVG path
  const r = 16; // border radius
  return [
    `M ${minX + r},${minY}`,
    `L ${maxX - r},${minY}`,
    `Q ${maxX},${minY} ${maxX},${minY + r}`,
    `L ${maxX},${maxY - r}`,
    `Q ${maxX},${maxY} ${maxX - r},${maxY}`,
    `L ${minX + r},${maxY}`,
    `Q ${minX},${maxY} ${minX},${maxY - r}`,
    `L ${minX},${minY + r}`,
    `Q ${minX},${minY} ${minX + r},${minY}`,
    'Z',
  ].join(' ');
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Compute faction clusters from positioned nodes and faction data.
 *
 * Returns a Map keyed by factionId containing the hull SVG path,
 * a label position (centroid, offset slightly above), and the color.
 */
export function computeFactionClusters(
  nodes: Node<CharacterNodeData>[],
  factions: Faction[]
): Map<string, FactionCluster> {
  const PADDING = 60;
  const LABEL_Y_OFFSET = -24;
  // Approximate node center offsets (half of node width/height)
  const NODE_HALF_W = 80;
  const NODE_HALF_H = 28;

  // Build a quick faction lookup
  const factionMap = new Map<string, Faction>();
  for (const f of factions) {
    factionMap.set(f.id, f);
  }

  // Group character node centers by faction_id
  const groups = new Map<string, Point[]>();

  for (const node of nodes) {
    const factionId = node.data?.character?.faction_id;
    if (!factionId) continue;
    const center: Point = {
      x: node.position.x + NODE_HALF_W,
      y: node.position.y + NODE_HALF_H,
    };
    if (!groups.has(factionId)) {
      groups.set(factionId, []);
    }
    groups.get(factionId)!.push(center);
  }

  // Build clusters
  const result = new Map<string, FactionCluster>();
  let paletteIndex = 0;

  for (const [factionId, points] of groups) {
    if (points.length < 2) continue; // Need 2+ members to form a visible cluster

    const faction = factionMap.get(factionId);
    const factionName = faction?.name ?? 'Unknown Faction';
    const color =
      faction?.color ||
      faction?.branding?.primary_color ||
      FACTION_COLOR_PALETTE[paletteIndex % FACTION_COLOR_PALETTE.length];
    paletteIndex++;

    let hullPath: string;

    if (points.length < 3) {
      // Padded bounding rectangle for 2 members
      hullPath = boundingRectPath(points, PADDING);
    } else {
      // Convex hull for 3+ members
      const hull = grahamScan(points);
      const expanded = expandHull(hull, PADDING);
      hullPath =
        expanded.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';
    }

    const c = centroid(points);

    result.set(factionId, {
      factionId,
      factionName,
      color,
      hullPath,
      labelPosition: { x: c.x, y: c.y + LABEL_Y_OFFSET },
    });
  }

  return result;
}
