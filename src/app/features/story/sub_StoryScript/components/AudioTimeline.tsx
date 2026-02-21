/**
 * AudioTimeline Component
 *
 * Waveform visualization and timing synchronization interface.
 * Features:
 * - Interactive waveform display
 * - Text-audio synchronization markers
 * - Playback controls with scrubbing
 * - Chapter navigation
 * - Export controls
 */

'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileAudio,
  Layers,
  ZoomIn,
  ZoomOut,
  Repeat,
  Shuffle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/UI/Button';
import {
  type TimingMarker,
  type NarrationBlock,
  type ChapterAudio,
  type AudioData,
} from '@/lib/audio';

// ============================================================================
// Types
// ============================================================================

interface AudioTimelineProps {
  blocks: NarrationBlock[];
  chapters?: ChapterAudio[];
  currentBlockId?: string;
  currentTime: number;          // Current playback time in ms
  duration: number;             // Total duration in ms
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onBlockSelect: (blockId: string) => void;
  onChapterSelect?: (chapterId: string) => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onExport?: (format: 'mp3' | 'wav' | 'm4b') => void;
  className?: string;
}

interface WaveformData {
  blockId: string;
  data: number[];
  startTime: number;
  endTime: number;
}

// ============================================================================
// Constants
// ============================================================================

const WAVEFORM_HEIGHT = 64;
const WAVEFORM_BAR_WIDTH = 2;
const WAVEFORM_BAR_GAP = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

// ============================================================================
// Utility Functions
// ============================================================================

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function generateMockWaveform(length: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < length; i++) {
    // Generate somewhat realistic waveform shape
    const base = 0.3 + Math.random() * 0.4;
    const variation = Math.sin(i * 0.1) * 0.2;
    data.push(Math.min(1, Math.max(0.1, base + variation)));
  }
  return data;
}

// ============================================================================
// Sub-Components
// ============================================================================

interface WaveformDisplayProps {
  waveforms: WaveformData[];
  currentTime: number;
  duration: number;
  zoom: number;
  onSeek: (time: number) => void;
  currentBlockId?: string;
  height?: number;
}

function WaveformDisplay({
  waveforms,
  currentTime,
  duration,
  zoom,
  onSeek,
  currentBlockId,
  height = WAVEFORM_HEIGHT,
}: WaveformDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const totalWidth = containerRef.current.scrollWidth;
    const clickTime = (x / totalWidth) * duration;

    onSeek(Math.max(0, Math.min(duration, clickTime)));
  }, [duration, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const totalWidth = containerRef.current.scrollWidth;
    const time = (x / totalWidth) * duration;

    setHoverTime(Math.max(0, Math.min(duration, time)));
  }, [duration]);

  // Calculate progress position
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hoverPercent = hoverTime !== null && duration > 0 ? (hoverTime / duration) * 100 : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-x-auto cursor-pointer"
      style={{ height }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverTime(null)}
    >
      <div
        className="relative h-full"
        style={{ width: `${100 * zoom}%`, minWidth: '100%' }}
      >
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center gap-px">
          {waveforms.map((waveform, waveformIndex) => {
            const waveformStart = duration > 0 ? (waveform.startTime / duration) * 100 : 0;
            const waveformWidth = duration > 0 ? ((waveform.endTime - waveform.startTime) / duration) * 100 : 0;
            const isCurrentBlock = waveform.blockId === currentBlockId;

            return (
              <div
                key={waveform.blockId}
                className="absolute h-full flex items-center gap-px"
                style={{ left: `${waveformStart}%`, width: `${waveformWidth}%` }}
              >
                {waveform.data.map((amplitude, i) => {
                  const barHeight = amplitude * height * 0.8;
                  const barPosition = (i / waveform.data.length) * 100;
                  const absolutePosition = waveformStart + (barPosition * waveformWidth) / 100;
                  const isPast = absolutePosition < progressPercent;

                  return (
                    <div
                      key={i}
                      className={cn(
                        'transition-colors',
                        isPast
                          ? 'bg-cyan-500'
                          : isCurrentBlock
                          ? 'bg-purple-500/60'
                          : 'bg-slate-600'
                      )}
                      style={{
                        width: WAVEFORM_BAR_WIDTH,
                        height: barHeight,
                        minHeight: 4,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10 pointer-events-none"
          style={{ left: `${progressPercent}%` }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400" />
        </div>

        {/* Hover indicator */}
        {hoverPercent !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/30 z-5 pointer-events-none"
            style={{ left: `${hoverPercent}%` }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-700 text-[9px] text-white whitespace-nowrap">
              {formatTime(hoverTime!)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface BlockMarkerProps {
  block: NarrationBlock;
  startPercent: number;
  widthPercent: number;
  isActive: boolean;
  onClick: () => void;
}

function BlockMarker({ block, startPercent, widthPercent, isActive, onClick }: BlockMarkerProps) {
  const blockColors: Record<string, string> = {
    narration: 'bg-amber-500/30 border-amber-500/50',
    dialogue: 'bg-purple-500/30 border-purple-500/50',
    description: 'bg-blue-500/30 border-blue-500/50',
    direction: 'bg-slate-500/30 border-slate-500/50',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'absolute h-full border-l border-r transition-colors',
        blockColors[block.blockType] || blockColors.narration,
        isActive && 'ring-1 ring-cyan-500'
      )}
      style={{
        left: `${startPercent}%`,
        width: `${widthPercent}%`,
        minWidth: 4,
      }}
      title={block.speaker ? `${block.speaker}: ${block.text.slice(0, 50)}...` : block.text.slice(0, 50)}
    />
  );
}

interface ChapterListProps {
  chapters: ChapterAudio[];
  currentChapterId?: string;
  onSelect: (chapterId: string) => void;
}

function ChapterList({ chapters, currentChapterId, onSelect }: ChapterListProps) {
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {chapters.map((chapter, index) => (
        <button
          key={chapter.chapterId}
          onClick={() => onSelect(chapter.chapterId)}
          className={cn(
            'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
            currentChapterId === chapter.chapterId
              ? 'bg-cyan-600/20 border border-cyan-500/30'
              : 'hover:bg-slate-800'
          )}
        >
          <span className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">
              {chapter.chapterName}
            </div>
            <div className="text-[9px] text-slate-500">
              {formatTime(chapter.totalDuration)} • {chapter.metadata.wordCount} words
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AudioTimeline({
  blocks,
  chapters,
  currentBlockId,
  currentTime,
  duration,
  isPlaying,
  volume,
  isMuted,
  onPlay,
  onPause,
  onSeek,
  onBlockSelect,
  onChapterSelect,
  onVolumeChange,
  onMuteToggle,
  onExport,
  className,
}: AudioTimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [showChapters, setShowChapters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [loop, setLoop] = useState(false);

  // Generate waveform data for blocks
  const waveforms = useMemo<WaveformData[]>(() => {
    let startTime = 0;
    return blocks.map(block => {
      const blockDuration = block.audioData?.duration || 5000;
      const waveform: WaveformData = {
        blockId: block.id,
        data: block.audioData?.waveformData || generateMockWaveform(50),
        startTime,
        endTime: startTime + blockDuration,
      };
      startTime += blockDuration;
      return waveform;
    });
  }, [blocks]);

  // Find current chapter
  const currentChapter = useMemo(() => {
    if (!chapters) return null;
    let timeOffset = 0;
    for (const chapter of chapters) {
      if (currentTime >= timeOffset && currentTime < timeOffset + chapter.totalDuration) {
        return chapter;
      }
      timeOffset += chapter.totalDuration;
    }
    return chapters[chapters.length - 1];
  }, [chapters, currentTime]);

  // Skip controls
  const handleSkipBack = useCallback(() => {
    onSeek(Math.max(0, currentTime - 10000)); // Skip back 10 seconds
  }, [currentTime, onSeek]);

  const handleSkipForward = useCallback(() => {
    onSeek(Math.min(duration, currentTime + 10000)); // Skip forward 10 seconds
  }, [currentTime, duration, onSeek]);

  // Previous/next block
  const handlePrevBlock = useCallback(() => {
    const currentIndex = blocks.findIndex(b => b.id === currentBlockId);
    if (currentIndex > 0) {
      onBlockSelect(blocks[currentIndex - 1].id);
    }
  }, [blocks, currentBlockId, onBlockSelect]);

  const handleNextBlock = useCallback(() => {
    const currentIndex = blocks.findIndex(b => b.id === currentBlockId);
    if (currentIndex < blocks.length - 1) {
      onBlockSelect(blocks[currentIndex + 1].id);
    }
  }, [blocks, currentBlockId, onBlockSelect]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(MAX_ZOOM, z + 0.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => Math.max(MIN_ZOOM, z - 0.5));
  }, []);

  return (
    <div className={cn('flex flex-col bg-slate-950 border border-slate-800 rounded-lg', className)}>
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileAudio className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-200">Audio Timeline</span>
          {currentChapter && (
            <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-800">
              {currentChapter.chapterName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            className="p-1 rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <ZoomOut className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <span className="text-[10px] text-slate-500 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            className="p-1 rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <ZoomIn className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Chapters */}
          {chapters && chapters.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowChapters(!showChapters)}
                className={cn(
                  'p-1 rounded transition-colors',
                  showChapters ? 'bg-cyan-600/20 text-cyan-400' : 'hover:bg-slate-800 text-slate-400'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {showChapters && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute right-0 top-full mt-1 z-20 w-64 p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
                  >
                    <div className="text-xs font-medium text-slate-300 mb-2">Chapters</div>
                    <ChapterList
                      chapters={chapters}
                      currentChapterId={currentChapter?.chapterId}
                      onSelect={(id) => {
                        onChapterSelect?.(id);
                        setShowChapters(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Export */}
          {onExport && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-1 rounded hover:bg-slate-800 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute right-0 top-full mt-1 z-20 w-40 py-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl"
                  >
                    {(['mp3', 'wav', 'm4b'] as const).map(format => (
                      <button
                        key={format}
                        onClick={() => {
                          onExport(format);
                          setShowExportMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        Export as .{format}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Waveform Area */}
      <div className="shrink-0 px-3 py-2 border-b border-slate-800">
        {/* Block markers */}
        <div className="relative h-4 mb-1">
          {waveforms.map((waveform, index) => {
            const startPercent = duration > 0 ? (waveform.startTime / duration) * 100 : 0;
            const widthPercent = duration > 0 ? ((waveform.endTime - waveform.startTime) / duration) * 100 : 0;

            return (
              <BlockMarker
                key={waveform.blockId}
                block={blocks[index]}
                startPercent={startPercent}
                widthPercent={widthPercent}
                isActive={currentBlockId === waveform.blockId}
                onClick={() => onBlockSelect(waveform.blockId)}
              />
            );
          })}
        </div>

        {/* Waveform */}
        <WaveformDisplay
          waveforms={waveforms}
          currentTime={currentTime}
          duration={duration}
          zoom={zoom}
          onSeek={onSeek}
          currentBlockId={currentBlockId}
        />

        {/* Time indicators */}
        <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2">
        {/* Left: Block navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevBlock}
            disabled={!currentBlockId || blocks.findIndex(b => b.id === currentBlockId) === 0}
            className="p-1.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Previous block"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={handleNextBlock}
            disabled={!currentBlockId || blocks.findIndex(b => b.id === currentBlockId) === blocks.length - 1}
            className="p-1.5 rounded hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Next block"
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Center: Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSkipBack}
            className="p-1.5 rounded hover:bg-slate-800 transition-colors"
            title="Skip back 10s"
          >
            <SkipBack className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-2.5 rounded-full bg-cyan-600 hover:bg-cyan-500 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={handleSkipForward}
            className="p-1.5 rounded hover:bg-slate-800 transition-colors"
            title="Skip forward 10s"
          >
            <SkipForward className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Right: Volume and extras */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLoop(!loop)}
            className={cn(
              'p-1.5 rounded transition-colors',
              loop ? 'bg-cyan-600/20 text-cyan-400' : 'hover:bg-slate-800 text-slate-400'
            )}
            title="Loop"
          >
            <Repeat className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={onMuteToggle}
              className="p-1.5 rounded hover:bg-slate-800 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
              className="w-16 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Current Block Info */}
      {currentBlockId && (
        <div className="shrink-0 px-3 py-2 border-t border-slate-800 bg-slate-900/50">
          {(() => {
            const block = blocks.find(b => b.id === currentBlockId);
            if (!block) return null;

            return (
              <div className="flex items-start gap-2">
                <div className={cn(
                  'shrink-0 px-1.5 py-0.5 rounded text-[9px] font-medium',
                  block.blockType === 'dialogue' && 'bg-purple-500/20 text-purple-400',
                  block.blockType === 'narration' && 'bg-amber-500/20 text-amber-400',
                  block.blockType === 'description' && 'bg-blue-500/20 text-blue-400',
                  block.blockType === 'direction' && 'bg-slate-500/20 text-slate-400'
                )}>
                  {block.blockType}
                </div>
                <div className="flex-1 min-w-0">
                  {block.speaker && (
                    <div className="text-[10px] font-medium text-slate-300 mb-0.5">
                      {block.speaker}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 line-clamp-2">
                    {block.text}
                  </div>
                </div>
                {block.audioData && (
                  <div className="shrink-0 flex items-center gap-1 text-[9px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(block.audioData.duration)}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default AudioTimeline;
