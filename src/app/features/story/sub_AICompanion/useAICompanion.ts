/**
 * useAICompanion Hook
 * AI-powered story writing assistant hook
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSceneEditor } from '@/contexts/SceneEditorContext';
import { v4 as uuidv4 } from 'uuid';
import type {
  AICompanionMode,
  AICompanionState,
  ContentVariant,
  NextStepSuggestion,
  StoryContext,
  SceneContext,
} from './types';

interface UseAICompanionOptions {
  enabled?: boolean;
}

export function useAICompanion(options: UseAICompanionOptions = {}) {
  const { enabled = true } = options;

  const {
    projectId,
    scenes,
    choices,
    currentScene,
    currentSceneId,
    firstSceneId,
    addScene,
    addChoice,
    updateScene,
    getChoicesForScene,
    getPredecessors,
    getSuccessors,
  } = useSceneEditor();

  const [state, setState] = useState<AICompanionState>({
    mode: 'suggest',
    isGenerating: false,
    error: null,
    contentVariants: [],
    selectedVariantId: null,
    nextStepSuggestions: [],
    architectPlan: null,
  });

  // Build a Map of sceneId -> Scene for O(1) lookups
  const scenesById = useMemo(() => {
    const map = new Map<string, typeof scenes[number]>();
    for (const scene of scenes) {
      map.set(scene.id, scene);
    }
    return map;
  }, [scenes]);

  // Build story context from editor state
  const buildStoryContext = useCallback((): StoryContext | null => {
    if (!projectId) return null;

    const currentSceneData: SceneContext | undefined = currentScene
      ? {
          id: currentScene.id,
          name: currentScene.name || 'Untitled',
          content: currentScene.content || '',
          description: currentScene.description,
          message: currentScene.message,
          speaker: currentScene.speaker,
        }
      : undefined;

    // Get predecessors using graph indices (returns scene IDs)
    const predecessorIds = currentSceneId ? getPredecessors(currentSceneId) : [];
    const predecessors = predecessorIds
      .map((sceneId) => {
        const sourceScene = scenesById.get(sceneId);
        // Find the choice that connects this predecessor to current scene
        const connectingChoice = choices.find(
          (c) => c.scene_id === sceneId && c.target_scene_id === currentSceneId
        );
        return sourceScene
          ? {
              scene: {
                id: sourceScene.id,
                name: sourceScene.name || 'Untitled',
                content: sourceScene.content || '',
                description: sourceScene.description,
                message: sourceScene.message,
                speaker: sourceScene.speaker,
              },
              choiceLabel: connectingChoice?.label || 'Continue',
            }
          : null;
      })
      .filter(Boolean) as StoryContext['predecessors'];

    // Get successors using graph indices (returns scene IDs)
    const successorIds = currentSceneId ? getSuccessors(currentSceneId) : [];
    const successors = successorIds
      .map((sceneId) => {
        const targetScene = scenesById.get(sceneId);
        // Find the choice that connects current scene to this successor
        const connectingChoice = choices.find(
          (c) => c.scene_id === currentSceneId && c.target_scene_id === sceneId
        );
        return targetScene
          ? {
              scene: {
                id: targetScene.id,
                name: targetScene.name || 'Untitled',
                content: targetScene.content || '',
                description: targetScene.description,
                message: targetScene.message,
                speaker: targetScene.speaker,
              },
              choiceLabel: connectingChoice?.label || 'Continue',
            }
          : null;
      })
      .filter(Boolean) as StoryContext['successors'];

    return {
      projectId,
      currentScene: currentSceneData,
      predecessors,
      successors,
      allScenes: scenes.map((s) => ({
        id: s.id,
        name: s.name || 'Untitled',
        content: s.content || '',
        description: s.description,
        message: s.message,
        speaker: s.speaker,
      })),
      choices: choices.map((c) => ({
        id: c.id,
        sourceSceneId: c.scene_id,
        targetSceneId: c.target_scene_id,
        label: c.label,
      })),
    };
  }, [projectId, scenes, choices, currentScene, currentSceneId, scenesById, getPredecessors, getSuccessors]);

  // Generate content variants for current scene
  const generateContentVariants = useCallback(async () => {
    const context = buildStoryContext();
    if (!context || !currentScene) {
      setState((prev) => ({ ...prev, error: 'Please select a scene first' }));
      return;
    }

    setState((prev) => ({ ...prev, isGenerating: true, error: null, contentVariants: [] }));

    try {
      // Mock AI generation - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockVariants: ContentVariant[] = [
        {
          id: uuidv4(),
          title: `${currentScene.name} - Dramatic Version`,
          content: `The tension in the air was palpable as you stepped forward. Every shadow seemed to hold a secret, every whisper carried weight. This was the moment everything would change.`,
          confidence: 0.85,
          reasoning: 'Adds dramatic tension to the scene',
          choices: [
            { label: 'Press forward boldly', targetTitle: 'The Confrontation', targetContent: 'You stood your ground...' },
            { label: 'Seek another path', targetTitle: 'The Hidden Way', targetContent: 'A different route revealed itself...' },
          ],
        },
        {
          id: uuidv4(),
          title: `${currentScene.name} - Mysterious Version`,
          content: `Something wasn't right. The silence was too complete, the stillness too perfect. Your instincts screamed a warning that your mind couldn't quite decipher.`,
          confidence: 0.78,
          reasoning: 'Creates mystery and suspense',
          choices: [
            { label: 'Investigate the anomaly', targetTitle: 'The Discovery', targetContent: 'What you found defied explanation...' },
          ],
        },
        {
          id: uuidv4(),
          title: `${currentScene.name} - Reflective Version`,
          content: `In this quiet moment, memories flooded back. Every choice that led here, every path not taken. The weight of it all settled on your shoulders like a familiar burden.`,
          confidence: 0.72,
          reasoning: 'Provides character depth and reflection',
        },
      ];

      setState((prev) => ({
        ...prev,
        contentVariants: mockVariants,
        isGenerating: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate content';
      setState((prev) => ({ ...prev, error: message, isGenerating: false }));
    }
  }, [buildStoryContext, currentScene]);

  // Generate next step suggestions
  const generateNextSteps = useCallback(
    async (sourceSceneId?: string) => {
      const context = buildStoryContext();
      if (!context) {
        setState((prev) => ({ ...prev, error: 'No story context available' }));
        return;
      }

      const effectiveSourceId = sourceSceneId || currentSceneId;
      if (!effectiveSourceId) {
        setState((prev) => ({ ...prev, error: 'Please select a scene first' }));
        return;
      }

      setState((prev) => ({ ...prev, isGenerating: true, error: null }));

      try {
        // Mock AI generation - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockSuggestions: NextStepSuggestion[] = [
          {
            id: uuidv4(),
            title: 'The Unexpected Ally',
            content: 'A figure emerges from the shadows - not the enemy you expected, but someone with their own reasons for being here.',
            choiceLabel: 'Accept their help',
            confidence: 0.82,
            reasoning: 'Introduces a new character to expand the narrative',
            sourceSceneId: effectiveSourceId,
          },
          {
            id: uuidv4(),
            title: 'The Hidden Truth',
            content: 'The pieces finally click into place. Everything you thought you knew was only part of the story.',
            choiceLabel: 'Uncover the secret',
            confidence: 0.75,
            reasoning: 'Creates a revelation moment',
            sourceSceneId: effectiveSourceId,
          },
          {
            id: uuidv4(),
            title: 'The Point of No Return',
            content: 'There is no going back now. The choice you make here will echo through everything that follows.',
            choiceLabel: 'Make your choice',
            confidence: 0.68,
            reasoning: 'Establishes high stakes',
            sourceSceneId: effectiveSourceId,
          },
        ];

        setState((prev) => ({
          ...prev,
          nextStepSuggestions: mockSuggestions,
          isGenerating: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate suggestions';
        setState((prev) => ({ ...prev, error: message, isGenerating: false }));
      }
    },
    [buildStoryContext, currentSceneId]
  );

  // Generate story structure via architect
  const generateStoryStructure = useCallback(
    async (levels: number, choicesPerScene: number) => {
      if (!projectId || !currentScene) {
        setState((prev) => ({ ...prev, error: 'Please select a scene to branch from' }));
        return;
      }

      setState((prev) => ({ ...prev, isGenerating: true, error: null }));

      try {
        // Mock generation - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Generate mock scenes based on levels and choices
        const newScenes: Array<{ id: string; name: string; content: string; order: number }> = [];
        const newChoices: Array<{ id: string; scene_id: string; target_scene_id: string; label: string; order_index: number }> = [];

        let sceneIndex = scenes.length;

        const generateLevel = (parentId: string, level: number, choiceIndex: number) => {
          if (level > levels) return;

          for (let c = 0; c < choicesPerScene; c++) {
            const newSceneId = uuidv4();
            const sceneName = `Branch ${level}-${choiceIndex + c + 1}`;

            newScenes.push({
              id: newSceneId,
              name: sceneName,
              content: `AI-generated scene at level ${level}, branch ${c + 1}. The story continues with new possibilities...`,
              order: sceneIndex++,
            });

            newChoices.push({
              id: uuidv4(),
              scene_id: parentId,
              target_scene_id: newSceneId,
              label: `Choice ${c + 1}`,
              order_index: c,
            });

            // Recursively generate next level
            if (level < levels) {
              generateLevel(newSceneId, level + 1, c * choicesPerScene);
            }
          }
        };

        generateLevel(currentScene.id, 1, 0);

        // Add scenes and choices to context
        for (const scene of newScenes) {
          addScene({
            id: scene.id,
            name: scene.name,
            content: scene.content,
            project_id: projectId,
            act_id: currentScene.act_id || '',
            order: scene.order,
          });
        }

        for (const choice of newChoices) {
          addChoice(choice);
        }

        setState((prev) => ({ ...prev, isGenerating: false }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate story tree';
        setState((prev) => ({ ...prev, error: message, isGenerating: false }));
      }
    },
    [projectId, currentScene, scenes.length, addScene, addChoice]
  );

  // Apply selected content variant to current scene
  const applyContentVariant = useCallback(
    async (variant: ContentVariant) => {
      if (!currentScene || !projectId) return;

      try {
        // Update scene content
        updateScene(currentScene.id, {
          name: variant.title,
          content: variant.content,
          message: variant.message || undefined,
          speaker: variant.speaker || undefined,
        });

        // Create choices if present
        if (variant.choices && variant.choices.length > 0) {
          for (let i = 0; i < variant.choices.length; i++) {
            const choice = variant.choices[i];

            // Create target scene
            const newSceneId = uuidv4();
            addScene({
              id: newSceneId,
              name: choice.targetTitle,
              content: choice.targetContent || '',
              project_id: projectId,
              act_id: currentScene.act_id || '',
              order: scenes.length + i,
            });

            // Create choice
            addChoice({
              id: uuidv4(),
              scene_id: currentScene.id,
              target_scene_id: newSceneId,
              label: choice.label,
              order_index: getChoicesForScene(currentScene.id).length + i,
            });
          }
        }

        setState((prev) => ({
          ...prev,
          selectedVariantId: variant.id,
          contentVariants: [],
        }));
      } catch (err) {
        setState((prev) => ({ ...prev, error: 'Failed to apply content' }));
      }
    },
    [currentScene, projectId, scenes.length, updateScene, addScene, addChoice, getChoicesForScene]
  );

  // Accept a next step suggestion
  const acceptNextStep = useCallback(
    async (suggestion: NextStepSuggestion) => {
      if (!projectId) return;

      setState((prev) => ({ ...prev, isGenerating: true }));

      try {
        // Create new scene
        const newSceneId = uuidv4();
        addScene({
          id: newSceneId,
          name: suggestion.title,
          content: suggestion.content,
          project_id: projectId,
          act_id: currentScene?.act_id || '',
          order: scenes.length,
        });

        // Create choice if we have a source
        if (suggestion.sourceSceneId) {
          addChoice({
            id: uuidv4(),
            scene_id: suggestion.sourceSceneId,
            target_scene_id: newSceneId,
            label: suggestion.choiceLabel,
            order_index: getChoicesForScene(suggestion.sourceSceneId).length,
          });
        }

        // Remove from suggestions
        setState((prev) => ({
          ...prev,
          nextStepSuggestions: prev.nextStepSuggestions.filter((s) => s.id !== suggestion.id),
          isGenerating: false,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to accept suggestion';
        setState((prev) => ({ ...prev, error: message, isGenerating: false }));
      }
    },
    [projectId, currentScene, scenes.length, addScene, addChoice, getChoicesForScene]
  );

  // Decline a suggestion
  const declineNextStep = useCallback((suggestionId: string) => {
    setState((prev) => ({
      ...prev,
      nextStepSuggestions: prev.nextStepSuggestions.filter((s) => s.id !== suggestionId),
    }));
  }, []);

  // Dismiss all suggestions
  const dismissAllSuggestions = useCallback(() => {
    setState((prev) => ({
      ...prev,
      nextStepSuggestions: [],
      contentVariants: [],
    }));
  }, []);

  // Set mode
  const setMode = useCallback((mode: AICompanionMode) => {
    setState((prev) => ({ ...prev, mode }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    setMode,
    clearError,
    generateContentVariants,
    applyContentVariant,
    generateNextSteps,
    acceptNextStep,
    declineNextStep,
    dismissAllSuggestions,
    generateStoryStructure,
    scenesLength: scenes.length,
    currentSceneId,
    hasCurrentScene: !!currentScene,
  };
}
