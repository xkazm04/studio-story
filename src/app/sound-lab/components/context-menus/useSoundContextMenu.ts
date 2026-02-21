/**
 * useSoundContextMenu — State management hook for Sound Lab context menus
 *
 * Pattern adapted from GraphContextMenu's useContextMenu hook.
 */

'use client';

import { useState, useCallback } from 'react';
import type { AudioAsset, AudioAssetType, StemType } from '../../types';

// ============ Types ============

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export type ContextMenuTarget =
  | { type: 'clip'; clipId: string; laneType: AudioAssetType; clipName: string; duration: number; locked?: boolean; muted?: boolean }
  | { type: 'lane'; laneType: AudioAssetType; clipCount: number; muted: boolean; soloed: boolean; collapsed: boolean }
  | { type: 'canvas'; time: number }
  | { type: 'library-asset'; asset: AudioAsset }
  | { type: 'stem'; stemIndex: number; stemType: StemType; muted: boolean; soloed: boolean; hasAudioUrl: boolean };

export interface UseSoundContextMenuReturn {
  position: ContextMenuPosition | null;
  target: ContextMenuTarget | null;
  show: (position: ContextMenuPosition, target: ContextMenuTarget) => void;
  hide: () => void;
  handleContextMenu: (e: React.MouseEvent, target: ContextMenuTarget) => void;
}

// ============ Hook ============

export function useSoundContextMenu(): UseSoundContextMenuReturn {
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);
  const [target, setTarget] = useState<ContextMenuTarget | null>(null);

  const show = useCallback((pos: ContextMenuPosition, tgt: ContextMenuTarget) => {
    setPosition(pos);
    setTarget(tgt);
  }, []);

  const hide = useCallback(() => {
    setPosition(null);
    setTarget(null);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, tgt: ContextMenuTarget) => {
      e.preventDefault();
      e.stopPropagation();
      show({ x: e.clientX, y: e.clientY }, tgt);
    },
    [show],
  );

  return { position, target, show, hide, handleContextMenu };
}
