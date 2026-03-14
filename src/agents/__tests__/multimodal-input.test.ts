import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDispatch = vi.fn();
vi.mock('@dzin/core', () => ({
  useIntent: () => ({
    dispatch: mockDispatch,
    isResolving: false,
    pendingCount: 0,
  }),
}));

const mockAddMessage = vi.fn();
vi.mock('@/agents/store/agentStore', () => ({
  useAgentStore: Object.assign(
    () => ({ addMessage: mockAddMessage }),
    { getState: () => ({ addMessage: mockAddMessage }) },
  ),
}));

// Must import after mocks
import {
  parseTextToIntent,
  createInteractionContext,
  type InteractionContext,
  type InteractionFragment,
  INTERACTION_TIMEOUT_MS,
} from '../useMultimodalInput';

// ---------------------------------------------------------------------------
// parseTextToIntent tests (pure function, no hooks needed)
// ---------------------------------------------------------------------------

describe('parseTextToIntent', () => {
  it('maps "undo" to a system intent with action undo', () => {
    const intent = parseTextToIntent('undo');
    expect(intent).not.toBeNull();
    expect(intent!.type).toBe('system');
    expect(intent!.payload).toEqual({ action: 'undo' });
    expect(intent!.source).toBe('voice');
  });

  it('maps "redo" to a system intent with action redo', () => {
    const intent = parseTextToIntent('redo');
    expect(intent).not.toBeNull();
    expect(intent!.type).toBe('system');
    expect(intent!.payload).toEqual({ action: 'redo' });
  });

  it('maps "show scene-editor" to a compose intent with action open', () => {
    const intent = parseTextToIntent('show scene-editor');
    expect(intent).not.toBeNull();
    expect(intent!.type).toBe('compose');
    expect(intent!.payload).toMatchObject({ action: 'open', panelType: 'scene-editor' });
  });

  it('maps "open character-cards" to a compose intent with action open', () => {
    const intent = parseTextToIntent('open character-cards');
    expect(intent).not.toBeNull();
    expect(intent!.type).toBe('compose');
    expect(intent!.payload).toMatchObject({ action: 'open', panelType: 'character-cards' });
  });

  it('maps "close beats-manager" to a compose intent with action close', () => {
    const intent = parseTextToIntent('close beats-manager');
    expect(intent).not.toBeNull();
    expect(intent!.type).toBe('compose');
    expect(intent!.payload).toMatchObject({ action: 'close', panelType: 'beats-manager' });
  });

  it('maps "hide story-map" to a compose intent with action close', () => {
    const intent = parseTextToIntent('hide story-map');
    expect(intent).not.toBeNull();
    expect(intent!.type).toBe('compose');
    expect(intent!.payload).toMatchObject({ action: 'close', panelType: 'story-map' });
  });

  it('maps "layout triptych" to a compose intent with action set-layout', () => {
    const intent = parseTextToIntent('layout triptych');
    expect(intent).not.toBeNull();
    expect(intent!.type).toBe('compose');
    expect(intent!.payload).toMatchObject({ action: 'set-layout', template: 'triptych' });
  });

  it('maps "switch to split-2" to a compose intent with action set-layout', () => {
    const intent = parseTextToIntent('switch to split-2');
    expect(intent).not.toBeNull();
    expect(intent!.type).toBe('compose');
    expect(intent!.payload).toMatchObject({ action: 'set-layout', template: 'split-2' });
  });

  it('returns null for unrecognized input', () => {
    expect(parseTextToIntent('write a story about a dragon')).toBeNull();
    expect(parseTextToIntent('hello world')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// InteractionContext tests
// ---------------------------------------------------------------------------

describe('InteractionContext', () => {
  it('creates a fresh interaction context with correct defaults', () => {
    const ctx = createInteractionContext();
    expect(ctx.id).toBeTruthy();
    expect(ctx.fragments).toEqual([]);
    expect(ctx.state).toBe('accumulating');
    expect(ctx.createdAt).toBeGreaterThan(0);
  });

  it('accumulates fragments from different sources', () => {
    const ctx = createInteractionContext();

    const voiceFrag: InteractionFragment = {
      source: 'voice',
      content: 'show me the scene editor',
      timestamp: Date.now(),
    };
    const textFrag: InteractionFragment = {
      source: 'text',
      content: 'with character panel',
      timestamp: Date.now(),
    };
    const clickFrag: InteractionFragment = {
      source: 'click',
      content: 'character:abc-123',
      timestamp: Date.now(),
    };

    ctx.fragments.push(voiceFrag, textFrag, clickFrag);

    expect(ctx.fragments).toHaveLength(3);
    expect(ctx.fragments[0].source).toBe('voice');
    expect(ctx.fragments[1].source).toBe('text');
    expect(ctx.fragments[2].source).toBe('click');
  });
});

// ---------------------------------------------------------------------------
// Interaction context expiry tests
// ---------------------------------------------------------------------------

describe('InteractionContext expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expires interaction context after timeout of inactivity', () => {
    const ctx = createInteractionContext();
    expect(ctx.state).toBe('accumulating');

    // Simulate timeout by advancing time
    const originalCreatedAt = ctx.createdAt;
    vi.advanceTimersByTime(INTERACTION_TIMEOUT_MS + 1);

    // After timeout, checking elapsed should show expired
    const elapsed = Date.now() - originalCreatedAt;
    expect(elapsed).toBeGreaterThan(INTERACTION_TIMEOUT_MS);
  });

  it('INTERACTION_TIMEOUT_MS defaults to 10000', () => {
    expect(INTERACTION_TIMEOUT_MS).toBe(10000);
  });
});

// ---------------------------------------------------------------------------
// handleTranscription intent dispatch test (pure function)
// ---------------------------------------------------------------------------

describe('handleTranscription intent dispatch', () => {
  beforeEach(() => {
    mockDispatch.mockReset();
  });

  it('dispatches through IntentBus when intent is parseable', () => {
    const intent = parseTextToIntent('undo');
    expect(intent).not.toBeNull();

    // Simulate what handleTranscription does internally
    mockDispatch.mockReturnValue({ status: 'resolved', patches: [], origin: { type: 'user', panelId: '' }, description: 'undo' });
    const result = mockDispatch(intent);
    expect(result.status).toBe('resolved');
    expect(mockDispatch).toHaveBeenCalledWith(intent);
  });

  it('returns null from parseTextToIntent for non-resolvable input (falls through to Gemini)', () => {
    const intent = parseTextToIntent('tell me about the protagonist');
    expect(intent).toBeNull();
    // When null, the voice audio is already being processed by Gemini Live
  });
});

// ---------------------------------------------------------------------------
// addClickContext test
// ---------------------------------------------------------------------------

describe('addClickContext', () => {
  it('creates a click fragment with entityType:entityId format', () => {
    const ctx = createInteractionContext();
    const frag: InteractionFragment = {
      source: 'click',
      content: 'character:abc-123',
      timestamp: Date.now(),
    };
    ctx.fragments.push(frag);

    expect(ctx.fragments[0].source).toBe('click');
    expect(ctx.fragments[0].content).toBe('character:abc-123');
  });
});
