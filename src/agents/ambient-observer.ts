import type { IntentBus, IntentEvent, IntentType } from '@dzin/core';
import type { WorkflowPattern, PatternTrigger } from './workflow-patterns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActiveSuggestion {
  id: string;
  patternId: string;
  text: string;
  intentToDispatch: {
    type: IntentType;
    payload: unknown;
  };
  createdAt: number;
}

export interface AmbientObserver {
  dismiss(suggestionId: string): void;
  getActiveSuggestions(): ActiveSuggestion[];
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface AmbientObserverOptions {
  /** Returns current panel count for idle trigger condition evaluation */
  getPanelCount?: () => number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_ACTIVE_SUGGESTIONS = 2;
const DEBOUNCE_MS = 8_000;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createAmbientObserver(
  intentBus: IntentBus,
  patterns: WorkflowPattern[],
  onSuggestion: (suggestion: ActiveSuggestion) => void,
  options?: AmbientObserverOptions,
): AmbientObserver {
  const getPanelCount = options?.getPanelCount ?? (() => 0);

  // Internal state
  const recentEvents: IntentEvent[] = [];
  const cooldowns = new Map<string, number>();
  const activeSuggestions: ActiveSuggestion[] = [];
  const queue: ActiveSuggestion[] = [];

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  const idleTimers = new Map<string, ReturnType<typeof setTimeout>>();
  let destroyed = false;
  let paused = false;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function isOnCooldown(patternId: string): boolean {
    const expiry = cooldowns.get(patternId);
    if (expiry === undefined) return false;
    return Date.now() < expiry;
  }

  function setCooldown(pattern: WorkflowPattern): void {
    cooldowns.set(pattern.id, Date.now() + pattern.cooldownMs);
  }

  function makeSuggestion(pattern: WorkflowPattern): ActiveSuggestion {
    return {
      id: `${pattern.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      patternId: pattern.id,
      text: pattern.suggestion.text,
      intentToDispatch: pattern.suggestion.intentToDispatch,
      createdAt: Date.now(),
    };
  }

  function emitOrQueue(suggestion: ActiveSuggestion, pattern: WorkflowPattern): void {
    if (destroyed) return;
    if (paused) return;
    setCooldown(pattern);

    if (activeSuggestions.length < MAX_ACTIVE_SUGGESTIONS) {
      activeSuggestions.push(suggestion);
      onSuggestion(suggestion);
    } else {
      queue.push(suggestion);
    }
  }

  function drainQueue(): void {
    while (queue.length > 0 && activeSuggestions.length < MAX_ACTIVE_SUGGESTIONS) {
      const next = queue.shift()!;
      activeSuggestions.push(next);
      onSuggestion(next);
    }
  }

  // ---------------------------------------------------------------------------
  // Trigger Matching
  // ---------------------------------------------------------------------------

  function matchEntityCreated(trigger: PatternTrigger & { type: 'entity-created' }, event: IntentEvent): boolean {
    const payload = event.intent.payload as { action?: string };
    return payload?.action === trigger.entityType;
  }

  function matchSequence(trigger: PatternTrigger & { type: 'sequence' }): boolean {
    const now = Date.now();
    const windowStart = now - trigger.withinMs;
    const windowEvents = recentEvents.filter((e) => e.timestamp >= windowStart);

    // Check if we have enough matching events in the correct order
    let matchIdx = 0;
    for (const event of windowEvents) {
      const expected = trigger.events[matchIdx];
      if (!expected) break;

      const payload = event.intent.payload as { action?: string };
      if (event.intent.type === expected.intentType && payload?.action === expected.action) {
        matchIdx++;
      }
      if (matchIdx >= trigger.events.length) return true;
    }

    return false;
  }

  function processEvents(): void {
    if (destroyed) return;
    if (paused) return;

    for (const pattern of patterns) {
      if (isOnCooldown(pattern.id)) continue;
      // Don't create suggestion for a pattern that already has an active one
      if (activeSuggestions.some((s) => s.patternId === pattern.id)) continue;
      if (queue.some((s) => s.patternId === pattern.id)) continue;

      const { trigger } = pattern;

      if (trigger.type === 'entity-created') {
        // Check all recent events in the debounce batch
        const matched = recentEvents.some((event) => matchEntityCreated(trigger, event));
        if (matched) {
          emitOrQueue(makeSuggestion(pattern), pattern);
        }
      } else if (trigger.type === 'sequence') {
        if (matchSequence(trigger)) {
          emitOrQueue(makeSuggestion(pattern), pattern);
        }
      }
      // Idle is handled by its own timer, not event processing
    }
  }

  // ---------------------------------------------------------------------------
  // Idle Timer Management
  // ---------------------------------------------------------------------------

  function resetIdleTimers(): void {
    // Clear existing idle timers
    for (const timer of idleTimers.values()) {
      clearTimeout(timer);
    }
    idleTimers.clear();

    // Set up new idle timers for each idle pattern
    for (const pattern of patterns) {
      if (pattern.trigger.type !== 'idle') continue;
      if (isOnCooldown(pattern.id)) continue;
      if (activeSuggestions.some((s) => s.patternId === pattern.id)) continue;

      const trigger = pattern.trigger;
      const timer = setTimeout(() => {
        if (destroyed) return;
        if (paused) return;
        if (isOnCooldown(pattern.id)) return;
        if (activeSuggestions.some((s) => s.patternId === pattern.id)) return;

        // Evaluate condition
        const panelCount = getPanelCount();
        if (trigger.condition(panelCount)) {
          emitOrQueue(makeSuggestion(pattern), pattern);
        }
      }, trigger.afterMs);

      idleTimers.set(pattern.id, timer);
    }
  }

  // ---------------------------------------------------------------------------
  // IntentBus Subscription
  // ---------------------------------------------------------------------------

  function onEvent(event: IntentEvent): void {
    if (destroyed) return;

    recentEvents.push(event);
    // Prune events older than 120s to prevent unbounded growth
    const cutoff = Date.now() - 120_000;
    while (recentEvents.length > 0 && recentEvents[0].timestamp < cutoff) {
      recentEvents.shift();
    }

    // Reset idle timers on any event
    resetIdleTimers();

    // Debounce event processing
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      processEvents();
    }, DEBOUNCE_MS);
  }

  const unsubscribe = intentBus.subscribe(onEvent);

  // Start idle timers immediately (for idle triggers that fire with no events)
  resetIdleTimers();

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  return {
    dismiss(suggestionId: string): void {
      const idx = activeSuggestions.findIndex((s) => s.id === suggestionId);
      if (idx >= 0) {
        activeSuggestions.splice(idx, 1);
        drainQueue();
      }
    },

    getActiveSuggestions(): ActiveSuggestion[] {
      return [...activeSuggestions];
    },

    pause(): void {
      paused = true;
    },

    resume(): void {
      paused = false;
    },

    destroy(): void {
      destroyed = true;
      unsubscribe();

      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      for (const timer of idleTimers.values()) {
        clearTimeout(timer);
      }
      idleTimers.clear();

      activeSuggestions.length = 0;
      queue.length = 0;
      recentEvents.length = 0;
    },
  };
}
