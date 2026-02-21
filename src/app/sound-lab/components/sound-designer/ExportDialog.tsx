'use client';

import { useState, useCallback } from 'react';
import { Download, Loader2, Music, Mic, Zap, Trees } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Modal } from '@/app/components/UI/Modal';
import { renderMixdown } from '../../lib/mixdownRenderer';
import { downloadWAV } from '../../lib/wavEncoder';
import type { AudioEngine } from '../../lib/audioEngine';
import type { AudioAssetType, TimelineClip } from '../../types';

interface LaneGroup {
  type: AudioAssetType;
  collapsed: boolean;
  muted: boolean;
  clips: TimelineClip[];
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groups: LaneGroup[];
  totalDuration: number;
  audioEngine: AudioEngine | null;
}

const LANE_INFO: Record<AudioAssetType, { label: string; icon: typeof Mic }> = {
  voice: { label: 'Voice', icon: Mic },
  music: { label: 'Music', icon: Music },
  sfx: { label: 'SFX', icon: Zap },
  ambience: { label: 'Ambience', icon: Trees },
};

export default function ExportDialog({
  isOpen,
  onClose,
  groups,
  totalDuration,
  audioEngine,
}: ExportDialogProps) {
  const [sampleRate, setSampleRate] = useState<44100 | 48000>(44100);
  const [channels, setChannels] = useState<1 | 2>(2);
  const [enabledLanes, setEnabledLanes] = useState<Set<AudioAssetType>>(
    new Set(['voice', 'music', 'sfx', 'ambience'])
  );
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportMode, setExportMode] = useState<'full' | AudioAssetType | null>(null);

  const fileSizeMB = ((totalDuration * sampleRate * channels * 2) / (1024 * 1024)).toFixed(1);

  const toggleLane = (lane: AudioAssetType) => {
    setEnabledLanes((prev) => {
      const next = new Set(prev);
      if (next.has(lane)) {
        next.delete(lane);
      } else {
        next.add(lane);
      }
      return next;
    });
  };

  const handleExport = useCallback(async (mode: 'full' | AudioAssetType) => {
    if (!audioEngine) return;

    setIsExporting(true);
    setProgress(0);
    setExportMode(mode);

    try {
      const soloLanes = mode === 'full'
        ? enabledLanes
        : new Set<AudioAssetType>([mode]);

      const buffer = await renderMixdown(audioEngine, {
        groups,
        totalDuration,
        sampleRate,
        channels,
        soloLanes,
        onProgress: setProgress,
      });

      const filename = mode === 'full'
        ? `soundscape-mix-${Date.now()}.wav`
        : `soundscape-${mode}-${Date.now()}.wav`;

      downloadWAV(buffer, filename);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      setProgress(0);
      setExportMode(null);
    }
  }, [audioEngine, groups, totalDuration, sampleRate, channels, enabledLanes]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Soundscape"
      size="sm"
      icon={<Download className="w-4 h-4" />}
    >
      <div className="space-y-4">
        {/* Format Options */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-2">Format</span>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-slate-500 block mb-1">Sample Rate</label>
              <select
                value={sampleRate}
                onChange={(e) => setSampleRate(Number(e.target.value) as 44100 | 48000)}
                className="w-full px-2 py-1.5 bg-slate-950/60 border border-slate-700/40 rounded text-[11px] text-slate-300
                  focus:outline-none focus:border-orange-500/40"
              >
                <option value={44100}>44100 Hz (CD)</option>
                <option value={48000}>48000 Hz (Studio)</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-slate-500 block mb-1">Channels</label>
              <select
                value={channels}
                onChange={(e) => setChannels(Number(e.target.value) as 1 | 2)}
                className="w-full px-2 py-1.5 bg-slate-950/60 border border-slate-700/40 rounded text-[11px] text-slate-300
                  focus:outline-none focus:border-orange-500/40"
              >
                <option value={2}>Stereo</option>
                <option value={1}>Mono</option>
              </select>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Est. size: {fileSizeMB} MB / {Math.floor(totalDuration / 60)}:{String(Math.floor(totalDuration % 60)).padStart(2, '0')}
          </span>
        </div>

        {/* Lane Selection */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-2">Include Lanes</span>
          <div className="grid grid-cols-2 gap-1.5">
            {(['voice', 'music', 'sfx', 'ambience'] as AudioAssetType[]).map((lane) => {
              const info = LANE_INFO[lane];
              const Icon = info.icon;
              const enabled = enabledLanes.has(lane);
              const clipCount = groups.find((g) => g.type === lane)?.clips.length ?? 0;

              return (
                <button
                  key={lane}
                  onClick={() => toggleLane(lane)}
                  className={cn(
                    'flex items-center gap-2 px-2.5 py-2 rounded-md border text-[11px] transition-all',
                    enabled
                      ? 'border-orange-500/40 bg-orange-500/5 text-slate-200'
                      : 'border-slate-800/50 bg-slate-900/30 text-slate-500'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span className="font-medium">{info.label}</span>
                  <span className={cn('ml-auto', enabled ? 'text-orange-400' : 'text-slate-600')}>
                    {clipCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        {isExporting && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Rendering {exportMode === 'full' ? 'full mix' : exportMode}...
              </span>
              <span className="text-[11px] text-orange-400 font-mono">{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Export Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => handleExport('full')}
            disabled={isExporting || enabledLanes.size === 0}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-medium transition-all',
              isExporting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : enabledLanes.size === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500'
            )}
          >
            {isExporting && exportMode === 'full' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export Full Mix
          </button>

          <div className="flex gap-1.5">
            {(['voice', 'music', 'sfx', 'ambience'] as AudioAssetType[]).map((lane) => {
              const info = LANE_INFO[lane];
              return (
                <button
                  key={lane}
                  onClick={() => handleExport(lane)}
                  disabled={isExporting}
                  className={cn(
                    'flex-1 py-1.5 rounded text-[11px] font-medium transition-all',
                    isExporting
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  )}
                  title={`Export ${info.label} only`}
                >
                  {isExporting && exportMode === lane ? (
                    <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                  ) : (
                    info.label
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
