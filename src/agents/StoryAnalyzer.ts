/**
 * StoryAnalyzer — Proactive Story Analysis Engine
 *
 * Runs rule-based analysis on story data (characters, scenes, beats,
 * relationships) and surfaces prioritized creative insights without
 * requiring LLM calls. The rules detect common narrative issues:
 * plot gaps, character underuse, pacing flatness, continuity errors.
 *
 * Each rule returns MuseInsight objects that include a one-click
 * compose_on_accept payload for workspace navigation.
 */

import type { MuseInsight, MuseInsightCategory } from './types';
import { TOOL_NAMES } from './types';

// ============================================================================
// Input Types (minimal shapes — not importing app-level types to stay decoupled)
// ============================================================================

export interface AnalysisCharacter {
  id: string;
  name: string;
  type?: string | null;
  faction_id?: string | null;
}

export interface AnalysisScene {
  id: string;
  name: string;
  content?: string | null;
  act_id?: string | null;
  order?: number;
  character_ids?: string[];
}

export interface AnalysisBeat {
  id: string;
  name: string;
  description?: string | null;
  act_id?: string | null;
  completed?: boolean;
  order?: number;
}

export interface AnalysisAct {
  id: string;
  name: string;
  order?: number;
}

export interface AnalysisRelationship {
  id: string;
  character_id_1: string;
  character_id_2: string;
  type?: string | null;
}

export interface StorySnapshot {
  projectId: string;
  characters: AnalysisCharacter[];
  scenes: AnalysisScene[];
  beats: AnalysisBeat[];
  acts: AnalysisAct[];
  relationships: AnalysisRelationship[];
}

// ============================================================================
// Analysis Rules
// ============================================================================

type AnalysisRule = (snapshot: StorySnapshot) => MuseInsight[];

let insightCounter = 0;
function makeInsight(
  category: MuseInsightCategory,
  priority: MuseInsight['priority'],
  title: string,
  description: string,
  action?: MuseInsight['action']
): MuseInsight {
  return {
    id: `muse-${Date.now()}-${++insightCounter}`,
    category,
    priority,
    title,
    description,
    action,
    timestamp: Date.now(),
    dismissed: false,
  };
}

// ─── Character Rules ──────────────────────────────

const characterWithoutScenes: AnalysisRule = ({ characters, scenes }) => {
  const insights: MuseInsight[] = [];
  const characterSceneCounts = new Map<string, number>();

  for (const char of characters) {
    characterSceneCounts.set(char.id, 0);
  }

  for (const scene of scenes) {
    if (scene.character_ids) {
      for (const charId of scene.character_ids) {
        characterSceneCounts.set(charId, (characterSceneCounts.get(charId) ?? 0) + 1);
      }
    }
    // Also check scene content for character name mentions
    if (scene.content) {
      const contentLower = scene.content.toLowerCase();
      for (const char of characters) {
        if (contentLower.includes(char.name.toLowerCase())) {
          characterSceneCounts.set(char.id, (characterSceneCounts.get(char.id) ?? 0) + 1);
        }
      }
    }
  }

  for (const char of characters) {
    const count = characterSceneCounts.get(char.id) ?? 0;
    if (count === 0 && scenes.length >= 3) {
      insights.push(makeInsight(
        'character',
        'high',
        `${char.name} has no scene presence`,
        `${char.name} doesn't appear in any scene. Consider introducing them or removing them from the cast.`,
        {
          type: TOOL_NAMES.COMPOSE_WORKSPACE,
          payload: {
            action: 'replace',
            layout: 'split-2',
            panels: [
              { type: 'characterDetail', dataSlice: { entityId: char.id } },
              { type: 'sceneList' },
            ],
          },
        }
      ));
    }
  }

  return insights;
};

const isolatedCharacter: AnalysisRule = ({ characters, relationships }) => {
  const insights: MuseInsight[] = [];
  if (characters.length < 3) return insights;

  const connectedIds = new Set<string>();
  for (const rel of relationships) {
    connectedIds.add(rel.character_id_1);
    connectedIds.add(rel.character_id_2);
  }

  for (const char of characters) {
    if (!connectedIds.has(char.id)) {
      insights.push(makeInsight(
        'character',
        'medium',
        `${char.name} has no relationships`,
        `${char.name} is isolated from the rest of the cast. Adding relationships creates dramatic potential.`,
        {
          type: TOOL_NAMES.COMPOSE_WORKSPACE,
          payload: {
            action: 'replace',
            layout: 'split-2',
            panels: [
              { type: 'characterDetail', dataSlice: { entityId: char.id } },
              { type: 'characterCards' },
            ],
          },
        }
      ));
    }
  }

  return insights;
};

// ─── Plot Rules ───────────────────────────────────

const actWithoutBeats: AnalysisRule = ({ acts, beats }) => {
  const insights: MuseInsight[] = [];
  if (acts.length === 0) return insights;

  const beatsByAct = new Map<string, number>();
  for (const act of acts) {
    beatsByAct.set(act.id, 0);
  }
  for (const beat of beats) {
    if (beat.act_id) {
      beatsByAct.set(beat.act_id, (beatsByAct.get(beat.act_id) ?? 0) + 1);
    }
  }

  for (const act of acts) {
    const count = beatsByAct.get(act.id) ?? 0;
    if (count === 0) {
      insights.push(makeInsight(
        'plot',
        'high',
        `${act.name} has no story beats`,
        `Act "${act.name}" has no beats defined. Story structure needs beats to drive the narrative forward.`,
        {
          type: TOOL_NAMES.COMPOSE_WORKSPACE,
          payload: {
            action: 'replace',
            layout: 'primary-sidebar',
            panels: [
              { type: 'beatsManager', dataSlice: { filter: act.id } },
              { type: 'beatsSidebar' },
            ],
          },
        }
      ));
    }
  }

  return insights;
};

const incompleteBeatRatio: AnalysisRule = ({ beats }) => {
  const insights: MuseInsight[] = [];
  if (beats.length < 3) return insights;

  const completed = beats.filter(b => b.completed).length;
  const ratio = completed / beats.length;

  if (ratio < 0.3 && beats.length >= 5) {
    insights.push(makeInsight(
      'plot',
      'medium',
      `Only ${Math.round(ratio * 100)}% of beats completed`,
      `${completed} of ${beats.length} story beats are marked complete. Consider reviewing your progress.`,
      {
        type: TOOL_NAMES.COMPOSE_WORKSPACE,
        payload: {
          action: 'replace',
          layout: 'single',
          panels: [{ type: 'beatsManager' }],
        },
      }
    ));
  }

  return insights;
};

// ─── Pacing Rules ─────────────────────────────────

const sceneLengthVariation: AnalysisRule = ({ scenes }) => {
  const insights: MuseInsight[] = [];
  if (scenes.length < 4) return insights;

  // Check for runs of very short or very empty scenes
  const contentLengths = scenes
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(s => s.content?.length ?? 0);

  // Detect flat stretches (5+ consecutive scenes with similar short content)
  let flatStretch = 0;
  for (let i = 1; i < contentLengths.length; i++) {
    const bothShort = contentLengths[i] < 50 && contentLengths[i - 1] < 50;
    if (bothShort) {
      flatStretch++;
    } else {
      flatStretch = 0;
    }
    if (flatStretch >= 3) {
      insights.push(makeInsight(
        'pacing',
        'medium',
        'Several scenes lack content',
        `Scenes ${i - flatStretch + 1} through ${i + 1} are very short or empty. This may indicate a flat narrative stretch.`,
        {
          type: TOOL_NAMES.COMPOSE_WORKSPACE,
          payload: {
            action: 'replace',
            layout: 'split-2',
            panels: [
              { type: 'sceneList' },
              { type: 'sceneEditor' },
            ],
          },
        }
      ));
      break; // Only one pacing insight per analysis
    }
  }

  return insights;
};

const emptyScenes: AnalysisRule = ({ scenes }) => {
  const insights: MuseInsight[] = [];
  const empty = scenes.filter(s => !s.content || s.content.trim().length < 20);

  if (empty.length >= 3 && scenes.length >= 5) {
    insights.push(makeInsight(
      'pacing',
      'low',
      `${empty.length} scenes need content`,
      `${empty.length} of ${scenes.length} scenes have little or no content. Fill them in to maintain narrative momentum.`,
    ));
  }

  return insights;
};

// ─── Continuity Rules ─────────────────────────────

const antagonistMissing: AnalysisRule = ({ characters, scenes, acts }) => {
  const insights: MuseInsight[] = [];
  const antagonists = characters.filter(c =>
    c.type?.toLowerCase() === 'antagonist' || c.type?.toLowerCase() === 'villain'
  );

  if (antagonists.length === 0 || acts.length < 2) return insights;

  // Check if antagonist appears in scenes across acts
  for (const antag of antagonists) {
    const antagActIds = new Set<string>();
    for (const scene of scenes) {
      const mentioned = scene.character_ids?.includes(antag.id) ||
        (scene.content?.toLowerCase().includes(antag.name.toLowerCase()));
      if (mentioned && scene.act_id) {
        antagActIds.add(scene.act_id);
      }
    }

    const missingActs = acts.filter(a => !antagActIds.has(a.id));
    if (missingActs.length > 0 && antagActIds.size > 0) {
      const missingNames = missingActs.map(a => a.name).join(', ');
      insights.push(makeInsight(
        'continuity',
        'high',
        `${antag.name} absent from ${missingNames}`,
        `Your antagonist "${antag.name}" has no presence in ${missingNames}. Consider adding confrontation or tension beats.`,
        {
          type: TOOL_NAMES.COMPOSE_WORKSPACE,
          payload: {
            action: 'replace',
            layout: 'split-2',
            panels: [
              { type: 'characterDetail', dataSlice: { entityId: antag.id } },
              { type: 'beatsManager' },
            ],
          },
        }
      ));
    }
  }

  return insights;
};

const sceneWithoutAct: AnalysisRule = ({ scenes, acts }) => {
  const insights: MuseInsight[] = [];
  if (acts.length === 0) return insights;

  const orphanScenes = scenes.filter(s => !s.act_id);
  if (orphanScenes.length > 0) {
    insights.push(makeInsight(
      'continuity',
      'medium',
      `${orphanScenes.length} scene(s) not assigned to an act`,
      `${orphanScenes.map(s => `"${s.name}"`).slice(0, 3).join(', ')}${orphanScenes.length > 3 ? '...' : ''} — assign them to maintain story structure.`,
      {
        type: TOOL_NAMES.COMPOSE_WORKSPACE,
        payload: {
          action: 'replace',
          layout: 'single',
          panels: [{ type: 'sceneList' }],
        },
      }
    ));
  }

  return insights;
};

// ─── Relationship Rules ──────────────────────────

const TENSION_TYPES = new Set(['rival', 'enemy', 'antagonist', 'nemesis', 'conflict']);

const unresolvedTension: AnalysisRule = ({ characters, scenes, relationships }) => {
  const insights: MuseInsight[] = [];
  if (scenes.length < 3) return insights;

  const charMap = new Map(characters.map(c => [c.id, c]));

  for (const rel of relationships) {
    const relType = (rel.type ?? '').toLowerCase();
    if (!TENSION_TYPES.has(relType)) continue;

    const char1 = charMap.get(rel.character_id_1);
    const char2 = charMap.get(rel.character_id_2);
    if (!char1 || !char2) continue;

    // Check if they share any scene
    const shareScene = scenes.some(scene => {
      const ids = scene.character_ids ?? [];
      const bothPresent = ids.includes(char1.id) && ids.includes(char2.id);
      if (bothPresent) return true;
      // Also check content mentions
      if (scene.content) {
        const lower = scene.content.toLowerCase();
        const name1In = lower.includes(char1.name.toLowerCase());
        const name2In = lower.includes(char2.name.toLowerCase());
        if (name1In && name2In) return true;
      }
      return false;
    });

    if (!shareScene) {
      insights.push(makeInsight(
        'character',
        'high',
        `${char1.name} and ${char2.name} have unresolved tension`,
        `These ${relType} characters never share a scene. Consider creating a confrontation to leverage their dynamic.`,
        {
          type: TOOL_NAMES.COMPOSE_WORKSPACE,
          payload: {
            action: 'replace',
            layout: 'triptych',
            panels: [
              { type: 'characterDetail', dataSlice: { entityId: char1.id } },
              { type: 'sceneEditor' },
              { type: 'characterDetail', dataSlice: { entityId: char2.id } },
            ],
          },
        }
      ));
    }
  }

  return insights;
};

const unbalancedFactions: AnalysisRule = ({ characters }) => {
  const insights: MuseInsight[] = [];

  // Collect all distinct faction IDs from characters
  const factionIds = new Set<string>();
  const factionMemberCount = new Map<string, number>();

  for (const char of characters) {
    if (char.faction_id) {
      factionIds.add(char.faction_id);
      factionMemberCount.set(char.faction_id, (factionMemberCount.get(char.faction_id) ?? 0) + 1);
    }
  }

  if (factionIds.size < 2) return insights;

  for (const factionId of factionIds) {
    const count = factionMemberCount.get(factionId) ?? 0;
    if (count === 0) {
      insights.push(makeInsight(
        'character',
        'medium',
        `A faction has no characters assigned`,
        `Faction ${factionId} exists but has no members. Consider populating it or removing it.`,
      ));
    }
  }

  return insights;
};

// ============================================================================
// Analyzer
// ============================================================================

const ALL_RULES: AnalysisRule[] = [
  characterWithoutScenes,
  isolatedCharacter,
  actWithoutBeats,
  incompleteBeatRatio,
  sceneLengthVariation,
  emptyScenes,
  antagonistMissing,
  sceneWithoutAct,
  unresolvedTension,
  unbalancedFactions,
];

const PRIORITY_ORDER: Record<MuseInsight['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Run all analysis rules against a story snapshot.
 * Returns deduplicated, priority-sorted insights (max 8).
 */
export function analyzeStory(snapshot: StorySnapshot): MuseInsight[] {
  // Don't analyze empty projects
  if (snapshot.scenes.length === 0 && snapshot.characters.length === 0) {
    return [];
  }

  const allInsights: MuseInsight[] = [];

  for (const rule of ALL_RULES) {
    try {
      const results = rule(snapshot);
      allInsights.push(...results);
    } catch {
      // Skip failed rules silently
    }
  }

  // Sort by priority, then by category
  allInsights.sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    return a.category.localeCompare(b.category);
  });

  // Cap at 8 insights to avoid overwhelming
  return allInsights.slice(0, 8);
}

/**
 * Generate a content hash for a story snapshot to detect changes.
 * Uses a fast FNV-1a hash on the serialized counts + IDs.
 */
export function snapshotHash(snapshot: StorySnapshot): string {
  const key = [
    snapshot.projectId,
    snapshot.characters.length,
    snapshot.scenes.length,
    snapshot.beats.length,
    snapshot.acts.length,
    snapshot.relationships.length,
    // Include content hashes for mutation detection
    ...snapshot.scenes.map(s => `${s.id}:${(s.content?.length ?? 0)}`),
    ...snapshot.beats.map(b => `${b.id}:${b.completed ? 1 : 0}`),
    ...snapshot.characters.map(c => `${c.id}:${c.type ?? ''}`),
    ...snapshot.relationships.map(r => `${r.id}:${r.type ?? ''}`),
  ].join('|');

  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(36);
}
