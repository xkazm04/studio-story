/**
 * CommandPalette Component
 * Modal command interface (Ctrl+K / Ctrl+Shift+P)
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command as CommandIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommandPalette } from './CommandPaletteContext';
import { CommandList } from './components/CommandList';
import { Command } from './types';

export function CommandPalette() {
  const { isOpen, close, commands } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter((command) => {
      const matchLabel = command.label.toLowerCase().includes(lowerQuery);
      const matchDescription = command.description?.toLowerCase().includes(lowerQuery);
      const matchKeywords = command.keywords?.some((k) => k.includes(lowerQuery));
      return matchLabel || matchDescription || matchKeywords;
    });
  }, [commands, query]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex] && !filteredCommands[selectedIndex].disabled) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [filteredCommands, selectedIndex, close]
  );

  const executeCommand = useCallback(
    async (command: Command) => {
      close();
      try {
        await command.action();
      } catch (err) {
        console.error('Command execution failed:', err);
      }
    },
    [close]
  );

  const handleSelect = useCallback(
    (command: Command) => {
      if (!command.disabled) {
        executeCommand(command);
      }
    },
    [executeCommand]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={close}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
          >
            <div
              className={cn(
                'bg-slate-900 rounded-xl border border-slate-700',
                'shadow-2xl shadow-black/50 overflow-hidden'
              )}
              onKeyDown={handleKeyDown}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
                <Search className="w-5 h-5 text-slate-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Type a command or search..."
                  className={cn(
                    'flex-1 bg-transparent text-sm text-slate-200',
                    'placeholder:text-slate-500 focus:outline-none'
                  )}
                />
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 border border-slate-700 text-slate-500">
                    esc
                  </kbd>
                  <button
                    onClick={close}
                    className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Command List */}
              <CommandList
                commands={filteredCommands}
                selectedIndex={selectedIndex}
                onSelect={handleSelect}
                onHover={setSelectedIndex}
              />

              {/* Footer */}
              <div className="px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-600">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">↵</kbd>
                    Select
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <CommandIcon className="w-3 h-3" />
                  {filteredCommands.length} commands
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
