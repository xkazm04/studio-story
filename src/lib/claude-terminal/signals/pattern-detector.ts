/**
 * Pattern Detector — Aggregates raw signals into prioritized patterns.
 *
 * Groups signals by fingerprint, counts occurrences, scores by
 * severity × frequency × recency, and generates human-readable fix suggestions.
 */

import type { Signal, Pattern, Severity, SignalType } from './signal-types';
import { SEVERITY_WEIGHT } from './signal-types';

// ============ Recency Scoring ============

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

function recencyFactor(lastSeen: number, now: number): number {
  const age = now - lastSeen;
  if (age < ONE_HOUR) return 2.0;
  if (age < ONE_DAY) return 1.5;
  return 1.0;
}

// ============ Fix Suggestions ============

const SUGGESTION_TEMPLATES: Record<SignalType, (toolName?: string, errorMsg?: string) => string> = {
  schema_mismatch: (tool, err) => {
    const colMatch = err?.match(/column\s+["']?(\w+)["']?/i);
    const col = colMatch ? colMatch[1] : 'unknown';
    return `Column "${col}" missing — add DB migration or fix MCP tool description in ${tool || 'scenes.ts'}`;
  },
  tool_error: (tool) =>
    `Tool "${tool}" is returning errors — check API route handler and MCP tool implementation`,
  tool_missing: (tool) =>
    `Tool "${tool}" referenced in prompt but not registered — add to MCP server or fix prompt in skills/index.ts`,
  n_plus_one: (tool) =>
    `Tool "${tool}" called many times in sequence — consider a batch/list variant or prompt optimization`,
  prompt_hallucination: (_tool, err) =>
    `Prompt references non-existent field/column — update buildBaseSystemPrompt in skills/index.ts. Error: ${err?.slice(0, 100) || ''}`,
  retry_storm: (tool) =>
    `Tool "${tool}" retried with same input — likely a persistent error; fix root cause`,
  cache_miss: () =>
    'UI cache not invalidated after mutation — add entry to TOOL_INVALIDATION_MAP in useCLIDataSync.ts',
  performance: () =>
    'Execution took >60s — consider splitting into smaller steps or adding batch MCP tools',
  type_drift: (tool) =>
    `Tool "${tool}" receiving unexpected input shape — update Zod schema or prompt instructions`,
};

function generateSuggestion(type: SignalType, toolName?: string, errorMessage?: string): string {
  const template = SUGGESTION_TEMPLATES[type];
  return template(toolName, errorMessage);
}

// ============ Main Detector ============

/**
 * Aggregate signals into deduplicated, scored patterns.
 * Signals are grouped by fingerprint. Each group becomes a Pattern
 * with a priority score based on severity, count, and recency.
 */
export function detectPatterns(signals: Signal[]): Pattern[] {
  const now = Date.now();

  // Group by fingerprint
  const groups = new Map<string, Signal[]>();
  for (const signal of signals) {
    if (signal.resolved) continue;
    const existing = groups.get(signal.fingerprint) || [];
    existing.push(signal);
    groups.set(signal.fingerprint, existing);
  }

  // Build patterns
  const patterns: Pattern[] = [];
  for (const [fingerprint, group] of groups) {
    const representative = group[0];
    const count = group.length;

    // Max severity across group
    const severities: Severity[] = group.map(s => s.severity);
    const maxSeverity = severities.includes('high') ? 'high'
      : severities.includes('medium') ? 'medium' : 'low';

    const firstSeen = Math.min(...group.map(s => s.timestamp));
    const lastSeen = Math.max(...group.map(s => s.timestamp));

    patterns.push({
      fingerprint,
      type: representative.type,
      category: representative.category,
      severity: maxSeverity,
      count,
      firstSeen,
      lastSeen,
      toolName: representative.toolName,
      errorMessage: representative.errorMessage,
      suggestedFix: generateSuggestion(representative.type, representative.toolName, representative.errorMessage),
      resolved: false,
    });
  }

  // Score and sort
  patterns.sort((a, b) => {
    const scoreA = SEVERITY_WEIGHT[a.severity] * a.count * recencyFactor(a.lastSeen, now);
    const scoreB = SEVERITY_WEIGHT[b.severity] * b.count * recencyFactor(b.lastSeen, now);
    return scoreB - scoreA;
  });

  return patterns;
}
