/**
 * Claude Terminal Query API Route
 *
 * POST: Start a new CLI execution with prompt
 * DELETE: Abort an ongoing execution
 * GET: Get execution status
 */

import { NextRequest, NextResponse } from 'next/server';
import { startExecution } from '@/lib/claude-terminal/cli-service';
import { getExecutionStore } from '@/lib/claude-terminal/execution-store';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

interface QueryRequestBody {
  projectPath?: string; // Deprecated: server uses process.cwd()
  projectId?: string;   // Story project ID — passed to MCP server as STORY_PROJECT_ID
  prompt: string;
  resumeSessionId?: string;
}

/**
 * POST: Start a new CLI execution
 */
export const POST = withApiHandler('POST /api/claude-terminal/query', async (request: NextRequest) => {
    const body = (await request.json()) as QueryRequestBody;
    const { prompt, resumeSessionId, projectId } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Always use server's working directory — CLI runs on the same machine
    const projectPath = process.cwd();

    // Extract the server origin from the incoming request (e.g. http://localhost:3001)
    const serverOrigin = new URL(request.url).origin;

    const executionId = startExecution(projectPath, prompt, resumeSessionId, undefined, projectId, serverOrigin);

    return NextResponse.json({
      success: true,
      executionId,
      streamUrl: `/api/claude-terminal/stream?executionId=${executionId}`,
    });
});

/**
 * DELETE: Abort an ongoing execution
 */
export const DELETE = withApiHandler('DELETE /api/claude-terminal/query', async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      );
    }

    const store = getExecutionStore();
    if (!store.has(executionId)) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    const aborted = store.abort(executionId);

    return NextResponse.json({
      success: aborted,
      message: aborted ? 'Execution aborted' : 'Failed to abort execution',
    });
});

/**
 * GET: Get execution status
 */
export const GET = withApiHandler('GET /api/claude-terminal/query', async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      );
    }

    const store = getExecutionStore();
    const summary = store.getSummary(executionId);
    if (!summary) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      execution: summary,
    });
});
