'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ruler as RulerIcon,
  Move,
  Grid,
  Magnet,
  Square,
  Circle,
  Triangle,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Lock,
  Unlock,
  Settings,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface DrawingGuidesProps {
  canvasWidth: number;
  canvasHeight: number;
  onGuidesChange?: (guides: Guide[]) => void;
  onSnapSettingsChange?: (settings: SnapSettings) => void;
  className?: string;
}

export interface Guide {
  id: string;
  type: GuideType;
  position: { x: number; y: number };
  angle?: number;
  size?: number;
  color: string;
  locked: boolean;
  visible: boolean;
}

export type GuideType = 'horizontal' | 'vertical' | 'circle' | 'ellipse' | 'perspective';

export interface SnapSettings {
  enabled: boolean;
  snapToGrid: boolean;
  snapToGuides: boolean;
  snapToObjects: boolean;
  gridSize: number;
  snapRadius: number;
}

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  size: number;
  zoom: number;
  offset: number;
  onGuideCreate?: (position: number) => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  enabled: true,
  snapToGrid: true,
  snapToGuides: true,
  snapToObjects: false,
  gridSize: 20,
  snapRadius: 10,
};

const GUIDE_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#ef4444', // red
  '#f97316', // orange
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#eab308', // yellow
];

// ============================================================================
// Helper Functions
// ============================================================================

function generateId(): string {
  return `guide_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Sub-components
// ============================================================================

const RulerBar: React.FC<RulerProps> = ({
  orientation,
  size,
  zoom,
  offset,
  onGuideCreate,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate tick marks
  const tickInterval = zoom >= 2 ? 10 : zoom >= 1 ? 20 : zoom >= 0.5 ? 50 : 100;
  const ticks: number[] = [];

  for (let i = 0; i <= size; i += tickInterval) {
    ticks.push(i);
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!rulerRef.current) return;

      const rect = rulerRef.current.getBoundingClientRect();
      const position =
        orientation === 'horizontal'
          ? (e.clientX - rect.left - offset) / zoom
          : (e.clientY - rect.top - offset) / zoom;

      onGuideCreate?.(Math.round(position));
    },
    [orientation, zoom, offset, onGuideCreate]
  );

  return (
    <div
      ref={rulerRef}
      onMouseDown={handleMouseDown}
      className={cn(
        'bg-slate-800 border-slate-700 select-none cursor-crosshair',
        orientation === 'horizontal'
          ? 'h-5 border-b flex items-end'
          : 'w-5 border-r flex flex-col items-end'
      )}
    >
      {ticks.map((tick) => {
        const isMajor = tick % (tickInterval * 5) === 0;
        const position = tick * zoom + offset;

        return (
          <div
            key={tick}
            className={cn(
              'absolute bg-slate-500',
              orientation === 'horizontal' ? 'w-px' : 'h-px'
            )}
            style={
              orientation === 'horizontal'
                ? {
                    left: position,
                    height: isMajor ? 10 : 5,
                    bottom: 0,
                  }
                : {
                    top: position,
                    width: isMajor ? 10 : 5,
                    right: 0,
                  }
            }
          >
            {isMajor && (
              <span
                className={cn(
                  'absolute text-[8px] text-slate-500',
                  orientation === 'horizontal'
                    ? 'bottom-2.5 left-0.5'
                    : 'right-2.5 top-0.5'
                )}
                style={orientation === 'vertical' ? { writingMode: 'vertical-rl' } : undefined}
              >
                {tick}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface GuideItemProps {
  guide: Guide;
  canvasWidth: number;
  canvasHeight: number;
  onUpdate: (updates: Partial<Guide>) => void;
  onDelete: () => void;
}

const GuideItem: React.FC<GuideItemProps> = ({
  guide,
  canvasWidth,
  canvasHeight,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg transition-colors',
        guide.visible ? 'bg-slate-800/50' : 'bg-slate-800/20 opacity-50'
      )}
    >
      {/* Color indicator */}
      <div
        className="w-3 h-3 rounded-sm flex-shrink-0"
        style={{ backgroundColor: guide.color }}
      />

      {/* Guide info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-300 capitalize">{guide.type}</span>
        </div>
        <div className="text-[9px] text-slate-500">
          {guide.type === 'horizontal'
            ? `Y: ${Math.round(guide.position.y)}px`
            : guide.type === 'vertical'
            ? `X: ${Math.round(guide.position.x)}px`
            : guide.type === 'circle'
            ? `${Math.round(guide.position.x)}, ${Math.round(guide.position.y)} r${guide.size}`
            : `${Math.round(guide.position.x)}, ${Math.round(guide.position.y)}`}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onUpdate({ visible: !guide.visible })}
          className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors"
        >
          {guide.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
        <button
          onClick={() => onUpdate({ locked: !guide.locked })}
          className={cn(
            'p-1 rounded transition-colors',
            guide.locked ? 'text-yellow-500' : 'text-slate-400 hover:text-slate-200'
          )}
        >
          {guide.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>
        <button
          onClick={onDelete}
          disabled={guide.locked}
          className={cn(
            'p-1 rounded transition-colors',
            guide.locked
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-400 hover:text-red-400'
          )}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const DrawingGuides: React.FC<DrawingGuidesProps> = ({
  canvasWidth,
  canvasHeight,
  onGuidesChange,
  onSnapSettingsChange,
  className,
}) => {
  // State
  const [guides, setGuides] = useState<Guide[]>([]);
  const [snapSettings, setSnapSettings] = useState<SnapSettings>(DEFAULT_SNAP_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [showRulers, setShowRulers] = useState(true);
  const [nextColorIndex, setNextColorIndex] = useState(0);

  // Notify parent of changes
  useEffect(() => {
    onGuidesChange?.(guides);
  }, [guides, onGuidesChange]);

  useEffect(() => {
    onSnapSettingsChange?.(snapSettings);
  }, [snapSettings, onSnapSettingsChange]);

  // Create guide
  const createGuide = useCallback(
    (type: GuideType, position?: { x: number; y: number }) => {
      const newGuide: Guide = {
        id: generateId(),
        type,
        position: position || {
          x: canvasWidth / 2,
          y: canvasHeight / 2,
        },
        color: GUIDE_COLORS[nextColorIndex % GUIDE_COLORS.length],
        locked: false,
        visible: true,
      };

      if (type === 'circle') {
        newGuide.size = Math.min(canvasWidth, canvasHeight) / 4;
      }

      setGuides((prev) => [...prev, newGuide]);
      setNextColorIndex((prev) => prev + 1);
    },
    [canvasWidth, canvasHeight, nextColorIndex]
  );

  // Create horizontal guide from ruler
  const createHorizontalGuide = useCallback(
    (y: number) => {
      createGuide('horizontal', { x: canvasWidth / 2, y });
    },
    [canvasWidth, createGuide]
  );

  // Create vertical guide from ruler
  const createVerticalGuide = useCallback(
    (x: number) => {
      createGuide('vertical', { x, y: canvasHeight / 2 });
    },
    [canvasHeight, createGuide]
  );

  // Update guide
  const updateGuide = useCallback((id: string, updates: Partial<Guide>) => {
    setGuides((prev) =>
      prev.map((guide) => (guide.id === id ? { ...guide, ...updates } : guide))
    );
  }, []);

  // Delete guide
  const deleteGuide = useCallback((id: string) => {
    setGuides((prev) => prev.filter((guide) => guide.id !== id));
  }, []);

  // Clear all guides
  const clearAllGuides = useCallback(() => {
    setGuides([]);
  }, []);

  // Update snap settings
  const updateSnapSettings = useCallback((updates: Partial<SnapSettings>) => {
    setSnapSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RulerIcon className="w-4 h-4 text-green-400" />
          <span className="text-xs font-medium text-slate-200">Drawing Guides</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-700 rounded-full text-slate-400">
            {guides.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowRulers(!showRulers)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showRulers
                ? 'bg-slate-700 text-slate-200'
                : 'text-slate-400 hover:text-slate-200'
            )}
            title={showRulers ? 'Hide rulers' : 'Show rulers'}
          >
            <RulerIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showSettings
                ? 'bg-slate-700 text-slate-200'
                : 'text-slate-400 hover:text-slate-200'
            )}
            title="Snap settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Snap Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-2 bg-slate-800/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Snap to Grid</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snapSettings.snapToGrid}
                    onChange={(e) => updateSnapSettings({ snapToGrid: e.target.checked })}
                    className="w-3 h-3 rounded border-slate-600 bg-slate-700"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Snap to Guides</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snapSettings.snapToGuides}
                    onChange={(e) => updateSnapSettings({ snapToGuides: e.target.checked })}
                    className="w-3 h-3 rounded border-slate-600 bg-slate-700"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 flex-1">Grid Size</span>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={snapSettings.gridSize}
                  onChange={(e) => updateSnapSettings({ gridSize: parseInt(e.target.value) })}
                  className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] text-slate-300 w-8 text-right">
                  {snapSettings.gridSize}px
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 flex-1">Snap Radius</span>
                <input
                  type="range"
                  min={2}
                  max={30}
                  value={snapSettings.snapRadius}
                  onChange={(e) => updateSnapSettings({ snapRadius: parseInt(e.target.value) })}
                  className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] text-slate-300 w-8 text-right">
                  {snapSettings.snapRadius}px
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Guides */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Quick Add</span>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => createGuide('horizontal')}
            className="flex flex-col items-center gap-1 p-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            title="Add horizontal guide"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[9px]">H Line</span>
          </button>
          <button
            onClick={() => createGuide('vertical')}
            className="flex flex-col items-center gap-1 p-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            title="Add vertical guide"
          >
            <MoreHorizontal className="w-4 h-4 rotate-90" />
            <span className="text-[9px]">V Line</span>
          </button>
          <button
            onClick={() => createGuide('circle')}
            className="flex flex-col items-center gap-1 p-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            title="Add circle guide"
          >
            <Circle className="w-4 h-4" />
            <span className="text-[9px]">Circle</span>
          </button>
          <button
            onClick={() => createGuide('perspective')}
            className="flex flex-col items-center gap-1 p-2 bg-slate-800/50 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            title="Add perspective guide"
          >
            <Triangle className="w-4 h-4" />
            <span className="text-[9px]">Persp</span>
          </button>
        </div>
      </div>

      {/* Center Guides */}
      <div className="flex gap-1">
        <button
          onClick={() =>
            createGuide('horizontal', { x: canvasWidth / 2, y: canvasHeight / 2 })
          }
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800/50 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Center H
        </button>
        <button
          onClick={() =>
            createGuide('vertical', { x: canvasWidth / 2, y: canvasHeight / 2 })
          }
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-800/50 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Center V
        </button>
      </div>

      {/* Guide List */}
      {guides.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-1">
          <AnimatePresence>
            {guides.map((guide) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <GuideItem
                  guide={guide}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  onUpdate={(updates) => updateGuide(guide.id, updates)}
                  onDelete={() => deleteGuide(guide.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <RulerIcon className="w-8 h-8 text-slate-700 mb-2" />
          <p className="text-[10px] text-slate-500">
            No guides added yet.
            <br />
            Click buttons above to add guides.
          </p>
        </div>
      )}

      {/* Footer Actions */}
      {guides.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={clearAllGuides}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
          <span className="text-[9px] text-slate-600">
            Drag from rulers to add
          </span>
        </div>
      )}
    </div>
  );
};

export default DrawingGuides;
