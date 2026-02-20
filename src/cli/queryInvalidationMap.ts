/**
 * Query Invalidation Mapping
 *
 * Maps CLI skill IDs to TanStack Query keys that should be invalidated
 * after successful CLI execution. This ensures the UI refreshes when
 * CLI skills modify data through MCP tools (API Write-Through pattern).
 *
 * Query key patterns (from hooks/integration/):
 *   characters: ['characters', 'project', projectId] | ['characters', characterId]
 *   factions:   ['factions', 'project', projectId] | ['factions', factionId]
 *   scenes:     ['scenes', 'project', projectId] | ['scenes', sceneId]
 *   beats:      ['beats', 'project', projectId] | ['beats', actId]
 *   traits:     ['traits', characterId]
 *   relationships: ['relationships', 'project', projectId]
 *   projects:   ['projects'] | ['projects', projectId]
 */

import type { SkillId } from './skills';

/**
 * Query key template — uses placeholder tokens that get replaced at invalidation time.
 *
 * Tokens:
 * - $projectId → current project ID
 * - $characterId → context param characterId
 * - $factionId → context param factionId
 * - $sceneId → context param sceneId
 * - $actId → context param actId
 * - $beatId → context param beatId
 */
type QueryKeyTemplate = string[];

interface InvalidationEntry {
  /** Query key templates to invalidate */
  keys: QueryKeyTemplate[];
  /** Whether to use exact match (default: false = prefix match) */
  exact?: boolean;
}

/**
 * Maps skill ID → query keys to invalidate on successful completion.
 *
 * Skills not listed here don't modify server data (e.g., prompt generators,
 * analysis tools) and don't need invalidation.
 */
export const SKILL_INVALIDATION_MAP: Partial<Record<SkillId, InvalidationEntry>> = {
  // Character domain — write-through skills
  'character-backstory': {
    keys: [
      ['characters', '$characterId'],
      ['characters', 'project', '$projectId'],
    ],
  },
  'character-traits': {
    keys: [
      ['traits', '$characterId'],
      ['characters', '$characterId'],
    ],
  },

  // Faction domain — write-through skills
  'faction-lore': {
    keys: [
      ['factions', '$factionId'],
      ['factions', 'project', '$projectId'],
    ],
  },
  'faction-description': {
    keys: [
      ['factions', '$factionId'],
      ['factions', 'project', '$projectId'],
    ],
  },
  'faction-creation': {
    keys: [
      ['factions', 'project', '$projectId'],
    ],
  },

  // Story domain — write-through skills
  'story-write-content': {
    keys: [
      ['projects', '$projectId'],
    ],
  },
  'beat-suggestions': {
    keys: [
      ['beats', 'project', '$projectId'],
    ],
  },
  'beat-description': {
    keys: [
      ['beats', 'project', '$projectId'],
    ],
  },

  // Scene domain — write-through skills
  'scene-generation': {
    keys: [
      ['scenes', 'project', '$projectId'],
      ['characters', 'project', '$projectId'],
    ],
  },
  'scene-description': {
    keys: [
      ['scenes', '$sceneId'],
      ['scenes', 'project', '$projectId'],
    ],
  },
  'scene-compose': {
    keys: [
      ['scenes', '$sceneId'],
      ['scenes', 'project', '$projectId'],
      ['characters', 'project', '$projectId'],
    ],
  },

  // Dataset domain
  'dataset-tagging': {
    keys: [
      ['datasets', '$projectId'],
    ],
  },
};

/**
 * Resolve query key templates by replacing $tokens with actual values.
 */
export function resolveQueryKeys(
  skillId: SkillId,
  context: Record<string, string>,
): string[][] {
  const entry = SKILL_INVALIDATION_MAP[skillId];
  if (!entry) return [];

  return entry.keys.map((template) =>
    template.map((segment) => {
      if (segment.startsWith('$')) {
        const key = segment.slice(1);
        return context[key] || segment; // Keep template if no value
      }
      return segment;
    })
  );
}

/**
 * Check if a skill has write-through behavior (modifies server data)
 */
export function isWriteThroughSkill(skillId: SkillId): boolean {
  return skillId in SKILL_INVALIDATION_MAP;
}
