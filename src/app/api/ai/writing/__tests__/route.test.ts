import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted to define mock functions that can be referenced in vi.mock factories
const { mockCreate, mockAssembleStoryContext, mockFormatContext } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockAssembleStoryContext: vi.fn(),
  mockFormatContext: vi.fn(),
}));

// Mock Supabase server before any imports that use it
vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null }),
          order: () => Promise.resolve({ data: [] }),
        }),
        in: () => ({
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    }),
  },
}));

// Mock the Anthropic SDK with a proper class constructor
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

// Mock assembleStoryContext to return predictable context
vi.mock('@/lib/ai/storyContext', () => ({
  assembleStoryContext: mockAssembleStoryContext,
  formatStoryContextForPrompt: mockFormatContext,
}));

import { POST, _resetClient } from '../route';

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/ai/writing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/ai/writing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetClient();
    process.env.ANTHROPIC_API_KEY = 'test-key';

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'Generated AI text result.' }],
    });

    mockAssembleStoryContext.mockResolvedValue({
      premise: 'A test premise',
      genre: 'Fantasy',
      setting: 'A test setting',
      characters: [{ name: 'Elena', traits: 'Brave', role: 'Protagonist' }],
      beats: [{ name: 'Opening', description: 'The beginning' }],
      priorSceneText: 'Prior text here.',
      currentSceneTextBefore: 'Text before selection.',
      selectedText: 'Selected text here.',
      currentSceneTextAfter: 'Text after selection.',
    });

    mockFormatContext.mockReturnValue('## Story Context\nFormatted context...');
  });

  it('returns 200 with result, tool, and originalText on valid request', async () => {
    const res = await POST(
      makeRequest({
        projectId: 'proj-1',
        sceneId: 'scene-1',
        tool: 'rewrite',
        selectedText: 'Original text.',
        selectionFrom: 10,
        selectionTo: 25,
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.result).toBe('Generated AI text result.');
    expect(json.tool).toBe('rewrite');
    expect(json.originalText).toBe('Original text.');
  });

  it('returns 400 for invalid tool type', async () => {
    const res = await POST(
      makeRequest({
        projectId: 'proj-1',
        sceneId: 'scene-1',
        tool: 'invalidTool',
        selectedText: 'Some text.',
        selectionFrom: 0,
        selectionTo: 10,
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid tool');
  });

  it('returns 400 when projectId is missing', async () => {
    const res = await POST(
      makeRequest({
        sceneId: 'scene-1',
        tool: 'rewrite',
        selectedText: 'Some text.',
        selectionFrom: 0,
        selectionTo: 10,
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('returns 400 when sceneId is missing', async () => {
    const res = await POST(
      makeRequest({
        projectId: 'proj-1',
        tool: 'rewrite',
        selectedText: 'Some text.',
        selectionFrom: 0,
        selectionTo: 10,
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('continue tool passes currentSceneTextBefore as user message', async () => {
    await POST(
      makeRequest({
        projectId: 'proj-1',
        sceneId: 'scene-1',
        tool: 'continue',
        selectedText: '',
        selectionFrom: 20,
        selectionTo: 20,
        options: { length: 'paragraph' },
      })
    );

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    // For continue, user message should contain the text before the cursor
    const userMsg = callArgs.messages.find((m: { role: string }) => m.role === 'user');
    expect(userMsg.content).toContain('Text before selection.');
  });

  it('rewrite tool passes selectedText as user message', async () => {
    await POST(
      makeRequest({
        projectId: 'proj-1',
        sceneId: 'scene-1',
        tool: 'rewrite',
        selectedText: 'Selected text here.',
        selectionFrom: 10,
        selectionTo: 28,
      })
    );

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const callArgs = mockCreate.mock.calls[0][0];
    const userMsg = callArgs.messages.find((m: { role: string }) => m.role === 'user');
    expect(userMsg.content).toContain('Selected text here.');
  });

  it('uses higher max_tokens for continue tool', async () => {
    await POST(
      makeRequest({
        projectId: 'proj-1',
        sceneId: 'scene-1',
        tool: 'continue',
        selectedText: '',
        selectionFrom: 20,
        selectionTo: 20,
        options: { length: 'page' },
      })
    );

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.max_tokens).toBe(4096);
  });

  it('uses lower max_tokens for transform tools', async () => {
    await POST(
      makeRequest({
        projectId: 'proj-1',
        sceneId: 'scene-1',
        tool: 'showDontTell',
        selectedText: 'She was angry.',
        selectionFrom: 0,
        selectionTo: 14,
      })
    );

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.max_tokens).toBe(2048);
  });

  it('calls assembleStoryContext with correct parameters', async () => {
    await POST(
      makeRequest({
        projectId: 'proj-1',
        sceneId: 'scene-1',
        tool: 'expand',
        selectedText: 'Short text.',
        selectionFrom: 5,
        selectionTo: 16,
      })
    );

    expect(mockAssembleStoryContext).toHaveBeenCalledWith('proj-1', 'scene-1', 5, 16);
  });
});
