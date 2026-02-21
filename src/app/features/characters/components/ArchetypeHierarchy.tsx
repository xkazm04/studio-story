'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  GitBranch,
  Sparkles,
  User,
  Crown,
  Swords,
  BookOpen,
  Shield,
  Heart,
  Eye,
  Wand2,
  Users,
  Compass,
  Brain,
  Laugh,
  Star,
} from 'lucide-react';
import { CharacterArchetype, ArchetypeCategory, ArchetypeGenre } from '@/app/types/Archetype';
import {
  HierarchicalArchetype,
  ArchetypeLevel,
  BASE_ARCHETYPES,
  GENRE_MODIFIERS,
} from '@/app/features/characters/lib/archetypeEngine';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface ArchetypeHierarchyProps {
  archetypes: CharacterArchetype[];
  selectedId?: string;
  onSelect: (archetype: CharacterArchetype) => void;
  currentGenre?: ArchetypeGenre;
  showBaseArchetypes?: boolean;
  className?: string;
}

interface CategoryNode {
  category: ArchetypeCategory;
  baseData: Partial<CharacterArchetype>;
  archetypes: CharacterArchetype[];
  isExpanded: boolean;
}

// ============================================================================
// Category Icons
// ============================================================================

const CATEGORY_ICONS: Record<ArchetypeCategory, React.ReactNode> = {
  Hero: <Swords size={16} />,
  Villain: <Crown size={16} />,
  Mentor: <BookOpen size={16} />,
  Sidekick: <Users size={16} />,
  Rogue: <Eye size={16} />,
  Guardian: <Shield size={16} />,
  Trickster: <Laugh size={16} />,
  Innocent: <Heart size={16} />,
  Ruler: <Crown size={16} />,
  Lover: <Heart size={16} />,
  Explorer: <Compass size={16} />,
  Sage: <Brain size={16} />,
};

const CATEGORY_COLORS: Record<ArchetypeCategory, string> = {
  Hero: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  Villain: 'text-red-400 bg-red-400/10 border-red-400/30',
  Mentor: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Sidekick: 'text-green-400 bg-green-400/10 border-green-400/30',
  Rogue: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  Guardian: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  Trickster: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  Innocent: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  Ruler: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  Lover: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
  Explorer: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  Sage: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
};

const LEVEL_BADGES: Record<ArchetypeLevel, { label: string; color: string }> = {
  base: { label: 'Base', color: 'bg-gray-600 text-gray-200' },
  genre: { label: 'Genre', color: 'bg-blue-600 text-blue-100' },
  specific: { label: 'Specific', color: 'bg-purple-600 text-purple-100' },
  custom: { label: 'Custom', color: 'bg-green-600 text-green-100' },
};

// ============================================================================
// Subcomponents
// ============================================================================

interface CategoryHeaderProps {
  category: ArchetypeCategory;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  baseDescription?: string;
}

const CategoryHeader: React.FC<CategoryHeaderProps> = ({
  category,
  count,
  isExpanded,
  onToggle,
  baseDescription,
}) => {
  const colorClasses = CATEGORY_COLORS[category];

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
        'hover:bg-gray-800/50',
        colorClasses
      )}
    >
      <span className="p-1.5 rounded-md bg-current/10">
        {CATEGORY_ICONS[category]}
      </span>

      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{category}</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/10">
            {count}
          </span>
        </div>
        {baseDescription && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
            {baseDescription}
          </p>
        )}
      </div>

      <motion.span
        animate={{ rotate: isExpanded ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight size={18} className="text-gray-400" />
      </motion.span>
    </button>
  );
};

interface ArchetypeNodeProps {
  archetype: CharacterArchetype;
  isSelected: boolean;
  onClick: () => void;
  level?: ArchetypeLevel;
  depth?: number;
}

const ArchetypeNode: React.FC<ArchetypeNodeProps> = ({
  archetype,
  isSelected,
  onClick,
  level = 'specific',
  depth = 1,
}) => {
  const hierarchical = archetype as HierarchicalArchetype;
  const actualLevel = hierarchical.level || level;
  const badge = LEVEL_BADGES[actualLevel];

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left',
        'hover:bg-gray-800/50',
        isSelected
          ? 'border-purple-500 bg-purple-900/20'
          : 'border-gray-700/50 bg-gray-800/30'
      )}
      style={{ marginLeft: depth * 16 }}
    >
      {/* Connection Line */}
      <div className="relative flex items-center">
        <GitBranch size={14} className="text-gray-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white truncate">{archetype.name}</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded', badge.color)}>
            {badge.label}
          </span>
          {hierarchical.isCustom && (
            <Sparkles size={12} className="text-yellow-400" />
          )}
        </div>
        <p className="text-xs text-gray-400 line-clamp-2">
          {archetype.description}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {archetype.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 bg-gray-700/50 text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex-shrink-0"
        >
          <Star size={16} className="text-purple-400 fill-purple-400" />
        </motion.div>
      )}
    </motion.button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const ArchetypeHierarchy: React.FC<ArchetypeHierarchyProps> = ({
  archetypes,
  selectedId,
  onSelect,
  currentGenre,
  showBaseArchetypes = true,
  className,
}) => {
  // Track expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<ArchetypeCategory>>(
    new Set()
  );

  // Filter archetypes by genre if provided
  const filteredArchetypes = useMemo(() => {
    if (!currentGenre || currentGenre === 'all') {
      return archetypes;
    }
    return archetypes.filter(
      a => a.genre.includes(currentGenre) || a.genre.includes('all')
    );
  }, [archetypes, currentGenre]);

  // Group archetypes by category
  const categoryNodes = useMemo((): CategoryNode[] => {
    const categories = Object.keys(BASE_ARCHETYPES) as ArchetypeCategory[];

    return categories.map(category => {
      const categoryArchetypes = filteredArchetypes.filter(
        a => a.category === category
      );
      const baseData = BASE_ARCHETYPES[category] || {};

      return {
        category,
        baseData,
        archetypes: categoryArchetypes,
        isExpanded: expandedCategories.has(category),
      };
    }).filter(node => node.archetypes.length > 0 || showBaseArchetypes);
  }, [filteredArchetypes, expandedCategories, showBaseArchetypes]);

  // Toggle category expansion
  const toggleCategory = (category: ArchetypeCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Expand all categories
  const expandAll = () => {
    const allCategories = categoryNodes.map(n => n.category);
    setExpandedCategories(new Set(allCategories));
  };

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Layers size={16} />
          <span>Archetype Hierarchy</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Expand all
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Genre Filter Indicator */}
      {currentGenre && currentGenre !== 'all' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm">
          <Wand2 size={14} className="text-blue-400" />
          <span className="text-blue-300">
            Showing archetypes for <strong>{currentGenre}</strong> genre
          </span>
        </div>
      )}

      {/* Category Tree */}
      <div className="space-y-2">
        {categoryNodes.map(node => (
          <div key={node.category} className="space-y-1">
            <CategoryHeader
              category={node.category}
              count={node.archetypes.length}
              isExpanded={node.isExpanded}
              onToggle={() => toggleCategory(node.category)}
              baseDescription={node.baseData.personality}
            />

            <AnimatePresence>
              {node.isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pl-4 space-y-1 py-1">
                    {/* Base Archetype Info */}
                    {showBaseArchetypes && node.baseData && (
                      <div className="flex items-start gap-3 p-2 rounded-lg bg-gray-900/50 border border-gray-700/30 ml-4 mb-2">
                        <div className="p-1 rounded bg-gray-700">
                          <GitBranch size={12} className="text-gray-400" />
                        </div>
                        <div className="text-xs text-gray-400">
                          <div className="font-medium text-gray-300 mb-1">
                            Base {node.category} Traits
                          </div>
                          <p className="line-clamp-2">
                            {node.baseData.personality}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Specific Archetypes */}
                    {node.archetypes.map(archetype => (
                      <ArchetypeNode
                        key={archetype.id}
                        archetype={archetype}
                        isSelected={selectedId === archetype.id}
                        onClick={() => onSelect(archetype)}
                        level={(archetype as HierarchicalArchetype).level || 'specific'}
                        depth={1}
                      />
                    ))}

                    {node.archetypes.length === 0 && (
                      <div className="ml-4 p-3 text-sm text-gray-500 italic">
                        No specific archetypes in this category
                        {currentGenre && currentGenre !== 'all'
                          ? ` for ${currentGenre} genre`
                          : ''}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {categoryNodes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <User size={48} className="mb-4 opacity-50" />
          <p className="text-lg">No archetypes available</p>
          <p className="text-sm">
            {currentGenre && currentGenre !== 'all'
              ? `Try selecting a different genre`
              : 'Check your archetype library'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ArchetypeHierarchy;
