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
import { GoogleGenAI, Type, type FunctionDeclaration } from '@google/genai';
import {
  startExecution,
  getActiveExecutions,
  getExecution,
  abortExecution,
} from '@/lib/claude-terminal/cli-service';

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

// ─── Tool Classification ────────────────────────

/** Tools that run server-side and feed results back to Gemini */
const SERVER_SIDE_TOOLS = new Set([
  'create_cli_session',
  'get_cli_sessions',
  'get_cli_status',
  'stop_cli_session',
]);

/** Tools that pass through to the client */
const CLIENT_SIDE_TOOLS = new Set([
  'compose_workspace',
  'suggest_action',
]);

const MAX_ORCHESTRATOR_TURNS = 4;
const MAX_CONCURRENT_SESSIONS = 3;

/** Map tool names to user-visible processing status strings */
function toolStatusLabel(toolName: string): string {
  switch (toolName) {
    case 'create_cli_session': return 'Spawning CLI session...';
    case 'get_cli_sessions': return 'Checking active sessions...';
    case 'get_cli_status': return 'Checking session status...';
    case 'stop_cli_session': return 'Stopping CLI session...';
    case 'compose_workspace': return 'Composing workspace...';
    case 'suggest_action': return 'Preparing suggestion...';
    default: return 'Processing...';
  }
}

// ─── Gemini Tool Declarations ───────────────────

const ADVISOR_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  // ── Client-side tools ──
  {
    name: 'compose_workspace',
    description: 'Rearrange workspace panels for the current user task. For story authoring: use primary-sidebar for scene editing, split-2 for story structure, show action for smart merge, relationship-map for character relationships.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          description: 'show: add panels. hide: remove panels. replace: clear and set new. clear: remove all.',
          enum: ['show', 'hide', 'replace', 'clear'],
        },
        layout: {
          type: Type.STRING,
          description: 'Optional layout preset.',
          enum: ['stack', 'single', 'split-2', 'split-3', 'grid-4', 'primary-sidebar', 'triptych', 'studio'],
        },
        panels: {
          type: Type.STRING,
          description: 'JSON array of panel objects: [{"type":"panel-type","role":"primary|secondary|sidebar","density":"full|compact|micro","dataSlice":{"entityId":"..."}}]. Panel types: scene-editor, scene-metadata, dialogue-view, scene-list, scene-gallery, character-cards, character-detail, character-creator, relationship-map, story-map, beats-manager, story-evaluator, story-graph, script-editor, theme-manager, beats-sidebar, image-canvas, image-generator, art-style, voice-manager, voice-casting, writing-desk, cast-sidebar, storyboard, narrative-suggestions, reader-view',
        },
        reasoning: {
          type: Type.STRING,
          description: 'Brief explanation of why these panels were chosen.',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'suggest_action',
    description: 'Send a proactive suggestion to the user as a dismissible card.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        content: {
          type: Type.STRING,
          description: 'The suggestion text (1-3 sentences).',
        },
        compose_on_accept: {
          type: Type.STRING,
          description: 'Optional JSON for a compose_workspace call if user accepts.',
        },
      },
      required: ['content'],
    },
  },

  // ── Server-side orchestrator tools ──
  {
    name: 'create_cli_session',
    description: 'Spawn a new Claude Code CLI session to perform a creative storytelling task. The session runs autonomously and can use MCP tools.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: {
          type: Type.STRING,
          description: 'The task prompt for Claude Code. Be specific about what to create/edit.',
        },
        domain: {
          type: Type.STRING,
          description: 'Task domain for UI tab categorization.',
          enum: ['scene', 'character', 'story', 'image', 'general'],
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'get_cli_sessions',
    description: 'List all active (running) CLI sessions. Check this before spawning new sessions to respect the concurrent limit.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_cli_status',
    description: 'Check the status of a specific CLI execution.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        executionId: {
          type: Type.STRING,
          description: 'The execution ID returned by create_cli_session.',
        },
      },
      required: ['executionId'],
    },
  },
  {
    name: 'stop_cli_session',
    description: 'Abort a running CLI session.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        executionId: {
          type: Type.STRING,
          description: 'The execution ID to abort.',
        },
      },
      required: ['executionId'],
    },
  },
];

// ─── System Instruction ─────────────────────────

const SYSTEM_INSTRUCTION = `You are the Workspace Advisor for Studio Story. You observe CLI tool activity, dynamically arrange workspace panels, and orchestrate CLI sessions for automated storytelling workflows.

## CLI Tool → Panel Mapping (use compose_workspace)
- generate_image_gemini / generate_image_leonardo → show scene-gallery (primary) + image-canvas (secondary)
- evaluate_image / describe_image → show image-canvas (primary)
- create_character / update_character → show character-detail (primary) + character-cards (sidebar)
- create_trait / update_trait → show character-detail (primary)
- create_scene / update_scene → show scene-editor (primary) + scene-list (sidebar)
- create_act → show story-map (primary) + beats-manager (secondary)
- create_beat / update_beat → show beats-manager (primary)
- create_faction / update_faction → show story-map (secondary)
- create_relationship → show relationship-map (primary) + character-detail (secondary)
- extract_art_style → show art-style (primary)
- create_branch → show story-graph (primary) + scene-editor (secondary) to see new branches
- create_choice → show story-graph (primary) to see new connection

## Story Intelligence
- When user asks "what should happen next?" or "any suggestions?": compose narrative-suggestions panel as sidebar
- narrative-suggestions shows AI-analyzed insights about relationship tensions, plot gaps, character underuse
- When user asks to test or preview their story: compose reader-view (primary) optionally with story-graph
- When user says "add a choice" or "create a branch": CLI handles via create_branch, then compose story-graph

## Story Authoring Composition Patterns
When user discusses characters (e.g., "show me Elena"):
- Use action 'show' (smart merge), primary: character-detail with dataSlice { entityId }
- Add relationship-map if character has many relationships
- Add scene-list as sidebar if character appears in scenes

When user discusses a scene (e.g., "edit the castle scene"):
- Use action 'replace', layout 'primary-sidebar'
- Primary: scene-editor with dataSlice { entityId }, sidebar: scene-metadata or beats-sidebar

When user discusses story structure:
- Use action 'replace', layout 'split-2' or 'triptych'
- story-map (primary) + beats-manager (secondary), add story-evaluator for quality analysis

When user discusses relationships or factions:
- Use relationship-map as primary, add character-detail as secondary if specific character

## Workspace Rules
- When you see CLI tool events, call compose_workspace DIRECTLY — the user expects automatic UI updates
- Use "show" for additive changes, "replace" only when domain shifts (e.g., scenes→images)
- Keep workspace focused: 1-3 panels max
- One primary panel max; companions are secondary or sidebar

## CLI Orchestration
You can spawn Claude Code CLI sessions to perform creative tasks autonomously:
- create_cli_session: Start a new session with a specific prompt and domain
- get_cli_sessions: Check what sessions are currently running
- get_cli_status: Check progress of a specific session
- stop_cli_session: Abort a stuck or unnecessary session

Use orchestration for multi-step workflows when the user asks for complex operations:
- "Create a full character" → spawn CLI with character creation prompt
- "Generate scene images" → spawn CLI with image generation prompt
- "Write all scene scripts for Act 1" → spawn multiple CLIs, one per scene
- "Build out the story beats" → spawn CLI with beat creation prompt

Guardrails:
- Max ${MAX_CONCURRENT_SESSIONS} concurrent sessions — always check get_cli_sessions before spawning new ones
- If at capacity, wait or suggest the user what's running
- After spawning a session, compose workspace panels to show relevant content
- Keep task prompts specific and actionable

## Response Style
- Keep responses very concise (1-2 sentences)
- If no CLI events and user asks a question, respond conversationally
- When spawning sessions, briefly confirm what you started`;

// ─── Server-side Tool Execution ─────────────────

function executeServerTool(
  name: string,
  args: Record<string, unknown>,
  requestOrigin: string,
): Record<string, unknown> {
  switch (name) {
    case 'create_cli_session': {
      const activeSessions = getActiveExecutions();
      if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
        return {
          error: `Cannot spawn: ${activeSessions.length}/${MAX_CONCURRENT_SESSIONS} sessions already running.`,
          activeSessions: activeSessions.map(e => ({ id: e.id, status: e.status })),
        };
      }

      const prompt = args.prompt as string;
      const domain = (args.domain as string) ?? 'general';
      const projectPath = process.cwd();

      // Use the project ID from env if available
      const projectId = process.env.STORY_PROJECT_ID;

      const executionId = startExecution(
        projectPath,
        prompt,
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
        domain,
        streamUrl: `/api/claude-terminal/stream?executionId=${executionId}`,
      };
    }

    case 'get_cli_sessions': {
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

    case 'get_cli_status': {
      const executionId = args.executionId as string;
      const execution = getExecution(executionId);
      if (!execution) {
        return { error: `Execution ${executionId} not found.` };
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

    case 'stop_cli_session': {
      const execId = args.executionId as string;
      const success = abortExecution(execId);
      return { success, executionId: execId };
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

export async function POST(request: NextRequest) {
  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: 'Gemini API key not configured. Set GEMINI_API_KEY in .env.local.' },
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

            if (SERVER_SIDE_TOOLS.has(callName)) {
              serverToolCalls.push({ name: callName, args: callArgs });
            } else if (CLIENT_SIDE_TOOLS.has(callName)) {
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
          if (tc.name === 'create_cli_session' && (toolResult as { success?: boolean }).success) {
            writeSSE({
              type: 'tool_call',
              toolCall: {
                name: '_session_spawned',
                args: {
                  executionId: (toolResult as { executionId?: string }).executionId,
                  sessionId: (toolResult as { sessionId?: string }).sessionId,
                  domain: tc.args.domain ?? 'general',
                  streamUrl: (toolResult as { streamUrl?: string }).streamUrl,
                  prompt: tc.args.prompt,
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
      writeSSE({ type: 'error', error: error instanceof Error ? error.message : 'Gemini API call failed' });
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
  });
}

/** GET — health check */
export async function GET() {
  const client = getClient();
  return NextResponse.json({
    available: !!client,
    service: 'gemini-advisor-proxy',
  });
}
