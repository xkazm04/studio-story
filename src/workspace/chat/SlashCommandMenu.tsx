'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { matchCommands } from '@dzin/core';
import type { SlashCommand } from '@dzin/core';

// ---------------------------------------------------------------------------
// SlashCommandMenu
// ---------------------------------------------------------------------------

interface SlashCommandMenuProps {
  commands: SlashCommand[];
  query: string;
  onSelect: (command: SlashCommand) => void;
  onDismiss: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * Dropdown autocomplete menu for slash commands.
 * Positioned above the chat input, filters by typed prefix,
 * supports keyboard navigation (ArrowUp/Down, Enter, Escape).
 */
export const SlashCommandMenu = React.memo(function SlashCommandMenu({
  commands,
  query,
  onSelect,
  onDismiss,
  inputRef,
}: SlashCommandMenuProps) {
  const filtered = matchCommands(query, commands);
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset active index when filtered results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (filtered.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % filtered.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(filtered[activeIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          onDismiss();
          break;
      }
    },
    [filtered, activeIndex, onSelect, onDismiss]
  );

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.addEventListener('keydown', handleKeyDown);
    return () => textarea.removeEventListener('keydown', handleKeyDown);
  }, [inputRef, handleKeyDown]);

  if (filtered.length === 0) return null;

  return (
    <div data-dzin-chat-command-menu="">
      {filtered.map((cmd, i) => (
        <div
          key={cmd.name}
          data-command-item=""
          data-active={i === activeIndex ? 'true' : 'false'}
          onPointerDown={(e) => {
            e.preventDefault(); // Prevent blur on input
            onSelect(cmd);
          }}
        >
          <span className="font-medium text-slate-200">/{cmd.name}</span>
          <span className="text-slate-500 ml-2 text-xs">{cmd.description}</span>
        </div>
      ))}
    </div>
  );
});
