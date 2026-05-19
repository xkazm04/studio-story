import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import type { AudioTake } from '@/app/types/NarrationSession';
import {
  handleDatabaseError,
  createErrorResponse,
  validateRequiredParams,
  withApiHandler,
} from '@/app/utils/apiErrorHandling';

/**
 * GET /api/audio-takes?sessionId=xxx[&lineId=xxx]
 */
export const GET = withApiHandler('GET /api/audio-takes', async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');
  const lineId = searchParams.get('lineId');

  if (!sessionId) {
    return createErrorResponse('sessionId is required', 400);
  }

  let query = supabaseServer
    .from('audio_takes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (lineId) {
    query = query.eq('line_id', lineId);
  }

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return NextResponse.json([]);
    }
    return handleDatabaseError('fetch audio takes', error, 'GET /api/audio-takes');
  }

  return NextResponse.json(data as AudioTake[]);
});

/**
 * POST /api/audio-takes
 * Create one or more takes (accepts single object or array).
 */
export const POST = withApiHandler('POST /api/audio-takes', async (request: NextRequest) => {
  const body = await request.json();
  const rows = Array.isArray(body) ? body : [body];

  for (const row of rows) {
    const paramValidation = validateRequiredParams(
      { session_id: row.session_id, line_id: row.line_id, voice_id: row.voice_id, audio_url: row.audio_url, text: row.text, character: row.character },
      ['session_id', 'line_id', 'voice_id', 'audio_url', 'text', 'character']
    );
    if (paramValidation) return paramValidation;
  }

  const inserts = rows.map((row) => ({
    session_id: row.session_id,
    line_id: row.line_id,
    character: row.character,
    voice_id: row.voice_id,
    text: row.text,
    emotion: row.emotion ?? 'neutral',
    delivery: row.delivery ?? 'narration',
    intensity: row.intensity ?? 70,
    audio_url: row.audio_url,
    duration: row.duration,
    waveform_data: row.waveform_data ?? null,
    rating: row.rating ?? null,
    selected: row.selected ?? false,
    provider: row.provider ?? 'elevenlabs',
    cost_chars: row.cost_chars ?? row.text?.length ?? 0,
  }));

  const { data, error } = await supabaseServer
    .from('audio_takes')
    .insert(inserts)
    .select();

  if (error) {
    return handleDatabaseError('create audio takes', error, 'POST /api/audio-takes');
  }

  return NextResponse.json(data as AudioTake[], { status: 201 });
});
