/**
 * Intent Detector — Aggregates intent signals into predictive suggestions.
 *
 * Groups IntentSignals by fingerprint, scores by frequency × recency,
 * and generates human-readable suggestions for what the author should do next.
 *
 * This is the predictive counterpart to pattern-detector.ts (which handles errors).
 */

import type { IntentSignal, IntentPattern } from './signal-types';

// ============ Recency Scoring ============

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

function recencyFactor(lastSeen: number, now: number): number {
  const age = now - lastSeen;
  if (age < ONE_HOUR) return 2.0;
  if (age < ONE_DAY) return 1.5;
  return 1.0;
}

// ============ Suggestion Generation ============

/**
 * Map of entity types to human-readable actions for suggestions.
 */
const ENTITY_ACTION_MAP: Record<string, { create: string; next: string }> = {
  character: { create: 'Create a character', next: 'flesh out the character' },
  scene: { create: 'Write a scene', next: 'develop the scene' },
  beat: { create: 'Add a story beat', next: 'structure the narrative' },
  act: { create: 'Define an act', next: 'outline the act structure' },
  faction: { create: 'Create a faction', next: 'build faction dynamics' },
  trait: { create: 'Add character traits', next: 'define personality traits' },
  relationship: { create: 'Create a relationship', next: 'establish character connections' },
  image: { create: 'Generate an image', next: 'visualize the scene' },
  voice: { create: 'Assign a voice', next: 'set up voice acting' },
  narration: { create: 'Generate narration', next: 'add narrative voice' },
  illustration: { create: 'Create an illustration', next: 'illustrate the scene' },
};

/**
 * Generate a human-readable suggestion from a tool chain.
 * Describes the workflow and suggests the logical next step.
 */
function generateSuggestion(toolChain: string[], entityTypes: string[]): string {
  const normalizedChain = toolChain.map(t => t.replace(/^mcp__\w+__/, ''));

  // Describe what they typically do
  const actions = normalizedChain.slice(0, 3).map(t => {
    const verb = t.startsWith('create') ? 'create' :
                 t.startsWith('update') ? 'update' :
                 t.startsWith('list') ? 'review' :
                 t.startsWith('get') ? 'check' :
                 t.startsWith('generate') ? 'generate' : 'use';
    const entity = entityTypes.find(e => t.includes(e)) || t.split('_').pop() || 'item';
    return `${verb} ${entity}`;
  });

  const workflowDesc = actions.join(' → ');

  // Suggest what comes next based on the last entity in the chain
  const lastEntity = entityTypes[entityTypes.length - 1];
  const nextAction = lastEntity && ENTITY_ACTION_MAP[lastEntity]
    ? ENTITY_ACTION_MAP[lastEntity].next
    : 'continue building your story';

  if (entityTypes.length === 1) {
    const entity = entityTypes[0];
    const info = ENTITY_ACTION_MAP[entity];
    if (info) {
      return `You often ${workflowDesc}. Ready to ${info.next}?`;
    }
  }

  return `Your pattern: ${workflowDesc}. Next: ${nextAction}`;
}

// ============ Main Detector ============

/**
 * Aggregate intent signals into deduplicated, scored intent patterns.
 * Returns patterns sorted by score (highest first).
 *
 * @param signals - All intent signals to aggregate
 * @param maxPatterns - Maximum patterns to return (default 10)
 */
export function detectIntentPatterns(
  signals: IntentSignal[],
  maxPatterns: number = 10,
): IntentPattern[] {
  const now = Date.now();

  // Group by fingerprint
  const groups = new Map<string, IntentSignal[]>();
  for (const signal of signals) {
    const existing = groups.get(signal.fingerprint) || [];
    existing.push(signal);
    groups.set(signal.fingerprint, existing);
  }

  // Build patterns
  const patterns: IntentPattern[] = [];
  for (const [fingerprint, group] of groups) {
    const representative = group[0];
    const count = group.length;
    const firstSeen = Math.min(...group.map(s => s.timestamp));
    const lastSeen = Math.max(...group.map(s => s.timestamp));
    const score = count * recencyFactor(lastSeen, now);

    patterns.push({
      fingerprint,
      toolChain: representative.toolChain,
      entityTypes: representative.entityTypes,
      count,
      firstSeen,
      lastSeen,
      score,
      suggestion: generateSuggestion(representative.toolChain, representative.entityTypes),
    });
  }

  // Sort by score descending, take top N
  patterns.sort((a, b) => b.score - a.score);
  return patterns.slice(0, maxPatterns);
}

/**
 * Given the most recent tool call, find intent patterns that start with
 * a similar tool and suggest what typically comes next.
 *
 * @param recentToolName - The tool just used
 * @param allPatterns - All known intent patterns
 * @param limit - Max suggestions to return
 */
export function suggestNextActions(
  recentToolName: string,
  allPatterns: IntentPattern[],
  limit: number = 5,
): IntentPattern[] {
  const normalized = recentToolName.replace(/^mcp__\w+__/, '');

  return allPatterns
    .filter(p => {
      // Match patterns whose chain includes the recently used tool
      const normalizedChain = p.toolChain.map(t => t.replace(/^mcp__\w+__/, ''));
      const idx = normalizedChain.indexOf(normalized);
      // Tool should be in the chain but NOT the last step (so there's a "next" to suggest)
      return idx >= 0 && idx < normalizedChain.length - 1;
    })
    .slice(0, limit);
}
