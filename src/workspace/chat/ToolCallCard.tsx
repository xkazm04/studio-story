'use client';

import React, { useState } from 'react';
import { Loader2, Check, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { ToolCall } from '@dzin/core';

// ---------------------------------------------------------------------------
// ToolCallCard
// ---------------------------------------------------------------------------

interface ToolCallCardProps {
  toolCall: ToolCall;
}

/**
 * Collapsible card displaying a tool call's status, name, args, and result.
 * Shows a spinner while running, checkmark on success, X on error.
 */
export const ToolCallCard = React.memo(function ToolCallCard({
  toolCall,
}: ToolCallCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const duration =
    toolCall.completedAt && toolCall.startedAt
      ? `${((toolCall.completedAt - toolCall.startedAt) / 1000).toFixed(1)}s`
      : null;

  const StatusIcon = () => {
    switch (toolCall.status) {
      case 'running':
        return <Loader2 size={14} className="dzin-spinner text-cyan-400" />;
      case 'success':
        return <Check size={14} className="text-green-400" />;
      case 'error':
        return <X size={14} className="text-red-400" />;
      case 'pending':
        return <Loader2 size={14} className="text-slate-500" />;
    }
  };

  return (
    <div
      data-dzin-chat-tool-call=""
      data-status={toolCall.status}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2 text-left"
      >
        {isExpanded ? (
          <ChevronDown size={12} className="text-slate-400 shrink-0" />
        ) : (
          <ChevronRight size={12} className="text-slate-400 shrink-0" />
        )}
        <StatusIcon />
        <span className="text-slate-300 font-medium truncate">
          {toolCall.name}
        </span>
        {duration && (
          <span className="text-slate-500 text-xs ml-auto shrink-0">
            {duration}
          </span>
        )}
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-2 space-y-2 pl-6">
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wider">
              Args
            </span>
            <pre className="text-xs text-slate-400 mt-1 overflow-x-auto">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>
          {toolCall.result !== undefined && (
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Result
              </span>
              <pre className="text-xs text-slate-400 mt-1 overflow-x-auto">
                {JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.error && (
            <div>
              <span className="text-xs text-red-500 uppercase tracking-wider">
                Error
              </span>
              <pre className="text-xs text-red-400 mt-1 overflow-x-auto">
                {toolCall.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
