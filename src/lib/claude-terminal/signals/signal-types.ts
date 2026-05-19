/**
 * Signal Types — Taxonomy for CLI self-improvement feedback loop.
 *
 * Signals are captured during CLI execution when tool errors, schema mismatches,
 * N+1 queries, or other friction patterns are detected. They're aggregated into
 * Patterns which drive the improvement meta-agent.
 */

// ============ Enums ============

export type SignalType =
  | 'tool_error'           // MCP tool returned isError: true
  | 'schema_mismatch'      // PGRST error codes (missing column, wrong type)
  | 'tool_missing'         // Prompt references tool that doesn't exist
  | 'n_plus_one'           // Same tool called N times in sequence
  | 'prompt_hallucination' // CLI tries column/field that doesn't exist
  | 'retry_storm'          // Same tool retried 3+ times with same input
  | 'cache_miss'           // UI didn't refresh after mutation
  | 'performance'          // Execution took >60s for a simple task
  | 'type_drift'           // Tool input doesn't match expected schema
  | 'intent_signal';       // Successful tool chain capturing authorial pattern

export type Severity = 'low' | 'medium' | 'high';

export type Category = 'schema' | 'prompt' | 'performance' | 'cache' | 'tooling' | 'intent';

// ============ Signal ============

export interface Signal {
  id: string;
  type: SignalType;
  severity: Severity;
  category: Category;
  fingerprint: string;
  toolName?: string;
  errorMessage?: string;
  errorCode?: string;
  toolInput?: Record<string, unknown>;
  executionId: string;
  /** Correlates this signal to the ToolObservation and AuditEntry that produced it */
  observationId?: string;
  timestamp: number;
  resolved: boolean;
}

// ============ Pattern ============

export interface Pattern {
  fingerprint: string;
  type: SignalType;
  category: Category;
  severity: Severity;
  count: number;
  firstSeen: number;
  lastSeen: number;
  toolName?: string;
  errorMessage?: string;
  suggestedFix?: string;
  resolved: boolean;
}

// ============ Improvement Record ============

export interface ImprovementRecord {
  id: string;
  executionId: string;
  patternFingerprints: string[];
  startedAt: number;
  completedAt?: number;
  success: boolean;
  summary?: string;
  filesChanged?: string[];
}

// ============ Intent Signal ============

/**
 * An IntentSignal captures a successful tool chain — a sequence of tool calls
 * that completed without errors, representing an authorial workflow pattern.
 */
export interface IntentSignal {
  id: string;
  type: 'intent_signal';
  /** Ordered tool names in the chain (e.g. ['create_character', 'create_trait', 'create_relationship']) */
  toolChain: string[];
  /** Fingerprint of the tool chain for deduplication */
  fingerprint: string;
  /** Entity types involved (derived from tool names, e.g. 'character', 'scene', 'trait') */
  entityTypes: string[];
  executionId: string;
  timestamp: number;
}

/**
 * An IntentPattern aggregates repeated IntentSignals into a frequency-ranked
 * suggestion. Higher frequency + recency = stronger prediction.
 */
export interface IntentPattern {
  fingerprint: string;
  toolChain: string[];
  entityTypes: string[];
  count: number;
  firstSeen: number;
  lastSeen: number;
  /** Priority score: count × recency factor */
  score: number;
  /** Human-readable suggestion derived from the pattern */
  suggestion: string;
}

// ============ Constants ============

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 3,
  high: 5,
};

export const SIGNAL_CATEGORY_MAP: Record<SignalType, Category> = {
  tool_error: 'tooling',
  schema_mismatch: 'schema',
  tool_missing: 'tooling',
  n_plus_one: 'performance',
  prompt_hallucination: 'prompt',
  retry_storm: 'performance',
  cache_miss: 'cache',
  performance: 'performance',
  type_drift: 'schema',
  intent_signal: 'intent',
};

export const SIGNAL_SEVERITY_MAP: Record<SignalType, Severity> = {
  tool_error: 'medium',
  schema_mismatch: 'high',
  tool_missing: 'medium',
  n_plus_one: 'low',
  prompt_hallucination: 'high',
  retry_storm: 'medium',
  cache_miss: 'low',
  performance: 'low',
  type_drift: 'medium',
  intent_signal: 'low',
};
