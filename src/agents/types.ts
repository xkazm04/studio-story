/**
 * Gemini Live Agent — Type Definitions
 *
 * Types for WebSocket connection, messages, tool declarations,
 * and agent session management.
 */

// ============ Tool Names ============

/** Centralized tool name constants. All advisor/CLI tool references should use these
 *  instead of bare string literals to prevent typo-introduced bugs. */
export const TOOL_NAMES = {
  // Client-side tools (passed through to the browser)
  COMPOSE_WORKSPACE: 'compose_workspace',
  SUGGEST_ACTION: 'suggest_action',
  UPDATE_WORKSPACE: 'update_workspace',

  // Server-side orchestrator tools (executed in the advisor route)
  CREATE_CLI_SESSION: 'create_cli_session',
  GET_CLI_SESSIONS: 'get_cli_sessions',
  GET_CLI_STATUS: 'get_cli_status',
  STOP_CLI_SESSION: 'stop_cli_session',

  // Pseudo-tools (synthesized server-side, consumed client-side)
  SESSION_SPAWNED: '_session_spawned',
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

// ============ Connection ============

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface AgentConfig {
  apiKey: string;
  model?: string;
  systemInstruction: string;
  tools: GeminiToolDeclaration[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

// ============ Gemini Live Protocol ============

/** Setup message sent on WebSocket open */
export interface GeminiSetupMessage {
  setup: {
    model: string;
    generationConfig?: {
      responseModalities: 'TEXT'[];
      temperature?: number;
      topP?: number;
      topK?: number;
      maxOutputTokens?: number;
    };
    systemInstruction?: {
      parts: Array<{ text: string }>;
    };
    tools?: Array<{
      functionDeclarations: GeminiFunctionDeclaration[];
    }>;
    sessionResumption?: {
      handle?: string;
    };
    contextWindowCompression?: {
      triggerTokens: number;
      slidingWindow: {
        targetTokens: number;
      };
    };
  };
}

/** Client content message (user turn) */
export interface GeminiClientContent {
  clientContent: {
    turns: Array<{
      role: 'user';
      parts: Array<{ text: string }>;
    }>;
    turnComplete: true;
  };
}

/** Tool response sent back to Gemini */
export interface GeminiToolResponse {
  toolResponse: {
    functionResponses: Array<{
      id: string;
      name: string;
      response: Record<string, unknown>;
    }>;
  };
}

/** Server messages from Gemini */
export interface GeminiServerContent {
  serverContent?: {
    modelTurn?: {
      parts: Array<{ text?: string; functionCall?: GeminiFunctionCall }>;
    };
    turnComplete?: boolean;
  };
  toolCall?: {
    functionCalls: GeminiFunctionCall[];
  };
  setupComplete?: Record<string, never>;
  sessionResumptionUpdate?: {
    newHandle?: string;
    resumable?: boolean;
  };
  /** Real-time transcription of user's voice input (requires inputAudioTranscription config) */
  inputTranscription?: {
    text: string;
  };
}

export interface GeminiFunctionCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: { type: string; properties?: Record<string, unknown> };
    }>;
    required?: string[];
  };
}

// ============ Tool Declarations ============

export interface GeminiToolDeclaration {
  functionDeclarations: GeminiFunctionDeclaration[];
}

// ============ Agent Messages ============

export type AgentMessageRole = 'user' | 'agent' | 'system';

export type MessageRating = 'positive' | 'negative';

export interface AgentMessage {
  id: string;
  role: AgentMessageRole;
  content: string;
  timestamp: number;
  /** If agent made a tool call */
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  /** True if this message represents an error */
  isError?: boolean;
  /** True while streaming text is still arriving */
  isStreaming?: boolean;
  /** Auto-retry attempt info (e.g. "1/2") */
  retryInfo?: string;
  /** User feedback rating for this response */
  rating?: MessageRating;
}

// ============ Suggestions ============

export interface AgentSuggestion {
  id: string;
  content: string;
  /** Action to take if user accepts */
  action?: {
    type: typeof TOOL_NAMES.COMPOSE_WORKSPACE;
    payload: Record<string, unknown>;
  };
  timestamp: number;
  dismissed: boolean;
}

// ============ Proactive Muse Insights ============

export type MuseInsightCategory = 'plot' | 'character' | 'pacing' | 'continuity';

export interface MuseInsight {
  id: string;
  category: MuseInsightCategory;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  /** One-click action to navigate workspace */
  action?: {
    type: typeof TOOL_NAMES.COMPOSE_WORKSPACE;
    payload: Record<string, unknown>;
  };
  timestamp: number;
  dismissed: boolean;
}

// ============ Advisor Error Types ============

/** Discriminated union of structured advisor errors.
 *  Each variant carries actionable context for the UI and developers. */

export type AdvisorErrorCode =
  | 'API_KEY_MISSING'
  | 'RATE_LIMITED'
  | 'GEMINI_ERROR'
  | 'STREAM_CORRUPTED'
  | 'TOOL_EXECUTION_FAILED';

interface AdvisorErrorBase {
  code: AdvisorErrorCode;
  message: string;
}

export interface AdvisorApiKeyMissingError extends AdvisorErrorBase {
  code: 'API_KEY_MISSING';
}

export interface AdvisorRateLimitedError extends AdvisorErrorBase {
  code: 'RATE_LIMITED';
  retryAfterMs?: number;
}

export interface AdvisorGeminiError extends AdvisorErrorBase {
  code: 'GEMINI_ERROR';
  httpStatus?: number;
}

export interface AdvisorStreamCorruptedError extends AdvisorErrorBase {
  code: 'STREAM_CORRUPTED';
}

export interface AdvisorToolExecutionFailedError extends AdvisorErrorBase {
  code: 'TOOL_EXECUTION_FAILED';
  toolName: string;
}

export type AdvisorError =
  | AdvisorApiKeyMissingError
  | AdvisorRateLimitedError
  | AdvisorGeminiError
  | AdvisorStreamCorruptedError
  | AdvisorToolExecutionFailedError;

/** Type guard: checks if a value is a structured AdvisorError */
export function isAdvisorError(value: unknown): value is AdvisorError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as AdvisorError).code === 'string' &&
    typeof (value as AdvisorError).message === 'string'
  );
}

/** User-friendly display string for an AdvisorError */
export function advisorErrorLabel(error: AdvisorError): string {
  switch (error.code) {
    case 'API_KEY_MISSING':
      return 'API key not configured — set GEMINI_API_KEY in .env.local';
    case 'RATE_LIMITED':
      return error.retryAfterMs
        ? `Rate limited — retry in ${Math.ceil(error.retryAfterMs / 1000)}s`
        : 'Rate limited — please wait before retrying';
    case 'GEMINI_ERROR':
      return error.httpStatus
        ? `Gemini API error (HTTP ${error.httpStatus})`
        : `Gemini API error: ${error.message}`;
    case 'STREAM_CORRUPTED':
      return 'Response stream corrupted — try again';
    case 'TOOL_EXECUTION_FAILED':
      return `Tool "${error.toolName}" failed: ${error.message}`;
  }
}

// ============ SSE Streaming Events ============

/** Event types emitted during SSE streaming from the advisor route */
export type SSEEventType =
  | 'status'       // Processing status update (e.g. "Spawning CLI session...")
  | 'text'         // Incremental text from Gemini
  | 'tool_call'    // Client-side tool call
  | 'error'        // Error during processing
  | 'done';        // Stream complete

export interface SSEEvent {
  type: SSEEventType;
  /** Processing status label for 'status' events */
  status?: string;
  /** Turn number within orchestrator loop */
  turn?: number;
  /** Text content for 'text' events */
  text?: string;
  /** Tool call for 'tool_call' events */
  toolCall?: { name: string; args: Record<string, unknown> };
  /** Error message for 'error' events (legacy string or structured) */
  error?: string;
  /** Structured error for 'error' events */
  advisorError?: AdvisorError;
}

// ============ CLI Tool Events ============

export interface CLIToolEvent {
  toolName: string;
  summary: string;
}

/** Extract key fields from tool input into a compact summary string. */
export function summarizeToolInput(toolName: string, input: Record<string, unknown>): string {
  const parts: string[] = [];
  if (input.characterId) parts.push(`character=${input.characterId}`);
  if (input.sceneId) parts.push(`scene=${input.sceneId}`);
  if (input.actId) parts.push(`act=${input.actId}`);
  if (input.name) parts.push(`name="${input.name}"`);
  if (input.type) parts.push(`type=${input.type}`);
  if (input.prompt && typeof input.prompt === 'string') {
    parts.push(`prompt="${(input.prompt as string).slice(0, 80)}..."`);
  }
  if (input.sourceImageUrl) parts.push('has_source_image');
  if (input.imageUrl) parts.push('has_image');
  if (input.updates) parts.push(`updates=${typeof input.updates === 'string' ? input.updates.slice(0, 100) : 'object'}`);
  return parts.length > 0 ? parts.join(', ') : 'no params';
}

// ============ Workspace State Snapshot ============

export interface WorkspaceStateSnapshot {
  panels: Array<{ type: string; role: string; density?: string }>;
  layout: string;
  selectedProject: string | null;
  selectedScene: string | null;
  selectedAct: string | null;
  terminalTabCount: number;
  timestamp: number;
  viewport?: { width: number; height: number };
  focusedPanelType?: string;
  sceneAtmosphere?: string;
  /** Number of panels that were auto-compacted due to spatial constraints */
  autoCompactedCount?: number;
}

// ============ Effect Attribution Stack ============

/** What triggered an advisor-driven workspace mutation */
export type EffectTriggerSource =
  | { kind: 'tool_call'; toolName: string; args: Record<string, unknown> }
  | { kind: 'user_message'; text: string }
  | { kind: 'muse_insight'; insightId: string; category: MuseInsightCategory }
  | { kind: 'suggestion_accept'; suggestionId: string; content: string }
  | { kind: 'observer_snapshot' };

/** The workspace action that was dispatched */
export type EffectAction = 'replace' | 'show' | 'hide' | 'clear';

/** Lightweight workspace state for before/after comparison */
export interface EffectWorkspaceSnapshot {
  panels: Array<{ type: string; role: string; density?: string; dataSlice?: Record<string, unknown> }>;
  layout: string;
}

/** A single timestamped record of an advisor-driven workspace change */
export interface EffectRecord {
  id: string;
  timestamp: number;
  trigger: EffectTriggerSource;
  action: EffectAction;
  reasoning?: string;
  before: EffectWorkspaceSnapshot;
  after: EffectWorkspaceSnapshot;
}

/** Max number of effect records retained in the stack */
export const EFFECT_STACK_MAX = 20;
