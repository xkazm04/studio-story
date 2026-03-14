'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { createChatStore, useChatMessages } from '@dzin/core';
import type { SlashCommand, ChatStore } from '@dzin/core';

import { useChatOverlay } from './useChatOverlay';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import './chat.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ECHO_DELAY_MS = 300;

// ---------------------------------------------------------------------------
// Default Slash Commands
// ---------------------------------------------------------------------------

function createDefaultCommands(store: ChatStore): SlashCommand[] {
  return [
    {
      name: 'show',
      description: 'Open a specific panel',
      execute: (args) => {
        console.log(`Would open: ${args}`);
        store.addMessage('system', `Panel open is a stub. Would open: ${args || '(no panel specified)'}`);
      },
    },
    {
      name: 'compose',
      description: 'Compose workspace layout',
      execute: (args) => {
        console.log(`Would compose: ${args}`);
        store.addMessage('system', `Compose is a stub. Would compose: ${args || '(no description)'}`);
      },
    },
    {
      name: 'undo',
      description: 'Undo last action',
      execute: () => {
        console.log('Would undo');
        store.addMessage('system', 'Undo is a stub. Would call StateEngine.undo()');
      },
    },
    {
      name: 'redo',
      description: 'Redo last undone action',
      execute: () => {
        console.log('Would redo');
        store.addMessage('system', 'Redo is a stub. Would call StateEngine.redo()');
      },
    },
    {
      name: 'clear',
      description: 'Clear conversation history',
      execute: () => {
        store.clear();
      },
    },
    {
      name: 'help',
      description: 'Show available commands',
      execute: () => {
        store.addMessage(
          'system',
          [
            'Available commands:',
            '  /show [panel] -- Open a specific panel',
            '  /compose [description] -- Compose workspace layout',
            '  /undo -- Undo last action',
            '  /redo -- Redo last undone action',
            '  /clear -- Clear conversation history',
            '  /help -- Show this help message',
          ].join('\n')
        );
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// ConversationShell
// ---------------------------------------------------------------------------

/**
 * The main floating chat overlay that assembles the full conversation UI.
 * Integrates @dzin/core ChatStore with styled Tailwind + framer-motion overlay.
 * Uses a mock echo handler for visual testing (Phase 6 replaces with real LLM).
 */
export function ConversationShell() {
  const storeRef = useRef<ChatStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createChatStore();
  }
  const store = storeRef.current;

  const messages = useChatMessages(store);
  const overlay = useChatOverlay();

  const commands = useMemo(() => createDefaultCommands(store), [store]);

  // -------------------------------------------------------------------------
  // Send handler with mock echo
  // -------------------------------------------------------------------------

  const handleSend = useCallback(
    (text: string) => {
      store.addMessage('user', text);

      // Mock echo response after short delay (Phase 6 replaces with real LLM)
      setTimeout(() => {
        store.addMessage('assistant', `Echo: ${text}`);
      }, ECHO_DELAY_MS);
    },
    [store]
  );

  return (
    <>
      {/* FAB Toggle Button */}
      <motion.button
        type="button"
        onClick={overlay.toggle}
        className="fixed right-6 bottom-6 z-[9000] flex items-center justify-center w-12 h-12 rounded-full bg-cyan-600 text-white shadow-lg shadow-cyan-900/30 hover:bg-cyan-500 transition-colors cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Toggle Jinn chat"
      >
        <MessageCircle size={20} />
      </motion.button>

      {/* Chat Overlay */}
      <AnimatePresence>
        {overlay.state.isOpen && (
          <motion.div
            data-dzin-chat-shell=""
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed z-[9000] flex flex-col rounded-xl border border-slate-800 shadow-2xl shadow-black/40 overflow-hidden"
            style={{
              left: overlay.state.x,
              top: overlay.state.y,
              width: overlay.state.width,
              height: overlay.state.height,
              background: 'var(--dzin-chat-bg, #0f172a)',
            }}
          >
            {/* Resize handles */}
            <div
              className="absolute top-0 left-2 right-2 h-2 cursor-n-resize"
              onPointerDown={overlay.resizeHandlers.onPointerDown('top')}
            />
            <div
              className="absolute top-2 right-0 bottom-2 w-2 cursor-e-resize"
              onPointerDown={overlay.resizeHandlers.onPointerDown('right')}
            />
            <div
              className="absolute bottom-0 left-2 right-2 h-2 cursor-s-resize"
              onPointerDown={overlay.resizeHandlers.onPointerDown('bottom')}
            />
            <div
              className="absolute top-2 left-0 bottom-2 w-2 cursor-w-resize"
              onPointerDown={overlay.resizeHandlers.onPointerDown('left')}
            />

            {/* Title Bar (draggable) */}
            <div
              className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 cursor-grab active:cursor-grabbing select-none shrink-0"
              {...overlay.dragHandlers}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={14} className="text-cyan-400" />
                <span className="text-sm font-medium text-slate-200">Jinn</span>
              </div>
              <button
                type="button"
                onClick={overlay.toggle}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close chat"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <ChatMessages messages={messages} />

            {/* Input */}
            <ChatInput onSend={handleSend} commands={commands} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
