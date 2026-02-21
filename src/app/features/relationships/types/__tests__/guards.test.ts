import { describe, it, expect } from 'vitest';
import {
  isRelationshipType,
  isCharacterNodeData,
  isFactionNodeData,
  isNodeData,
  isRelationshipNode,
  isRelationshipEdge,
  validateRelationshipNode,
  validateRelationshipEdge,
  validateRelationshipNodes,
  validateRelationshipEdges,
  assertRelationshipNode,
  assertRelationshipEdge,
  safeParseRelationshipNode,
  safeParseRelationshipEdge
} from '../guards';
import { RelationshipType } from '../index';

describe('Type Guards', () => {
  describe('isRelationshipType', () => {
    it('should validate valid relationship types', () => {
      expect(isRelationshipType(RelationshipType.ALLY)).toBe(true);
      expect(isRelationshipType(RelationshipType.ENEMY)).toBe(true);
      expect(isRelationshipType(RelationshipType.FAMILY)).toBe(true);
    });

    it('should reject invalid relationship types', () => {
      expect(isRelationshipType('INVALID')).toBe(false);
      expect(isRelationshipType('')).toBe(false);
      expect(isRelationshipType(null)).toBe(false);
      expect(isRelationshipType(undefined)).toBe(false);
      expect(isRelationshipType(123)).toBe(false);
    });
  });

  describe('isCharacterNodeData', () => {
    it('should validate valid character node data', () => {
      const validData = {
        character: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Character'
        },
        label: 'Test Character',
        type: 'character' as const
      };

      expect(isCharacterNodeData(validData)).toBe(true);
    });

    it('should reject invalid character node data', () => {
      expect(isCharacterNodeData({ type: 'character' })).toBe(false);
      expect(isCharacterNodeData({ character: {}, label: '', type: 'character' })).toBe(false);
      expect(isCharacterNodeData({ type: 'faction' })).toBe(false);
    });
  });

  describe('isRelationshipNode', () => {
    it('should validate valid relationship nodes', () => {
      const validNode = {
        id: 'char-123',
        type: 'character' as const,
        position: { x: 100, y: 200 },
        data: {
          character: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Character'
          },
          label: 'Test Character',
          type: 'character' as const
        }
      };

      expect(isRelationshipNode(validNode)).toBe(true);
    });

    it('should reject nodes with invalid positions', () => {
      const invalidNode = {
        id: 'char-123',
        type: 'character' as const,
        position: { x: Infinity, y: 200 },
        data: {
          character: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test'
          },
          label: 'Test',
          type: 'character' as const
        }
      };

      expect(isRelationshipNode(invalidNode)).toBe(false);
    });
  });

  describe('validateRelationshipNode', () => {
    it('should return success for valid nodes', () => {
      const validNode = {
        id: 'char-123',
        type: 'character' as const,
        position: { x: 100, y: 200 },
        data: {
          character: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Character'
          },
          label: 'Test Character',
          type: 'character' as const
        }
      };

      const result = validateRelationshipNode(validNode);
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid nodes', () => {
      const invalidNode = {
        id: '',
        type: 'invalid',
        position: { x: 'not-a-number', y: 200 }
      };

      const result = validateRelationshipNode(invalidNode);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('isRelationshipEdge', () => {
    it('should validate valid relationship edges', () => {
      const validEdge = {
        id: 'char-rel-123',
        source: 'char-1',
        target: 'char-2',
        type: 'relationship' as const,
        data: {
          relationshipId: '123e4567-e89b-12d3-a456-426614174000',
          relationshipType: RelationshipType.ALLY,
          description: 'Test relationship',
          sourceEntity: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Character 1'
          },
          targetEntity: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Character 2'
          }
        }
      };

      expect(isRelationshipEdge(validEdge)).toBe(true);
    });

    it('should reject edges with invalid relationship types', () => {
      const invalidEdge = {
        id: 'char-rel-123',
        source: 'char-1',
        target: 'char-2',
        type: 'relationship' as const,
        data: {
          relationshipId: '123e4567-e89b-12d3-a456-426614174000',
          relationshipType: 'INVALID_TYPE',
          sourceEntity: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Character 1'
          },
          targetEntity: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Character 2'
          }
        }
      };

      expect(isRelationshipEdge(invalidEdge)).toBe(false);
    });
  });

  describe('validateRelationshipEdge', () => {
    it('should return success for valid edges', () => {
      const validEdge = {
        id: 'char-rel-123',
        source: 'char-1',
        target: 'char-2',
        type: 'relationship' as const,
        data: {
          relationshipId: '123e4567-e89b-12d3-a456-426614174000',
          relationshipType: RelationshipType.FRIEND,
          sourceEntity: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Character 1'
          },
          targetEntity: {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Character 2'
          }
        }
      };

      const result = validateRelationshipEdge(validEdge);
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid edges', () => {
      const invalidEdge = {
        id: '',
        source: '',
        target: '',
        type: 'invalid'
      };

      const result = validateRelationshipEdge(invalidEdge);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateRelationshipNodes', () => {
    it('should validate array of nodes', () => {
      const nodes = [
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
        },
        {
          id: 'char-2',
          type: 'character' as const,
          position: { x: 300, y: 400 },
          data: {
            character: {
              id: '123e4567-e89b-12d3-a456-426614174001',
              name: 'Character 2'
            },
            label: 'Character 2',
            type: 'character' as const
          }
        }
      ];

      const result = validateRelationshipNodes(nodes);
      expect(result.isValid).toBe(true);
      expect(result.data?.length).toBe(2);
    });

    it('should report errors for invalid nodes in array', () => {
      const nodes = [
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
        },
        { invalid: 'node' } // Invalid node
      ];

      const result = validateRelationshipNodes(nodes);
      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('assertRelationshipNode', () => {
    it('should not throw for valid nodes', () => {
      const validNode = {
        id: 'char-123',
        type: 'character' as const,
        position: { x: 100, y: 200 },
        data: {
          character: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Character'
          },
          label: 'Test Character',
          type: 'character' as const
        }
      };

      expect(() => assertRelationshipNode(validNode)).not.toThrow();
    });

    it('should throw for invalid nodes', () => {
      const invalidNode = { invalid: 'node' };

      expect(() => assertRelationshipNode(invalidNode)).toThrow();
    });
  });

  describe('safeParseRelationshipNode', () => {
    it('should return node for valid data', () => {
      const validNode = {
        id: 'char-123',
        type: 'character' as const,
        position: { x: 100, y: 200 },
        data: {
          character: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Character'
          },
          label: 'Test Character',
          type: 'character' as const
        }
      };

      const result = safeParseRelationshipNode(validNode);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('char-123');
    });

    it('should return null for invalid data', () => {
      const invalidNode = { invalid: 'node' };

      const result = safeParseRelationshipNode(invalidNode);
      expect(result).toBeNull();
    });
  });
});
