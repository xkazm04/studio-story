"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check, X, Copy, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  colorTheory,
  type ColorHarmony,
  type ColorPalette,
} from "@/lib/style";

const HARMONY_TYPES: { id: ColorHarmony; label: string; description: string }[] = [
  { id: "complementary", label: "Complementary", description: "Opposite on the wheel" },
  { id: "analogous", label: "Analogous", description: "Adjacent hues" },
  { id: "triadic", label: "Triadic", description: "Three evenly spaced" },
  { id: "split-complementary", label: "Split-Comp", description: "Opposite + neighbors" },
  { id: "monochromatic", label: "Mono", description: "Light/dark variations" },
  { id: "tetradic", label: "Tetradic", description: "Two complementary pairs" },
  { id: "square", label: "Square", description: "Four evenly spaced" },
];

interface ContrastBadgeProps {
  fg: string;
  bg: string;
}

function ContrastBadge({ fg, bg }: ContrastBadgeProps) {
  const ratio = colorTheory.getContrastRatio(fg, bg);
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono",
        passesAAA
          ? "bg-emerald-500/15 text-emerald-300"
          : passesAA
            ? "bg-amber-500/15 text-amber-300"
            : "bg-red-500/15 text-red-300"
      )}
      title={`Contrast ratio: ${ratio.toFixed(1)}:1${passesAAA ? " (AAA)" : passesAA ? " (AA)" : " (Fail)"}`}
    >
      {passesAAA ? (
        <Check className="w-3 h-3" />
      ) : passesAA ? (
        <Check className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
      {ratio.toFixed(1)}
      <span className="text-[10px] opacity-70">
        {passesAAA ? "AAA" : passesAA ? "AA" : "Fail"}
      </span>
    </span>
  );
}

interface SwatchProps {
  hex: string;
  label?: string;
  size?: "sm" | "md";
  onCopy?: (hex: string) => void;
}

function Swatch({ hex, label, size = "md", onCopy }: SwatchProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    onCopy?.(hex);
    setTimeout(() => setCopied(false), 1200);
  }, [hex, onCopy]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "group relative rounded-lg overflow-hidden transition-transform hover:scale-105",
        "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
        size === "sm" ? "w-8 h-8" : "w-12 h-12"
      )}
      title={`${label ? label + ": " : ""}${hex} — Click to copy`}
    >
      <div className="absolute inset-0" style={{ backgroundColor: hex }} />
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50"
          >
            <Copy className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

interface ColorHarmonyPaletteProps {
  /** Initial base color hex, e.g. "#3b82f6" */
  baseColor?: string;
  disabled?: boolean;
}

export function ColorHarmonyPalette({
  baseColor: initialBaseColor = "#3b82f6",
  disabled = false,
}: ColorHarmonyPaletteProps) {
  const [baseColor, setBaseColor] = useState(initialBaseColor);
  const [selectedHarmony, setSelectedHarmony] = useState<ColorHarmony>("complementary");
  const [expandedContrast, setExpandedContrast] = useState(false);

  // Generate palette for selected harmony
  const palette: ColorPalette = useMemo(
    () => colorTheory.generateHarmoniousPalette(baseColor, selectedHarmony),
    [baseColor, selectedHarmony]
  );

  // Generate all 7 harmony previews
  const allHarmonies = useMemo(
    () =>
      HARMONY_TYPES.map((h) => ({
        ...h,
        palette: colorTheory.generateHarmoniousPalette(baseColor, h.id),
      })),
    [baseColor]
  );

  // Text/background contrast pairs for the selected palette
  const contrastPairs = useMemo(() => {
    const pairs: { fg: string; bg: string; label: string }[] = [];
    const { text, backgrounds, swatches } = palette;

    pairs.push({ fg: text.primary, bg: backgrounds.primary, label: "Text on BG" });
    pairs.push({ fg: text.secondary, bg: backgrounds.primary, label: "Muted on BG" });

    // Check primary swatch as text on backgrounds
    if (swatches[0]) {
      pairs.push({ fg: swatches[0].hex, bg: backgrounds.primary, label: "Primary on BG" });
    }
    // Check accent on background
    if (swatches[2]) {
      pairs.push({ fg: swatches[2].hex, bg: backgrounds.primary, label: "Accent on BG" });
    }
    // White on each swatch
    swatches.slice(0, 4).forEach((sw, i) => {
      pairs.push({ fg: "#ffffff", bg: sw.hex, label: `White on Swatch ${i + 1}` });
    });

    return pairs;
  }, [palette]);

  return (
    <div className={cn("space-y-4", disabled && "opacity-50 pointer-events-none")}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="w-4 h-4 text-cyan-400" />
        <h3 className="ms-label">Color Harmonies</h3>
      </div>

      {/* Base Color Picker */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400">Base</label>
        <div className="relative">
          <input
            type="color"
            value={baseColor}
            onChange={(e) => setBaseColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
          />
        </div>
        <span className="font-mono text-xs text-slate-300">{baseColor}</span>
        <span className="text-xs text-slate-500">
          {colorTheory.getColorTemperature(baseColor)}
        </span>
      </div>

      {/* Harmony Type Selector — mini swatches for each harmony */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {allHarmonies.map((h) => (
          <button
            key={h.id}
            onClick={() => setSelectedHarmony(h.id)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-colors",
              "focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none",
              selectedHarmony === h.id
                ? "border-cyan-500/50 bg-cyan-500/10"
                : "border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60"
            )}
          >
            {/* Mini swatch strip */}
            <div className="flex -space-x-1 shrink-0">
              {h.palette.swatches.slice(0, 4).map((sw, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-slate-900"
                  style={{ backgroundColor: sw.hex }}
                />
              ))}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-200 truncate">{h.label}</div>
              <div className="text-[10px] text-slate-500 truncate">{h.description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Palette Display */}
      <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">
            {HARMONY_TYPES.find((h) => h.id === selectedHarmony)?.label} Palette
          </span>
          <span className="text-xs text-slate-500 capitalize">{palette.temperature}</span>
        </div>

        {/* Large swatches row */}
        <div className="flex gap-2 flex-wrap">
          {palette.swatches.map((sw, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <Swatch hex={sw.hex} label={sw.role} />
              <span className="font-mono text-[10px] text-slate-500">
                {sw.hex}
              </span>
              {sw.role && (
                <span className="text-[10px] text-slate-400 capitalize">{sw.role}</span>
              )}
            </div>
          ))}
        </div>

        {/* Derived background & text colors */}
        <div className="flex gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500">Backgrounds</span>
            <div className="flex gap-1">
              <Swatch hex={palette.backgrounds.primary} label="BG Primary" size="sm" />
              <Swatch hex={palette.backgrounds.secondary} label="BG Secondary" size="sm" />
              <Swatch hex={palette.backgrounds.tertiary} label="BG Tertiary" size="sm" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500">Text</span>
            <div className="flex gap-1">
              <Swatch hex={palette.text.primary} label="Text Primary" size="sm" />
              <Swatch hex={palette.text.secondary} label="Text Secondary" size="sm" />
              <Swatch hex={palette.text.muted} label="Text Muted" size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* WCAG Contrast Checker */}
      <div className="rounded-lg bg-slate-800/30 border border-slate-700/40 overflow-hidden">
        <button
          onClick={() => setExpandedContrast((v) => !v)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/40 transition-colors",
            "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500/50 focus-visible:outline-none"
          )}
        >
          <span className="font-medium">WCAG Contrast Check</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform",
              expandedContrast && "rotate-180"
            )}
          />
        </button>
        <AnimatePresence>
          {expandedContrast && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-1.5">
                {contrastPairs.map((pair, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 py-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Preview swatch pair */}
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: pair.bg, color: pair.fg }}
                      >
                        Aa
                      </div>
                      <span className="text-xs text-slate-400 truncate">
                        {pair.label}
                      </span>
                    </div>
                    <ContrastBadge fg={pair.fg} bg={pair.bg} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
