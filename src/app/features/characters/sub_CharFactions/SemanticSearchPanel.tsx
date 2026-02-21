'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, BookOpen, Image, Trophy, Calendar, AlertCircle, Filter, X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { EmptyState } from '@/app/components/UI';
import { SemanticSearchResult } from '@/app/types/Faction';
import { factionApi } from '@/app/api/factions';
import ColoredBorder from '@/app/components/UI/ColoredBorder';

interface SemanticSearchPanelProps {
  factionId: string;
  factionName: string;
}

const typeIcons = {
  lore: BookOpen,
  media: Image,
  achievement: Trophy,
  event: Calendar,
  relationship: AlertCircle,
};

const typeColors = {
  lore: 'text-blue-400',
  media: 'text-purple-400',
  achievement: 'text-yellow-400',
  event: 'text-green-400',
  relationship: 'text-orange-400',
};

const typeBgColors = {
  lore: 'bg-blue-500/10',
  media: 'bg-purple-500/10',
  achievement: 'bg-yellow-500/10',
  event: 'bg-green-500/10',
  relationship: 'bg-orange-500/10',
};

const SemanticSearchPanel: React.FC<SemanticSearchPanelProps> = ({ factionId, factionName }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Array<'lore' | 'media' | 'relationship' | 'achievement' | 'event'>>([]);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchResults = await factionApi.semanticSearch({
        query: query.trim(),
        faction_id: factionId,
        limit: 20,
        threshold: 0.3,
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Semantic search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleTypeFilter = (type: 'lore' | 'media' | 'relationship' | 'achievement' | 'event') => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6">
        <ColoredBorder color="blue" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Search className="text-indigo-400" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Semantic Knowledge Search</h3>
              <p className="text-sm text-gray-400">
                Search across lore, media, events, and achievements using natural language
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            )}
            data-testid="toggle-filters-btn"
          >
            <Filter size={16} />
            Filters
            {selectedTypes.length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full">
                {selectedTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Filter by Content Type</span>
                  {selectedTypes.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      data-testid="clear-filters-btn"
                    >
                      <X size={12} />
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['lore', 'media', 'event', 'achievement'] as const).map((type) => {
                    const Icon = typeIcons[type];
                    const isSelected = selectedTypes.includes(type);

                    return (
                      <button
                        key={type}
                        onClick={() => toggleTypeFilter(type)}
                        className={cn('flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                          isSelected
                            ? `${typeBgColors[type]} ${typeColors[type]} ring-2 ring-offset-2 ring-offset-gray-800`
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        )}
                        data-testid={`filter-${type}-btn`}
                      >
                        <Icon size={14} />
                        <span className="text-sm capitalize">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'battles in the northern territories' or 'founding members'"
              className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              data-testid="search-input"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              data-testid="search-btn"
            >
              {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            Searching in: {factionName}
            {selectedTypes.length > 0 && (
              <> • Filtered to: {selectedTypes.join(', ')}</>
            )}
          </div>
        </form>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="relative bg-gray-900 rounded-lg border border-gray-800 p-6">
          <ColoredBorder color="blue" />

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="animate-spin text-indigo-400" size={32} />
              <p className="text-gray-400">Searching knowledge base...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </h4>
              </div>

              <div className="space-y-3">
                {results.map((result) => {
                  const Icon = typeIcons[result.type];
                  const typeColor = typeColors[result.type];
                  const typeBgColor = typeBgColors[result.type];

                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-indigo-500/50 transition-all"
                      data-testid={`search-result-${result.type}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('p-2 rounded-lg flex-shrink-0', typeBgColor)}>
                          <Icon className={typeColor} size={18} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-white mb-1">{result.title}</h5>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className={cn('px-2 py-0.5 rounded-full capitalize', typeBgColor, typeColor)}>
                                  {result.type}
                                </span>
                                {result.category && (
                                  <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full capitalize">
                                    {result.category.replace('-', ' ')}
                                  </span>
                                )}
                                {result.metadata.created_at && (
                                  <span className="text-gray-500">
                                    {formatDate(result.metadata.created_at)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-gray-700 to-indigo-500"
                                style={{ width: `${result.similarity_score * 50}px` }}
                              />
                              <span>{Math.round(result.similarity_score * 100)}%</span>
                            </div>
                          </div>

                          <p className="text-sm text-gray-300 line-clamp-3">{result.content}</p>

                          {result.metadata.url && (
                            <div className="mt-2">
                              <a
                                href={result.metadata.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                View Media
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Search />}
              title={`No results found for "${query}"`}
              subtitle="Try different keywords or adjust filters"
              iconSize="lg"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SemanticSearchPanel;
