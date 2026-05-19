'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit3, Check, X, Sparkles } from 'lucide-react';
import type { FacetPromptEditorProps, FacetedSpecConfig } from '../types';

const DEFAULT_MAX_CHARS = 1000;
const MAX_UNDO_HISTORY = 5;

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
}

function getDimension(config: FacetedSpecConfig, id: string | null) {
  if (!id) return null;
  return config.dimensions.find((d) => d.id === id) ?? null;
}

/**
 * Generic prompt editor for any faceted spec dimension.
 * Supports custom text entry, undo, live preview of composed prompt,
 * and keyboard shortcuts (Enter to save, Esc to cancel, Ctrl+Z to undo).
 */
export function FacetPromptEditor({
  config,
  activeDimensionId,
  selections,
  composedPrompt,
  onSetCustomPrompt,
  onClearCustomPrompt,
}: FacetPromptEditorProps) {
  const maxChars = config.maxCustomChars ?? DEFAULT_MAX_CHARS;
  const dimension = getDimension(config, activeDimensionId);
  const selection = activeDimensionId ? selections[activeDimensionId] : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [undoHistory, setUndoHistory] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selection?.isCustom && selection.customPrompt) {
      setEditValue(selection.customPrompt);
    } else {
      setEditValue('');
    }
    setUndoHistory([]);
  }, [activeDimensionId, selection?.isCustom, selection?.customPrompt]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      autoResize(textareaRef.current);
    }
  }, [isEditing]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value.slice(0, maxChars);
      setUndoHistory((prev) => {
        const next = [...prev, editValue];
        return next.slice(-MAX_UNDO_HISTORY);
      });
      setEditValue(newValue);
      if (textareaRef.current) autoResize(textareaRef.current);
    },
    [editValue, maxChars]
  );

  const handleSave = () => {
    if (activeDimensionId && editValue.trim()) {
      onSetCustomPrompt(activeDimensionId, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(selection?.customPrompt || '');
    setIsEditing(false);
  };

  const handleClear = () => {
    if (activeDimensionId) {
      onClearCustomPrompt(activeDimensionId);
      setEditValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      setUndoHistory((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const last = next.pop()!;
        setEditValue(last);
        if (textareaRef.current) {
          requestAnimationFrame(() => autoResize(textareaRef.current!));
        }
        return next;
      });
    }
  };

  const charCount = editValue.length;
  const isNearLimit = charCount > maxChars * 0.9;

  // Empty prefix check — detect "no selections made" by comparing to prefix + suffix
  const emptyPrompt =
    config.promptPrefix + (config.suffix ?? '.');

  if (!dimension) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
        <Sparkles size={14} className="text-slate-400" />
        <span className="text-sm text-slate-400">
          Select a category to customize
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
            {dimension.label}
          </span>
        </div>

        {!isEditing && (
          <div className="flex-1 relative">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center gap-2 px-4 py-2 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-lg transition-all text-left group"
            >
              <Edit3
                size={14}
                className="text-slate-400 group-hover:text-slate-300"
              />
              {selection?.isCustom && selection.customPrompt ? (
                <span className="flex-1 text-sm text-amber-400 line-clamp-2">
                  {selection.customPrompt}
                </span>
              ) : (
                <span className="flex-1 text-sm text-slate-400">
                  Enter custom {dimension.label.toLowerCase()} prompt...
                </span>
              )}
            </button>
          </div>
        )}

        {selection?.isCustom && !isEditing && (
          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {isEditing && (
        <div className="flex flex-col gap-1.5">
          {composedPrompt && composedPrompt !== emptyPrompt && (
            <div className="px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
              <span className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {composedPrompt}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={`Custom ${dimension.label.toLowerCase()} description...`}
                rows={2}
                maxLength={maxChars}
                className="w-full px-4 py-2 bg-white/[0.03] border border-amber-500/30 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
              />
              <span
                className={`absolute bottom-1.5 right-2 text-[10px] tabular-nums ${
                  isNearLimit ? 'text-amber-400' : 'text-slate-600'
                }`}
              >
                {charCount}/{maxChars}
              </span>
            </div>
            <div className="flex flex-col gap-1">
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
          </div>
        </div>
      )}
    </div>
  );
}
