'use client';

/**
 * useAdvisor — Hook that manages the full Gemini Live advisor lifecycle.
 *
 * Wires together: GeminiLiveClient, WorkspaceObserver, agentStore,
 * and workspace store for tool call execution.
 */

import { useEffect, useRef, useCallback } from 'react';
import { GeminiLiveClient } from './GeminiLiveClient';
import { WorkspaceObserver } from './WorkspaceObserver';
import { ADVISOR_TOOLS, ADVISOR_SYSTEM_INSTRUCTION } from './advisorTools';
import { useAgentStore } from './store/agentStore';
import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import { useTerminalDockStore } from '@/workspace/store/terminalDockStore';
import type { AgentMessage, AgentSuggestion, GeminiFunctionCall } from './types';

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`;
}

export function useAdvisor() {
  const clientRef = useRef<GeminiLiveClient | null>(null);
  const observerRef = useRef<WorkspaceObserver | null>(null);

  const connectionState = useAgentStore((s) => s.connectionState);
  const isObserving = useAgentStore((s) => s.isObserving);
  const messages = useAgentStore((s) => s.messages);
  const suggestions = useAgentStore((s) => s.suggestions);
  const setConnectionState = useAgentStore((s) => s.setConnectionState);
  const setSessionHandle = useAgentStore((s) => s.setSessionHandle);
  const setObserving = useAgentStore((s) => s.setObserving);
  const addMessage = useAgentStore((s) => s.addMessage);
  const addSuggestion = useAgentStore((s) => s.addSuggestion);
  const dismissSuggestion = useAgentStore((s) => s.dismissSuggestion);

  // ─── Tool Call Handler ──────────────────────────

  const handleToolCalls = useCallback((calls: GeminiFunctionCall[]) => {
    const client = clientRef.current;
    if (!client) return;

    for (const call of calls) {
      switch (call.name) {
        case 'compose_workspace': {
          const { action, layout, panels: panelsJson, reasoning } = call.args as {
            action: string;
            layout?: string;
            panels?: string;
            reasoning?: string;
          };

          let panels: Array<{ type: string; role?: string; props?: Record<string, unknown> }> = [];
          if (panelsJson) {
            try {
              panels = typeof panelsJson === 'string' ? JSON.parse(panelsJson) : panelsJson;
            } catch {
              panels = [];
            }
          }

          const store = useWorkspaceStore.getState();
          const directives = panels.map((p) => ({
            type: p.type as Parameters<typeof store.showPanels>[0][0]['type'],
            role: p.role as 'primary' | 'secondary' | 'tertiary' | 'sidebar' | undefined,
            props: p.props,
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
              content: reasoning,
              timestamp: Date.now(),
            });
          }

          client.respondToToolCall(call.id, call.name, {
            success: true,
            action,
            panelCount: panels.length,
          });
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
            content,
            action: composePayload
              ? { type: 'compose_workspace', payload: composePayload }
              : undefined,
            timestamp: Date.now(),
            dismissed: false,
          };

          addSuggestion(suggestion);
          client.respondToToolCall(call.id, call.name, { delivered: true });
          break;
        }

        default:
          client.respondToToolCall(call.id, call.name, { error: 'Unknown tool' });
      }
    }
  }, [addMessage, addSuggestion]);

  // ─── Connect ────────────────────────────────────

  const connect = useCallback(async () => {
    if (clientRef.current?.isConnected) return;

    // Fetch API key from server
    let apiKey: string;
    try {
      const res = await fetch('/api/agents/gemini-token');
      const data = await res.json();
      if (!data.apiKey) {
        addMessage({
          id: nextId('msg'),
          role: 'system',
          content: 'Gemini API key not configured. Set GEMINI_API_KEY in .env.local.',
          timestamp: Date.now(),
        });
        return;
      }
      apiKey = data.apiKey;
    } catch {
      addMessage({
        id: nextId('msg'),
        role: 'system',
        content: 'Failed to fetch Gemini API key.',
        timestamp: Date.now(),
      });
      return;
    }

    const client = new GeminiLiveClient();
    clientRef.current = client;

    client.onStateChange((state) => {
      setConnectionState(state);
    });

    client.onMessage((text) => {
      addMessage({
        id: nextId('msg'),
        role: 'agent',
        content: text,
        timestamp: Date.now(),
      });
    });

    client.onToolCall(handleToolCalls);

    client.onSetupComplete(() => {
      // Start observing workspace
      const observer = new WorkspaceObserver({
        client,
        workspaceStore: useWorkspaceStore,
        projectStore: useProjectStore,
        terminalDockStore: useTerminalDockStore,
      });
      observerRef.current = observer;
      observer.start();
      setObserving(true);

      addMessage({
        id: nextId('msg'),
        role: 'system',
        content: 'Connected to Gemini advisor. Observing workspace.',
        timestamp: Date.now(),
      });
    });

    client.connect({
      apiKey,
      systemInstruction: ADVISOR_SYSTEM_INSTRUCTION,
      tools: ADVISOR_TOOLS,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });
  }, [addMessage, setConnectionState, setObserving, handleToolCalls, setSessionHandle]);

  // ─── Disconnect ─────────────────────────────────

  const disconnect = useCallback(() => {
    observerRef.current?.stop();
    observerRef.current = null;
    clientRef.current?.disconnect();
    clientRef.current = null;
    setObserving(false);
  }, [setObserving]);

  // ─── Send Message ───────────────────────────────

  const sendMessage = useCallback((text: string) => {
    if (!clientRef.current?.isConnected) return;

    const msg: AgentMessage = {
      id: nextId('msg'),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addMessage(msg);
    clientRef.current.send(text);
  }, [addMessage]);

  // ─── Toggle Observation ─────────────────────────

  const toggleObservation = useCallback(() => {
    if (!observerRef.current) return;

    if (isObserving) {
      observerRef.current.stop();
      setObserving(false);
    } else {
      observerRef.current.start();
      setObserving(true);
    }
  }, [isObserving, setObserving]);

  // ─── Accept Suggestion ──────────────────────────

  const acceptSuggestion = useCallback((id: string) => {
    const suggestion = suggestions.find((s) => s.id === id);
    if (!suggestion?.action) {
      dismissSuggestion(id);
      return;
    }

    // Execute the compose_workspace action
    const { payload } = suggestion.action;
    const store = useWorkspaceStore.getState();
    const action = (payload as { action?: string }).action ?? 'replace';
    const panels = (payload as { panels?: Array<{ type: string; role?: string }> }).panels ?? [];
    const layout = (payload as { layout?: string }).layout;

    const directives = panels.map((p) => ({
      type: p.type as Parameters<typeof store.showPanels>[0][0]['type'],
      role: p.role as 'primary' | 'secondary' | 'tertiary' | 'sidebar' | undefined,
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
  }, [suggestions, dismissSuggestion]);

  // ─── Cleanup on unmount ─────────────────────────

  useEffect(() => {
    return () => {
      observerRef.current?.stop();
      clientRef.current?.disconnect();
    };
  }, []);

  return {
    // State
    connectionState,
    isObserving,
    messages,
    suggestions: suggestions.filter((s) => !s.dismissed),

    // Actions
    connect,
    disconnect,
    sendMessage,
    toggleObservation,
    acceptSuggestion,
    dismissSuggestion,
  };
}
