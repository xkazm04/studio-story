'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Wand2, PenTool, ChevronDown } from 'lucide-react';
import PromptBuilder from '../components/PromptBuilder';
import CameraSetup from './CameraSetup';
import GenerationControls from './GenerationControls';
import ImageGallery from '../components/ImageGallery';
import SceneToImage from './components/SceneToImage';
import { useProjectStore } from '@/app/store/projectStore';
import { useCreateImage } from '@/app/hooks/useImages';
import type { PromptComponents } from '@/app/types/Image';

interface GenerationParams {
  width: number;
  height: number;
  steps: number;
  cfg_scale: number;
  num_images: number;
  provider: 'leonardo' | 'stability' | 'midjourney' | 'dalle' | 'local';
}

type PromptMode = 'manual' | 'scene';

const ImageGenerator: React.FC = () => {
  const { selectedProject } = useProjectStore();
  const activeProjectId = selectedProject?.id;
  const createImage = useCreateImage();

  // Prompt mode state
  const [promptMode, setPromptMode] = useState<PromptMode>('manual');
  const [showSceneToImage, setShowSceneToImage] = useState(false);

  const [promptComponents, setPromptComponents] = useState<PromptComponents>({
    artstyle: '',
    scenery: '',
    actors: '',
    actions: '',
    camera: '',
  });

  const [negativePrompt, setNegativePrompt] = useState('');
  const [generationParams, setGenerationParams] = useState<GenerationParams>({
    width: 1024,
    height: 1024,
    steps: 30,
    cfg_scale: 7.5,
    num_images: 1,
    provider: 'leonardo',
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Handle prompt generated from SceneToImage
  const handleScenePromptGenerated = useCallback(
    (components: PromptComponents, negative: string) => {
      setPromptComponents(components);
      setNegativePrompt(negative);
      setShowSceneToImage(false);
      setPromptMode('scene');
    },
    []
  );

  // Combine all prompt components into final prompt
  const getFinalPrompt = () => {
    return Object.values(promptComponents)
      .filter(Boolean)
      .join(', ');
  };

  const handleGenerate = async () => {
    if (!activeProjectId) return;

    const finalPrompt = getFinalPrompt();
    if (!finalPrompt.trim()) {
      alert('Please add some prompt content before generating');
      return;
    }

    setIsGenerating(true);

    try {
      // TODO: Call actual image generation API
      // For now, we'll create a placeholder entry
      console.log('Generating image with:', {
        prompt: finalPrompt,
        negative_prompt: negativePrompt,
        ...generationParams,
      });

      // Placeholder: This would be replaced with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Once we have the actual image URL from the API, save it
      // await createImage.mutateAsync({
      //   project_id: activeProjectId,
      //   url: imageUrl,
      //   prompt: finalPrompt,
      //   negative_prompt: negativePrompt || null,
      //   provider: generationParams.provider,
      //   width: generationParams.width,
      //   height: generationParams.height,
      //   steps: generationParams.steps,
      //   cfg_scale: generationParams.cfg_scale,
      // });

      alert('Image generation API integration pending. Infrastructure ready!');
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full grid grid-cols-2 gap-4 p-4 overflow-hidden text-sm text-slate-200">
      {/* Left Panel - Prompt & Settings */}
      <div className="flex flex-col gap-4 overflow-y-auto">
        {/* Prompt Mode Toggle */}
        <div className="bg-slate-950/95 rounded-lg border border-slate-900/70 p-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-slate-400">Prompt Mode</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPromptMode('manual');
                setShowSceneToImage(false);
              }}
              className={`
                flex-1 py-2 px-3 rounded-lg text-xs font-medium
                flex items-center justify-center gap-2 transition-colors
                ${
                  promptMode === 'manual'
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-100'
                    : 'bg-slate-900/50 border border-slate-800/50 text-slate-400 hover:text-slate-300'
                }
              `}
            >
              <PenTool className="w-3.5 h-3.5" />
              Manual
            </button>
            <button
              onClick={() => {
                setPromptMode('scene');
                setShowSceneToImage(true);
              }}
              className={`
                flex-1 py-2 px-3 rounded-lg text-xs font-medium
                flex items-center justify-center gap-2 transition-colors
                ${
                  promptMode === 'scene'
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-100'
                    : 'bg-slate-900/50 border border-slate-800/50 text-slate-400 hover:text-slate-300'
                }
              `}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Scene to Image
            </button>
          </div>
        </div>

        {/* Scene to Image Panel (collapsible) */}
        <AnimatePresence>
          {showSceneToImage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-slate-950/95 rounded-lg border border-cyan-500/30 p-4">
                <SceneToImage
                  onPromptGenerated={handleScenePromptGenerated}
                  onClose={() => setShowSceneToImage(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scene-generated prompt indicator */}
        {promptMode === 'scene' && !showSceneToImage && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-100">
                  Prompt generated from scene
                </span>
              </div>
              <button
                onClick={() => setShowSceneToImage(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                Change scene
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Prompt Builder */}
        <div className="bg-slate-950/95 rounded-lg border border-slate-900/70">
          <PromptBuilder
            promptComponents={promptComponents}
            setPromptComponents={setPromptComponents}
            negativePrompt={negativePrompt}
            setNegativePrompt={setNegativePrompt}
          />
        </div>

        {/* Camera Setup */}
        <div className="bg-slate-950/95 rounded-lg border border-slate-900/70 p-4">
          <h3 className="text-sm font-semibold text-slate-50 mb-3 tracking-tight">Camera Setup</h3>
          <CameraSetup
            onCameraChange={(cameraPrompt) => {
              setPromptComponents((prev) => ({
                ...prev,
                camera: cameraPrompt,
              }));
            }}
          />
        </div>

        {/* Generation Controls */}
        <div className="bg-slate-950/95 rounded-lg border border-slate-900/70 p-4">
          <h3 className="text-sm font-semibold text-slate-50 mb-3 tracking-tight">Generation Settings</h3>
          <GenerationControls
            params={generationParams}
            onChange={(params) => setGenerationParams(params)}
          />
        </div>

        {/* Generate Button */}
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating || !activeProjectId}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`
            w-full py-3 rounded-lg font-semibold text-sm
            transition-colors duration-200 flex items-center justify-center gap-2
            ${isGenerating || !activeProjectId
              ? 'bg-slate-900/80 text-slate-500 cursor-not-allowed border border-slate-800'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25'
            }
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Images'
          )}
        </motion.button>
      </div>

      {/* Right Panel - Gallery */}
      <div className="bg-slate-950/95 rounded-lg border border-slate-900/70 p-4 overflow-hidden">
        <h3 className="text-sm font-semibold text-slate-50 mb-3 tracking-tight">Generated Images</h3>
        <ImageGallery />
      </div>
    </div>
  );
};

export default ImageGenerator;
