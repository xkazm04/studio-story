'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Merge,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  FolderPlus,
  Image as ImageIcon,
} from 'lucide-react';
import {
  layerManager,
  type Layer,
  type LayerState,
  type BlendMode,
  BLEND_MODE_MAP,
} from '@/lib/canvas';
import { cn } from '@/app/lib/utils';
import { RangeSlider } from '@/app/components/UI/RangeSlider';

// ============================================================================
// Types
// ============================================================================

interface LayerPanelProps {
  width: number;
  height: number;
  onLayerChange?: (activeLayer: Layer | null) => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
];

// ============================================================================
// Sub-components
// ============================================================================

interface LayerItemProps {
  layer: Layer;
  isActive: boolean;
  isSelected: boolean;
  tabIndex?: number;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRename: (name: string) => void;
  onOpacityChange: (opacity: number) => void;
  onBlendModeChange: (blendMode: BlendMode) => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  isActive,
  isSelected,
  tabIndex,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onRename,
  onOpacityChange,
  onBlendModeChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const [showMenu, setShowMenu] = useState(false);
  const [nameError, setNameError] = useState(false);

  const handleDoubleClick = useCallback(() => {
    if (!layer.locked && !layer.isBackground) {
      setIsEditing(true);
      setEditName(layer.name);
      setNameError(false);
    }
  }, [layer.locked, layer.isBackground, layer.name]);

  const handleNameSubmit = useCallback(() => {
    if (!editName.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 600);
      return;
    }
    setIsEditing(false);
    setNameError(false);
    if (editName !== layer.name) {
      onRename(editName.trim());
    }
  }, [editName, layer.name, onRename]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      role="option"
      aria-selected={isActive}
      aria-label={`${layer.name}${layer.isBackground ? ' (background)' : ''}, ${Math.round(layer.opacity * 100)}% opacity${layer.locked ? ', locked' : ''}${!layer.visible ? ', hidden' : ''}`}
      tabIndex={tabIndex}
      className={cn(
        'relative flex items-center gap-2 p-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none',
        isActive
          ? 'bg-blue-500/20 border border-blue-500/50'
          : isSelected
          ? 'bg-slate-700/50 border border-slate-600/50'
          : 'bg-slate-800/30 border border-transparent hover:bg-slate-700/30'
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded border border-slate-600 bg-slate-900 overflow-hidden flex-shrink-0">
        {layer.thumbnail ? (
          <img
            src={layer.thumbnail}
            alt={layer.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>

      {/* Layer Info */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <motion.div
            animate={nameError ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <input
              type="text"
              value={editName}
              onChange={(e) => { setEditName(e.target.value); setNameError(false); }}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') { setIsEditing(false); setNameError(false); }
              }}
              autoFocus
              className={cn(
                "w-full px-1 py-0.5 text-sm bg-slate-700 rounded text-slate-100 outline-none border transition-colors",
                nameError ? "border-red-500" : "border-slate-500"
              )}
            />
          </motion.div>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-sm text-slate-200 truncate">{layer.name}</span>
            {layer.isBackground && (
              <span className="text-xs px-1 py-0.5 bg-slate-600 rounded text-slate-400">
                BG
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm text-slate-400">
            {Math.round(layer.opacity * 100)}%
          </span>
          {layer.blendMode !== 'normal' && (
            <span className="text-sm text-slate-400 capitalize">
              {layer.blendMode}
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className={cn(
            'p-2.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none',
            layer.visible ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400'
          )}
          aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          disabled={layer.isBackground}
          className={cn(
            'p-2.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none',
            layer.locked
              ? 'text-yellow-500'
              : 'text-slate-400 hover:text-slate-200',
            layer.isBackground && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        >
          {layer.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2.5 text-slate-400 hover:text-slate-200 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
            aria-label="Layer actions menu"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Context Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 z-10 bg-slate-800 border border-slate-700 rounded-lg ms-shadow-elevated overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    onMoveUp();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                  Move Up
                </button>
                <button
                  onClick={() => {
                    onMoveDown();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                  Move Down
                </button>
                {!layer.isBackground && (
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const LayerPanel: React.FC<LayerPanelProps> = ({
  width,
  height,
  onLayerChange,
  className,
}) => {
  // State
  const [layerState, setLayerState] = useState<LayerState | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize layer manager
  useEffect(() => {
    if (!initialized) {
      layerManager.initialize(width, height);
      setInitialized(true);
    }

    layerManager.onLayerChangeCallback((state) => {
      setLayerState(state);
      const activeLayer = state.activeLayerId
        ? state.layers.find((l) => l.id === state.activeLayerId) || null
        : null;
      onLayerChange?.(activeLayer);
    });

    // Get initial state
    setLayerState(layerManager.getState());

    return () => {
      // Cleanup is handled by dispose()
    };
  }, [width, height, initialized, onLayerChange]);

  // Handlers
  const handleCreateLayer = useCallback(() => {
    layerManager.createLayer();
  }, []);

  const handleDeleteLayer = useCallback((layerId: string) => {
    layerManager.deleteLayer(layerId);
  }, []);

  const handleDuplicateLayer = useCallback((layerId: string) => {
    layerManager.duplicateLayer(layerId);
  }, []);

  const handleSelectLayer = useCallback((layerId: string) => {
    layerManager.selectLayer(layerId);
  }, []);

  const handleToggleVisibility = useCallback((layerId: string) => {
    layerManager.toggleLayerVisibility(layerId);
  }, []);

  const handleToggleLock = useCallback((layerId: string) => {
    layerManager.toggleLayerLocked(layerId);
  }, []);

  const handleMoveUp = useCallback((layerId: string) => {
    layerManager.moveLayerUp(layerId);
  }, []);

  const handleMoveDown = useCallback((layerId: string) => {
    layerManager.moveLayerDown(layerId);
  }, []);

  const handleRename = useCallback((layerId: string, name: string) => {
    layerManager.setLayerName(layerId, name);
  }, []);

  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    layerManager.setLayerOpacity(layerId, opacity);
  }, []);

  const handleBlendModeChange = useCallback((layerId: string, blendMode: BlendMode) => {
    layerManager.setLayerBlendMode(layerId, blendMode);
  }, []);

  const handleMergeDown = useCallback(() => {
    if (layerState?.activeLayerId) {
      layerManager.mergeDown(layerState.activeLayerId);
    }
  }, [layerState?.activeLayerId]);

  const handleFlatten = useCallback(() => {
    layerManager.flattenImage();
  }, []);

  const activeLayer = layerState?.layers.find((l) => l.id === layerState.activeLayerId);
  const listRef = useRef<HTMLDivElement>(null);

  // Reverse order for display (top layers first)
  const displayLayers = [...(layerState?.layers || [])].reverse();

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!displayLayers.length) return;
      const activeIdx = displayLayers.findIndex((l) => l.id === layerState?.activeLayerId);
      let next = activeIdx;

      switch (e.key) {
        case 'ArrowDown':
          next = Math.min(activeIdx + 1, displayLayers.length - 1);
          break;
        case 'ArrowUp':
          next = Math.max(activeIdx - 1, 0);
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = displayLayers.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      if (next !== activeIdx && displayLayers[next]) {
        handleSelectLayer(displayLayers[next].id);
        const items = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
        items?.[next]?.focus();
      }
    },
    [displayLayers, layerState?.activeLayerId, handleSelectLayer]
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Layers</span>
          <span className="text-sm px-1.5 py-0.5 bg-slate-700 rounded-full text-slate-400">
            {layerState?.layers.length || 0}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateLayer}
            className="p-2.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
            aria-label="Add layer"
            title="Add layer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMergeDown}
            disabled={!activeLayer || activeLayer.isBackground}
            className={cn(
              'p-2.5 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none',
              activeLayer && !activeLayer.isBackground
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-400 cursor-not-allowed'
            )}
            aria-label="Merge down"
            title="Merge down"
          >
            <Merge className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Layer Controls */}
      {activeLayer && (
        <div className="space-y-2 p-2 bg-slate-800/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 w-14">Opacity</span>
            <RangeSlider aria-label="Layer opacity" value={activeLayer.opacity} min={0} max={1} step={0.01} onChange={(v) => handleOpacityChange(activeLayer.id, v)} className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 w-14">Blend</span>
            <select
              value={activeLayer.blendMode}
              onChange={(e) =>
                handleBlendModeChange(activeLayer.id, e.target.value as BlendMode)
              }
              className="flex-1 px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-200"
            >
              {BLEND_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Layer List */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="Layers"
        aria-activedescendant={layerState?.activeLayerId || undefined}
        onKeyDown={handleListKeyDown}
        className="flex-1 overflow-y-auto space-y-1"
      >
        <AnimatePresence mode="popLayout">
          {displayLayers.map((layer, index) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={layerState?.activeLayerId === layer.id}
              isSelected={layerState?.selectedLayerIds.has(layer.id) || false}
              tabIndex={layerState?.activeLayerId === layer.id ? 0 : -1}
              onSelect={() => handleSelectLayer(layer.id)}
              onToggleVisibility={() => handleToggleVisibility(layer.id)}
              onToggleLock={() => handleToggleLock(layer.id)}
              onDelete={() => handleDeleteLayer(layer.id)}
              onDuplicate={() => handleDuplicateLayer(layer.id)}
              onMoveUp={() => handleMoveUp(layer.id)}
              onMoveDown={() => handleMoveDown(layer.id)}
              onRename={(name) => handleRename(layer.id, name)}
              onOpacityChange={(opacity) => handleOpacityChange(layer.id, opacity)}
              onBlendModeChange={(blendMode) => handleBlendModeChange(layer.id, blendMode)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <button
          onClick={handleFlatten}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Flatten Image
        </button>
        <span className="text-sm text-slate-400">
          {width} × {height}
        </span>
      </div>
    </div>
  );
};

export default LayerPanel;
