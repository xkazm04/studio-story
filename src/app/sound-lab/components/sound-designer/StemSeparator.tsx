'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Scissors, Upload, Volume2, VolumeX, Headphones, Download, Loader2, X, FileAudio, AlertCircle, Plus, Copy, Play } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import WaveformVisualizer from '../shared/WaveformVisualizer';
import { extractWaveformFromUrl } from '../../lib/waveformExtractor';
import { MOCK_STEMS } from '../../data/mockAudioData';
import { STEM_TYPE_STYLES, STEM_MODE_CONFIG } from '../../types';
import SoundContextMenu, { ActionItem, MenuDivider, MenuHeader } from '../context-menus/SoundContextMenu';
import { useSoundContextMenu } from '../context-menus/useSoundContextMenu';
import type { StemResult, StemMode, StemType, StemProvider } from '../../types';

interface StemSeparatorProps {
  onClose: () => void;
  audioUrl?: string;     // base64 data URL to auto-process (skips upload)
  audioName?: string;    // display name for auto-processed file
}

interface StemWithUrl extends StemResult {
  audioUrl?: string;
}

function StemRow({ stem, onToggleMute, onToggleSolo, onVolumeChange, onDownload, onPlay, onContextMenu }: {
  stem: StemWithUrl;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onVolumeChange: (v: number) => void;
  onDownload: () => void;
  onPlay: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) {
  const style = STEM_TYPE_STYLES[stem.type];

  return (
    <div
      onContextMenu={onContextMenu}
      className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-md border transition-all duration-200 border-l-4',
      style.borderClass,
      stem.muted
        ? 'border-slate-800/30 bg-slate-900/20 opacity-50'
        : stem.solo
          ? 'border-slate-700/50 bg-slate-800/30'
          : 'border-slate-800/40 bg-slate-900/30'
    )}>
      {/* Label */}
      <div className="w-16 shrink-0">
        <span className={cn('text-xs font-medium', style.textClass)}>{style.label}</span>
      </div>

      {/* Waveform */}
      <div className="flex-1 cursor-pointer" onClick={onPlay}>
        <WaveformVisualizer
          data={stem.waveformData}
          height={28}
          barWidth={2}
          gap={1}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggleMute}
          className={cn(
            'p-1 rounded transition-colors',
            stem.muted ? 'text-red-400 bg-red-500/10' : 'text-slate-400 hover:text-slate-200'
          )}
          title="Mute"
        >
          {stem.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onToggleSolo}
          className={cn(
            'p-1 rounded transition-colors',
            stem.solo ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-slate-200'
          )}
          title="Solo"
        >
          <Headphones className="w-3.5 h-3.5" />
        </button>

        {/* Volume Slider */}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(stem.volume * 100)}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          className="w-16 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-300"
        />
        <span className="text-[11px] text-slate-400 font-mono w-8 text-right">
          {Math.round(stem.volume * 100)}%
        </span>

        <button
          onClick={onDownload}
          className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          title="Download Stem"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function StemSeparator({ onClose, audioUrl: autoAudioUrl, audioName }: StemSeparatorProps) {
  const [state, setState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [stems, setStems] = useState<StemWithUrl[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [stemMode, setStemMode] = useState<StemMode>('2stem');
  const [provider, setProvider] = useState<StemProvider>('elevenlabs');
  const [isMockFallback, setIsMockFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { position: ctxPos, target: ctxTarget, handleContextMenu: handleStemCtx, hide: hideStemCtx } = useSoundContextMenu();
  const autoProcessedRef = useRef(false);

  const handleStemModeChange = useCallback((mode: StemMode) => {
    setStemMode(mode);
    // ElevenLabs has no 4-stem option — auto-switch to HuggingFace
    if (mode === '4stem' && provider === 'elevenlabs') {
      setProvider('huggingface');
    }
  }, [provider]);

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name);
    setState('processing');
    setErrorMsg('');
    setIsMockFallback(false);

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('stemMode', stemMode);

      const endpoint = provider === 'elevenlabs'
        ? '/api/ai/audio/stem-separation'
        : '/api/ai/audio/stems';

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.stems?.length > 0) {
        // Build stems with real waveforms extracted from audio
        const stemResults: StemWithUrl[] = await Promise.all(
          data.stems.map(async (stem: { type: string; audioUrl: string }) => {
            let waveformData: number[];
            try {
              waveformData = await extractWaveformFromUrl(stem.audioUrl, 80);
            } catch {
              waveformData = Array.from({ length: 80 }, () => Math.random() * 0.5 + 0.1);
            }
            return {
              type: stem.type as StemType,
              waveformData,
              volume: 0.8,
              muted: false,
              solo: false,
              audioUrl: stem.audioUrl,
            };
          })
        );
        setStems(stemResults);
        setState('done');
        return;
      }

      // API returned success: false
      if (data.error) {
        setErrorMsg(`${data.error} — showing demo stems`);
      }
    } catch {
      const providerLabel = provider === 'elevenlabs' ? 'ElevenLabs' : 'BS-RoFormer';
      setErrorMsg(`${providerLabel} unavailable — showing demo stems`);
    }

    // Mock fallback — filter by selected stem mode
    setIsMockFallback(true);
    const allowedTypes = STEM_MODE_CONFIG[stemMode].stemTypes;
    setTimeout(() => {
      setStems(
        MOCK_STEMS
          .filter((s) => allowedTypes.includes(s.type))
          .map((s) => ({ ...s }))
      );
      setState('done');
    }, 2000);
  }, [stemMode, provider]);

  // Auto-process when audioUrl prop is provided (e.g., from Composer stem button)
  useEffect(() => {
    if (autoAudioUrl && !autoProcessedRef.current) {
      autoProcessedRef.current = true;
      try {
        const parts = autoAudioUrl.split(',');
        if (parts.length < 2) return;
        const mime = parts[0]!.match(/:(.*?);/)?.[1] ?? 'audio/mpeg';
        const byteString = atob(parts[1]!);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mime });
        const file = new File([blob], audioName || 'audio.mp3', { type: mime });
        handleFileSelect(file);
      } catch {
        setErrorMsg('Failed to process audio data');
      }
    }
  }, [autoAudioUrl, audioName, handleFileSelect]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleReset = useCallback(() => {
    setState('idle');
    setStems([]);
    setFileName('');
    setErrorMsg('');
    setIsMockFallback(false);
  }, []);

  const toggleMute = (index: number) => {
    setStems((prev) => prev.map((s, i) => i === index ? { ...s, muted: !s.muted } : s));
  };
  const toggleSolo = (index: number) => {
    setStems((prev) => prev.map((s, i) => i === index ? { ...s, solo: !s.solo } : s));
  };
  const setVolume = (index: number, volume: number) => {
    setStems((prev) => prev.map((s, i) => i === index ? { ...s, volume } : s));
  };

  const handlePlay = useCallback((stem: StemWithUrl) => {
    if (!stem.audioUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(stem.audioUrl);
    audio.volume = stem.muted ? 0 : stem.volume;
    audio.play();
    audioRef.current = audio;
  }, []);

  const handleDownload = useCallback((stem: StemWithUrl) => {
    if (!stem.audioUrl) return;
    const parts = stem.audioUrl.split(',');
    if (parts.length < 2) return;
    const mime = parts[0]!.match(/:(.*?);/)?.[1] ?? 'audio/mpeg';
    const byteString = atob(parts[1]!);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${stem.type}-${fileName || 'stem'}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fileName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 rounded-lg border border-slate-700/50 bg-slate-950 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center gap-2 h-10 px-4 bg-slate-900/60 border-b border-slate-700/40 rounded-t-lg">
          <Scissors className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-semibold text-slate-200">Stem Separator</span>
          <span className={cn(
            'text-[11px] ml-1 px-1.5 py-0.5 rounded',
            isMockFallback
              ? 'text-amber-400 bg-amber-500/10'
              : provider === 'elevenlabs'
                ? 'text-violet-400 bg-violet-500/10'
                : 'text-amber-400 bg-amber-500/10'
          )}>
            {isMockFallback ? 'Demo Mode' : provider === 'elevenlabs' ? 'ElevenLabs' : 'HuggingFace'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {state === 'done' && (
              <button
                onClick={handleReset}
                className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {state === 'idle' && (
            <div className="space-y-3">
              {/* Stem Mode Selector */}
              <div className="flex items-center justify-center gap-2">
                {(['2stem', '4stem', '6stem'] as StemMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleStemModeChange(mode)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                      stemMode === mode
                        ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30'
                        : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    )}
                  >
                    {STEM_MODE_CONFIG[mode].label}
                  </button>
                ))}
              </div>
              <div className="text-center text-[11px] text-slate-500">
                {STEM_MODE_CONFIG[stemMode].description}
              </div>

              {/* Provider Toggle */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">Provider</span>
                <button
                  onClick={() => setProvider('elevenlabs')}
                  disabled={stemMode === '4stem'}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                    provider === 'elevenlabs'
                      ? 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30'
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-200',
                    stemMode === '4stem' && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  ElevenLabs
                </button>
                <button
                  onClick={() => setProvider('huggingface')}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all',
                    provider === 'huggingface'
                      ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                      : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                  )}
                >
                  HuggingFace
                </button>
              </div>

              {/* Upload Area */}
              <div
                onClick={handleUploadClick}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-3 py-10 rounded-lg
                  border border-dashed border-slate-700/50 bg-slate-900/20
                  cursor-pointer hover:border-orange-500/40 hover:bg-orange-500/5 transition-all duration-200"
              >
                <Upload className="w-8 h-8 text-slate-500" />
                <span className="text-xs text-slate-300">Drop an audio file or click to upload</span>
                <span className="text-[11px] text-slate-400">
                  Separate into {STEM_MODE_CONFIG[stemMode].label.toLowerCase()}
                </span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />

          {state === 'processing' && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300">{fileName}</span>
              </div>
              <span className="text-xs text-orange-400">
                Separating into {STEM_MODE_CONFIG[stemMode].label.toLowerCase()} via {provider === 'elevenlabs' ? 'ElevenLabs' : 'HuggingFace'}...
              </span>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ animation: 'stemProgress 8s ease-in-out infinite' }}
                />
              </div>
              <span className="text-[10px] text-slate-500">This may take up to 2 minutes</span>
              <style>{`@keyframes stemProgress { 0% { width: 0% } 50% { width: 85% } 100% { width: 95% } }`}</style>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-2 px-3 py-2 mt-2 rounded bg-amber-500/5 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] text-amber-400">{errorMsg}</span>
            </div>
          )}

          {state === 'done' && (
            <div className="space-y-2">
              {stems.map((stem, i) => (
                <StemRow
                  key={stem.type}
                  stem={stem}
                  onToggleMute={() => toggleMute(i)}
                  onToggleSolo={() => toggleSolo(i)}
                  onVolumeChange={(v) => setVolume(i, v)}
                  onDownload={() => handleDownload(stem)}
                  onPlay={() => handlePlay(stem)}
                  onContextMenu={(e) => handleStemCtx(e, {
                    type: 'stem',
                    stemIndex: i,
                    stemType: stem.type,
                    muted: stem.muted,
                    soloed: stem.solo,
                    hasAudioUrl: !!stem.audioUrl,
                  })}
                />
              ))}

              {/* Export Row */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/30 mt-3">
                <button
                  onClick={() => stems.forEach((s) => handleDownload(s))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-slate-300
                    bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stem Context Menu */}
      <SoundContextMenu position={ctxPos} onClose={hideStemCtx}>
        {ctxTarget?.type === 'stem' && (
          <>
            <MenuHeader>
              <span className={cn('text-xs font-medium', STEM_TYPE_STYLES[ctxTarget.stemType].textClass)}>
                {STEM_TYPE_STYLES[ctxTarget.stemType].label}
              </span>
            </MenuHeader>
            <div className="py-1">
              <ActionItem
                icon={<Headphones className="w-full h-full" />}
                label={ctxTarget.soloed ? 'Unsolo' : 'Solo'}
                action={() => toggleSolo(ctxTarget.stemIndex)}
              />
              <ActionItem
                icon={ctxTarget.muted ? <Volume2 className="w-full h-full" /> : <VolumeX className="w-full h-full" />}
                label={ctxTarget.muted ? 'Unmute' : 'Mute'}
                action={() => toggleMute(ctxTarget.stemIndex)}
              />
              <ActionItem
                icon={<Play className="w-full h-full" />}
                label="Play Solo"
                action={() => {
                  const stem = stems[ctxTarget.stemIndex];
                  if (stem?.audioUrl) {
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current = null;
                    }
                    const audio = new Audio(stem.audioUrl);
                    audio.volume = stem.volume;
                    audio.loop = false;
                    audio.play();
                    audioRef.current = audio;
                  }
                }}
                disabled={!ctxTarget.hasAudioUrl}
              />
            </div>
            <MenuDivider />
            <div className="py-1">
              <ActionItem
                icon={<Download className="w-full h-full" />}
                label="Download Stem"
                action={() => {
                  const stem = stems[ctxTarget.stemIndex];
                  if (stem) handleDownload(stem);
                }}
              />
              <ActionItem
                icon={<Copy className="w-full h-full" />}
                label="Copy Audio URL"
                action={() => {
                  const stem = stems[ctxTarget.stemIndex];
                  if (stem?.audioUrl) navigator.clipboard.writeText(stem.audioUrl);
                }}
                disabled={!ctxTarget.hasAudioUrl}
              />
            </div>
          </>
        )}
      </SoundContextMenu>
    </div>
  );
}
