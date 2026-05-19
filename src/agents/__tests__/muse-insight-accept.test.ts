import { describe, it, expect } from 'vitest';
import { analyzeStory, type StorySnapshot } from '../StoryAnalyzer';
import { TOOL_NAMES } from '../types';

function makeSnapshot(overrides: Partial<StorySnapshot> = {}): StorySnapshot {
  return {
    projectId: 'proj-1',
    characters: [],
    scenes: [],
    beats: [],
    acts: [],
    relationships: [],
    ...overrides,
  };
}

describe('insight accept payload', () => {
  it('relationship-tension insight contains compose_workspace action with triptych layout', () => {
    const snapshot = makeSnapshot({
      characters: [
        { id: 'c1', name: 'Hero' },
        { id: 'c2', name: 'Villain' },
      ],
      scenes: [
        { id: 's1', name: 'Scene 1', character_ids: ['c1'] },
        { id: 's2', name: 'Scene 2', character_ids: ['c1'] },
        { id: 's3', name: 'Scene 3', character_ids: ['c2'] },
      ],
      relationships: [
        { id: 'r1', character_id_1: 'c1', character_id_2: 'c2', type: 'nemesis' },
      ],
    });

    const insights = analyzeStory(snapshot);
    const tension = insights.find(i =>
      i.title.includes('Hero') && i.title.includes('Villain')
    );

    expect(tension).toBeDefined();
    expect(tension!.action).toBeDefined();
    expect(tension!.action!.type).toBe(TOOL_NAMES.COMPOSE_WORKSPACE);
    expect(tension!.action!.payload.layout).toBe('triptych');
    expect(Array.isArray(tension!.action!.payload.panels)).toBe(true);
  });

  it('all insights with actions have valid compose_workspace payloads', () => {
    const snapshot = makeSnapshot({
      characters: [
        { id: 'c1', name: 'Hero' },
        { id: 'c2', name: 'Villain' },
        { id: 'c3', name: 'Mentor' },
      ],
      scenes: [
        { id: 's1', name: 'Scene 1', character_ids: ['c1'] },
        { id: 's2', name: 'Scene 2', character_ids: ['c1'] },
        { id: 's3', name: 'Scene 3', character_ids: ['c2'] },
      ],
      relationships: [
        { id: 'r1', character_id_1: 'c1', character_id_2: 'c2', type: 'rival' },
      ],
    });

    const insights = analyzeStory(snapshot);
    for (const insight of insights) {
      if (insight.action) {
        expect(insight.action.type).toBe(TOOL_NAMES.COMPOSE_WORKSPACE);
        expect(insight.action.payload).toBeDefined();
        expect(typeof insight.action.payload.layout).toBe('string');
      }
    }
  });
});
