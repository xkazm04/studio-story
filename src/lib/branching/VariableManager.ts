'use strict';

import type {
  Variable,
  VariableValue,
  VariableType,
  Condition,
  BranchCondition,
} from './ConditionEngine';
import { conditionEngine } from './ConditionEngine';

/**
 * VariableManager - State persistence system for branching narratives
 *
 * Manages:
 * - Variable definitions with scoping (global/scene/character)
 * - State tracking across scenes
 * - History and rollback support
 * - State snapshots for debugging
 */

export interface VariableChange {
  variableId: string;
  oldValue: VariableValue;
  newValue: VariableValue;
  sceneId?: string;
  timestamp: number;
  source: 'user' | 'condition' | 'script' | 'system';
}

export interface StateSnapshot {
  id: string;
  label: string;
  sceneId: string;
  timestamp: number;
  state: Map<string, VariableValue>;
}

export interface VariableDefinition extends Variable {
  tags?: string[];
  constraints?: VariableConstraint;
  computed?: boolean;
  computeExpression?: string;
}

export interface VariableConstraint {
  min?: number;
  max?: number;
  pattern?: string; // Regex for strings
  allowedValues?: VariableValue[];
}

export interface SceneAction {
  id: string;
  sceneId: string;
  type: 'set' | 'increment' | 'decrement' | 'toggle' | 'append' | 'remove';
  variableId: string;
  value?: VariableValue;
  condition?: Condition;
}

export interface PathState {
  sceneId: string;
  visitCount: number;
  lastVisit: number;
  choicesMade: string[];
}

export interface PlaythroughState {
  id: string;
  name: string;
  startedAt: number;
  currentSceneId: string;
  variables: Map<string, VariableValue>;
  pathHistory: PathState[];
  totalChoices: number;
}

class VariableManagerClass {
  private static instance: VariableManagerClass;

  // Variable definitions
  private variables: Map<string, VariableDefinition> = new Map();

  // Current state (variable ID -> current value)
  private state: Map<string, VariableValue> = new Map();

  // Change history for undo/debugging
  private history: VariableChange[] = [];
  private maxHistoryLength = 1000;

  // State snapshots for debugging
  private snapshots: Map<string, StateSnapshot> = new Map();

  // Branch conditions
  private branchConditions: Map<string, BranchCondition> = new Map();

  // Scene actions (triggered when entering a scene)
  private sceneActions: Map<string, SceneAction[]> = new Map();

  // Playthrough tracking
  private currentPlaythrough: PlaythroughState | null = null;

  // Event listeners
  private listeners: Map<string, Set<(change: VariableChange) => void>> = new Map();

  private constructor() {}

  static getInstance(): VariableManagerClass {
    if (!VariableManagerClass.instance) {
      VariableManagerClass.instance = new VariableManagerClass();
    }
    return VariableManagerClass.instance;
  }

  // ==================== Variable Definitions ====================

  /**
   * Register a new variable definition
   */
  defineVariable(definition: VariableDefinition): void {
    this.variables.set(definition.id, definition);

    // Initialize state with default value if not already set
    if (!this.state.has(definition.id)) {
      this.state.set(definition.id, definition.defaultValue);
    }
  }

  /**
   * Get a variable definition
   */
  getVariable(id: string): VariableDefinition | undefined {
    return this.variables.get(id);
  }

  /**
   * Get all variable definitions
   */
  getAllVariables(): VariableDefinition[] {
    return Array.from(this.variables.values());
  }

  /**
   * Get variables by scope
   */
  getVariablesByScope(scope: 'global' | 'scene' | 'character'): VariableDefinition[] {
    return this.getAllVariables().filter(v => v.scope === scope);
  }

  /**
   * Get variables for a specific character
   */
  getCharacterVariables(characterId: string): VariableDefinition[] {
    return this.getAllVariables().filter(
      v => v.scope === 'character' && v.characterId === characterId
    );
  }

  /**
   * Remove a variable definition
   */
  removeVariable(id: string): void {
    this.variables.delete(id);
    this.state.delete(id);
  }

  // ==================== State Management ====================

  /**
   * Get the current value of a variable
   */
  getValue(variableId: string): VariableValue | undefined {
    const variable = this.variables.get(variableId);
    if (!variable) return undefined;

    // Check for computed variable
    if (variable.computed && variable.computeExpression) {
      return this.evaluateComputed(variable);
    }

    return this.state.get(variableId) ?? variable.defaultValue;
  }

  /**
   * Set a variable's value
   */
  setValue(
    variableId: string,
    value: VariableValue,
    source: 'user' | 'condition' | 'script' | 'system' = 'system',
    sceneId?: string
  ): boolean {
    const variable = this.variables.get(variableId);
    if (!variable) {
      console.warn(`Variable not found: ${variableId}`);
      return false;
    }

    // Validate against constraints
    if (variable.constraints && !this.validateConstraint(value, variable.constraints, variable.type)) {
      console.warn(`Value ${value} violates constraints for variable ${variableId}`);
      return false;
    }

    const oldValue = this.state.get(variableId) ?? variable.defaultValue;

    // Don't record if value hasn't changed
    if (this.valuesEqual(oldValue, value)) {
      return true;
    }

    // Update state
    this.state.set(variableId, value);

    // Record change
    const change: VariableChange = {
      variableId,
      oldValue,
      newValue: value,
      sceneId,
      timestamp: Date.now(),
      source,
    };

    this.history.push(change);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    // Notify listeners
    this.notifyListeners(variableId, change);

    return true;
  }

  /**
   * Increment a numeric variable
   */
  increment(variableId: string, amount: number = 1, source?: 'user' | 'condition' | 'script' | 'system'): boolean {
    const currentValue = this.getValue(variableId);
    if (typeof currentValue !== 'number') {
      console.warn(`Cannot increment non-numeric variable: ${variableId}`);
      return false;
    }
    return this.setValue(variableId, currentValue + amount, source);
  }

  /**
   * Decrement a numeric variable
   */
  decrement(variableId: string, amount: number = 1, source?: 'user' | 'condition' | 'script' | 'system'): boolean {
    return this.increment(variableId, -amount, source);
  }

  /**
   * Toggle a boolean variable
   */
  toggle(variableId: string, source?: 'user' | 'condition' | 'script' | 'system'): boolean {
    const currentValue = this.getValue(variableId);
    if (typeof currentValue !== 'boolean') {
      console.warn(`Cannot toggle non-boolean variable: ${variableId}`);
      return false;
    }
    return this.setValue(variableId, !currentValue, source);
  }

  /**
   * Append to an array variable
   */
  append(variableId: string, item: string | number, source?: 'user' | 'condition' | 'script' | 'system'): boolean {
    const currentValue = this.getValue(variableId);
    if (!Array.isArray(currentValue)) {
      console.warn(`Cannot append to non-array variable: ${variableId}`);
      return false;
    }
    // Cast to specific array types for proper VariableValue assignment
    const newArray = [...currentValue, item];
    return this.setValue(variableId, newArray as string[] | number[], source);
  }

  /**
   * Remove from an array variable
   */
  removeFromArray(variableId: string, item: string | number, source?: 'user' | 'condition' | 'script' | 'system'): boolean {
    const currentValue = this.getValue(variableId);
    if (!Array.isArray(currentValue)) {
      console.warn(`Cannot remove from non-array variable: ${variableId}`);
      return false;
    }
    // Cast to specific array types for proper VariableValue assignment
    const filteredArray = (currentValue as (string | number)[]).filter(v => v !== item);
    return this.setValue(
      variableId,
      filteredArray as string[] | number[],
      source
    );
  }

  /**
   * Reset a variable to its default value
   */
  resetVariable(variableId: string): void {
    const variable = this.variables.get(variableId);
    if (variable) {
      this.setValue(variableId, variable.defaultValue, 'system');
    }
  }

  /**
   * Reset all variables to defaults
   */
  resetAllVariables(): void {
    this.variables.forEach((variable, id) => {
      this.state.set(id, variable.defaultValue);
    });
    this.history = [];
  }

  // ==================== Condition Evaluation ====================

  /**
   * Evaluate a condition against current state
   */
  evaluateCondition(condition: Condition): boolean {
    const result = conditionEngine.evaluate(condition, this.variables, this.state);
    return result.success && result.result;
  }

  /**
   * Check if a branch choice is available
   */
  isChoiceAvailable(choiceId: string): boolean {
    const branchCondition = this.branchConditions.get(choiceId);
    if (!branchCondition || !branchCondition.enabled) {
      return true; // No condition = always available
    }
    return this.evaluateCondition(branchCondition.condition);
  }

  /**
   * Get available choices for a scene
   */
  getAvailableChoices(choiceIds: string[]): string[] {
    return choiceIds.filter(id => this.isChoiceAvailable(id));
  }

  // ==================== Branch Conditions ====================

  /**
   * Register a branch condition
   */
  registerBranchCondition(branchCondition: BranchCondition): void {
    this.branchConditions.set(branchCondition.choiceId, branchCondition);
  }

  /**
   * Get a branch condition
   */
  getBranchCondition(choiceId: string): BranchCondition | undefined {
    return this.branchConditions.get(choiceId);
  }

  /**
   * Get all branch conditions
   */
  getAllBranchConditions(): BranchCondition[] {
    return Array.from(this.branchConditions.values());
  }

  /**
   * Remove a branch condition
   */
  removeBranchCondition(choiceId: string): void {
    this.branchConditions.delete(choiceId);
  }

  // ==================== Scene Actions ====================

  /**
   * Register scene actions
   */
  registerSceneActions(sceneId: string, actions: SceneAction[]): void {
    this.sceneActions.set(sceneId, actions);
  }

  /**
   * Execute actions when entering a scene
   */
  executeSceneActions(sceneId: string): void {
    const actions = this.sceneActions.get(sceneId) ?? [];

    for (const action of actions) {
      // Check action condition
      if (action.condition && !this.evaluateCondition(action.condition)) {
        continue;
      }

      this.executeAction(action);
    }
  }

  private executeAction(action: SceneAction): void {
    switch (action.type) {
      case 'set':
        if (action.value !== undefined) {
          this.setValue(action.variableId, action.value, 'script', action.sceneId);
        }
        break;
      case 'increment':
        this.increment(action.variableId, action.value as number ?? 1, 'script');
        break;
      case 'decrement':
        this.decrement(action.variableId, action.value as number ?? 1, 'script');
        break;
      case 'toggle':
        this.toggle(action.variableId, 'script');
        break;
      case 'append':
        if (action.value !== undefined) {
          this.append(action.variableId, action.value as string | number, 'script');
        }
        break;
      case 'remove':
        if (action.value !== undefined) {
          this.removeFromArray(action.variableId, action.value as string | number, 'script');
        }
        break;
    }
  }

  // ==================== Snapshots ====================

  /**
   * Create a state snapshot
   */
  createSnapshot(sceneId: string, label?: string): StateSnapshot {
    const snapshot: StateSnapshot = {
      id: `snapshot-${Date.now()}`,
      label: label ?? `Snapshot at ${sceneId}`,
      sceneId,
      timestamp: Date.now(),
      state: new Map(this.state),
    };

    this.snapshots.set(snapshot.id, snapshot);
    return snapshot;
  }

  /**
   * Restore from a snapshot
   */
  restoreSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return false;

    this.state = new Map(snapshot.state);
    return true;
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): StateSnapshot[] {
    return Array.from(this.snapshots.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): void {
    this.snapshots.delete(snapshotId);
  }

  // ==================== History ====================

  /**
   * Get change history
   */
  getHistory(limit?: number): VariableChange[] {
    const history = [...this.history].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get history for a specific variable
   */
  getVariableHistory(variableId: string, limit?: number): VariableChange[] {
    const history = this.history.filter(c => c.variableId === variableId).reverse();
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Undo the last change
   */
  undo(): VariableChange | null {
    const lastChange = this.history.pop();
    if (!lastChange) return null;

    // Restore old value without recording
    this.state.set(lastChange.variableId, lastChange.oldValue);
    this.notifyListeners(lastChange.variableId, {
      ...lastChange,
      oldValue: lastChange.newValue,
      newValue: lastChange.oldValue,
      source: 'system',
    });

    return lastChange;
  }

  // ==================== Playthrough Tracking ====================

  /**
   * Start a new playthrough
   */
  startPlaythrough(name: string, startSceneId: string): PlaythroughState {
    this.resetAllVariables();

    this.currentPlaythrough = {
      id: `playthrough-${Date.now()}`,
      name,
      startedAt: Date.now(),
      currentSceneId: startSceneId,
      variables: new Map(this.state),
      pathHistory: [],
      totalChoices: 0,
    };

    return this.currentPlaythrough;
  }

  /**
   * Record entering a scene
   */
  enterScene(sceneId: string, choiceId?: string): void {
    if (!this.currentPlaythrough) return;

    this.currentPlaythrough.currentSceneId = sceneId;

    // Find or create path state
    let pathState = this.currentPlaythrough.pathHistory.find(p => p.sceneId === sceneId);
    if (!pathState) {
      pathState = {
        sceneId,
        visitCount: 0,
        lastVisit: Date.now(),
        choicesMade: [],
      };
      this.currentPlaythrough.pathHistory.push(pathState);
    }

    pathState.visitCount++;
    pathState.lastVisit = Date.now();
    if (choiceId) {
      pathState.choicesMade.push(choiceId);
      this.currentPlaythrough.totalChoices++;
    }

    // Execute scene actions
    this.executeSceneActions(sceneId);

    // Update playthrough variables snapshot
    this.currentPlaythrough.variables = new Map(this.state);
  }

  /**
   * Get current playthrough
   */
  getCurrentPlaythrough(): PlaythroughState | null {
    return this.currentPlaythrough;
  }

  // ==================== Event Listeners ====================

  /**
   * Subscribe to changes for a variable
   */
  subscribe(variableId: string, callback: (change: VariableChange) => void): () => void {
    if (!this.listeners.has(variableId)) {
      this.listeners.set(variableId, new Set());
    }
    this.listeners.get(variableId)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(variableId)?.delete(callback);
    };
  }

  /**
   * Subscribe to all changes
   */
  subscribeAll(callback: (change: VariableChange) => void): () => void {
    return this.subscribe('*', callback);
  }

  private notifyListeners(variableId: string, change: VariableChange): void {
    // Notify specific listeners
    this.listeners.get(variableId)?.forEach(cb => cb(change));
    // Notify global listeners
    this.listeners.get('*')?.forEach(cb => cb(change));
  }

  // ==================== Utilities ====================

  private validateConstraint(
    value: VariableValue,
    constraints: VariableConstraint,
    type: VariableType
  ): boolean {
    if (type === 'number' && typeof value === 'number') {
      if (constraints.min !== undefined && value < constraints.min) return false;
      if (constraints.max !== undefined && value > constraints.max) return false;
    }

    if (type === 'string' && typeof value === 'string') {
      if (constraints.pattern) {
        const regex = new RegExp(constraints.pattern);
        if (!regex.test(value)) return false;
      }
    }

    if (constraints.allowedValues && !constraints.allowedValues.includes(value)) {
      return false;
    }

    return true;
  }

  private evaluateComputed(variable: VariableDefinition): VariableValue {
    // Simple computed variable support
    // In a full implementation, this would parse and evaluate expressions
    if (!variable.computeExpression) return variable.defaultValue;

    // For now, just return the default value
    // Full implementation would parse expressions like "health + armor"
    return variable.defaultValue;
  }

  private valuesEqual(a: VariableValue, b: VariableValue): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((val, idx) => val === b[idx]);
    }
    return a === b;
  }

  /**
   * Export current state as JSON
   */
  exportState(): string {
    return JSON.stringify({
      variables: Array.from(this.variables.entries()),
      state: Array.from(this.state.entries()),
      branchConditions: Array.from(this.branchConditions.entries()),
      sceneActions: Array.from(this.sceneActions.entries()),
    });
  }

  /**
   * Import state from JSON
   */
  importState(json: string): void {
    try {
      const data = JSON.parse(json);
      this.variables = new Map(data.variables);
      this.state = new Map(data.state);
      this.branchConditions = new Map(data.branchConditions);
      this.sceneActions = new Map(data.sceneActions);
    } catch (error) {
      console.error('Failed to import state:', error);
    }
  }

  /**
   * Get state summary for debugging
   */
  getStateSummary(): Record<string, { value: VariableValue; type: VariableType; scope: string }> {
    const summary: Record<string, { value: VariableValue; type: VariableType; scope: string }> = {};

    this.variables.forEach((variable, id) => {
      summary[variable.name] = {
        value: this.getValue(id) ?? variable.defaultValue,
        type: variable.type,
        scope: variable.scope,
      };
    });

    return summary;
  }
}

export const variableManager = VariableManagerClass.getInstance();
export default variableManager;
