'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Users,
  MapPin,
  Heart,
  Camera,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProjectStore } from '@/app/store/projectStore';
import { sceneApi } from '@/app/hooks/integration/useScenes';
import { actApi } from '@/app/hooks/integration/useActs';
import { characterApi } from '@/app/hooks/integration/useCharacters';
import { sceneParser, promptGenerator } from '@/lib/image';
import GenerationGallery from './GenerationGallery';
import type { ParsedSceneContext, GeneratedPrompt, ShotType } from '@/lib/image';
import type { PromptComponents } from '@/app/types/Image';
import type { Appearance } from '@/app/types/Character';

interface SceneToImageProps {
  onPromptGenerated: (components: PromptComponents, negativePrompt: string) => void;
  onClose?: () => void;
  /** When provided, fetch this scene directly instead of showing a scene selector */
  sceneId?: string;
}

type IllustrationPhase = 'idle' | 'generating' | 'gallery' | 'error';

interface GeneratedImage {
  id: string;
  url: string;
}

const SHOT_TYPE_LABELS: Record<ShotType, { label: string; icon: string }> = {
  establishing: { label: 'Establishing Shot', icon: '🏔️' },
  master: { label: 'Master Shot', icon: '🎬' },
  medium: { label: 'Medium Shot', icon: '👤' },
  'close-up': { label: 'Close-up', icon: '😊' },
  'extreme-close-up': { label: 'Extreme Close-up', icon: '👁️' },
  'over-shoulder': { label: 'Over Shoulder', icon: '🔄' },
  reaction: { label: 'Reaction Shot', icon: '😮' },
  detail: { label: 'Detail Shot', icon: '🔍' },
  action: { label: 'Action Shot', icon: '⚡' },
};

const SceneToImage: React.FC<SceneToImageProps> = ({ onPromptGenerated, onClose, sceneId: propSceneId }) => {
  const { selectedProject } = useProjectStore();
  const projectId = selectedProject?.id;
  const queryClient = useQueryClient();

  // Data fetching -- use direct scene fetch when sceneId is provided
  const { data: directScene } = useQuery({
    queryKey: ['scene', propSceneId],
    queryFn: () => fetch(`/api/scenes/${propSceneId}`).then(r => r.json()),
    enabled: !!propSceneId,
  });

  const { data: scenes = [], isLoading: loadingScenes } = sceneApi.useProjectScenes(
    projectId || '',
    !!projectId && !propSceneId
  );
  const { data: acts = [] } = actApi.useProjectActs(projectId || '', !!projectId);
  const { data: characters = [] } = characterApi.useProjectCharacters(
    projectId || '',
    !!projectId
  );

  // State
  const [selectedSceneId, setSelectedSceneId] = useState<string>(propSceneId || '');
  const [parsedContext, setParsedContext] = useState<ParsedSceneContext | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['prompts'])
  );
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Illustration flow state
  const [illustrationPhase, setIllustrationPhase] = useState<IllustrationPhase>('idle');
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [autoDraftedPrompt, setAutoDraftedPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [illustrationError, setIllustrationError] = useState<string | null>(null);

  // Sync propSceneId on mount / change
  useEffect(() => {
    if (propSceneId) setSelectedSceneId(propSceneId);
  }, [propSceneId]);

  // Poll generation status when generating
  const { data: generationStatus } = useQuery({
    queryKey: ['illustration-status', selectedSceneId, generationId],
    queryFn: () =>
      fetch(`/api/scenes/${selectedSceneId}/illustrate?generationId=${generationId}`).then(r =>
        r.json()
      ),
    enabled: illustrationPhase === 'generating' && !!generationId && !!selectedSceneId,
    refetchInterval: (query) => {
      const data = query.state.data as { status?: string } | undefined;
      return data?.status === 'pending' ? 2000 : false;
    },
  });

  // React to polling result
  useEffect(() => {
    if (!generationStatus) return;
    if (generationStatus.status === 'complete' && generationStatus.images?.length > 0) {
      setGeneratedImages(generationStatus.images);
      setIllustrationPhase('gallery');
    } else if (generationStatus.status === 'failed') {
      setIllustrationError(generationStatus.error || 'Generation failed');
      setIllustrationPhase('error');
    }
  }, [generationStatus]);

  // Character appearances map
  const characterAppearances = useMemo(() => {
    const map = new Map<string, Appearance>();
    return map;
  }, []);

  // Effective scenes list: when propSceneId, use directScene; otherwise use project scenes
  const effectiveScenes = useMemo(() => {
    if (propSceneId && directScene) {
      return [directScene];
    }
    return scenes;
  }, [propSceneId, directScene, scenes]);

  // Group scenes by act
  const scenesByAct = useMemo(() => {
    const grouped: Record<string, typeof scenes> = {};
    effectiveScenes.forEach((scene) => {
      const actId = scene.act_id || 'no-act';
      if (!grouped[actId]) grouped[actId] = [];
      grouped[actId].push(scene);
    });
    return grouped;
  }, [effectiveScenes]);

  // Get act name by ID
  const getActName = useCallback(
    (actId: string) => {
      if (actId === 'no-act') return 'Unassigned';
      const act = acts.find((a) => a.id === actId);
      return act?.name || 'Unknown Act';
    },
    [acts]
  );

  // Analyze scene and generate prompts
  const analyzeScene = useCallback(async () => {
    if (!selectedSceneId) return;

    const scene = effectiveScenes.find((s) => s.id === selectedSceneId);
    if (!scene) return;

    setIsAnalyzing(true);

    try {
      const act = acts.find((a) => a.id === scene.act_id);
      const context = sceneParser.parseScene(scene, characters, act);
      setParsedContext(context);

      const result = promptGenerator.generateMultiShot(
        context,
        characterAppearances,
        { includeCharacterDetails: true }
      );

      setGeneratedPrompts(result.prompts);
      setSelectedPromptIndex(0);
      setExpandedSections(new Set(['context', 'prompts']));
    } catch (error) {
      console.error('Error analyzing scene:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedSceneId, effectiveScenes, acts, characters, characterAppearances]);

  // Start illustration generation
  const startIllustration = useCallback(async () => {
    if (!selectedSceneId) return;

    setIllustrationPhase('generating');
    setIllustrationError(null);
    setGeneratedImages([]);
    setSelectedImageId(null);

    try {
      const body: Record<string, unknown> = {};
      if (autoDraftedPrompt.trim()) {
        body.promptOverride = autoDraftedPrompt;
      }

      const response = await fetch(`/api/scenes/${selectedSceneId}/illustrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start illustration');
      }

      setGenerationId(data.generationId);
      // Set the auto-drafted prompt for the user to review
      if (data.prompt && !autoDraftedPrompt.trim()) {
        setAutoDraftedPrompt(data.prompt);
      }
    } catch (error) {
      console.error('Illustration error:', error);
      setIllustrationError(error instanceof Error ? error.message : 'Unknown error');
      setIllustrationPhase('error');
    }
  }, [selectedSceneId, autoDraftedPrompt]);

  // Confirm selected illustration
  const confirmIllustration = useCallback(async () => {
    if (!selectedSceneId || !selectedImageId) return;

    const selectedImage = generatedImages.find(img => img.id === selectedImageId);
    if (!selectedImage) return;

    setIsConfirming(true);

    try {
      const response = await fetch(`/api/scenes/${selectedSceneId}/illustrate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedImage.url,
          generationId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save illustration');
      }

      // Invalidate scene cache so the new image_url is reflected
      queryClient.invalidateQueries({ queryKey: ['scene', selectedSceneId] });
      queryClient.invalidateQueries({ queryKey: ['scenes'] });

      // Reset illustration state
      setIllustrationPhase('idle');
      setGeneratedImages([]);
      setSelectedImageId(null);
      setGenerationId(null);
      setAutoDraftedPrompt('');
    } catch (error) {
      console.error('Confirm illustration error:', error);
      setIllustrationError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsConfirming(false);
    }
  }, [selectedSceneId, selectedImageId, generatedImages, generationId, queryClient]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Apply selected prompt
  const applyPrompt = useCallback(
    (prompt: GeneratedPrompt) => {
      onPromptGenerated(prompt.components, prompt.negative);
      onClose?.();
    },
    [onPromptGenerated, onClose]
  );

  // Copy prompt to clipboard
  const copyPrompt = useCallback(async (prompt: GeneratedPrompt, index: number) => {
    try {
      await navigator.clipboard.writeText(prompt.main);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  // Render scene selector (only when no propSceneId)
  const renderSceneSelector = () => {
    if (propSceneId) {
      // When sceneId is provided via prop, show the scene name directly
      const scene = effectiveScenes.find(s => s.id === propSceneId);
      return scene ? (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-100">{scene.name}</span>
          </div>
          {scene.description && (
            <p className="text-sm text-slate-400 mt-1 truncate">{scene.description}</p>
          )}
        </div>
      ) : null;
    }

    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Scene to Analyze
        </label>

        {loadingScenes ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading scenes...
          </div>
        ) : effectiveScenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <AlertCircle className="w-8 h-8 mb-2 text-slate-400" />
            <p className="text-sm">No scenes found in this project</p>
            <p className="text-sm text-slate-400 mt-1">Create some scenes first</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {Object.entries(scenesByAct).map(([actId, actScenes]) => (
              <div key={actId} className="space-y-1">
                <div className="text-sm font-medium text-slate-400 px-2 py-1">
                  {getActName(actId)}
                </div>
                {actScenes
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((scene) => (
                    <button
                      key={scene.id}
                      onClick={() => setSelectedSceneId(scene.id)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm
                        transition-colors duration-150
                        ${
                          selectedSceneId === scene.id
                            ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-100'
                            : 'bg-slate-900/50 border border-slate-800/50 text-slate-300 hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <div className="font-medium">{scene.name}</div>
                      {scene.description && (
                        <div className="text-sm text-slate-400 mt-0.5 truncate">
                          {scene.description}
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render illustration flow
  const renderIllustrationFlow = () => {
    if (!selectedSceneId) return null;

    return (
      <div className="space-y-3 border border-slate-800/70 rounded-lg bg-slate-950/80 p-3">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">Illustrate Scene</span>
        </div>

        {/* Editable auto-drafted prompt */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Illustration prompt (auto-drafted, editable)
          </label>
          <textarea
            value={autoDraftedPrompt}
            onChange={(e) => setAutoDraftedPrompt(e.target.value)}
            placeholder="Leave empty to auto-generate from scene context, or customize your prompt..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/50 text-sm text-slate-200 placeholder:text-slate-500 resize-none focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/30"
          />
        </div>

        {/* Generate button */}
        {illustrationPhase === 'idle' && (
          <motion.button
            onClick={startIllustration}
            disabled={!selectedSceneId}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`
              w-full py-2.5 rounded-lg font-medium text-sm
              flex items-center justify-center gap-2 transition-colors duration-200
              ${
                !selectedSceneId
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/25'
              }
            `}
          >
            <ImageIcon className="w-4 h-4" />
            Illustrate Scene
          </motion.button>
        )}

        {/* Generating state */}
        {illustrationPhase === 'generating' && (
          <div className="flex items-center justify-center py-6 text-slate-300">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
            <span className="text-sm">Generating 4 illustrations...</span>
          </div>
        )}

        {/* Gallery */}
        {illustrationPhase === 'gallery' && generatedImages.length > 0 && (
          <GenerationGallery
            images={generatedImages}
            selectedId={selectedImageId}
            onSelect={setSelectedImageId}
            onConfirm={confirmIllustration}
            isConfirming={isConfirming}
            onRegenerate={() => {
              setIllustrationPhase('idle');
              setGeneratedImages([]);
              setSelectedImageId(null);
              setGenerationId(null);
            }}
          />
        )}

        {/* Error state */}
        {illustrationPhase === 'error' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{illustrationError || 'Generation failed'}</span>
            </div>
            <button
              onClick={() => {
                setIllustrationPhase('idle');
                setIllustrationError(null);
              }}
              className="w-full py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render parsed context summary
  const renderContextSummary = () => {
    if (!parsedContext) return null;

    const isExpanded = expandedSections.has('context');

    return (
      <div className="border border-slate-800/70 rounded-lg overflow-hidden bg-slate-950/80">
        <button
          onClick={() => toggleSection('context')}
          className="w-full flex items-center justify-between p-3 hover:bg-slate-900/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-200">
              Scene Analysis Results
            </span>
          </div>
          <span className="text-sm text-green-500">Analyzed</span>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 space-y-3">
                {/* Characters */}
                {parsedContext.characters.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-300">Characters</div>
                      <div className="text-sm text-slate-400">
                        {parsedContext.characters
                          .map((c) => `${c.name}${c.emotion ? ` (${c.emotion})` : ''}`)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Setting */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-green-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-300">Setting</div>
                    <div className="text-sm text-slate-400">
                      {parsedContext.setting.location}
                      {parsedContext.setting.timeOfDay &&
                        parsedContext.setting.timeOfDay !== 'unknown' &&
                        ` (${parsedContext.setting.timeOfDay})`}
                      {parsedContext.setting.weather && `, ${parsedContext.setting.weather}`}
                    </div>
                  </div>
                </div>

                {/* Mood */}
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-pink-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-300">Mood</div>
                    <div className="text-sm text-slate-400">
                      {parsedContext.mood.primary}
                      {parsedContext.mood.secondary && ` / ${parsedContext.mood.secondary}`}
                      {' '}(intensity {parsedContext.mood.intensity}/5)
                    </div>
                  </div>
                </div>

                {/* Visual Elements */}
                {parsedContext.visualElements.length > 0 && (
                  <div className="flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-300">Visual Elements</div>
                      <div className="text-sm text-slate-400">
                        {parsedContext.visualElements
                          .slice(0, 5)
                          .map((e) => e.value)
                          .join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Render generated prompts
  const renderGeneratedPrompts = () => {
    if (generatedPrompts.length === 0) return null;

    const isExpanded = expandedSections.has('prompts');

    return (
      <div className="border border-slate-800/70 rounded-lg overflow-hidden bg-slate-950/80">
        <button
          onClick={() => toggleSection('prompts')}
          className="w-full flex items-center justify-between p-3 hover:bg-slate-900/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-200">
              Generated Prompts ({generatedPrompts.length})
            </span>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 space-y-3">
                {/* Shot type tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {generatedPrompts.map((prompt, index) => {
                    const shotInfo = SHOT_TYPE_LABELS[prompt.shotType];
                    return (
                      <button
                        key={prompt.id}
                        onClick={() => setSelectedPromptIndex(index)}
                        className={`
                          px-2.5 py-1.5 rounded-md text-sm font-medium
                          transition-colors duration-150
                          ${
                            selectedPromptIndex === index
                              ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-100'
                              : 'bg-slate-900/50 border border-slate-800/50 text-slate-400 hover:text-slate-300'
                          }
                        `}
                      >
                        <span className="mr-1">{shotInfo.icon}</span>
                        {shotInfo.label}
                      </button>
                    );
                  })}
                </div>

                {/* Selected prompt details */}
                {generatedPrompts[selectedPromptIndex] && (
                  <div className="space-y-3">
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300">Main Prompt</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-slate-400">
                            Confidence: {Math.round(generatedPrompts[selectedPromptIndex].confidence * 100)}%
                          </span>
                          <button
                            onClick={() =>
                              copyPrompt(generatedPrompts[selectedPromptIndex], selectedPromptIndex)
                            }
                            className="p-1 hover:bg-slate-800 rounded transition-colors"
                          >
                            {copiedIndex === selectedPromptIndex ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {generatedPrompts[selectedPromptIndex].main}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50">
                      <div className="text-sm font-medium text-slate-300 mb-2">
                        Negative Prompt
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {generatedPrompts[selectedPromptIndex].negative}
                      </p>
                    </div>

                    {generatedPrompts[selectedPromptIndex].reasoning && (
                      <div className="text-sm text-slate-400 bg-slate-900/30 rounded-lg p-2">
                        <span className="text-slate-400">Reasoning:</span>{' '}
                        {generatedPrompts[selectedPromptIndex].reasoning}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => applyPrompt(generatedPrompts[selectedPromptIndex])}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium shadow-md shadow-cyan-500/25"
                      >
                        Apply This Prompt
                      </motion.button>
                      <motion.button
                        onClick={analyzeScene}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!projectId) {
    return (
      <div className="p-4 text-center text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">Select a project to use Scene to Image</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-100">Scene to Image</h3>
      </div>

      {renderSceneSelector()}

      {/* Analyze & Generate Prompts button (only in selector mode) */}
      {!propSceneId && (
        <motion.button
          onClick={analyzeScene}
          disabled={!selectedSceneId || isAnalyzing}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`
            w-full py-2.5 rounded-lg font-medium text-sm
            flex items-center justify-center gap-2
            transition-colors duration-200
            ${
              !selectedSceneId || isAnalyzing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/25'
            }
          `}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Scene...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Analyze & Generate Prompts
            </>
          )}
        </motion.button>
      )}

      {renderIllustrationFlow()}
      {renderContextSummary()}
      {renderGeneratedPrompts()}
    </div>
  );
};

export default SceneToImage;
