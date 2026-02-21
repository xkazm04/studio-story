'use client';

import { useState, useCallback, useRef } from 'react';
import type { TimelineClip, AudioAssetType, ClipSelection, SnapConfig } from '../types';

interface LaneGroup {
  type: AudioAssetType;
  collapsed: boolean;
  muted: boolean;
  clips: TimelineClip[];
}

interface DragState {
  clipId: string;
  mode: 'move' | 'resize-left' | 'resize-right';
  startX: number;
  originalStartTime: number;
  originalDuration: number;
}

export function snapToGrid(time: number, snap: SnapConfig): number {
  if (!snap.enabled || snap.gridSize <= 0) return time;
  return Math.round(time / snap.gridSize) * snap.gridSize;
}

export function useClipInteraction(
  groups: LaneGroup[],
  setGroups: React.Dispatch<React.SetStateAction<LaneGroup[]>>,
  pixelsPerSecond: number,
  snap: SnapConfig,
  commitBefore: () => void,
  commit: () => void
) {
  const [selection, setSelection] = useState<ClipSelection>({
    selectedClipIds: new Set(),
    lastSelectedId: null,
  });
  const dragRef = useRef<DragState | null>(null);

  /** Click a clip to select it (shift+click for multi-select) */
  const handleClipClick = useCallback((clipId: string, shiftKey: boolean) => {
    setSelection((prev) => {
      const newSet = new Set(shiftKey ? prev.selectedClipIds : []);
      if (newSet.has(clipId) && shiftKey) {
        newSet.delete(clipId);
      } else {
        newSet.add(clipId);
      }
      return { selectedClipIds: newSet, lastSelectedId: clipId };
    });
  }, []);

  /** Clear selection */
  const clearSelection = useCallback(() => {
    setSelection({ selectedClipIds: new Set(), lastSelectedId: null });
  }, []);

  /** Delete all selected clips from groups */
  const deleteSelected = useCallback(() => {
    if (selection.selectedClipIds.size === 0) return;
    commitBefore();
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        clips: g.clips.filter((c) => !selection.selectedClipIds.has(c.id)),
      }))
    );
    commit();
    clearSelection();
  }, [selection, setGroups, clearSelection, commitBefore, commit]);

  /** Start dragging a clip body (move mode) */
  const startDrag = useCallback((clipId: string, e: React.MouseEvent, mode: 'move' | 'resize-left' | 'resize-right') => {
    e.stopPropagation();
    e.preventDefault();

    // Find the clip
    let clip: TimelineClip | undefined;
    for (const g of groups) {
      clip = g.clips.find((c) => c.id === clipId);
      if (clip) break;
    }
    if (!clip) return;

    // Skip drag/resize for locked clips
    if (clip.locked) return;

    // Snapshot before drag starts
    commitBefore();

    dragRef.current = {
      clipId,
      mode,
      startX: e.clientX,
      originalStartTime: clip.startTime,
      originalDuration: clip.duration,
    };

    const handleMouseMove = (me: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = me.clientX - drag.startX;
      const dt = dx / pixelsPerSecond;

      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          clips: g.clips.map((c) => {
            if (c.id !== drag.clipId) return c;

            if (drag.mode === 'move') {
              const newStart = snapToGrid(Math.max(0, drag.originalStartTime + dt), snap);
              return { ...c, startTime: newStart };
            }
            if (drag.mode === 'resize-left') {
              const newStart = snapToGrid(Math.max(0, drag.originalStartTime + dt), snap);
              const maxStart = drag.originalStartTime + drag.originalDuration - 0.5;
              const clampedStart = Math.min(newStart, maxStart);
              const newDuration = drag.originalDuration - (clampedStart - drag.originalStartTime);
              return { ...c, startTime: clampedStart, duration: Math.max(0.5, newDuration) };
            }
            if (drag.mode === 'resize-right') {
              const newDuration = snapToGrid(Math.max(0.5, drag.originalDuration + dt), snap);
              return { ...c, duration: newDuration };
            }
            return c;
          }),
        }))
      );
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      commit(); // Finalize to undo history
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [groups, pixelsPerSecond, snap, setGroups, commitBefore, commit]);

  return {
    selection,
    setSelection,
    handleClipClick,
    clearSelection,
    deleteSelected,
    startDrag,
  };
}
