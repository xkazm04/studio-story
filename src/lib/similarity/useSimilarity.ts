/**
 * React hooks for similarity and style grouping
 */

import { useState, useCallback, useEffect } from 'react';
import {
  similarityEngine,
  type SimilarityMatch,
  type DuplicateResult,
  type RecommendationResult,
  type SimilaritySearchOptions,
  type ImageFingerprint,
} from './SimilarityEngine';
import {
  styleGrouper,
  type StyleGroup,
  type StyleAnalysis,
  type ClusteringOptions,
} from './StyleGrouper';

// ============================================
// Similarity Engine Hooks
// ============================================

/**
 * Hook for duplicate detection during upload
 */
export function useDuplicateCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DuplicateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkDuplicate = useCallback(async (file: File, assetName?: string) => {
    setIsChecking(true);
    setError(null);
    setResult(null);

    try {
      const duplicateResult = await similarityEngine.checkForDuplicates(file, assetName);
      setResult(duplicateResult);
      return duplicateResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Duplicate check failed';
      setError(message);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    checkDuplicate,
    isChecking,
    result,
    error,
    reset,
  };
}

/**
 * Hook for visual search
 */
export function useVisualSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<SimilarityMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (file: File, options?: SimilaritySearchOptions) => {
    setIsSearching(true);
    setError(null);

    try {
      const results = await similarityEngine.visualSearch(file, options);
      setMatches(results);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Visual search failed';
      setError(message);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMatches([]);
    setError(null);
  }, []);

  return {
    search,
    isSearching,
    matches,
    error,
    clear,
  };
}

/**
 * Hook for finding similar assets
 */
export function useSimilarAssets(assetId: string | null, options?: SimilaritySearchOptions) {
  const [matches, setMatches] = useState<SimilarityMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setMatches([]);
      return;
    }

    let cancelled = false;

    const loadSimilar = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await similarityEngine.findSimilar(assetId, options);
        if (!cancelled) {
          setMatches(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to find similar assets');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSimilar();

    return () => {
      cancelled = true;
    };
  }, [assetId, options]);

  return { matches, isLoading, error };
}

/**
 * Hook for asset recommendations
 */
export function useRecommendations(assetId: string | null, limit = 5) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setRecommendations([]);
      return;
    }

    let cancelled = false;

    const loadRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await similarityEngine.getRecommendations(assetId, limit);
        if (!cancelled) {
          setRecommendations(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to get recommendations');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [assetId, limit]);

  return { recommendations, isLoading, error };
}

/**
 * Hook for fingerprint generation
 */
export function useFingerprint() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fingerprint, setFingerprint] = useState<ImageFingerprint | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (assetId: string, file: File) => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await similarityEngine.generateFingerprint(assetId, file);
      setFingerprint(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate fingerprint';
      setError(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const getExisting = useCallback((assetId: string) => {
    const existing = similarityEngine.getFingerprint(assetId);
    setFingerprint(existing || null);
    return existing;
  }, []);

  return {
    generate,
    getExisting,
    isGenerating,
    fingerprint,
    error,
  };
}

/**
 * Hook for similarity engine stats
 */
export function useSimilarityStats() {
  const [stats, setStats] = useState(similarityEngine.getStats());

  const refresh = useCallback(() => {
    setStats(similarityEngine.getStats());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, refresh };
}

// ============================================
// Style Grouper Hooks
// ============================================

/**
 * Hook for style groups
 */
export function useStyleGroups() {
  const [groups, setGroups] = useState<StyleGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await styleGrouper.initialize();
      setGroups(styleGrouper.getAllStyleGroups());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load style groups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cluster = useCallback(async (options?: ClusteringOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const newGroups = await styleGrouper.clusterByStyle(options);
      setGroups(newGroups);
      return newGroups;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clustering failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return {
    groups,
    isLoading,
    error,
    cluster,
    refresh: loadGroups,
  };
}

/**
 * Hook for style analysis of a single asset
 */
export function useStyleAnalysis(assetId: string | null) {
  const [analysis, setAnalysis] = useState<StyleAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setAnalysis(null);
      return;
    }

    let cancelled = false;

    const loadAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await styleGrouper.analyzeStyle(assetId);
        if (!cancelled) {
          setAnalysis(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Style analysis failed');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return { analysis, isLoading, error };
}

/**
 * Hook for finding assets with similar style
 */
export function useSimilarStyle(assetId: string | null, limit = 10) {
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assetId) {
      setAssetIds([]);
      return;
    }

    let cancelled = false;

    const loadSimilarStyle = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await styleGrouper.findSimilarStyle(assetId, limit);
        if (!cancelled) {
          setAssetIds(results);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to find similar styles');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSimilarStyle();

    return () => {
      cancelled = true;
    };
  }, [assetId, limit]);

  return { assetIds, isLoading, error };
}

/**
 * Hook for getting style group of an asset
 */
export function useAssetStyleGroup(assetId: string | null) {
  const [styleGroup, setStyleGroup] = useState<StyleGroup | null>(null);

  useEffect(() => {
    if (!assetId) {
      setStyleGroup(null);
      return;
    }

    const group = styleGrouper.getStyleGroupForAsset(assetId);
    setStyleGroup(group || null);
  }, [assetId]);

  return styleGroup;
}
