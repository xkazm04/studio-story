'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Wand2, PenTool, ChevronDown, CheckCircle2, AlertCircle, X } from 'lucide-react';
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
type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

// Inline toast for status messages
function StatusToast({
  message,
  type,
  onDismiss,
}: {
  message: string;
  type: 'error' | 'warning' | 'success';
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (type === 'success') {
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  const styles = {
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  };

  const icons = {
    error: <AlertCircle className="w-4 h-4 shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${styles[type]}`}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="p-0.5 hover:opacity-70">
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

// Elapsed time counter
function ElapsedTime({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span className="text-xs text-slate-500 tabular-nums">
      {elapsed}s
    </span>
  );
}

// Generation placeholder card with shimmer
function GeneratingPlaceholder({ startTime, aspectRatio }: { startTime: number; aspectRatio: string }) {
  return (
    <div
      className={`relative rounded-lg border-2 border-cyan-500/40 overflow-hidden ${aspectRatio}`}
      style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
    >
      {/* Shimmer background */}
      <div className="absolute inset-0 bg-slate-900/80">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.08) 50%, transparent 100%)',
            animation: 'shimmer 2s infinite',
          }}
        />
      </div>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-xs text-cyan-400 font-medium">Generating...</span>
        <ElapsedTime startTime={startTime} />
      </div>
    </div>
  );
}

interface ImageGeneratorProps {
  /** Optional scene ID for contextual illustration (passed from workspace composition) */
  sceneId?: string;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ sceneId }) => {
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

  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'warning' | 'success' } | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState(0);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

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

  const dismissStatus = useCallback(() => setStatusMessage(null), []);

  const handleGenerate = async () => {
    if (!activeProjectId) return;

    const finalPrompt = getFinalPrompt();
    if (!finalPrompt.trim()) {
      setStatusMessage({ text: 'Please add some prompt content before generating.', type: 'warning' });
      return;
    }

    setGenerationStatus('generating');
    setGenerationStartTime(Date.now());
    setGeneratedImageUrl(null);
    setStatusMessage(null);

    try {
      // TODO: Call actual image generation API
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

      setGenerationStatus('success');
      setStatusMessage({ text: 'Image generation API integration pending. Infrastructure ready!', type: 'success' });
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationStatus('error');
      setStatusMessage({ text: 'Failed to generate image. Please try again.', type: 'error' });
    }
  };

  const isGenerating = generationStatus === 'generating';
  const aspectRatio = generationParams.width === generationParams.height ? 'aspect-square' : generationParams.width > generationParams.height ? 'aspect-video' : 'aspect-[3/4]';

  return (
    <div className="h-full grid grid-cols-1 @lg:grid-cols-2 gap-4 p-4 overflow-hidden text-sm text-slate-200">
      {/* Left Panel - Prompt & Settings */}
      <div className="flex flex-col gap-4 overflow-y-auto">
        {/* Status Toast */}
        <AnimatePresence>
          {statusMessage && (
            <StatusToast
              message={statusMessage.text}
              type={statusMessage.type}
              onDismiss={dismissStatus}
            />
          )}
        </AnimatePresence>

        {/* Prompt Mode Toggle */}
        <div className="bg-slate-950/95 rounded-lg border border-slate-900/70 p-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-slate-400">Prompt Mode</span>
          </div>
          <div className="flex flex-col @sm:flex-row gap-2">
            <button
              onClick={() => {
                setPromptMode('manual');
                setShowSceneToImage(false);
              }}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium
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
                flex-1 py-2 px-3 rounded-lg text-sm font-medium
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
                  sceneId={sceneId}
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
                <span className="text-sm font-medium text-cyan-100">
                  Prompt generated from scene
                </span>
              </div>
              <button
                onClick={() => setShowSceneToImage(true)}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
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
              ? 'bg-slate-900/80 text-slate-400 cursor-not-allowed border border-slate-800'
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
      <div className="bg-slate-950/95 rounded-lg border border-slate-900/70 p-4 overflow-hidden flex flex-col">
        <h3 className="text-sm font-semibold text-slate-50 mb-3 tracking-tight">Generated Images</h3>

        {/* Live generation placeholder */}
        <AnimatePresence mode="wait">
          {isGenerating && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-3"
            >
              <GeneratingPlaceholder
                startTime={generationStartTime}
                aspectRatio={aspectRatio}
              />
            </motion.div>
          )}

          {generatedImageUrl && generationStatus === 'success' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mb-3"
            >
              <img
                src={generatedImageUrl}
                alt="Generated"
                className={`w-full rounded-lg border border-slate-700 object-cover ${aspectRatio}`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto">
          <ImageGallery />
        </div>
      </div>

      {/* Shimmer keyframe animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ImageGenerator;
