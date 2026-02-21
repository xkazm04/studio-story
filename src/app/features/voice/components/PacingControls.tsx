'use client';

import { motion } from 'framer-motion';
import {
  Gauge,
  Clock,
  Wind,
  Waves,
  FastForward,
  Rewind,
} from 'lucide-react';
import { Slider } from '@/app/components/UI/Slider';
import type { PacingConfig } from '@/lib/voice';

interface PacingControlsProps {
  pacing: PacingConfig;
  onChange: (pacing: PacingConfig) => void;
  className?: string;
}

export default function PacingControls({
  pacing,
  onChange,
  className = '',
}: PacingControlsProps) {
  // Handle individual field changes
  const handleChange = <K extends keyof PacingConfig>(
    field: K,
    value: PacingConfig[K]
  ) => {
    onChange({
      ...pacing,
      [field]: value,
    });
  };

  // Get speed label
  const getSpeedLabel = (speed: number): string => {
    if (speed <= 0.6) return 'Very Slow';
    if (speed <= 0.8) return 'Slow';
    if (speed <= 0.95) return 'Measured';
    if (speed <= 1.05) return 'Normal';
    if (speed <= 1.2) return 'Brisk';
    if (speed <= 1.5) return 'Fast';
    return 'Very Fast';
  };

  // Get variation label
  const getVariationLabel = (variation: number): string => {
    if (variation < 0.05) return 'Precise';
    if (variation < 0.15) return 'Natural';
    if (variation < 0.25) return 'Expressive';
    return 'Dynamic';
  };

  // Speed presets
  const speedPresets = [
    { label: 'Slow', value: 0.75, icon: Rewind },
    { label: 'Normal', value: 1.0, icon: Gauge },
    { label: 'Fast', value: 1.25, icon: FastForward },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Speed Control */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <label className="text-sm font-medium text-slate-200">Speech Rate</label>
          </div>
          <span className="text-xs text-slate-500">
            {getSpeedLabel(pacing.speed)} ({(pacing.speed * 100).toFixed(0)}%)
          </span>
        </div>

        {/* Quick presets */}
        <div className="flex gap-2">
          {speedPresets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = Math.abs(pacing.speed - preset.value) < 0.1;
            return (
              <motion.button
                key={preset.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChange('speed', preset.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{preset.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Fine-tune slider */}
        <Slider
          value={pacing.speed}
          min={0.5}
          max={2.0}
          step={0.05}
          onChange={(value) => handleChange('speed', value)}
        />
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>

      {/* Pause Controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <label className="text-sm font-medium text-slate-200">Pause Timing</label>
        </div>

        {/* Sentence pause */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Between Sentences</span>
            <span className="text-xs text-slate-500">{pacing.pauseBetweenSentences}ms</span>
          </div>
          <Slider
            value={pacing.pauseBetweenSentences}
            min={100}
            max={1500}
            step={50}
            onChange={(value) => handleChange('pauseBetweenSentences', value)}
          />
        </div>

        {/* Clause pause */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Between Clauses</span>
            <span className="text-xs text-slate-500">{pacing.pauseBetweenClauses}ms</span>
          </div>
          <Slider
            value={pacing.pauseBetweenClauses}
            min={0}
            max={500}
            step={25}
            onChange={(value) => handleChange('pauseBetweenClauses', value)}
          />
        </div>
      </div>

      {/* Natural Variation */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-purple-400" />
            <label className="text-sm font-medium text-slate-200">Natural Variation</label>
          </div>
          <span className="text-xs text-slate-500">
            {getVariationLabel(pacing.naturalVariation)}
          </span>
        </div>

        <Slider
          value={pacing.naturalVariation}
          min={0}
          max={0.4}
          step={0.02}
          onChange={(value) => handleChange('naturalVariation', value)}
        />
        <p className="text-[10px] text-slate-500">
          Adds subtle randomness to timing for more human-like delivery
        </p>
      </div>

      {/* Breath Pauses Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-sm text-slate-200">Breath Pauses</span>
            <p className="text-[10px] text-slate-500">Insert natural breathing sounds</p>
          </div>
        </div>
        <button
          onClick={() => handleChange('breathPauses', !pacing.breathPauses)}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            pacing.breathPauses ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        >
          <motion.div
            className="absolute top-1 w-4 h-4 bg-white rounded-full"
            animate={{ left: pacing.breathPauses ? '24px' : '4px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Preview Summary */}
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/50">
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>Speed:</span>
            <span className="text-slate-300">{getSpeedLabel(pacing.speed)}</span>
          </div>
          <div className="flex justify-between">
            <span>Sentence pause:</span>
            <span className="text-slate-300">{pacing.pauseBetweenSentences}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Clause pause:</span>
            <span className="text-slate-300">{pacing.pauseBetweenClauses}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Variation:</span>
            <span className="text-slate-300">{getVariationLabel(pacing.naturalVariation)}</span>
          </div>
          <div className="flex justify-between">
            <span>Breath pauses:</span>
            <span className="text-slate-300">{pacing.breathPauses ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
