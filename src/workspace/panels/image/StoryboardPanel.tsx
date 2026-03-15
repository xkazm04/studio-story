'use client';

import React from 'react';
import { Film } from 'lucide-react';
import { StoryboardPipeline } from '@/app/features/image/sub_Sketch/components/StoryboardPipeline';
import PanelFrame from '../shared/PanelFrame';
import type { PanelDensity } from '@/workspace/types';

interface StoryboardPanelProps {
  density?: PanelDensity;
}

const StoryboardPanel: React.FC<StoryboardPanelProps> = ({ density }) => {
  return (
    <PanelFrame title="Storyboard Pipeline" icon={Film} density={density}>
      <StoryboardPipeline />
    </PanelFrame>
  );
};

export default StoryboardPanel;
