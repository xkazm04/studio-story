"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Droplet, Activity } from "lucide-react";

interface VibesMeterProps {
  mood: number; // 0-100
  energy: number; // 0-100
}

export const VibesMeter: React.FC<VibesMeterProps> = ({ mood, energy }) => {
  return (
    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vibes</h3>
        <Activity className="w-3 h-3 text-slate-600" />
      </div>

      {/* Mood */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-400 flex items-center gap-1"><Droplet className="w-2.5 h-2.5" /> Mood</span>
          <span className="text-slate-300 font-mono">{mood}%</span>
        </div>
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${mood}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Energy */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-slate-400 flex items-center gap-1"><Flame className="w-2.5 h-2.5" /> Energy</span>
          <span className="text-slate-300 font-mono">{energy}%</span>
        </div>
        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-orange-500 to-red-500"
            initial={{ width: 0 }}
            animate={{ width: `${energy}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};
