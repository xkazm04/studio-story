'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { interactive } from '@/lib/animations';
import {
  Sliders,
  Palette,
  Sparkles,
  Layers,
  Sun,
  Contrast,
  Paintbrush,
  Wand2,
  RotateCcw,
  ChevronDown,
  Check,
  Copy,
  Save,
} from 'lucide-react';
import {
  realTimeEngine,
  type StyleParameters,
  type StylePreset,
} from '@/lib/sketch';
import { cn } from '@/app/lib/utils';
import { RangeSlider } from '@/app/components/UI/RangeSlider';

// ============================================================================
// Types
// ============================================================================

interface StyleControllerProps {
  style: StyleParameters;
  onChange: (style: Partial<StyleParameters>) => void;
  onPresetChange?: (preset: StylePreset) => void;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const PRESET_INFO: Record<StylePreset, { icon: React.ElementType; description: string }> = {
  realistic: { icon: Sun, description: 'Photorealistic rendering' },
  anime: { icon: Sparkles, description: 'Japanese animation style' },
  'digital-art': { icon: Paintbrush, description: 'Modern digital artwork' },
  watercolor: { icon: Palette, description: 'Soft watercolor painting' },
  'oil-painting': { icon: Layers, description: 'Classic oil paint textures' },
  'pencil-sketch': { icon: Sliders, description: 'Hand-drawn pencil look' },
  comic: { icon: Contrast, description: 'Bold comic book style' },
  fantasy: { icon: Wand2, description: 'Fantastical and magical' },
  cinematic: { icon: Sun, description: 'Film-quality visuals' },
  custom: { icon: Sliders, description: 'Your custom settings' },
};

const SLIDER_CONFIGS = [
  {
    key: 'stylization' as keyof StyleParameters,
    label: 'Stylization',
    icon: Sparkles,
    color: 'purple',
    description: 'How much to stylize vs. preserve original',
  },
  {
    key: 'detailLevel' as keyof StyleParameters,
    label: 'Detail Level',
    icon: Layers,
    color: 'blue',
    description: 'Level of detail in output',
  },
  {
    key: 'colorVibrancy' as keyof StyleParameters,
    label: 'Color Vibrancy',
    icon: Palette,
    color: 'pink',
    description: 'Color saturation and vibrancy',
  },
  {
    key: 'structureAdherence' as keyof StyleParameters,
    label: 'Structure',
    icon: Sliders,
    color: 'cyan',
    description: 'How closely to follow sketch structure',
  },
  {
    key: 'creativeFreedom' as keyof StyleParameters,
    label: 'Creativity',
    icon: Wand2,
    color: 'yellow',
    description: 'Allow AI creative interpretation',
  },
  {
    key: 'lineWeight' as keyof StyleParameters,
    label: 'Line Weight',
    icon: Paintbrush,
    color: 'orange',
    description: 'Emphasis on lines vs. fills',
  },
  {
    key: 'smoothness' as keyof StyleParameters,
    label: 'Smoothness',
    icon: Sun,
    color: 'green',
    description: 'Smooth vs. rough rendering',
  },
  {
    key: 'contrast' as keyof StyleParameters,
    label: 'Contrast',
    icon: Contrast,
    color: 'red',
    description: 'Output contrast level',
  },
];

// ============================================================================
// Sub-components
// ============================================================================

const ICON_COLOR_CLASSES: Record<string, string> = {
  purple: 'text-purple-400',
  blue: 'text-blue-400',
  pink: 'text-pink-400',
  cyan: 'text-cyan-400',
  yellow: 'text-yellow-400',
  orange: 'text-orange-400',
  green: 'text-green-400',
  red: 'text-red-400',
};

interface PresetButtonProps {
  preset: StylePreset;
  isActive: boolean;
  onClick: () => void;
}

const PresetButton: React.FC<PresetButtonProps> = ({ preset, isActive, onClick }) => {
  const info = PRESET_INFO[preset];
  const Icon = info.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
        'hover:bg-slate-700/50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        isActive && 'bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30'
      )}
      title={info.description}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium capitalize truncate w-full text-center">
        {preset.replace('-', ' ')}
      </span>
      {isActive && (
        <motion.div
          layoutId="activePreset"
          className="absolute inset-0 border border-blue-500/50 rounded-lg"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const StyleController: React.FC<StyleControllerProps> = ({
  style,
  onChange,
  onPresetChange,
  compact = false,
  className,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(!compact);
  const [savedStyles, setSavedStyles] = useState<{ name: string; style: StyleParameters }[]>([]);
  const [copied, setCopied] = useState(false);

  const presets = useMemo(() => realTimeEngine.getStylePresets(), []);

  const handleSliderChange = useCallback(
    (key: keyof StyleParameters, value: number) => {
      onChange({ [key]: value, stylePreset: 'custom' });
    },
    [onChange]
  );

  const handlePresetSelect = useCallback(
    (preset: StylePreset) => {
      realTimeEngine.applyStylePreset(preset);
      const newStyle = realTimeEngine.getStyle();
      onChange(newStyle);
      onPresetChange?.(preset);
    },
    [onChange, onPresetChange]
  );

  const handleReset = useCallback(() => {
    handlePresetSelect('digital-art');
  }, [handlePresetSelect]);

  const handleSaveStyle = useCallback(() => {
    const name = `Style ${savedStyles.length + 1}`;
    setSavedStyles((prev) => [...prev, { name, style: { ...style } }]);
  }, [style, savedStyles.length]);

  const handleLoadStyle = useCallback(
    (saved: { name: string; style: StyleParameters }) => {
      onChange(saved.style);
    },
    [onChange]
  );

  // Basic sliders (always visible)
  const basicSliders = SLIDER_CONFIGS.slice(0, 4);
  // Advanced sliders
  const advancedSliders = SLIDER_CONFIGS.slice(4);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-200">Style Controls</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSaveStyle}
            className="p-2.5 rounded bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
            title="Save current style"
            aria-label="Save current style"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-2.5 rounded bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
            title="Reset to defaults"
            aria-label="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Style Presets */}
      <div className="space-y-2">
        <span className="text-sm text-slate-400 uppercase tracking-wider">Presets</span>
        <div className="grid grid-cols-5 gap-1">
          {presets.map(({ preset }) => (
            <PresetButton
              key={preset}
              preset={preset}
              isActive={style.stylePreset === preset}
              onClick={() => handlePresetSelect(preset)}
            />
          ))}
        </div>
      </div>

      {/* Basic Sliders */}
      <div className="space-y-3">
        <span className="text-sm text-slate-400 uppercase tracking-wider">Core Settings</span>
        {basicSliders.map((config) => {
          const Icon = config.icon;
          return (
            <div key={config.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className={cn('w-3.5 h-3.5', ICON_COLOR_CLASSES[config.color])} />
                  <span className="text-sm text-slate-300">{config.label}</span>
                </div>
              </div>
              <RangeSlider
                aria-label={config.label}
                value={style[config.key] as number}
                min={0}
                max={100}
                step={1}
                accentColor={config.color as 'cyan' | 'purple' | 'blue' | 'pink' | 'yellow' | 'orange' | 'green' | 'red'}
                onChange={(value) => handleSliderChange(config.key, value)}
              />
            </div>
          );
        })}
      </div>

      {/* Advanced Toggle */}
      {!compact && (
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full p-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 transition-colors"
        >
          <span className="text-sm">Advanced Settings</span>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              showAdvanced && 'rotate-180'
            )}
          />
        </button>
      )}

      {/* Advanced Sliders */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 pt-2">
              {advancedSliders.map((config) => {
                const Icon = config.icon;
                return (
                  <div key={config.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('w-3.5 h-3.5', ICON_COLOR_CLASSES[config.color])} />
                        <span className="text-sm text-slate-300">{config.label}</span>
                      </div>
                    </div>
                    <RangeSlider
                      aria-label={config.label}
                      value={style[config.key] as number}
                      min={0}
                      max={100}
                      step={1}
                      accentColor={config.color as 'cyan' | 'purple' | 'blue' | 'pink' | 'yellow' | 'orange' | 'green' | 'red'}
                      onChange={(value) => handleSliderChange(config.key, value)}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Styles */}
      {savedStyles.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-slate-400 uppercase tracking-wider">Saved Styles</span>
          <div className="flex flex-wrap gap-1">
            {savedStyles.map((saved, index) => (
              <button
                key={index}
                onClick={() => handleLoadStyle(saved)}
                className="px-2 py-1 text-sm bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded transition-colors"
              >
                {saved.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Style Info */}
      <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'px-2 py-0.5 rounded text-sm font-medium capitalize',
              style.stylePreset === 'custom'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-blue-500/20 text-blue-300'
            )}
          >
            {style.stylePreset.replace('-', ' ')}
          </div>
        </div>
        <motion.button
          onClick={() => {
            const styleString = JSON.stringify(style, null, 2);
            navigator.clipboard.writeText(styleString);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          whileTap={interactive.tapButton}
          className="p-2.5 text-slate-400 hover:text-slate-200 rounded transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
          title="Copy style to clipboard"
          aria-label="Copy style to clipboard"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Copy className="w-3.5 h-3.5" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};

export default StyleController;
