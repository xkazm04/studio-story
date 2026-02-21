/**
 * TransformationTracker - Track and manage character visual transformations
 * Design: Clean Manuscript style with cyan accents
 *
 * Provides UI for recording injuries, healing, magical changes, and other transformations
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Heart,
  Skull,
  Sparkles,
  Shield,
  Users,
  Star,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  Trash2,
  Eye,
  Save,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type {
  TransformationType,
  VisualChange,
} from '@/app/hooks/integration/useAvatarTimeline';

// ============================================================================
// Types
// ============================================================================

export interface TransformationTrackerProps {
  transformationType: TransformationType;
  onTypeChange: (type: TransformationType) => void;
  visualChanges: VisualChange[];
  onChangesUpdate: (changes: VisualChange[]) => void;
  trigger: string;
  onTriggerChange: (trigger: string) => void;
  isMilestone: boolean;
  onMilestoneChange: (value: boolean) => void;
  onSave?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const TRANSFORMATION_TYPES: {
  type: TransformationType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  suggestedChanges: string[];
}[] = [
  {
    type: 'initial',
    label: 'Initial',
    description: 'First appearance / baseline',
    icon: <Star size={16} />,
    color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
    suggestedChanges: ['overall appearance', 'age', 'expression', 'clothing'],
  },
  {
    type: 'natural_aging',
    label: 'Aging',
    description: 'Natural passage of time',
    icon: <Clock size={16} />,
    color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    suggestedChanges: ['wrinkles', 'hair color', 'skin texture', 'posture', 'eye appearance'],
  },
  {
    type: 'injury',
    label: 'Injury',
    description: 'Physical damage or wound',
    icon: <Skull size={16} />,
    color: 'text-red-400 bg-red-500/20 border-red-500/30',
    suggestedChanges: ['scar', 'bruise', 'bandage', 'missing limb', 'black eye', 'cut'],
  },
  {
    type: 'healing',
    label: 'Healing',
    description: 'Recovery from injury',
    icon: <Heart size={16} />,
    color: 'text-green-400 bg-green-500/20 border-green-500/30',
    suggestedChanges: ['scar fading', 'bruise healing', 'cast removed', 'strength returning'],
  },
  {
    type: 'magical',
    label: 'Magical',
    description: 'Supernatural transformation',
    icon: <Sparkles size={16} />,
    color: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    suggestedChanges: ['glowing eyes', 'ethereal aura', 'changed hair', 'markings', 'transformation'],
  },
  {
    type: 'costume_change',
    label: 'Costume',
    description: 'Outfit or appearance change',
    icon: <Users size={16} />,
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    suggestedChanges: ['outfit', 'armor', 'accessories', 'hairstyle', 'makeup'],
  },
  {
    type: 'emotional',
    label: 'Emotional',
    description: 'Psychological impact on appearance',
    icon: <Zap size={16} />,
    color: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
    suggestedChanges: ['expression', 'posture', 'eye intensity', 'demeanor', 'aura'],
  },
  {
    type: 'custom',
    label: 'Custom',
    description: 'Other transformation type',
    icon: <Shield size={16} />,
    color: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
    suggestedChanges: [],
  },
];

const COMMON_ATTRIBUTES = [
  'hair_color',
  'hair_style',
  'eye_color',
  'skin_tone',
  'facial_hair',
  'expression',
  'posture',
  'clothing',
  'accessories',
  'scars',
  'tattoos',
  'markings',
  'aura',
  'physique',
  'age_appearance',
];

// ============================================================================
// Subcomponents
// ============================================================================

interface VisualChangeEditorProps {
  change: VisualChange;
  onChange: (updated: VisualChange) => void;
  onDelete: () => void;
  suggestions: string[];
}

const VisualChangeEditor: React.FC<VisualChangeEditorProps> = ({
  change,
  onChange,
  onDelete,
  suggestions,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  return (
    <div className="flex items-start gap-2 p-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
      <div className="flex-1 space-y-2">
        {/* Attribute */}
        <div className="relative">
          <input
            type="text"
            value={change.attribute}
            onChange={(e) => onChange({ ...change, attribute: e.target.value })}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Attribute"
            className="w-full px-2 py-1 bg-slate-900/50 border border-slate-700/50 rounded
                       font-mono text-xs text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 py-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-32 overflow-y-auto">
              {suggestions.filter(s =>
                !change.attribute || s.toLowerCase().includes(change.attribute.toLowerCase())
              ).slice(0, 6).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onChange({ ...change, attribute: suggestion })}
                  className="w-full px-2 py-1 text-left font-mono text-xs text-slate-400 hover:bg-slate-700/50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* From/To */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={change.from || ''}
            onChange={(e) => onChange({ ...change, from: e.target.value })}
            placeholder="From (optional)"
            className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-700/50 rounded
                       font-mono text-[10px] text-slate-400 placeholder:text-slate-600
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
          <span className="text-slate-600 text-xs">→</span>
          <input
            type="text"
            value={change.to}
            onChange={(e) => onChange({ ...change, to: e.target.value })}
            placeholder="To"
            className="flex-1 px-2 py-1 bg-slate-900/50 border border-slate-700/50 rounded
                       font-mono text-[10px] text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        {/* Reason */}
        <input
          type="text"
          value={change.reason || ''}
          onChange={(e) => onChange({ ...change, reason: e.target.value })}
          placeholder="Reason (optional)"
          className="w-full px-2 py-1 bg-slate-900/50 border border-slate-700/50 rounded
                     font-mono text-[10px] text-slate-500 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
      </div>

      <button
        onClick={onDelete}
        className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const TransformationTracker: React.FC<TransformationTrackerProps> = ({
  transformationType,
  onTypeChange,
  visualChanges,
  onChangesUpdate,
  trigger,
  onTriggerChange,
  isMilestone,
  onMilestoneChange,
  onSave,
  disabled = false,
  compact = false,
}) => {
  const [expandedSection, setExpandedSection] = useState<'type' | 'changes' | 'details' | null>(
    compact ? null : 'type'
  );

  // Get current type config
  const currentTypeConfig = useMemo(() => {
    return TRANSFORMATION_TYPES.find((t) => t.type === transformationType) || TRANSFORMATION_TYPES[7];
  }, [transformationType]);

  // Add a new visual change
  const addVisualChange = () => {
    const newChange: VisualChange = {
      attribute: '',
      to: '',
    };
    onChangesUpdate([...visualChanges, newChange]);
  };

  // Update a visual change
  const updateVisualChange = (index: number, updated: VisualChange) => {
    const newChanges = [...visualChanges];
    newChanges[index] = updated;
    onChangesUpdate(newChanges);
  };

  // Delete a visual change
  const deleteVisualChange = (index: number) => {
    const newChanges = visualChanges.filter((_, i) => i !== index);
    onChangesUpdate(newChanges);
  };

  // Add suggested change
  const addSuggestedChange = (attribute: string) => {
    const newChange: VisualChange = {
      attribute,
      to: '',
    };
    onChangesUpdate([...visualChanges, newChange]);
  };

  const toggleSection = (section: 'type' | 'changes' | 'details') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
            transformation
          </h3>
        </div>

        {/* Type selector (compact) */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TRANSFORMATION_TYPES.slice(0, 6).map((config) => {
            const isSelected = config.type === transformationType;
            return (
              <button
                key={config.type}
                onClick={() => onTypeChange(config.type)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-all',
                  isSelected ? config.color : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-600',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {config.icon}
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Trigger input */}
        <input
          type="text"
          value={trigger}
          onChange={(e) => onTriggerChange(e.target.value)}
          disabled={disabled}
          placeholder="What caused this change?"
          className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                     disabled:opacity-50"
        />
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
            transformation_tracker
          </h3>
        </div>

        {/* Milestone toggle */}
        <button
          onClick={() => onMilestoneChange(!isMilestone)}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg border font-mono text-xs transition-colors',
            isMilestone
              ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Star size={12} />
          <span>Milestone</span>
        </button>
      </div>

      {/* Type Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('type')}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={cn('p-1 rounded', currentTypeConfig.color)}>
              {currentTypeConfig.icon}
            </span>
            <span className="font-mono text-xs text-slate-300">{currentTypeConfig.label}</span>
          </div>
          {expandedSection === 'type' ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'type' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              {TRANSFORMATION_TYPES.map((config) => {
                const isSelected = config.type === transformationType;
                return (
                  <button
                    key={config.type}
                    onClick={() => onTypeChange(config.type)}
                    disabled={disabled}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-lg border transition-all text-center',
                      isSelected
                        ? config.color
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:border-slate-600',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span className={isSelected ? '' : 'opacity-60'}>{config.icon}</span>
                    <span className="font-mono text-[10px] mt-1">{config.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trigger Input */}
      <div className="mb-4">
        <label className="block font-mono text-[10px] text-slate-500 uppercase mb-1">
          transformation_trigger
        </label>
        <input
          type="text"
          value={trigger}
          onChange={(e) => onTriggerChange(e.target.value)}
          disabled={disabled}
          placeholder="What caused this transformation?"
          className="w-full px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300 placeholder:text-slate-600
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50
                     disabled:opacity-50"
        />
      </div>

      {/* Visual Changes Section */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('changes')}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Edit3 size={14} className="text-cyan-400" />
            <span className="font-mono text-xs text-slate-300">
              Visual Changes ({visualChanges.length})
            </span>
          </div>
          {expandedSection === 'changes' ? (
            <ChevronUp size={14} className="text-slate-500" />
          ) : (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {expandedSection === 'changes' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2"
            >
              {/* Suggested changes */}
              {currentTypeConfig.suggestedChanges.length > 0 && (
                <div className="p-2 bg-slate-800/20 rounded border border-slate-700/30">
                  <span className="font-mono text-[9px] text-slate-600 uppercase block mb-1">
                    quick_add
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentTypeConfig.suggestedChanges.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => addSuggestedChange(suggestion)}
                        disabled={disabled}
                        className="px-2 py-0.5 bg-slate-700/50 hover:bg-slate-600/50 rounded
                                   text-[10px] font-mono text-slate-400 transition-colors"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Change editors */}
              {visualChanges.map((change, index) => (
                <VisualChangeEditor
                  key={index}
                  change={change}
                  onChange={(updated) => updateVisualChange(index, updated)}
                  onDelete={() => deleteVisualChange(index)}
                  suggestions={COMMON_ATTRIBUTES}
                />
              ))}

              {/* Add button */}
              <button
                onClick={addVisualChange}
                disabled={disabled}
                className={cn(
                  'w-full flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-dashed',
                  'border-slate-700/50 hover:border-cyan-500/30 text-slate-500 hover:text-cyan-400',
                  'font-mono text-xs transition-colors',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                <Plus size={14} />
                <span>Add Visual Change</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Button */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={disabled || !trigger || visualChanges.length === 0}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
            'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400',
            'font-mono text-xs transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <Save size={14} />
          <span>Save Transformation</span>
        </button>
      )}
    </div>
  );
};

export default TransformationTracker;
