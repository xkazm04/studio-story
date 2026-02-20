import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { logger } from '@/app/utils/logger';
import { HTTP_STATUS } from '@/app/utils/apiErrorHandling';

interface BeatSceneMappingInsert {
  beat_id: string;
  scene_id?: string | null;
  project_id: string;
  status?: string;
  suggested_scene_name?: string;
  suggested_scene_description?: string;
  suggested_scene_script?: string;
  suggested_location?: string;
  semantic_similarity_score?: number;
  reasoning?: string;
  ai_model?: string;
  confidence_score?: number;
  user_modified: boolean;
}

/**
 * Validates required fields for creating beat-scene mapping
 */
function validateMappingData(body: Record<string, unknown>): NextResponse | null {
  const { beat_id, project_id } = body;

  if (!beat_id || !project_id) {
    return NextResponse.json(
      { error: 'beat_id and project_id are required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  return null;
}

/**
 * Builds insert data for beat-scene mapping
 */
function buildMappingInsertData(body: Record<string, unknown>): BeatSceneMappingInsert {
  return {
    beat_id: body.beat_id as string,
    scene_id: (body.scene_id as string) || null,
    project_id: body.project_id as string,
    status: (body.status as string) || 'suggested',
    suggested_scene_name: body.suggested_scene_name as string | undefined,
    suggested_scene_description: body.suggested_scene_description as string | undefined,
    suggested_scene_script: body.suggested_scene_script as string | undefined,
    suggested_location: body.suggested_location as string | undefined,
    semantic_similarity_score: body.semantic_similarity_score as number | undefined,
    reasoning: body.reasoning as string | undefined,
    ai_model: (body.ai_model as string) || 'gpt-4o-mini',
    confidence_score: body.confidence_score as number | undefined,
    user_modified: false,
  };
}

/**
 * GET /api/beat-scene-mappings
 * Fetch beat-scene mappings with optional filters
 */
export async function GET(request: NextRequest) {
  const supabase = supabaseServer;
  const { searchParams } = new URL(request.url);

  const beatId = searchParams.get('beatId');
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status');

  try {
    let query = supabase
      .from('beat_scene_mappings')
      .select('*')
      .order('created_at', { ascending: false });

    if (beatId) {
      query = query.eq('beat_id', beatId);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching beat-scene mappings', error);
      return NextResponse.json({ error: error.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    logger.apiError('GET /api/beat-scene-mappings', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/beat-scene-mappings
 * Create new beat-scene mapping
 */
export async function POST(request: NextRequest) {
  const supabase = supabaseServer;

  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validateMappingData(body);
    if (validationError) return validationError;

    // Build insert data
    const insertData = buildMappingInsertData(body);

    const { data, error } = await supabase
      .from('beat_scene_mappings')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      logger.error('Error creating beat-scene mapping', error);
      return NextResponse.json({ error: error.message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    return NextResponse.json(data, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    logger.apiError('POST /api/beat-scene-mappings', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
