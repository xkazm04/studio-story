import { useState, useCallback } from 'react';
import { extractData } from '@/app/utils/api';
import { RecommendationResponse, RecommendationContext } from '../types/Recommendation';

/**
 * Hook for generating Act description recommendations via Gemini LLM
 */
export const useActRecommendations = (_projectId: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<RecommendationResponse | null>(null);

  const generateRecommendations = useCallback(async (
    context: RecommendationContext,
    onResult?: (response: RecommendationResponse) => void
  ) => {
    setIsGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/story-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'recommend',
          newBeat: context.newBeat,
          targetAct: context.targetAct,
          allActs: context.allActs,
          existingActBeats: context.existingActBeats,
          projectTitle: context.projectTitle,
          projectDescription: context.projectDescription,
          storyBeats: context.storyBeats,
        }),
      });

      const data = extractData<{ success?: boolean; recommendations?: any[]; overall_assessment?: string }>(await res.json());

      if (data.success && data.recommendations) {
        const response: RecommendationResponse = {
          recommendations: data.recommendations,
          overall_assessment: data.overall_assessment || '',
        };
        setResult(response);
        onResult?.(response);
        return response;
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsGenerating(false);
    }

    return null;
  }, []);

  // Backward-compatible: parse text (kept for InlineTerminal onInsert)
  const handleInsertResult = (text: string): RecommendationResponse | null => {
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
      }
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return null;
    } catch {
      return null;
    }
  };

  // Stub terminalProps for backward compatibility with InlineTerminal
  const terminalProps = {
    instanceId: '',
    projectPath: '',
    sessionId: '',
    isRunning: isGenerating,
    output: result
      ? `AI Recommendations:\n${JSON.stringify(result, null, 2)}`
      : isGenerating
        ? 'Analyzing story structure...'
        : '',
    onExecute: () => {},
    onAbort: () => {},
  };

  return {
    generateRecommendations,
    isGenerating,
    handleInsertResult,
    terminalProps,
    result,
  };
};
