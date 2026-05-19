import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { TOOL_NAMES } from '@/agents/types';

// ─── Hoisted Mocks ─────────────────────────────

const { mockGenerateContent, mockStartExecution, mockGetActiveExecutions, mockGetExecution, mockAbortExecution } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
  mockStartExecution: vi.fn(),
  mockGetActiveExecutions: vi.fn(),
  mockGetExecution: vi.fn(),
  mockAbortExecution: vi.fn(),
}));

// ─── Module Mocks ───────────────────────────────

vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = { generateContent: mockGenerateContent };
  },
}));

vi.mock('@/lib/claude-terminal/cli-service', () => ({
  startExecution: mockStartExecution,
  getActiveExecutions: mockGetActiveExecutions,
  getExecution: mockGetExecution,
  abortExecution: mockAbortExecution,
}));

// Stub the system instruction and tool schema modules (their internals
// are tested elsewhere; we just need them to not throw)
vi.mock('@/agents/advisorToolSchema', () => ({
  CANONICAL_ADVISOR_TOOLS: [],
  toGeminiSDKDeclarations: () => [],
  toSystemInstructionToolDocs: () => '## Tool Quick Reference',
}));

vi.mock('@/agents/advisorSystemInstruction', () => ({
  buildHttpSystemInstruction: () => 'SYSTEM_INSTRUCTION',
}));

// ─── Import Route Under Test ────────────────────

import { POST, GET } from '../route';

// ─── Helpers ────────────────────────────────────

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/agents/advisor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function minimalBody(overrides: Partial<{
  workspace: Record<string, unknown>;
  userMessage: string;
  toolEvents: Array<{ toolName: string; summary: string }>;
  history: Array<{ role: string; text: string }>;
  memorySummary: string;
}> = {}) {
  return {
    workspace: {
      panels: [{ type: 'scene-editor', role: 'primary' }],
      layout: 'single',
    },
    userMessage: 'Hello advisor',
    ...overrides,
  };
}

/**
 * Read all SSE events from a streaming response.
 * Each line is a JSON object terminated by newline.
 */
async function consumeSSE(response: Response): Promise<Array<Record<string, unknown>>> {
  const text = await response.text();
  return text
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line));
}

/** Build a Gemini-style response with text parts */
function geminiTextResponse(text: string) {
  return {
    candidates: [{
      content: {
        parts: [{ text }],
      },
    }],
  };
}

/** Build a Gemini-style response with a function call */
function geminiFunctionCallResponse(name: string, args: Record<string, unknown>) {
  return {
    candidates: [{
      content: {
        parts: [{ functionCall: { name, args } }],
      },
    }],
  };
}

/** Build a Gemini-style response with text + function call */
function geminiMixedResponse(text: string, name: string, args: Record<string, unknown>) {
  return {
    candidates: [{
      content: {
        parts: [
          { text },
          { functionCall: { name, args } },
        ],
      },
    }],
  };
}

// ─── Test Suite ─────────────────────────────────

describe('POST /api/agents/advisor', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    mockGetActiveExecutions.mockReturnValue([]);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ── Basic SSE Streaming ──

  describe('SSE event ordering', () => {
    it('emits status → text → done for a simple text response', async () => {
      mockGenerateContent.mockResolvedValueOnce(geminiTextResponse('Here is my advice.'));

      const res = await POST(makeRequest(minimalBody()));
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('text/event-stream');

      const events = await consumeSSE(res);
      expect(events.length).toBeGreaterThanOrEqual(3);

      // First event: status
      expect(events[0]).toMatchObject({ type: 'status', turn: 1 });
      // Second event: text
      expect(events[1]).toMatchObject({ type: 'text', text: 'Here is my advice.', turn: 1 });
      // Last event: done
      expect(events[events.length - 1]).toMatchObject({ type: 'done' });
    });

    it('emits done even when Gemini returns empty candidates', async () => {
      mockGenerateContent.mockResolvedValueOnce({ candidates: [] });

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      const types = events.map(e => e.type);
      expect(types).toContain('status');
      expect(types[types.length - 1]).toBe('done');
    });

    it('emits done when candidate has no parts', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        candidates: [{ content: {} }],
      });

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);
      expect(events[events.length - 1]).toMatchObject({ type: 'done' });
    });
  });

  // ── Client-side Tool Passthrough ──

  describe('client-side tool passthrough', () => {
    it('passes compose_workspace tool call to the client as SSE', async () => {
      const composeArgs = {
        action: 'replace',
        panels: '[{"type":"scene-editor","role":"primary"}]',
        layout: 'single',
      };
      mockGenerateContent.mockResolvedValueOnce(
        geminiFunctionCallResponse(TOOL_NAMES.COMPOSE_WORKSPACE, composeArgs),
      );

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      const toolEvent = events.find(e => e.type === 'tool_call');
      expect(toolEvent).toBeDefined();
      expect(toolEvent!.toolCall).toMatchObject({
        name: TOOL_NAMES.COMPOSE_WORKSPACE,
        args: composeArgs,
      });
      // Client-side tool calls should not trigger another Gemini turn
      expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('passes suggest_action tool call to the client as SSE', async () => {
      const suggestArgs = { content: 'Try adding a character panel.' };
      mockGenerateContent.mockResolvedValueOnce(
        geminiFunctionCallResponse(TOOL_NAMES.SUGGEST_ACTION, suggestArgs),
      );

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      const toolEvent = events.find(e => e.type === 'tool_call');
      expect(toolEvent).toBeDefined();
      expect(toolEvent!.toolCall).toMatchObject({
        name: TOOL_NAMES.SUGGEST_ACTION,
        args: suggestArgs,
      });
    });

    it('emits text and client-side tool from mixed response', async () => {
      mockGenerateContent.mockResolvedValueOnce(
        geminiMixedResponse(
          'Setting up your workspace.',
          TOOL_NAMES.COMPOSE_WORKSPACE,
          { action: 'replace', panels: '[]' },
        ),
      );

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      expect(events.find(e => e.type === 'text')).toBeDefined();
      expect(events.find(e => e.type === 'tool_call')).toBeDefined();
    });
  });

  // ── Server-side Tool Execution & Multi-turn ──

  describe('server-side tool execution', () => {
    it('executes create_cli_session and feeds result back to Gemini', async () => {
      mockStartExecution.mockReturnValue('exec-123');
      mockGetExecution.mockReturnValue({ id: 'exec-123', sessionId: 'sess-abc' });

      // Turn 1: Gemini calls create_cli_session
      mockGenerateContent.mockResolvedValueOnce(
        geminiFunctionCallResponse(TOOL_NAMES.CREATE_CLI_SESSION, {
          prompt: 'Write scene 1',
          domain: 'scene',
        }),
      );
      // Turn 2: Gemini responds with text after seeing tool result
      mockGenerateContent.mockResolvedValueOnce(
        geminiTextResponse('I have started a CLI session to write scene 1.'),
      );

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      // Should have called generateContent twice (multi-turn)
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);

      // Should have called startExecution with the prompt
      expect(mockStartExecution).toHaveBeenCalledWith(
        expect.any(String), // projectPath (process.cwd())
        'Write scene 1',
        undefined, // no resume
        undefined, // no onEvent
        undefined, // projectId (not set in test env)
        'http://localhost:3000', // requestOrigin
      );

      // Should emit _session_spawned pseudo-tool to client
      const sessionSpawned = events.find(
        e => e.type === 'tool_call' && (e.toolCall as Record<string, unknown>)?.name === TOOL_NAMES.SESSION_SPAWNED,
      );
      expect(sessionSpawned).toBeDefined();
      const spawnedArgs = (sessionSpawned!.toolCall as Record<string, unknown>)?.args as Record<string, unknown>;
      expect(spawnedArgs?.executionId).toBe('exec-123');
      expect(spawnedArgs?.sessionId).toBe('sess-abc');
      expect(spawnedArgs?.domain).toBe('scene');
    });

    it('executes get_cli_sessions and feeds result back to Gemini', async () => {
      mockGetActiveExecutions.mockReturnValue([
        { id: 'exec-1', status: 'running', sessionId: 's1', startTime: 100, events: [] },
      ]);

      // Turn 1: Gemini calls get_cli_sessions
      mockGenerateContent.mockResolvedValueOnce(
        geminiFunctionCallResponse(TOOL_NAMES.GET_CLI_SESSIONS, {}),
      );
      // Turn 2: Gemini uses the session list in text
      mockGenerateContent.mockResolvedValueOnce(
        geminiTextResponse('You have 1 active session.'),
      );

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(events.find(e => e.type === 'text' && e.text === 'You have 1 active session.')).toBeDefined();
    });

    it('executes stop_cli_session and feeds result back to Gemini', async () => {
      mockAbortExecution.mockReturnValue(true);

      // Turn 1: Gemini calls stop_cli_session
      mockGenerateContent.mockResolvedValueOnce(
        geminiFunctionCallResponse(TOOL_NAMES.STOP_CLI_SESSION, { executionId: 'exec-1' }),
      );
      // Turn 2: Gemini confirms
      mockGenerateContent.mockResolvedValueOnce(
        geminiTextResponse('Session stopped.'),
      );

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      expect(mockAbortExecution).toHaveBeenCalledWith('exec-1');
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
      expect(events.find(e => e.type === 'text' && e.text === 'Session stopped.')).toBeDefined();
    });

    it('returns error result when create_cli_session args are invalid', async () => {
      // Missing required 'prompt' field
      mockGenerateContent.mockResolvedValueOnce(
        geminiFunctionCallResponse(TOOL_NAMES.CREATE_CLI_SESSION, {}),
      );
      // Gemini receives error result, responds with text
      mockGenerateContent.mockResolvedValueOnce(
        geminiTextResponse('Sorry, I need a prompt to create a session.'),
      );

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      // startExecution should NOT have been called
      expect(mockStartExecution).not.toHaveBeenCalled();
      expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    });

    it('returns error when concurrent session limit is reached', async () => {
      mockGetActiveExecutions.mockReturnValue([
        { id: 'e1', status: 'running' },
        { id: 'e2', status: 'running' },
        { id: 'e3', status: 'running' },
      ]);

      // Turn 1: Gemini tries to spawn
      mockGenerateContent.mockResolvedValueOnce(
        geminiFunctionCallResponse(TOOL_NAMES.CREATE_CLI_SESSION, { prompt: 'do something' }),
      );
      // Turn 2: Gemini sees the limit error
      mockGenerateContent.mockResolvedValueOnce(
        geminiTextResponse('Cannot spawn more sessions — already at the limit.'),
      );

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      expect(mockStartExecution).not.toHaveBeenCalled();
      expect(events.find(e => e.type === 'text')).toBeDefined();
    });
  });

  // ── Max Orchestrator Turns ──

  describe('max turn limit enforcement', () => {
    it('stops after MAX_ORCHESTRATOR_TURNS (4) even if Gemini keeps calling tools', async () => {
      // Every turn: Gemini calls get_cli_sessions (server-side → triggers next turn)
      mockGenerateContent.mockResolvedValue(
        geminiFunctionCallResponse(TOOL_NAMES.GET_CLI_SESSIONS, {}),
      );

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      // Should call generateContent exactly 4 times (the MAX)
      expect(mockGenerateContent).toHaveBeenCalledTimes(4);

      // Should still emit done
      expect(events[events.length - 1]).toMatchObject({ type: 'done' });

      // Verify turn numbers escalate
      const statusEvents = events.filter(e => e.type === 'status' && typeof e.turn === 'number');
      const turns = statusEvents.map(e => e.turn as number);
      expect(Math.max(...turns)).toBeLessThanOrEqual(4);
    });
  });

  // ── Error Handling ──

  describe('error handling', () => {
    it('returns SSE error event when Gemini API throws', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      const errorEvent = events.find(e => e.type === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent!.error).toBe('Rate limit exceeded');
    });

    it('returns SSE error with fallback message for non-Error throws', async () => {
      mockGenerateContent.mockRejectedValueOnce('something went wrong');

      const res = await POST(makeRequest(minimalBody()));
      const events = await consumeSSE(res);

      const errorEvent = events.find(e => e.type === 'error');
      expect(errorEvent).toBeDefined();
      expect(errorEvent!.error).toBe('Gemini API call failed');
    });

    it('returns 400 for invalid JSON body', async () => {
      const req = new NextRequest('http://localhost:3000/api/agents/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Invalid JSON body');
    });

    it('returns 503 when API key is not configured', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      // We need to re-import the module to pick up the missing key.
      // Since the client is cached, we reset the module.
      vi.resetModules();

      // Re-import with fresh module scope
      const { POST: freshPost } = await import('../route');
      const res = await freshPost(makeRequest(minimalBody()));
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).toContain('Gemini API key not configured');
    });
  });

  // ── History & Memory Handling ──

  describe('request context', () => {
    it('includes history in contents sent to Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce(geminiTextResponse('Got it.'));

      await POST(makeRequest(minimalBody({
        history: [
          { role: 'user', text: 'Show me the scene editor' },
          { role: 'model', text: 'Opening scene editor now.' },
        ],
      })));

      const callArgs = mockGenerateContent.mock.calls[0][0];
      // History messages come before the current user message
      expect(callArgs.contents.length).toBe(3); // 2 history + 1 current
      expect(callArgs.contents[0]).toMatchObject({
        role: 'user',
        parts: [{ text: 'Show me the scene editor' }],
      });
      expect(callArgs.contents[1]).toMatchObject({
        role: 'model',
        parts: [{ text: 'Opening scene editor now.' }],
      });
    });

    it('appends memorySummary to system instruction', async () => {
      mockGenerateContent.mockResolvedValueOnce(geminiTextResponse('Noted.'));

      await POST(makeRequest(minimalBody({
        memorySummary: '\n\nUser prefers compact layouts.',
      })));

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.config.systemInstruction).toContain('User prefers compact layouts.');
    });

    it('builds workspace context into user prompt', async () => {
      mockGenerateContent.mockResolvedValueOnce(geminiTextResponse('Done.'));

      await POST(makeRequest(minimalBody({
        workspace: {
          panels: [{ type: 'scene-editor', role: 'primary' }],
          layout: 'primary-sidebar',
          selectedProject: 'proj-1',
          selectedScene: 'scene-1',
        },
      })));

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const userMsg = callArgs.contents[callArgs.contents.length - 1];
      const text = userMsg.parts[0].text as string;
      expect(text).toContain('primary-sidebar');
      expect(text).toContain('scene-editor(primary)');
      expect(text).toContain('Project: proj-1');
      expect(text).toContain('Scene: scene-1');
    });

    it('includes tool events in user prompt', async () => {
      mockGenerateContent.mockResolvedValueOnce(geminiTextResponse('Done.'));

      await POST(makeRequest(minimalBody({
        toolEvents: [
          { toolName: 'create_character', summary: 'name="Elena"' },
        ],
      })));

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const userMsg = callArgs.contents[callArgs.contents.length - 1];
      const text = userMsg.parts[0].text as string;
      expect(text).toContain('[CLI Tool Activity]');
      expect(text).toContain('create_character');
      expect(text).toContain('name="Elena"');
    });
  });
});

// ─── GET Health Check ───────────────────────────

describe('GET /api/agents/advisor', () => {
  it('returns available: true when API key is set', async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const res = await GET();
    const json = await res.json();
    expect(json.available).toBe(true);
    expect(json.service).toBe('gemini-advisor-proxy');
  });
});
