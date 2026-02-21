/**
 * BatchStyler Component
 *
 * Regenerate multiple characters with style consistency.
 * Provides progress tracking, pause/resume/cancel controls,
 * and parallel generation options.
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Play,
  Pause,
  Square,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Image,
  Loader2,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import type { StyleDefinition } from '../lib/styleEngine';

// ============================================================================
// Types
// ============================================================================

interface Character {
  id: string;
  name: string;
  avatar_url?: string;
  consistencyScore?: number;
}

interface BatchJob {
  characterId: string;
  characterName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  progress: number;
  result?: {
    newAvatarUrl?: string;
    consistencyScore?: number;
    error?: string;
  };
  startTime?: number;
  endTime?: number;
}

interface BatchConfig {
  parallelJobs: number;
  retryOnFailure: boolean;
  maxRetries: number;
  skipHighScores: boolean;
  highScoreThreshold: number;
  preserveIdentity: boolean;
  identityStrength: number;
}

type BatchStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

interface BatchStylerProps {
  projectId: string;
  characters: Character[];
  styleDefinition: StyleDefinition;
  onComplete?: (results: BatchJob[]) => void;
  onCharacterUpdated?: (characterId: string, newAvatarUrl: string) => void;
  className?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: BatchConfig = {
  parallelJobs: 2,
  retryOnFailure: true,
  maxRetries: 2,
  skipHighScores: false,
  highScoreThreshold: 85,
  preserveIdentity: true,
  identityStrength: 70,
};

// ============================================================================
// Component
// ============================================================================

export function BatchStyler({
  projectId,
  characters,
  styleDefinition,
  onComplete,
  onCharacterUpdated,
  className,
}: BatchStylerProps) {
  // State
  const [status, setStatus] = useState<BatchStatus>('idle');
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [config, setConfig] = useState<BatchConfig>(defaultConfig);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(
    new Set(characters.map(c => c.id))
  );

  // Refs for controlling the batch process
  const abortControllerRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);

  // Computed values
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const totalJobs = jobs.length;
  const overallProgress = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

  // Initialize jobs from selected characters
  const initializeJobs = useCallback(() => {
    const newJobs: BatchJob[] = characters
      .filter(c => selectedCharacters.has(c.id))
      .map(c => ({
        characterId: c.id,
        characterName: c.name,
        status: 'pending' as const,
        progress: 0,
      }));

    // Filter out high-scoring characters if configured
    if (config.skipHighScores) {
      return newJobs.map(job => {
        const character = characters.find(c => c.id === job.characterId);
        if (character?.consistencyScore && character.consistencyScore >= config.highScoreThreshold) {
          return { ...job, status: 'skipped' as const, progress: 100 };
        }
        return job;
      });
    }

    return newJobs;
  }, [characters, selectedCharacters, config.skipHighScores, config.highScoreThreshold]);

  // Simulate processing a single character (mock implementation)
  const processCharacter = async (
    job: BatchJob,
    signal: AbortSignal
  ): Promise<BatchJob> => {
    const startTime = Date.now();

    try {
      // Simulate processing with progress updates
      for (let progress = 0; progress <= 100; progress += 10) {
        if (signal.aborted) {
          throw new Error('Aborted');
        }

        // Check if paused
        while (pausedRef.current && !signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

        // Update progress
        setJobs(prev =>
          prev.map(j =>
            j.characterId === job.characterId ? { ...j, progress, status: 'processing' } : j
          )
        );
      }

      // Simulate success (90% success rate)
      const success = Math.random() > 0.1;
      const endTime = Date.now();

      if (success) {
        const newScore = 70 + Math.floor(Math.random() * 30);
        const result = {
          newAvatarUrl: `/api/placeholder/avatar/${job.characterId}?style=${styleDefinition.id}&t=${Date.now()}`,
          consistencyScore: newScore,
        };

        onCharacterUpdated?.(job.characterId, result.newAvatarUrl);

        return {
          ...job,
          status: 'completed',
          progress: 100,
          result,
          startTime,
          endTime,
        };
      } else {
        throw new Error('Style generation failed');
      }
    } catch (error) {
      const endTime = Date.now();
      return {
        ...job,
        status: 'failed',
        progress: 0,
        result: { error: error instanceof Error ? error.message : 'Unknown error' },
        startTime,
        endTime,
      };
    }
  };

  // Run batch process
  const runBatch = async () => {
    const initialJobs = initializeJobs();
    setJobs(initialJobs);
    setStatus('running');
    pausedRef.current = false;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const pendingJobs = initialJobs.filter(j => j.status === 'pending');
    const processingQueue = [...pendingJobs];
    const activeJobs = new Map<string, Promise<BatchJob>>();

    const updateJob = (updatedJob: BatchJob) => {
      setJobs(prev =>
        prev.map(j => (j.characterId === updatedJob.characterId ? updatedJob : j))
      );
    };

    while (processingQueue.length > 0 || activeJobs.size > 0) {
      if (controller.signal.aborted) {
        break;
      }

      // Start new jobs up to parallel limit
      while (activeJobs.size < config.parallelJobs && processingQueue.length > 0) {
        const job = processingQueue.shift()!;
        const promise = processCharacter(job, controller.signal).then(result => {
          activeJobs.delete(job.characterId);
          updateJob(result);

          // Retry on failure if configured
          if (result.status === 'failed' && config.retryOnFailure) {
            const retryCount = (job as BatchJob & { retryCount?: number }).retryCount || 0;
            if (retryCount < config.maxRetries) {
              processingQueue.push({ ...job, retryCount: retryCount + 1 } as BatchJob);
            }
          }

          return result;
        });

        activeJobs.set(job.characterId, promise);
      }

      // Wait for at least one job to complete
      if (activeJobs.size > 0) {
        await Promise.race(Array.from(activeJobs.values()));
      }
    }

    // Final status update
    setJobs(prev => {
      const finalJobs = prev;
      const allCompleted = finalJobs.every(
        j => j.status === 'completed' || j.status === 'failed' || j.status === 'skipped'
      );

      if (allCompleted && !controller.signal.aborted) {
        setStatus('completed');
        onComplete?.(finalJobs);
      } else if (controller.signal.aborted) {
        setStatus('cancelled');
      }

      return finalJobs;
    });
  };

  // Control handlers
  const handleStart = () => {
    runBatch();
  };

  const handlePause = () => {
    pausedRef.current = true;
    setStatus('paused');
  };

  const handleResume = () => {
    pausedRef.current = false;
    setStatus('running');
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setStatus('cancelled');
  };

  const handleReset = () => {
    setJobs([]);
    setStatus('idle');
    pausedRef.current = false;
  };

  const toggleCharacter = (characterId: string) => {
    setSelectedCharacters(prev => {
      const next = new Set(prev);
      if (next.has(characterId)) {
        next.delete(characterId);
      } else {
        next.add(characterId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedCharacters(new Set(characters.map(c => c.id)));
  };

  const selectNone = () => {
    setSelectedCharacters(new Set());
  };

  // Status icon helper
  const getStatusIcon = (jobStatus: BatchJob['status']) => {
    switch (jobStatus) {
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Wand2 className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-slate-100">Batch Styler</h3>
            <p className="text-sm text-slate-400">
              Regenerate characters with consistent style
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
          {showConfig ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg space-y-4">
              {/* Parallel Jobs */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Parallel Jobs
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={config.parallelJobs}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, parallelJobs: parseInt(e.target.value) }))
                    }
                    className="flex-1 accent-cyan-500"
                    disabled={status === 'running'}
                  />
                  <span className="text-sm text-slate-400 w-8">{config.parallelJobs}</span>
                </div>
              </div>

              {/* Skip High Scores */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Skip High Consistency Scores
                  </label>
                  <p className="text-xs text-slate-500">
                    Skip characters already above threshold
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.skipHighScores}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, skipHighScores: e.target.checked }))
                    }
                    className="sr-only peer"
                    disabled={status === 'running'}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white" />
                </label>
              </div>

              {config.skipHighScores && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Score Threshold: {config.highScoreThreshold}%
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={config.highScoreThreshold}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        highScoreThreshold: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-500"
                    disabled={status === 'running'}
                  />
                </div>
              )}

              {/* Identity Preservation */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Preserve Character Identity
                  </label>
                  <p className="text-xs text-slate-500">
                    Maintain distinctive features during style transfer
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.preserveIdentity}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, preserveIdentity: e.target.checked }))
                    }
                    className="sr-only peer"
                    disabled={status === 'running'}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white" />
                </label>
              </div>

              {config.preserveIdentity && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Identity Strength: {config.identityStrength}%
                  </label>
                  <input
                    type="range"
                    min={30}
                    max={100}
                    value={config.identityStrength}
                    onChange={e =>
                      setConfig(prev => ({
                        ...prev,
                        identityStrength: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-500"
                    disabled={status === 'running'}
                  />
                </div>
              )}

              {/* Retry on Failure */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-300">
                    Retry Failed Jobs
                  </label>
                  <p className="text-xs text-slate-500">
                    Automatically retry up to {config.maxRetries} times
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.retryOnFailure}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, retryOnFailure: e.target.checked }))
                    }
                    className="sr-only peer"
                    disabled={status === 'running'}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white" />
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Character Selection (only when idle) */}
      {status === 'idle' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              Select Characters ({selectedCharacters.size} of {characters.length})
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={selectNone}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                Select None
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
            {characters.map(character => (
              <button
                key={character.id}
                onClick={() => toggleCharacter(character.id)}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border transition-colors text-left',
                  selectedCharacters.has(character.id)
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-slate-100'
                    : 'bg-slate-800/30 border-slate-700/30 text-slate-400 hover:border-slate-600'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-slate-700/50 overflow-hidden flex-shrink-0">
                  {character.avatar_url ? (
                    <img
                      src={character.avatar_url}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                </div>
                <span className="text-sm truncate">{character.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress Overview */}
      {status !== 'idle' && (
        <div className="space-y-4">
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-300">
                Overall Progress: {completedJobs}/{totalJobs} characters
              </span>
              <span className="text-cyan-400">{overallProgress}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30 text-center">
              <div className="text-2xl font-semibold text-green-400">{completedJobs}</div>
              <div className="text-xs text-slate-400">Completed</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30 text-center">
              <div className="text-2xl font-semibold text-cyan-400">
                {jobs.filter(j => j.status === 'processing').length}
              </div>
              <div className="text-xs text-slate-400">Processing</div>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/30 text-center">
              <div className="text-2xl font-semibold text-red-400">{failedJobs}</div>
              <div className="text-xs text-slate-400">Failed</div>
            </div>
          </div>

          {/* Job List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {jobs.map(job => (
              <div
                key={job.characterId}
                className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30"
              >
                {getStatusIcon(job.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200 truncate">
                      {job.characterName}
                    </span>
                    {job.result?.consistencyScore && (
                      <span className="text-xs text-cyan-400">
                        {job.result.consistencyScore}%
                      </span>
                    )}
                  </div>
                  {job.status === 'processing' && (
                    <div className="mt-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-cyan-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}
                  {job.status === 'failed' && job.result?.error && (
                    <p className="text-xs text-red-400 mt-1">{job.result.error}</p>
                  )}
                  {job.status === 'skipped' && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Skipped (score above threshold)
                    </p>
                  )}
                </div>
                {job.status === 'completed' && job.result?.newAvatarUrl && (
                  <div className="w-10 h-10 rounded-lg bg-slate-700/50 overflow-hidden">
                    <Image className="w-full h-full p-2 text-slate-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {status === 'idle' && (
          <button
            onClick={handleStart}
            disabled={selectedCharacters.size === 0}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              selectedCharacters.size > 0
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            <Play className="w-4 h-4" />
            Start Batch ({selectedCharacters.size})
          </button>
        )}

        {status === 'running' && (
          <>
            <button
              onClick={handlePause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg font-medium transition-colors"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
            >
              <Square className="w-4 h-4" />
              Cancel
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              onClick={handleResume}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-lg font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              Resume
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
            >
              <Square className="w-4 h-4" />
              Cancel
            </button>
          </>
        )}

        {(status === 'completed' || status === 'cancelled') && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Start New Batch
          </button>
        )}

        {/* Style Info */}
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-400">
          <Zap className="w-4 h-4" />
          <span>Style: {styleDefinition.name || styleDefinition.artDirection}</span>
        </div>
      </div>

      {/* Completion Summary */}
      {status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <div>
              <h4 className="font-medium text-green-400">Batch Complete</h4>
              <p className="text-sm text-slate-300">
                Successfully styled {completedJobs} of {totalJobs} characters.
                {failedJobs > 0 && ` ${failedJobs} failed.`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {status === 'cancelled' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <div>
              <h4 className="font-medium text-yellow-400">Batch Cancelled</h4>
              <p className="text-sm text-slate-300">
                Processed {completedJobs} of {totalJobs} characters before cancellation.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default BatchStyler;
