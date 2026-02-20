import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/app/utils/logger';
import { HTTP_STATUS, API_CONSTANTS } from '@/app/utils/apiErrorHandling';

const DB_PATH = process.env.DB_PATH || './database/goals.db';

interface PacingSuggestion {
  id?: string;
  project_id: string;
  beat_id: string;
  suggestion_type: string;
  suggested_order?: number | null;
  suggested_duration?: number | null;
  reasoning: string;
  confidence?: number;
  applied?: number;
  beat_name?: string;
}

interface PacingSuggestionInsert {
  project_id: string;
  beat_id: string;
  suggestion_type: string;
  suggested_order?: number | null;
  suggested_duration?: number | null;
  reasoning: string;
  confidence: number;
}

/**
 * Validates required query parameters for GET request
 */
function validateGetParams(projectId: string | null, beatId: string | null): NextResponse | null {
  const hasRequiredIdentifier = projectId || beatId;
  if (!hasRequiredIdentifier) {
    return NextResponse.json(
      { error: 'Either projectId or beatId is required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
  return null;
}

/**
 * Builds query for fetching pacing suggestions
 */
function buildFetchQuery(
  beatId: string | null,
  projectId: string | null,
  applied: string | null
): { query: string; params: unknown[] } {
  let query = `
    SELECT bps.*,
      b.name as beat_name
    FROM beat_pacing_suggestions bps
    LEFT JOIN beats b ON bps.beat_id = b.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (beatId) {
    query += ' AND bps.beat_id = ?';
    params.push(beatId);
  } else if (projectId) {
    query += ' AND bps.project_id = ?';
    params.push(projectId);
  }

  if (applied !== null) {
    query += ' AND bps.applied = ?';
    params.push(applied === 'true' ? 1 : 0);
  }

  query += ' ORDER BY bps.confidence DESC, bps.created_at DESC';

  return { query, params };
}

/**
 * Validates required fields for POST request
 */
function validatePostData(body: Partial<PacingSuggestionInsert>): NextResponse | null {
  const { project_id, beat_id, suggestion_type, reasoning } = body;

  const hasAllRequiredFields = project_id && beat_id && suggestion_type && reasoning;
  if (!hasAllRequiredFields) {
    return NextResponse.json(
      { error: 'project_id, beat_id, suggestion_type, and reasoning are required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  return null;
}

/**
 * GET /api/beat-pacing
 * Fetch pacing suggestions with optional filters
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const beatId = searchParams.get('beatId');
  const applied = searchParams.get('applied');

  // Validate parameters
  const validationError = validateGetParams(projectId, beatId);
  if (validationError) return validationError;

  try {
    const db = new Database(DB_PATH);

    const { query, params } = buildFetchQuery(beatId, projectId, applied);

    const stmt = db.prepare(query);
    const suggestions = stmt.all(...params);
    db.close();

    return NextResponse.json(suggestions);
  } catch (error) {
    logger.apiError('GET /api/beat-pacing', error);
    return NextResponse.json(
      { error: 'Failed to fetch pacing suggestions' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/beat-pacing
 * Create new pacing suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validatePostData(body);
    if (validationError) return validationError;

    const {
      project_id,
      beat_id,
      suggestion_type,
      suggested_order,
      suggested_duration,
      reasoning,
      confidence,
    } = body;

    const db = new Database(DB_PATH);
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO beat_pacing_suggestions (
        id, project_id, beat_id, suggestion_type, suggested_order,
        suggested_duration, reasoning, confidence, applied
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    stmt.run(
      id,
      project_id,
      beat_id,
      suggestion_type,
      suggested_order || null,
      suggested_duration || null,
      reasoning,
      confidence || API_CONSTANTS.DEFAULT_PACING_CONFIDENCE
    );

    const newSuggestion = db
      .prepare('SELECT * FROM beat_pacing_suggestions WHERE id = ?')
      .get(id);

    db.close();

    return NextResponse.json(newSuggestion, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    logger.apiError('POST /api/beat-pacing', error);
    return NextResponse.json(
      { error: 'Failed to create pacing suggestion' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * PUT /api/beat-pacing
 * Update pacing suggestion (mark as applied/unapplied)
 */
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Suggestion id is required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    const body = await request.json();
    const { applied } = body;

    const db = new Database(DB_PATH);
    const stmt = db.prepare(`
      UPDATE beat_pacing_suggestions
      SET applied = ?
      WHERE id = ?
    `);

    stmt.run(applied ? 1 : 0, id);

    const updatedSuggestion = db
      .prepare('SELECT * FROM beat_pacing_suggestions WHERE id = ?')
      .get(id);

    db.close();

    return NextResponse.json(updatedSuggestion);
  } catch (error) {
    logger.apiError('PUT /api/beat-pacing', error);
    return NextResponse.json(
      { error: 'Failed to update pacing suggestion' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * DELETE /api/beat-pacing
 * Delete pacing suggestion
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Suggestion id is required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    const db = new Database(DB_PATH);
    const stmt = db.prepare('DELETE FROM beat_pacing_suggestions WHERE id = ?');
    stmt.run(id);
    db.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError('DELETE /api/beat-pacing', error);
    return NextResponse.json(
      { error: 'Failed to delete pacing suggestion' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
