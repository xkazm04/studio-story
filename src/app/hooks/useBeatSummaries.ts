import { useState, useCallback } from 'react';
import { apiFetch } from '../utils/api';

interface BeatSummaryData {
  beatId: string;
  beatName: string;
  beatDescription?: string;
  beatType?: string;
  actContext?: string;
  order?: number;
  precedingBeatSummary?: string;
}

interface BeatSummaryResponse {
  summary: string;
  beatId: string;
}

interface BatchSummaryResponse {
  summaries: Array<{
    beatId: string;
    beatName: string;
    summary: string;
    error?: boolean;
  }>;
}

interface BeatSummaryState {
  [beatId: string]: {
    summary: string;
    isGenerating: boolean;
    error?: string;
  };
}

/**
 * Hook for managing beat summaries
 *
 * Handles generation, caching, and state management of beat summaries
 * for visual beat summary cards
 */
export function useBeatSummaries() {
  const [summaries, setSummaries] = useState<BeatSummaryState>({});

  /**
   * Generate summary for a single beat
   */
  const generateSummary = useCallback(async (beatData: BeatSummaryData): Promise<string> => {
    const { beatId } = beatData;

    // Set generating state
    setSummaries((prev) => ({
      ...prev,
      [beatId]: {
        summary: prev[beatId]?.summary || '',
        isGenerating: true,
        error: undefined,
      },
    }));

    try {
      const response = await apiFetch<BeatSummaryResponse>({
        url: '/api/beat-summary',
        method: 'POST',
        body: {
          beatName: beatData.beatName,
          beatDescription: beatData.beatDescription,
          beatType: beatData.beatType,
          actContext: beatData.actContext,
          order: beatData.order,
          precedingBeatSummary: beatData.precedingBeatSummary,
        },
      });

      const summary = response.summary;

      // Update state with generated summary
      setSummaries((prev) => ({
        ...prev,
        [beatId]: {
          summary,
          isGenerating: false,
          error: undefined,
        },
      }));

      return summary;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';

      // Update state with error
      setSummaries((prev) => ({
        ...prev,
        [beatId]: {
          summary: prev[beatId]?.summary || '',
          isGenerating: false,
          error: errorMessage,
        },
      }));

      throw error;
    }
  }, []);

  /**
   * Generate summaries for multiple beats in batch
   */
  const generateBatchSummaries = useCallback(async (beats: BeatSummaryData[]): Promise<void> => {
    // Set all beats to generating state
    setSummaries((prev) => {
      const newState = { ...prev };
      beats.forEach((beat) => {
        newState[beat.beatId] = {
          summary: prev[beat.beatId]?.summary || '',
          isGenerating: true,
          error: undefined,
        };
      });
      return newState;
    });

    try {
      const response = await apiFetch<BatchSummaryResponse>({
        url: '/api/beat-summary',
        method: 'PUT',
        body: {
          beats: beats.map((beat) => ({
            id: beat.beatId,
            name: beat.beatName,
            description: beat.beatDescription,
            type: beat.beatType,
            actContext: beat.actContext,
          })),
        },
      });

      // Update state with all generated summaries
      setSummaries((prev) => {
        const newState = { ...prev };
        response.summaries.forEach((item) => {
          newState[item.beatId] = {
            summary: item.summary,
            isGenerating: false,
            error: item.error ? 'Failed to generate summary' : undefined,
          };
        });
        return newState;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summaries';

      // Update all beats with error state
      setSummaries((prev) => {
        const newState = { ...prev };
        beats.forEach((beat) => {
          newState[beat.beatId] = {
            summary: prev[beat.beatId]?.summary || '',
            isGenerating: false,
            error: errorMessage,
          };
        });
        return newState;
      });

      throw error;
    }
  }, []);

  /**
   * Get summary state for a specific beat
   */
  const getSummary = useCallback((beatId: string) => {
    return summaries[beatId] || { summary: '', isGenerating: false, error: undefined };
  }, [summaries]);

  /**
   * Clear summary for a specific beat
   */
  const clearSummary = useCallback((beatId: string) => {
    setSummaries((prev) => {
      const newState = { ...prev };
      delete newState[beatId];
      return newState;
    });
  }, []);

  /**
   * Clear all summaries
   */
  const clearAllSummaries = useCallback(() => {
    setSummaries({});
  }, []);

  /**
   * Manually set summary for a beat (useful for caching/prefetching)
   */
  const setSummary = useCallback((beatId: string, summary: string) => {
    setSummaries((prev) => ({
      ...prev,
      [beatId]: {
        summary,
        isGenerating: false,
        error: undefined,
      },
    }));
  }, []);

  return {
    summaries,
    generateSummary,
    generateBatchSummaries,
    getSummary,
    clearSummary,
    clearAllSummaries,
    setSummary,
  };
}
