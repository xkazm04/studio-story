/**
 * AgeProgressor - Age progression controls for character avatars
 * Design: Clean Manuscript style with cyan accents
 *
 * Provides age stage selection, estimated age input, and aging prompt modifiers
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Baby,
  Sparkles,
  User,
  UserCog,
  UserX,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Wand2,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { AgeStage } from '@/app/hooks/integration/useAvatarTimeline';

// ============================================================================
// Types
// ============================================================================

export interface AgeProgressorProps {
  currentStage: AgeStage | null;
  estimatedAge: number | null;
  onStageChange: (stage: AgeStage) => void;
  onAgeChange: (age: number) => void;
  onGenerateAged?: (stage: AgeStage, age: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

interface AgingModifier {
  stage: AgeStage;
  physicalChanges: string[];
  facialChanges: string[];
  promptModifier: string;
}

// ============================================================================
// Constants
// ============================================================================

const AGE_STAGES: {
  stage: AgeStage;
  label: string;
  ageRange: [number, number];
  icon: React.ReactNode;
  description: string;
  color: string;
}[] = [
  {
    stage: 'child',
    label: 'Child',
    ageRange: [4, 12],
    icon: <Baby size={16} />,
    description: 'Youthful features, round face',
    color: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
  },
  {
    stage: 'teen',
    label: 'Teen',
    ageRange: [13, 19],
    icon: <Sparkles size={16} />,
    description: 'Developing features, adolescent traits',
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  },
  {
    stage: 'young_adult',
    label: 'Young Adult',
    ageRange: [20, 35],
    icon: <User size={16} />,
    description: 'Prime features, full maturity',
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  },
  {
    stage: 'adult',
    label: 'Adult',
    ageRange: [36, 50],
    icon: <UserCog size={16} />,
    description: 'Mature features, subtle aging signs',
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  },
  {
    stage: 'middle_aged',
    label: 'Middle Aged',
    ageRange: [51, 65],
    icon: <UserX size={16} />,
    description: 'Visible aging, distinguished features',
    color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  },
  {
    stage: 'elderly',
    label: 'Elderly',
    ageRange: [66, 100],
    icon: <Clock size={16} />,
    description: 'Advanced aging, wisdom lines',
    color: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
  },
];

const AGING_MODIFIERS: AgingModifier[] = [
  {
    stage: 'child',
    physicalChanges: ['smaller stature', 'soft features', 'round cheeks'],
    facialChanges: ['large eyes proportionally', 'button nose', 'smooth skin'],
    promptModifier: 'young child appearance, round childlike face, large innocent eyes, soft baby fat cheeks, small stature',
  },
  {
    stage: 'teen',
    physicalChanges: ['developing body', 'growth spurt', 'maturing features'],
    facialChanges: ['less baby fat', 'more defined jawline', 'clear skin'],
    promptModifier: 'teenage appearance, adolescent features, developing jawline, youthful energy, maturing face shape',
  },
  {
    stage: 'young_adult',
    physicalChanges: ['fully developed physique', 'prime condition', 'athletic potential'],
    facialChanges: ['defined features', 'clear complexion', 'sharp jawline'],
    promptModifier: 'young adult appearance, fully developed features, peak physical condition, defined jawline, clear skin',
  },
  {
    stage: 'adult',
    physicalChanges: ['mature body', 'settled physique', 'subtle changes'],
    facialChanges: ['light expression lines', 'mature gaze', 'subtle crow feet'],
    promptModifier: 'mature adult appearance, subtle aging signs, light expression lines around eyes, experienced gaze, refined features',
  },
  {
    stage: 'middle_aged',
    physicalChanges: ['softening body', 'weight changes', 'reduced muscle tone'],
    facialChanges: ['deeper lines', 'graying hair', 'sagging skin'],
    promptModifier: 'middle aged appearance, distinguished graying hair, deeper expression lines, mature face with wisdom, slight skin loosening',
  },
  {
    stage: 'elderly',
    physicalChanges: ['frail frame', 'stooped posture', 'thin limbs'],
    facialChanges: ['deep wrinkles', 'white hair', 'age spots', 'sunken cheeks'],
    promptModifier: 'elderly appearance, white or gray hair, deep wrinkles and age lines, wisdom in eyes, weathered skin with age spots, thinner face',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getAgingModifier(stage: AgeStage): AgingModifier {
  return AGING_MODIFIERS.find((m) => m.stage === stage) || AGING_MODIFIERS[2];
}

export function buildAgePrompt(stage: AgeStage, specificAge?: number): string {
  const modifier = getAgingModifier(stage);
  if (specificAge) {
    return `${modifier.promptModifier}, approximately ${specificAge} years old`;
  }
  return modifier.promptModifier;
}

export function getStageFromAge(age: number): AgeStage {
  for (const config of AGE_STAGES) {
    if (age >= config.ageRange[0] && age <= config.ageRange[1]) {
      return config.stage;
    }
  }
  return age < 4 ? 'child' : 'elderly';
}

// ============================================================================
// Main Component
// ============================================================================

const AgeProgressor: React.FC<AgeProgressorProps> = ({
  currentStage,
  estimatedAge,
  onStageChange,
  onAgeChange,
  onGenerateAged,
  disabled = false,
  compact = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState<NodeJS.Timeout | null>(null);

  // Get current stage config
  const currentConfig = useMemo(() => {
    return AGE_STAGES.find((s) => s.stage === currentStage) || AGE_STAGES[2];
  }, [currentStage]);

  // Get current modifier
  const currentModifier = useMemo(() => {
    return currentStage ? getAgingModifier(currentStage) : null;
  }, [currentStage]);

  // Navigate between stages
  const navigateStage = (direction: 'prev' | 'next') => {
    const currentIndex = AGE_STAGES.findIndex((s) => s.stage === currentStage);
    if (direction === 'prev' && currentIndex > 0) {
      const newStage = AGE_STAGES[currentIndex - 1];
      onStageChange(newStage.stage);
      onAgeChange(Math.round((newStage.ageRange[0] + newStage.ageRange[1]) / 2));
    } else if (direction === 'next' && currentIndex < AGE_STAGES.length - 1) {
      const newStage = AGE_STAGES[currentIndex + 1];
      onStageChange(newStage.stage);
      onAgeChange(Math.round((newStage.ageRange[0] + newStage.ageRange[1]) / 2));
    }
  };

  // Auto-play through stages
  const toggleAutoPlay = () => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      setAutoPlayInterval(null);
    } else {
      const interval = setInterval(() => {
        const currentIndex = AGE_STAGES.findIndex((s) => s.stage === currentStage);
        if (currentIndex < AGE_STAGES.length - 1) {
          navigateStage('next');
        } else {
          clearInterval(interval);
          setAutoPlayInterval(null);
        }
      }, 2000);
      setAutoPlayInterval(interval);
    }
  };

  // Reset to young adult
  const resetAge = () => {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      setAutoPlayInterval(null);
    }
    onStageChange('young_adult');
    onAgeChange(25);
  };

  // Handle age input change
  const handleAgeInput = (value: number) => {
    onAgeChange(value);
    const newStage = getStageFromAge(value);
    if (newStage !== currentStage) {
      onStageChange(newStage);
    }
  };

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
            age
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateStage('prev')}
            disabled={disabled || currentStage === 'child'}
            className={cn(
              'p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <ChevronLeft size={14} />
          </button>

          <div className={cn(
            'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded border',
            currentConfig.color
          )}>
            {currentConfig.icon}
            <span className="font-mono text-xs">{currentConfig.label}</span>
          </div>

          <button
            onClick={() => navigateStage('next')}
            disabled={disabled || currentStage === 'elderly'}
            className={cn(
              'p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <ChevronRight size={14} />
          </button>
        </div>
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
            age_progressor
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleAutoPlay}
            disabled={disabled}
            className={cn(
              'p-1.5 rounded transition-colors',
              autoPlayInterval
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-800/40 text-slate-400 hover:bg-slate-700/60'
            )}
            title={autoPlayInterval ? 'Pause' : 'Auto-play through ages'}
          >
            {autoPlayInterval ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={resetAge}
            disabled={disabled}
            className="p-1.5 rounded bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors"
            title="Reset to young adult"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'p-1.5 rounded transition-colors',
              showAdvanced
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-800/40 text-slate-400 hover:bg-slate-700/60'
            )}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Stage Selector */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigateStage('prev')}
          disabled={disabled || currentStage === 'child'}
          className={cn(
            'p-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 grid grid-cols-6 gap-1">
          {AGE_STAGES.map((config) => {
            const isActive = config.stage === currentStage;
            return (
              <button
                key={config.stage}
                onClick={() => {
                  onStageChange(config.stage);
                  onAgeChange(Math.round((config.ageRange[0] + config.ageRange[1]) / 2));
                }}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center p-2 rounded-lg border transition-all',
                  isActive
                    ? config.color
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className={isActive ? '' : 'opacity-60'}>{config.icon}</span>
                <span className="font-mono text-[9px] mt-1 truncate w-full text-center">
                  {config.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigateStage('next')}
          disabled={disabled || currentStage === 'elderly'}
          className={cn(
            'p-2 rounded-lg bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Current Stage Info */}
      <div className={cn(
        'p-3 rounded-lg border mb-4',
        currentConfig.color
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {currentConfig.icon}
            <span className="font-mono text-sm">{currentConfig.label}</span>
          </div>
          <span className="font-mono text-xs opacity-70">
            {currentConfig.ageRange[0]}-{currentConfig.ageRange[1]} years
          </span>
        </div>
        <p className="font-mono text-xs opacity-70">{currentConfig.description}</p>
      </div>

      {/* Age Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs text-slate-400 uppercase">
            specific_age
          </span>
          <span className="font-mono text-sm text-slate-300">
            {estimatedAge || '--'} years
          </span>
        </div>

        <input
          type="range"
          min={4}
          max={100}
          value={estimatedAge || 25}
          onChange={(e) => handleAgeInput(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                     disabled:opacity-50"
        />

        <div className="flex justify-between mt-1">
          <span className="font-mono text-[10px] text-slate-600">4</span>
          <span className="font-mono text-[10px] text-slate-600">100</span>
        </div>
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvanced && currentModifier && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/50 pt-4"
          >
            {/* Physical Changes */}
            <div className="mb-3">
              <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
                physical_changes
              </span>
              <div className="flex flex-wrap gap-1">
                {currentModifier.physicalChanges.map((change, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-400"
                  >
                    {change}
                  </span>
                ))}
              </div>
            </div>

            {/* Facial Changes */}
            <div className="mb-3">
              <span className="font-mono text-[10px] text-slate-500 uppercase block mb-2">
                facial_changes
              </span>
              <div className="flex flex-wrap gap-1">
                {currentModifier.facialChanges.map((change, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-400"
                  >
                    {change}
                  </span>
                ))}
              </div>
            </div>

            {/* Prompt Preview */}
            <div className="p-2 bg-slate-800/40 rounded border border-slate-700/30">
              <span className="font-mono text-[10px] text-slate-500 uppercase block mb-1">
                prompt_modifier
              </span>
              <p className="font-mono text-[10px] text-slate-400 leading-relaxed">
                {buildAgePrompt(currentModifier.stage, estimatedAge || undefined)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Button */}
      {onGenerateAged && currentStage && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <button
            onClick={() => onGenerateAged(currentStage, estimatedAge || 25)}
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
              'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400',
              'font-mono text-xs transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <Wand2 size={14} />
            <span>Generate Aged Version</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AgeProgressor;
