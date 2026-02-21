/**
 * ScriptRenderer Component
 *
 * Synchronized text rendering with audio playback highlighting.
 * Features:
 * - Word-level highlighting during playback
 * - Timing marker integration
 * - Smooth scrolling to current position
 * - Click-to-seek functionality
 */

'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  type TimingMarker,
  type NarrationBlock,
} from '@/lib/audio';

// ============================================================================
// Types
// ============================================================================

interface ScriptRendererProps {
  blocks: NarrationBlock[];
  currentBlockId?: string;
  currentTime: number;          // Current playback time in ms
  isPlaying: boolean;
  highlightMode: 'word' | 'sentence' | 'block';
  showTimingMarkers?: boolean;
  autoScroll?: boolean;
  onSeek: (time: number) => void;
  onBlockClick: (blockId: string) => void;
  className?: string;
}

interface HighlightRange {
  start: number;
  end: number;
  type: 'current' | 'past' | 'future';
}

// ============================================================================
// Utility Functions
// ============================================================================

function getBlockStartTime(blocks: NarrationBlock[], blockIndex: number): number {
  let time = 0;
  for (let i = 0; i < blockIndex; i++) {
    time += blocks[i].audioData?.duration || 5000;
  }
  return time;
}

function findCurrentMarker(
  markers: TimingMarker[] | undefined,
  localTime: number,
  mode: 'word' | 'sentence' | 'block'
): TimingMarker | undefined {
  if (!markers || markers.length === 0) return undefined;

  const relevantMarkers = markers.filter(m =>
    mode === 'word' ? m.type === 'word' :
    mode === 'sentence' ? m.type === 'sentence' :
    true
  );

  return relevantMarkers.find(
    m => localTime >= m.audioStart && localTime <= m.audioEnd
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface RenderBlockProps {
  block: NarrationBlock;
  blockStartTime: number;
  currentTime: number;
  isCurrentBlock: boolean;
  isPlaying: boolean;
  highlightMode: 'word' | 'sentence' | 'block';
  showTimingMarkers: boolean;
  onSeek: (time: number) => void;
  onClick: () => void;
}

function RenderBlock({
  block,
  blockStartTime,
  currentTime,
  isCurrentBlock,
  isPlaying,
  highlightMode,
  showTimingMarkers,
  onSeek,
  onClick,
}: RenderBlockProps) {
  const blockRef = useRef<HTMLDivElement>(null);
  const blockDuration = block.audioData?.duration || 5000;
  const blockEndTime = blockStartTime + blockDuration;
  const localTime = currentTime - blockStartTime;
  const isPast = currentTime >= blockEndTime;

  // Find current marker for word/sentence highlighting
  const currentMarker = useMemo(() => {
    if (!isCurrentBlock || highlightMode === 'block') return undefined;
    return findCurrentMarker(block.timingMarkers, localTime, highlightMode);
  }, [block.timingMarkers, localTime, isCurrentBlock, highlightMode]);

  // Scroll into view when current
  useEffect(() => {
    if (isCurrentBlock && isPlaying && blockRef.current) {
      blockRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isCurrentBlock, isPlaying]);

  // Render text with highlighting
  const renderText = useCallback(() => {
    const text = block.text;

    // Block-level highlighting
    if (highlightMode === 'block' || !block.timingMarkers || block.timingMarkers.length === 0) {
      return (
        <span className={cn(
          'transition-colors duration-200',
          isCurrentBlock && isPlaying && 'text-cyan-300',
          isPast && 'text-slate-400'
        )}>
          {text}
        </span>
      );
    }

    // Word/sentence-level highlighting
    const markers = block.timingMarkers.filter(m =>
      highlightMode === 'word' ? m.type === 'word' : m.type === 'sentence'
    );

    if (markers.length === 0) {
      return <span>{text}</span>;
    }

    // Build highlighted segments
    const segments: React.ReactNode[] = [];
    let lastEnd = 0;

    markers.forEach((marker, index) => {
      // Text before marker
      if (marker.textStart > lastEnd) {
        const beforeText = text.slice(lastEnd, marker.textStart);
        const isBeforePast = isCurrentBlock && localTime > marker.audioStart;
        segments.push(
          <span
            key={`before-${index}`}
            className={cn(isBeforePast && 'text-slate-400')}
          >
            {beforeText}
          </span>
        );
      }

      // Marker text
      const markerIsPast = isCurrentBlock && localTime > marker.audioEnd;
      const markerIsCurrent = isCurrentBlock &&
        localTime >= marker.audioStart &&
        localTime <= marker.audioEnd;

      segments.push(
        <span
          key={`marker-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            onSeek(blockStartTime + marker.audioStart);
          }}
          className={cn(
            'cursor-pointer transition-all duration-150 rounded-sm',
            markerIsCurrent && 'bg-cyan-500/30 text-cyan-300',
            markerIsPast && 'text-slate-400',
            !markerIsCurrent && !markerIsPast && 'hover:bg-slate-700/50'
          )}
        >
          {marker.text}
        </span>
      );

      lastEnd = marker.textEnd;
    });

    // Remaining text
    if (lastEnd < text.length) {
      segments.push(
        <span key="remaining">{text.slice(lastEnd)}</span>
      );
    }

    return <>{segments}</>;
  }, [
    block.text,
    block.timingMarkers,
    highlightMode,
    isCurrentBlock,
    isPlaying,
    isPast,
    localTime,
    blockStartTime,
    onSeek,
  ]);

  // Block type styles
  const blockTypeStyles: Record<string, string> = {
    narration: 'text-slate-300',
    dialogue: 'text-purple-300 italic',
    description: 'text-blue-300',
    direction: 'text-slate-500 uppercase text-[10px] tracking-wide',
  };

  return (
    <div
      ref={blockRef}
      onClick={onClick}
      className={cn(
        'group relative px-4 py-2 cursor-pointer transition-all',
        isCurrentBlock && 'bg-slate-800/50 border-l-2 border-cyan-500',
        !isCurrentBlock && 'hover:bg-slate-800/30 border-l-2 border-transparent'
      )}
    >
      {/* Speaker label for dialogue */}
      {block.speaker && block.speakerType === 'character' && (
        <div className="text-[10px] font-semibold text-purple-400 mb-1 uppercase tracking-wide">
          {block.speaker}
        </div>
      )}

      {/* Block content */}
      <div className={cn('text-sm leading-relaxed', blockTypeStyles[block.blockType])}>
        {renderText()}
      </div>

      {/* Timing marker indicator */}
      {showTimingMarkers && currentMarker && isCurrentBlock && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-2 top-2 px-1.5 py-0.5 rounded bg-cyan-600/20 text-[9px] text-cyan-400"
        >
          {currentMarker.type}
        </motion.div>
      )}

      {/* Progress indicator for current block */}
      {isCurrentBlock && blockDuration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
          <motion.div
            className="h-full bg-cyan-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (localTime / blockDuration) * 100)}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ScriptRenderer({
  blocks,
  currentBlockId,
  currentTime,
  isPlaying,
  highlightMode,
  showTimingMarkers = false,
  autoScroll = true,
  onSeek,
  onBlockClick,
  className,
}: ScriptRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Group blocks by scene for better visual organization
  const groupedBlocks = useMemo(() => {
    const groups: Array<{
      sceneId: string;
      blocks: Array<{ block: NarrationBlock; startTime: number }>;
    }> = [];

    let currentSceneId = '';
    let currentGroup: typeof groups[0] | null = null;
    let runningTime = 0;

    blocks.forEach(block => {
      if (block.sceneId !== currentSceneId) {
        currentSceneId = block.sceneId;
        currentGroup = { sceneId: block.sceneId, blocks: [] };
        groups.push(currentGroup);
      }

      currentGroup!.blocks.push({
        block,
        startTime: runningTime,
      });

      runningTime += block.audioData?.duration || 5000;
    });

    return groups;
  }, [blocks]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full overflow-y-auto bg-slate-950 scroll-smooth',
        className
      )}
    >
      {groupedBlocks.map((group, groupIndex) => (
        <div key={group.sceneId} className="mb-6">
          {/* Scene header */}
          <div className="sticky top-0 z-10 px-4 py-2 bg-slate-900/95 backdrop-blur border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Scene {groupIndex + 1}
              </span>
            </div>
          </div>

          {/* Scene blocks */}
          <div className="divide-y divide-slate-800/50">
            {group.blocks.map(({ block, startTime }) => (
              <RenderBlock
                key={block.id}
                block={block}
                blockStartTime={startTime}
                currentTime={currentTime}
                isCurrentBlock={currentBlockId === block.id}
                isPlaying={isPlaying}
                highlightMode={highlightMode}
                showTimingMarkers={showTimingMarkers}
                onSeek={onSeek}
                onClick={() => onBlockClick(block.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="h-full flex items-center justify-center text-center p-8">
          <div>
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📜</span>
            </div>
            <p className="text-sm text-slate-400">No script content</p>
            <p className="text-xs text-slate-500 mt-1">
              Generate or import script blocks to see them here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScriptRenderer;
