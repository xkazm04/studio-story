'use client';

import React from 'react';
import { ListChecks } from 'lucide-react';
import { INTERACTIVE } from '@/workspace/theme/tokens';
import PanelFrame from '../shared/PanelFrame';
import BeatsOverview from '@/app/features/story/components/Beats/BeatsOverview';
import type { PanelDensity } from '@/workspace/types';

interface BeatsManagerPanelProps {
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
  density?: PanelDensity;
}

export default function BeatsManagerPanel({ onClose, onTriggerSkill, density }: BeatsManagerPanelProps) {
  return (
    <PanelFrame
      title="Beats"
      icon={ListChecks}
      onClose={onClose}
      headerAccent="violet"
      density={density}
      actions={
        onTriggerSkill ? (
          <button
            onClick={() => onTriggerSkill('beat-suggestions')}
            className={`text-xs px-1.5 py-0.5 text-emerald-400 hover:bg-emerald-500/10 rounded ${INTERACTIVE.transition}`}
          >
            AI Suggest
          </button>
        ) : undefined
      }
    >
      <BeatsOverview />
    </PanelFrame>
  );
}
