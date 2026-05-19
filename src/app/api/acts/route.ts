import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Act } from '@/app/types/Act';
import { handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

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
 * GET /api/acts?projectId=xxx
 * Get all acts for a project
 */
export const GET = withApiHandler('GET /api/acts', async (request: NextRequest) => {
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
    return handleDatabaseError('fetch acts', error, 'GET /api/acts');
  }

  return NextResponse.json(data as Act[]);
});

/**
 * POST /api/acts
 * Create a new act
 */
export const POST = withApiHandler('POST /api/acts', async (request: NextRequest) => {
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
    return handleDatabaseError('create act', error, 'POST /api/acts');
  }

  return NextResponse.json(data as Act, { status: 201 });
});
