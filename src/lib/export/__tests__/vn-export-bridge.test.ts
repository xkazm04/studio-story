/**
 * Unit tests for VN Export Bridge utilities
 *
 * Tests graph traversal, data assembly, gradient fallback, and edge cases.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  findReachableScenes,
  buildVNExportScenes,
  generateGradientBackground,
} from '../vnExportBridge';
import type { SceneChoice } from '@/app/types/SceneChoice';

// ============================================================================
// Mock screenplayParser
// ============================================================================

vi.mock('@/app/features/voice/lib/screenplayParser', () => ({
  parseScreenplayToScriptLines: vi.fn((tiptapJson: { content?: Array<{ type?: string }> }) => {
    // Return mock script lines based on tiptap content
    const nodes = tiptapJson.content ?? [];
    return nodes
      .filter((n: { type?: string }) => n.type === 'dialogue' || n.type === 'action')
      .map((n: { type?: string }, i: number) => ({
        id: `sl-${i}`,
        character: n.type === 'dialogue' ? 'ALICE' : 'NARRATOR',
        voiceId: '',
        text: n.type === 'dialogue' ? 'Hello there!' : 'The wind blew.',
        emotion: '',
        delivery: '',
        status: 'pending' as const,
      }));
  }),
}));

// ============================================================================
// Helper: create SceneChoice
// ============================================================================

function choice(
  sceneId: string,
  targetSceneId: string | null,
  label = 'Go',
  id?: string
): SceneChoice {
  return {
    id: id || `c-${sceneId}-${targetSceneId}`,
    scene_id: sceneId,
    target_scene_id: targetSceneId,
    label,
    order_index: 0,
  };
}

// ============================================================================
// findReachableScenes tests
// ============================================================================

describe('findReachableScenes', () => {
  it('traverses linear chain with implicit links (A->B->C)', () => {
    // No explicit choices -- all scenes get implicit "Continue" links
    const ordered = ['A', 'B', 'C'];
    const result = findReachableScenes('A', [], ordered);
    expect(result).toEqual(new Set(['A', 'B', 'C']));
  });

  it('follows branching choices (A->B, A->C)', () => {
    const choices: SceneChoice[] = [
      choice('A', 'B', 'Go left'),
      choice('A', 'C', 'Go right'),
    ];
    const ordered = ['A', 'B', 'C'];
    const result = findReachableScenes('A', choices, ordered);
    expect(result).toEqual(new Set(['A', 'B', 'C']));
  });

  it('excludes orphan scenes not reachable from start', () => {
    // A->B via implicit, D is disconnected
    const ordered = ['A', 'B', 'D'];
    const choices: SceneChoice[] = [
      choice('A', 'B', 'Go'),
    ];
    const result = findReachableScenes('A', choices, ordered);
    expect(result.has('A')).toBe(true);
    expect(result.has('B')).toBe(true);
    expect(result.has('D')).toBe(false);
  });

  it('handles circular references safely (A->B->A)', () => {
    const choices: SceneChoice[] = [
      choice('A', 'B', 'Go to B'),
      choice('B', 'A', 'Go back'),
    ];
    const ordered = ['A', 'B'];
    const result = findReachableScenes('A', choices, ordered);
    expect(result).toEqual(new Set(['A', 'B']));
  });

  it('scene with explicit choices does NOT get implicit link', () => {
    // A has explicit choice to C, should NOT get implicit link to B
    const choices: SceneChoice[] = [
      choice('A', 'C', 'Skip to C'),
    ];
    const ordered = ['A', 'B', 'C'];
    const result = findReachableScenes('A', choices, ordered);
    expect(result.has('A')).toBe(true);
    expect(result.has('B')).toBe(false); // Not reachable -- A goes to C, not B
    expect(result.has('C')).toBe(true);
  });
});

// ============================================================================
// buildVNExportScenes tests
// ============================================================================

describe('buildVNExportScenes', () => {
  it('assembles scenes sorted by act/scene order', () => {
    const scenes = [
      { id: 's3', name: 'Scene 3', order: 2, act_id: 'a1', content: 'Third scene.' },
      { id: 's1', name: 'Scene 1', order: 0, act_id: 'a1', content: 'First scene.' },
      { id: 's2', name: 'Scene 2', order: 1, act_id: 'a1', content: 'Second scene.' },
    ];
    const acts = [{ id: 'a1', order: 0 }];

    const { scenes: result } = buildVNExportScenes({ scenes, acts, choices: [] });

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('Scene 1');
    expect(result[1].name).toBe('Scene 2');
    expect(result[2].name).toBe('Scene 3');
  });

  it('skips empty scenes (no script and no content)', () => {
    const scenes = [
      { id: 's1', name: 'Full', order: 0, act_id: 'a1', content: 'Has content.' },
      { id: 's2', name: 'Empty', order: 1, act_id: 'a1', content: '' },
      { id: 's3', name: 'Also Empty', order: 2, act_id: 'a1', content: '' },
    ];
    const acts = [{ id: 'a1', order: 0 }];

    const { scenes: result, summary } = buildVNExportScenes({ scenes, acts, choices: [] });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Full');
    expect(summary.emptySkipped).toBe(2);
  });

  it('extracts dialogue lines from TipTap script', () => {
    const tiptapScript = JSON.stringify({
      type: 'doc',
      content: [
        { type: 'dialogue', content: [{ type: 'text', text: 'Hello there!' }] },
        { type: 'action', content: [{ type: 'text', text: 'The wind blew.' }] },
      ],
    });

    const scenes = [
      { id: 's1', name: 'Dialogue Scene', order: 0, act_id: 'a1', script: tiptapScript, content: 'Fallback content.' },
    ];
    const acts = [{ id: 'a1', order: 0 }];

    const { scenes: result } = buildVNExportScenes({ scenes, acts, choices: [] });

    expect(result[0].dialogueLines).toBeDefined();
    expect(result[0].dialogueLines!.length).toBe(2);
    expect(result[0].dialogueLines![0].speaker).toBe('ALICE');
    expect(result[0].dialogueLines![1].speaker).toBe(''); // NARRATOR becomes empty
  });

  it('injects implicit Continue choice for linear scenes', () => {
    const scenes = [
      { id: 's1', name: 'Scene 1', order: 0, act_id: 'a1', content: 'First.' },
      { id: 's2', name: 'Scene 2', order: 1, act_id: 'a1', content: 'Second.' },
    ];
    const acts = [{ id: 'a1', order: 0 }];

    const { scenes: result } = buildVNExportScenes({ scenes, acts, choices: [] });

    // First scene should have Continue choice pointing to second scene
    expect(result[0].choices).toBeDefined();
    expect(result[0].choices!.length).toBe(1);
    expect(result[0].choices![0].label).toBe('Continue');
    expect(result[0].choices![0].targetSceneId).toBe('s2');
  });

  it('marks dead-end scenes as isEnding=true', () => {
    const scenes = [
      { id: 's1', name: 'Scene 1', order: 0, act_id: 'a1', content: 'Only scene.' },
    ];
    const acts = [{ id: 'a1', order: 0 }];

    const { scenes: result } = buildVNExportScenes({ scenes, acts, choices: [] });

    expect(result[0].isEnding).toBe(true);
  });

  it('excludes unreachable orphan scenes', () => {
    const scenes = [
      { id: 's1', name: 'Start', order: 0, act_id: 'a1', content: 'Start.' },
      { id: 's2', name: 'Reachable', order: 1, act_id: 'a1', content: 'Middle.' },
      { id: 's3', name: 'Orphan', order: 0, act_id: 'a2', content: 'Orphan scene.' },
    ];
    const acts = [{ id: 'a1', order: 0 }, { id: 'a2', order: 1 }];
    // s1 -> s2 (implicit), s2 has explicit choice back to s1, s3 is orphan
    const choices: SceneChoice[] = [
      choice('s2', 's1', 'Go back'),
    ];

    const { scenes: result } = buildVNExportScenes({ scenes, acts, choices });

    const ids = result.map((s) => s.id);
    expect(ids).toContain('s1');
    expect(ids).toContain('s2');
    expect(ids).not.toContain('s3');
  });

  it('provides correct summary counts', () => {
    const scenes = [
      { id: 's1', name: 'With Image', order: 0, act_id: 'a1', content: 'Text.', image_url: 'http://img.png' },
      { id: 's2', name: 'With Audio', order: 1, act_id: 'a1', content: 'Text.', audio_url: 'http://audio.mp3' },
      { id: 's3', name: 'Empty', order: 2, act_id: 'a1', content: '' },
    ];
    const acts = [{ id: 'a1', order: 0 }];

    const { summary } = buildVNExportScenes({ scenes, acts, choices: [] });

    expect(summary.totalScenes).toBe(3);
    expect(summary.includedScenes).toBe(2);
    expect(summary.withIllustrations).toBe(1);
    expect(summary.withAudio).toBe(1);
    expect(summary.emptySkipped).toBe(1);
  });

  it('maps imageUrl and narrationUrl from scene fields', () => {
    const scenes = [
      {
        id: 's1', name: 'Rich Scene', order: 0, act_id: 'a1',
        content: 'Content.',
        image_url: 'http://example.com/bg.png',
        audio_url: 'http://example.com/narration.mp3',
      },
    ];
    const acts = [{ id: 'a1', order: 0 }];

    const { scenes: result } = buildVNExportScenes({ scenes, acts, choices: [] });

    expect(result[0].imageUrl).toBe('http://example.com/bg.png');
    expect(result[0].narrationUrl).toBe('http://example.com/narration.mp3');
  });
});

// ============================================================================
// generateGradientBackground tests
// ============================================================================

describe('generateGradientBackground', () => {
  it('returns a data:image/svg+xml string', () => {
    const result = generateGradientBackground('Test Scene');
    expect(result).toMatch(/^data:image\/svg\+xml,/);
  });

  it('includes palette colors when provided', () => {
    const result = generateGradientBackground('Scene', ['#ff0000', '#00ff00']);
    const decoded = decodeURIComponent(result.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('#ff0000');
    expect(decoded).toContain('#00ff00');
  });

  it('uses slate defaults when no palette', () => {
    const result = generateGradientBackground('Scene');
    const decoded = decodeURIComponent(result.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('#0f172a');
    expect(decoded).toContain('#1e293b');
  });

  it('includes escaped scene name in SVG', () => {
    const result = generateGradientBackground('Scene & "Quotes" <Tags>');
    const decoded = decodeURIComponent(result.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('&amp;');
    expect(decoded).toContain('&quot;');
    expect(decoded).toContain('&lt;');
    expect(decoded).toContain('&gt;');
  });

  it('generates 1920x1080 SVG', () => {
    const result = generateGradientBackground('Scene');
    const decoded = decodeURIComponent(result.replace('data:image/svg+xml,', ''));
    expect(decoded).toContain('width="1920"');
    expect(decoded).toContain('height="1080"');
  });
});
