"use client";

import React from "react";
import { motion } from "framer-motion";
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
      <button
        onClick={onRandomize}
        className="group relative p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all overflow-hidden"
        title="Randomize All"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Wand2 className="w-4 h-4 text-purple-300 group-hover:text-white transition-colors" />
      </button>

      <div className="w-px h-6 bg-white/10 mx-1" />

      {/* Clear */}
      <button
        onClick={onClear}
        disabled={!hasSelections}
        className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        title="Clear All"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
