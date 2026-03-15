/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Hoisted mocks (Vitest 4 pattern -- vi.hoisted runs before vi.mock)
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => {
  const mockBus = {
    dispatch: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    getSnapshot: vi.fn(() => '{"pending":0,"lastEvent":null}'),
  };

  const mockStateEngine = {
    getState: vi.fn(() => ({ layout: { template: 'single' }, panels: [], streaming: null })),
    dispatch: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    getSnapshot: vi.fn(() => '{}'),
    undo: vi.fn(),
    redo: vi.fn(),
  };

  const mockQueue = {
    startBuffering: vi.fn(),
    drain: vi.fn(),
    isBuffering: vi.fn(() => false),
  };

  const mockTransport = {
    processIntent: vi.fn(),
    getStatus: vi.fn(() => 'idle' as const),
    subscribe: vi.fn(() => vi.fn()),
    getSnapshot: vi.fn(() => JSON.stringify({ status: 'idle' })),
    destroy: vi.fn(),
  };

  return {
    mockBus,
    mockStateEngine,
    mockQueue,
    mockTransport,
    createDirector: vi.fn(() => ({ resolve: vi.fn() })),
    createIntentBus: vi.fn(() => mockBus),
    createStateEngine: vi.fn(() => mockStateEngine),
    createIntentQueue: vi.fn(() => mockQueue),
    createComposeHandler: vi.fn(() => vi.fn()),
    createManipulateHandler: vi.fn(() => vi.fn()),
    createNavigateHandler: vi.fn(() => vi.fn()),
    createSystemHandler: vi.fn(() => vi.fn()),
    createLLMTransport: vi.fn(() => mockTransport),
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@dzin/core', () => ({
  createDirector: mocks.createDirector,
  createIntentBus: mocks.createIntentBus,
  createStateEngine: mocks.createStateEngine,
  createIntentQueue: mocks.createIntentQueue,
  createComposeHandler: mocks.createComposeHandler,
  createManipulateHandler: mocks.createManipulateHandler,
  createNavigateHandler: mocks.createNavigateHandler,
  createSystemHandler: mocks.createSystemHandler,
  createLLMTransport: mocks.createLLMTransport,
}));

vi.mock('@/workspace/engine/panelRegistry', () => ({
  PANEL_REGISTRY: {},
}));

vi.mock('@/workspace/config/workflowHints', () => ({
  TOOL_PANEL_HINTS: [],
}));

vi.mock('@/workspace/store/workspaceStore', () => ({
  useWorkspaceStore: {
    getState: vi.fn(() => ({
      panels: [
        { id: 'p1', type: 'scene-editor', role: 'primary', density: 'full' },
      ],
      layout: 'single',
      focusedPanelId: 'p1',
    })),
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// Import the hook under test
// ---------------------------------------------------------------------------

import { useIntentDispatch } from '../useIntentDispatch';
import type { IntentEvent, Intent, IntentResult, LLMTransport } from '@dzin/core';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useIntentDispatch - LLM transport wiring', () => {
  let busSubscriber: ((event: IntentEvent) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    busSubscriber = null;

    // Capture the subscriber function passed to bus.subscribe
    mocks.mockBus.subscribe.mockImplementation((listener: (event: IntentEvent) => void) => {
      busSubscriber = listener;
      return vi.fn();
    });

    // Default fetch mock returning resolved response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        status: 'resolved',
        patches: [{ op: 'add', path: '/panels/-', value: { type: 'test' } }],
        description: 'Added test panel',
      }),
    });
  });

  // -------------------------------------------------------------------------
  // Test 1: NEEDS_LLM event triggers transport.processIntent
  // -------------------------------------------------------------------------

  it('calls transport.processIntent when bus emits needs-llm event', async () => {
    const { result } = renderHook(() => useIntentDispatch());

    const intent: Intent = {
      id: 'test-1',
      type: 'compose',
      payload: { action: 'open', panelType: 'scene-editor' },
      source: 'llm',
      timestamp: Date.now(),
    };

    const event: IntentEvent = {
      intent,
      result: { status: 'needs-llm', intent } as IntentResult,
      timestamp: Date.now(),
    };

    // Transport should return resolved
    mocks.mockTransport.processIntent.mockResolvedValue({
      status: 'resolved',
      patches: [{ op: 'add', path: '/panels/-', value: { type: 'test' } }],
      origin: 'llm',
      description: 'Test description',
    });

    // Emit needs-llm event through bus subscriber
    expect(busSubscriber).not.toBeNull();
    await act(async () => {
      busSubscriber!(event);
      // Let microtask queue flush
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mocks.createLLMTransport).toHaveBeenCalledTimes(1);
    expect(mocks.mockTransport.processIntent).toHaveBeenCalledWith(
      intent,
      expect.objectContaining({
        panels: expect.any(Array),
        layout: expect.any(String),
        viewport: expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Test 2: sendToLLM POSTs to /api/claude-terminal/intent
  // -------------------------------------------------------------------------

  it('sendToLLM callback POSTs to /api/claude-terminal/intent', async () => {
    renderHook(() => useIntentDispatch());

    const intent: Intent = {
      id: 'test-2',
      type: 'query',
      payload: { action: 'suggest', query: 'test' },
      source: 'keyboard',
      timestamp: Date.now(),
    };

    const event: IntentEvent = {
      intent,
      result: { status: 'needs-llm', intent } as IntentResult,
      timestamp: Date.now(),
    };

    // Make transport.processIntent call the real sendToLLM via the config
    mocks.createLLMTransport.mockImplementation((config: { sendToLLM: (ctx: string) => Promise<unknown> }) => {
      // When processIntent is called, call sendToLLM
      const transport = {
        ...mocks.mockTransport,
        processIntent: vi.fn(async () => {
          await config.sendToLLM('test context');
          return { status: 'resolved' as const, patches: [], origin: 'llm' as const, description: '' };
        }),
      };
      return transport;
    });

    // Re-render to pick up mock change
    const { result } = renderHook(() => useIntentDispatch());

    await act(async () => {
      busSubscriber!(event);
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/claude-terminal/intent',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: expect.stringContaining('test context'),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Test 3: Resolved patches create suggestion with patternId '__llm_response__'
  // -------------------------------------------------------------------------

  it('creates suggestion with patternId __llm_response__ on resolved patches', async () => {
    mocks.mockTransport.processIntent.mockResolvedValue({
      status: 'resolved',
      patches: [{ op: 'add', path: '/panels/-', value: { type: 'new-panel' } }],
      origin: 'llm',
      description: 'LLM suggested a panel',
    });

    const { result } = renderHook(() => useIntentDispatch());

    // Wire the addSuggestion callback
    const addSuggestionSpy = vi.fn();
    result.current.setAddSuggestion(addSuggestionSpy);

    const intent: Intent = {
      id: 'test-3',
      type: 'compose',
      payload: { action: 'open', panelType: 'test' },
      source: 'llm',
      timestamp: Date.now(),
    };

    const event: IntentEvent = {
      intent,
      result: { status: 'needs-llm', intent } as IntentResult,
      timestamp: Date.now(),
    };

    await act(async () => {
      busSubscriber!(event);
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(addSuggestionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        patternId: '__llm_response__',
        text: 'LLM suggested a panel',
      }),
    );
  });

  // -------------------------------------------------------------------------
  // Test 4: Transport is lazy -- not created until first NEEDS_LLM
  // -------------------------------------------------------------------------

  it('does not create transport until first NEEDS_LLM event', () => {
    renderHook(() => useIntentDispatch());

    // After hook initialization, transport should NOT have been created
    expect(mocks.createLLMTransport).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Test 5: useSuggestionState returns expected shape
  // -------------------------------------------------------------------------

  it('useIntentDispatch returns getTransport and setAddSuggestion', () => {
    const { result } = renderHook(() => useIntentDispatch());

    expect(result.current).toHaveProperty('bus');
    expect(result.current).toHaveProperty('queue');
    expect(result.current).toHaveProperty('stateEngine');
    expect(result.current).toHaveProperty('getTransport');
    expect(result.current).toHaveProperty('setAddSuggestion');
    expect(typeof result.current.getTransport).toBe('function');
    expect(typeof result.current.setAddSuggestion).toBe('function');
    expect(result.current.getTransport()).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Test 6: Error result does NOT create suggestion
  // -------------------------------------------------------------------------

  it('does not create suggestion when transport returns error', async () => {
    mocks.mockTransport.processIntent.mockResolvedValue({
      status: 'error',
      error: 'Something went wrong',
    });

    const { result } = renderHook(() => useIntentDispatch());

    const addSuggestionSpy = vi.fn();
    result.current.setAddSuggestion(addSuggestionSpy);

    const intent: Intent = {
      id: 'test-6',
      type: 'compose',
      payload: { action: 'open', panelType: 'test' },
      source: 'llm',
      timestamp: Date.now(),
    };

    const event: IntentEvent = {
      intent,
      result: { status: 'needs-llm', intent } as IntentResult,
      timestamp: Date.now(),
    };

    await act(async () => {
      busSubscriber!(event);
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(addSuggestionSpy).not.toHaveBeenCalled();
  });
});
