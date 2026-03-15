"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { interactive } from "@/lib/animations";
import { X, Tag } from "lucide-react";
import { clsx } from "clsx";

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  availableTags,
  selectedTags,
  onToggleTag,
  onClearAll,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3 h-3 text-slate-400" />
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Filter by Tags
          </span>
        </div>

        {selectedTags.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-slate-400 hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none rounded"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Tag Pills */}
      <div className="flex flex-wrap gap-1.5">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);

          return (
            <motion.button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              whileHover={interactive.hoverScale}
              whileTap={interactive.tapScale}
              className={clsx(
                "px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                "border backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
                isSelected
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 ms-shadow-subtle shadow-cyan-500/20"
                  : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-300"
              )}
            >
              {tag}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="ml-1 inline-block"
                >
                  ×
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Active filters indicator */}
      <AnimatePresence>
        {selectedTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 pt-1 border-t border-slate-800/50"
          >
            <span className="text-sm text-slate-400">Active:</span>
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-sm text-cyan-400 border border-cyan-500/20"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
