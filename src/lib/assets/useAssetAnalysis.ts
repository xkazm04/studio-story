/**
 * React hooks for asset analysis
 */

import { useState, useCallback } from 'react';
import {
  assetAnalyzer,
  type AnalysisOptions,
  type FullAnalysisResult,
  type TagSuggestion,
  type ColorAnalysis,
  type QualityAssessment,
} from './AssetAnalyzer';
import {
  contentExtractor,
  type ExtractionOptions,
  type ExtractionResult,
} from './ContentExtractor';

/**
 * Hook for full asset analysis
 */
export function useAssetAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (file: File | Blob, options?: Partial<AnalysisOptions>) => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const analysisResult = await assetAnalyzer.analyzeImage(file, options);
        setResult(analysisResult);
        return analysisResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        setError(message);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    analyze,
    isAnalyzing,
    result,
    error,
    reset,
    // Shortcuts to result properties
    tags: result?.tags || [],
    colors: result?.colors,
    quality: result?.quality,
    content: result?.content,
    metadata: result?.metadata,
    style: result?.styleAnalysis,
  };
}

/**
 * Hook for content extraction
 */
export function useContentExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(
    async (file: File | Blob, options?: Partial<ExtractionOptions>) => {
      setIsExtracting(true);
      setError(null);

      try {
        const extractionResult = await contentExtractor.extract(file, options);
        setResult(extractionResult);
        return extractionResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Extraction failed';
        setError(message);
        return null;
      } finally {
        setIsExtracting(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    extract,
    isExtracting,
    result,
    error,
    reset,
    elements: result?.elements || [],
    objects: result?.objects || [],
    faces: result?.faces || [],
    text: result?.text || [],
    scene: result?.scene,
    summary: result?.summary || '',
    keywords: result?.keywords || [],
  };
}

/**
 * Hook for tag suggestions
 */
export function useTagSuggestions() {
  const [tags, setTags] = useState<TagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateTags = useCallback(async (file: File | Blob) => {
    setIsLoading(true);

    try {
      const result = await assetAnalyzer.analyzeImage(file, {
        generateTags: true,
        analyzeColors: true,
        extractContent: true,
      });
      setTags(result.tags);
      return result.tags;
    } catch (err) {
      console.error('Failed to generate tags:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterByCategory = useCallback(
    (category: TagSuggestion['category']) => {
      return tags.filter((t) => t.category === category);
    },
    [tags]
  );

  const filterByConfidence = useCallback(
    (minConfidence: number) => {
      return tags.filter((t) => t.confidence >= minConfidence);
    },
    [tags]
  );

  return {
    tags,
    isLoading,
    generateTags,
    filterByCategory,
    filterByConfidence,
    clear: () => setTags([]),
  };
}

/**
 * Hook for color analysis
 */
export function useColorAnalysis() {
  const [colors, setColors] = useState<ColorAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeColors = useCallback(async (file: File | Blob) => {
    setIsAnalyzing(true);

    try {
      const result = await assetAnalyzer.analyzeImage(file, {
        analyzeColors: true,
        generateTags: false,
        extractContent: false,
        assessQuality: false,
      });
      setColors(result.colors);
      return result.colors;
    } catch (err) {
      console.error('Failed to analyze colors:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    colors,
    isAnalyzing,
    analyzeColors,
    clear: () => setColors(null),
  };
}

/**
 * Hook for quality assessment
 */
export function useQualityAssessment() {
  const [quality, setQuality] = useState<QualityAssessment | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const assessQuality = useCallback(async (file: File | Blob) => {
    setIsAssessing(true);

    try {
      const result = await assetAnalyzer.analyzeImage(file, {
        assessQuality: true,
        generateTags: false,
        extractContent: false,
        analyzeColors: false,
      });
      setQuality(result.quality);
      return result.quality;
    } catch (err) {
      console.error('Failed to assess quality:', err);
      return null;
    } finally {
      setIsAssessing(false);
    }
  }, []);

  return {
    quality,
    isAssessing,
    assessQuality,
    clear: () => setQuality(null),
    // Convenience getters
    overallScore: quality?.overall || 0,
    hasIssues: (quality?.issues.length || 0) > 0,
    issues: quality?.issues || [],
    recommendations: quality?.recommendations || [],
  };
}

/**
 * Hook for metadata generation
 */
export function useMetadataGeneration() {
  const [metadata, setMetadata] = useState<FullAnalysisResult['metadata'] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMetadata = useCallback(async (file: File | Blob) => {
    setIsGenerating(true);

    try {
      const result = await assetAnalyzer.analyzeImage(file);
      setMetadata(result.metadata);
      return result.metadata;
    } catch (err) {
      console.error('Failed to generate metadata:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    metadata,
    isGenerating,
    generateMetadata,
    clear: () => setMetadata(null),
  };
}
