'use client';

/**
 * useCLIFeature — Shared hook for feature-level CLI integration
 *
 * Each feature module (Simulator, Characters, Story, etc.) uses this hook
 * to manage its CLI session, execute skills, parse results, and invalidate
 * TanStack Query caches after write-through operations.
 *
 * Usage:
 *   const cli = useCLIFeature({
 *     featureId: 'characters',
 *     projectId,
 *     projectPath: '/path/to/project',
 *     defaultSkills: ['character-backstory', 'character-traits'],
 *   });
 *
 *   // Execute a skill
 *   cli.execute('character-backstory', { characterId: 'char-1' });
 *
 *   // Check status
 *   if (cli.isRunning) { ... }
 *
 *   // Read result
 *   const result = cli.lastResult; // parsed JSON or text
 */

import { useCallback, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCLISessionStore,
  type CLISessionId,
} from '@/cli/store';
import { createSkillTask, createPromptTask } from '@/cli/types';
import type { QueuedTask, ExecutionResult } from '@/cli/types';
import type { SkillId } from '@/cli/skills';
import { resolveQueryKeys } from '@/cli/queryInvalidationMap';

// ============ Types ============

export interface UseCLIFeatureOptions {
  /** Unique feature identifier — used as session ID prefix */
  featureId: string;
  /** Current project ID */
  projectId: string;
  /** Absolute path to the project directory (for CLI --project flag) */
  projectPath: string;
  /** Default skills to enable for this feature */
  defaultSkills?: SkillId[];
  /** Callback when a skill execution completes */
  onComplete?: (skillId: string, success: boolean, result?: ExecutionResult) => void;
  /** Callback with parsed result data (JSON skills return parsed object) */
  onResult?: (data: unknown) => void;
}

export interface UseCLIFeatureReturn {
  /** Execute a skill with optional context parameters */
  execute: (skillId: SkillId, contextParams?: Record<string, string>) => void;
  /** Execute a direct prompt (no skill) */
  executePrompt: (prompt: string, label?: string) => void;
  /** Whether a task is currently running */
  isRunning: boolean;
  /** Current task queue */
  queue: QueuedTask[];
  /** Last execution result metadata */
  lastResult: ExecutionResult | null;
  /** Session ID for this feature */
  sessionId: CLISessionId;
  /** Enabled skills for this session */
  enabledSkills: SkillId[];
  /** Toggle a skill on/off */
  toggleSkill: (skillId: SkillId) => void;
  /** Set all enabled skills */
  setSkills: (skillIds: SkillId[]) => void;
  /** Clear session (reset queue and state) */
  clearSession: () => void;
  /** Task lifecycle callbacks for CompactTerminal/InlineTerminal */
  terminalProps: {
    instanceId: string;
    projectPath: string;
    taskQueue: QueuedTask[];
    autoStart: boolean;
    enabledSkills: SkillId[];
    onTaskStart: (taskId: string) => void;
    onTaskComplete: (taskId: string, success: boolean) => void;
    onQueueEmpty: () => void;
    currentExecutionId: string | null;
    currentStoredTaskId: string | null;
    onExecutionChange: (executionId: string | null, taskId: string | null) => void;
  };
}

// ============ Hook ============

export function useCLIFeature(options: UseCLIFeatureOptions): UseCLIFeatureReturn {
  const {
    featureId,
    projectId,
    projectPath,
    defaultSkills = [],
    onComplete,
    onResult,
  } = options;

  const queryClient = useQueryClient();

  // Session ID = feature + project
  const sessionId: CLISessionId = `${featureId}-${projectId}`;

  // Track last completed skill for invalidation
  const lastSkillRef = useRef<{ skillId: string; contextParams?: Record<string, string> } | null>(null);
  const lastResultRef = useRef<ExecutionResult | null>(null);

  // Store selectors
  const session = useCLISessionStore((state) => state.sessions[sessionId]);
  const initSession = useCLISessionStore((state) => state.initSession);
  const addTasksToSession = useCLISessionStore((state) => state.addTasksToSession);
  const updateTaskStatus = useCLISessionStore((state) => state.updateTaskStatus);
  const setAutoStart = useCLISessionStore((state) => state.setAutoStart);
  const setRunning = useCLISessionStore((state) => state.setRunning);
  const toggleSkillAction = useCLISessionStore((state) => state.toggleSkill);
  const setSkillsAction = useCLISessionStore((state) => state.setSkills);
  const clearSessionAction = useCLISessionStore((state) => state.clearSession);
  const setCurrentExecution = useCLISessionStore((state) => state.setCurrentExecution);

  // Ensure session exists with defaults
  const ensureSession = useCallback(() => {
    if (!session) {
      initSession(sessionId, projectPath, projectId);
      if (defaultSkills.length > 0) {
        setSkillsAction(sessionId, defaultSkills);
      }
    }
  }, [session, sessionId, projectPath, projectId, defaultSkills, initSession, setSkillsAction]);

  // ============ Execute Skill ============

  const execute = useCallback(
    (skillId: SkillId, contextParams?: Record<string, string>) => {
      ensureSession();

      const task = createSkillTask(
        projectId,
        projectPath,
        skillId,
        `Run ${skillId}`,
        contextParams,
      );

      // Track for post-completion invalidation
      lastSkillRef.current = { skillId, contextParams };

      addTasksToSession(sessionId, [task]);
      setAutoStart(sessionId, true);
    },
    [ensureSession, projectId, projectPath, sessionId, addTasksToSession, setAutoStart],
  );

  // ============ Execute Direct Prompt ============

  const executePrompt = useCallback(
    (prompt: string, label?: string) => {
      ensureSession();

      const task = createPromptTask(
        projectId,
        projectPath,
        prompt,
        label || 'Custom prompt',
      );

      lastSkillRef.current = null;
      addTasksToSession(sessionId, [task]);
      setAutoStart(sessionId, true);
    },
    [ensureSession, projectId, projectPath, sessionId, addTasksToSession, setAutoStart],
  );

  // ============ Task Lifecycle Callbacks ============

  const handleTaskStart = useCallback(
    (taskId: string) => {
      updateTaskStatus(sessionId, taskId, 'running');
      setRunning(sessionId, true);
    },
    [sessionId, updateTaskStatus, setRunning],
  );

  const handleTaskComplete = useCallback(
    (taskId: string, success: boolean) => {
      updateTaskStatus(sessionId, taskId, success ? 'completed' : 'failed');

      // Invalidate query cache for write-through skills
      if (success && lastSkillRef.current) {
        const { skillId, contextParams } = lastSkillRef.current;
        const context = { projectId, ...contextParams };
        const keysToInvalidate = resolveQueryKeys(skillId, context);

        for (const queryKey of keysToInvalidate) {
          // Skip keys with unresolved $tokens
          if (queryKey.some((s) => s.startsWith('$'))) continue;
          queryClient.invalidateQueries({ queryKey });
        }

        onComplete?.(skillId, success);
      }
    },
    [sessionId, projectId, updateTaskStatus, queryClient, onComplete],
  );

  const handleQueueEmpty = useCallback(() => {
    setRunning(sessionId, false);
    setAutoStart(sessionId, false);
  }, [sessionId, setRunning, setAutoStart]);

  const handleExecutionChange = useCallback(
    (executionId: string | null, taskId: string | null) => {
      setCurrentExecution(sessionId, executionId, taskId);
    },
    [sessionId, setCurrentExecution],
  );

  // ============ Skill Management ============

  const toggleSkill = useCallback(
    (skillId: SkillId) => {
      ensureSession();
      toggleSkillAction(sessionId, skillId);
    },
    [ensureSession, sessionId, toggleSkillAction],
  );

  const setSkills = useCallback(
    (skillIds: SkillId[]) => {
      ensureSession();
      setSkillsAction(sessionId, skillIds);
    },
    [ensureSession, sessionId, setSkillsAction],
  );

  const clearSession = useCallback(() => {
    clearSessionAction(sessionId);
  }, [sessionId, clearSessionAction]);

  // ============ Derived State ============

  const isRunning = session?.isRunning ?? false;
  const queue = session?.queue ?? [];
  const enabledSkills = session?.enabledSkills ?? defaultSkills;
  const currentExecutionId = session?.currentExecutionId ?? null;
  const currentTaskId = session?.currentTaskId ?? null;

  // ============ Terminal Props (pass directly to CompactTerminal/InlineTerminal) ============

  const terminalProps = useMemo(
    () => ({
      instanceId: sessionId,
      projectPath,
      taskQueue: queue,
      autoStart: session?.autoStart ?? false,
      enabledSkills,
      onTaskStart: handleTaskStart,
      onTaskComplete: handleTaskComplete,
      onQueueEmpty: handleQueueEmpty,
      currentExecutionId,
      currentStoredTaskId: currentTaskId,
      onExecutionChange: handleExecutionChange,
    }),
    [
      sessionId,
      projectPath,
      queue,
      session?.autoStart,
      enabledSkills,
      handleTaskStart,
      handleTaskComplete,
      handleQueueEmpty,
      currentExecutionId,
      currentTaskId,
      handleExecutionChange,
    ],
  );

  return {
    execute,
    executePrompt,
    isRunning,
    queue,
    lastResult: lastResultRef.current,
    sessionId,
    enabledSkills,
    toggleSkill,
    setSkills,
    clearSession,
    terminalProps,
  };
}
