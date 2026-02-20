/**
 * Agent Store — Zustand store for Gemini Live agent state.
 *
 * Manages connection status, conversation messages, proactive suggestions,
 * and session configuration.
 */

import { create } from 'zustand';
import type { AgentMessage, AgentSuggestion, ConnectionState } from '../types';

interface AgentStoreState {
  // Connection
  connectionState: ConnectionState;
  sessionHandle: string | null;
  isObserving: boolean;

  // Conversation
  messages: AgentMessage[];

  // Suggestions
  suggestions: AgentSuggestion[];

  // Actions — Connection
  setConnectionState: (state: ConnectionState) => void;
  setSessionHandle: (handle: string | null) => void;
  setObserving: (observing: boolean) => void;

  // Actions — Messages
  addMessage: (message: AgentMessage) => void;
  clearMessages: () => void;

  // Actions — Suggestions
  addSuggestion: (suggestion: AgentSuggestion) => void;
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;

  // Reset
  reset: () => void;
}

const INITIAL_STATE = {
  connectionState: 'disconnected' as ConnectionState,
  sessionHandle: null,
  isObserving: false,
  messages: [],
  suggestions: [],
};

export const useAgentStore = create<AgentStoreState>()((set) => ({
  ...INITIAL_STATE,

  // Connection
  setConnectionState: (connectionState) => set({ connectionState }),
  setSessionHandle: (sessionHandle) => set({ sessionHandle }),
  setObserving: (isObserving) => set({ isObserving }),

  // Messages
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),

  // Suggestions
  addSuggestion: (suggestion) =>
    set((state) => ({
      suggestions: [suggestion, ...state.suggestions].slice(0, 10), // Keep last 10
    })),
  dismissSuggestion: (id) =>
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, dismissed: true } : s
      ),
    })),
  clearSuggestions: () => set({ suggestions: [] }),

  // Reset
  reset: () => set(INITIAL_STATE),
}));
