'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, RotateCcw, X } from 'lucide-react';
import type { AdvisorError } from '../types';

// ─── useCountdown ─────────────────────────────────

export function useCountdown(targetMs: number | null): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!targetMs) { setRemaining(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) return;
      return requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [targetMs]);
  return remaining;
}

// ─── Rate Limit Banner ────────────────────────────

export function AdvisorRateLimitBanner({ readyAt }: { readyAt: number | null }) {
  const seconds = useCountdown(readyAt);
  if (!readyAt || seconds <= 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-sm text-amber-300 flex items-center gap-2"
    >
      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="flex-1">Rate limited &mdash; ready in {seconds}s</span>
    </motion.div>
  );
}

// ─── Error Banner ─────────────────────────────────

interface AdvisorErrorBannerProps {
  error: AdvisorError;
  /** Pre-computed display label from advisorErrorLabel() */
  errorLabel: string;
  onRetry: () => void;
  onDismiss: () => void;
}

/** Whether auto-retry makes sense for this error code */
function isRetryable(code: AdvisorError['code']): boolean {
  return code === 'GEMINI_ERROR' || code === 'STREAM_CORRUPTED' || code === 'RATE_LIMITED';
}

export function AdvisorErrorBanner({ error, errorLabel, onRetry, onDismiss }: AdvisorErrorBannerProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryable = isRetryable(error.code);

  useEffect(() => {
    if (!retryable) return;
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          onRetry();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [error, retryable]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelAutoRetry = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20 text-sm text-red-300 flex items-center gap-2"
    >
      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      <span className="flex-1 truncate">{errorLabel}</span>
      {retryable && countdown !== null && (
        <span className="text-xs text-red-400/70 shrink-0">
          retry in {countdown}s
        </span>
      )}
      {retryable && (
        <button
          onClick={() => { cancelAutoRetry(); onRetry(); }}
          aria-label="Retry now"
          className="text-red-400 hover:text-red-300 transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={() => { cancelAutoRetry(); onDismiss(); }}
        aria-label="Dismiss error"
        className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
