/**
 * TTS API Route Tests
 *
 * Tests the ElevenLabs TTS proxy endpoint.
 * Mocks fetch to ElevenLabs API and Supabase Storage upload.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment
vi.stubEnv('ELEVENLABS_API_KEY', 'test-api-key');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

// Mock Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'narration/misc/test.mp3' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://test.supabase.co/storage/v1/object/public/audio/narration/misc/test.mp3' },
        }),
      }),
    },
  },
}));

// Save original fetch
const originalFetch = globalThis.fetch;

describe('POST /api/ai/audio/tts', () => {
  let POST: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    // Default mock: successful ElevenLabs response
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(16000)), // ~1 second of 128kbps MP3
      headers: new Headers({ 'content-type': 'audio/mpeg' }),
    }) as unknown as typeof fetch;

    const mod = await import('../tts/route');
    POST = mod.POST;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns 200 with audioUrl and duration for valid text+voice_id', async () => {
    const request = new Request('http://localhost:3000/api/ai/audio/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
        voice_id: 'test-voice-123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.audioUrl).toBeDefined();
    expect(typeof data.audioUrl).toBe('string');
    expect(data.duration).toBeDefined();
    expect(typeof data.duration).toBe('number');
  });

  it('returns 400 when text is missing', async () => {
    const request = new Request('http://localhost:3000/api/ai/audio/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voice_id: 'test-voice-123',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when voice_id is missing', async () => {
    const request = new Request('http://localhost:3000/api/ai/audio/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 502 when ElevenLabs returns error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal Server Error'),
    }) as unknown as typeof fetch;

    // Re-import with fresh mocks
    vi.resetModules();
    const mod = await import('../tts/route');

    const request = new Request('http://localhost:3000/api/ai/audio/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
        voice_id: 'test-voice-123',
      }),
    });

    const response = await mod.POST(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBeDefined();
  });
});
