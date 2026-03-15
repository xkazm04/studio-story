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
    idle: 'bg-slate-800 text-slate-200',
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 text-slate-200 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Rate Limiter Monitor</h3>
        <span className="text-xs text-slate-400">DEV ONLY</span>
      </div>

      {/* Status Display */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Queue Length:</span>
          <span className={`text-xs font-mono px-2 py-1 rounded ${statusColors[queueStatus]}`}>
            {queueLength} requests
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Rate Limit:</span>
          <span className="text-xs font-mono text-slate-200">
            {config.maxRequestsPerSecond} req/s
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Warning Threshold:</span>
          <span className="text-xs font-mono text-slate-200">
            {config.queueWarningThreshold} queued
          </span>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="border-t border-slate-700/50 pt-3 space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Max Requests/Second:
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={maxRequests}
              onChange={(e) => setMaxRequests(parseInt(e.target.value))}
              className="flex-1 text-xs bg-slate-800 text-slate-200 border border-slate-700/50 rounded px-2 py-1 outline-none focus:border-[var(--ms-accent)]"
            />
            <button
              onClick={handleUpdateMaxRequests}
              className="text-xs text-white px-3 py-1 rounded hover:brightness-110 transition-all bg-[var(--ms-accent)]"
            >
              Set
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Warning Threshold:
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="100"
              value={warningThreshold}
              onChange={(e) => setWarningThreshold(parseInt(e.target.value))}
              className="flex-1 text-xs bg-slate-800 text-slate-200 border border-slate-700/50 rounded px-2 py-1 outline-none focus:border-[var(--ms-accent)]"
            />
            <button
              onClick={handleUpdateWarningThreshold}
              className="text-xs text-white px-3 py-1 rounded hover:brightness-110 transition-all bg-[var(--ms-accent)]"
            >
              Set
            </button>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      {queueLength > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--ms-accent)] animate-pulse"></div>
            <span className="text-xs text-slate-400">
              Processing queue...
            </span>
          </div>
        </div>
      )}

      {/* Warning */}
      {queueLength >= config.queueWarningThreshold && (
        <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded p-2">
          <p className="text-xs text-red-400">
            Queue capacity warning! Consider reducing API call frequency.
          </p>
        </div>
      )}
    </div>
  );
}
