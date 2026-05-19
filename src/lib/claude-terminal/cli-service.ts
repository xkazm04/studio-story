/**
 * CLI-based Claude Terminal Service
 *
 * Spawns Claude Code CLI process and parses stream-json output.
 * Adapted for Story app — runs locally on Windows or Unix.
 */

import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { getExecutionStore } from './execution-store';
import type { Execution } from './execution-types';
import { analyzeEvent } from './signals/signal-analyzer';
import { appendSignal, getSignals, savePatterns, appendIntentSignal, getIntentSignals, saveIntentPatterns, flushSignalBuffers } from './signals/signal-store';
import { detectPatterns } from './signals/pattern-detector';
import { IntentChainTracker } from './signals/intent-analyzer';
import { detectIntentPatterns } from './signals/intent-detector';

// ============ Stream-json message types from Claude CLI ============

export interface CLISystemMessage {
  type: 'system';
  subtype: 'init';
  session_id: string;
  tools: string[];
  model?: string;
  cwd?: string;
  claude_code_version?: string;
}

export interface CLIAssistantMessage {
  type: 'assistant';
  message: {
    id: string;
    type: 'message';
    role: 'assistant';
    content: Array<{
      type: 'text' | 'tool_use';
      text?: string;
      id?: string;
      name?: string;
      input?: Record<string, unknown>;
    }>;
    model: string;
    stop_reason: string;
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

export interface CLIUserMessage {
  type: 'user';
  message: {
    role: 'user';
    content: Array<{
      type: 'tool_result';
      tool_use_id: string;
      content: string;
    }>;
  };
}

export interface CLIResultMessage {
  type: 'result';
  subtype?: string;
  result?: {
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
    session_id?: string;
  };
  duration_ms?: number;
  cost_usd?: number;
  is_error?: boolean;
}

export type CLIMessage = CLISystemMessage | CLIAssistantMessage | CLIUserMessage | CLIResultMessage;

// ============ Execution Events ============

// ---- Per-event-type data shapes ----

export interface CLIInitData {
  sessionId: string;
  tools: string[];
  model?: string;
  cwd?: string;
  version?: string;
}

export interface CLITextData {
  content: string;
  model: string;
}

export interface CLIToolUseData {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface CLIToolResultData {
  toolUseId: string;
  content: string;
}

export interface CLIResultData {
  sessionId?: string;
  usage?: { input_tokens: number; output_tokens: number };
  durationMs?: number;
  costUsd?: number;
  isError?: boolean;
  synthetic?: boolean;
}

export interface CLIErrorData {
  message: string;
  error?: string;
  source?: string;
  exitCode?: number;
}

export interface CLIStdoutData {
  raw: string;
}

// ---- Discriminated union ----

export type CLIExecutionEvent =
  | { type: 'init'; data: CLIInitData; timestamp: number }
  | { type: 'text'; data: CLITextData; timestamp: number }
  | { type: 'tool_use'; data: CLIToolUseData; timestamp: number }
  | { type: 'tool_result'; data: CLIToolResultData; timestamp: number }
  | { type: 'result'; data: CLIResultData; timestamp: number }
  | { type: 'error'; data: CLIErrorData; timestamp: number }
  | { type: 'stdout'; data: CLIStdoutData; timestamp: number };

/**
 * CLIExecution is now an alias for the first-class Execution entity.
 * Kept for backward compatibility with existing consumers.
 */
export type CLIExecution = Execution;

// ============ Logging ============

function getLogsDirectory(projectPath: string): string {
  return path.join(projectPath, '.claude', 'logs');
}

function ensureLogsDirectory(projectPath: string): void {
  const logsDir = getLogsDirectory(projectPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function getLogFilePath(projectPath: string, executionId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitized = executionId.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 50);
  return path.join(getLogsDirectory(projectPath), `terminal_${sanitized}_${timestamp}.log`);
}

// ============ Stream-JSON Parsing ============

export function parseStreamJsonLine(line: string): CLIMessage | null {
  try {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('[')) return null;
    return JSON.parse(trimmed) as CLIMessage;
  } catch {
    return null;
  }
}

export function extractTextContent(msg: CLIAssistantMessage): string {
  return msg.message.content
    .filter(c => c.type === 'text')
    .map(c => c.text || '')
    .join('\n');
}

export function extractToolUses(msg: CLIAssistantMessage): Array<{
  id: string;
  name: string;
  input: Record<string, unknown>;
}> {
  return msg.message.content
    .filter(c => c.type === 'tool_use')
    .map(c => ({
      id: c.id || '',
      name: c.name || '',
      input: c.input || {},
    }));
}

// ============ Execution ============

/**
 * Start a CLI execution.
 * Spawns `claude` with stream-json output and returns an executionId.
 */
export function startExecution(
  projectPath: string,
  prompt: string,
  resumeSessionId?: string,
  onEvent?: (event: CLIExecutionEvent) => void,
  projectId?: string,
  serverOrigin?: string,
): string {
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  ensureLogsDirectory(projectPath);
  const logFilePath = getLogFilePath(projectPath, executionId);

  const store = getExecutionStore();
  const execution = store.register({ id: executionId, projectPath, prompt, logFilePath });
  console.log(`[CLI] Registered execution: ${executionId}. Total active: ${store.size}`);

  // Create log file stream
  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  let streamClosed = false;

  const logMessage = (msg: string) => {
    const timestamp = new Date().toISOString();
    if (!streamClosed) {
      try { logStream.write(`[${timestamp}] ${msg}\n`); } catch { /* ignore */ }
    }
  };

  const closeLogStream = () => {
    if (!streamClosed) {
      streamClosed = true;
      logStream.end();
    }
  };

  const emitEvent = (event: CLIExecutionEvent) => {
    store.pushEvent(executionId, event);
    if (onEvent) onEvent(event);
  };

  logMessage('=== Claude Terminal Execution Started ===');
  logMessage(`Execution ID: ${executionId}`);
  logMessage(`Project Path: ${projectPath}`);
  logMessage(`Prompt length: ${prompt.length} characters`);
  if (resumeSessionId) logMessage(`Resume session: ${resumeSessionId}`);
  logMessage('');

  // Spawn CLI process
  const isWindows = process.platform === 'win32';

  // Allow configurable CLI path via env var
  const cliCommand = process.env.CLAUDE_CLI_PATH || (isWindows ? 'claude.cmd' : 'claude');

  const args = [
    '-p',
    '-', // Read from stdin
    '--output-format',
    'stream-json',
    '--verbose',
    '--dangerously-skip-permissions',
  ];

  if (resumeSessionId) {
    args.push('--resume', resumeSessionId);
  }

  const env = { ...process.env };

  // Set MCP server context so tools know which project to operate on
  if (projectId) {
    env.STORY_PROJECT_ID = projectId;
  }

  // Set MCP base URL from the actual running server origin (auto-detects port)
  if (serverOrigin) {
    env.STORY_BASE_URL = serverOrigin;
  }

  try {
    const childProcess = spawn(cliCommand, args, {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows,
      env,
    });

    execution.process = childProcess;

    // Write prompt to stdin
    childProcess.stdin.write(prompt);
    childProcess.stdin.end();

    let lineBuffer = '';
    let resultEventEmitted = false;
    let initEventReceived = false;
    let assistantMessageCount = 0;
    const recentEventsWindow: CLIExecutionEvent[] = [];
    const WINDOW_SIZE = 20;
    const intentTracker = new IntentChainTracker(executionId);

    const trackAndAnalyze = (event: CLIExecutionEvent) => {
      recentEventsWindow.push(event);
      if (recentEventsWindow.length > WINDOW_SIZE) recentEventsWindow.shift();

      try {
        const signal = analyzeEvent(event, recentEventsWindow, execution.id);
        if (signal) {
          appendSignal(signal);
          store.pushSignal(executionId, signal);
        }
      } catch {
        // Signal analysis is non-critical — never block execution
      }

      // Track successful tool chains for predictive intent signals
      try {
        const intentSignal = intentTracker.processEvent(event);
        if (intentSignal) {
          appendIntentSignal(intentSignal);
          store.pushIntentSignal(executionId, intentSignal);
        }
      } catch {
        // Intent tracking is non-critical
      }
    };

    const processLine = (line: string) => {
      const parsed = parseStreamJsonLine(line);
      if (!parsed) return;

      if (parsed.type === 'system' && parsed.subtype === 'init') {
        initEventReceived = true;
        execution.sessionId = parsed.session_id;
        const event: CLIExecutionEvent = {
          type: 'init',
          data: {
            sessionId: parsed.session_id,
            tools: parsed.tools,
            model: parsed.model,
            cwd: parsed.cwd,
            version: parsed.claude_code_version,
          },
          timestamp: Date.now(),
        };
        emitEvent(event);
      } else if (parsed.type === 'assistant') {
        assistantMessageCount++;
        const textContent = extractTextContent(parsed);
        if (textContent) {
          const event: CLIExecutionEvent = {
            type: 'text',
            data: { content: textContent, model: parsed.message.model },
            timestamp: Date.now(),
          };
          emitEvent(event);
          trackAndAnalyze(event);
        }

        const toolUses = extractToolUses(parsed);
        for (const toolUse of toolUses) {
          const event: CLIExecutionEvent = {
            type: 'tool_use',
            data: { id: toolUse.id, name: toolUse.name, input: toolUse.input },
            timestamp: Date.now(),
          };
          emitEvent(event);
          trackAndAnalyze(event);
        }
      } else if (parsed.type === 'user') {
        const results = parsed.message.content.filter(c => c.type === 'tool_result');
        for (const result of results) {
          const event: CLIExecutionEvent = {
            type: 'tool_result',
            data: { toolUseId: result.tool_use_id, content: result.content },
            timestamp: Date.now(),
          };
          emitEvent(event);
          trackAndAnalyze(event);
        }
      } else if (parsed.type === 'result') {
        resultEventEmitted = true;
        execution.sessionId = parsed.result?.session_id || execution.sessionId;
        const event: CLIExecutionEvent = {
          type: 'result',
          data: {
            sessionId: parsed.result?.session_id,
            usage: parsed.result?.usage,
            durationMs: parsed.duration_ms,
            costUsd: parsed.cost_usd,
            isError: parsed.is_error,
          },
          timestamp: Date.now(),
        };
        emitEvent(event);
        trackAndAnalyze(event);

        // Flush any remaining intent chain at execution end
        try {
          const finalIntent = intentTracker.flush();
          if (finalIntent) {
            appendIntentSignal(finalIntent);
            store.pushIntentSignal(executionId, finalIntent);
          }
        } catch {
          // Intent flush is non-critical
        }

        // Run pattern detection at end of execution
        try {
          const signals = getSignals(Date.now() - 7 * 24 * 3600 * 1000);
          const patterns = detectPatterns(signals);
          savePatterns(patterns);
        } catch {
          // Pattern detection is non-critical
        }

        // Run intent pattern detection at end of execution
        try {
          const intentSignals = getIntentSignals(Date.now() - 30 * 24 * 3600 * 1000);
          const intentPatterns = detectIntentPatterns(intentSignals);
          saveIntentPatterns(intentPatterns);
        } catch {
          // Intent pattern detection is non-critical
        }

        // Flush buffered signals to disk before execution ends
        flushSignalBuffers().catch(() => {
          // Signal flush is non-critical
        });
      }
    };

    // Handle stdout (stream-json output)
    childProcess.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      logMessage(`[STDOUT] ${text.trim()}`);

      emitEvent({
        type: 'stdout',
        data: { raw: text },
        timestamp: Date.now(),
      });

      lineBuffer += text;
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() || '';

      for (const line of lines) {
        processLine(line);
      }
    });

    // Handle stderr — log everything, only forward actual errors to client
    childProcess.stderr.on('data', (data: Buffer) => {
      const text = data.toString().trim();
      if (!text) return;
      logMessage(`[STDERR] ${text}`);

      // Only forward lines that look like real errors (not MCP loading info, version strings, etc.)
      const isError = /\b(error|fatal|fail|exception|ENOENT|EACCES|EPERM)\b/i.test(text)
        && !/\b(mcp|loading|connected|server|version)\b/i.test(text);
      if (isError) {
        emitEvent({
          type: 'error',
          data: { message: text, error: text, source: 'stderr' },
          timestamp: Date.now(),
        });
      }
    });

    // Handle process exit
    childProcess.on('close', (code: number) => {
      if (lineBuffer.trim()) {
        logMessage(`[STDOUT-FINAL] ${lineBuffer.trim()}`);
        processLine(lineBuffer);
        lineBuffer = '';
      }

      const durationMs = Date.now() - execution.startTime;
      logMessage('');
      logMessage(`Process exited with code: ${code}`);
      logMessage(`Duration: ${durationMs}ms`);
      logMessage(`Init received: ${initEventReceived}, Assistant messages: ${assistantMessageCount}`);
      logMessage(`Result event emitted: ${resultEventEmitted}`);
      logMessage('=== Claude Terminal Execution Finished ===');
      closeLogStream();

      const endTime = Date.now();
      const finalStatus = code === 0 ? 'completed' as const : 'error' as const;
      store.updateStatus(executionId, finalStatus, {
        endTime,
        durationMs: endTime - execution.startTime,
      });

      if (code !== 0) {
        emitEvent({
          type: 'error',
          data: { exitCode: code, message: `Process exited with code ${code}` },
          timestamp: Date.now(),
        });
      } else if (!resultEventEmitted) {
        const shouldEmitSynthetic = initEventReceived && assistantMessageCount > 0 && durationMs > 5000;

        if (shouldEmitSynthetic) {
          logMessage('[SYNTHETIC] Emitting synthetic result event');
          emitEvent({
            type: 'result',
            data: {
              sessionId: execution.sessionId,
              isError: false,
              synthetic: true,
            },
            timestamp: Date.now(),
          });
        } else {
          logMessage(`[NO-SYNTHETIC] init=${initEventReceived}, msgs=${assistantMessageCount}, duration=${durationMs}ms`);
        }
      }
    });

    // Handle spawn errors
    childProcess.on('error', (err: Error) => {
      logMessage(`[ERROR] ${err.message}`);
      closeLogStream();

      store.updateStatus(executionId, 'error', { endTime: Date.now() });

      emitEvent({
        type: 'error',
        data: { message: err.message },
        timestamp: Date.now(),
      });
    });

    // Timeout after 100 minutes
    const timeoutHandle = setTimeout(() => {
      if (!childProcess.killed) {
        logMessage('[TIMEOUT] Execution exceeded 100 minutes, killing process...');
        childProcess.kill();
        store.updateStatus(executionId, 'error', { endTime: Date.now() });
        emitEvent({
          type: 'error',
          data: { message: 'Execution timed out after 100 minutes' },
          timestamp: Date.now(),
        });
      }
    }, 6000000);

    childProcess.on('close', () => {
      clearTimeout(timeoutHandle);
    });

  } catch (error) {
    logMessage(`[EXCEPTION] ${error instanceof Error ? error.message : String(error)}`);
    closeLogStream();

    store.updateStatus(executionId, 'error', { endTime: Date.now() });

    emitEvent({
      type: 'error',
      data: { message: error instanceof Error ? error.message : 'Unknown error' },
      timestamp: Date.now(),
    });
  }

  return executionId;
}

/**
 * Get execution by ID — delegates to ExecutionStore.
 */
export function getExecution(executionId: string): Execution | undefined {
  return getExecutionStore().get(executionId);
}

export function subscribeExecutionEvents(
  executionId: string,
  listener: (event: CLIExecutionEvent) => void,
): (() => void) | null {
  return getExecutionStore().subscribe(executionId, listener);
}

/**
 * Abort an execution — delegates to ExecutionStore.
 */
export function abortExecution(executionId: string): boolean {
  return getExecutionStore().abort(executionId);
}

/**
 * Get all active (running) executions.
 */
export function getActiveExecutions(): Execution[] {
  return getExecutionStore().getActive();
}

/**
 * Clean up completed executions older than specified age.
 */
export function cleanupExecutions(maxAgeMs: number = 3600000): void {
  getExecutionStore().cleanup(maxAgeMs);
}
