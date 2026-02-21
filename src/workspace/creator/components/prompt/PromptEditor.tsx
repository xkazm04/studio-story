'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X, Sparkles } from 'lucide-react';
import { useCreatorCharacterStore } from '../../store/creatorCharacterStore';
import { useCreatorUIStore } from '../../store/creatorUIStore';
import { getCategoryById } from '../../constants';

export function PromptEditor() {
  const activeCategory = useCreatorUIStore((s) => s.activeCategory);
  const selections = useCreatorCharacterStore((s) => s.selections);
  const setCustomPrompt = useCreatorCharacterStore((s) => s.setCustomPrompt);
  const clearCustomPrompt = useCreatorCharacterStore((s) => s.clearCustomPrompt);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const category = activeCategory ? getCategoryById(activeCategory) : null;
  const selection = activeCategory ? selections[activeCategory] : null;

  useEffect(() => {
    if (selection?.isCustom && selection.customPrompt) {
      setEditValue(selection.customPrompt);
    } else {
      setEditValue('');
    }
  }, [activeCategory, selection?.isCustom, selection?.customPrompt]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (activeCategory && editValue.trim()) {
      setCustomPrompt(activeCategory, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(selection?.customPrompt || '');
    setIsEditing(false);
  };

  const handleClear = () => {
    if (activeCategory) {
      clearCustomPrompt(activeCategory);
      setEditValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (!category) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
        <Sparkles size={14} className="text-slate-600" />
        <span className="text-sm text-slate-600">Select a category to customize</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
        <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
          {category.label}
        </span>
      </div>

      <div className="flex-1 relative">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Custom ${category.label.toLowerCase()} description...`}
              className="flex-1 px-4 py-2 bg-white/[0.03] border border-amber-500/30 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleSave}
              className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 hover:bg-amber-500/30 transition-all"
            >
              <Check size={14} />
            </button>
            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full flex items-center gap-2 px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-lg transition-all text-left group"
          >
            <Edit3 size={14} className="text-slate-600 group-hover:text-slate-400" />
            {selection?.isCustom && selection.customPrompt ? (
              <span className="flex-1 text-sm text-amber-400 truncate">
                {selection.customPrompt}
              </span>
            ) : (
              <span className="flex-1 text-sm text-slate-600">
                Enter custom {category.label.toLowerCase()} prompt...
              </span>
            )}
          </button>
        )}
      </div>

      {selection?.isCustom && !isEditing && (
        <button
          onClick={handleClear}
          className="px-3 py-2 text-xs text-slate-500 hover:text-amber-400 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
