/**
 * PremiseBuilder
 * Structured premise creation component with who/what/why/stakes format
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  User,
  Target,
  Heart,
  AlertTriangle,
  Swords,
  MapPin,
  Sparkles,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Edit2,
  Eye,
  Copy,
  Lightbulb,
} from 'lucide-react';
import {
  type StoryPremise,
  type ConflictType,
  CONFLICT_TYPES,
  ThemeTracker,
} from '@/lib/themes/ThemeTracker';

interface PremiseBuilderProps {
  projectId: string;
  initialPremise?: StoryPremise | null;
  onSave?: (premise: StoryPremise) => void;
  onChange?: (premise: Partial<StoryPremise>) => void;
  compact?: boolean;
}

// Premise component configuration
const PREMISE_COMPONENTS = {
  protagonist: {
    label: 'Protagonist',
    icon: User,
    placeholder: 'Who is your story about?',
    description: 'The main character driving the story',
    examples: ['A young wizard', 'A retired detective', 'An AI gaining consciousness'],
  },
  goal: {
    label: 'Goal',
    icon: Target,
    placeholder: 'What do they want to achieve?',
    description: 'The external objective driving the plot',
    examples: ['find their missing sister', 'solve the impossible case', 'understand humanity'],
  },
  motivation: {
    label: 'Motivation',
    icon: Heart,
    placeholder: 'Why do they want this?',
    description: 'The internal reason behind their pursuit',
    examples: ['to heal a family wound', 'to prove their worth', 'to find meaning in existence'],
  },
  stakes: {
    label: 'Stakes',
    icon: AlertTriangle,
    placeholder: 'What happens if they fail?',
    description: 'The consequences of failure',
    examples: ['their sister will die', 'an innocent will be executed', 'they will be shut down forever'],
  },
  antagonist: {
    label: 'Opposition',
    icon: Swords,
    placeholder: 'Who or what opposes them?',
    description: 'The force creating conflict (optional)',
    examples: ['a dark sorcerer', 'the corrupt system', 'their own programming'],
  },
  setting: {
    label: 'Setting',
    icon: MapPin,
    placeholder: 'Where and when?',
    description: 'The time and place of the story (optional)',
    examples: ['modern-day Tokyo', 'a Victorian steampunk London', 'a space station in 2150'],
  },
};

// Individual premise field input
function PremiseField({
  field,
  value,
  onChange,
  showExamples,
}: {
  field: keyof typeof PREMISE_COMPONENTS;
  value: string;
  onChange: (value: string) => void;
  showExamples?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const config = PREMISE_COMPONENTS[field];
  const Icon = config.icon;

  const isOptional = field === 'antagonist' || field === 'setting';
  const isFilled = value.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
        <Icon className="w-3.5 h-3.5 text-cyan-400" />
        {config.label}
        {isOptional && <span className="text-slate-500">(optional)</span>}
        {isFilled && <CheckCircle className="w-3 h-3 text-green-400" />}
      </label>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={config.placeholder}
          className={cn(
            'w-full px-3 py-2 bg-slate-900/50 border rounded-lg',
            'text-sm text-slate-200 placeholder-slate-500',
            'focus:outline-none resize-none transition-colors',
            focused
              ? 'border-cyan-500/50 bg-slate-900/70'
              : 'border-slate-700 hover:border-slate-600'
          )}
          rows={2}
        />

        {/* Helper text */}
        <p className="text-[10px] text-slate-500 mt-1">{config.description}</p>

        {/* Examples button */}
        {showExamples && !value && (
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="absolute right-2 top-2 p-1 rounded text-slate-400 hover:text-cyan-400 transition-colors"
            title="Show examples"
          >
            <Lightbulb className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Examples dropdown */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute z-10 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-2 text-xs text-slate-400 border-b border-slate-700">
                Example ideas:
              </div>
              {config.examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onChange(example);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-700/50 transition-colors"
                >
                  {example}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Conflict type selector
function ConflictSelector({
  value,
  onChange,
}: {
  value?: ConflictType;
  onChange: (value: ConflictType) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
        <Swords className="w-3.5 h-3.5 text-cyan-400" />
        Conflict Type
        <span className="text-slate-500">(optional)</span>
      </label>

      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg border',
          'text-sm text-left transition-colors',
          value
            ? 'bg-slate-800/50 border-cyan-500/30 text-slate-200'
            : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
        )}
      >
        <span>{value ? CONFLICT_TYPES[value].label : 'Select conflict type...'}</span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          expanded && 'rotate-180'
        )} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-1 pt-1">
              {(Object.entries(CONFLICT_TYPES) as [ConflictType, typeof CONFLICT_TYPES.person_vs_person][]).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => {
                    onChange(type);
                    setExpanded(false);
                  }}
                  className={cn(
                    'px-2 py-1.5 rounded text-xs text-left transition-colors',
                    value === type
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800/50 text-slate-300 border border-transparent hover:bg-slate-700/50'
                  )}
                >
                  <div className="font-medium">{info.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{info.description}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Generated premise statement display
function PremiseStatement({
  premise,
  tracker,
  onEdit,
}: {
  premise: Partial<StoryPremise>;
  tracker: ThemeTracker;
  onEdit?: () => void;
}) {
  const statement = useMemo(() => {
    return tracker.generatePremiseStatement(premise);
  }, [premise, tracker]);

  const isComplete = premise.protagonist && premise.goal && premise.motivation && premise.stakes;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(statement);
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      isComplete
        ? 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30'
        : 'bg-slate-800/30 border-slate-700/50'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className={cn(
            'w-4 h-4',
            isComplete ? 'text-cyan-400' : 'text-slate-500'
          )} />
          <span className="text-xs font-medium text-slate-300">Premise Statement</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copyToClipboard}
            className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              title="Edit premise"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className={cn(
        'text-sm leading-relaxed',
        isComplete ? 'text-slate-200' : 'text-slate-400 italic'
      )}>
        {isComplete ? statement : 'Complete all required fields to generate your premise statement.'}
      </p>

      {isComplete && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700/50">
          <CheckCircle className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-green-400">Premise complete</span>
        </div>
      )}
    </div>
  );
}

export default function PremiseBuilder({
  projectId,
  initialPremise,
  onSave,
  onChange,
  compact = false,
}: PremiseBuilderProps) {
  // Initialize tracker
  const tracker = useMemo(() => new ThemeTracker(), []);

  // Premise state
  const [premise, setPremise] = useState<Partial<StoryPremise>>({
    projectId,
    protagonist: initialPremise?.protagonist || '',
    goal: initialPremise?.goal || '',
    motivation: initialPremise?.motivation || '',
    stakes: initialPremise?.stakes || '',
    antagonist: initialPremise?.antagonist || '',
    setting: initialPremise?.setting || '',
    conflict: initialPremise?.conflict,
  });

  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update handler
  const updateField = useCallback((field: keyof StoryPremise, value: string | ConflictType) => {
    setPremise(prev => {
      const updated = { ...prev, [field]: value };
      onChange?.(updated);
      setHasChanges(true);
      return updated;
    });
  }, [onChange]);

  // Completion status
  const completionStatus = useMemo(() => {
    const required = ['protagonist', 'goal', 'motivation', 'stakes'] as const;
    const filledRequired = required.filter(f => (premise[f] || '').trim().length > 0);
    return {
      requiredCount: required.length,
      filledCount: filledRequired.length,
      isComplete: filledRequired.length === required.length,
      percentage: Math.round((filledRequired.length / required.length) * 100),
    };
  }, [premise]);

  // Save handler
  const handleSave = useCallback(() => {
    if (!completionStatus.isComplete) return;

    const fullPremise: StoryPremise = {
      id: initialPremise?.id || `premise-${Date.now()}`,
      projectId,
      protagonist: premise.protagonist || '',
      goal: premise.goal || '',
      motivation: premise.motivation || '',
      stakes: premise.stakes || '',
      antagonist: premise.antagonist,
      setting: premise.setting,
      conflict: premise.conflict,
      statement: tracker.generatePremiseStatement(premise),
      createdAt: initialPremise?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave?.(fullPremise);
    setHasChanges(false);
  }, [premise, completionStatus.isComplete, initialPremise, projectId, tracker, onSave]);

  // Reset handler
  const handleReset = useCallback(() => {
    setPremise({
      projectId,
      protagonist: initialPremise?.protagonist || '',
      goal: initialPremise?.goal || '',
      motivation: initialPremise?.motivation || '',
      stakes: initialPremise?.stakes || '',
      antagonist: initialPremise?.antagonist || '',
      setting: initialPremise?.setting || '',
      conflict: initialPremise?.conflict,
    });
    setHasChanges(false);
  }, [initialPremise, projectId]);

  if (compact) {
    return (
      <div className="space-y-3">
        <PremiseStatement
          premise={premise}
          tracker={tracker}
          onEdit={() => setMode('edit')}
        />
        {mode === 'edit' && (
          <div className="text-xs text-slate-500 text-center">
            Click to expand and edit premise
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-slate-200">Story Premise</h3>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-24 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                style={{ width: `${completionStatus.percentage}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">
              {completionStatus.filledCount}/{completionStatus.requiredCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
            className={cn(
              'p-1.5 rounded transition-colors',
              mode === 'preview'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'hover:bg-slate-700/50 text-slate-400 hover:text-slate-200'
            )}
            title={mode === 'edit' ? 'Preview' : 'Edit'}
          >
            {mode === 'edit' ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          </button>

          {hasChanges && (
            <button
              onClick={handleReset}
              className="p-1.5 rounded hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset changes"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {onSave && (
            <button
              onClick={handleSave}
              disabled={!completionStatus.isComplete || !hasChanges}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                completionStatus.isComplete && hasChanges
                  ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              )}
            >
              <Save className="w-3.5 h-3.5" />
              Save
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {mode === 'preview' ? (
        <PremiseStatement
          premise={premise}
          tracker={tracker}
          onEdit={() => setMode('edit')}
        />
      ) : (
        <div className="space-y-4">
          {/* Required fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PremiseField
              field="protagonist"
              value={premise.protagonist || ''}
              onChange={(v) => updateField('protagonist', v)}
              showExamples
            />
            <PremiseField
              field="goal"
              value={premise.goal || ''}
              onChange={(v) => updateField('goal', v)}
              showExamples
            />
            <PremiseField
              field="motivation"
              value={premise.motivation || ''}
              onChange={(v) => updateField('motivation', v)}
              showExamples
            />
            <PremiseField
              field="stakes"
              value={premise.stakes || ''}
              onChange={(v) => updateField('stakes', v)}
              showExamples
            />
          </div>

          {/* Advanced/Optional fields toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronRight className={cn(
              'w-3.5 h-3.5 transition-transform',
              showAdvanced && 'rotate-90'
            )} />
            Additional details (optional)
          </button>

          {/* Optional fields */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PremiseField
                    field="antagonist"
                    value={premise.antagonist || ''}
                    onChange={(v) => updateField('antagonist', v)}
                    showExamples
                  />
                  <PremiseField
                    field="setting"
                    value={premise.setting || ''}
                    onChange={(v) => updateField('setting', v)}
                    showExamples
                  />
                </div>
                <ConflictSelector
                  value={premise.conflict as ConflictType | undefined}
                  onChange={(v) => updateField('conflict', v)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generated statement preview */}
          {completionStatus.percentage >= 50 && (
            <PremiseStatement premise={premise} tracker={tracker} />
          )}
        </div>
      )}
    </div>
  );
}

// Compact display for read-only premise
export function PremiseDisplay({
  premise,
}: {
  premise: StoryPremise;
}) {
  const tracker = useMemo(() => new ThemeTracker(), []);
  const statement = tracker.generatePremiseStatement(premise);

  return (
    <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-medium text-slate-300">Premise</span>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed">{statement}</p>
    </div>
  );
}
