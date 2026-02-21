'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge,
  Plus,
  X,
  Sliders,
  Sparkles,
  AlertCircle,
  Check,
  Info,
  Lightbulb,
  ChevronRight,
  Wand2,
} from 'lucide-react';
import { CharacterArchetype } from '@/app/types/Archetype';
import { BlendResult, BlendSource, suggestBlendCombinations } from '@/app/features/characters/lib/archetypeEngine';
import { useArchetypeBlending } from '@/app/hooks/useArchetypes';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ArchetypeBlenderProps {
  availableArchetypes: CharacterArchetype[];
  onBlendComplete: (result: BlendResult) => void;
  onCancel: () => void;
  className?: string;
}

// ============================================================================
// Subcomponents
// ============================================================================

interface SourceCardProps {
  source: { archetype: CharacterArchetype; weight: number };
  onRemove: () => void;
  onWeightChange: (weight: number) => void;
  isLocked?: boolean;
}

const SourceCard: React.FC<SourceCardProps> = ({
  source,
  onRemove,
  onWeightChange,
  isLocked = false,
}) => {
  const percentage = Math.round(source.weight * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-white">{source.archetype.name}</h4>
          <span className="text-xs text-purple-400">{source.archetype.category}</span>
        </div>
        {!isLocked && (
          <button
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Weight Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Influence</span>
          <span className="font-mono text-purple-300">{percentage}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={percentage}
          onChange={(e) => onWeightChange(parseInt(e.target.value) / 100)}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Subtle</span>
          <span>Dominant</span>
        </div>
      </div>

      {/* Tags Preview */}
      <div className="flex flex-wrap gap-1">
        {source.archetype.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

interface SuggestionCardProps {
  suggestion: { archetypeId: string; rationale: string };
  archetype?: CharacterArchetype;
  onAdd: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  archetype,
  onAdd,
}) => {
  if (!archetype) return null;

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onAdd}
      className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 rounded-lg transition-all text-left"
    >
      <div className="p-2 bg-purple-600/20 rounded-lg">
        <Lightbulb size={16} className="text-purple-400" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-white text-sm">{archetype.name}</div>
        <div className="text-xs text-gray-400">{suggestion.rationale}</div>
      </div>
      <ChevronRight size={16} className="text-gray-500" />
    </motion.button>
  );
};

interface BlendPreviewProps {
  result: BlendResult;
}

const BlendPreview: React.FC<BlendPreviewProps> = ({ result }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('appearance');

  const sections = [
    {
      id: 'appearance',
      title: 'Blended Appearance',
      content: (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Gender:</span>{' '}
            <span className="text-gray-300">{result.appearance.gender}</span>
          </div>
          <div>
            <span className="text-gray-500">Age:</span>{' '}
            <span className="text-gray-300">{result.appearance.age}</span>
          </div>
          <div>
            <span className="text-gray-500">Body:</span>{' '}
            <span className="text-gray-300">{result.appearance.bodyType}</span>
          </div>
          <div>
            <span className="text-gray-500">Hair:</span>{' '}
            <span className="text-gray-300">{result.appearance.face.hairColor}</span>
          </div>
          <div>
            <span className="text-gray-500">Eyes:</span>{' '}
            <span className="text-gray-300">{result.appearance.face.eyeColor}</span>
          </div>
          <div>
            <span className="text-gray-500">Style:</span>{' '}
            <span className="text-gray-300 truncate">{result.appearance.clothing.style}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'personality',
      title: 'Blended Personality',
      content: (
        <p className="text-sm text-gray-300">{result.personality}</p>
      ),
    },
    {
      id: 'backstory',
      title: 'Blended Backstory',
      content: (
        <p className="text-sm text-gray-300">{result.backstory}</p>
      ),
    },
    {
      id: 'tags',
      title: 'Combined Tags',
      content: (
        <div className="flex flex-wrap gap-1">
          {result.tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-white flex items-center gap-2">
        <Sparkles size={16} className="text-purple-400" />
        Blend Preview
      </h4>
      <div className="space-y-1">
        {sections.map(section => (
          <div
            key={section.id}
            className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedSection(
                expandedSection === section.id ? null : section.id
              )}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-700/30 transition-colors"
            >
              <span className="text-sm font-medium text-gray-200">{section.title}</span>
              <motion.span animate={{ rotate: expandedSection === section.id ? 90 : 0 }}>
                <ChevronRight size={14} className="text-gray-500" />
              </motion.span>
            </button>
            <AnimatePresence>
              {expandedSection === section.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3">{section.content}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ArchetypeBlender: React.FC<ArchetypeBlenderProps> = ({
  availableArchetypes,
  onBlendComplete,
  onCancel,
  className,
}) => {
  const {
    blendState,
    addSource,
    removeSource,
    updateWeight,
    performBlend,
    clearBlend,
    getSuggestions,
    canBlend,
  } = useArchetypeBlending();

  const [showArchetypePicker, setShowArchetypePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get suggestions based on current sources
  const suggestions = React.useMemo(() => {
    if (blendState.sources.length === 0) return [];
    const firstSource = blendState.sources[0].archetype;
    return getSuggestions(firstSource);
  }, [blendState.sources, getSuggestions]);

  // Filter available archetypes
  const filteredArchetypes = React.useMemo(() => {
    const sourceIds = new Set(blendState.sources.map(s => s.archetype.id));
    let filtered = availableArchetypes.filter(a => !sourceIds.has(a.id));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        a =>
          a.name.toLowerCase().includes(term) ||
          a.category.toLowerCase().includes(term) ||
          a.tags.some(t => t.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [availableArchetypes, blendState.sources, searchTerm]);

  // Handle blend
  const handleBlend = () => {
    const result = performBlend();
    if (result) {
      onBlendComplete(result);
    }
  };

  // Find archetype by ID for suggestions
  const findArchetype = (id: string) =>
    availableArchetypes.find(a => a.id === id || a.category.toLowerCase() === id);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <GitMerge size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Archetype Blender</h3>
            <p className="text-sm text-gray-400">
              Combine 2-3 archetypes to create unique characters
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Instructions */}
      <div className="flex items-start gap-2 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-300">
          Add 2-3 archetypes and adjust their influence weights. The blender will combine
          their traits, appearance, and story elements into a cohesive new character template.
        </p>
      </div>

      {/* Source Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-200">
            Blend Sources ({blendState.sources.length}/3)
          </h4>
          {blendState.sources.length > 0 && (
            <button
              onClick={clearBlend}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {blendState.sources.map((source) => (
              <SourceCard
                key={source.archetype.id}
                source={source}
                onRemove={() => removeSource(source.archetype.id)}
                onWeightChange={(weight) => updateWeight(source.archetype.id, weight)}
              />
            ))}
          </AnimatePresence>

          {/* Add Button */}
          {blendState.sources.length < 3 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowArchetypePicker(true)}
              className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-700 hover:border-purple-500/50 rounded-lg transition-all text-gray-500 hover:text-purple-400"
            >
              <Plus size={24} />
              <span className="text-sm">Add archetype</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Suggestions */}
      {blendState.sources.length === 1 && suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-200 flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-400" />
            Suggested Combinations
          </h4>
          <div className="space-y-2">
            {suggestions.slice(0, 3).map((suggestion) => {
              const archetype = findArchetype(suggestion.archetypeId);
              return (
                <SuggestionCard
                  key={suggestion.archetypeId}
                  suggestion={suggestion}
                  archetype={archetype}
                  onAdd={() => archetype && addSource(archetype, 0.4)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Archetype Picker Modal */}
      <AnimatePresence>
        {showArchetypePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowArchetypePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[70vh] overflow-hidden"
            >
              <div className="p-4 border-b border-gray-700">
                <h4 className="font-semibold text-white mb-3">Select Archetype to Add</h4>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search archetypes..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
                {filteredArchetypes.map((archetype) => (
                  <button
                    key={archetype.id}
                    onClick={() => {
                      addSource(archetype, 0.5);
                      setShowArchetypePicker(false);
                      setSearchTerm('');
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 rounded-lg transition-all text-left"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white">{archetype.name}</div>
                      <div className="text-xs text-gray-400">
                        {archetype.category} • {archetype.description}
                      </div>
                    </div>
                    <Plus size={16} className="text-gray-500" />
                  </button>
                ))}
                {filteredArchetypes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No archetypes found
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weight Warning */}
      {blendState.sources.length >= 2 && (
        <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            Total weight:{' '}
            <span className="font-mono">
              {Math.round(blendState.sources.reduce((sum, s) => sum + s.weight, 0) * 100)}%
            </span>
            . Weights will be normalized when blending.
          </p>
        </div>
      )}

      {/* Blend Preview */}
      {blendState.result && <BlendPreview result={blendState.result} />}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>

        {!blendState.result ? (
          <button
            onClick={handleBlend}
            disabled={!canBlend}
            className={cn(
              'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors',
              canBlend
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            )}
          >
            <Wand2 size={18} />
            Preview Blend
          </button>
        ) : (
          <button
            onClick={handleBlend}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Check size={18} />
            Apply Blend
          </button>
        )}
      </div>
    </div>
  );
};

export default ArchetypeBlender;
