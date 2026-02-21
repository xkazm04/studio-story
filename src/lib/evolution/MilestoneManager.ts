/**
 * MilestoneManager - Version control for character appearance evolution
 *
 * Manages appearance milestones throughout a story timeline:
 * - Named milestone states (young, battle-scarred, etc.)
 * - Scene-to-milestone mapping
 * - Appearance snapshot versioning
 * - Evolution history tracking
 */

import type { Appearance } from '@/app/types/Character';
import type {
  AvatarHistoryEntry,
  TransformationType,
  AgeStage,
  VisualChange,
} from '@/app/hooks/integration/useAvatarTimeline';

// ============================================================================
// Types
// ============================================================================

export interface AppearanceMilestone {
  id: string;
  character_id: string;
  name: string;
  description?: string;
  appearance_snapshot: Partial<Appearance>;
  avatar_url?: string;
  thumbnail_url?: string;
  age_stage: AgeStage;
  estimated_age?: number;
  transformation_type: TransformationType;
  transformation_trigger?: string;
  visual_changes: VisualChange[];
  story_position: StoryPosition;
  is_active: boolean;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StoryPosition {
  act_id?: string;
  act_number?: number;
  act_title?: string;
  scene_id?: string;
  scene_number?: number;
  scene_title?: string;
  timeline_order: number;
  narrative_time?: string;
}

export interface MilestoneVersion {
  version: number;
  milestone_id: string;
  changes: VersionChange[];
  created_at: string;
  created_by?: string;
}

export interface VersionChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

export interface MilestoneComparison {
  from_milestone: AppearanceMilestone;
  to_milestone: AppearanceMilestone;
  changes: VisualChange[];
  time_span: string;
  story_span: string;
}

export interface EvolutionPath {
  character_id: string;
  milestones: AppearanceMilestone[];
  total_transformations: number;
  age_progression: AgeStage[];
  key_events: string[];
}

export interface MilestoneFilter {
  age_stages?: AgeStage[];
  transformation_types?: TransformationType[];
  act_ids?: string[];
  tags?: string[];
  search_query?: string;
  date_range?: { start: string; end: string };
  active_only?: boolean;
}

export interface SceneMilestoneMapping {
  scene_id: string;
  milestone_id: string;
  auto_assigned: boolean;
  confidence?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const MILESTONE_PRESETS: Record<string, Partial<AppearanceMilestone>> = {
  story_beginning: {
    name: 'Story Beginning',
    transformation_type: 'initial',
    tags: ['origin', 'introduction'],
  },
  battle_scarred: {
    name: 'Battle Scarred',
    transformation_type: 'injury',
    tags: ['combat', 'injury', 'scar'],
  },
  time_skip: {
    name: 'Time Skip',
    transformation_type: 'natural_aging',
    tags: ['aging', 'time-skip'],
  },
  costume_change: {
    name: 'New Look',
    transformation_type: 'costume_change',
    tags: ['clothing', 'style'],
  },
  magical_transformation: {
    name: 'Magical Transformation',
    transformation_type: 'magical',
    tags: ['magic', 'supernatural'],
  },
  recovery: {
    name: 'Recovery',
    transformation_type: 'healing',
    tags: ['healing', 'recovery'],
  },
  emotional_shift: {
    name: 'Emotional Change',
    transformation_type: 'emotional',
    tags: ['emotional', 'expression'],
  },
};

export const AGE_STAGE_ORDER: Record<AgeStage, number> = {
  child: 0,
  teen: 1,
  young_adult: 2,
  adult: 3,
  middle_aged: 4,
  elderly: 5,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique milestone ID
 */
export function generateMilestoneId(): string {
  return `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate visual changes between two appearance snapshots
 */
export function calculateAppearanceChanges(
  from: Partial<Appearance>,
  to: Partial<Appearance>
): VisualChange[] {
  const changes: VisualChange[] = [];

  const compareObjects = (
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    prefix = ''
  ) => {
    const allKeys = new Set([
      ...Object.keys(oldObj || {}),
      ...Object.keys(newObj || {}),
    ]);

    allKeys.forEach((key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const oldVal = oldObj?.[key];
      const newVal = newObj?.[key];

      if (
        typeof oldVal === 'object' &&
        typeof newVal === 'object' &&
        oldVal !== null &&
        newVal !== null &&
        !Array.isArray(oldVal) &&
        !Array.isArray(newVal)
      ) {
        compareObjects(
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
          fullKey
        );
      } else if (String(oldVal || '') !== String(newVal || '')) {
        changes.push({
          attribute: fullKey,
          from: String(oldVal || ''),
          to: String(newVal || ''),
        });
      }
    });
  };

  compareObjects(
    from as Record<string, unknown>,
    to as Record<string, unknown>
  );

  return changes;
}

/**
 * Calculate time span between two dates
 */
export function calculateTimeSpan(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'Same day';
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''}`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
}

/**
 * Calculate story span between two positions
 */
export function calculateStorySpan(
  from: StoryPosition,
  to: StoryPosition
): string {
  const parts: string[] = [];

  if (from.act_number !== undefined && to.act_number !== undefined) {
    const actDiff = to.act_number - from.act_number;
    if (actDiff > 0) {
      parts.push(`${actDiff} act${actDiff > 1 ? 's' : ''}`);
    }
  }

  if (from.scene_number !== undefined && to.scene_number !== undefined) {
    const sceneDiff = to.scene_number - from.scene_number;
    if (sceneDiff > 0) {
      parts.push(`${sceneDiff} scene${sceneDiff > 1 ? 's' : ''}`);
    }
  }

  return parts.length > 0 ? parts.join(', ') : 'Same position';
}

/**
 * Sort milestones by story position
 */
export function sortMilestonesByStoryPosition(
  milestones: AppearanceMilestone[]
): AppearanceMilestone[] {
  return [...milestones].sort((a, b) => {
    // First by timeline order if available
    if (a.story_position.timeline_order !== b.story_position.timeline_order) {
      return a.story_position.timeline_order - b.story_position.timeline_order;
    }
    // Then by act number
    const actA = a.story_position.act_number ?? 0;
    const actB = b.story_position.act_number ?? 0;
    if (actA !== actB) return actA - actB;
    // Then by scene number
    const sceneA = a.story_position.scene_number ?? 0;
    const sceneB = b.story_position.scene_number ?? 0;
    return sceneA - sceneB;
  });
}

/**
 * Filter milestones based on criteria
 */
export function filterMilestones(
  milestones: AppearanceMilestone[],
  filter: MilestoneFilter
): AppearanceMilestone[] {
  return milestones.filter((milestone) => {
    if (filter.active_only && !milestone.is_active) return false;

    if (filter.age_stages?.length && !filter.age_stages.includes(milestone.age_stage)) {
      return false;
    }

    if (
      filter.transformation_types?.length &&
      !filter.transformation_types.includes(milestone.transformation_type)
    ) {
      return false;
    }

    if (
      filter.act_ids?.length &&
      milestone.story_position.act_id &&
      !filter.act_ids.includes(milestone.story_position.act_id)
    ) {
      return false;
    }

    if (filter.tags?.length) {
      const hasMatchingTag = filter.tags.some((tag) =>
        milestone.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    if (filter.search_query) {
      const query = filter.search_query.toLowerCase();
      const searchable = [
        milestone.name,
        milestone.description,
        milestone.transformation_trigger,
        milestone.notes,
        ...milestone.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) return false;
    }

    if (filter.date_range) {
      const milestoneDate = new Date(milestone.created_at);
      if (new Date(filter.date_range.start) > milestoneDate) return false;
      if (new Date(filter.date_range.end) < milestoneDate) return false;
    }

    return true;
  });
}

// ============================================================================
// MilestoneManager Class
// ============================================================================

export class MilestoneManager {
  private milestones: Map<string, AppearanceMilestone> = new Map();
  private versions: Map<string, MilestoneVersion[]> = new Map();
  private sceneMappings: Map<string, SceneMilestoneMapping> = new Map();

  constructor(initialMilestones?: AppearanceMilestone[]) {
    if (initialMilestones) {
      initialMilestones.forEach((m) => this.milestones.set(m.id, m));
    }
  }

  /**
   * Get all milestones for a character
   */
  getMilestones(characterId: string): AppearanceMilestone[] {
    return Array.from(this.milestones.values())
      .filter((m) => m.character_id === characterId);
  }

  /**
   * Get milestones sorted by story position
   */
  getSortedMilestones(characterId: string): AppearanceMilestone[] {
    return sortMilestonesByStoryPosition(this.getMilestones(characterId));
  }

  /**
   * Get a single milestone by ID
   */
  getMilestone(milestoneId: string): AppearanceMilestone | undefined {
    return this.milestones.get(milestoneId);
  }

  /**
   * Get the active milestone for a character
   */
  getActiveMilestone(characterId: string): AppearanceMilestone | undefined {
    return Array.from(this.milestones.values()).find(
      (m) => m.character_id === characterId && m.is_active
    );
  }

  /**
   * Create a new milestone
   */
  createMilestone(
    characterId: string,
    data: Partial<AppearanceMilestone>,
    preset?: keyof typeof MILESTONE_PRESETS
  ): AppearanceMilestone {
    const presetData = preset ? MILESTONE_PRESETS[preset] : {};
    const now = new Date().toISOString();

    const milestone: AppearanceMilestone = {
      id: generateMilestoneId(),
      character_id: characterId,
      name: data.name || presetData.name || 'Unnamed Milestone',
      description: data.description,
      appearance_snapshot: data.appearance_snapshot || {},
      avatar_url: data.avatar_url,
      thumbnail_url: data.thumbnail_url,
      age_stage: data.age_stage || 'adult',
      estimated_age: data.estimated_age,
      transformation_type: data.transformation_type || presetData.transformation_type || 'custom',
      transformation_trigger: data.transformation_trigger,
      visual_changes: data.visual_changes || [],
      story_position: data.story_position || { timeline_order: this.milestones.size },
      is_active: data.is_active ?? false,
      tags: [...(presetData.tags || []), ...(data.tags || [])],
      notes: data.notes,
      created_at: now,
      updated_at: now,
    };

    this.milestones.set(milestone.id, milestone);
    this.versions.set(milestone.id, []);

    return milestone;
  }

  /**
   * Update an existing milestone with version tracking
   */
  updateMilestone(
    milestoneId: string,
    updates: Partial<AppearanceMilestone>
  ): AppearanceMilestone | undefined {
    const existing = this.milestones.get(milestoneId);
    if (!existing) return undefined;

    // Track version changes
    const changes: VersionChange[] = [];
    Object.entries(updates).forEach(([key, newValue]) => {
      const oldValue = existing[key as keyof AppearanceMilestone];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field: key, old_value: oldValue, new_value: newValue });
      }
    });

    if (changes.length > 0) {
      const versionHistory = this.versions.get(milestoneId) || [];
      versionHistory.push({
        version: versionHistory.length + 1,
        milestone_id: milestoneId,
        changes,
        created_at: new Date().toISOString(),
      });
      this.versions.set(milestoneId, versionHistory);
    }

    const updated: AppearanceMilestone = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.milestones.set(milestoneId, updated);
    return updated;
  }

  /**
   * Delete a milestone
   */
  deleteMilestone(milestoneId: string): boolean {
    const deleted = this.milestones.delete(milestoneId);
    if (deleted) {
      this.versions.delete(milestoneId);
      // Remove scene mappings
      for (const [sceneId, mapping] of this.sceneMappings.entries()) {
        if (mapping.milestone_id === milestoneId) {
          this.sceneMappings.delete(sceneId);
        }
      }
    }
    return deleted;
  }

  /**
   * Set a milestone as the active one for its character
   */
  setActiveMilestone(milestoneId: string): void {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return;

    // Deactivate other milestones for this character
    this.milestones.forEach((m, id) => {
      if (m.character_id === milestone.character_id && m.is_active) {
        this.milestones.set(id, { ...m, is_active: false });
      }
    });

    // Activate the specified milestone
    this.milestones.set(milestoneId, { ...milestone, is_active: true });
  }

  /**
   * Compare two milestones
   */
  compareMilestones(fromId: string, toId: string): MilestoneComparison | null {
    const from = this.milestones.get(fromId);
    const to = this.milestones.get(toId);
    if (!from || !to) return null;

    return {
      from_milestone: from,
      to_milestone: to,
      changes: calculateAppearanceChanges(
        from.appearance_snapshot,
        to.appearance_snapshot
      ),
      time_span: calculateTimeSpan(from.created_at, to.created_at),
      story_span: calculateStorySpan(from.story_position, to.story_position),
    };
  }

  /**
   * Get the evolution path for a character
   */
  getEvolutionPath(characterId: string): EvolutionPath {
    const milestones = this.getSortedMilestones(characterId);

    const ageProgression = milestones
      .map((m) => m.age_stage)
      .filter((stage, index, arr) => arr.indexOf(stage) === index);

    const keyEvents = milestones
      .filter((m) => m.transformation_trigger)
      .map((m) => m.transformation_trigger as string);

    return {
      character_id: characterId,
      milestones,
      total_transformations: milestones.length - 1,
      age_progression: ageProgression,
      key_events: keyEvents,
    };
  }

  /**
   * Map a scene to a milestone
   */
  mapSceneToMilestone(
    sceneId: string,
    milestoneId: string,
    autoAssigned = false,
    confidence?: number
  ): void {
    this.sceneMappings.set(sceneId, {
      scene_id: sceneId,
      milestone_id: milestoneId,
      auto_assigned: autoAssigned,
      confidence,
    });
  }

  /**
   * Get the milestone for a scene
   */
  getMilestoneForScene(sceneId: string): AppearanceMilestone | undefined {
    const mapping = this.sceneMappings.get(sceneId);
    if (!mapping) return undefined;
    return this.milestones.get(mapping.milestone_id);
  }

  /**
   * Auto-assign scenes to milestones based on story position
   */
  autoAssignScenesToMilestones(
    characterId: string,
    scenes: Array<{ id: string; scene_number: number; act_id?: string }>
  ): SceneMilestoneMapping[] {
    const milestones = this.getSortedMilestones(characterId);
    if (milestones.length === 0) return [];

    const mappings: SceneMilestoneMapping[] = [];

    scenes.forEach((scene) => {
      // Find the best matching milestone based on story position
      let bestMilestone = milestones[0];
      let bestScore = -1;

      milestones.forEach((milestone) => {
        let score = 0;

        // Check act match
        if (milestone.story_position.act_id === scene.act_id) {
          score += 10;
        }

        // Check scene number proximity
        if (milestone.story_position.scene_number !== undefined) {
          if (scene.scene_number >= milestone.story_position.scene_number) {
            score += 5;
          }
          // Prefer closest preceding milestone
          const distance = Math.abs(
            scene.scene_number - milestone.story_position.scene_number
          );
          score -= distance * 0.1;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMilestone = milestone;
        }
      });

      const mapping: SceneMilestoneMapping = {
        scene_id: scene.id,
        milestone_id: bestMilestone.id,
        auto_assigned: true,
        confidence: Math.max(0, Math.min(1, bestScore / 15)),
      };

      this.sceneMappings.set(scene.id, mapping);
      mappings.push(mapping);
    });

    return mappings;
  }

  /**
   * Get version history for a milestone
   */
  getVersionHistory(milestoneId: string): MilestoneVersion[] {
    return this.versions.get(milestoneId) || [];
  }

  /**
   * Revert a milestone to a previous version
   */
  revertToVersion(milestoneId: string, version: number): AppearanceMilestone | undefined {
    const history = this.versions.get(milestoneId);
    const current = this.milestones.get(milestoneId);
    if (!history || !current || version < 1 || version > history.length) {
      return undefined;
    }

    // Apply changes in reverse from current version down to target
    let reverted = { ...current };
    for (let i = history.length - 1; i >= version; i--) {
      const versionChanges = history[i];
      versionChanges.changes.forEach((change) => {
        (reverted as Record<string, unknown>)[change.field] = change.old_value;
      });
    }

    reverted.updated_at = new Date().toISOString();
    this.milestones.set(milestoneId, reverted);

    return reverted;
  }

  /**
   * Convert from AvatarHistoryEntry to AppearanceMilestone
   */
  fromAvatarHistoryEntry(entry: AvatarHistoryEntry): AppearanceMilestone {
    return {
      id: entry.id,
      character_id: entry.character_id,
      name: entry.milestone_label || entry.transformation_trigger || 'Unnamed',
      description: entry.narrative_context,
      appearance_snapshot: entry.appearance_snapshot || {},
      avatar_url: entry.avatar_url,
      thumbnail_url: entry.thumbnail_url,
      age_stage: entry.age_stage || 'adult',
      estimated_age: entry.estimated_age,
      transformation_type: entry.transformation_type,
      transformation_trigger: entry.transformation_trigger,
      visual_changes: entry.visual_changes,
      story_position: {
        act_id: entry.act_id,
        act_number: entry.act?.act_number,
        act_title: entry.act?.title,
        scene_id: entry.scene_id,
        scene_number: entry.scene?.scene_number,
        scene_title: entry.scene?.title,
        timeline_order: entry.timeline_order || 0,
        narrative_time: entry.start_time,
      },
      is_active: false,
      tags: [],
      notes: entry.notes,
      created_at: entry.created_at,
      updated_at: entry.updated_at || entry.created_at,
    };
  }

  /**
   * Export milestones for a character
   */
  exportMilestones(characterId: string): {
    milestones: AppearanceMilestone[];
    evolution_path: EvolutionPath;
    scene_mappings: SceneMilestoneMapping[];
  } {
    const milestones = this.getSortedMilestones(characterId);
    const evolutionPath = this.getEvolutionPath(characterId);
    const sceneMappings = Array.from(this.sceneMappings.values()).filter(
      (m) => {
        const milestone = this.milestones.get(m.milestone_id);
        return milestone?.character_id === characterId;
      }
    );

    return {
      milestones,
      evolution_path: evolutionPath,
      scene_mappings: sceneMappings,
    };
  }
}

export default MilestoneManager;
