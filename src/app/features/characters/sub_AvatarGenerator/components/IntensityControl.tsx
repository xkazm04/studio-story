/**
 * IntensityControl - Adjust expression strength with visual feedback
 * Design: Clean Manuscript style with cyan accents
 *
 * Provides intensity slider (0-100) with presets and visual preview
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Gauge, Zap, Sparkles, Flame, AlertTriangle } from 'lucide-react';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface IntensityLevel {
  value: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface IntensityControlProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  showPresets?: boolean;
  showDescription?: boolean;
  disabled?: boolean;
  compact?: boolean;
  min?: number;
  max?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const INTENSITY_LEVELS: IntensityLevel[] = [
  {
    value: 10,
    label: 'whisper',
    description: 'Barely perceptible, very subtle hint',
    icon: <Sparkles size={14} />,
    color: 'text-slate-400',
  },
  {
    value: 25,
    label: 'subtle',
    description: 'Gentle suggestion, understated presence',
    icon: <Sparkles size={14} />,
    color: 'text-blue-400',
  },
  {
    value: 50,
    label: 'moderate',
    description: 'Clear and balanced expression',
    icon: <Gauge size={14} />,
    color: 'text-cyan-400',
  },
  {
    value: 75,
    label: 'strong',
    description: 'Pronounced and unmistakable',
    icon: <Zap size={14} />,
    color: 'text-amber-400',
  },
  {
    value: 100,
    label: 'extreme',
    description: 'Maximum intensity, dramatic effect',
    icon: <Flame size={14} />,
    color: 'text-red-400',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getIntensityLevel(value: number): IntensityLevel {
  if (value <= 15) return INTENSITY_LEVELS[0];
  if (value <= 37) return INTENSITY_LEVELS[1];
  if (value <= 62) return INTENSITY_LEVELS[2];
  if (value <= 87) return INTENSITY_LEVELS[3];
  return INTENSITY_LEVELS[4];
}

export function getIntensityColor(value: number): string {
  if (value <= 25) return 'from-slate-600 to-blue-500';
  if (value <= 50) return 'from-blue-500 to-cyan-400';
  if (value <= 75) return 'from-cyan-400 to-amber-400';
  return 'from-amber-400 to-red-500';
}

export function getIntensityPromptModifier(value: number): string {
  const level = getIntensityLevel(value);
  switch (level.label) {
    case 'whisper': return 'barely visible hint of';
    case 'subtle': return 'subtle suggestion of';
    case 'moderate': return 'clear';
    case 'strong': return 'strong pronounced';
    case 'extreme': return 'extreme intense overwhelming';
    default: return '';
  }
}

// ============================================================================
// Main Component
// ============================================================================

const IntensityControl: React.FC<IntensityControlProps> = ({
  value,
  onChange,
  label = 'intensity',
  showPresets = true,
  showDescription = true,
  disabled = false,
  compact = false,
  min = 0,
  max = 100,
}) => {
  const currentLevel = getIntensityLevel(value);
  const gradientColor = getIntensityColor(value);

  const handlePresetClick = (presetValue: number) => {
    if (!disabled) {
      onChange(presetValue);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase text-slate-500 w-16">
          {label}
        </span>
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
            className={cn(
              'w-full h-1.5 rounded-full appearance-none cursor-pointer',
              'bg-slate-700',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3',
              '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400',
              '[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-cyan-500/30',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>
        <span className={cn('font-mono text-xs w-8 text-right', currentLevel.color)}>
          {value}%
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            {label}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-lg', currentLevel.color)}>
            {value}%
          </span>
          <span className={currentLevel.color}>{currentLevel.icon}</span>
        </div>
      </div>

      {/* Current Level Display */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-xs uppercase', currentLevel.color)}>
            {currentLevel.label}
          </span>
        </div>
        {showDescription && (
          <span className="font-mono text-[10px] text-slate-500">
            {currentLevel.description}
          </span>
        )}
      </div>

      {/* Slider */}
      <div className="relative mb-4">
        {/* Track background with gradient */}
        <div className="absolute inset-0 h-2 rounded-full bg-slate-700 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r', gradientColor)}
            style={{ width: `${value}%` }}
            layoutId="intensity-fill"
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className={cn(
            'relative w-full h-2 rounded-full appearance-none cursor-pointer bg-transparent z-10',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-black/30',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cyan-400',
            '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        {/* Tick marks */}
        <div className="absolute top-4 left-0 right-0 flex justify-between px-0.5 pointer-events-none">
          {INTENSITY_LEVELS.map((level) => (
            <div
              key={level.value}
              className={cn(
                'w-0.5 h-1 rounded-full transition-colors',
                value >= level.value ? 'bg-cyan-400/60' : 'bg-slate-600'
              )}
              style={{ marginLeft: level.value === 10 ? '10%' : undefined }}
            />
          ))}
        </div>
      </div>

      {/* Presets */}
      {showPresets && (
        <div className="flex items-center gap-1">
          {INTENSITY_LEVELS.map((level) => {
            const isActive = value === level.value;
            const isNear = Math.abs(value - level.value) <= 12;

            return (
              <button
                key={level.value}
                onClick={() => handlePresetClick(level.value)}
                disabled={disabled}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border transition-all',
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-500/40'
                    : isNear
                      ? 'bg-slate-800/60 border-slate-600/50'
                      : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className={cn(
                  'transition-colors',
                  isActive ? 'text-cyan-400' : level.color
                )}>
                  {level.icon}
                </span>
                <span className={cn(
                  'font-mono text-[9px] uppercase',
                  isActive ? 'text-cyan-400' : 'text-slate-500'
                )}>
                  {level.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Warning for extreme values */}
      {value >= 90 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded"
        >
          <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
          <span className="font-mono text-[10px] text-amber-400/80">
            Extreme intensity may produce exaggerated results
          </span>
        </motion.div>
      )}

      {/* Prompt modifier preview */}
      <div className="mt-4 p-2 bg-slate-800/40 rounded border border-slate-700/30">
        <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
          prompt_modifier
        </span>
        <p className="font-mono text-[10px] text-slate-400">
          "{getIntensityPromptModifier(value)}"
        </p>
      </div>
    </div>
  );
};

export default IntensityControl;
