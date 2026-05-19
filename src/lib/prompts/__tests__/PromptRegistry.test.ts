import { describe, it, expect, beforeEach } from 'vitest';
import type { Appearance } from '@/app/types/Character';
import { promptRegistry } from '../PromptRegistry';
import type { PromptGeneratorDef } from '../PromptRegistry';
// Import side-effect: registers all generators
import '../index';

// ============================================================================
// Test fixture
// ============================================================================

const testAppearance: Appearance = {
  gender: 'Female',
  age: 'Young',
  skinColor: 'Olive',
  bodyType: 'Athletic',
  height: 'Tall',
  face: {
    shape: 'Oval',
    eyeColor: 'Green',
    hairColor: 'Red',
    hairStyle: 'Braided',
    facialHair: '',
    features: 'Scar across left cheek',
  },
  clothing: {
    style: 'Leather armor',
    color: 'Dark brown',
    accessories: 'Silver pendant',
  },
  customFeatures: 'Glowing runes on arms',
};

// ============================================================================
// Registry basics
// ============================================================================

describe('PromptRegistry', () => {
  it('lists all registered generators', () => {
    const ids = promptRegistry.list();
    expect(ids).toContain('character.facial');
    expect(ids).toContain('character.clothing');
    expect(ids).toContain('character.full');
    expect(ids).toContain('character.fullBody');
    expect(ids).toContain('character.avatar');
    expect(ids).toContain('outfit.clothing');
    expect(ids).toContain('randomizer.character');
  });

  it('filters generators by entity type', () => {
    const charGens = promptRegistry.listByEntity('character');
    expect(charGens.length).toBeGreaterThanOrEqual(5);
    expect(charGens.every((g) => g.entityType === 'character')).toBe(true);
  });

  it('returns undefined for unknown generator', () => {
    expect(promptRegistry.get('nonexistent')).toBeUndefined();
  });

  it('throws when generating unknown ID', () => {
    expect(() => promptRegistry.generate('nonexistent', {})).toThrow(
      'Generator "nonexistent" not found'
    );
  });
});

// ============================================================================
// Character generators
// ============================================================================

describe('character.facial', () => {
  it('generates facial features prompt', () => {
    const result = promptRegistry.generate('character.facial', {
      appearance: testAppearance,
    });
    expect(result.text).toContain('oval face');
    expect(result.text).toContain('green eyes');
    expect(result.text).toContain('red braided hair');
    expect(result.text).toContain('scar across left cheek');
    expect(result.generatorId).toBe('character.facial');
    expect(Object.keys(result.resolvedDeps)).toHaveLength(0);
  });

  it('handles empty face fields', () => {
    const minimal: Appearance = {
      ...testAppearance,
      face: { shape: '', eyeColor: '', hairColor: '', hairStyle: '', facialHair: '', features: '' },
    };
    const result = promptRegistry.generate('character.facial', { appearance: minimal });
    expect(result.text).toBe('');
  });
});

describe('character.clothing', () => {
  it('generates clothing prompt', () => {
    const result = promptRegistry.generate('character.clothing', {
      appearance: testAppearance,
    });
    expect(result.text).toContain('wearing leather armor');
    expect(result.text).toContain('in dark brown');
    expect(result.text).toContain('with silver pendant');
  });
});

describe('character.full', () => {
  it('resolves dependencies on facial + clothing', () => {
    const result = promptRegistry.generate('character.full', {
      appearance: testAppearance,
    });
    // Should contain top-level attributes
    expect(result.text).toContain('female');
    expect(result.text).toContain('young');
    expect(result.text).toContain('olive skin');

    // Should contain resolved facial dep
    expect(result.text).toContain('green eyes');
    // Should contain resolved clothing dep
    expect(result.text).toContain('wearing leather armor');

    // Should have dependency entries
    expect(result.resolvedDeps['character.facial']).toBeDefined();
    expect(result.resolvedDeps['character.clothing']).toBeDefined();
  });
});

describe('character.fullBody', () => {
  it('generates full-body illustration prompt', () => {
    const result = promptRegistry.generate('character.fullBody', {
      appearance: testAppearance,
      archetype: 'ranger',
      pose: 'heroic',
      expression: 'determined',
      artStyle: 'fantasy oil painting',
    });
    expect(result.text).toContain('fantasy oil painting');
    expect(result.text).toContain('Full-body character illustration');
    expect(result.text).toContain('Wilderness expert');
    expect(result.text).toContain('heroic pose');
    expect(result.text).toContain('Focused and resolute');
    expect(result.text).toContain('professional illustration quality');
  });
});

describe('character.avatar', () => {
  it('generates avatar prompt', () => {
    const result = promptRegistry.generate('character.avatar', {
      appearance: testAppearance,
      avatarStyle: 'rpg',
      artStyle: 'pixel art',
    });
    expect(result.text).toContain('pixel art');
    expect(result.text).toContain('Classic RPG character portrait');
    expect(result.text).toContain('Character portrait');
    expect(result.text).toContain('detailed portrait');
  });
});

// ============================================================================
// Outfit generator
// ============================================================================

describe('outfit.clothing', () => {
  it('generates outfit prompt from wardrobe details', () => {
    const result = promptRegistry.generate('outfit.clothing', {
      outfit: {
        clothing: {
          top: { item: 'Tunic', color: 'Blue', material: 'Silk' },
          bottom: { item: 'Trousers', color: 'Black' },
          footwear: { item: 'Boots', color: 'Brown' },
          outerwear: { item: 'Cloak', color: 'Grey' },
          headwear: { item: 'Hood', color: 'Dark' },
          style_notes: 'rugged traveler look',
          overall_condition: 'worn',
        },
      },
      accessories: [
        { name: 'Ring', material: 'Gold', current_state: 'worn' },
        { name: 'Dagger', material: 'Steel', current_state: 'carried' },
      ],
    });
    expect(result.text).toContain('wearing silk blue tunic');
    expect(result.text).toContain('black trousers');
    expect(result.text).toContain('brown boots');
    expect(result.text).toContain('with grey cloak');
    expect(result.text).toContain('dark hood');
    expect(result.text).toContain('gold ring');
    // 'carried' state should NOT be included
    expect(result.text).not.toContain('dagger');
    expect(result.text).toContain('rugged traveler look');
    expect(result.text).toContain('(worn condition)');
  });

  it('omits pristine condition', () => {
    const result = promptRegistry.generate('outfit.clothing', {
      outfit: {
        clothing: {
          top: { item: 'Shirt' },
          overall_condition: 'pristine',
        },
      },
    });
    expect(result.text).not.toContain('pristine');
  });
});

// ============================================================================
// Randomizer generator
// ============================================================================

describe('randomizer.character', () => {
  it('generates Ollama prompt with genre', () => {
    const result = promptRegistry.generate('randomizer.character', {
      genre: 'sci-fi',
      projectContext: { title: 'StarQuest' },
    });
    expect(result.text).toContain('sci-fi');
    expect(result.text).toContain('StarQuest');
    expect(result.text).toContain('Return ONLY a valid JSON');
  });

  it('defaults to fantasy genre', () => {
    const result = promptRegistry.generate('randomizer.character', {});
    expect(result.text).toContain('fantasy');
  });
});

// ============================================================================
// Dependency graph
// ============================================================================

describe('getDependencyTree', () => {
  it('returns topological order for character.full', () => {
    const tree = promptRegistry.getDependencyTree('character.full');
    expect(tree).toEqual(['character.facial', 'character.clothing', 'character.full']);
  });

  it('returns single node for leaf generator', () => {
    const tree = promptRegistry.getDependencyTree('character.facial');
    expect(tree).toEqual(['character.facial']);
  });
});

// ============================================================================
// Custom generator registration
// ============================================================================

describe('register / unregister', () => {
  const customDef: PromptGeneratorDef<{ name: string }> = {
    id: 'test.custom',
    entityType: 'character',
    description: 'Test generator',
    inputFields: [{ path: 'name' }],
    dependencies: [],
    outputFormat: 'comma-separated',
    generate: ({ name }) => `hello ${name}`,
  };

  it('registers and generates', () => {
    promptRegistry.register(customDef);
    const result = promptRegistry.generate('test.custom', { name: 'world' });
    expect(result.text).toBe('hello world');
    promptRegistry.unregister('test.custom');
  });

  it('unregister removes the generator', () => {
    promptRegistry.register(customDef);
    promptRegistry.unregister('test.custom');
    expect(promptRegistry.get('test.custom')).toBeUndefined();
  });
});
