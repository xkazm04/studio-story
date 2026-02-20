import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { logger } from '@/app/utils/logger';

export interface ProjectStats {
  acts: {
    count: number;
    target: number;
  };
  scenes: {
    count: number;
    target: number;
  };
  beats: {
    total: number;
    completed: number;
    completionPercentage: number;
  };
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
 * Handles database errors with proper logging
 */
function handleDatabaseError(operation: string, error: unknown): NextResponse {
  logger.apiError(`${operation} /api/projectStats`, error);
  return NextResponse.json(
    { error: `Failed to fetch project statistics` },
    { status: 500 }
  );
}

/**
 * GET /api/projectStats?projectId=xxx
 * Get unified project statistics including acts, scenes, and beats counts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    // Validate parameters
    const validationError = validateGetParams(projectId);
    if (validationError) return validationError;

    // Hardcoded targets as specified in OverviewStats component
    const TARGET_ACTS = 3;
    const TARGET_SCENES = 10;

    // Fetch all data in parallel for optimal performance
    const [actsResult, scenesResult, beatsResult] = await Promise.all([
      supabaseServer
        .from('acts')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId),

      supabaseServer
        .from('scenes')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId),

      supabaseServer
        .from('beats')
        .select('completed')
        .eq('project_id', projectId)
    ]);

    // Check for errors in any of the queries
    if (actsResult.error) {
      return handleDatabaseError('GET acts', actsResult.error);
    }
    if (scenesResult.error) {
      return handleDatabaseError('GET scenes', scenesResult.error);
    }
    if (beatsResult.error) {
      return handleDatabaseError('GET beats', beatsResult.error);
    }

    // Calculate beat statistics
    const beats = beatsResult.data || [];
    const totalBeats = beats.length;
    const completedBeats = beats.filter(beat => beat.completed).length;
    const completionPercentage = totalBeats > 0
      ? Math.round((completedBeats / totalBeats) * 100)
      : 0;

    // Build unified response
    const stats: ProjectStats = {
      acts: {
        count: actsResult.count || 0,
        target: TARGET_ACTS,
      },
      scenes: {
        count: scenesResult.count || 0,
        target: TARGET_SCENES,
      },
      beats: {
        total: totalBeats,
        completed: completedBeats,
        completionPercentage,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    return handleDatabaseError('GET', error);
  }
}
