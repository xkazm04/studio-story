'use client';

import { useCallback, useRef } from 'react';
import type { TimelineClip, AudioAssetType, ClipSelection } from '../types';

interface LaneGroup {
  type: AudioAssetType;
  collapsed: boolean;
  muted: boolean;
  clips: TimelineClip[];
}

/**
 * Clipboard operations for timeline clips: copy, paste, split.
 * All mutating operations call `commit()` after applying changes.
 */
export function useClipboard(
  groups: LaneGroup[],
  setGroups: React.Dispatch<React.SetStateAction<LaneGroup[]>>,
  selection: ClipSelection,
  playheadPos: number,
  commitBefore: () => void,
  commit: () => void
) {
  const clipboardRef = useRef<TimelineClip[]>([]);

  /** Deep-clone selected clips into clipboard, normalized to earliest start time */
  const copy = useCallback(() => {
    const selected: TimelineClip[] = [];
    for (const g of groups) {
      for (const c of g.clips) {
        if (selection.selectedClipIds.has(c.id)) {
          selected.push(structuredClone(c));
        }
      }
    }
    if (selected.length === 0) return;

    // Normalize: subtract earliest startTime so pasting is relative to playhead
    const earliest = Math.min(...selected.map((c) => c.startTime));
    for (const c of selected) {
      c.startTime -= earliest;
    }
    clipboardRef.current = selected;
  }, [groups, selection]);

  /** Paste clipboard clips at playhead position */
  const paste = useCallback(() => {
    if (clipboardRef.current.length === 0) return;

    commitBefore();

    const newClips = clipboardRef.current.map((c) => ({
      ...structuredClone(c),
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      startTime: Math.round((playheadPos + c.startTime) * 10) / 10,
    }));

    setGroups((prev) =>
      prev.map((g) => {
        const laneClips = newClips.filter((c) => c.lane === g.type);
        if (laneClips.length === 0) return g;
        return { ...g, clips: [...g.clips, ...laneClips] };
      })
    );

    commit();
  }, [playheadPos, setGroups, commitBefore, commit]);

  /** Split selected clips at playhead position */
  const split = useCallback(() => {
    if (selection.selectedClipIds.size === 0) return;

    let didSplit = false;

    commitBefore();

    setGroups((prev) =>
      prev.map((g) => {
        const newClips: TimelineClip[] = [];
        for (const c of g.clips) {
          if (!selection.selectedClipIds.has(c.id)) {
            newClips.push(c);
            continue;
          }

          const clipEnd = c.startTime + c.duration;
          // Only split if playhead is inside the clip (not at edges)
          if (playheadPos > c.startTime + 0.1 && playheadPos < clipEnd - 0.1) {
            didSplit = true;
            const leftDuration = playheadPos - c.startTime;
            const rightDuration = clipEnd - playheadPos;

            // Left half
            newClips.push({
              ...c,
              duration: Math.round(leftDuration * 100) / 100,
              fadeOut: 0, // Remove fade at split point
            });

            // Right half
            newClips.push({
              ...c,
              id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              startTime: Math.round(playheadPos * 100) / 100,
              duration: Math.round(rightDuration * 100) / 100,
              fadeIn: 0, // Remove fade at split point
            });
          } else {
            newClips.push(c);
          }
        }
        return { ...g, clips: newClips };
      })
    );

    if (didSplit) commit();
  }, [selection, playheadPos, setGroups, commitBefore, commit]);

  return {
    copy,
    paste,
    split,
    hasClipboard: clipboardRef.current.length > 0,
  };
}
