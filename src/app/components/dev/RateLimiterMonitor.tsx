'use client';

import React, { useState, useEffect } from 'react';
import { useRateLimiterConfig } from '@/app/utils/api';

/**
 * Development component to monitor and test rate limiter
 * Add this to any page to visualize rate limiting behavior
 */
export function RateLimiterMonitor() {
  const {
    getConfig,
    setMaxRequestsPerSecond,
    setQueueWarningThreshold,
    getQueueLength,
  } = useRateLimiterConfig();

  const [config, setConfig] = useState(getConfig());
  const [queueLength, setQueueLength] = useState(0);
  const [maxRequests, setMaxRequests] = useState(config.maxRequestsPerSecond);
  const [warningThreshold, setWarningThreshold] = useState(config.queueWarningThreshold);

  // Update queue length periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueLength(getQueueLength());
      setConfig(getConfig());
    }, 100);

    return () => clearInterval(interval);
  }, [getConfig, getQueueLength]);

  const handleUpdateMaxRequests = () => {
    setMaxRequestsPerSecond(maxRequests);
    setConfig(getConfig());
  };

  const handleUpdateWarningThreshold = () => {
    setQueueWarningThreshold(warningThreshold);
    setConfig(getConfig());
  };

  const getQueueStatus = () => {
    if (queueLength === 0) return 'idle';
    if (queueLength < config.queueWarningThreshold / 2) return 'low';
    if (queueLength < config.queueWarningThreshold) return 'medium';
    return 'high';
  };

  const queueStatus = getQueueStatus();
  const statusColors = {
    idle: 'bg-gray-100 text-gray-800',
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Rate Limiter Monitor</h3>
        <span className="text-xs text-gray-500">DEV ONLY</span>
      </div>

      {/* Status Display */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Queue Length:</span>
          <span className={`text-xs font-mono px-2 py-1 rounded ${statusColors[queueStatus]}`}>
            {queueLength} requests
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Rate Limit:</span>
          <span className="text-xs font-mono text-gray-800">
            {config.maxRequestsPerSecond} req/s
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Warning Threshold:</span>
          <span className="text-xs font-mono text-gray-800">
            {config.queueWarningThreshold} queued
          </span>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="border-t border-gray-200 pt-3 space-y-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Max Requests/Second:
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={maxRequests}
              onChange={(e) => setMaxRequests(parseInt(e.target.value))}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
            />
            <button
              onClick={handleUpdateMaxRequests}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Set
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Warning Threshold:
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(parseInt(e.target.value))}
              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
            />
            <button
              onClick={handleUpdateWarningThreshold}
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Set
            </button>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {queueLength > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs text-gray-600">
              Processing queue...
            </span>
          </div>
        </div>
      )}

      {/* Warning */}
      {queueLength >= config.queueWarningThreshold && (
        <div className="mt-2 bg-red-50 border border-red-200 rounded p-2">
          <p className="text-xs text-red-800">
            Queue capacity warning! Consider reducing API call frequency.
          </p>
        </div>
      )}
    </div>
  );
}
