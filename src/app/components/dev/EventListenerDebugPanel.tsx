'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Radio, AlertCircle } from 'lucide-react';
import { EventListenerGuardResult, TrackedListener } from '@/app/hooks/useEventListenerGuard';

interface EventListenerDebugPanelProps {
  /** Result from useEventListenerGuard hook */
  guardResult: EventListenerGuardResult;
  /** Component name for display */
  componentName?: string;
}

/**
 * Debug panel component that visualizes active event listeners in real-time
 * Shows a collapsible tree view with listener counts per event type and target element
 *
 * Only intended for development mode - should not be rendered in production
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const listenerGuard = useEventListenerGuard('MyComponent');
 *
 *   return (
 *     <>
 *       <div>Component content...</div>
 *       {process.env.NODE_ENV !== 'production' && (
 *         <EventListenerDebugPanel guardResult={listenerGuard} componentName="MyComponent" />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
const EventListenerDebugPanel: React.FC<EventListenerDebugPanelProps> = ({
  guardResult,
  componentName = 'Component',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedEventTypes, setExpandedEventTypes] = useState<Set<string>>(new Set());

  const { stats, trackedListeners, isEnabled } = guardResult;

  // Don't render in production
  if (process.env.NODE_ENV === 'production' || !isEnabled) {
    return null;
  }

  // Toggle event type expansion
  const toggleEventType = (eventType: string) => {
    setExpandedEventTypes((prev) => {
      const next = new Set(prev);
      if (next.has(eventType)) {
        next.delete(eventType);
      } else {
        next.add(eventType);
      }
      return next;
    });
  };

  // Group listeners by event type
  const listenersByType = trackedListeners.reduce((acc, listener) => {
    if (!acc[listener.eventType]) {
      acc[listener.eventType] = [];
    }
    acc[listener.eventType].push(listener);
    return acc;
  }, {} as Record<string, TrackedListener[]>);

  // Format target name
  const formatTargetName = (target: EventTarget): string => {
    if (target === window) return 'window';
    if (target === document) return 'document';
    if (target instanceof HTMLElement) {
      const tag = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : '';
      const classes = target.className ? `.${target.className.split(' ').join('.')}` : '';
      return `<${tag}${id}${classes}>`;
    }
    return 'unknown';
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 w-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Radio size={16} className={stats.active > 0 ? 'text-green-500 animate-pulse' : 'text-gray-500'} />
          <span className="font-semibold text-white text-sm">
            Event Listener Guard
          </span>
          {stats.active > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
              {stats.active} active
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Panel Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 max-h-96 overflow-y-auto">
              {/* Component Info */}
              <div className="mb-4 pb-4 border-b border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Component: <span className="text-white font-medium">{componentName}</span></p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-400">Active</p>
                    <p className="text-lg font-bold text-green-400">{stats.active}</p>
                  </div>
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-400">Added</p>
                    <p className="text-lg font-bold text-blue-400">{stats.totalAdded}</p>
                  </div>
                  <div className="bg-gray-800 rounded p-2">
                    <p className="text-xs text-gray-400">Removed</p>
                    <p className="text-lg font-bold text-purple-400">{stats.totalRemoved}</p>
                  </div>
                </div>
              </div>

              {/* No Listeners State */}
              {stats.active === 0 ? (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 text-gray-500 mb-3">
                    <Radio size={20} />
                  </div>
                  <p className="text-sm text-gray-400">No active event listeners</p>
                </div>
              ) : (
                <>
                  {/* Warning if mismatched counts */}
                  {stats.totalAdded !== stats.totalRemoved + stats.active && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-2">
                      <AlertCircle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-yellow-500">Potential Memory Leak</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Added/Removed count mismatch detected
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Listeners Tree View */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Active Listeners by Type
                    </p>
                    {Object.entries(listenersByType).map(([eventType, listeners]) => (
                      <div key={eventType} className="border border-gray-700 rounded-lg overflow-hidden">
                        {/* Event Type Header */}
                        <div
                          className="flex items-center justify-between px-3 py-2 bg-gray-800 cursor-pointer hover:bg-gray-750 transition-colors"
                          onClick={() => toggleEventType(eventType)}
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              size={14}
                              className={`text-gray-400 transition-transform ${
                                expandedEventTypes.has(eventType) ? 'rotate-180' : ''
                              }`}
                            />
                            <span className="text-sm font-medium text-white">{eventType}</span>
                          </div>
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                            {listeners.length}
                          </span>
                        </div>

                        {/* Listener Details */}
                        <AnimatePresence>
                          {expandedEventTypes.has(eventType) && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 py-2 bg-gray-900 space-y-2">
                                {listeners.map((listener) => (
                                  <div
                                    key={listener.id}
                                    className="p-2 bg-gray-800 rounded text-xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400">Target:</span>
                                      <span className="text-white font-mono text-[10px]">
                                        {formatTargetName(listener.target)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-gray-400">Added:</span>
                                      <span className="text-gray-300">{formatTimeAgo(listener.addedAt)}</span>
                                    </div>
                                    {listener.capture && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Capture:</span>
                                        <span className="text-yellow-400">true</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EventListenerDebugPanel;
