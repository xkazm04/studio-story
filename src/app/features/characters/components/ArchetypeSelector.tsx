'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Sparkles,
  ChevronDown,
  User,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Zap,
  Layers,
  GitMerge,
  Plus,
  Shuffle,
  Star,
  Filter,
  Grid,
  List,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { CharacterArchetype, ArchetypeCategory, ArchetypeGenre } from '@/app/types/Archetype';
import {
  ARCHETYPE_LIBRARY,
  getAllCategories,
} from '@/app/lib/archetypes/archetypeLibrary';
import {
  HierarchicalArchetype,
  BlendResult,
  generateVariations,
  VariationOptions,
} from '@/app/features/characters/lib/archetypeEngine';
import {
  useArchetypes,
  useArchetypeFilters,
  useArchetypeCompatibility
} from '@/app/hooks/useArchetypes';
import ArchetypeHierarchy from './ArchetypeHierarchy';
import ArchetypeBlender from './ArchetypeBlender';
import ArchetypeCreator from './ArchetypeCreator';

// ============================================================================
// Types
// ============================================================================

interface ArchetypeSelectorProps {
  onSelect: (archetype: CharacterArchetype) => void;
  onClose: () => void;
  currentGenre?: string;
  existingCast?: CharacterArchetype[];
  userId?: string;
}

type ViewMode = 'grid' | 'hierarchy' | 'blender' | 'creator' | 'variations';

// ============================================================================
// Subcomponents
// ============================================================================

interface ViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ activeView, onViewChange }) => {
  const views: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
    { id: 'grid', icon: <Grid size={16} />, label: 'Grid' },
    { id: 'hierarchy', icon: <Layers size={16} />, label: 'Hierarchy' },
    { id: 'blender', icon: <GitMerge size={16} />, label: 'Blend' },
    { id: 'variations', icon: <Shuffle size={16} />, label: 'Variations' },
    { id: 'creator', icon: <Plus size={16} />, label: 'Create' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-800 rounded-lg">
      {views.map(view => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeView === view.id
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          )}
        >
          {view.icon}
          <span className="hidden sm:inline">{view.label}</span>
        </button>
      ))}
    </div>
  );
};

interface ArchetypeCardProps {
  archetype: CharacterArchetype;
  isSelected: boolean;
  onClick: () => void;
  compatibilityScore?: number;
  isCustom?: boolean;
}

const ArchetypeCard: React.FC<ArchetypeCardProps> = ({
  archetype,
  isSelected,
  onClick,
  compatibilityScore,
  isCustom,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn(
        'p-4 bg-gray-800/50 border rounded-lg cursor-pointer transition-all relative',
        isSelected
          ? 'border-purple-500 bg-purple-900/20'
          : 'border-gray-700 hover:border-gray-600'
      )}
      data-testid={`archetype-card-${archetype.id}`}
    >
      {/* Compatibility Badge */}
      {compatibilityScore !== undefined && (
        <div
          className={cn(
            'absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
            compatibilityScore >= 80
              ? 'bg-green-600/30 text-green-300'
              : compatibilityScore >= 50
                ? 'bg-yellow-600/30 text-yellow-300'
                : 'bg-red-600/30 text-red-300'
          )}
        >
          <BarChart3 size={12} />
          {compatibilityScore}%
        </div>
      )}

      {/* Custom Badge */}
      {isCustom && (
        <div className="absolute top-2 left-2">
          <Sparkles size={14} className="text-yellow-400" />
        </div>
      )}

      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-8">
          <h3 className="font-semibold text-white mb-1">{archetype.name}</h3>
          <span className="text-xs px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded-full">
            {archetype.category}
          </span>
        </div>
        {isSelected && (
          <CheckCircle2 className="text-purple-400 flex-shrink-0" size={20} />
        )}
      </div>
      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
        {archetype.description}
      </p>
      <div className="flex flex-wrap gap-1">
        {archetype.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
};

interface VariationsPanelProps {
  baseArchetype: CharacterArchetype | null;
  onSelectVariation: (archetype: CharacterArchetype) => void;
  onBack: () => void;
}

const VariationsPanel: React.FC<VariationsPanelProps> = ({
  baseArchetype,
  onSelectVariation,
  onBack,
}) => {
  const [options, setOptions] = useState<VariationOptions>({
    variationStrength: 'moderate',
    allowGenderSwap: false,
    allowAgeShift: false,
  });
  const [variations, setVariations] = useState<CharacterArchetype[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<CharacterArchetype | null>(null);

  const handleGenerate = () => {
    if (baseArchetype) {
      const newVariations = generateVariations(baseArchetype, 6, options);
      setVariations(newVariations);
      setSelectedVariation(null);
    }
  };

  if (!baseArchetype) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Shuffle size={48} className="mb-4 opacity-50" />
        <p className="text-lg">No archetype selected</p>
        <p className="text-sm">Select an archetype first to generate variations</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
        >
          Back to Grid
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Base Archetype Info */}
      <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="p-3 bg-purple-600/20 rounded-lg">
          <User size={24} className="text-purple-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-white">Base: {baseArchetype.name}</h4>
          <p className="text-sm text-gray-400">{baseArchetype.category}</p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-white"
        >
          Change
        </button>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Variation Strength:</label>
          <select
            value={options.variationStrength}
            onChange={(e) => setOptions(prev => ({
              ...prev,
              variationStrength: e.target.value as VariationOptions['variationStrength'],
            }))}
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="subtle">Subtle</option>
            <option value="moderate">Moderate</option>
            <option value="significant">Significant</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={options.allowGenderSwap}
            onChange={(e) => setOptions(prev => ({
              ...prev,
              allowGenderSwap: e.target.checked,
            }))}
            className="rounded bg-gray-800 border-gray-600"
          />
          Allow gender swap
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={options.allowAgeShift}
            onChange={(e) => setOptions(prev => ({
              ...prev,
              allowAgeShift: e.target.checked,
            }))}
            className="rounded bg-gray-800 border-gray-600"
          />
          Allow age shift
        </label>

        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium ml-auto"
        >
          <Shuffle size={16} />
          Generate Variations
        </button>
      </div>

      {/* Variations Grid */}
      {variations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variations.map((variation, index) => (
            <ArchetypeCard
              key={variation.id}
              archetype={variation}
              isSelected={selectedVariation?.id === variation.id}
              onClick={() => setSelectedVariation(variation)}
            />
          ))}
        </div>
      )}

      {/* Apply Button */}
      {selectedVariation && (
        <div className="flex justify-end">
          <button
            onClick={() => onSelectVariation(selectedVariation)}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
          >
            <Sparkles size={18} />
            Apply Variation
          </button>
        </div>
      )}

      {variations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Click "Generate Variations" to create character variations
        </div>
      )}
    </div>
  );
};

interface PreviewPanelProps {
  archetype: CharacterArchetype;
  onClose: () => void;
  onApply: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  archetype,
  onClose,
  onApply,
}) => {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-96 border-l border-gray-700 bg-gray-800/50 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {archetype.name}
            </h3>
            <span className="text-sm px-2 py-1 bg-purple-600/20 text-purple-400 rounded-full">
              {archetype.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-300 mb-6">{archetype.description}</p>

        {/* What's Included */}
        <div className="space-y-4 mb-6">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            What's Included
          </h4>

          <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
            <ImageIcon size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-white">Full Appearance</div>
              <div className="text-xs text-gray-400">
                Physical traits, facial features, clothing, and unique characteristics
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
            <FileText size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-white">Backstory & Personality</div>
              <div className="text-xs text-gray-400">
                Character history, motivations, and personality traits
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
            <Zap size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-white">AI Prompts</div>
              <div className="text-xs text-gray-400">
                Ready-to-use image generation and story prompts
              </div>
            </div>
          </div>
        </div>

        {/* Preview Details */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Backstory</h4>
            <p className="text-sm text-gray-300">{archetype.backstory}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Personality</h4>
            <p className="text-sm text-gray-300">{archetype.personality}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Motivations</h4>
            <p className="text-sm text-gray-300">{archetype.motivations}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Appearance Highlights</h4>
            <div className="space-y-1 text-sm text-gray-300">
              <div>• {archetype.appearance.gender}, {archetype.appearance.age}</div>
              <div>• {archetype.appearance.face.hairColor} hair, {archetype.appearance.face.eyeColor} eyes</div>
              <div>• {archetype.appearance.bodyType}</div>
              <div>• {archetype.appearance.clothing.style}</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {archetype.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Button in Preview */}
        <button
          onClick={onApply}
          className="w-full flex items-center justify-center gap-2 mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <Sparkles size={18} />
          Apply This Archetype
        </button>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ArchetypeSelector: React.FC<ArchetypeSelectorProps> = ({
  onSelect,
  onClose,
  currentGenre,
  existingCast = [],
  userId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedArchetype, setSelectedArchetype] = useState<CharacterArchetype | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Hooks
  const { archetypes, customArchetypes, saveArchetype } = useArchetypes(userId);
  const { filters, filteredArchetypes, updateFilters, resultCount } = useArchetypeFilters(archetypes);
  const { getCompatibility, rankCandidates } = useArchetypeCompatibility(existingCast);

  const categories = useMemo(() => ['all', ...getAllCategories()], []);

  // Handle archetype selection
  const handleArchetypeClick = (archetype: CharacterArchetype) => {
    setSelectedArchetype(archetype);
    setShowPreview(true);
  };

  // Handle final selection
  const handleApplyArchetype = () => {
    if (selectedArchetype) {
      onSelect(selectedArchetype);
      onClose();
    }
  };

  // Handle blend complete
  const handleBlendComplete = (result: BlendResult) => {
    // Create a synthetic archetype from blend result
    const blendedArchetype: CharacterArchetype = {
      id: `blend-${Date.now()}`,
      name: 'Blended Character',
      category: 'Hero', // Default, could be improved
      description: `Blended from ${result.blendSources.map(s => s.archetypeId).join(' and ')}`,
      backstory: result.backstory,
      motivations: result.motivations,
      personality: result.personality,
      appearance: result.appearance,
      imagePrompt: result.imagePrompt,
      storyPrompt: result.storyPrompt,
      tags: result.tags,
      genre: ['all'],
    };
    onSelect(blendedArchetype);
    onClose();
  };

  // Handle custom archetype save
  const handleSaveCustomArchetype = (input: any) => {
    // Would save through the hook in a real implementation
    // For now, just apply it
    const customArchetype: CharacterArchetype = {
      id: `custom-${Date.now()}`,
      name: input.name,
      category: input.category,
      description: `Custom archetype: ${input.name}`,
      backstory: input.backstory,
      motivations: input.motivations,
      personality: input.personality,
      appearance: input.appearance,
      imagePrompt: '',
      storyPrompt: '',
      tags: input.tags,
      genre: input.genres,
    };
    onSelect(customArchetype);
    onClose();
  };

  // Get archetypes with compatibility scores
  const rankedArchetypes = useMemo(() => {
    if (existingCast.length === 0) {
      return filteredArchetypes.map(a => ({
        archetype: a,
        compatibility: undefined,
      }));
    }
    return rankCandidates(filteredArchetypes);
  }, [filteredArchetypes, existingCast, rankCandidates]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Sparkles className="text-purple-400" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Intelligent Archetype System</h2>
                <p className="text-sm text-gray-400">
                  Browse, blend, or create character archetypes with smart inheritance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              data-testid="archetype-selector-close-btn"
            >
              <X size={24} />
            </button>
          </div>

          {/* View Toggle and Search */}
          <div className="flex flex-wrap gap-4 items-center">
            <ViewToggle activeView={viewMode} onViewChange={setViewMode} />

            {(viewMode === 'grid' || viewMode === 'hierarchy') && (
              <>
                <div className="flex-1 relative min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={filters.searchTerm || ''}
                    onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                    placeholder="Search archetypes..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="archetype-search-input"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filters.category || 'all'}
                    onChange={(e) => updateFilters({ category: e.target.value as ArchetypeCategory | 'all' })}
                    className="appearance-none pl-4 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    data-testid="archetype-category-select"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rankedArchetypes.map(({ archetype, compatibility }) => (
                  <ArchetypeCard
                    key={archetype.id}
                    archetype={archetype}
                    isSelected={selectedArchetype?.id === archetype.id}
                    onClick={() => handleArchetypeClick(archetype)}
                    compatibilityScore={compatibility?.score}
                    isCustom={(archetype as HierarchicalArchetype).isCustom}
                  />
                ))}
              </div>
            )}

            {/* Hierarchy View */}
            {viewMode === 'hierarchy' && (
              <ArchetypeHierarchy
                archetypes={filteredArchetypes}
                selectedId={selectedArchetype?.id}
                onSelect={handleArchetypeClick}
                currentGenre={currentGenre as ArchetypeGenre}
              />
            )}

            {/* Blender View */}
            {viewMode === 'blender' && (
              <ArchetypeBlender
                availableArchetypes={archetypes}
                onBlendComplete={handleBlendComplete}
                onCancel={() => setViewMode('grid')}
              />
            )}

            {/* Variations View */}
            {viewMode === 'variations' && (
              <VariationsPanel
                baseArchetype={selectedArchetype}
                onSelectVariation={(variation) => {
                  onSelect(variation);
                  onClose();
                }}
                onBack={() => setViewMode('grid')}
              />
            )}

            {/* Creator View */}
            {viewMode === 'creator' && (
              <ArchetypeCreator
                baseArchetype={selectedArchetype || undefined}
                onSave={handleSaveCustomArchetype}
                onCancel={() => setViewMode('grid')}
              />
            )}

            {/* Empty State */}
            {(viewMode === 'grid' || viewMode === 'hierarchy') && filteredArchetypes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <User size={48} className="mb-4 opacity-50" />
                <p className="text-lg">No archetypes found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <AnimatePresence>
            {showPreview && selectedArchetype && (viewMode === 'grid' || viewMode === 'hierarchy') && (
              <PreviewPanel
                archetype={selectedArchetype}
                onClose={() => setShowPreview(false)}
                onApply={handleApplyArchetype}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {(viewMode === 'grid' || viewMode === 'hierarchy') && (
          <div className="p-6 border-t border-gray-700 flex items-center justify-between bg-gray-900/50">
            <div className="text-sm text-gray-400">
              {resultCount} archetype{resultCount !== 1 ? 's' : ''} available
              {existingCast.length > 0 && (
                <span className="ml-2 text-purple-400">
                  • Compatibility scores based on {existingCast.length} existing character{existingCast.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                data-testid="archetype-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyArchetype}
                disabled={!selectedArchetype}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
                data-testid="archetype-apply-btn"
              >
                <Sparkles size={18} />
                Apply Archetype
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ArchetypeSelector;
