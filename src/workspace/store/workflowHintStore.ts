import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WorkflowHintState {
  recentTools: string[];
  presetFeedback: Record<string, number>;
  dismissedRecommendationIds: string[];
  recordTool: (toolName: string) => void;
  clearRecentTools: () => void;
  resetRecommendationLearning: () => void;
  markPresetHelpful: (presetId: string) => void;
  dismissRecommendation: (presetId: string) => void;
}

const MAX_RECENT_TOOLS = 12;

export const useWorkflowHintStore = create<WorkflowHintState>()(
  persist(
    (set) => ({
      recentTools: [],
      presetFeedback: {},
      dismissedRecommendationIds: [],
      recordTool: (toolName) => {
        set((state) => {
          const withoutCurrent = state.recentTools.filter((item) => item !== toolName);
          return {
            recentTools: [toolName, ...withoutCurrent].slice(0, MAX_RECENT_TOOLS),
            dismissedRecommendationIds: [],
          };
        });
      },
      clearRecentTools: () => set({ recentTools: [], dismissedRecommendationIds: [] }),
      resetRecommendationLearning: () => {
        set({
          recentTools: [],
          presetFeedback: {},
          dismissedRecommendationIds: [],
        });
      },
      markPresetHelpful: (presetId) => {
        set((state) => ({
          presetFeedback: {
            ...state.presetFeedback,
            [presetId]: Math.min((state.presetFeedback[presetId] ?? 0) + 8, 40),
          },
          dismissedRecommendationIds: state.dismissedRecommendationIds.filter((id) => id !== presetId),
        }));
      },
      dismissRecommendation: (presetId) => {
        set((state) => ({
          presetFeedback: {
            ...state.presetFeedback,
            [presetId]: Math.max((state.presetFeedback[presetId] ?? 0) - 12, -40),
          },
          dismissedRecommendationIds: state.dismissedRecommendationIds.includes(presetId)
            ? state.dismissedRecommendationIds
            : [presetId, ...state.dismissedRecommendationIds],
        }));
      },
    }),
    {
      name: 'studio-story-workflow-hints',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        recentTools: state.recentTools,
        presetFeedback: state.presetFeedback,
        dismissedRecommendationIds: state.dismissedRecommendationIds,
      }),
    }
  )
);
