'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Play, Pause, Trash2, FileAudio, Music, KeyRound } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import WaveformVisualizer from '../shared/WaveformVisualizer';
import type { LabPipeline, SpectralFeatures } from '../../types';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface AudioInputPanelProps {
  activePipeline: LabPipeline;
  sourceAudioUrl: string | null;
  sourceName: string | null;
  sourceDuration: number;
  waveformData: number[];
  spectralFeatures: SpectralFeatures | null;
  isAnalyzing: boolean;
  onLoadAudio: (file: File) => void;
  onClear: () => void;
}

export default function AudioInputPanel({
  activePipeline,
  sourceAudioUrl,
  sourceName,
  sourceDuration,
  waveformData,
  spectralFeatures,
  isAnalyzing,
  onLoadAudio,
  onClear,
}: AudioInputPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('audio/')) {
      onLoadAudio(file);
    }
  }, [onLoadAudio]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Pause any existing audio before loading new file
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      onLoadAudio(file);
    }
  }, [onLoadAudio]);

  const togglePlay = useCallback(() => {
    if (!sourceAudioUrl) return;

    if (isPlaying) {
      // Pause (not stop) — resume from current position on next play
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Lazily create audio element on first play, reuse on subsequent
      if (!audioRef.current) {
        const audio = new Audio(sourceAudioUrl);
        audio.ontimeupdate = () => {
          if (audio.duration && audio.duration > 0) {
            setCurrentTime(audio.currentTime);
            setProgress(audio.currentTime / audio.duration);
          }
        };
        audio.onended = () => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        };
        audioRef.current = audio;
      }
      // Resume from current position (don't reset to 0)
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [sourceAudioUrl, isPlaying]);

  const handleWaveformClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || sourceDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = ratio * sourceDuration;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    setProgress(ratio);
  }, [sourceDuration]);

  const handleClear = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    onClear();
  }, [onClear]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-2.5 border-b border-slate-800/30">
        <div className="flex items-center gap-2">
          <FileAudio className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-300">Audio Input</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!sourceAudioUrl ? (
          /* Drop zone */
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-all',
              isDragOver
                ? 'border-cyan-500/50 bg-cyan-500/5'
                : 'border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/20'
            )}
          >
            <Upload className={cn(
              'w-6 h-6 transition-colors',
              isDragOver ? 'text-cyan-400 animate-bounce' : 'text-slate-500'
            )} />
            <span className="text-[11px] text-slate-400">
              Drop audio file or click to browse
            </span>
            <span className="text-[9px] text-slate-600">
              WAV, MP3, OGG, FLAC
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <>
            {/* File info */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-300 truncate flex-1">{sourceName}</span>
              <button
                onClick={handleClear}
                className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                title="Clear"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Waveform with click-to-seek */}
            {waveformData.length > 0 && (
              <div>
                <div
                  onClick={handleWaveformClick}
                  className="rounded-md overflow-hidden border border-slate-800/40 cursor-pointer"
                >
                  <WaveformVisualizer data={waveformData} height={48} progress={progress} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(sourceDuration)}</span>
                </div>
              </div>
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all active:scale-95 w-full justify-center',
                isPlaying
                  ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                  : 'bg-slate-800/40 text-slate-300 hover:bg-slate-800/60'
              )}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isPlaying ? 'Pause' : 'Play Source'}
            </button>

            {/* Musical Analysis — shown for both pipelines */}
            {isAnalyzing ? (
              <div className="text-[10px] text-slate-500 animate-pulse">Analyzing...</div>
            ) : spectralFeatures?.bpm != null && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Musical Analysis
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500/8 border border-cyan-500/15">
                    <Music className="w-3 h-3 text-cyan-400" />
                    <span className="text-[11px] font-mono font-semibold text-cyan-400">
                      {spectralFeatures.bpm}
                    </span>
                    <span className="text-[9px] text-cyan-400/60">BPM</span>
                  </div>
                  {spectralFeatures.key && spectralFeatures.scale && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/8 border border-emerald-500/15">
                      <KeyRound className="w-3 h-3 text-emerald-400" />
                      <span className="text-[11px] font-mono font-semibold text-emerald-400">
                        {spectralFeatures.key} {spectralFeatures.scale}
                      </span>
                      {spectralFeatures.keyStrength != null && (
                        <span className="text-[9px] text-emerald-400/60">
                          {Math.round(spectralFeatures.keyStrength * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed spectral features — character-modify only */}
            {activePipeline === 'character-modify' && spectralFeatures && !isAnalyzing && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Spectral Detail
                </span>
                <div className="space-y-1">
                  <FeatureMeter label="RMS" value={spectralFeatures.rms} max={1} />
                  <FeatureMeter label="Centroid" value={spectralFeatures.spectralCentroid} max={10000} suffix="Hz" />
                  <FeatureMeter label="Flatness" value={spectralFeatures.spectralFlatness} max={1} />
                  <FeatureMeter label="Rolloff" value={spectralFeatures.spectralRolloff} max={20000} suffix="Hz" />
                  <FeatureMeter label="ZCR" value={spectralFeatures.zcr} max={1} />
                  <FeatureMeter label="Energy" value={spectralFeatures.energy} max={1} />
                  <p className="text-[9px] text-slate-500 mt-1 italic">
                    {spectralFeatures.description}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FeatureMeter({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-slate-500 w-12 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500/50 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[9px] text-slate-400 w-12 shrink-0 font-mono">
        {value < 10 ? value.toFixed(3) : Math.round(value)}{suffix || ''}
      </span>
    </div>
  );
}
