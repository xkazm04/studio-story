'use client';

import { useState, useRef, useSyncExternalStore, useCallback } from 'react';
import type { LLMTransport, LLMTransportStatus } from '@dzin/core';
import type { ActiveSuggestion } from '@/agents/ambient-observer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 2;
const NOOP_SUBSCRIBE = () => () => {};
const IDLE_SNAPSHOT = JSON.stringify({ status: 'idle' });

// ---------------------------------------------------------------------------
// useSuggestionState
// ---------------------------------------------------------------------------

/**
 * Shared suggestion state for both ambient observer and LLM response cards.
 *
 * Manages a visible list (capped at MAX_VISIBLE) with an internal overflow
 * queue. Holds a ref to the lazily-initialized LLM transport and derives
 * llmStatus via useSyncExternalStore.
 */
export function useSuggestionState() {
  const [suggestions, setSuggestions] = useState<ActiveSuggestion[]>([]);
  const queueRef = useRef<ActiveSuggestion[]>([]);
  const transportRef = useRef<LLMTransport | null>(null);

  // -------------------------------------------------------------------------
  // LLM status via useSyncExternalStore
  // -------------------------------------------------------------------------

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (transportRef.current) {
        return transportRef.current.subscribe(onStoreChange);
      }
      return NOOP_SUBSCRIBE();
    },
    [],
  );

  const getSnapshot = useCallback(() => {
    if (transportRef.current) {
      return transportRef.current.getSnapshot();
    }
    return IDLE_SNAPSHOT;
  }, []);

  const rawSnapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const llmStatus: LLMTransportStatus = (JSON.parse(rawSnapshot) as { status: LLMTransportStatus }).status;

  // -------------------------------------------------------------------------
  // Suggestion management
  // -------------------------------------------------------------------------

  const addSuggestion = useCallback((suggestion: ActiveSuggestion) => {
    setSuggestions((prev) => {
      if (prev.length >= MAX_VISIBLE) {
        queueRef.current.push(suggestion);
        return prev;
      }
      return [...prev, suggestion];
    });
  }, []);

  const dismissSuggestion = useCallback((id: string) => {
    setSuggestions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      // Drain queue if we have room
      const drained: ActiveSuggestion[] = [];
      while (queueRef.current.length > 0 && filtered.length + drained.length < MAX_VISIBLE) {
        drained.push(queueRef.current.shift()!);
      }
      return [...filtered, ...drained];
    });
  }, []);

  return {
    suggestions,
    addSuggestion,
    dismissSuggestion,
    transportRef,
    llmStatus,
  };
}
