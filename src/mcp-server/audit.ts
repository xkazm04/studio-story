/**
 * MCP Tool Call Audit Logger
 *
 * Records every MCP tool invocation with full input parameters, output data,
 * timing, and success/failure status. Stores as rotated JSONL files in
 * `.story/audit/` with a companion index for fast lookups.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ToolObservation, ObservationBus } from './observation-bus.js';

// ============ Types ============

export interface AuditEntry {
  /** Unique entry ID */
  id: string;
  /** Tool name */
  tool: string;
  /** Full input parameters */
  inputs: Record<string, unknown>;
  /** Output data (truncated if large) */
  output: unknown;
  /** Whether the call succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** ISO timestamp */
  timestamp: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Session ID (process start time) */
  sessionId: string;
  /** Observation ID — correlates this audit entry to its ToolObservation and any signals it produced */
  observationId?: string;
}

export interface AuditIndex {
  /** Total entries across all files */
  totalEntries: number;
  /** Active JSONL file */
  activeFile: string;
  /** All JSONL files with entry counts */
  files: Array<{ name: string; entries: number; firstTs: string; lastTs: string }>;
  /** Last updated ISO timestamp */
  updatedAt: string;
}

export interface AuditQuery {
  /** Filter by tool name */
  tool?: string;
  /** Filter by success/failure */
  success?: boolean;
  /** Only entries after this ISO timestamp */
  since?: string;
  /** Only entries before this ISO timestamp */
  until?: string;
  /** Max entries to return (default 50) */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Session ID filter */
  sessionId?: string;
}

// ============ Constants ============

const AUDIT_DIR = path.join(process.cwd(), '.story', 'audit');
const INDEX_FILE = path.join(AUDIT_DIR, 'index.json');
const MAX_ENTRIES_PER_FILE = 5000;
const MAX_OUTPUT_LENGTH = 2000;
const SESSION_ID = new Date().toISOString().replace(/[:.]/g, '-');

let entryCounter = 0;

// ============ Directory Setup ============

function ensureDir(): void {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
}

// ============ Index Management ============

function readIndex(): AuditIndex {
  if (!fs.existsSync(INDEX_FILE)) {
    const initial: AuditIndex = {
      totalEntries: 0,
      activeFile: 'audit-001.jsonl',
      files: [],
      updatedAt: new Date().toISOString(),
    };
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8')) as AuditIndex;
  } catch {
    return {
      totalEntries: 0,
      activeFile: 'audit-001.jsonl',
      files: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

function writeIndex(index: AuditIndex): void {
  ensureDir();
  index.updatedAt = new Date().toISOString();
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
}

function rotateIfNeeded(index: AuditIndex): AuditIndex {
  const activeEntry = index.files.find(f => f.name === index.activeFile);
  if (activeEntry && activeEntry.entries >= MAX_ENTRIES_PER_FILE) {
    const num = index.files.length + 1;
    const newFile = `audit-${String(num).padStart(3, '0')}.jsonl`;
    index.activeFile = newFile;
  }
  return index;
}

// ============ Core Logging ============

function truncateOutput(output: unknown): unknown {
  const str = typeof output === 'string' ? output : JSON.stringify(output);
  if (str && str.length > MAX_OUTPUT_LENGTH) {
    return str.slice(0, MAX_OUTPUT_LENGTH) + `... [truncated, ${str.length} total chars]`;
  }
  return output;
}

/**
 * Record a tool call to the audit log. Called automatically by the
 * tool wrapper in index.ts.
 */
export function recordToolCall(
  tool: string,
  inputs: Record<string, unknown>,
  output: unknown,
  success: boolean,
  durationMs: number,
  error?: string,
  observationId?: string,
): AuditEntry {
  ensureDir();

  const entry: AuditEntry = {
    id: `${SESSION_ID}-${String(++entryCounter).padStart(5, '0')}`,
    tool,
    inputs,
    output: truncateOutput(output),
    success,
    error,
    timestamp: new Date().toISOString(),
    durationMs,
    sessionId: SESSION_ID,
    observationId,
  };

  let index = readIndex();
  index = rotateIfNeeded(index);

  const filePath = path.join(AUDIT_DIR, index.activeFile);
  fs.appendFileSync(filePath, JSON.stringify(entry) + '\n', 'utf-8');

  // Update index
  index.totalEntries++;
  const fileEntry = index.files.find(f => f.name === index.activeFile);
  if (fileEntry) {
    fileEntry.entries++;
    fileEntry.lastTs = entry.timestamp;
  } else {
    index.files.push({
      name: index.activeFile,
      entries: 1,
      firstTs: entry.timestamp,
      lastTs: entry.timestamp,
    });
  }
  writeIndex(index);

  return entry;
}

// ============ Query ============

/**
 * Query the audit log with filters.
 */
export function queryAuditLog(query: AuditQuery = {}): { entries: AuditEntry[]; total: number } {
  const index = readIndex();
  if (index.totalEntries === 0) return { entries: [], total: 0 };

  const limit = query.limit ?? 50;
  const offset = query.offset ?? 0;
  const allEntries: AuditEntry[] = [];

  // Read files in reverse order (newest first)
  const filesToRead = [...index.files].reverse();

  for (const fileInfo of filesToRead) {
    const filePath = path.join(AUDIT_DIR, fileInfo.name);
    if (!fs.existsSync(filePath)) continue;

    // Quick timestamp range skip using index metadata
    if (query.since && fileInfo.lastTs < query.since) continue;
    if (query.until && fileInfo.firstTs > query.until) continue;

    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as AuditEntry;

        // Apply filters
        if (query.tool && entry.tool !== query.tool) continue;
        if (query.success !== undefined && entry.success !== query.success) continue;
        if (query.sessionId && entry.sessionId !== query.sessionId) continue;
        if (query.since && entry.timestamp < query.since) continue;
        if (query.until && entry.timestamp > query.until) continue;

        allEntries.push(entry);
      } catch {
        // Skip malformed lines
      }
    }
  }

  // Sort newest first
  allEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    entries: allEntries.slice(offset, offset + limit),
    total: allEntries.length,
  };
}

/**
 * Get unique session IDs from the audit log.
 */
export function getAuditSessions(): Array<{ sessionId: string; firstTs: string; lastTs: string; count: number }> {
  const { entries } = queryAuditLog({ limit: 10000 });
  const sessions = new Map<string, { firstTs: string; lastTs: string; count: number }>();

  for (const entry of entries) {
    const existing = sessions.get(entry.sessionId);
    if (existing) {
      existing.count++;
      if (entry.timestamp < existing.firstTs) existing.firstTs = entry.timestamp;
      if (entry.timestamp > existing.lastTs) existing.lastTs = entry.timestamp;
    } else {
      sessions.set(entry.sessionId, {
        firstTs: entry.timestamp,
        lastTs: entry.timestamp,
        count: 1,
      });
    }
  }

  return Array.from(sessions.entries()).map(([sessionId, data]) => ({
    sessionId,
    ...data,
  }));
}

/**
 * Get the current session ID.
 */
export function getCurrentSessionId(): string {
  return SESSION_ID;
}

/**
 * Get unique tool names from the audit log.
 */
export function getAuditToolNames(): string[] {
  const { entries } = queryAuditLog({ limit: 10000 });
  return [...new Set(entries.map(e => e.tool))].sort();
}

// ============ Observation Bus Integration ============

/**
 * Subscribe the audit writer to an observation bus.
 * Each ToolObservation is recorded as an AuditEntry with a correlating observationId.
 * Returns an unsubscribe function.
 */
export function attachAuditObserver(bus: ObservationBus): () => void {
  return bus.subscribe((obs: ToolObservation) => {
    try {
      recordToolCall(
        obs.toolName,
        obs.inputs,
        obs.outputText || obs.output,
        obs.success,
        obs.durationMs,
        obs.error,
        obs.id,
      );
    } catch {
      // Audit logging is non-critical — never block tool execution
    }
  });
}
