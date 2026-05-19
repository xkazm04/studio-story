'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileText, ChevronRight, Tag } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { extractData } from '@/app/utils/api';

interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
  source?: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  variables: TemplateVariable[];
  updatedAt: string;
}

interface WorkspaceContext {
  projectId?: string;
  projectName?: string;
  sceneId?: string;
  actId?: string;
}

interface TemplateSuggestionsProps {
  context: WorkspaceContext;
  onSelect: (filledContent: string, templateName: string) => void;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  character: 'ms-cat-character',
  scene: 'ms-cat-scene',
  dialogue: 'ms-cat-dialogue',
  image: 'ms-cat-image',
  story: 'ms-cat-story',
  'world-building': 'ms-cat-world',
  custom: 'ms-cat-default',
};

/**
 * TemplateSuggestions — Shows relevant prompt templates in the CommandBar.
 * Fetches from /api/prompt-templates and scores by workspace context relevance.
 */
export default function TemplateSuggestions({ context, onSelect, className }: TemplateSuggestionsProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetch('/api/prompt-templates')
      .then(res => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((raw) => extractData<PromptTemplate[]>(raw))
      .then((data: PromptTemplate[]) => {
        if (!cancelled) setTemplates(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  // Score and sort templates by relevance to current workspace context
  const ranked = useMemo(() => {
    if (templates.length === 0) return [];

    return templates
      .map(t => ({
        template: t,
        score: scoreRelevance(t, context),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [templates, context]);

  const handleSelect = (template: PromptTemplate) => {
    // Simple variable resolution from context
    let filled = template.content;
    const replacements: Record<string, string | undefined> = {
      project_id: context.projectId,
      project_name: context.projectName,
      scene_id: context.sceneId,
      act_id: context.actId,
    };

    for (const [key, value] of Object.entries(replacements)) {
      if (value) {
        filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }
    }

    // Apply default values for remaining variables
    for (const v of template.variables) {
      if (v.defaultValue) {
        filled = filled.replace(new RegExp(`\\{${v.name}\\}`, 'g'), v.defaultValue);
      }
    }

    onSelect(filled, template.name);
  };

  if (error || (!loading && ranked.length === 0)) return null;

  if (loading) {
    return (
      <div className={cn('border-b border-[var(--ms-border-subtle)]/40', className)}>
        <div className="flex items-center gap-1.5 px-3 py-1.5">
          <FileText className="w-3 h-3 text-[var(--ms-text-dim)]" />
          <span className="text-[10px] font-medium text-[var(--ms-text-dim)] uppercase tracking-wider">
            Templates
          </span>
        </div>
        <div className="flex gap-1.5 px-3 pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 w-20 rounded-full bg-[var(--ms-bg-elevated)]/30 animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('border-b border-[var(--ms-border-subtle)]/40', className)}>
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        <FileText className="w-3 h-3 text-[var(--ms-text-dim)]" />
        <span className="text-[10px] font-medium text-[var(--ms-text-dim)] uppercase tracking-wider">
          Templates
        </span>
      </div>
      <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-none">
        {ranked.map(({ template }) => (
          <button
            key={template.id}
            type="button"
            onClick={() => handleSelect(template)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md',
              'text-xs text-[var(--ms-text-secondary)] whitespace-nowrap',
              'bg-[var(--ms-bg-elevated)]/40 hover:bg-[var(--ms-bg-elevated)]/80',
              'border border-[var(--ms-border-subtle)]/30 hover:border-[var(--ms-border-default)]/50',
              'transition-colors duration-150 shrink-0'
            )}
            title={template.description}
          >
            <Tag className={cn('w-3 h-3', CATEGORY_COLORS[template.category] || 'ms-cat-default')} />
            <span>{template.name}</span>
            <ChevronRight className="w-3 h-3 text-[var(--ms-text-dim)]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function scoreRelevance(template: PromptTemplate, context: WorkspaceContext): number {
  let score = 0;
  if (template.category === 'scene' && context.sceneId) score += 3;
  if (template.category === 'character' && context.projectId) score += 2;
  if (template.category === 'story' && context.actId) score += 2;
  if (template.category === 'image' && context.sceneId) score += 2;
  if (context.projectId) score += 1;

  // Boost templates with auto-fillable variables
  for (const v of template.variables) {
    const ctxKey = v.name as keyof WorkspaceContext;
    if (context[ctxKey]) score += 1;
  }

  return score;
}
