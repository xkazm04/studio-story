/**
 * DELETE /api/datasets/[id]/images/[imageId] — Remove image from dataset
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError, HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';

type RouteContext = { params: Promise<{ id: string; imageId: string }> };

export const DELETE = withApiHandler('DELETE /api/datasets/[id]/images/[imageId]', async (_request: NextRequest, context: RouteContext) => {
  const { imageId } = await context.params;
  const { error } = await supabaseServer
    .from('dataset_images')
    .delete()
    .eq('id', imageId);

  if (error) return handleDatabaseError('delete dataset image', error, `DELETE /api/datasets/.../images/${imageId}`);
  return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
});
