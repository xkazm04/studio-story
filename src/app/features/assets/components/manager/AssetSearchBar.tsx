'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { useAssetFiltersStore } from '../../store/assetFiltersStore';

export default function AssetSearchBar() {
  const {
    searchQuery,
    searchMode,
    setSearchQuery,
    toggleSearchMode,
    clearSearch,
  } = useAssetFiltersStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery]);

  // Sync local state with store
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleClear = useCallback(() => {
    setLocalQuery('');
    clearSearch();
  }, [clearSearch]);

  return (
    <div className="relative flex items-center gap-2">
      {/* Search input container */}
      <div
        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border
          bg-slate-950/80 transition-all duration-200
          ${
            searchMode === 'semantic'
              ? 'border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
              : 'border-slate-800/70 focus-within:border-slate-700'
          }
        `}
      >
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />

        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={
            searchMode === 'semantic'
              ? 'Search with AI (e.g., "blue armor with gold trim")...'
              : 'Search assets...'
          }
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500
            outline-none min-w-0"
          data-testid="asset-search-input"
        />

        {/* Clear button */}
        {localQuery && (
          <button
            onClick={handleClear}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* AI toggle */}
        <button
          onClick={toggleSearchMode}
          className={`p-1.5 rounded-md transition-all duration-200 ${
            searchMode === 'semantic'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
          }`}
          title={searchMode === 'semantic' ? 'Using AI search' : 'Enable AI search'}
          data-testid="ai-search-toggle"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* AI search indicator */}
      {searchMode === 'semantic' && (
        <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/20">
          AI
        </span>
      )}
    </div>
  );
}
