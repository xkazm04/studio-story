"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Beaker, Layers, Grid3x3, Zap, Settings, Sparkles, Maximize2, Minimize2 } from "lucide-react";
import { VisualDNA } from "./VisualDNA";
import { VibesMeter } from "./VibesMeter";
import { PresetGallery } from "./PresetGallery";
import { CompactCarousel } from "./CompactCarousel";
import { QuickActions } from "./QuickActions";
import {
  CLAUDE_COLUMNS_V2,
  dimensionOptionsV2,
  ClaudePromptDimension,
  ClaudePromptOptionV2,
  composePromptV2,
  calculateVibes,
  getOptionById,
  PROMPT_PRESETS,
  PromptPreset,
} from "../lib/promptMapClaudeV2";

interface PromptLaboratoryProps {
  onPromptChange?: (prompt: string) => void;
}

type ViewMode = 'laboratory' | 'carousel' | 'grid';

interface SelectionState {
  theme?: ClaudePromptOptionV2;
  scene?: ClaudePromptOptionV2;
  character?: ClaudePromptOptionV2;
}

export const PromptLaboratory: React.FC<PromptLaboratoryProps> = ({ onPromptChange }) => {
  const [selections, setSelections] = useState<SelectionState>({});
  const [viewMode, setViewMode] = useState<ViewMode>('laboratory');
  const [copied, setCopied] = useState(false);
  const [useKeywords, setUseKeywords] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const finalPrompt = useMemo(
    () => composePromptV2(selections, useKeywords),
    [selections, useKeywords]
  );

  const vibes = useMemo(() => calculateVibes(selections), [selections]);

  const hasSelections = useMemo(
    () => !!(selections.theme || selections.scene || selections.character),
    [selections]
  );

  useEffect(() => {
    onPromptChange?.(finalPrompt);
  }, [finalPrompt, onPromptChange]);

  const handleSelect = useCallback((dimension: ClaudePromptDimension, option: ClaudePromptOptionV2) => {
    setSelections((prev) => ({ ...prev, [dimension]: option }));
  }, []);

  const handleRandomize = useCallback(() => {
    const randomTheme = dimensionOptionsV2.theme[Math.floor(Math.random() * dimensionOptionsV2.theme.length)];
    const randomScene = dimensionOptionsV2.scene[Math.floor(Math.random() * dimensionOptionsV2.scene.length)];
    const randomCharacter = dimensionOptionsV2.character[Math.floor(Math.random() * dimensionOptionsV2.character.length)];

    setSelections({
      theme: randomTheme,
      scene: randomScene,
      character: randomCharacter,
    });
  }, []);

  const handleShuffle = useCallback((dimension: ClaudePromptDimension) => {
    const options = dimensionOptionsV2[dimension];
    const randomOption = options[Math.floor(Math.random() * options.length)];
    setSelections((prev) => ({ ...prev, [dimension]: randomOption }));
  }, []);

  const handleClear = useCallback(() => {
    setSelections({});
  }, []);

  const handleCopy = useCallback(async () => {
    if (finalPrompt) {
      await navigator.clipboard.writeText(finalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [finalPrompt]);

  const handlePresetSelect = useCallback((preset: PromptPreset) => {
    const theme = getOptionById('theme', preset.selections.theme);
    const scene = getOptionById('scene', preset.selections.scene);
    const character = getOptionById('character', preset.selections.character);

    setSelections({
      theme,
      scene,
      character,
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            handleRandomize();
            break;
          case 'c':
            e.preventDefault();
            handleCopy();
            break;
          case 'Backspace':
            e.preventDefault();
            handleClear();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleRandomize, handleCopy, handleClear]);

  return (
    <div className="flex flex-col h-full text-slate-200 bg-slate-950 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 border border-white/10">
              <Sparkles className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-cyan-400 fill-current" />
            </div>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-white">
              Prompt Laboratory
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Next-Gen Visual Composition
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex bg-slate-900/50 border border-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('laboratory')}
              className={`p-2 rounded-md transition-all ${viewMode === 'laboratory'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              title="Laboratory Mode"
            >
              <Beaker className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              className={`p-2 rounded-md transition-all ${viewMode === 'carousel'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              title="Carousel Mode"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              title="Grid Mode"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />

          <QuickActions
            onRandomize={handleRandomize}
            onShuffle={handleShuffle}
            onClear={handleClear}
            onCopy={handleCopy}
            hasSelections={hasSelections}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel - Controls & DNA */}
        <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-white/5 bg-slate-900/30 backdrop-blur-sm overflow-y-auto custom-scrollbar p-4 flex flex-col gap-6">

          {/* Visual DNA & Vibes */}
          <section className="space-y-4">
            <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 shadow-xl">
              <VisualDNA
                theme={selections.theme}
                scene={selections.scene}
                character={selections.character}
              />
            </div>
            <VibesMeter mood={vibes.mood} energy={vibes.energy} />
          </section>

          {/* Presets */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presets</h3>
            </div>
            <PresetGallery presets={PROMPT_PRESETS} onSelect={handlePresetSelect} />
          </section>

          {/* Prompt Output */}
          <section className="flex-1 flex flex-col justify-end min-h-[150px]">
            <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-white/10 rounded-xl p-4 shadow-2xl relative group">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="p-1.5 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">Live Prompt</span>
                {copied && <span className="text-xs text-emerald-400 ml-auto font-medium">Copied!</span>}
              </div>

              <div className="max-h-32 overflow-y-auto custom-scrollbar">
                <p className={`text-sm leading-relaxed ${finalPrompt ? "text-slate-100" : "text-slate-600 italic"}`}>
                  {finalPrompt || "Select options to generate a prompt..."}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => setUseKeywords(!useKeywords)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <Settings className="w-3 h-3" />
                  {useKeywords ? "Keywords Mode" : "Natural Language"}
                </button>
                <div className="flex gap-2">
                  <span className="text-[10px] text-slate-600 font-mono">⌘R Random</span>
                  <span className="text-[10px] text-slate-600 font-mono">⌘C Copy</span>
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* Right Panel - Laboratory Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-950/20">
          <AnimatePresence mode="wait">
            {viewMode === 'laboratory' && (
              <motion.div
                key="laboratory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 xl:grid-cols-3 gap-6"
              >
                {CLAUDE_COLUMNS_V2.map((column, index) => {
                  const selected = selections[column.id];
                  const options = dimensionOptionsV2[column.id];

                  return (
                    <motion.div
                      key={column.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${column.gradient} flex items-center justify-center text-xl shadow-lg`}>
                          {column.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{column.label}</h3>
                          <p className="text-xs text-slate-400">{options.length} elements</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {options.map((option) => {
                          const isSelected = selected?.id === option.id;
                          return (
                            <motion.button
                              key={option.id}
                              onClick={() => handleSelect(column.id, option)}
                              whileHover={{ scale: 1.02, translateY: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className={`
                                                        relative aspect-[4/3] rounded-xl overflow-hidden group transition-all duration-300
                                                        ${isSelected
                                  ? "ring-2 ring-white shadow-xl shadow-purple-500/20 z-10"
                                  : "ring-1 ring-white/5 hover:ring-white/20 hover:shadow-lg"
                                }
                                                    `}
                            >
                              <div className="absolute inset-0 bg-slate-900" />
                              <div
                                className={`absolute inset-0 transition-opacity duration-500 ${isSelected ? "opacity-100" : "opacity-40 group-hover:opacity-70"}`}
                                style={{ background: option.visual.gradient }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                              <div className="absolute inset-0 p-3 flex flex-col justify-end items-start text-left">
                                <div className={`text-2xl mb-2 transition-transform duration-300 ${isSelected ? "scale-110 -translate-y-1" : "group-hover:scale-110 group-hover:-translate-y-1"}`}>
                                  {option.visual.icon}
                                </div>
                                <span className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
                                  {option.label}
                                </span>
                              </div>

                              {isSelected && (
                                <motion.div
                                  layoutId={`check-${column.id}`}
                                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-purple-600 flex items-center justify-center shadow-sm"
                                >
                                  <Zap className="w-3 h-3 fill-current" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {viewMode === 'carousel' && (
              <motion.div
                key="carousel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-8 max-w-5xl mx-auto"
              >
                {CLAUDE_COLUMNS_V2.map((column) => (
                  <div key={column.id} className="space-y-3">
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-xl">{column.icon}</span>
                      <h3 className="font-bold text-lg text-white">{column.label}</h3>
                    </div>
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-sm">
                      <CompactCarousel
                        options={dimensionOptionsV2[column.id]}
                        selected={selections[column.id]}
                        onSelect={(opt) => handleSelect(column.id, opt)}
                        gradient={column.gradient}
                      />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {viewMode === 'grid' && (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              >
                {Object.entries(dimensionOptionsV2).flatMap(([dimension, options]) =>
                  options.map((option) => {
                    const isSelected = selections[dimension as ClaudePromptDimension]?.id === option.id;
                    const column = CLAUDE_COLUMNS_V2.find(c => c.id === dimension);

                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => handleSelect(dimension as ClaudePromptDimension, option)}
                        whileHover={{ scale: 1.05, zIndex: 10 }}
                        whileTap={{ scale: 0.95 }}
                        layout
                        className={`
                                            relative aspect-square rounded-2xl overflow-hidden transition-all duration-300
                                            ${isSelected
                            ? "ring-2 ring-white shadow-2xl shadow-purple-500/30"
                            : "ring-1 ring-white/5 hover:ring-white/20"
                          }
                                        `}
                      >
                        <div className={`absolute inset-0 ${isSelected ? "opacity-100" : "opacity-60"}`} style={{ background: option.visual.gradient }} />
                        <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]" />

                        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                          <div className="text-3xl mb-2 drop-shadow-lg">{option.visual.icon}</div>
                          <span className="text-xs font-bold text-white drop-shadow-md line-clamp-2">{option.label}</span>
                        </div>

                        {column && (
                          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-xs border border-white/10">
                            {column.icon}
                          </div>
                        )}
                      </motion.button>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default PromptLaboratory;
