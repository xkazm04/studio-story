'use strict';

/**
 * ConditionEngine - Logic evaluation system for branching narratives
 *
 * Supports complex conditions with:
 * - Comparison operators (==, !=, <, >, <=, >=)
 * - Logical operators (AND, OR, NOT)
 * - Variable references
 * - Nested expressions
 */

// Types for condition system
export type OperatorType =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_equal'
  | 'less_equal'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_true'
  | 'is_false';

export type LogicalOperator = 'and' | 'or' | 'not';

export type VariableType = 'string' | 'number' | 'boolean' | 'array';

export type VariableValue = string | number | boolean | string[] | number[];

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  defaultValue: VariableValue;
  scope: 'global' | 'scene' | 'character';
  description?: string;
  characterId?: string; // For character-scoped variables
  sceneId?: string; // For scene-scoped variables
}

export interface SimpleCondition {
  type: 'simple';
  variableId: string;
  operator: OperatorType;
  value: VariableValue;
}

export interface CompoundCondition {
  type: 'compound';
  operator: LogicalOperator;
  conditions: Condition[];
}

export interface NotCondition {
  type: 'not';
  condition: Condition;
}

export type Condition = SimpleCondition | CompoundCondition | NotCondition;

export interface ConditionGroup {
  id: string;
  name: string;
  description?: string;
  condition: Condition;
  priority: number; // Higher priority evaluated first
}

export interface BranchCondition {
  id: string;
  choiceId: string; // Associated scene choice
  condition: Condition;
  fallbackChoiceId?: string; // Choice to use if condition fails
  enabled: boolean;
}

export interface EvaluationResult {
  success: boolean;
  result: boolean;
  error?: string;
  evaluatedVariables: Map<string, VariableValue>;
  trace: EvaluationTrace[];
}

export interface EvaluationTrace {
  condition: Condition;
  variableValues: Record<string, VariableValue>;
  result: boolean;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ConditionError[];
  warnings: ConditionWarning[];
}

export interface ConditionError {
  type: 'missing_variable' | 'type_mismatch' | 'invalid_operator' | 'circular_reference' | 'syntax_error';
  message: string;
  conditionId?: string;
  variableId?: string;
}

export interface ConditionWarning {
  type: 'unused_variable' | 'unreachable_branch' | 'redundant_condition';
  message: string;
  conditionId?: string;
}

/**
 * ConditionEngine - Evaluates conditions against variable state
 */
class ConditionEngineClass {
  private static instance: ConditionEngineClass;
  private evaluationCache: Map<string, { result: boolean; timestamp: number }> = new Map();
  private cacheTimeout = 1000; // 1 second cache

  private constructor() {}

  static getInstance(): ConditionEngineClass {
    if (!ConditionEngineClass.instance) {
      ConditionEngineClass.instance = new ConditionEngineClass();
    }
    return ConditionEngineClass.instance;
  }

  /**
   * Evaluate a condition against current variable state
   */
  evaluate(
    condition: Condition,
    variables: Map<string, Variable>,
    state: Map<string, VariableValue>
  ): EvaluationResult {
    const trace: EvaluationTrace[] = [];
    const evaluatedVariables = new Map<string, VariableValue>();

    try {
      const result = this.evaluateCondition(condition, variables, state, trace, evaluatedVariables);

      return {
        success: true,
        result,
        evaluatedVariables,
        trace,
      };
    } catch (error) {
      return {
        success: false,
        result: false,
        error: error instanceof Error ? error.message : 'Unknown evaluation error',
        evaluatedVariables,
        trace,
      };
    }
  }

  /**
   * Recursively evaluate a condition
   */
  private evaluateCondition(
    condition: Condition,
    variables: Map<string, Variable>,
    state: Map<string, VariableValue>,
    trace: EvaluationTrace[],
    evaluatedVariables: Map<string, VariableValue>
  ): boolean {
    let result: boolean;

    switch (condition.type) {
      case 'simple':
        result = this.evaluateSimpleCondition(condition, variables, state, evaluatedVariables);
        break;

      case 'compound':
        result = this.evaluateCompoundCondition(condition, variables, state, trace, evaluatedVariables);
        break;

      case 'not':
        result = !this.evaluateCondition(condition.condition, variables, state, trace, evaluatedVariables);
        break;

      default:
        throw new Error(`Unknown condition type: ${(condition as Condition).type}`);
    }

    // Record trace
    trace.push({
      condition,
      variableValues: Object.fromEntries(evaluatedVariables),
      result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Evaluate a simple condition (variable comparison)
   */
  private evaluateSimpleCondition(
    condition: SimpleCondition,
    variables: Map<string, Variable>,
    state: Map<string, VariableValue>,
    evaluatedVariables: Map<string, VariableValue>
  ): boolean {
    const variable = variables.get(condition.variableId);
    if (!variable) {
      throw new Error(`Variable not found: ${condition.variableId}`);
    }

    // Get current value or default
    const currentValue = state.get(condition.variableId) ?? variable.defaultValue;
    evaluatedVariables.set(condition.variableId, currentValue);

    return this.compareValues(currentValue, condition.operator, condition.value, variable.type);
  }

  /**
   * Evaluate a compound condition (AND/OR)
   */
  private evaluateCompoundCondition(
    condition: CompoundCondition,
    variables: Map<string, Variable>,
    state: Map<string, VariableValue>,
    trace: EvaluationTrace[],
    evaluatedVariables: Map<string, VariableValue>
  ): boolean {
    if (condition.conditions.length === 0) {
      return true;
    }

    switch (condition.operator) {
      case 'and':
        return condition.conditions.every(c =>
          this.evaluateCondition(c, variables, state, trace, evaluatedVariables)
        );

      case 'or':
        return condition.conditions.some(c =>
          this.evaluateCondition(c, variables, state, trace, evaluatedVariables)
        );

      case 'not':
        // For compound NOT, negate the first condition
        return !this.evaluateCondition(
          condition.conditions[0],
          variables,
          state,
          trace,
          evaluatedVariables
        );

      default:
        throw new Error(`Unknown logical operator: ${condition.operator}`);
    }
  }

  /**
   * Compare two values using the specified operator
   */
  private compareValues(
    currentValue: VariableValue,
    operator: OperatorType,
    targetValue: VariableValue,
    variableType: VariableType
  ): boolean {
    switch (operator) {
      case 'equals':
        return this.isEqual(currentValue, targetValue);

      case 'not_equals':
        return !this.isEqual(currentValue, targetValue);

      case 'greater_than':
        return this.toNumber(currentValue) > this.toNumber(targetValue);

      case 'less_than':
        return this.toNumber(currentValue) < this.toNumber(targetValue);

      case 'greater_equal':
        return this.toNumber(currentValue) >= this.toNumber(targetValue);

      case 'less_equal':
        return this.toNumber(currentValue) <= this.toNumber(targetValue);

      case 'contains':
        return this.contains(currentValue, targetValue);

      case 'not_contains':
        return !this.contains(currentValue, targetValue);

      case 'starts_with':
        return String(currentValue).startsWith(String(targetValue));

      case 'ends_with':
        return String(currentValue).endsWith(String(targetValue));

      case 'is_empty':
        return this.isEmpty(currentValue);

      case 'is_not_empty':
        return !this.isEmpty(currentValue);

      case 'is_true':
        return Boolean(currentValue) === true;

      case 'is_false':
        return Boolean(currentValue) === false;

      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private isEqual(a: VariableValue, b: VariableValue): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((val, idx) => val === b[idx]);
    }
    return a === b;
  }

  private toNumber(value: VariableValue): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (Array.isArray(value)) return value.length;
    return 0;
  }

  private contains(container: VariableValue, item: VariableValue): boolean {
    if (Array.isArray(container)) {
      // Handle both string[] and number[] arrays
      return (container as (string | number)[]).some(v => v === item);
    }
    return String(container).includes(String(item));
  }

  private isEmpty(value: VariableValue): boolean {
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.length === 0;
    if (typeof value === 'boolean') return !value;
    return value === 0;
  }

  /**
   * Validate a condition for correctness
   */
  validate(
    condition: Condition,
    variables: Map<string, Variable>
  ): ValidationResult {
    const errors: ConditionError[] = [];
    const warnings: ConditionWarning[] = [];

    this.validateConditionRecursive(condition, variables, errors, warnings, new Set());

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateConditionRecursive(
    condition: Condition,
    variables: Map<string, Variable>,
    errors: ConditionError[],
    warnings: ConditionWarning[],
    visitedVariables: Set<string>
  ): void {
    switch (condition.type) {
      case 'simple':
        this.validateSimpleCondition(condition, variables, errors, warnings, visitedVariables);
        break;

      case 'compound':
        if (condition.conditions.length === 0) {
          warnings.push({
            type: 'redundant_condition',
            message: 'Empty compound condition always evaluates to true',
          });
        }
        condition.conditions.forEach(c =>
          this.validateConditionRecursive(c, variables, errors, warnings, visitedVariables)
        );
        break;

      case 'not':
        this.validateConditionRecursive(condition.condition, variables, errors, warnings, visitedVariables);
        break;
    }
  }

  private validateSimpleCondition(
    condition: SimpleCondition,
    variables: Map<string, Variable>,
    errors: ConditionError[],
    warnings: ConditionWarning[],
    visitedVariables: Set<string>
  ): void {
    const variable = variables.get(condition.variableId);

    if (!variable) {
      errors.push({
        type: 'missing_variable',
        message: `Variable "${condition.variableId}" does not exist`,
        variableId: condition.variableId,
      });
      return;
    }

    visitedVariables.add(condition.variableId);

    // Type checking
    const valueType = this.getValueType(condition.value);
    if (!this.isTypeCompatible(variable.type, valueType, condition.operator)) {
      errors.push({
        type: 'type_mismatch',
        message: `Type mismatch: variable "${variable.name}" is ${variable.type}, but comparing with ${valueType}`,
        variableId: condition.variableId,
      });
    }

    // Operator validation
    if (!this.isOperatorValidForType(condition.operator, variable.type)) {
      errors.push({
        type: 'invalid_operator',
        message: `Operator "${condition.operator}" is not valid for type "${variable.type}"`,
        variableId: condition.variableId,
      });
    }
  }

  private getValueType(value: VariableValue): VariableType {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    return 'string';
  }

  private isTypeCompatible(variableType: VariableType, valueType: VariableType, operator: OperatorType): boolean {
    // Boolean operators work with any type
    if (['is_true', 'is_false', 'is_empty', 'is_not_empty'].includes(operator)) {
      return true;
    }

    // Numeric operators require number compatibility
    if (['greater_than', 'less_than', 'greater_equal', 'less_equal'].includes(operator)) {
      return variableType === 'number' || valueType === 'number';
    }

    // String operators require string compatibility
    if (['starts_with', 'ends_with'].includes(operator)) {
      return variableType === 'string';
    }

    // Contains works with strings and arrays
    if (['contains', 'not_contains'].includes(operator)) {
      return variableType === 'string' || variableType === 'array';
    }

    // Equality works with matching types or coercible types
    return variableType === valueType ||
           (variableType === 'number' && valueType === 'string') ||
           (variableType === 'string' && valueType === 'number');
  }

  private isOperatorValidForType(operator: OperatorType, type: VariableType): boolean {
    const numericOnlyOperators: OperatorType[] = ['greater_than', 'less_than', 'greater_equal', 'less_equal'];
    const stringOnlyOperators: OperatorType[] = ['starts_with', 'ends_with'];
    const containerOperators: OperatorType[] = ['contains', 'not_contains'];

    if (numericOnlyOperators.includes(operator)) {
      return type === 'number';
    }

    if (stringOnlyOperators.includes(operator)) {
      return type === 'string';
    }

    if (containerOperators.includes(operator)) {
      return type === 'string' || type === 'array';
    }

    return true;
  }

  /**
   * Serialize a condition to a human-readable string
   */
  conditionToString(condition: Condition, variables: Map<string, Variable>): string {
    switch (condition.type) {
      case 'simple': {
        const variable = variables.get(condition.variableId);
        const varName = variable?.name ?? condition.variableId;
        const opString = this.operatorToString(condition.operator);

        if (['is_true', 'is_false', 'is_empty', 'is_not_empty'].includes(condition.operator)) {
          return `${varName} ${opString}`;
        }

        return `${varName} ${opString} ${JSON.stringify(condition.value)}`;
      }

      case 'compound': {
        const parts = condition.conditions.map(c => this.conditionToString(c, variables));
        const joiner = condition.operator === 'and' ? ' AND ' : ' OR ';
        return `(${parts.join(joiner)})`;
      }

      case 'not':
        return `NOT (${this.conditionToString(condition.condition, variables)})`;
    }
  }

  private operatorToString(operator: OperatorType): string {
    const operatorMap: Record<OperatorType, string> = {
      equals: '==',
      not_equals: '!=',
      greater_than: '>',
      less_than: '<',
      greater_equal: '>=',
      less_equal: '<=',
      contains: 'contains',
      not_contains: 'does not contain',
      starts_with: 'starts with',
      ends_with: 'ends with',
      is_empty: 'is empty',
      is_not_empty: 'is not empty',
      is_true: 'is true',
      is_false: 'is false',
    };
    return operatorMap[operator];
  }

  /**
   * Create a simple condition
   */
  createSimpleCondition(
    variableId: string,
    operator: OperatorType,
    value: VariableValue
  ): SimpleCondition {
    return {
      type: 'simple',
      variableId,
      operator,
      value,
    };
  }

  /**
   * Create a compound condition
   */
  createCompoundCondition(
    operator: LogicalOperator,
    conditions: Condition[]
  ): CompoundCondition {
    return {
      type: 'compound',
      operator,
      conditions,
    };
  }

  /**
   * Create a NOT condition
   */
  createNotCondition(condition: Condition): NotCondition {
    return {
      type: 'not',
      condition,
    };
  }

  /**
   * Clear the evaluation cache
   */
  clearCache(): void {
    this.evaluationCache.clear();
  }
}

export const conditionEngine = ConditionEngineClass.getInstance();
export default conditionEngine;
