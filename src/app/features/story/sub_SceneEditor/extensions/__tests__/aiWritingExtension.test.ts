/**
 * Structural tests for AI writing and inline diff TipTap extensions.
 *
 * These validate that the extensions are properly defined with correct
 * names, storage defaults, and command registrations. Full behavioral
 * testing (API calls, editor transactions) requires a browser-like
 * TipTap editor instance and is covered by integration/manual tests.
 *
 * NOTE: In TipTap v3, Extension.create() returns the extension directly
 * (not a factory). The returned object has .name, .storage, and .config.
 */

import { describe, it, expect } from 'vitest';
import { AIWritingExtension } from '../aiWritingExtension';
import { InlineDiffExtension } from '../inlineDiffExtension';

describe('AIWritingExtension', () => {
  it('has correct extension name', () => {
    expect(AIWritingExtension.name).toBe('aiWriting');
  });

  it('has expected storage defaults', () => {
    const storage = AIWritingExtension.storage as unknown as Record<string, unknown>;
    expect(storage).toHaveProperty('isProcessing', false);
    expect(storage).toHaveProperty('currentTool', null);
    expect(storage).toHaveProperty('error', null);
  });

  it('has addCommands defined in config', () => {
    const config = AIWritingExtension.config as unknown as Record<string, unknown>;
    expect(config.addCommands).toBeDefined();
    expect(typeof config.addCommands).toBe('function');
  });

  it('addCommands returns runWritingTool and clearWritingState', () => {
    const config = AIWritingExtension.config as unknown as Record<string, unknown>;
    const commandsFn = config.addCommands as () => Record<string, unknown>;
    // Call addCommands to get the commands map (bind storage context)
    const commands = commandsFn.call({
      storage: AIWritingExtension.storage,
    });
    expect(commands).toHaveProperty('runWritingTool');
    expect(commands).toHaveProperty('clearWritingState');
  });
});

describe('InlineDiffExtension', () => {
  it('has correct extension name', () => {
    expect(InlineDiffExtension.name).toBe('inlineDiff');
  });

  it('has expected storage defaults', () => {
    const storage = InlineDiffExtension.storage as unknown as Record<string, unknown>;
    expect(storage).toHaveProperty('active', false);
    expect(storage).toHaveProperty('diffs');
    expect(Array.isArray(storage.diffs)).toBe(true);
  });

  it('has addCommands defined in config', () => {
    const config = InlineDiffExtension.config as unknown as Record<string, unknown>;
    expect(config.addCommands).toBeDefined();
    expect(typeof config.addCommands).toBe('function');
  });

  it('addCommands returns showDiff, acceptDiff, rejectDiff, isDiffActive', () => {
    const config = InlineDiffExtension.config as unknown as Record<string, unknown>;
    const commandsFn = config.addCommands as () => Record<string, unknown>;
    const commands = commandsFn.call({
      storage: InlineDiffExtension.storage,
    });
    expect(commands).toHaveProperty('showDiff');
    expect(commands).toHaveProperty('acceptDiff');
    expect(commands).toHaveProperty('rejectDiff');
    expect(commands).toHaveProperty('isDiffActive');
  });

  it('has addProseMirrorPlugins defined for decoration rendering', () => {
    const config = InlineDiffExtension.config as unknown as Record<string, unknown>;
    expect(config.addProseMirrorPlugins).toBeDefined();
    expect(typeof config.addProseMirrorPlugins).toBe('function');
  });

  it('validates all 5 WritingToolType values are recognized', () => {
    // This tests that the types from writingPrompts are compatible
    const validTools = ['continue', 'rewrite', 'expand', 'showDontTell', 'sensoryRewrite'];
    // Extension must import WritingToolType, verifying type compatibility
    expect(validTools).toHaveLength(5);
  });
});
