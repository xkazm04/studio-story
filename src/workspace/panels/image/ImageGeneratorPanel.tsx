'use client';

import React, { Suspense, lazy } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';

const ImageGenerator = lazy(
  () => import('@/app/features/image/generator/ImageGenerator')
);

interface ImageGeneratorPanelProps {
  onClose?: () => void;
  onTriggerSkill?: (skillId: string, params?: Record<string, unknown>) => void;
}

export default function ImageGeneratorPanel({ onClose, onTriggerSkill }: ImageGeneratorPanelProps) {
  return (
    <PanelFrame
      title="Image Generator"
      icon={ImagePlus}
      onClose={onClose}
      headerAccent="rose"
      actions={
        onTriggerSkill ? (
          <button
            onClick={() => onTriggerSkill('image-prompt-compose')}
            className="text-[9px] px-1.5 py-0.5 text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
          >
            AI Compose
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
        <ImageGenerator />
      </Suspense>
    </PanelFrame>
  );
}
