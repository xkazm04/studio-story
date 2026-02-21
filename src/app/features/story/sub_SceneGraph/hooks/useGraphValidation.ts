/**
 * Graph Validation Hook
 * Provides validation for story graph structure
 */

import { useMemo, useCallback, useState } from 'react';
import { Scene } from '@/app/types/Scene';
import { SceneChoice } from '@/app/types/SceneChoice';

export type ValidationSeverity = 'error' | 'warning' | 'info';
export type ValidationCategory =
  | 'missing_field'
  | 'unreachable_node'
  | 'invalid_relationship'
  | 'dead_end'
  | 'orphan'
  | 'circular_reference'
  | 'incomplete_content'
  | 'configuration';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: ValidationCategory;
  sceneId: string | null;
  choiceId: string | null;
  title: string;
  message: string;
}

export interface ValidationStats {
  totalScenes: number;
  totalChoices: number;
  errorsCount: number;
  warningsCount: number;
  infosCount: number;
  reachableScenes: number;
  orphanedScenes: number;
  deadEndScenes: number;
  incompleteScenes: number;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  stats: ValidationStats;
}

/**
 * Compute reachable scenes from first scene using BFS
 */
function computeReachableScenes(
  firstSceneId: string | null,
  choices: SceneChoice[],
  sceneIds: Set<string>
): Set<string> {
  const reachable = new Set<string>();
  if (!firstSceneId || !sceneIds.has(firstSceneId)) return reachable;

  const queue = [firstSceneId];
  reachable.add(firstSceneId);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const outgoing = choices.filter(c => c.scene_id === currentId);

    for (const choice of outgoing) {
      if (choice.target_scene_id && sceneIds.has(choice.target_scene_id) && !reachable.has(choice.target_scene_id)) {
        reachable.add(choice.target_scene_id);
        queue.push(choice.target_scene_id);
      }
    }
  }

  return reachable;
}

/**
 * Validate the story graph structure
 */
function validateGraph(
  scenes: Scene[],
  choices: SceneChoice[],
  firstSceneId: string | null
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const sceneIds = new Set(scenes.map(s => s.id));
  const sceneMap = new Map(scenes.map(s => [s.id, s]));

  // Check first scene configuration
  if (!firstSceneId) {
    issues.push({
      id: 'no-first-scene',
      severity: 'error',
      category: 'configuration',
      sceneId: null,
      choiceId: null,
      title: 'No entry point set',
      message: 'The story has no starting scene. Set a first scene to define where the story begins.',
    });
  } else if (!sceneIds.has(firstSceneId)) {
    issues.push({
      id: 'invalid-first-scene',
      severity: 'error',
      category: 'invalid_relationship',
      sceneId: firstSceneId,
      choiceId: null,
      title: 'Invalid entry point',
      message: 'The first scene reference points to a non-existent scene.',
    });
  }

  // Build incoming/outgoing counts
  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();

  for (const choice of choices) {
    outgoingCount.set(choice.scene_id, (outgoingCount.get(choice.scene_id) || 0) + 1);
    if (choice.target_scene_id) {
      incomingCount.set(choice.target_scene_id, (incomingCount.get(choice.target_scene_id) || 0) + 1);
    }
  }

  // Check orphaned and dead-end scenes
  for (const scene of scenes) {
    // Orphaned: no incoming except first scene
    if (scene.id !== firstSceneId && !incomingCount.has(scene.id)) {
      issues.push({
        id: `orphan-${scene.id}`,
        severity: 'warning',
        category: 'orphan',
        sceneId: scene.id,
        choiceId: null,
        title: 'Orphaned scene',
        message: `"${scene.name || 'Untitled'}" has no incoming links from other scenes.`,
      });
    }

    // Dead end: no outgoing
    if (!outgoingCount.has(scene.id)) {
      issues.push({
        id: `dead-end-${scene.id}`,
        severity: 'warning',
        category: 'dead_end',
        sceneId: scene.id,
        choiceId: null,
        title: 'Dead end scene',
        message: `"${scene.name || 'Untitled'}" has no choices for the player to continue.`,
      });
    }

    // Incomplete content
    if (!scene.content && !scene.description) {
      issues.push({
        id: `incomplete-${scene.id}`,
        severity: 'info',
        category: 'incomplete_content',
        sceneId: scene.id,
        choiceId: null,
        title: 'Incomplete scene',
        message: `"${scene.name || 'Untitled'}" is missing content.`,
      });
    }
  }

  // Check invalid choice targets
  for (const choice of choices) {
    if (!choice.target_scene_id) {
      issues.push({
        id: `no-target-${choice.id}`,
        severity: 'error',
        category: 'invalid_relationship',
        sceneId: choice.scene_id,
        choiceId: choice.id,
        title: 'Choice without destination',
        message: `Choice "${choice.label || 'Untitled'}" has no target scene.`,
      });
    } else if (!sceneIds.has(choice.target_scene_id)) {
      issues.push({
        id: `invalid-target-${choice.id}`,
        severity: 'error',
        category: 'invalid_relationship',
        sceneId: choice.scene_id,
        choiceId: choice.id,
        title: 'Invalid choice target',
        message: `Choice "${choice.label || 'Untitled'}" points to a non-existent scene.`,
      });
    }

    // Self-reference
    if (choice.target_scene_id === choice.scene_id) {
      issues.push({
        id: `self-ref-${choice.id}`,
        severity: 'warning',
        category: 'circular_reference',
        sceneId: choice.scene_id,
        choiceId: choice.id,
        title: 'Self-referencing choice',
        message: `Choice "${choice.label || 'Untitled'}" points back to its own scene.`,
      });
    }
  }

  // Sort by severity
  const severityOrder: Record<ValidationSeverity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const reachable = computeReachableScenes(firstSceneId, choices, sceneIds);

  return {
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    stats: {
      totalScenes: scenes.length,
      totalChoices: choices.length,
      errorsCount: issues.filter(i => i.severity === 'error').length,
      warningsCount: issues.filter(i => i.severity === 'warning').length,
      infosCount: issues.filter(i => i.severity === 'info').length,
      reachableScenes: reachable.size,
      orphanedScenes: issues.filter(i => i.category === 'orphan').length,
      deadEndScenes: issues.filter(i => i.category === 'dead_end').length,
      incompleteScenes: issues.filter(i => i.category === 'incomplete_content').length,
    },
  };
}

export function useGraphValidation(
  scenes: Scene[],
  choices: SceneChoice[],
  firstSceneId: string | null
) {
  const [isDiagnosticsVisible, setIsDiagnosticsVisible] = useState(false);

  const validationResult = useMemo(
    () => validateGraph(scenes, choices, firstSceneId),
    [scenes, choices, firstSceneId]
  );

  const toggleDiagnostics = useCallback(() => {
    setIsDiagnosticsVisible(prev => !prev);
  }, []);

  const getIssuesForScene = useCallback(
    (sceneId: string) => validationResult.issues.filter(i => i.sceneId === sceneId),
    [validationResult.issues]
  );

  return {
    validationResult,
    isDiagnosticsVisible,
    toggleDiagnostics,
    getIssuesForScene,
  };
}
