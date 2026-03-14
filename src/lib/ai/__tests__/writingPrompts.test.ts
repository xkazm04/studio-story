import { describe, it, expect } from 'vitest';
import {
  WRITING_TOOL_PROMPTS,
  getSystemPrompt,
  type WritingToolType,
  type ContinueLength,
} from '../writingPrompts';

describe('writingPrompts', () => {
  const allTools: WritingToolType[] = [
    'continue',
    'rewrite',
    'expand',
    'showDontTell',
    'sensoryRewrite',
  ];

  it('has entries for all 5 tool types', () => {
    for (const tool of allTools) {
      expect(WRITING_TOOL_PROMPTS).toHaveProperty(tool);
    }
  });

  it('each tool type returns a non-empty string prompt via getSystemPrompt', () => {
    for (const tool of allTools) {
      const prompt = getSystemPrompt(tool, { length: 'paragraph' });
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(10);
    }
  });

  it('continue with different lengths produces different prompts', () => {
    const lengths: ContinueLength[] = ['sentence', 'paragraph', 'page'];
    const prompts = lengths.map((l) => getSystemPrompt('continue', { length: l }));
    // All three should be distinct
    expect(new Set(prompts).size).toBe(3);
  });

  it('continue without length defaults to paragraph', () => {
    const withDefault = getSystemPrompt('continue');
    const withParagraph = getSystemPrompt('continue', { length: 'paragraph' });
    expect(withDefault).toBe(withParagraph);
  });

  it('showDontTell prompt contains "show" and body language/sensory references', () => {
    const prompt = getSystemPrompt('showDontTell');
    expect(prompt.toLowerCase()).toContain('show');
    expect(
      prompt.toLowerCase().includes('body language') ||
        prompt.toLowerCase().includes('sensory') ||
        prompt.toLowerCase().includes('actions')
    ).toBe(true);
  });

  it('sensoryRewrite prompt contains "senses" or "sensory"', () => {
    const prompt = getSystemPrompt('sensoryRewrite');
    expect(
      prompt.toLowerCase().includes('senses') ||
        prompt.toLowerCase().includes('sensory')
    ).toBe(true);
  });

  it('rewrite and expand produce different prompts', () => {
    const rewrite = getSystemPrompt('rewrite');
    const expand = getSystemPrompt('expand');
    expect(rewrite).not.toBe(expand);
  });
});
