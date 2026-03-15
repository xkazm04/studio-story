/**
 * GET /api/claude-terminal/sessions
 *
 * Returns all active CLI executions. Used by the advisor agent
 * to check how many sessions are running before spawning new ones.
 */

import { NextResponse } from 'next/server';
import { getActiveExecutions, getExecution } from '@/lib/claude-terminal/cli-service';

// Also expose a way to get ALL executions (not just running)
// by looking up specific IDs via query params
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('executionId');

  if (executionId) {
    const execution = getExecution(executionId);
    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: execution.id,
      status: execution.status,
      sessionId: execution.sessionId,
      startTime: execution.startTime,
      endTime: execution.endTime,
      eventCount: execution.events.length,
    });
  }

  const executions = getActiveExecutions();
  return NextResponse.json(
    executions.map((e) => ({
      id: e.id,
      status: e.status,
      sessionId: e.sessionId,
      startTime: e.startTime,
      endTime: e.endTime,
      eventCount: e.events.length,
    }))
  );
}
