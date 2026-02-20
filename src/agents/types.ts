/**
 * Gemini Live Agent — Type Definitions
 *
 * Types for WebSocket connection, messages, tool declarations,
 * and agent session management.
 */

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
}

// ============ Suggestions ============

export interface AgentSuggestion {
  id: string;
  content: string;
  /** Action to take if user accepts */
  action?: {
    type: 'compose_workspace';
    payload: Record<string, unknown>;
  };
  timestamp: number;
  dismissed: boolean;
}

// ============ Workspace State Snapshot ============

export interface WorkspaceStateSnapshot {
  panels: Array<{ type: string; role: string }>;
  layout: string;
  selectedProject: string | null;
  selectedScene: string | null;
  selectedAct: string | null;
  terminalTabCount: number;
  timestamp: number;
}
