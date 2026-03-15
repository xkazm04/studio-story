/**
 * AdvisorClient — Server-proxied Gemini advisor.
 *
 * Replaces the direct WebSocket GeminiLiveClient. All Gemini calls go
 * through /api/agents/advisor — the API key never leaves the server.
 *
 * Stateless: each call sends current context. No persistent connection.
 */

import type { ConnectionState, SSEEvent } from './types';

export interface AdvisorToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface CLIToolEvent {
  toolName: string;
  summary: string;
}

interface WorkspaceSnapshot {
  panels: Array<{ type: string; role: string }>;
  layout: string;
  selectedProject?: string | null;
  selectedAct?: string | null;
  selectedScene?: string | null;
}

type ToolCallHandler = (calls: AdvisorToolCall[]) => void;
type MessageHandler = (text: string) => void;
/** Called with incremental text chunks during streaming */
type StreamingTextHandler = (chunk: string, accumulated: string) => void;
type StateHandler = (state: ConnectionState) => void;
type ProcessingHandler = (isProcessing: boolean, status?: string | null) => void;
type ErrorHandler = (errorMessage: string) => void;
type RateLimitHandler = (readyAt: number | null) => void;
type RetryHandler = (attempt: number, maxRetries: number) => void;

const MAX_RETRIES = 2;
const MIN_CALL_INTERVAL_MS = 2000;

export class AdvisorClient {
  private onToolCallHandlers: ToolCallHandler[] = [];
  private onMessageHandlers: MessageHandler[] = [];
  private onStreamingTextHandlers: StreamingTextHandler[] = [];
  private onStateChangeHandlers: StateHandler[] = [];
  private onProcessingChangeHandlers: ProcessingHandler[] = [];
  private onErrorHandlers: ErrorHandler[] = [];
  private onRateLimitHandlers: RateLimitHandler[] = [];
  private onRetryHandlers: RetryHandler[] = [];
  private _state: ConnectionState = 'disconnected';
  private _available: boolean | null = null;
  private lastCallTimestamp = 0;
  private pendingCall: ReturnType<typeof setTimeout> | null = null;
  private history: Array<{ role: 'user' | 'model'; text: string }> = [];
  private abortController: AbortController | null = null;

  get state(): ConnectionState {
    return this._state;
  }

  get isConnected(): boolean {
    return this._state === 'connected';
  }

  // ─── Event Registration ─────────────────────────

  onToolCall(handler: ToolCallHandler): () => void {
    this.onToolCallHandlers.push(handler);
    return () => { this.onToolCallHandlers = this.onToolCallHandlers.filter(h => h !== handler); };
  }

  onMessage(handler: MessageHandler): () => void {
    this.onMessageHandlers.push(handler);
    return () => { this.onMessageHandlers = this.onMessageHandlers.filter(h => h !== handler); };
  }

  onStreamingText(handler: StreamingTextHandler): () => void {
    this.onStreamingTextHandlers.push(handler);
    return () => { this.onStreamingTextHandlers = this.onStreamingTextHandlers.filter(h => h !== handler); };
  }

  onStateChange(handler: StateHandler): () => void {
    this.onStateChangeHandlers.push(handler);
    return () => { this.onStateChangeHandlers = this.onStateChangeHandlers.filter(h => h !== handler); };
  }

  onProcessingChange(handler: ProcessingHandler): () => void {
    this.onProcessingChangeHandlers.push(handler);
    return () => { this.onProcessingChangeHandlers = this.onProcessingChangeHandlers.filter(h => h !== handler); };
  }

  onError(handler: ErrorHandler): () => void {
    this.onErrorHandlers.push(handler);
    return () => { this.onErrorHandlers = this.onErrorHandlers.filter(h => h !== handler); };
  }

  onRateLimit(handler: RateLimitHandler): () => void {
    this.onRateLimitHandlers.push(handler);
    return () => { this.onRateLimitHandlers = this.onRateLimitHandlers.filter(h => h !== handler); };
  }

  onRetry(handler: RetryHandler): () => void {
    this.onRetryHandlers.push(handler);
    return () => { this.onRetryHandlers = this.onRetryHandlers.filter(h => h !== handler); };
  }

  // ─── Connection (health check only) ─────────────

  async connect(): Promise<boolean> {
    if (this._available === true) {
      this.setState('connected');
      return true;
    }

    this.setState('connecting');
    try {
      const res = await fetch('/api/agents/advisor');
      const data = await res.json();
      this._available = !!data.available;

      if (this._available) {
        this.setState('connected');
        return true;
      } else {
        this.setState('disconnected');
        return false;
      }
    } catch {
      this._available = false;
      this.setState('disconnected');
      return false;
    }
  }

  disconnect(): void {
    if (this.pendingCall) {
      clearTimeout(this.pendingCall);
      this.pendingCall = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.history = [];
    this._available = null;
    this.setState('disconnected');
  }

  // ─── Send Request ───────────────────────────────

  /**
   * Send context to the advisor and get a response.
   * Debounces rapid calls to avoid hammering the API.
   */
  async sendContext(
    workspace: WorkspaceSnapshot,
    toolEvents?: CLIToolEvent[],
    userMessage?: string,
    memorySummary?: string,
  ): Promise<void> {
    if (this._state !== 'connected') return;

    // Rate-limit: if called too rapidly, debounce
    const now = Date.now();
    const elapsed = now - this.lastCallTimestamp;
    if (elapsed < MIN_CALL_INTERVAL_MS) {
      const waitMs = MIN_CALL_INTERVAL_MS - elapsed;
      const readyAt = now + waitMs;
      // Notify listeners about rate limit
      this.onRateLimitHandlers.forEach(h => h(readyAt));
      // Cancel pending and reschedule
      if (this.pendingCall) clearTimeout(this.pendingCall);
      this.pendingCall = setTimeout(() => {
        this.pendingCall = null;
        this.onRateLimitHandlers.forEach(h => h(null));
        this.sendContext(workspace, toolEvents, userMessage, memorySummary);
      }, waitMs);
      return;
    }

    this.lastCallTimestamp = now;

    // Abort any in-flight request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    // Signal processing start
    this.emitProcessing(true, 'Thinking...');

    const body = {
      workspace,
      toolEvents,
      userMessage,
      memorySummary,
      history: this.history.slice(-6),
    };

    // Track user message in history
    if (userMessage) {
      this.history.push({ role: 'user', text: userMessage });
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Emit retry progress for attempts > 0
        if (attempt > 0) {
          this.onRetryHandlers.forEach(h => h(attempt, MAX_RETRIES));
          this.emitProcessing(true, `Retrying (${attempt}/${MAX_RETRIES})...`);
        }

        const res = await fetch('/api/agents/advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: this.abortController.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error((errData as { error?: string }).error ?? `HTTP ${res.status}`);
        }

        // Stream newline-delimited JSON events from SSE response
        await this.consumeStream(res);

        // Signal processing complete
        this.emitProcessing(false);
        return; // Success
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          this.emitProcessing(false);
          return;
        }
        lastError = error as Error;
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    // All retries failed — emit error via dedicated handler
    this.emitProcessing(false);
    console.error('[advisor] Failed after retries:', lastError?.message);
    this.onErrorHandlers.forEach(h =>
      h(lastError?.message ?? 'unknown error')
    );
  }

  // ─── Stream Consumer ────────────────────────────

  /**
   * Read a newline-delimited JSON stream from the advisor SSE response.
   * Dispatches events incrementally as they arrive.
   */
  private async consumeStream(res: Response): Promise<void> {
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedText = '';
    const pendingToolCalls: AdvisorToolCall[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          if (!line) continue;

          let event: SSEEvent;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          switch (event.type) {
            case 'status':
              if (event.status) {
                this.emitProcessing(true, event.status);
              }
              break;

            case 'text':
              if (event.text) {
                accumulatedText += event.text;
                // Emit incremental text for real-time streaming display
                this.onStreamingTextHandlers.forEach(h => h(event.text!, accumulatedText));
              }
              break;

            case 'tool_call':
              if (event.toolCall) {
                pendingToolCalls.push(event.toolCall);
                // Dispatch tool calls immediately for real-time workspace updates
                this.onToolCallHandlers.forEach(h => h([event.toolCall!]));
              }
              break;

            case 'error':
              throw new Error(event.error ?? 'Stream error');

            case 'done':
              // Stream complete — emit final accumulated text as a message
              if (accumulatedText) {
                this.onMessageHandlers.forEach(h => h(accumulatedText));
              }
              break;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Record model response in history
    if (accumulatedText) {
      this.history.push({ role: 'model', text: accumulatedText });
    }
  }

  // ─── Helpers ────────────────────────────────────

  private setState(state: ConnectionState): void {
    if (this._state === state) return;
    this._state = state;
    this.onStateChangeHandlers.forEach(h => h(state));
  }

  private emitProcessing(isProcessing: boolean, status?: string | null): void {
    this.onProcessingChangeHandlers.forEach(h => h(isProcessing, status));
  }
}
