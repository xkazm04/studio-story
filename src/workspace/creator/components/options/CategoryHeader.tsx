'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useCreatorUIStore } from '../../store/creatorUIStore';
import { useCreatorCharacterStore } from '../../store/creatorCharacterStore';
import { getCategoryById, getOptionsForCategory } from '../../constants';

export function CategoryHeader() {
  const activeCategory = useCreatorUIStore((s) => s.activeCategory);
  const selections = useCreatorCharacterStore((s) => s.selections);
  const setSelection = useCreatorCharacterStore((s) => s.setSelection);
  const clearCustomPrompt = useCreatorCharacterStore((s) => s.clearCustomPrompt);

  if (!activeCategory) return null;

  const selection = selections[activeCategory];
  const hasValue = selection && (selection.optionId !== null || selection.isCustom);

  if (!hasValue) return null;

  const category = getCategoryById(activeCategory);
  let label = 'Custom prompt';
  if (selection.isCustom && selection.customPrompt) {
    label = selection.customPrompt;
  } else if (selection.optionId !== null) {
    const options = getOptionsForCategory(activeCategory);
    const opt = options.find((o) => o.id === selection.optionId);
    if (opt) label = opt.name;
  }

  const handleClear = () => {
    setSelection(activeCategory, null);
    clearCustomPrompt(activeCategory);
  };

  return (
    <div className="px-4 py-2 border-b border-white/[0.04] flex items-center gap-2">
      <span className="text-xs text-slate-500">
        {category?.label}:
      </span>
      <span className="text-xs text-amber-400 truncate flex-1">{label}</span>
      <button
        onClick={handleClear}
        className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:text-amber-400 transition-colors"
      >
        <X size={12} />
      </button>
    </div>
  );
}
