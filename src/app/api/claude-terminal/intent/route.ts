/**
 * POST /api/claude-terminal/intent
 *
 * Bridges the LLM transport contract to the persistent Claude CLI session.
 * Accepts serialized context from the @dzin/core transport layer and returns
 * an LLMResponse-shaped JSON response.
 */

import { NextResponse } from 'next/server';
import { getOrCreateSession } from '@/lib/claude-terminal/persistent-session';

interface IntentRequestBody {
  context: string;
}

interface LLMResponseShape {
  status: 'resolved' | 'error';
  patches?: unknown[];
  description?: string;
  error?: string;
}

export async function POST(request: Request): Promise<NextResponse<LLMResponseShape>> {
  try {
    const body = (await request.json()) as IntentRequestBody;

    if (!body.context || typeof body.context !== 'string') {
      return NextResponse.json(
        { status: 'error', error: 'Missing or invalid "context" field in request body' },
        { status: 400 },
      );
    }

    const session = getOrCreateSession(process.cwd());
    const cliResponse = await session.send(body.context);

    // Parse the CLI response text for JSON patch operations if present
    let patches: unknown[] | undefined;
    let description = cliResponse.text;

    // Try to extract structured patches from tool results
    if (cliResponse.toolResults) {
      for (const tr of cliResponse.toolResults) {
        if (tr.name === 'apply_patches' && Array.isArray(tr.result)) {
          patches = tr.result;
        }
      }
    }

    return NextResponse.json({
      status: 'resolved',
      patches,
      description,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Return 200 with error status — transport layer handles error routing
    return NextResponse.json({
      status: 'error',
      error: message,
    });
  }
}
