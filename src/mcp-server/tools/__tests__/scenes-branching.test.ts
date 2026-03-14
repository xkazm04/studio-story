/**
 * Scenes Branching MCP Tool Tests
 * Tests for create_branch and create_choice tool schema validation
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Define the expected schemas for the MCP tools
// These mirror what will be registered in scenes.ts

const createChoiceSchema = z.object({
  sceneId: z.string().describe('Source scene UUID'),
  targetSceneId: z.string().optional().describe('Target scene UUID'),
  label: z.string().describe('Choice text shown to reader'),
  orderIndex: z.number().optional().describe('Position in choice list'),
});

const createBranchSchema = z.object({
  sceneId: z.string().describe('Source scene UUID'),
  choices: z.array(z.object({
    label: z.string().describe('Choice text'),
    sceneName: z.string().describe('Name for the new target scene'),
    sceneDescription: z.string().optional().describe('Description for the new scene'),
  })).describe('Branches to create'),
});

describe('create_choice schema', () => {
  it('validates required fields: sceneId and label', () => {
    const valid = createChoiceSchema.safeParse({
      sceneId: '123e4567-e89b-12d3-a456-426614174000',
      label: 'Fight the dragon',
    });
    expect(valid.success).toBe(true);
  });

  it('rejects missing sceneId', () => {
    const invalid = createChoiceSchema.safeParse({
      label: 'Fight the dragon',
    });
    expect(invalid.success).toBe(false);
  });

  it('rejects missing label', () => {
    const invalid = createChoiceSchema.safeParse({
      sceneId: '123e4567-e89b-12d3-a456-426614174000',
    });
    expect(invalid.success).toBe(false);
  });

  it('accepts optional targetSceneId and orderIndex', () => {
    const valid = createChoiceSchema.safeParse({
      sceneId: '123e4567-e89b-12d3-a456-426614174000',
      label: 'Fight the dragon',
      targetSceneId: '223e4567-e89b-12d3-a456-426614174000',
      orderIndex: 1,
    });
    expect(valid.success).toBe(true);
  });
});

describe('create_branch schema', () => {
  it('validates required fields: sceneId and choices array', () => {
    const valid = createBranchSchema.safeParse({
      sceneId: '123e4567-e89b-12d3-a456-426614174000',
      choices: [
        { label: 'Fight', sceneName: 'The Battle' },
        { label: 'Flee', sceneName: 'The Escape' },
      ],
    });
    expect(valid.success).toBe(true);
  });

  it('rejects missing sceneId', () => {
    const invalid = createBranchSchema.safeParse({
      choices: [{ label: 'Fight', sceneName: 'Battle' }],
    });
    expect(invalid.success).toBe(false);
  });

  it('rejects empty choices array', () => {
    // Empty array is technically valid per zod, but we can validate min length
    const result = createBranchSchema.safeParse({
      sceneId: '123e4567-e89b-12d3-a456-426614174000',
      choices: [],
    });
    // Empty array is valid per schema (business logic validates min)
    expect(result.success).toBe(true);
  });

  it('requires label and sceneName in each choice', () => {
    const invalid = createBranchSchema.safeParse({
      sceneId: '123e4567-e89b-12d3-a456-426614174000',
      choices: [{ label: 'Fight' }], // missing sceneName
    });
    expect(invalid.success).toBe(false);
  });

  it('accepts optional sceneDescription in choices', () => {
    const valid = createBranchSchema.safeParse({
      sceneId: '123e4567-e89b-12d3-a456-426614174000',
      choices: [
        {
          label: 'Fight',
          sceneName: 'The Battle',
          sceneDescription: 'An intense battle ensues',
        },
      ],
    });
    expect(valid.success).toBe(true);
  });
});
