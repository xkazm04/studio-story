/**
 * GET /api/ai/audio/voices
 * ElevenLabs Preset Voice Listing
 *
 * Returns a filtered list of ElevenLabs voices suitable for narration,
 * including both user's cloned voices and curated preset voices.
 * Responses are cached for 5 minutes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

// ── Types ────────────────────────────────────────────────────────────────────

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  description?: string;
  fine_tuning?: Record<string, unknown>;
}

interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[];
}

// ── Route Handler ────────────────────────────────────────────────────────────

export const GET = withApiHandler('GET /api/ai/audio/voices', async (request: NextRequest) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured. Set ELEVENLABS_API_KEY in .env.local.' },
        { status: 503 },
      );
    }

    // ── Fetch voices from ElevenLabs ──────────────────────────────────

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch voices from ElevenLabs', details },
        { status: 502 },
      );
    }

    const data: ElevenLabsVoicesResponse = await response.json();

    // ── Filter voices ─────────────────────────────────────────────────
    // Include user's cloned voices and premade voices suitable for narration

    const filteredVoices = data.voices.filter((voice) => {
      // Always include user's cloned voices
      if (voice.category === 'cloned') return true;

      // Include premade voices
      if (voice.category === 'premade') {
        // Prefer voices with narration/character use cases
        const useCase = voice.labels?.use_case ?? '';
        if (
          useCase.includes('narration') ||
          useCase.includes('characters') ||
          useCase.includes('audiobook') ||
          useCase.includes('conversational')
        ) {
          return true;
        }
        // Include all premade if no specific use_case filter matches
        return true;
      }

      // Include generated/professional voices
      if (voice.category === 'generated' || voice.category === 'professional') {
        return true;
      }

      return false;
    });

    const voices = filteredVoices.map((voice) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category ?? 'unknown',
      labels: voice.labels ?? {},
      preview_url: voice.preview_url ?? null,
    }));

    // ── Return with caching headers ───────────────────────────────────

    return NextResponse.json(
      { voices },
      {
        headers: {
          'Cache-Control': 'public, max-age=300',
        },
      },
    );
});
