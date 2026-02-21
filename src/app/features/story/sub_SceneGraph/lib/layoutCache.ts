/**
 * Layout Cache for Scene Graph
 * Session-based caching for instant view toggle rendering
 */

export interface SessionLayoutCache {
  positions: Map<string, { x: number; y: number }>;
  structureHash: string;
  choiceSignature: string;
  lastUpdated: number;
}

const MAX_CACHE_SIZE = 100;
const sessionLayoutCache = new Map<string, SessionLayoutCache>();

/**
 * Creates a structure hash for cache invalidation
 */
export function createLayoutStructureHash(
  sceneIds: string[],
  sceneTitles: Record<string, string>,
  choiceConnections: Array<{ sourceId: string; targetId: string | null; orderIndex: number }>,
  firstSceneId: string | null,
  collapsedNodes: string[]
): string {
  const sortedIds = [...sceneIds].sort();
  const choiceSigs = choiceConnections
    .map(c => `${c.sourceId}->${c.targetId || 'null'}:${c.orderIndex}`)
    .sort()
    .join('|');
  const titleSigs = sortedIds
    .map(id => `${id}:${(sceneTitles[id] || '').length}`)
    .join(',');
  const collapsedSig = [...collapsedNodes].sort().join(',');

  return `${sortedIds.join(',')}::${choiceSigs}::${firstSceneId || 'null'}::${titleSigs}::${collapsedSig}`;
}

/**
 * Creates a choice signature for targeted invalidation
 */
export function createChoiceSignature(
  choiceConnections: Array<{ sourceId: string; targetId: string | null; orderIndex: number }>
): string {
  return choiceConnections
    .map(c => `${c.sourceId}->${c.targetId || 'null'}:${c.orderIndex}`)
    .sort()
    .join('|');
}

/**
 * Gets cached layout if valid
 */
export function getSessionLayoutCache(
  projectId: string,
  currentChoiceSignature: string
): Map<string, { x: number; y: number }> | null {
  const key = `session:${projectId}`;
  const entry = sessionLayoutCache.get(key);

  if (!entry) return null;

  if (entry.choiceSignature !== currentChoiceSignature) {
    sessionLayoutCache.delete(key);
    return null;
  }

  return entry.positions;
}

/**
 * Sets cached layout
 */
export function setSessionLayoutCache(
  projectId: string,
  positions: Map<string, { x: number; y: number }>,
  structureHash: string,
  choiceSignature: string
): void {
  const key = `session:${projectId}`;

  if (sessionLayoutCache.size >= MAX_CACHE_SIZE) {
    const entries = Array.from(sessionLayoutCache.entries())
      .sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
    for (let i = 0; i < Math.floor(MAX_CACHE_SIZE * 0.2); i++) {
      sessionLayoutCache.delete(entries[i][0]);
    }
  }

  sessionLayoutCache.set(key, {
    positions,
    structureHash,
    choiceSignature,
    lastUpdated: Date.now(),
  });
}

/**
 * Updates positions without changing structure
 */
export function updateSessionLayoutPositions(
  projectId: string,
  positions: Map<string, { x: number; y: number }>
): void {
  const key = `session:${projectId}`;
  const entry = sessionLayoutCache.get(key);

  if (entry) {
    positions.forEach((pos, id) => entry.positions.set(id, pos));
    entry.lastUpdated = Date.now();
  }
}

/**
 * Invalidates cache for a project
 */
export function invalidateSessionLayoutCache(projectId: string): void {
  sessionLayoutCache.delete(`session:${projectId}`);
}

/**
 * Checks if valid cache exists
 */
export function hasValidSessionCache(
  projectId: string,
  currentChoiceSignature: string
): boolean {
  const entry = sessionLayoutCache.get(`session:${projectId}`);
  return entry ? entry.choiceSignature === currentChoiceSignature : false;
}

/**
 * Clears all caches
 */
export function clearSessionLayoutCache(): void {
  sessionLayoutCache.clear();
}
