import type { EntitySchema } from './types';
import {
  CHARACTER_SCHEMA,
  SCENE_SCHEMA,
  BEAT_SCHEMA,
  ACT_SCHEMA,
  FACTION_SCHEMA,
  VOICE_SCHEMA,
} from './entitySchemas';

export const ENTITY_SCHEMAS: Record<string, EntitySchema> = {
  character: CHARACTER_SCHEMA,
  scene: SCENE_SCHEMA,
  beat: BEAT_SCHEMA,
  act: ACT_SCHEMA,
  faction: FACTION_SCHEMA,
  voice: VOICE_SCHEMA,
};

export function getEntitySchema(entity: string): EntitySchema | undefined {
  return ENTITY_SCHEMAS[entity];
}

export { type EntitySchema, type PrimitiveType } from './types';
