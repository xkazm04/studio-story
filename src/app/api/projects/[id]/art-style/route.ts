import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { Project } from '@/app/types/Project';
import { HTTP_STATUS, createErrorResponse, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * PUT /api/projects/[id]/art-style
 * Update a project's art style configuration
 */
export const PUT = withApiHandler('PUT /api/projects/[id]/art-style', async (request: NextRequest, context) => {
  const { id } = await context.params;
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
    return createErrorResponse('Failed to update project art style', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json(data as Project);
});
