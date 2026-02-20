'use client';

/**
 * ImprovementIndicator — Shows detected CLI patterns and offers to fix them.
 *
 * Renders a compact badge in the terminal footer. When expanded, lists
 * top patterns with severity, count, and a "Fix Now" button that spawns
 * the improvement meta-agent.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Zap, ChevronUp, ChevronDown, AlertTriangle, Info, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/utils';

interface Pattern {
  fingerprint: string;
  type: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  count: number;
  toolName?: string;
  errorMessage?: string;
  suggestedFix?: string;
}

interface ImprovementIndicatorProps {
  onStartImprovement: (executionId: string, streamUrl: string) => void;
  refreshTrigger?: number;
}

const SEVERITY_ICON: Record<string, React.ElementType> = {
  high: AlertCircle,
  medium: AlertTriangle,
  low: Info,
};

const SEVERITY_COLOR: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-slate-400',
};

const SEVERITY_BG: Record<string, string> = {
  high: 'bg-red-500/10',
  medium: 'bg-amber-500/10',
  low: 'bg-slate-500/10',
};

export default function ImprovementIndicator({
  onStartImprovement,
  refreshTrigger,
}: ImprovementIndicatorProps) {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  // Fetch patterns from API
  const fetchPatterns = useCallback(async () => {
    try {
      const res = await fetch('/api/claude-terminal/improve');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.patterns)) {
        setPatterns(data.patterns);
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Fetch on mount and when refresh trigger changes
  useEffect(() => {
    fetchPatterns();
  }, [fetchPatterns, refreshTrigger]);

  // Handle fix button
  const handleFix = useCallback(async (fingerprints?: string[]) => {
    setIsFixing(true);
    try {
      const res = await fetch('/api/claude-terminal/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patternFingerprints: fingerprints }),
      });
      const data = await res.json();
      if (data.success) {
        onStartImprovement(data.executionId, data.streamUrl);
        // Remove fixed patterns from local state
        if (data.resolvedFingerprints) {
          const resolved = new Set(data.resolvedFingerprints);
          setPatterns(prev => prev.filter(p => !resolved.has(p.fingerprint)));
        }
        setExpanded(false);
      }
    } catch {
      // Non-critical
    } finally {
      setIsFixing(false);
    }
  }, [onStartImprovement]);

  // Don't render if no patterns
  if (patterns.length === 0) return null;

  const highCount = patterns.filter(p => p.severity === 'high').length;
  const badgeColor = highCount > 0 ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';

  return (
    <div className="border-t border-slate-800/50">
      {/* Collapsed badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-1.5 w-full px-3 py-1 text-[10px] transition-colors',
          'hover:bg-slate-800/50',
        )}
      >
        <Zap className={cn('w-3 h-3', highCount > 0 ? 'text-red-400' : 'text-amber-400')} />
        <span className={cn('font-mono px-1 py-0.5 rounded', badgeColor)}>
          {patterns.length}
        </span>
        <span className="text-slate-400">
          pattern{patterns.length !== 1 ? 's' : ''} detected
        </span>
        <div className="flex-1" />
        {expanded ? (
          <ChevronDown className="w-3 h-3 text-slate-600" />
        ) : (
          <ChevronUp className="w-3 h-3 text-slate-600" />
        )}
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1 max-h-[200px] overflow-y-auto">
              {patterns.slice(0, 5).map((pattern) => {
                const SevIcon = SEVERITY_ICON[pattern.severity] || Info;
                const sevColor = SEVERITY_COLOR[pattern.severity] || 'text-slate-400';
                const sevBg = SEVERITY_BG[pattern.severity] || 'bg-slate-500/10';

                return (
                  <div
                    key={pattern.fingerprint}
                    className={cn('flex items-start gap-1.5 rounded px-2 py-1 text-[10px]', sevBg)}
                  >
                    <SevIcon className={cn('w-3 h-3 mt-0.5 shrink-0', sevColor)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-300 font-medium">{pattern.type}</span>
                        {pattern.toolName && (
                          <span className="text-amber-300/70">{pattern.toolName}</span>
                        )}
                        <span className="text-slate-600">x{pattern.count}</span>
                      </div>
                      {pattern.suggestedFix && (
                        <div className="text-slate-500 truncate">{pattern.suggestedFix}</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Fix All button */}
              <button
                onClick={() => handleFix()}
                disabled={isFixing}
                className={cn(
                  'w-full flex items-center justify-center gap-1.5 mt-1',
                  'rounded py-1 text-[10px] font-medium transition-colors',
                  'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {isFixing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Starting improvement...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Fix All ({patterns.length})
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
