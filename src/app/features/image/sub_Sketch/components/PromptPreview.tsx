"use client";

import React from "react";
import { motion } from "framer-motion";
import { Copy, Sparkles, Check } from "lucide-react";
import { clsx } from "clsx";
import { ClaudePromptOption } from "../lib/promptMapClaude";

interface PromptPreviewProps {
  prompt: string;
  selections: {
    theme?: ClaudePromptOption;
    scene?: ClaudePromptOption;
    character?: ClaudePromptOption;
  };
  onCopy?: () => void;
  copied?: boolean;
}

export const PromptPreview: React.FC<PromptPreviewProps> = ({
  prompt,
  selections,
  onCopy,
  copied = false,
}) => {
  const hasAllSelections = selections.theme && selections.scene && selections.character;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2"
    >
      {/* Visual Selection Preview */}
      <div className="grid grid-cols-3 gap-2">
        {/* Theme */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={clsx(
              "w-full aspect-square rounded-lg flex items-center justify-center text-2xl transition-all",
              "border backdrop-blur-sm",
              selections.theme
                ? "bg-cyan-500/10 border-cyan-500/30 shadow-sm shadow-cyan-500/20"
                : "bg-slate-900/40 border-slate-800/60"
            )}
          >
            {selections.theme?.emoji || "🎨"}
          </div>
          <span className="text-[9px] text-slate-500 font-medium truncate w-full text-center">
            {selections.theme?.label || "Theme"}
          </span>
        </div>

        {/* Scene */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={clsx(
              "w-full aspect-square rounded-lg flex items-center justify-center text-2xl transition-all",
              "border backdrop-blur-sm",
              selections.scene
                ? "bg-purple-500/10 border-purple-500/30 shadow-sm shadow-purple-500/20"
                : "bg-slate-900/40 border-slate-800/60"
            )}
          >
            {selections.scene?.emoji || "🎬"}
          </div>
          <span className="text-[9px] text-slate-500 font-medium truncate w-full text-center">
            {selections.scene?.label || "Scene"}
          </span>
        </div>

        {/* Character */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={clsx(
              "w-full aspect-square rounded-lg flex items-center justify-center text-2xl transition-all",
              "border backdrop-blur-sm",
              selections.character
                ? "bg-amber-500/10 border-amber-500/30 shadow-sm shadow-amber-500/20"
                : "bg-slate-900/40 border-slate-800/60"
            )}
          >
            {selections.character?.emoji || "👤"}
          </div>
          <span className="text-[9px] text-slate-500 font-medium truncate w-full text-center">
            {selections.character?.label || "Character"}
          </span>
        </div>
      </div>

      {/* Combined Prompt Display */}
      <div className="relative bg-slate-950/80 border border-slate-900/70 rounded-lg p-2.5 backdrop-blur-sm">
        <div className="flex items-start gap-2">
          <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wide">
              Composed Prompt
            </div>
            <div
              className={clsx(
                "text-[11px] leading-relaxed transition-colors",
                prompt ? "text-slate-200" : "text-slate-500 italic"
              )}
            >
              {prompt || "Select options from each column to compose your prompt..."}
            </div>
          </div>

          {/* Copy Button */}
          {prompt && (
            <motion.button
              type="button"
              onClick={onCopy}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={clsx(
                "flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-all",
                "border backdrop-blur-sm",
                copied
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              )}
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </motion.button>
          )}
        </div>

        {/* Progress indicator */}
        {!hasAllSelections && (
          <div className="mt-2 pt-2 border-t border-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-slate-900/60 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${
                      ((selections.theme ? 1 : 0) +
                        (selections.scene ? 1 : 0) +
                        (selections.character ? 1 : 0)) *
                      33.33
                    }%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[9px] text-slate-500 font-medium">
                {(selections.theme ? 1 : 0) +
                  (selections.scene ? 1 : 0) +
                  (selections.character ? 1 : 0)}
                /3
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
