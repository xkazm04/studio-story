/**
 * Prompt Templates [id] API Route
 *
 * GET: Get a single template by ID
 * PATCH: Update a template
 * DELETE: Delete a template
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

const TEMPLATES_DIR = path.join(process.cwd(), '.story', 'templates');

function templatePath(id: string): string {
  return path.join(TEMPLATES_DIR, `${id}.json`);
}

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiHandler('GET /api/prompt-templates/[id]', async (_request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const fp = templatePath(id);
  if (!fs.existsSync(fp)) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  const template = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  return NextResponse.json(template);
});

export const PATCH = withApiHandler('PATCH /api/prompt-templates/[id]', async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const fp = templatePath(id);
  if (!fs.existsSync(fp)) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  const existing = JSON.parse(fs.readFileSync(fp, 'utf-8'));
  const updates = await request.json();

  const merged = {
    ...existing,
    ...updates,
    id, // prevent ID change
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(fp, JSON.stringify(merged, null, 2), 'utf-8');
  return NextResponse.json(merged);
});

export const DELETE = withApiHandler('DELETE /api/prompt-templates/[id]', async (_request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const fp = templatePath(id);
  if (!fs.existsSync(fp)) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
  fs.unlinkSync(fp);
  return NextResponse.json({ success: true });
});
