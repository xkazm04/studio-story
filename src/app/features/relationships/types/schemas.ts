import { z } from 'zod';
import { RelationshipType } from './index';

/**
 * Zod schema for RelationshipType enum
 * This is the source of truth for valid relationship types
 */
export const RelationshipTypeSchema = z.nativeEnum(RelationshipType);

/**
 * Position coordinate schema with validation
 */
export const PositionSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
});

/**
 * Character schema (base validation)
 * Source of truth for Character type validation
 */
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Character name is required'),
  type: z.string().optional(),
  voice: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  project_id: z.string().uuid().optional(),
  faction_id: z.string().uuid().optional().nullable(),
  transparent_avatar_url: z.string().url().optional().or(z.literal('')),
  body_url: z.string().url().optional().or(z.literal('')),
  transparent_body_url: z.string().url().optional().or(z.literal(''))
});

/**
 * Faction schema (base validation)
 * Source of truth for Faction type validation
 */
export const FactionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Faction name is required'),
  description: z.string().optional(),
  project_id: z.string().uuid(),
  logo_url: z.string().url().optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  media: z.array(z.any()).optional(), // FactionMedia schema can be added if needed
  branding: z.any().optional() // FactionBranding schema can be added if needed
});

/**
 * Character relationship schema (from database)
 */
export const CharRelationshipSchema = z.object({
  id: z.string().uuid(),
  character_a_id: z.string().uuid(),
  character_b_id: z.string().uuid(),
  event_date: z.string().optional(),
  description: z.string(),
  act_id: z.string().uuid().optional().nullable(),
  relationship_type: z.string().optional()
});

/**
 * Faction relationship schema (from database)
 */
export const FactionRelationshipSchema = z.object({
  id: z.string().uuid(),
  faction_a_id: z.string().uuid(),
  faction_b_id: z.string().uuid(),
  description: z.string(),
  relationship_type: z.string().optional()
});

/**
 * Character node data schema
 */
export const CharacterNodeDataSchema = z.object({
  character: CharacterSchema,
  label: z.string().min(1),
  type: z.literal('character')
});

/**
 * Faction node data schema
 */
export const FactionNodeDataSchema = z.object({
  faction: FactionSchema,
  label: z.string().min(1),
  type: z.literal('faction')
});

/**
 * Node data discriminated union
 */
export const NodeDataSchema = z.discriminatedUnion('type', [
  CharacterNodeDataSchema,
  FactionNodeDataSchema
]);

/**
 * Relationship node schema
 * Source of truth for node structure
 */
export const RelationshipNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['character', 'faction']),
  position: PositionSchema,
  data: NodeDataSchema
});

/**
 * Relationship edge data schema
 */
export const RelationshipEdgeDataSchema = z.object({
  relationshipId: z.string().uuid(),
  relationshipType: RelationshipTypeSchema,
  description: z.string().optional(),
  sourceEntity: z.union([CharacterSchema, FactionSchema]),
  targetEntity: z.union([CharacterSchema, FactionSchema])
});

/**
 * Relationship edge schema
 * Source of truth for edge structure
 */
export const RelationshipEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.literal('relationship'),
  data: RelationshipEdgeDataSchema
});

/**
 * API response schema for relationship map data
 */
export const RelationshipMapDataSchema = z.object({
  nodes: z.array(RelationshipNodeSchema),
  edges: z.array(RelationshipEdgeSchema)
});

/**
 * Node position update schema
 */
export const NodePositionUpdateSchema = z.object({
  nodeId: z.string().min(1),
  position: PositionSchema
});

/**
 * Edge update schema
 */
export const EdgeUpdateSchema = z.object({
  edgeId: z.string().min(1),
  relationshipType: RelationshipTypeSchema,
  description: z.string().optional()
});

/**
 * API request/response schemas
 */
export const CharacterArraySchema = z.array(CharacterSchema);
export const FactionArraySchema = z.array(FactionSchema);
export const CharRelationshipArraySchema = z.array(CharRelationshipSchema);
export const FactionRelationshipArraySchema = z.array(FactionRelationshipSchema);

// Infer types from schemas for validation
export type ValidatedCharacter = z.infer<typeof CharacterSchema>;
export type ValidatedFaction = z.infer<typeof FactionSchema>;
export type ValidatedCharRelationship = z.infer<typeof CharRelationshipSchema>;
export type ValidatedFactionRelationship = z.infer<typeof FactionRelationshipSchema>;
export type ValidatedRelationshipNode = z.infer<typeof RelationshipNodeSchema>;
export type ValidatedRelationshipEdge = z.infer<typeof RelationshipEdgeSchema>;
export type ValidatedRelationshipMapData = z.infer<typeof RelationshipMapDataSchema>;
