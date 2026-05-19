/**
 * Advisor Memory Store — Persistent learning layer for the advisor.
 *
 * Tracks user behavior signals to personalize advisor responses:
 * - Layout preferences: which panels/layouts the user prefers
 * - Suggestion outcomes: which suggestions get accepted vs dismissed
 * - Workflow patterns: common panel transitions and tool usage
 *
 * Persisted to localStorage. The compressed summary is sent with
 * each advisor request to inject into the system instruction.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ──────────────────────────────────────

/** Tracks how often a layout+panels combination is used */
interface LayoutPreference {
  layout: string;
  panels: string[];
  /** Number of times user had this exact layout active for >10s */
  count: number;
  lastUsed: number;
}

/** Tracks suggestion accept/dismiss rates by content pattern */
interface SuggestionOutcome {
  /** First 60 chars of the suggestion content as a key */
  pattern: string;
  accepted: number;
  dismissed: number;
  lastSeen: number;
}

/** Tracks user thumbs-up/thumbs-down ratings on advisor responses */
interface ResponseRating {
  /** First 80 chars of the response content as a key */
  pattern: string;
  positive: number;
  negative: number;
  lastRated: number;
}

/** Tracks common domain transitions (e.g. story→image, character→scene) */
interface WorkflowTransition {
  from: string;
  to: string;
  count: number;
}

interface AdvisorMemoryState {
  // Learned preferences
  layoutPreferences: LayoutPreference[];
  suggestionOutcomes: SuggestionOutcome[];
  workflowTransitions: WorkflowTransition[];
  /** User ratings on advisor responses */
  responseRatings: ResponseRating[];
  /** Preferred panel density per panel type */
  densityPreferences: Record<string, string>;
  /** Total advisor interactions for decay calculations */
  totalInteractions: number;
  /** Last time the memory was updated */
  lastUpdated: number;

  // Actions
  recordLayoutUsage: (layout: string, panels: string[]) => void;
  recordSuggestionOutcome: (pattern: string, accepted: boolean) => void;
  recordWorkflowTransition: (from: string, to: string) => void;
  recordResponseRating: (content: string, positive: boolean) => void;
  recordDensityPreference: (panelType: string, density: string) => void;
  incrementInteractions: () => void;

  /** Generate a compressed text summary for the system instruction */
  getMemorySummary: () => string;
}

// ─── Constants ──────────────────────────────────

const MAX_LAYOUT_PREFERENCES = 10;
const MAX_SUGGESTION_OUTCOMES = 20;
const MAX_WORKFLOW_TRANSITIONS = 15;
const MAX_RESPONSE_RATINGS = 30;

// ─── Store ──────────────────────────────────────

export const useAdvisorMemoryStore = create<AdvisorMemoryState>()(
  persist(
    (set, get) => ({
      layoutPreferences: [],
      suggestionOutcomes: [],
      workflowTransitions: [],
      responseRatings: [],
      densityPreferences: {},
      totalInteractions: 0,
      lastUpdated: Date.now(),

      recordLayoutUsage: (layout, panels) =>
        set((state) => {
          const key = `${layout}:${panels.sort().join(',')}`;
          const existing = state.layoutPreferences.find(
            (p) => `${p.layout}:${p.panels.sort().join(',')}` === key,
          );

          let updated: LayoutPreference[];
          if (existing) {
            updated = state.layoutPreferences.map((p) =>
              `${p.layout}:${p.panels.sort().join(',')}` === key
                ? { ...p, count: p.count + 1, lastUsed: Date.now() }
                : p,
            );
          } else {
            updated = [
              ...state.layoutPreferences,
              { layout, panels: panels.sort(), count: 1, lastUsed: Date.now() },
            ];
          }

          // Keep top N by count, with recency tiebreaker
          updated.sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed);
          return {
            layoutPreferences: updated.slice(0, MAX_LAYOUT_PREFERENCES),
            lastUpdated: Date.now(),
          };
        }),

      recordSuggestionOutcome: (pattern, accepted) =>
        set((state) => {
          const trimmed = pattern.slice(0, 60);
          const existing = state.suggestionOutcomes.find((s) => s.pattern === trimmed);

          let updated: SuggestionOutcome[];
          if (existing) {
            updated = state.suggestionOutcomes.map((s) =>
              s.pattern === trimmed
                ? {
                    ...s,
                    accepted: s.accepted + (accepted ? 1 : 0),
                    dismissed: s.dismissed + (accepted ? 0 : 1),
                    lastSeen: Date.now(),
                  }
                : s,
            );
          } else {
            updated = [
              ...state.suggestionOutcomes,
              {
                pattern: trimmed,
                accepted: accepted ? 1 : 0,
                dismissed: accepted ? 0 : 1,
                lastSeen: Date.now(),
              },
            ];
          }

          // Keep most recent
          updated.sort((a, b) => b.lastSeen - a.lastSeen);
          return {
            suggestionOutcomes: updated.slice(0, MAX_SUGGESTION_OUTCOMES),
            lastUpdated: Date.now(),
          };
        }),

      recordWorkflowTransition: (from, to) =>
        set((state) => {
          if (from === to) return state;
          const existing = state.workflowTransitions.find(
            (t) => t.from === from && t.to === to,
          );

          let updated: WorkflowTransition[];
          if (existing) {
            updated = state.workflowTransitions.map((t) =>
              t.from === from && t.to === to ? { ...t, count: t.count + 1 } : t,
            );
          } else {
            updated = [...state.workflowTransitions, { from, to, count: 1 }];
          }

          updated.sort((a, b) => b.count - a.count);
          return {
            workflowTransitions: updated.slice(0, MAX_WORKFLOW_TRANSITIONS),
            lastUpdated: Date.now(),
          };
        }),

      recordResponseRating: (content, positive) =>
        set((state) => {
          const trimmed = content.slice(0, 80);
          const existing = state.responseRatings.find((r) => r.pattern === trimmed);

          let updated: ResponseRating[];
          if (existing) {
            updated = state.responseRatings.map((r) =>
              r.pattern === trimmed
                ? {
                    ...r,
                    positive: r.positive + (positive ? 1 : 0),
                    negative: r.negative + (positive ? 0 : 1),
                    lastRated: Date.now(),
                  }
                : r,
            );
          } else {
            updated = [
              ...state.responseRatings,
              {
                pattern: trimmed,
                positive: positive ? 1 : 0,
                negative: positive ? 0 : 1,
                lastRated: Date.now(),
              },
            ];
          }

          updated.sort((a, b) => b.lastRated - a.lastRated);
          return {
            responseRatings: updated.slice(0, MAX_RESPONSE_RATINGS),
            lastUpdated: Date.now(),
          };
        }),

      recordDensityPreference: (panelType, density) =>
        set((state) => ({
          densityPreferences: { ...state.densityPreferences, [panelType]: density },
          lastUpdated: Date.now(),
        })),

      incrementInteractions: () =>
        set((state) => ({
          totalInteractions: state.totalInteractions + 1,
          lastUpdated: Date.now(),
        })),

      getMemorySummary: () => {
        const state = get();
        if (state.totalInteractions < 3) return '';

        const parts: string[] = [];

        // Top layout preferences
        const topLayouts = state.layoutPreferences.filter((p) => p.count >= 2).slice(0, 3);
        if (topLayouts.length > 0) {
          parts.push(
            'Preferred layouts: ' +
              topLayouts
                .map((p) => `${p.layout} with [${p.panels.join(', ')}] (${p.count}x)`)
                .join('; '),
          );
        }

        // Suggestion acceptance patterns
        const highAccept = state.suggestionOutcomes
          .filter((s) => s.accepted > s.dismissed && s.accepted >= 2)
          .slice(0, 3);
        const highDismiss = state.suggestionOutcomes
          .filter((s) => s.dismissed > s.accepted && s.dismissed >= 2)
          .slice(0, 3);

        if (highAccept.length > 0) {
          parts.push(
            'User likes suggestions about: ' +
              highAccept.map((s) => `"${s.pattern}"`).join(', '),
          );
        }
        if (highDismiss.length > 0) {
          parts.push(
            'User dismisses suggestions about: ' +
              highDismiss.map((s) => `"${s.pattern}"`).join(', '),
          );
        }

        // Top workflow patterns
        const topFlows = state.workflowTransitions.filter((t) => t.count >= 2).slice(0, 3);
        if (topFlows.length > 0) {
          parts.push(
            'Common workflows: ' +
              topFlows.map((t) => `${t.from}→${t.to} (${t.count}x)`).join(', '),
          );
        }

        // Response rating patterns
        const likedResponses = state.responseRatings
          .filter((r) => r.positive > r.negative && r.positive >= 2)
          .slice(0, 3);
        const dislikedResponses = state.responseRatings
          .filter((r) => r.negative > r.positive && r.negative >= 2)
          .slice(0, 3);

        if (likedResponses.length > 0) {
          parts.push(
            'User upvotes responses like: ' +
              likedResponses.map((r) => `"${r.pattern}"`).join(', '),
          );
        }
        if (dislikedResponses.length > 0) {
          parts.push(
            'User downvotes responses like: ' +
              dislikedResponses.map((r) => `"${r.pattern}"`).join(', '),
          );
        }

        // Density preferences
        const densityEntries = Object.entries(state.densityPreferences);
        if (densityEntries.length > 0) {
          const nonDefault = densityEntries.filter(([, d]) => d !== 'full');
          if (nonDefault.length > 0) {
            parts.push(
              'Density prefs: ' + nonDefault.map(([p, d]) => `${p}=${d}`).join(', '),
            );
          }
        }

        if (parts.length === 0) return '';

        return `\n\n## User Preferences (learned from ${state.totalInteractions} interactions)\n${parts.join('\n')}`;
      },
    }),
    {
      name: 'advisor-memory',
      partialize: (state) => ({
        layoutPreferences: state.layoutPreferences,
        suggestionOutcomes: state.suggestionOutcomes,
        workflowTransitions: state.workflowTransitions,
        responseRatings: state.responseRatings,
        densityPreferences: state.densityPreferences,
        totalInteractions: state.totalInteractions,
        lastUpdated: state.lastUpdated,
      }),
    },
  ),
);
