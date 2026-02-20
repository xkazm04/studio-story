import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Beat } from '@/app/types/Beat';
import { logger } from '@/app/utils/logger';

interface BeatCreateRequest {
  name: string;
  type: string;
  project_id?: string;
  act_id?: string;
  description?: string;
  order?: number;
}

/**
 * Validates GET request parameters
 */
function validateGetParams(projectId: string | null, actId: string | null): NextResponse | null {
  if (!projectId && !actId) {
    return NextResponse.json(
      { error: 'projectId or actId is required' },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Validates POST request body
 */
function validatePostData(body: Partial<BeatCreateRequest>): NextResponse | null {
  const { name, type, project_id, act_id } = body;

  if (!name || !type) {
    return NextResponse.json(
      { error: 'name and type are required' },
      { status: 400 }
    );
  }

  if (!project_id && !act_id) {
    return NextResponse.json(
      { error: 'Either project_id or act_id is required' },
      { status: 400 }
    );
  }

  return null;
}

/**
 * Handles database errors with proper logging
 */
function handleDatabaseError(operation: string, error: unknown): NextResponse {
  logger.apiError(`${operation} /api/beats`, error);
  return NextResponse.json(
    { error: `Failed to ${operation.toLowerCase()} beat${operation === 'GET' ? 's' : ''}` },
    { status: 500 }
  );
}

/**
 * GET /api/beats?projectId=xxx&actId=yyy
 * Get beats for a project or specific act
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const actId = searchParams.get('actId');

    // Validate parameters
    const validationError = validateGetParams(projectId, actId);
    if (validationError) return validationError;

    let query = supabaseServer.from('beats').select('*');

    if (actId) {
      query = query.eq('act_id', actId);
    } else if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('order', { ascending: true });

    if (error) {
      return handleDatabaseError('GET', error);
    }

    return NextResponse.json(data as Beat[]);
  } catch (error) {
    return handleDatabaseError('GET', error);
  }
}

/**
 * POST /api/beats
 * Create a new beat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationError = validatePostData(body);
    if (validationError) return validationError;

    const { name, type, project_id, act_id, description, order } = body;

    const { data, error } = await supabaseServer
      .from('beats')
      .insert({
        name,
        type,
        project_id,
        act_id,
        description,
        order: order || 0,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      return handleDatabaseError('POST', error);
    }

    return NextResponse.json(data as Beat, { status: 201 });
  } catch (error) {
    return handleDatabaseError('POST', error);
  }
}


