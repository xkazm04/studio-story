/**
 * VN Export Bridge — Pure utility functions for Visual Novel data assembly
 *
 * Transforms raw scene/choice data into VN-ready StoryExportData.
 * Handles graph traversal for reachable scene detection, implicit "Continue"
 * choice injection, empty scene filtering, and gradient fallback backgrounds.
 *
 * No React, no hooks — pure functions only.
 */

import type { StoryExportScene } from './types';
import { escapeXml } from './utils';
import type { SceneChoice } from '@/app/types/SceneChoice';
import { parseScreenplayToScriptLines } from '@/app/features/voice/lib/screenplayParser';

// ============================================================================
// Input types (minimal interfaces to avoid importing heavy app types)
// ============================================================================

export interface VNSceneInput {
  id: string;
  name: string;
  order: number;
  act_id: string;
  script?: string | null;
  content?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
}

export interface VNActInput {
  id: string;
  order: number;
}

export interface ExportSummary {
  totalScenes: number;
  includedScenes: number;
  withIllustrations: number;
  withAudio: number;
  emptySkipped: number;
  deadEnds: number;
}

export interface BuildVNExportParams {
  scenes: VNSceneInput[];
  acts: VNActInput[];
  choices: SceneChoice[];
  artStylePalette?: string[];
}

// ============================================================================
// findReachableScenes — BFS graph traversal
// ============================================================================

/**
 * Find all scenes reachable from startSceneId via explicit choices and
 * implicit linear links (scenes without explicit choices get a "Continue"
 * link to the next scene in order).
 */
export function findReachableScenes(
  startSceneId: string,
  choices: SceneChoice[],
  orderedSceneIds: string[]
): Set<string> {
  // Build adjacency: scene -> set of target scenes
  const adjacency = new Map<string, Set<string>>();
  const hasExplicitChoices = new Set<string>();

  // Track which scenes have explicit choices
  for (const c of choices) {
    hasExplicitChoices.add(c.scene_id);
    if (c.target_scene_id) {
      const targets = adjacency.get(c.scene_id) || new Set<string>();
      targets.add(c.target_scene_id);
      adjacency.set(c.scene_id, targets);
    }
  }

  // Add implicit links for scenes WITHOUT explicit choices
  for (let i = 0; i < orderedSceneIds.length - 1; i++) {
    const sceneId = orderedSceneIds[i];
    if (!hasExplicitChoices.has(sceneId)) {
      const nextId = orderedSceneIds[i + 1];
      const targets = adjacency.get(sceneId) || new Set<string>();
      targets.add(nextId);
      adjacency.set(sceneId, targets);
    }
  }

  // BFS from start
  const visited = new Set<string>();
  const queue: string[] = [startSceneId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const targets = adjacency.get(current);
    if (targets) {
      for (const target of targets) {
        if (!visited.has(target)) {
          queue.push(target);
        }
      }
    }
  }

  return visited;
}

// ============================================================================
// buildVNExportScenes — Complete data assembly
// ============================================================================

/**
 * Build the VN export scene array from raw scene/act/choice data.
 *
 * Assembly flow:
 * 1. Sort acts by order, sort scenes within each act by order
 * 2. Find reachable scenes via graph traversal
 * 3. Filter to reachable + non-empty scenes
 * 4. Map each scene to StoryExportScene with dialogueLines, choices, etc.
 * 5. Inject implicit "Continue" choices for linear scenes
 * 6. Mark dead-end scenes as endings
 */
export function buildVNExportScenes(
  params: BuildVNExportParams
): { scenes: StoryExportScene[]; summary: ExportSummary } {
  const { scenes, acts, choices } = params;

  // Sort acts by order
  const sortedActs = [...acts].sort((a, b) => a.order - b.order);

  // Sort scenes by act order, then scene order within act
  const actOrderMap = new Map<string, number>();
  for (const act of sortedActs) {
    actOrderMap.set(act.id, act.order);
  }

  const sortedScenes = [...scenes].sort((a, b) => {
    const actDiff = (actOrderMap.get(a.act_id) ?? 0) - (actOrderMap.get(b.act_id) ?? 0);
    if (actDiff !== 0) return actDiff;
    return a.order - b.order;
  });

  const orderedSceneIds = sortedScenes.map((s) => s.id);
  const startSceneId = orderedSceneIds[0];

  if (!startSceneId) {
    return {
      scenes: [],
      summary: {
        totalScenes: 0, includedScenes: 0, withIllustrations: 0,
        withAudio: 0, emptySkipped: 0, deadEnds: 0,
      },
    };
  }

  // Find reachable scenes
  const reachable = findReachableScenes(startSceneId, choices, orderedSceneIds);

  // Build a set of scenes with explicit choices
  const hasExplicitChoices = new Set<string>();
  for (const c of choices) {
    hasExplicitChoices.add(c.scene_id);
  }

  // Filter: reachable + non-empty
  const isEmpty = (s: VNSceneInput) => {
    const hasScript = s.script && s.script.trim().length > 0;
    const hasContent = s.content && s.content.trim().length > 0;
    return !hasScript && !hasContent;
  };

  let emptySkipped = 0;
  const filteredScenes = sortedScenes.filter((s) => {
    if (!reachable.has(s.id)) return false;
    if (isEmpty(s)) {
      emptySkipped++;
      return false;
    }
    return true;
  });

  // Build ordered IDs of included scenes (for implicit Continue logic)
  const includedIds = filteredScenes.map((s) => s.id);
  const includedIdSet = new Set(includedIds);

  // Map choices by scene_id for quick lookup
  const choicesByScene = new Map<string, SceneChoice[]>();
  for (const c of choices) {
    const arr = choicesByScene.get(c.scene_id) || [];
    arr.push(c);
    choicesByScene.set(c.scene_id, arr);
  }

  let withIllustrations = 0;
  let withAudio = 0;
  let deadEnds = 0;

  // Build StoryExportScene for each included scene
  const exportScenes: StoryExportScene[] = filteredScenes.map((scene, idx) => {
    // Parse dialogue lines
    let dialogueLines: StoryExportScene['dialogueLines'];

    if (scene.script && scene.script.trim()) {
      try {
        const tiptapJson = JSON.parse(scene.script);
        const scriptLines = parseScreenplayToScriptLines(tiptapJson, {}, '');
        dialogueLines = scriptLines.map((line) => ({
          speaker: line.character === 'NARRATOR' ? '' : line.character,
          text: line.text,
        }));
      } catch {
        // JSON parse failed -- fall back to content
        dialogueLines = [{ speaker: '', text: scene.content || '' }];
      }
    } else {
      // No screenplay script -- single narrator line from content
      dialogueLines = [{ speaker: '', text: scene.content || '' }];
    }

    // Map explicit choices for this scene
    const sceneChoices = (choicesByScene.get(scene.id) || [])
      .filter((c) => c.target_scene_id && includedIdSet.has(c.target_scene_id))
      .map((c) => ({
        label: c.label,
        targetSceneId: c.target_scene_id!,
        ...(c.condition ? { condition: c.condition } : {}),
      }));

    // Inject implicit "Continue" if no explicit choices and not last scene
    let finalChoices = sceneChoices;
    if (!hasExplicitChoices.has(scene.id) && idx < includedIds.length - 1) {
      const nextId = includedIds[idx + 1];
      finalChoices = [{ label: 'Continue', targetSceneId: nextId }];
    }

    // Determine ending
    const isEnding = finalChoices.length === 0;
    if (isEnding) deadEnds++;

    // Track statistics
    if (scene.image_url) withIllustrations++;
    if (scene.audio_url) withAudio++;

    return {
      id: scene.id,
      name: scene.name,
      content: scene.content || '',
      imageUrl: scene.image_url || undefined,
      narrationUrl: scene.audio_url || undefined,
      dialogueLines,
      choices: finalChoices.length > 0 ? finalChoices : undefined,
      isEnding: isEnding || undefined,
    };
  });

  const summary: ExportSummary = {
    totalScenes: scenes.length,
    includedScenes: exportScenes.length,
    withIllustrations,
    withAudio,
    emptySkipped,
    deadEnds,
  };

  return { scenes: exportScenes, summary };
}

// ============================================================================
// generateGradientBackground — SVG gradient fallback
// ============================================================================

/**
 * Generate an SVG data URL with a linear gradient background and scene name overlay.
 * Used as fallback when a scene has no illustration.
 */
export function generateGradientBackground(
  sceneName: string,
  palette?: string[]
): string {
  const color1 = palette && palette.length >= 2 ? palette[0] : '#0f172a';
  const color2 = palette && palette.length >= 2 ? palette[1] : '#1e293b';
  const opacity1 = palette && palette.length >= 2 ? '0.6' : '1';
  const opacity2 = palette && palette.length >= 2 ? '0.4' : '1';

  const escapedName = escapeXml(sceneName);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color1}" stop-opacity="${opacity1}"/>
      <stop offset="100%" stop-color="${color2}" stop-opacity="${opacity2}"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <text x="960" y="540" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif" font-size="72" fill="rgba(255,255,255,0.15)">${escapedName}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

