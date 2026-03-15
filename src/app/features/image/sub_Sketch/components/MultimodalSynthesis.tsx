"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Pencil,
  Type,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Tooltip } from "@/app/components/UI/Tooltip";
import { RangeSlider } from "@/app/components/UI/RangeSlider";
import { CLAUDE_COLUMNS_V2 } from "../lib/promptMapV2Columns";
import type {
  ClaudePromptDimension,
  ClaudePromptOptionV2,
} from "../lib/promptMapV2Types";
import {
  useMultimodalSynthesis,
  type ModalityType,
  type SketchAnalysis,
} from "../hooks/useMultimodalSynthesis";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MODALITY_META: Record<
  ModalityType,
  { label: string; icon: React.ReactNode; color: string; gradient: string }
> = {
  text: {
    label: "Text",
    icon: <Type className="w-3.5 h-3.5" />,
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-cyan-500/5",
  },
  voice: {
    label: "Voice",
    icon: <Mic className="w-3.5 h-3.5" />,
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  sketch: {
    label: "Sketch",
    icon: <Pencil className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
};

/** Compact dimension selector row */
function DimensionRow({
  dimension,
  column,
  options,
  selected,
  onSelect,
}: {
  dimension: ClaudePromptDimension;
  column: (typeof CLAUDE_COLUMNS_V2)[number];
  options: ClaudePromptOptionV2[];
  selected?: ClaudePromptOptionV2;
  onSelect: (
    dim: ClaudePromptDimension,
    opt: ClaudePromptOptionV2 | null
  ) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-800/60 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-xs transition-colors",
          "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500/50 focus-visible:outline-none",
          selected
            ? "bg-slate-800/60 text-slate-100"
            : "bg-slate-900/40 text-slate-400 hover:text-slate-200"
        )}
        aria-expanded={expanded}
        aria-label={`${column.label}: ${selected?.label ?? "none selected"}`}
      >
        <span className="flex items-center gap-2">
          <span>{column.icon}</span>
          <span className="font-medium">{column.label}</span>
          {selected && (
            <span className="text-slate-400 truncate max-w-[140px]">
              — {selected.label}
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="w-3 h-3 text-slate-500" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-500" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/60">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSelect(
                      dimension,
                      selected?.id === opt.id ? null : opt
                    );
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
                    selected?.id === opt.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/60 border border-slate-700/30"
                  )}
                  aria-pressed={selected?.id === opt.id}
                  title={opt.description}
                >
                  <span>{opt.visual.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Voice input section */
function VoiceSection({
  isListening,
  voiceInputs,
  onToggleListening,
  onClearVoice,
  onSimulateVoice,
}: {
  isListening: boolean;
  voiceInputs: { id: string; raw: string; timestamp: number }[];
  onToggleListening: () => void;
  onClearVoice: () => void;
  onSimulateVoice: (text: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tooltip
          content={
            isListening ? "Stop listening" : "Start voice input"
          }
          position="top"
        >
          <button
            onClick={onToggleListening}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all",
              "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
              isListening
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 ms-shadow-card shadow-purple-500/10"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/40"
            )}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
            aria-pressed={isListening}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Listening...</span>
                <motion.span
                  className="w-2 h-2 bg-purple-400 rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Voice</span>
              </>
            )}
          </button>
        </Tooltip>

        {/* Text-as-voice input for when voice hardware isn't available */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = inputRef.current?.value.trim();
            if (val) {
              onSimulateVoice(val);
              if (inputRef.current) inputRef.current.value = "";
            }
          }}
          className="flex-1 flex"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to simulate voice..."
            className="flex-1 bg-slate-800/40 border border-slate-700/40 text-xs text-slate-200 placeholder-slate-500 rounded-l-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            aria-label="Simulate voice input by typing"
          />
          <button
            type="submit"
            className="px-2 py-1.5 bg-slate-800/60 border border-l-0 border-slate-700/40 text-slate-400 hover:text-purple-300 rounded-r-md text-xs transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none"
            aria-label="Submit voice text"
          >
            Send
          </button>
        </form>

        {voiceInputs.length > 0 && (
          <Tooltip content="Clear voice history" position="top">
            <button
              onClick={onClearVoice}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none rounded"
              aria-label="Clear voice history"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Voice transcript chips */}
      {voiceInputs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {voiceInputs.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full"
            >
              <Mic className="w-2.5 h-2.5" />
              <span className="max-w-[200px] truncate">{v.raw}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Sketch analysis display */
function SketchSection({
  analysis,
}: {
  analysis: SketchAnalysis | null;
}) {
  if (!analysis) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-500 bg-slate-900/30 rounded-lg border border-slate-800/40">
        <Pencil className="w-3.5 h-3.5" />
        <span>Draw on the canvas — sketch analysis will appear here</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-3 py-2 text-xs bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20">
        <Pencil className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{analysis.description}</span>
      </div>
      {analysis.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {analysis.keywords.map((kw, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 text-xs bg-amber-500/10 text-amber-400 rounded"
            >
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MultimodalSynthesisProps {
  onPromptChange?: (prompt: string) => void;
  /** Canvas ref for sketch analysis */
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export default function MultimodalSynthesis({
  onPromptChange,
  canvasRef,
}: MultimodalSynthesisProps) {
  const {
    selections,
    voiceInputs,
    sketchAnalysis,
    textRefinement,
    weights,
    isListening,
    synthesized,
    dimensionOptionsV2: dimOptions,
    selectOption,
    clearSelections,
    addVoiceTranscript,
    clearVoiceInputs,
    updateSketchAnalysis,
    setTextRefinement,
    setModalityWeight,
    setIsListening,
  } = useMultimodalSynthesis(onPromptChange);

  const [showWeights, setShowWeights] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sketch analysis from canvas (debounced via pointer-up in parent)
  const analyzeSketch = useCallback(() => {
    if (!canvasRef?.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Quick analysis: calculate density, dominant regions, and contrast
    let totalPixels = 0;
    let filledPixels = 0;
    let rSum = 0, gSum = 0, bSum = 0;
    let topHalf = 0, bottomHalf = 0;
    let leftHalf = 0, rightHalf = 0;
    const midY = canvas.height / 2;
    const midX = canvas.width / 2;

    for (let i = 0; i < data.length; i += 4) {
      totalPixels++;
      const a = data[i + 3];
      if (a > 10) {
        filledPixels++;
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];

        const px = (i / 4) % canvas.width;
        const py = Math.floor(i / 4 / canvas.width);
        if (py < midY) topHalf++;
        else bottomHalf++;
        if (px < midX) leftHalf++;
        else rightHalf++;
      }
    }

    const density = filledPixels / totalPixels;
    if (density < 0.01) {
      updateSketchAnalysis({
        description: "Empty canvas",
        keywords: [],
        mood: 50,
        energy: 20,
      });
      return;
    }

    // Derive keywords from composition
    const keywords: string[] = [];
    const avgR = rSum / filledPixels;
    const avgG = gSum / filledPixels;
    const avgB = bSum / filledPixels;

    // Color temperature
    if (avgR > avgB + 30) keywords.push("warm tones");
    else if (avgB > avgR + 30) keywords.push("cool tones");

    // Density
    if (density > 0.4) keywords.push("dense composition");
    else if (density < 0.15) keywords.push("minimal composition");

    // Balance
    const hBalance = Math.abs(topHalf - bottomHalf) / filledPixels;
    const vBalance = Math.abs(leftHalf - rightHalf) / filledPixels;
    if (hBalance < 0.15 && vBalance < 0.15) keywords.push("balanced");
    if (topHalf > bottomHalf * 1.5) keywords.push("top-heavy");
    if (bottomHalf > topHalf * 1.5) keywords.push("grounded");
    if (leftHalf > rightHalf * 1.5) keywords.push("left-weighted");
    if (rightHalf > leftHalf * 1.5) keywords.push("right-weighted");

    // Energy from stroke density
    const energy = Math.min(100, Math.round(density * 200));
    // Mood from color warmth (warm = higher mood)
    const warmth = (avgR - avgB) / 255;
    const mood = Math.max(20, Math.min(80, 50 + Math.round(warmth * 30)));

    const description =
      density > 0.3
        ? "Detailed sketch with rich strokes"
        : density > 0.1
          ? "Sketch with moderate detail"
          : "Light sketch outlines";

    updateSketchAnalysis({ description, keywords, mood, energy });
  }, [canvasRef, updateSketchAnalysis]);

  // Copy prompt
  const handleCopy = useCallback(() => {
    if (!synthesized.prompt) return;
    navigator.clipboard.writeText(synthesized.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [synthesized.prompt]);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header with modality indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-100">
            Multimodal Synthesis
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Modality status indicators */}
          {(["text", "voice", "sketch"] as ModalityType[]).map((mod) => {
            const meta = MODALITY_META[mod];
            const active =
              (mod === "text" &&
                (Object.values(selections).some(Boolean) ||
                  textRefinement.trim())) ||
              (mod === "voice" && voiceInputs.length > 0) ||
              (mod === "sketch" && sketchAnalysis !== null);

            return (
              <Tooltip
                key={mod}
                content={`${meta.label}: ${active ? "active" : "inactive"}`}
                position="bottom"
              >
                <span
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs rounded-full border transition-colors",
                    active
                      ? `bg-gradient-to-r ${meta.gradient} ${meta.color} border-current/20`
                      : "bg-slate-900/40 text-slate-600 border-slate-800/40"
                  )}
                >
                  {meta.icon}
                  <span className="hidden sm:inline">{meta.label}</span>
                </span>
              </Tooltip>
            );
          })}

          <Tooltip content="Modality weights" position="bottom">
            <button
              onClick={() => setShowWeights((s) => !s)}
              className={cn(
                "p-1.5 rounded transition-colors",
                "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
                showWeights
                  ? "bg-slate-700/60 text-slate-200"
                  : "text-slate-500 hover:text-slate-300"
              )}
              aria-label="Toggle weight sliders"
              aria-expanded={showWeights}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Weight sliders (collapsible) */}
      <AnimatePresence>
        {showWeights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-2.5 bg-slate-900/50 rounded-lg border border-slate-800/40">
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Modality Weights
              </span>
              {(["text", "voice", "sketch"] as ModalityType[]).map((mod) => {
                const meta = MODALITY_META[mod];
                const accentMap: Record<ModalityType, "cyan" | "purple" | "yellow"> = {
                  text: "cyan",
                  voice: "purple",
                  sketch: "yellow",
                };
                return (
                  <div key={mod} className="flex items-center gap-2">
                    <span
                      className={cn("w-14 text-xs", meta.color)}
                    >
                      {meta.label}
                    </span>
                    <RangeSlider
                      aria-label={`${meta.label} modality weight`}
                      value={weights[mod]}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) => setModalityWeight(mod, v)}
                      accentColor={accentMap[mod]}
                      showAsPercent
                      className="flex-1"
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text modality: dimension selectors */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Type className="w-3 h-3" /> Text Selection
          </span>
          {Object.values(selections).some(Boolean) && (
            <button
              onClick={clearSelections}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none rounded px-1"
              aria-label="Clear text selections"
            >
              Clear
            </button>
          )}
        </div>
        {CLAUDE_COLUMNS_V2.map((col) => (
          <DimensionRow
            key={col.id}
            dimension={col.id}
            column={col}
            options={dimOptions[col.id]}
            selected={selections[col.id]}
            onSelect={selectOption}
          />
        ))}
      </div>

      {/* Free-form text refinement */}
      <textarea
        value={textRefinement}
        onChange={(e) => setTextRefinement(e.target.value)}
        placeholder="Type additional refinements... (e.g., 'with dramatic backlighting')"
        className="w-full bg-slate-900/40 border border-slate-800/40 text-xs text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        rows={2}
        aria-label="Text refinement"
      />

      {/* Voice modality */}
      <div>
        <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
          <Mic className="w-3 h-3" /> Voice Input
        </span>
        <VoiceSection
          isListening={isListening}
          voiceInputs={voiceInputs}
          onToggleListening={() => setIsListening(!isListening)}
          onClearVoice={clearVoiceInputs}
          onSimulateVoice={addVoiceTranscript}
        />
      </div>

      {/* Sketch modality */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Sketch Analysis
          </span>
          {canvasRef?.current && (
            <button
              onClick={analyzeSketch}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none rounded px-1"
              aria-label="Analyze current sketch"
            >
              Analyze
            </button>
          )}
        </div>
        <SketchSection analysis={sketchAnalysis} />
      </div>

      {/* Visual DNA: connection indicators */}
      <div className="flex items-center gap-1.5">
        {(["text", "voice", "sketch"] as ModalityType[]).map((mod, i) => {
          const meta = MODALITY_META[mod];
          const active =
            (mod === "text" &&
              (Object.values(selections).some(Boolean) ||
                textRefinement.trim())) ||
            (mod === "voice" && voiceInputs.length > 0) ||
            (mod === "sketch" && sketchAnalysis !== null);

          return (
            <React.Fragment key={mod}>
              {i > 0 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 rounded-full transition-colors",
                    active ? "bg-slate-600" : "bg-slate-800"
                  )}
                />
              )}
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs border transition-all",
                  active
                    ? `${meta.color} border-current/30 bg-gradient-to-br ${meta.gradient} scale-110`
                    : "text-slate-600 border-slate-800 bg-slate-900/40"
                )}
              >
                {meta.icon}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Vibes bar */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>Mood</span>
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-rose-500 rounded-full"
            animate={{ width: `${synthesized.vibes.mood}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span>{synthesized.vibes.mood}</span>
        <span className="ml-2">Energy</span>
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full"
            animate={{ width: `${synthesized.vibes.energy}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span>{synthesized.vibes.energy}</span>
      </div>

      {/* Synthesized prompt output */}
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-500 uppercase tracking-wider">
            Synthesized Prompt
          </span>
          <div className="flex items-center gap-1">
            {synthesized.contributions.length > 0 && (
              <div className="flex items-center gap-0.5">
                {synthesized.contributions.map((c, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      c.source === "text"
                        ? "bg-cyan-400"
                        : c.source === "voice"
                          ? "bg-purple-400"
                          : "bg-amber-400"
                    )}
                    title={`${MODALITY_META[c.source].label} (${Math.round(c.weight * 100)}%)`}
                  />
                ))}
              </div>
            )}
            <Tooltip content={copied ? "Copied!" : "Copy prompt"} position="top">
              <button
                onClick={handleCopy}
                disabled={!synthesized.prompt}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none rounded"
                aria-label="Copy synthesized prompt"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </Tooltip>
          </div>
        </div>

        <div
          className={cn(
            "px-3 py-2 text-xs rounded-lg border min-h-[48px]",
            synthesized.prompt
              ? "bg-slate-900/60 border-slate-700/40 text-slate-200"
              : "bg-slate-950/40 border-slate-800/30 text-slate-500 italic"
          )}
        >
          {synthesized.prompt || "Select options, speak, or sketch to begin..."}
        </div>
      </div>
    </div>
  );
}
