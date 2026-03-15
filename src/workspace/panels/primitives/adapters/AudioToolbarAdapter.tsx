'use client';

import React from 'react';
import { AudioLines } from 'lucide-react';
import PanelFrame from '../../shared/PanelFrame';
import { PanelEmptyState } from '../../shared/PanelPrimitives';
import type { PanelDensity } from '@/workspace/types';

interface AudioToolbarAdapterProps {
  onClose?: () => void;
  density?: PanelDensity;
}

export default function AudioToolbarAdapter({ onClose, density }: AudioToolbarAdapterProps) {
  return (
    <PanelFrame title="Audio" icon={AudioLines} onClose={onClose} headerAccent="emerald" density={density}>
      <PanelEmptyState
        icon={AudioLines}
        title="Audio controls coming soon"
        description="Audio assignment and playback controls will appear here."
      />
    </PanelFrame>
  );
}
