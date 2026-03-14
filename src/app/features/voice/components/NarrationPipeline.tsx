'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  BookOpen, Play, Download, Loader2, ChevronDown, ChevronRight, Square,
  Mic2, Youtube, Upload,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import ScriptEditor from './ScriptEditor';
import TakesModal from './TakesModal';
import { VoiceAssignmentChecklist } from './VoiceAssignmentChecklist';
import { useNarrationBatch } from '../hooks/useNarrationBatch';
import { useScreenplayParser } from '../hooks/useScreenplayParser';
import { useNarrationExport } from '../hooks/useNarrationExport';
import { useVoiceCloning } from '../hooks/useVoiceCloning';
import type { VoiceNarrationResult, ScriptLineTake, VoiceSettings } from '../types';

interface CharacterInfo {
  id: string;
  name: string;
  voice_id?: string | null;
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
  sceneId?: string;
  onExportAudio?: (result: VoiceNarrationResult) => void;
  onAssignVoice?: (character: string) => void;
}

export default function NarrationPipeline({
  characters,
  voices,
  voiceSettings,
  sceneId,
  onExportAudio,
  onAssignVoice,
}: NarrationPipelineProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [takesLineId, setTakesLineId] = useState<string | null>(null);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneMode, setCloneMode] = useState<'audio' | 'youtube' | null>(null);
  const [cloneVoiceName, setCloneVoiceName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Screenplay parser
  const {
    scriptLines: parsedLines,
    unassignedCharacters,
  } = useScreenplayParser(sceneId ?? '', { characters });

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

  const { exportMp3, isExporting } = useNarrationExport();
  const { cloneFromAudio, cloneFromYouTube, status: cloneStatus, error: cloneError } = useVoiceCloning();

  // Auto-load parsed lines into batch when available
  const hasLoadedParsed = useMemo(() => {
    if (parsedLines.length > 0 && lines.length === 0) {
      return false;
    }
    return true;
  }, [parsedLines.length, lines.length]);

  // Load parsed screenplay lines
  const handleLoadScreenplay = useCallback(() => {
    if (parsedLines.length > 0) {
      setLines(parsedLines);
    }
  }, [parsedLines, setLines]);

  const hasLines = lines.length > 0;
  const allDone = lines.length > 0 && lines.every((l) => l.status === 'done');
  const hasVoiceIds = lines.some((l) => l.voiceId);
  const showChecklist = unassignedCharacters.length > 0 && !hasLines;

  const estimatedDuration = useMemo(() => {
    const wordCount = lines.reduce((acc, l) => acc + l.text.split(/\s+/).filter(Boolean).length, 0);
    return Math.max(0, wordCount * 0.4);
  }, [lines]);

  const handleGenerateAll = useCallback(() => {
    generateAll(voiceSettings, { takesCount: 2 });
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

  const handleExportMp3 = useCallback(async () => {
    if (!allDone) return;
    await exportMp3(lines);
  }, [allDone, lines, exportMp3]);

  const handleExport = useCallback(() => {
    if (!result || !onExportAudio) return;
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

  const handleCloneFromAudio = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !cloneVoiceName) return;
      await cloneFromAudio(file, cloneVoiceName);
    };
    input.click();
  }, [cloneFromAudio, cloneVoiceName]);

  const handleCloneFromYouTube = useCallback(async () => {
    if (!youtubeUrl || !cloneVoiceName) return;
    await cloneFromYouTube(youtubeUrl, cloneVoiceName);
  }, [cloneFromYouTube, youtubeUrl, cloneVoiceName]);

  const handleAssign = useCallback((character: string) => {
    if (onAssignVoice) onAssignVoice(character);
  }, [onAssignVoice]);

  const handleSkipChecklist = useCallback(() => {
    // Load screenplay lines with narrator fallback
    if (parsedLines.length > 0) {
      setLines(parsedLines);
    }
  }, [parsedLines, setLines]);

  const previewClips = result?.clips ?? [];
  const previewDuration = result?.totalDuration ?? 0;

  return (
    <div className="border-t border-slate-700/40 bg-slate-900/30">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800/30 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
        <BookOpen className="w-3.5 h-3.5 text-orange-400" />
        <span className="text-sm font-medium text-slate-200">Narration Pipeline</span>
        {lines.length > 0 && (
          <span className="text-sm text-slate-400">
            {lines.length} line{lines.length !== 1 ? 's' : ''}
          </span>
        )}
        {estimatedDuration > 0 && (
          <span className="text-sm text-slate-400">
            ~{Math.floor(estimatedDuration / 60)}:{String(Math.floor(estimatedDuration % 60)).padStart(2, '0')}
          </span>
        )}
        {isGenerating && (
          <span className="text-sm text-orange-400 flex items-center gap-1 ml-auto">
            <Loader2 className="w-3 h-3 animate-spin" />
            {progress.done}/{progress.total}
            {progress.currentCharacter && (
              <span className="text-xs text-slate-400 ml-1">({progress.currentCharacter})</span>
            )}
          </span>
        )}
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-3">
          {/* Voice Assignment Checklist */}
          {showChecklist && (
            <VoiceAssignmentChecklist
              unassignedCharacters={unassignedCharacters}
              onAssign={handleAssign}
              onSkip={handleSkipChecklist}
            />
          )}

          {/* Load screenplay button when parsed lines available but not loaded */}
          {!hasLoadedParsed && !showChecklist && (
            <button
              onClick={handleLoadScreenplay}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium
                bg-violet-600/80 text-white hover:bg-violet-500 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Load Screenplay ({parsedLines.length} lines)
            </button>
          )}

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
                  className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium
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
                <span className="text-sm text-orange-400 font-mono shrink-0">
                  {progress.done}/{progress.total}
                </span>
              </>
            ) : (
              <button
                onClick={handleGenerateAll}
                disabled={!hasLines || !hasVoiceIds}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  !hasLines || !hasVoiceIds
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
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
              <span className="text-sm font-medium text-slate-400">Preview</span>
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
                      <span className="text-sm text-violet-300 truncate px-1 leading-[20px]">
                        {clip.asset.name.split(':')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <span className="text-sm text-slate-400">
                Total: {Math.floor(previewDuration / 60)}:{String(Math.floor(previewDuration % 60)).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Export buttons */}
          {allDone && (
            <div className="flex gap-2">
              <button
                onClick={handleExportMp3}
                disabled={isExporting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium
                  bg-emerald-600/80 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? 'Exporting...' : `Export MP3 (${lines.filter((l) => l.status === 'done').length} clips)`}
              </button>
              {result && onExportAudio && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium
                    bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
                >
                  Individual
                </button>
              )}
            </div>
          )}

          {/* Voice Cloning Section */}
          <div className="border-t border-slate-700/40 pt-3">
            <button
              onClick={() => setShowCloneDialog(!showCloneDialog)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>Voice Cloning</span>
              {showCloneDialog ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>

            {showCloneDialog && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Voice name..."
                  value={cloneVoiceName}
                  onChange={(e) => setCloneVoiceName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700
                    text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => { setCloneMode('audio'); handleCloneFromAudio(); }}
                    disabled={!cloneVoiceName || cloneStatus === 'uploading' || cloneStatus === 'cloning'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium
                      bg-cyan-600/80 text-white hover:bg-cyan-500 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Audio
                  </button>
                  <button
                    onClick={() => setCloneMode('youtube')}
                    disabled={!cloneVoiceName || cloneStatus === 'extracting' || cloneStatus === 'cloning'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium
                      bg-red-600/80 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    Clone from YouTube
                  </button>
                </div>

                {cloneMode === 'youtube' && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="YouTube URL..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700
                        text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button
                      onClick={handleCloneFromYouTube}
                      disabled={!youtubeUrl || !cloneVoiceName || cloneStatus !== 'idle'}
                      className="px-3 py-1.5 rounded-md text-sm font-medium bg-red-600/80 text-white
                        hover:bg-red-500 transition-colors disabled:opacity-50"
                    >
                      Clone
                    </button>
                  </div>
                )}

                {cloneStatus !== 'idle' && cloneStatus !== 'done' && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {cloneStatus === 'uploading' && 'Uploading audio...'}
                    {cloneStatus === 'extracting' && 'Extracting audio from YouTube...'}
                    {cloneStatus === 'cloning' && 'Cloning voice with ElevenLabs...'}
                  </div>
                )}

                {cloneStatus === 'done' && (
                  <p className="text-xs text-emerald-400">Voice cloned successfully.</p>
                )}

                {cloneError && (
                  <p className="text-xs text-red-400">{cloneError}</p>
                )}
              </div>
            )}
          </div>
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
