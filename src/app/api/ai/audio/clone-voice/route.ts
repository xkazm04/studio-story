/**
 * POST /api/ai/audio/clone-voice
 * ElevenLabs Instant Voice Cloning endpoint
 *
 * Accepts an audio URL and voice name, downloads the audio,
 * sends it to ElevenLabs for instant voice cloning, and returns
 * the new voice_id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

// ── Types ────────────────────────────────────────────────────────────────────

interface CloneVoiceRequest {
  name: string;
  audioUrl: string;
  description?: string;
}

// ── Route Handler ────────────────────────────────────────────────────────────

export const POST = withApiHandler('POST /api/ai/audio/clone-voice', async (request: NextRequest) => {
    const body: CloneVoiceRequest = await request.json();
    const { name, audioUrl, description } = body;

    // ── Validation ─────────────────────────────────────────────────────

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 },
      );
    }

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'audioUrl is required' },
        { status: 400 },
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured. Set ELEVENLABS_API_KEY in .env.local.' },
        { status: 503 },
      );
    }

    // ── Download audio file ───────────────────────────────────────────

    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download audio file from provided URL' },
        { status: 400 },
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    // ── Call ElevenLabs Voice Cloning ──────────────────────────────────

    const formData = new FormData();
    formData.append('name', name);
    formData.append(
      'files',
      new Blob([audioBuffer], { type: 'audio/mpeg' }),
      'voice-sample.mp3',
    );
    if (description) {
      formData.append('description', description);
    }

    const cloneResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!cloneResponse.ok) {
      const details = await cloneResponse.text();
      return NextResponse.json(
        { error: 'Voice cloning failed', details },
        { status: 502 },
      );
    }

    const result = await cloneResponse.json();

    return NextResponse.json({
      voice_id: result.voice_id,
      name,
    });
});
