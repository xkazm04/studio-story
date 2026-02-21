'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  Users,
  MapPin,
  Package,
  List,
  BookOpen,
  Save,
  X,
  Loader2,
  Heart,
  Filter,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import {
  Ritual,
  RitualFrequency,
  RITUAL_FREQUENCY_CONFIG,
  generateRitualId,
} from '@/lib/culture/CultureGenerator';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import InlineTerminal from '@/cli/InlineTerminal';

// ============================================================================
// Types
// ============================================================================

interface RitualDesignerProps {
  factionId: string;
  factionName: string;
  rituals: Ritual[];
  valueNames: string[]; // For linking rituals to values
  onRitualsChange: (rituals: Ritual[]) => void;
  readOnly?: boolean;
}

interface RitualEditorModalProps {
  ritual: Ritual | null;
  isNew: boolean;
  valueNames: string[];
  onSave: (ritual: Ritual) => void;
  onCancel: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const FREQUENCY_COLORS: Record<RitualFrequency, string> = {
  daily: 'text-green-400 bg-green-500/20 border-green-500/30',
  weekly: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  monthly: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  seasonal: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  annual: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  once: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
  lifecycle: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
};

const RITUAL_GENERATION_PROMPT = {
  system: `You are a worldbuilding expert specializing in faction rituals and ceremonies.
Create rituals that are:
- Meaningful and connected to faction values
- Detailed enough to be visualized
- Rich with sensory details and symbolism
- Practical for storytelling purposes`,
  user: (context: { factionName: string; frequency: RitualFrequency; existingRituals: string[]; values: string[] }) => {
    let prompt = `Create a ${context.frequency} ritual for the faction "${context.factionName}".\n\n`;

    if (context.values.length > 0) {
      prompt += `Faction values: ${context.values.join(', ')}\n`;
    }

    if (context.existingRituals.length > 0) {
      prompt += `Existing rituals: ${context.existingRituals.join(', ')}\n`;
      prompt += `Create something different from these.\n\n`;
    }

    prompt += `Return ONLY a JSON object with this structure:
{
  "name": "Ritual name (evocative, 2-4 words)",
  "description": "Brief overview of the ritual",
  "purpose": "What this ritual accomplishes spiritually/socially",
  "participants": "Who takes part (all members, leaders only, initiates, etc.)",
  "location": "Where it typically occurs",
  "duration": "How long it takes",
  "required_items": ["List of items needed"],
  "steps": ["Step 1", "Step 2", "..."],
  "significance": "Deeper meaning and importance",
  "origin_story": "Legend or history behind this ritual"
}`;

    return prompt;
  },
};

// ============================================================================
// Sub-components
// ============================================================================

const RitualCard: React.FC<{
  ritual: Ritual;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}> = ({ ritual, onEdit, onDelete, readOnly }) => {
  const [expanded, setExpanded] = useState(false);
  const frequencyConfig = RITUAL_FREQUENCY_CONFIG[ritual.frequency];
  const frequencyColor = FREQUENCY_COLORS[ritual.frequency];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-white">{ritual.name}</h4>
                <span className={cn('text-xs px-2 py-0.5 rounded-full border', frequencyColor)}>
                  {frequencyConfig.label}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{ritual.description}</p>

              {/* Quick info row */}
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                {ritual.participants && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {ritual.participants}
                  </span>
                )}
                {ritual.duration && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {ritual.duration}
                  </span>
                )}
                {ritual.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {ritual.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1">
              <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-cyan-400">
                <Edit3 size={14} />
              </button>
              <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-400">
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
          {expanded ? 'Hide details' : 'Show ritual steps & details'}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-700/50 overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-slate-800/30">
              {/* Purpose */}
              <div>
                <p className="text-[10px] uppercase text-slate-600 font-medium mb-1 flex items-center gap-1">
                  <Heart size={10} className="text-red-400" />
                  Purpose
                </p>
                <p className="text-sm text-slate-300">{ritual.purpose}</p>
              </div>

              {/* Steps */}
              {ritual.steps.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-2 flex items-center gap-1">
                    <List size={10} className="text-cyan-400" />
                    Ritual Steps
                  </p>
                  <ol className="space-y-2">
                    {ritual.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-slate-700 text-slate-400 rounded-full text-[10px] font-medium">
                          {i + 1}
                        </span>
                        <span className="text-slate-300">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Required Items */}
              {ritual.required_items && ritual.required_items.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-1 flex items-center gap-1">
                    <Package size={10} className="text-amber-400" />
                    Required Items
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ritual.required_items.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 bg-slate-700 text-slate-300 rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Significance */}
              <div>
                <p className="text-[10px] uppercase text-slate-600 font-medium mb-1 flex items-center gap-1">
                  <BookOpen size={10} className="text-purple-400" />
                  Significance
                </p>
                <p className="text-sm text-slate-400 italic">{ritual.significance}</p>
              </div>

              {/* Origin Story */}
              {ritual.origin_story && (
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                    Origin Story
                  </p>
                  <p className="text-xs text-slate-400 italic">{ritual.origin_story}</p>
                </div>
              )}

              {/* Related Values */}
              {ritual.related_values.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-medium mb-1">
                    Reinforces Values
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {ritual.related_values.map((value, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded"
                      >
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const RitualEditorModal: React.FC<RitualEditorModalProps> = ({
  ritual,
  isNew,
  valueNames,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Ritual>(
    ritual || {
      id: generateRitualId(),
      name: '',
      description: '',
      frequency: 'annual',
      purpose: '',
      participants: '',
      location: '',
      duration: '',
      required_items: [],
      steps: [],
      significance: '',
      origin_story: '',
      related_values: [],
    }
  );
  const [stepInput, setStepInput] = useState('');
  const [itemInput, setItemInput] = useState('');

  const handleAddStep = () => {
    if (stepInput.trim()) {
      setFormData({
        ...formData,
        steps: [...formData.steps, stepInput.trim()],
      });
      setStepInput('');
    }
  };

  const handleRemoveStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...formData.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setFormData({ ...formData, steps: newSteps });
    }
  };

  const handleAddItem = () => {
    if (itemInput.trim()) {
      setFormData({
        ...formData,
        required_items: [...(formData.required_items || []), itemInput.trim()],
      });
      setItemInput('');
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      required_items: formData.required_items?.filter((_, i) => i !== index),
    });
  };

  const toggleValue = (value: string) => {
    const current = formData.related_values || [];
    if (current.includes(value)) {
      setFormData({ ...formData, related_values: current.filter((v) => v !== value) });
    } else {
      setFormData({ ...formData, related_values: [...current, value] });
    }
  };

  const isValid = formData.name.trim() && formData.purpose.trim();

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
        className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="text-orange-400" size={20} />
            {isNew ? 'Design New Ritual' : 'Edit Ritual'}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Name & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Ritual Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., The Binding Oath"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as RitualFrequency })
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {Object.entries(RITUAL_FREQUENCY_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label} - {config.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief overview of what this ritual entails..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Purpose</label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="What does this ritual accomplish spiritually, socially, or practically?"
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Participants, Location, Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Participants</label>
              <input
                type="text"
                value={formData.participants}
                onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                placeholder="Who takes part?"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Where it occurs"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Duration</label>
              <input
                type="text"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="How long?"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>

          {/* Required Items */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Required Items</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={itemInput}
                onChange={(e) => setItemInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
                placeholder="e.g., Sacred candle, ceremonial dagger"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.required_items?.map((item, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(i)}
                    className="hover:text-red-400"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Ritual Steps</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={stepInput}
                onChange={(e) => setStepInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStep())}
                placeholder="Describe each step of the ritual..."
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddStep}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {formData.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm bg-slate-800/50 px-3 py-2 rounded border border-slate-700/30"
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-slate-700 text-slate-400 rounded-full text-[10px] font-medium">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-slate-300">{step}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveStep(i, 'up')}
                      disabled={i === 0}
                      className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveStep(i, 'down')}
                      disabled={i === formData.steps.length - 1}
                      className="p-1 text-slate-500 hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(i)}
                      className="p-1 text-slate-500 hover:text-red-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Significance */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Significance</label>
            <textarea
              value={formData.significance}
              onChange={(e) => setFormData({ ...formData, significance: e.target.value })}
              placeholder="What deeper meaning does this ritual hold?"
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
            />
          </div>

          {/* Origin Story */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Origin Story (optional)
            </label>
            <textarea
              value={formData.origin_story || ''}
              onChange={(e) => setFormData({ ...formData, origin_story: e.target.value })}
              placeholder="The legend or history behind this ritual..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
            />
          </div>

          {/* Related Values */}
          {valueNames.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Related Values (click to toggle)
              </label>
              <div className="flex flex-wrap gap-2">
                {valueNames.map((value) => {
                  const isSelected = formData.related_values.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleValue(value)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 flex gap-3">
          <button
            onClick={() => onSave(formData)}
            disabled={!isValid}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            {isNew ? 'Create Ritual' : 'Save Changes'}
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

const RitualDesigner: React.FC<RitualDesignerProps> = ({
  factionId,
  factionName,
  rituals,
  valueNames,
  onRitualsChange,
  readOnly = false,
}) => {
  const { selectedProject } = useProjectStore();
  const cli = useCLIFeature({
    featureId: 'faction-rituals',
    projectId: selectedProject?.id || '',
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['faction-lore'],
  });
  const [editingRitual, setEditingRitual] = useState<Ritual | null>(null);
  const [isNewRitual, setIsNewRitual] = useState(false);
  const [frequencyFilter, setFrequencyFilter] = useState<RitualFrequency | 'all'>('all');
  const [generatingFrequency, setGeneratingFrequency] = useState<RitualFrequency | null>(null);

  // Filter rituals
  const filteredRituals = useMemo(() => {
    if (frequencyFilter === 'all') return rituals;
    return rituals.filter((r) => r.frequency === frequencyFilter);
  }, [rituals, frequencyFilter]);

  // Group rituals by frequency for overview
  const ritualsByFrequency = useMemo(() => {
    const grouped: Partial<Record<RitualFrequency, number>> = {};
    rituals.forEach((r) => {
      grouped[r.frequency] = (grouped[r.frequency] || 0) + 1;
    });
    return grouped;
  }, [rituals]);

  const handleAddRitual = () => {
    setIsNewRitual(true);
    setEditingRitual({
      id: generateRitualId(),
      name: '',
      description: '',
      frequency: 'annual',
      purpose: '',
      participants: '',
      steps: [],
      significance: '',
      related_values: [],
    });
  };

  const handleEditRitual = (ritual: Ritual) => {
    setIsNewRitual(false);
    setEditingRitual(ritual);
  };

  const handleSaveRitual = (ritual: Ritual) => {
    if (isNewRitual) {
      onRitualsChange([...rituals, ritual]);
    } else {
      onRitualsChange(rituals.map((r) => (r.id === ritual.id ? ritual : r)));
    }
    setEditingRitual(null);
  };

  const handleDeleteRitual = (ritualId: string) => {
    onRitualsChange(rituals.filter((r) => r.id !== ritualId));
  };

  const handleGenerateRitual = (frequency: RitualFrequency) => {
    setGeneratingFrequency(frequency);
    const existingRituals = rituals.map((r) => r.name);

    let prompt = `Create a ${frequency} ritual for the faction "${factionName}".\n\n`;
    if (valueNames.length > 0) {
      prompt += `Faction values: ${valueNames.join(', ')}\n`;
    }
    if (existingRituals.length > 0) {
      prompt += `Existing rituals: ${existingRituals.join(', ')}\nCreate something different from these.\n\n`;
    }
    prompt += `Return ONLY a JSON object with this structure:
{
  "name": "Ritual name (evocative, 2-4 words)",
  "description": "Brief overview of the ritual",
  "purpose": "What this ritual accomplishes spiritually/socially",
  "participants": "Who takes part (all members, leaders only, initiates, etc.)",
  "location": "Where it typically occurs",
  "duration": "How long it takes",
  "required_items": ["List of items needed"],
  "steps": ["Step 1", "Step 2", "..."],
  "significance": "Deeper meaning and importance",
  "origin_story": "Legend or history behind this ritual"
}`;

    cli.executePrompt(prompt, `Generate ${frequency} Ritual`);
  };

  const handleInsertRitual = (text: string) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const frequency = generatingFrequency || 'annual';
        const newRitual: Ritual = {
          id: generateRitualId(),
          name: parsed.name || 'Generated Ritual',
          description: parsed.description || '',
          frequency,
          purpose: parsed.purpose || '',
          participants: parsed.participants || '',
          location: parsed.location,
          duration: parsed.duration,
          required_items: parsed.required_items || [],
          steps: parsed.steps || [],
          significance: parsed.significance || '',
          origin_story: parsed.origin_story,
          related_values: [],
        };
        onRitualsChange([...rituals, newRitual]);
      }
    } catch (parseError) {
      console.error('Failed to parse generated ritual:', parseError);
    } finally {
      setGeneratingFrequency(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
            <Flame size={20} />
          </div>
          <div>
            <h3 className="font-medium text-white">Rituals & Ceremonies</h3>
            <p className="text-xs text-slate-500">
              {rituals.length} ritual{rituals.length !== 1 ? 's' : ''} defined
            </p>
          </div>
        </div>

        {!readOnly && (
          <button
            onClick={handleAddRitual}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            <Plus size={14} />
            Add Ritual
          </button>
        )}
      </div>

      {/* Frequency Overview */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <Filter size={12} />
          Filter:
        </span>
        <button
          onClick={() => setFrequencyFilter('all')}
          className={cn(
            'text-xs px-2 py-1 rounded border transition-colors',
            frequencyFilter === 'all'
              ? 'bg-slate-600 border-slate-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
          )}
        >
          All ({rituals.length})
        </button>
        {(Object.keys(RITUAL_FREQUENCY_CONFIG) as RitualFrequency[]).map((freq) => {
          const count = ritualsByFrequency[freq] || 0;
          const config = RITUAL_FREQUENCY_CONFIG[freq];
          return (
            <button
              key={freq}
              onClick={() => setFrequencyFilter(freq)}
              className={cn(
                'text-xs px-2 py-1 rounded border transition-colors',
                frequencyFilter === freq
                  ? FREQUENCY_COLORS[freq]
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              )}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Ritual List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRituals.map((ritual) => (
            <RitualCard
              key={ritual.id}
              ritual={ritual}
              onEdit={() => handleEditRitual(ritual)}
              onDelete={() => handleDeleteRitual(ritual.id)}
              readOnly={readOnly}
            />
          ))}
        </AnimatePresence>

        {filteredRituals.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Flame className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-sm">
              {frequencyFilter === 'all'
                ? 'No rituals defined yet.'
                : `No ${RITUAL_FREQUENCY_CONFIG[frequencyFilter].label.toLowerCase()} rituals.`}
            </p>
          </div>
        )}
      </div>

      {/* AI Generation Quick Actions */}
      {!readOnly && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-purple-400" size={16} />
            <span className="text-sm font-medium text-purple-300">Generate Ritual with AI</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RITUAL_FREQUENCY_CONFIG) as RitualFrequency[]).map((freq) => {
              const config = RITUAL_FREQUENCY_CONFIG[freq];
              const isGenerating = generatingFrequency === freq;
              return (
                <button
                  key={freq}
                  onClick={() => handleGenerateRitual(freq)}
                  disabled={cli.isRunning || generatingFrequency !== null}
                  className={cn(
                    'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50',
                    FREQUENCY_COLORS[freq]
                  )}
                >
                  {isGenerating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CLI Terminal for AI generation */}
      <InlineTerminal
        {...cli.terminalProps}
        height={120}
        collapsible
        onInsert={handleInsertRitual}
      />

      {/* Ritual Editor Modal */}
      <AnimatePresence>
        {editingRitual && (
          <RitualEditorModal
            ritual={editingRitual}
            isNew={isNewRitual}
            valueNames={valueNames}
            onSave={handleSaveRitual}
            onCancel={() => setEditingRitual(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RitualDesigner;
