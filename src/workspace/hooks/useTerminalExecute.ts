'use client';

import { useCallback } from 'react';
import { useCommandBarStore } from '../store/commandBarStore';
import { useCLISessionStore } from '@/cli/store/cliSessionStore';
import { createSkillTask, createPromptTask } from '@/cli/types';
import { useProjectStore } from '@/app/store/slices/projectSlice';

/**
 * Hook for panels to trigger CLI skill execution in the command bar.
 *
 * Provides execute() for skill-based execution and executePrompt() for freeform.
 * Auto-expands the command bar.
 */
export function useTerminalExecute() {
  const { selectedProject } = useProjectStore();
  const sessionId = useCommandBarStore((s) => s.sessionId);
  const expand = useCommandBarStore((s) => s.expand);
  const addTasksToSession = useCLISessionStore((s) => s.addTasksToSession);

  const execute = useCallback(
    (skillId: string, params?: Record<string, unknown>) => {
      if (!selectedProject?.id) return;
      expand();

      const contextParams = params
        ? Object.fromEntries(
            Object.entries(params).map(([k, v]) => [k, String(v)])
          )
        : undefined;

      const task = createSkillTask(
        selectedProject.id,
        selectedProject.id,
        skillId,
        `${skillId} via workspace`,
        contextParams
      );

      addTasksToSession(sessionId, [task]);
    },
    [sessionId, expand, selectedProject, addTasksToSession]
  );

  const executePrompt = useCallback(
    (text: string, label?: string) => {
      if (!selectedProject?.id) return;
      expand();

      const task = createPromptTask(
        selectedProject.id,
        selectedProject.id,
        text,
        label || 'Workspace prompt'
      );

      addTasksToSession(sessionId, [task]);
    },
    [sessionId, expand, selectedProject, addTasksToSession]
  );

  return { execute, executePrompt };
}
