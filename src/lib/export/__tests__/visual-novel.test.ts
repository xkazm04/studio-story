/**
 * Unit tests for VisualNovelGenerator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateVNCss } from '../templates/vn-styles';
import { generateVNEngine, generateVNHTML } from '../templates/visual-novel';
import { VisualNovelGenerator } from '../VisualNovelGenerator';
import type { StoryExportData } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  // Default: return empty response for any fetches
  mockFetch.mockResolvedValue({
    ok: true,
    headers: { get: () => 'image/png' },
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)),
  });
});

// ============================================================================
// Test data
// ============================================================================

function makeData(overrides?: Partial<StoryExportData>): StoryExportData {
  return {
    title: 'Test VN',
    author: 'Author',
    scenes: [
      {
        id: 'scene-1',
        name: 'Opening',
        content: 'The story begins.',
        dialogueLines: [
          { speaker: 'Alice', text: 'Hello!', audioUrl: 'https://example.com/hello.mp3' },
          { speaker: 'Bob', text: 'Hi there.' },
        ],
        choices: [
          { label: 'Go left', targetSceneId: 'scene-2' },
          { label: 'Go right', targetSceneId: 'scene-3' },
        ],
        imageUrl: 'https://example.com/bg1.png',
      },
      {
        id: 'scene-2',
        name: 'Left path',
        content: 'You went left.',
        dialogueLines: [{ speaker: 'Alice', text: 'This way!' }],
        isEnding: true,
      },
      {
        id: 'scene-3',
        name: 'Right path',
        content: 'You went right.',
        // No choices, not explicitly ending => dead-end => should show "The End"
      },
    ],
    ...overrides,
  };
}

// ============================================================================
// CSS Tests
// ============================================================================

describe('generateVNCss', () => {
  it('produces CSS with fullscreen background, bottom dialogue box, and choice button styles', () => {
    const css = generateVNCss();
    expect(css).toContain('100vh');
    expect(css).toContain('dialogue');
    expect(css).toContain('choice');
    expect(css).toContain('opacity');
  });

  it('applies art style palette when provided', () => {
    const css = generateVNCss({
      palette: ['#111', '#222'],
      backgroundColor: '#000',
      accentColor: '#f0c',
      fontFamily: 'Georgia',
    });
    expect(css).toContain('#f0c');
    expect(css).toContain('Georgia');
  });
});

// ============================================================================
// Engine JS Tests
// ============================================================================

describe('generateVNEngine', () => {
  it('produces JS with scenes array, showLine, advance, and showChoices functions', () => {
    const js = generateVNEngine([
      {
        name: 'Scene 1',
        lines: [{ speaker: 'Alice', text: 'Hello' }],
        choices: [],
        backgroundDataUrl: '',
        isEnding: false,
      },
    ]);
    expect(js).toContain('scenes');
    expect(js).toContain('showLine');
    expect(js).toContain('advance');
    expect(js).toContain('showChoices');
  });

  it('includes auto-play audio logic', () => {
    const js = generateVNEngine([
      {
        name: 'Scene 1',
        lines: [{ speaker: 'Alice', text: 'Hello', audioUrl: 'data:audio/mpeg;base64,AA' }],
        choices: [],
        backgroundDataUrl: '',
        isEnding: false,
      },
    ]);
    expect(js).toContain('Audio');
    expect(js).toContain('play');
  });

  it('choice buttons use fade-in opacity transition', () => {
    const js = generateVNEngine([
      {
        name: 'Scene 1',
        lines: [{ speaker: 'N', text: 'Choose' }],
        choices: [{ label: 'Go', targetIndex: 1 }],
        backgroundDataUrl: '',
        isEnding: false,
      },
    ]);
    // The engine should add a 'visible' class for the fade-in
    expect(js).toContain('visible');
  });
});

// ============================================================================
// VisualNovelGenerator Tests
// ============================================================================

describe('VisualNovelGenerator', () => {
  it('generate() returns ExportResult with format visual-novel', async () => {
    const gen = new VisualNovelGenerator();
    const result = await gen.generate(makeData());

    expect(result.format).toBe('visual-novel');
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.filename).toContain('.html');
    expect(result.metadata.sceneCount).toBe(3);
  });

  it('output HTML contains scene data as JSON embedded in script', async () => {
    const gen = new VisualNovelGenerator();
    const result = await gen.generate(makeData());
    const html = await result.blob.text();

    expect(html).toContain('scenes');
    expect(html).toContain('Opening');
    expect(html).toContain('<script');
  });

  it('scenes with choices produce choice button rendering in the engine', async () => {
    const gen = new VisualNovelGenerator();
    const result = await gen.generate(makeData());
    const html = await result.blob.text();

    expect(html).toContain('Go left');
    expect(html).toContain('Go right');
    expect(html).toContain('goToScene');
  });

  it('scenes without choices and not isEnding produce The End display', async () => {
    const gen = new VisualNovelGenerator();
    const result = await gen.generate(makeData());
    const html = await result.blob.text();

    // scene-3 is a dead-end (no choices, not isEnding) -- should auto-set isEnding
    expect(html).toContain('The End');
  });

  it('scene transitions use fade effect', async () => {
    const gen = new VisualNovelGenerator();
    const result = await gen.generate(makeData());
    const html = await result.blob.text();

    expect(html).toContain('transition');
    expect(html).toContain('opacity');
  });
});
