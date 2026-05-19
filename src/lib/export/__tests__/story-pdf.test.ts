import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StoryPDFGenerator } from '../StoryPDFGenerator';
import type { StoryExportData } from '../types';

// Minimal valid JPEG: FF D8 FF E0 header + minimal data
function createMinimalJPEG(): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);
}

function makeFixture(overrides?: Partial<StoryExportData>): StoryExportData {
  return {
    title: 'The Lost Kingdom',
    author: 'Jane Author',
    scenes: [
      {
        id: 's1',
        name: 'The Beginning',
        content:
          'Once upon a time, in a kingdom far away, there lived a brave knight who sought adventure beyond the castle walls.',
        imageUrl: 'https://storage.example.com/scene1.jpg',
      },
      {
        id: 's2',
        name: 'The Journey',
        content:
          'The knight traveled through dark forests and crossed raging rivers. Each step brought new challenges and new friends.',
      },
      {
        id: 's3',
        name: 'The Climax',
        content:
          'At last, the knight faced the dragon. With courage and cunning, the battle was won and peace restored.',
        imageUrl: 'https://storage.example.com/scene3.jpg',
      },
    ],
    metadata: { genre: 'Fantasy', description: 'A tale of bravery' },
    ...overrides,
  };
}

// Mock global fetch for image URLs
beforeEach(() => {
  const jpeg = createMinimalJPEG();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(jpeg.buffer.slice(0)),
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    }),
  );
});

describe('StoryPDFGenerator', () => {
  it('generate() returns ExportResult with format story-pdf, non-empty blob, and .pdf filename', async () => {
    const gen = new StoryPDFGenerator();
    const result = await gen.generate(makeFixture());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.format).toBe('story-pdf');
    expect(result.data.blob!.size).toBeGreaterThan(0);
    expect(result.data.filename).toMatch(/\.pdf$/);
  });

  it('PDF blob starts with %PDF magic bytes', async () => {
    const gen = new StoryPDFGenerator();
    const result = await gen.generate(makeFixture());
    if (!result.success) throw result.error;

    const text = await result.data.blob!.text();
    expect(text.startsWith('%PDF-')).toBe(true);
  });

  it('scenes with imageUrl produce PDF containing image XObjects', async () => {
    const gen = new StoryPDFGenerator();
    const result = await gen.generate(makeFixture());
    if (!result.success) throw result.error;

    const text = await result.data.blob!.text();
    expect(text).toContain('/Subtype /Image');
  });

  it('scenes without imageUrl produce valid PDF without image errors', async () => {
    const data = makeFixture({
      scenes: [
        { id: 's1', name: 'No Image Scene', content: 'Just text, no image.' },
      ],
    });

    const gen = new StoryPDFGenerator();
    const result = await gen.generate(data);
    if (!result.success) throw result.error;

    const text = await result.data.blob!.text();
    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text).not.toContain('/Subtype /Image');
  });

  it('title page includes story title and author strings', async () => {
    const gen = new StoryPDFGenerator();
    const result = await gen.generate(makeFixture());
    if (!result.success) throw result.error;

    const text = await result.data.blob!.text();
    expect(text).toContain('The Lost Kingdom');
    expect(text).toContain('Jane Author');
  });

  it('multiple scenes produce multi-page PDF with scene count in metadata', async () => {
    const gen = new StoryPDFGenerator();
    const result = await gen.generate(makeFixture());
    if (!result.success) throw result.error;

    expect(result.data.metadata.sceneCount).toBe(3);
    expect(result.data.metadata.pageCount).toBeGreaterThanOrEqual(2);
  });
});
