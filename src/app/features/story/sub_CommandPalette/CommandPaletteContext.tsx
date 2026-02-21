/**
 * CommandPaletteContext
 * Global state management for the command palette
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import { Command, CommandPaletteContextType } from './types';

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

interface CommandPaletteProviderProps {
  children: ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const registerCommand = useCallback((command: Command) => {
    setCommands((prev) => {
      // Replace if exists, otherwise add
      const exists = prev.find((c) => c.id === command.id);
      if (exists) {
        return prev.map((c) => (c.id === command.id ? command : c));
      }
      return [...prev, command];
    });
  }, []);

  const unregisterCommand = useCallback((commandId: string) => {
    setCommands((prev) => prev.filter((c) => c.id !== commandId));
  }, []);

  // Global keyboard shortcut: Ctrl+Shift+P (or Cmd+Shift+P on Mac)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+P or Cmd+Shift+P
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'p'
      ) {
        event.preventDefault();
        toggle();
      }

      // Also support Ctrl+K (VS Code style)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      }

      // Close on Escape
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  const value = useMemo<CommandPaletteContextType>(
    () => ({
      isOpen,
      open,
      close,
      toggle,
      registerCommand,
      unregisterCommand,
      commands,
    }),
    [isOpen, open, close, toggle, registerCommand, unregisterCommand, commands]
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (context === undefined) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}
