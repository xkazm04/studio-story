/**
 * GET /api/claude-terminal/sessions
 *
 * Returns all active CLI executions. Used by the advisor agent
 * to check how many sessions are running before spawning new ones.
 */

import { NextResponse } from 'next/server';
import { getExecutionStore } from '@/lib/claude-terminal/execution-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('executionId');
  const store = getExecutionStore();

  if (executionId) {
    const summary = store.getSummary(executionId);
    if (!summary) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }
    return NextResponse.json(summary);
  }

  return NextResponse.json(store.getActiveSummaries());
}
