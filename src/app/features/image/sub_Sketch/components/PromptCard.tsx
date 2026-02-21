"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { clsx } from "clsx";
import { ClaudePromptOption } from "../lib/promptMapClaude";

interface PromptCardProps {
  option: ClaudePromptOption;
  isSelected: boolean;
  accentColor: 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose';
  onClick: () => void;
}

const accentStyles = {
  cyan: {
    border: 'border-cyan-500/50',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    shadow: 'shadow-cyan-500/20',
    glow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]',
  },
  purple: {
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    shadow: 'shadow-purple-500/20',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
  },
  amber: {
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    shadow: 'shadow-amber-500/20',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  },
  emerald: {
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    shadow: 'shadow-emerald-500/20',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
  },
  rose: {
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    shadow: 'shadow-rose-500/20',
    glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]',
  },
};

export const PromptCard: React.FC<PromptCardProps> = ({
  option,
  isSelected,
  accentColor,
  onClick,
}) => {
  const styles = accentStyles[accentColor];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "relative w-full text-left rounded-lg p-2.5 transition-all",
        "border bg-slate-950/60 backdrop-blur-sm",
        "group overflow-hidden",
        isSelected
          ? `${styles.border} ${styles.bg} ${styles.shadow} ${styles.glow}`
          : "border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/60"
      )}
    >
      {/* Emoji Badge */}
      <div className="flex items-start gap-2 mb-1.5">
        <div
          className={clsx(
            "flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm transition-all",
            isSelected ? `${styles.bg} ${styles.border}` : "bg-slate-900/80 border border-slate-800"
          )}
        >
          {option.emoji || "✨"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4
              className={clsx(
                "text-[11px] font-semibold truncate transition-colors",
                isSelected ? styles.text : "text-slate-200 group-hover:text-slate-50"
              )}
            >
              {option.label}
            </h4>

            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className={clsx(
                  "flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center",
                  styles.bg,
                  styles.border
                )}
              >
                <Check className={clsx("w-2.5 h-2.5", styles.text)} />
              </motion.div>
            )}
          </div>

          <p
            className={clsx(
              "text-[10px] leading-snug mt-0.5 line-clamp-2 transition-colors",
              isSelected ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"
            )}
          >
            {option.description}
          </p>
        </div>
      </div>

      {/* Tags */}
      {option.tags && option.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {option.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={clsx(
                "px-1.5 py-0.5 rounded text-[9px] font-medium transition-all",
                isSelected
                  ? `${styles.bg} ${styles.text}`
                  : "bg-slate-900/60 text-slate-500 group-hover:bg-slate-800/80 group-hover:text-slate-400"
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Animated border gradient on hover */}
      {!isSelected && (
        <div
          className={clsx(
            "absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
            "bg-gradient-to-r from-transparent via-slate-700/20 to-transparent"
          )}
        />
      )}
    </motion.button>
  );
};
