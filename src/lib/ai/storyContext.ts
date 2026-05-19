/**
 * Story context assembly for AI writing tools
 *
 * Gathers full story context (premise, characters, beats, scene text)
 * and applies token budgeting to fit within Claude's context window.
 */

import { supabaseServer } from '@/lib/supabase/server';
import type { ContextPin } from '@/app/types/ContextPin';

// ── Types ────────────────────────────────────────────────────────────────────

export interface StoryContext {
  premise: string;
  genre: string;
  setting: string;
  characters: Array<{ name: string; traits: string; role: string }>;
  beats: Array<{ name: string; description: string }>;
  priorSceneText: string;
  currentSceneTextBefore: string;
  selectedText: string;
  currentSceneTextAfter: string;
  /** Persistent context pins (story rules) — always included at highest priority */
  contextPins: ContextPin[];
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Maximum token budget for the full context. ~80K tokens leaves room for response. */
const MAX_TOKEN_BUDGET = 80_000;

/** Estimate tokens from text: approximately 1 token per 0.75 words */
function estimateTokens(text: string): number {
  if (!text) return 0;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / 0.75);
}

// ── Context Assembly ─────────────────────────────────────────────────────────

/**
 * Assemble full story context for a given scene and selection.
 *
 * Queries Supabase for project metadata, characters, beats, and scenes.
 * Splits the current scene content at selection boundaries.
 * Applies token budgeting: truncates oldest prior scene text first
 * while always keeping premise, characters, current scene, and selected text.
 */
export async function assembleStoryContext(
  projectId: string,
  sceneId: string,
  selectionFrom: number,
  selectionTo: number
): Promise<StoryContext> {
  // 1. Fetch project metadata
  const { data: project } = await supabaseServer
    .from('projects')
    .select('name, premise, genre, setting')
    .eq('id', projectId)
    .single();

  // 2. Fetch characters
  const { data: characters } = await supabaseServer
    .from('characters')
    .select('name, traits, role')
    .eq('project_id', projectId);

  // 3. Fetch acts ordered by sort_order
  const { data: acts } = await supabaseServer
    .from('acts')
    .select('id, name, sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  // 4. Fetch beats for all acts
  const actIds = (acts ?? []).map((a) => a.id);
  const { data: beats } = await supabaseServer
    .from('beats')
    .select('id, name, description, act_id, sort_order')
    .in('act_id', actIds.length > 0 ? actIds : ['__none__'])
    .order('sort_order', { ascending: true });

  // 5. Fetch enabled context pins for the project
  const { data: contextPins } = await supabaseServer
    .from('context_pins')
    .select('*')
    .eq('project_id', projectId)
    .eq('enabled', true)
    .order('sort_order', { ascending: true });

  // 6. Fetch all scenes ordered by act sort_order, then scene sort_order
  const { data: scenes } = await supabaseServer
    .from('scenes')
    .select('id, title, content, act_id, sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  // Sort scenes by act order, then scene order
  const actOrderMap = new Map((acts ?? []).map((a) => [a.id, a.sort_order ?? 0]));
  const sortedScenes = (scenes ?? []).sort((a, b) => {
    const actOrderA = actOrderMap.get(a.act_id) ?? 999;
    const actOrderB = actOrderMap.get(b.act_id) ?? 999;
    if (actOrderA !== actOrderB) return actOrderA - actOrderB;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  // 7. Find current scene and split at selection boundaries
  const currentScene = sortedScenes.find((s) => s.id === sceneId);
  const sceneContent = currentScene?.content ?? '';

  const currentSceneTextBefore = sceneContent.slice(0, selectionFrom);
  const selectedText = sceneContent.slice(selectionFrom, selectionTo);
  const currentSceneTextAfter = sceneContent.slice(selectionTo);

  // 8. Gather prior scene text (all scenes before current)
  const currentSceneIndex = sortedScenes.findIndex((s) => s.id === sceneId);
  const priorScenes = currentSceneIndex > 0 ? sortedScenes.slice(0, currentSceneIndex) : [];
  let priorSceneText = priorScenes.map((s) => s.content ?? '').join('\n\n---\n\n');

  // 9. Build context
  const ctx: StoryContext = {
    premise: project?.premise ?? '',
    genre: project?.genre ?? '',
    setting: project?.setting ?? '',
    characters: (characters ?? []).map((c) => ({
      name: c.name ?? '',
      traits: typeof c.traits === 'string' ? c.traits : JSON.stringify(c.traits ?? ''),
      role: c.role ?? '',
    })),
    beats: (beats ?? []).map((b) => ({
      name: b.name ?? '',
      description: b.description ?? '',
    })),
    priorSceneText,
    currentSceneTextBefore,
    selectedText,
    currentSceneTextAfter,
    contextPins: (contextPins ?? []) as ContextPin[],
  };

  // 10. Apply token budget
  return applyTokenBudget(ctx);
}

/**
 * Apply token budgeting to a StoryContext.
 * Truncates priorSceneText (oldest first) when total exceeds MAX_TOKEN_BUDGET.
 * Always keeps: premise, genre, setting, characters, beats, current scene text, selected text.
 */
function applyTokenBudget(ctx: StoryContext): StoryContext {
  // Calculate tokens for non-truncatable parts (pins are always included)
  const pinTokens = ctx.contextPins.length > 0
    ? estimateTokens(ctx.contextPins.map((p) => `${p.label}: ${p.content}`).join(' '))
    : 0;

  const fixedTokens =
    estimateTokens(ctx.premise) +
    estimateTokens(ctx.genre) +
    estimateTokens(ctx.setting) +
    estimateTokens(ctx.characters.map((c) => `${c.name} ${c.traits} ${c.role}`).join(' ')) +
    estimateTokens(ctx.beats.map((b) => `${b.name} ${b.description}`).join(' ')) +
    estimateTokens(ctx.currentSceneTextBefore) +
    estimateTokens(ctx.selectedText) +
    estimateTokens(ctx.currentSceneTextAfter) +
    pinTokens +
    500; // Formatting overhead

  const availableForPrior = MAX_TOKEN_BUDGET - fixedTokens;

  if (availableForPrior <= 0) {
    // No room for prior scenes at all
    return { ...ctx, priorSceneText: '' };
  }

  const priorTokens = estimateTokens(ctx.priorSceneText);
  if (priorTokens <= availableForPrior) {
    // Fits within budget
    return ctx;
  }

  // Truncate prior scene text: keep most recent scenes, drop oldest
  // Split into scene segments and keep from the end
  const segments = ctx.priorSceneText.split('\n\n---\n\n');
  let totalTokens = 0;
  const keptSegments: string[] = [];

  // Iterate from most recent to oldest
  for (let i = segments.length - 1; i >= 0; i--) {
    const segTokens = estimateTokens(segments[i]);
    if (totalTokens + segTokens > availableForPrior) break;
    totalTokens += segTokens;
    keptSegments.unshift(segments[i]);
  }

  return {
    ...ctx,
    priorSceneText: keptSegments.join('\n\n---\n\n'),
  };
}

// ── Prompt Formatting ────────────────────────────────────────────────────────

/**
 * Format a StoryContext into a structured markdown string
 * for inclusion in the Claude system prompt.
 */
export function formatStoryContextForPrompt(ctx: StoryContext): string {
  // Apply token budget before formatting
  const budgeted = applyTokenBudget(ctx);

  const sections: string[] = [];

  sections.push('# Story Context\n');

  if (budgeted.premise) {
    sections.push(`## Premise\n${budgeted.premise}\n`);
  }

  if (budgeted.genre) {
    sections.push(`## Genre\n${budgeted.genre}\n`);
  }

  if (budgeted.setting) {
    sections.push(`## Setting\n${budgeted.setting}\n`);
  }

  // Context pins are injected at highest priority — before characters
  if (budgeted.contextPins.length > 0) {
    const pinsByType = new Map<string, typeof budgeted.contextPins>();
    for (const pin of budgeted.contextPins) {
      const existing = pinsByType.get(pin.pin_type) ?? [];
      existing.push(pin);
      pinsByType.set(pin.pin_type, existing);
    }

    const typeLabels: Record<string, string> = {
      world_rule: 'World Rules',
      character_constraint: 'Character Constraints',
      tone_directive: 'Tone Directives',
      plot_boundary: 'Plot Boundaries',
    };

    const pinLines: string[] = [];
    for (const [type, pins] of pinsByType) {
      pinLines.push(`### ${typeLabels[type] ?? type}`);
      for (const pin of pins) {
        pinLines.push(`- **${pin.label}**: ${pin.content}`);
      }
    }
    sections.push(`## Story Rules (MUST follow)\n${pinLines.join('\n')}\n`);
  }

  if (budgeted.characters.length > 0) {
    const charLines = budgeted.characters
      .map((c) => `- **${c.name}** (${c.role}): ${c.traits}`)
      .join('\n');
    sections.push(`## Characters\n${charLines}\n`);
  }

  if (budgeted.beats.length > 0) {
    const beatLines = budgeted.beats
      .map((b) => `- **${b.name}**: ${b.description}`)
      .join('\n');
    sections.push(`## Story Beats\n${beatLines}\n`);
  }

  if (budgeted.priorSceneText) {
    sections.push(`## Prior Scene Text\n${budgeted.priorSceneText}\n`);
  }

  sections.push('## Current Scene\n');

  if (budgeted.currentSceneTextBefore) {
    sections.push(`### Text Before Selection\n${budgeted.currentSceneTextBefore}\n`);
  }

  if (budgeted.selectedText) {
    sections.push(`### Selected Text\n${budgeted.selectedText}\n`);
  }

  if (budgeted.currentSceneTextAfter) {
    sections.push(`### Text After Selection\n${budgeted.currentSceneTextAfter}\n`);
  }

  return sections.join('\n');
}
