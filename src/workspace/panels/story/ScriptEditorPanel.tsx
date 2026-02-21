'use client';

import React, { Suspense, lazy } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';

const StoryScript = lazy(
  () => import('@/app/features/story/sub_StoryScript/StoryScript')
);

interface ScriptEditorPanelProps {
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
}

export default function ScriptEditorPanel({ onClose, onTriggerSkill }: ScriptEditorPanelProps) {
  return (
    <PanelFrame
      title="Script Editor"
      icon={FileText}
      onClose={onClose}
      headerAccent="amber"
      actions={
        onTriggerSkill ? (
          <button
            onClick={() => onTriggerSkill('scene-generation')}
            className="text-[9px] px-1.5 py-0.5 text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
          >
            Generate
          </button>
        ) : undefined
      }
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
          </div>
        }
      >
        <StoryScript />
      </Suspense>
    </PanelFrame>
  );
}
