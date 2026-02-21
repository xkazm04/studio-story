'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Sun,
  Contrast,
  Droplets,
  Palette,
  Thermometer,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Plus,
  Layers,
  Sliders,
  RotateCcw,
  Sparkles,
  Focus,
  Aperture,
  CircleDot,
  Maximize,
  GripVertical,
} from 'lucide-react';
import {
  type AdjustmentLayer,
  type AdjustmentType,
  type BlendMode,
  type BrightnessContrastParams,
  type LevelsParams,
  type HSLParams,
  type VibranceParams,
  type ExposureParams,
  type TemperatureParams,
  type VignetteParams,
  type GrainParams,
  type SharpenParams,
  DEFAULT_PARAMS,
} from '@/lib/editor';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface AdjustmentPanelProps {
  layers: AdjustmentLayer[];
  selectedLayerId: string | null;
  onAddLayer: (type: AdjustmentType) => void;
  onUpdateLayer: (layerId: string, updates: Partial<AdjustmentLayer>) => void;
  onRemoveLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onReorderLayers: (layerIds: string[]) => void;
  onSelectLayer: (layerId: string | null) => void;
  onReset?: () => void;
}

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

// ============================================================================
// Constants
// ============================================================================

const ADJUSTMENT_CATEGORIES = [
  {
    name: 'Basic',
    items: [
      { type: 'brightness-contrast' as const, label: 'Brightness/Contrast', icon: Sun },
      { type: 'exposure' as const, label: 'Exposure', icon: Aperture },
      { type: 'levels' as const, label: 'Levels', icon: Sliders },
    ],
  },
  {
    name: 'Color',
    items: [
      { type: 'hsl' as const, label: 'Hue/Saturation', icon: Palette },
      { type: 'vibrance' as const, label: 'Vibrance', icon: Droplets },
      { type: 'temperature' as const, label: 'Temperature', icon: Thermometer },
      { type: 'color-balance' as const, label: 'Color Balance', icon: Contrast },
    ],
  },
  {
    name: 'Effects',
    items: [
      { type: 'sharpen' as const, label: 'Sharpen', icon: Focus },
      { type: 'vignette' as const, label: 'Vignette', icon: CircleDot },
      { type: 'grain' as const, label: 'Grain', icon: Sparkles },
    ],
  },
  {
    name: 'Creative',
    items: [
      { type: 'split-toning' as const, label: 'Split Toning', icon: Maximize },
      { type: 'gradient-map' as const, label: 'Gradient Map', icon: Layers },
    ],
  },
];

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
];

// ============================================================================
// Slider Control Component
// ============================================================================

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-mono">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-3
            [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #334155 ${percentage}%, #334155 100%)`,
          }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Layer Controls Component
// ============================================================================

interface LayerControlsProps {
  layer: AdjustmentLayer;
  onUpdate: (updates: Partial<AdjustmentLayer>) => void;
}

const BrightnessContrastControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const params = layer.adjustment.params as BrightnessContrastParams;

  return (
    <div className="space-y-3">
      <SliderControl
        label="Brightness"
        value={params.brightness}
        min={-100}
        max={100}
        onChange={(brightness) =>
          onUpdate({
            adjustment: { type: 'brightness-contrast', params: { ...params, brightness } },
          })
        }
      />
      <SliderControl
        label="Contrast"
        value={params.contrast}
        min={-100}
        max={100}
        onChange={(contrast) =>
          onUpdate({
            adjustment: { type: 'brightness-contrast', params: { ...params, contrast } },
          })
        }
      />
    </div>
  );
};

const ExposureControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const params = layer.adjustment.params as ExposureParams;

  return (
    <div className="space-y-3">
      <SliderControl
        label="Exposure"
        value={params.exposure}
        min={-5}
        max={5}
        step={0.1}
        onChange={(exposure) =>
          onUpdate({
            adjustment: { type: 'exposure', params: { ...params, exposure } },
          })
        }
      />
      <SliderControl
        label="Offset"
        value={params.offset}
        min={-0.5}
        max={0.5}
        step={0.01}
        onChange={(offset) =>
          onUpdate({
            adjustment: { type: 'exposure', params: { ...params, offset } },
          })
        }
      />
      <SliderControl
        label="Gamma"
        value={params.gamma}
        min={0.1}
        max={10}
        step={0.1}
        onChange={(gamma) =>
          onUpdate({
            adjustment: { type: 'exposure', params: { ...params, gamma } },
          })
        }
      />
    </div>
  );
};

const LevelsControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const params = layer.adjustment.params as LevelsParams;

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-500 mb-2">Input Levels</div>
      <SliderControl
        label="Black Point"
        value={params.inputBlack}
        min={0}
        max={255}
        onChange={(inputBlack) =>
          onUpdate({
            adjustment: { type: 'levels', params: { ...params, inputBlack } },
          })
        }
      />
      <SliderControl
        label="Gamma"
        value={params.inputGamma}
        min={0.1}
        max={10}
        step={0.1}
        onChange={(inputGamma) =>
          onUpdate({
            adjustment: { type: 'levels', params: { ...params, inputGamma } },
          })
        }
      />
      <SliderControl
        label="White Point"
        value={params.inputWhite}
        min={0}
        max={255}
        onChange={(inputWhite) =>
          onUpdate({
            adjustment: { type: 'levels', params: { ...params, inputWhite } },
          })
        }
      />
      <div className="text-xs text-slate-500 mt-4 mb-2">Output Levels</div>
      <SliderControl
        label="Black"
        value={params.outputBlack}
        min={0}
        max={255}
        onChange={(outputBlack) =>
          onUpdate({
            adjustment: { type: 'levels', params: { ...params, outputBlack } },
          })
        }
      />
      <SliderControl
        label="White"
        value={params.outputWhite}
        min={0}
        max={255}
        onChange={(outputWhite) =>
          onUpdate({
            adjustment: { type: 'levels', params: { ...params, outputWhite } },
          })
        }
      />
    </div>
  );
};

const HSLControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const params = layer.adjustment.params as HSLParams;

  return (
    <div className="space-y-3">
      <SliderControl
        label="Hue"
        value={params.hue}
        min={-180}
        max={180}
        unit="°"
        onChange={(hue) =>
          onUpdate({
            adjustment: { type: 'hsl', params: { ...params, hue } },
          })
        }
      />
      <SliderControl
        label="Saturation"
        value={params.saturation}
        min={-100}
        max={100}
        onChange={(saturation) =>
          onUpdate({
            adjustment: { type: 'hsl', params: { ...params, saturation } },
          })
        }
      />
      <SliderControl
        label="Lightness"
        value={params.lightness}
        min={-100}
        max={100}
        onChange={(lightness) =>
          onUpdate({
            adjustment: { type: 'hsl', params: { ...params, lightness } },
          })
        }
      />
    </div>
  );
};

const VibranceControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const params = layer.adjustment.params as VibranceParams;

  return (
    <div className="space-y-3">
      <SliderControl
        label="Vibrance"
        value={params.vibrance}
        min={-100}
        max={100}
        onChange={(vibrance) =>
          onUpdate({
            adjustment: { type: 'vibrance', params: { ...params, vibrance } },
          })
        }
      />
      <SliderControl
        label="Saturation"
        value={params.saturation}
        min={-100}
        max={100}
        onChange={(saturation) =>
          onUpdate({
            adjustment: { type: 'vibrance', params: { ...params, saturation } },
          })
        }
      />
    </div>
  );
};

const TemperatureControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const params = layer.adjustment.params as TemperatureParams;

  return (
    <div className="space-y-3">
      <SliderControl
        label="Temperature"
        value={params.temperature}
        min={-100}
        max={100}
        onChange={(temperature) =>
          onUpdate({
            adjustment: { type: 'temperature', params: { ...params, temperature } },
          })
        }
      />
      <SliderControl
        label="Tint"
        value={params.tint}
        min={-100}
        max={100}
        onChange={(tint) =>
          onUpdate({
            adjustment: { type: 'temperature', params: { ...params, tint } },
          })
        }
      />
    </div>
  );
};

const SharpenControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const params = layer.adjustment.params as SharpenParams;

  return (
    <div className="space-y-3">
      <SliderControl
        label="Amount"
        value={params.amount}
        min={0}
        max={500}
        unit="%"
        onChange={(amount) =>
          onUpdate({
            adjustment: { type: 'sharpen', params: { ...params, amount } },
          })
        }
      />
      <SliderControl
        label="Radius"
        value={params.radius}
        min={0.1}
        max={5}
        step={0.1}
        unit="px"
        onChange={(radius) =>
          onUpdate({
            adjustment: { type: 'sharpen', params: { ...params, radius } },
          })
        }
      />
      <SliderControl
        label="Threshold"
        value={params.threshold}
        min={0}
        max={255}
        onChange={(threshold) =>
          onUpdate({
            adjustment: { type: 'sharpen', params: { ...params, threshold } },
          })
        }
      />
    </div>
  );
};

const VignetteControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const params = layer.adjustment.params as VignetteParams;

  return (
    <div className="space-y-3">
      <SliderControl
        label="Amount"
        value={params.amount}
        min={-100}
        max={100}
        onChange={(amount) =>
          onUpdate({
            adjustment: { type: 'vignette', params: { ...params, amount } },
          })
        }
      />
      <SliderControl
        label="Midpoint"
        value={params.midpoint}
        min={0}
        max={100}
        onChange={(midpoint) =>
          onUpdate({
            adjustment: { type: 'vignette', params: { ...params, midpoint } },
          })
        }
      />
      <SliderControl
        label="Roundness"
        value={params.roundness}
        min={-100}
        max={100}
        onChange={(roundness) =>
          onUpdate({
            adjustment: { type: 'vignette', params: { ...params, roundness } },
          })
        }
      />
      <SliderControl
        label="Feather"
        value={params.feather}
        min={0}
        max={100}
        onChange={(feather) =>
          onUpdate({
            adjustment: { type: 'vignette', params: { ...params, feather } },
          })
        }
      />
    </div>
  );
};

const GrainControls: React.FC<LayerControlsProps> = ({ layer, onUpdate }) => {
  const params = layer.adjustment.params as GrainParams;

  return (
    <div className="space-y-3">
      <SliderControl
        label="Amount"
        value={params.amount}
        min={0}
        max={100}
        onChange={(amount) =>
          onUpdate({
            adjustment: { type: 'grain', params: { ...params, amount } },
          })
        }
      />
      <SliderControl
        label="Size"
        value={params.size}
        min={0}
        max={100}
        onChange={(size) =>
          onUpdate({
            adjustment: { type: 'grain', params: { ...params, size } },
          })
        }
      />
      <SliderControl
        label="Roughness"
        value={params.roughness}
        min={0}
        max={100}
        onChange={(roughness) =>
          onUpdate({
            adjustment: { type: 'grain', params: { ...params, roughness } },
          })
        }
      />
      <label className="flex items-center gap-2 mt-2">
        <input
          type="checkbox"
          checked={params.monochromatic}
          onChange={(e) =>
            onUpdate({
              adjustment: { type: 'grain', params: { ...params, monochromatic: e.target.checked } },
            })
          }
          className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-400">Monochromatic</span>
      </label>
    </div>
  );
};

// ============================================================================
// Layer Item Component
// ============================================================================

interface LayerItemProps {
  layer: AdjustmentLayer;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<AdjustmentLayer>) => void;
  onRemove: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onToggleVisibility,
  onDuplicate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = useCallback(() => {
    const iconMap: Record<AdjustmentType, React.ElementType> = {
      'brightness-contrast': Sun,
      levels: Sliders,
      curves: Sliders,
      hsl: Palette,
      'color-balance': Contrast,
      vibrance: Droplets,
      exposure: Aperture,
      temperature: Thermometer,
      blur: CircleDot,
      sharpen: Focus,
      vignette: CircleDot,
      grain: Sparkles,
      'chromatic-aberration': Maximize,
      'split-toning': Maximize,
      'gradient-map': Layers,
      'color-lookup': Layers,
    };
    const Icon = iconMap[layer.type] || Sliders;
    return <Icon className="w-4 h-4" />;
  }, [layer.type]);

  const renderControls = useCallback(() => {
    switch (layer.type) {
      case 'brightness-contrast':
        return <BrightnessContrastControls layer={layer} onUpdate={onUpdate} />;
      case 'exposure':
        return <ExposureControls layer={layer} onUpdate={onUpdate} />;
      case 'levels':
        return <LevelsControls layer={layer} onUpdate={onUpdate} />;
      case 'hsl':
        return <HSLControls layer={layer} onUpdate={onUpdate} />;
      case 'vibrance':
        return <VibranceControls layer={layer} onUpdate={onUpdate} />;
      case 'temperature':
        return <TemperatureControls layer={layer} onUpdate={onUpdate} />;
      case 'sharpen':
        return <SharpenControls layer={layer} onUpdate={onUpdate} />;
      case 'vignette':
        return <VignetteControls layer={layer} onUpdate={onUpdate} />;
      case 'grain':
        return <GrainControls layer={layer} onUpdate={onUpdate} />;
      default:
        return (
          <div className="text-xs text-slate-500 text-center py-2">
            Controls not implemented for this adjustment type
          </div>
        );
    }
  }, [layer, onUpdate]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'rounded-lg border transition-colors',
        isSelected
          ? 'bg-slate-800/80 border-blue-500/50'
          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 p-2 cursor-pointer"
        onClick={onSelect}
      >
        <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-400">
          <GripVertical className="w-4 h-4" />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-slate-400 hover:text-slate-200"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <span className={cn('text-slate-400', !layer.visible && 'opacity-50')}>
          {getIcon()}
        </span>

        <span
          className={cn(
            'flex-1 text-sm truncate',
            layer.visible ? 'text-slate-200' : 'text-slate-500'
          )}
        >
          {layer.name}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            {layer.visible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            title="Duplicate layer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            title="Delete layer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded Controls */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3">
              {/* Opacity & Blend Mode */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <SliderControl
                    label="Opacity"
                    value={layer.opacity}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={(opacity) => onUpdate({ opacity })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Blend Mode</label>
                <select
                  value={layer.blendMode}
                  onChange={(e) => onUpdate({ blendMode: e.target.value as BlendMode })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {BLEND_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment-specific controls */}
              <div className="border-t border-slate-700 pt-3">
                {renderControls()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({
  layers,
  selectedLayerId,
  onAddLayer,
  onUpdateLayer,
  onRemoveLayer,
  onToggleVisibility,
  onDuplicateLayer,
  onReorderLayers,
  onSelectLayer,
  onReset,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Basic');

  const handleReorder = useCallback(
    (newOrder: AdjustmentLayer[]) => {
      onReorderLayers(newOrder.map((l) => l.id));
    },
    [onReorderLayers]
  );

  const sortedLayers = useMemo(
    () => [...layers].sort((a, b) => a.order - b.order),
    [layers]
  );

  return (
    <div className="h-full flex flex-col bg-slate-900/50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">Adjustments</span>
          <span className="text-xs text-slate-500">({layers.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {onReset && layers.length > 0 && (
            <button
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset all adjustments"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>

            <AnimatePresence>
              {showAddMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
                >
                  {ADJUSTMENT_CATEGORIES.map((category) => (
                    <div key={category.name}>
                      <button
                        onClick={() =>
                          setExpandedCategory(
                            expandedCategory === category.name ? null : category.name
                          )
                        }
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-700/50"
                      >
                        {category.name}
                        <ChevronDown
                          className={cn(
                            'w-3 h-3 transition-transform',
                            expandedCategory === category.name && 'rotate-180'
                          )}
                        />
                      </button>

                      <AnimatePresence>
                        {expandedCategory === category.name && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            {category.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <button
                                  key={item.type}
                                  onClick={() => {
                                    onAddLayer(item.type);
                                    setShowAddMenu(false);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                                >
                                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                                  {item.label}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedLayers.length === 0 ? (
          <div className="text-center py-8">
            <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm text-slate-500">No adjustments yet</p>
            <p className="text-xs text-slate-600 mt-1">
              Click &quot;Add&quot; to create your first adjustment layer
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={sortedLayers}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {sortedLayers.map((layer) => (
              <Reorder.Item key={layer.id} value={layer}>
                <LayerItem
                  layer={layer}
                  isSelected={selectedLayerId === layer.id}
                  onSelect={() => onSelectLayer(layer.id)}
                  onUpdate={(updates) => onUpdateLayer(layer.id, updates)}
                  onRemove={() => onRemoveLayer(layer.id)}
                  onToggleVisibility={() => onToggleVisibility(layer.id)}
                  onDuplicate={() => onDuplicateLayer(layer.id)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
};

export default AdjustmentPanel;
