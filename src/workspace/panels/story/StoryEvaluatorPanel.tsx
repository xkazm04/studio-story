'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { PanelSectionTitle } from '../shared/PanelPrimitives';
import ActOverview from '@/app/features/story/components/ActOverview';
import type { PanelDensity } from '@/workspace/types';

interface StoryEvaluatorPanelProps {
  onClose?: () => void;
  density?: PanelDensity;
}

export default function StoryEvaluatorPanel({ onClose, density }: StoryEvaluatorPanelProps) {
  return (
    <PanelFrame title="Evaluator" icon={BarChart3} onClose={onClose} headerAccent="violet" density={density}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-slate-800/40 bg-slate-900/35 px-3 py-2">
          <PanelSectionTitle
            title="Story Health"
            subtitle="Review pacing, structure, and narrative balance across acts."
          />
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <ActOverview />
        </div>
      </div>
    </PanelFrame>
  );
}
