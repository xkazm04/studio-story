/**
 * OptionSelector Component
 * Collapsible option picker for prompt dimensions
 */

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PromptColumn, PromptOption, PromptDimension } from '../types';

interface OptionSelectorProps {
  column: PromptColumn;
  selectedOption?: PromptOption;
  isExpanded: boolean;
  loading?: boolean;
  onToggle: (columnId: string) => void;
  onSelect: (dimension: PromptDimension, option: PromptOption) => void;
}

export function OptionSelector({
  column,
  selectedOption,
  isExpanded,
  loading = false,
  onToggle,
  onSelect,
}: OptionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return column.options;

    const query = searchQuery.toLowerCase();
    return column.options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description.toLowerCase().includes(query) ||
        option.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [column.options, searchQuery]);

  const handleSelect = (option: PromptOption) => {
    onSelect(column.id, option);
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 transition-all duration-200',
        isExpanded
          ? 'border-cyan-500/50 bg-slate-800/50'
          : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
      )}
      data-column-id={column.id}
    >
      {/* Header */}
      <button
        onClick={() => onToggle(column.id)}
        className="w-full flex items-center justify-between p-3 text-left"
        disabled={loading}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{column.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{column.label}</h3>
            {selectedOption ? (
              <p className="text-xs text-cyan-400 flex items-center gap-1">
                <span>{selectedOption.icon}</span>
                {selectedOption.label}
              </p>
            ) : (
              <p className="text-xs text-slate-500">{column.description}</p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${column.label.toLowerCase()}...`}
                  className={cn(
                    'w-full pl-8 pr-8 py-1.5 text-xs rounded-md',
                    'bg-slate-800 border border-slate-700',
                    'text-slate-200 placeholder:text-slate-500',
                    'focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500'
                  )}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {filteredOptions.map((option) => {
                  const isSelected = selectedOption?.id === option.id;

                  return (
                    <motion.button
                      key={option.id}
                      onClick={() => handleSelect(option)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'p-2 rounded-md text-left transition-colors relative',
                        isSelected
                          ? 'bg-cyan-600/20 border border-cyan-500/50'
                          : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="text-sm shrink-0">{option.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-xs font-medium truncate',
                              isSelected ? 'text-cyan-300' : 'text-slate-200'
                            )}
                          >
                            {option.label}
                          </p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {option.description}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {filteredOptions.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-2">
                  No options match "{searchQuery}"
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
