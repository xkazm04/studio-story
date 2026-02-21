/**
 * CastPreview - View all characters in unified style
 * Design: Clean Manuscript style with cyan accents
 *
 * Shows the entire character cast in a grid with style consistency indicators
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Grid,
  LayoutList,
  Filter,
  Search,
  AlertTriangle,
  Check,
  ChevronDown,
  Image,
  RefreshCw,
  Eye,
  Sparkles,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type {
  CharacterStyleProfile,
  StyleDefinition,
  CharacterStyleScore,
} from '../lib/styleEngine';

// ============================================================================
// Types
// ============================================================================

export interface CastPreviewProps {
  characters: CharacterStyleProfile[];
  styleDefinition?: StyleDefinition;
  consistencyScores?: CharacterStyleScore[];
  onSelectCharacter?: (characterId: string) => void;
  onRegenerateCharacter?: (characterId: string) => void;
  onRegenerateAll?: () => void;
  selectedCharacterId?: string | null;
  isLoading?: boolean;
  compact?: boolean;
}

type ViewMode = 'grid' | 'list' | 'compact';
type SortBy = 'name' | 'score' | 'deviation';
type FilterBy = 'all' | 'needsAttention' | 'consistent';

// ============================================================================
// Constants
// ============================================================================

const SCORE_THRESHOLDS = {
  excellent: 90,
  good: 70,
  fair: 50,
  poor: 0,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return 'text-green-400 bg-green-500/20 border-green-500/30';
  if (score >= SCORE_THRESHOLDS.good) return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
  if (score >= SCORE_THRESHOLDS.fair) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
  return 'text-red-400 bg-red-500/20 border-red-500/30';
}

function getScoreLabel(score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return 'Excellent';
  if (score >= SCORE_THRESHOLDS.good) return 'Good';
  if (score >= SCORE_THRESHOLDS.fair) return 'Fair';
  return 'Needs Work';
}

// ============================================================================
// Subcomponents
// ============================================================================

interface CharacterCardProps {
  character: CharacterStyleProfile;
  score?: CharacterStyleScore;
  isSelected: boolean;
  onClick: () => void;
  onRegenerate?: () => void;
  viewMode: ViewMode;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  score,
  isSelected,
  onClick,
  onRegenerate,
  viewMode,
}) => {
  const consistencyScore = score?.overallScore ?? (100 - character.styleDeviationScore);
  const needsRegeneration = score?.needsRegeneration ?? character.styleDeviationScore > 40;

  if (viewMode === 'list') {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all',
          isSelected
            ? 'bg-cyan-500/10 border-cyan-500/40'
            : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
        )}
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
          {character.avatarUrl ? (
            <img
              src={character.thumbnailUrl || character.avatarUrl}
              alt={character.characterName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Image size={20} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            'font-mono text-sm truncate',
            isSelected ? 'text-cyan-400' : 'text-slate-300'
          )}>
            {character.characterName}
          </h4>
          {character.extractedFeatures && (
            <div className="flex items-center gap-1 mt-1">
              {character.extractedFeatures.dominantColors.slice(0, 4).map((color, i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Score */}
        <div className={cn(
          'flex items-center gap-2 px-2 py-1 rounded border',
          getScoreColor(consistencyScore)
        )}>
          {needsRegeneration ? (
            <AlertTriangle size={14} />
          ) : (
            <Check size={14} />
          )}
          <span className="font-mono text-xs">{consistencyScore}%</span>
        </div>

        {/* Regenerate button */}
        {onRegenerate && needsRegeneration && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRegenerate();
            }}
            className="p-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
            title="Regenerate"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </motion.div>
    );
  }

  // Grid and compact view
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative group rounded-lg overflow-hidden border cursor-pointer transition-all',
        isSelected
          ? 'border-cyan-500 ring-2 ring-cyan-500/20'
          : 'border-slate-700/50 hover:border-slate-600'
      )}
    >
      {/* Avatar Image */}
      <div className={cn(
        'bg-slate-800',
        viewMode === 'compact' ? 'aspect-square' : 'aspect-[3/4]'
      )}>
        {character.avatarUrl ? (
          <img
            src={character.thumbnailUrl || character.avatarUrl}
            alt={character.characterName}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Image size={viewMode === 'compact' ? 24 : 32} />
          </div>
        )}
      </div>

      {/* Score Badge */}
      <div className={cn(
        'absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border',
        getScoreColor(consistencyScore)
      )}>
        {needsRegeneration ? (
          <AlertTriangle size={10} />
        ) : (
          <Check size={10} />
        )}
        <span>{consistencyScore}%</span>
      </div>

      {/* Name and Info */}
      {viewMode !== 'compact' && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
          <h4 className="font-mono text-xs text-white truncate">
            {character.characterName}
          </h4>
          {character.extractedFeatures && (
            <div className="flex items-center gap-0.5 mt-1">
              {character.extractedFeatures.dominantColors.slice(0, 4).map((color, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hover overlay for compact view */}
      {viewMode === 'compact' && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
          <span className="font-mono text-[9px] text-white truncate w-full text-center">
            {character.characterName}
          </span>
        </div>
      )}

      {/* Regenerate overlay button */}
      {onRegenerate && needsRegeneration && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegenerate();
          }}
          className="absolute top-2 left-2 p-1.5 rounded bg-black/60 text-cyan-400
                     opacity-0 group-hover:opacity-100 transition-opacity"
          title="Regenerate"
        >
          <RefreshCw size={12} />
        </button>
      )}
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const CastPreview: React.FC<CastPreviewProps> = ({
  characters,
  styleDefinition,
  consistencyScores,
  onSelectCharacter,
  onRegenerateCharacter,
  onRegenerateAll,
  selectedCharacterId,
  isLoading = false,
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(compact ? 'compact' : 'grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Create score map for quick lookup
  const scoreMap = useMemo(() => {
    const map = new Map<string, CharacterStyleScore>();
    consistencyScores?.forEach(score => {
      map.set(score.characterId, score);
    });
    return map;
  }, [consistencyScores]);

  // Filter and sort characters
  const filteredCharacters = useMemo(() => {
    let result = [...characters];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.characterName.toLowerCase().includes(query)
      );
    }

    // Apply filter by consistency
    if (filterBy === 'needsAttention') {
      result = result.filter(c => {
        const score = scoreMap.get(c.characterId);
        return score?.needsRegeneration || c.styleDeviationScore > 40;
      });
    } else if (filterBy === 'consistent') {
      result = result.filter(c => {
        const score = scoreMap.get(c.characterId);
        return !(score?.needsRegeneration) && c.styleDeviationScore <= 40;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.characterName.localeCompare(b.characterName);
          break;
        case 'score':
          const scoreA = scoreMap.get(a.characterId)?.overallScore ?? (100 - a.styleDeviationScore);
          const scoreB = scoreMap.get(b.characterId)?.overallScore ?? (100 - b.styleDeviationScore);
          comparison = scoreB - scoreA;
          break;
        case 'deviation':
          comparison = b.styleDeviationScore - a.styleDeviationScore;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [characters, searchQuery, filterBy, sortBy, sortAsc, scoreMap]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const total = characters.length;
    const needsWork = characters.filter(c => {
      const score = scoreMap.get(c.characterId);
      return score?.needsRegeneration || c.styleDeviationScore > 40;
    }).length;
    const consistent = total - needsWork;
    const avgScore = consistencyScores && consistencyScores.length > 0
      ? Math.round(consistencyScores.reduce((sum, s) => sum + s.overallScore, 0) / consistencyScores.length)
      : Math.round(characters.reduce((sum, c) => sum + (100 - c.styleDeviationScore), 0) / (total || 1));

    return { total, needsWork, consistent, avgScore };
  }, [characters, consistencyScores, scoreMap]);

  if (compact) {
    return (
      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <h3 className="font-mono text-xs uppercase tracking-wide text-slate-300">
              cast
            </h3>
            <span className="px-1.5 py-0.5 bg-slate-800/60 rounded text-[10px] font-mono text-slate-500">
              {stats.total}
            </span>
          </div>
          <div className={cn(
            'px-1.5 py-0.5 rounded text-[10px] font-mono border',
            getScoreColor(stats.avgScore)
          )}>
            {stats.avgScore}%
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {filteredCharacters.slice(0, 10).map((character) => (
            <CharacterCard
              key={character.characterId}
              character={character}
              score={scoreMap.get(character.characterId)}
              isSelected={selectedCharacterId === character.characterId}
              onClick={() => onSelectCharacter?.(character.characterId)}
              viewMode="compact"
            />
          ))}
          {filteredCharacters.length > 10 && (
            <div className="aspect-square rounded-lg bg-slate-800/40 border border-slate-700/50
                            flex items-center justify-center text-slate-500 font-mono text-xs">
              +{filteredCharacters.length - 10}
            </div>
          )}
        </div>
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
            cast_preview
          </h3>
          <span className="px-2 py-0.5 bg-slate-800/60 rounded text-xs font-mono text-slate-500">
            {stats.total} characters
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode buttons */}
          <div className="flex bg-slate-800/40 rounded-lg p-0.5">
            {([
              { mode: 'grid' as const, icon: <Grid size={14} /> },
              { mode: 'list' as const, icon: <LayoutList size={14} /> },
              { mode: 'compact' as const, icon: <Users size={14} /> },
            ]).map(({ mode, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  viewMode === mode
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* Regenerate all button */}
          {onRegenerateAll && stats.needsWork > 0 && (
            <button
              onClick={onRegenerateAll}
              className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20
                         hover:bg-cyan-500/30 text-cyan-400 text-xs font-mono transition-colors"
            >
              <Sparkles size={12} />
              <span>Regen {stats.needsWork}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 mb-4 p-2 bg-slate-800/30 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-500 uppercase">avg_score</span>
          <span className={cn(
            'px-1.5 py-0.5 rounded text-xs font-mono border',
            getScoreColor(stats.avgScore)
          )}>
            {stats.avgScore}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Check size={12} className="text-green-400" />
          <span className="font-mono text-xs text-slate-400">{stats.consistent} consistent</span>
        </div>
        {stats.needsWork > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle size={12} className="text-yellow-400" />
            <span className="font-mono text-xs text-slate-400">{stats.needsWork} needs work</span>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search characters..."
            className="w-full pl-8 pr-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300 placeholder:text-slate-600
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          />
        </div>

        {/* Filter */}
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value as FilterBy)}
          className="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                     font-mono text-xs text-slate-300
                     focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        >
          <option value="all">All Characters</option>
          <option value="needsAttention">Needs Attention</option>
          <option value="consistent">Consistent</option>
        </select>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 bg-slate-800/40 border border-slate-700/50 rounded-lg
                       font-mono text-xs text-slate-300
                       focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
          >
            <option value="name">Name</option>
            <option value="score">Score</option>
            <option value="deviation">Deviation</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/50
                       text-slate-400 hover:text-slate-300 transition-colors"
          >
            {sortAsc ? <SortAsc size={14} /> : <SortDesc size={14} />}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      )}

      {/* Character Grid/List */}
      {!isLoading && (
        <div className={cn(
          viewMode === 'list'
            ? 'space-y-2'
            : viewMode === 'compact'
            ? 'grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 gap-2'
            : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'
        )}>
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.characterId}
              character={character}
              score={scoreMap.get(character.characterId)}
              isSelected={selectedCharacterId === character.characterId}
              onClick={() => onSelectCharacter?.(character.characterId)}
              onRegenerate={
                onRegenerateCharacter
                  ? () => onRegenerateCharacter(character.characterId)
                  : undefined
              }
              viewMode={viewMode}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredCharacters.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Users size={32} className="mb-3 opacity-50" />
          <p className="font-mono text-sm mb-1">No characters found</p>
          <p className="font-mono text-xs text-slate-600">
            {characters.length > 0
              ? 'Try adjusting your filters'
              : 'Add characters to your project to see them here'}
          </p>
        </div>
      )}

      {/* Style Definition Info */}
      {styleDefinition && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-cyan-400" />
              <span className="font-mono text-xs text-slate-400">
                Style: {styleDefinition.name}
              </span>
              <span className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded
                             text-[10px] font-mono text-cyan-400">
                {styleDefinition.artDirection}
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-600">
              {styleDefinition.consistencyLevel} consistency
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CastPreview;
