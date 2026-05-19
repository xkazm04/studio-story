// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useConnectionLifecycle,
  type ConnectionLifecycleConfig,
  type TokenData,
} from '../useConnectionLifecycle';

// ─── Mock Client ────────────────────────────────────────

interface MockClient {
  connected: boolean;
  stateHandler: ((state: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void) | null;
  readyHandler: (() => void) | null;
  connect: (opts: { token: string }) => void;
  disconnect: () => void;
}

function createMockClient(): MockClient {
  return {
    connected: false,
    stateHandler: null,
    readyHandler: null,
    connect(opts: { token: string }) {
      void opts;
      this.connected = true;
    },
    disconnect() {
      this.connected = false;
    },
  };
}

// ─── Default Config Factory ─────────────────────────────

let lastClient: MockClient | null = null;

function makeConfig(
  overrides: Partial<ConnectionLifecycleConfig<MockClient, string>> = {},
): ConnectionLifecycleConfig<MockClient, string> {
  return {
    fetchToken: vi.fn(async () => ({
      token: 'tok_test',
      expiresInMs: 30 * 60 * 1000,
    })) as (params: string) => Promise<TokenData>,

    createClient: vi.fn((params: string) => {
      void params;
      const client = createMockClient();
      lastClient = client;
      return client;
    }),

    connectClient: vi.fn((client: MockClient, token: string, params: string) => {
      void params;
      client.connect({ token });
      // Simulate async connection success
      setTimeout(() => client.stateHandler?.('connected'), 0);
    }),

    destroyClient: vi.fn((client: MockClient) => {
      client.disconnect();
    }),

    subscribeToState: vi.fn((client: MockClient, handler) => {
      client.stateHandler = handler;
    }),

    subscribeToReady: vi.fn((client: MockClient, handler) => {
      client.readyHandler = handler;
    }),

    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────

describe('useConnectionLifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    lastClient = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in disconnected state', () => {
    const config = makeConfig();
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.clientRef.current).toBeNull();
  });

  it('transitions disconnected → connecting → connected', async () => {
    const config = makeConfig();
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    // Initiate connection
    await act(async () => {
      await result.current.connect('test-params');
    });

    // After connect() resolves, state should be 'connecting' (client created, connectClient called,
    // but the mock stateHandler hasn't fired 'connected' yet until timer fires)
    // Actually, the mock connectClient schedules a setTimeout(0) which hasn't fired yet
    expect(config.fetchToken).toHaveBeenCalledWith('test-params');
    expect(config.createClient).toHaveBeenCalledWith('test-params');
    expect(config.connectClient).toHaveBeenCalled();

    // Fire the simulated 'connected' state change
    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.connectionState).toBe('connected');
  });

  it('fires onReadyRef callback when subscribeToReady fires', async () => {
    const config = makeConfig();
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    const onReady = vi.fn();
    result.current.onReadyRef.current = onReady;

    await act(async () => {
      await result.current.connect('voice');
    });

    // onReady should not have fired yet (subscribeToReady was provided)
    expect(onReady).not.toHaveBeenCalled();

    // Simulate ready signal from client
    await act(async () => {
      lastClient?.readyHandler?.();
    });

    expect(onReady).toHaveBeenCalledTimes(1);
    // onReadyRef should be auto-cleared
    expect(result.current.onReadyRef.current).toBeNull();
  });

  it('fires onReadyRef on connected state when no subscribeToReady', async () => {
    const config = makeConfig({ subscribeToReady: undefined });
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    const onReady = vi.fn();
    result.current.onReadyRef.current = onReady;

    await act(async () => {
      await result.current.connect('voice');
    });

    // Fire 'connected' state change
    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('disconnect transitions to disconnected and destroys client', async () => {
    const config = makeConfig();
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    await act(async () => {
      await result.current.connect('voice');
      vi.advanceTimersByTime(1);
    });

    expect(result.current.connectionState).toBe('connected');

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.connectionState).toBe('disconnected');
    expect(config.destroyClient).toHaveBeenCalled();
    expect(result.current.clientRef.current).toBeNull();
  });

  it('does not auto-reconnect after manual disconnect', async () => {
    const config = makeConfig();
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    await act(async () => {
      await result.current.connect('voice');
      vi.advanceTimersByTime(1);
    });

    // Manual disconnect
    act(() => {
      result.current.disconnect();
    });

    // fetchToken should have been called only once (for the initial connect)
    expect(config.fetchToken).toHaveBeenCalledTimes(1);
  });

  it('auto-reconnects on unexpected disconnect', async () => {
    const config = makeConfig();
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    await act(async () => {
      await result.current.connect('voice');
      vi.advanceTimersByTime(1);
    });

    expect(result.current.connectionState).toBe('connected');

    // Simulate unexpected disconnect from client
    const clientBeforeDisconnect = lastClient;
    await act(async () => {
      clientBeforeDisconnect?.stateHandler?.('disconnected');
    });

    // fetchToken should be called again for reconnect
    expect(config.fetchToken).toHaveBeenCalledTimes(2);
    expect(config.fetchToken).toHaveBeenLastCalledWith('voice');
  });

  it('idle timer triggers disconnect', async () => {
    const IDLE_MS = 5000;
    const config = makeConfig({ idleTimeoutMs: IDLE_MS });
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    await act(async () => {
      await result.current.connect('voice');
      vi.advanceTimersByTime(1);
    });

    expect(result.current.connectionState).toBe('connected');

    // Start idle timer
    act(() => {
      result.current.startIdleTimer();
    });

    // Advance time but not enough
    act(() => {
      vi.advanceTimersByTime(IDLE_MS - 1);
    });
    expect(result.current.connectionState).toBe('connected');

    // Advance past idle timeout
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(result.current.connectionState).toBe('disconnected');
    expect(config.destroyClient).toHaveBeenCalled();
  });

  it('resetIdleTimer prevents idle disconnect', async () => {
    const IDLE_MS = 5000;
    const config = makeConfig({ idleTimeoutMs: IDLE_MS });
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    await act(async () => {
      await result.current.connect('voice');
      vi.advanceTimersByTime(1);
    });

    // Start idle timer
    act(() => {
      result.current.startIdleTimer();
    });

    // Advance halfway
    act(() => {
      vi.advanceTimersByTime(IDLE_MS / 2);
    });

    // Reset idle timer (simulating activity)
    act(() => {
      result.current.resetIdleTimer();
    });

    // Advance past original timeout
    act(() => {
      vi.advanceTimersByTime(IDLE_MS);
    });

    // Should still be connected because idle was reset
    expect(result.current.connectionState).toBe('connected');
  });

  it('schedules token refresh before expiry', async () => {
    const config = makeConfig({
      fetchToken: vi.fn(async () => ({
        token: 'tok_test',
        expiresInMs: 10 * 60 * 1000, // 10 min
      })),
      tokenRefreshBufferMs: 2 * 60 * 1000, // 2 min buffer
    });
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    await act(async () => {
      await result.current.connect('voice');
    });

    // Initial fetchToken call
    expect(config.fetchToken).toHaveBeenCalledTimes(1);

    // Advance to just before refresh time (10min - 2min buffer = 8min)
    await act(async () => {
      vi.advanceTimersByTime(8 * 60 * 1000 - 100);
    });
    expect(config.fetchToken).toHaveBeenCalledTimes(1);

    // Advance past refresh time
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(config.fetchToken).toHaveBeenCalledTimes(2);
  });

  it('ignores connect when already connected', async () => {
    const config = makeConfig();
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    await act(async () => {
      await result.current.connect('voice');
      vi.advanceTimersByTime(1);
    });

    // Try connecting again
    await act(async () => {
      await result.current.connect('voice2');
    });

    // Should only have been called once
    expect(config.createClient).toHaveBeenCalledTimes(1);
  });

  it('cleans up on unmount', async () => {
    const config = makeConfig();
    const { result, unmount } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    await act(async () => {
      await result.current.connect('voice');
      vi.advanceTimersByTime(1);
    });

    unmount();

    expect(config.destroyClient).toHaveBeenCalled();
  });

  it('propagates fetchToken errors', async () => {
    const config = makeConfig({
      fetchToken: vi.fn(async () => {
        throw new Error('Token fetch failed');
      }),
    });
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    await expect(
      act(async () => {
        await result.current.connect('voice');
      }),
    ).rejects.toThrow('Token fetch failed');

    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.clientRef.current).toBeNull();
  });

  it('connectionStateRef always reflects current state', async () => {
    const config = makeConfig();
    const { result } = renderHook(() => useConnectionLifecycle<MockClient, string>(config));

    expect(result.current.connectionStateRef.current).toBe('disconnected');

    await act(async () => {
      await result.current.connect('voice');
      vi.advanceTimersByTime(1);
    });

    expect(result.current.connectionStateRef.current).toBe('connected');

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.connectionStateRef.current).toBe('disconnected');
  });
});
