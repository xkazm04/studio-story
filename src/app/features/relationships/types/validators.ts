import { ZodError } from 'zod';
import {
  CharacterArraySchema,
  FactionArraySchema,
  CharRelationshipArraySchema,
  FactionRelationshipArraySchema,
  RelationshipMapDataSchema,
  NodePositionUpdateSchema,
  EdgeUpdateSchema,
  RelationshipTypeSchema
} from './schemas';
import {
  RelationshipMapData,
  NodePositionUpdate,
  EdgeUpdate,
  RelationshipType
} from './index';
import { Character, CharRelationship } from '@/app/types/Character';
import { Faction, FactionRelationship } from '@/app/types/Faction';
import { logger } from '@/app/utils/logger';

/**
 * Validation error with detailed information
 */
export class ValidationError extends Error {
  public readonly validationErrors: string[];
  public readonly context: string;

  constructor(context: string, errors: string[]) {
    super(`Validation failed for ${context}: ${errors.join(', ')}`);
    this.name = 'ValidationError';
    this.context = context;
    this.validationErrors = errors;
  }
}

/**
 * Result of a validation operation
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Type guard result with detailed error information
 * Re-exported from guards.ts for convenience
 */
export interface TypeGuardResult<T> {
  isValid: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Generic validation helper to reduce code duplication
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns ValidationResult with typed data or errors
 */
function validateWithSchema<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return {
      success: true,
      data: validated as T
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validates API response containing characters
 * @param data - Raw API response
 * @returns ValidationResult with typed data or errors
 */
export function validateCharacterArray(data: unknown): ValidationResult<Character[]> {
  return validateWithSchema(CharacterArraySchema, data);
}

/**
 * Validates API response containing factions
 * @param data - Raw API response
 * @returns ValidationResult with typed data or errors
 */
export function validateFactionArray(data: unknown): ValidationResult<Faction[]> {
  return validateWithSchema(FactionArraySchema, data);
}

/**
 * Validates API response containing character relationships
 * @param data - Raw API response
 * @returns ValidationResult with typed data or errors
 */
export function validateCharRelationshipArray(data: unknown): ValidationResult<CharRelationship[]> {
  return validateWithSchema(CharRelationshipArraySchema, data);
}

/**
 * Validates API response containing faction relationships
 * @param data - Raw API response
 * @returns ValidationResult with typed data or errors
 */
export function validateFactionRelationshipArray(data: unknown): ValidationResult<FactionRelationship[]> {
  return validateWithSchema(FactionRelationshipArraySchema, data);
}

/**
 * Validates relationship map data structure
 * @param data - RelationshipMapData to validate
 * @returns ValidationResult with typed data or errors
 */
export function validateRelationshipMapData(data: unknown): ValidationResult<RelationshipMapData> {
  return validateWithSchema(RelationshipMapDataSchema, data);
}

/**
 * Validates node position update
 * @param data - Position update data
 * @returns ValidationResult with typed data or errors
 */
export function validateNodePositionUpdate(data: unknown): ValidationResult<NodePositionUpdate> {
  return validateWithSchema(NodePositionUpdateSchema, data);
}

/**
 * Validates edge update data
 * @param data - Edge update data
 * @returns ValidationResult with typed data or errors
 */
export function validateEdgeUpdate(data: unknown): ValidationResult<EdgeUpdate> {
  return validateWithSchema(EdgeUpdateSchema, data);
}

/**
 * Validates relationship type string and converts to enum
 * @param type - Relationship type string
 * @returns ValidationResult with RelationshipType or errors
 */
export function validateRelationshipType(type: unknown): ValidationResult<RelationshipType> {
  return validateWithSchema(RelationshipTypeSchema, type);
}

/**
 * Asserts that data is valid, throws ValidationError if not
 * @param result - ValidationResult to check
 * @param context - Context for error message
 * @throws ValidationError if validation failed
 */
export function assertValidation<T>(
  result: ValidationResult<T>,
  context: string
): asserts result is { success: true; data: T } {
  if (!result.success || !result.data) {
    throw new ValidationError(context, result.errors || ['Unknown error']);
  }
}

/**
 * Safe wrapper for validation that logs errors but doesn't throw
 * @param validationFn - Validation function to call
 * @param data - Data to validate
 * @param defaultValue - Default value to return on error
 * @param context - Context for logging
 * @returns Validated data or default value
 */
export function safeValidate<T>(
  validationFn: (data: unknown) => ValidationResult<T>,
  data: unknown,
  defaultValue: T,
  context: string
): T {
  const result = validationFn(data);

  if (!result.success) {
    logger.warn(`Validation failed for ${context}`, { errors: result.errors });
    return defaultValue;
  }

  return result.data!;
}

/**
 * Validates and sanitizes incoming API data
 * Filters out invalid items and logs warnings
 * @param validationFn - Validation function
 * @param data - Array data to validate
 * @param context - Context for logging
 * @returns Array of valid items
 */
export function validateAndSanitizeArray<T>(
  validationFn: (data: unknown) => ValidationResult<T>,
  data: unknown[],
  context: string
): T[] {
  const validItems: T[] = [];
  const errors: string[] = [];

  data.forEach((item, index) => {
    const result = validationFn(item);
    if (result.success && result.data) {
      validItems.push(result.data);
    } else {
      errors.push(`Item ${index}: ${result.errors?.join(', ')}`);
    }
  });

  if (errors.length > 0) {
    logger.warn(`Validation warnings for ${context}`, { errors });
  }

  return validItems;
}
