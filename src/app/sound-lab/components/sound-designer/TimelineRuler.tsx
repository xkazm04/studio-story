'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/app/lib/utils';
import { MARKER_STROKE_COLORS } from '../../types';
import type { TimelineMarker, LoopRegion } from '../../types';

interface TimelineRulerProps {
  pixelsPerSecond: number;
  totalDuration: number;
  playheadPos: number;
  markers: TimelineMarker[];
  loopRegion: LoopRegion | null;
  loopEnabled: boolean;
  onSeek: (time: number) => void;
  onMarkerAdd: (time: number) => void;
  onLoopChange: (region: LoopRegion | null) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TimelineRuler({
  pixelsPerSecond,
  totalDuration,
  markers,
  loopRegion,
  loopEnabled,
  onSeek,
  onMarkerAdd,
  onLoopChange,
}: TimelineRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const loopDragRef = useRef<{ startTime: number } | null>(null);

  // Compute tick interval based on zoom
  const tickInterval = pixelsPerSecond >= 7.5 ? 5 : 10;
  const subTickInterval = tickInterval / 5;
  const ticks: number[] = [];
  for (let t = 0; t <= totalDuration; t += tickInterval) {
    ticks.push(t);
  }

  // Sub-ticks (only show when zoomed in enough)
  const showSubTicks = pixelsPerSecond >= 5;
  const subTicks: number[] = [];
  if (showSubTicks) {
    for (let t = 0; t <= totalDuration; t += subTickInterval) {
      if (t % tickInterval !== 0) subTicks.push(t);
    }
  }

  const getTimeFromX = useCallback((clientX: number): number => {
    if (!rulerRef.current) return 0;
    const rect = rulerRef.current.getBoundingClientRect();
    const scrollLeft = rulerRef.current.closest('.overflow-x-auto')?.scrollLeft ?? 0;
    const x = clientX - rect.left + scrollLeft;
    return Math.max(0, Math.min(totalDuration, x / pixelsPerSecond));
  }, [pixelsPerSecond, totalDuration]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (loopDragRef.current) return; // Don't seek during loop creation
    const time = getTimeFromX(e.clientX);
    onSeek(time);
  }, [getTimeFromX, onSeek]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const time = getTimeFromX(e.clientX);
    onMarkerAdd(time);
  }, [getTimeFromX, onMarkerAdd]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!e.shiftKey) return; // Only shift+drag creates loop
    e.preventDefault();

    const startTime = getTimeFromX(e.clientX);
    loopDragRef.current = { startTime };

    const handleMouseMove = (me: MouseEvent) => {
      if (!loopDragRef.current) return;
      const currentTime = getTimeFromX(me.clientX);
      const s = Math.min(loopDragRef.current.startTime, currentTime);
      const end = Math.max(loopDragRef.current.startTime, currentTime);
      if (end - s > 0.2) {
        onLoopChange({ start: s, end });
      }
    };

    const handleMouseUp = () => {
      loopDragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [getTimeFromX, onLoopChange]);

  return (
    <div
      ref={rulerRef}
      className="h-7 border-b border-slate-700/30 relative sticky top-0 bg-slate-950 z-10 cursor-pointer select-none"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Loop Region Highlight */}
      {loopRegion && loopEnabled && (
        <div
          className="absolute top-0 bottom-0 bg-orange-500/10 border-x border-orange-500/30 pointer-events-none"
          style={{
            left: loopRegion.start * pixelsPerSecond,
            width: (loopRegion.end - loopRegion.start) * pixelsPerSecond,
          }}
        />
      )}

      {/* Loop Region (when set but not enabled — dimmer) */}
      {loopRegion && !loopEnabled && (
        <div
          className="absolute top-0 bottom-0 bg-slate-500/5 border-x border-slate-500/20 pointer-events-none"
          style={{
            left: loopRegion.start * pixelsPerSecond,
            width: (loopRegion.end - loopRegion.start) * pixelsPerSecond,
          }}
        />
      )}

      {/* Major Ticks */}
      {ticks.map((t) => (
        <div
          key={`major-${t}`}
          className="absolute top-0 h-full flex flex-col items-center"
          style={{ left: t * pixelsPerSecond }}
        >
          <div className="w-px h-3 bg-slate-700/50" />
          <span className="text-[11px] text-slate-400 font-mono mt-0.5">{formatTime(t)}</span>
        </div>
      ))}

      {/* Sub-ticks */}
      {subTicks.map((t) => (
        <div
          key={`sub-${t}`}
          className="absolute top-0 w-px h-1.5 bg-slate-700/30"
          style={{ left: t * pixelsPerSecond }}
        />
      ))}

      {/* Markers */}
      {markers.map((marker) => {
        const strokeColor = MARKER_STROKE_COLORS[marker.color] ?? '#fbbf24';
        const isHovered = hoveredMarker === marker.id;

        return (
          <div
            key={marker.id}
            className="absolute top-0 z-[5]"
            style={{ left: marker.time * pixelsPerSecond }}
            onMouseEnter={() => setHoveredMarker(marker.id)}
            onMouseLeave={() => setHoveredMarker(null)}
          >
            {/* Marker line */}
            <div
              className="w-px h-full absolute top-0 opacity-60"
              style={{ backgroundColor: strokeColor }}
            />

            {/* Marker triangle */}
            <svg
              width="10" height="8" viewBox="0 0 10 8"
              className="absolute -ml-[5px] top-0 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSeek(marker.time);
              }}
            >
              <polygon points="5,8 0,0 10,0" fill={strokeColor} />
            </svg>

            {/* Marker label (shown on hover) */}
            {isHovered && (
              <div
                className="absolute top-8 -ml-6 px-1.5 py-0.5 rounded text-[9px] font-medium text-white whitespace-nowrap z-20"
                style={{ backgroundColor: strokeColor }}
              >
                {marker.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
