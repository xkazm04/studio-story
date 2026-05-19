/**
 * useGenerativeSelection<T>
 *
 * Generic hook for the generate → select → persist pipeline.
 * Encapsulates the FSM, polling logic, error/retry handling, and gallery state.
 *
 * Consumers provide only:
 *   - startGeneration(prompt) — kick off generation
 *   - persistSelection(item, ctx) — save the user's pick
 *
 * Supports three generation modes:
 *   1. Async polling: startGeneration returns { generationId } → polls via pollGeneration
 *   2. Immediate gallery: startGeneration returns { items } → straight to gallery
 *   3. Quick completion: startGeneration returns void → back to idle (no gallery)
 */

import { useReducer, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// State types (discriminated union)
// ---------------------------------------------------------------------------

interface IdleState {
  phase: 'idle';
}

interface GeneratingState {
  phase: 'generating';
  startTime: number;
  prompt: string;
}

interface PollingState {
  phase: 'polling';
  generationId: string;
  startTime: number;
  prompt: string;
}

interface GalleryState<T> {
  phase: 'gallery';
  items: T[];
  generationId: string;
  selectedId: string | null;
}

interface ConfirmingState<T> {
  phase: 'confirming';
  items: T[];
  selectedId: string;
  generationId: string;
}

interface ErrorState {
  phase: 'error';
  error: string;
  failedFrom: 'generating' | 'polling' | 'confirming';
}

export type GenerativeState<T> =
  | IdleState
  | GeneratingState
  | PollingState
  | GalleryState<T>
  | ConfirmingState<T>
  | ErrorState;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

type GenerativeEvent<T> =
  | { type: 'START'; prompt: string }
  | { type: 'GENERATION_STARTED'; generationId: string }
  | { type: 'ITEMS_READY'; items: T[]; generationId?: string }
  | { type: 'POLL_FAILED'; error: string }
  | { type: 'GENERATE_FAILED'; error: string }
  | { type: 'SELECT'; itemId: string }
  | { type: 'CONFIRM' }
  | { type: 'CONFIRM_SUCCESS' }
  | { type: 'CONFIRM_FAILED'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function generativeReducer<T extends { id: string }>(
  state: GenerativeState<T>,
  event: GenerativeEvent<T>,
): GenerativeState<T> {
  switch (event.type) {
    case 'START':
      if (state.phase !== 'idle') return state;
      return { phase: 'generating', startTime: Date.now(), prompt: event.prompt };

    case 'GENERATION_STARTED':
      if (state.phase !== 'generating') return state;
      return {
        phase: 'polling',
        generationId: event.generationId,
        startTime: state.startTime,
        prompt: state.prompt,
      };

    case 'ITEMS_READY':
      if (state.phase !== 'generating' && state.phase !== 'polling') return state;
      return {
        phase: 'gallery',
        items: event.items,
        generationId:
          state.phase === 'polling'
            ? state.generationId
            : event.generationId || '',
        selectedId: null,
      };

    case 'POLL_FAILED':
      if (state.phase !== 'polling') return state;
      return { phase: 'error', error: event.error, failedFrom: 'polling' };

    case 'GENERATE_FAILED':
      if (state.phase !== 'generating') return state;
      return { phase: 'error', error: event.error, failedFrom: 'generating' };

    case 'SELECT':
      if (state.phase !== 'gallery') return state;
      return { ...state, selectedId: event.itemId };

    case 'CONFIRM':
      if (state.phase !== 'gallery' || !state.selectedId) return state;
      return {
        phase: 'confirming',
        items: state.items,
        selectedId: state.selectedId,
        generationId: state.generationId,
      };

    case 'CONFIRM_SUCCESS':
      if (state.phase !== 'confirming') return state;
      return { phase: 'idle' };

    case 'CONFIRM_FAILED':
      if (state.phase !== 'confirming') return state;
      return { phase: 'error', error: event.error, failedFrom: 'confirming' };

    case 'RETRY':
      if (state.phase !== 'error') return state;
      return { phase: 'idle' };

    case 'RESET':
      return { phase: 'idle' };

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export const isPhase = {
  idle: <T>(s: GenerativeState<T>): s is IdleState => s.phase === 'idle',
  generating: <T>(s: GenerativeState<T>): s is GeneratingState =>
    s.phase === 'generating',
  polling: <T>(s: GenerativeState<T>): s is PollingState =>
    s.phase === 'polling',
  gallery: <T>(s: GenerativeState<T>): s is GalleryState<T> =>
    s.phase === 'gallery',
  confirming: <T>(s: GenerativeState<T>): s is ConfirmingState<T> =>
    s.phase === 'confirming',
  error: <T>(s: GenerativeState<T>): s is ErrorState => s.phase === 'error',
  /** True while any async work is in flight */
  busy: <T>(s: GenerativeState<T>): boolean =>
    s.phase === 'generating' ||
    s.phase === 'polling' ||
    s.phase === 'confirming',
} as const;

// ---------------------------------------------------------------------------
// Config types
// ---------------------------------------------------------------------------

/**
 * Result of startGeneration:
 * - { generationId } → async flow, will poll
 * - { items }        → immediate gallery
 * - void/undefined   → quick completion, back to idle
 */
export type GenerationResult<T> =
  | { generationId: string }
  | { items: T[] }
  | void;

export interface PollResult<T> {
  status: 'pending' | 'complete' | 'failed';
  items?: T[];
  error?: string;
}

export interface PersistContext {
  generationId: string;
}

export interface UseGenerativeSelectionConfig<T extends { id: string }> {
  /** Start generation. Return a generationId (async), items (immediate), or void (quick). */
  startGeneration: (prompt: string) => Promise<GenerationResult<T>>;
  /** Poll for generation status (required when startGeneration returns a generationId) */
  pollGeneration?: (generationId: string) => Promise<PollResult<T>>;
  /** Persist the user's final selection */
  persistSelection: (selected: T, context: PersistContext) => Promise<void>;
  /** Stable key for React Query polling (prevents cross-hook collision) */
  queryKey?: string;
  /** Polling interval in ms (default 2000) */
  pollInterval?: number;
  /** Callback after successful persistence */
  onPersisted?: () => void;
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface GenerativeSelectionAPI<T extends { id: string }> {
  state: GenerativeState<T>;
  /** Kick off generation with the given prompt */
  start: (prompt: string) => Promise<void>;
  /** Select an item in gallery phase */
  select: (itemId: string) => void;
  /** Confirm the selected item (persist) */
  confirm: () => Promise<void>;
  /** Return to idle from error state */
  retry: () => void;
  /** Force-reset from any state */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const INITIAL: GenerativeState<never> = { phase: 'idle' };

export function useGenerativeSelection<T extends { id: string }>(
  config: UseGenerativeSelectionConfig<T>,
): GenerativeSelectionAPI<T> {
  const {
    pollGeneration,
    queryKey = 'generative-selection',
    pollInterval = 2000,
  } = config;

  // Keep latest config in a ref so callbacks don't go stale
  const configRef = useRef(config);
  configRef.current = config;

  const [state, dispatch] = useReducer(
    generativeReducer<T>,
    INITIAL as GenerativeState<T>,
  );

  // ── Polling via React Query ────────────────────────────────────────
  const generationId = isPhase.polling(state) ? state.generationId : null;

  const { data: pollData } = useQuery<PollResult<T> | null>({
    queryKey: [queryKey, 'poll', generationId],
    queryFn: () => {
      if (!generationId || !pollGeneration) return null;
      return pollGeneration(generationId);
    },
    enabled: isPhase.polling(state) && !!generationId && !!pollGeneration,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'pending' ? pollInterval : false;
    },
  });

  useEffect(() => {
    if (!pollData) return;
    if (pollData.status === 'complete' && pollData.items?.length) {
      dispatch({ type: 'ITEMS_READY', items: pollData.items });
    } else if (pollData.status === 'failed') {
      dispatch({
        type: 'POLL_FAILED',
        error: pollData.error || 'Generation failed',
      });
    }
  }, [pollData]);

  // ── Actions ────────────────────────────────────────────────────────

  const start = useCallback(async (prompt: string) => {
    dispatch({ type: 'START', prompt });

    try {
      const result = await configRef.current.startGeneration(prompt);

      if (!result) {
        // Quick completion — no gallery needed
        dispatch({ type: 'RESET' });
      } else if ('items' in result) {
        dispatch({ type: 'ITEMS_READY', items: result.items });
      } else {
        dispatch({
          type: 'GENERATION_STARTED',
          generationId: result.generationId,
        });
      }
    } catch (error) {
      dispatch({
        type: 'GENERATE_FAILED',
        error: error instanceof Error ? error.message : 'Generation failed',
      });
    }
  }, []);

  const select = useCallback((itemId: string) => {
    dispatch({ type: 'SELECT', itemId });
  }, []);

  const confirm = useCallback(async () => {
    if (!isPhase.gallery(state) || !state.selectedId) return;

    const selected = state.items.find((item) => item.id === state.selectedId);
    if (!selected) return;

    const ctx: PersistContext = { generationId: state.generationId };
    dispatch({ type: 'CONFIRM' });

    try {
      await configRef.current.persistSelection(selected, ctx);
      dispatch({ type: 'CONFIRM_SUCCESS' });
      configRef.current.onPersisted?.();
    } catch (error) {
      dispatch({
        type: 'CONFIRM_FAILED',
        error: error instanceof Error ? error.message : 'Failed to save',
      });
    }
  }, [state]);

  const retry = useCallback(() => dispatch({ type: 'RETRY' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { state, start, select, confirm, retry, reset };
}
