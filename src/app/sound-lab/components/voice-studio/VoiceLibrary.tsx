'use client';

import { useState, useMemo } from 'react';
import {
  Mic, Search, PanelLeftClose, ChevronRight, Upload,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import VoiceCloneUpload from './VoiceCloneUpload';
import type { MockVoice } from '../../types';

type GenderFilter = 'all' | 'male' | 'female' | 'neutral';

interface VoiceLibraryProps {
  onCollapse: () => void;
  selectedVoiceId: string;
  onSelectVoice: (voice: MockVoice) => void;
  voices: MockVoice[];
  isConnected?: boolean;
}

const GENDER_FILTERS: { value: GenderFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'neutral', label: 'Neutral' },
];

function VoiceRow({
  voice,
  isSelected,
  onSelect,
}: {
  voice: MockVoice;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const initials = voice.name.split(' ').map((w) => w[0]).join('').slice(0, 2);

  // Generate a consistent waveform for preview
  const waveform = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => {
      const seed = voice.id.charCodeAt(1) ?? 42;
      return Math.max(0.1, Math.min(1, 0.5 + Math.sin(i * 0.8 + seed) * 0.35 + (((seed * i * 7) % 100) / 200 - 0.25)));
    }),
    [voice.id]
  );

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-150',
        isSelected
          ? 'bg-orange-500/10 ring-1 ring-orange-500/30'
          : 'hover:bg-slate-800/40'
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border',
        isSelected
          ? 'bg-orange-500/20 border-orange-500/40'
          : 'bg-slate-800/60 border-slate-700/40'
      )}>
        <span className={cn(
          'text-[11px] font-semibold',
          isSelected ? 'text-orange-400' : 'text-slate-400'
        )}>
          {initials}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            'text-[11px] font-medium truncate',
            isSelected ? 'text-orange-300' : 'text-slate-200'
          )}>
            {voice.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] px-1.5 py-0 rounded bg-slate-800/60 text-slate-400">
            {voice.provider}
          </span>
          <span className="text-[11px] text-slate-500">{voice.gender}</span>
        </div>
      </div>
    </div>
  );
}

export default function VoiceLibrary({ onCollapse, selectedVoiceId, onSelectVoice, voices, isConnected }: VoiceLibraryProps) {
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [showUpload, setShowUpload] = useState(false);

  const filteredVoices = useMemo(() => {
    let list = voices;
    if (genderFilter !== 'all') {
      list = list.filter((v) => v.gender === genderFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.tags.some((t) => t.includes(q)) ||
        v.provider.includes(q)
      );
    }
    return list;
  }, [voices, genderFilter, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 h-8 px-2.5 bg-slate-900/60 border-b border-slate-700/40 shrink-0">
        <Mic className="w-3.5 h-3.5 text-orange-400/80" />
        <span className="text-xs font-semibold text-slate-200">Voices</span>
        <span className={cn(
          'text-[11px] ml-auto mr-1 px-1.5 py-0.5 rounded-full font-medium',
          isConnected
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-slate-800/40 text-slate-500'
        )}>
          {isConnected ? 'Live' : 'Demo'} ({filteredVoices.length})
        </span>
        <button
          onClick={onCollapse}
          className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-2 pt-2 pb-1 shrink-0">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search voices..."
            className="w-full pl-6 pr-2 py-1 bg-slate-950/60 border border-slate-700/40 rounded-md
              text-xs text-slate-200 placeholder:text-slate-500
              focus:outline-none focus:border-orange-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Gender Filter */}
      <div className="flex items-center gap-1 px-2 pb-1.5 shrink-0">
        {GENDER_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setGenderFilter(f.value)}
            className={cn(
              'text-[11px] px-2 py-0.5 rounded-md font-medium transition-all',
              genderFilter === f.value
                ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Voice List */}
      <div className="flex-1 overflow-auto px-1.5 space-y-0.5">
        {filteredVoices.map((voice) => (
          <VoiceRow
            key={voice.id}
            voice={voice}
            isSelected={selectedVoiceId === voice.id}
            onSelect={() => onSelectVoice(voice)}
          />
        ))}

        {filteredVoices.length === 0 && (
          <div className="text-center py-6">
            <span className="text-[11px] text-slate-500">No voices found</span>
          </div>
        )}
      </div>

      {/* Clone New Voice */}
      <div className="shrink-0 p-2 border-t border-slate-800/50">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md
            border border-dashed border-orange-500/30 bg-orange-500/5
            text-[11px] font-medium text-orange-400/80
            hover:bg-orange-500/10 hover:border-orange-500/50 transition-all duration-200"
        >
          <Upload className="w-3.5 h-3.5" />
          Clone Voice
        </button>

        {showUpload && (
          <div className="mt-2">
            <VoiceCloneUpload onClose={() => setShowUpload(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Collapsed sidebar strip — 40px wide */
export function CollapsedVoiceLibrary({
  onExpand,
  voiceCount,
}: {
  onExpand: () => void;
  voiceCount: number;
}) {
  return (
    <div className="flex flex-col items-center h-full py-2 gap-3">
      <button
        onClick={onExpand}
        className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
        title="Expand voice library"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <Mic className="w-3.5 h-3.5 text-orange-400/60" />

      <div className="flex-1" />

      <span className="text-[11px] text-slate-500 font-mono">{voiceCount}</span>
    </div>
  );
}
