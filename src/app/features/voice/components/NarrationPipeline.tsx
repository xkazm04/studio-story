'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  BookOpen, Play, Download, Loader2, ChevronDown, ChevronRight, Square,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import ScriptEditor from './ScriptEditor';
import TakesModal from './TakesModal';
import { useNarrationBatch } from '../hooks/useNarrationBatch';
import type { VoiceNarrationResult, ScriptLineTake, VoiceSettings } from '../types';

interface CharacterInfo {
  id: string;
  name: string;
}

interface VoiceInfo {
  voice_id: string;
  character_id?: string | null;
  name: string;
}

interface NarrationPipelineProps {
  characters: CharacterInfo[];
  voices: VoiceInfo[];
  voiceSettings: VoiceSettings;
  onExportAudio?: (result: VoiceNarrationResult) => void;
}

export default function NarrationPipeline({
  characters,
  voices,
  voiceSettings,
  onExportAudio,
}: NarrationPipelineProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [takesLineId, setTakesLineId] = useState<string | null>(null);
  const {
    lines,
    setLines,
    isGenerating,
    progress,
    generateAll,
    regenerateLine,
    cancel,
    result,
  } = useNarrationBatch();

  const hasLines = lines.length > 0;
  const allDone = lines.length > 0 && lines.every((l) => l.status === 'done');
  const hasVoiceIds = lines.some((l) => l.voiceId);

  const estimatedDuration = useMemo(() => {
    const wordCount = lines.reduce((acc, l) => acc + l.text.split(/\s+/).filter(Boolean).length, 0);
    return Math.max(0, wordCount * 0.4);
  }, [lines]);

  const handleGenerateAll = useCallback(() => {
    generateAll(voiceSettings);
  }, [generateAll, voiceSettings]);

  const handleRegenerateLine = useCallback((lineId: string) => {
    regenerateLine(lineId, voiceSettings);
  }, [regenerateLine, voiceSettings]);

  const handleTakesGenerated = useCallback((lineId: string, takes: ScriptLineTake[], selectedIdx: number) => {
    setLines((prev) => prev.map((l) =>
      l.id === lineId
        ? {
            ...l,
            takes,
            selectedTakeIdx: selectedIdx,
            ...(selectedIdx >= 0 && takes[selectedIdx]
              ? { audioUrl: takes[selectedIdx].audioUrl, duration: takes[selectedIdx].duration, status: 'done' as const }
              : {}),
          }
        : l
    ));
    setTakesLineId(null);
  }, [setLines]);

  const takesLine = takesLineId ? lines.find((l) => l.id === takesLineId) : null;

  const handleExport = useCallback(() => {
    if (!result || !onExportAudio) return;
    // Convert internal NarrationResult to VoiceNarrationResult
    const voiceResult: VoiceNarrationResult = {
      clips: result.clips.map((clip) => ({
        id: clip.asset.id,
        name: clip.asset.name,
        audioUrl: clip.asset.audioUrl ?? '',
        duration: clip.asset.duration,
        waveformData: clip.asset.waveformData,
        startTime: clip.startTime,
        character: '',
        emotion: '',
      })),
      totalDuration: result.totalDuration,
    };
    onExportAudio(voiceResult);
  }, [result, onExportAudio]);

  const previewClips = result?.clips ?? [];
  const previewDuration = result?.totalDuration ?? 0;

  return (
    <div className="border-t border-slate-700/40 bg-slate-900/30">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800/30 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        )}
        <BookOpen className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-xs font-medium text-slate-200">Narration Pipeline</span>
        {lines.length > 0 && (
          <span className="text-[11px] text-slate-500">
            {lines.length} line{lines.length !== 1 ? 's' : ''}
          </span>
        )}
        {estimatedDuration > 0 && (
          <span className="text-[11px] text-slate-500">
            ~{Math.floor(estimatedDuration / 60)}:{String(Math.floor(estimatedDuration % 60)).padStart(2, '0')}
          </span>
        )}
        {isGenerating && (
          <span className="text-[11px] text-orange-400 flex items-center gap-1 ml-auto">
            <Loader2 className="w-3 h-3 animate-spin" />
            {progress.done}/{progress.total}
          </span>
        )}
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-3">
          <ScriptEditor
            lines={lines}
            onLinesChange={setLines}
            characters={characters}
            voices={voices}
            onRegenerateLine={handleRegenerateLine}
            onOpenTakes={setTakesLineId}
          />

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <>
                <button
                  onClick={cancel}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium
                    bg-red-600/80 text-white hover:bg-red-500 transition-colors"
                >
                  <Square className="w-3 h-3" />
                  Cancel
                </button>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                    style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-[11px] text-orange-400 font-mono shrink-0">
                  {progress.done}/{progress.total}
                </span>
              </>
            ) : (
              <button
                onClick={handleGenerateAll}
                disabled={!hasLines || !hasVoiceIds}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-all',
                  !hasLines || !hasVoiceIds
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:from-orange-500 hover:to-amber-500'
                )}
              >
                <Play className="w-3.5 h-3.5" />
                Generate All ({lines.length})
              </button>
            )}
          </div>

          {previewClips.length > 0 && previewDuration > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">Preview</span>
              <div className="h-6 bg-slate-950/60 border border-slate-800/40 rounded relative overflow-hidden">
                {previewClips.map((clip, i) => {
                  const left = (clip.startTime / previewDuration) * 100;
                  const width = (clip.asset.duration / previewDuration) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute top-0.5 bottom-0.5 rounded bg-violet-500/30 border border-violet-400/40"
                      style={{ left: `${left}%`, width: `${Math.max(1, width)}%` }}
                      title={clip.asset.name}
                    >
                      <span className="text-[9px] text-violet-300 truncate px-1 leading-[20px]">
                        {clip.asset.name.split(':')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <span className="text-[11px] text-slate-500">
                Total: {Math.floor(previewDuration / 60)}:{String(Math.floor(previewDuration % 60)).padStart(2, '0')}
              </span>
            </div>
          )}

          {allDone && result && onExportAudio && (
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-medium
                bg-emerald-600/80 text-white hover:bg-emerald-500 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Audio ({result.clips.length} clips)
            </button>
          )}
        </div>
      )}

      {takesLine && (
        <TakesModal
          line={takesLine}
          voiceSettings={voiceSettings}
          onClose={() => setTakesLineId(null)}
          onTakesGenerated={handleTakesGenerated}
        />
      )}
    </div>
  );
}
