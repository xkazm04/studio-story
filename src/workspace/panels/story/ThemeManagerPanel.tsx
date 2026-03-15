'use client';

import React, { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import PanelFrame from '../shared/PanelFrame';
import { usePanelSize } from '../shared/PanelSizeContext';
import { PanelSectionTitle } from '../shared/PanelPrimitives';
import ThemeManager from '@/app/features/story/components/ThemeManager';
import type { Theme } from '@/lib/themes/ThemeTracker';
import type { PanelDensity } from '@/workspace/types';

interface ThemeManagerPanelProps {
  onClose?: () => void;
  density?: PanelDensity;
}

export default function ThemeManagerPanel({ onClose, density }: ThemeManagerPanelProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const { isCompact } = usePanelSize();

  const handleAdd = useCallback((theme: Omit<Theme, 'id'>) => {
    setThemes((prev) => [...prev, { ...theme, id: `theme-${Date.now()}` }]);
  }, []);

  const handleUpdate = useCallback((id: string, updates: Partial<Theme>) => {
    setThemes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    setThemes((prev) => prev.filter((t) => t.id !== id));
  }, []);

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
            onAddTheme={handleAdd}
            onUpdateTheme={handleUpdate}
            onRemoveTheme={handleRemove}
            compact={isCompact}
          />
        </div>
      </div>
    </PanelFrame>
  );
}
