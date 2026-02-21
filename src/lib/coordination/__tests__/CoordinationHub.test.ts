/**
 * Tests for Cross-Feature State Coordination Hub
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus, resetEventBus } from '../EventBus';
import { DependencyGraph, resetDependencyGraph } from '../DependencyGraph';
import { CoordinationHub, getCoordinationHub, resetCoordinationHub } from '../CoordinationHub';
import { CoordinationEvent, EntityReference, EventPayload } from '../types';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    resetEventBus();
    eventBus = new EventBus({ debugMode: false });
  });

  afterEach(() => {
    eventBus.destroy();
  });

  it('should emit and receive events', async () => {
    const handler = vi.fn();

    eventBus.subscribe('CHARACTER_UPDATED', handler, { label: 'test-subscriber' });

    eventBus.emit('CHARACTER_UPDATED', {
      entityId: 'char-123',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    });

    await eventBus.flush();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].type).toBe('CHARACTER_UPDATED');
    expect(handler.mock.calls[0][0].payload.entityId).toBe('char-123');
  });

  it('should filter events by type', async () => {
    const characterHandler = vi.fn();
    const sceneHandler = vi.fn();

    eventBus.subscribe('CHARACTER_UPDATED', characterHandler);
    eventBus.subscribe('SCENE_UPDATED', sceneHandler);

    eventBus.emit('CHARACTER_UPDATED', {
      entityId: 'char-123',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    });

    await eventBus.flush();

    expect(characterHandler).toHaveBeenCalledTimes(1);
    expect(sceneHandler).not.toHaveBeenCalled();
  });

  it('should support unsubscribing', async () => {
    const handler = vi.fn();

    const subId = eventBus.subscribe('CHARACTER_UPDATED', handler);

    eventBus.emit('CHARACTER_UPDATED', {
      entityId: 'char-123',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    });

    await eventBus.flush();
    expect(handler).toHaveBeenCalledTimes(1);

    eventBus.unsubscribe(subId);

    eventBus.emit('CHARACTER_UPDATED', {
      entityId: 'char-456',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    });

    await eventBus.flush();
    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('should support multiple event types in subscription', async () => {
    const handler = vi.fn();

    eventBus.subscribe(['CHARACTER_CREATED', 'CHARACTER_UPDATED', 'CHARACTER_DELETED'], handler);

    eventBus.emit('CHARACTER_CREATED', {
      entityId: 'char-1',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    });

    eventBus.emit('CHARACTER_UPDATED', {
      entityId: 'char-2',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    });

    await eventBus.flush();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should maintain event log', async () => {
    eventBus.emit('CHARACTER_CREATED', {
      entityId: 'char-1',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    });

    eventBus.emit('SCENE_CREATED', {
      entityId: 'scene-1',
      entityType: 'scene',
      projectId: 'project-123',
      source: 'test',
    });

    await eventBus.flush();

    const log = eventBus.getEventLog();
    expect(log).toHaveLength(2);
    expect(log[0].type).toBe('CHARACTER_CREATED');
    expect(log[1].type).toBe('SCENE_CREATED');
  });
});

describe('DependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    resetDependencyGraph();
    graph = new DependencyGraph({ debugMode: false });
  });

  afterEach(() => {
    graph.clear();
  });

  it('should add and retrieve dependencies', () => {
    const character: EntityReference = { type: 'character', id: 'char-123', name: 'John' };
    const faction: EntityReference = { type: 'faction', id: 'faction-456', name: 'Heroes' };

    graph.addDependency(character, faction, 'belongs_to');

    const deps = graph.getDependencies(character);
    expect(deps).toHaveLength(1);
    expect(deps[0].targetEntity.id).toBe('faction-456');
    expect(deps[0].type).toBe('belongs_to');
  });

  it('should track reverse dependencies (dependents)', () => {
    const character: EntityReference = { type: 'character', id: 'char-123' };
    const faction: EntityReference = { type: 'faction', id: 'faction-456' };

    graph.addDependency(character, faction, 'belongs_to');

    const dependents = graph.getDependents(faction);
    expect(dependents).toHaveLength(1);
    expect(dependents[0].sourceEntity.id).toBe('char-123');
  });

  it('should analyze impact', () => {
    const project: EntityReference = { type: 'project', id: 'project-1' };
    const character: EntityReference = { type: 'character', id: 'char-1' };
    const scene: EntityReference = { type: 'scene', id: 'scene-1' };

    graph.addDependency(character, project, 'belongs_to');
    graph.addDependency(scene, character, 'references');

    const impact = graph.analyzeImpact(character, 'CHARACTER_DELETED');

    // Should find scene as affected (it references character)
    expect(impact.totalAffected).toBeGreaterThan(0);
  });

  it('should remove dependencies', () => {
    const character: EntityReference = { type: 'character', id: 'char-123' };
    const faction: EntityReference = { type: 'faction', id: 'faction-456' };

    const depId = graph.addDependency(character, faction, 'belongs_to');

    expect(graph.getDependencies(character)).toHaveLength(1);

    graph.removeDependency(depId);

    expect(graph.getDependencies(character)).toHaveLength(0);
  });

  it('should export for visualization', () => {
    const character: EntityReference = { type: 'character', id: 'char-1', name: 'John' };
    const faction: EntityReference = { type: 'faction', id: 'faction-1', name: 'Heroes' };

    graph.addDependency(character, faction, 'belongs_to');

    const viz = graph.exportForVisualization();

    expect(viz.nodes).toHaveLength(2);
    expect(viz.edges).toHaveLength(1);
    expect(viz.edges[0].type).toBe('belongs_to');
  });
});

describe('CoordinationHub', () => {
  let hub: CoordinationHub;

  beforeEach(() => {
    resetCoordinationHub();
    hub = new CoordinationHub({ debugMode: false });
  });

  afterEach(() => {
    hub.destroy();
  });

  it('should emit events and track in event log', async () => {
    hub.emit('CHARACTER_CREATED', {
      entityId: 'char-123',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    });

    await hub.flush();

    const log = hub.getEventLog();
    expect(log).toHaveLength(1);
    expect(log[0].type).toBe('CHARACTER_CREATED');
  });

  it('should preview impact before changes', () => {
    // Register a dependency
    hub.registerDependency(
      { type: 'scene', id: 'scene-1' },
      { type: 'character', id: 'char-1' },
      'references'
    );

    const impact = hub.previewImpact(
      { type: 'character', id: 'char-1' },
      'CHARACTER_DELETED'
    );

    expect(impact.sourceEntity.id).toBe('char-1');
    expect(impact.totalAffected).toBeGreaterThan(0);
  });

  it('should support undo context', async () => {
    const undoContext = hub.getUndoContext();
    expect(undoContext.canUndo).toBe(false);
    expect(undoContext.canRedo).toBe(false);

    hub.emit('CHARACTER_CREATED', {
      entityId: 'char-123',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    }, { undoable: true });

    await hub.flush();

    const newUndoContext = hub.getUndoContext();
    expect(newUndoContext.canUndo).toBe(true);
    expect(newUndoContext.undoStack).toHaveLength(1);
  });

  it('should stage and execute changes', async () => {
    const handler = vi.fn();
    hub.subscribe('CHARACTER_UPDATED', handler);

    const changeId = hub.stageChange(
      { type: 'character', id: 'char-123' },
      'CHARACTER_UPDATED',
      {
        entityId: 'char-123',
        entityType: 'character',
        projectId: 'project-123',
        source: 'test',
      }
    );

    // Should not have emitted yet
    await hub.flush();
    expect(handler).not.toHaveBeenCalled();

    // Execute the staged change
    hub.executeChange(changeId);
    await hub.flush();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should track activity log', () => {
    hub.emit('CHARACTER_CREATED', {
      entityId: 'char-123',
      entityType: 'character',
      projectId: 'project-123',
      source: 'test',
    });

    const activity = hub.getActivityLog();
    expect(activity.length).toBeGreaterThan(0);
    expect(activity.some(a => a.type === 'event_emitted')).toBe(true);
  });

  it('should manage dependencies through hub', () => {
    hub.registerDependency(
      { type: 'character', id: 'char-1' },
      { type: 'faction', id: 'faction-1' },
      'belongs_to'
    );

    const deps = hub.getDependencies({ type: 'character', id: 'char-1' });
    expect(deps).toHaveLength(1);
    expect(deps[0].targetEntity.type).toBe('faction');
  });
});

describe('Singleton behavior', () => {
  beforeEach(() => {
    resetCoordinationHub();
  });

  it('should return same hub instance', () => {
    const hub1 = getCoordinationHub();
    const hub2 = getCoordinationHub();
    expect(hub1).toBe(hub2);
  });

  it('should create new instance after reset', () => {
    const hub1 = getCoordinationHub();
    const id1 = hub1.getEventLog();

    hub1.emit('CHARACTER_CREATED', {
      entityId: 'char-1',
      entityType: 'character',
      projectId: 'project-1',
      source: 'test',
    });

    resetCoordinationHub();

    const hub2 = getCoordinationHub();
    const id2 = hub2.getEventLog();

    // New instance should have empty log
    expect(id2).toHaveLength(0);
  });
});
