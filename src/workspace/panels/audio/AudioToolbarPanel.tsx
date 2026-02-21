'use client';

import React from 'react';
import { AudioLines } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';

interface AudioToolbarPanelProps {
  onClose?: () => void;
}

export default function AudioToolbarPanel({ onClose }: AudioToolbarPanelProps) {
  return (
    <PanelFrame title="Audio" icon={AudioLines} onClose={onClose} headerAccent="emerald">
      <div className="flex items-center justify-center h-full text-slate-600 text-[10px]">
        <AudioLines className="w-3 h-3 mr-1.5 text-slate-700" />
        Audio assignment — coming soon
      </div>
    </PanelFrame>
  );
}
