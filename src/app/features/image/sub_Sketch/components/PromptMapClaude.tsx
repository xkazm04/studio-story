"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerDelay, NORMAL } from "@/lib/animations";
import { Sparkles, Filter, LayoutGrid, List, Search, X } from "lucide-react";
import { Button } from "@/app/components/UI/Button";
import { Input } from "@/app/components/UI/Input";
import { PromptCard } from "./PromptCard";
import { TagFilter } from "./TagFilter";
import { PromptPreview } from "./PromptPreview";
import {
  CLAUDE_PROMPT_COLUMNS,
  ClaudePromptDimension,
  ClaudePromptOption,
  claudeDimensionOptions,
  composeClaudePrompt,
  getAllTags,
} from "../lib/promptMapClaude";

interface PromptMapClaudeProps {
  onPromptChange?: (prompt: string) => void;
}

interface SelectionState {
  theme?: ClaudePromptOption;
  scene?: ClaudePromptOption;
  character?: ClaudePromptOption;
}

type ViewMode = 'grid' | 'compact';

export const PromptMapClaude: React.FC<PromptMapClaudeProps> = ({ onPromptChange }) => {
  const [selections, setSelections] = useState<SelectionState>({});
  const [search, setSearch] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [copied, setCopied] = useState(false);

  const allTags = useMemo(() => getAllTags(), []);

  const handleSelect = (dimension: ClaudePromptDimension, option: ClaudePromptOption) => {
    setSelections((prev) => {
      const next = { ...prev, [dimension]: option };
      const prompt = composeClaudePrompt(next);
      onPromptChange?.(prompt);
      return next;
    });
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  const handleCopyPrompt = async () => {
    const prompt = composeClaudePrompt(selections);
    if (prompt) {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const finalPrompt = useMemo(() => composeClaudePrompt(selections), [selections]);

  // Filter options based on search and tags
  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase();
    const hasTags = selectedTags.length > 0;

    const matchOption = (option: ClaudePromptOption) => {
      // Search filter
      const matchesSearch =
        !q ||
        option.label.toLowerCase().includes(q) ||
        option.description?.toLowerCase().includes(q) ||
        option.tags?.some((tag) => tag.toLowerCase().includes(q));

      // Tag filter
      const matchesTags =
        !hasTags || option.tags?.some((tag) => selectedTags.includes(tag));

      return matchesSearch && matchesTags;
    };

    return (Object.keys(claudeDimensionOptions) as ClaudePromptDimension[]).reduce(
      (acc, dimension) => {
        acc[dimension] = claudeDimensionOptions[dimension].filter(matchOption);
        return acc;
      },
      {} as typeof claudeDimensionOptions
    );
  }, [search, selectedTags]);

  return (
    <div className="flex flex-col gap-3 h-full text-sm text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              Claude Prompt Composer
            </span>
            <span className="text-sm text-slate-400">
              Visual prompt builder with smart filtering
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 bg-slate-900/60 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded transition-all focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none ${
                viewMode === 'grid'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2.5 rounded transition-all focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none ${
                viewMode === 'compact'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              aria-label="Compact view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            size="xs"
            variant={showFilter ? "primary" : "secondary"}
            className="text-sm px-2 py-1 h-7"
            onClick={() => setShowFilter((v) => !v)}
          >
            <Filter className="w-3 h-3 mr-1" />
            {showFilter ? "Hide" : "Filter"}
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <AnimatePresence initial={false}>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={NORMAL}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 bg-slate-950/80 border border-slate-900/70 rounded-lg p-2.5 backdrop-blur-sm">
              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800/60 rounded-lg px-2.5 py-1.5">
                <Search className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <Input
                  size="sm"
                  placeholder="Search by name, description, or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-none px-0 text-sm placeholder:text-slate-400"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="p-2.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tag Filter */}
              <TagFilter
                availableTags={allTags}
                selectedTags={selectedTags}
                onToggleTag={handleToggleTag}
                onClearAll={handleClearTags}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className={`grid gap-2.5 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
          {CLAUDE_PROMPT_COLUMNS.map((column, columnIndex) => {
            const options = filteredOptions[column.id];
            const selected = selections[column.id as ClaudePromptDimension];

            return (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={staggerDelay(columnIndex)}
                className="flex flex-col gap-2 bg-slate-950/90 border border-slate-900/70 rounded-lg p-2.5 backdrop-blur-sm"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{column.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-100">
                        {column.label}
                      </span>
                      <span className="text-sm text-slate-400">
                        {options.length} option{options.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {selected && (
                    <button
                      onClick={() => handleSelect(column.id, selected)}
                      className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      Deselect
                    </button>
                  )}
                </div>

                {/* Options List */}
                <div className={`space-y-1.5 ${viewMode === 'grid' ? 'max-h-[400px]' : 'max-h-[300px]'} overflow-y-auto custom-scrollbar pr-1`}>
                  {options.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="text-2xl opacity-30 mb-2">🔍</div>
                      <p className="text-sm text-slate-400 italic">
                        No matches found
                      </p>
                    </div>
                  ) : (
                    options.map((option, index) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={staggerDelay(index)}
                      >
                        <PromptCard
                          option={option}
                          isSelected={selected?.id === option.id}
                          accentColor={column.accentColor}
                          onClick={() => handleSelect(column.id, option)}
                        />
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Prompt Preview Footer */}
      <div className="border-t border-slate-800/50 pt-2">
        <PromptPreview
          prompt={finalPrompt}
          selections={selections}
          onCopy={handleCopyPrompt}
          copied={copied}
        />
      </div>
    </div>
  );
};

export default PromptMapClaude;
