import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { HTTP_STATUS, withApiHandler } from '@/app/utils/apiErrorHandling';
import { pacingGetParamsSchema, pacingCreateSchema } from '@/lib/beats/schemas';

const DB_PATH = process.env.DB_PATH || './database/goals.db';

/**
 * GET /api/beat-pacing
 * Fetch pacing suggestions with optional filters
 */
export const GET = withApiHandler('GET /api/beat-pacing', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const applied = searchParams.get('applied');

  const parsed = pacingGetParamsSchema.safeParse({
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

  const stmt = db.prepare(query);
  const suggestions = stmt.all(...params);
  db.close();

  return NextResponse.json(suggestions);
});

/**
 * POST /api/beat-pacing
 * Create new pacing suggestion
 */
export const POST = withApiHandler('POST /api/beat-pacing', async (request: NextRequest) => {
  const body = await request.json();

  const parsed = pacingCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const {
    project_id,
    beat_id,
    suggestion_type,
    suggested_order,
    suggested_duration,
    reasoning,
    confidence,
  } = parsed.data;

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
    suggested_order ?? null,
    suggested_duration ?? null,
    reasoning,
    confidence
  );

  const newSuggestion = db
    .prepare('SELECT * FROM beat_pacing_suggestions WHERE id = ?')
    .get(id);

  db.close();

  return NextResponse.json(newSuggestion, { status: HTTP_STATUS.CREATED });
});

/**
 * PUT /api/beat-pacing
 * Update pacing suggestion (mark as applied/unapplied)
 */
export const PUT = withApiHandler('PUT /api/beat-pacing', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Suggestion id is required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

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
});

/**
 * DELETE /api/beat-pacing
 * Delete pacing suggestion
 */
export const DELETE = withApiHandler('DELETE /api/beat-pacing', async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Suggestion id is required' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  const db = new Database(DB_PATH);
  const stmt = db.prepare('DELETE FROM beat_pacing_suggestions WHERE id = ?');
  stmt.run(id);
  db.close();

  return NextResponse.json({ success: true });
});
