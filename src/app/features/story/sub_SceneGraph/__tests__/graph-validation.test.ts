/**
 * Graph Validation Tests
 * Tests for orphan and dead-end detection in story graphs
 */

import { describe, it, expect } from 'vitest';
import type { Scene } from '@/app/types/Scene';
import type { SceneChoice } from '@/app/types/SceneChoice';

// Since validateGraph is not exported directly, we replicate its pure logic here
// to test the algorithm. The hook useGraphValidation calls validateGraph internally.

interface ValidationStats {
  orphanedScenes: number;
  deadEndScenes: number;
}

function computeValidationStats(
  scenes: Pick<Scene, 'id' | 'name'>[],
  choices: Pick<SceneChoice, 'scene_id' | 'target_scene_id'>[],
  firstSceneId: string | null
): ValidationStats {
  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();

  for (const choice of choices) {
    outgoingCount.set(choice.scene_id, (outgoingCount.get(choice.scene_id) || 0) + 1);
    if (choice.target_scene_id) {
      incomingCount.set(choice.target_scene_id, (incomingCount.get(choice.target_scene_id) || 0) + 1);
    }
  }

  let orphanedScenes = 0;
  let deadEndScenes = 0;

  for (const scene of scenes) {
    // Orphaned: no incoming except first scene
    if (scene.id !== firstSceneId && !incomingCount.has(scene.id)) {
      orphanedScenes++;
    }
    // Dead end: no outgoing
    if (!outgoingCount.has(scene.id)) {
      deadEndScenes++;
    }
  }

  return { orphanedScenes, deadEndScenes };
}

describe('Graph Validation', () => {
  describe('linear graph: A -> B -> C', () => {
    const scenes = [
      { id: 'a', name: 'Scene A' },
      { id: 'b', name: 'Scene B' },
      { id: 'c', name: 'Scene C' },
    ];
    const choices = [
      { scene_id: 'a', target_scene_id: 'b' },
      { scene_id: 'b', target_scene_id: 'c' },
    ];

    it('detects dead-end scene C (no outgoing choices)', () => {
      const stats = computeValidationStats(scenes, choices, 'a');
      expect(stats.deadEndScenes).toBe(1); // C has no outgoing
    });

    it('detects no orphan scenes', () => {
      const stats = computeValidationStats(scenes, choices, 'a');
      expect(stats.orphanedScenes).toBe(0);
    });
  });

  describe('orphan detection: A -> B, C disconnected', () => {
    const scenes = [
      { id: 'a', name: 'Scene A' },
      { id: 'b', name: 'Scene B' },
      { id: 'c', name: 'Scene C' },
    ];
    const choices = [
      { scene_id: 'a', target_scene_id: 'b' },
    ];

    it('detects C as orphan (no incoming links)', () => {
      const stats = computeValidationStats(scenes, choices, 'a');
      expect(stats.orphanedScenes).toBe(1); // C is orphan
    });
  });

  describe('mixed: A -> B, C disconnected, B has no choices', () => {
    const scenes = [
      { id: 'a', name: 'Scene A' },
      { id: 'b', name: 'Scene B' },
      { id: 'c', name: 'Scene C' },
    ];
    const choices = [
      { scene_id: 'a', target_scene_id: 'b' },
    ];

    it('detects dead-end=2 (B and C), orphan=1 (C)', () => {
      const stats = computeValidationStats(scenes, choices, 'a');
      expect(stats.deadEndScenes).toBe(2); // B and C have no outgoing
      expect(stats.orphanedScenes).toBe(1); // C is orphan
    });
  });

  describe('branching graph', () => {
    const scenes = [
      { id: 'a', name: 'Start' },
      { id: 'b', name: 'Fight' },
      { id: 'c', name: 'Flee' },
      { id: 'd', name: 'Victory' },
    ];
    const choices = [
      { scene_id: 'a', target_scene_id: 'b' },
      { scene_id: 'a', target_scene_id: 'c' },
      { scene_id: 'b', target_scene_id: 'd' },
    ];

    it('returns correct stats for branching graph', () => {
      const stats = computeValidationStats(scenes, choices, 'a');
      expect(stats.orphanedScenes).toBe(0); // All reachable
      expect(stats.deadEndScenes).toBe(2); // C and D are dead ends
    });
  });
});
