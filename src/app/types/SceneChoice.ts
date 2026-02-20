/**
 * SceneChoice - Navigation/branching between scenes
 * Migrated from Hyper's Choice concept for interactive story flow
 */

export interface SceneChoice {
  id: string;
  scene_id: string;
  target_scene_id: string | null;
  label: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export interface SceneChoiceCreateInput {
  scene_id: string;
  target_scene_id?: string | null;
  label: string;
  order_index?: number;
}

export interface SceneChoiceUpdateInput {
  target_scene_id?: string | null;
  label?: string;
  order_index?: number;
}

/**
 * Graph analysis types for scene validation
 */
export interface SceneGraphIndices {
  choicesBySceneId: Map<string, SceneChoice[]>;
  predecessorsBySceneId: Map<string, Set<string>>;
  successorsBySceneId: Map<string, Set<string>>;
}

export interface SceneValidationResult {
  isValid: boolean;
  errors: SceneValidationError[];
  warnings: SceneValidationWarning[];
}

export interface SceneValidationError {
  type: 'orphaned_scene' | 'dead_end' | 'missing_first_scene' | 'invalid_target' | 'circular_reference';
  sceneId: string;
  message: string;
}

export interface SceneValidationWarning {
  type: 'no_choices' | 'single_choice' | 'incomplete_content';
  sceneId: string;
  message: string;
}

/**
 * Builds graph indices for O(1) lookups
 */
export function buildGraphIndices(choices: SceneChoice[]): SceneGraphIndices {
  const choicesBySceneId = new Map<string, SceneChoice[]>();
  const predecessorsBySceneId = new Map<string, Set<string>>();
  const successorsBySceneId = new Map<string, Set<string>>();

  for (const choice of choices) {
    // Build choices by scene
    const existing = choicesBySceneId.get(choice.scene_id) || [];
    existing.push(choice);
    choicesBySceneId.set(choice.scene_id, existing);

    // Build successors (where this scene leads to)
    const successors = successorsBySceneId.get(choice.scene_id) || new Set();
    if (choice.target_scene_id) {
      successors.add(choice.target_scene_id);
    }
    successorsBySceneId.set(choice.scene_id, successors);

    // Build predecessors (what scenes lead here)
    if (choice.target_scene_id) {
      const predecessors = predecessorsBySceneId.get(choice.target_scene_id) || new Set();
      predecessors.add(choice.scene_id);
      predecessorsBySceneId.set(choice.target_scene_id, predecessors);
    }
  }

  return { choicesBySceneId, predecessorsBySceneId, successorsBySceneId };
}
