import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IntentBus, IntentEvent, IntentType } from '@dzin/core';
import { createAmbientObserver, type AmbientObserver, type ActiveSuggestion } from '../ambient-observer';
import { DEFAULT_PATTERNS, type WorkflowPattern } from '../workflow-patterns';

// ---------------------------------------------------------------------------
// Mock IntentBus
// ---------------------------------------------------------------------------

function createMockIntentBus(): IntentBus & { emit(event: IntentEvent): void } {
  const listeners: Array<(event: IntentEvent) => void> = [];
  return {
    dispatch: vi.fn(() => ({ status: 'resolved' as const, patches: [], origin: { type: 'user' as const, panelId: '' }, description: '' })),
    subscribe(listener: (event: IntentEvent) => void) {
      listeners.push(listener);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    },
    getSnapshot: () => '{}',
    emit(event: IntentEvent) {
      listeners.forEach((l) => l(event));
    },
  };
}

function makeEvent(type: IntentType, action: string, timestamp?: number): IntentEvent {
  return {
    intent: {
      id: `intent-${Date.now()}-${Math.random()}`,
      type,
      payload: { action } as never,
      source: 'click',
      timestamp: timestamp ?? Date.now(),
    },
    result: { status: 'resolved', patches: [], origin: { type: 'user', panelId: '' }, description: '' },
    timestamp: timestamp ?? Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AmbientObserver', () => {
  let bus: ReturnType<typeof createMockIntentBus>;
  let observer: AmbientObserver;
  let suggestions: ActiveSuggestion[];
  let onSuggestion: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    bus = createMockIntentBus();
    suggestions = [];
    onSuggestion = vi.fn((s: ActiveSuggestion) => suggestions.push(s));
  });

  afterEach(() => {
    observer?.destroy();
    vi.useRealTimers();
  });

  // --- Entity-created trigger ---

  it('fires entity-created suggestion when matching intent completes', () => {
    observer = createAmbientObserver(bus, DEFAULT_PATTERNS, onSuggestion);

    // character-created pattern triggers on compose/open action
    bus.emit(makeEvent('compose', 'open'));
    // Debounce: 8 seconds
    vi.advanceTimersByTime(8_100);

    expect(onSuggestion).toHaveBeenCalledTimes(1);
    expect(suggestions[0].patternId).toBe('character-created');
  });

  it('does not re-fire same pattern within cooldown period', () => {
    observer = createAmbientObserver(bus, DEFAULT_PATTERNS, onSuggestion);

    bus.emit(makeEvent('compose', 'open'));
    vi.advanceTimersByTime(8_100);
    expect(onSuggestion).toHaveBeenCalledTimes(1);

    // Dismiss so active count doesn't block
    observer.dismiss(suggestions[0].id);

    // Fire same event again -- should be in cooldown
    bus.emit(makeEvent('compose', 'open'));
    vi.advanceTimersByTime(8_100);
    expect(onSuggestion).toHaveBeenCalledTimes(1); // Still 1
  });

  it('fires pattern again after cooldown expires', () => {
    const shortCooldown: WorkflowPattern[] = [
      {
        ...DEFAULT_PATTERNS[0], // character-created
        cooldownMs: 1000,
      },
    ];
    observer = createAmbientObserver(bus, shortCooldown, onSuggestion);

    bus.emit(makeEvent('compose', 'open'));
    vi.advanceTimersByTime(8_100);
    expect(onSuggestion).toHaveBeenCalledTimes(1);
    observer.dismiss(suggestions[0].id);

    // Advance past cooldown
    vi.advanceTimersByTime(1_100);

    bus.emit(makeEvent('compose', 'open'));
    vi.advanceTimersByTime(8_100);
    expect(onSuggestion).toHaveBeenCalledTimes(2);
  });

  // --- Max active suggestions ---

  it('limits active suggestions to 2 at once', () => {
    const patterns: WorkflowPattern[] = [
      { ...DEFAULT_PATTERNS[0], id: 'pat-a', cooldownMs: 100 },
      { ...DEFAULT_PATTERNS[0], id: 'pat-b', cooldownMs: 100, trigger: { type: 'entity-created', entityType: 'close' } },
      { ...DEFAULT_PATTERNS[0], id: 'pat-c', cooldownMs: 100, trigger: { type: 'entity-created', entityType: 'swap' } },
    ];
    observer = createAmbientObserver(bus, patterns, onSuggestion);

    bus.emit(makeEvent('compose', 'open'));
    bus.emit(makeEvent('compose', 'close'));
    bus.emit(makeEvent('compose', 'swap'));
    vi.advanceTimersByTime(8_100);

    // Only 2 should fire
    expect(onSuggestion).toHaveBeenCalledTimes(2);
    expect(observer.getActiveSuggestions()).toHaveLength(2);
  });

  it('emits queued suggestion after dismiss', () => {
    const patterns: WorkflowPattern[] = [
      { ...DEFAULT_PATTERNS[0], id: 'pat-a', cooldownMs: 100 },
      { ...DEFAULT_PATTERNS[0], id: 'pat-b', cooldownMs: 100, trigger: { type: 'entity-created', entityType: 'close' } },
      { ...DEFAULT_PATTERNS[0], id: 'pat-c', cooldownMs: 100, trigger: { type: 'entity-created', entityType: 'swap' } },
    ];
    observer = createAmbientObserver(bus, patterns, onSuggestion);

    bus.emit(makeEvent('compose', 'open'));
    bus.emit(makeEvent('compose', 'close'));
    bus.emit(makeEvent('compose', 'swap'));
    vi.advanceTimersByTime(8_100);

    expect(onSuggestion).toHaveBeenCalledTimes(2);

    // Dismiss one -- queued suggestion should fire
    observer.dismiss(suggestions[0].id);
    expect(onSuggestion).toHaveBeenCalledTimes(3);
    expect(observer.getActiveSuggestions()).toHaveLength(2);
  });

  // --- Idle trigger ---

  it('fires idle suggestion when no events for afterMs', () => {
    const idlePattern: WorkflowPattern[] = [DEFAULT_PATTERNS[3]]; // idle-empty-workspace
    observer = createAmbientObserver(bus, idlePattern, onSuggestion, { getPanelCount: () => 1 });

    // No events -- idle timer should fire after 30s + 8s debounce
    vi.advanceTimersByTime(40_000);

    expect(onSuggestion).toHaveBeenCalledTimes(1);
    expect(suggestions[0].patternId).toBe('idle-empty-workspace');
  });

  it('resets idle timer when event occurs', () => {
    const idlePattern: WorkflowPattern[] = [DEFAULT_PATTERNS[3]];
    observer = createAmbientObserver(bus, idlePattern, onSuggestion, { getPanelCount: () => 1 });

    // Wait 20s then fire event to reset
    vi.advanceTimersByTime(20_000);
    bus.emit(makeEvent('compose', 'open'));

    // After another 20s (total 40s from event) -- still shouldn't fire yet
    vi.advanceTimersByTime(20_000);
    expect(onSuggestion).not.toHaveBeenCalled();

    // Wait the full afterMs from last event + debounce
    vi.advanceTimersByTime(20_000);
    expect(onSuggestion).toHaveBeenCalledTimes(1);
  });

  it('does not fire idle suggestion when condition fails', () => {
    const idlePattern: WorkflowPattern[] = [DEFAULT_PATTERNS[3]];
    // Panel count >= 2, condition should fail
    observer = createAmbientObserver(bus, idlePattern, onSuggestion, { getPanelCount: () => 5 });

    vi.advanceTimersByTime(40_000);
    expect(onSuggestion).not.toHaveBeenCalled();
  });

  // --- Sequence trigger ---

  it('fires sequence suggestion when matching events occur within window', () => {
    const seqPattern: WorkflowPattern[] = [DEFAULT_PATTERNS[2]]; // story-setup-complete
    observer = createAmbientObserver(bus, seqPattern, onSuggestion);

    // 3 compose intents within 60s
    bus.emit(makeEvent('compose', 'open', Date.now()));
    vi.advanceTimersByTime(5_000);
    bus.emit(makeEvent('compose', 'open', Date.now()));
    vi.advanceTimersByTime(5_000);
    bus.emit(makeEvent('compose', 'open', Date.now()));

    vi.advanceTimersByTime(8_100); // debounce
    expect(onSuggestion).toHaveBeenCalledTimes(1);
    expect(suggestions[0].patternId).toBe('story-setup-complete');
  });

  it('does not fire sequence if events are outside time window', () => {
    const seqPattern: WorkflowPattern[] = [
      {
        ...DEFAULT_PATTERNS[2],
        trigger: { type: 'sequence', events: [{ intentType: 'compose', action: 'open' }, { intentType: 'compose', action: 'open' }, { intentType: 'compose', action: 'open' }], withinMs: 10_000 },
      },
    ];
    observer = createAmbientObserver(bus, seqPattern, onSuggestion);

    bus.emit(makeEvent('compose', 'open', Date.now()));
    vi.advanceTimersByTime(6_000);
    bus.emit(makeEvent('compose', 'open', Date.now()));
    vi.advanceTimersByTime(6_000); // Now 12s since first event -- outside 10s window
    bus.emit(makeEvent('compose', 'open', Date.now()));

    vi.advanceTimersByTime(8_100);
    expect(onSuggestion).not.toHaveBeenCalled();
  });

  // --- dismiss + getActiveSuggestions ---

  it('dismiss removes suggestion from active list', () => {
    observer = createAmbientObserver(bus, DEFAULT_PATTERNS, onSuggestion);

    bus.emit(makeEvent('compose', 'open'));
    vi.advanceTimersByTime(8_100);

    expect(observer.getActiveSuggestions()).toHaveLength(1);
    observer.dismiss(suggestions[0].id);
    expect(observer.getActiveSuggestions()).toHaveLength(0);
  });

  // --- destroy ---

  it('destroy unsubscribes from bus and clears timers', () => {
    const idlePattern: WorkflowPattern[] = [DEFAULT_PATTERNS[3]];
    observer = createAmbientObserver(bus, idlePattern, onSuggestion, { getPanelCount: () => 1 });

    observer.destroy();

    vi.advanceTimersByTime(40_000);
    expect(onSuggestion).not.toHaveBeenCalled();
  });

  // --- DEFAULT_PATTERNS shape ---

  it('DEFAULT_PATTERNS contains 4 patterns with correct IDs', () => {
    expect(DEFAULT_PATTERNS).toHaveLength(4);
    expect(DEFAULT_PATTERNS.map((p) => p.id)).toEqual([
      'character-created',
      'scene-opened',
      'story-setup-complete',
      'idle-empty-workspace',
    ]);
  });
});
