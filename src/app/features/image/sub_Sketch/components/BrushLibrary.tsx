'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  Pen,
  Brush,
  Wind,
  Highlighter,
  Eraser,
  Droplets,
  Circle,
  Settings,
  Save,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Palette,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import {
  type BrushSettings,
  type BrushType,
  type BlendMode,
  DEFAULT_BRUSH,
} from '@/lib/canvas';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface BrushLibraryProps {
  currentBrush: BrushSettings;
  onBrushChange: (brush: Partial<BrushSettings>) => void;
  className?: string;
}

interface BrushPreset {
  id: string;
  name: string;
  type: BrushType;
  settings: Partial<BrushSettings>;
  icon: React.ComponentType<{ className?: string }>;
  category: BrushCategory;
}

type BrushCategory = 'drawing' | 'painting' | 'effects' | 'custom';

// ============================================================================
// Constants
// ============================================================================

const BRUSH_PRESETS: BrushPreset[] = [
  // Drawing
  {
    id: 'pencil-hard',
    name: 'Hard Pencil',
    type: 'pencil',
    settings: { size: 2, hardness: 0.95, opacity: 1, spacing: 0.05 },
    icon: Pencil,
    category: 'drawing',
  },
  {
    id: 'pencil-soft',
    name: 'Soft Pencil',
    type: 'pencil',
    settings: { size: 4, hardness: 0.6, opacity: 0.8, spacing: 0.08 },
    icon: Pencil,
    category: 'drawing',
  },
  {
    id: 'pen-fine',
    name: 'Fine Pen',
    type: 'pen',
    settings: { size: 1, hardness: 1, opacity: 1, spacing: 0.03 },
    icon: Pen,
    category: 'drawing',
  },
  {
    id: 'pen-medium',
    name: 'Medium Pen',
    type: 'pen',
    settings: { size: 3, hardness: 1, opacity: 1, spacing: 0.05 },
    icon: Pen,
    category: 'drawing',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    type: 'charcoal',
    settings: { size: 8, hardness: 0.4, opacity: 0.7, spacing: 0.1 },
    icon: Circle,
    category: 'drawing',
  },

  // Painting
  {
    id: 'brush-soft',
    name: 'Soft Brush',
    type: 'brush',
    settings: { size: 20, hardness: 0.3, opacity: 0.8, spacing: 0.1 },
    icon: Brush,
    category: 'painting',
  },
  {
    id: 'brush-hard',
    name: 'Hard Brush',
    type: 'brush',
    settings: { size: 15, hardness: 0.8, opacity: 1, spacing: 0.08 },
    icon: Brush,
    category: 'painting',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    type: 'watercolor',
    settings: { size: 30, hardness: 0.2, opacity: 0.4, spacing: 0.15 },
    icon: Droplets,
    category: 'painting',
  },
  {
    id: 'marker',
    name: 'Marker',
    type: 'marker',
    settings: { size: 12, hardness: 0.7, opacity: 0.85, spacing: 0.05 },
    icon: Highlighter,
    category: 'painting',
  },

  // Effects
  {
    id: 'airbrush-soft',
    name: 'Soft Airbrush',
    type: 'airbrush',
    settings: { size: 40, hardness: 0.1, opacity: 0.2, spacing: 0.2 },
    icon: Wind,
    category: 'effects',
  },
  {
    id: 'airbrush-hard',
    name: 'Hard Airbrush',
    type: 'airbrush',
    settings: { size: 25, hardness: 0.3, opacity: 0.4, spacing: 0.15 },
    icon: Wind,
    category: 'effects',
  },
  {
    id: 'eraser-soft',
    name: 'Soft Eraser',
    type: 'eraser',
    settings: { size: 20, hardness: 0.3, opacity: 1, spacing: 0.1 },
    icon: Eraser,
    category: 'effects',
  },
  {
    id: 'eraser-hard',
    name: 'Hard Eraser',
    type: 'eraser',
    settings: { size: 10, hardness: 0.9, opacity: 1, spacing: 0.05 },
    icon: Eraser,
    category: 'effects',
  },
];

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

const QUICK_COLORS = [
  '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

// ============================================================================
// Sub-components
// ============================================================================

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-400">{label}</span>
        <span className="text-[10px] text-slate-300 font-mono">
          {typeof value === 'number' ? (value < 1 && max <= 1 ? Math.round(value * 100) : Math.round(value)) : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
};

interface BrushButtonProps {
  preset: BrushPreset;
  isActive: boolean;
  onClick: () => void;
}

const BrushButton: React.FC<BrushButtonProps> = ({ preset, isActive, onClick }) => {
  const Icon = preset.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
        isActive
          ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
          : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[9px] truncate w-full text-center">{preset.name}</span>
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const BrushLibrary: React.FC<BrushLibraryProps> = ({
  currentBrush,
  onBrushChange,
  className,
}) => {
  // State
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<BrushCategory>>(
    new Set(['drawing', 'painting'])
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customPresets, setCustomPresets] = useState<BrushPreset[]>([]);

  // Group presets by category
  const presetsByCategory = useMemo(() => {
    const all = [...BRUSH_PRESETS, ...customPresets];
    return {
      drawing: all.filter((p) => p.category === 'drawing'),
      painting: all.filter((p) => p.category === 'painting'),
      effects: all.filter((p) => p.category === 'effects'),
      custom: all.filter((p) => p.category === 'custom'),
    };
  }, [customPresets]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: BrushCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Apply preset
  const applyPreset = useCallback(
    (preset: BrushPreset) => {
      setActivePresetId(preset.id);
      onBrushChange({
        type: preset.type,
        ...preset.settings,
      });
    },
    [onBrushChange]
  );

  // Save current as custom preset
  const saveAsCustomPreset = useCallback(() => {
    const newPreset: BrushPreset = {
      id: `custom_${Date.now()}`,
      name: `Custom ${customPresets.length + 1}`,
      type: currentBrush.type,
      settings: {
        size: currentBrush.size,
        hardness: currentBrush.hardness,
        opacity: currentBrush.opacity,
        spacing: currentBrush.spacing,
        smoothing: currentBrush.smoothing,
        pressureSizeEnabled: currentBrush.pressureSizeEnabled,
        pressureOpacityEnabled: currentBrush.pressureOpacityEnabled,
      },
      icon: Brush,
      category: 'custom',
    };

    setCustomPresets((prev) => [...prev, newPreset]);
  }, [currentBrush, customPresets.length]);

  // Delete custom preset
  const deleteCustomPreset = useCallback((presetId: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== presetId));
    if (activePresetId === presetId) {
      setActivePresetId(null);
    }
  }, [activePresetId]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    onBrushChange(DEFAULT_BRUSH);
    setActivePresetId(null);
  }, [onBrushChange]);

  // Render category section
  const renderCategory = (category: BrushCategory, label: string) => {
    const presets = presetsByCategory[category];
    if (presets.length === 0 && category !== 'custom') return null;

    const isExpanded = expandedCategories.has(category);

    return (
      <div key={category} className="border-b border-slate-800/50 last:border-0">
        <button
          onClick={() => toggleCategory(category)}
          className="flex items-center justify-between w-full px-2 py-2 text-left hover:bg-slate-800/30 transition-colors"
        >
          <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">
            {label}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-slate-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-1 px-2 pb-2">
                {presets.map((preset) => (
                  <div key={preset.id} className="relative group">
                    <BrushButton
                      preset={preset}
                      isActive={activePresetId === preset.id}
                      onClick={() => applyPreset(preset)}
                    />
                    {preset.category === 'custom' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomPreset(preset.id);
                        }}
                        className="absolute -top-1 -right-1 p-0.5 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-2 h-2 text-white" />
                      </button>
                    )}
                  </div>
                ))}
                {category === 'custom' && (
                  <button
                    onClick={saveAsCustomPreset}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-dashed border-slate-600 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-[9px]">Save</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brush className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-medium text-slate-200">Brush Library</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetToDefaults}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showAdvanced
                ? 'bg-slate-700 text-slate-200'
                : 'text-slate-400 hover:text-slate-200'
            )}
            title="Advanced settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Color Picker */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Palette className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] text-slate-400">Quick Colors</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {QUICK_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onBrushChange({ color })}
              className={cn(
                'w-5 h-5 rounded border-2 transition-all',
                currentBrush.color === color
                  ? 'border-white scale-110'
                  : 'border-transparent hover:scale-105'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <label className="w-5 h-5 rounded border border-slate-600 cursor-pointer overflow-hidden">
            <input
              type="color"
              value={currentBrush.color}
              onChange={(e) => onBrushChange({ color: e.target.value })}
              className="w-8 h-8 -ml-1.5 -mt-1.5 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Basic Controls */}
      <div className="space-y-2 p-2 bg-slate-800/30 rounded-lg">
        <SliderControl
          label="Size"
          value={currentBrush.size}
          min={1}
          max={100}
          onChange={(size) => onBrushChange({ size })}
          unit="px"
        />
        <SliderControl
          label="Opacity"
          value={currentBrush.opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={(opacity) => onBrushChange({ opacity })}
          unit="%"
        />
        <SliderControl
          label="Hardness"
          value={currentBrush.hardness}
          min={0}
          max={1}
          step={0.01}
          onChange={(hardness) => onBrushChange({ hardness })}
          unit="%"
        />
      </div>

      {/* Brush Presets */}
      <div className="bg-slate-800/30 rounded-lg overflow-hidden">
        {renderCategory('drawing', 'Drawing')}
        {renderCategory('painting', 'Painting')}
        {renderCategory('effects', 'Effects')}
        {renderCategory('custom', 'Custom')}
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 p-2 bg-slate-800/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                  Advanced
                </span>
              </div>

              <SliderControl
                label="Spacing"
                value={currentBrush.spacing}
                min={0.01}
                max={1}
                step={0.01}
                onChange={(spacing) => onBrushChange({ spacing })}
                unit="%"
              />

              <SliderControl
                label="Smoothing"
                value={currentBrush.smoothing}
                min={0}
                max={1}
                step={0.01}
                onChange={(smoothing) => onBrushChange({ smoothing })}
                unit="%"
              />

              <SliderControl
                label="Min Size"
                value={currentBrush.minSize}
                min={1}
                max={currentBrush.size}
                onChange={(minSize) => onBrushChange({ minSize })}
                unit="px"
              />

              <SliderControl
                label="Max Size"
                value={currentBrush.maxSize}
                min={currentBrush.size}
                max={200}
                onChange={(maxSize) => onBrushChange({ maxSize })}
                unit="px"
              />

              {/* Pressure Options */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400">Pressure Sensitivity</span>
                <div className="flex flex-col gap-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentBrush.pressureSizeEnabled}
                      onChange={(e) =>
                        onBrushChange({ pressureSizeEnabled: e.target.checked })
                      }
                      className="w-3 h-3 rounded border-slate-600 bg-slate-700"
                    />
                    <span className="text-[10px] text-slate-300">Pressure affects size</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentBrush.pressureOpacityEnabled}
                      onChange={(e) =>
                        onBrushChange({ pressureOpacityEnabled: e.target.checked })
                      }
                      className="w-3 h-3 rounded border-slate-600 bg-slate-700"
                    />
                    <span className="text-[10px] text-slate-300">Pressure affects opacity</span>
                  </label>
                </div>
              </div>

              {/* Blend Mode */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400">Blend Mode</span>
                <select
                  value={currentBrush.blendMode}
                  onChange={(e) => onBrushChange({ blendMode: e.target.value as BlendMode })}
                  className="w-full px-2 py-1 text-[10px] bg-slate-700 border border-slate-600 rounded text-slate-200"
                >
                  {BLEND_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Brush Preview */}
      <div className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full border border-slate-600"
            style={{
              background: `radial-gradient(circle at center, ${currentBrush.color} 0%, ${currentBrush.color}${Math.round(currentBrush.hardness * 255).toString(16).padStart(2, '0')} ${currentBrush.hardness * 100}%, transparent 100%)`,
              transform: `scale(${Math.min(1, currentBrush.size / 40)})`,
            }}
          />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-300 capitalize">{currentBrush.type}</span>
            <span className="text-[9px] text-slate-500">
              {currentBrush.size}px / {Math.round(currentBrush.opacity * 100)}%
            </span>
          </div>
        </div>
        <button
          onClick={saveAsCustomPreset}
          className="p-1.5 text-slate-400 hover:text-green-400 rounded transition-colors"
          title="Save as preset"
        >
          <Save className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default BrushLibrary;
