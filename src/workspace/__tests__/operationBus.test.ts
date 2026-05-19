import { describe, it, expect, beforeEach, vi } from 'vitest';
import { operationBus, type ToolOperation } from '../operationBus';

function makeOp(overrides?: Partial<ToolOperation>): ToolOperation {
  return {
    toolName: 'mcp__story__create_character',
    baseName: 'create_character',
    toolInput: { name: 'Alice' },
    ...overrides,
  };
}

describe('operationBus', () => {
  beforeEach(() => {
    operationBus._reset();
  });

  describe('subscribe', () => {
    it('calls listener on emit', () => {
      const listener = vi.fn();
      operationBus.subscribe(listener);
      const op = makeOp();
      operationBus.emit(op);
      expect(listener).toHaveBeenCalledWith(op);
    });

    it('supports multiple listeners', () => {
      const a = vi.fn();
      const b = vi.fn();
      operationBus.subscribe(a);
      operationBus.subscribe(b);
      operationBus.emit(makeOp());
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });

    it('returns unsubscribe function', () => {
      const listener = vi.fn();
      const unsub = operationBus.subscribe(listener);
      unsub();
      operationBus.emit(makeOp());
      expect(listener).not.toHaveBeenCalled();
    });

    it('does not affect other listeners on unsubscribe', () => {
      const a = vi.fn();
      const b = vi.fn();
      const unsubA = operationBus.subscribe(a);
      operationBus.subscribe(b);
      unsubA();
      operationBus.emit(makeOp());
      expect(a).not.toHaveBeenCalled();
      expect(b).toHaveBeenCalledTimes(1);
    });

    it('survives a throwing listener', () => {
      const bad = vi.fn(() => { throw new Error('boom'); });
      const good = vi.fn();
      operationBus.subscribe(bad);
      operationBus.subscribe(good);
      operationBus.emit(makeOp());
      expect(good).toHaveBeenCalledTimes(1);
    });
  });

  describe('intercept', () => {
    it('returns false when no interceptors', () => {
      expect(operationBus.emit(makeOp())).toBe(false);
    });

    it('returns true when interceptor handles', () => {
      operationBus.intercept(() => true);
      expect(operationBus.emit(makeOp())).toBe(true);
    });

    it('returns false when interceptor declines', () => {
      operationBus.intercept(() => false);
      expect(operationBus.emit(makeOp())).toBe(false);
    });

    it('short-circuits on first true interceptor', () => {
      const first = vi.fn(() => true);
      const second = vi.fn(() => true);
      operationBus.intercept(first);
      operationBus.intercept(second);
      operationBus.emit(makeOp());
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });

    it('runs all interceptors if none handle', () => {
      const a = vi.fn(() => false);
      const b = vi.fn(() => false);
      operationBus.intercept(a);
      operationBus.intercept(b);
      expect(operationBus.emit(makeOp())).toBe(false);
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes interceptor', () => {
      const interceptor = vi.fn(() => true);
      const unsub = operationBus.intercept(interceptor);
      unsub();
      expect(operationBus.emit(makeOp())).toBe(false);
    });

    it('listeners run before interceptors', () => {
      const order: string[] = [];
      operationBus.subscribe(() => order.push('listener'));
      operationBus.intercept(() => { order.push('interceptor'); return false; });
      operationBus.emit(makeOp());
      expect(order).toEqual(['listener', 'interceptor']);
    });

    it('survives a throwing interceptor', () => {
      const bad = vi.fn(() => { throw new Error('boom'); });
      const good = vi.fn(() => true);
      operationBus.intercept(bad);
      operationBus.intercept(good);
      // bad throws but good still runs
      expect(operationBus.emit(makeOp())).toBe(true);
    });
  });

  describe('counts', () => {
    it('tracks listener count', () => {
      expect(operationBus.listenerCount).toBe(0);
      const unsub = operationBus.subscribe(() => {});
      expect(operationBus.listenerCount).toBe(1);
      unsub();
      expect(operationBus.listenerCount).toBe(0);
    });

    it('tracks interceptor count', () => {
      expect(operationBus.interceptorCount).toBe(0);
      const unsub = operationBus.intercept(() => false);
      expect(operationBus.interceptorCount).toBe(1);
      unsub();
      expect(operationBus.interceptorCount).toBe(0);
    });
  });

  describe('_reset', () => {
    it('clears all subscribers', () => {
      operationBus.subscribe(() => {});
      operationBus.intercept(() => false);
      operationBus._reset();
      expect(operationBus.listenerCount).toBe(0);
      expect(operationBus.interceptorCount).toBe(0);
    });
  });
});
