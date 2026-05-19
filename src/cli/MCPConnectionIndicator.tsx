'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/app/lib/utils';
import { Server } from 'lucide-react';
import { extractData } from '@/app/utils/api';

type ConnectionStatus = 'connecting' | 'connected' | 'unreachable' | 'error';

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connected: 'OK',
  connecting: '...',
  unreachable: '!',
  error: '!',
};

interface HealthData {
  status: ConnectionStatus;
  baseUrl?: string | null;
  projectId?: string | null;
  message?: string;
}

export function MCPConnectionIndicator() {
  const [health, setHealth] = useState<HealthData>({ status: 'connecting' });

  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      try {
        const res = await fetch('/api/claude-terminal/mcp-health');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = extractData(await res.json());
        if (mounted) {
          setHealth({
            status: data.status,
            baseUrl: data.baseUrl,
            projectId: data.projectId,
            message: data.message,
          });
        }
      } catch (err) {
        if (mounted) {
          setHealth((prev) => ({ ...prev, status: 'error', message: String(err) }));
        }
      }
    };

    checkHealth();

    const interval = setInterval(checkHealth, 30000); // 30s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    switch (health.status) {
      case 'connected': return 'ms-status-ok';
      case 'connecting': return 'ms-status-pending animate-pulse';
      case 'unreachable':
      case 'error':
      default:
        return 'ms-status-fail';
    }
  };

  const getTooltip = () => {
    if (health.status === 'connecting') return 'Checking MCP Server connection...';
    const lines = [];
    
    if (health.status === 'connected') lines.push('MCP Server: Connected');
    else if (health.status === 'unreachable') lines.push('MCP Server: Unreachable');
    else lines.push(`MCP Server: Error`);

    if (health.baseUrl) lines.push(`Base URL: ${health.baseUrl}`);
    if (health.projectId) lines.push(`Project ID: ${health.projectId}`);
    if (health.message) lines.push(`Details: ${health.message}`);

    return lines.join('\n');
  };

  const statusLabel = STATUS_LABELS[health.status];
  const ariaLabel = health.status === 'connected'
    ? 'MCP server connected'
    : health.status === 'connecting'
      ? 'MCP server connecting'
      : 'MCP server disconnected';

  return (
    <div
      className="group relative flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-help transition-colors hover:bg-[var(--ms-bg-elevated)]"
      title={getTooltip()}
      role="status"
      aria-label={ariaLabel}
    >
      <Server className="w-3.5 h-3.5 text-[var(--ms-text-muted)]" aria-hidden="true" />
      <div className={cn('w-2 h-2 rounded-full', getStatusColor())} aria-hidden="true" />
      <span className="text-[10px] font-mono leading-none text-[var(--ms-text-muted)]">
        {statusLabel}
      </span>
    </div>
  );
}
