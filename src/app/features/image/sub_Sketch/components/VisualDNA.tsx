"use client";

import React from "react";
import { motion } from "framer-motion";
import { ClaudePromptOptionV2 } from "../lib/promptMapClaudeV2";

interface VisualDNAProps {
  theme?: ClaudePromptOptionV2;
  scene?: ClaudePromptOptionV2;
  character?: ClaudePromptOptionV2;
}

export const VisualDNA: React.FC<VisualDNAProps> = ({ theme, scene, character }) => {
  const selections = [
    { option: theme, label: "Style", gradient: "from-cyan-500 to-blue-500", id: "theme" },
    { option: scene, label: "Environment", gradient: "from-purple-500 to-pink-500", id: "scene" },
    { option: character, label: "Subject", gradient: "from-amber-500 to-orange-500", id: "character" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visual DNA</span>
        <div className="flex gap-1">
          {selections.map((s, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${s.option ? 'bg-white' : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-between px-2">
        {/* Connection Line Background */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800/50 -z-10" />

        {/* Connection Line Active */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 -z-10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 opacity-50"
            initial={{ width: "0%" }}
            animate={{ width: `${(selections.filter(s => s.option).length / 3) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {selections.map((item, index) => {
          const isSelected = !!item.option;

          return (
            <div key={item.id} className="relative group">
              <motion.div
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{
                  scale: isSelected ? 1 : 0.8,
                  opacity: isSelected ? 1 : 0.5,
                  borderColor: isSelected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)"
                }}
                className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative z-10
                    ${isSelected ? "bg-slate-900 shadow-lg shadow-purple-500/20" : "bg-slate-950"}
                `}
              >
                {isSelected && item.option ? (
                  <>
                    <div className="absolute inset-0 rounded-full opacity-50 blur-sm" style={{ background: item.option.visual.gradient }} />
                    <div className="relative z-10 text-xl">{item.option.visual.icon}</div>
                  </>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-800" />
                )}
              </motion.div>

              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-medium text-slate-500 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
