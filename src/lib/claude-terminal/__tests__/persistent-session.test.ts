/**
 * Tests for PersistentSession — persistent CLI session manager
 * that reuses session IDs via --resume and survives HMR via globalThis.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EventEmitter } from 'events';

// ---------------------------------------------------------------------------
// Mock cli-service BEFORE importing the module under test
// ---------------------------------------------------------------------------

const mockStartExecution = vi.fn<
  (
    projectPath: string,
    prompt: string,
    resumeSessionId?: string,
    onEvent?: (event: { type: string; data: Record<string, unknown>; timestamp: number }) => void,
  ) => string
>();

const mockGetExecution = vi.fn();
const mockAbortExecution = vi.fn();

vi.mock('../cli-service', () => ({
  startExecution: (...args: unknown[]) => mockStartExecution(...args as Parameters<typeof mockStartExecution>),
  getExecution: (...args: unknown[]) => mockGetExecution(...args as Parameters<typeof mockGetExecution>),
  abortExecution: (...args: unknown[]) => mockAbortExecution(...args as Parameters<typeof mockAbortExecution>),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import {
  createPersistentSession,
  getOrCreateSession,
  type PersistentSession,
  type CLIResponse,
} from '../persistent-session';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate CLI events firing on the execution's emitter */
function simulateCLIEvents(
  events: Array<{ type: string; data: Record<string, unknown> }>,
) {
  // mockStartExecution will call onEvent for each event
  mockStartExecution.mockImplementation(
    (_projectPath, _prompt, _resumeSessionId, onEvent) => {
      const execId = `exec-${Date.now()}`;
      // Fire events asynchronously to let promise resolve
      setTimeout(() => {
        for (const ev of events) {
          onEvent?.({ type: ev.type, data: ev.data, timestamp: Date.now() });
        }
      }, 5);

      mockGetExecution.mockReturnValue({
        id: execId,
        status: 'completed',
        sessionId: events.find(e => e.type === 'init')?.data?.sessionId,
        events: [],
        emitter: { on: vi.fn(), off: vi.fn() } as unknown as EventEmitter,
      });

      return execId;
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PersistentSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear globalThis session between tests
    const g = globalThis as unknown as { __dzinPersistentSession: unknown };
    delete g.__dzinPersistentSession;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPersistentSession', () => {
    it('returns object with correct interface shape', () => {
      const session = createPersistentSession('/project');
      expect(session).toHaveProperty('sessionId', null);
      expect(session).toHaveProperty('status', 'idle');
      expect(typeof session.send).toBe('function');
      expect(typeof session.restart).toBe('function');
      expect(typeof session.destroy).toBe('function');
    });

    it('first send() starts a CLI execution and captures sessionId from init event', async () => {
      simulateCLIEvents([
        { type: 'init', data: { sessionId: 'sess-abc-123' } },
        { type: 'text', data: { content: 'Hello world' } },
        { type: 'result', data: { sessionId: 'sess-abc-123', isError: false } },
      ]);

      const session = createPersistentSession('/project');
      const response = await session.send('test prompt');

      expect(mockStartExecution).toHaveBeenCalledWith(
        '/project',
        'test prompt',
        undefined, // no resume on first call
        expect.any(Function),
      );
      expect(session.sessionId).toBe('sess-abc-123');
      expect(response.text).toBe('Hello world');
    });

    it('subsequent send() calls reuse sessionId via --resume flag', async () => {
      simulateCLIEvents([
        { type: 'init', data: { sessionId: 'sess-abc-123' } },
        { type: 'text', data: { content: 'Response 1' } },
        { type: 'result', data: { sessionId: 'sess-abc-123', isError: false } },
      ]);

      const session = createPersistentSession('/project');
      await session.send('first prompt');

      // Now send again — should resume
      simulateCLIEvents([
        { type: 'text', data: { content: 'Response 2' } },
        { type: 'result', data: { sessionId: 'sess-abc-123', isError: false } },
      ]);

      await session.send('second prompt');

      expect(mockStartExecution).toHaveBeenLastCalledWith(
        '/project',
        'second prompt',
        'sess-abc-123', // resume flag
        expect.any(Function),
      );
    });

    it('send() returns CLIResponse with text and toolResults', async () => {
      simulateCLIEvents([
        { type: 'init', data: { sessionId: 'sess-1' } },
        { type: 'text', data: { content: 'Analyzed the code.' } },
        { type: 'tool_use', data: { id: 't1', name: 'compose_workspace', input: { layout: 'split-2' } } },
        { type: 'tool_result', data: { toolUseId: 't1', content: '{"ok":true}' } },
        { type: 'result', data: { sessionId: 'sess-1', isError: false } },
      ]);

      const session = createPersistentSession('/project');
      const response = await session.send('do something');

      expect(response.text).toBe('Analyzed the code.');
      expect(response.toolResults).toHaveLength(1);
      expect(response.toolResults![0].name).toBe('compose_workspace');
    });

    it('after 3 consecutive errors, status becomes disconnected', async () => {
      // Set up error-producing execution
      const makeError = () => {
        simulateCLIEvents([
          { type: 'error', data: { message: 'CLI not found' } },
        ]);
      };

      const session = createPersistentSession('/project');

      makeError();
      await session.send('prompt 1').catch(() => {});
      expect(session.status).toBe('error');

      makeError();
      await session.send('prompt 2').catch(() => {});

      makeError();
      await session.send('prompt 3').catch(() => {});
      expect(session.status).toBe('disconnected');
    });

    it('restart() destroys current and creates fresh session', async () => {
      simulateCLIEvents([
        { type: 'init', data: { sessionId: 'sess-old' } },
        { type: 'result', data: { sessionId: 'sess-old', isError: false } },
      ]);

      const session = createPersistentSession('/project');
      await session.send('prompt');
      expect(session.sessionId).toBe('sess-old');

      await session.restart();
      expect(session.sessionId).toBe(null);
      expect(session.status).toBe('idle');
    });

    it('destroy() resets session to idle', () => {
      const session = createPersistentSession('/project');
      session.destroy();
      expect(session.status).toBe('idle');
      expect(session.sessionId).toBe(null);
    });
  });

  describe('getOrCreateSession', () => {
    it('returns existing session if status is not disconnected', () => {
      const s1 = getOrCreateSession('/project');
      const s2 = getOrCreateSession('/project');
      expect(s1).toBe(s2);
    });

    it('uses globalThis to survive HMR', () => {
      const s1 = getOrCreateSession('/project');
      const g = globalThis as unknown as { __dzinPersistentSession: PersistentSession };
      expect(g.__dzinPersistentSession).toBe(s1);
    });

    it('creates new session if current is disconnected', async () => {
      // Make a session and force it to disconnected
      const s1 = getOrCreateSession('/project');

      // Simulate 3 errors to disconnect
      const makeError = () => {
        simulateCLIEvents([
          { type: 'error', data: { message: 'fail' } },
        ]);
      };
      makeError();
      await s1.send('1').catch(() => {});
      makeError();
      await s1.send('2').catch(() => {});
      makeError();
      await s1.send('3').catch(() => {});

      expect(s1.status).toBe('disconnected');

      const s2 = getOrCreateSession('/project');
      expect(s2).not.toBe(s1);
      expect(s2.status).toBe('idle');
    });
  });
});
