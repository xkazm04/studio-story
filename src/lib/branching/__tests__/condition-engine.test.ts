/**
 * ConditionEngine Tests
 * Tests for condition evaluation with various operators
 */

import { describe, it, expect } from 'vitest';
import {
  conditionEngine,
  type Variable,
  type VariableValue,
  type SimpleCondition,
  type CompoundCondition,
  type NotCondition,
  type Condition,
} from '../ConditionEngine';

function makeVariable(id: string, type: Variable['type'], defaultValue: VariableValue): Variable {
  return { id, name: id, type, defaultValue, scope: 'global' };
}

describe('ConditionEngine', () => {
  describe('simple condition evaluation', () => {
    it('returns true for equality condition with matching variable', () => {
      const variables = new Map<string, Variable>([
        ['has_key', makeVariable('has_key', 'boolean', false)],
      ]);
      const state = new Map<string, VariableValue>([['has_key', true]]);
      const condition: SimpleCondition = {
        type: 'simple',
        variableId: 'has_key',
        operator: 'is_true',
        value: true,
      };

      const result = conditionEngine.evaluate(condition, variables, state);
      expect(result.success).toBe(true);
      expect(result.result).toBe(true);
    });

    it('returns false for equality condition with non-matching variable', () => {
      const variables = new Map<string, Variable>([
        ['has_key', makeVariable('has_key', 'boolean', false)],
      ]);
      const state = new Map<string, VariableValue>([['has_key', false]]);
      const condition: SimpleCondition = {
        type: 'simple',
        variableId: 'has_key',
        operator: 'is_true',
        value: true,
      };

      const result = conditionEngine.evaluate(condition, variables, state);
      expect(result.success).toBe(true);
      expect(result.result).toBe(false);
    });

    it('evaluates numeric comparison operators', () => {
      const variables = new Map<string, Variable>([
        ['score', makeVariable('score', 'number', 0)],
      ]);
      const state = new Map<string, VariableValue>([['score', 75]]);

      const gtCondition: SimpleCondition = {
        type: 'simple',
        variableId: 'score',
        operator: 'greater_than',
        value: 50,
      };
      expect(conditionEngine.evaluate(gtCondition, variables, state).result).toBe(true);

      const ltCondition: SimpleCondition = {
        type: 'simple',
        variableId: 'score',
        operator: 'less_than',
        value: 50,
      };
      expect(conditionEngine.evaluate(ltCondition, variables, state).result).toBe(false);
    });

    it('evaluates string equals operator', () => {
      const variables = new Map<string, Variable>([
        ['faction', makeVariable('faction', 'string', '')],
      ]);
      const state = new Map<string, VariableValue>([['faction', 'rebels']]);
      const condition: SimpleCondition = {
        type: 'simple',
        variableId: 'faction',
        operator: 'equals',
        value: 'rebels',
      };

      const result = conditionEngine.evaluate(condition, variables, state);
      expect(result.result).toBe(true);
    });
  });

  describe('compound condition evaluation', () => {
    it('evaluates AND: both true -> true', () => {
      const variables = new Map<string, Variable>([
        ['has_key', makeVariable('has_key', 'boolean', false)],
        ['has_map', makeVariable('has_map', 'boolean', false)],
      ]);
      const state = new Map<string, VariableValue>([
        ['has_key', true],
        ['has_map', true],
      ]);
      const condition: CompoundCondition = {
        type: 'compound',
        operator: 'and',
        conditions: [
          { type: 'simple', variableId: 'has_key', operator: 'is_true', value: true },
          { type: 'simple', variableId: 'has_map', operator: 'is_true', value: true },
        ],
      };

      expect(conditionEngine.evaluate(condition, variables, state).result).toBe(true);
    });

    it('evaluates AND: one false -> false', () => {
      const variables = new Map<string, Variable>([
        ['has_key', makeVariable('has_key', 'boolean', false)],
        ['has_map', makeVariable('has_map', 'boolean', false)],
      ]);
      const state = new Map<string, VariableValue>([
        ['has_key', true],
        ['has_map', false],
      ]);
      const condition: CompoundCondition = {
        type: 'compound',
        operator: 'and',
        conditions: [
          { type: 'simple', variableId: 'has_key', operator: 'is_true', value: true },
          { type: 'simple', variableId: 'has_map', operator: 'is_true', value: true },
        ],
      };

      expect(conditionEngine.evaluate(condition, variables, state).result).toBe(false);
    });

    it('evaluates OR: one true -> true', () => {
      const variables = new Map<string, Variable>([
        ['has_key', makeVariable('has_key', 'boolean', false)],
        ['has_map', makeVariable('has_map', 'boolean', false)],
      ]);
      const state = new Map<string, VariableValue>([
        ['has_key', false],
        ['has_map', true],
      ]);
      const condition: CompoundCondition = {
        type: 'compound',
        operator: 'or',
        conditions: [
          { type: 'simple', variableId: 'has_key', operator: 'is_true', value: true },
          { type: 'simple', variableId: 'has_map', operator: 'is_true', value: true },
        ],
      };

      expect(conditionEngine.evaluate(condition, variables, state).result).toBe(true);
    });
  });

  describe('NOT condition evaluation', () => {
    it('negates inner condition result', () => {
      const variables = new Map<string, Variable>([
        ['is_evil', makeVariable('is_evil', 'boolean', false)],
      ]);
      const state = new Map<string, VariableValue>([['is_evil', false]]);
      const condition: NotCondition = {
        type: 'not',
        condition: { type: 'simple', variableId: 'is_evil', operator: 'is_true', value: true },
      };

      // is_evil is false, is_true returns false, NOT(false) = true
      expect(conditionEngine.evaluate(condition, variables, state).result).toBe(true);
    });
  });
});
