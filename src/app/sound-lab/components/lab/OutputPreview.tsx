'use client';

import { useState, useCallback, useRef } from 'react';
import { Play, Pause, Download, Send, ToggleLeft, ToggleRight, FlaskConical } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import WaveformVisualizer from '../shared/WaveformVisualizer';
import type { GeneratedAudioResult } from '../../types';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface OutputPreviewProps {
  sourceWaveform: number[];
  outputWaveform: number[];
  outputAudioUrl: string | null;
  sourceAudioUrl: string | null;
  outputDuration: number;
  onGenerated: (result: GeneratedAudioResult) => void;
}

export default function OutputPreview({
  sourceWaveform,
  outputWaveform,
  outputAudioUrl,
  sourceAudioUrl,
  outputDuration,
  onGenerated,
}: OutputPreviewProps) {
  const [playingSource, setPlayingSource] = useState(false);
  const [playingOutput, setPlayingOutput] = useState(false);
  const [abMode, setAbMode] = useState<'source' | 'output'>('output');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const sourceAudioRef = useRef<HTMLAudioElement | null>(null);
  const outputAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopAll = useCallback(() => {
    sourceAudioRef.current?.pause();
    outputAudioRef.current?.pause();
    setPlayingSource(false);
    setPlayingOutput(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const createTimeUpdateHandler = useCallback((audioEl: HTMLAudioElement) => {
    return () => {
      if (audioEl.duration && audioEl.duration > 0) {
        setCurrentTime(audioEl.currentTime);
        setProgress(audioEl.currentTime / audioEl.duration);
      }
    };
  }, []);

  const playAudio = useCallback((url: string, mode: 'source' | 'output') => {
    stopAll();
    const ref = mode === 'source' ? sourceAudioRef : outputAudioRef;
    const setPlaying = mode === 'source' ? setPlayingSource : setPlayingOutput;

    if (!ref.current) {
      const audio = new Audio(url);
      audio.ontimeupdate = createTimeUpdateHandler(audio);
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      };
      ref.current = audio;
    }
    // Resume from current position
    ref.current.play();
    setPlaying(true);
  }, [stopAll, createTimeUpdateHandler]);

  const togglePlayOutput = useCallback(() => {
    if (playingOutput) {
      // Pause, keep position
      outputAudioRef.current?.pause();
      setPlayingOutput(false);
    } else if (outputAudioUrl) {
      // Stop source if playing, then play/resume output
      if (playingSource) {
        sourceAudioRef.current?.pause();
        setPlayingSource(false);
      }
      if (!outputAudioRef.current) {
        const audio = new Audio(outputAudioUrl);
        audio.ontimeupdate = createTimeUpdateHandler(audio);
        audio.onended = () => {
          setPlayingOutput(false);
          setProgress(0);
          setCurrentTime(0);
        };
        outputAudioRef.current = audio;
      }
      outputAudioRef.current.play();
      setPlayingOutput(true);
    }
  }, [playingOutput, playingSource, outputAudioUrl, createTimeUpdateHandler]);

  const handleABToggle = useCallback(() => {
    const next = abMode === 'source' ? 'output' : 'source';
    setAbMode(next);
    const url = next === 'source' ? sourceAudioUrl : outputAudioUrl;
    if (url) playAudio(url, next);
  }, [abMode, sourceAudioUrl, outputAudioUrl, playAudio]);

  const handleSourceWaveformClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sourceAudioRef.current || !playingSource) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const duration = sourceAudioRef.current.duration || 0;
    const time = ratio * duration;
    sourceAudioRef.current.currentTime = time;
    setCurrentTime(time);
    setProgress(ratio);
  }, [playingSource]);

  const handleOutputWaveformClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!outputAudioRef.current || !playingOutput) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const duration = outputAudioRef.current.duration || 0;
    const time = ratio * duration;
    outputAudioRef.current.currentTime = time;
    setCurrentTime(time);
    setProgress(ratio);
  }, [playingOutput]);

  const handleDownload = useCallback(() => {
    if (!outputAudioUrl) return;
    const a = document.createElement('a');
    a.href = outputAudioUrl;
    a.download = `lab-output-${Date.now()}.wav`;
    a.click();
  }, [outputAudioUrl]);

  const handleSendToMixer = useCallback(() => {
    if (!outputAudioUrl) return;
    onGenerated({
      name: `Lab Output ${new Date().toLocaleTimeString()}`,
      type: 'music',
      audioUrl: outputAudioUrl,
      duration: outputDuration,
    });
  }, [outputAudioUrl, outputDuration, onGenerated]);

  const hasOutput = outputWaveform.length > 0 && outputAudioUrl;
  const isAnythingPlaying = playingSource || playingOutput;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 py-2.5 border-b border-slate-800/30">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-300">Output</span>
          {hasOutput && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
              {outputDuration.toFixed(1)}s
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {!hasOutput ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="w-8 h-8 rounded-lg bg-slate-800/40 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-[11px] text-slate-500">
              Process audio to see output
            </span>
            <span className="text-[9px] text-slate-600">
              Use MIDI Bridge or Character Modify
            </span>
          </div>
        ) : (
          <>
            {/* Source waveform */}
            <div>
              <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider">Source</span>
              <div
                onClick={handleSourceWaveformClick}
                className={cn(
                  'mt-1 rounded-md overflow-hidden border border-slate-800/40',
                  playingSource ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                <WaveformVisualizer
                  data={sourceWaveform}
                  height={32}
                  progress={playingSource ? progress : 0}
                />
              </div>
            </div>

            {/* Output waveform */}
            <div>
              <span className="text-[9px] font-medium text-emerald-400/70 uppercase tracking-wider">Processed</span>
              <div
                onClick={handleOutputWaveformClick}
                className={cn(
                  'mt-1 rounded-md overflow-hidden border border-emerald-500/20',
                  playingOutput ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                <WaveformVisualizer
                  data={outputWaveform}
                  height={32}
                  progress={playingOutput ? progress : 0}
                />
              </div>
            </div>

            {/* Time display */}
            {isAnythingPlaying && (
              <div className="text-center text-[9px] font-mono text-slate-500">
                {formatTime(currentTime)} / {formatTime(outputDuration)}
              </div>
            )}

            {/* A/B Toggle */}
            <button
              onClick={handleABToggle}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-1.5 rounded-md transition-all active:scale-95',
                abMode === 'source'
                  ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-800/70'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              )}
            >
              {abMode === 'source' ? (
                <ToggleLeft className="w-4 h-4 text-slate-400" />
              ) : (
                <ToggleRight className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-[10px]">
                A/B: {abMode === 'source' ? 'Source' : 'Processed'}
              </span>
            </button>

            {/* Play output */}
            <button
              onClick={togglePlayOutput}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all active:scale-95 w-full justify-center',
                playingOutput
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
              )}
            >
              {playingOutput ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {playingOutput ? 'Pause' : 'Play Output'}
            </button>

            {/* Actions */}
            <div className="space-y-1.5">
              <button
                onClick={handleSendToMixer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all active:scale-95 w-full justify-center"
              >
                <Send className="w-3 h-3" />
                Send to Mixer
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-slate-800/40 text-slate-300 hover:bg-slate-800/60 transition-all active:scale-95 w-full justify-center"
              >
                <Download className="w-3 h-3" />
                Download WAV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
