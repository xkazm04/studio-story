/**
 * Signal Analyzer — Classifies raw CLI execution events into typed Signals.
 *
 * Hooks into cli-service.ts processLine() to examine every event in real-time.
 *
 * SCOPE: Only handles CLI-stream-level observations that cannot be detected
 * at the MCP tool layer:
 *   - performance:          Execution took >60s
 *   - tool_missing:         Prompt references a tool that doesn't exist
 *   - prompt_hallucination: (future) CLI tries column/field that doesn't exist
 *
 * Tool-level classification (tool_error, schema_mismatch, n_plus_one,
 * retry_storm) is now handled by the MCP server's unified observation
 * pipeline (signal-observer.ts), which has direct access to tool inputs,
 * outputs, and timing. This eliminates duplicate interception and enables
 * cross-layer correlation via observationId.
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

const TOOL_NOT_FOUND_RE = /tool\s+["']?(\w+)["']?\s+(?:not found|does not exist|is not available)/i;

// ============ Main Analyzer ============

/**
 * Analyze a CLI execution event and return a Signal if it indicates a problem.
 * Returns null for normal, non-signal events.
 *
 * NOTE: Tool-level signals (tool_error, schema_mismatch, n_plus_one, retry_storm)
 * are now emitted by the MCP server's observation pipeline. This analyzer only
 * handles stream-level signals that require CLI context.
 *
 * @param event - The CLI event to analyze
 * @param _recentEvents - Sliding window of recent events (retained for API compatibility)
 * @param executionId - Current execution ID
 */
export function analyzeEvent(
  event: CLIExecutionEvent,
  _recentEvents: CLIExecutionEvent[],
  executionId: string,
): Signal | null {
  // ---- Performance (on result events) ----
  if (event.type === 'result') {
    const durationMs = event.data.durationMs;
    if (durationMs && durationMs > 60000) {
      return buildSignal('performance', '',
        `Execution took ${Math.round(durationMs / 1000)}s`,
        executionId);
    }
  }

  // ---- Text content analysis (prompt hallucinations) ----
  if (event.type === 'text') {
    const content = event.data.content;

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
