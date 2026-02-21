import {
  RelationshipNode,
  RelationshipEdge,
  RelationshipType,
  CharacterNodeData,
  FactionNodeData,
  NodeData,
  RelationshipEdgeData
} from './index';
import {
  RelationshipNodeSchema,
  RelationshipEdgeSchema,
  RelationshipTypeSchema,
  CharacterNodeDataSchema,
  FactionNodeDataSchema,
  NodeDataSchema,
  RelationshipEdgeDataSchema
} from './schemas';
import { ZodError } from 'zod';

/**
 * Type guard result with detailed error information
 */
export interface TypeGuardResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Generic helper for creating simple type guards
 * @param schema - Zod schema to validate against
 * @param value - Value to check
 * @returns True if value passes schema validation
 */
function createTypeGuard<T>(
  schema: { parse: (data: unknown) => T },
  value: unknown
): value is T {
  try {
    schema.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for RelationshipType enum
 * @param value - Value to check
 * @returns True if value is a valid RelationshipType
 */
export function isRelationshipType(value: unknown): value is RelationshipType {
  return createTypeGuard(RelationshipTypeSchema, value);
}

/**
 * Type guard for CharacterNodeData with validation
 * @param value - Value to check
 * @returns TypeGuardResult with validation details
 */
export function isCharacterNodeData(value: unknown): value is CharacterNodeData {
  return createTypeGuard(CharacterNodeDataSchema, value);
}

/**
 * Type guard for FactionNodeData with validation
 * @param value - Value to check
 * @returns TypeGuardResult with validation details
 */
export function isFactionNodeData(value: unknown): value is FactionNodeData {
  return createTypeGuard(FactionNodeDataSchema, value);
}

/**
 * Type guard for NodeData (discriminated union)
 * @param value - Value to check
 * @returns True if value is valid NodeData
 */
export function isNodeData(value: unknown): value is NodeData {
  return createTypeGuard(NodeDataSchema, value);
}

/**
 * Type guard for RelationshipNode with detailed validation
 * @param value - Value to check
 * @returns True if value is a valid RelationshipNode
 */
export function isRelationshipNode(value: unknown): value is RelationshipNode {
  return createTypeGuard(RelationshipNodeSchema, value);
}

/**
 * Validated type guard for RelationshipNode with error details
 * @param value - Value to validate
 * @returns TypeGuardResult with validation details
 */
export function validateRelationshipNode(value: unknown): TypeGuardResult<RelationshipNode> {
  try {
    const data = RelationshipNodeSchema.parse(value);
    return {
      isValid: true,
      data: data as RelationshipNode
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      isValid: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Type guard for RelationshipEdgeData
 * @param value - Value to check
 * @returns True if value is valid RelationshipEdgeData
 */
export function isRelationshipEdgeData(value: unknown): value is RelationshipEdgeData {
  return createTypeGuard(RelationshipEdgeDataSchema, value);
}

/**
 * Type guard for RelationshipEdge with validation
 * @param value - Value to check
 * @returns True if value is a valid RelationshipEdge
 */
export function isRelationshipEdge(value: unknown): value is RelationshipEdge {
  return createTypeGuard(RelationshipEdgeSchema, value);
}

/**
 * Validated type guard for RelationshipEdge with error details
 * @param value - Value to validate
 * @returns TypeGuardResult with validation details
 */
export function validateRelationshipEdge(value: unknown): TypeGuardResult<RelationshipEdge> {
  try {
    const data = RelationshipEdgeSchema.parse(value);
    return {
      isValid: true,
      data: data as RelationshipEdge
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      isValid: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validates an array of RelationshipNodes
 * @param values - Array to validate
 * @returns TypeGuardResult with validation details
 */
export function validateRelationshipNodes(values: unknown[]): TypeGuardResult<RelationshipNode[]> {
  const validNodes: RelationshipNode[] = [];
  const errors: string[] = [];

  values.forEach((value, index) => {
    const result = validateRelationshipNode(value);
    if (result.isValid && result.data) {
      validNodes.push(result.data);
    } else {
      errors.push(`Node ${index}: ${result.errors?.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    data: validNodes,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Validates an array of RelationshipEdges
 * @param values - Array to validate
 * @returns TypeGuardResult with validation details
 */
export function validateRelationshipEdges(values: unknown[]): TypeGuardResult<RelationshipEdge[]> {
  const validEdges: RelationshipEdge[] = [];
  const errors: string[] = [];

  values.forEach((value, index) => {
    const result = validateRelationshipEdge(value);
    if (result.isValid && result.data) {
      validEdges.push(result.data);
    } else {
      errors.push(`Edge ${index}: ${result.errors?.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    data: validEdges,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Assert that a value is a RelationshipNode (throws on failure)
 * @param value - Value to assert
 * @param context - Context for error message
 * @throws Error if validation fails
 */
export function assertRelationshipNode(
  value: unknown,
  context = 'RelationshipNode'
): asserts value is RelationshipNode {
  const result = validateRelationshipNode(value);
  if (!result.isValid) {
    throw new Error(`${context} validation failed: ${result.errors?.join(', ')}`);
  }
}

/**
 * Assert that a value is a RelationshipEdge (throws on failure)
 * @param value - Value to assert
 * @param context - Context for error message
 * @throws Error if validation fails
 */
export function assertRelationshipEdge(
  value: unknown,
  context = 'RelationshipEdge'
): asserts value is RelationshipEdge {
  const result = validateRelationshipEdge(value);
  if (!result.isValid) {
    throw new Error(`${context} validation failed: ${result.errors?.join(', ')}`);
  }
}

/**
 * Safe parser that returns validated data or null
 * @param value - Value to parse
 * @returns Validated RelationshipNode or null
 */
export function safeParseRelationshipNode(value: unknown): RelationshipNode | null {
  const result = validateRelationshipNode(value);
  return result.isValid && result.data ? result.data : null;
}

/**
 * Safe parser that returns validated data or null
 * @param value - Value to parse
 * @returns Validated RelationshipEdge or null
 */
export function safeParseRelationshipEdge(value: unknown): RelationshipEdge | null {
  const result = validateRelationshipEdge(value);
  return result.isValid && result.data ? result.data : null;
}
