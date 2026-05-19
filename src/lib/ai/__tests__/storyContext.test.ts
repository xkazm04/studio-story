import { describe, it, expect, vi } from 'vitest';

// Mock Supabase server to avoid env var dependency in unit tests
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

import { formatStoryContextForPrompt, type StoryContext } from '../storyContext';

function makeContext(overrides: Partial<StoryContext> = {}): StoryContext {
  return {
    premise: 'A young wizard discovers a hidden world beneath the city.',
    genre: 'Fantasy',
    setting: 'Modern urban with underground magical realm',
    characters: [
      { name: 'Elena', traits: 'Brave, curious, stubborn', role: 'Protagonist' },
      { name: 'Marcus', traits: 'Wise, secretive, protective', role: 'Mentor' },
    ],
    beats: [
      { name: 'Discovery', description: 'Elena finds the entrance' },
      { name: 'Training', description: 'Marcus teaches her magic' },
    ],
    priorSceneText: 'Elena walked through the dark alley, her footsteps echoing.',
    currentSceneTextBefore: 'The door creaked open, revealing a staircase leading down.',
    selectedText: 'She hesitated.',
    currentSceneTextAfter: 'Then she took the first step.',
    contextPins: [],
    ...overrides,
  };
}

describe('formatStoryContextForPrompt', () => {
  it('produces structured output with all sections', () => {
    const ctx = makeContext();
    const result = formatStoryContextForPrompt(ctx);

    expect(result).toContain('Premise');
    expect(result).toContain('Genre');
    expect(result).toContain('Setting');
    expect(result).toContain('Elena');
    expect(result).toContain('Marcus');
    expect(result).toContain('Discovery');
    expect(result).toContain('Training');
    expect(result).toContain('Prior Scene Text');
    expect(result).toContain('Current Scene');
    expect(result).toContain('She hesitated.');
  });

  it('includes selectedText within a clearly marked section', () => {
    const ctx = makeContext({ selectedText: 'This is the selected passage.' });
    const result = formatStoryContextForPrompt(ctx);
    expect(result).toContain('This is the selected passage.');
    expect(result).toContain('Selected Text');
  });

  it('handles empty prior scene text gracefully', () => {
    const ctx = makeContext({ priorSceneText: '' });
    const result = formatStoryContextForPrompt(ctx);
    // Should still produce valid output, just without prior scene content
    expect(result).toContain('Premise');
    expect(result).toContain('Elena');
  });

  it('handles empty characters array', () => {
    const ctx = makeContext({ characters: [] });
    const result = formatStoryContextForPrompt(ctx);
    expect(result).toContain('Premise');
  });
});

describe('token budgeting', () => {
  it('truncates very long priorSceneText while keeping selectedText and characters', () => {
    // Generate ~120K estimated tokens worth of prior scene text
    // At 0.75 words per token, 120K tokens ~ 90K words
    const longText = 'word '.repeat(90_000);
    const ctx = makeContext({ priorSceneText: longText });

    const result = formatStoryContextForPrompt(ctx);

    // selectedText and characters should be intact
    expect(result).toContain('She hesitated.');
    expect(result).toContain('Elena');
    expect(result).toContain('Marcus');

    // The total result should be smaller than the input
    // 80K tokens ~ 60K words ~ 300K characters approximately
    // The full longText alone is 450K characters, so result should be truncated
    const estimatedTokens = result.split(/\s+/).length / 0.75;
    expect(estimatedTokens).toBeLessThanOrEqual(85_000); // Some slack for formatting
  });
});
