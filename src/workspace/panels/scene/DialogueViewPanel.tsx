'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import type { PanelDensity } from '@/workspace/types';

interface DialogueLine {
  speaker: string;
  text: string;
  emotion?: string;
}

interface DialogueViewPanelProps {
  sceneId?: string;
  lines?: DialogueLine[];
  onClose?: () => void;
  density?: PanelDensity;
}

export default function DialogueViewPanel({
  lines = [],
  onClose,
  density,
}: DialogueViewPanelProps) {
  return (
    <PanelFrame title="Dialogue" icon={MessageCircle} onClose={onClose} headerAccent="amber" density={density}>
      <div className="p-3 space-y-3 overflow-auto h-full">
        {lines.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No dialogue lines yet. Generate dialogue via the terminal.
          </div>
        ) : (
          lines.map((line, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="shrink-0 w-20 text-right">
                <p className="text-sm font-bold text-blue-400">{line.speaker}</p>
                {line.emotion && (
                  <p className="text-sm text-slate-400 italic">({line.emotion})</p>
                )}
              </div>
              <div className="flex-1 bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-800/40">
                <p className="text-sm text-slate-200 leading-relaxed">{line.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </PanelFrame>
  );
}
