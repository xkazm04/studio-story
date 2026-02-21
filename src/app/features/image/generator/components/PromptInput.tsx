'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Film,
  ChevronDown,
  Sparkles,
  X,
  Loader2,
} from 'lucide-react';
import { useProjectStore } from '@/app/store/projectStore';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { actApi } from '@/app/hooks/integration/useActs';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { sceneParser, promptGenerator } from '@/lib/image';
import type { Scene } from '@/app/types/Scene';
import type { PromptComponents } from '@/app/types/Image';
import type { Appearance } from '@/app/types/Character';

interface PromptInputProps {
  onPromptGenerated: (components: PromptComponents, negativePrompt: string) => void;
  compact?: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({
  onPromptGenerated,
  compact = false,
}) => {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;

  // Data fetching
  const { data: scenes = [], isLoading: loadingScenes } = sceneApi.useProjectScenes(
    projectId || '',
    !!projectId
  );
  const { data: acts = [] } = actApi.useProjectActs(projectId || '', !!projectId);
  const { data: characters = [] } = characterApi.useProjectCharacters(
    projectId || '',
    !!projectId
  );

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Character appearances map
  const characterAppearances = useMemo(() => {
    return new Map<string, Appearance>();
  }, []);

  // Group scenes by act
  const scenesByAct = useMemo(() => {
    const grouped: Record<string, typeof scenes> = {};
    scenes.forEach((scene) => {
      const actId = scene.act_id || 'no-act';
      if (!grouped[actId]) grouped[actId] = [];
      grouped[actId].push(scene);
    });
    return grouped;
  }, [scenes]);

  // Get act name
  const getActName = (actId: string) => {
    if (actId === 'no-act') return 'Unassigned';
    const act = acts.find((a) => a.id === actId);
    return act?.name || 'Unknown Act';
  };

  // Handle scene selection and immediate generation
  const handleSceneSelect = async (scene: Scene) => {
    setSelectedScene(scene);
    setIsGenerating(true);

    try {
      const act = acts.find((a) => a.id === scene.act_id);
      const context = sceneParser.parseScene(scene, characters, act);
      const result = promptGenerator.generateMultiShot(
        context,
        characterAppearances,
        { includeCharacterDetails: true }
      );

      // Use the first (master) shot by default
      if (result.prompts.length > 0) {
        const prompt = result.prompts[0];
        onPromptGenerated(prompt.components, prompt.negative);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Error generating prompt:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedScene(null);
  };

  if (!projectId) return null;

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loadingScenes || scenes.length === 0}
          className={`
            px-3 py-1.5 rounded-md text-xs font-medium
            flex items-center gap-1.5 transition-colors
            ${
              selectedScene
                ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-100'
                : 'bg-slate-900/50 border border-slate-800/50 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
            }
            ${(loadingScenes || scenes.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <Film className="w-3.5 h-3.5" />
          {selectedScene ? selectedScene.name : 'From Scene'}
          <ChevronDown className="w-3 h-3" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-1 left-0 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
            >
              <div className="max-h-64 overflow-y-auto p-2">
                {Object.entries(scenesByAct).map(([actId, actScenes]) => (
                  <div key={actId} className="mb-2">
                    <div className="text-xs font-medium text-slate-500 px-2 py-1">
                      {getActName(actId)}
                    </div>
                    {actScenes
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((scene) => (
                        <button
                          key={scene.id}
                          onClick={() => handleSceneSelect(scene)}
                          disabled={isGenerating}
                          className={`
                            w-full text-left px-2 py-1.5 rounded text-xs
                            transition-colors hover:bg-slate-800
                            ${isGenerating ? 'opacity-50' : ''}
                            ${selectedScene?.id === scene.id ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-300'}
                          `}
                        >
                          {scene.name}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-300">
          Quick Scene Select
        </label>
        {selectedScene && (
          <button
            onClick={clearSelection}
            className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loadingScenes || isGenerating}
          className={`
            w-full px-3 py-2.5 rounded-lg text-left text-sm
            flex items-center justify-between transition-colors
            ${
              selectedScene
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-100'
                : 'bg-slate-900/50 border border-slate-800/50 text-slate-400 hover:bg-slate-800/50'
            }
            ${loadingScenes ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Film className="w-4 h-4 text-slate-500" />
            )}
            <span>
              {isGenerating
                ? 'Generating prompt...'
                : selectedScene
                ? selectedScene.name
                : loadingScenes
                ? 'Loading scenes...'
                : scenes.length === 0
                ? 'No scenes available'
                : 'Select a scene to generate prompt'}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && !loadingScenes && scenes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-2 left-0 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden"
            >
              <div className="max-h-72 overflow-y-auto">
                {Object.entries(scenesByAct).map(([actId, actScenes]) => (
                  <div key={actId}>
                    <div className="sticky top-0 bg-slate-800/90 backdrop-blur-sm text-xs font-semibold text-slate-400 px-3 py-2 border-b border-slate-700/50">
                      {getActName(actId)}
                    </div>
                    {actScenes
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((scene) => (
                        <button
                          key={scene.id}
                          onClick={() => handleSceneSelect(scene)}
                          disabled={isGenerating}
                          className={`
                            w-full text-left px-3 py-2 text-sm
                            transition-colors hover:bg-slate-800 border-b border-slate-800/30
                            ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}
                            ${
                              selectedScene?.id === scene.id
                                ? 'bg-cyan-500/10 text-cyan-100'
                                : 'text-slate-300'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{scene.name}</div>
                              {scene.description && (
                                <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[280px]">
                                  {scene.description}
                                </div>
                              )}
                            </div>
                            <Sparkles className="w-4 h-4 text-cyan-500 opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedScene && (
        <p className="text-xs text-slate-500">
          Prompt generated from scene context. You can edit it below.
        </p>
      )}
    </div>
  );
};

export default PromptInput;
