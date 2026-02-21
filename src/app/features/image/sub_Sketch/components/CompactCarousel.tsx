"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ClaudePromptOptionV2 } from "../lib/promptMapClaudeV2";

interface CompactCarouselProps {
  options: ClaudePromptOptionV2[];
  selected?: ClaudePromptOptionV2;
  onSelect: (option: ClaudePromptOptionV2) => void;
  gradient: string;
}

export const CompactCarousel: React.FC<CompactCarouselProps> = ({
  options,
  selected,
  onSelect,
  gradient,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative group">
      {/* Scroll Buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800"
      >
        <ChevronLeft className="w-3 h-3 text-slate-300" />
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800"
      >
        <ChevronRight className="w-3 h-3 text-slate-300" />
      </button>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto hide-scrollbar scroll-smooth pb-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {options.map((option, index) => {
          const isSelected = selected?.id === option.id;

          return (
            <motion.button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 relative w-24 h-28 rounded-xl overflow-hidden transition-all group/card ${isSelected
                  ? "ring-2 ring-white/40 shadow-lg"
                  : "ring-1 ring-slate-800/60 hover:ring-slate-700"
                }`}
            >
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 opacity-${isSelected ? "100" : "30"} group-hover/card:opacity-60 transition-opacity`}
                style={{ background: option.visual.gradient }}
              />

              {/* Glass Overlay */}
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-2 text-center">
                <div className={`text-3xl mb-1.5 ${isSelected ? "scale-110" : ""} transition-transform`}>
                  {option.visual.icon}
                </div>
                <div className="text-[10px] font-semibold text-white line-clamp-2 leading-tight">
                  {option.label}
                </div>
                <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                  {option.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-1 py-0.5 rounded text-[8px] bg-black/30 text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center"
                >
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
