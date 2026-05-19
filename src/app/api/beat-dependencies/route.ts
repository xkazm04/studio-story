import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';
import { dependencyGetParamsSchema, dependencyCreateSchema } from '@/lib/beats/schemas';

const DB_PATH = process.env.DB_PATH || './database/goals.db';

/**
 * GET /api/beat-dependencies
 * Fetch beat dependencies with optional filters
 */
export const GET = withApiHandler('GET /api/beat-dependencies', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const parsed = dependencyGetParamsSchema.safeParse({
    projectId: searchParams.get('projectId') || undefined,
    beatId: searchParams.get('beatId') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const { projectId, beatId } = parsed.data;

  const db = new Database(DB_PATH);

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

  const stmt = db.prepare(query);
  const dependencies = stmt.all(...params);
  db.close();

  return NextResponse.json(dependencies);
});

/**
 * POST /api/beat-dependencies
 * Create new beat dependency
 */
export const POST = withApiHandler('POST /api/beat-dependencies', async (request: NextRequest) => {
  const body = await request.json();

  const parsed = dependencyCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const { source_beat_id, target_beat_id, dependency_type, strength } = parsed.data;

  const db = new Database(DB_PATH);
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO beat_dependencies (
      id, source_beat_id, target_beat_id, dependency_type, strength
    ) VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, source_beat_id, target_beat_id, dependency_type, strength);

  const newDependency = db
    .prepare('SELECT * FROM beat_dependencies WHERE id = ?')
    .get(id);

  db.close();

  return NextResponse.json(newDependency, { status: HTTP_STATUS.CREATED });
});

/**
 * DELETE /api/beat-dependencies
 * Delete beat dependency
 */
export const DELETE = withApiHandler('DELETE /api/beat-dependencies', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Dependency id is required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const db = new Database(DB_PATH);
  const stmt = db.prepare('DELETE FROM beat_dependencies WHERE id = ?');
  stmt.run(id);
  db.close();

  return NextResponse.json({ success: true });
});
