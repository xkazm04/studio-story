'use client';

import React from 'react';
import PanelFrame from './PanelFrame';
import { BarChart3 } from 'lucide-react';

export default function StoryEvaluatorPanel(props: Record<string, unknown>) {
  return (
    <PanelFrame title="Evaluator" icon={BarChart3} onClose={props.onClose as (() => void) | undefined} headerAccent="cyan">
      <div className="p-4 text-slate-500 text-xs">
        <p>Evaluator panel — coming soon</p>
      </div>
    </PanelFrame>
  );
}
