/**
 * Persistent CLI Session Manager
 *
 * Maintains a persistent Claude CLI session across multiple intent requests
 * by reusing session IDs via the --resume flag. Uses globalThis to survive
 * Next.js HMR reloads in development.
 */

import { startExecution, getExecution } from './cli-service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionStatus = 'idle' | 'busy' | 'error' | 'disconnected';

export interface CLIResponse {
  text: string;
  toolResults?: Array<{ name: string; result: unknown }>;
}

export interface PersistentSession {
  sessionId: string | null;
  status: SessionStatus;
  send(prompt: string): Promise<CLIResponse>;
  restart(): Promise<void>;
  destroy(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_CONSECUTIVE_ERRORS = 3;

// Timeout for waiting for CLI execution to complete (60s)
const EXECUTION_TIMEOUT_MS = 60_000;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a new persistent CLI session scoped to a project path.
 * The session tracks its own sessionId and reuses it via --resume
 * on subsequent send() calls.
 */
export function createPersistentSession(projectPath: string): PersistentSession {
  let sessionId: string | null = null;
  let status: SessionStatus = 'idle';
  let consecutiveErrors = 0;

  const session: PersistentSession = {
    get sessionId() {
      return sessionId;
    },
    get status() {
      return status;
    },

    async send(prompt: string): Promise<CLIResponse> {
      if (status === 'disconnected') {
        throw new Error('Session is disconnected. Call restart() to create a new session.');
      }

      status = 'busy';

      try {
        const response = await executeCLI(projectPath, prompt, sessionId ?? undefined);
        // Capture sessionId from first successful call
        if (response.sessionId) {
          sessionId = response.sessionId;
        }
        consecutiveErrors = 0;
        status = 'idle';
        return { text: response.text, toolResults: response.toolResults };
      } catch (err) {
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          status = 'disconnected';
        } else {
          status = 'error';
        }
        throw err;
      }
    },

    async restart(): Promise<void> {
      sessionId = null;
      status = 'idle';
      consecutiveErrors = 0;
    },

    destroy(): void {
      sessionId = null;
      status = 'idle';
      consecutiveErrors = 0;
    },
  };

  return session;
}

// ---------------------------------------------------------------------------
// Singleton via globalThis (HMR-safe)
// ---------------------------------------------------------------------------

const globalForSession = globalThis as unknown as {
  __dzinPersistentSession: PersistentSession | undefined;
};

/**
 * Get or create a persistent session singleton.
 * Uses globalThis to persist across Next.js HMR reloads.
 * Creates a new session if the current one is disconnected.
 */
export function getOrCreateSession(projectPath: string): PersistentSession {
  const existing = globalForSession.__dzinPersistentSession;

  if (existing && existing.status !== 'disconnected') {
    return existing;
  }

  const session = createPersistentSession(projectPath);
  globalForSession.__dzinPersistentSession = session;
  return session;
}

// ---------------------------------------------------------------------------
// Internal: Execute CLI and collect response
// ---------------------------------------------------------------------------

interface CLIExecutionResult {
  sessionId: string | null;
  text: string;
  toolResults: Array<{ name: string; result: unknown }>;
}

function executeCLI(
  projectPath: string,
  prompt: string,
  resumeSessionId?: string,
): Promise<CLIExecutionResult> {
  return new Promise<CLIExecutionResult>((resolve, reject) => {
    let capturedSessionId: string | null = null;
    const textParts: string[] = [];
    const toolResults: Array<{ name: string; result: unknown }> = [];
    let hasError = false;
    let errorMessage = '';
    let settled = false;

    const settle = () => {
      if (settled) return;
      settled = true;
    };

    // Track tool_use events to pair with tool_result
    const pendingTools: Map<string, string> = new Map();

    const executionId = startExecution(
      projectPath,
      prompt,
      resumeSessionId,
      (event) => {
        if (event.type === 'init') {
          capturedSessionId = (event.data.sessionId as string) ?? null;
        } else if (event.type === 'text') {
          textParts.push(event.data.content as string);
        } else if (event.type === 'tool_use') {
          const toolId = event.data.id as string;
          const toolName = event.data.name as string;
          pendingTools.set(toolId, toolName);
        } else if (event.type === 'tool_result') {
          const toolUseId = event.data.toolUseId as string;
          const toolName = pendingTools.get(toolUseId) ?? 'unknown';
          let parsed: unknown;
          try {
            parsed = JSON.parse(event.data.content as string);
          } catch {
            parsed = event.data.content;
          }
          toolResults.push({ name: toolName, result: parsed });
        } else if (event.type === 'result') {
          if (event.data.sessionId) {
            capturedSessionId = event.data.sessionId as string;
          }
          if (event.data.isError) {
            hasError = true;
            errorMessage = 'CLI execution reported error';
          }
          settle();
          if (hasError) {
            reject(new Error(errorMessage));
          } else {
            resolve({
              sessionId: capturedSessionId,
              text: textParts.join('\n'),
              toolResults: toolResults.length > 0 ? toolResults : undefined as unknown as Array<{ name: string; result: unknown }>,
            });
          }
        } else if (event.type === 'error') {
          hasError = true;
          errorMessage = (event.data.message as string) ?? 'Unknown CLI error';
          settle();
          reject(new Error(errorMessage));
        }
      },
    );

    // Timeout safety net
    setTimeout(() => {
      if (!settled) {
        settle();
        // Try to get execution status
        const exec = getExecution(executionId);
        if (exec?.status === 'completed') {
          resolve({
            sessionId: capturedSessionId,
            text: textParts.join('\n'),
            toolResults: toolResults.length > 0 ? toolResults : undefined as unknown as Array<{ name: string; result: unknown }>,
          });
        } else {
          reject(new Error(`CLI execution timed out after ${EXECUTION_TIMEOUT_MS}ms`));
        }
      }
    }, EXECUTION_TIMEOUT_MS);
  });
}
