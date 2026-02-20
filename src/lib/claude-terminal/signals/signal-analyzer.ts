/**
 * Signal Analyzer — Classifies raw CLI execution events into typed Signals.
 *
 * Hooks into cli-service.ts processLine() to examine every event in real-time.
 * Detects: tool errors, schema mismatches, N+1 patterns, retry storms,
 * performance issues, and prompt hallucinations.
 */

import type { CLIExecutionEvent } from '../cli-service';
import type { Signal, SignalType } from './signal-types';
import { SIGNAL_CATEGORY_MAP, SIGNAL_SEVERITY_MAP } from './signal-types';

// ============ Fingerprinting ============

/**
 * Simple string hash for deterministic fingerprinting.
 * Produces a stable hex string from input — used to deduplicate signals across sessions.
 */
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit int
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Normalize error messages by stripping UUIDs, timestamps, and varying whitespace
 * so that identical errors from different executions produce the same fingerprint.
 */
function normalizeError(msg: string): string {
  return msg
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s]*/g, '<TIMESTAMP>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function makeFingerprint(type: SignalType, toolName: string, errorPattern: string): string {
  return simpleHash(`${type}:${toolName}:${normalizeError(errorPattern)}`);
}

function makeSignalId(): string {
  return `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============ Error Pattern Matchers ============

const PGRST_CODE_RE = /PGRST(\d{3})/;
const COLUMN_MISSING_RE = /column\s+["']?(\w+)["']?\s+(?:of relation\s+["']?(\w+)["']?\s+)?does not exist/i;
const RELATION_MISSING_RE = /relation\s+["']?(\w+)["']?\s+does not exist/i;
const TOOL_NOT_FOUND_RE = /tool\s+["']?(\w+)["']?\s+(?:not found|does not exist|is not available)/i;

/**
 * Extract PGRST error code from error text.
 */
function extractPGRSTCode(text: string): string | undefined {
  const match = text.match(PGRST_CODE_RE);
  return match ? `PGRST${match[1]}` : undefined;
}

// ============ Main Analyzer ============

/**
 * Analyze a CLI execution event and return a Signal if it indicates a problem.
 * Returns null for normal, non-signal events.
 *
 * @param event - The CLI event to analyze
 * @param recentEvents - Sliding window of recent events (for N+1 / retry detection)
 * @param executionId - Current execution ID
 */
export function analyzeEvent(
  event: CLIExecutionEvent,
  recentEvents: CLIExecutionEvent[],
  executionId: string,
): Signal | null {
  // ---- Tool Result Errors ----
  if (event.type === 'tool_result') {
    const content = String(event.data.content || '');
    const isError = content.toLowerCase().includes('error') ||
                    content.toLowerCase().includes('failed') ||
                    content.includes('PGRST');

    if (!isError) return null;

    const pgrstCode = extractPGRSTCode(content);
    const toolName = findToolNameForResult(event, recentEvents);

    // Schema mismatch (column/relation missing)
    if (pgrstCode || COLUMN_MISSING_RE.test(content) || RELATION_MISSING_RE.test(content)) {
      return buildSignal('schema_mismatch', toolName, content, executionId, pgrstCode);
    }

    // Generic tool error
    return buildSignal('tool_error', toolName, content, executionId, pgrstCode);
  }

  // ---- Tool Use patterns (N+1, retry storms) ----
  if (event.type === 'tool_use') {
    const toolName = String(event.data.name || '');

    // N+1 detection: same tool called 3+ times in recent window
    const recentSameTool = recentEvents.filter(
      e => e.type === 'tool_use' && String(e.data.name) === toolName
    );
    if (recentSameTool.length >= 3) {
      return buildSignal('n_plus_one', toolName,
        `Tool ${toolName} called ${recentSameTool.length + 1} times in sequence`,
        executionId);
    }

    // Retry storm: same tool + same input called 3+ times
    const inputStr = JSON.stringify(event.data.input || {});
    const recentRetries = recentEvents.filter(
      e => e.type === 'tool_use' &&
           String(e.data.name) === toolName &&
           JSON.stringify(e.data.input || {}) === inputStr
    );
    if (recentRetries.length >= 2) {
      return buildSignal('retry_storm', toolName,
        `Tool ${toolName} retried ${recentRetries.length + 1} times with same input`,
        executionId);
    }
  }

  // ---- Performance (on result events) ----
  if (event.type === 'result') {
    const durationMs = event.data.durationMs as number | undefined;
    if (durationMs && durationMs > 60000) {
      return buildSignal('performance', '',
        `Execution took ${Math.round(durationMs / 1000)}s`,
        executionId);
    }
  }

  // ---- Text content analysis (prompt hallucinations) ----
  if (event.type === 'text') {
    const content = String(event.data.content || '');

    // Detect tool-not-found references in assistant text
    const toolMissing = content.match(TOOL_NOT_FOUND_RE);
    if (toolMissing) {
      return buildSignal('tool_missing', toolMissing[1],
        `Referenced non-existent tool: ${toolMissing[1]}`,
        executionId);
    }
  }

  return null;
}

// ============ Helpers ============

function buildSignal(
  type: SignalType,
  toolName: string,
  errorMessage: string,
  executionId: string,
  errorCode?: string,
): Signal {
  return {
    id: makeSignalId(),
    type,
    severity: SIGNAL_SEVERITY_MAP[type],
    category: SIGNAL_CATEGORY_MAP[type],
    fingerprint: makeFingerprint(type, toolName, errorMessage),
    toolName: toolName || undefined,
    errorMessage: errorMessage.slice(0, 500),
    errorCode,
    executionId,
    timestamp: Date.now(),
    resolved: false,
  };
}

/**
 * Find the tool name for a tool_result by looking back through recent events
 * for the matching tool_use event.
 */
function findToolNameForResult(
  resultEvent: CLIExecutionEvent,
  recentEvents: CLIExecutionEvent[],
): string {
  const toolUseId = resultEvent.data.toolUseId as string | undefined;
  if (!toolUseId) {
    // Fallback: last tool_use in window
    for (let i = recentEvents.length - 1; i >= 0; i--) {
      if (recentEvents[i].type === 'tool_use') {
        return String(recentEvents[i].data.name || '');
      }
    }
    return '';
  }

  for (let i = recentEvents.length - 1; i >= 0; i--) {
    if (recentEvents[i].type === 'tool_use' && recentEvents[i].data.id === toolUseId) {
      return String(recentEvents[i].data.name || '');
    }
  }
  return '';
}
