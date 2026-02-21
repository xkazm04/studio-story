'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Volume2, FileAudio, X, Layers } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { getSampleUrl } from '../../data/drumCatalog';
import { INSTRUMENT_TYPE_STYLES, TRACK_SOURCE_STYLES } from '../../types';
import type { BeatPattern, BeatSample, BeatTrackSource, BeatTrack, InstrumentType } from '../../types';

const ALL_INSTRUMENTS: InstrumentType[] = ['kick', 'snare', 'hihat', 'clap', 'tom', 'cymbal', 'bass', 'pad', 'arp', 'perc'];

interface InstrumentRackProps {
  pattern: BeatPattern;
  sampleBank: Map<string, BeatSample>;
  onAddTrack: (instrument: InstrumentType) => void;
  onRemoveTrack: (trackIdx: number) => void;
  onToggleSource: (trackIdx: number) => void;
  onLoadSample: (instrument: InstrumentType, file: File) => void;
  onLoadSampleFromUrl: (instrument: InstrumentType, url: string, name: string) => void;
  onRemoveSample: (instrument: InstrumentType) => void;
}

function InstrumentRow({
  instrument,
  trackIdx,
  track,
  sample,
  onAddTrack,
  onRemoveTrack,
  onToggleSource,
  onLoadSample,
  onLoadSampleFromUrl,
  onRemoveSample,
}: {
  instrument: InstrumentType;
  trackIdx: number;
  track: (BeatTrack & { source?: BeatTrackSource }) | null;
  sample: BeatSample | null;
  onAddTrack: (instrument: InstrumentType) => void;
  onRemoveTrack: (trackIdx: number) => void;
  onToggleSource: (trackIdx: number) => void;
  onLoadSample: (instrument: InstrumentType, file: File) => void;
  onLoadSampleFromUrl: (instrument: InstrumentType, url: string, name: string) => void;
  onRemoveSample: (instrument: InstrumentType) => void;
}) {
  const style = INSTRUMENT_TYPE_STYLES[instrument];
  const hasTrack = track !== null;
  const isSample = track?.source?.mode === 'sample';
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('Files') ||
        e.dataTransfer.types.includes('application/x-drum-sample')) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Sample browser drop
    const sampleData = e.dataTransfer.getData('application/x-drum-sample');
    if (sampleData) {
      try {
        const { machineId, path, name } = JSON.parse(sampleData);
        const url = getSampleUrl(machineId, path);
        onLoadSampleFromUrl(instrument, url, name);
      } catch { /* invalid data */ }
      return;
    }

    // File drop
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('audio/')) {
      onLoadSample(instrument, file);
    }
  }, [instrument, onLoadSample, onLoadSampleFromUrl]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all group/row relative',
        isDragOver
          ? 'border border-emerald-500/40 border-dashed'
          : hasTrack
            ? 'hover:bg-slate-800/20'
            : 'opacity-40 hover:opacity-70'
      )}
      style={isDragOver ? { background: 'rgba(16, 185, 129, 0.06)', boxShadow: '0 0 12px rgba(16, 185, 129, 0.1)' } : undefined}
    >
      {/* Drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md pointer-events-none z-10">
          <span
            className="text-[10px] font-medium text-emerald-400"
            style={{ textShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}
          >
            Drop to assign
          </span>
        </div>
      )}

      {/* Colored dot */}
      <div
        className={cn('w-2 h-2 rounded-sm shrink-0', style.bgClass)}
        style={hasTrack ? { boxShadow: `0 0 4px currentColor` } : undefined}
      />

      {/* Label */}
      <span className={cn(
        'text-[11px] font-medium shrink-0 w-10 truncate',
        hasTrack ? style.textClass : 'text-slate-500'
      )}>
        {style.label}
      </span>

      {/* Source mode icons (only for active tracks) */}
      {hasTrack && (
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => { if (isSample) onToggleSource(trackIdx); }}
            className={cn(
              'p-0.5 rounded transition-all',
              !isSample
                ? cn(TRACK_SOURCE_STYLES.synth.textClass, TRACK_SOURCE_STYLES.synth.bgClass, 'shadow-[0_0_6px_rgba(245,158,11,0.1)]')
                : 'text-slate-600 hover:text-slate-400'
            )}
            title="Synth mode"
          >
            <Volume2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => { if (!isSample) onToggleSource(trackIdx); }}
            className={cn(
              'p-0.5 rounded transition-all',
              isSample
                ? cn(TRACK_SOURCE_STYLES.sample.textClass, TRACK_SOURCE_STYLES.sample.bgClass, 'shadow-[0_0_6px_rgba(16,185,129,0.1)]')
                : 'text-slate-600 hover:text-slate-400'
            )}
            title="Sample mode"
          >
            <FileAudio className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Sample name + mini waveform */}
      {sample && (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {sample.waveformData && (
            <div className="flex items-end gap-px h-[4px] shrink-0">
              {sample.waveformData.slice(0, 8).map((v, i) => (
                <div
                  key={i}
                  className="w-[2px] bg-emerald-400/50 rounded-sm"
                  style={{ height: `${Math.max(1, v * 4)}px` }}
                />
              ))}
            </div>
          )}
          <span className="text-[9px] text-emerald-400/70 truncate font-mono">{sample.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveSample(instrument); }}
            className="opacity-0 group-hover/row:opacity-100 text-slate-600 hover:text-red-400 transition-all shrink-0"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {/* Spacer if no sample */}
      {!sample && <div className="flex-1" />}

      {/* Add/Remove track */}
      {hasTrack ? (
        <button
          onClick={() => onRemoveTrack(trackIdx)}
          className="opacity-0 group-hover/row:opacity-100 text-slate-600 hover:text-red-400 transition-all shrink-0"
          title="Remove track"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      ) : (
        <button
          onClick={() => onAddTrack(instrument)}
          className="opacity-0 group-hover/row:opacity-100 text-slate-600 hover:text-slate-300 transition-all shrink-0"
          title="Add track"
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function InstrumentRack({
  pattern,
  sampleBank,
  onAddTrack,
  onRemoveTrack,
  onToggleSource,
  onLoadSample,
  onLoadSampleFromUrl,
  onRemoveSample,
}: InstrumentRackProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="shrink-0 px-3 py-2 border-b border-orange-500/10 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, transparent 100%)' }}
      >
        <div className="flex items-center gap-2 relative">
          <div
            className="p-1 rounded border border-orange-500/25"
            style={{ background: 'rgba(249, 115, 22, 0.08)', boxShadow: '0 0 8px rgba(249, 115, 22, 0.08)' }}
          >
            <Layers className="w-3 h-3 text-orange-400" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 tracking-wide">Instruments</span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400/80"
            style={{ textShadow: '0 0 6px rgba(249, 115, 22, 0.3)' }}
          >
            {pattern.tracks.length}/10
          </span>
        </div>
      </div>

      {/* Compact rows */}
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5">
        {ALL_INSTRUMENTS.map((instrument) => {
          const trackIdx = pattern.tracks.findIndex((t) => t.instrument === instrument);
          const track = trackIdx >= 0 ? pattern.tracks[trackIdx] as BeatTrack & { source?: BeatTrackSource } : null;
          const sampleId = track?.source?.sampleId;
          const sample = sampleId ? sampleBank.get(sampleId) ?? null : null;

          return (
            <InstrumentRow
              key={instrument}
              instrument={instrument}
              trackIdx={trackIdx}
              track={track}
              sample={sample}
              onAddTrack={onAddTrack}
              onRemoveTrack={onRemoveTrack}
              onToggleSource={onToggleSource}
              onLoadSample={onLoadSample}
              onLoadSampleFromUrl={onLoadSampleFromUrl}
              onRemoveSample={onRemoveSample}
            />
          );
        })}
      </div>
    </div>
  );
}
