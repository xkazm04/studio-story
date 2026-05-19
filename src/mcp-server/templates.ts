/**
 * File-based Prompt Template Storage
 *
 * Stores prompt templates as individual JSON files in `.story/templates/`.
 * Each template has variable slots like {character_name} that can be resolved
 * from workspace context or explicit overrides.
 */

import * as fs from 'fs';
import * as path from 'path';

// ============ Types ============

export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
  /** Context source for auto-resolution: 'project', 'scene', 'character', 'act', or 'manual' */
  source?: 'project' | 'scene' | 'character' | 'act' | 'manual';
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: 'character' | 'scene' | 'dialogue' | 'image' | 'story' | 'world-building' | 'custom';
  tags: string[];
  content: string;
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateContext {
  project_id?: string;
  project_name?: string;
  project_genre?: string;
  project_setting?: string;
  scene_id?: string;
  scene_title?: string;
  character_name?: string;
  character_id?: string;
  act_id?: string;
  act_title?: string;
  [key: string]: string | undefined;
}

// ============ Storage ============

const TEMPLATES_DIR = path.join(process.cwd(), '.story', 'templates');

function ensureDir(): void {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
}

function templatePath(id: string): string {
  return path.join(TEMPLATES_DIR, `${id}.json`);
}

// ============ CRUD ============

export function saveTemplate(template: PromptTemplate): PromptTemplate {
  ensureDir();
  const now = new Date().toISOString();

  if (!template.id) {
    template.id = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    template.createdAt = now;
  }
  template.updatedAt = now;

  // Extract variables from content (single-brace: {var_name})
  if (!template.variables || template.variables.length === 0) {
    template.variables = extractVariables(template.content);
  }

  fs.writeFileSync(templatePath(template.id), JSON.stringify(template, null, 2), 'utf-8');
  return template;
}

export function getTemplate(id: string): PromptTemplate | null {
  const fp = templatePath(id);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8')) as PromptTemplate;
}

export function listTemplates(options?: {
  category?: string;
  tag?: string;
  query?: string;
}): PromptTemplate[] {
  ensureDir();
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.json'));

  let templates: PromptTemplate[] = files.map(f => {
    return JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf-8')) as PromptTemplate;
  });

  if (options?.category) {
    templates = templates.filter(t => t.category === options.category);
  }
  if (options?.tag) {
    templates = templates.filter(t => t.tags.includes(options.tag!));
  }
  if (options?.query) {
    const q = options.query.toLowerCase();
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }

  return templates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function deleteTemplate(id: string): boolean {
  const fp = templatePath(id);
  if (!fs.existsSync(fp)) return false;
  fs.unlinkSync(fp);
  return true;
}

// ============ Variable Resolution ============

const VAR_PATTERN = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

export function extractVariables(content: string): TemplateVariable[] {
  const seen = new Set<string>();
  const vars: TemplateVariable[] = [];
  let match: RegExpExecArray | null;

  while ((match = VAR_PATTERN.exec(content)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      vars.push({
        name,
        description: humanize(name),
        source: inferSource(name),
      });
    }
  }

  return vars;
}

function inferSource(varName: string): TemplateVariable['source'] {
  if (varName.startsWith('project_')) return 'project';
  if (varName.startsWith('scene_')) return 'scene';
  if (varName.startsWith('character_')) return 'character';
  if (varName.startsWith('act_')) return 'act';
  return 'manual';
}

function humanize(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function fillTemplate(
  template: PromptTemplate,
  context: TemplateContext,
  overrides?: Record<string, string>
): { filled: string; unresolved: string[] } {
  const merged = { ...context, ...overrides };
  const unresolved: string[] = [];

  const filled = template.content.replace(VAR_PATTERN, (fullMatch, varName) => {
    const value = merged[varName];
    if (value !== undefined && value !== '') {
      return value;
    }
    // Check variable default
    const varDef = template.variables.find(v => v.name === varName);
    if (varDef?.defaultValue) {
      return varDef.defaultValue;
    }
    unresolved.push(varName);
    return fullMatch;
  });

  return { filled, unresolved };
}

/**
 * Score how relevant a template is to the current workspace context.
 * Higher = more relevant. Used for CommandBar suggestions.
 */
export function scoreTemplateRelevance(
  template: PromptTemplate,
  context: TemplateContext
): number {
  let score = 0;

  // Category alignment with available context
  if (template.category === 'scene' && context.scene_id) score += 3;
  if (template.category === 'character' && context.character_id) score += 3;
  if (template.category === 'story' && context.act_id) score += 2;
  if (template.category === 'image' && context.scene_id) score += 2;

  // Variables that can be auto-filled from context
  for (const v of template.variables) {
    if (context[v.name]) score += 1;
  }

  // Has project context at all
  if (context.project_id) score += 1;

  return score;
}
