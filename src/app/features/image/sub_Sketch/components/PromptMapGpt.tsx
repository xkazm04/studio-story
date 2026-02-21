"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Filter, X } from "lucide-react";
import {
  PROMPT_COLUMNS,
  PromptDimension,
  PromptOption,
  dimensionOptions,
  composePrompt,
} from "../lib/promptMapData";
import { Button } from "@/app/components/UI/Button";
import { Input } from "@/app/components/UI/Input";

interface PromptMapGptProps {
  onPromptChange?: (prompt: string) => void;
}

interface SelectionState {
  theme?: PromptOption;
  scene?: PromptOption;
  character?: PromptOption;
}

export const PromptMapGpt: React.FC<PromptMapGptProps> = ({ onPromptChange }) => {
  const [selections, setSelections] = useState<SelectionState>({});
  const [search, setSearch] = useState<string>("");
  const [showFilter, setShowFilter] = useState(false);

  const handleSelect = (dimension: PromptDimension, option: PromptOption) => {
    setSelections((prev) => {
      const next = { ...prev, [dimension]: option };
      const prompt = composePrompt(next);
      onPromptChange?.(prompt);
      return next;
    });
  };

  const finalPrompt = useMemo(() => composePrompt(selections), [selections]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return dimensionOptions;

    const q = search.toLowerCase();

    const matchOption = (option: PromptOption) => {
      return (
        option.label.toLowerCase().includes(q) ||
        option.description?.toLowerCase().includes(q) ||
        option.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    };

    return (Object.keys(dimensionOptions) as PromptDimension[]).reduce(
      (acc, dimension) => {
        acc[dimension] = dimensionOptions[dimension].filter(matchOption);
        return acc;
      },
      {} as typeof dimensionOptions
    );
  }, [search]);

  return (
    <div className="flex flex-col gap-3 text-sm text-slate-200">
      {/* Header + Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-tight text-slate-50">
              GPT Prompt Map
            </span>
            <span className="text-[11px] text-slate-500">
              Pick one item per column to compose a rich image prompt.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="secondary"
            className="text-[11px] px-2 py-1 h-7"
            onClick={() => setShowFilter((v) => !v)}
          >
            <Filter className="w-3 h-3 mr-1" />
            Filter
          </Button>
          {finalPrompt && (
            <Button
              size="xs"
              variant="ghost"
              className="text-[11px] px-2 py-1 h-7"
              onClick={() => {
                navigator.clipboard.writeText(finalPrompt);
              }}
            >
              Copy
            </Button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <AnimatePresence initial={false}>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-900/70 rounded-lg px-3 py-2">
              <Input
                size="sm"
                placeholder="Search themes, scenes, characters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none px-0"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="p-1 rounded hover:bg-slate-900 text-slate-400"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
        {PROMPT_COLUMNS.map((column) => {
          const options = filteredOptions[column.id];
          const selected = selections[column.id as PromptDimension];

          const accentBorder =
            column.accentColor === "cyan"
              ? "border-cyan-500/40"
              : column.accentColor === "purple"
              ? "border-purple-500/40"
              : "border-amber-500/40";

          const accentDot =
            column.accentColor === "cyan"
              ? "bg-cyan-500"
              : column.accentColor === "purple"
              ? "bg-purple-500"
              : "bg-amber-500";

          return (
            <div
              key={column.id}
              className="flex flex-col gap-1.5 bg-slate-950/95 border border-slate-900/70 rounded-lg p-2.5"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${accentDot}`} />
                  <span className="text-[11px] font-semibold tracking-tight text-slate-100">
                    {column.label}
                  </span>
                </div>
                {selected && (
                  <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {selected.label}
                  </span>
                )}
              </div>

              {/* Option List */}
              <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {options.length === 0 && (
                  <div className="text-[11px] text-slate-500 italic py-1">
                    No matches for this filter.
                  </div>
                )}
                {options.map((option) => {
                  const isActive = selected?.id === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(column.id, option)}
                      className={`w-full text-left rounded-md px-2 py-1.5 transition-all text-[11px] leading-snug border
                        ${isActive
                          ? `${accentBorder} bg-slate-900/80 text-slate-50 shadow-[0_0_0_1px_rgba(8,145,178,0.28)]`
                          : "border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-900"}
                      `}
                    >
                      <div className="font-medium truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {option.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Final Prompt Preview */}
      <div className="mt-1 bg-slate-950/95 border border-slate-900/70 rounded-lg p-2.5 flex items-start gap-2">
        <span className="text-[11px] font-semibold text-slate-400 mt-0.5 whitespace-nowrap">
          Combined Prompt
        </span>
        <div className="flex-1 text-[11px] text-slate-100 bg-slate-950/80 rounded-md px-2 py-1 border border-slate-900/70 min-h-[32px]">
          {finalPrompt || (
            <span className="text-slate-500">Select a theme, scene, and character to build a prompt.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptMapGpt;
