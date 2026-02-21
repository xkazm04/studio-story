'use client';

import { useState, useEffect, useCallback } from 'react';
import { Appearance, defaultAppearance } from '@/app/types/Character';
import { useProjectStore } from '@/app/store/slices/projectSlice';
import {
  saveCharacterAppearance,
  fetchCharacterAppearance,
} from '@/app/lib/services/characterAppearanceService';
import { setFieldValue } from './formConfig';
import { generateFullPrompt } from './promptGenerators';
import { randomizeCharacter } from './randomizer';

interface UseAppearanceFormOptions {
  characterId: string;
}

interface UseAppearanceFormReturn {
  appearance: Appearance;
  prompt: string;
  isLoading: boolean;
  isSaving: boolean;
  saved: boolean;
  isRandomizing: boolean;
  handleChange: (field: string, value: string) => void;
  handleSectionPromptGenerated: (sectionId: string, generatedPrompt: string) => void;
  handleGenerateFullPrompt: () => void;
  handleRandomize: () => Promise<void>;
  handleExtractedAppearance: (extractedData: Partial<Appearance>, extractedPrompt: string) => void;
  handleSave: () => Promise<void>;
  setPrompt: (prompt: string) => void;
}

/**
 * Custom hook for managing character appearance form state
 */
export function useAppearanceForm({ characterId }: UseAppearanceFormOptions): UseAppearanceFormReturn {
  const { selectedProject } = useProjectStore();
  const [appearance, setAppearance] = useState<Appearance>(defaultAppearance);
  const [prompt, setPrompt] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRandomizing, setIsRandomizing] = useState(false);

  // Load existing appearance data on mount
  useEffect(() => {
    const loadAppearance = async () => {
      if (!characterId) return;

      try {
        setIsLoading(true);
        const { appearance: loadedAppearance, prompt: loadedPrompt } =
          await fetchCharacterAppearance(characterId);

        if (loadedAppearance && Object.keys(loadedAppearance).length > 0) {
          setAppearance({
            ...defaultAppearance,
            ...loadedAppearance,
            face: { ...defaultAppearance.face, ...loadedAppearance.face },
            clothing: { ...defaultAppearance.clothing, ...loadedAppearance.clothing },
          });
        }

        if (loadedPrompt) {
          setPrompt(loadedPrompt);
        }
      } catch (error) {
        console.error('Failed to load appearance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppearance();
  }, [characterId]);

  const handleChange = useCallback((field: string, value: string) => {
    setAppearance((prev) => {
      const updated = setFieldValue(prev, field, value);
      const fullPrompt = generateFullPrompt(updated);
      setPrompt(fullPrompt);
      return updated;
    });
  }, []);

  const handleSectionPromptGenerated = useCallback((sectionId: string, generatedPrompt: string) => {
    setAppearance((prev) => {
      const fullPrompt = generateFullPrompt(prev);
      setPrompt(fullPrompt);
      return prev;
    });
  }, []);

  const handleGenerateFullPrompt = useCallback(() => {
    const fullPrompt = generateFullPrompt(appearance);
    setPrompt(fullPrompt);
  }, [appearance]);

  const handleRandomize = useCallback(async () => {
    setIsRandomizing(true);
    try {
      const randomAppearance = await randomizeCharacter({
        genre: (selectedProject as any)?.genre || 'fantasy',
        projectContext: {
          title: selectedProject?.name,
          description: selectedProject?.description,
          genre: (selectedProject as any)?.genre,
        },
      });

      setAppearance((prev) => ({
        ...defaultAppearance,
        ...prev,
        ...randomAppearance,
        face: { ...defaultAppearance.face, ...prev.face, ...randomAppearance.face },
        clothing: { ...defaultAppearance.clothing, ...prev.clothing, ...randomAppearance.clothing },
      }));
    } catch (error) {
      console.error('Randomizer error:', error);
      alert('Failed to generate random character. Please try again.');
    } finally {
      setIsRandomizing(false);
    }
  }, [selectedProject]);

  const handleExtractedAppearance = useCallback((extractedData: Partial<Appearance>, extractedPrompt: string) => {
    setAppearance((prev) => ({
      ...prev,
      ...extractedData,
      face: { ...prev.face, ...extractedData.face },
      clothing: { ...prev.clothing, ...extractedData.clothing },
    }));
    setPrompt(extractedPrompt);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await saveCharacterAppearance(characterId, appearance, prompt);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save appearance:', error);
      alert('Failed to save appearance. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [characterId, appearance, prompt]);

  return {
    appearance,
    prompt,
    isLoading,
    isSaving,
    saved,
    isRandomizing,
    handleChange,
    handleSectionPromptGenerated,
    handleGenerateFullPrompt,
    handleRandomize,
    handleExtractedAppearance,
    handleSave,
    setPrompt,
  };
}
