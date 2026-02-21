/**
 * EXAMPLE FILE: useEventListenerGuard Usage Examples
 *
 * This file demonstrates various ways to use the useEventListenerGuard hook
 * for detecting memory leaks in React components.
 *
 * DO NOT IMPORT THIS FILE IN PRODUCTION CODE
 */

import React, { useEffect, useState } from 'react';
import { useEventListenerGuard, useEventListenerLeakDetector } from './useEventListenerGuard';
import EventListenerDebugPanel from '@/app/components/dev/EventListenerDebugPanel';

// =============================================================================
// Example 1: Basic Usage - Properly Cleaned Up Listeners
// =============================================================================

export function Example1_ProperCleanup() {
  const listenerGuard = useEventListenerGuard('Example1_ProperCleanup');

  useEffect(() => {
    const handleResize = () => {
      // Window resized
    };

    const handleScroll = () => {
      // Window scrolled
    };

    // Add multiple listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    // ✅ GOOD: Properly cleaned up
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Example 1: Proper Cleanup</h2>
      <p className="text-gray-400 mb-4">
        This component properly removes all event listeners on unmount.
        The hook will show a success message.
      </p>
      <div className="bg-gray-800 p-4 rounded">
        <p>Active listeners: {listenerGuard.stats.active}</p>
        <p>Total added: {listenerGuard.stats.totalAdded}</p>
        <p>Total removed: {listenerGuard.stats.totalRemoved}</p>
      </div>
    </div>
  );
}

// =============================================================================
// Example 2: Memory Leak - Forgotten Cleanup
// =============================================================================

export function Example2_MemoryLeak() {
  const listenerGuard = useEventListenerGuard('Example2_MemoryLeak');

  useEffect(() => {
    const handleClick = () => {
      // Document clicked
    };

    document.addEventListener('click', handleClick);

    // ❌ BAD: Forgot to clean up! This will trigger a warning
    // Uncomment the return below to fix the leak:
    // return () => {
    //   document.removeEventListener('click', handleClick);
    // };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2 text-red-500">
        Example 2: Memory Leak (Intentional)
      </h2>
      <p className="text-gray-400 mb-4">
        This component intentionally forgets to clean up listeners.
        Check the console when this component unmounts!
      </p>
      <div className="bg-red-900/20 border border-red-500 p-4 rounded">
        <p className="text-red-400">⚠️ Memory Leak Detected</p>
        <p>Active listeners: {listenerGuard.stats.active}</p>
      </div>
    </div>
  );
}

// =============================================================================
// Example 3: Network Status Listener
// =============================================================================

export function Example3_NetworkStatus() {
  const listenerGuard = useEventListenerGuard('Example3_NetworkStatus');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Example 3: Network Status</h2>
      <p className="text-gray-400 mb-4">
        Tracks network status using online/offline listeners
      </p>
      <div className={`p-4 rounded ${isOnline ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
        <p>Status: {isOnline ? '🟢 Online' : '🔴 Offline'}</p>
        <p className="text-sm text-gray-400 mt-2">
          Active listeners: {listenerGuard.stats.active}
        </p>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <EventListenerDebugPanel
          guardResult={listenerGuard}
          componentName="Example3_NetworkStatus"
        />
      )}
    </div>
  );
}

// =============================================================================
// Example 4: Window Resize with Debounce
// =============================================================================

export function Example4_ResizeWithDebounce() {
  const listenerGuard = useEventListenerGuard('Example4_ResizeWithDebounce');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce the resize event
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, 150);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Example 4: Debounced Resize</h2>
      <p className="text-gray-400 mb-4">
        Tracks window size with debounced resize handler
      </p>
      <div className="bg-gray-800 p-4 rounded">
        <p>Width: {windowSize.width}px</p>
        <p>Height: {windowSize.height}px</p>
        <p className="text-sm text-gray-400 mt-2">
          Listeners: {JSON.stringify(listenerGuard.stats.byEventType)}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Example 5: Simple Leak Detector (No Stats)
// =============================================================================

export function Example5_SimpleLeakDetector() {
  // This hook only logs warnings, doesn't return stats
  useEventListenerLeakDetector('Example5_SimpleLeakDetector');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Escape pressed
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Example 5: Simple Leak Detector</h2>
      <p className="text-gray-400 mb-4">
        Uses the simpler useEventListenerLeakDetector hook.
        Press Escape to test the listener.
      </p>
      <div className="bg-gray-800 p-4 rounded">
        <p>This component tracks listeners but doesn't expose stats.</p>
        <p className="text-sm text-gray-400 mt-2">
          Check console for cleanup messages.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Example 6: Multiple Event Types
// =============================================================================

export function Example6_MultipleEventTypes() {
  const listenerGuard = useEventListenerGuard('Example6_MultipleEventTypes');
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const addEvent = (eventType: string) => {
      setEvents((prev) => [...prev.slice(-4), eventType]);
    };

    const handleClick = () => addEvent('click');
    const handleKeyDown = () => addEvent('keydown');
    const handleMouseMove = () => addEvent('mousemove');
    const handleScroll = () => addEvent('scroll');
    const handleResize = () => addEvent('resize');

    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Example 6: Multiple Event Types</h2>
      <p className="text-gray-400 mb-4">
        Tracks many different event types simultaneously
      </p>
      <div className="bg-gray-800 p-4 rounded space-y-2">
        <div>
          <p className="font-medium">Active Listeners:</p>
          {Object.entries(listenerGuard.stats.byEventType).map(([type, count]) => (
            <div key={type} className="text-sm text-gray-400">
              • {type}: {count}
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-gray-700">
          <p className="font-medium">Recent Events:</p>
          {events.map((event, i) => (
            <div key={i} className="text-sm text-blue-400">
              {event}
            </div>
          ))}
        </div>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <EventListenerDebugPanel
          guardResult={listenerGuard}
          componentName="Example6_MultipleEventTypes"
        />
      )}
    </div>
  );
}

// =============================================================================
// Example 7: Conditional Listener Registration
// =============================================================================

export function Example7_ConditionalListeners() {
  const listenerGuard = useEventListenerGuard('Example7_ConditionalListeners');
  const [enableTracking, setEnableTracking] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enableTracking) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enableTracking]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Example 7: Conditional Listeners</h2>
      <p className="text-gray-400 mb-4">
        Listeners are only added when tracking is enabled
      </p>
      <div className="bg-gray-800 p-4 rounded space-y-3">
        <button
          onClick={() => setEnableTracking(!enableTracking)}
          className={`px-4 py-2 rounded font-medium ${
            enableTracking
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {enableTracking ? 'Disable Tracking' : 'Enable Tracking'}
        </button>

        <div>
          <p>Mouse Position: ({mousePosition.x}, {mousePosition.y})</p>
          <p className="text-sm text-gray-400">
            Active listeners: {listenerGuard.stats.active}
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Demo Component
// =============================================================================

export function EventListenerGuardDemo() {
  const [activeExample, setActiveExample] = useState<number | null>(null);

  const examples = [
    { id: 1, name: 'Proper Cleanup', component: Example1_ProperCleanup },
    { id: 2, name: 'Memory Leak', component: Example2_MemoryLeak },
    { id: 3, name: 'Network Status', component: Example3_NetworkStatus },
    { id: 4, name: 'Debounced Resize', component: Example4_ResizeWithDebounce },
    { id: 5, name: 'Simple Detector', component: Example5_SimpleLeakDetector },
    { id: 6, name: 'Multiple Events', component: Example6_MultipleEventTypes },
    { id: 7, name: 'Conditional', component: Example7_ConditionalListeners },
  ];

  const ActiveComponent = activeExample
    ? examples.find((ex) => ex.id === activeExample)?.component
    : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          useEventListenerGuard Hook Examples
        </h1>
        <p className="text-gray-400 mb-8">
          Interactive examples demonstrating the event listener tracking hook
        </p>

        {/* Example Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() =>
                setActiveExample(activeExample === example.id ? null : example.id)
              }
              className={`p-3 rounded-lg font-medium transition-colors ${
                activeExample === example.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {example.name}
            </button>
          ))}
        </div>

        {/* Active Example Display */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {ActiveComponent ? (
            <ActiveComponent />
          ) : (
            <div className="p-8 text-center text-gray-400">
              Select an example above to see it in action
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3">Instructions</h3>
          <ul className="space-y-2 text-gray-400">
            <li>• Select an example to mount the component</li>
            <li>• Open your browser console to see debug messages</li>
            <li>• Click the example again to unmount and trigger cleanup checks</li>
            <li>• Look for warnings about memory leaks in Example 2</li>
            <li>• The debug panel (when visible) shows real-time listener stats</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
