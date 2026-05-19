import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { handleDatabaseError, withApiHandler } from '@/app/utils/apiErrorHandling';

/**
 * GET /api/story-history/[id]
 * Get full details of a specific story commit (including snapshots)
 */
export const GET = withApiHandler('GET /api/story-history/[id]', async (_request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const { data, error } = await supabaseServer
    .from('story_commits')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return handleDatabaseError('fetch story commit', error);

  return NextResponse.json(data);
});
