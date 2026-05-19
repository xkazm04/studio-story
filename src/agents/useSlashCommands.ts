/**
 * useSlashCommands — Hook for slash command autocomplete in advisor chat.
 *
 * Manages the slash-command lifecycle:
 * 1. Detects `/` prefix in input text
 * 2. Filters matching commands
 * 3. Handles arrow-key navigation and Enter selection
 * 4. Executes local commands via dispatchWorkspaceAction
 * 5. Returns LLM-prefixed text for LLM commands
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import { dispatchWorkspaceAction } from './dispatchWorkspaceAction';
import { useAgentStore } from './store/agentStore';
import {
  filterCommands,
  parseSlashCommand,
  buildLLMPrefix,
  buildLocalAction,
  SLASH_COMMANDS,
  type SlashCommandDef,
} from './slashCommands';

export interface UseSlashCommandsOptions {
  /** Callback to send a message to the advisor (for LLM commands) */
  onSendMessage: (text: string) => void;
}

export interface UseSlashCommandsResult {
  /** Whether the autocomplete menu should be visible */
  isMenuOpen: boolean;
  /** Filtered commands matching the current query */
  filteredCommands: SlashCommandDef[];
  /** Index of the currently highlighted command (-1 = none) */
  selectedIndex: number;
  /** Call this on every input change with the current value */
  onInputChange: (value: string) => void;
  /** Call this from onKeyDown; returns true if the event was consumed */
  onKeyDown: (e: React.KeyboardEvent) => boolean;
  /** Select a command by index (e.g. on mouse click) */
  selectCommand: (index: number) => void;
  /** Execute the given command with the current args from input */
  executeCommand: (command: SlashCommandDef) => void;
  /** Close the menu without selecting */
  closeMenu: () => void;
  /** Set the highlighted index (for mouse hover) */
  setSelectedIndex: (index: number) => void;
  /** The current slash query (text after `/` before space), or null */
  slashQuery: string | null;
}

/**
 * Hook that powers the slash-command autocomplete menu.
 *
 * Usage in AdvisorConversation:
 * - Wire `onInputChange` to the textarea's onChange
 * - Wire `onKeyDown` to the textarea's onKeyDown (it returns true if consumed)
 * - Render `<SlashCommandMenu>` when `isMenuOpen` is true
 */
export function useSlashCommands(
  inputRef: React.RefObject<string>,
  setInput: (val: string) => void,
  options: UseSlashCommandsOptions,
): UseSlashCommandsResult {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const addMessage = useAgentStore((s) => s.addMessage);

  const filteredCommands = useMemo(
    () => (isMenuOpen ? filterCommands(query) : []),
    [isMenuOpen, query],
  );

  const slashQuery = isMenuOpen ? query : null;

  /** Update slash-command state based on input text */
  const onInputChange = useCallback((value: string) => {
    if (value.startsWith('/')) {
      const afterSlash = value.slice(1);
      const spaceIdx = afterSlash.indexOf(' ');
      // Only show menu while typing the command name (before first space)
      if (spaceIdx < 0) {
        setQuery(afterSlash);
        setIsMenuOpen(true);
        setSelectedIndex(0);
        return;
      }
      // After space: check if it's a valid command and close menu
      const cmdName = afterSlash.slice(0, spaceIdx);
      const matched = SLASH_COMMANDS.find((c) => c.name === cmdName.toLowerCase());
      if (matched) {
        setIsMenuOpen(false);
        return;
      }
    }
    // Not a slash command — close menu
    if (isMenuOpen) {
      setIsMenuOpen(false);
      setQuery('');
    }
  }, [isMenuOpen]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  /** Execute a command: local dispatch or LLM prefix */
  const executeCommand = useCallback((command: SlashCommandDef) => {
    const currentInput = inputRef.current ?? '';
    const parsed = parseSlashCommand(currentInput);
    const args = parsed?.args ?? '';

    if (command.mode === 'local') {
      // System intents (undo/redo)
      if (command.name === 'undo') {
        useWorkspaceStore.getState().popWorkflowContext();
        addMessage({
          id: `msg-${Date.now()}`,
          role: 'system',
          content: 'Undid last workspace change.',
          timestamp: Date.now(),
        });
        setInput('');
        closeMenu();
        return;
      }
      if (command.name === 'redo') {
        // Redo is not directly supported in workspace store; treat as no-op with message
        addMessage({
          id: `msg-${Date.now()}`,
          role: 'system',
          content: 'Redo is not available.',
          timestamp: Date.now(),
        });
        setInput('');
        closeMenu();
        return;
      }

      const actionPayload = buildLocalAction(command.name, args);
      if (actionPayload) {
        dispatchWorkspaceAction(actionPayload);
        addMessage({
          id: `msg-${Date.now()}`,
          role: 'system',
          content: `/${command.name} ${args}`.trim(),
          timestamp: Date.now(),
        });
      } else if (args) {
        // Invalid args — add error message
        addMessage({
          id: `msg-${Date.now()}`,
          role: 'system',
          content: `Unknown argument for /${command.name}: "${args}"`,
          timestamp: Date.now(),
          isError: true,
        });
      } else if (command.argHint) {
        // No args provided but command expects them
        addMessage({
          id: `msg-${Date.now()}`,
          role: 'system',
          content: `Usage: /${command.name} ${command.argHint}`,
          timestamp: Date.now(),
        });
      }
      setInput('');
      closeMenu();
    } else {
      // LLM mode: prepend structured context and send to advisor
      if (!args && command.argHint) {
        // No args — just insert the command and let user type
        // Don't send yet
        return;
      }
      const prefixedText = buildLLMPrefix(command, args);
      options.onSendMessage(prefixedText);
      setInput('');
      closeMenu();
    }
  }, [inputRef, options, addMessage, setInput, closeMenu]);

  /** Select a command from the menu and insert it into the input */
  const selectCommand = useCallback((index: number) => {
    const command = filteredCommands[index];
    if (!command) return;
    // Insert the command into the input field
    setInput(`/${command.name} `);
    setIsMenuOpen(false);
    setQuery('');
    setSelectedIndex(0);
    // If the command takes no args, execute immediately
    if (!command.argHint) {
      // Defer execution so input state updates first
      setTimeout(() => executeCommand(command), 0);
    }
  }, [filteredCommands, setInput, executeCommand]);

  /** Handle keyboard navigation in the autocomplete menu */
  const onKeyDown = useCallback((e: React.KeyboardEvent): boolean => {
    if (!isMenuOpen || filteredCommands.length === 0) return false;

    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? filteredCommands.length - 1 : prev - 1,
        );
        return true;
      }
      case 'ArrowDown': {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev >= filteredCommands.length - 1 ? 0 : prev + 1,
        );
        return true;
      }
      case 'Tab':
      case 'Enter': {
        e.preventDefault();
        selectCommand(selectedIndex);
        return true;
      }
      case 'Escape': {
        e.preventDefault();
        closeMenu();
        return true;
      }
      default:
        return false;
    }
  }, [isMenuOpen, filteredCommands, selectedIndex, selectCommand, closeMenu]);

  return {
    isMenuOpen,
    filteredCommands,
    selectedIndex,
    onInputChange,
    onKeyDown,
    selectCommand,
    executeCommand,
    closeMenu,
    setSelectedIndex,
    slashQuery,
  };
}
