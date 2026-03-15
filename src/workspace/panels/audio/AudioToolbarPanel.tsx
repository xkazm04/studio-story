'use client';

import React from 'react';
import { AudioLines } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import type { PanelDensity } from '@/workspace/types';

interface AudioToolbarPanelProps {
  onClose?: () => void;
  density?: PanelDensity;
}

export default function AudioToolbarPanel({ onClose, density }: AudioToolbarPanelProps) {
  return (
    <PanelFrame title="Audio" icon={AudioLines} onClose={onClose} headerAccent="emerald" density={density}>
      <div className="flex items-center justify-center h-full text-slate-400 text-sm">
        <AudioLines className="w-3 h-3 mr-1.5 text-slate-400" />
        Audio assignment — coming soon
      </div>
    </PanelFrame>
  );
}
