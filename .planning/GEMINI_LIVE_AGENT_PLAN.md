# Phase 10: Gemini Live Agent — Implementation Plan

## Overview

Two-wave implementation adding a Gemini Live Agent to studio-story:
- **Wave 1 (Option B)**: Workspace Observer & Proactive Advisor — TEXT mode
- **Wave 2 (Option C)**: Hub-and-Spoke Multi-CLI Orchestrator

---

## Wave 1: Workspace Observer & Proactive Advisor

### Goal
Gemini Live maintains a persistent WebSocket session (TEXT mode), observes workspace state changes, and proactively suggests workspace compositions + creative guidance via an AdvisorPanel.

### Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (studio-story)                      │
│                                              │
│  ┌─────────────┐   ┌──────────────────────┐ │
│  │ Workspace    │──▶│ WorkspaceObserver    │ │
│  │ Store        │   │ (serializes state)   │ │
│  └─────────────┘   └──────┬───────────────┘ │
│                            │                  │
│  ┌─────────────┐   ┌──────▼───────────────┐ │
│  │ AdvisorPanel │◀──│ GeminiLiveClient     │ │
│  │ (UI)        │   │ (WebSocket TEXT mode) │ │
│  └─────────────┘   └──────┬───────────────┘ │
│                            │                  │
│  ┌─────────────┐   ┌──────▼───────────────┐ │
│  │ Workspace    │◀──│ agentStore           │ │
│  │ Composition  │   │ (Zustand)            │ │
│  └─────────────┘   └─────────────────────┘  │
└─────────────────────────────────────────────┘
         │ WebSocket
         ▼
  Gemini Live API (TEXT mode)
  wss://generativelanguage.googleapis.com/ws/...
```

### Files to Create

#### 1. Agent Core (`src/agents/`)
| File | Purpose |
|------|---------|
| `types.ts` | Agent session types, message types, connection states |
| `GeminiLiveClient.ts` | WebSocket connection manager — connect, send, receive, reconnect |
| `WorkspaceObserver.ts` | Subscribes to workspace store, serializes state deltas, feeds to Gemini |
| `advisorTools.ts` | Function declarations for Gemini (compose_workspace, suggest_action) |
| `index.ts` | Barrel exports |

#### 2. Agent State (`src/agents/store/`)
| File | Purpose |
|------|---------|
| `agentStore.ts` | Zustand store — connection status, messages, suggestions, session info |

#### 3. Advisor Panel (`src/workspace/panels/`)
| File | Purpose |
|------|---------|
| `AdvisorPanel.tsx` | New workspace panel — chat with Gemini, shows suggestions, connection status |

#### 4. API Route (optional proxy)
| File | Purpose |
|------|---------|
| `src/app/api/agents/gemini-token/route.ts` | Returns ephemeral API key or session token (keeps key server-side) |

#### 5. Updates to Existing Files
| File | Change |
|------|--------|
| `src/manifest/panelManifests.ts` | Add `advisor` panel manifest |
| `src/workspace/engine/panelRegistry.ts` | Register AdvisorPanel |
| `src/workspace/types.ts` | Add `'advisor'` to WorkspacePanelType |
| `src/mcp-server/tools/workspace.ts` | Add `'advisor'` to PANEL_TYPES array |

### Implementation Steps (Wave 1)

**Step 1: Types & Connection** (src/agents/)
- Define AgentMessage, AgentSession, ConnectionState types
- Implement GeminiLiveClient with WebSocket lifecycle:
  - `connect(apiKey, config)` → opens WS, sends setup
  - `send(text)` → sends client message
  - `onMessage(handler)` → receives server responses
  - `onToolCall(handler)` → handles function calls from Gemini
  - `respondToToolCall(id, result)` → sends function response
  - Automatic reconnection with session resumption (2hr token)
  - Heartbeat/keepalive

**Step 2: Tool Declarations** (src/agents/advisorTools.ts)
- Define function declarations Gemini can call:
  - `compose_workspace` — same schema as MCP tool (action, layout, panels, reasoning)
  - `suggest_action` — sends a suggestion to the advisor panel UI
  - `get_project_context` — requests current project data (characters, scenes, etc.)

**Step 3: Workspace Observer** (src/agents/WorkspaceObserver.ts)
- Subscribe to workspaceStore changes (panels, layout)
- Subscribe to project store changes (selected scene, character, etc.)
- Debounce + diff: only send meaningful state changes
- Serialize state into compact text for Gemini context
- Auto-feed state updates to GeminiLiveClient

**Step 4: Agent Store** (src/agents/store/agentStore.ts)
- Zustand store managing:
  - `connectionState`: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  - `messages`: conversation history (user + agent)
  - `suggestions`: pending suggestions from Gemini
  - `sessionHandle`: for resumption
  - `isObserving`: whether observer is active
- Actions: connect, disconnect, sendMessage, addSuggestion, dismissSuggestion

**Step 5: AdvisorPanel** (src/workspace/panels/AdvisorPanel.tsx)
- Connection indicator (dot: green/yellow/red)
- Chat area: scrollable message list
- Suggestions: cards with "Apply" / "Dismiss" buttons
- Input: text input for user messages to Gemini
- Settings: toggle observation on/off

**Step 6: Registration & Integration**
- Add manifest, register panel, add to workspace types
- Wire up: when Gemini calls `compose_workspace`, apply it through workspace store
- When Gemini calls `suggest_action`, add to suggestions in agentStore

### System Instructions for Gemini (Wave 1)

```
You are the Workspace Advisor for Studio Story, a creative writing application.
You observe the user's workspace state and provide proactive guidance.

Your capabilities:
- compose_workspace: Rearrange workspace panels to match user needs
- suggest_action: Offer creative suggestions as dismissible cards
- get_project_context: Request project data to inform your suggestions

Guidelines:
- Be proactive but not intrusive — suggest, don't demand
- When you notice the user working on scenes, suggest relevant panels
- When workspace seems cluttered, suggest simplification
- Offer creative writing tips relevant to the current context
- Keep suggestions concise (1-2 sentences)
- Only call compose_workspace when you're confident it helps
```

---

## Wave 2: Hub-and-Spoke Multi-CLI Orchestrator

### Goal
Evolve the Gemini agent from passive advisor to active orchestrator that can spawn, manage, and coordinate multiple CLI sessions (Claude Code instances) working in parallel.

### Architecture

```
┌──────────────────────────────────────────────────┐
│  Browser                                          │
│                                                    │
│  ┌────────────┐  ┌───────────────────────────┐   │
│  │ Advisor    │  │ GeminiLiveClient           │   │
│  │ Panel      │  │ (upgraded: orchestrator)   │   │
│  └────────────┘  └──────────┬────────────────┘   │
│                              │                     │
│  ┌────────────┐  ┌──────────▼────────────────┐   │
│  │ Terminal   │  │ CLISessionManager          │   │
│  │ Dock       │◀─│ (spawn/monitor/aggregate)  │   │
│  └────────────┘  └──────────┬────────────────┘   │
│                              │                     │
│       ┌──────────┬──────────┼──────────┐          │
│       ▼          ▼          ▼          ▼          │
│   CLI Sess 1  CLI Sess 2  CLI Sess 3  CLI Sess N │
│   (scene)     (character) (story)     (...)      │
└──────────────────────────────────────────────────┘
```

### Additional Files (Wave 2)

#### 1. Orchestration Layer
| File | Purpose |
|------|---------|
| `src/agents/CLISessionManager.ts` | Spawn, monitor, stop CLI sessions. Track status per session. |
| `src/agents/orchestratorTools.ts` | Extended function declarations: create_cli_session, stop_cli_session, get_session_status, queue_task |
| `src/agents/TaskAggregator.ts` | Collects results from multiple CLI sessions, feeds summary back to Gemini |

#### 2. Updates
| File | Change |
|------|--------|
| `src/agents/GeminiLiveClient.ts` | Add orchestrator tool handling |
| `src/agents/store/agentStore.ts` | Add CLI session tracking, task queue |
| `src/workspace/layout/TerminalDock/TerminalDock.tsx` | Show agent-spawned sessions with badges |
| `src/app/api/agents/gemini-token/route.ts` | Add session management endpoints |

### Implementation Steps (Wave 2)

**Step 1: CLISessionManager**
- `spawnSession(prompt, domain)` → starts CLI via existing terminal infrastructure
- `monitorSession(sessionId)` → subscribes to SSE events
- `stopSession(sessionId)` → graceful termination
- `getActiveSessionIds()` → list running sessions

**Step 2: Extended Tool Declarations**
- `create_cli_session`: Gemini can spawn a new CLI with a specific prompt
- `stop_cli_session`: Terminate a running session
- `get_session_status`: Check what a session is doing
- `queue_task`: Add task to a session or spawn new one
- `aggregate_results`: Collect outputs from completed sessions

**Step 3: TaskAggregator**
- Listen to CLI session events
- When session completes, summarize result
- Feed summaries back to Gemini for cross-session awareness
- Gemini can then compose workspace based on combined results

**Step 4: Terminal Dock Integration**
- Agent-spawned sessions show "Agent" badge
- Group agent sessions visually
- Allow user to take over agent sessions

**Step 5: System Instructions Update**
- Add orchestrator capabilities to Gemini system prompt
- Define task decomposition guidelines
- Set guardrails (max concurrent sessions, confirmation for destructive ops)

---

## Dependencies & Prerequisites

- `GEMINI_API_KEY` must be set in `.env.local`
- `@google/genai` already installed (v1.35.0)
- WebSocket API available in browser (no polyfill needed)
- Existing workspace composition infrastructure (compose_workspace tool, useWorkspaceComposition hook)

## Risk Mitigation

- **API Key Security**: Server-side token endpoint, never expose key to client
- **Rate Limiting**: Debounce workspace observations (500ms minimum)
- **Context Overflow**: Use Gemini's context window compression (trigger at 80%)
- **Graceful Degradation**: App works fully without agent connection
- **Session Cost**: TEXT mode is cheaper than AUDIO; auto-disconnect after 5min idle
