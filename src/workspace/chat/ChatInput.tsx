'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import type { SlashCommand } from '@dzin/core';
import { SlashCommandMenu } from './SlashCommandMenu';

// ---------------------------------------------------------------------------
// ChatInput
// ---------------------------------------------------------------------------

interface ChatInputProps {
  onSend: (text: string) => void;
  commands: SlashCommand[];
}

/**
 * Auto-resize textarea with Enter-to-send, Shift+Enter for newline,
 * and slash command autocomplete trigger.
 */
export function ChatInput({ onSend, commands }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // -------------------------------------------------------------------------
  // Auto-resize logic
  // -------------------------------------------------------------------------

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }, []);

  // -------------------------------------------------------------------------
  // Change handler with slash detection
  // -------------------------------------------------------------------------

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setValue(text);

      // Detect slash command trigger
      if (text.startsWith('/')) {
        setShowCommands(true);
        setCommandQuery(text);
      } else {
        setShowCommands(false);
        setCommandQuery('');
      }

      // Auto-resize on next frame
      requestAnimationFrame(adjustHeight);
    },
    [adjustHeight]
  );

  // -------------------------------------------------------------------------
  // Send handler
  // -------------------------------------------------------------------------

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setValue('');
    setShowCommands(false);
    setCommandQuery('');

    // Reset textarea height
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
      }
    });
  }, [value, onSend]);

  // -------------------------------------------------------------------------
  // Keyboard handler
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // If command menu is open, let it handle arrow keys and enter
      if (showCommands) return;

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [showCommands, handleSend]
  );

  // -------------------------------------------------------------------------
  // Slash command selection
  // -------------------------------------------------------------------------

  const handleCommandSelect = useCallback(
    (command: SlashCommand) => {
      // Extract args after the command name
      const afterSlash = value.slice(1); // Remove leading "/"
      const spaceIndex = afterSlash.indexOf(' ');
      const args = spaceIndex >= 0 ? afterSlash.slice(spaceIndex + 1).trim() : '';

      command.execute(args);
      setValue('');
      setShowCommands(false);
      setCommandQuery('');

      // Reset textarea height
      requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.focus();
        }
      });
    },
    [value]
  );

  const handleCommandDismiss = useCallback(() => {
    setShowCommands(false);
    setCommandQuery('');
  }, []);

  const isEmpty = value.trim().length === 0;

  return (
    <div
      data-dzin-chat-input=""
      className="relative border-t border-slate-800 p-3"
    >
      {/* Slash command menu */}
      {showCommands && (
        <SlashCommandMenu
          commands={commands}
          query={commandQuery}
          onSelect={handleCommandSelect}
          onDismiss={handleCommandDismiss}
          inputRef={textareaRef}
        />
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask Jinn anything... (/ for commands)"
          rows={1}
          className="flex-1"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isEmpty}
          className={`shrink-0 p-1.5 rounded-md transition-colors ${
            isEmpty
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-cyan-400 hover:bg-slate-800 cursor-pointer'
          }`}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
