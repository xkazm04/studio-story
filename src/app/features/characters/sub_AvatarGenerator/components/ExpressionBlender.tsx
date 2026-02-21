/**
 * ExpressionBlender - Combine multiple emotions intelligently
 * Design: Clean Manuscript style with cyan accents
 *
 * Allows blending 2-3 expressions with weight sliders to create unique mixed emotions
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Blend,
  Plus,
  X,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Copy,
  Sliders,
  Eye,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Expression, EXPRESSION_LIBRARY, buildExpressionPrompt } from './ExpressionLibrary';

// ============================================================================
// Types
// ============================================================================

export interface BlendedExpression {
  expression: Expression;
  weight: number; // 0-100
}

export interface BlendResult {
  id: string;
  components: BlendedExpression[];
  combinedPrompt: string;
  name: string;
  previewUrl?: string;
}

export interface ExpressionBlenderProps {
  onBlendComplete?: (result: BlendResult) => void;
  onPromptGenerated?: (prompt: string) => void;
  disabled?: boolean;
  maxExpressions?: number;
}

// ============================================================================
// Constants
// ============================================================================

const BLEND_PRESETS = [
  {
    id: 'bittersweet',
    name: 'Bittersweet',
    description: 'Happy yet sad',
    components: [
      { expressionId: 'happy', weight: 60 },
      { expressionId: 'sad', weight: 40 },
    ],
  },
  {
    id: 'nervous_excitement',
    name: 'Nervous Excitement',
    description: 'Excited but fearful',
    components: [
      { expressionId: 'excited', weight: 55 },
      { expressionId: 'fearful', weight: 45 },
    ],
  },
  {
    id: 'determined_anger',
    name: 'Righteous Fury',
    description: 'Determined with anger',
    components: [
      { expressionId: 'determined', weight: 50 },
      { expressionId: 'angry', weight: 50 },
    ],
  },
  {
    id: 'mysterious_confidence',
    name: 'Enigmatic Poise',
    description: 'Confident yet mysterious',
    components: [
      { expressionId: 'confident', weight: 50 },
      { expressionId: 'mysterious', weight: 50 },
    ],
  },
  {
    id: 'melancholic_hope',
    name: 'Melancholic Hope',
    description: 'Sad with a glimmer of hope',
    components: [
      { expressionId: 'sad', weight: 60 },
      { expressionId: 'serene', weight: 30 },
      { expressionId: 'thoughtful', weight: 10 },
    ],
  },
];

const COMPATIBILITY_WARNINGS: Record<string, string[]> = {
  happy: ['sad', 'angry', 'fearful'],
  sad: ['happy', 'excited'],
  angry: ['happy', 'loving', 'serene'],
  excited: ['sad', 'fearful', 'serene'],
  fearful: ['confident', 'excited'],
};

// ============================================================================
// Helper Functions
// ============================================================================

function getExpressionById(id: string): Expression | undefined {
  return EXPRESSION_LIBRARY.find(e => e.id === id);
}

function normalizeWeights(components: BlendedExpression[]): BlendedExpression[] {
  const total = components.reduce((sum, c) => sum + c.weight, 0);
  if (total === 0 || total === 100) return components;

  return components.map(c => ({
    ...c,
    weight: Math.round((c.weight / total) * 100),
  }));
}

function buildBlendedPrompt(components: BlendedExpression[], intensity: number = 50): string {
  if (components.length === 0) return '';

  const normalized = normalizeWeights(components);
  const parts: string[] = [];

  // Sort by weight descending
  const sorted = [...normalized].sort((a, b) => b.weight - a.weight);

  sorted.forEach((comp, index) => {
    const weightModifier = comp.weight >= 60 ? 'predominantly' :
      comp.weight >= 40 ? 'balanced' :
        comp.weight >= 20 ? 'subtle hint of' : 'trace of';

    const expPrompt = buildExpressionPrompt(comp.expression, intensity * (comp.weight / 100));

    if (index === 0) {
      parts.push(`${weightModifier} ${expPrompt}`);
    } else {
      parts.push(`with ${weightModifier} ${expPrompt}`);
    }
  });

  return `blended expression: ${parts.join(', ')}`;
}

function checkCompatibility(components: BlendedExpression[]): string[] {
  const warnings: string[] = [];

  for (let i = 0; i < components.length; i++) {
    const expId = components[i].expression.id;
    const incompatible = COMPATIBILITY_WARNINGS[expId] || [];

    for (let j = i + 1; j < components.length; j++) {
      if (incompatible.includes(components[j].expression.id)) {
        warnings.push(
          `${components[i].expression.name} and ${components[j].expression.name} may conflict`
        );
      }
    }
  }

  return warnings;
}

// ============================================================================
// Subcomponents
// ============================================================================

interface BlendSliderProps {
  component: BlendedExpression;
  onWeightChange: (weight: number) => void;
  onRemove: () => void;
  disabled?: boolean;
  canRemove?: boolean;
}

const BlendSlider: React.FC<BlendSliderProps> = ({
  component,
  onWeightChange,
  onRemove,
  disabled,
  canRemove = true,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg"
    >
      {/* Expression Info */}
      <div className="flex items-center gap-2 min-w-[100px]">
        <span className={component.expression.color}>
          {component.expression.icon}
        </span>
        <span className="font-mono text-xs uppercase text-slate-300">
          {component.expression.label}
        </span>
      </div>

      {/* Weight Slider */}
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min={5}
          max={95}
          value={component.weight}
          onChange={(e) => onWeightChange(Number(e.target.value))}
          disabled={disabled}
          className={cn(
            'flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        <span className="font-mono text-xs text-cyan-400 w-10 text-right">
          {component.weight}%
        </span>
      </div>

      {/* Remove Button */}
      {canRemove && (
        <button
          onClick={onRemove}
          disabled={disabled}
          className="p-1.5 rounded bg-slate-700/60 hover:bg-red-600/30 text-slate-400
                     hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
};

interface ExpressionPickerProps {
  selectedIds: string[];
  onSelect: (expression: Expression) => void;
  disabled?: boolean;
}

const ExpressionPicker: React.FC<ExpressionPickerProps> = ({
  selectedIds,
  onSelect,
  disabled,
}) => {
  const availableExpressions = EXPRESSION_LIBRARY.filter(
    exp => !selectedIds.includes(exp.id)
  );

  return (
    <div className="grid grid-cols-4 gap-2">
      {availableExpressions.map(exp => (
        <button
          key={exp.id}
          onClick={() => onSelect(exp)}
          disabled={disabled}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
            'bg-slate-800/40 border-slate-700/50 hover:border-cyan-500/40 hover:bg-cyan-500/10',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={exp.color}>{exp.icon}</span>
          <span className="font-mono text-[9px] uppercase text-slate-400">
            {exp.label}
          </span>
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ExpressionBlender: React.FC<ExpressionBlenderProps> = ({
  onBlendComplete,
  onPromptGenerated,
  disabled = false,
  maxExpressions = 3,
}) => {
  // State
  const [components, setComponents] = useState<BlendedExpression[]>([]);
  const [blendIntensity, setBlendIntensity] = useState(50);
  const [showPicker, setShowPicker] = useState(false);
  const [blendName, setBlendName] = useState('');

  // Computed
  const selectedIds = useMemo(() => components.map(c => c.expression.id), [components]);
  const combinedPrompt = useMemo(() => buildBlendedPrompt(components, blendIntensity), [components, blendIntensity]);
  const compatibilityWarnings = useMemo(() => checkCompatibility(components), [components]);
  const canAddMore = components.length < maxExpressions;

  // Handlers
  const addExpression = useCallback((expression: Expression) => {
    if (!canAddMore) return;

    setComponents(prev => {
      const newWeight = Math.round(100 / (prev.length + 1));
      const adjusted = prev.map(c => ({ ...c, weight: newWeight }));
      return [...adjusted, { expression, weight: newWeight }];
    });
    setShowPicker(false);
  }, [canAddMore]);

  const removeExpression = useCallback((index: number) => {
    setComponents(prev => {
      const next = prev.filter((_, i) => i !== index);
      // Redistribute weights
      const newWeight = Math.round(100 / next.length);
      return next.map(c => ({ ...c, weight: newWeight }));
    });
  }, []);

  const updateWeight = useCallback((index: number, weight: number) => {
    setComponents(prev => prev.map((c, i) =>
      i === index ? { ...c, weight } : c
    ));
  }, []);

  const applyPreset = useCallback((preset: typeof BLEND_PRESETS[0]) => {
    const newComponents: BlendedExpression[] = preset.components
      .map(({ expressionId, weight }) => {
        const expression = getExpressionById(expressionId);
        if (!expression) return null;
        return { expression, weight };
      })
      .filter((c): c is BlendedExpression => c !== null);

    setComponents(newComponents);
    setBlendName(preset.name);
  }, []);

  const resetBlend = useCallback(() => {
    setComponents([]);
    setBlendName('');
    setBlendIntensity(50);
  }, []);

  const createBlendResult = useCallback((): BlendResult => {
    return {
      id: `blend-${Date.now()}`,
      components: normalizeWeights(components),
      combinedPrompt,
      name: blendName || 'Custom Blend',
    };
  }, [components, combinedPrompt, blendName]);

  const handleGenerate = useCallback(() => {
    if (components.length < 2) return;

    const result = createBlendResult();
    onBlendComplete?.(result);
    onPromptGenerated?.(combinedPrompt);
  }, [components, createBlendResult, combinedPrompt, onBlendComplete, onPromptGenerated]);

  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(combinedPrompt);
  }, [combinedPrompt]);

  return (
    <div className="p-4 bg-slate-900/60 rounded-lg border border-slate-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-sm uppercase tracking-wide text-slate-300">
            expression_blender
          </h3>
          {components.length >= 2 && (
            <span className="px-2 py-0.5 bg-purple-500/20 rounded text-purple-400 font-mono text-xs">
              {components.length} mixed
            </span>
          )}
        </div>

        {components.length > 0 && (
          <button
            onClick={resetBlend}
            disabled={disabled}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/40
                       text-slate-500 hover:text-slate-300 transition-colors text-xs font-mono
                       disabled:opacity-50"
          >
            <RefreshCw size={12} />
            reset
          </button>
        )}
      </div>

      {/* Presets */}
      <div className="mb-4">
        <span className="font-mono text-[10px] text-slate-500 uppercase mb-2 block">
          blend_presets
        </span>
        <div className="flex flex-wrap gap-2">
          {BLEND_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              disabled={disabled}
              className={cn(
                'px-3 py-1.5 rounded-lg border font-mono text-xs transition-all',
                'bg-slate-800/40 border-slate-700/50 text-slate-300',
                'hover:border-purple-500/40 hover:bg-purple-500/10',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Component Sliders */}
      <div className="space-y-2 mb-4">
        <AnimatePresence>
          {components.map((comp, index) => (
            <BlendSlider
              key={comp.expression.id}
              component={comp}
              onWeightChange={(w) => updateWeight(index, w)}
              onRemove={() => removeExpression(index)}
              disabled={disabled}
              canRemove={components.length > 1}
            />
          ))}
        </AnimatePresence>

        {/* Add Expression Button */}
        {canAddMore && (
          <motion.div layout>
            {showPicker ? (
              <div className="p-3 bg-slate-800/60 border border-cyan-500/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-slate-400 uppercase">
                    add expression
                  </span>
                  <button
                    onClick={() => setShowPicker(false)}
                    className="p-1 text-slate-500 hover:text-slate-300"
                  >
                    <X size={14} />
                  </button>
                </div>
                <ExpressionPicker
                  selectedIds={selectedIds}
                  onSelect={addExpression}
                  disabled={disabled}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowPicker(true)}
                disabled={disabled}
                className={cn(
                  'w-full flex items-center justify-center gap-2 p-3',
                  'border border-dashed border-slate-600 rounded-lg',
                  'font-mono text-xs text-slate-500',
                  'hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/5',
                  'transition-all disabled:opacity-50'
                )}
              >
                <Plus size={14} />
                add expression ({maxExpressions - components.length} remaining)
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Blend Intensity */}
      {components.length >= 2 && (
        <div className="mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs text-slate-500 uppercase flex items-center gap-1">
              <Sliders size={12} />
              blend_intensity
            </span>
            <span className="font-mono text-xs text-cyan-400">{blendIntensity}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={blendIntensity}
            onChange={(e) => setBlendIntensity(Number(e.target.value))}
            disabled={disabled}
            className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400
                       disabled:opacity-50"
          />
        </div>
      )}

      {/* Blend Name */}
      {components.length >= 2 && (
        <div className="mb-4">
          <label className="font-mono text-[10px] text-slate-500 uppercase mb-1 block">
            blend_name (optional)
          </label>
          <input
            type="text"
            value={blendName}
            onChange={(e) => setBlendName(e.target.value)}
            placeholder="e.g., Bittersweet Smile"
            disabled={disabled}
            className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                       disabled:opacity-50"
          />
        </div>
      )}

      {/* Compatibility Warnings */}
      {compatibilityWarnings.length > 0 && (
        <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {compatibilityWarnings.map((warning, i) => (
                <p key={i} className="font-mono text-[10px] text-amber-400/80">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Combined Prompt Preview */}
      {components.length >= 2 && (
        <div className="mb-4 p-3 bg-slate-800/40 rounded border border-slate-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <Eye size={10} />
              combined_prompt
            </span>
            <button
              onClick={copyPrompt}
              className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
              title="Copy to clipboard"
            >
              <Copy size={12} />
            </button>
          </div>
          <p className="font-mono text-[10px] text-slate-400 leading-relaxed">
            {combinedPrompt}
          </p>
        </div>
      )}

      {/* Generate Button */}
      {components.length >= 2 && (
        <button
          onClick={handleGenerate}
          disabled={disabled || components.length < 2}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
            'font-mono text-sm uppercase tracking-wide transition-all',
            'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white',
            'shadow-lg hover:shadow-purple-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
          )}
        >
          <Blend size={16} />
          generate blended expression
        </button>
      )}

      {/* Empty State */}
      {components.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <Blend size={32} className="mb-3 opacity-50" />
          <p className="font-mono text-xs mb-2">No expressions selected</p>
          <p className="font-mono text-[10px] text-center max-w-xs">
            Add 2-3 expressions to blend them into unique mixed emotions
          </p>
        </div>
      )}
    </div>
  );
};

export default ExpressionBlender;
