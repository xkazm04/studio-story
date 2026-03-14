'use client';

import React from 'react';
import type { LLMTransportStatus } from '@dzin/core';
import { Tooltip } from '@/app/components/UI/Tooltip';

// ---------------------------------------------------------------------------
// Status Mapping
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<LLMTransportStatus, { color: string; label: string; pulse: boolean }> = {
  idle: { color: 'bg-emerald-500', label: 'AI Connected', pulse: false },
  sending: { color: 'bg-amber-500', label: 'AI Processing...', pulse: true },
  streaming: { color: 'bg-amber-500', label: 'AI Processing...', pulse: true },
  error: { color: 'bg-red-500', label: 'AI Slow - Retrying...', pulse: false },
  disconnected: { color: 'bg-red-500', label: 'AI Disconnected', pulse: false },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface LLMStatusDotProps {
  status?: LLMTransportStatus;
}

const LLMStatusDot: React.FC<LLMStatusDotProps> = ({ status = 'disconnected' }) => {
  const config = STATUS_CONFIG[status];

  return (
    <Tooltip content={config.label} position="bottom">
      <div className="flex items-center justify-center w-5 h-5 cursor-default">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${config.color} ${config.pulse ? 'animate-[llm-pulse_1.5s_ease-in-out_infinite]' : ''}`}
          aria-label={config.label}
        />
      </div>
    </Tooltip>
  );
};

export default LLMStatusDot;
