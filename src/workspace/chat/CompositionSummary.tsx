'use client';

import React from 'react';
import { Layout } from 'lucide-react';
import type { CompositionSummary as CompositionSummaryType } from '@dzin/core';

// ---------------------------------------------------------------------------
// CompositionSummary
// ---------------------------------------------------------------------------

interface CompositionSummaryProps {
  summary: CompositionSummaryType;
}

/**
 * Inline workspace composition card shown in the chat when the workspace
 * layout is updated. Displays panel types and layout template name.
 */
export const CompositionSummary = React.memo(function CompositionSummary({
  summary,
}: CompositionSummaryProps) {
  const panelList = summary.panels.map((p) => p.type).join(', ');

  return (
    <div data-dzin-chat-composition="" className="flex items-center gap-2">
      <Layout size={14} className="text-cyan-400 shrink-0" />
      <span>
        <span className="text-slate-300">Workspace updated:</span>{' '}
        <span className="text-slate-400">{panelList}</span>{' '}
        <span className="text-slate-500">({summary.layout})</span>
      </span>
    </div>
  );
});
