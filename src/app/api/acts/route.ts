import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Act } from '@/app/types/Act';
import { logger } from '@/app/utils/logger';

interface ActCreateRequest {
  name: string;
  project_id: string;
  description?: string;
  order?: number;
}

/**
 * Validates GET request parameters
 */
function validateGetParams(projectId: string | null): NextResponse | null {
  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId is required' },
      { status: 400 }
    );
  }
  return null;
}

/**
 * Validates POST request body
 */
function validatePostData(body: Partial<ActCreateRequest>): NextResponse | null {
  const { name, project_id } = body;

  if (!name || !project_id) {
    return NextResponse.json(
      { error: 'name and project_id are required' },
      { status: 400 }
    );
  }

  return null;
}

/**
 * Handles database errors with proper logging
 */
function handleDatabaseError(operation: string, error: unknown): NextResponse {
  logger.apiError(`${operation} /api/acts`, error);
  return NextResponse.json(
    { error: `Failed to ${operation.toLowerCase()} act${operation === 'GET' ? 's' : ''}` },
    { status: 500 }
  );
}

/**
 * GET /api/acts?projectId=xxx
 * Get all acts for a project
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    // Validate parameters
    const validationError = validateGetParams(projectId);
    if (validationError) return validationError;

    const { data, error } = await supabaseServer
      .from('acts')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (error) {
      return handleDatabaseError('GET', error);
    }

    return NextResponse.json(data as Act[]);
  } catch (error) {
    return handleDatabaseError('GET', error);
  }
}

/**
 * POST /api/acts
 * Create a new act
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validationError = validatePostData(body);
    if (validationError) return validationError;

    const { name, project_id, description, order } = body;

    const { data, error } = await supabaseServer
      .from('acts')
      .insert({
        name,
        project_id,
        description,
        order,
      })
      .select()
      .single();

    if (error) {
      return handleDatabaseError('POST', error);
    }

    return NextResponse.json(data as Act, { status: 201 });
  } catch (error) {
    return handleDatabaseError('POST', error);
  }
}


