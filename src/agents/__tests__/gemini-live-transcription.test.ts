import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiLiveClient } from '../GeminiLiveClient';

// ---------------------------------------------------------------------------
// Mock WebSocket
// ---------------------------------------------------------------------------

class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  readyState = MockWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn();
}

// Install global mock before tests
vi.stubGlobal('WebSocket', MockWebSocket);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLastMockWs(): MockWebSocket {
  // The GeminiLiveClient creates a WebSocket via `new WebSocket(url)`.
  // Since we stubbed global, we can access the mock instance via the constructor.
  // Instead, we directly trigger events on the client by connecting first.
  // We need to capture the instance -- we'll do it via the constructor spy.
  return lastWsInstance!;
}

let lastWsInstance: MockWebSocket | null = null;

// Intercept WebSocket construction to capture instance
vi.stubGlobal('WebSocket', class extends MockWebSocket {
  constructor(_url: string) {
    super();
    lastWsInstance = this;
  }
});

function connectClient(client: GeminiLiveClient): MockWebSocket {
  client.connect({ apiKey: 'test-key' }, {
    apiKey: 'test-key',
    systemInstruction: 'test',
    tools: [],
  });
  const ws = getLastMockWs();
  // Trigger onopen -> sendSetup
  ws.onopen?.();
  // Simulate setupComplete
  ws.onmessage?.({ data: JSON.stringify({ setupComplete: {} }) });
  return ws;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GeminiLiveClient inputTranscription', () => {
  let client: GeminiLiveClient;

  beforeEach(() => {
    lastWsInstance = null;
    client = new GeminiLiveClient();
  });

  it('emits inputTranscription text when server sends inputTranscription message', () => {
    const ws = connectClient(client);
    const handler = vi.fn();
    client.onInputTranscription(handler);

    // Simulate server sending inputTranscription
    ws.onmessage?.({
      data: JSON.stringify({
        inputTranscription: { text: 'hello' },
      }),
    });

    expect(handler).toHaveBeenCalledWith('hello');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('returns an unsubscribe function from onInputTranscription', () => {
    const ws = connectClient(client);
    const handler = vi.fn();
    const unsub = client.onInputTranscription(handler);

    // Should receive first message
    ws.onmessage?.({
      data: JSON.stringify({ inputTranscription: { text: 'first' } }),
    });
    expect(handler).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsub();

    // Should NOT receive second message
    ws.onmessage?.({
      data: JSON.stringify({ inputTranscription: { text: 'second' } }),
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('notifies multiple onInputTranscription handlers', () => {
    const ws = connectClient(client);
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    client.onInputTranscription(handler1);
    client.onInputTranscription(handler2);

    ws.onmessage?.({
      data: JSON.stringify({ inputTranscription: { text: 'multi' } }),
    });

    expect(handler1).toHaveBeenCalledWith('multi');
    expect(handler2).toHaveBeenCalledWith('multi');
  });

  it('does not throw when inputTranscription arrives with no handlers', () => {
    const ws = connectClient(client);

    // Should not throw
    expect(() => {
      ws.onmessage?.({
        data: JSON.stringify({ inputTranscription: { text: 'ignored' } }),
      });
    }).not.toThrow();
  });
});
