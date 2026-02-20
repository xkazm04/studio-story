import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Character } from '@/app/types/Character';
import {
  handleDatabaseError,
  handleUnexpectedError,
  createErrorResponse,
  validateRequiredParams,
} from '@/app/utils/apiErrorHandling';

/**
 * GET /api/characters?projectId=xxx
 * Get all characters for a project
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return createErrorResponse('projectId is required', 400);
    }

    const { data, error } = await supabaseServer
      .from('characters')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });

    if (error) {
      return handleDatabaseError('fetch characters', error, 'GET /api/characters');
    }

    return NextResponse.json(data as Character[]);
  } catch (error) {
    return handleUnexpectedError('GET /api/characters', error);
  }
}

/**
 * POST /api/characters
 * Create a new character
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, project_id, story_stack_id, type, faction_id, voice, avatar_url, appearance } = body;

    // Validate required parameters
    const paramValidation = validateRequiredParams(
      { name, project_id },
      ['name', 'project_id']
    );
    if (paramValidation) return paramValidation;

    // Resolve story_stack_id: use provided value, or look up from project
    let resolvedStackId = story_stack_id;
    if (!resolvedStackId) {
      const { data: stacks } = await supabaseServer
        .from('story_stacks')
        .select('id')
        .limit(1);
      if (stacks && stacks.length > 0) {
        resolvedStackId = stacks[0].id;
      }
    }

    const insertData: Record<string, unknown> = {
      name,
      project_id,
    };
    if (resolvedStackId) insertData.story_stack_id = resolvedStackId;
    if (type) insertData.type = type;
    if (faction_id) insertData.faction_id = faction_id;
    if (voice) insertData.voice = voice;
    if (avatar_url) insertData.avatar_url = avatar_url;
    if (appearance) insertData.appearance = appearance;

    const { data, error } = await supabaseServer
      .from('characters')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return handleDatabaseError('create character', error, 'POST /api/characters');
    }

    return NextResponse.json(data as Character, { status: 201 });
  } catch (error) {
    return handleUnexpectedError('POST /api/characters', error);
  }
}
