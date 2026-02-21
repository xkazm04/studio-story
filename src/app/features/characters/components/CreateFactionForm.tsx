'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { factionApi } from '@/app/api/factions';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import ColoredBorder from '@/app/components/UI/ColoredBorder';
import { useOptimisticMutation } from '@/app/hooks/useOptimisticMutation';
import FactionWizard from '../sub_CharFactions/FactionWizard';
import { validateFactionColor, sanitizeHexColor } from '@/app/utils/colorValidation';

interface CreateFactionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#71717a',
];

const CreateFactionForm: React.FC<CreateFactionFormProps> = ({
  onClose,
  onSuccess,
}) => {
  const { selectedProject } = useProjectStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [showWizard, setShowWizard] = useState(false);
  const [colorError, setColorError] = useState<string | null>(null);

  // Use optimistic mutation hook with automatic query invalidation
  const { mutate, isLoading, isError, error, rollbackError } = useOptimisticMutation({
    mutationFn: async (data: { name: string; description?: string; project_id: string; color: string }) => {
      const newFaction = await factionApi.createFaction({
        name: data.name,
        description: data.description,
        project_id: data.project_id,
      });

      // Update with color if provided
      if (data.color && newFaction.id) {
        await factionApi.updateFaction(newFaction.id, { color: data.color });
      }

      return newFaction;
    },
    affectedQueryKeys: [
      ['factions', 'project', selectedProject?.id],
      ['characters', selectedProject?.id],
    ],
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err) => {
      console.error('Error creating faction:', err);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedProject) return;

    // Validate color before submission
    const colorValidation = validateFactionColor(color, {
      required: false,
      fieldName: 'Faction color',
    });

    if (!colorValidation.isValid) {
      setColorError(colorValidation.error || 'Invalid color');
      return;
    }

    setColorError(null);
    const sanitizedColor = colorValidation.sanitized || color;

    await mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      project_id: selectedProject.id,
      color: sanitizedColor,
    });
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    setColorError(null); // Clear error when color changes
  };

  // If wizard is active, show it instead
  if (showWizard) {
    return (
      <FactionWizard
        onClose={() => {
          setShowWizard(false);
          onClose();
        }}
        onSuccess={onSuccess}
        projectId={selectedProject?.id || ''}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      data-testid="create-faction-modal"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-lg w-full"
      >
        <ColoredBorder color="blue" />

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Create New Faction</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            data-testid="close-form-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* AI Wizard Option */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="text-white" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white mb-1">Try the AI Faction Builder</p>
              <p className="text-xs text-gray-400 mb-3">
                Describe your faction and let AI generate a complete profile with lore, timeline, achievements, and branding.
              </p>
              <button
                type="button"
                onClick={() => setShowWizard(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm rounded-lg font-medium transition-all flex items-center gap-2"
                data-testid="open-ai-wizard-btn"
              >
                <Sparkles size={14} />
                Use AI Wizard
              </button>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-gray-900 text-gray-500">or create manually</span>
          </div>
        </div>

        {/* Error notifications with rollback info */}
        {isError && error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2"
          >
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Failed to create faction</div>
              <div className="text-xs text-red-300 mt-1">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </div>
            </div>
          </motion.div>
        )}

        {rollbackError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-orange-900/30 border border-orange-500/50 rounded-lg text-orange-400 text-sm flex items-start gap-2"
          >
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Rollback Notice</div>
              <div className="text-xs text-orange-300 mt-1">{rollbackError}</div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Faction Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Faction Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter faction name"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              data-testid="faction-name-input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the faction's purpose, values, or history..."
              className="w-full min-h-[100px] px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              data-testid="faction-description-input"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Faction Color
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => handleColorChange(presetColor)}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all',
                    color === presetColor
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: presetColor }}
                  data-testid={`color-preset-${presetColor}`}
                />
              ))}
            </div>
            {colorError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-red-400 flex items-center gap-1"
              >
                <AlertCircle size={12} />
                {colorError}
              </motion.div>
            )}
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">Preview:</p>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {name.charAt(0).toUpperCase() || 'F'}
              </div>
              <div>
                <div className="font-semibold text-white">
                  {name || 'Faction Name'}
                </div>
                {description && (
                  <div className="text-sm text-gray-400 line-clamp-1">
                    {description}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
              data-testid="submit-faction-btn"
            >
              <Save size={16} />
              {isLoading ? 'Creating...' : 'Create Faction'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateFactionForm;

