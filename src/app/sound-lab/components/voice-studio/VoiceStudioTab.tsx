'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Mic, Play, Volume2, ChevronDown, Loader2, AlertCircle, Settings2,
  PanelLeftClose, PanelRightClose, Sliders,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import VoiceLibrary, { CollapsedVoiceLibrary } from './VoiceLibrary';
import VoiceCaster from './VoiceCaster';
import PerformanceDirector, { CollapsedPerformance } from './PerformanceDirector';
import NarrationPipeline from './NarrationPipeline';
import { MOCK_VOICES } from '../../data/mockAudioData';
import type { MockVoice, NarrationResult } from '../../types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

interface ElevenLabsVoiceData {
  voice_id: string;
  name: string;
  labels: Record<string, string>;
  description: string;
  preview_url: string;
  settings: { stability: number; similarity_boost: number; style: number } | null;
}

function mapElevenLabsVoice(v: ElevenLabsVoiceData): MockVoice {
  return {
    id: v.voice_id,
    name: v.name,
    provider: 'elevenlabs',
    gender: (['male', 'female', 'neutral'].includes(v.labels?.gender) ? v.labels.gender : 'neutral') as MockVoice['gender'],
    ageRange: v.labels?.age || 'adult',
    description: v.description || '',
    tags: Object.values(v.labels || {}),
    stability: v.settings?.stability ?? 0.5,
    similarity: v.settings?.similarity_boost ?? 0.75,
    style: v.settings?.style ?? 0.5,
    speed: 1.0,
  };
}

interface VoiceStudioTabProps {
  onNarrationComplete?: (result: NarrationResult) => void;
}

export default function VoiceStudioTab({ onNarrationComplete }: VoiceStudioTabProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Voice catalog — real ElevenLabs voices or mock fallback
  const [voices, setVoices] = useState<MockVoice[]>(MOCK_VOICES);
  const [voicesConnected, setVoicesConnected] = useState(false);

  useEffect(() => {
    if (USE_MOCK) return;
    let cancelled = false;
    fetch('/api/ai/audio/voices')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.success || !data.voices?.length) return;
        const mapped = (data.voices as ElevenLabsVoiceData[]).map(mapElevenLabsVoice);
        setVoices(mapped);
        setVoicesConnected(true);
      })
      .catch(() => {}); // Silently fall back to mock voices
    return () => { cancelled = true; };
  }, []);

  // Toolbar state
  const [selectedVoice, setSelectedVoice] = useState<MockVoice>(MOCK_VOICES[0]!);
  const [previewText, setPreviewText] = useState('');
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  // Castings from VoiceCaster (for NarrationPipeline)
  const [castings, setCastings] = useState<Record<string, string>>({});

  // Voice settings (synced with PerformanceDirector)
  const [voiceSettings, setVoiceSettings] = useState({
    stability: selectedVoice.stability,
    similarity_boost: selectedVoice.similarity,
    style: selectedVoice.style,
    speed: selectedVoice.speed,
  });

  const handleSelectVoice = useCallback((voice: MockVoice) => {
    setSelectedVoice(voice);
    setShowVoiceMenu(false);
    setVoiceSettings({
      stability: voice.stability,
      similarity_boost: voice.similarity,
      style: voice.style,
      speed: voice.speed,
    });
  }, []);

  const handlePreview = useCallback(async () => {
    const text = previewText.trim();
    if (!text) return;

    setIsGenerating(true);
    setGenerationError(null);
    setLastAudioUrl(null);

    try {
      const res = await fetch('/api/ai/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice_id: selectedVoice.id,
          voice_settings: voiceSettings,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'TTS generation failed');
      }

      setLastAudioUrl(data.audioUrl);

      // Auto-play
      const audio = new Audio(data.audioUrl);
      audio.play();
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setIsGenerating(false);
    }
  }, [previewText, selectedVoice, voiceSettings]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Toolbar — full width */}
      <div className="shrink-0 border-b border-slate-700/40 bg-slate-900/60">
        <div className="flex items-center gap-2 h-11 px-3">
          {/* Voice Selector */}
          <div className="relative">
            <button
              onClick={() => setShowVoiceMenu(!showVoiceMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-700/50
                bg-slate-800/40 text-xs text-slate-300 hover:border-slate-600 transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-medium max-w-[120px] truncate">{selectedVoice.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
            {showVoiceMenu && (
              <div className="absolute top-full left-0 mt-1 z-30 min-w-[180px] max-h-[240px] overflow-auto
                rounded-md border border-slate-700/50 bg-slate-900 shadow-xl shadow-black/30">
                {voices.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVoice(v)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-[11px] transition-colors',
                      selectedVoice.id === v.id
                        ? 'text-orange-400 bg-orange-500/10'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    )}
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-semibold text-slate-400">
                        {v.name.charAt(0)}
                      </span>
                    </div>
                    <span className="truncate">{v.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview Text Input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handlePreview()}
              placeholder="Type text to preview voice performance..."
              className="w-full px-3 py-1.5 bg-slate-950/60 border border-slate-700/40 rounded-md
                text-xs text-slate-200 placeholder:text-slate-500
                focus:outline-none focus:border-orange-500/40 transition-colors"
            />
          </div>

          {/* Preview Button */}
          <button
            onClick={handlePreview}
            disabled={isGenerating || !previewText.trim()}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-all',
              isGenerating
                ? 'bg-orange-600/40 text-orange-300 cursor-not-allowed'
                : !previewText.trim()
                  ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-500'
            )}
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {isGenerating ? 'Generating...' : 'Preview'}
          </button>

          {/* Last result play */}
          {lastAudioUrl && (
            <button
              onClick={() => {
                const audio = new Audio(lastAudioUrl);
                audio.play();
              }}
              className="p-1.5 rounded-md text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 transition-colors"
              title="Replay last preview"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Separator */}
          <div className="w-px h-5 bg-slate-700/50" />

          {/* Toggle Right Panel */}
          <button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              !rightPanelCollapsed ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-slate-200'
            )}
            title="Performance Settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Error Bar */}
        {generationError && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border-t border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-[11px] text-red-400 truncate">{generationError}</span>
            <button
              onClick={() => setGenerationError(null)}
              className="ml-auto text-[11px] text-slate-500 hover:text-slate-300"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Main: sidebar + center + right panel */}
      <div className="flex-1 flex min-h-0">
        {/* Collapsible Voice Library */}
        <div
          className={cn(
            'shrink-0 border-r border-slate-700/40 transition-all duration-200',
            sidebarCollapsed ? 'w-10' : 'w-60'
          )}
        >
          {sidebarCollapsed ? (
            <CollapsedVoiceLibrary
              onExpand={() => setSidebarCollapsed(false)}
              voiceCount={voices.length}
            />
          ) : (
            <VoiceLibrary
              onCollapse={() => setSidebarCollapsed(true)}
              selectedVoiceId={selectedVoice.id}
              onSelectVoice={handleSelectVoice}
              voices={voices}
              isConnected={voicesConnected}
            />
          )}
        </div>

        {/* Voice Caster — hero */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <VoiceCaster
              selectedVoice={selectedVoice}
              previewText={previewText}
              voices={voices}
              onCastingsChange={setCastings}
            />
          </div>

          {/* Narration Pipeline — collapsible below caster */}
          <NarrationPipeline
            castings={castings}
            voiceSettings={voiceSettings}
            onNarrationComplete={onNarrationComplete}
          />
        </div>

        {/* Performance Director — collapsible right panel */}
        <div
          className={cn(
            'shrink-0 border-l border-slate-700/40 transition-all duration-200',
            rightPanelCollapsed ? 'w-10' : 'w-72'
          )}
        >
          {rightPanelCollapsed ? (
            <CollapsedPerformance
              onExpand={() => setRightPanelCollapsed(false)}
            />
          ) : (
            <PerformanceDirector
              onCollapse={() => setRightPanelCollapsed(true)}
              voiceSettings={voiceSettings}
              onSettingsChange={setVoiceSettings}
              selectedVoiceId={selectedVoice.id}
              previewText={previewText}
            />
          )}
        </div>
      </div>
    </div>
  );
}
