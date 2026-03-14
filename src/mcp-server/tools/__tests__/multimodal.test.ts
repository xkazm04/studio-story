/**
 * Tests for multimodal MCP tools (analyze_image, generate_image, extract_audio)
 * Verifies correct URL construction, payload forwarding, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { multimodalTools, type MultimodalTool } from '../multimodal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

function mockFetchSuccess(responseData: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(responseData),
  });
}

function mockFetchError(status: number, errorData: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve(errorData),
  });
}

function mockFetchNetworkError(message: string) {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error(message));
}

function findTool(name: string): MultimodalTool {
  const tool = multimodalTools.find(t => t.name === name);
  if (!tool) throw new Error(`Tool ${name} not found`);
  return tool;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('multimodalTools', () => {
  beforeEach(() => {
    vi.stubEnv('STORY_BASE_URL', 'http://test-host:4000');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it('exports three tools', () => {
    expect(multimodalTools).toHaveLength(3);
    expect(multimodalTools.map(t => t.name)).toEqual([
      'analyze_image',
      'generate_image',
      'extract_audio',
    ]);
  });

  describe('analyze_image', () => {
    it('calls /api/ai/evaluate-image with imageUrl and prompt', async () => {
      mockFetchSuccess({ analysis: 'A sunset over mountains' });

      const tool = findTool('analyze_image');
      const result = await tool.handler({ imageUrl: 'https://example.com/img.jpg', prompt: 'Describe this' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://test-host:4000/api/ai/evaluate-image',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: 'https://example.com/img.jpg', prompt: 'Describe this' }),
        }),
      );
      expect(result).toEqual({ analysis: 'A sunset over mountains' });
    });

    it('uses default prompt when not provided', async () => {
      mockFetchSuccess({ analysis: 'Default analysis' });

      const tool = findTool('analyze_image');
      await tool.handler({ imageUrl: 'https://example.com/img.jpg' });

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.prompt).toBe('Describe this image in detail');
    });

    it('returns error object on fetch failure', async () => {
      mockFetchError(500, { error: 'Internal error' });

      const tool = findTool('analyze_image');
      const result = await tool.handler({ imageUrl: 'https://example.com/img.jpg' });

      expect(result).toEqual({ error: expect.stringContaining('500') });
    });

    it('returns error object on network error', async () => {
      mockFetchNetworkError('ECONNREFUSED');

      const tool = findTool('analyze_image');
      const result = await tool.handler({ imageUrl: 'https://example.com/img.jpg' });

      expect(result).toEqual({ error: 'ECONNREFUSED' });
    });
  });

  describe('generate_image', () => {
    it('calls /api/ai/generate-images with prompt and style params', async () => {
      mockFetchSuccess({ imageUrl: 'https://cdn.example.com/generated.png' });

      const tool = findTool('generate_image');
      const result = await tool.handler({
        prompt: 'A dragon in watercolor',
        style: 'watercolor',
        width: 512,
        height: 768,
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://test-host:4000/api/ai/generate-images',
        expect.objectContaining({ method: 'POST' }),
      );
      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body).toEqual(expect.objectContaining({
        prompt: 'A dragon in watercolor',
        style: 'watercolor',
        width: 512,
        height: 768,
      }));
      expect(result).toEqual({ imageUrl: 'https://cdn.example.com/generated.png' });
    });

    it('uses defaults for width/height when not provided', async () => {
      mockFetchSuccess({ imageUrl: 'https://cdn.example.com/default.png' });

      const tool = findTool('generate_image');
      await tool.handler({ prompt: 'Simple prompt' });

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.width).toBe(1024);
      expect(body.height).toBe(1024);
    });

    it('returns error object on failure', async () => {
      mockFetchNetworkError('timeout');

      const tool = findTool('generate_image');
      const result = await tool.handler({ prompt: 'fail' });

      expect(result).toEqual({ error: 'timeout' });
    });
  });

  describe('extract_audio', () => {
    it('calls /api/agents/advisor with transcribe task', async () => {
      mockFetchSuccess({ text: 'Hello, this is a transcription.' });

      const tool = findTool('extract_audio');
      const result = await tool.handler({
        audioUrl: 'https://example.com/audio.mp3',
        task: 'transcribe',
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://test-host:4000/api/agents/advisor',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            audioUrl: 'https://example.com/audio.mp3',
            task: 'transcribe',
          }),
        }),
      );
      expect(result).toEqual({ text: 'Hello, this is a transcription.' });
    });

    it('calls with describe task', async () => {
      mockFetchSuccess({ text: 'Speech with upbeat tone about weather.' });

      const tool = findTool('extract_audio');
      const result = await tool.handler({
        audioUrl: 'https://example.com/audio.wav',
        task: 'describe',
      });

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.task).toBe('describe');
      expect(result).toEqual({ text: 'Speech with upbeat tone about weather.' });
    });

    it('returns error object on failure', async () => {
      mockFetchError(403, { error: 'Forbidden' });

      const tool = findTool('extract_audio');
      const result = await tool.handler({
        audioUrl: 'https://example.com/audio.mp3',
        task: 'transcribe',
      });

      expect(result).toEqual({ error: expect.stringContaining('403') });
    });
  });

  describe('baseUrl fallback', () => {
    it('uses http://localhost:3000 when STORY_BASE_URL not set', async () => {
      vi.stubEnv('STORY_BASE_URL', '');
      mockFetchSuccess({ analysis: 'test' });

      const tool = findTool('analyze_image');
      await tool.handler({ imageUrl: 'https://example.com/img.jpg' });

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[0]).toMatch(/^http:\/\/localhost:3000/);
    });
  });
});
