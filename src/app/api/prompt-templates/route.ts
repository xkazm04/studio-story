/**
 * Prompt Templates API Route
 *
 * GET: List templates (query params: category, tag, query)
 * POST: Save a new template or update an existing one
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { withApiHandler } from '@/app/utils/apiErrorHandling';

const TEMPLATES_DIR = path.join(process.cwd(), '.story', 'templates');

function ensureDir(): void {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  variables: { name: string; description: string; defaultValue?: string; source?: string }[];
  createdAt: string;
  updatedAt: string;
}

const VAR_PATTERN = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

function extractVariables(content: string) {
  const seen = new Set<string>();
  const vars: PromptTemplate['variables'] = [];
  let match: RegExpExecArray | null;
  while ((match = VAR_PATTERN.exec(content)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      vars.push({
        name,
        description: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      });
    }
  }
  return vars;
}

export const GET = withApiHandler('GET /api/prompt-templates', async (request: NextRequest) => {
  ensureDir();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const query = searchParams.get('query');

  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));
  let templates: PromptTemplate[] = files.map(f =>
    JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf-8'))
  );

  if (category) templates = templates.filter(t => t.category === category);
  if (tag) templates = templates.filter(t => t.tags.includes(tag));
  if (query) {
    const q = query.toLowerCase();
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tg => tg.toLowerCase().includes(q))
    );
  }

  templates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return NextResponse.json(templates);
});

export const POST = withApiHandler('POST /api/prompt-templates', async (request: NextRequest) => {
  ensureDir();
  const body = await request.json();
  const { id, name, description, category, tags, content } = body;

  if (!name || !content) {
    return NextResponse.json(
      { error: 'name and content are required' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const templateId = id || `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const template: PromptTemplate = {
    id: templateId,
    name,
    description: description || '',
    category: category || 'custom',
    tags: tags || [],
    content,
    variables: extractVariables(content),
    createdAt: id ? (body.createdAt || now) : now,
    updatedAt: now,
  };

  fs.writeFileSync(
    path.join(TEMPLATES_DIR, `${templateId}.json`),
    JSON.stringify(template, null, 2),
    'utf-8'
  );

  return NextResponse.json(template, { status: id ? 200 : 201 });
});
