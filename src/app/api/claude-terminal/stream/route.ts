/**
 * Claude Terminal Stream API Route
 *
 * GET: Server-Sent Events stream for real-time CLI execution updates
 */

import { NextRequest } from 'next/server';
import {
  getExecution,
  startExecution,
  subscribeExecutionEvents,
  type CLIExecutionEvent,
} from '@/lib/claude-terminal/cli-service';
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
      const d = (e: CLIExecutionEvent) => e.data as Record<string, never>;

      const convertEvent = (cliEvent: CLIExecutionEvent): CLIEvent | null => {
        const data = d(cliEvent);
        switch (cliEvent.type) {
          case 'init':
            return {
              type: 'connected',
              data: {
                executionId: activeExecutionId,
                sessionId: data.sessionId,
                model: data.model,
                tools: data.tools,
                version: data.version,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'text':
            return {
              type: 'message',
              data: {
                type: 'assistant',
                content: data.content,
                model: data.model,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'tool_use':
            return {
              type: 'tool_use',
              data: {
                toolUseId: data.id,
                toolName: data.name,
                toolInput: data.input,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'tool_result':
            return {
              type: 'tool_result',
              data: {
                toolUseId: data.toolUseId,
                content: data.content,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'result':
            return {
              type: 'result',
              data: {
                sessionId: data.sessionId,
                usage: data.usage,
                durationMs: data.durationMs,
                totalCostUsd: data.costUsd,
                isError: data.isError,
              },
              timestamp: cliEvent.timestamp,
            };

          case 'error':
            return {
              type: 'error',
              data: {
                error: data.error || data.message || 'Unknown error',
                exitCode: data.exitCode,
              },
              timestamp: cliEvent.timestamp,
            };

          default:
            return null;
        }
      };

      const execution = getExecution(activeExecutionId!);
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

      const unsubscribe = subscribeExecutionEvents(activeExecutionId!, (event) => {
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
