/**
 * POST /api/ai/writing
 * AI writing tools endpoint: continue, rewrite, expand, show-dont-tell, sensory rewrite
 *
 * Accepts a text selection, tool type, and story context identifiers.
 * Assembles full story context with token budgeting, then calls Claude
 * with specialized fiction writing prompts.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { assembleStoryContext, formatStoryContextForPrompt } from '@/lib/ai/storyContext';
import { getSystemPrompt, type WritingToolType, type ContinueLength } from '@/lib/ai/writingPrompts';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

// ── Types ────────────────────────────────────────────────────────────────────

interface WritingRequest {
  projectId: string;
  sceneId: string;
  tool: WritingToolType;
  selectedText: string;
  selectionFrom: number;
  selectionTo: number;
  options?: {
    length?: ContinueLength;
  };
}

const VALID_TOOLS: WritingToolType[] = [
  'continue',
  'rewrite',
  'expand',
  'showDontTell',
  'sensoryRewrite',
];

/** Tools that append new content (higher token budget) */
const APPEND_TOOLS: WritingToolType[] = ['continue', 'expand'];

// ── Client ───────────────────────────────────────────────────────────────────

let cachedClient: InstanceType<typeof Anthropic> | null = null;

function getClient(): InstanceType<typeof Anthropic> | null {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

/** Reset cached client (for testing) */
export function _resetClient() {
  cachedClient = null;
}

// ── Route Handler ────────────────────────────────────────────────────────────

export const POST = withApiHandler('POST /api/ai/writing', async (request: NextRequest) => {
    const body: WritingRequest = await request.json();
    const { projectId, sceneId, tool, selectedText, selectionFrom, selectionTo, options } = body;

    // ── Validation (before client creation) ──────────────────────────────

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    if (!sceneId) {
      return NextResponse.json(
        { error: 'sceneId is required' },
        { status: 400 }
      );
    }

    if (!tool || !VALID_TOOLS.includes(tool)) {
      return NextResponse.json(
        { error: `Invalid tool type: "${tool}". Valid tools: ${VALID_TOOLS.join(', ')}` },
        { status: 400 }
      );
    }

    // ── Get Client ───────────────────────────────────────────────────────

    const client = getClient();
    if (!client) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env.local.' },
        { status: 503 }
      );
    }

    // ── Assemble Context ─────────────────────────────────────────────────

    const storyContext = await assembleStoryContext(
      projectId,
      sceneId,
      selectionFrom ?? 0,
      selectionTo ?? 0
    );

    const contextPrompt = formatStoryContextForPrompt(storyContext);
    const toolPrompt = getSystemPrompt(tool, options);

    // ── Determine User Message ───────────────────────────────────────────

    let userMessage: string;

    if (tool === 'continue') {
      // Continue tool: use text leading up to cursor position
      // The AI should generate NEW text that continues from this point
      const textBefore = storyContext.currentSceneTextBefore;
      const sel = storyContext.selectedText;
      userMessage = sel ? `${textBefore}${sel}` : textBefore;
    } else {
      // Transform tools (rewrite, expand, showDontTell, sensoryRewrite):
      // use the selected text as input -- result replaces the selection
      userMessage = selectedText || storyContext.selectedText;
    }

    // ── Call Claude ──────────────────────────────────────────────────────

    const maxTokens = APPEND_TOOLS.includes(tool) ? 4096 : 2048;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: `${contextPrompt}\n\n---\n\n${toolPrompt}`,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === 'text');
    const result = textBlock && 'text' in textBlock ? textBlock.text : '';

    return NextResponse.json({
      result,
      tool,
      originalText: selectedText ?? '',
    });
});
