"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import type {
  ClaudePromptDimension,
  ClaudePromptOptionV2,
} from "../lib/promptMapV2Types";
import {
  dimensionOptionsV2,
  composePromptV2,
  calculateVibes,
} from "../lib/promptMapV2Utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModalityType = "text" | "voice" | "sketch";

/** A single contribution from any modality */
export interface ModalityInput {
  id: string;
  source: ModalityType;
  /** Raw text from the modality (transcript, description, typed text) */
  raw: string;
  /** Timestamp when this input was received */
  timestamp: number;
  /** 0–1 weight for blending into the final prompt */
  weight: number;
}

export interface SketchAnalysis {
  /** Verbal description inferred from composition analysis */
  description: string;
  /** Detected focal keywords from the sketch */
  keywords: string[];
  /** Estimated mood from visual weight / balance */
  mood: number;
  /** Estimated energy from density / contrast */
  energy: number;
}

export interface MultimodalState {
  /** V2 selection state (from text selection UI) */
  selections: Partial<
    Record<ClaudePromptDimension, ClaudePromptOptionV2 | undefined>
  >;
  /** Voice transcript fragments */
  voiceInputs: ModalityInput[];
  /** Latest sketch analysis */
  sketchAnalysis: SketchAnalysis | null;
  /** Free-form text refinement typed by user */
  textRefinement: string;
  /** Per-modality weight sliders (0–1) */
  weights: Record<ModalityType, number>;
  /** Whether voice is actively listening */
  isListening: boolean;
}

export interface SynthesisResult {
  /** The unified prompt string */
  prompt: string;
  /** Vibes derived from all modalities */
  vibes: { mood: number; energy: number };
  /** Breakdown showing each modality's contribution */
  contributions: { source: ModalityType; text: string; weight: number }[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS: Record<ModalityType, number> = {
  text: 0.5,
  voice: 0.3,
  sketch: 0.2,
};

let inputIdCounter = 0;

export function useMultimodalSynthesis(
  onPromptChange?: (prompt: string) => void
) {
  const [selections, setSelections] = useState<
    MultimodalState["selections"]
  >({});
  const [voiceInputs, setVoiceInputs] = useState<ModalityInput[]>([]);
  const [sketchAnalysis, setSketchAnalysis] =
    useState<SketchAnalysis | null>(null);
  const [textRefinement, setTextRefinement] = useState("");
  const [weights, setWeights] = useState<Record<ModalityType, number>>(
    DEFAULT_WEIGHTS
  );
  const [isListening, setIsListening] = useState(false);

  const prevPromptRef = useRef("");

  // -------------------------------------------------------------------------
  // Selection helpers (text modality — choose from V2 options)
  // -------------------------------------------------------------------------

  const selectOption = useCallback(
    (dimension: ClaudePromptDimension, option: ClaudePromptOptionV2 | null) => {
      setSelections((prev) => ({
        ...prev,
        [dimension]: option ?? undefined,
      }));
    },
    []
  );

  const clearSelections = useCallback(() => {
    setSelections({});
  }, []);

  // -------------------------------------------------------------------------
  // Voice modality
  // -------------------------------------------------------------------------

  const addVoiceTranscript = useCallback((transcript: string) => {
    if (!transcript.trim()) return;
    const input: ModalityInput = {
      id: `voice-${++inputIdCounter}`,
      source: "voice",
      raw: transcript.trim(),
      timestamp: Date.now(),
      weight: 1,
    };
    setVoiceInputs((prev) => [...prev.slice(-9), input]); // keep last 10
  }, []);

  const clearVoiceInputs = useCallback(() => {
    setVoiceInputs([]);
  }, []);

  // -------------------------------------------------------------------------
  // Sketch modality
  // -------------------------------------------------------------------------

  const updateSketchAnalysis = useCallback((analysis: SketchAnalysis) => {
    setSketchAnalysis(analysis);
  }, []);

  const clearSketchAnalysis = useCallback(() => {
    setSketchAnalysis(null);
  }, []);

  // -------------------------------------------------------------------------
  // Weight management
  // -------------------------------------------------------------------------

  const setModalityWeight = useCallback(
    (modality: ModalityType, value: number) => {
      setWeights((prev) => ({
        ...prev,
        [modality]: Math.max(0, Math.min(1, value)),
      }));
    },
    []
  );

  // -------------------------------------------------------------------------
  // Synthesis — fuse all modalities into a single prompt
  // -------------------------------------------------------------------------

  const synthesized = useMemo<SynthesisResult>(() => {
    const contributions: SynthesisResult["contributions"] = [];

    // 1. Text selections (V2 compose)
    const textBase = composePromptV2(selections, true);
    if (textBase) {
      contributions.push({
        source: "text",
        text: textBase,
        weight: weights.text,
      });
    }

    // 2. Free-form text refinement
    if (textRefinement.trim()) {
      contributions.push({
        source: "text",
        text: textRefinement.trim(),
        weight: weights.text,
      });
    }

    // 3. Voice transcripts — combine recent ones
    if (voiceInputs.length > 0) {
      const recentVoice = voiceInputs
        .slice(-3)
        .map((v) => v.raw)
        .join(". ");
      contributions.push({
        source: "voice",
        text: recentVoice,
        weight: weights.voice,
      });
    }

    // 4. Sketch analysis keywords + description
    if (sketchAnalysis) {
      const sketchParts = [
        ...sketchAnalysis.keywords,
        sketchAnalysis.description,
      ]
        .filter(Boolean)
        .join(", ");
      if (sketchParts) {
        contributions.push({
          source: "sketch",
          text: sketchParts,
          weight: weights.sketch,
        });
      }
    }

    // Build the weighted final prompt
    // Sort by weight descending so highest-weighted modality leads
    const sorted = [...contributions].sort((a, b) => b.weight - a.weight);

    // Primary modality contributes fully, others contribute proportionally
    const totalWeight = sorted.reduce((s, c) => s + c.weight, 0) || 1;
    const parts = sorted.map((c) => {
      // All contributions included, but order reflects priority
      return c.text;
    });

    const prompt = parts.join(", ");

    // Vibes: blend V2 selection vibes with sketch analysis vibes
    const selectionVibes = calculateVibes(selections);
    let mood = selectionVibes.mood;
    let energy = selectionVibes.energy;

    if (sketchAnalysis && weights.sketch > 0) {
      const sketchInfluence = weights.sketch / (weights.text + weights.sketch);
      mood = Math.round(
        mood * (1 - sketchInfluence) +
          sketchAnalysis.mood * sketchInfluence
      );
      energy = Math.round(
        energy * (1 - sketchInfluence) +
          sketchAnalysis.energy * sketchInfluence
      );
    }

    return {
      prompt,
      vibes: { mood, energy },
      contributions,
    };
  }, [selections, textRefinement, voiceInputs, sketchAnalysis, weights]);

  // Notify parent when prompt changes
  useEffect(() => {
    if (synthesized.prompt !== prevPromptRef.current) {
      prevPromptRef.current = synthesized.prompt;
      onPromptChange?.(synthesized.prompt);
    }
  }, [synthesized.prompt, onPromptChange]);

  return {
    // State
    selections,
    voiceInputs,
    sketchAnalysis,
    textRefinement,
    weights,
    isListening,
    synthesized,
    dimensionOptionsV2,

    // Actions
    selectOption,
    clearSelections,
    addVoiceTranscript,
    clearVoiceInputs,
    updateSketchAnalysis,
    clearSketchAnalysis,
    setTextRefinement,
    setModalityWeight,
    setIsListening,
  };
}
