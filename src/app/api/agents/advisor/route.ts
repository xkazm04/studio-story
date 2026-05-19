/**
 * POST /api/agents/advisor
 *
 * Server-side Gemini advisor proxy. The client sends workspace context
 * and CLI tool events; the server calls Gemini with function declarations
 * and returns the response (text + tool calls). The API key never leaves
 * the server.
 *
 * Orchestrator tools (create_cli_session, get_cli_sessions, etc.) are
 * executed server-side in a multi-turn loop. Client-side tools
 * (compose_workspace, suggest_action) are returned to the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, type FunctionDeclaration } from '@google/genai';
import { withApiHandler } from '@/app/utils/apiErrorHandling';
import {
  startExecution,
  getActiveExecutions,
  getExecution,
  abortExecution,
} from '@/lib/claude-terminal/cli-service';
import { TOOL_NAMES, type AdvisorError } from '@/agents/types';
import {
  validateToolArgs,
  createCliSessionArgsSchema,
  getCliStatusArgsSchema,
  stopCliSessionArgsSchema,
} from '@/agents/advisorSchemas';
import {
  CANONICAL_ADVISOR_TOOLS,
  CLIENT_TOOL_NAMES,
  SERVER_TOOL_NAMES,
  toGeminiSDKDeclarations,
  toSystemInstructionToolDocs,
} from '@/agents/advisorToolSchema';
import { buildHttpSystemInstruction } from '@/agents/advisorSystemInstruction';

// ─── Types ──────────────────────────────────────

interface AdvisorRequest {
  workspace: {
    panels: Array<{ type: string; role: string }>;
    layout: string;
    selectedProject?: string | null;
    selectedAct?: string | null;
    selectedScene?: string | null;
  };
  toolEvents?: Array<{ toolName: string; summary: string }>;
  userMessage?: string;
  /** Compressed user preference summary from advisor memory */
  memorySummary?: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}

interface AdvisorToolCall {
  name: string;
  args: Record<string, unknown>;
}

// ─── Tool Classification (derived from canonical schema) ─

const MAX_ORCHESTRATOR_TURNS = 4;
const MAX_CONCURRENT_SESSIONS = 3;

/** Map tool names to user-visible processing status strings */
function toolStatusLabel(toolName: string): string {
  switch (toolName) {
    case TOOL_NAMES.CREATE_CLI_SESSION: return 'Spawning CLI session...';
    case TOOL_NAMES.GET_CLI_SESSIONS: return 'Checking active sessions...';
    case TOOL_NAMES.GET_CLI_STATUS: return 'Checking session status...';
    case TOOL_NAMES.STOP_CLI_SESSION: return 'Stopping CLI session...';
    case TOOL_NAMES.COMPOSE_WORKSPACE: return 'Composing workspace...';
    case TOOL_NAMES.SUGGEST_ACTION: return 'Preparing suggestion...';
    default: return 'Processing...';
  }
}

// ─── Gemini Tool Declarations (projected from canonical schema) ──

const ADVISOR_FUNCTION_DECLARATIONS = toGeminiSDKDeclarations(
  CANONICAL_ADVISOR_TOOLS,
) as FunctionDeclaration[];

// ─── System Instruction (built from shared composable segments) ───

const SYSTEM_INSTRUCTION = buildHttpSystemInstruction(
  toSystemInstructionToolDocs(CANONICAL_ADVISOR_TOOLS),
  MAX_CONCURRENT_SESSIONS,
);

// ─── Server-side Tool Execution ─────────────────

function executeServerTool(
  name: string,
  args: Record<string, unknown>,
  requestOrigin: string,
): Record<string, unknown> {
  switch (name) {
    case TOOL_NAMES.CREATE_CLI_SESSION: {
      const parsed = validateToolArgs(createCliSessionArgsSchema, args, 'create_cli_session');
      if (!parsed) {
        return { error: 'Invalid create_cli_session args: missing or malformed "prompt" field.' };
      }

      const activeSessions = getActiveExecutions();
      if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
        return {
          error: `Cannot spawn: ${activeSessions.length}/${MAX_CONCURRENT_SESSIONS} sessions already running.`,
          activeSessions: activeSessions.map(e => ({ id: e.id, status: e.status })),
        };
      }

      const projectPath = process.cwd();
      const projectId = process.env.STORY_PROJECT_ID;

      const executionId = startExecution(
        projectPath,
        parsed.prompt,
        undefined, // no resume
        undefined, // no onEvent callback (SSE handles streaming)
        projectId,
        requestOrigin,
      );

      const execution = getExecution(executionId);
      return {
        success: true,
        executionId,
        sessionId: execution?.sessionId,
        domain: parsed.domain ?? 'general',
        streamUrl: `/api/claude-terminal/stream?executionId=${executionId}`,
      };
    }

    case TOOL_NAMES.GET_CLI_SESSIONS: {
      const sessions = getActiveExecutions();
      return {
        count: sessions.length,
        maxConcurrent: MAX_CONCURRENT_SESSIONS,
        sessions: sessions.map(e => ({
          id: e.id,
          status: e.status,
          sessionId: e.sessionId,
          startTime: e.startTime,
          eventCount: e.events.length,
        })),
      };
    }

    case TOOL_NAMES.GET_CLI_STATUS: {
      const parsed = validateToolArgs(getCliStatusArgsSchema, args, 'get_cli_status');
      if (!parsed) {
        return { error: 'Invalid get_cli_status args: missing or malformed "executionId" field.' };
      }
      const execution = getExecution(parsed.executionId);
      if (!execution) {
        return { error: `Execution ${parsed.executionId} not found.` };
      }
      return {
        id: execution.id,
        status: execution.status,
        sessionId: execution.sessionId,
        startTime: execution.startTime,
        endTime: execution.endTime,
        eventCount: execution.events.length,
      };
    }

    case TOOL_NAMES.STOP_CLI_SESSION: {
      const parsed = validateToolArgs(stopCliSessionArgsSchema, args, 'stop_cli_session');
      if (!parsed) {
        return { error: 'Invalid stop_cli_session args: missing or malformed "executionId" field.' };
      }
      const success = abortExecution(parsed.executionId);
      return { success, executionId: parsed.executionId };
    }

    default:
      return { error: `Unknown server tool: ${name}` };
  }
}

// ─── Route Handler ──────────────────────────────

let cachedClient: InstanceType<typeof GoogleGenAI> | null = null;

function getClient(): InstanceType<typeof GoogleGenAI> | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return null;
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

export const POST = withApiHandler('POST /api/agents/advisor', async (request: NextRequest) => {
  const client = getClient();
  if (!client) {
    const advisorError: AdvisorError = {
      code: 'API_KEY_MISSING',
      message: 'Gemini API key not configured. Set GEMINI_API_KEY in .env.local.',
    };
    return NextResponse.json(
      { error: advisorError.message, advisorError },
      { status: 503 }
    );
  }

  let body: AdvisorRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Extract request origin for passing to CLI sessions
  const requestOrigin = new URL(request.url).origin;

  // Build the user prompt from context
  const promptParts: string[] = [];

  const panels = body.workspace.panels.map(p => `${p.type}(${p.role})`).join(', ');
  promptParts.push(`[Current Workspace] Layout: ${body.workspace.layout}, Panels: ${panels || 'empty'}`);
  if (body.workspace.selectedProject) promptParts.push(`Project: ${body.workspace.selectedProject}`);
  if (body.workspace.selectedAct) promptParts.push(`Act: ${body.workspace.selectedAct}`);
  if (body.workspace.selectedScene) promptParts.push(`Scene: ${body.workspace.selectedScene}`);

  if (body.toolEvents?.length) {
    promptParts.push('');
    promptParts.push('[CLI Tool Activity]');
    for (const event of body.toolEvents) {
      promptParts.push(`- ${event.toolName}: ${event.summary}`);
    }
    promptParts.push('');
    promptParts.push('Update the workspace panels to show relevant content for this CLI activity.');
  }

  if (body.userMessage) {
    promptParts.push('');
    promptParts.push(`[User Message] ${body.userMessage}`);
  }

  // Build contents with history
  type ContentPart = { text: string } | { functionCall: { name: string; args: Record<string, unknown> } } | { functionResponse: { name: string; response: Record<string, unknown> } };
  type ContentMessage = { role: 'user' | 'model'; parts: ContentPart[] };
  const contents: ContentMessage[] = [];

  if (body.history?.length) {
    for (const msg of body.history.slice(-6)) {
      contents.push({
        role: msg.role,
        parts: [{ text: msg.text }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: promptParts.join('\n') }],
  });

  // ─── SSE Streaming Response ──────────────────
  // Stream each orchestrator turn incrementally so the client
  // sees intermediate status, text, and tool calls in real-time.

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  function writeSSE(event: { type: string; [key: string]: unknown }): void {
    const line = JSON.stringify(event) + '\n';
    writer.write(encoder.encode(line)).catch(() => {/* stream closed */});
  }

  // Run the orchestrator loop in the background
  (async () => {
    try {
      let turns = 0;

      while (turns < MAX_ORCHESTRATOR_TURNS) {
        turns++;

        writeSSE({ type: 'status', status: turns === 1 ? 'Thinking...' : `Orchestrating (turn ${turns})...`, turn: turns });

        // Inject user preference memory into system instruction when available
        const effectiveInstruction = body.memorySummary
          ? SYSTEM_INSTRUCTION + body.memorySummary
          : SYSTEM_INSTRUCTION;

        const response = await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents,
          config: {
            temperature: 0.3,
            maxOutputTokens: 1024,
            systemInstruction: effectiveInstruction,
            tools: [{ functionDeclarations: ADVISOR_FUNCTION_DECLARATIONS }],
          },
        });

        const candidate = response.candidates?.[0];
        if (!candidate?.content?.parts) break;

        // Collect text, client-side tool calls, and server-side tool calls
        const serverToolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

        for (const part of candidate.content.parts) {
          if (part.text) {
            writeSSE({ type: 'text', text: part.text, turn: turns });
          }
          if (part.functionCall && part.functionCall.name) {
            const callName = part.functionCall.name;
            const callArgs = (part.functionCall.args ?? {}) as Record<string, unknown>;

            if (SERVER_TOOL_NAMES.has(callName)) {
              serverToolCalls.push({ name: callName, args: callArgs });
            } else if (CLIENT_TOOL_NAMES.has(callName)) {
              writeSSE({ type: 'tool_call', toolCall: { name: callName, args: callArgs }, turn: turns });
            }
          }
        }

        // If no server-side tools were called, we're done
        if (serverToolCalls.length === 0) break;

        // Stream status for server-side tool execution
        const statusLabel = serverToolCalls.length === 1
          ? toolStatusLabel(serverToolCalls[0].name)
          : 'Running multiple tools...';
        writeSSE({ type: 'status', status: statusLabel, turn: turns });

        // Add model's response to contents
        contents.push({
          role: 'model',
          parts: serverToolCalls.map(tc => ({
            functionCall: { name: tc.name, args: tc.args },
          })),
        });

        // Execute each tool and add results
        const toolResponseParts: ContentPart[] = [];
        for (const tc of serverToolCalls) {
          const toolResult = executeServerTool(tc.name, tc.args, requestOrigin);
          toolResponseParts.push({
            functionResponse: {
              name: tc.name,
              response: toolResult,
            },
          });

          // If this was a create_cli_session, also pass it as a client tool call
          if (tc.name === TOOL_NAMES.CREATE_CLI_SESSION && toolResult.success) {
            writeSSE({
              type: 'tool_call',
              toolCall: {
                name: TOOL_NAMES.SESSION_SPAWNED,
                args: {
                  executionId: toolResult.executionId as string | undefined,
                  sessionId: toolResult.sessionId as string | undefined,
                  domain: toolResult.domain as string | undefined,
                  streamUrl: toolResult.streamUrl as string | undefined,
                  prompt: tc.args.prompt as string | undefined,
                },
              },
              turn: turns,
            });
          }
        }

        // Feed tool results back to Gemini for the next turn
        contents.push({
          role: 'user',
          parts: toolResponseParts,
        });
      }

      writeSSE({ type: 'done' });
    } catch (error) {
      console.error('[advisor] Gemini API error:', error);
      const message = error instanceof Error ? error.message : 'Gemini API call failed';
      const advisorError: AdvisorError = {
        code: 'GEMINI_ERROR',
        message,
      };
      writeSSE({ type: 'error', error: message, advisorError });
    } finally {
      writer.close().catch(() => {/* already closed */});
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Content-Type-Options': 'nosniff',
    },
  }) as unknown as NextResponse;
});

/** GET — health check */
export async function GET() {
  const client = getClient();
  return NextResponse.json({
    available: !!client,
    service: 'gemini-advisor-proxy',
  });
}
