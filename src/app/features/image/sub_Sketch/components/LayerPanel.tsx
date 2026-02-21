'use client';

import React, { useState, useCallback, useEffect } from 'react';
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

  const handleDoubleClick = useCallback(() => {
    if (!layer.locked && !layer.isBackground) {
      setIsEditing(true);
      setEditName(layer.name);
    }
  }, [layer.locked, layer.isBackground, layer.name]);

  const handleNameSubmit = useCallback(() => {
    setIsEditing(false);
    if (editName.trim() && editName !== layer.name) {
      onRename(editName.trim());
    }
  }, [editName, layer.name, onRename]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'relative flex items-center gap-2 p-2 rounded-lg transition-colors',
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
            <ImageIcon className="w-4 h-4 text-slate-600" />
          </div>
        )}
      </div>

      {/* Layer Info */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSubmit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            autoFocus
            className="w-full px-1 py-0.5 text-[11px] bg-slate-700 border border-slate-500 rounded text-slate-100 outline-none"
          />
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-200 truncate">{layer.name}</span>
            {layer.isBackground && (
              <span className="text-[8px] px-1 py-0.5 bg-slate-600 rounded text-slate-400">
                BG
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-slate-500">
            {Math.round(layer.opacity * 100)}%
          </span>
          {layer.blendMode !== 'normal' && (
            <span className="text-[9px] text-slate-500 capitalize">
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
            'p-1 rounded transition-colors',
            layer.visible ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600'
          )}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          disabled={layer.isBackground}
          className={cn(
            'p-1 rounded transition-colors',
            layer.locked
              ? 'text-yellow-500'
              : 'text-slate-400 hover:text-slate-200',
            layer.isBackground && 'opacity-50 cursor-not-allowed'
          )}
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        >
          {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
          >
            <MoreVertical className="w-3 h-3" />
          </button>

          {/* Context Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-full mt-1 z-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    onMoveUp();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <ChevronUp className="w-3 h-3" />
                  Move Up
                </button>
                <button
                  onClick={() => {
                    onMoveDown();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-slate-300 hover:bg-slate-700 transition-colors"
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
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-red-400 hover:bg-red-500/20 transition-colors"
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

  // Reverse order for display (top layers first)
  const displayLayers = [...(layerState?.layers || [])].reverse();

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-200">Layers</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded-full text-slate-400">
            {layerState?.layers.length || 0}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateLayer}
            className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded transition-colors"
            title="Add layer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMergeDown}
            disabled={!activeLayer || activeLayer.isBackground}
            className={cn(
              'p-1.5 rounded transition-colors',
              activeLayer && !activeLayer.isBackground
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 cursor-not-allowed'
            )}
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
            <span className="text-[10px] text-slate-400 w-14">Opacity</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={activeLayer.opacity}
              onChange={(e) =>
                handleOpacityChange(activeLayer.id, parseFloat(e.target.value))
              }
              className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-slate-300 w-8 text-right">
              {Math.round(activeLayer.opacity * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 w-14">Blend</span>
            <select
              value={activeLayer.blendMode}
              onChange={(e) =>
                handleBlendModeChange(activeLayer.id, e.target.value as BlendMode)
              }
              className="flex-1 px-2 py-1 text-[10px] bg-slate-700 border border-slate-600 rounded text-slate-200"
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
      <div className="flex-1 overflow-y-auto space-y-1">
        <AnimatePresence mode="popLayout">
          {displayLayers.map((layer) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={layerState?.activeLayerId === layer.id}
              isSelected={layerState?.selectedLayerIds.has(layer.id) || false}
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
          className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
        >
          Flatten Image
        </button>
        <span className="text-[9px] text-slate-600">
          {width} × {height}
        </span>
      </div>
    </div>
  );
};

export default LayerPanel;
