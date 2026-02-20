'use client';

import React, { Suspense, ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useDynamicComponent, usePreloadOnVisible, UseDynamicComponentOptions } from '@/app/hooks/useDynamicComponent';

/**
 * Props for DynamicComponentLoader
 */
interface DynamicComponentLoaderProps<P = {}> {
  /**
   * Function that returns a dynamic import promise
   */
  importFn: () => Promise<{ default: ComponentType<P> }>;

  /**
   * Props to pass to the dynamically loaded component
   */
  componentProps?: P;

  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;

  /**
   * Custom error component
   */
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;

  /**
   * Module name for monitoring and debugging
   */
  moduleName?: string;

  /**
   * Enable preloading on hover
   * @default false
   */
  preloadOnHover?: boolean;

  /**
   * Enable preloading on visibility (when component enters viewport)
   * @default false
   */
  preloadOnVisible?: boolean;

  /**
   * Load immediately on mount
   * @default true
   */
  loadOnMount?: boolean;

  /**
   * Additional options for the useDynamicComponent hook
   */
  options?: Partial<UseDynamicComponentOptions>;

  /**
   * Minimum loading time (in ms) to prevent flash of loading state
   * @default 0
   */
  minLoadingTime?: number;

  /**
   * Custom skeleton/loading height
   */
  loadingHeight?: string;

  /**
   * Show progress indicator during preload
   * @default true
   */
  showPreloadIndicator?: boolean;

  /**
   * Wrapper className for the container
   */
  className?: string;
}

/**
 * Default loading component with skeleton and animation
 */
const DefaultLoadingComponent: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
  <div className={`${height} flex flex-col items-center justify-center space-y-4`}>
    <div className="relative">
      <motion.div
        className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-400/50 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
    <motion.p
      className="text-gray-400 text-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      Loading component...
    </motion.p>
  </div>
);

/**
 * Default error component with retry button
 */
const DefaultErrorComponent: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <motion.div
    className="flex flex-col items-center justify-center p-8 space-y-4 bg-red-500/5 border border-red-500/20 rounded-xl"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <div className="p-3 bg-red-500/10 rounded-full">
      <AlertCircle size={32} className="text-red-400" />
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-lg font-semibold text-white">Failed to Load Component</h3>
      <p className="text-sm text-gray-400 max-w-md">
        {error.message || 'An unexpected error occurred while loading the component.'}
      </p>
    </div>
    <button
      onClick={retry}
      className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
    >
      <RefreshCw size={16} />
      Retry
    </button>
  </motion.div>
);

/**
 * Preload indicator component - subtle progress bar
 */
const PreloadIndicator: React.FC = () => (
  <motion.div
    className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 origin-left"
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{ duration: 2, ease: 'easeInOut' }}
  />
);

/**
 * Reusable wrapper component for dynamic imports that provides:
 * - Consistent loading states with skeleton loaders
 * - Error boundaries with retry functionality
 * - Preloading on hover or visibility
 * - Fade-in transitions
 * - Performance monitoring
 * - Suspense boundaries
 *
 * @example
 * ```tsx
 * // Basic usage
 * <DynamicComponentLoader
 *   importFn={() => import('./HeavyComponent')}
 *   moduleName="HeavyComponent"
 * />
 *
 * // With preloading and custom props
 * <DynamicComponentLoader
 *   importFn={() => import('./UserProfile')}
 *   componentProps={{ userId: '123' }}
 *   moduleName="UserProfile"
 *   preloadOnHover
 *   preloadOnVisible
 * />
 *
 * // With custom loading and error components
 * <DynamicComponentLoader
 *   importFn={() => import('./Dashboard')}
 *   loadingComponent={<CustomSpinner />}
 *   errorComponent={CustomError}
 *   moduleName="Dashboard"
 * />
 * ```
 */
export function DynamicComponentLoader<P = {}>({
  importFn,
  componentProps,
  loadingComponent,
  errorComponent: ErrorComponent = DefaultErrorComponent,
  moduleName = 'dynamic-component',
  preloadOnHover = false,
  preloadOnVisible = false,
  loadOnMount = true,
  options = {},
  minLoadingTime = 0,
  loadingHeight = 'h-64',
  showPreloadIndicator = true,
  className = '',
}: DynamicComponentLoaderProps<P>) {
  const [showLoading, setShowLoading] = React.useState(false);

  const { Component, isLoading, error, isPreloading, load, preload, reset } = useDynamicComponent<P>(
    importFn,
    {
      moduleName,
      loadOnMount,
      ...options,
    }
  );

  const visibilityRef = usePreloadOnVisible(preload);

  // Handle minimum loading time to prevent flash
  React.useEffect(() => {
    if (isLoading && minLoadingTime > 0) {
      setShowLoading(true);
      const timer = setTimeout(() => {
        if (!isLoading) {
          setShowLoading(false);
        }
      }, minLoadingTime);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(isLoading);
    }
  }, [isLoading, minLoadingTime]);

  const handleRetry = () => {
    reset();
    load();
  };

  const containerProps: {
    onMouseEnter?: () => void;
    ref?: (node: HTMLDivElement | null) => void;
  } = {};

  // Add preload on hover if enabled
  if (preloadOnHover && !Component) {
    containerProps.onMouseEnter = preload;
  }

  // Add visibility ref if enabled
  if (preloadOnVisible && !Component) {
    containerProps.ref = visibilityRef;
  }

  return (
    <div className={`relative ${className}`} {...containerProps}>
      {/* Preload indicator */}
      {isPreloading && showPreloadIndicator && <PreloadIndicator />}

      {/* Error state */}
      {error && (
        <AnimatePresence mode="wait">
          <ErrorComponent error={error} retry={handleRetry} />
        </AnimatePresence>
      )}

      {/* Loading state */}
      {!error && showLoading && (
        <AnimatePresence mode="wait">
          {loadingComponent || <DefaultLoadingComponent height={loadingHeight} />}
        </AnimatePresence>
      )}

      {/* Loaded component with fade-in animation */}
      {!error && !showLoading && Component && (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Suspense fallback={loadingComponent || <DefaultLoadingComponent height={loadingHeight} />}>
              {/* @ts-expect-error - Generic component props cannot be perfectly typed */}
              <Component {...componentProps} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

/**
 * HOC version of DynamicComponentLoader for easier integration
 * Wraps a dynamic import in the loader component
 *
 * @example
 * ```tsx
 * export default withDynamicLoader(
 *   () => import('./HeavyComponent'),
 *   {
 *     moduleName: 'HeavyComponent',
 *     preloadOnHover: true,
 *   }
 * );
 * ```
 */
export function withDynamicLoader<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  config: Omit<DynamicComponentLoaderProps<P>, 'importFn' | 'componentProps'> = {}
) {
  return (props: P) => (
    <DynamicComponentLoader<P>
      importFn={importFn}
      componentProps={props}
      {...config}
    />
  );
}

export default DynamicComponentLoader;
