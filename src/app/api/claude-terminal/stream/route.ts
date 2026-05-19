/**
 * Claude Terminal Stream API Route
 *
 * GET: Server-Sent Events stream for real-time CLI execution updates
 */

import { NextRequest } from 'next/server';
import { startExecution, type CLIExecutionEvent } from '@/lib/claude-terminal/cli-service';
import { getExecutionStore } from '@/lib/claude-terminal/execution-store';
import { type CLIEvent, encodeEvent } from '@/cli/protocol';

/**
 * GET: Stream execution events via SSE
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('executionId');

  // For direct prompt execution (without pre-created execution)
  const projectPath = searchParams.get('projectPath');
  const prompt = searchParams.get('prompt');
  const resumeSessionId = searchParams.get('resumeSessionId');

  let activeExecutionId = executionId;

  // If no execution ID, start a new one
  if (!activeExecutionId && projectPath && prompt) {
    activeExecutionId = startExecution(
      decodeURIComponent(projectPath),
      decodeURIComponent(prompt),
      resumeSessionId ? decodeURIComponent(resumeSessionId) : undefined
    );
  }

  if (!activeExecutionId) {
    return new Response('Execution ID or (projectPath + prompt) required', { status: 400 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  let isStreamClosed = false;
  let lastEventIndex = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: CLIEvent) => {
        if (isStreamClosed) return;

        try {
          const data = `data: ${encodeEvent(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          isStreamClosed = true;
        }
      };

      // Send initial connected event
      sendEvent({
        type: 'connected',
        data: { executionId: activeExecutionId },
        timestamp: Date.now(),
      });

      // Convert CLI execution events to typed protocol events
      const convertEvent = (cliEvent: CLIExecutionEvent): CLIEvent | null => {
        switch (cliEvent.type) {
          case 'init':
            return {
              type: 'connected',
              data: {
                executionId: activeExecutionId,
                sessionId: cliEvent.data.sessionId,
                model: cliEvent.data.model,
                tools: cliEvent.data.tools,
                version: cliEvent.data.version,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'text':
            return {
              type: 'message',
              data: {
                type: 'assistant',
                content: cliEvent.data.content,
                model: cliEvent.data.model,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'tool_use':
            return {
              type: 'tool_use',
              data: {
                toolUseId: cliEvent.data.id,
                toolName: cliEvent.data.name,
                toolInput: cliEvent.data.input,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'tool_result':
            return {
              type: 'tool_result',
              data: {
                toolUseId: cliEvent.data.toolUseId,
                content: cliEvent.data.content,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'result':
            return {
              type: 'result',
              data: {
                sessionId: cliEvent.data.sessionId,
                usage: cliEvent.data.usage
                  ? { inputTokens: cliEvent.data.usage.input_tokens, outputTokens: cliEvent.data.usage.output_tokens }
                  : undefined,
                durationMs: cliEvent.data.durationMs,
                totalCostUsd: cliEvent.data.costUsd,
                isError: cliEvent.data.isError,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'error':
            return {
              type: 'error',
              data: {
                error: cliEvent.data.error || cliEvent.data.message || 'Unknown error',
                exitCode: cliEvent.data.exitCode,
              },
              timestamp: cliEvent.timestamp,
            };

          default:
            return null;
        }
      };

      const store = getExecutionStore();
      const execution = store.get(activeExecutionId!);
      if (!execution) {
        sendEvent({ type: 'error', data: { error: 'Execution not found' }, timestamp: Date.now() });
        controller.close();
        return;
      }

      const existingEvents = execution.events.slice(lastEventIndex);
      for (const event of existingEvents) {
        const converted = convertEvent(event);
        if (!converted) continue;
        sendEvent(converted);
        if (event.type === 'result' || event.type === 'error') {
          isStreamClosed = true;
          controller.close();
          return;
        }
      }
      lastEventIndex = execution.events.length;

      const unsubscribe = store.subscribe(activeExecutionId!, (event) => {
        if (isStreamClosed) return;
        const converted = convertEvent(event);
        if (!converted) return;
        sendEvent(converted);
        if (event.type === 'result' || event.type === 'error') {
          isStreamClosed = true;
          unsubscribe?.();
          controller.close();
        }
      });

      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        if (isStreamClosed) {
          clearInterval(heartbeatInterval);
          return;
        }

        try {
          const hb = `data: ${JSON.stringify({ type: 'heartbeat', data: { executionId: activeExecutionId }, timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(hb));
        } catch {
          isStreamClosed = true;
          clearInterval(heartbeatInterval);
          unsubscribe?.();
        }
      }, 15000);
    },

    cancel() {
      isStreamClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
