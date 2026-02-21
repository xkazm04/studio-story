"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { PromptPreset } from "../lib/promptMapClaudeV2";

interface PresetGalleryProps {
  presets: PromptPreset[];
  onSelect: (preset: PromptPreset) => void;
}

export const PresetGallery: React.FC<PresetGalleryProps> = ({ presets, onSelect }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-purple-400" />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          Quick Start Presets
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {presets.map((preset, index) => (
          <motion.button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex flex-col items-center gap-1.5 bg-gradient-to-br from-slate-900/80 to-slate-950/80 border border-slate-800/60 hover:border-purple-500/40 rounded-lg p-2.5 min-w-[80px] transition-all group"
          >
            <div className="text-2xl group-hover:scale-110 transition-transform">
              {preset.emoji}
            </div>
            <div className="text-center">
              <div className="text-[10px] font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">
                {preset.name}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 line-clamp-2">
                {preset.description}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
