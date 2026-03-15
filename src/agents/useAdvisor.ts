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
import type { AdvisorToolCall, CLIToolEvent } from './AdvisorClient';
import { useAgentStore } from './store/agentStore';
import { useAdvisorMemoryStore } from './store/advisorMemoryStore';
import { useAdvisorMemory } from './useAdvisorMemory';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useCommandBarStore } from '@/workspace/store/commandBarStore';
import type { AgentMessage, AgentSuggestion } from './types';

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
  const setPreviousWorkspaceState = useAgentStore((s) => s.setPreviousWorkspaceState);
  const dismissSuggestion = useAgentStore((s) => s.dismissSuggestion);

  // Memory store for personalization
  const getMemorySummary = useAdvisorMemoryStore((s) => s.getMemorySummary);
  const incrementInteractions = useAdvisorMemoryStore((s) => s.incrementInteractions);
  const recordSuggestionOutcome = useAdvisorMemoryStore((s) => s.recordSuggestionOutcome);

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
        case 'compose_workspace': {
          const { action, layout, panels: panelsJson, reasoning } = call.args as {
            action: string;
            layout?: string;
            panels?: string | Array<{
              type: string;
              role?: string;
              props?: Record<string, unknown>;
              density?: string;
              dataSlice?: { entityId?: string; filter?: string; view?: string; highlight?: string[]; sort?: string };
            }>;
            reasoning?: string;
          };

          let panels: Array<{
            type: string;
            role?: string;
            props?: Record<string, unknown>;
            density?: string;
            dataSlice?: { entityId?: string; filter?: string; view?: string; highlight?: string[]; sort?: string };
          }> = [];
          if (panelsJson) {
            try {
              panels = typeof panelsJson === 'string' ? JSON.parse(panelsJson) : panelsJson;
            } catch {
              panels = [];
            }
          }

          const store = useWorkspaceStore.getState();
          setPreviousWorkspaceState({
            panels: store.panels.map((p) => ({ type: p.type, role: p.role, props: p.props })),
            layout: store.layout,
          });
          const directives = panels.map((p) => ({
            type: p.type as Parameters<typeof store.showPanels>[0][0]['type'],
            role: p.role as 'primary' | 'secondary' | 'tertiary' | 'sidebar' | undefined,
            props: p.props,
            density: p.density as 'micro' | 'compact' | 'full' | undefined,
            dataSlice: p.dataSlice,
          }));

          switch (action) {
            case 'replace':
              store.replaceAllPanels(directives, layout as Parameters<typeof store.replaceAllPanels>[1]);
              break;
            case 'show':
              store.showPanels(directives);
              break;
            case 'hide':
              store.hidePanels(panels.map((p) => p.type) as Parameters<typeof store.hidePanels>[0]);
              break;
            case 'clear':
              store.clearPanels();
              break;
          }

          if (reasoning) {
            addMessage({
              id: nextId('msg'),
              role: 'system',
              content: `${reasoning}\nWorkspace updated: ${panels.map((p) => p.type).join(' + ')} (${layout ?? store.layout})`,
              timestamp: Date.now(),
            });
          }
          break;
        }

        case 'suggest_action': {
          const { content, compose_on_accept } = call.args as {
            content: string;
            compose_on_accept?: string;
          };

          let composePayload: Record<string, unknown> | undefined;
          if (compose_on_accept) {
            try {
              composePayload = typeof compose_on_accept === 'string'
                ? JSON.parse(compose_on_accept)
                : compose_on_accept;
            } catch {
              // ignore
            }
          }

          const suggestion: AgentSuggestion = {
            id: nextId('sug'),
            content: composePayload
              ? `${content}\nPreview: [${String((composePayload as { layout?: string }).layout ?? 'auto')}] ${((composePayload as { panels?: Array<{ type: string }> }).panels ?? []).map((p) => p.type).join(' | ')}`
              : content,
            action: composePayload
              ? { type: 'compose_workspace', payload: composePayload }
              : undefined,
            timestamp: Date.now(),
            dismissed: false,
          };

          addSuggestion(suggestion);
          break;
        }

        case '_session_spawned': {
          // Server spawned a CLI session — expand command bar and notify
          const { prompt } = call.args as {
            executionId?: string;
            sessionId?: string;
            domain?: string;
            streamUrl?: string;
            prompt?: string;
          };

          const label = prompt
            ? `Agent: ${prompt.slice(0, 40)}${prompt.length > 40 ? '...' : ''}`
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
  }, [addMessage, addSuggestion, setPreviousWorkspaceState]);

  // ─── Connect ────────────────────────────────────

  const connect = useCallback(async () => {
    const client = getClient();
    if (client.isConnected) return;

    // Wire handlers (idempotent — re-wiring is fine since we create one client)
    client.onStateChange((state) => setConnectionState(state));
    client.onProcessingChange((processing, status) => setProcessing(processing, status));
    // Streaming text — update an in-progress message in real-time
    client.onStreamingText((_chunk, accumulated) => {
      updateStreamingMessage(accumulated);
    });
    // Final complete message — finalize the streaming message
    client.onMessage((text) => {
      finalizeStreamingMessage(text);
    });
    client.onError((errorMessage) => {
      setLastError(errorMessage);
      addMessage({
        id: nextId('err'),
        role: 'agent',
        content: errorMessage,
        timestamp: Date.now(),
        isError: true,
      });
    });
    client.onRateLimit((readyAt) => {
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
    });
    client.onRetry((attempt, maxRetries) => {
      addMessage({
        id: nextId('retry'),
        role: 'system',
        content: `Retrying (${attempt}/${maxRetries})...`,
        timestamp: Date.now(),
        retryInfo: `${attempt}/${maxRetries}`,
      });
    });
    client.onToolCall(handleToolCalls);

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

    const { payload } = suggestion.action;
    const store = useWorkspaceStore.getState();
    const action = (payload as { action?: string }).action ?? 'replace';
    const panels = (payload as { panels?: Array<{
      type: string;
      role?: string;
      density?: string;
      dataSlice?: { entityId?: string; filter?: string; view?: string; highlight?: string[]; sort?: string };
    }> }).panels ?? [];
    const layout = (payload as { layout?: string }).layout;

    const directives = panels.map((p) => ({
      type: p.type as Parameters<typeof store.showPanels>[0][0]['type'],
      role: p.role as 'primary' | 'secondary' | 'tertiary' | 'sidebar' | undefined,
      density: p.density as 'micro' | 'compact' | 'full' | undefined,
      dataSlice: p.dataSlice,
    }));

    switch (action) {
      case 'replace':
        store.replaceAllPanels(directives, layout as Parameters<typeof store.replaceAllPanels>[1]);
        break;
      case 'show':
        store.showPanels(directives);
        break;
      case 'hide':
        store.hidePanels(panels.map((p) => p.type) as Parameters<typeof store.hidePanels>[0]);
        break;
      case 'clear':
        store.clearPanels();
        break;
    }

    dismissSuggestion(id);
  }, [suggestions, dismissSuggestion, recordSuggestionOutcome]);

  const dismissSuggestionWithTracking = useCallback((id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (suggestion) recordSuggestionOutcome(suggestion.content, false);
    dismissSuggestion(id);
  }, [suggestions, dismissSuggestion, recordSuggestionOutcome]);

  // ─── Cleanup on unmount ─────────────────────────

  useEffect(() => {
    return () => {
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
  };
}
