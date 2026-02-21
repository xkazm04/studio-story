/**
 * useImageGenerator Hook
 * Manages character image generation workflow: selections → sketches → final
 */

import { useState, useCallback, useRef } from 'react';
import { Appearance } from '@/app/types/Character';
import {
  GenerationSelections,
  GENERATION_PRESETS,
} from '../lib/promptComposer';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
}

interface UseImageGeneratorOptions {
  characterId: string;
  appearance: Appearance;
  artStyle?: string;
  onImageSaved?: (image: GeneratedImage) => void;
}

interface UseImageGeneratorReturn {
  // State
  selections: GenerationSelections;
  composedPrompt: string | null;
  sketches: GeneratedImage[];
  selectedSketch: GeneratedImage | null;
  finalImage: GeneratedImage | null;
  isComposing: boolean;
  isGeneratingSketches: boolean;
  isGeneratingFinal: boolean;
  error: string | null;

  // Actions
  setSelections: (selections: GenerationSelections) => void;
  updateSelection: (key: keyof GenerationSelections, value: string) => void;
  composePrompt: () => Promise<string | null>;
  generateSketches: () => Promise<void>;
  selectSketch: (sketch: GeneratedImage) => void;
  generateFinal: () => Promise<void>;
  reset: () => void;
  cancel: () => void;
}

export function useImageGenerator({
  characterId,
  appearance,
  artStyle,
  onImageSaved,
}: UseImageGeneratorOptions): UseImageGeneratorReturn {
  // State
  const [selections, setSelections] = useState<GenerationSelections>({});
  const [composedPrompt, setComposedPrompt] = useState<string | null>(null);
  const [sketches, setSketches] = useState<GeneratedImage[]>([]);
  const [selectedSketch, setSelectedSketch] = useState<GeneratedImage | null>(null);
  const [finalImage, setFinalImage] = useState<GeneratedImage | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isGeneratingSketches, setIsGeneratingSketches] = useState(false);
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  // Request ID to detect stale responses
  const requestIdRef = useRef<number>(0);

  /**
   * Update a single selection
   */
  const updateSelection = useCallback((key: keyof GenerationSelections, value: string) => {
    setSelections(prev => ({ ...prev, [key]: value }));
    // Reset composed prompt when selections change
    setComposedPrompt(null);
  }, []);

  /**
   * Compose prompt using AI
   */
  const composePrompt = useCallback(async (): Promise<string | null> => {
    setIsComposing(true);
    setError(null);
    const currentRequestId = ++requestIdRef.current;

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai/compose-character-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          appearance,
          selections,
          artStyle,
        }),
        signal: abortControllerRef.current.signal,
      });

      // Check for stale response
      if (currentRequestId !== requestIdRef.current) {
        return null;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to compose prompt');
      }

      const data = await response.json();
      setComposedPrompt(data.prompt);
      return data.prompt;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      const message = err instanceof Error ? err.message : 'Failed to compose prompt';
      setError(message);
      return null;
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsComposing(false);
      }
    }
  }, [characterId, appearance, selections, artStyle]);

  /**
   * Generate sketch images
   */
  const generateSketches = useCallback(async () => {
    // Compose prompt first if not already done
    let prompt = composedPrompt;
    if (!prompt) {
      prompt = await composePrompt();
      if (!prompt) return;
    }

    setIsGeneratingSketches(true);
    setError(null);
    setSketches([]);
    setSelectedSketch(null);
    setFinalImage(null);
    const currentRequestId = ++requestIdRef.current;

    try {
      abortControllerRef.current = new AbortController();
      const preset = GENERATION_PRESETS.sketch;

      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          numImages: preset.numImages,
          width: preset.width,
          height: preset.height,
        }),
        signal: abortControllerRef.current.signal,
      });

      // Check for stale response
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate sketches');
      }

      const data = await response.json();
      const generatedSketches: GeneratedImage[] = data.images.map((url: string, index: number) => ({
        id: `sketch-${Date.now()}-${index}`,
        url,
        prompt,
        createdAt: new Date().toISOString(),
      }));

      setSketches(generatedSketches);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to generate sketches';
      setError(message);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsGeneratingSketches(false);
      }
    }
  }, [composedPrompt, composePrompt]);

  /**
   * Select a sketch for final generation
   */
  const selectSketch = useCallback((sketch: GeneratedImage) => {
    setSelectedSketch(sketch);
    setFinalImage(null);
  }, []);

  /**
   * Generate final high-quality image from selected sketch
   */
  const generateFinal = useCallback(async () => {
    if (!selectedSketch || !composedPrompt) {
      setError('Please select a sketch first');
      return;
    }

    setIsGeneratingFinal(true);
    setError(null);
    const currentRequestId = ++requestIdRef.current;

    try {
      abortControllerRef.current = new AbortController();
      const preset = GENERATION_PRESETS.final;

      // Use the selected sketch as reference for img2img if supported
      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: composedPrompt,
          numImages: preset.numImages,
          width: preset.width,
          height: preset.height,
          referenceImages: [selectedSketch.url],
          referenceStrength: 0.65,
        }),
        signal: abortControllerRef.current.signal,
      });

      // Check for stale response
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate final image');
      }

      const data = await response.json();
      if (data.images && data.images.length > 0) {
        const final: GeneratedImage = {
          id: `final-${Date.now()}`,
          url: data.images[0],
          prompt: composedPrompt,
          createdAt: new Date().toISOString(),
        };
        setFinalImage(final);
        onImageSaved?.(final);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to generate final image';
      setError(message);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsGeneratingFinal(false);
      }
    }
  }, [selectedSketch, composedPrompt, onImageSaved]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    cancel();
    setSelections({});
    setComposedPrompt(null);
    setSketches([]);
    setSelectedSketch(null);
    setFinalImage(null);
    setError(null);
  }, []);

  /**
   * Cancel ongoing requests
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    requestIdRef.current++;
    setIsComposing(false);
    setIsGeneratingSketches(false);
    setIsGeneratingFinal(false);
  }, []);

  return {
    // State
    selections,
    composedPrompt,
    sketches,
    selectedSketch,
    finalImage,
    isComposing,
    isGeneratingSketches,
    isGeneratingFinal,
    error,

    // Actions
    setSelections,
    updateSelection,
    composePrompt,
    generateSketches,
    selectSketch,
    generateFinal,
    reset,
    cancel,
  };
}
