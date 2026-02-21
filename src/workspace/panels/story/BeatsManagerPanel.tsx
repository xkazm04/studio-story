'use client';

import React from 'react';
import { ListChecks } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import BeatsOverview from '@/app/features/story/components/Beats/BeatsOverview';

interface BeatsManagerPanelProps {
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
}

export default function BeatsManagerPanel({ onClose, onTriggerSkill }: BeatsManagerPanelProps) {
  return (
    <PanelFrame
      title="Beats"
      icon={ListChecks}
      onClose={onClose}
      headerAccent="violet"
      actions={
        onTriggerSkill ? (
          <button
            onClick={() => onTriggerSkill('beat-suggestions')}
            className="text-[9px] px-1.5 py-0.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
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
