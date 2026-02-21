'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Square,
  Circle,
  Lasso,
  Pentagon,
  Wand2,
  Sparkles,
  Move,
  Maximize2,
  RotateCw,
  Slash,
  Crop,
  Grid3X3,
  Hand,
  MousePointer2,
  FlipHorizontal,
  FlipVertical,
  Magnet,
  Lock,
  CornerUpLeft,
  CornerUpRight,
  Trash2,
  Copy,
  Download,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type {
  SelectionToolType,
  SelectionMode,
  TransformToolType,
  Selection,
  TransformConstraints,
} from '@/lib/editor';

// ============================================================================
// Types
// ============================================================================

export type ToolCategory = 'selection' | 'transform' | 'view';
export type ActiveTool = SelectionToolType | TransformToolType | 'hand' | 'pointer';

interface ToolConfig {
  id: ActiveTool;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  category: ToolCategory;
}

interface ToolPanelProps {
  activeTool: ActiveTool;
  onToolChange: (tool: ActiveTool) => void;
  selectionMode: SelectionMode;
  onSelectionModeChange: (mode: SelectionMode) => void;
  constraints: TransformConstraints;
  onConstraintsChange: (constraints: Partial<TransformConstraints>) => void;
  selection: Selection | null;
  onSelectionAction: (action: 'invert' | 'deselect' | 'selectAll' | 'feather') => void;
  onTransformAction: (action: 'flipH' | 'flipV' | 'rotate90' | 'reset' | 'apply') => void;
  onHistoryAction: (action: 'undo' | 'redo') => void;
  canUndo: boolean;
  canRedo: boolean;
  className?: string;
}

// ============================================================================
// Tool Configurations
// ============================================================================

const SELECTION_TOOLS: ToolConfig[] = [
  { id: 'marquee', icon: Square, label: 'Rectangular Marquee', shortcut: 'M', category: 'selection' },
  { id: 'ellipse', icon: Circle, label: 'Elliptical Marquee', shortcut: 'M', category: 'selection' },
  { id: 'lasso', icon: Lasso, label: 'Lasso', shortcut: 'L', category: 'selection' },
  { id: 'polygon', icon: Pentagon, label: 'Polygonal Lasso', shortcut: 'L', category: 'selection' },
  { id: 'magic-wand', icon: Wand2, label: 'Magic Wand', shortcut: 'W', category: 'selection' },
  { id: 'quick-select', icon: Sparkles, label: 'Quick Selection', shortcut: 'W', category: 'selection' },
];

const TRANSFORM_TOOLS: ToolConfig[] = [
  { id: 'move', icon: Move, label: 'Move', shortcut: 'V', category: 'transform' },
  { id: 'scale', icon: Maximize2, label: 'Scale', shortcut: 'T', category: 'transform' },
  { id: 'rotate', icon: RotateCw, label: 'Rotate', shortcut: 'R', category: 'transform' },
  { id: 'skew', icon: Slash, label: 'Skew', shortcut: 'K', category: 'transform' },
  { id: 'crop', icon: Crop, label: 'Crop', shortcut: 'C', category: 'transform' },
  { id: 'perspective', icon: Grid3X3, label: 'Perspective', shortcut: 'P', category: 'transform' },
];

const VIEW_TOOLS: ToolConfig[] = [
  { id: 'hand', icon: Hand, label: 'Hand (Pan)', shortcut: 'H', category: 'view' },
  { id: 'pointer', icon: MousePointer2, label: 'Pointer', shortcut: 'Esc', category: 'view' },
];

const SELECTION_MODES: { id: SelectionMode; label: string; icon: React.ElementType }[] = [
  { id: 'new', label: 'New Selection', icon: Square },
  { id: 'add', label: 'Add to Selection', icon: Copy },
  { id: 'subtract', label: 'Subtract from Selection', icon: Trash2 },
  { id: 'intersect', label: 'Intersect with Selection', icon: Download },
];

// ============================================================================
// Sub-components
// ============================================================================

interface ToolButtonProps {
  tool: ToolConfig;
  isActive: boolean;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ tool, isActive, onClick }) => {
  const Icon = tool.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg transition-all duration-150',
        'hover:bg-slate-700/50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        'group',
        isActive && 'bg-blue-600/30 text-blue-400'
      )}
      title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
    >
      <Icon className="w-5 h-5" />
      {isActive && (
        <motion.div
          layoutId="activeTool"
          className="absolute inset-0 border-2 border-blue-500 rounded-lg"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
      <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-xs text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {tool.label}
        {tool.shortcut && (
          <kbd className="ml-1 px-1 bg-slate-700 rounded text-slate-400">
            {tool.shortcut}
          </kbd>
        )}
      </span>
    </button>
  );
};

interface ToolGroupProps {
  title: string;
  tools: ToolConfig[];
  activeTool: ActiveTool;
  onToolChange: (tool: ActiveTool) => void;
}

const ToolGroup: React.FC<ToolGroupProps> = ({ title, tools, activeTool, onToolChange }) => {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 px-2">
        {title}
      </span>
      <div className="flex flex-col gap-0.5">
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            onClick={() => onToolChange(tool.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface SelectionOptionsProps {
  mode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
  selection: Selection | null;
  onAction: (action: 'invert' | 'deselect' | 'selectAll' | 'feather') => void;
}

const SelectionOptions: React.FC<SelectionOptionsProps> = ({
  mode,
  onModeChange,
  selection,
  onAction,
}) => {
  const hasSelection = selection !== null;

  return (
    <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg">
      <span className="text-xs font-medium text-slate-400">Selection Mode</span>
      <div className="flex gap-1">
        {SELECTION_MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onModeChange(id)}
            className={cn(
              'p-1.5 rounded transition-colors',
              'hover:bg-slate-700',
              mode === id && 'bg-blue-600/30 text-blue-400'
            )}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-700">
        <button
          onClick={() => onAction('selectAll')}
          className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          Select All
        </button>
        <button
          onClick={() => onAction('deselect')}
          disabled={!hasSelection}
          className={cn(
            'px-2 py-1 text-xs rounded transition-colors',
            hasSelection
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          Deselect
        </button>
        <button
          onClick={() => onAction('invert')}
          disabled={!hasSelection}
          className={cn(
            'px-2 py-1 text-xs rounded transition-colors',
            hasSelection
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          Invert
        </button>
        <button
          onClick={() => onAction('feather')}
          disabled={!hasSelection}
          className={cn(
            'px-2 py-1 text-xs rounded transition-colors',
            hasSelection
              ? 'bg-slate-700 hover:bg-slate-600'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          )}
        >
          Feather
        </button>
      </div>
    </div>
  );
};

interface TransformOptionsProps {
  constraints: TransformConstraints;
  onConstraintsChange: (constraints: Partial<TransformConstraints>) => void;
  onAction: (action: 'flipH' | 'flipV' | 'rotate90' | 'reset' | 'apply') => void;
}

const TransformOptions: React.FC<TransformOptionsProps> = ({
  constraints,
  onConstraintsChange,
  onAction,
}) => {
  return (
    <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg">
      <span className="text-xs font-medium text-slate-400">Transform Options</span>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={constraints.lockAspectRatio}
            onChange={(e) => onConstraintsChange({ lockAspectRatio: e.target.checked })}
            className="rounded bg-slate-700 border-slate-600"
          />
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-300">Lock Aspect Ratio</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={constraints.snapToGrid}
            onChange={(e) => onConstraintsChange({ snapToGrid: e.target.checked })}
            className="rounded bg-slate-700 border-slate-600"
          />
          <Magnet className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-300">Snap to Grid</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={constraints.snapToAngles}
            onChange={(e) => onConstraintsChange({ snapToAngles: e.target.checked })}
            className="rounded bg-slate-700 border-slate-600"
          />
          <RotateCw className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs text-slate-300">Snap Angles (15°)</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-700">
        <button
          onClick={() => onAction('flipH')}
          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Flip Horizontal"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>
        <button
          onClick={() => onAction('flipV')}
          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Flip Vertical"
        >
          <FlipVertical className="w-4 h-4" />
        </button>
        <button
          onClick={() => onAction('rotate90')}
          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Rotate 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onAction('reset')}
          className="flex-1 px-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 rounded transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => onAction('apply')}
          className="flex-1 px-2 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const ToolPanel: React.FC<ToolPanelProps> = ({
  activeTool,
  onToolChange,
  selectionMode,
  onSelectionModeChange,
  constraints,
  onConstraintsChange,
  selection,
  onSelectionAction,
  onTransformAction,
  onHistoryAction,
  canUndo,
  canRedo,
  className,
}) => {
  const isSelectionTool = SELECTION_TOOLS.some((t) => t.id === activeTool);
  const isTransformTool = TRANSFORM_TOOLS.some((t) => t.id === activeTool);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();

      // Tool shortcuts
      if (key === 'm') onToolChange(e.shiftKey ? 'ellipse' : 'marquee');
      else if (key === 'l') onToolChange(e.shiftKey ? 'polygon' : 'lasso');
      else if (key === 'w') onToolChange(e.shiftKey ? 'quick-select' : 'magic-wand');
      else if (key === 'v') onToolChange('move');
      else if (key === 't') onToolChange('scale');
      else if (key === 'r') onToolChange('rotate');
      else if (key === 'k') onToolChange('skew');
      else if (key === 'c') onToolChange('crop');
      else if (key === 'p') onToolChange('perspective');
      else if (key === 'h') onToolChange('hand');
      else if (key === 'escape') onToolChange('pointer');

      // History shortcuts
      else if (key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) onHistoryAction('redo');
        } else {
          if (canUndo) onHistoryAction('undo');
        }
      }

      // Selection shortcuts
      else if (key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSelectionAction('selectAll');
      } else if (key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSelectionAction('deselect');
      } else if (key === 'i' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        onSelectionAction('invert');
      }
    },
    [
      onToolChange,
      onHistoryAction,
      onSelectionAction,
      canUndo,
      canRedo,
    ]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      className={cn(
        'flex flex-col bg-slate-900/95 backdrop-blur-sm border-r border-slate-700',
        'w-14 lg:w-56',
        className
      )}
    >
      {/* Tool Buttons - Always visible */}
      <div className="flex flex-col p-2 gap-4 border-b border-slate-700">
        <ToolGroup
          title="View"
          tools={VIEW_TOOLS}
          activeTool={activeTool}
          onToolChange={onToolChange}
        />
        <ToolGroup
          title="Selection"
          tools={SELECTION_TOOLS}
          activeTool={activeTool}
          onToolChange={onToolChange}
        />
        <ToolGroup
          title="Transform"
          tools={TRANSFORM_TOOLS}
          activeTool={activeTool}
          onToolChange={onToolChange}
        />
      </div>

      {/* History Actions */}
      <div className="flex p-2 gap-1 border-b border-slate-700">
        <button
          onClick={() => onHistoryAction('undo')}
          disabled={!canUndo}
          className={cn(
            'flex-1 p-2 rounded transition-colors',
            canUndo
              ? 'bg-slate-800 hover:bg-slate-700'
              : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
          )}
          title="Undo (Ctrl+Z)"
        >
          <CornerUpLeft className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={() => onHistoryAction('redo')}
          disabled={!canRedo}
          className={cn(
            'flex-1 p-2 rounded transition-colors',
            canRedo
              ? 'bg-slate-800 hover:bg-slate-700'
              : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
          )}
          title="Redo (Ctrl+Shift+Z)"
        >
          <CornerUpRight className="w-4 h-4 mx-auto" />
        </button>
      </div>

      {/* Tool Options - Contextual */}
      <div className="flex-1 overflow-y-auto p-2 hidden lg:block">
        {isSelectionTool && (
          <SelectionOptions
            mode={selectionMode}
            onModeChange={onSelectionModeChange}
            selection={selection}
            onAction={onSelectionAction}
          />
        )}

        {isTransformTool && (
          <TransformOptions
            constraints={constraints}
            onConstraintsChange={onConstraintsChange}
            onAction={onTransformAction}
          />
        )}
      </div>
    </div>
  );
};

export default ToolPanel;
