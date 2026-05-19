/**
 * Signal Store — File-based persistence for CLI improvement signals.
 *
 * Stores signals, patterns, and improvement records in `.story/signals/`.
 * Uses JSONL (one JSON object per line) for append-only signal logging.
 * The `.story/` directory is gitignored.
 *
 * Hot-path writes (appendSignal, appendIntentSignal, appendImprovement) are
 * buffered in memory and flushed asynchronously to avoid blocking the event
 * loop during active CLI streaming. Flushes occur every 500ms or when the
 * buffer reaches 10 pending entries.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Signal, Pattern, ImprovementRecord, IntentSignal, IntentPattern } from './signal-types';

// ============ Paths ============

const SIGNALS_DIR = path.join(process.cwd(), '.story', 'signals');
const EVENTS_FILE = path.join(SIGNALS_DIR, 'events.jsonl');
const PATTERNS_FILE = path.join(SIGNALS_DIR, 'patterns.json');
const IMPROVEMENTS_FILE = path.join(SIGNALS_DIR, 'improvements.jsonl');
const INTENTS_FILE = path.join(SIGNALS_DIR, 'intents.jsonl');
const INTENT_PATTERNS_FILE = path.join(SIGNALS_DIR, 'intent-patterns.json');

// ============ Health State ============

export interface SignalHealth {
  operational: boolean;
  lastError?: string;
  eventCount: number;
}

let _lastError: string | undefined;
let _eventCount = 0;
let _operational = true;

function recordError(context: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  _lastError = `[${context}] ${msg}`;
  _operational = false;
  process.stderr.write(`signal-store: ${_lastError}\n`);
}

export function getSignalHealth(): SignalHealth {
  return {
    operational: _operational,
    lastError: _lastError,
    eventCount: _eventCount,
  };
}

// ============ Async Write Buffer ============

/** Pending JSONL lines per file, flushed asynchronously. */
const _buffers = new Map<string, string[]>();

const FLUSH_INTERVAL_MS = 500;
const FLUSH_THRESHOLD = 10;

let _flushTimer: ReturnType<typeof setInterval> | null = null;
let _flushing = false;
let _dirEnsured = false;

/** Exposed for testing — override to control flush behavior. */
export const _internals = {
  FLUSH_INTERVAL_MS,
  FLUSH_THRESHOLD,
  get buffers() { return _buffers; },
  get flushing() { return _flushing; },
  get flushTimer() { return _flushTimer; },
  resetDirCache() { _dirEnsured = false; },
};

function bufferAppend(filePath: string, jsonLine: string): void {
  let lines = _buffers.get(filePath);
  if (!lines) {
    lines = [];
    _buffers.set(filePath, lines);
  }
  lines.push(jsonLine);

  // Check total pending across all buffers
  let total = 0;
  for (const buf of _buffers.values()) total += buf.length;

  if (total >= FLUSH_THRESHOLD) {
    // Threshold reached — flush async (fire-and-forget)
    flushSignalBuffers().catch(err => recordError('thresholdFlush', err));
  }

  // Start periodic flush timer if not running
  if (!_flushTimer) {
    _flushTimer = setInterval(() => {
      flushSignalBuffers().catch(err => recordError('intervalFlush', err));
    }, FLUSH_INTERVAL_MS);
    // Unref so the timer doesn't prevent process exit
    if (_flushTimer && typeof _flushTimer === 'object' && 'unref' in _flushTimer) {
      (_flushTimer as NodeJS.Timeout).unref();
    }
  }
}

function getBufferedLines(filePath: string): string[] {
  return _buffers.get(filePath)?.slice() ?? [];
}

async function ensureDirAsync(): Promise<void> {
  if (_dirEnsured) return;
  try {
    await fs.promises.mkdir(SIGNALS_DIR, { recursive: true });
    _dirEnsured = true;
  } catch (err) {
    recordError('ensureDirAsync', err);
  }
}

function ensureDirSync(): void {
  try {
    if (!fs.existsSync(SIGNALS_DIR)) {
      fs.mkdirSync(SIGNALS_DIR, { recursive: true });
    }
    _dirEnsured = true;
  } catch (err) {
    recordError('ensureDir', err);
  }
}

/**
 * Flush all pending JSONL buffers to disk asynchronously.
 * Safe to call multiple times — concurrent flushes are coalesced.
 */
export async function flushSignalBuffers(): Promise<void> {
  if (_flushing) return;
  _flushing = true;

  try {
    await ensureDirAsync();

    for (const [filePath, lines] of _buffers) {
      if (lines.length === 0) continue;

      // Drain the buffer atomically
      const batch = lines.splice(0, lines.length);
      const data = batch.join('\n') + '\n';

      try {
        await fs.promises.appendFile(filePath, data, 'utf-8');
      } catch (err) {
        recordError('flushWrite', err);
      }
    }
  } finally {
    _flushing = false;
  }
}

/**
 * Stop the periodic flush timer and flush remaining buffers.
 * Call at end of execution or process shutdown.
 */
export async function shutdownSignalStore(): Promise<void> {
  if (_flushTimer) {
    clearInterval(_flushTimer);
    _flushTimer = null;
  }
  await flushSignalBuffers();
}

// ============ Signals (JSONL) ============

export function appendSignal(signal: Signal): void {
  try {
    bufferAppend(EVENTS_FILE, JSON.stringify(signal));
    _eventCount++;
    _operational = true;
  } catch (err) {
    recordError('appendSignal', err);
  }
}

export function getSignals(since?: number): Signal[] {
  // Read persisted lines from disk
  let lines: string[] = [];
  if (fs.existsSync(EVENTS_FILE)) {
    lines = fs.readFileSync(EVENTS_FILE, 'utf-8').split('\n').filter(Boolean);
  }

  // Merge in-memory buffered lines not yet flushed
  const pending = getBufferedLines(EVENTS_FILE);
  if (pending.length > 0) {
    lines = lines.concat(pending);
  }

  const signals: Signal[] = [];
  for (const line of lines) {
    try {
      const signal = JSON.parse(line) as Signal;
      if (!since || signal.timestamp >= since) {
        signals.push(signal);
      }
    } catch {
      // Skip malformed lines
    }
  }

  return signals;
}

// ============ Patterns (JSON) ============

export function getPatterns(): Pattern[] {
  if (!fs.existsSync(PATTERNS_FILE)) return [];

  try {
    const raw = fs.readFileSync(PATTERNS_FILE, 'utf-8');
    return JSON.parse(raw) as Pattern[];
  } catch {
    return [];
  }
}

export function savePatterns(patterns: Pattern[]): void {
  ensureDirSync();
  fs.promises.writeFile(PATTERNS_FILE, JSON.stringify(patterns, null, 2), 'utf-8')
    .then(() => { _operational = true; })
    .catch(err => recordError('savePatterns', err));
}

export function markPatternsResolved(fingerprints: string[]): void {
  const patterns = getPatterns();
  const fpSet = new Set(fingerprints);
  let changed = false;

  for (const pattern of patterns) {
    if (fpSet.has(pattern.fingerprint) && !pattern.resolved) {
      pattern.resolved = true;
      changed = true;
    }
  }

  if (changed) {
    savePatterns(patterns);
  }
}

// ============ Improvements (JSONL) ============

export function appendImprovement(record: ImprovementRecord): void {
  try {
    bufferAppend(IMPROVEMENTS_FILE, JSON.stringify(record));
    _operational = true;
  } catch (err) {
    recordError('appendImprovement', err);
  }
}

export function getImprovements(): ImprovementRecord[] {
  let lines: string[] = [];
  if (fs.existsSync(IMPROVEMENTS_FILE)) {
    lines = fs.readFileSync(IMPROVEMENTS_FILE, 'utf-8').split('\n').filter(Boolean);
  }

  // Merge buffered lines
  const pending = getBufferedLines(IMPROVEMENTS_FILE);
  if (pending.length > 0) {
    lines = lines.concat(pending);
  }

  const records: ImprovementRecord[] = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line) as ImprovementRecord);
    } catch {
      // Skip malformed
    }
  }

  return records;
}

// ============ Intent Signals (JSONL) ============

export function appendIntentSignal(signal: IntentSignal): void {
  try {
    bufferAppend(INTENTS_FILE, JSON.stringify(signal));
    _eventCount++;
    _operational = true;
  } catch (err) {
    recordError('appendIntentSignal', err);
  }
}

export function getIntentSignals(since?: number): IntentSignal[] {
  let lines: string[] = [];
  if (fs.existsSync(INTENTS_FILE)) {
    lines = fs.readFileSync(INTENTS_FILE, 'utf-8').split('\n').filter(Boolean);
  }

  // Merge buffered lines
  const pending = getBufferedLines(INTENTS_FILE);
  if (pending.length > 0) {
    lines = lines.concat(pending);
  }

  const signals: IntentSignal[] = [];
  for (const line of lines) {
    try {
      const signal = JSON.parse(line) as IntentSignal;
      if (!since || signal.timestamp >= since) {
        signals.push(signal);
      }
    } catch {
      // Skip malformed lines
    }
  }

  return signals;
}

// ============ Intent Patterns (JSON) ============

export function getIntentPatterns(): IntentPattern[] {
  if (!fs.existsSync(INTENT_PATTERNS_FILE)) return [];

  try {
    const raw = fs.readFileSync(INTENT_PATTERNS_FILE, 'utf-8');
    return JSON.parse(raw) as IntentPattern[];
  } catch {
    return [];
  }
}

export function saveIntentPatterns(patterns: IntentPattern[]): void {
  ensureDirSync();
  fs.promises.writeFile(INTENT_PATTERNS_FILE, JSON.stringify(patterns, null, 2), 'utf-8')
    .then(() => { _operational = true; })
    .catch(err => recordError('saveIntentPatterns', err));
}
