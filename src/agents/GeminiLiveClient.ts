/**
 * GeminiLiveClient — WebSocket connection manager for Gemini Live API.
 *
 * Manages the persistent bidirectional WebSocket connection in TEXT mode.
 * Handles setup, message sending, tool call responses, session resumption,
 * and automatic reconnection.
 */

import type {
  AgentConfig,
  GeminiSetupMessage,
  GeminiClientContent,
  GeminiToolResponse,
  GeminiServerContent,
  GeminiFunctionCall,
  ConnectionState,
} from './types';

type MessageHandler = (text: string) => void;
type ToolCallHandler = (calls: GeminiFunctionCall[]) => void;
type StateHandler = (state: ConnectionState) => void;
type SetupHandler = () => void;

const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const DEFAULT_MODEL = 'models/gemini-2.0-flash-live-001';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
const CONTEXT_COMPRESSION_TRIGGER = 100_000; // tokens
const CONTEXT_COMPRESSION_TARGET = 50_000;

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private config: AgentConfig | null = null;
  private sessionHandle: string | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  // Handlers
  private onMessageHandlers: MessageHandler[] = [];
  private onToolCallHandlers: ToolCallHandler[] = [];
  private onStateChangeHandlers: StateHandler[] = [];
  private onSetupCompleteHandlers: SetupHandler[] = [];

  private _state: ConnectionState = 'disconnected';

  get state(): ConnectionState {
    return this._state;
  }

  get isConnected(): boolean {
    return this._state === 'connected';
  }

  get currentSessionHandle(): string | null {
    return this.sessionHandle;
  }

  // ─── Event Registration ─────────────────────────

  onMessage(handler: MessageHandler): () => void {
    this.onMessageHandlers.push(handler);
    return () => {
      this.onMessageHandlers = this.onMessageHandlers.filter(h => h !== handler);
    };
  }

  onToolCall(handler: ToolCallHandler): () => void {
    this.onToolCallHandlers.push(handler);
    return () => {
      this.onToolCallHandlers = this.onToolCallHandlers.filter(h => h !== handler);
    };
  }

  onStateChange(handler: StateHandler): () => void {
    this.onStateChangeHandlers.push(handler);
    return () => {
      this.onStateChangeHandlers = this.onStateChangeHandlers.filter(h => h !== handler);
    };
  }

  onSetupComplete(handler: SetupHandler): () => void {
    this.onSetupCompleteHandlers.push(handler);
    return () => {
      this.onSetupCompleteHandlers = this.onSetupCompleteHandlers.filter(h => h !== handler);
    };
  }

  // ─── Connection Lifecycle ───────────────────────

  connect(config: AgentConfig): void {
    this.config = config;
    this.intentionalClose = false;
    this.doConnect();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.cleanup();
    this.setState('disconnected');
  }

  private doConnect(): void {
    if (!this.config) return;
    this.cleanup();
    this.setState(this.sessionHandle ? 'reconnecting' : 'connecting');

    const url = `${WS_BASE}?key=${this.config.apiKey}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.sendSetup();
    };

    this.ws.onmessage = (event) => {
      try {
        const data: GeminiServerContent = JSON.parse(event.data as string);
        this.handleServerMessage(data);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };

    this.ws.onclose = () => {
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  private sendSetup(): void {
    if (!this.ws || !this.config) return;

    const model = this.config.model ?? DEFAULT_MODEL;

    const setup: GeminiSetupMessage = {
      setup: {
        model,
        generationConfig: {
          responseModalities: ['TEXT'],
          temperature: this.config.generationConfig?.temperature ?? 0.7,
          topP: this.config.generationConfig?.topP,
          topK: this.config.generationConfig?.topK,
          maxOutputTokens: this.config.generationConfig?.maxOutputTokens ?? 2048,
        },
        systemInstruction: {
          parts: [{ text: this.config.systemInstruction }],
        },
        tools: this.config.tools.length > 0 ? this.config.tools : undefined,
        contextWindowCompression: {
          triggerTokens: CONTEXT_COMPRESSION_TRIGGER,
          slidingWindow: {
            targetTokens: CONTEXT_COMPRESSION_TARGET,
          },
        },
      },
    };

    // Add session resumption if we have a handle
    if (this.sessionHandle) {
      setup.setup.sessionResumption = { handle: this.sessionHandle };
    }

    this.ws.send(JSON.stringify(setup));
  }

  // ─── Message Handling ───────────────────────────

  private handleServerMessage(data: GeminiServerContent): void {
    // Setup complete
    if (data.setupComplete) {
      this.setState('connected');
      this.reconnectAttempt = 0;
      this.onSetupCompleteHandlers.forEach(h => h());
      return;
    }

    // Session resumption update
    if (data.sessionResumptionUpdate?.newHandle) {
      this.sessionHandle = data.sessionResumptionUpdate.newHandle;
    }

    // Tool calls
    if (data.toolCall?.functionCalls) {
      this.onToolCallHandlers.forEach(h => h(data.toolCall!.functionCalls));
      return;
    }

    // Server content (text or inline function calls)
    if (data.serverContent?.modelTurn?.parts) {
      for (const part of data.serverContent.modelTurn.parts) {
        if (part.text) {
          this.onMessageHandlers.forEach(h => h(part.text!));
        }
        if (part.functionCall) {
          this.onToolCallHandlers.forEach(h => h([part.functionCall!]));
        }
      }
    }
  }

  // ─── Sending ────────────────────────────────────

  send(text: string): void {
    if (!this.ws || this._state !== 'connected') return;

    const msg: GeminiClientContent = {
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true,
      },
    };

    this.ws.send(JSON.stringify(msg));
  }

  respondToToolCall(id: string, name: string, result: Record<string, unknown>): void {
    if (!this.ws || this._state !== 'connected') return;

    const msg: GeminiToolResponse = {
      toolResponse: {
        functionResponses: [{ id, name, response: result }],
      },
    };

    this.ws.send(JSON.stringify(msg));
  }

  // ─── Reconnection ──────────────────────────────

  private scheduleReconnect(): void {
    if (this.intentionalClose) return;

    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt++;
    this.setState('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, delay);
  }

  // ─── Helpers ────────────────────────────────────

  private setState(state: ConnectionState): void {
    if (this._state === state) return;
    this._state = state;
    this.onStateChangeHandlers.forEach(h => h(state));
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
  }
}
