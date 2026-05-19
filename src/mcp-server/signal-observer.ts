/**
 * Signal Observer — Classifies tool observations into typed signals.
 *
 * Subscribes to the ObservationBus and detects:
 *   - tool_error:       Tool returned an error result
 *   - schema_mismatch:  PGRST / column / relation errors
 *   - n_plus_one:       Same tool called 3+ times in quick succession
 *   - retry_storm:      Same tool + identical input called 3+ times
 *
 * Writes signals to `.story/signals/events.jsonl` in the same format as
 * the CLI-side signal-store, with `observationId` for cross-layer correlation.
 *
 * This replaces the tool-level classification that previously lived in the
 * CLI-side signal-analyzer, eliminating duplicate interception.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ToolObservation, ObservationBus } from './observation-bus.js';

// ============ Signal types (compatible with signal-store format) ============

type SignalType = 'tool_error' | 'schema_mismatch' | 'n_plus_one' | 'retry_storm';
type Severity = 'low' | 'medium' | 'high';
type Category = 'schema' | 'performance' | 'tooling';

interface ObservedSignal {
  id: string;
  type: SignalType;
  severity: Severity;
  category: Category;
  fingerprint: string;
  toolName?: string;
  errorMessage?: string;
  errorCode?: string;
  executionId: string;
  /** Links this signal to the ToolObservation that produced it */
  observationId: string;
  timestamp: number;
  resolved: boolean;
}

const SEVERITY_MAP: Record<SignalType, Severity> = {
  tool_error: 'medium',
  schema_mismatch: 'high',
  n_plus_one: 'low',
  retry_storm: 'medium',
};

const CATEGORY_MAP: Record<SignalType, Category> = {
  tool_error: 'tooling',
  schema_mismatch: 'schema',
  n_plus_one: 'performance',
  retry_storm: 'performance',
};

// ============ Error Pattern Matchers ============

const PGRST_CODE_RE = /PGRST(\d{3})/;
const COLUMN_MISSING_RE = /column\s+["']?(\w+)["']?\s+(?:of relation\s+["']?(\w+)["']?\s+)?does not exist/i;
const RELATION_MISSING_RE = /relation\s+["']?(\w+)["']?\s+does not exist/i;

// ============ Fingerprinting ============

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

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

// ============ Signal Writer ============

const SIGNALS_DIR = path.join(process.cwd(), '.story', 'signals');
const EVENTS_FILE = path.join(SIGNALS_DIR, 'events.jsonl');
let _dirEnsured = false;

function ensureDir(): void {
  if (_dirEnsured) return;
  try {
    if (!fs.existsSync(SIGNALS_DIR)) {
      fs.mkdirSync(SIGNALS_DIR, { recursive: true });
    }
    _dirEnsured = true;
  } catch {
    // Non-critical — signal writing is best-effort
  }
}

function writeSignal(signal: ObservedSignal): void {
  try {
    ensureDir();
    fs.appendFileSync(EVENTS_FILE, JSON.stringify(signal) + '\n', 'utf-8');
  } catch {
    // Signal writing is non-critical — never block tool execution
  }
}

// ============ Sliding Window ============

interface RecentObservation {
  toolName: string;
  inputHash: string;
  timestamp: number;
}

const WINDOW_SIZE = 20;
const WINDOW_TTL_MS = 30_000; // 30 seconds
const recentWindow: RecentObservation[] = [];

function addToWindow(obs: ToolObservation): void {
  const inputHash = simpleHash(JSON.stringify(obs.inputs));
  recentWindow.push({ toolName: obs.toolName, inputHash, timestamp: obs.timestamp });

  // Evict old entries
  while (recentWindow.length > WINDOW_SIZE) recentWindow.shift();
  const cutoff = Date.now() - WINDOW_TTL_MS;
  while (recentWindow.length > 0 && recentWindow[0].timestamp < cutoff) {
    recentWindow.shift();
  }
}

// ============ Classification ============

function classifyObservation(obs: ToolObservation): ObservedSignal | null {
  // --- Error classification ---
  if (!obs.success && obs.error) {
    const errorText = obs.error;
    const pgrstCode = errorText.match(PGRST_CODE_RE)?.[0];

    if (pgrstCode || COLUMN_MISSING_RE.test(errorText) || RELATION_MISSING_RE.test(errorText)) {
      return buildSignal('schema_mismatch', obs, pgrstCode);
    }

    return buildSignal('tool_error', obs);
  }

  // Also check outputText for error indicators (some tools return isError without throwing)
  if (obs.outputText) {
    const content = obs.outputText;
    const isError = content.toLowerCase().includes('error') ||
                    content.toLowerCase().includes('failed') ||
                    content.includes('PGRST');

    if (isError) {
      const pgrstCode = content.match(PGRST_CODE_RE)?.[0];

      if (pgrstCode || COLUMN_MISSING_RE.test(content) || RELATION_MISSING_RE.test(content)) {
        return buildSignal('schema_mismatch', obs, pgrstCode);
      }

      // Only classify as tool_error if the tool explicitly reported failure
      if (!obs.success) {
        return buildSignal('tool_error', obs);
      }
    }
  }

  return null;
}

function detectPatternSignals(obs: ToolObservation): ObservedSignal | null {
  const inputHash = simpleHash(JSON.stringify(obs.inputs));

  // N+1: same tool called 3+ times in recent window
  const sameTool = recentWindow.filter(r => r.toolName === obs.toolName);
  if (sameTool.length >= 3) {
    return buildSignal('n_plus_one', obs, undefined,
      `Tool ${obs.toolName} called ${sameTool.length} times in sequence`);
  }

  // Retry storm: same tool + same input 3+ times
  const sameToolAndInput = recentWindow.filter(
    r => r.toolName === obs.toolName && r.inputHash === inputHash
  );
  if (sameToolAndInput.length >= 2) {
    return buildSignal('retry_storm', obs, undefined,
      `Tool ${obs.toolName} retried ${sameToolAndInput.length + 1} times with same input`);
  }

  return null;
}

function buildSignal(
  type: SignalType,
  obs: ToolObservation,
  errorCode?: string,
  overrideMessage?: string,
): ObservedSignal {
  const errorMessage = (overrideMessage || obs.error || obs.outputText || '').slice(0, 500);

  return {
    id: makeSignalId(),
    type,
    severity: SEVERITY_MAP[type],
    category: CATEGORY_MAP[type],
    fingerprint: makeFingerprint(type, obs.toolName, errorMessage),
    toolName: obs.toolName,
    errorMessage,
    errorCode,
    executionId: obs.sessionId,
    observationId: obs.id,
    timestamp: obs.timestamp,
    resolved: false,
  };
}

// ============ Observer Entry Point ============

function handleObservation(obs: ToolObservation): void {
  // 1. Error classification
  const errorSignal = classifyObservation(obs);
  if (errorSignal) writeSignal(errorSignal);

  // 2. Pattern detection (N+1, retry storms)
  const patternSignal = detectPatternSignals(obs);
  if (patternSignal) writeSignal(patternSignal);

  // 3. Track in sliding window (after detection so current obs isn't counted)
  addToWindow(obs);
}

/**
 * Subscribe the signal observer to an observation bus.
 * Returns an unsubscribe function.
 */
export function attachSignalObserver(bus: ObservationBus): () => void {
  return bus.subscribe(handleObservation);
}
