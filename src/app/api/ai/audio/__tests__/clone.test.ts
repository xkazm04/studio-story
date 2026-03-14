/**
 * Voice Cloning API Route Tests
 *
 * Tests the ElevenLabs voice cloning proxy endpoint.
 * Mocks fetch to ElevenLabs API.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment
vi.stubEnv('ELEVENLABS_API_KEY', 'test-api-key');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');

// Save original fetch
const originalFetch = globalThis.fetch;

describe('POST /api/ai/audio/clone-voice', () => {
  let POST: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();

    // Default mock: successful fetch of audio file + successful ElevenLabs clone
    globalThis.fetch = vi.fn()
      .mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('elevenlabs.io')) {
          // ElevenLabs voices/add response
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ voice_id: 'cloned-voice-001' }),
          });
        }
        // Audio file download
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
          headers: new Headers({ 'content-type': 'audio/mpeg' }),
        });
      }) as unknown as typeof fetch;

    const mod = await import('../../clone-voice/route');
    POST = mod.POST;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns 200 with voice_id for valid name+audioUrl', async () => {
    const request = new Request('http://localhost:3000/api/ai/audio/clone-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'My Custom Voice',
        audioUrl: 'https://example.com/audio-sample.mp3',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.voice_id).toBe('cloned-voice-001');
    expect(data.name).toBe('My Custom Voice');
  });

  it('returns 400 when name is missing', async () => {
    const request = new Request('http://localhost:3000/api/ai/audio/clone-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioUrl: 'https://example.com/audio-sample.mp3',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when audioUrl is missing', async () => {
    const request = new Request('http://localhost:3000/api/ai/audio/clone-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'My Voice',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('returns 502 when ElevenLabs returns error', async () => {
    globalThis.fetch = vi.fn()
      .mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('elevenlabs.io')) {
          return Promise.resolve({
            ok: false,
            status: 500,
            text: () => Promise.resolve('ElevenLabs error'),
          });
        }
        // Audio file download succeeds
        return Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        });
      }) as unknown as typeof fetch;

    vi.resetModules();
    const mod = await import('../../clone-voice/route');

    const request = new Request('http://localhost:3000/api/ai/audio/clone-voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'My Voice',
        audioUrl: 'https://example.com/audio-sample.mp3',
      }),
    });

    const response = await mod.POST(request);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBeDefined();
  });
});
