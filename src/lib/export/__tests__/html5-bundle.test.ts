import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReaderCSS } from '../templates/reader-styles';
import { generateReaderHTML, generateReaderBody, generateReaderJS } from '../templates/html5-reader';
import type { StoryExportData, StoryExportScene } from '../types';

// ============================================================================
// Reader CSS Tests
// ============================================================================

describe('generateReaderCSS', () => {
  it('produces CSS containing artStyle backgroundColor and accentColor', () => {
    const artStyle: StoryExportData['artStyle'] = {
      palette: ['#f0f0f0', '#333333'],
      backgroundColor: '#1a1a2e',
      accentColor: '#e94560',
      fontFamily: 'Georgia',
    };
    const css = generateReaderCSS(artStyle);
    expect(css).toContain('#1a1a2e');
    expect(css).toContain('#e94560');
    expect(css).toContain('Georgia');
  });

  it('produces CSS with dark defaults when no artStyle provided', () => {
    const css = generateReaderCSS();
    // Should use slate-950 style dark defaults
    expect(css).toContain('#0f172a');
    expect(css).toContain('#06b6d4');
    expect(css).toContain('#e2e8f0');
  });
});

// ============================================================================
// Reader HTML Tests
// ============================================================================

describe('generateReaderHTML', () => {
  it('produces valid HTML with DOCTYPE, charset meta, style block, and script block', () => {
    const html = generateReaderHTML('Test Story', 'body{}', '<div>body</div>', 'console.log(1)');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<meta charset="utf-8"');
    expect(html).toContain('<style>');
    expect(html).toContain('body{}');
    expect(html).toContain('</style>');
    expect(html).toContain('<script>');
    expect(html).toContain('console.log(1)');
    expect(html).toContain('</script>');
    expect(html).toContain('Test Story');
  });
});

// ============================================================================
// Reader Body Tests
// ============================================================================

describe('generateReaderBody', () => {
  const scenes = [
    { name: 'Scene One', content: '<p>Hello world</p>', imageDataUrl: 'data:image/png;base64,abc', audioDataUrl: 'data:audio/mpeg;base64,xyz' },
    { name: 'Scene Two', content: '<p>Goodbye</p>' },
  ];

  it('produces one .scene-page div per scene with scene name heading and content', () => {
    const body = generateReaderBody(scenes);
    const pageCount = (body.match(/class="scene-page"/g) || []).length;
    expect(pageCount).toBe(2);
    expect(body).toContain('Scene One');
    expect(body).toContain('Scene Two');
    expect(body).toContain('Hello world');
    expect(body).toContain('Goodbye');
  });

  it('produces img tags with data: src for scenes with images', () => {
    const body = generateReaderBody(scenes);
    expect(body).toContain('data:image/png;base64,abc');
    expect(body).toMatch(/<img[^>]+src="data:image/);
  });

  it('produces audio elements with play buttons for scenes with narration', () => {
    const body = generateReaderBody(scenes);
    expect(body).toContain('data:audio/mpeg;base64,xyz');
    expect(body).toMatch(/<audio/);
    expect(body).toMatch(/play/i);
  });
});

// ============================================================================
// Reader JS Tests
// ============================================================================

describe('generateReaderJS', () => {
  it('handles arrow-key and click scene navigation', () => {
    const js = generateReaderJS(3);
    expect(js).toContain('ArrowRight');
    expect(js).toContain('ArrowLeft');
    expect(js).toContain('click');
  });
});

// ============================================================================
// HTML5BundleGenerator Tests (Task 2)
// ============================================================================

describe('HTML5BundleGenerator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generate() returns ExportResult with html5 format', async () => {
    const { HTML5BundleGenerator } = await import('../HTML5BundleGenerator');

    // Mock fetch for image and audio URLs
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('image')) {
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new Uint8Array([0xFF, 0xD8, 0xFF]).buffer),
          headers: new Headers({ 'content-type': 'image/jpeg' }),
        });
      }
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array([0xFF, 0xFB]).buffer),
        headers: new Headers({ 'content-type': 'audio/mpeg' }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const data: StoryExportData = {
      title: 'My Test Story',
      author: 'Author',
      scenes: [
        { id: '1', name: 'Opening', content: 'Once upon a time', imageUrl: 'https://example.com/image.jpg', narrationUrl: 'https://example.com/audio.mp3' },
        { id: '2', name: 'Ending', content: 'The end', isEnding: true },
      ],
    };

    const generator = new HTML5BundleGenerator();
    const result = await generator.generate(data);

    expect(result.format).toBe('html5');
    expect(result.filename).toContain('.html');
    expect(result.metadata.sceneCount).toBe(2);
  });

  it('output HTML contains inlined images as data URLs', async () => {
    const { HTML5BundleGenerator } = await import('../HTML5BundleGenerator');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([0xFF, 0xD8]).buffer),
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const data: StoryExportData = {
      title: 'Image Test',
      author: 'A',
      scenes: [{ id: '1', name: 'S1', content: 'text', imageUrl: 'https://example.com/img.jpg' }],
    };

    const generator = new HTML5BundleGenerator();
    const result = await generator.generate(data);
    const html = await result.blob.text();
    expect(html).toContain('data:image/');
  });

  it('output HTML contains inlined audio as data URLs', async () => {
    const { HTML5BundleGenerator } = await import('../HTML5BundleGenerator');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([0xFF, 0xFB]).buffer),
      headers: new Headers({ 'content-type': 'audio/mpeg' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const data: StoryExportData = {
      title: 'Audio Test',
      author: 'A',
      scenes: [{ id: '1', name: 'S1', content: 'text', narrationUrl: 'https://example.com/audio.mp3' }],
    };

    const generator = new HTML5BundleGenerator();
    const result = await generator.generate(data);
    const html = await result.blob.text();
    expect(html).toContain('data:audio/');
  });

  it('output HTML contains scene names from input data', async () => {
    const { HTML5BundleGenerator } = await import('../HTML5BundleGenerator');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new Uint8Array([0]).buffer),
      headers: new Headers({ 'content-type': 'image/png' }),
    }));

    const data: StoryExportData = {
      title: 'Scene Names Test',
      author: 'A',
      scenes: [
        { id: '1', name: 'The Beginning', content: 'Start here' },
        { id: '2', name: 'The Climax', content: 'Peak tension' },
      ],
    };

    const generator = new HTML5BundleGenerator();
    const result = await generator.generate(data);
    const html = await result.blob.text();
    expect(html).toContain('The Beginning');
    expect(html).toContain('The Climax');
  });
});
