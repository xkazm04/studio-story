/**
 * POST /api/ai/audio/tts
 * ElevenLabs Text-to-Speech proxy endpoint
 *
 * Accepts text and voice_id, calls ElevenLabs TTS API,
 * uploads the resulting MP3 to Supabase Storage, and returns
 * the public audio URL with estimated duration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

// ── Types ────────────────────────────────────────────────────────────────────

interface TTSRequest {
  text: string;
  voice_id: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    speed?: number;
  };
  model_id?: string;
  project_id?: string;
}

// ── Route Handler ────────────────────────────────────────────────────────────

export const POST = withApiHandler('POST /api/ai/audio/tts', async (request: NextRequest) => {
    const body: TTSRequest = await request.json();
    const { text, voice_id, voice_settings, model_id, project_id } = body;

    // ── Validation ─────────────────────────────────────────────────────

    if (!text) {
      return NextResponse.json(
        { error: 'text is required' },
        { status: 400 },
      );
    }

    if (!voice_id) {
      return NextResponse.json(
        { error: 'voice_id is required' },
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

    // ── Call ElevenLabs TTS ────────────────────────────────────────────

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}?output_format=mp3_44100_128`;

    const ttsResponse = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: model_id ?? 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
          ...voice_settings,
        },
      }),
    });

    if (!ttsResponse.ok) {
      const details = await ttsResponse.text();
      return NextResponse.json(
        { error: 'TTS generation failed', details },
        { status: 502 },
      );
    }

    // ── Upload to Supabase Storage ────────────────────────────────────

    const audioBuffer = await ttsResponse.arrayBuffer();
    const storagePath = `narration/${project_id ?? 'misc'}/${Date.now()}-${voice_id}.mp3`;

    const { error: uploadError } = await supabaseServer.storage
      .from('audio')
      .upload(storagePath, Buffer.from(audioBuffer), {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload audio to storage', details: uploadError.message },
        { status: 500 },
      );
    }

    const { data: urlData } = supabaseServer.storage
      .from('audio')
      .getPublicUrl(storagePath);

    // Estimate duration from byte size: bytes / (128000/8) = bytes / 16000
    const estimatedDuration = audioBuffer.byteLength / 16000;

    return NextResponse.json({
      success: true,
      audioUrl: urlData.publicUrl,
      duration: Math.round(estimatedDuration * 100) / 100,
    });
});
