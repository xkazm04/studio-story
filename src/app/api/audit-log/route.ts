import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

interface AuditEntry {
  id: string;
  tool: string;
  inputs: Record<string, unknown>;
  output: unknown;
  success: boolean;
  error?: string;
  timestamp: string;
  durationMs: number;
  sessionId: string;
}

interface AuditIndex {
  totalEntries: number;
  activeFile: string;
  files: Array<{ name: string; entries: number; firstTs: string; lastTs: string }>;
  updatedAt: string;
}

const AUDIT_DIR = path.join(process.cwd(), '.story', 'audit');
const INDEX_FILE = path.join(AUDIT_DIR, 'index.json');

function readIndex(): AuditIndex | null {
  if (!fs.existsSync(INDEX_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

function readEntries(index: AuditIndex, query: {
  tool?: string;
  success?: boolean;
  since?: string;
  until?: string;
  sessionId?: string;
  limit: number;
  offset: number;
}): { entries: AuditEntry[]; total: number } {
  const allEntries: AuditEntry[] = [];
  const filesToRead = [...index.files].reverse();

  for (const fileInfo of filesToRead) {
    const filePath = path.join(AUDIT_DIR, fileInfo.name);
    if (!fs.existsSync(filePath)) continue;
    if (query.since && fileInfo.lastTs < query.since) continue;
    if (query.until && fileInfo.firstTs > query.until) continue;

    const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const entry = JSON.parse(line) as AuditEntry;
        if (query.tool && entry.tool !== query.tool) continue;
        if (query.success !== undefined && entry.success !== query.success) continue;
        if (query.sessionId && entry.sessionId !== query.sessionId) continue;
        if (query.since && entry.timestamp < query.since) continue;
        if (query.until && entry.timestamp > query.until) continue;
        allEntries.push(entry);
      } catch {
        // skip
      }
    }
  }

  allEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    entries: allEntries.slice(query.offset, query.offset + query.limit),
    total: allEntries.length,
  };
}

/**
 * GET /api/audit-log?tool=&success=&since=&until=&sessionId=&limit=&offset=&mode=
 *
 * Modes: entries (default), sessions, tools, summary
 */
export const GET = withApiHandler('GET /api/audit-log', async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const mode = params.get('mode') || 'entries';
  const index = readIndex();

  if (!index || index.totalEntries === 0) {
    return NextResponse.json({ entries: [], total: 0, sessions: [], tools: [] });
  }

  if (mode === 'sessions') {
    const { entries } = readEntries(index, { limit: 10000, offset: 0 });
    const sessions = new Map<string, { firstTs: string; lastTs: string; count: number }>();
    for (const entry of entries) {
      const existing = sessions.get(entry.sessionId);
      if (existing) {
        existing.count++;
        if (entry.timestamp < existing.firstTs) existing.firstTs = entry.timestamp;
        if (entry.timestamp > existing.lastTs) existing.lastTs = entry.timestamp;
      } else {
        sessions.set(entry.sessionId, { firstTs: entry.timestamp, lastTs: entry.timestamp, count: 1 });
      }
    }
    return NextResponse.json({
      sessions: Array.from(sessions.entries()).map(([id, d]) => ({ sessionId: id, ...d })),
    });
  }

  if (mode === 'tools') {
    const { entries } = readEntries(index, { limit: 10000, offset: 0 });
    const tools = [...new Set(entries.map(e => e.tool))].sort();
    return NextResponse.json({ tools });
  }

  const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
  const offset = parseInt(params.get('offset') || '0', 10);
  const successParam = params.get('success');

  const result = readEntries(index, {
    tool: params.get('tool') || undefined,
    success: successParam === null ? undefined : successParam === 'true',
    since: params.get('since') || undefined,
    until: params.get('until') || undefined,
    sessionId: params.get('sessionId') || undefined,
    limit,
    offset,
  });

  if (mode === 'summary') {
    const toolCounts: Record<string, { total: number; success: number; failed: number; avgMs: number }> = {};
    for (const entry of result.entries) {
      if (!toolCounts[entry.tool]) {
        toolCounts[entry.tool] = { total: 0, success: 0, failed: 0, avgMs: 0 };
      }
      const tc = toolCounts[entry.tool];
      tc.total++;
      if (entry.success) tc.success++;
      else tc.failed++;
      tc.avgMs = Math.round(((tc.avgMs * (tc.total - 1)) + entry.durationMs) / tc.total);
    }
    return NextResponse.json({ totalEntries: result.total, toolCounts });
  }

  return NextResponse.json({
    entries: result.entries,
    total: result.total,
    offset,
    limit,
  });
});
