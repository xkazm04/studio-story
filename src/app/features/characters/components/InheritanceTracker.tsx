'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  GitMerge,
  Pencil,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Sparkles,
  User,
  Shirt,
  FileText,
  Image,
} from 'lucide-react';
import { CharacterArchetype } from '@/app/types/Archetype';
import { Appearance } from '@/app/types/Character';
import { OverrideMask, countOverrides } from '@/app/features/characters/lib/archetypeEngine';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface InheritanceTrackerProps {
  archetype: CharacterArchetype;
  currentAppearance: Appearance;
  overrideMask: OverrideMask;
  onResetField: (field: string, subField?: string) => void;
  onResetAll: () => void;
  backstory?: string;
  motivations?: string;
  personality?: string;
  className?: string;
}

interface FieldStatus {
  field: string;
  subField?: string;
  label: string;
  inheritedValue: string;
  currentValue: string;
  isOverridden: boolean;
  category: 'appearance' | 'face' | 'clothing' | 'story' | 'prompts';
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFieldValue(obj: Record<string, unknown>, path: string): string {
  const value = obj[path];
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

function buildFieldStatuses(
  archetype: CharacterArchetype,
  currentAppearance: Appearance,
  overrideMask: OverrideMask,
  backstory?: string,
  motivations?: string,
  personality?: string
): FieldStatus[] {
  const statuses: FieldStatus[] = [];

  // Top-level appearance fields
  const appearanceFields: Array<{ field: keyof Appearance; label: string }> = [
    { field: 'gender', label: 'Gender' },
    { field: 'age', label: 'Age' },
    { field: 'skinColor', label: 'Skin Color' },
    { field: 'bodyType', label: 'Body Type' },
    { field: 'height', label: 'Height' },
    { field: 'customFeatures', label: 'Custom Features' },
  ];

  appearanceFields.forEach(({ field, label }) => {
    statuses.push({
      field,
      label,
      inheritedValue: getFieldValue(archetype.appearance as unknown as Record<string, unknown>, field),
      currentValue: getFieldValue(currentAppearance as unknown as Record<string, unknown>, field),
      isOverridden: overrideMask[field as keyof OverrideMask] as boolean,
      category: 'appearance',
    });
  });

  // Face fields
  const faceFields: Array<{ subField: keyof typeof archetype.appearance.face; label: string }> = [
    { subField: 'shape', label: 'Face Shape' },
    { subField: 'eyeColor', label: 'Eye Color' },
    { subField: 'hairColor', label: 'Hair Color' },
    { subField: 'hairStyle', label: 'Hair Style' },
    { subField: 'facialHair', label: 'Facial Hair' },
    { subField: 'features', label: 'Features' },
  ];

  faceFields.forEach(({ subField, label }) => {
    statuses.push({
      field: 'face',
      subField,
      label,
      inheritedValue: archetype.appearance.face[subField] || '',
      currentValue: currentAppearance.face[subField] || '',
      isOverridden: overrideMask.face[subField],
      category: 'face',
    });
  });

  // Clothing fields
  const clothingFields: Array<{ subField: keyof typeof archetype.appearance.clothing; label: string }> = [
    { subField: 'style', label: 'Clothing Style' },
    { subField: 'color', label: 'Clothing Color' },
    { subField: 'accessories', label: 'Accessories' },
  ];

  clothingFields.forEach(({ subField, label }) => {
    statuses.push({
      field: 'clothing',
      subField,
      label,
      inheritedValue: archetype.appearance.clothing[subField] || '',
      currentValue: currentAppearance.clothing[subField] || '',
      isOverridden: overrideMask.clothing[subField],
      category: 'clothing',
    });
  });

  // Story fields
  statuses.push({
    field: 'backstory',
    label: 'Backstory',
    inheritedValue: archetype.backstory,
    currentValue: backstory || archetype.backstory,
    isOverridden: overrideMask.backstory,
    category: 'story',
  });

  statuses.push({
    field: 'motivations',
    label: 'Motivations',
    inheritedValue: archetype.motivations,
    currentValue: motivations || archetype.motivations,
    isOverridden: overrideMask.motivations,
    category: 'story',
  });

  statuses.push({
    field: 'personality',
    label: 'Personality',
    inheritedValue: archetype.personality,
    currentValue: personality || archetype.personality,
    isOverridden: overrideMask.personality,
    category: 'story',
  });

  // Prompts
  statuses.push({
    field: 'imagePrompt',
    label: 'Image Prompt',
    inheritedValue: archetype.imagePrompt,
    currentValue: archetype.imagePrompt,
    isOverridden: overrideMask.imagePrompt,
    category: 'prompts',
  });

  statuses.push({
    field: 'storyPrompt',
    label: 'Story Prompt',
    inheritedValue: archetype.storyPrompt,
    currentValue: archetype.storyPrompt,
    isOverridden: overrideMask.storyPrompt,
    category: 'prompts',
  });

  return statuses;
}

// ============================================================================
// Subcomponents
// ============================================================================

interface FieldRowProps {
  status: FieldStatus;
  onReset: () => void;
}

const FieldRow: React.FC<FieldRowProps> = ({ status, onReset }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const hasChanged = status.currentValue !== status.inheritedValue;

  return (
    <div
      className={cn(
        'border rounded-lg transition-all',
        status.isOverridden
          ? 'border-amber-500/30 bg-amber-900/10'
          : 'border-gray-700/30 bg-gray-800/20'
      )}
    >
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center gap-3 p-2 hover:bg-gray-700/20 transition-colors rounded-lg"
      >
        {/* Status Icon */}
        <span
          className={cn(
            'p-1 rounded',
            status.isOverridden ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
          )}
        >
          {status.isOverridden ? <Pencil size={12} /> : <GitBranch size={12} />}
        </span>

        {/* Label */}
        <span className="flex-1 text-left text-sm text-gray-300">{status.label}</span>

        {/* Current Value Preview */}
        <span className="text-xs text-gray-500 truncate max-w-[120px]">
          {status.currentValue || 'Not set'}
        </span>

        {/* Status Badge */}
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded',
            status.isOverridden ? 'bg-amber-600/30 text-amber-300' : 'bg-green-600/30 text-green-300'
          )}
        >
          {status.isOverridden ? 'Custom' : 'Inherited'}
        </span>

        {/* Expand Arrow */}
        <motion.span animate={{ rotate: showDetails ? 90 : 0 }}>
          <ChevronRight size={14} className="text-gray-500" />
        </motion.span>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-gray-700/30 pt-2 mt-1">
              {/* Inherited Value */}
              <div className="flex items-start gap-2">
                <GitBranch size={12} className="text-green-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">Inherited from archetype:</div>
                  <div className="text-xs text-gray-300 bg-gray-800/50 rounded p-2">
                    {status.inheritedValue || <span className="italic text-gray-500">Not set</span>}
                  </div>
                </div>
              </div>

              {/* Current Value (if different) */}
              {hasChanged && (
                <div className="flex items-start gap-2">
                  <Pencil size={12} className="text-amber-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-0.5">Current value:</div>
                    <div className="text-xs text-amber-200 bg-amber-900/20 rounded p-2 border border-amber-700/30">
                      {status.currentValue || <span className="italic text-gray-500">Not set</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Button */}
              {status.isOverridden && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReset();
                  }}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-1"
                >
                  <RotateCcw size={12} />
                  Reset to inherited value
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  fields: FieldStatus[];
  onResetField: (field: string, subField?: string) => void;
  defaultExpanded?: boolean;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  icon,
  fields,
  onResetField,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const overriddenCount = fields.filter(f => f.isOverridden).length;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
      >
        <span className="p-1.5 rounded bg-gray-700 text-gray-300">{icon}</span>
        <span className="flex-1 text-left font-medium text-gray-200">{title}</span>
        {overriddenCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-600/30 text-amber-300">
            {overriddenCount} custom
          </span>
        )}
        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}>
          <ChevronDown size={16} className="text-gray-500" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pl-2">
              {fields.map((status, index) => (
                <FieldRow
                  key={`${status.field}-${status.subField || index}`}
                  status={status}
                  onReset={() => onResetField(status.field, status.subField)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const InheritanceTracker: React.FC<InheritanceTrackerProps> = ({
  archetype,
  currentAppearance,
  overrideMask,
  onResetField,
  onResetAll,
  backstory,
  motivations,
  personality,
  className,
}) => {
  // Build field statuses
  const fieldStatuses = useMemo(
    () =>
      buildFieldStatuses(
        archetype,
        currentAppearance,
        overrideMask,
        backstory,
        motivations,
        personality
      ),
    [archetype, currentAppearance, overrideMask, backstory, motivations, personality]
  );

  // Group by category
  const categories = useMemo(() => {
    return {
      appearance: fieldStatuses.filter(f => f.category === 'appearance'),
      face: fieldStatuses.filter(f => f.category === 'face'),
      clothing: fieldStatuses.filter(f => f.category === 'clothing'),
      story: fieldStatuses.filter(f => f.category === 'story'),
      prompts: fieldStatuses.filter(f => f.category === 'prompts'),
    };
  }, [fieldStatuses]);

  // Count stats
  const totalFields = fieldStatuses.length;
  const overriddenFields = countOverrides(overrideMask);
  const inheritedFields = totalFields - overriddenFields;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Stats */}
      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <GitMerge size={18} className="text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Inheritance Tracker</h3>
            <p className="text-xs text-gray-400">
              Based on <span className="text-purple-400">{archetype.name}</span>
            </p>
          </div>
        </div>

        {overriddenFields > 0 && (
          <button
            onClick={onResetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <RotateCcw size={12} />
            Reset all
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-400">
            {inheritedFields} inherited
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-xs text-gray-400">
            {overriddenFields} customized
          </span>
        </div>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-400"
            style={{ width: `${(inheritedFields / totalFields) * 100}%` }}
          />
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-2 px-3 py-2 bg-blue-900/20 border border-blue-700/30 rounded-lg text-xs text-blue-300">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          Inherited fields automatically update when you change archetypes. Customized fields are preserved.
        </p>
      </div>

      {/* Field Categories */}
      <div className="space-y-4">
        <CategorySection
          title="Physical Appearance"
          icon={<User size={14} />}
          fields={categories.appearance}
          onResetField={onResetField}
        />

        <CategorySection
          title="Facial Features"
          icon={<Sparkles size={14} />}
          fields={categories.face}
          onResetField={onResetField}
        />

        <CategorySection
          title="Clothing & Style"
          icon={<Shirt size={14} />}
          fields={categories.clothing}
          onResetField={onResetField}
        />

        <CategorySection
          title="Story Elements"
          icon={<FileText size={14} />}
          fields={categories.story}
          onResetField={onResetField}
          defaultExpanded={false}
        />

        <CategorySection
          title="AI Prompts"
          icon={<Image size={14} />}
          fields={categories.prompts}
          onResetField={onResetField}
          defaultExpanded={false}
        />
      </div>
    </div>
  );
};

export default InheritanceTracker;
