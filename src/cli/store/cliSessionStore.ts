/**
 * CLI Session Store
 *
 * Zustand store with localStorage persistence for CLI sessions.
 * Story app uses a single-session model per feature (not the 4-session grid from vibeman).
 * Each feature module gets its own session identified by a string key.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QueuedTask } from '../types';
import type { SkillId } from '../skills';

// Session IDs — one per feature module
export type CLISessionId = string;

// Recovery state (ephemeral, not persisted)
export interface RecoveryState {
  inProgress: boolean;
  endTime: number;
}

// Session state
export interface CLISessionState {
  id: CLISessionId;
  projectPath: string | null;
  projectId: string | null;
  claudeSessionId: string | null; // For --resume flag
  currentExecutionId: string | null; // Active execution ID for reconnection
  currentTaskId: string | null; // Task ID associated with current execution
  queue: QueuedTask[];
  isRunning: boolean;
  autoStart: boolean;
  createdAt: number;
  lastActivityAt: number;
  completedCount: number;
  enabledSkills: SkillId[];
}

// Store state
interface CLISessionStoreState {
  sessions: Record<CLISessionId, CLISessionState>;
  recoveryState: RecoveryState;

  // Actions
  getOrCreateSession: (sessionId: CLISessionId) => CLISessionState;
  initSession: (sessionId: CLISessionId, projectPath: string, projectId?: string) => void;
  clearSession: (sessionId: CLISessionId) => void;
  addTasksToSession: (sessionId: CLISessionId, tasks: QueuedTask[]) => void;
  updateTaskStatus: (sessionId: CLISessionId, taskId: string, status: QueuedTask['status']) => void;
  removeTask: (sessionId: CLISessionId, taskId: string) => void;
  setClaudeSessionId: (sessionId: CLISessionId, claudeSessionId: string) => void;
  setCurrentExecution: (sessionId: CLISessionId, executionId: string | null, taskId: string | null) => void;
  setRunning: (sessionId: CLISessionId, isRunning: boolean) => void;
  setAutoStart: (sessionId: CLISessionId, autoStart: boolean) => void;
  updateLastActivity: (sessionId: CLISessionId) => void;
  toggleSkill: (sessionId: CLISessionId, skillId: SkillId) => void;
  setSkills: (sessionId: CLISessionId, skillIds: SkillId[]) => void;

  // Recovery
  startRecovery: (durationMs?: number) => void;
  endRecovery: () => void;
  getActiveSessions: () => CLISessionState[];
  getSessionsNeedingRecovery: () => CLISessionState[];
}

// Default session state
const createDefaultSession = (id: CLISessionId): CLISessionState => ({
  id,
  projectPath: null,
  projectId: null,
  claudeSessionId: null,
  currentExecutionId: null,
  currentTaskId: null,
  queue: [],
  isRunning: false,
  autoStart: false,
  createdAt: 0,
  lastActivityAt: 0,
  completedCount: 0,
  enabledSkills: [],
});

// Helper to ensure session exists
function ensureSession(
  sessions: Record<CLISessionId, CLISessionState>,
  sessionId: CLISessionId,
): Record<CLISessionId, CLISessionState> {
  if (sessions[sessionId]) return sessions;
  return { ...sessions, [sessionId]: createDefaultSession(sessionId) };
}

// Create store with persistence
export const useCLISessionStore = create<CLISessionStoreState>()(
  persist(
    (set, get) => ({
      sessions: {},
      recoveryState: {
        inProgress: false,
        endTime: 0,
      },

      getOrCreateSession: (sessionId) => {
        const { sessions } = get();
        if (sessions[sessionId]) return sessions[sessionId];
        const newSession = createDefaultSession(sessionId);
        set((state) => ({
          sessions: { ...state.sessions, [sessionId]: newSession },
        }));
        return newSession;
      },

      initSession: (sessionId, projectPath, projectId) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...sessions[sessionId],
                projectPath,
                projectId: projectId ?? sessions[sessionId].projectId,
                createdAt: Date.now(),
                lastActivityAt: Date.now(),
              },
            },
          };
        });
      },

      clearSession: (sessionId) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: createDefaultSession(sessionId),
          },
        }));
      },

      addTasksToSession: (sessionId, tasks) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          const session = sessions[sessionId];
          const existingIds = new Set(session.queue.map((t) => t.id));
          const newTasks = tasks.filter((t) => !existingIds.has(t.id));

          if (newTasks.length === 0) return state;

          const projectPath = session.projectPath || newTasks[0]?.projectPath || null;
          const projectId = session.projectId || newTasks[0]?.projectId || null;

          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...session,
                projectPath,
                projectId,
                queue: [...session.queue, ...newTasks],
                lastActivityAt: Date.now(),
              },
            },
          };
        });
      },

      updateTaskStatus: (sessionId, taskId, status) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          const session = sessions[sessionId];
          const task = session.queue.find((t) => t.id === taskId);
          const wasCompleted = task?.status === 'completed';
          const isNowCompleted = status === 'completed';
          const incrementCompleted = !wasCompleted && isNowCompleted ? 1 : 0;

          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...session,
                queue: session.queue.map((t) =>
                  t.id === taskId
                    ? {
                        ...t,
                        status,
                        ...(status === 'running' ? { startedAt: Date.now() } : {}),
                        ...(status === 'completed' || status === 'failed'
                          ? { completedAt: Date.now() }
                          : {}),
                      }
                    : t
                ),
                completedCount: session.completedCount + incrementCompleted,
                lastActivityAt: Date.now(),
              },
            },
          };
        });
      },

      removeTask: (sessionId, taskId) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          const session = sessions[sessionId];
          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...session,
                queue: session.queue.filter((t) => t.id !== taskId),
                lastActivityAt: Date.now(),
              },
            },
          };
        });
      },

      setClaudeSessionId: (sessionId, claudeSessionId) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...sessions[sessionId],
                claudeSessionId,
                lastActivityAt: Date.now(),
              },
            },
          };
        });
      },

      setCurrentExecution: (sessionId, executionId, taskId) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...sessions[sessionId],
                currentExecutionId: executionId,
                currentTaskId: taskId,
                lastActivityAt: Date.now(),
              },
            },
          };
        });
      },

      setRunning: (sessionId, isRunning) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...sessions[sessionId],
                isRunning,
                lastActivityAt: Date.now(),
              },
            },
          };
        });
      },

      setAutoStart: (sessionId, autoStart) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...sessions[sessionId],
                autoStart,
                lastActivityAt: Date.now(),
              },
            },
          };
        });
      },

      updateLastActivity: (sessionId) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...sessions[sessionId],
                lastActivityAt: Date.now(),
              },
            },
          };
        });
      },

      toggleSkill: (sessionId, skillId) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          const session = sessions[sessionId];
          const hasSkill = session.enabledSkills.includes(skillId);
          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...session,
                enabledSkills: hasSkill
                  ? session.enabledSkills.filter((s) => s !== skillId)
                  : [...session.enabledSkills, skillId],
              },
            },
          };
        });
      },

      setSkills: (sessionId, skillIds) => {
        set((state) => {
          const sessions = ensureSession(state.sessions, sessionId);
          return {
            sessions: {
              ...sessions,
              [sessionId]: {
                ...sessions[sessionId],
                enabledSkills: skillIds,
              },
            },
          };
        });
      },

      startRecovery: (durationMs = 10000) => {
        set({
          recoveryState: {
            inProgress: true,
            endTime: Date.now() + durationMs,
          },
        });
      },

      endRecovery: () => {
        set({
          recoveryState: {
            inProgress: false,
            endTime: 0,
          },
        });
      },

      getActiveSessions: () => {
        const { sessions } = get();
        return Object.values(sessions).filter(
          (s) => s.isRunning || s.queue.some((t) => t.status === 'running')
        );
      },

      getSessionsNeedingRecovery: () => {
        const { sessions } = get();
        return Object.values(sessions).filter((s) => {
          const hasRunningTask = s.queue.some((t) => t.status === 'running');
          const hasPendingTasks = s.queue.some((t) => t.status === 'pending');
          return hasRunningTask || (hasPendingTasks && s.autoStart);
        });
      },
    }),
    {
      name: 'story-cli-session-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessions: state.sessions,
      }),
    }
  )
);

// Hooks for common operations
export function useSession(sessionId: CLISessionId) {
  return useCLISessionStore((state) => state.sessions[sessionId]);
}

export function useAllSessions() {
  return useCLISessionStore((state) => state.sessions);
}

export function getActiveSessions(): CLISessionState[] {
  return useCLISessionStore.getState().getActiveSessions();
}

export function getSessionsNeedingRecovery(): CLISessionState[] {
  return useCLISessionStore.getState().getSessionsNeedingRecovery();
}
