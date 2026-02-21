import { describe, it, expect } from 'vitest';
import {
  validateCharacterArray,
  validateFactionArray,
  validateCharRelationshipArray,
  validateFactionRelationshipArray,
  validateRelationshipMapData,
  validateNodePositionUpdate,
  validateEdgeUpdate,
  validateRelationshipType,
  assertValidation,
  safeValidate,
  ValidationError
} from '../validators';
import { RelationshipType } from '../index';

describe('Validators', () => {
  describe('validateCharacterArray', () => {
    it('should validate valid character array', () => {
      const characters = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Character 1'
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Character 2'
        }
      ];

      const result = validateCharacterArray(characters);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
    });

    it('should reject invalid character data', () => {
      const invalidCharacters = [
        { id: 'not-a-uuid', name: '' },
        { invalid: 'data' }
      ];

      const result = validateCharacterArray(invalidCharacters);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle non-array input', () => {
      const result = validateCharacterArray('not an array');
      expect(result.success).toBe(false);
    });
  });

  describe('validateFactionArray', () => {
    it('should validate valid faction array', () => {
      const factions = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Faction 1',
          project_id: '123e4567-e89b-12d3-a456-426614174002'
        }
      ];

      const result = validateFactionArray(factions);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject factions with invalid UUIDs', () => {
      const invalidFactions = [
        {
          id: 'invalid-uuid',
          name: 'Faction',
          project_id: 'also-invalid'
        }
      ];

      const result = validateFactionArray(invalidFactions);
      expect(result.success).toBe(false);
    });
  });

  describe('validateCharRelationshipArray', () => {
    it('should validate valid character relationships', () => {
      const relationships = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          character_a_id: '123e4567-e89b-12d3-a456-426614174001',
          character_b_id: '123e4567-e89b-12d3-a456-426614174002',
          description: 'Test relationship'
        }
      ];

      const result = validateCharRelationshipArray(relationships);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject relationships with missing required fields', () => {
      const invalidRelationships = [
        { id: '123e4567-e89b-12d3-a456-426614174000' }
      ];

      const result = validateCharRelationshipArray(invalidRelationships);
      expect(result.success).toBe(false);
    });
  });

  describe('validateRelationshipMapData', () => {
    it('should validate valid map data', () => {
      const mapData = {
        nodes: [
          {
            id: 'char-1',
            type: 'character' as const,
            position: { x: 100, y: 200 },
            data: {
              character: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Character 1'
              },
              label: 'Character 1',
              type: 'character' as const
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'char-1',
            target: 'char-2',
            type: 'relationship' as const,
            data: {
              relationshipId: '123e4567-e89b-12d3-a456-426614174000',
              relationshipType: RelationshipType.ALLY,
              sourceEntity: {
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Character 1'
              },
              targetEntity: {
                id: '123e4567-e89b-12d3-a456-426614174002',
                name: 'Character 2'
              }
            }
          }
        ]
      };

      const result = validateRelationshipMapData(mapData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject map data with invalid structure', () => {
      const invalidMapData = {
        nodes: 'not an array',
        edges: null
      };

      const result = validateRelationshipMapData(invalidMapData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateNodePositionUpdate', () => {
    it('should validate valid position update', () => {
      const update = {
        nodeId: 'char-123',
        position: { x: 100, y: 200 }
      };

      const result = validateNodePositionUpdate(update);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject position with non-finite numbers', () => {
      const invalidUpdate = {
        nodeId: 'char-123',
        position: { x: Infinity, y: 200 }
      };

      const result = validateNodePositionUpdate(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should reject position with missing nodeId', () => {
      const invalidUpdate = {
        nodeId: '',
        position: { x: 100, y: 200 }
      };

      const result = validateNodePositionUpdate(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('validateEdgeUpdate', () => {
    it('should validate valid edge update', () => {
      const update = {
        edgeId: 'edge-123',
        relationshipType: RelationshipType.FRIEND,
        description: 'Test description'
      };

      const result = validateEdgeUpdate(update);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject edge update with invalid relationship type', () => {
      const invalidUpdate = {
        edgeId: 'edge-123',
        relationshipType: 'INVALID_TYPE' as any
      };

      const result = validateEdgeUpdate(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe('validateRelationshipType', () => {
    it('should validate valid relationship types', () => {
      const result = validateRelationshipType(RelationshipType.ALLY);
      expect(result.success).toBe(true);
      expect(result.data).toBe(RelationshipType.ALLY);
    });

    it('should reject invalid relationship types', () => {
      const result = validateRelationshipType('INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('assertValidation', () => {
    it('should not throw for successful validation', () => {
      const successResult = {
        success: true as const,
        data: { test: 'data' }
      };

      expect(() => assertValidation(successResult, 'test')).not.toThrow();
    });

    it('should throw ValidationError for failed validation', () => {
      const failResult = {
        success: false as const,
        errors: ['Error 1', 'Error 2']
      };

      expect(() => assertValidation(failResult, 'test')).toThrow(ValidationError);
    });
  });

  describe('safeValidate', () => {
    it('should return validated data on success', () => {
      const validData = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Character 1'
        }
      ];

      const result = safeValidate(
        validateCharacterArray,
        validData,
        [],
        'test'
      );

      expect(result.length).toBe(1);
    });

    it('should return default value on validation failure', () => {
      const invalidData = 'not an array';
      const defaultValue: any[] = [];

      const result = safeValidate(
        validateCharacterArray,
        invalidData,
        defaultValue,
        'test'
      );

      expect(result).toBe(defaultValue);
    });
  });

  describe('ValidationError', () => {
    it('should create error with proper message', () => {
      const error = new ValidationError('TestContext', ['Error 1', 'Error 2']);

      expect(error.name).toBe('ValidationError');
      expect(error.context).toBe('TestContext');
      expect(error.validationErrors).toEqual(['Error 1', 'Error 2']);
      expect(error.message).toContain('TestContext');
      expect(error.message).toContain('Error 1');
    });
  });
});
