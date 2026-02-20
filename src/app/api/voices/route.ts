import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Voice } from '@/app/types/Voice';
import {
  handleDatabaseError,
  handleUnexpectedError,
  createErrorResponse,
  validateRequiredParams,
} from '@/app/utils/apiErrorHandling';

/**
 * GET /api/voices?projectId=xxx
 * Get all voices for a project
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return createErrorResponse('projectId is required', 400);
    }

    const { data, error } = await supabaseServer
      .from('voices')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      // Table not found — migration not applied yet, return empty
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json([]);
      }
      return handleDatabaseError('fetch voices', error, 'GET /api/voices');
    }

    return NextResponse.json(data as Voice[]);
  } catch (error) {
    return handleUnexpectedError('GET /api/voices', error);
  }
}

/**
 * POST /api/voices
 * Create a new voice and its default config
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      voice_id, name, project_id, description, character_id,
      provider, language, gender, age_range, audio_sample_url,
    } = body;

    const paramValidation = validateRequiredParams(
      { voice_id, name, project_id },
      ['voice_id', 'name', 'project_id']
    );
    if (paramValidation) return paramValidation;

    // Insert voice
    const { data, error } = await supabaseServer
      .from('voices')
      .insert({
        voice_id,
        name,
        project_id,
        description: description ?? null,
        character_id: character_id ?? null,
        provider: provider ?? 'elevenlabs',
        language: language ?? 'en',
        gender: gender ?? null,
        age_range: age_range ?? null,
        audio_sample_url: audio_sample_url ?? null,
      })
      .select()
      .single();

    if (error) {
      return handleDatabaseError('create voice', error, 'POST /api/voices');
    }

    // Create default voice config
    await supabaseServer
      .from('voice_configs')
      .insert({
        voice_id,
        stability: 0.50,
        similarity_boost: 0.75,
        style: 0.50,
        speed: 1.00,
        use_speaker_boost: false,
      });

    return NextResponse.json(data as Voice, { status: 201 });
  } catch (error) {
    return handleUnexpectedError('POST /api/voices', error);
  }
}
