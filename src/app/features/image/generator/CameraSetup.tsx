'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Film, Lightbulb, Grid3x3 } from 'lucide-react';
import { CAMERA_ANGLES, SHOT_TYPES, LIGHTING, COMPOSITION } from '@/app/types/Image';

interface CameraSetupProps {
  onCameraChange: (cameraPrompt: string) => void;
}

type PresetCategory = 'angles' | 'shots' | 'lighting' | 'composition';

interface CategoryConfig {
  id: PresetCategory;
  label: string;
  icon: React.ElementType;
  presets: readonly { name: string; prompt: string }[];
}

const categories: CategoryConfig[] = [
  { id: 'angles', label: 'Camera Angles', icon: Camera, presets: CAMERA_ANGLES },
  { id: 'shots', label: 'Shot Types', icon: Film, presets: SHOT_TYPES },
  { id: 'lighting', label: 'Lighting', icon: Lightbulb, presets: LIGHTING },
  { id: 'composition', label: 'Composition', icon: Grid3x3, presets: COMPOSITION },
];

const CameraSetup: React.FC<CameraSetupProps> = ({ onCameraChange }) => {
  const [selectedPresets, setSelectedPresets] = useState<{
    angles: string[];
    shots: string[];
    lighting: string[];
    composition: string[];
  }>({
    angles: [],
    shots: [],
    lighting: [],
    composition: [],
  });

  const togglePreset = (category: PresetCategory, prompt: string) => {
    setSelectedPresets((prev) => {
      const categoryPresets = prev[category];
      const isSelected = categoryPresets.includes(prompt);

      const updated = {
        ...prev,
        [category]: isSelected
          ? categoryPresets.filter((p) => p !== prompt)
          : [...categoryPresets, prompt],
      };

      // Generate combined camera prompt
      const allPrompts = [
        ...updated.angles,
        ...updated.shots,
        ...updated.lighting,
        ...updated.composition,
      ].filter(Boolean);

      onCameraChange(allPrompts.join(', '));

      return updated;
    });
  };

  const clearCategory = (category: PresetCategory) => {
    setSelectedPresets((prev) => {
      const updated = {
        ...prev,
        [category]: [],
      };

      const allPrompts = [
        ...updated.angles,
        ...updated.shots,
        ...updated.lighting,
        ...updated.composition,
      ].filter(Boolean);

      onCameraChange(allPrompts.join(', '));

      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const Icon = category.icon;
        const hasSelection = selectedPresets[category.id].length > 0;

        return (
          <div key={category.id}>
            {/* Category Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-gray-400" />
                <h4 className="text-sm font-semibold text-white">{category.label}</h4>
                {hasSelection && (
                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                    {selectedPresets[category.id].length}
                  </span>
                )}
              </div>
              {hasSelection && (
                <button
                  onClick={() => clearCategory(category.id)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {category.presets.map((preset) => {
                const isSelected = selectedPresets[category.id].includes(preset.prompt);

                return (
                  <motion.button
                    key={preset.name}
                    onClick={() => togglePreset(category.id, preset.prompt)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative px-3 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }
                    `}
                  >
                    {preset.name}
                    {isSelected && (
                      <motion.div
                        layoutId={`selected-${category.id}`}
                        className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Camera Prompt Preview */}
      {(selectedPresets.angles.length > 0 ||
        selectedPresets.shots.length > 0 ||
        selectedPresets.lighting.length > 0 ||
        selectedPresets.composition.length > 0) && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="text-xs font-medium text-gray-400 mb-1">Camera Prompt</div>
          <div className="text-sm text-gray-300">
            {[
              ...selectedPresets.angles,
              ...selectedPresets.shots,
              ...selectedPresets.lighting,
              ...selectedPresets.composition,
            ].join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraSetup;
