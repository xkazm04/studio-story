import { describe, it, expect } from 'vitest';
import { validateScriptBlocks, type ValidatableBlock } from '../validator';

function block(overrides: Partial<ValidatableBlock> & Pick<ValidatableBlock, 'type'>): ValidatableBlock {
  return { content: 'some content', ...overrides };
}

describe('validateScriptBlocks', () => {
  it('returns valid for a well-formed script', () => {
    const blocks: ValidatableBlock[] = [
      block({ type: 'scene-header', content: 'INT. OFFICE - DAY' }),
      block({ type: 'description', content: 'A tidy desk near the window.' }),
      block({ type: 'actor', content: 'ALICE' }),
      block({ type: 'dialogue', content: 'Hello!', speaker: 'ALICE' }),
      block({ type: 'direction', content: 'pauses' }),
    ];

    const result = validateScriptBlocks(blocks);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  // --- scene-header ---

  it('errors on empty scene-header', () => {
    const result = validateScriptBlocks([block({ type: 'scene-header', content: '' })]);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].rule).toBe('empty-scene-header');
    expect(result.errors[0].blockIndex).toBe(0);
  });

  it('errors on whitespace-only scene-header', () => {
    const result = validateScriptBlocks([block({ type: 'scene-header', content: '   ' })]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].rule).toBe('empty-scene-header');
  });

  // --- dialogue ---

  it('errors on dialogue missing speaker', () => {
    const result = validateScriptBlocks([block({ type: 'dialogue', content: 'Hello!' })]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].rule).toBe('missing-speaker');
  });

  it('errors on dialogue with whitespace-only speaker', () => {
    const result = validateScriptBlocks([block({ type: 'dialogue', content: 'Hi', speaker: '  ' })]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].rule).toBe('missing-speaker');
  });

  it('warns on empty dialogue content', () => {
    const result = validateScriptBlocks([block({ type: 'dialogue', content: '', speaker: 'BOB' })]);
    expect(result.valid).toBe(true); // warnings don't make it invalid
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].rule).toBe('empty-dialogue');
    expect(result.warnings[0].message).toContain('BOB');
  });

  // --- actor ---

  it('errors on empty actor block', () => {
    const result = validateScriptBlocks([block({ type: 'actor', content: '' })]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].rule).toBe('empty-actor');
  });

  // --- direction (parenthetical) ---

  it('errors when direction has no preceding actor or dialogue', () => {
    const result = validateScriptBlocks([block({ type: 'direction', content: 'sighs' })]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].rule).toBe('orphaned-direction');
  });

  it('errors when direction follows a scene-header', () => {
    const blocks: ValidatableBlock[] = [
      block({ type: 'scene-header', content: 'INT. ROOM' }),
      block({ type: 'direction', content: 'sighs' }),
    ];
    const result = validateScriptBlocks(blocks);
    expect(result.valid).toBe(false);
    expect(result.errors[0].rule).toBe('orphaned-direction');
  });

  it('allows direction after actor', () => {
    const blocks: ValidatableBlock[] = [
      block({ type: 'actor', content: 'ALICE' }),
      block({ type: 'direction', content: 'nervously' }),
    ];
    const result = validateScriptBlocks(blocks);
    expect(result.valid).toBe(true);
  });

  it('allows direction after dialogue', () => {
    const blocks: ValidatableBlock[] = [
      block({ type: 'dialogue', content: 'Well...', speaker: 'ALICE' }),
      block({ type: 'direction', content: 'trails off' }),
    ];
    const result = validateScriptBlocks(blocks);
    expect(result.valid).toBe(true);
  });

  it('warns on empty direction', () => {
    const blocks: ValidatableBlock[] = [
      block({ type: 'actor', content: 'ALICE' }),
      block({ type: 'direction', content: '' }),
    ];
    const result = validateScriptBlocks(blocks);
    expect(result.valid).toBe(true);
    expect(result.warnings[0].rule).toBe('empty-direction');
  });

  // --- description / content ---

  it('warns on empty description block', () => {
    const result = validateScriptBlocks([block({ type: 'description', content: '' })]);
    expect(result.valid).toBe(true);
    expect(result.warnings[0].rule).toBe('empty-content');
  });

  it('warns on empty content block', () => {
    const result = validateScriptBlocks([block({ type: 'content', content: '' })]);
    expect(result.valid).toBe(true);
    expect(result.warnings[0].rule).toBe('empty-content');
  });

  // --- multiple errors ---

  it('collects multiple errors across blocks', () => {
    const blocks: ValidatableBlock[] = [
      block({ type: 'scene-header', content: '' }),
      block({ type: 'dialogue', content: 'hello' }), // missing speaker
      block({ type: 'direction', content: 'sighs' }), // follows dialogue so OK for orphan
      block({ type: 'actor', content: '' }),
    ];

    const result = validateScriptBlocks(blocks);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);

    const rules = result.errors.map(e => e.rule);
    expect(rules).toContain('empty-scene-header');
    expect(rules).toContain('missing-speaker');
    expect(rules).toContain('empty-actor');
  });

  // --- empty array ---

  it('returns valid for empty block array', () => {
    const result = validateScriptBlocks([]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
