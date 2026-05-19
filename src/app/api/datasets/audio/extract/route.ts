/**
 * POST /api/datasets/audio/extract
 * YouTube Audio Extraction endpoint
 *
 * Accepts a YouTube URL, extracts audio, splits into samples,
 * uploads to Supabase Storage, and returns sample URLs.
 *
 * Uses cobalt.tools API for YouTube audio extraction (no ytdl-core dependency).
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

// ── Types ────────────────────────────────────────────────────────────────────

interface ExtractRequest {
  url: string;
  sampleLength?: number; // minutes, default 1
  projectId: string;
}

interface AudioSample {
  id: string;
  name: string;
  duration: number;
  url: string;
}

// ── YouTube URL Validation ───────────────────────────────────────────────────

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;

function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_REGEX.test(url);
}

// ── Route Handler ────────────────────────────────────────────────────────────

export const POST = withApiHandler('POST /api/datasets/audio/extract', async (request: NextRequest) => {
    const body: ExtractRequest = await request.json();
    const { url, sampleLength = 1, projectId } = body;

    // ── Validation ─────────────────────────────────────────────────────

    if (!url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 },
      );
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 },
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 },
      );
    }

    // ── Extract audio via cobalt.tools API ────────────────────────────
    // cobalt.tools provides a free API for extracting audio from YouTube

    let audioBuffer: ArrayBuffer;

    try {
      const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          isAudioOnly: true,
          aFormat: 'mp3',
          filenamePattern: 'basic',
        }),
      });

      if (!cobaltResponse.ok) {
        throw new Error(`Cobalt API error: ${cobaltResponse.status}`);
      }

      const cobaltData = await cobaltResponse.json();

      if (cobaltData.status === 'error') {
        throw new Error(cobaltData.text || 'Extraction failed');
      }

      // cobalt returns a URL to download the audio
      const audioUrl = cobaltData.url;
      if (!audioUrl) {
        throw new Error('No audio URL returned from extraction service');
      }

      const audioDownload = await fetch(audioUrl);
      if (!audioDownload.ok) {
        throw new Error('Failed to download extracted audio');
      }

      audioBuffer = await audioDownload.arrayBuffer();
    } catch (extractError) {
      console.error('YouTube extraction error:', extractError);
      return NextResponse.json(
        {
          error: 'YouTube audio extraction failed',
          details: extractError instanceof Error ? extractError.message : 'Unknown extraction error',
        },
        { status: 502 },
      );
    }

    // ── Split into samples ────────────────────────────────────────────
    // For MP3 at 128kbps: ~16KB per second, ~960KB per minute
    const bytesPerMinute = 16000 * 60; // 128kbps
    const sampleBytes = bytesPerMinute * sampleLength;
    const totalBytes = audioBuffer.byteLength;

    const samples: AudioSample[] = [];
    const timestamp = Date.now();
    let sampleIndex = 0;

    // If the audio is shorter than one sample, return as single sample
    if (totalBytes <= sampleBytes) {
      const storagePath = `youtube-samples/${projectId}/${timestamp}-sample-0.mp3`;

      const { error: uploadError } = await supabaseServer.storage
        .from('audio')
        .upload(storagePath, Buffer.from(audioBuffer), {
          contentType: 'audio/mpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload audio sample', details: uploadError.message },
          { status: 500 },
        );
      }

      const { data: urlData } = supabaseServer.storage
        .from('audio')
        .getPublicUrl(storagePath);

      samples.push({
        id: `sample-${timestamp}-0`,
        name: `Sample 1`,
        duration: Math.round(totalBytes / 16000),
        url: urlData.publicUrl,
      });
    } else {
      // Split into chunks
      let offset = 0;

      while (offset < totalBytes) {
        const chunkEnd = Math.min(offset + sampleBytes, totalBytes);
        const chunk = audioBuffer.slice(offset, chunkEnd);
        const storagePath = `youtube-samples/${projectId}/${timestamp}-sample-${sampleIndex}.mp3`;

        const { error: uploadError } = await supabaseServer.storage
          .from('audio')
          .upload(storagePath, Buffer.from(chunk), {
            contentType: 'audio/mpeg',
            upsert: false,
          });

        if (uploadError) {
          console.error(`Upload error for sample ${sampleIndex}:`, uploadError);
          // Continue with remaining samples
          offset += sampleBytes;
          sampleIndex++;
          continue;
        }

        const { data: urlData } = supabaseServer.storage
          .from('audio')
          .getPublicUrl(storagePath);

        const chunkDuration = Math.round(chunk.byteLength / 16000);

        samples.push({
          id: `sample-${timestamp}-${sampleIndex}`,
          name: `Sample ${sampleIndex + 1}`,
          duration: chunkDuration,
          url: urlData.publicUrl,
        });

        offset += sampleBytes;
        sampleIndex++;
      }
    }

    return NextResponse.json({ samples });
});
