import { useState } from 'react';
import { ProjectTemplate } from '@/app/constants/templateCorpus';

interface GenerateTemplateParams {
  projectType: 'story' | 'short' | 'edu';
  genre?: string;
  description?: string;
  themes?: string[];
  useAI?: boolean;
}

interface GenerateTemplateResponse {
  template: ProjectTemplate;
  source: 'corpus' | 'ai-enhanced' | 'ai-generated';
  matchScore?: number;
}

/**
 * Hook for AI-powered template generation
 */
export function useTemplateGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTemplate, setGeneratedTemplate] = useState<ProjectTemplate | null>(null);
  const [source, setSource] = useState<'corpus' | 'ai-enhanced' | 'ai-generated' | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const generateTemplate = async (params: GenerateTemplateParams): Promise<GenerateTemplateResponse | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate template');
      }

      const data: GenerateTemplateResponse = await response.json();

      setGeneratedTemplate(data.template);
      setSource(data.source);
      setMatchScore(data.matchScore || null);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Template generation error:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const resetTemplate = () => {
    setGeneratedTemplate(null);
    setSource(null);
    setMatchScore(null);
    setError(null);
  };

  return {
    generateTemplate,
    resetTemplate,
    isGenerating,
    error,
    generatedTemplate,
    source,
    matchScore,
  };
}

/**
 * Hook for fetching available templates
 */
export function useTemplateList() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);

  const fetchTemplates = async (
    type?: 'story' | 'short' | 'edu',
    trending?: boolean
  ): Promise<ProjectTemplate[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (trending) params.append('trending', 'true');

      const response = await fetch(`/api/ai/generate-template?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
      return data.templates || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Template fetch error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchTemplates,
    isLoading,
    error,
    templates,
  };
}
