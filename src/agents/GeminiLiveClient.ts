/**
 * GeminiLiveClient — WebSocket connection manager for Gemini Live API.
 *
 * Supports two connection modes:
 * 1. Direct API key (legacy, TEXT only)
 * 2. Ephemeral token (voice mode, AUDIO + TEXT)
 *
 * For voice mode, the setup message includes audio response modalities.
 * The ephemeral token is obtained from /api/agents/live-token.
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
type AudioHandler = (base64Pcm: string) => void;
type InputTranscriptionHandler = (text: string) => void;

export interface LiveConnectOptions {
  /** Use ephemeral token (preferred for voice mode) */
  ephemeralToken?: string;
  /** Direct API key (legacy, text-only mode) */
  apiKey?: string;
  /** Enable audio response modalities */
  audioMode?: boolean;
  /** Voice name for speech output */
  voice?: string;
}

const WS_BASE_V1BETA = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const WS_BASE_V1ALPHA = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';
const DEFAULT_MODEL = 'models/gemini-2.0-flash-live-001';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
const MAX_RECONNECT_ATTEMPTS = 3;
const CONTEXT_COMPRESSION_TRIGGER = 100_000;
const CONTEXT_COMPRESSION_TARGET = 50_000;

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private config: AgentConfig | null = null;
  private connectOptions: LiveConnectOptions | null = null;
  private sessionHandle: string | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  // Handlers
  private onMessageHandlers: MessageHandler[] = [];
  private onToolCallHandlers: ToolCallHandler[] = [];
  private onStateChangeHandlers: StateHandler[] = [];
  private onSetupCompleteHandlers: SetupHandler[] = [];
  private onAudioHandlers: AudioHandler[] = [];
  private onInputTranscriptionHandlers: InputTranscriptionHandler[] = [];

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

  onAudio(handler: AudioHandler): () => void {
    this.onAudioHandlers.push(handler);
    return () => {
      this.onAudioHandlers = this.onAudioHandlers.filter(h => h !== handler);
    };
  }

  onInputTranscription(handler: InputTranscriptionHandler): () => void {
    this.onInputTranscriptionHandlers.push(handler);
    return () => {
      this.onInputTranscriptionHandlers = this.onInputTranscriptionHandlers.filter(h => h !== handler);
    };
  }

  // ─── Connection Lifecycle ───────────────────────

  /**
   * Connect with either an ephemeral token or direct API key.
   * Config is only needed for direct API key mode (text-only).
   * For ephemeral token mode, the config is baked into the token.
   */
  connect(options: LiveConnectOptions, config?: AgentConfig): void {
    this.connectOptions = options;
    this.config = config ?? null;
    this.intentionalClose = false;
    this.reconnectAttempt = 0;
    this.doConnect();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.cleanup();
    this.setState('disconnected');
  }

  private doConnect(): void {
    const opts = this.connectOptions;
    if (!opts) return;

    this.cleanup();
    this.setState(this.sessionHandle ? 'reconnecting' : 'connecting');

    // Choose WebSocket URL based on auth mode
    let url: string;
    if (opts.ephemeralToken) {
      // Ephemeral token — use v1alpha endpoint
      url = `${WS_BASE_V1ALPHA}?key=${opts.ephemeralToken}`;
    } else if (opts.apiKey) {
      // Direct API key — use v1beta endpoint
      url = `${WS_BASE_V1BETA}?key=${opts.apiKey}`;
    } else {
      console.error('[GeminiLive] No API key or ephemeral token provided');
      this.setState('disconnected');
      return;
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.sendSetup();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        this.handleServerMessage(data);
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };

    this.ws.onclose = () => {
      if (!this.intentionalClose && this.reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
        this.scheduleReconnect();
      } else if (!this.intentionalClose) {
        // Max reconnects reached — give up gracefully
        this.setState('disconnected');
      }
    };
  }

  private sendSetup(): void {
    if (!this.ws) return;
    const opts = this.connectOptions;

    if (opts?.ephemeralToken) {
      // For ephemeral tokens, the config is baked into the token.
      // We still need to send a minimal setup message.
      const setup: Record<string, unknown> = {
        setup: {
          model: DEFAULT_MODEL,
        },
      };

      if (this.sessionHandle) {
        (setup.setup as Record<string, unknown>).sessionResumption = { handle: this.sessionHandle };
      }

      this.ws.send(JSON.stringify(setup));
      return;
    }

    // Direct API key mode — full setup message
    if (!this.config) return;
    const model = this.config.model ?? DEFAULT_MODEL;

    const responseModalities = opts?.audioMode ? ['AUDIO', 'TEXT'] : ['TEXT'];

    const setup: GeminiSetupMessage = {
      setup: {
        model,
        generationConfig: {
          responseModalities: responseModalities as 'TEXT'[],
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

    if (this.sessionHandle) {
      setup.setup.sessionResumption = { handle: this.sessionHandle };
    }

    this.ws.send(JSON.stringify(setup));
  }

  // ─── Message Handling ───────────────────────────

  private handleServerMessage(data: GeminiServerContent & {
    serverContent?: {
      modelTurn?: {
        parts: Array<{
          text?: string;
          functionCall?: GeminiFunctionCall;
          inlineData?: { mimeType: string; data: string };
        }>;
      };
      turnComplete?: boolean;
    };
  }): void {
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

    // Input audio transcription (real-time voice-to-text of user's speech)
    // Uses independent if-block: inputTranscription can arrive alongside other content
    if (data.inputTranscription?.text) {
      this.onInputTranscriptionHandlers.forEach(h => h(data.inputTranscription!.text));
    }

    // Tool calls
    if (data.toolCall?.functionCalls) {
      this.onToolCallHandlers.forEach(h => h(data.toolCall!.functionCalls));
      return;
    }

    // Server content (text, audio, or function calls)
    if (data.serverContent?.modelTurn?.parts) {
      for (const part of data.serverContent.modelTurn.parts) {
        if (part.text) {
          this.onMessageHandlers.forEach(h => h(part.text!));
        }
        if (part.functionCall) {
          this.onToolCallHandlers.forEach(h => h([part.functionCall!]));
        }
        // Audio data (PCM base64)
        if (part.inlineData?.mimeType?.startsWith('audio/') && part.inlineData.data) {
          this.onAudioHandlers.forEach(h => h(part.inlineData!.data));
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

  /** Send audio data from microphone */
  sendAudio(base64Pcm: string): void {
    if (!this.ws || this._state !== 'connected') return;

    const msg = {
      realtimeInput: {
        mediaChunks: [{
          mimeType: 'audio/pcm;rate=16000',
          data: base64Pcm,
        }],
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
