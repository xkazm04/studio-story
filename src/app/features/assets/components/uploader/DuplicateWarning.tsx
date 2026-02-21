'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Copy,
  Check,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useDuplicateCheck, type DuplicateResult } from '@/lib/similarity';
import { Button, IconButton } from '@/app/components/UI/Button';

interface DuplicateWarningProps {
  file: File | null;
  onProceed: () => void;
  onCancel: () => void;
  onViewExisting?: (assetId: string) => void;
  className?: string;
}

export default function DuplicateWarning({
  file,
  onProceed,
  onCancel,
  onViewExisting,
  className = '',
}: DuplicateWarningProps) {
  const { checkDuplicate, isChecking, result, reset } = useDuplicateCheck();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (file && !dismissed) {
      checkDuplicate(file, file.name);
    }
  }, [file, checkDuplicate, dismissed]);

  useEffect(() => {
    // Reset when file changes
    setDismissed(false);
    reset();
  }, [file, reset]);

  const handleDismiss = () => {
    setDismissed(true);
    onProceed();
  };

  const handleViewExisting = () => {
    if (result?.existingAssetId && onViewExisting) {
      onViewExisting(result.existingAssetId);
    }
  };

  // Don't show if no file, dismissed, checking, or no duplicate found
  if (!file || dismissed || isChecking || !result?.isDuplicate) {
    return null;
  }

  const confidencePercent = Math.round(result.confidence * 100);
  const isExactMatch = result.matchType === 'exact';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          'relative overflow-hidden rounded-lg border',
          isExactMatch
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-amber-500/10 border-amber-500/30',
          className
        )}
      >
        {/* Warning header */}
        <div className="flex items-start gap-3 p-4">
          <div
            className={clsx(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              isExactMatch ? 'bg-red-500/20' : 'bg-amber-500/20'
            )}
          >
            {isExactMatch ? (
              <Copy className="w-5 h-5 text-red-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4
              className={clsx(
                'font-medium',
                isExactMatch ? 'text-red-300' : 'text-amber-300'
              )}
            >
              {isExactMatch ? 'Duplicate Detected' : 'Similar Image Found'}
            </h4>
            <p className="text-sm text-slate-400 mt-1">
              {isExactMatch
                ? 'This image appears to be an exact duplicate of an existing asset.'
                : 'This image is visually similar to an existing asset in your library.'}
            </p>

            {/* Confidence indicator */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${confidencePercent}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={clsx(
                    'h-full rounded-full',
                    isExactMatch ? 'bg-red-500' : 'bg-amber-500'
                  )}
                />
              </div>
              <span
                className={clsx(
                  'text-xs font-medium',
                  isExactMatch ? 'text-red-400' : 'text-amber-400'
                )}
              >
                {confidencePercent}% match
              </span>
            </div>

            {/* Match details */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={clsx(
                  'px-2 py-1 rounded text-xs font-medium',
                  isExactMatch
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-amber-500/20 text-amber-300'
                )}
              >
                {result.matchType === 'exact' ? 'Exact Match' : 'Near Duplicate'}
              </span>
              {result.existingAssetId && (
                <span className="px-2 py-1 rounded text-xs bg-slate-700/50 text-slate-300">
                  Asset ID: {result.existingAssetId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>

          {/* Close button */}
          <IconButton
            icon={<X className="w-4 h-4" />}
            aria-label="Dismiss"
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-slate-500 hover:text-slate-300"
          />
        </div>

        {/* Action buttons */}
        <div className="px-4 pb-4 flex items-center gap-2">
          {result.existingAssetId && onViewExisting && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleViewExisting}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Existing
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200"
          >
            Cancel Upload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDismiss}
            className={clsx(
              'ml-auto',
              isExactMatch
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-amber-600 hover:bg-amber-500'
            )}
          >
            Upload Anyway
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Loading state component
export function DuplicateCheckLoading({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={clsx(
        'flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50',
        className
      )}
    >
      <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
      <span className="text-sm text-slate-400">Checking for duplicates...</span>
    </motion.div>
  );
}

// Inline duplicate indicator
interface DuplicateIndicatorProps {
  result: DuplicateResult;
  compact?: boolean;
  className?: string;
}

export function DuplicateIndicator({
  result,
  compact = false,
  className = '',
}: DuplicateIndicatorProps) {
  if (!result.isDuplicate) return null;

  const isExact = result.matchType === 'exact';
  const confidence = Math.round(result.confidence * 100);

  if (compact) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium',
          isExact
            ? 'bg-red-500/20 text-red-400'
            : 'bg-amber-500/20 text-amber-400',
          className
        )}
      >
        {isExact ? <Copy className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        <span>{confidence}%</span>
      </span>
    );
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        isExact
          ? 'bg-red-500/10 border border-red-500/20'
          : 'bg-amber-500/10 border border-amber-500/20',
        className
      )}
    >
      {isExact ? (
        <Copy className="w-4 h-4 text-red-400" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-amber-400" />
      )}
      <span
        className={clsx(
          'text-sm',
          isExact ? 'text-red-300' : 'text-amber-300'
        )}
      >
        {isExact ? 'Duplicate' : 'Similar'} ({confidence}% match)
      </span>
    </div>
  );
}
