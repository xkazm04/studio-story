'use client';

/**
 * SoundLab — Legacy 2-tab version (dormant)
 *
 * This file is NOT imported by page.tsx. The active entry point is SoundStudio.tsx
 * which uses the new 3-tab architecture (Mixer / Composer / Beats).
 * Kept as reference for the Voice Studio → Sound Designer narration pipeline.
 */

import { useState, useCallback } from 'react';
import { Mic, Music } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { NarrationResult } from './types';
import VoiceStudioTab from './components/voice-studio/VoiceStudioTab';
import SoundDesignerTab from './components/sound-designer/SoundDesignerTab';

type LegacySoundLabTab = 'voice-studio' | 'sound-designer';

const TABS: { id: LegacySoundLabTab; label: string; icon: typeof Mic }[] = [
  { id: 'voice-studio', label: 'Voice Studio', icon: Mic },
  { id: 'sound-designer', label: 'Sound Designer', icon: Music },
];

export default function SoundLab() {
  const [activeTab, setActiveTab] = useState<LegacySoundLabTab>('sound-designer');
  const [pendingNarration, setPendingNarration] = useState<NarrationResult | null>(null);

  const handleNarrationComplete = useCallback((result: NarrationResult) => {
    setPendingNarration(result);
    setActiveTab('sound-designer');
  }, []);

  const handleNarrationConsumed = useCallback(() => {
    setPendingNarration(null);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header + Tab Bar */}
      <div className="shrink-0 bg-slate-900/80 border-b border-slate-700/50">
        <div className="flex items-center gap-6 px-6 h-11">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Music className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-200 tracking-tight">Sound Lab</span>
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">
              ElevenLabs + BS-RoFormer
            </span>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 ml-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
                    isActive
                      ? 'bg-orange-500/15 text-orange-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'voice-studio' && (
          <VoiceStudioTab onNarrationComplete={handleNarrationComplete} />
        )}
        {activeTab === 'sound-designer' && (
          <SoundDesignerTab
            pendingNarration={pendingNarration}
            onNarrationConsumed={handleNarrationConsumed}
          />
        )}
      </div>
    </div>
  );
}
