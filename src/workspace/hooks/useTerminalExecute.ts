'use client';

import { useCallback } from 'react';
import { useTerminalDockStore } from '../store/terminalDockStore';
import { useCLISessionStore } from '@/cli/store/cliSessionStore';
import { createSkillTask, createPromptTask } from '@/cli/types';
import { useProjectStore } from '@/app/store/slices/projectSlice';

/**
 * Hook for panels to trigger CLI skill execution in the active terminal tab.
 *
 * Provides execute() for skill-based execution and executePrompt() for freeform.
 * Auto-expands the terminal dock if collapsed.
 */
export function useTerminalExecute() {
  const { selectedProject } = useProjectStore();
  const createTab = useTerminalDockStore((s) => s.createTab);
  const getActiveTab = useTerminalDockStore((s) => s.getActiveTab);
  const setCollapsed = useTerminalDockStore((s) => s.setCollapsed);
  const addTasksToSession = useCLISessionStore((s) => s.addTasksToSession);

  const ensureActiveTab = useCallback(() => {
    let tab = getActiveTab();
    if (!tab) {
      tab = createTab();
    }
    setCollapsed(false);
    return tab;
  }, [getActiveTab, createTab, setCollapsed]);

  const execute = useCallback(
    (skillId: string, params?: Record<string, unknown>) => {
      const tab = ensureActiveTab();
      if (!selectedProject?.id) return;

      const projectPath = selectedProject?.id || '';
      const contextParams = params
        ? Object.fromEntries(
            Object.entries(params).map(([k, v]) => [k, String(v)])
          )
        : undefined;

      const task = createSkillTask(
        selectedProject.id,
        projectPath,
        skillId,
        `${skillId} via workspace`,
        contextParams
      );

      addTasksToSession(tab.sessionId, [task]);
    },
    [ensureActiveTab, selectedProject, addTasksToSession]
  );

  const executePrompt = useCallback(
    (text: string, label?: string) => {
      const tab = ensureActiveTab();
      if (!selectedProject?.id) return;

      const projectPath = selectedProject?.id || '';

      const task = createPromptTask(
        selectedProject.id,
        projectPath,
        text,
        label || 'Workspace prompt'
      );

      addTasksToSession(tab.sessionId, [task]);
    },
    [ensureActiveTab, selectedProject, addTasksToSession]
  );

  return { execute, executePrompt };
}
