import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Project } from '@/app/types/Project';
import { logger } from '@/app/utils/logger';
import { HTTP_STATUS, createErrorResponse } from '@/app/utils/apiErrorHandling';

/**
 * Fetches a project by ID from the database
 */
async function fetchProject(id: string) {
  const { data, error } = await supabaseServer
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Updates a project in the database
 */
async function updateProject(id: string, updateData: Partial<Project>) {
  const { data, error } = await supabaseServer
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Deletes a project from the database
 */
async function deleteProject(id: string) {
  const { error } = await supabaseServer
    .from('projects')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * GET /api/projects/[id]
 * Get a single project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await fetchProject(id);

    if (error) {
      logger.apiError('GET /api/projects/[id]', error, { projectId: id });
      return createErrorResponse('Project not found', HTTP_STATUS.NOT_FOUND);
    }

    return NextResponse.json(data as Project);
  } catch (error) {
    logger.apiError('GET /api/projects/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * PUT /api/projects/[id]
 * Update a project
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const updateData: Partial<Project> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const { data, error } = await updateProject(id, updateData);

    if (error) {
      logger.apiError('PUT /api/projects/[id]', error, { projectId: id });
      return createErrorResponse('Failed to update project', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json(data as Project);
  } catch (error) {
    logger.apiError('PUT /api/projects/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await deleteProject(id);

    if (error) {
      logger.apiError('DELETE /api/projects/[id]', error, { projectId: id });
      return createErrorResponse('Failed to delete project', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.apiError('DELETE /api/projects/[id]', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
