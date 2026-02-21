import type { WorkspacePreset } from './workspacePresets';
import { TOOL_PRIMARY_PANEL_TYPES } from './workflowHints';
import type { WorkspacePanelType } from '../types';

interface RecommendationContext {
  presets: WorkspacePreset[];
  activePanelTypes: WorkspacePanelType[];
  recentTools: string[];
  hasProject: boolean;
  hasAct: boolean;
  hasScene: boolean;
  presetFeedback?: Record<string, number>;
  dismissedRecommendationIds?: string[];
  limit?: number;
}

export interface ExplainedPresetRecommendation {
  preset: WorkspacePreset;
  score: number;
  reasons: string[];
}

const CONTEXT_PANEL_BONUSES: Array<{ when: (ctx: RecommendationContext) => boolean; panelTypes: WorkspacePanelType[]; score: number }> = [
  {
    when: (ctx) => ctx.hasScene,
    panelTypes: ['scene-editor', 'writing-desk', 'dialogue-view'],
    score: 10,
  },
  {
    when: (ctx) => ctx.hasAct,
    panelTypes: ['beats-manager', 'story-map', 'scene-list'],
    score: 8,
  },
  {
    when: (ctx) => ctx.hasProject,
    panelTypes: ['story-graph', 'story-evaluator', 'character-cards', 'voice-manager'],
    score: 4,
  },
];

export function getExplainedPresetRecommendations({
  presets,
  activePanelTypes,
  recentTools,
  hasProject,
  hasAct,
  hasScene,
  presetFeedback = {},
  dismissedRecommendationIds = [],
  limit = 4,
}: RecommendationContext): ExplainedPresetRecommendation[] {
  const activeSet = new Set(activePanelTypes);
  const dismissedSet = new Set(dismissedRecommendationIds);
  const ctx: RecommendationContext = {
    presets,
    activePanelTypes,
    recentTools,
    hasProject,
    hasAct,
    hasScene,
    presetFeedback,
    dismissedRecommendationIds,
    limit,
  };

  const scored = presets.map((preset, index) => {
    if (dismissedSet.has(preset.id)) return null;

    let score = 0;
    const reasons: string[] = [];

    const presetTypes = preset.panels.map((panel) => panel.type);

    const activeMatches = presetTypes.filter((type) => activeSet.has(type));
    if (activeMatches.length > 0) {
      score += activeMatches.length * 14;
      reasons.push(
        `Matches active panels (${activeMatches.slice(0, 2).join(', ')}${activeMatches.length > 2 ? ', …' : ''})`
      );
    }

    const toolMatches = new Set<string>();

    for (const toolName of recentTools) {
      const hintedTypes = TOOL_PRIMARY_PANEL_TYPES[toolName] ?? [];
      for (const hintedType of hintedTypes) {
        if (presetTypes.includes(hintedType)) {
          score += 10;
          toolMatches.add(toolName);
        }
      }
    }

    if (toolMatches.size > 0) {
      reasons.push(
        `Aligned with recent CLI tools (${Array.from(toolMatches).slice(0, 2).join(', ')}${toolMatches.size > 2 ? ', …' : ''})`
      );
    }

    const contextReasons = new Set<string>();
    for (const bonus of CONTEXT_PANEL_BONUSES) {
      if (!bonus.when(ctx)) continue;
      for (const type of bonus.panelTypes) {
        if (presetTypes.includes(type)) {
          score += bonus.score;
          if (bonus.when === CONTEXT_PANEL_BONUSES[0].when) contextReasons.add('Fits current scene context');
          if (bonus.when === CONTEXT_PANEL_BONUSES[1].when) contextReasons.add('Fits current act planning context');
          if (bonus.when === CONTEXT_PANEL_BONUSES[2].when) contextReasons.add('Fits current project context');
        }
      }
    }

    if (contextReasons.size > 0) {
      reasons.push(...contextReasons);
    }

    const feedbackBoost = presetFeedback[preset.id] ?? 0;
    if (feedbackBoost !== 0) {
      score += feedbackBoost;
      if (feedbackBoost > 0) {
        reasons.push('Previously used successfully');
      } else {
        reasons.push('Lower priority from prior dismissal');
      }
    }

    if (reasons.length === 0) {
      reasons.push('General workflow fit for current workspace');
    }

    return { preset, score, index, reasons };
  }).filter((entry): entry is { preset: WorkspacePreset; score: number; index: number; reasons: string[] } => entry !== null);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  return scored.slice(0, limit).map((entry) => ({
    preset: entry.preset,
    score: entry.score,
    reasons: entry.reasons,
  }));
}

export function getRecommendedPresets(context: RecommendationContext): WorkspacePreset[] {
  return getExplainedPresetRecommendations(context).map((entry) => entry.preset);
}
