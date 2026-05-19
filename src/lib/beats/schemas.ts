/**
 * Shared Zod schemas for beats, dependencies, pacing, and scene mappings.
 *
 * Single source of truth used by both Next.js API routes and MCP tools.
 * Keep enum values in sync with src/app/types/Beat.ts type aliases.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Beat type enum
// ---------------------------------------------------------------------------

export const BEAT_TYPE_VALUES = [
  'setup',
  'conflict',
  'resolution',
  'climax',
  'transition',
  'reveal',
  'action',
] as const;

export const beatTypeSchema = z.enum(BEAT_TYPE_VALUES);

// ---------------------------------------------------------------------------
// Beat schemas
// ---------------------------------------------------------------------------

/** GET /api/beats query — at least one of projectId or actId required */
export const beatGetParamsSchema = z
  .object({
    projectId: z.string().uuid().optional(),
    actId: z.string().uuid().optional(),
  })
  .refine((d) => d.projectId || d.actId, {
    message: 'projectId or actId is required',
  });

/** POST /api/beats body */
export const beatCreateSchema = z
  .object({
    name: z.string().min(1, 'name is required'),
    type: beatTypeSchema,
    project_id: z.string().uuid().optional(),
    act_id: z.string().uuid().optional(),
    description: z.string().optional(),
    order: z.number().int().optional(),
  })
  .refine((d) => d.project_id || d.act_id, {
    message: 'Either project_id or act_id is required',
  });

/** PUT /api/beats/[id] body — all fields optional */
export const beatUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: beatTypeSchema.optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
  completed: z.boolean().optional(),
  paragraph_id: z.string().optional(),
  paragraph_title: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Dependency schemas
// ---------------------------------------------------------------------------

export const DEPENDENCY_TYPE_VALUES = ['sequential', 'parallel', 'causal'] as const;
export const DEPENDENCY_STRENGTH_VALUES = ['required', 'suggested', 'optional'] as const;

export const dependencyTypeSchema = z.enum(DEPENDENCY_TYPE_VALUES);
export const dependencyStrengthSchema = z.enum(DEPENDENCY_STRENGTH_VALUES);

/** GET /api/beat-dependencies query — at least one of projectId or beatId */
export const dependencyGetParamsSchema = z
  .object({
    projectId: z.string().optional(),
    beatId: z.string().optional(),
  })
  .refine((d) => d.projectId || d.beatId, {
    message: 'Either projectId or beatId is required',
  });

/** POST /api/beat-dependencies body */
export const dependencyCreateSchema = z.object({
  source_beat_id: z.string().min(1, 'source_beat_id is required'),
  target_beat_id: z.string().min(1, 'target_beat_id is required'),
  dependency_type: dependencyTypeSchema.default('sequential'),
  strength: dependencyStrengthSchema.default('required'),
});

// ---------------------------------------------------------------------------
// Pacing suggestion schemas
// ---------------------------------------------------------------------------

export const PACING_SUGGESTION_TYPE_VALUES = [
  'reorder',
  'adjust_duration',
  'merge',
  'split',
] as const;

export const pacingSuggestionTypeSchema = z.enum(PACING_SUGGESTION_TYPE_VALUES);

/** GET /api/beat-pacing query — at least one of projectId or beatId */
export const pacingGetParamsSchema = z
  .object({
    projectId: z.string().optional(),
    beatId: z.string().optional(),
  })
  .refine((d) => d.projectId || d.beatId, {
    message: 'Either projectId or beatId is required',
  });

/** POST /api/beat-pacing body */
export const pacingCreateSchema = z.object({
  project_id: z.string().min(1, 'project_id is required'),
  beat_id: z.string().min(1, 'beat_id is required'),
  suggestion_type: pacingSuggestionTypeSchema,
  suggested_order: z.number().int().nullable().optional(),
  suggested_duration: z.number().nullable().optional(),
  reasoning: z.string().min(1, 'reasoning is required'),
  confidence: z.number().min(0).max(1).default(0.7),
});

// ---------------------------------------------------------------------------
// Beat-scene mapping schemas
// ---------------------------------------------------------------------------

export const MAPPING_STATUS_VALUES = [
  'suggested',
  'accepted',
  'rejected',
  'modified',
] as const;

export const mappingStatusSchema = z.enum(MAPPING_STATUS_VALUES);

/** POST /api/beat-scene-mappings body */
export const beatSceneMappingCreateSchema = z.object({
  beat_id: z.string().min(1, 'beat_id is required'),
  project_id: z.string().min(1, 'project_id is required'),
  scene_id: z.string().nullable().optional(),
  status: mappingStatusSchema.default('suggested'),
  suggested_scene_name: z.string().optional(),
  suggested_scene_description: z.string().optional(),
  suggested_scene_script: z.string().optional(),
  suggested_location: z.string().optional(),
  semantic_similarity_score: z.number().optional(),
  reasoning: z.string().optional(),
  ai_model: z.string().default('gpt-4o-mini'),
  confidence_score: z.number().optional(),
  user_modified: z.boolean().default(false),
});

/** PUT /api/beat-scene-mappings/[id] body */
export const beatSceneMappingUpdateSchema = z.object({
  status: mappingStatusSchema.optional(),
  scene_id: z.string().optional(),
  suggested_scene_name: z.string().optional(),
  suggested_scene_description: z.string().optional(),
  suggested_scene_script: z.string().optional(),
  suggested_location: z.string().optional(),
  user_feedback: z.string().optional(),
  user_modified: z.boolean().optional(),
});
