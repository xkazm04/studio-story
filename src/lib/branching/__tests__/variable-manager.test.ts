/**
 * VariableManager Tests
 * Tests for variable state lifecycle and playthrough tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';

// We need a fresh instance for each test, so we import the class indirectly
// The singleton pattern means we need to test against the exported instance
// but reset state between tests.

describe('VariableManager', () => {
  // Import fresh each time since it's a singleton
  let variableManager: typeof import('../VariableManager').variableManager;

  beforeEach(async () => {
    const mod = await import('../VariableManager');
    variableManager = mod.variableManager;
    // Reset all state
    variableManager.getAllVariables().forEach(v => {
      variableManager.removeVariable(v.id);
    });
  });

  describe('initial state', () => {
    it('getAllVariables returns empty array initially', () => {
      const vars = variableManager.getAllVariables();
      expect(vars).toEqual([]);
    });

    it('getValue returns undefined for non-existent variable', () => {
      expect(variableManager.getValue('nonexistent')).toBeUndefined();
    });
  });

  describe('variable definition and retrieval', () => {
    it('defineVariable registers and initializes with default value', () => {
      variableManager.defineVariable({
        id: 'health',
        name: 'Health',
        type: 'number',
        defaultValue: 100,
        scope: 'global',
      });

      expect(variableManager.getValue('health')).toBe(100);
      expect(variableManager.getAllVariables()).toHaveLength(1);
    });

    it('setValue updates variable and records change', () => {
      variableManager.defineVariable({
        id: 'name',
        name: 'Name',
        type: 'string',
        defaultValue: '',
        scope: 'global',
      });

      variableManager.setValue('name', 'Elena', 'user');
      expect(variableManager.getValue('name')).toBe('Elena');

      const history = variableManager.getHistory(1);
      expect(history).toHaveLength(1);
      expect(history[0].newValue).toBe('Elena');
    });
  });

  describe('playthrough tracking', () => {
    it('tracks variable snapshots across scene transitions', () => {
      variableManager.defineVariable({
        id: 'coins',
        name: 'Coins',
        type: 'number',
        defaultValue: 0,
        scope: 'global',
      });

      const playthrough = variableManager.startPlaythrough('Test Run', 'scene-1');
      expect(playthrough.currentSceneId).toBe('scene-1');

      variableManager.setValue('coins', 10, 'script');
      variableManager.enterScene('scene-2', 'choice-1');

      const current = variableManager.getCurrentPlaythrough();
      expect(current).not.toBeNull();
      expect(current!.currentSceneId).toBe('scene-2');
      expect(current!.totalChoices).toBe(1);
    });
  });

  describe('branch condition evaluation', () => {
    it('registerBranchCondition and isChoiceAvailable work together', () => {
      variableManager.defineVariable({
        id: 'has_key',
        name: 'Has Key',
        type: 'boolean',
        defaultValue: false,
        scope: 'global',
      });

      variableManager.registerBranchCondition({
        id: 'bc-1',
        choiceId: 'choice-locked-door',
        condition: {
          type: 'simple',
          variableId: 'has_key',
          operator: 'is_true',
          value: true,
        },
        enabled: true,
      });

      // Key not obtained yet
      expect(variableManager.isChoiceAvailable('choice-locked-door')).toBe(false);

      // Obtain key
      variableManager.setValue('has_key', true, 'script');
      expect(variableManager.isChoiceAvailable('choice-locked-door')).toBe(true);
    });

    it('choice without condition is always available', () => {
      expect(variableManager.isChoiceAvailable('choice-no-condition')).toBe(true);
    });
  });

  describe('snapshots', () => {
    it('createSnapshot and restoreSnapshot round-trip state', () => {
      variableManager.defineVariable({
        id: 'progress',
        name: 'Progress',
        type: 'number',
        defaultValue: 0,
        scope: 'global',
      });

      variableManager.setValue('progress', 50, 'system');
      const snapshot = variableManager.createSnapshot('scene-5', 'Mid-game');

      variableManager.setValue('progress', 100, 'system');
      expect(variableManager.getValue('progress')).toBe(100);

      variableManager.restoreSnapshot(snapshot.id);
      expect(variableManager.getValue('progress')).toBe(50);
    });
  });
});
