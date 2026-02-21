'use client';

import { useState, useCallback, useRef } from 'react';
import type { TimelineMarker } from '../types';
import { MARKER_COLORS } from '../types';

export function useMarkers() {
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const counterRef = useRef(1);

  const addMarker = useCallback((time: number, label?: string) => {
    const idx = counterRef.current;
    counterRef.current++;
    const colorIdx = (idx - 1) % MARKER_COLORS.length;

    const marker: TimelineMarker = {
      id: `m-${Date.now()}-${idx}`,
      time,
      label: label ?? `M${idx}`,
      color: MARKER_COLORS[colorIdx],
    };

    setMarkers((prev) => [...prev, marker].sort((a, b) => a.time - b.time));
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const updateMarker = useCallback((id: string, updates: Partial<TimelineMarker>) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
        .sort((a, b) => a.time - b.time)
    );
  }, []);

  const clearMarkers = useCallback(() => {
    setMarkers([]);
    counterRef.current = 1;
  }, []);

  /** Returns the marker's time for playhead seeking, or null */
  const jumpToMarker = useCallback((id: string): number | null => {
    const marker = markers.find((m) => m.id === id);
    return marker?.time ?? null;
  }, [markers]);

  /** Jump to next marker after `currentTime`, or null if none */
  const jumpToNextMarker = useCallback((currentTime: number): number | null => {
    const next = markers.find((m) => m.time > currentTime + 0.05);
    return next?.time ?? null;
  }, [markers]);

  /** Jump to previous marker before `currentTime`, or null if none */
  const jumpToPrevMarker = useCallback((currentTime: number): number | null => {
    const prev = [...markers].reverse().find((m) => m.time < currentTime - 0.05);
    return prev?.time ?? null;
  }, [markers]);

  return {
    markers,
    addMarker,
    removeMarker,
    updateMarker,
    clearMarkers,
    jumpToMarker,
    jumpToNextMarker,
    jumpToPrevMarker,
  };
}
