'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/app/lib/utils';
import { Server } from 'lucide-react';

type ConnectionStatus = 'connecting' | 'connected' | 'unreachable' | 'error';

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
        const data = await res.json();
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
      case 'connected': return 'bg-emerald-500';
      case 'connecting': return 'bg-amber-500 animate-pulse';
      case 'unreachable':
      case 'error':
      default:
        return 'bg-red-500';
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

  return (
    <div 
      className="group relative flex items-center gap-1.5 px-1.5 py-0.5 rounded cursor-help transition-colors hover:bg-slate-800"
      title={getTooltip()}
    >
      <Server className="w-3.5 h-3.5 text-slate-400" />
      <div className={cn('w-2 h-2 rounded-full', getStatusColor())} />
    </div>
  );
}
