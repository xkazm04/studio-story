/**
 * InlineDiffControls
 *
 * Floating accept/reject bar that appears when the InlineDiffExtension
 * has an active diff preview. Positioned near the diff region.
 *
 * - Accept: clears decorations (text already replaced with AI result)
 * - Reject: undoes the replacement transaction, restoring original text
 * - Keyboard shortcuts: Enter to accept, Escape to reject
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';

interface InlineDiffControlsProps {
  editor: Editor;
}

export function InlineDiffControls({ editor }: InlineDiffControlsProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const diffStorage = (editor.storage as unknown as Record<string, Record<string, unknown>>).inlineDiff;
  const isDiffActive = (diffStorage?.active as boolean) ?? false;

  // Compute position from the diff region
  useEffect(() => {
    if (!isDiffActive) {
      setPosition(null);
      return;
    }

    const storage = diffStorage as {
      originalFrom: number;
      diffs: { from: number }[];
    };

    const from = storage.originalFrom || 0;
    try {
      const coords = editor.view.coordsAtPos(from);
      const editorRect = editor.view.dom.getBoundingClientRect();
      setPosition({
        top: coords.top - editorRect.top - 44, // position above the diff
        left: coords.left - editorRect.left,
      });
    } catch {
      // If position calculation fails, center above the editor
      setPosition({ top: -44, left: 0 });
    }
  }, [isDiffActive, editor]);

  const handleAccept = useCallback(() => {
    editor.commands.acceptDiff();
  }, [editor]);

  const handleReject = useCallback(() => {
    editor.commands.rejectDiff();
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isDiffActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        e.preventDefault();
        handleAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleReject();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDiffActive, handleAccept, handleReject]);

  if (!isDiffActive || !position) return null;

  return (
    <div
      className={cn(
        'absolute z-50 flex items-center gap-1.5',
        'rounded-lg border border-slate-700/60 bg-slate-800/95 p-3',
        'shadow-2xl backdrop-blur-sm'
      )}
      style={{
        top: Math.max(0, position.top),
        left: Math.max(0, position.left),
      }}
    >
      <span className="text-xs text-slate-400 font-mono uppercase tracking-wider mr-1">
        AI Suggestion
      </span>

      <button
        type="button"
        onClick={handleAccept}
        className={cn(
          'flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-all',
          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          'hover:bg-emerald-500/30 hover:text-emerald-300'
        )}
        title="Accept (Enter)"
      >
        <Check className="w-3.5 h-3.5" />
        Accept
      </button>

      <button
        type="button"
        onClick={handleReject}
        className={cn(
          'flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-all',
          'bg-red-500/20 text-red-400 border border-red-500/30',
          'hover:bg-red-500/30 hover:text-red-300'
        )}
        title="Reject (Esc)"
      >
        <X className="w-3.5 h-3.5" />
        Reject
      </button>
    </div>
  );
}
