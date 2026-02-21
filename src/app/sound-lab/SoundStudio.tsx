'use client';

import { useState, useCallback } from 'react';
import { Music, Layers, Wand2, Grid3X3, FlaskConical } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cn } from '@/app/lib/utils';
import { extractWaveformFromUrl } from './lib/waveformExtractor';
import type { SoundLabTab, AudioAsset, GeneratedAudioResult } from './types';

// Lazy imports for tab components
import MixerTab from './components/mixer/MixerTab';
import ComposerTab from './components/composer/ComposerTab';
import BeatsTab from './components/beats/BeatsTab';
import LabTab from './components/lab/LabTab';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

const TABS: { id: SoundLabTab; label: string; icon: typeof Music }[] = [
  { id: 'mixer', label: 'Mixer', icon: Layers },
  { id: 'composer', label: 'Composer', icon: Wand2 },
  { id: 'beats', label: 'Beats', icon: Grid3X3 },
  { id: 'lab', label: 'Lab', icon: FlaskConical },
];

/**
 * Sound Studio — Full-screen standalone audio studio with 3-tab architecture.
 *
 * Mixer: Timeline, stems, library
 * Composer: ElevenLabs music/SFX/ambience generation + AI Director
 * Beats: Step sequencer + keyboard drum pad
 */
export default function SoundStudio() {
  const [activeTab, setActiveTab] = useState<SoundLabTab>('mixer');
  const [generatedAssets, setGeneratedAssets] = useState<AudioAsset[]>([]);

  const createHandleGenerated = useCallback((source: 'beats' | 'composer' | 'lab') => {
    return async (result: GeneratedAudioResult) => {
      const id = `gen-${Date.now()}`;

      // Extract real waveform from audio data (falls back to generated curve)
      const waveformData = result.audioUrl
        ? await extractWaveformFromUrl(result.audioUrl)
        : Array.from({ length: 48 }, (_, i) => {
            const t = i / 48;
            return Math.max(0.05, Math.min(1, 0.5 + Math.sin(t * Math.PI * 3) * 0.3 + (Math.random() - 0.5) * 0.4));
          });

      const newAsset: AudioAsset = {
        id,
        name: result.name,
        type: result.type,
        duration: result.duration,
        waveformData,
        audioUrl: result.audioUrl,
        source,
      };
      setGeneratedAssets((prev) => [newAsset, ...prev]);
    };
  }, []);

  const handleComposerGenerated = useCallback(
    (result: GeneratedAudioResult) => createHandleGenerated('composer')(result),
    [createHandleGenerated]
  );

  const handleBeatsGenerated = useCallback(
    (result: GeneratedAudioResult) => createHandleGenerated('beats')(result),
    [createHandleGenerated]
  );

  const handleLabGenerated = useCallback(
    (result: GeneratedAudioResult) => createHandleGenerated('lab')(result),
    [createHandleGenerated]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col h-screen bg-slate-950">
        {/* Header + Tab Bar */}
        <div className="shrink-0 bg-slate-900/80 border-b border-slate-700/50">
          <div className="flex items-center gap-6 px-6 h-11">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Music className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-200 tracking-tight">Sound Studio</span>
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">
                ElevenLabs + BS-RoFormer
              </span>
            </div>

            {/* Tab Navigation */}
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

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'mixer' && (
            <MixerTab extraAssets={generatedAssets} />
          )}
          {activeTab === 'composer' && (
            <ComposerTab onGenerated={handleComposerGenerated} />
          )}
          {activeTab === 'beats' && (
            <BeatsTab onGenerated={handleBeatsGenerated} />
          )}
          {activeTab === 'lab' && (
            <LabTab onGenerated={handleLabGenerated} />
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
