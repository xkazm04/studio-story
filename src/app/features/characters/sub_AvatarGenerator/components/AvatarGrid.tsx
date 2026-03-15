/**
 * AvatarGrid - 4-avatar selection grid with compare mode
 * Design: Clean Manuscript style with cyan accents
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, User, Columns, Pin, X, ArrowLeftRight, ZoomIn, ZoomOut } from 'lucide-react';
import { GeneratedAvatar } from '../../hooks/useAvatarGenerator';
import { cn } from '@/app/lib/utils';

interface AvatarGridProps {
  avatars: GeneratedAvatar[];
  selectedAvatar: GeneratedAvatar | null;
  onSelectAvatar: (avatar: GeneratedAvatar) => void;
  isLoading: boolean;
}

// ============================================================================
// Slider Comparison Subcomponent
// ============================================================================

interface AvatarSliderProps {
  left: GeneratedAvatar;
  right: GeneratedAvatar;
}

const AvatarSlider: React.FC<AvatarSliderProps> = ({ left, right }) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square overflow-hidden rounded-lg cursor-ew-resize bg-slate-800"
      onMouseMove={(e) => dragging.current && updatePosition(e.clientX)}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchMove={(e) => updatePosition(e.touches[0].clientX)}
    >
      {/* Right image (full behind) */}
      <img src={right.url} alt="Right" className="absolute inset-0 w-full h-full object-cover" />

      {/* Left image (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={left.url} alt="Left" className="w-full h-full object-cover" />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${position}%` }}
        onMouseDown={() => { dragging.current = true; }}
        onTouchStart={() => { dragging.current = true; }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ArrowLeftRight size={14} className="text-slate-800" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded text-xs font-mono text-white uppercase">{left.style}</div>
      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-xs font-mono text-white uppercase">{right.style}</div>
    </div>
  );
};

// ============================================================================
// Metadata Diff
// ============================================================================

interface MetadataDiffProps {
  pinned: GeneratedAvatar[];
}

const MetadataDiff: React.FC<MetadataDiffProps> = ({ pinned }) => {
  const fields: { key: keyof GeneratedAvatar; label: string }[] = [
    { key: 'style', label: 'Style' },
    { key: 'outfitName', label: 'Outfit' },
  ];

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50">
      <span className="font-mono text-xs text-slate-500 uppercase block mb-2">parameter_diff</span>
      <div className="space-y-1.5">
        {fields.map(({ key, label }) => {
          const values = pinned.map((a) => (a[key] as string) || '-');
          const allSame = values.every((v) => v === values[0]);
          if (allSame) return null;
          return (
            <div key={key} className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500 w-14 shrink-0">{label}:</span>
              {values.map((v, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-600">&rarr;</span>}
                  <span className="px-1.5 py-0.5 rounded bg-slate-800/60 text-cyan-400">{v}</span>
                </React.Fragment>
              ))}
            </div>
          );
        })}
        {/* Prompt diff — just show differing word count as a signal */}
        {(() => {
          const lengths = pinned.map((a) => a.prompt.split(/\s+/).length);
          const allSame = lengths.every((l) => l === lengths[0]);
          if (allSame) return null;
          return (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500 w-14 shrink-0">Prompt:</span>
              {lengths.map((l, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-600">&rarr;</span>}
                  <span className="px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">{l} words</span>
                </React.Fragment>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const AvatarGrid: React.FC<AvatarGridProps> = ({
  avatars,
  selectedAvatar,
  onSelectAvatar,
  isLoading,
}) => {
  const [compareMode, setCompareMode] = useState(false);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPairIdx, setSliderPairIdx] = useState(0);
  const [zoom, setZoom] = useState(1);

  const pinnedAvatars = avatars.filter((a) => pinnedIds.has(a.id));

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 4) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const exitCompare = useCallback(() => {
    setCompareMode(false);
    setPinnedIds(new Set());
    setShowComparison(false);
    setSliderPairIdx(0);
    setZoom(1);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            generating_avatars
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-slate-800/50 border border-slate-700/50 animate-pulse flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-cyan-500/50 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-sm text-slate-400">
                  avatar_{i + 1}...
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (avatars.length === 0) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-slate-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            generated_avatars
          </h3>
        </div>
        <div className="py-8 text-center">
          <User className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <span className="font-mono text-sm text-slate-400">
            // generate_avatars_to_preview
          </span>
        </div>
      </div>
    );
  }

  // Comparison panel
  if (showComparison && pinnedAvatars.length >= 2) {
    return (
      <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
              compare ({pinnedAvatars.length})
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Zoom */}
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              disabled={zoom <= 0.5}
              className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 disabled:opacity-50 transition-colors"
            >
              <ZoomOut size={13} />
            </button>
            <span className="font-mono text-xs text-slate-400 w-9 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
              disabled={zoom >= 2}
              className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 disabled:opacity-50 transition-colors"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={exitCompare}
              className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors ml-1"
              title="Exit comparison"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }} className="transition-transform">
          {/* Side by side grid */}
          <div className={cn(
            'grid gap-2',
            pinnedAvatars.length === 2 ? 'grid-cols-2' :
            pinnedAvatars.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          )}>
            {pinnedAvatars.map((avatar) => (
              <div key={avatar.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-700/50 bg-slate-800">
                <img src={avatar.url} alt={avatar.style} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="font-mono text-xs text-white uppercase tracking-wide">{avatar.style}</span>
                  {avatar.outfitName && (
                    <span className="font-mono text-[10px] text-slate-300 block">{avatar.outfitName}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* A/B Slider (for first two pinned) */}
          {pinnedAvatars.length >= 2 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-slate-500 uppercase">slider_overlay</span>
                {pinnedAvatars.length > 2 && (
                  <div className="flex gap-1">
                    {Array.from({ length: pinnedAvatars.length - 1 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setSliderPairIdx(i)}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-xs font-mono transition-colors',
                          sliderPairIdx === i
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-800/40 text-slate-500 hover:text-slate-300'
                        )}
                      >
                        {i + 1}↔{i + 2}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <AvatarSlider
                left={pinnedAvatars[sliderPairIdx]}
                right={pinnedAvatars[Math.min(sliderPairIdx + 1, pinnedAvatars.length - 1)]}
              />
            </div>
          )}
        </div>

        {/* Metadata diff */}
        <MetadataDiff pinned={pinnedAvatars} />
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            {compareMode ? 'pin_to_compare' : 'select_avatar'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {compareMode && pinnedIds.size >= 2 && (
            <button
              onClick={() => setShowComparison(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-md font-mono text-xs uppercase tracking-wide bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              <Columns size={12} />
              compare ({pinnedIds.size})
            </button>
          )}
          {compareMode && (
            <button
              onClick={exitCompare}
              className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors"
              title="Exit compare mode"
            >
              <X size={13} />
            </button>
          )}
          {avatars.length >= 2 && !compareMode && (
            <button
              onClick={() => setCompareMode(true)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md font-mono text-xs uppercase tracking-wide transition-colors',
                'bg-slate-800/40 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
              )}
              title="Compare avatars"
            >
              <Columns size={12} />
              compare
            </button>
          )}
          {!compareMode && (
            <span className="font-mono text-sm text-slate-400 uppercase">
              click to select
            </span>
          )}
        </div>
      </div>

      {/* Compare mode hint */}
      {compareMode && pinnedIds.size < 2 && (
        <p className="font-mono text-xs text-slate-500 mb-3">
          Pin 2-4 avatars to compare them side by side
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {avatars.map((avatar, index) => {
            const isSelected = selectedAvatar?.id === avatar.id;
            const isPinned = pinnedIds.has(avatar.id);
            return (
              <motion.button
                key={avatar.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => {
                  if (compareMode) {
                    togglePin(avatar.id);
                  } else {
                    onSelectAvatar(avatar);
                  }
                }}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200',
                  compareMode
                    ? isPinned
                      ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'border-slate-700/50 hover:border-slate-600'
                    : isSelected
                    ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    : 'border-slate-700/50 hover:border-slate-600'
                )}
              >
                <img
                  src={avatar.url}
                  alt={`Avatar ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Selection indicator (normal mode) */}
                {!compareMode && isSelected && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}

                {/* Pin indicator (compare mode) */}
                {compareMode && isPinned && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center"
                  >
                    <Pin className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}

                {/* Style badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="font-mono text-sm text-white uppercase tracking-wide">
                    {avatar.style}
                  </span>
                </div>

                {/* Hover overlay */}
                <div className={cn(
                  'absolute inset-0 transition-opacity',
                  compareMode
                    ? isPinned ? 'bg-cyan-500/10 opacity-100' : 'bg-cyan-500/10 opacity-0 hover:opacity-100'
                    : isSelected ? 'bg-cyan-500/10 opacity-100' : 'bg-cyan-500/10 opacity-0 hover:opacity-100'
                )} />
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AvatarGrid;
