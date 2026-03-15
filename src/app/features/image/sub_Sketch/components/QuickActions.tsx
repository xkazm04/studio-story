"use client";

import React from "react";
import { motion } from "framer-motion";
import { interactive } from "@/lib/animations";
import { Shuffle, Wand2, Trash2, Copy, Download, Dice5 } from "lucide-react";

interface QuickActionsProps {
  onRandomize: () => void;
  onShuffle: (dimension: "theme" | "scene" | "character") => void;
  onClear: () => void;
  onCopy: () => void;
  onExport?: () => void;
  hasSelections: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onRandomize,
  onShuffle,
  onClear,
  onCopy,
  onExport,
  hasSelections,
}) => {
  return (
    <div className="flex items-center gap-1">
      {/* Randomize */}
      <motion.button
        onClick={onRandomize}
        whileTap={interactive.tapButton}
        className="group relative p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all overflow-hidden focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
        title="Randomize All"
        aria-label="Randomize all"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Wand2 className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />
      </motion.button>

      <div className="w-px h-6 bg-white/10 mx-1" />

      {/* Clear */}
      <motion.button
        onClick={onClear}
        whileTap={interactive.tapButton}
        disabled={!hasSelections}
        className="p-3 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
        title="Clear All"
        aria-label="Clear all"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </div>
  );
};
