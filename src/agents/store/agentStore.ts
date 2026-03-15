/**
 * Agent Store — Zustand store for Gemini advisor state.
 *
 * Manages connection status, conversation messages, proactive suggestions,
 * and CLI tool event batching for server-proxied advisor calls.
 */

import { create } from 'zustand';
import type { AgentMessage, AgentSuggestion, ConnectionState, MuseInsight } from '../types';
import type { CLIToolEvent } from '../AdvisorClient';
import type { PanelDirective, WorkspaceLayout } from '@/workspace/types';

/** Callback that the useAdvisor hook registers to handle batched events */
type ToolEventSender = (events: CLIToolEvent[]) => void;

const BATCH_DEBOUNCE_MS = 800;

interface AgentStoreState {
  // Connection
  connectionState: ConnectionState;
  isObserving: boolean;

  // Processing state
  isProcessing: boolean;
  processingStatus: string | null;

  // Rate limiting
  rateLimitedUntil: number | null;
  isThrottled: boolean;

  // Error state
  lastError: string | null;

  // Conversation
  messages: AgentMessage[];

  // Suggestions
  suggestions: AgentSuggestion[];
  previousWorkspaceState: {
    panels: PanelDirective[];
    layout: WorkspaceLayout;
  } | null;

  // Proactive Muse insights
  museInsights: MuseInsight[];

  // Internal: batched CLI tool events and sender callback
  _pendingEvents: CLIToolEvent[];
  _eventSender: ToolEventSender | null;
  _batchTimer: ReturnType<typeof setTimeout> | null;

  // Actions — Connection
  setConnectionState: (state: ConnectionState) => void;
  setObserving: (observing: boolean) => void;

  // Actions — Processing
  setProcessing: (isProcessing: boolean, status?: string | null) => void;

  // Actions — Rate limiting
  setRateLimitedUntil: (until: number | null) => void;
  setThrottled: (isThrottled: boolean) => void;

  // Actions — Error state
  setLastError: (error: string | null) => void;
  setPreviousWorkspaceState: (snapshot: { panels: PanelDirective[]; layout: WorkspaceLayout } | null) => void;

  // Actions — CLI event forwarding
  setEventSender: (sender: ToolEventSender | null) => void;
  recordToolEvent: (toolName: string, toolInput: Record<string, unknown>) => void;

  // Actions — Messages
  addMessage: (message: AgentMessage) => void;
  /** Update or create the in-progress streaming message */
  updateStreamingMessage: (text: string) => void;
  /** Replace the streaming message with a finalized one */
  finalizeStreamingMessage: (text: string) => void;
  clearMessages: () => void;

  // Actions — Suggestions
  addSuggestion: (suggestion: AgentSuggestion) => void;
  dismissSuggestion: (id: string) => void;
  clearSuggestions: () => void;

  // Actions — Muse Insights
  setMuseInsights: (insights: MuseInsight[]) => void;
  dismissMuseInsight: (id: string) => void;
  clearMuseInsights: () => void;

  // Reset
  reset: () => void;
}

function summarizeToolInput(toolName: string, input: Record<string, unknown>): string {
  const parts: string[] = [];
  if (input.characterId) parts.push(`character=${input.characterId}`);
  if (input.sceneId) parts.push(`scene=${input.sceneId}`);
  if (input.actId) parts.push(`act=${input.actId}`);
  if (input.name) parts.push(`name="${input.name}"`);
  if (input.type) parts.push(`type=${input.type}`);
  if (input.prompt && typeof input.prompt === 'string') {
    parts.push(`prompt="${(input.prompt as string).slice(0, 80)}..."`);
  }
  if (input.sourceImageUrl) parts.push('has_source_image');
  if (input.imageUrl) parts.push('has_image');
  if (input.updates) parts.push(`updates=${typeof input.updates === 'string' ? input.updates.slice(0, 100) : 'object'}`);
  return parts.length > 0 ? parts.join(', ') : 'no params';
}

const INITIAL_STATE = {
  connectionState: 'disconnected' as ConnectionState,
  isObserving: false,
  isProcessing: false,
  processingStatus: null as string | null,
  rateLimitedUntil: null as number | null,
  isThrottled: false,
  lastError: null as string | null,
  messages: [] as AgentMessage[],
  suggestions: [] as AgentSuggestion[],
  previousWorkspaceState: null as { panels: PanelDirective[]; layout: WorkspaceLayout } | null,
  museInsights: [] as MuseInsight[],
  _pendingEvents: [] as CLIToolEvent[],
  _eventSender: null as ToolEventSender | null,
  _batchTimer: null as ReturnType<typeof setTimeout> | null,
};

export const useAgentStore = create<AgentStoreState>()((set, get) => ({
  ...INITIAL_STATE,

  // Connection
  setConnectionState: (connectionState) => set({ connectionState }),
  setObserving: (isObserving) => set({ isObserving }),

  // Processing
  setProcessing: (isProcessing, status) =>
    set({ isProcessing, processingStatus: status ?? null }),

  // Rate limiting
  setRateLimitedUntil: (until) => set({ rateLimitedUntil: until }),
  setThrottled: (isThrottled) => set({ isThrottled }),

  // Error state
  setLastError: (lastError) => set({ lastError }),
  setPreviousWorkspaceState: (snapshot) => set({ previousWorkspaceState: snapshot }),

  // Event sender registration (called by useAdvisor)
  setEventSender: (sender) => set({ _eventSender: sender }),

  // CLI event forwarding — batches events and flushes via sender
  recordToolEvent: (toolName, toolInput) => {
    const state = get();
    if (state.connectionState !== 'connected' || !state._eventSender) return;

    const event: CLIToolEvent = {
      toolName,
      summary: summarizeToolInput(toolName, toolInput),
    };

    const pending = [...state._pendingEvents, event];

    // Clear existing timer
    if (state._batchTimer) clearTimeout(state._batchTimer);

    // Schedule flush
    const timer = setTimeout(() => {
      const current = get();
      if (current._pendingEvents.length > 0 && current._eventSender) {
        current._eventSender(current._pendingEvents);
        set({ _pendingEvents: [], _batchTimer: null });
      }
    }, BATCH_DEBOUNCE_MS);

    set({ _pendingEvents: pending, _batchTimer: timer });
  },

  // Messages
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateStreamingMessage: (text) =>
    set((state) => {
      const streamingIdx = state.messages.findIndex(m => m.id === '__streaming__');
      if (streamingIdx >= 0) {
        const updated = [...state.messages];
        updated[streamingIdx] = { ...updated[streamingIdx], content: text };
        return { messages: updated };
      }
      return {
        messages: [...state.messages, {
          id: '__streaming__',
          role: 'agent' as const,
          content: text,
          timestamp: Date.now(),
          isStreaming: true,
        }],
      };
    }),
  finalizeStreamingMessage: (text) =>
    set((state) => {
      // Replace the streaming placeholder with a finalized message
      const withoutStreaming = state.messages.filter(m => m.id !== '__streaming__');
      return {
        messages: [...withoutStreaming, {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'agent' as const,
          content: text,
          timestamp: Date.now(),
        }],
      };
    }),
  clearMessages: () => set({ messages: [] }),

  // Suggestions
  addSuggestion: (suggestion) =>
    set((state) => ({
      suggestions: [suggestion, ...state.suggestions].slice(0, 10),
    })),
  dismissSuggestion: (id) =>
    set((state) => ({
      suggestions: state.suggestions.map((s) =>
        s.id === id ? { ...s, dismissed: true } : s
      ),
    })),
  clearSuggestions: () => set({ suggestions: [] }),

  // Muse Insights
  setMuseInsights: (insights) => set({ museInsights: insights }),
  dismissMuseInsight: (id) =>
    set((state) => ({
      museInsights: state.museInsights.map((i) =>
        i.id === id ? { ...i, dismissed: true } : i
      ),
    })),
  clearMuseInsights: () => set({ museInsights: [] }),

  // Reset
  reset: () => {
    const state = get();
    if (state._batchTimer) clearTimeout(state._batchTimer);
    set(INITIAL_STATE);
  },
}));
