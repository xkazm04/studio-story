/**
 * AIWritingToolbar
 *
 * BubbleMenu-based toolbar that appears on text selection in the TipTap editor.
 * Shows an AI button with a dropdown of writing tools (continue, rewrite, expand,
 * show-don't-tell, sensory rewrite). Calls the AIWritingExtension commands.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Loader2,
  ChevronRight,
  Type,
  ArrowRight,
  Expand,
  Eye,
  Waves,
} from 'lucide-react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import type { ContinueLength } from '@/lib/ai/writingPrompts';

interface AIWritingToolbarProps {
  editor: Editor;
  projectId: string;
  sceneId: string;
}

interface ToolItem {
  id: string;
  label: string;
  icon: React.ElementType;
  tool?: string;
  hasSubmenu?: boolean;
}

const TOOL_ITEMS: ToolItem[] = [
  { id: 'continue', label: 'Continue...', icon: ArrowRight, hasSubmenu: true },
  { id: 'rewrite', label: 'Rewrite', icon: Type, tool: 'rewrite' },
  { id: 'expand', label: 'Expand', icon: Expand, tool: 'expand' },
  { id: 'divider', label: '', icon: () => null },
  { id: 'showDontTell', label: "Show, Don't Tell", icon: Eye, tool: 'showDontTell' },
  { id: 'sensoryRewrite', label: 'Sensory Rewrite', icon: Waves, tool: 'sensoryRewrite' },
];

const CONTINUE_OPTIONS: { label: string; length: ContinueLength }[] = [
  { label: 'A sentence', length: 'sentence' },
  { label: 'A paragraph', length: 'paragraph' },
  { label: 'A page', length: 'page' },
];

export function AIWritingToolbar({ editor, projectId, sceneId }: AIWritingToolbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showContinueSubmenu, setShowContinueSubmenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const aiStorage = (editor.storage as unknown as Record<string, Record<string, unknown>>).aiWriting;
  const diffStorage = (editor.storage as unknown as Record<string, Record<string, unknown>>).inlineDiff;
  const isProcessing = (aiStorage?.isProcessing as boolean) ?? false;
  const isDiffActive = (diffStorage?.active as boolean) ?? false;

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowContinueSubmenu(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropdown(false);
        setShowContinueSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showDropdown]);

  const handleToolClick = useCallback(
    (tool: string, options?: { length?: ContinueLength }) => {
      editor.commands.runWritingTool({
        tool: tool as 'continue' | 'rewrite' | 'expand' | 'showDontTell' | 'sensoryRewrite',
        projectId,
        sceneId,
        options,
      });
      setShowDropdown(false);
      setShowContinueSubmenu(false);
    },
    [editor, projectId, sceneId]
  );

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top' }}
      shouldShow={() => {
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        return hasSelection && !isDiffActive;
      }}
    >
      <div
        ref={dropdownRef}
        className="relative flex items-center gap-0.5 rounded-lg border border-slate-700/60 bg-slate-800 px-1 py-0.5 shadow-xl"
      >
        {/* AI Button */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isProcessing}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all',
            showDropdown
              ? 'bg-cyan-500/10 text-cyan-300 ring-1 ring-cyan-500/30'
              : 'text-cyan-400 hover:bg-slate-800/80 hover:text-cyan-300',
            isProcessing && 'opacity-60 cursor-not-allowed'
          )}
          title="AI Writing Tools"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span className="font-mono text-xs uppercase tracking-wider">AI</span>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[200px] rounded-lg border border-slate-700/60 bg-slate-800 py-1 shadow-2xl">
            {TOOL_ITEMS.map((item) => {
              if (item.id === 'divider') {
                return (
                  <div
                    key="divider"
                    className="my-1 border-t border-slate-700/60"
                  />
                );
              }

              return (
                <div key={item.id} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.hasSubmenu) {
                        setShowContinueSubmenu(!showContinueSubmenu);
                      } else if (item.tool) {
                        handleToolClick(item.tool);
                      }
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300',
                      'hover:bg-slate-800/80 hover:text-slate-100 transition-colors duration-150',
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.hasSubmenu && (
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    )}
                  </button>

                  {/* Continue submenu */}
                  {item.hasSubmenu && showContinueSubmenu && (
                    <div className="absolute left-full top-0 ml-1 min-w-[160px] rounded-lg border border-slate-700/60 bg-slate-800 py-1 shadow-2xl">
                      {CONTINUE_OPTIONS.map((opt) => (
                        <button
                          key={opt.length}
                          type="button"
                          onClick={() =>
                            handleToolClick('continue', { length: opt.length })
                          }
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 transition-colors duration-150"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}
