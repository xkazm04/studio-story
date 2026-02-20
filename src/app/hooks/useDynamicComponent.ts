'use client';

import { useState, useEffect, useRef, ComponentType } from 'react';
import { DynamicImportMonitor } from '@/app/lib/dynamicImportHelpers';

/**
 * State for dynamic component loading
 */
export interface DynamicComponentState<T> {
  Component: ComponentType<T> | null;
  isLoading: boolean;
  error: Error | null;
  isPreloading: boolean;
}

/**
 * Options for useDynamicComponent hook
 */
export interface UseDynamicComponentOptions {
  /**
   * Automatically load the component on mount
   * @default false
   */
  loadOnMount?: boolean;

  /**
   * Module name for performance monitoring
   * @default 'unknown-module'
   */
  moduleName?: string;

  /**
   * Delay before loading (in ms), useful for staggered loading
   * @default 0
   */
  loadDelay?: number;

  /**
   * Retry attempts for failed imports
   * @default 3
   */
  retryAttempts?: number;

  /**
   * Base delay for exponential backoff (in ms)
   * @default 1000
   */
  retryDelay?: number;

  /**
   * Callback on successful load
   */
  onLoad?: () => void;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

/**
 * Custom hook for dynamically loading components with advanced features:
 * - Lazy loading with manual triggers
 * - Preloading on hover or visibility
 * - Loading, error, and success states
 * - Retry logic with exponential backoff
 * - Performance monitoring
 * - Abort support for cleanup
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { Component, isLoading, error, load, preload } = useDynamicComponent(
 *     () => import('./HeavyComponent'),
 *     { moduleName: 'HeavyComponent' }
 *   );
 *
 *   // Preload on hover
 *   <button onMouseEnter={preload}>Show Heavy Component</button>
 *
 *   // Load when needed
 *   <button onClick={load}>Load Component</button>
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (Component) return <Component />;
 *   return null;
 * }
 * ```
 */
export function useDynamicComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: UseDynamicComponentOptions = {}
): {
  Component: ComponentType<P> | null;
  isLoading: boolean;
  error: Error | null;
  isPreloading: boolean;
  load: () => Promise<void>;
  preload: () => void;
  reset: () => void;
} {
  const {
    loadOnMount = false,
    moduleName = 'unknown-module',
    loadDelay = 0,
    retryAttempts = 3,
    retryDelay = 1000,
    onLoad,
    onError,
  } = options;

  const [state, setState] = useState<DynamicComponentState<P>>({
    Component: null,
    isLoading: false,
    error: null,
    isPreloading: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const preloadStartedRef = useRef(false);
  const loadedRef = useRef(false);

  /**
   * Retry logic with exponential backoff
   */
  const retryImport = async (attempt = 0): Promise<{ default: ComponentType<P> }> => {
    try {
      return await importFn();
    } catch (error) {
      if (attempt < retryAttempts) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        if (process.env.NODE_ENV === 'development') {
          console.warn(`[useDynamicComponent] Retry ${attempt + 1}/${retryAttempts} for ${moduleName} after ${delay}ms`);
        }

        return retryImport(attempt + 1);
      }
      throw error;
    }
  };

  /**
   * Load the component with full state management
   */
  const load = async (): Promise<void> => {
    // Prevent duplicate loads
    if (loadedRef.current || state.isLoading) {
      return;
    }

    // Cancel any existing preload
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const startTime = performance.now();

    setState(prev => ({ ...prev, isLoading: true, error: null, isPreloading: false }));

    try {
      // Apply load delay if specified
      if (loadDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, loadDelay));
      }

      // Check if aborted during delay
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const module = await retryImport();
      const duration = performance.now() - startTime;

      // Record success in monitor
      DynamicImportMonitor.recordImport(moduleName, duration, false);

      if (!abortControllerRef.current?.signal.aborted) {
        setState({
          Component: module.default,
          isLoading: false,
          error: null,
          isPreloading: false,
        });
        loadedRef.current = true;
        onLoad?.();
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      const err = error as Error;

      // Record failure in monitor
      DynamicImportMonitor.recordImport(moduleName, duration, true);

      if (!abortControllerRef.current?.signal.aborted) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err,
          isPreloading: false,
        }));
        onError?.(err);

        if (process.env.NODE_ENV === 'development') {
          console.error(`[useDynamicComponent] Failed to load ${moduleName}:`, err);
        }
      }
    }
  };

  /**
   * Preload the component in the background without showing loading state
   * Useful for hover or route prefetch scenarios
   */
  const preload = (): void => {
    // Don't preload if already loaded or loading
    if (loadedRef.current || state.isLoading || preloadStartedRef.current) {
      return;
    }

    preloadStartedRef.current = true;
    setState(prev => ({ ...prev, isPreloading: true }));

    const startTime = performance.now();

    retryImport()
      .then(module => {
        const duration = performance.now() - startTime;
        DynamicImportMonitor.recordImport(`${moduleName}:preload`, duration, false);

        setState(prev => ({
          ...prev,
          Component: module.default,
          isPreloading: false,
        }));
        loadedRef.current = true;
        onLoad?.();

        if (process.env.NODE_ENV === 'development') {
          console.log(`[useDynamicComponent] Preloaded ${moduleName} in ${duration.toFixed(2)}ms`);
        }
      })
      .catch(error => {
        const duration = performance.now() - startTime;
        DynamicImportMonitor.recordImport(`${moduleName}:preload`, duration, true);

        setState(prev => ({ ...prev, isPreloading: false }));
        preloadStartedRef.current = false;

        if (process.env.NODE_ENV === 'development') {
          console.warn(`[useDynamicComponent] Preload failed for ${moduleName}:`, error);
        }
      });
  };

  /**
   * Reset the component state
   */
  const reset = (): void => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      Component: null,
      isLoading: false,
      error: null,
      isPreloading: false,
    });
    loadedRef.current = false;
    preloadStartedRef.current = false;
  };

  // Load on mount if specified
  useEffect(() => {
    if (loadOnMount) {
      load();
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadOnMount]);

  return {
    Component: state.Component,
    isLoading: state.isLoading,
    error: state.error,
    isPreloading: state.isPreloading,
    load,
    preload,
    reset,
  };
}

/**
 * Hook for preloading on intersection (visibility)
 * Automatically preloads when the element enters the viewport
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { Component, isLoading } = useDynamicComponent(
 *     () => import('./HeavyComponent')
 *   );
 *   const ref = usePreloadOnVisible(preload);
 *
 *   return <div ref={ref}>{isLoading ? 'Loading...' : Component && <Component />}</div>;
 * }
 * ```
 */
export function usePreloadOnVisible(
  preloadFn: () => void,
  options: IntersectionObserverInit = {}
): (node: HTMLElement | null) => void {
  const observerRef = useRef<IntersectionObserver | null>(null);

  const refCallback = (node: HTMLElement | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!node) return;

    // Create new observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          preloadFn();
          // Disconnect after preload is triggered
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );

    observerRef.current.observe(node);
  };

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return refCallback;
}
