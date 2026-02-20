/**
 * CLI Component Types
 *
 * Shared types for CLI terminal components and task queue integration.
 * Adapted from vibeman CLI for Story app's storytelling workflows.
 */

import type { SkillId } from './skills';

/**
 * Task queued for CLI execution
 */
export interface QueuedTask {
  id: string;
  projectId: string;
  projectPath: string;
  /** Skill to execute (e.g., 'character-backstory', 'story-next-steps') */
  skillId?: string;
  /** Direct prompt content — if provided, executes this instead of a skill */
  directPrompt?: string;
  /** Human-readable label for display */
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  addedAt: number;
  startedAt?: number;
  completedAt?: number;
  /** Context params to pass to the skill (e.g., characterId, sceneId) */
  contextParams?: Record<string, string>;
}

/**
 * File change tracking
 */
export interface FileChange {
  id: string;
  sessionId: string;
  filePath: string;
  changeType: 'edit' | 'write' | 'read' | 'delete';
  timestamp: number;
  toolUseId?: string;
  preview?: string;
}

/**
 * Log entry for terminal display
 */
export interface LogEntry {
  id: string;
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system' | 'error';
  content: string;
  timestamp: number;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  model?: string;
}

/**
 * Execution info from CLI (on connection)
 */
export interface ExecutionInfo {
  sessionId?: string;
  model?: string;
  tools?: string[];
  version?: string;
}

/**
 * Execution result from CLI (on completion)
 */
export interface ExecutionResult {
  sessionId?: string;
  usage?: { inputTokens: number; outputTokens: number };
  durationMs?: number;
  totalCostUsd?: number;
  isError?: boolean;
}

// Re-export SkillId for consumers of this types module
export type { SkillId } from './skills';

/**
 * Props for CompactTerminal with task queue
 */
export interface CompactTerminalProps {
  instanceId: string;
  projectPath: string;
  title?: string;
  className?: string;
  // Task queue integration
  taskQueue?: QueuedTask[];
  onTaskStart?: (taskId: string) => void;
  onTaskComplete?: (taskId: string, success: boolean) => void;
  onQueueEmpty?: () => void;
  autoStart?: boolean;
  // Context from workspace selection
  actId?: string;
  sceneId?: string;
  // Skills for specialized instructions
  enabledSkills?: SkillId[];
  // Background processing support
  currentExecutionId?: string | null;
  currentStoredTaskId?: string | null;
  onExecutionChange?: (executionId: string | null, taskId: string | null) => void;
  /** V2 workspace integration: intercept tool_use events. Return true if handled. */
  onToolUse?: (toolName: string, toolInput: Record<string, unknown>) => boolean;
  /** V2 workspace integration: fires when user submits a prompt, before execution starts. */
  onPromptSubmit?: (prompt: string) => void;
  /** V2 workspace integration: fires when CLI execution finishes (result or error). */
  onExecutionComplete?: (success: boolean) => void;
}

/**
 * Props for InlineTerminal (lightweight embedded variant)
 */
export interface InlineTerminalProps {
  instanceId: string;
  projectPath: string;
  className?: string;
  /** Fixed height in px or CSS value */
  height?: number | string;
  /** Allow user to collapse/expand */
  collapsible?: boolean;
  /** Callback with parsed result data */
  onResult?: (data: Record<string, unknown>) => void;
  /** Expected output format from the skill */
  outputFormat?: 'json' | 'text' | 'streaming';
}

/**
 * Create a QueuedTask from a skill invocation
 */
export function createSkillTask(
  projectId: string,
  projectPath: string,
  skillId: string,
  label: string,
  contextParams?: Record<string, string>,
): QueuedTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    projectPath,
    skillId,
    label,
    status: 'pending',
    addedAt: Date.now(),
    contextParams,
  };
}

/**
 * Create a QueuedTask from a direct prompt
 */
export function createPromptTask(
  projectId: string,
  projectPath: string,
  prompt: string,
  label: string,
): QueuedTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    projectPath,
    directPrompt: prompt,
    label,
    status: 'pending',
    addedAt: Date.now(),
  };
}
