'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  Loader2,
  Target,
  Compass,
  Star,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  FactionValue,
  ValueCategory,
  VALUE_CATEGORIES,
  generateValueId,
} from '@/lib/culture/CultureGenerator';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import InlineTerminal from '@/cli/InlineTerminal';

// ============================================================================
// Types
// ============================================================================

interface ValuesEditorProps {
  factionId: string;
  factionName: string;
  values: FactionValue[];
  corePhilosophy: string;
  guidingPrinciple: string;
  onValuesChange: (values: FactionValue[]) => void;
  onPhilosophyChange: (philosophy: string) => void;
  onPrincipleChange: (principle: string) => void;
  readOnly?: boolean;
}

interface ValueEditorModalProps {
  value: FactionValue | null;
  isNew: boolean;
  onSave: (value: FactionValue) => void;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_ICONS: Record<ValueCategory, React.ReactNode> = {
  core: <Heart className="w-4 h-4" />,
  secondary: <Compass className="w-4 h-4" />,
  aspirational: <Star className="w-4 h-4" />,
};

const VALUE_GENERATION_PROMPT = {
  system: `You are a worldbuilding expert specializing in faction cultures and belief systems.
Generate faction values that are:
- Specific to the faction's identity and history
- Actionable (can be seen in daily behavior)
- Potentially in tension with other factions
- Rich with storytelling potential`,
  user: (context: { factionName: string; category: ValueCategory; existingValues: string[] }) => {
    let prompt = `Generate a new ${context.category} value for the faction "${context.factionName}".\n\n`;

    if (context.existingValues.length > 0) {
      prompt += `Existing values: ${context.existingValues.join(', ')}\n`;
      prompt += `Create something that complements but doesn't repeat these.\n\n`;
    }

    prompt += `Return ONLY a JSON object with this structure:
{
  "name": "Short value name (2-4 words)",
  "description": "One sentence explaining this value",
  "manifestations": ["How this shows in daily life (3-5 examples)"],
  "origin": "Brief historical reason this became a value",
  "conflicts_with": ["Values from other factions this might clash with (2-3)"]
}`;

    return prompt;
  },
};

// ============================================================================
// Sub-components
// ============================================================================

const ValueCard: React.FC<{
  value: FactionValue;
  onEdit: () => void;
  onDelete: () => void;
  onPriorityChange: (direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  readOnly?: boolean;
}> = ({ value, onEdit, onDelete, onPriorityChange, isFirst, isLast, readOnly }) => {
  const [expanded, setExpanded] = useState(false);
  const categoryConfig = VALUE_CATEGORIES[value.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        'bg-slate-800/50 rounded-lg border p-4',
        categoryConfig.color.replace('text-', 'border-').replace('bg-', '').replace('/20', '/30')
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={cn('p-2 rounded-lg', categoryConfig.color)}>
            {CATEGORY_ICONS[value.category]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-white truncate">{value.name}</h4>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', categoryConfig.color)}>
                {categoryConfig.label}
              </span>
              <span className="text-xs text-slate-500">P{value.priority}</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{value.description}</p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPriorityChange('up')}
              disabled={isFirst}
              className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => onPriorityChange('down')}
              disabled={isLast}
              className="p-1 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={onEdit}
              className="p-1 text-slate-500 hover:text-cyan-400"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-slate-500 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 mt-3 text-xs text-slate-500 hover:text-slate-300"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide details' : 'Show details'}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            {/* Manifestations */}
            {value.manifestations.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                  How it manifests
                </p>
                <ul className="space-y-1">
                  {value.manifestations.map((m, i) => (
                    <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                      <span className="text-cyan-500 mt-0.5">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Origin */}
            {value.origin && (
              <div>
                <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">Origin</p>
                <p className="text-xs text-slate-400 italic">{value.origin}</p>
              </div>
            )}

            {/* Conflicts */}
            {value.conflicts_with && value.conflicts_with.length > 0 && (
              <div>
                <p className="text-[10px] uppercase text-slate-600 font-medium mb-1 flex items-center gap-1">
                  <AlertTriangle size={10} className="text-amber-500" />
                  Potential conflicts
                </p>
                <div className="flex flex-wrap gap-1">
                  {value.conflicts_with.map((c, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ValueEditorModal: React.FC<ValueEditorModalProps> = ({
  value,
  isNew,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FactionValue>(
    value || {
      id: generateValueId(),
      name: '',
      description: '',
      category: 'secondary',
      priority: 5,
      manifestations: [],
      conflicts_with: [],
      origin: '',
    }
  );
  const [manifestationInput, setManifestationInput] = useState('');
  const [conflictInput, setConflictInput] = useState('');

  const handleAddManifestation = () => {
    if (manifestationInput.trim()) {
      setFormData({
        ...formData,
        manifestations: [...formData.manifestations, manifestationInput.trim()],
      });
      setManifestationInput('');
    }
  };

  const handleRemoveManifestation = (index: number) => {
    setFormData({
      ...formData,
      manifestations: formData.manifestations.filter((_, i) => i !== index),
    });
  };

  const handleAddConflict = () => {
    if (conflictInput.trim()) {
      setFormData({
        ...formData,
        conflicts_with: [...(formData.conflicts_with || []), conflictInput.trim()],
      });
      setConflictInput('');
    }
  };

  const handleRemoveConflict = (index: number) => {
    setFormData({
      ...formData,
      conflicts_with: formData.conflicts_with?.filter((_, i) => i !== index),
    });
  };

  const isValid = formData.name.trim() && formData.description.trim();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Heart className="text-cyan-400" size={20} />
            {isNew ? 'Add Value' : 'Edit Value'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Value Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Honor Above All"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain what this value means to the faction..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as ValueCategory })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {Object.entries(VALUE_CATEGORIES).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Priority (1-10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: Math.max(1, Math.min(10, +e.target.value)) })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Manifestations */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Manifestations (how it shows in daily life)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={manifestationInput}
                onChange={(e) => setManifestationInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddManifestation())}
                placeholder="e.g., Always speaks truthfully, even when costly"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddManifestation}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {formData.manifestations.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-2 py-1 rounded"
                >
                  <span className="flex-1">{m}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveManifestation(i)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Origin */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Historical Origin (optional)
            </label>
            <textarea
              value={formData.origin || ''}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              placeholder="Why did this become a core value?"
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm"
            />
          </div>

          {/* Conflicts */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Potential Conflicts (values that clash with this)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={conflictInput}
                onChange={(e) => setConflictInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddConflict())}
                placeholder="e.g., Expedience, Profit at any cost"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddConflict}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.conflicts_with?.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => handleRemoveConflict(i)}
                    className="hover:text-red-400"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 flex gap-3">
          <button
            onClick={() => onSave(formData)}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            {isNew ? 'Add Value' : 'Save Changes'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ValuesEditor: React.FC<ValuesEditorProps> = ({
  factionId,
  factionName,
  values,
  corePhilosophy,
  guidingPrinciple,
  onValuesChange,
  onPhilosophyChange,
  onPrincipleChange,
  readOnly = false,
}) => {
  const { selectedProject } = useProjectStore();
  const cli = useCLIFeature({
    featureId: 'faction-values',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['faction-creation'],
  });
  const [editingValue, setEditingValue] = useState<FactionValue | null>(null);
  const [isNewValue, setIsNewValue] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<ValueCategory, boolean>>({
    core: true,
    secondary: true,
    aspirational: false,
  });
  const [generatingCategory, setGeneratingCategory] = useState<ValueCategory | null>(null);

  // Group values by category
  const valuesByCategory = useMemo(() => {
    const grouped: Record<ValueCategory, FactionValue[]> = {
      core: [],
      secondary: [],
      aspirational: [],
    };

    values
      .sort((a, b) => b.priority - a.priority)
      .forEach((v) => {
        grouped[v.category].push(v);
      });

    return grouped;
  }, [values]);

  const handleAddValue = (category: ValueCategory) => {
    setIsNewValue(true);
    setEditingValue({
      id: generateValueId(),
      name: '',
      description: '',
      category,
      priority: 5,
      manifestations: [],
      conflicts_with: [],
    });
  };

  const handleEditValue = (value: FactionValue) => {
    setIsNewValue(false);
    setEditingValue(value);
  };

  const handleSaveValue = (value: FactionValue) => {
    if (isNewValue) {
      onValuesChange([...values, value]);
    } else {
      onValuesChange(values.map((v) => (v.id === value.id ? value : v)));
    }
    setEditingValue(null);
  };

  const handleDeleteValue = (valueId: string) => {
    onValuesChange(values.filter((v) => v.id !== valueId));
  };

  const handlePriorityChange = (valueId: string, direction: 'up' | 'down') => {
    const value = values.find((v) => v.id === valueId);
    if (!value) return;

    const categoryValues = valuesByCategory[value.category];
    const currentIndex = categoryValues.findIndex((v) => v.id === valueId);

    if (direction === 'up' && currentIndex > 0) {
      const otherValue = categoryValues[currentIndex - 1];
      const updatedValues = values.map((v) => {
        if (v.id === valueId) return { ...v, priority: otherValue.priority };
        if (v.id === otherValue.id) return { ...v, priority: value.priority };
        return v;
      });
      onValuesChange(updatedValues);
    } else if (direction === 'down' && currentIndex < categoryValues.length - 1) {
      const otherValue = categoryValues[currentIndex + 1];
      const updatedValues = values.map((v) => {
        if (v.id === valueId) return { ...v, priority: otherValue.priority };
        if (v.id === otherValue.id) return { ...v, priority: value.priority };
        return v;
      });
      onValuesChange(updatedValues);
    }
  };

  const handleGenerateValue = (category: ValueCategory) => {
    setGeneratingCategory(category);
    const existingValues = values.map((v) => v.name);

    let prompt = `Generate a new ${category} value for the faction "${factionName}".\n\n`;
    if (existingValues.length > 0) {
      prompt += `Existing values: ${existingValues.join(', ')}\nCreate something that complements but doesn't repeat these.\n\n`;
    }
    prompt += `Return ONLY a JSON object with this structure:
{
  "name": "Short value name (2-4 words)",
  "description": "One sentence explaining this value",
  "manifestations": ["How this shows in daily life (3-5 examples)"],
  "origin": "Brief historical reason this became a value",
  "conflicts_with": ["Values from other factions this might clash with (2-3)"]
}`;

    cli.executePrompt(prompt, `Generate ${category} Value`);
  };

  const handleInsertValue = (text: string) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const category = generatingCategory || 'secondary';
        const newValue: FactionValue = {
          id: generateValueId(),
          name: parsed.name || 'Generated Value',
          description: parsed.description || '',
          category,
          priority: category === 'core' ? 8 : category === 'secondary' ? 5 : 3,
          manifestations: parsed.manifestations || [],
          conflicts_with: parsed.conflicts_with || [],
          origin: parsed.origin || '',
        };
        onValuesChange([...values, newValue]);
      }
    } catch (parseError) {
      console.error('Failed to parse generated value:', parseError);
    } finally {
      setGeneratingCategory(null);
    }
  };

  const toggleCategory = (category: ValueCategory) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Philosophy & Principle */}
      <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="font-medium text-white">Faction Philosophy</h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Core Philosophy</label>
          <textarea
            value={corePhilosophy}
            onChange={(e) => onPhilosophyChange(e.target.value)}
            disabled={readOnly}
            placeholder="The fundamental worldview that shapes all faction beliefs..."
            rows={2}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Guiding Principle</label>
          <input
            type="text"
            value={guidingPrinciple}
            onChange={(e) => onPrincipleChange(e.target.value)}
            disabled={readOnly}
            placeholder="e.g., 'Strength through unity' or 'Knowledge is power'"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm disabled:opacity-50"
          />
        </div>
      </div>

      {/* Values by Category */}
      {(Object.entries(VALUE_CATEGORIES) as [ValueCategory, typeof VALUE_CATEGORIES.core][]).map(
        ([category, config]) => (
          <div key={category} className="space-y-3">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={cn('p-1.5 rounded', config.color)}>
                  {CATEGORY_ICONS[category]}
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-white">{config.label}</h4>
                  <p className="text-xs text-slate-500">{config.description}</p>
                </div>
                <span className="ml-2 text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full">
                  {valuesByCategory[category].length}
                </span>
              </div>
              {expandedCategories[category] ? (
                <ChevronUp className="text-slate-400" size={18} />
              ) : (
                <ChevronDown className="text-slate-400" size={18} />
              )}
            </button>

            <AnimatePresence>
              {expandedCategories[category] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pl-4 overflow-hidden"
                >
                  {valuesByCategory[category].map((value, index) => (
                    <ValueCard
                      key={value.id}
                      value={value}
                      onEdit={() => handleEditValue(value)}
                      onDelete={() => handleDeleteValue(value.id)}
                      onPriorityChange={(dir) => handlePriorityChange(value.id, dir)}
                      isFirst={index === 0}
                      isLast={index === valuesByCategory[category].length - 1}
                      readOnly={readOnly}
                    />
                  ))}

                  {valuesByCategory[category].length === 0 && (
                    <p className="text-sm text-slate-500 italic py-2">
                      No {config.label.toLowerCase()} defined yet.
                    </p>
                  )}

                  {!readOnly && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleAddValue(category)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        <Plus size={14} />
                        Add Value
                      </button>
                      <button
                        onClick={() => handleGenerateValue(category)}
                        disabled={cli.isRunning || generatingCategory !== null}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {generatingCategory === category ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        Generate with AI
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      )}

      {/* CLI Terminal for AI generation */}
      <InlineTerminal
        {...cli.terminalProps}
        height={120}
        collapsible
        onInsert={handleInsertValue}
      />

      {/* Value Editor Modal */}
      <AnimatePresence>
        {editingValue && (
          <ValueEditorModal
            value={editingValue}
            isNew={isNewValue}
            onSave={handleSaveValue}
            onCancel={() => setEditingValue(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ValuesEditor;
