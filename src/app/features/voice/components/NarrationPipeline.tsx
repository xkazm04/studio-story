'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  BookOpen, Play, Download, Loader2, ChevronDown, ChevronRight, Square,
  Mic2, Youtube, Upload, FileAudio, X,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import ScriptEditor from './ScriptEditor';
import SegmentedProgress from './SegmentedProgress';
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
  const [cloneAudioFile, setCloneAudioFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [genStartTime, setGenStartTime] = useState<number | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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

  // Track generation start time for ETA calculation
  useEffect(() => {
    if (isGenerating && genStartTime === null) {
      setGenStartTime(Date.now());
    } else if (!isGenerating && genStartTime !== null) {
      setGenStartTime(null);
    }
  }, [isGenerating, genStartTime]);

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

  const acceptAudioFile = useCallback((file: File) => {
    if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i)) {
      setCloneAudioFile(file);
    }
  }, []);

  const handleAudioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) acceptAudioFile(file);
  }, [acceptAudioFile]);

  const handleAudioFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptAudioFile(file);
  }, [acceptAudioFile]);

  const handleCloneFromAudio = useCallback(async () => {
    if (!cloneAudioFile || !cloneVoiceName) return;
    await cloneFromAudio(cloneAudioFile, cloneVoiceName);
  }, [cloneFromAudio, cloneAudioFile, cloneVoiceName]);

  const cloneAudioUrl = useMemo(
    () => cloneAudioFile ? URL.createObjectURL(cloneAudioFile) : null,
    [cloneAudioFile],
  );

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
        <BookOpen className="w-3.5 h-3.5 text-voice-accent" />
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
          <span className="text-sm text-voice-accent flex items-center gap-1 ml-auto">
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
                bg-voice-muted/80 text-white hover:bg-voice-muted transition-colors"
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

          {isGenerating && (
            <SegmentedProgress
              lines={lines}
              generationStartTime={genStartTime}
              doneCount={progress.done}
              totalCount={progress.total}
            />
          )}

          <div className="flex items-center gap-2">
            {isGenerating ? (
              <button
                onClick={cancel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium
                  bg-red-600/80 text-white hover:bg-red-500 transition-colors"
              >
                <Square className="w-3 h-3" />
                Cancel
              </button>
            ) : (
              <button
                onClick={handleGenerateAll}
                disabled={!hasLines || !hasVoiceIds}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all',
                  !hasLines || !hasVoiceIds
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-voice-accent/80 text-white hover:bg-voice-accent'
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
                      className="absolute top-0.5 bottom-0.5 rounded bg-voice-muted/30 border border-voice-muted/40"
                      style={{ left: `${left}%`, width: `${Math.max(1, width)}%` }}
                      title={clip.asset.name}
                    >
                      <span className="text-sm text-voice-muted/80 truncate px-1 leading-[20px]">
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
                  bg-voice-primary/80 text-white hover:bg-voice-primary transition-colors disabled:opacity-50"
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
                    text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-voice-primary/50"
                />

                {/* Audio drop zone */}
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
                  onChange={handleAudioFileSelect}
                  className="hidden"
                />

                {!cloneAudioFile ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleAudioDrop}
                    onClick={() => audioInputRef.current?.click()}
                    className={cn(
                      'flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg',
                      'cursor-pointer transition-all duration-200',
                      isDragOver
                        ? 'border-voice-accent/60 bg-voice-accent/5'
                        : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/30'
                    )}
                  >
                    <Upload className={cn(
                      'w-6 h-6 mb-1.5',
                      isDragOver ? 'text-voice-accent' : 'text-slate-500'
                    )} />
                    <p className="text-xs text-slate-400">
                      Drop audio file or <span className="text-voice-primary">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">MP3, WAV, M4A, OGG, FLAC, AAC</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
                    <FileAudio className="w-4 h-4 text-voice-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 truncate">{cloneAudioFile.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {(cloneAudioFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => { setCloneAudioFile(null); if (audioInputRef.current) audioInputRef.current.value = ''; }}
                      className="p-0.5 rounded hover:bg-slate-700 transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                )}

                {/* Mini audio preview */}
                {cloneAudioUrl && (
                  <audio
                    src={cloneAudioUrl}
                    controls
                    className="w-full h-8 rounded-full [&::-webkit-media-controls-panel]:bg-slate-800"
                  />
                )}

                {/* Clone / YouTube buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCloneFromAudio}
                    disabled={!cloneVoiceName || !cloneAudioFile || cloneStatus === 'uploading' || cloneStatus === 'cloning'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium
                      bg-voice-primary/80 text-white hover:bg-voice-primary transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Clone from Audio
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
                        text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-voice-primary/50"
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
                  <div className="flex items-center gap-2 text-xs text-voice-primary">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {cloneStatus === 'uploading' && 'Uploading audio...'}
                    {cloneStatus === 'extracting' && 'Extracting audio from YouTube...'}
                    {cloneStatus === 'cloning' && 'Cloning voice with ElevenLabs...'}
                  </div>
                )}

                {cloneStatus === 'done' && (
                  <p className="text-xs text-voice-primary">Voice cloned successfully.</p>
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
