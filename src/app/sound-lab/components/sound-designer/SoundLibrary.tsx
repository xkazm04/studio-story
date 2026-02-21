'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Search, ArrowUpDown, Play, PanelLeftClose, Mic, Music, Zap, Trees, Square,
  Plus, Edit3, Trash2, Wand2, Grid3X3,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { TRACK_TYPE_STYLES } from '../../types';
import SoundContextMenu, { ActionItem, MenuDivider, MenuHeader } from '../context-menus/SoundContextMenu';
import { useSoundContextMenu } from '../context-menus/useSoundContextMenu';
import type { AudioAsset, AudioAssetType } from '../../types';

interface SoundLibraryProps {
  onCollapse: () => void;
  extraAssets?: AudioAsset[];
  onAddToTimeline?: (asset: AudioAsset) => void;
  onDeleteAsset?: (assetId: string) => void;
}

const FILTERS: { value: AudioAssetType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'voice', label: 'Voice' },
  { value: 'music', label: 'Music' },
  { value: 'sfx', label: 'SFX' },
  { value: 'ambience', label: 'Amb' },
];

type SortMode = 'name' | 'duration' | 'type';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SoundLibrary({ onCollapse, extraAssets = [], onAddToTimeline, onDeleteAsset }: SoundLibraryProps) {
  const [filter, setFilter] = useState<AudioAssetType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('type');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { position: ctxPos, target: ctxTarget, handleContextMenu, hide: hideCtx } = useSoundContextMenu();

  const allAssets = useMemo(
    () => extraAssets,
    [extraAssets]
  );

  const filtered = useMemo(() => {
    let items = allAssets;
    if (filter !== 'all') items = items.filter((a) => a.type === filter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (sort === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'duration') items = [...items].sort((a, b) => b.duration - a.duration);
    return items;
  }, [allAssets, filter, search, sort]);

  const handleDragStart = (e: React.DragEvent, asset: AudioAsset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handlePlay = useCallback((asset: AudioAsset) => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // If clicking the same asset, just stop
    if (playingId === asset.id) {
      setPlayingId(null);
      return;
    }

    if (!asset.audioUrl) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(asset.audioUrl);
    audio.onended = () => { setPlayingId(null); audioRef.current = null; };
    audio.onerror = () => { setPlayingId(null); audioRef.current = null; };
    audio.play();
    audioRef.current = audio;
    setPlayingId(asset.id);
  }, [playingId]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)' }}
    >
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-orange-500/10 relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute -top-8 -right-8 w-24 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)' }}
        />

        <div className="flex items-center justify-between mb-2.5 relative">
          <span className="text-xs font-semibold text-slate-200 tracking-wide">Library</span>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400/80"
              style={{ textShadow: '0 0 8px rgba(249, 115, 22, 0.3)' }}
            >
              {filtered.length}
            </span>
            <button
              onClick={onCollapse}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-950/60 border border-slate-700/30 rounded-lg
              text-xs text-slate-300 placeholder:text-slate-600 backdrop-blur-sm
              focus:outline-none focus:border-orange-500/30 focus:ring-1 focus:ring-orange-500/10 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'text-[10px] px-2 py-1 rounded-md font-medium transition-all',
                filter === f.value
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.1)]'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent hover:bg-slate-800/40'
              )}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setSort((s) => s === 'name' ? 'duration' : s === 'duration' ? 'type' : 'name')}
            className="ml-auto p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-all"
            title={`Sort by ${sort}`}
          >
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.2), transparent)' }}
        />
      </div>

      {/* Library Context Menu */}
      <SoundContextMenu position={ctxPos} onClose={hideCtx}>
        {ctxTarget?.type === 'library-asset' && (
          <>
            <MenuHeader>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-200 truncate max-w-32">{ctxTarget.asset.name}</span>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded', TRACK_TYPE_STYLES[ctxTarget.asset.type].bgClass, TRACK_TYPE_STYLES[ctxTarget.asset.type].textClass)}>
                  {TRACK_TYPE_STYLES[ctxTarget.asset.type].label}
                </span>
              </div>
            </MenuHeader>
            <div className="py-1">
              <ActionItem
                icon={<Plus className="w-full h-full" />}
                label="Add to Timeline at Playhead"
                action={() => onAddToTimeline?.(ctxTarget.asset)}
                disabled={!onAddToTimeline}
              />
              <ActionItem
                icon={<Play className="w-full h-full" />}
                label="Preview Audio"
                action={() => handlePlay(ctxTarget.asset)}
              />
            </div>
            <MenuDivider />
            <div className="py-1">
              <ActionItem
                icon={<Edit3 className="w-full h-full" />}
                label="Rename"
                action={() => setEditingAssetId(ctxTarget.asset.id)}
              />
              <ActionItem
                icon={<Trash2 className="w-full h-full" />}
                label="Delete"
                action={() => onDeleteAsset?.(ctxTarget.asset.id)}
                danger
                disabled={!onDeleteAsset}
              />
            </div>
          </>
        )}
      </SoundContextMenu>

      {/* Asset List */}
      <div className="flex-1 overflow-auto">
        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 border border-orange-500/15"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(249, 115, 22, 0.06) 100%)',
                boxShadow: '0 0 16px rgba(249, 115, 22, 0.05)',
              }}
            >
              <Music className="w-5 h-5 text-orange-400/40" />
            </div>
            <span className="text-[11px] font-medium text-slate-400 mb-1">No assets yet</span>
            <span className="text-[10px] text-slate-600 leading-relaxed max-w-[180px]">
              Generate audio in Composer or export beats to populate your library.
            </span>
          </div>
        )}
        {filtered.map((asset) => {
          const style = TRACK_TYPE_STYLES[asset.type];
          const isGenerated = asset.id.startsWith('gen-');
          const isPlaying = playingId === asset.id;
          return (
            <div
              key={asset.id}
              draggable
              onDragStart={(e) => handleDragStart(e, asset)}
              onContextMenu={(e) => handleContextMenu(e, {
                type: 'library-asset',
                asset,
              })}
              className={cn(
                'flex items-center gap-2 px-3 py-2 border-b border-slate-800/20 border-l-2',
                'transition-all cursor-grab group',
                'active:cursor-grabbing',
                style.borderClass,
                isPlaying
                  ? 'bg-slate-800/40'
                  : 'hover:bg-slate-800/30'
              )}
              style={isPlaying ? { boxShadow: `inset 0 0 20px rgba(249, 115, 22, 0.05)` } : undefined}
            >
              {/* Play button */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePlay(asset); }}
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                  isPlaying
                    ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                    : asset.audioUrl
                      ? 'bg-slate-800/60 opacity-0 group-hover:opacity-100 text-slate-300 hover:bg-slate-700/80'
                      : 'bg-slate-800/60 opacity-0 group-hover:opacity-30 text-slate-500'
                )}
              >
                {isPlaying ? (
                  <Square className="w-2 h-2" />
                ) : (
                  <Play className="w-2.5 h-2.5 ml-0.5" />
                )}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {editingAssetId === asset.id ? (
                    <input
                      type="text"
                      defaultValue={asset.name}
                      autoFocus
                      onBlur={() => setEditingAssetId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') setEditingAssetId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-xs text-slate-200 bg-slate-800/80 border border-orange-500/40 rounded-md px-1.5 py-0.5 outline-none w-full focus:border-orange-500/60"
                    />
                  ) : (
                    <span className={cn(
                      'text-xs truncate block',
                      isPlaying ? 'text-slate-100' : 'text-slate-300'
                    )}>
                      {asset.name}
                    </span>
                  )}
                  {isPlaying && (
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse shrink-0"
                      style={{ boxShadow: '0 0 6px rgba(249, 115, 22, 0.6)' }}
                    />
                  )}
                </div>
                {asset.source && (
                  <div className="flex items-center gap-1">
                    {asset.source === 'beats' ? (
                      <Grid3X3 className="w-2.5 h-2.5 text-amber-400/60" />
                    ) : (
                      <Wand2 className="w-2.5 h-2.5 text-violet-400/60" />
                    )}
                    <span className={cn(
                      'text-[10px] font-mono',
                      asset.source === 'beats' ? 'text-amber-400/60' : 'text-violet-400/60'
                    )}>
                      {asset.source === 'beats' ? 'Beats' : 'Composer'}
                    </span>
                  </div>
                )}
              </div>

              {/* Duration */}
              <span className={cn(
                'text-[10px] font-mono shrink-0',
                isPlaying ? 'text-orange-400' : 'text-slate-500'
              )}>
                {formatDuration(asset.duration)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Collapsed sidebar strip — shown when sidebar is minimized */
const COLLAPSED_ICONS: { type: AudioAssetType; icon: typeof Mic }[] = [
  { type: 'voice', icon: Mic },
  { type: 'music', icon: Music },
  { type: 'sfx', icon: Zap },
  { type: 'ambience', icon: Trees },
];

export function CollapsedLibrary({ onExpand, assetCount }: { onExpand: () => void; assetCount: number }) {
  return (
    <div
      className="flex flex-col items-center h-full py-3 gap-1.5"
      style={{ background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)' }}
    >
      {/* Expand button */}
      <button
        onClick={onExpand}
        className="p-1.5 rounded-lg text-slate-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all mb-1"
        title="Expand library"
      >
        <PanelLeftClose className="w-3.5 h-3.5 rotate-180" />
      </button>

      {/* Type icons */}
      {COLLAPSED_ICONS.map(({ type, icon: Icon }) => {
        const style = TRACK_TYPE_STYLES[type];
        return (
          <button
            key={type}
            className={cn(
              'p-1.5 rounded-lg transition-all',
              'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            )}
            title={style.label}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}

      {/* Spacer + count */}
      <div className="flex-1" />
      <span
        className="text-[10px] text-orange-400/70 font-mono"
        style={{ textShadow: '0 0 6px rgba(249, 115, 22, 0.3)' }}
      >
        {assetCount}
      </span>
    </div>
  );
}
