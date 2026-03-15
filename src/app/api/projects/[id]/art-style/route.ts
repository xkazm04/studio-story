import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Project } from '@/app/types/Project';
import { logger } from '@/app/utils/logger';
import { HTTP_STATUS, createErrorResponse } from '@/app/utils/apiErrorHandling';

/**
 * PUT /api/projects/[id]/art-style
 * Update a project's art style configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { artStyleId, customArtStylePrompt, artStyleSource, extractedStyleImageUrl } = body;

    const updateData: Partial<Project> = {};
    if (artStyleId !== undefined) updateData.artStyleId = artStyleId;
    if (customArtStylePrompt !== undefined) updateData.customArtStylePrompt = customArtStylePrompt;
    if (artStyleSource !== undefined) updateData.artStyleSource = artStyleSource;
    if (extractedStyleImageUrl !== undefined) updateData.extractedStyleImageUrl = extractedStyleImageUrl;

    const { data, error } = await supabaseServer
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.apiError('PUT /api/projects/[id]/art-style', error, { projectId: id });
      return createErrorResponse('Failed to update project art style', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return NextResponse.json(data as Project);
  } catch (error) {
    logger.apiError('PUT /api/projects/[id]/art-style', error);
    return createErrorResponse('Internal server error', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
