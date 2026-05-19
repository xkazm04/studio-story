'use client';

/**
 * useAdvisor — Hook that manages the server-proxied Gemini advisor.
 *
 * Uses AdvisorClient (HTTP calls to /api/agents/advisor) instead of
 * direct WebSocket. The API key never leaves the server.
 *
 * Wires together: AdvisorClient, agentStore, workspaceStore.
 */

import { useEffect, useRef, useCallback } from 'react';
import { AdvisorClient } from './AdvisorClient';
import type { AdvisorToolCall } from './AdvisorClient';
import type { CLIToolEvent } from './types';
import { useAgentStore } from './store/agentStore';
import { useAdvisorMemoryStore } from './store/advisorMemoryStore';
import { useAdvisorMemory } from './useAdvisorMemory';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useCommandBarStore } from '@/workspace/store/commandBarStore';
import { dispatchWorkspaceAction } from './dispatchWorkspaceAction';
import type { AgentMessage, AgentSuggestion, EffectTriggerSource, MessageRating } from './types';
import { TOOL_NAMES, advisorErrorLabel } from './types';
import {
  validateToolArgs,
  composeWorkspaceArgsSchema,
  suggestActionArgsSchema,
  sessionSpawnedArgsSchema,
  type ComposeWorkspaceArgs,
} from './advisorSchemas';

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

function getWorkspaceSnapshot() {
  const ws = useWorkspaceStore.getState();
  const ps = useProjectStore.getState();
  return {
    panels: ws.panels.map(p => ({
      type: p.type,
      role: p.role,
      density: p.density ?? 'full',
    })),
    layout: ws.layout,
    selectedProject: ps.selectedProject?.id ?? null,
    selectedAct: ps.selectedAct?.id ?? null,
    selectedScene: ps.selectedScene?.id ?? null,
    viewport: typeof window !== 'undefined'
      ? { width: window.innerWidth, height: window.innerHeight }
      : undefined,
  };
}

export function useAdvisor() {
  const clientRef = useRef<AdvisorClient | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  // Activate memory tracking (observes workspace changes, density, transitions)
  useAdvisorMemory();

  const connectionState = useAgentStore((s) => s.connectionState);
  const messages = useAgentStore((s) => s.messages);
  const suggestions = useAgentStore((s) => s.suggestions);
  const isProcessing = useAgentStore((s) => s.isProcessing);
  const processingStatus = useAgentStore((s) => s.processingStatus);
  const rateLimitedUntil = useAgentStore((s) => s.rateLimitedUntil);
  const isThrottled = useAgentStore((s) => s.isThrottled);
  const lastError = useAgentStore((s) => s.lastError);
  const setConnectionState = useAgentStore((s) => s.setConnectionState);
  const setObserving = useAgentStore((s) => s.setObserving);
  const setProcessing = useAgentStore((s) => s.setProcessing);
  const setRateLimitedUntil = useAgentStore((s) => s.setRateLimitedUntil);
  const setThrottled = useAgentStore((s) => s.setThrottled);
  const setLastError = useAgentStore((s) => s.setLastError);
  const setEventSender = useAgentStore((s) => s.setEventSender);
  const addMessage = useAgentStore((s) => s.addMessage);
  const updateStreamingMessage = useAgentStore((s) => s.updateStreamingMessage);
  const finalizeStreamingMessage = useAgentStore((s) => s.finalizeStreamingMessage);
  const addSuggestion = useAgentStore((s) => s.addSuggestion);
  const pushEffect = useAgentStore((s) => s.pushEffect);
  const rateMessageInStore = useAgentStore((s) => s.rateMessage);
  const dismissSuggestion = useAgentStore((s) => s.dismissSuggestion);

  // Memory store for personalization
  const getMemorySummary = useAdvisorMemoryStore((s) => s.getMemorySummary);
  const incrementInteractions = useAdvisorMemoryStore((s) => s.incrementInteractions);
  const recordSuggestionOutcome = useAdvisorMemoryStore((s) => s.recordSuggestionOutcome);
  const recordResponseRating = useAdvisorMemoryStore((s) => s.recordResponseRating);

  // Ensure single client instance
  const getClient = useCallback(() => {
    if (!clientRef.current) {
      clientRef.current = new AdvisorClient();
    }
    return clientRef.current;
  }, []);

  // ─── Tool Call Handler ──────────────────────────

  const handleToolCalls = useCallback((calls: AdvisorToolCall[]) => {
    for (const call of calls) {
      switch (call.name) {
        case TOOL_NAMES.COMPOSE_WORKSPACE: {
          const parsed = validateToolArgs(composeWorkspaceArgsSchema, call.args, 'compose_workspace');
          if (!parsed) break; // skip malformed tool call

          const { reasoning, ...workspacePayload } = parsed;

          const trigger: EffectTriggerSource = { kind: 'tool_call', toolName: call.name, args: call.args };
          const { panels, layout, action, before, after } = dispatchWorkspaceAction(workspacePayload);

          pushEffect(trigger, action, reasoning, before, after);

          if (reasoning) {
            addMessage({
              id: nextId('msg'),
              role: 'system',
              content: `${reasoning}\nWorkspace updated: ${panels.map((p) => p.type).join(' + ')} (${layout ?? before.layout})`,
              timestamp: Date.now(),
            });
          }
          break;
        }

        case TOOL_NAMES.SUGGEST_ACTION: {
          const parsed = validateToolArgs(suggestActionArgsSchema, call.args, 'suggest_action');
          if (!parsed) break; // skip malformed tool call

          const { content, compose_on_accept } = parsed;

          let composePayload: ComposeWorkspaceArgs | undefined;
          if (compose_on_accept) {
            try {
              const raw = typeof compose_on_accept === 'string'
                ? JSON.parse(compose_on_accept)
                : compose_on_accept;
              composePayload = validateToolArgs(composeWorkspaceArgsSchema, raw, 'compose_on_accept') ?? undefined;
            } catch {
              // ignore malformed JSON in compose_on_accept
            }
          }

          // Build preview from validated payload — no unsafe casts needed
          let previewContent = content;
          if (composePayload) {
            const panelNames = Array.isArray(composePayload.panels)
              ? composePayload.panels.map((p) => p.type).join(' | ')
              : '';
            previewContent = `${content}\nPreview: [${composePayload.layout ?? 'auto'}] ${panelNames}`;
          }

          const suggestion: AgentSuggestion = {
            id: nextId('sug'),
            content: previewContent,
            action: composePayload
              ? { type: TOOL_NAMES.COMPOSE_WORKSPACE, payload: composePayload }
              : undefined,
            timestamp: Date.now(),
            dismissed: false,
          };

          addSuggestion(suggestion);
          break;
        }

        case TOOL_NAMES.SESSION_SPAWNED: {
          const parsed = validateToolArgs(sessionSpawnedArgsSchema, call.args, '_session_spawned');
          if (!parsed) break; // skip malformed tool call

          const label = parsed.prompt
            ? `Agent: ${parsed.prompt.slice(0, 40)}${parsed.prompt.length > 40 ? '...' : ''}`
            : 'Agent Task';

          // Expand command bar to show activity
          const cmdBar = useCommandBarStore.getState();
          cmdBar.expand();

          addMessage({
            id: nextId('msg'),
            role: 'system',
            content: `CLI session started: ${label}`,
            timestamp: Date.now(),
          });
          break;
        }
      }
    }
  }, [addMessage, addSuggestion, pushEffect]);

  // ─── Connect ────────────────────────────────────

  const connect = useCallback(async () => {
    const client = getClient();
    if (client.isConnected) return;

    // Remove any previously registered handlers before re-wiring
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    const unsubs = unsubscribersRef.current;
    unsubs.push(client.onStateChange((state) => setConnectionState(state)));
    unsubs.push(client.onProcessingChange((processing, status) => setProcessing(processing, status)));
    // Streaming text — update an in-progress message in real-time
    unsubs.push(client.onStreamingText((_chunk, accumulated) => {
      updateStreamingMessage(accumulated);
    }));
    // Final complete message — finalize the streaming message
    unsubs.push(client.onMessage((text) => {
      finalizeStreamingMessage(text);
    }));
    unsubs.push(client.onError((advisorError) => {
      setLastError(advisorError);
      addMessage({
        id: nextId('err'),
        role: 'agent',
        content: advisorErrorLabel(advisorError),
        timestamp: Date.now(),
        isError: true,
      });
    }));
    unsubs.push(client.onRateLimit((readyAt) => {
      setRateLimitedUntil(readyAt);
      if (readyAt) {
        setThrottled(true);
        // Clear throttled flag when the rate limit expires
        const delay = readyAt - Date.now();
        if (delay > 0) {
          setTimeout(() => setThrottled(false), delay);
        } else {
          setThrottled(false);
        }
      } else {
        setThrottled(false);
      }
    }));
    unsubs.push(client.onRetry((attempt, maxRetries) => {
      addMessage({
        id: nextId('retry'),
        role: 'system',
        content: `Retrying (${attempt}/${maxRetries})...`,
        timestamp: Date.now(),
        retryInfo: `${attempt}/${maxRetries}`,
      });
    }));
    unsubs.push(client.onToolCall(handleToolCalls));

    const ok = await client.connect();
    if (ok) {
      setObserving(true);
      // Register the event sender so agentStore.recordToolEvent() can trigger advisor calls
      setEventSender((events) => {
        incrementInteractions();
        client.sendContext(getWorkspaceSnapshot(), events, undefined, getMemorySummary());
      });
      addMessage({
        id: nextId('msg'),
        role: 'system',
        content: 'Advisor connected. Observing workspace and CLI activity.',
        timestamp: Date.now(),
      });
    } else {
      addMessage({
        id: nextId('msg'),
        role: 'system',
        content: 'Advisor unavailable. Ensure GEMINI_API_KEY is set in .env.local.',
        timestamp: Date.now(),
      });
    }
  }, [getClient, setConnectionState, setProcessing, setRateLimitedUntil, setThrottled, setLastError, setObserving, setEventSender, addMessage, handleToolCalls, incrementInteractions, getMemorySummary]);

  // ─── Disconnect ─────────────────────────────────

  const disconnect = useCallback(() => {
    setEventSender(null);
    clientRef.current?.disconnect();
    setObserving(false);
  }, [setObserving, setEventSender]);

  // ─── Send Message ───────────────────────────────

  const lastUserMessageRef = useRef<string | null>(null);

  const sendMessage = useCallback((text: string) => {
    const client = clientRef.current;
    if (!client?.isConnected) return;

    lastUserMessageRef.current = text;
    setLastError(null); // Clear previous error on new send

    addMessage({
      id: nextId('msg'),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });

    incrementInteractions();
    client.sendContext(getWorkspaceSnapshot(), undefined, text, getMemorySummary());
  }, [addMessage, setLastError, incrementInteractions, getMemorySummary]);

  // ─── Retry Last Message ────────────────────────

  const retryLastMessage = useCallback(() => {
    const lastText = lastUserMessageRef.current;
    if (!lastText) return;
    sendMessage(lastText);
  }, [sendMessage]);

  // ─── Send Tool Events (called from agentStore) ──

  const sendToolEvents = useCallback((events: CLIToolEvent[]) => {
    const client = clientRef.current;
    if (!client?.isConnected || events.length === 0) return;

    incrementInteractions();
    client.sendContext(getWorkspaceSnapshot(), events, undefined, getMemorySummary());
  }, [incrementInteractions, getMemorySummary]);

  // ─── Accept Suggestion ──────────────────────────

  const acceptSuggestion = useCallback((id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (!suggestion?.action) {
      if (suggestion) recordSuggestionOutcome(suggestion.content, false);
      dismissSuggestion(id);
      return;
    }

    // Record acceptance in memory
    recordSuggestionOutcome(suggestion.content, true);

    const trigger: EffectTriggerSource = { kind: 'suggestion_accept', suggestionId: id, content: suggestion.content };
    const { action, before, after } = dispatchWorkspaceAction(suggestion.action.payload as Record<string, unknown>);
    pushEffect(trigger, action, undefined, before, after);

    dismissSuggestion(id);
  }, [suggestions, dismissSuggestion, recordSuggestionOutcome, pushEffect]);

  const dismissSuggestionWithTracking = useCallback((id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (suggestion) recordSuggestionOutcome(suggestion.content, false);
    dismissSuggestion(id);
  }, [suggestions, dismissSuggestion, recordSuggestionOutcome]);

  // ─── Rate Message ──────────────────────────────

  const rateMessage = useCallback((id: string, rating: MessageRating) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg || msg.role !== 'agent') return;

    rateMessageInStore(id, rating);
    recordResponseRating(msg.content, rating === 'positive');
  }, [messages, rateMessageInStore, recordResponseRating]);

  // ─── Regenerate (after negative rating) ────────

  const regenerateResponse = useCallback((messageId: string) => {
    const client = clientRef.current;
    if (!client?.isConnected) return;

    // Find the user message that preceded the rated agent message
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex < 0) return;

    // Walk backward to find the closest preceding user message
    let userText: string | null = null;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userText = messages[i].content;
        break;
      }
    }

    if (!userText) return;

    setLastError(null);

    addMessage({
      id: nextId('msg'),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    });

    incrementInteractions();
    const adjustedPrompt = `[The user was not satisfied with your previous response. Provide a different, improved answer.]\n\n${userText}`;
    client.sendContext(getWorkspaceSnapshot(), undefined, adjustedPrompt, getMemorySummary());
  }, [messages, addMessage, setLastError, incrementInteractions, getMemorySummary]);

  // ─── Cleanup on unmount ─────────────────────────

  useEffect(() => {
    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
      clientRef.current?.disconnect();
    };
  }, []);

  return {
    // State
    connectionState,
    isObserving: connectionState === 'connected',
    messages,
    suggestions: suggestions.filter((s) => !s.dismissed),
    isProcessing,
    processingStatus,
    rateLimitedUntil,
    isThrottled,
    lastError,

    // Actions
    connect,
    disconnect,
    sendMessage,
    retryLastMessage,
    clearError: useCallback(() => setLastError(null), [setLastError]),
    sendToolEvents,
    acceptSuggestion,
    dismissSuggestion: dismissSuggestionWithTracking,
    rateMessage,
    regenerateResponse,
  };
}
