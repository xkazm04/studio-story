'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, Volume2, VolumeX,
  Play, Square, SkipBack, ZoomIn, ZoomOut, Mic, Music, Zap, Trees, Magnet,
  Undo2, Redo2, Save, Download, Scissors, X, Repeat, Bookmark,
  Edit3, Copy, Files, ArrowRight, Lock, Unlock, Trash2,
  Clipboard, MousePointer, Plus, Headphones,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { MOCK_TIMELINE_CLIPS } from '../../data/mockAudioData';
import { TRACK_TYPE_STYLES, SNAP_PRESETS } from '../../types';
import { AudioEngine } from '../../lib/audioEngine';
import { useUndoableState } from '../../hooks/useUndoableState';
import { useClipInteraction, snapToGrid } from '../../hooks/useClipInteraction';
import { useClipboard } from '../../hooks/useClipboard';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useMarkers } from '../../hooks/useMarkers';
import VUMeter from '../shared/VUMeter';
import SpectrumDisplay from '../shared/SpectrumDisplay';
import TimelineRuler from './TimelineRuler';
import AutomationOverlay from './AutomationOverlay';
import DuckingPanel from './DuckingPanel';
import { computeDuckingAutomation, DEFAULT_DUCKING_CONFIG } from '../../lib/autoDuck';
import SoundContextMenu, { ActionItem, MenuDivider, MenuSubmenu, MenuHeader } from '../context-menus/SoundContextMenu';
import { useSoundContextMenu } from '../context-menus/useSoundContextMenu';
import type { AudioAsset, AudioAssetType, TransportState, TimelineClip, SnapConfig, LoopRegion, DuckingConfig } from '../../types';

// ============ Props ============

interface TimelineMixerProps {
  transport: TransportState;
  onTransportChange: (t: TransportState) => void;
  assetMap?: Map<string, AudioAsset>;
  onSave?: () => void;
  onExport?: () => void;
}

// ============ Internal Types ============

interface LaneGroup {
  type: AudioAssetType;
  collapsed: boolean;
  muted: boolean;
  clips: TimelineClip[];
}

interface DropIndicator {
  time: number;
  lane: AudioAssetType;
}

// ============ Static Class Maps ============

const LANE_ORDER: AudioAssetType[] = ['voice', 'music', 'sfx', 'ambience'];

const LANE_ICONS: Record<AudioAssetType, typeof Mic> = {
  voice: Mic,
  music: Music,
  sfx: Zap,
  ambience: Trees,
};

/** Static clip background classes */
const CLIP_BG: Record<AudioAssetType, string> = {
  voice: 'bg-violet-500/25 border-violet-400/40',
  music: 'bg-orange-500/25 border-orange-400/40',
  sfx: 'bg-sky-500/25 border-sky-400/40',
  ambience: 'bg-teal-500/25 border-teal-400/40',
};

const CLIP_TEXT: Record<AudioAssetType, string> = {
  voice: 'text-violet-300',
  music: 'text-orange-300',
  sfx: 'text-sky-300',
  ambience: 'text-teal-300',
};

const CLIP_SELECTED: Record<AudioAssetType, string> = {
  voice: 'ring-2 ring-violet-400/60',
  music: 'ring-2 ring-orange-400/60',
  sfx: 'ring-2 ring-sky-400/60',
  ambience: 'ring-2 ring-teal-400/60',
};

const CLIP_WAVEFORM_COLOR: Record<AudioAssetType, string> = {
  voice: 'bg-violet-300/40',
  music: 'bg-orange-300/40',
  sfx: 'bg-sky-300/40',
  ambience: 'bg-teal-300/40',
};

const CLIP_HOVER_GLOW: Record<AudioAssetType, string> = {
  voice: 'hover:shadow-[0_0_12px_rgba(167,139,250,0.3)]',
  music: 'hover:shadow-[0_0_12px_rgba(251,146,60,0.3)]',
  sfx: 'hover:shadow-[0_0_12px_rgba(56,189,248,0.3)]',
  ambience: 'hover:shadow-[0_0_12px_rgba(45,212,191,0.3)]',
};

// ============ Helpers ============

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getLaneFromY(
  y: number,
  groups: LaneGroup[],
  headerHeight: number,
  rowHeight: number
): AudioAssetType {
  let currentY = headerHeight;
  for (const group of groups) {
    currentY += rowHeight;
    if (y < currentY) return group.type;
    if (!group.collapsed) {
      const clipRowsHeight = Math.max(1, group.clips.length) * rowHeight;
      if (y < currentY + clipRowsHeight) return group.type;
      currentY += clipRowsHeight;
    }
  }
  return groups[groups.length - 1]?.type ?? 'ambience';
}

// ============ Mini Waveform Subcomponent ============

/** Mini waveform inside a clip */
function ClipWaveform({ data, type }: { data: number[]; type: AudioAssetType }) {
  const barColor = CLIP_WAVEFORM_COLOR[type];
  return (
    <div className="absolute inset-0 flex items-center gap-px px-1 pointer-events-none overflow-hidden">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn('w-[2px] shrink-0 rounded-full', barColor)}
          style={{ height: `${Math.round(v * 80)}%` }}
        />
      ))}
    </div>
  );
}

// ============ Main Component ============

export default function TimelineMixer({
  transport,
  onTransportChange,
  assetMap,
  onSave,
  onExport,
}: TimelineMixerProps) {
  // ---- Undoable state for lane groups ----
  const {
    state: groups,
    setState: setGroups,
    commit,
    commitBefore,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoableState<LaneGroup[]>(
    LANE_ORDER.map((type) => ({
      type,
      collapsed: false,
      muted: false,
      clips: MOCK_TIMELINE_CLIPS.filter((c) => c.lane === type),
    }))
  );

  // ---- Solo state ----
  const [soloLanes, setSoloLanes] = useState<Set<AudioAssetType>>(new Set());

  // ---- UI state ----
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [snap, setSnap] = useState<SnapConfig>({ enabled: true, gridSize: 1, presets: [...SNAP_PRESETS] });
  const [editingClip, setEditingClip] = useState<{ clip: TimelineClip; rect: DOMRect } | null>(null);

  // ---- Markers + Loop ----
  const {
    markers, addMarker, jumpToNextMarker, jumpToPrevMarker,
  } = useMarkers();
  const [loopRegion, setLoopRegion] = useState<LoopRegion | null>(null);
  const [loopEnabled, setLoopEnabled] = useState(false);

  // ---- Auto-Duck ----
  const [duckingConfig, setDuckingConfig] = useState<DuckingConfig>(DEFAULT_DUCKING_CONFIG);
  const [showDuckingPanel, setShowDuckingPanel] = useState(false);

  const applyDucking = useCallback(() => {
    const sourceClips = groups
      .filter((g) => g.type === duckingConfig.sourceLane)
      .flatMap((g) => g.clips);
    const targetClips = groups
      .filter((g) => g.type === duckingConfig.targetLane)
      .flatMap((g) => g.clips);

    const automationMap = computeDuckingAutomation(sourceClips, targetClips, duckingConfig);

    commitBefore();
    setGroups((prev) => prev.map((g) => ({
      ...g,
      clips: g.clips.map((c) => {
        const auto = automationMap.get(c.id);
        return auto ? { ...c, automation: auto } : c;
      }),
    })));
    commit();
  }, [groups, duckingConfig, setGroups, commitBefore, commit]);
  const editingCommittedRef = useRef(false);

  // ---- Metering state ----
  const [laneLevels, setLaneLevels] = useState<Record<AudioAssetType, number>>({
    voice: 0, music: 0, sfx: 0, ambience: 0,
  });
  const [masterLevel, setMasterLevel] = useState(0);
  const [spectrumData, setSpectrumData] = useState<Uint8Array>(new Uint8Array(0));
  const [masterVolume, setMasterVolume] = useState(0.8);

  // ---- Refs ----
  const timelineRef = useRef<HTMLDivElement>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const rafRef = useRef<number>(0);
  const meterRafRef = useRef<number>(0);
  const popupRef = useRef<HTMLDivElement>(null);
  const timelineAreaRef = useRef<HTMLDivElement>(null);
  const mouseTimeRef = useRef(0);
  const pendingScrollRef = useRef<{ scrollLeft: number } | null>(null);
  const isPanningRef = useRef(false);

  // ---- Derived values ----
  const { zoom, playheadPos } = transport;
  const pixelsPerSecond = 5 * zoom;
  const totalDuration = transport.totalDuration;
  const timelineWidth = totalDuration * pixelsPerSecond;

  // Stable ref for wheel handler (avoids re-registering listener on every transport change)
  const wheelCtxRef = useRef({ transport, onTransportChange, pixelsPerSecond });
  wheelCtxRef.current = { transport, onTransportChange, pixelsPerSecond };

  const tickInterval = zoom >= 1.5 ? 5 : 10;
  const ticks = useMemo(
    () => Array.from({ length: Math.ceil(totalDuration / tickInterval) + 1 }, (_, i) => i * tickInterval),
    [totalDuration, tickInterval]
  );

  // Snap grid lines (only when snap enabled and lines won't be too dense)
  const snapGridLines = useMemo(() => {
    if (!snap.enabled) return [];
    const minPxBetween = 4;
    const pxBetween = snap.gridSize * pixelsPerSecond;
    if (pxBetween < minPxBetween) return [];
    const lines: number[] = [];
    for (let t = 0; t <= totalDuration; t += snap.gridSize) {
      // Skip if coincides with a major tick
      if (t % tickInterval === 0) continue;
      lines.push(t);
    }
    return lines;
  }, [snap.enabled, snap.gridSize, pixelsPerSecond, totalDuration, tickInterval]);

  // ---- Clip interaction hook (with undo support) ----
  const { selection, setSelection, handleClipClick, clearSelection, deleteSelected, startDrag } =
    useClipInteraction(groups, setGroups, pixelsPerSecond, snap, commitBefore, commit);

  // ---- Clipboard hook ----
  const { copy, paste, split, hasClipboard } = useClipboard(
    groups, setGroups, selection, playheadPos, commitBefore, commit
  );

  // ---- Context menu ----
  const { position: ctxPosition, target: ctxTarget, handleContextMenu, hide: hideContextMenu } = useSoundContextMenu();

  // ---- Renaming state ----
  const [renamingClipId, setRenamingClipId] = useState<string | null>(null);

  // ---- Rubberband selection ----
  const [rubberband, setRubberband] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);

  // ---- Audio engine ----
  const getEngine = useCallback(() => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine();
    }
    audioEngineRef.current.init();
    return audioEngineRef.current;
  }, []);

  // ---- Effective mute logic (solo-aware) ----
  const getEffectiveMute = useCallback((group: LaneGroup): boolean => {
    if (soloLanes.size > 0) {
      return !soloLanes.has(group.type);
    }
    return group.muted;
  }, [soloLanes]);

  // ---- Metering RAF loop ----
  const startMetering = useCallback(() => {
    const tick = () => {
      const engine = audioEngineRef.current;
      if (!engine) return;

      setLaneLevels({
        voice: engine.getLanePeakLevel('voice'),
        music: engine.getLanePeakLevel('music'),
        sfx: engine.getLanePeakLevel('sfx'),
        ambience: engine.getLanePeakLevel('ambience'),
      });
      setMasterLevel(engine.getMasterPeakLevel());
      setSpectrumData(engine.getMasterFrequencyData());

      meterRafRef.current = requestAnimationFrame(tick);
    };
    meterRafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopMetering = useCallback(() => {
    if (meterRafRef.current) {
      cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = 0;
    }
    // Reset levels to zero
    setLaneLevels({ voice: 0, music: 0, sfx: 0, ambience: 0 });
    setMasterLevel(0);
    setSpectrumData(new Uint8Array(0));
  }, []);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      audioEngineRef.current?.dispose();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (meterRafRef.current) cancelAnimationFrame(meterRafRef.current);
    };
  }, []);

  // ---- Wheel zoom (non-passive for preventDefault) ----
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const ctx = wheelCtxRef.current;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const scrollLeft = el.scrollLeft;
      const mouseTime = (mouseX + scrollLeft) / ctx.pixelsPerSecond;
      const zoomDelta = e.deltaY > 0 ? -0.15 : 0.15;
      const newZoom = Math.max(0.5, Math.min(3, ctx.transport.zoom + zoomDelta));
      if (newZoom === ctx.transport.zoom) return;
      const newPxPerSec = 5 * newZoom;
      pendingScrollRef.current = { scrollLeft: Math.max(0, mouseTime * newPxPerSec - mouseX) };
      ctx.onTransportChange({ ...ctx.transport, zoom: newZoom });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // ---- Adjust scroll position after zoom (zoom-to-cursor) ----
  useEffect(() => {
    if (pendingScrollRef.current && timelineRef.current) {
      timelineRef.current.scrollLeft = pendingScrollRef.current.scrollLeft;
      pendingScrollRef.current = null;
    }
  }, [zoom]);

  // ---- Apply master volume ----
  useEffect(() => {
    audioEngineRef.current?.setMasterVolume(masterVolume);
  }, [masterVolume]);

  // ---- Play from a specific time (shared logic) ----
  const playFromTime = useCallback((startTime: number) => {
    audioEngineRef.current?.stop();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const engine = getEngine();
    engine.setMasterVolume(masterVolume);
    const allClips = groups.flatMap((g) => g.clips);
    const enriched = allClips.map((c) => {
      const asset = assetMap?.get(c.assetId);
      return { ...c, audioUrl: c.audioUrl ?? asset?.audioUrl };
    });
    const laneMutes = new Map<AudioAssetType, boolean>();
    for (const g of groups) laneMutes.set(g.type, getEffectiveMute(g));

    engine.play(enriched, startTime, laneMutes);
    onTransportChange({ ...transport, isPlaying: true, playheadPos: startTime });
    startMetering();

    const updatePlayhead = () => {
      const currentTime = engine.getCurrentTime();
      if (loopEnabled && loopRegion && currentTime >= loopRegion.end) {
        engine.stop();
        const clips2 = groups.flatMap((g) => g.clips);
        const enriched2 = clips2.map((c) => {
          const asset = assetMap?.get(c.assetId);
          return { ...c, audioUrl: c.audioUrl ?? asset?.audioUrl };
        });
        const mutes2 = new Map<AudioAssetType, boolean>();
        for (const g of groups) mutes2.set(g.type, getEffectiveMute(g));
        engine.play(enriched2, loopRegion.start, mutes2);
        onTransportChange({ ...transport, isPlaying: true, playheadPos: loopRegion.start });
        rafRef.current = requestAnimationFrame(updatePlayhead);
        return;
      }
      if (currentTime >= totalDuration) {
        engine.stop();
        stopMetering();
        onTransportChange({ ...transport, isPlaying: false, playheadPos: 0 });
        return;
      }
      onTransportChange({ ...transport, isPlaying: true, playheadPos: currentTime });
      rafRef.current = requestAnimationFrame(updatePlayhead);
    };
    rafRef.current = requestAnimationFrame(updatePlayhead);
  }, [transport, groups, assetMap, totalDuration, getEngine, onTransportChange, masterVolume, getEffectiveMute, startMetering, stopMetering, loopEnabled, loopRegion]);

  // ---- Play / Stop logic ----
  const handlePlayStop = useCallback(() => {
    if (transport.isPlaying) {
      audioEngineRef.current?.stop();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopMetering();
      onTransportChange({ ...transport, isPlaying: false });
    } else {
      playFromTime(playheadPos);
    }
  }, [transport, playheadPos, onTransportChange, stopMetering, playFromTime]);

  // ---- Play from mouse cursor position (P key) ----
  const handlePlayFromHere = useCallback(() => {
    const time = mouseTimeRef.current;
    if (time >= 0 && time <= totalDuration) {
      playFromTime(time);
    }
  }, [totalDuration, playFromTime]);

  const handleRewind = useCallback(() => {
    audioEngineRef.current?.stop();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stopMetering();
    onTransportChange({ ...transport, isPlaying: false, playheadPos: 0 });
  }, [transport, onTransportChange, stopMetering]);

  // ---- Marker / loop keyboard handlers ----
  const handleAddMarker = useCallback(() => {
    addMarker(playheadPos);
  }, [addMarker, playheadPos]);

  const handleToggleLoop = useCallback(() => {
    setLoopEnabled((prev) => !prev);
  }, []);

  const handleJumpNextMarker = useCallback(() => {
    const time = jumpToNextMarker(playheadPos);
    if (time !== null) onTransportChange({ ...transport, playheadPos: time });
  }, [jumpToNextMarker, playheadPos, transport, onTransportChange]);

  const handleJumpPrevMarker = useCallback(() => {
    const time = jumpToPrevMarker(playheadPos);
    if (time !== null) onTransportChange({ ...transport, playheadPos: time });
  }, [jumpToPrevMarker, playheadPos, transport, onTransportChange]);

  // ---- Select All handler ----
  const selectAll = useCallback(() => {
    const allIds = new Set<string>();
    for (const g of groups) {
      for (const c of g.clips) allIds.add(c.id);
    }
    setSelection({ selectedClipIds: allIds, lastSelectedId: null });
  }, [groups, setSelection]);

  // ---- Context menu clip actions ----
  const duplicateClips = useCallback((clipIds: string[]) => {
    commitBefore();
    setGroups((prev) => prev.map((g) => {
      const dupes: TimelineClip[] = [];
      for (const c of g.clips) {
        if (clipIds.includes(c.id)) {
          dupes.push({
            ...structuredClone(c),
            id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            startTime: Math.round((c.startTime + 0.5) * 10) / 10,
            locked: false,
          });
        }
      }
      return dupes.length > 0 ? { ...g, clips: [...g.clips, ...dupes] } : g;
    }));
    commit();
  }, [setGroups, commitBefore, commit]);

  const moveClipsToLane = useCallback((clipIds: string[], targetLane: AudioAssetType) => {
    commitBefore();
    setGroups((prev) => {
      const moving: TimelineClip[] = [];
      const after = prev.map((g) => {
        const keep: TimelineClip[] = [];
        for (const c of g.clips) {
          if (clipIds.includes(c.id)) {
            moving.push({ ...c, lane: targetLane });
          } else {
            keep.push(c);
          }
        }
        return { ...g, clips: keep };
      });
      return after.map((g) =>
        g.type === targetLane ? { ...g, clips: [...g.clips, ...moving] } : g,
      );
    });
    commit();
  }, [setGroups, commitBefore, commit]);

  const toggleClipLock = useCallback((clipIds: string[]) => {
    commitBefore();
    setGroups((prev) => prev.map((g) => ({
      ...g,
      clips: g.clips.map((c) => clipIds.includes(c.id) ? { ...c, locked: !c.locked } : c),
    })));
    commit();
  }, [setGroups, commitBefore, commit]);

  const toggleClipMute = useCallback((clipIds: string[]) => {
    commitBefore();
    setGroups((prev) => prev.map((g) => ({
      ...g,
      clips: g.clips.map((c) => clipIds.includes(c.id) ? { ...c, muted: !c.muted } : c),
    })));
    commit();
  }, [setGroups, commitBefore, commit]);

  const deleteClips = useCallback((clipIds: string[]) => {
    commitBefore();
    setGroups((prev) => prev.map((g) => ({
      ...g,
      clips: g.clips.filter((c) => !clipIds.includes(c.id)),
    })));
    commit();
    clearSelection();
  }, [setGroups, commitBefore, commit, clearSelection]);

  const renameClip = useCallback((clipId: string, newName: string) => {
    if (!newName.trim()) return;
    commitBefore();
    setGroups((prev) => prev.map((g) => ({
      ...g,
      clips: g.clips.map((c) => c.id === clipId ? { ...c, name: newName.trim() } : c),
    })));
    commit();
  }, [setGroups, commitBefore, commit]);

  // Lane context menu actions
  const selectAllInLane = useCallback((laneType: AudioAssetType) => {
    const ids = new Set<string>();
    for (const g of groups) {
      if (g.type === laneType) {
        for (const c of g.clips) ids.add(c.id);
      }
    }
    setSelection({ selectedClipIds: ids, lastSelectedId: null });
  }, [groups, setSelection]);

  const addEmptyClip = useCallback((laneType: AudioAssetType) => {
    commitBefore();
    const clip: TimelineClip = {
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      assetId: '',
      lane: laneType,
      startTime: Math.round(playheadPos * 10) / 10,
      duration: 5,
      name: `Empty ${TRACK_TYPE_STYLES[laneType].label}`,
    };
    setGroups((prev) => prev.map((g) =>
      g.type === laneType ? { ...g, clips: [...g.clips, clip] } : g,
    ));
    commit();
  }, [playheadPos, setGroups, commitBefore, commit]);

  const clearLane = useCallback((laneType: AudioAssetType) => {
    commitBefore();
    setGroups((prev) => prev.map((g) =>
      g.type === laneType ? { ...g, clips: [] } : g,
    ));
    commit();
  }, [setGroups, commitBefore, commit]);

  // ---- Helper: get clip IDs for context menu (selection-aware) ----
  const getContextClipIds = useCallback((clickedId: string): string[] => {
    if (selection.selectedClipIds.has(clickedId)) {
      return Array.from(selection.selectedClipIds);
    }
    return [clickedId];
  }, [selection]);

  // ---- Helper: find clip by ID ----
  const findClip = useCallback((clipId: string): TimelineClip | undefined => {
    for (const g of groups) {
      const c = g.clips.find((cl) => cl.id === clipId);
      if (c) return c;
    }
    return undefined;
  }, [groups]);

  // ---- Keyboard shortcuts (all wired) ----
  useKeyboardShortcuts({
    onPlayPause: handlePlayStop,
    onRewind: handleRewind,
    onDeleteSelected: deleteSelected,
    onUndo: undo,
    onRedo: redo,
    onCopy: copy,
    onPaste: paste,
    onSplit: split,
    onAddMarker: handleAddMarker,
    onToggleLoop: handleToggleLoop,
    onJumpNextMarker: handleJumpNextMarker,
    onJumpPrevMarker: handleJumpPrevMarker,
    onSelectAll: selectAll,
    onPlayFromHere: handlePlayFromHere,
  });

  // ---- Lane controls ----
  const toggleCollapse = (type: AudioAssetType) => {
    setGroups((prev) => prev.map((g) => g.type === type ? { ...g, collapsed: !g.collapsed } : g));
  };

  const toggleMute = useCallback((type: AudioAssetType) => {
    setGroups((prev) => prev.map((g) => g.type === type ? { ...g, muted: !g.muted } : g));
    const group = groups.find((g) => g.type === type);
    if (group) {
      // If solo is active, effective mute depends on solo, not the mute flag
      if (soloLanes.size > 0) {
        audioEngineRef.current?.setLaneMute(type, !soloLanes.has(type));
      } else {
        audioEngineRef.current?.setLaneMute(type, !group.muted);
      }
    }
  }, [groups, soloLanes, setGroups]);

  const toggleSolo = useCallback((type: AudioAssetType) => {
    setSoloLanes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }

      // Update engine mutes based on new solo state
      for (const lane of LANE_ORDER) {
        const group = groups.find((g) => g.type === lane);
        if (!group) continue;
        if (next.size > 0) {
          audioEngineRef.current?.setLaneMute(lane, !next.has(lane));
        } else {
          audioEngineRef.current?.setLaneMute(lane, group.muted);
        }
      }

      return next;
    });
  }, [groups]);

  // ---- Timeline click (seek) ----
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-clip]')) return;
    // Skip seek if we just finished panning
    if (isPanningRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (e.currentTarget.scrollLeft || 0);
    const time = Math.max(0, Math.min(totalDuration, x / pixelsPerSecond));
    onTransportChange({ ...transport, playheadPos: time });
    clearSelection();
    setEditingClip(null);
  };

  // ---- Clip click with popup support ----
  const handleClipClickWithPopup = useCallback((clipId: string, shiftKey: boolean, e: React.MouseEvent) => {
    // If this clip is already selected and we click it (non-shift), open popup
    if (!shiftKey && selection.selectedClipIds.has(clipId)) {
      const clipEl = (e.target as HTMLElement).closest('[data-clip]') as HTMLElement | null;
      if (clipEl) {
        const rect = clipEl.getBoundingClientRect();
        const clip = groups.flatMap((g) => g.clips).find((c) => c.id === clipId);
        if (clip) {
          // Commit before opening popup for undo support
          commitBefore();
          editingCommittedRef.current = false;
          setEditingClip({ clip, rect });
          return;
        }
      }
    }
    handleClipClick(clipId, shiftKey);
    setEditingClip(null);
  }, [selection.selectedClipIds, groups, handleClipClick, commitBefore]);

  // ---- Close popup on Escape or outside click ----
  useEffect(() => {
    if (!editingClip) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!editingCommittedRef.current) {
          commit();
          editingCommittedRef.current = true;
        }
        setEditingClip(null);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        if (!editingCommittedRef.current) {
          commit();
          editingCommittedRef.current = true;
        }
        setEditingClip(null);
      }
    };

    window.addEventListener('keydown', handleEsc);
    // Use a slight delay so the opening click doesn't immediately close the popup
    const timer = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timer);
    };
  }, [editingClip, commit]);

  // ---- Popup clip property updaters ----
  const updateEditingClipGain = useCallback((value: number) => {
    if (!editingClip) return;
    const gain = Math.max(0, Math.min(1, value / 100));
    setGroups((prev) => prev.map((g) => ({
      ...g,
      clips: g.clips.map((c) => c.id === editingClip.clip.id ? { ...c, gain } : c),
    })));
    setEditingClip((prev) => prev ? { ...prev, clip: { ...prev.clip, gain } } : null);
  }, [editingClip, setGroups]);

  const updateEditingClipFadeIn = useCallback((value: number) => {
    if (!editingClip) return;
    const fadeIn = Math.max(0, Math.min(editingClip.clip.duration / 2, value));
    setGroups((prev) => prev.map((g) => ({
      ...g,
      clips: g.clips.map((c) => c.id === editingClip.clip.id ? { ...c, fadeIn } : c),
    })));
    setEditingClip((prev) => prev ? { ...prev, clip: { ...prev.clip, fadeIn } } : null);
  }, [editingClip, setGroups]);

  const updateEditingClipFadeOut = useCallback((value: number) => {
    if (!editingClip) return;
    const fadeOut = Math.max(0, Math.min(editingClip.clip.duration / 2, value));
    setGroups((prev) => prev.map((g) => ({
      ...g,
      clips: g.clips.map((c) => c.id === editingClip.clip.id ? { ...c, fadeOut } : c),
    })));
    setEditingClip((prev) => prev ? { ...prev, clip: { ...prev.clip, fadeOut } } : null);
  }, [editingClip, setGroups]);

  // ---- Drag-and-Drop handlers ----
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes('application/json')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (e.currentTarget.scrollLeft || 0);
    const y = e.clientY - rect.top + (e.currentTarget.scrollTop || 0);
    const time = Math.max(0, x / pixelsPerSecond);
    const lane = getLaneFromY(y, groups, 28, 28);

    setDropIndicator({ time: snapToGrid(time, snap), lane });
  }, [groups, pixelsPerSecond, snap]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX <= rect.left || clientX >= rect.right ||
      clientY <= rect.top || clientY >= rect.bottom
    ) {
      setDropIndicator(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropIndicator(null);

    const jsonData = e.dataTransfer.getData('application/json');
    if (!jsonData) return;

    try {
      const asset: AudioAsset = JSON.parse(jsonData);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + (e.currentTarget.scrollLeft || 0);
      const y = e.clientY - rect.top + (e.currentTarget.scrollTop || 0);
      const dropTime = snapToGrid(Math.max(0, x / pixelsPerSecond), snap);
      const lane = getLaneFromY(y, groups, 28, 28);

      const targetLane = LANE_ORDER.includes(asset.type) ? asset.type : lane;

      const newClip: TimelineClip = {
        id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        assetId: asset.id,
        lane: targetLane,
        startTime: Math.round(dropTime * 10) / 10,
        duration: asset.duration,
        name: asset.name,
        audioUrl: asset.audioUrl,
        waveformData: asset.waveformData,
      };

      commitBefore();

      setGroups((prev) => prev.map((g) =>
        g.type === targetLane
          ? { ...g, clips: [...g.clips, newClip] }
          : g
      ));

      commit();

      const clipEnd = newClip.startTime + newClip.duration;
      if (clipEnd > totalDuration) {
        onTransportChange({ ...transport, totalDuration: Math.ceil(clipEnd / 10) * 10 + 10 });
      }
    } catch {
      // Invalid JSON
    }
  }, [groups, pixelsPerSecond, snap, totalDuration, transport, onTransportChange, commitBefore, commit, setGroups]);

  // ---- Compute popup position ----
  const popupPosition = useMemo(() => {
    if (!editingClip || !timelineAreaRef.current) return { top: 0, left: 0 };
    const areaRect = timelineAreaRef.current.getBoundingClientRect();
    return {
      top: editingClip.rect.top - areaRect.top - 120,
      left: editingClip.rect.left - areaRect.left + (editingClip.rect.width / 2) - 100,
    };
  }, [editingClip]);

  // ============ RENDER ============

  return (
    <div className="flex flex-col h-full" ref={timelineAreaRef}>
      {/* Timeline Content */}
      <div
        className="flex-1 flex min-h-0 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, rgba(2, 6, 23, 0.5) 0%, rgba(2, 6, 23, 0.7) 100%)' }}
      >
        {/* Lane Headers */}
        <div
          className="w-36 shrink-0 border-r border-slate-800/40 flex flex-col"
          style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(2, 6, 23, 0.8) 100%)' }}
        >
          <div className="h-7 border-b border-slate-800/30 shrink-0" />

          <div className="flex-1 overflow-y-auto">
            {groups.map((group) => {
              const style = TRACK_TYPE_STYLES[group.type];
              const Icon = LANE_ICONS[group.type];
              const effectiveMuted = getEffectiveMute(group);
              const isSoloed = soloLanes.has(group.type);

              return (
                <div key={group.type}>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 h-7 px-2 border-b border-slate-800/20 cursor-pointer group/lane',
                      'transition-all border-l-2',
                      style.borderClass,
                      isSoloed
                        ? 'bg-orange-500/5'
                        : effectiveMuted
                          ? 'bg-slate-900/20 opacity-60'
                          : 'hover:bg-slate-800/30'
                    )}
                    onClick={() => toggleCollapse(group.type)}
                    onContextMenu={(e) => handleContextMenu(e, {
                      type: 'lane',
                      laneType: group.type,
                      clipCount: group.clips.length,
                      muted: group.muted,
                      soloed: soloLanes.has(group.type),
                      collapsed: group.collapsed,
                    })}
                  >
                    {group.collapsed ? (
                      <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-slate-600 shrink-0" />
                    )}
                    <Icon className={cn('w-3 h-3 shrink-0', style.textClass)} style={{ opacity: 0.7 }} />
                    <span className={cn('text-[11px] font-medium flex-1 truncate', effectiveMuted ? 'text-slate-500' : 'text-slate-200')}>
                      {style.label}
                    </span>

                    {/* Lane VU Meter */}
                    <VUMeter
                      level={laneLevels[group.type]}
                      width={4}
                      height={18}
                      orientation="vertical"
                    />

                    <span className="text-[11px] text-slate-500">{group.clips.length}</span>

                    {/* Solo button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSolo(group.type); }}
                      className={cn(
                        'px-1 py-0.5 rounded text-[11px] font-bold transition-colors leading-none',
                        isSoloed
                          ? 'text-orange-400 bg-orange-500/10'
                          : 'text-slate-600 hover:text-slate-400'
                      )}
                      title={`Solo ${style.label}`}
                    >
                      S
                    </button>

                    {/* Mute button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleMute(group.type); }}
                      className={cn(
                        'p-0.5 rounded transition-colors',
                        effectiveMuted ? 'text-red-400' : 'text-slate-600 hover:text-slate-400'
                      )}
                    >
                      {effectiveMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>

                    {/* Add clip — revealed on hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); addEmptyClip(group.type); }}
                      className="opacity-0 group-hover/lane:opacity-100 p-0.5 rounded hover:bg-slate-700/40 text-slate-500 hover:text-slate-300 transition-all"
                      title="Add empty clip at playhead"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {!group.collapsed && (group.clips.length > 0 ? group.clips : [null]).map((clip, i) => (
                    <div key={clip?.id ?? `empty-${i}`} className="h-7 border-b border-slate-800/20 pl-7 pr-2 flex items-center">
                      <span className="text-[11px] text-slate-400 truncate">{clip?.name ?? ''}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Area */}
        <div
          ref={timelineRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative cursor-grab"
          onClick={handleTimelineClick}
          onContextMenu={(e) => {
            if (!(e.target as HTMLElement).closest('[data-clip]')) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left + (e.currentTarget.scrollLeft || 0);
              const time = Math.max(0, x / pixelsPerSecond);
              handleContextMenu(e, { type: 'canvas', time });
            }
          }}
          onMouseMove={(e) => {
            // Track mouse time for "Play from here" (P key)
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left + (e.currentTarget.scrollLeft || 0);
            mouseTimeRef.current = Math.max(0, Math.min(totalDuration, x / pixelsPerSecond));
          }}
          onMouseDown={(e) => {
            if (e.button !== 0 || (e.target as HTMLElement).closest('[data-clip]')) return;
            const container = timelineRef.current;
            if (!container) return;

            // Shift + drag → rubberband selection
            if (e.shiftKey) {
              const rect = e.currentTarget.getBoundingClientRect();
              const startX = e.clientX - rect.left + (e.currentTarget.scrollLeft || 0);
              const startY = e.clientY - rect.top + (e.currentTarget.scrollTop || 0);
              const minDrag = 8;
              let started = false;

              const handleMove = (me: MouseEvent) => {
                const curX = me.clientX - rect.left + (container.scrollLeft || 0);
                const curY = me.clientY - rect.top + (container.scrollTop || 0);
                if (!started && Math.abs(curX - startX) + Math.abs(curY - startY) < minDrag) return;
                started = true;
                setRubberband({ startX, startY, endX: curX, endY: curY });
              };

              const handleUp = () => {
                if (started && rubberband) {
                  const minTime = Math.min(rubberband.startX, rubberband.endX) / pixelsPerSecond;
                  const maxTime = Math.max(rubberband.startX, rubberband.endX) / pixelsPerSecond;
                  const ids = new Set<string>();
                  for (const g of groups) {
                    for (const c of g.clips) {
                      const clipEnd = c.startTime + c.duration;
                      if (c.startTime < maxTime && clipEnd > minTime) ids.add(c.id);
                    }
                  }
                  if (ids.size > 0) setSelection({ selectedClipIds: ids, lastSelectedId: null });
                }
                setRubberband(null);
                window.removeEventListener('mousemove', handleMove);
                window.removeEventListener('mouseup', handleUp);
              };

              window.addEventListener('mousemove', handleMove);
              window.addEventListener('mouseup', handleUp);
              return;
            }

            // Default: pan drag (grab-to-scroll)
            const startX = e.clientX;
            const startY = e.clientY;
            const startScrollLeft = container.scrollLeft;
            const startScrollTop = container.scrollTop;
            const minDrag = 4;
            let didPan = false;

            document.body.style.cursor = 'grabbing';

            const handleMove = (me: MouseEvent) => {
              const dx = me.clientX - startX;
              const dy = me.clientY - startY;
              if (!didPan && Math.abs(dx) + Math.abs(dy) < minDrag) return;
              didPan = true;
              container.scrollLeft = startScrollLeft - dx;
              container.scrollTop = startScrollTop - dy;
            };

            const handleUp = () => {
              document.body.style.cursor = '';
              if (didPan) {
                isPanningRef.current = true;
                setTimeout(() => { isPanningRef.current = false; }, 0);
              }
              window.removeEventListener('mousemove', handleMove);
              window.removeEventListener('mouseup', handleUp);
            };

            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleUp);
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="relative" style={{ width: timelineWidth, minWidth: '100%' }}>
            {/* Time Ruler (extracted component) */}
            <TimelineRuler
              pixelsPerSecond={pixelsPerSecond}
              totalDuration={totalDuration}
              playheadPos={playheadPos}
              markers={markers}
              loopRegion={loopRegion}
              loopEnabled={loopEnabled}
              onSeek={(time) => onTransportChange({ ...transport, playheadPos: time })}
              onMarkerAdd={(time) => addMarker(time)}
              onLoopChange={setLoopRegion}
            />

            {/* Lane Groups */}
            {groups.map((group) => {
              const effectiveMuted = getEffectiveMute(group);

              return (
                <div key={group.type}>
                  {/* Group Header Row */}
                  <div className={cn(
                    'h-7 border-b border-slate-800/30 relative bg-slate-900/20 transition-all',
                    dropIndicator?.lane === group.type && 'bg-orange-500/10 ring-1 ring-inset ring-orange-400/30'
                  )}>
                    {ticks.map((t) => (
                      <div
                        key={t}
                        className="absolute top-0 bottom-0 w-px bg-slate-800/20"
                        style={{ left: t * pixelsPerSecond }}
                      />
                    ))}
                    {snapGridLines.map((t) => (
                      <div
                        key={`sg-${t}`}
                        className="absolute top-0 bottom-0 w-px bg-slate-800/10"
                        style={{ left: t * pixelsPerSecond }}
                      />
                    ))}
                  </div>

                  {/* Clip Rows */}
                  {!group.collapsed && (group.clips.length > 0 ? group.clips : [null]).map((clip, i) => (
                    <div key={clip?.id ?? `empty-${i}`} className="h-7 border-b border-slate-800/20 relative">
                      {ticks.map((t) => (
                        <div
                          key={t}
                          className="absolute top-0 bottom-0 w-px bg-slate-800/15"
                          style={{ left: t * pixelsPerSecond }}
                        />
                      ))}

                      {clip && (
                        <div
                          data-clip
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClipClickWithPopup(clip.id, e.shiftKey, e);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (!clip.locked) setRenamingClipId(clip.id);
                          }}
                          onContextMenu={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, {
                              type: 'clip',
                              clipId: clip.id,
                              laneType: group.type,
                              clipName: clip.name,
                              duration: clip.duration,
                              locked: clip.locked,
                              muted: clip.muted,
                            });
                          }}
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            const localX = e.clientX - rect.left;
                            if (localX <= 4) {
                              startDrag(clip.id, e, 'resize-left');
                            } else if (localX >= rect.width - 4) {
                              startDrag(clip.id, e, 'resize-right');
                            } else {
                              startDrag(clip.id, e, 'move');
                            }
                          }}
                          className={cn(
                            'absolute top-0.5 bottom-0.5 rounded border flex items-center group/clip',
                            'transition-all select-none overflow-hidden',
                            clip.locked ? 'cursor-not-allowed' : 'cursor-grab',
                            CLIP_BG[group.type],
                            CLIP_HOVER_GLOW[group.type],
                            (effectiveMuted || clip.muted) && 'opacity-40',
                            selection.selectedClipIds.has(clip.id) && CLIP_SELECTED[group.type],
                          )}
                          style={{
                            left: clip.startTime * pixelsPerSecond,
                            width: Math.max(24, clip.duration * pixelsPerSecond),
                          }}
                          title={`${clip.name} — ${formatTime(clip.duration)} (${group.type})${clip.locked ? ' [locked]' : ''}`}
                        >
                          {/* Resize handle left — visible on hover */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 opacity-0 group-hover/clip:opacity-100 transition-opacity bg-white/30 rounded-l" />

                          {/* Mini waveform */}
                          {clip.waveformData && (
                            <ClipWaveform data={clip.waveformData} type={group.type} />
                          )}

                          {/* Fade-in indicator */}
                          {(clip.fadeIn ?? 0) > 0 && (
                            <div
                              className="absolute top-0 bottom-0 left-0 pointer-events-none z-[5]"
                              style={{
                                width: Math.max(4, (clip.fadeIn ?? 0) * pixelsPerSecond),
                                background: 'linear-gradient(to right, rgba(0,0,0,0.5), transparent)',
                              }}
                            />
                          )}

                          {/* Fade-out indicator */}
                          {(clip.fadeOut ?? 0) > 0 && (
                            <div
                              className="absolute top-0 bottom-0 right-0 pointer-events-none z-[5]"
                              style={{
                                width: Math.max(4, (clip.fadeOut ?? 0) * pixelsPerSecond),
                                background: 'linear-gradient(to left, rgba(0,0,0,0.5), transparent)',
                              }}
                            />
                          )}

                          {/* Gain indicator line */}
                          <div
                            className="absolute left-0 right-0 h-px bg-white/40 pointer-events-none z-[5]"
                            style={{
                              top: `${(1 - (clip.gain ?? 1)) * 100}%`,
                            }}
                          />

                          {/* Automation overlay (ducking) */}
                          {clip.automation && clip.automation.length > 0 && (
                            <AutomationOverlay
                              automation={clip.automation}
                              clipDuration={clip.duration}
                              clipWidth={Math.max(24, clip.duration * pixelsPerSecond)}
                              clipHeight={26}
                            />
                          )}

                          {/* Lock icon */}
                          {clip.locked && (
                            <Lock className="w-2.5 h-2.5 text-amber-400/60 absolute top-0.5 right-1 z-10" />
                          )}

                          {/* Clip label or rename input */}
                          {renamingClipId === clip.id ? (
                            <input
                              type="text"
                              defaultValue={clip.name}
                              autoFocus
                              onBlur={(e) => {
                                renameClip(clip.id, e.target.value);
                                setRenamingClipId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                if (e.key === 'Escape') setRenamingClipId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="absolute inset-0 px-2 bg-slate-800/90 border border-orange-500/60 text-[11px] text-slate-200 z-20 outline-none"
                            />
                          ) : (
                            <span className={cn('text-[11px] font-medium truncate px-2 relative z-10', CLIP_TEXT[group.type])}>
                              {clip.name}
                            </span>
                          )}

                          {/* Resize handle right — visible on hover */}
                          <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-10 opacity-0 group-hover/clip:opacity-100 transition-opacity bg-white/30 rounded-r" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}

            {/* Drop Indicator */}
            {dropIndicator && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-orange-400 pointer-events-none z-20"
                style={{ left: dropIndicator.time * pixelsPerSecond }}
              >
                <div className="w-2 h-2 bg-orange-400 rounded-full -ml-[3px] -mt-0.5" />
              </div>
            )}

            {/* Playhead -- GPU-accelerated */}
            <div
              className="absolute top-0 bottom-0 w-px bg-orange-500 pointer-events-none z-20"
              style={{
                transform: `translateX(${playheadPos * pixelsPerSecond}px)`,
                willChange: 'transform',
              }}
            >
              <div className="w-3 h-3 bg-orange-500 rounded-sm -ml-[5px] -mt-0.5 rotate-45" />
            </div>
          </div>

          {/* Rubberband selection rectangle */}
          {rubberband && (
            <div
              className="absolute border border-dashed border-orange-400/60 bg-orange-400/10 pointer-events-none z-20 rounded-sm"
              style={{
                left: Math.min(rubberband.startX, rubberband.endX),
                top: Math.min(rubberband.startY, rubberband.endY),
                width: Math.abs(rubberband.endX - rubberband.startX),
                height: Math.abs(rubberband.endY - rubberband.startY),
              }}
            />
          )}

          {/* Clip Popup Editor (positioned within timeline area) */}
          {editingClip && (
            <div
              ref={popupRef}
              className="absolute z-30 rounded-xl border border-orange-500/15 p-3 w-[210px] backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(249, 115, 22, 0.08)',
                top: Math.max(4, popupPosition.top),
                left: Math.max(4, popupPosition.left),
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-300 truncate">
                  {editingClip.clip.name}
                </span>
                <button
                  onClick={() => {
                    if (!editingCommittedRef.current) {
                      commit();
                      editingCommittedRef.current = true;
                    }
                    setEditingClip(null);
                  }}
                  className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Gain slider */}
              <div className="flex items-center gap-2 mb-2">
                <label className="text-[11px] text-slate-400 w-12 shrink-0">Gain</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round((editingClip.clip.gain ?? 1) * 100)}
                  onChange={(e) => updateEditingClipGain(Number(e.target.value))}
                  className="flex-1 h-1 accent-orange-500"
                />
                <span className="text-[11px] text-slate-400 w-8 text-right font-mono">
                  {Math.round((editingClip.clip.gain ?? 1) * 100)}%
                </span>
              </div>

              {/* Fade In */}
              <div className="flex items-center gap-2 mb-2">
                <label className="text-[11px] text-slate-400 w-12 shrink-0">Fade In</label>
                <input
                  type="number"
                  min={0}
                  max={editingClip.clip.duration / 2}
                  step={0.1}
                  value={editingClip.clip.fadeIn ?? 0}
                  onChange={(e) => updateEditingClipFadeIn(Number(e.target.value))}
                  className="flex-1 h-5 bg-slate-800 border border-slate-700 rounded px-1.5 text-[11px] text-slate-300 font-mono"
                />
                <span className="text-[11px] text-slate-500 w-4">s</span>
              </div>

              {/* Fade Out */}
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-400 w-12 shrink-0">Fade Out</label>
                <input
                  type="number"
                  min={0}
                  max={editingClip.clip.duration / 2}
                  step={0.1}
                  value={editingClip.clip.fadeOut ?? 0}
                  onChange={(e) => updateEditingClipFadeOut(Number(e.target.value))}
                  className="flex-1 h-5 bg-slate-800 border border-slate-700 rounded px-1.5 text-[11px] text-slate-300 font-mono"
                />
                <span className="text-[11px] text-slate-500 w-4">s</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ Context Menu ============ */}
      <SoundContextMenu position={ctxPosition} onClose={hideContextMenu}>
        {/* ---------- Clip context menu ---------- */}
        {ctxTarget?.type === 'clip' && (() => {
          const ids = getContextClipIds(ctxTarget.clipId);
          const multi = ids.length > 1;
          const clip = findClip(ctxTarget.clipId);
          const playheadInClip = clip
            ? playheadPos > clip.startTime + 0.1 && playheadPos < clip.startTime + clip.duration - 0.1
            : false;
          return (
            <>
              <MenuHeader>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-32">{ctxTarget.clipName}</span>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded', TRACK_TYPE_STYLES[ctxTarget.laneType].bgClass, TRACK_TYPE_STYLES[ctxTarget.laneType].textClass)}>
                    {TRACK_TYPE_STYLES[ctxTarget.laneType].label}
                  </span>
                  {ctxTarget.locked && <Lock className="w-3 h-3 text-amber-400" />}
                </div>
                {multi && (
                  <span className="text-[10px] text-orange-400 mt-1 block">{ids.length} clips selected</span>
                )}
              </MenuHeader>
              <div className="py-1">
                <ActionItem icon={<Edit3 className="w-full h-full" />} label="Edit Properties" action={() => {
                  if (clip) {
                    const el = timelineRef.current?.querySelector(`[data-clip]`) as HTMLElement | null;
                    if (el) {
                      commitBefore();
                      editingCommittedRef.current = false;
                      setEditingClip({ clip, rect: el.getBoundingClientRect() });
                    }
                  }
                }} />
                <ActionItem icon={<Copy className="w-full h-full" />} label="Copy" shortcut="Ctrl+C" action={() => {
                  // Select the context target clips first, then copy
                  if (!selection.selectedClipIds.has(ctxTarget.clipId)) {
                    handleClipClick(ctxTarget.clipId, false);
                  }
                  copy();
                }} />
                <ActionItem icon={<Files className="w-full h-full" />} label="Duplicate" action={() => duplicateClips(ids)} disabled={ctxTarget.locked} />
                <ActionItem icon={<Scissors className="w-full h-full" />} label="Split at Playhead" shortcut="S" action={() => {
                  if (!selection.selectedClipIds.has(ctxTarget.clipId)) {
                    handleClipClick(ctxTarget.clipId, false);
                  }
                  split();
                }} disabled={!playheadInClip || !!ctxTarget.locked} />
                <MenuSubmenu icon={<ArrowRight className="w-full h-full" />} label="Move to Lane" disabled={ctxTarget.locked}>
                  {(['voice', 'music', 'sfx', 'ambience'] as AudioAssetType[])
                    .filter((l) => l !== ctxTarget.laneType)
                    .map((lane) => (
                      <ActionItem
                        key={lane}
                        icon={<span className={cn('w-2 h-2 rounded-full inline-block', TRACK_TYPE_STYLES[lane].bgClass)} />}
                        label={TRACK_TYPE_STYLES[lane].label}
                        action={() => moveClipsToLane(ids, lane)}
                      />
                    ))}
                </MenuSubmenu>
                <ActionItem
                  icon={ctxTarget.locked ? <Unlock className="w-full h-full" /> : <Lock className="w-full h-full" />}
                  label={ctxTarget.locked ? 'Unlock' : 'Lock'}
                  action={() => toggleClipLock(ids)}
                />
              </div>
              <MenuDivider />
              <div className="py-1">
                <ActionItem
                  icon={ctxTarget.muted ? <Volume2 className="w-full h-full" /> : <VolumeX className="w-full h-full" />}
                  label={ctxTarget.muted ? 'Unmute' : 'Mute'}
                  action={() => toggleClipMute(ids)}
                />
                <ActionItem icon={<Download className="w-full h-full" />} label="Export Clip Audio" action={() => {/* TODO: wavEncoder export */}} disabled={!clip?.audioUrl} />
              </div>
              <MenuDivider />
              <div className="py-1">
                <ActionItem icon={<Trash2 className="w-full h-full" />} label="Delete" shortcut="Del" action={() => deleteClips(ids)} danger />
              </div>
            </>
          );
        })()}

        {/* ---------- Lane context menu ---------- */}
        {ctxTarget?.type === 'lane' && (
          <>
            <MenuHeader>
              <div className="flex items-center gap-2">
                {(() => { const Icon = LANE_ICONS[ctxTarget.laneType]; return <Icon className="w-4 h-4 text-slate-400" />; })()}
                <span className="text-xs font-medium text-slate-200">
                  {TRACK_TYPE_STYLES[ctxTarget.laneType].label}
                </span>
                <span className="text-[9px] text-slate-500">{ctxTarget.clipCount} clips</span>
              </div>
            </MenuHeader>
            <div className="py-1">
              <ActionItem icon={<MousePointer className="w-full h-full" />} label="Select All Clips" action={() => selectAllInLane(ctxTarget.laneType)} />
              <ActionItem
                icon={<VolumeX className="w-full h-full" />}
                label={ctxTarget.muted ? 'Unmute Lane' : 'Mute Lane'}
                action={() => toggleMute(ctxTarget.laneType)}
              />
              <ActionItem
                icon={<Headphones className="w-full h-full" />}
                label={ctxTarget.soloed ? 'Unsolo' : 'Solo'}
                action={() => toggleSolo(ctxTarget.laneType)}
              />
              <ActionItem
                icon={ctxTarget.collapsed ? <ChevronDown className="w-full h-full" /> : <ChevronRight className="w-full h-full" />}
                label={ctxTarget.collapsed ? 'Expand' : 'Collapse'}
                action={() => toggleCollapse(ctxTarget.laneType)}
              />
            </div>
            <MenuDivider />
            <div className="py-1">
              <ActionItem icon={<Plus className="w-full h-full" />} label="Add Empty Clip" action={() => addEmptyClip(ctxTarget.laneType)} />
            </div>
            <MenuDivider />
            <div className="py-1">
              <ActionItem icon={<Trash2 className="w-full h-full" />} label="Clear Lane" action={() => clearLane(ctxTarget.laneType)} danger disabled={ctxTarget.clipCount === 0} />
            </div>
          </>
        )}

        {/* ---------- Canvas context menu ---------- */}
        {ctxTarget?.type === 'canvas' && (
          <>
            <div className="py-1">
              <ActionItem icon={<Clipboard className="w-full h-full" />} label="Paste" shortcut="Ctrl+V" action={paste} disabled={!hasClipboard} />
              <ActionItem icon={<Bookmark className="w-full h-full" />} label="Add Marker" shortcut="M" action={() => addMarker(ctxTarget.time)} />
              <ActionItem icon={<Play className="w-full h-full" />} label="Set Loop Start" action={() => setLoopRegion((prev) => ({ start: ctxTarget.time, end: prev?.end ?? ctxTarget.time + 10 }))} />
              <ActionItem icon={<Square className="w-full h-full" />} label="Set Loop End" action={() => setLoopRegion((prev) => ({ start: prev?.start ?? 0, end: ctxTarget.time }))} />
              <ActionItem icon={<MousePointer className="w-full h-full" />} label="Select All" shortcut="Ctrl+A" action={selectAll} />
            </div>
            <MenuDivider />
            <div className="py-1">
              <ActionItem icon={<ZoomIn className="w-full h-full" />} label="Zoom In" action={() => onTransportChange({ ...transport, zoom: Math.min(3, zoom + 0.25) })} />
              <ActionItem icon={<ZoomOut className="w-full h-full" />} label="Zoom Out" action={() => onTransportChange({ ...transport, zoom: Math.max(0.5, zoom - 0.25) })} />
              <ActionItem icon={<Magnet className="w-full h-full" />} label={snap.enabled ? 'Disable Snap' : 'Enable Snap'} action={() => setSnap((s) => ({ ...s, enabled: !s.enabled }))} />
            </div>
          </>
        )}
      </SoundContextMenu>

      {/* Transport Bar */}
      <div
        className="shrink-0 h-10 flex items-center gap-3 px-4 border-t border-orange-500/10"
        style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)' }}
      >
        {/* Time Display */}
        <span
          className="text-sm font-mono text-orange-400 w-14 tracking-tight font-semibold"
          style={{ textShadow: '0 0 12px rgba(249, 115, 22, 0.4)' }}
        >
          {formatTime(playheadPos)}
        </span>

        {/* Transport Controls */}
        <button
          onClick={handleRewind}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
          title="Rewind (Home)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handlePlayStop}
          className={cn(
            'p-1.5 rounded-lg transition-all',
            transport.isPlaying
              ? 'text-orange-400 bg-orange-500/15 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          )}
          title="Play / Stop (Space)"
        >
          {transport.isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <div className="w-px h-4 bg-slate-700/50" />

        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            'p-1 rounded transition-colors',
            canUndo ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 cursor-not-allowed'
          )}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            'p-1 rounded transition-colors',
            canRedo ? 'text-slate-400 hover:text-slate-200' : 'text-slate-700 cursor-not-allowed'
          )}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-700/50" />

        {/* Split */}
        <button
          onClick={split}
          className={cn(
            'p-1 rounded transition-colors',
            selection.selectedClipIds.size > 0
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-700 cursor-not-allowed'
          )}
          disabled={selection.selectedClipIds.size === 0}
          title="Split at playhead (S)"
        >
          <Scissors className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-4 bg-slate-700/50" />

        {/* Snap Toggle + Preset */}
        <button
          onClick={() => setSnap((s) => ({ ...s, enabled: !s.enabled }))}
          className={cn(
            'p-1 rounded transition-colors',
            snap.enabled ? 'text-orange-400 bg-orange-500/10' : 'text-slate-500 hover:text-slate-300'
          )}
          title={`Snap to grid: ${snap.enabled ? 'on' : 'off'} (${snap.gridSize}s)`}
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>
        {snap.enabled && (
          <select
            value={snap.gridSize}
            onChange={(e) => setSnap((s) => ({ ...s, gridSize: Number(e.target.value) }))}
            className="h-5 px-1 bg-slate-800/60 border border-slate-700/40 rounded text-[11px] text-slate-400
              focus:outline-none focus:border-orange-500/40"
          >
            {SNAP_PRESETS.map((v) => (
              <option key={v} value={v}>{v < 1 ? `${v * 1000}ms` : `${v}s`}</option>
            ))}
          </select>
        )}

        <div className="w-px h-4 bg-slate-700/50" />

        {/* Marker + Loop */}
        <button
          onClick={handleAddMarker}
          className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          title="Add marker at playhead (M)"
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleToggleLoop}
          className={cn(
            'p-1 rounded transition-colors',
            loopEnabled ? 'text-orange-400 bg-orange-500/10' : 'text-slate-500 hover:text-slate-300'
          )}
          title={`Loop: ${loopEnabled ? 'on' : 'off'} (L)`}
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>

        {/* Auto-Duck */}
        <div className="relative">
          <button
            onClick={() => setShowDuckingPanel(!showDuckingPanel)}
            className={cn(
              'p-1 rounded transition-colors',
              duckingConfig.enabled ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
            )}
            title="Auto-Duck settings"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
          {showDuckingPanel && (
            <div className="absolute bottom-full mb-2 right-0 z-30">
              <DuckingPanel
                config={duckingConfig}
                onChange={setDuckingConfig}
                onApply={applyDucking}
                onClose={() => setShowDuckingPanel(false)}
              />
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-slate-700/50" />

        {/* Zoom */}
        <button
          onClick={() => onTransportChange({ ...transport, zoom: Math.max(0.5, zoom - 0.25) })}
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] text-slate-400 font-mono w-8 text-center">{zoom.toFixed(1)}x</span>
        <button
          onClick={() => onTransportChange({ ...transport, zoom: Math.min(3, zoom + 0.25) })}
          className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Selection info */}
        {selection.selectedClipIds.size > 0 && (
          <>
            <div className="w-px h-4 bg-slate-700/50" />
            <span className="text-[11px] text-orange-400">
              {selection.selectedClipIds.size} selected
            </span>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Master metering section (fades in during playback) */}
        <div className={cn(
          'flex items-center gap-2 transition-opacity duration-300',
          transport.isPlaying ? 'opacity-100' : 'opacity-0'
        )}>
          <VUMeter
            level={masterLevel}
            width={40}
            height={4}
            orientation="horizontal"
          />
          <SpectrumDisplay
            data={spectrumData}
            width={60}
            height={20}
          />
        </div>

        {/* Master volume slider */}
        <div className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-slate-500" />
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={Math.round(masterVolume * 100)}
            onChange={(e) => {
              const vol = Number(e.target.value) / 100;
              setMasterVolume(vol);
              audioEngineRef.current?.setMasterVolume(vol);
            }}
            className="w-10 h-1 accent-orange-500"
            title={`Master: ${Math.round(masterVolume * 100)}%`}
          />
        </div>

        <div className="w-px h-4 bg-slate-700/50" />

        {/* Save / Export */}
        {onSave && (
          <button
            onClick={onSave}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Save"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Export"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Duration */}
        <span className="text-[10px] text-slate-500 font-mono tracking-wide">
          <span className="text-slate-300">{formatTime(totalDuration)}</span>
        </span>
      </div>
    </div>
  );
}
