/**
 * Agent Store — Zustand store for Gemini advisor state.
 *
 * Manages connection status, conversation messages, proactive suggestions,
 * and CLI tool event batching for server-proxied advisor calls.
 */

import { create } from 'zustand';
import type { AgentMessage, AgentSuggestion, CLIToolEvent, ConnectionState, MuseInsight, AdvisorError, EffectRecord, EffectTriggerSource, EffectWorkspaceSnapshot, MessageRating } from '../types';
import { summarizeToolInput, EFFECT_STACK_MAX } from '../types';
import type { WorkspaceLayout } from '@/workspace/types';

/** Callback that the useAdvisor hook registers to handle batched events */
type ToolEventSender = (events: CLIToolEvent[]) => void;

const BATCH_DEBOUNCE_MS = 800;
export const STREAMING_MESSAGE_ID = '__streaming__';

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
  lastError: AdvisorError | null;

  // Conversation
  messages: AgentMessage[];

  // Suggestions
  suggestions: AgentSuggestion[];

  // Effect attribution stack (replaces single-slot previousWorkspaceState)
  effectStack: EffectRecord[];

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
  setLastError: (error: AdvisorError | null) => void;

  // Actions — Effect attribution stack
  pushEffect: (trigger: EffectTriggerSource, action: EffectRecord['action'], reasoning: string | undefined, before: EffectWorkspaceSnapshot, after: EffectWorkspaceSnapshot) => void;
  undoLastEffect: () => EffectRecord | null;
  getEffectForPanel: (panelType: string) => EffectRecord | undefined;

  // Actions — CLI event forwarding
  setEventSender: (sender: ToolEventSender | null) => void;
  recordToolEvent: (toolName: string, toolInput: Record<string, unknown>) => void;

  // Actions — Messages
  addMessage: (message: AgentMessage) => void;
  /** Update or create the in-progress streaming message */
  updateStreamingMessage: (text: string) => void;
  /** Replace the streaming message with a finalized one */
  finalizeStreamingMessage: (text: string) => void;
  /** Set a user rating on a specific message */
  rateMessage: (id: string, rating: MessageRating) => void;
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

const INITIAL_STATE = {
  connectionState: 'disconnected' as ConnectionState,
  isObserving: false,
  isProcessing: false,
  processingStatus: null as string | null,
  rateLimitedUntil: null as number | null,
  isThrottled: false,
  lastError: null as AdvisorError | null,
  messages: [] as AgentMessage[],
  suggestions: [] as AgentSuggestion[],
  effectStack: [] as EffectRecord[],
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

  // Effect attribution stack
  pushEffect: (trigger, action, reasoning, before, after) => {
    const record: EffectRecord = {
      id: `effect-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      trigger,
      action,
      reasoning,
      before,
      after,
    };
    set((state) => ({
      effectStack: [record, ...state.effectStack].slice(0, EFFECT_STACK_MAX),
    }));
  },

  undoLastEffect: () => {
    const state = get();
    if (state.effectStack.length === 0) return null;
    const [top, ...rest] = state.effectStack;
    set({ effectStack: rest });
    return top;
  },

  getEffectForPanel: (panelType) => {
    const state = get();
    return state.effectStack.find((effect) =>
      effect.after.panels.some((p) => p.type === panelType) &&
      !effect.before.panels.some((p) => p.type === panelType)
    );
  },

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
      const streamingIdx = state.messages.findIndex(m => m.id === STREAMING_MESSAGE_ID);
      if (streamingIdx >= 0) {
        const updated = [...state.messages];
        updated[streamingIdx] = { ...updated[streamingIdx], content: text };
        return { messages: updated };
      }
      return {
        messages: [...state.messages, {
          id: STREAMING_MESSAGE_ID,
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
      const withoutStreaming = state.messages.filter(m => m.id !== STREAMING_MESSAGE_ID);
      return {
        messages: [...withoutStreaming, {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'agent' as const,
          content: text,
          timestamp: Date.now(),
        }],
      };
    }),
  rateMessage: (id, rating) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, rating } : m,
      ),
    })),
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
