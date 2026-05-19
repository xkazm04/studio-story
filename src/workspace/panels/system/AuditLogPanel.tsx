'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, RefreshCw, CheckCircle2, XCircle, Clock, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import type { PanelDensity } from '@/workspace/types';
import { extractData } from '@/app/utils/api';

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

interface AuditLogPanelProps {
  onClose?: () => void;
  density?: PanelDensity;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function EntryRow({ entry, isExpanded, onToggle }: { entry: AuditEntry; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-slate-800/40">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-800/30 transition-colors"
      >
        {isExpanded ? <ChevronDown className="h-3 w-3 text-slate-500 shrink-0" /> : <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />}
        {entry.success
          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          : <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
        <span className="font-mono text-cyan-300 truncate">{entry.tool}</span>
        <span className="ml-auto flex items-center gap-2 shrink-0 text-slate-500">
          <Clock className="h-3 w-3" />
          {formatDuration(entry.durationMs)}
          <span className="text-slate-600">|</span>
          {formatTime(entry.timestamp)}
        </span>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Inputs</div>
            <pre className="text-[11px] bg-slate-900/60 rounded px-2 py-1.5 overflow-auto max-h-32 text-slate-300 font-mono">
              {JSON.stringify(entry.inputs, null, 2)}
            </pre>
          </div>
          {entry.error && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Error</div>
              <pre className="text-[11px] bg-red-950/30 rounded px-2 py-1.5 overflow-auto max-h-24 text-red-300 font-mono">
                {entry.error}
              </pre>
            </div>
          )}
          {entry.output != null && !entry.error && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Output</div>
              <pre className="text-[11px] bg-slate-900/60 rounded px-2 py-1.5 overflow-auto max-h-32 text-slate-300 font-mono">
                {typeof entry.output === 'string' ? entry.output.slice(0, 500) : String(JSON.stringify(entry.output, null, 2) ?? '').slice(0, 500)}
              </pre>
            </div>
          )}
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span>Session: {entry.sessionId.slice(0, 16)}...</span>
            <span>{formatDate(entry.timestamp)} {formatTime(entry.timestamp)}</span>
            <span>ID: {entry.id}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLogPanel({ onClose, density }: AuditLogPanelProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toolFilter, setToolFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [tools, setTools] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(offset));
      if (toolFilter) params.set('tool', toolFilter);
      if (successFilter === 'success') params.set('success', 'true');
      if (successFilter === 'failed') params.set('success', 'false');

      const res = await fetch(`/api/audit-log?${params}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = extractData(await res.json());
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [toolFilter, successFilter, offset]);

  const fetchTools = useCallback(async () => {
    try {
      const res = await fetch('/api/audit-log?mode=tools');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = extractData(await res.json());
      setTools(data.tools ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { fetchTools(); }, [fetchTools]);

  const successCount = entries.filter(e => e.success).length;
  const failedCount = entries.filter(e => !e.success).length;

  const actions = (
    <button
      onClick={() => { setOffset(0); fetchEntries(); fetchTools(); }}
      className="p-1 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
      title="Refresh"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );

  return (
    <PanelFrame title="Audit Log" icon={ScrollText} onClose={onClose} headerAccent="amber" density={density} actions={actions} isLoading={loading}>
      <div className="flex h-full min-h-0 flex-col">
        {/* Filter bar */}
        <div className="shrink-0 border-b border-slate-800/40 bg-slate-900/35 px-3 py-2 flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <select
            value={toolFilter}
            onChange={e => { setToolFilter(e.target.value); setOffset(0); }}
            className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-300 max-w-[180px]"
          >
            <option value="">All tools</option>
            {tools.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={successFilter}
            onChange={e => { setSuccessFilter(e.target.value as 'all' | 'success' | 'failed'); setOffset(0); }}
            className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1 text-xs text-slate-300"
          >
            <option value="all">All status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-500">
            <span className="text-emerald-400">{successCount} ok</span>
            {failedCount > 0 && <span className="text-red-400">{failedCount} err</span>}
            <span>{total} total</span>
          </div>
        </div>

        {/* Entries list */}
        <div className="min-h-0 flex-1 overflow-auto">
          {entries.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <ScrollText className="h-8 w-8 text-slate-600" />
              <p className="text-sm">No audit entries yet</p>
              <p className="text-xs">Tool calls will appear here as they happen</p>
            </div>
          )}
          {entries.map(entry => (
            <EntryRow
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            />
          ))}
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="shrink-0 border-t border-slate-800/40 bg-slate-900/35 px-3 py-1.5 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-2 py-0.5 rounded bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span>{offset + 1}-{Math.min(offset + limit, total)} of {total}</span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-2 py-0.5 rounded bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </PanelFrame>
  );
}
