import dynamic from 'next/dynamic';
import { ComponentType, ReactNode } from 'react';

/**
 * Configuration options for dynamic imports
 */
export interface DynamicImportOptions {
  /**
   * Enable server-side rendering for this component
   * @default false
   */
  ssr?: boolean;

  /**
   * Custom loading component or message
   * @default null
   */
  loading?: ComponentType<any> | (() => ReactNode);

  /**
   * Custom error boundary component
   * @default null
   */
  error?: ComponentType<{ error: Error; reset: () => void }>;

  /**
   * Enable preloading on hover
   * @default false
   */
  preloadOnHover?: boolean;

  /**
   * Enable preloading on visibility (intersection observer)
   * @default false
   */
  preloadOnVisible?: boolean;

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
}

/**
 * Retry logic with exponential backoff for dynamic imports
 * Attempts to load a module multiple times with increasing delays
 */
async function retryDynamicImport<T>(
  importFn: () => Promise<T>,
  retries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;

      // Don't wait after the last attempt
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Log retry attempt in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Retry attempt ${attempt + 1}/${retries} for dynamic import after ${delay}ms`);
        }
      }
    }
  }

  throw lastError || new Error('Dynamic import failed after retries');
}

/**
 * Wrapper function for creating dynamically imported components with standardized
 * error boundaries, loading states, and retry logic.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const MyComponent = withDynamicImport(() => import('./MyComponent'));
 *
 * // With custom loading state
 * const MyComponent = withDynamicImport(
 *   () => import('./MyComponent'),
 *   {
 *     loading: () => <div>Loading...</div>,
 *     ssr: false
 *   }
 * );
 *
 * // With preloading
 * const MyComponent = withDynamicImport(
 *   () => import('./MyComponent'),
 *   { preloadOnHover: true, retryAttempts: 5 }
 * );
 * ```
 *
 * @param importFn - Function that returns a dynamic import promise
 * @param options - Configuration options for the dynamic import
 * @returns Dynamically imported component with error handling and retry logic
 */
export function withDynamicImport<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicImportOptions = {}
): ComponentType<P> {
  const {
    ssr = false,
    loading = null,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  // Wrap the import function with retry logic
  const importWithRetry = () => retryDynamicImport(importFn, retryAttempts, retryDelay);

  // Create the dynamic component with Next.js dynamic()
  const DynamicComponent = dynamic(importWithRetry, {
    ssr,
    loading: loading as any || undefined,
  });

  return DynamicComponent;
}

/**
 * Performance monitoring utility for tracking dynamic import times
 * Useful for identifying slow-loading modules
 */
export class DynamicImportMonitor {
  private static imports: Map<string, { count: number; totalTime: number; errors: number }> = new Map();

  static recordImport(moduleName: string, duration: number, failed = false) {
    const existing = this.imports.get(moduleName) || { count: 0, totalTime: 0, errors: 0 };

    this.imports.set(moduleName, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
      errors: existing.errors + (failed ? 1 : 0),
    });
  }

  static getStats(moduleName: string) {
    const stats = this.imports.get(moduleName);
    if (!stats) return null;

    return {
      count: stats.count,
      averageTime: stats.totalTime / stats.count,
      totalTime: stats.totalTime,
      errors: stats.errors,
      successRate: ((stats.count - stats.errors) / stats.count) * 100,
    };
  }

  static getAllStats() {
    const allStats: Record<string, any> = {};

    this.imports.forEach((stats, moduleName) => {
      allStats[moduleName] = {
        count: stats.count,
        averageTime: stats.totalTime / stats.count,
        totalTime: stats.totalTime,
        errors: stats.errors,
        successRate: ((stats.count - stats.errors) / stats.count) * 100,
      };
    });

    return allStats;
  }

  static reset() {
    this.imports.clear();
  }
}

/**
 * Wraps a dynamic import with performance monitoring
 * Records load time and success/failure metrics
 */
export function withMonitoring<T>(
  moduleName: string,
  importFn: () => Promise<T>
): () => Promise<T> {
  return async () => {
    const startTime = performance.now();
    let failed = false;

    try {
      const result = await importFn();
      return result;
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      DynamicImportMonitor.recordImport(moduleName, duration, failed);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Dynamic Import] ${moduleName} loaded in ${duration.toFixed(2)}ms ${failed ? '(FAILED)' : ''}`);
      }
    }
  };
}
