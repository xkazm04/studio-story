/**
 * GET /api/claude-terminal/suggestions
 *
 * Returns frequency-ranked narrative action suggestions based on the author's
 * historical tool chain patterns. Optionally filters by a recent tool name
 * to predict what should happen next.
 *
 * Query params:
 *   ?tool=<toolName>  — filter suggestions relevant to a recently-used tool
 *   ?limit=<number>   — max suggestions to return (default 10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIntentSignals, getIntentPatterns } from '@/lib/claude-terminal/signals/signal-store';
import { detectIntentPatterns, suggestNextActions } from '@/lib/claude-terminal/signals/intent-detector';
import type { IntentPattern } from '@/lib/claude-terminal/signals/signal-types';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

interface SuggestionsResponse {
  success: boolean;
  suggestions: IntentPattern[];
  totalSignals: number;
  error?: string;
}

export const GET = withApiHandler('GET /api/claude-terminal/suggestions', async (request: NextRequest): Promise<NextResponse<SuggestionsResponse>> => {
    const { searchParams } = request.nextUrl;
    const recentTool = searchParams.get('tool') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10) || 10, 50);

    // Get intent signals from last 30 days
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const signals = getIntentSignals(since);

    // Build fresh patterns from signals
    const allPatterns = detectIntentPatterns(signals, 50);

    let suggestions: IntentPattern[];

    if (recentTool) {
      // Filter to patterns that include the recent tool and suggest what's next
      suggestions = suggestNextActions(recentTool, allPatterns, limit);
    } else {
      suggestions = allPatterns.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      suggestions,
      totalSignals: signals.length,
    });
});
