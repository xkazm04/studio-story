'use client';

import { useMemo } from 'react';
import {
  createDirector,
  createIntentBus,
  createComposeHandler,
  createManipulateHandler,
  createNavigateHandler,
  createSystemHandler,
  createStateEngine,
  createIntentQueue,
  createLLMTransport,
  type IntentBus,
  type IntentQueue,
  type StateEngine,
  type WorkspaceState,
  type LLMTransport,
  type LLMResponse,
  type WorkspaceSnapshot,
} from '@dzin/core';
import type { ActiveSuggestion } from '@/agents/ambient-observer';
import { PANEL_REGISTRY } from '../engine/panelRegistry';
import { TOOL_PANEL_HINTS } from '../config/workflowHints';
import { useWorkspaceStore } from '../store/workspaceStore';
import { extractData } from '@/app/utils/api';

// ---------------------------------------------------------------------------
// Default initial state for the workspace state engine
// ---------------------------------------------------------------------------

const INITIAL_STATE: WorkspaceState = {
  layout: {
    template: 'single',
    gridTemplateRows: '1fr',
    gridTemplateColumns: '1fr',
  },
  panels: [],
  streaming: null,
};

// ---------------------------------------------------------------------------
// useIntentDispatch
// ---------------------------------------------------------------------------

/**
 * Host-app hook that initializes the full @dzin/core intent system.
 *
 * Creates a Director with all 4 built-in handlers wired to the app's
 * panel registry and workflow hints, a StateEngine, an IntentBus, and
 * an IntentQueue for buffering LLM intents during user manipulation.
 *
 * Also wires LLM transport: subscribes to bus events, and when an intent
 * result has status 'needs-llm', lazily creates a transport and forwards
 * the intent to Claude via /api/claude-terminal/intent. Resolved patches
 * are surfaced as suggestion cards via the addSuggestion callback.
 *
 * Memoized so the intent system is created once per app lifetime.
 */
export function useIntentDispatch(): {
  bus: IntentBus;
  queue: IntentQueue;
  stateEngine: StateEngine<WorkspaceState>;
  getTransport: () => LLMTransport | null;
  setAddSuggestion: (cb: (s: ActiveSuggestion) => void) => void;
} {
  return useMemo(() => {
    const stateEngine = createStateEngine<WorkspaceState>(INITIAL_STATE);

    // Registry presence check -- matches app's panel registry
    const registryHas = (type: string): boolean => type in PANEL_REGISTRY;

    // State accessor
    const getState = () => stateEngine.getState();

    // Build Director with all 4 built-in handlers
    // Cast TOOL_PANEL_HINTS: app's PanelDirective uses string role, core expects PanelRole union
    const director = createDirector({
      compose: createComposeHandler(
        registryHas,
        TOOL_PANEL_HINTS as Parameters<typeof createComposeHandler>[1],
        getState,
      ),
      manipulate: createManipulateHandler(getState),
      navigate: createNavigateHandler(),
      system: createSystemHandler(),
    });

    // Create the bus that wires Director to StateEngine
    const bus = createIntentBus(director, stateEngine);

    // Create the queue for buffering LLM intents during user resize
    const queue = createIntentQueue();

    // -----------------------------------------------------------------------
    // LLM Transport wiring
    // -----------------------------------------------------------------------

    let transport: LLMTransport | null = null;
    let addSuggestionCb: ((s: ActiveSuggestion) => void) | null = null;

    /**
     * POST serialized context to the intent API route.
     * Returns the JSON response as an LLMResponse.
     */
    async function sendToLLM(context: string): Promise<LLMResponse> {
      const res = await fetch('/api/claude-terminal/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });
      return extractData<LLMResponse>(await res.json());
    }

    /**
     * Lazily create the transport on first NEEDS_LLM event.
     * Subsequent calls return the existing instance.
     */
    function getOrCreateTransport(): LLMTransport {
      if (!transport) {
        transport = createLLMTransport({ sendToLLM });
      }
      return transport;
    }

    // Subscribe to bus events and route NEEDS_LLM to transport
    bus.subscribe((event) => {
      if (event.result.status !== 'needs-llm') return;

      const t = getOrCreateTransport();

      // Build workspace snapshot from workspaceStore
      const wsState = useWorkspaceStore.getState();
      const snapshot: WorkspaceSnapshot = {
        panels: wsState.panels.map((p) => ({
          type: p.type,
          role: p.role,
          density: p.density ?? 'full',
        })),
        layout: wsState.layout as WorkspaceSnapshot['layout'],
        focusedPanel: wsState.focusedPanelId ?? undefined,
        viewport: {
          width: typeof window !== 'undefined' ? window.innerWidth : 1920,
          height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        },
      };

      // Fire and forget with error handling
      t.processIntent(event.intent, snapshot)
        .then((result) => {
          if (
            result.status === 'resolved' &&
            result.patches.length > 0
          ) {
            // Create suggestion card for LLM response
            const suggestion: ActiveSuggestion = {
              id: `llm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              patternId: '__llm_response__',
              text: result.description || 'AI suggested workspace changes',
              intentToDispatch: {
                type: 'system',
                payload: { action: 'clear' },
              },
              createdAt: Date.now(),
            };
            addSuggestionCb?.(suggestion);
          }
          // On error result: log warning, do NOT create suggestion card
          if (result.status === 'error') {
            console.warn('[useIntentDispatch] LLM transport error:', result.error);
          }
        })
        .catch((err) => {
          console.warn('[useIntentDispatch] LLM transport failure:', err);
        });
    });

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    function getTransport(): LLMTransport | null {
      return transport;
    }

    function setAddSuggestion(cb: (s: ActiveSuggestion) => void): void {
      addSuggestionCb = cb;
    }

    return { bus, queue, stateEngine, getTransport, setAddSuggestion };
  }, []);
}
