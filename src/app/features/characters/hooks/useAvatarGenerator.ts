/**
 * useAvatarGenerator Hook
 * Manages character avatar generation workflow with style presets
 */

import { useState, useCallback, useRef } from 'react';
import { Appearance } from '@/app/types/Character';
import { AVATAR_STYLES, GENERATION_PRESETS } from '../lib/promptComposer';

export interface GeneratedAvatar {
  id: string;
  url: string;
  prompt: string;
  style: string;
  createdAt: string;
  outfitId?: string;
  outfitName?: string;
}

export interface OutfitInfo {
  id: string;
  name: string;
  promptFragment?: string;
  thumbnailUrl?: string;
}

interface UseAvatarGeneratorOptions {
  characterId: string;
  appearance: Appearance;
  artStyle?: string;
  currentAvatarUrl?: string;
  outfit?: OutfitInfo | null;
  onAvatarSelected?: (avatar: GeneratedAvatar) => void;
}

interface UseAvatarGeneratorReturn {
  // State
  selectedStyle: string;
  referenceImage: string | null;
  composedPrompt: string | null;
  avatars: GeneratedAvatar[];
  selectedAvatar: GeneratedAvatar | null;
  isComposing: boolean;
  isGenerating: boolean;
  error: string | null;
  currentOutfit: OutfitInfo | null;

  // Actions
  setSelectedStyle: (style: string) => void;
  setReferenceImage: (url: string | null) => void;
  setOutfit: (outfit: OutfitInfo | null) => void;
  composePrompt: () => Promise<string | null>;
  generateAvatars: () => Promise<void>;
  selectAvatar: (avatar: GeneratedAvatar) => void;
  setAsCharacterAvatar: () => void;
  reset: () => void;
  cancel: () => void;
}

export function useAvatarGenerator({
  characterId,
  appearance,
  artStyle,
  currentAvatarUrl,
  outfit: initialOutfit,
  onAvatarSelected,
}: UseAvatarGeneratorOptions): UseAvatarGeneratorReturn {
  // State
  const [selectedStyle, setSelectedStyle] = useState<string>('portrait');
  const [referenceImage, setReferenceImage] = useState<string | null>(currentAvatarUrl || null);
  const [composedPrompt, setComposedPrompt] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<GeneratedAvatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<GeneratedAvatar | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOutfit, setCurrentOutfit] = useState<OutfitInfo | null>(initialOutfit || null);

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  // Request ID to detect stale responses
  const requestIdRef = useRef<number>(0);

  /**
   * Handle style change - reset prompt
   */
  const handleStyleChange = useCallback((style: string) => {
    const validStyle = AVATAR_STYLES.find(s => s.id === style);
    if (validStyle) {
      setSelectedStyle(style);
      setComposedPrompt(null);
    }
  }, []);

  /**
   * Handle outfit change - reset prompt to re-compose with new outfit
   */
  const handleOutfitChange = useCallback((outfit: OutfitInfo | null) => {
    setCurrentOutfit(outfit);
    setComposedPrompt(null); // Reset prompt to trigger re-composition with new outfit
  }, []);

  /**
   * Compose avatar prompt using AI
   */
  const composePrompt = useCallback(async (): Promise<string | null> => {
    setIsComposing(true);
    setError(null);
    const currentRequestId = ++requestIdRef.current;

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai/compose-avatar-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId,
          appearance,
          style: selectedStyle,
          artStyle,
          // Include outfit information in prompt composition
          outfit: currentOutfit ? {
            name: currentOutfit.name,
            promptFragment: currentOutfit.promptFragment,
          } : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      // Check for stale response
      if (currentRequestId !== requestIdRef.current) {
        return null;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to compose avatar prompt');
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
  }, [characterId, appearance, selectedStyle, artStyle, currentOutfit]);

  /**
   * Generate avatar images
   */
  const generateAvatars = useCallback(async () => {
    // Compose prompt first if not already done
    let prompt = composedPrompt;
    if (!prompt) {
      prompt = await composePrompt();
      if (!prompt) return;
    }

    setIsGenerating(true);
    setError(null);
    setAvatars([]);
    setSelectedAvatar(null);
    const currentRequestId = ++requestIdRef.current;

    try {
      abortControllerRef.current = new AbortController();
      const preset = GENERATION_PRESETS.avatar;

      // Build request with optional reference image
      const requestBody: Record<string, unknown> = {
        prompt,
        numImages: preset.numImages,
        width: preset.width,
        height: preset.height,
      };

      if (referenceImage) {
        requestBody.referenceImages = [referenceImage];
        requestBody.referenceStrength = 0.5;
      }

      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      // Check for stale response
      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate avatars');
      }

      const data = await response.json();
      const generatedAvatars: GeneratedAvatar[] = data.images.map((url: string, index: number) => ({
        id: `avatar-${Date.now()}-${index}`,
        url,
        prompt,
        style: selectedStyle,
        createdAt: new Date().toISOString(),
        // Include outfit info in generated avatar for tracking
        outfitId: currentOutfit?.id,
        outfitName: currentOutfit?.name,
      }));

      setAvatars(generatedAvatars);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to generate avatars';
      setError(message);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsGenerating(false);
      }
    }
  }, [composedPrompt, composePrompt, referenceImage, selectedStyle, currentOutfit]);

  /**
   * Select an avatar
   */
  const selectAvatar = useCallback((avatar: GeneratedAvatar) => {
    setSelectedAvatar(avatar);
  }, []);

  /**
   * Set selected avatar as character avatar
   */
  const setAsCharacterAvatar = useCallback(() => {
    if (selectedAvatar) {
      onAvatarSelected?.(selectedAvatar);
    }
  }, [selectedAvatar, onAvatarSelected]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    cancel();
    setSelectedStyle('portrait');
    setReferenceImage(currentAvatarUrl || null);
    setComposedPrompt(null);
    setAvatars([]);
    setSelectedAvatar(null);
    setCurrentOutfit(initialOutfit || null);
    setError(null);
  }, [currentAvatarUrl, initialOutfit]);

  /**
   * Cancel ongoing requests
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    requestIdRef.current++;
    setIsComposing(false);
    setIsGenerating(false);
  }, []);

  return {
    // State
    selectedStyle,
    referenceImage,
    composedPrompt,
    avatars,
    selectedAvatar,
    isComposing,
    isGenerating,
    error,
    currentOutfit,

    // Actions
    setSelectedStyle: handleStyleChange,
    setReferenceImage,
    setOutfit: handleOutfitChange,
    composePrompt,
    generateAvatars,
    selectAvatar,
    setAsCharacterAvatar,
    reset,
    cancel,
  };
}
