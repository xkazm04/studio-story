'use client';

import React from 'react';
import { X } from 'lucide-react';
import type { FacetHeaderProps } from '../types';

/**
 * Generic header showing the current selection for the active dimension.
 * Displays dimension label, selected option name (or custom text), and a clear button.
 */
export function FacetHeader({
  config,
  activeDimensionId,
  selections,
  onClear,
}: FacetHeaderProps) {
  if (!activeDimensionId) return null;

  const selection = selections[activeDimensionId];
  const hasValue =
    selection && (selection.optionId !== null || selection.isCustom);

  if (!hasValue) return null;

  const dimension = config.dimensions.find((d) => d.id === activeDimensionId);
  let label = 'Custom prompt';
  if (selection.isCustom && selection.customPrompt) {
    label = selection.customPrompt;
  } else if (selection.optionId !== null) {
    const options = config.options[activeDimensionId] || [];
    const opt = options.find((o) => o.id === selection.optionId);
    if (opt) label = opt.name;
  }

  return (
    <div className="px-4 py-2 border-b border-white/[0.04] flex items-center gap-2">
      <span className="text-sm text-slate-400">{dimension?.label}:</span>
      <span className="text-xs text-amber-400 truncate flex-1">{label}</span>
      <button
        onClick={() => onClear(activeDimensionId)}
        className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
}
