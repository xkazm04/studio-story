import { Node, Edge } from 'reactflow';
import { Character } from '@/app/types/Character';
import { Faction } from '@/app/types/Faction';

// Relationship types enum
export enum RelationshipType {
  ALLY = 'ALLY',
  ENEMY = 'ENEMY',
  FAMILY = 'FAMILY',
  FRIEND = 'FRIEND',
  RIVAL = 'RIVAL',
  ROMANTIC = 'ROMANTIC',
  BUSINESS = 'BUSINESS',
  MENTOR = 'MENTOR',
  NEUTRAL = 'NEUTRAL',
  UNKNOWN = 'UNKNOWN'
}

// Relationship type display config
export const RelationshipTypeConfig: Record<RelationshipType, { color: string; label: string }> = {
  [RelationshipType.ALLY]: { color: '#10b981', label: 'Ally' },
  [RelationshipType.ENEMY]: { color: '#ef4444', label: 'Enemy' },
  [RelationshipType.FAMILY]: { color: '#8b5cf6', label: 'Family' },
  [RelationshipType.FRIEND]: { color: '#3b82f6', label: 'Friend' },
  [RelationshipType.RIVAL]: { color: '#f59e0b', label: 'Rival' },
  [RelationshipType.ROMANTIC]: { color: '#ec4899', label: 'Romantic' },
  [RelationshipType.BUSINESS]: { color: '#6366f1', label: 'Business' },
  [RelationshipType.MENTOR]: { color: '#14b8a6', label: 'Mentor' },
  [RelationshipType.NEUTRAL]: { color: '#6b7280', label: 'Neutral' },
  [RelationshipType.UNKNOWN]: { color: '#9ca3af', label: 'Unknown' }
};

// Node data types
export interface CharacterNodeData {
  character: Character;
  label: string;
  type: 'character';
}

export interface FactionNodeData {
  faction: Faction;
  label: string;
  type: 'faction';
}

export type NodeData = CharacterNodeData | FactionNodeData;

// Relationship node type
export interface RelationshipNode extends Node {
  id: string;
  type: 'character' | 'faction';
  position: { x: number; y: number };
  data: NodeData;
}

// Edge data type
export interface RelationshipEdgeData {
  relationshipId: string;
  relationshipType: RelationshipType;
  description?: string;
  sourceEntity: Character | Faction;
  targetEntity: Character | Faction;
}

// Relationship edge type
export type RelationshipEdge = Edge<RelationshipEdgeData> & {
  id: string;
  source: string;
  target: string;
  type: 'relationship';
  data: RelationshipEdgeData;
};

// API response types
export interface RelationshipMapData {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

// Node position update
export interface NodePositionUpdate {
  nodeId: string;
  position: { x: number; y: number };
}

// Edge update
export interface EdgeUpdate {
  edgeId: string;
  relationshipType: RelationshipType;
  description?: string;
}

// Export validation utilities for convenience
export { ValidationError } from './validators';
export type { ValidationResult, TypeGuardResult } from './validators';
