/**
 * Unit Tests for Prompt Assembly Module
 *
 * Tests assembleIllustrationPrompt and buildControlnets functions
 * for the scene illustration pipeline.
 */

import { describe, it, expect } from 'vitest';
import {
  assembleIllustrationPrompt,
  buildControlnets,
  type PromptAssemblyInput,
} from './prompt-assembly';
import type { ParsedSceneContext, DetectedSetting, DetectedMood, CharacterPresence } from '@/lib/image/SceneParser';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSetting(overrides: Partial<DetectedSetting> = {}): DetectedSetting {
  return {
    location: 'ancient forest',
    timeOfDay: 'evening',
    weather: 'foggy',
    interior: false,
    lighting: 'golden hour lighting',
    ...overrides,
  };
}

function makeMood(overrides: Partial<DetectedMood> = {}): DetectedMood {
  return {
    primary: 'mysterious',
    intensity: 3,
    emotionalTone: 'enigmatic',
    colorSuggestions: ['deep purple', 'midnight blue'],
    ...overrides,
  };
}

function makeCharacter(name: string, overrides: Partial<CharacterPresence> = {}): CharacterPresence {
  return {
    characterId: `char-${name.toLowerCase()}`,
    name,
    position: 'midground',
    ...overrides,
  };
}

function makeContext(overrides: Partial<ParsedSceneContext> = {}): ParsedSceneContext {
  return {
    sceneId: 'scene-1',
    sceneName: 'The Dark Forest',
    visualElements: [],
    characters: [makeCharacter('Elara', { action: 'walking', emotion: 'determined', position: 'foreground' })],
    setting: makeSetting(),
    mood: makeMood(),
    dramaticTension: 3,
    rawDescription: 'Elara walks through the dark forest at evening.',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// assembleIllustrationPrompt
// ---------------------------------------------------------------------------

describe('assembleIllustrationPrompt', () => {
  it('with art style prepends style to output prompt', () => {
    const input: PromptAssemblyInput = {
      scene: makeContext(),
      artStylePrompt: 'watercolor illustration, soft edges',
    };
    const result = assembleIllustrationPrompt(input);
    // Art style should appear at the beginning
    expect(result.startsWith('watercolor illustration, soft edges')).toBe(true);
  });

  it('with characters includes character names and actions', () => {
    const input: PromptAssemblyInput = {
      scene: makeContext({
        characters: [
          makeCharacter('Elara', { action: 'fighting', position: 'foreground' }),
          makeCharacter('Kael', { action: 'defending', position: 'midground' }),
        ],
      }),
      artStylePrompt: null,
    };
    const result = assembleIllustrationPrompt(input);
    expect(result).toContain('Elara');
    expect(result).toContain('fighting');
    expect(result).toContain('Kael');
    expect(result).toContain('defending');
  });

  it('with setting includes location, time of day, weather', () => {
    const input: PromptAssemblyInput = {
      scene: makeContext(),
      artStylePrompt: null,
    };
    const result = assembleIllustrationPrompt(input);
    expect(result).toContain('ancient forest');
    expect(result).toContain('evening');
    expect(result).toContain('foggy');
  });

  it('with mood includes mood atmosphere', () => {
    const input: PromptAssemblyInput = {
      scene: makeContext(),
      artStylePrompt: null,
    };
    const result = assembleIllustrationPrompt(input);
    expect(result).toContain('mysterious');
  });

  it('always appends quality tags', () => {
    const input: PromptAssemblyInput = {
      scene: makeContext(),
      artStylePrompt: null,
    };
    const result = assembleIllustrationPrompt(input);
    expect(result).toContain('masterpiece');
    expect(result).toContain('best quality');
    expect(result).toContain('highly detailed');
  });

  it('total output is under 1500 chars', () => {
    // Create a very long input
    const longArtStyle = 'detailed digital painting style, '.repeat(50);
    const input: PromptAssemblyInput = {
      scene: makeContext({
        rawDescription: 'A very long description. '.repeat(100),
      }),
      artStylePrompt: longArtStyle,
    };
    const result = assembleIllustrationPrompt(input);
    expect(result.length).toBeLessThanOrEqual(1500);
  });

  it('with no art style still produces valid prompt', () => {
    const input: PromptAssemblyInput = {
      scene: makeContext(),
      artStylePrompt: null,
    };
    const result = assembleIllustrationPrompt(input);
    expect(result.length).toBeGreaterThan(0);
    // Should still have setting, characters, mood, quality tags
    expect(result).toContain('ancient forest');
    expect(result).toContain('masterpiece');
  });

  it('limits to 3 characters max in prompt text', () => {
    const input: PromptAssemblyInput = {
      scene: makeContext({
        characters: [
          makeCharacter('Elara', { position: 'foreground' }),
          makeCharacter('Kael', { position: 'foreground' }),
          makeCharacter('Mira', { position: 'midground' }),
          makeCharacter('Zara', { position: 'background' }),
          makeCharacter('Theron', { position: 'background' }),
        ],
      }),
      artStylePrompt: null,
    };
    const result = assembleIllustrationPrompt(input);
    // Only 3 characters should appear
    const charNames = ['Elara', 'Kael', 'Mira', 'Zara', 'Theron'];
    const presentNames = charNames.filter((name) => result.includes(name));
    expect(presentNames.length).toBeLessThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// buildControlnets
// ---------------------------------------------------------------------------

describe('buildControlnets', () => {
  it('with character ref images returns controlnet with preprocessorId 133', () => {
    const result = buildControlnets({
      characterRefIds: [{ leonardoImageId: 'img-1' }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].preprocessorId).toBe(133);
    expect(result[0].initImageId).toBe('img-1');
    expect(result[0].initImageType).toBe('UPLOADED');
    expect(result[0].strengthType).toBe('Mid');
  });

  it('with style ref image returns controlnet with preprocessorId 67', () => {
    const result = buildControlnets({
      styleRefId: 'style-img-1',
    });
    expect(result).toHaveLength(1);
    expect(result[0].preprocessorId).toBe(67);
    expect(result[0].initImageId).toBe('style-img-1');
    expect(result[0].initImageType).toBe('UPLOADED');
    expect(result[0].strengthType).toBe('High');
  });

  it('with both character and style refs returns combined array', () => {
    const result = buildControlnets({
      characterRefIds: [{ leonardoImageId: 'char-1' }, { leonardoImageId: 'char-2' }],
      styleRefId: 'style-1',
    });
    // 2 character refs + 1 style ref = 3
    expect(result).toHaveLength(3);
    const charRefs = result.filter((r) => r.preprocessorId === 133);
    const styleRefs = result.filter((r) => r.preprocessorId === 67);
    expect(charRefs).toHaveLength(2);
    expect(styleRefs).toHaveLength(1);
  });

  it('with no refs returns empty array', () => {
    const result = buildControlnets({});
    expect(result).toEqual([]);
  });

  it('limits to 2 character references max', () => {
    const result = buildControlnets({
      characterRefIds: [
        { leonardoImageId: 'c1' },
        { leonardoImageId: 'c2' },
        { leonardoImageId: 'c3' },
        { leonardoImageId: 'c4' },
      ],
    });
    const charRefs = result.filter((r) => r.preprocessorId === 133);
    expect(charRefs).toHaveLength(2);
  });
});
