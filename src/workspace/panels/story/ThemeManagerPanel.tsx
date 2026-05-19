'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { usePanelSize } from '../shared/PanelSizeContext';
import { PanelSectionTitle } from '../shared/PanelPrimitives';
import ThemeManager from '@/app/features/story/components/ThemeManager';
import { useThemeStore } from '@/app/store/slices/themeSlice';
import type { PanelDensity } from '@/workspace/types';

interface ThemeManagerPanelProps {
  onClose?: () => void;
  density?: PanelDensity;
}

export default function ThemeManagerPanel({ onClose, density }: ThemeManagerPanelProps) {
  const { themes, addTheme, updateTheme, removeTheme } = useThemeStore();
  const { isCompact } = usePanelSize();

  return (
    <PanelFrame title="Themes" icon={Sparkles} onClose={onClose} headerAccent="violet" density={density}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-slate-800/40 bg-slate-900/35 px-3 py-2">
          <PanelSectionTitle
            title="Theme Library"
            subtitle="Track motifs and thematic signals used across your story."
          />
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <ThemeManager
            themes={themes}
            onAddTheme={addTheme}
            onUpdateTheme={updateTheme}
            onRemoveTheme={removeTheme}
            compact={isCompact}
          />
        </div>
      </div>
    </PanelFrame>
  );
}
