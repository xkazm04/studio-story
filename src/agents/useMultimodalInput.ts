/**
 * useMultimodalInput — Unified multimodal input hook.
 *
 * Merges voice transcriptions, text input, and click context into
 * a single interaction context, dispatching through the IntentBus
 * when intents are locally resolvable or falling through to Gemini
 * Live for LLM-powered resolution.
 */

import { useRef, useCallback } from 'react';
import { useIntent } from '@dzin/core';
import type { Intent, IntentSource } from '@dzin/core';
import { useAgentStore } from '@/agents/store/agentStore';
import type { GeminiLiveClient } from '@dzin/voice';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const INTERACTION_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Interaction Context Types
// ---------------------------------------------------------------------------

export interface InteractionFragment {
  source: 'voice' | 'text' | 'click';
  content: string;
  timestamp: number;
}

export interface InteractionContext {
  id: string;
  fragments: InteractionFragment[];
  state: 'accumulating' | 'resolved' | 'expired';
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Known panel types for parseTextToIntent
// ---------------------------------------------------------------------------

const KNOWN_PANEL_TYPES = new Set([
  'scene-editor', 'scene-metadata', 'dialogue-view', 'scene-list', 'scene-gallery',
  'character-cards', 'character-detail', 'character-creator', 'cast-sidebar',
  'story-map', 'beats-manager', 'story-evaluator', 'story-graph',
  'script-editor', 'theme-manager', 'beats-sidebar',
  'image-canvas', 'image-generator', 'art-style',
  'voice-manager', 'voice-casting', 'voice-performance',
  'writing-desk', 'relationship-map', 'reader-view', 'narrative-suggestions',
  'storyboard',
]);

const KNOWN_LAYOUTS = new Set([
  'single', 'split-2', 'split-3', 'grid-4', 'primary-sidebar', 'triptych', 'studio',
]);

// ---------------------------------------------------------------------------
// parseTextToIntent — Pure function mapping natural language to Intent
// ---------------------------------------------------------------------------

/**
 * Maps common natural language patterns to Intent objects.
 * Returns null if no pattern matches (falls through to LLM).
 */
export function parseTextToIntent(text: string): Intent | null {
  const normalized = text.trim().toLowerCase();

  // undo / redo
  if (normalized === 'undo') {
    return makeIntent('system', { action: 'undo' }, 'voice');
  }
  if (normalized === 'redo') {
    return makeIntent('system', { action: 'redo' }, 'voice');
  }

  // show [panel-type] / open [panel-type]
  const showMatch = normalized.match(/^(?:show|open)\s+(.+)$/);
  if (showMatch) {
    const panelType = showMatch[1].trim();
    if (KNOWN_PANEL_TYPES.has(panelType)) {
      return makeIntent('compose', { action: 'open', panelType }, 'voice');
    }
  }

  // close [panel-type] / hide [panel-type]
  const closeMatch = normalized.match(/^(?:close|hide)\s+(.+)$/);
  if (closeMatch) {
    const panelType = closeMatch[1].trim();
    if (KNOWN_PANEL_TYPES.has(panelType)) {
      return makeIntent('compose', { action: 'close', panelType }, 'voice');
    }
  }

  // layout [template] / switch to [template]
  const layoutMatch = normalized.match(/^(?:layout|switch\s+to)\s+(.+)$/);
  if (layoutMatch) {
    const template = layoutMatch[1].trim();
    if (KNOWN_LAYOUTS.has(template)) {
      return makeIntent('compose', { action: 'set-layout', template }, 'voice');
    }
  }

  return null;
}

function makeIntent(type: Intent['type'], payload: Record<string, unknown>, source: IntentSource): Intent {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `intent-${Date.now()}-${Math.random()}`,
    type,
    payload: payload as Intent['payload'],
    source,
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// createInteractionContext — Factory
// ---------------------------------------------------------------------------

export function createInteractionContext(): InteractionContext {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ctx-${Date.now()}-${Math.random()}`,
    fragments: [],
    state: 'accumulating',
    createdAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// useMultimodalInput Hook
// ---------------------------------------------------------------------------

export function useMultimodalInput(
  liveClientRef?: React.RefObject<GeminiLiveClient | null>,
) {
  const { dispatch } = useIntent();
  const addMessage = useAgentStore((s) => s.addMessage);

  const contextRef = useRef<InteractionContext | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ensure we have an active context, creating one if needed
  const ensureContext = useCallback((): InteractionContext => {
    if (!contextRef.current || contextRef.current.state !== 'accumulating') {
      contextRef.current = createInteractionContext();
    }
    return contextRef.current;
  }, []);

  // Reset the expiry timer on each new fragment
  const resetExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
    }
    expiryTimerRef.current = setTimeout(() => {
      if (contextRef.current && contextRef.current.state === 'accumulating') {
        contextRef.current.state = 'expired';
      }
    }, INTERACTION_TIMEOUT_MS);
  }, []);

  // Add a fragment to the current context
  const addFragment = useCallback(
    (source: InteractionFragment['source'], content: string) => {
      const ctx = ensureContext();
      ctx.fragments.push({ source, content, timestamp: Date.now() });
      resetExpiryTimer();
    },
    [ensureContext, resetExpiryTimer],
  );

  /**
   * Handle a voice transcription from GeminiLiveClient.
   * Tries to resolve locally via parseTextToIntent; if parseable,
   * dispatches via IntentBus with source 'voice'.
   * If not parseable, the voice audio is already being processed
   * by Gemini Live so no additional action is needed.
   */
  const handleTranscription = useCallback(
    (text: string) => {
      addFragment('voice', text);

      // Log to agent store as user message
      addMessage({
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
        role: 'user',
        content: `[voice] ${text}`,
        timestamp: Date.now(),
      });

      const intent = parseTextToIntent(text);
      if (intent) {
        const result = dispatch(intent);
        if (result.status === 'resolved') {
          // Mark context as resolved
          if (contextRef.current) {
            contextRef.current.state = 'resolved';
          }
        }
        // If needs-llm, voice audio is already being processed by Gemini Live
      }
      // If null, voice audio is already being processed by Gemini Live
    },
    [addFragment, addMessage, dispatch],
  );

  /**
   * Handle text input from keyboard/UI.
   * Same resolution path as handleTranscription but with source 'keyboard'.
   * If needs LLM, sends to GeminiLiveClient or falls back to HTTP advisor.
   */
  const handleTextInput = useCallback(
    (text: string) => {
      addFragment('text', text);

      const intent = parseTextToIntent(text);
      if (intent) {
        // Override source to keyboard for text input
        intent.source = 'keyboard';
        const result = dispatch(intent);
        if (result.status === 'resolved') {
          if (contextRef.current) {
            contextRef.current.state = 'resolved';
          }
          return;
        }
      }

      // Not locally resolvable — send to Gemini Live or fall back
      if (liveClientRef?.current) {
        liveClientRef.current.send(text);
      }
    },
    [addFragment, dispatch, liveClientRef],
  );

  /**
   * Add click context to the current interaction context.
   */
  const addClickContext = useCallback(
    (entityType: string, entityId: string) => {
      addFragment('click', `${entityType}:${entityId}`);
    },
    [addFragment],
  );

  /**
   * Get the current interaction context, or null if expired/none.
   */
  const getInteractionContext = useCallback((): InteractionContext | null => {
    const ctx = contextRef.current;
    if (!ctx) return null;
    if (ctx.state === 'expired') return null;
    return ctx;
  }, []);

  /**
   * Clear/reset the interaction context.
   */
  const clearInteractionContext = useCallback(() => {
    contextRef.current = null;
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  return {
    handleTranscription,
    handleTextInput,
    addClickContext,
    getInteractionContext,
    clearInteractionContext,
  };
}
