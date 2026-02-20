import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/app/utils/logger';
import { HTTP_STATUS } from '@/app/utils/apiErrorHandling';

const DB_PATH = process.env.DB_PATH || './database/goals.db';

interface BeatDependency {
  id?: string;
  source_beat_id: string;
  target_beat_id: string;
  dependency_type?: string;
  strength?: string;
  source_name?: string;
  target_name?: string;
}

/**
 * Validates required query parameters for GET request
 */
function validateGetParams(projectId: string | null, beatId: string | null): NextResponse | null {
  if (!projectId && !beatId) {
    return NextResponse.json(
      { error: 'Either projectId or beatId is required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
  return null;
}

/**
 * Builds query for fetching beat dependencies
 */
function buildFetchQuery(
  beatId: string | null,
  projectId: string | null
): { query: string; params: unknown[] } {
  let query = `
    SELECT bd.*,
      sb.name as source_name,
      tb.name as target_name
    FROM beat_dependencies bd
    LEFT JOIN beats sb ON bd.source_beat_id = sb.id
    LEFT JOIN beats tb ON bd.target_beat_id = tb.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (beatId) {
    query += ' AND (bd.source_beat_id = ? OR bd.target_beat_id = ?)';
    params.push(beatId, beatId);
  } else if (projectId) {
    query += ' AND sb.project_id = ?';
    params.push(projectId);
  }

  return { query, params };
}

/**
 * Validates required fields for POST request
 */
function validatePostData(body: Partial<BeatDependency>): NextResponse | null {
  const { source_beat_id, target_beat_id } = body;

  if (!source_beat_id || !target_beat_id) {
    return NextResponse.json(
      { error: 'source_beat_id and target_beat_id are required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  return null;
}

/**
 * GET /api/beat-dependencies
 * Fetch beat dependencies with optional filters
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const beatId = searchParams.get('beatId');

  // Validate parameters
  const validationError = validateGetParams(projectId, beatId);
  if (validationError) return validationError;

  try {
    const db = new Database(DB_PATH);

    const { query, params } = buildFetchQuery(beatId, projectId);

    const stmt = db.prepare(query);
    const dependencies = stmt.all(...params);
    db.close();

    return NextResponse.json(dependencies);
  } catch (error) {
    logger.apiError('GET /api/beat-dependencies', error);
    return NextResponse.json(
      { error: 'Failed to fetch beat dependencies' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST /api/beat-dependencies
 * Create new beat dependency
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const validationError = validatePostData(body);
    if (validationError) return validationError;

    const { source_beat_id, target_beat_id, dependency_type, strength } = body;

    const db = new Database(DB_PATH);
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO beat_dependencies (
        id, source_beat_id, target_beat_id, dependency_type, strength
      ) VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      source_beat_id,
      target_beat_id,
      dependency_type || 'sequential',
      strength || 'required'
    );

    const newDependency = db
      .prepare('SELECT * FROM beat_dependencies WHERE id = ?')
      .get(id);

    db.close();

    return NextResponse.json(newDependency, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    logger.apiError('POST /api/beat-dependencies', error);
    return NextResponse.json(
      { error: 'Failed to create beat dependency' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * DELETE /api/beat-dependencies
 * Delete beat dependency
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Dependency id is required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  try {
    const db = new Database(DB_PATH);
    const stmt = db.prepare('DELETE FROM beat_dependencies WHERE id = ?');
    stmt.run(id);
    db.close();

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError('DELETE /api/beat-dependencies', error);
    return NextResponse.json(
      { error: 'Failed to delete beat dependency' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
