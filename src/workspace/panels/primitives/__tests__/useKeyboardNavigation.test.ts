// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

function makeContainer(role: string, count: number) {
  const container = document.createElement('div');
  const items: HTMLElement[] = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('button');
    el.setAttribute('role', role);
    el.tabIndex = i === 0 ? 0 : -1;
    el.textContent = `Item ${i}`;
    el.onclick = vi.fn();
    container.appendChild(el);
    items.push(el);
  }
  document.body.appendChild(container);
  return { container, items };
}

function fireKey(handler: (e: React.KeyboardEvent) => void, key: string) {
  const event = {
    key,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent;
  handler(event);
  return event;
}

describe('useKeyboardNavigation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('list mode', () => {
    it('ArrowDown moves focus to next item', () => {
      const { container, items } = makeContainer('option', 3);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="option"]', mode: 'list' }),
      );

      items[0].focus();
      fireKey(result.current, 'ArrowDown');
      expect(document.activeElement).toBe(items[1]);
    });

    it('ArrowUp moves focus to previous item', () => {
      const { container, items } = makeContainer('option', 3);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="option"]', mode: 'list' }),
      );

      items[2].focus();
      fireKey(result.current, 'ArrowUp');
      expect(document.activeElement).toBe(items[1]);
    });

    it('Home jumps to first, End jumps to last', () => {
      const { container, items } = makeContainer('option', 5);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="option"]', mode: 'list' }),
      );

      items[2].focus();
      fireKey(result.current, 'Home');
      expect(document.activeElement).toBe(items[0]);

      fireKey(result.current, 'End');
      expect(document.activeElement).toBe(items[4]);
    });

    it('Enter activates current item', () => {
      const { container, items } = makeContainer('option', 3);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="option"]', mode: 'list' }),
      );

      items[1].focus();
      const e = fireKey(result.current, 'Enter');
      expect(e.preventDefault).toHaveBeenCalled();
      expect(items[1].onclick).toHaveBeenCalled();
    });

    it('does not move on ArrowLeft/Right in list mode', () => {
      const { container, items } = makeContainer('option', 3);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="option"]', mode: 'list' }),
      );

      items[1].focus();
      fireKey(result.current, 'ArrowRight');
      expect(document.activeElement).toBe(items[1]);
    });

    it('clamps at boundaries', () => {
      const { container, items } = makeContainer('option', 3);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="option"]', mode: 'list' }),
      );

      items[0].focus();
      fireKey(result.current, 'ArrowUp');
      expect(document.activeElement).toBe(items[0]);

      items[2].focus();
      fireKey(result.current, 'ArrowDown');
      expect(document.activeElement).toBe(items[2]);
    });
  });

  describe('grid mode', () => {
    it('ArrowRight and ArrowDown move forward', () => {
      const { container, items } = makeContainer('gridcell', 4);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="gridcell"]', mode: 'grid' }),
      );

      items[0].focus();
      fireKey(result.current, 'ArrowRight');
      expect(document.activeElement).toBe(items[1]);

      fireKey(result.current, 'ArrowDown');
      expect(document.activeElement).toBe(items[2]);
    });

    it('ArrowLeft and ArrowUp move backward', () => {
      const { container, items } = makeContainer('gridcell', 4);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="gridcell"]', mode: 'grid' }),
      );

      items[3].focus();
      fireKey(result.current, 'ArrowLeft');
      expect(document.activeElement).toBe(items[2]);

      fireKey(result.current, 'ArrowUp');
      expect(document.activeElement).toBe(items[1]);
    });
  });

  describe('tree mode', () => {
    it('ArrowDown/Up navigate linearly', () => {
      const { container, items } = makeContainer('treeitem', 3);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="treeitem"]', mode: 'tree' }),
      );

      items[0].focus();
      fireKey(result.current, 'ArrowDown');
      expect(document.activeElement).toBe(items[1]);

      fireKey(result.current, 'ArrowUp');
      expect(document.activeElement).toBe(items[0]);
    });

    it('ArrowRight on collapsed branch triggers click (expand)', () => {
      const { container, items } = makeContainer('treeitem', 3);
      items[0].setAttribute('aria-expanded', 'false');
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="treeitem"]', mode: 'tree' }),
      );

      items[0].focus();
      const e = fireKey(result.current, 'ArrowRight');
      expect(e.preventDefault).toHaveBeenCalled();
      expect(items[0].onclick).toHaveBeenCalled();
    });

    it('ArrowRight on expanded branch moves to next (child)', () => {
      const { container, items } = makeContainer('treeitem', 3);
      items[0].setAttribute('aria-expanded', 'true');
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="treeitem"]', mode: 'tree' }),
      );

      items[0].focus();
      fireKey(result.current, 'ArrowRight');
      expect(document.activeElement).toBe(items[1]);
    });

    it('ArrowLeft on expanded branch triggers click (collapse)', () => {
      const { container, items } = makeContainer('treeitem', 3);
      items[1].setAttribute('aria-expanded', 'true');
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="treeitem"]', mode: 'tree' }),
      );

      items[1].focus();
      const e = fireKey(result.current, 'ArrowLeft');
      expect(e.preventDefault).toHaveBeenCalled();
      expect(items[1].onclick).toHaveBeenCalled();
    });

    it('ArrowLeft on leaf moves to previous item', () => {
      const { container, items } = makeContainer('treeitem', 3);
      const ref = createRef<HTMLElement>() as React.RefObject<HTMLElement>;
      Object.defineProperty(ref, 'current', { value: container, writable: true });

      const { result } = renderHook(() =>
        useKeyboardNavigation(ref, { selector: '[role="treeitem"]', mode: 'tree' }),
      );

      items[2].focus();
      fireKey(result.current, 'ArrowLeft');
      expect(document.activeElement).toBe(items[1]);
    });
  });
});
