import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAgentStore, STREAMING_MESSAGE_ID } from '../agentStore';
import type { AgentSuggestion } from '../../types';

// Reset store between tests
beforeEach(() => {
  vi.useFakeTimers();
  useAgentStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. recordToolEvent — 800ms debounce batching
// ---------------------------------------------------------------------------
describe('recordToolEvent batching', () => {
  it('does nothing when disconnected', () => {
    const sender = vi.fn();
    const { setEventSender, recordToolEvent } = useAgentStore.getState();
    setEventSender(sender);
    // connectionState defaults to 'disconnected'
    recordToolEvent('get_character', { characterId: '1' });
    vi.advanceTimersByTime(1000);
    expect(sender).not.toHaveBeenCalled();
  });

  it('does nothing when no sender is registered', () => {
    const { setConnectionState, recordToolEvent } = useAgentStore.getState();
    setConnectionState('connected');
    recordToolEvent('get_character', { characterId: '1' });
    vi.advanceTimersByTime(1000);
    // No crash, no sender called
    expect(useAgentStore.getState()._pendingEvents).toHaveLength(0);
  });

  it('flushes a single event after 800ms', () => {
    const sender = vi.fn();
    const store = useAgentStore.getState();
    store.setConnectionState('connected');
    store.setEventSender(sender);

    useAgentStore.getState().recordToolEvent('get_character', { characterId: 'c1' });

    // Not yet flushed at 799ms
    vi.advanceTimersByTime(799);
    expect(sender).not.toHaveBeenCalled();

    // Flushed at 800ms
    vi.advanceTimersByTime(1);
    expect(sender).toHaveBeenCalledOnce();
    expect(sender).toHaveBeenCalledWith([
      { toolName: 'get_character', summary: 'character=c1' },
    ]);
    expect(useAgentStore.getState()._pendingEvents).toHaveLength(0);
  });

  it('batches multiple rapid events into one flush', () => {
    const sender = vi.fn();
    const store = useAgentStore.getState();
    store.setConnectionState('connected');
    store.setEventSender(sender);

    useAgentStore.getState().recordToolEvent('get_character', { characterId: 'c1' });
    vi.advanceTimersByTime(200);
    useAgentStore.getState().recordToolEvent('get_scene', { sceneId: 's1' });
    vi.advanceTimersByTime(200);
    useAgentStore.getState().recordToolEvent('update_character', { name: 'Alice' });

    // The debounce resets on each call — flush 800ms after LAST event
    vi.advanceTimersByTime(800);
    expect(sender).toHaveBeenCalledOnce();
    expect(sender.mock.calls[0][0]).toHaveLength(3);
  });

  it('clears pending events on reset', () => {
    const sender = vi.fn();
    const store = useAgentStore.getState();
    store.setConnectionState('connected');
    store.setEventSender(sender);

    useAgentStore.getState().recordToolEvent('get_character', { characterId: 'c1' });
    expect(useAgentStore.getState()._pendingEvents).toHaveLength(1);

    useAgentStore.getState().reset();
    vi.advanceTimersByTime(1000);

    expect(sender).not.toHaveBeenCalled();
    expect(useAgentStore.getState()._pendingEvents).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Streaming message lifecycle
// ---------------------------------------------------------------------------
describe('streaming message lifecycle', () => {
  it('creates a streaming message on first updateStreamingMessage call', () => {
    useAgentStore.getState().updateStreamingMessage('Hello');
    const msgs = useAgentStore.getState().messages;

    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe(STREAMING_MESSAGE_ID);
    expect(msgs[0].content).toBe('Hello');
    expect(msgs[0].role).toBe('agent');
    expect(msgs[0].isStreaming).toBe(true);
  });

  it('updates existing streaming message content in-place', () => {
    const { updateStreamingMessage } = useAgentStore.getState();
    updateStreamingMessage('Hello');
    useAgentStore.getState().updateStreamingMessage('Hello world');

    const msgs = useAgentStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('Hello world');
  });

  it('does not clobber non-streaming messages', () => {
    const { addMessage, updateStreamingMessage } = useAgentStore.getState();
    addMessage({ id: 'user-1', role: 'user', content: 'Hi', timestamp: 1 });
    updateStreamingMessage('Thinking...');

    const msgs = useAgentStore.getState().messages;
    expect(msgs).toHaveLength(2);
    expect(msgs[0].id).toBe('user-1');
    expect(msgs[1].id).toBe(STREAMING_MESSAGE_ID);
  });

  it('finalizeStreamingMessage replaces streaming message with a permanent one', () => {
    useAgentStore.getState().updateStreamingMessage('draft');
    useAgentStore.getState().finalizeStreamingMessage('Final answer');

    const msgs = useAgentStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).not.toBe(STREAMING_MESSAGE_ID);
    expect(msgs[0].id).toMatch(/^msg-/);
    expect(msgs[0].content).toBe('Final answer');
    expect(msgs[0].isStreaming).toBeUndefined();
  });

  it('finalizeStreamingMessage works even without a prior streaming message', () => {
    useAgentStore.getState().finalizeStreamingMessage('Direct finalize');

    const msgs = useAgentStore.getState().messages;
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('Direct finalize');
    expect(msgs[0].id).toMatch(/^msg-/);
  });

  it('preserves other messages when finalizing', () => {
    const store = useAgentStore.getState();
    store.addMessage({ id: 'user-1', role: 'user', content: 'Hi', timestamp: 1 });
    store.addMessage({ id: 'agent-1', role: 'agent', content: 'Hey', timestamp: 2 });
    useAgentStore.getState().updateStreamingMessage('streaming...');
    useAgentStore.getState().finalizeStreamingMessage('Done');

    const msgs = useAgentStore.getState().messages;
    expect(msgs).toHaveLength(3);
    expect(msgs[0].id).toBe('user-1');
    expect(msgs[1].id).toBe('agent-1');
    expect(msgs[2].content).toBe('Done');
  });
});

// ---------------------------------------------------------------------------
// 3. Suggestion add/dismiss cycle with 10-item cap
// ---------------------------------------------------------------------------
describe('suggestion management', () => {
  function makeSuggestion(id: string): AgentSuggestion {
    return { id, content: `Suggestion ${id}`, timestamp: Date.now(), dismissed: false };
  }

  it('adds a suggestion', () => {
    useAgentStore.getState().addSuggestion(makeSuggestion('s1'));
    expect(useAgentStore.getState().suggestions).toHaveLength(1);
  });

  it('prepends new suggestions (newest first)', () => {
    const store = useAgentStore.getState();
    store.addSuggestion(makeSuggestion('s1'));
    useAgentStore.getState().addSuggestion(makeSuggestion('s2'));

    const suggestions = useAgentStore.getState().suggestions;
    expect(suggestions[0].id).toBe('s2');
    expect(suggestions[1].id).toBe('s1');
  });

  it('caps suggestions at 10 items', () => {
    for (let i = 0; i < 12; i++) {
      useAgentStore.getState().addSuggestion(makeSuggestion(`s${i}`));
    }
    expect(useAgentStore.getState().suggestions).toHaveLength(10);
    // The newest should be first, oldest dropped
    expect(useAgentStore.getState().suggestions[0].id).toBe('s11');
  });

  it('dismisses a suggestion by id without removing it', () => {
    const store = useAgentStore.getState();
    store.addSuggestion(makeSuggestion('s1'));
    store.addSuggestion(makeSuggestion('s2'));

    useAgentStore.getState().dismissSuggestion('s1');

    const suggestions = useAgentStore.getState().suggestions;
    expect(suggestions).toHaveLength(2);
    const s1 = suggestions.find(s => s.id === 's1');
    expect(s1?.dismissed).toBe(true);
    const s2 = suggestions.find(s => s.id === 's2');
    expect(s2?.dismissed).toBe(false);
  });

  it('clearSuggestions removes all', () => {
    for (let i = 0; i < 5; i++) {
      useAgentStore.getState().addSuggestion(makeSuggestion(`s${i}`));
    }
    useAgentStore.getState().clearSuggestions();
    expect(useAgentStore.getState().suggestions).toHaveLength(0);
  });
});
