'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Download,
  FileAudio,
  Users,
  Clock,
  Volume2,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Wand2,
  List,
  FileOutput,
} from 'lucide-react';
import { Button } from '@/app/components/UI/Button';
import { CollapsibleSection } from '@/app/components/UI/CollapsibleSection';
import {
  dialogueGenerator,
  chapterAssembler,
  exportPipeline,
  type SceneDialogueResult,
  type ChapterAudio,
  type AudioFormat,
  type AssemblyProgress,
  type ExportProgress,
} from '@/lib/voice';
import type { Act } from '@/app/types/Act';
import type { Scene } from '@/app/types/Scene';
import type { Voice } from '@/app/types/Voice';
import type { Character } from '@/app/types/Character';

interface ProductionPanelProps {
  projectId: string;
  acts: Act[];
  scenes: Scene[];
  voices: Voice[];
  characters: Character[];
  className?: string;
}

type ProductionPhase = 'idle' | 'generating' | 'assembling' | 'exporting' | 'completed';

interface ProductionState {
  phase: ProductionPhase;
  currentAct: number;
  currentScene: number;
  totalActs: number;
  totalScenes: number;
  progress: number;
  error?: string;
}

export default function ProductionPanel({
  projectId,
  acts,
  scenes,
  voices,
  characters,
  className = '',
}: ProductionPanelProps) {
  // Production state
  const [state, setState] = useState<ProductionState>({
    phase: 'idle',
    currentAct: 0,
    currentScene: 0,
    totalActs: acts.length,
    totalScenes: scenes.length,
    progress: 0,
  });

  // Results
  const [sceneResults, setSceneResults] = useState<Map<string, SceneDialogueResult>>(new Map());
  const [chapters, setChapters] = useState<ChapterAudio[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>('mp3');
  const [selectedQuality, setSelectedQuality] = useState<string>('high');

  // UI state
  const [expandedActs, setExpandedActs] = useState<Set<string>>(new Set());
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Group scenes by act
  const scenesByAct = useMemo(() => {
    const map = new Map<string, Scene[]>();
    for (const scene of scenes) {
      const actScenes = map.get(scene.act_id) || [];
      actScenes.push(scene);
      map.set(scene.act_id, actScenes);
    }
    // Sort scenes by order
    for (const [actId, actScenes] of map) {
      map.set(actId, actScenes.sort((a, b) => (a.order || 0) - (b.order || 0)));
    }
    return map;
  }, [scenes]);

  // Toggle act expansion
  const toggleAct = (actId: string) => {
    setExpandedActs(prev => {
      const next = new Set(prev);
      if (next.has(actId)) {
        next.delete(actId);
      } else {
        next.add(actId);
      }
      return next;
    });
  };

  // Generate dialogue for all scenes
  const handleGenerate = useCallback(async () => {
    setState(prev => ({
      ...prev,
      phase: 'generating',
      currentAct: 0,
      currentScene: 0,
      progress: 0,
      error: undefined,
    }));

    const results = new Map<string, SceneDialogueResult>();
    let sceneIndex = 0;
    const totalScenes = scenes.length;

    try {
      for (let actIndex = 0; actIndex < acts.length; actIndex++) {
        const act = acts[actIndex];
        const actScenes = scenesByAct.get(act.id) || [];

        setState(prev => ({
          ...prev,
          currentAct: actIndex + 1,
        }));

        for (let i = 0; i < actScenes.length; i++) {
          const scene = actScenes[i];
          sceneIndex++;

          setState(prev => ({
            ...prev,
            currentScene: sceneIndex,
            progress: Math.round((sceneIndex / totalScenes) * 100),
          }));

          const result = await dialogueGenerator.generateSceneDialogue(
            scene,
            characters,
            voices
          );

          results.set(scene.id, result);
          setSceneResults(new Map(results));
        }
      }

      setState(prev => ({
        ...prev,
        phase: 'idle',
        progress: 100,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        phase: 'idle',
        error: error instanceof Error ? error.message : 'Generation failed',
      }));
    }
  }, [acts, scenes, voices, characters, scenesByAct]);

  // Assemble chapters
  const handleAssemble = useCallback(async () => {
    if (sceneResults.size === 0) {
      setState(prev => ({
        ...prev,
        error: 'Generate dialogue first',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      phase: 'assembling',
      currentAct: 0,
      progress: 0,
      error: undefined,
    }));

    const assembledChapters: ChapterAudio[] = [];

    try {
      for (let i = 0; i < acts.length; i++) {
        const act = acts[i];
        const actScenes = scenesByAct.get(act.id) || [];
        const actResults = actScenes
          .map(s => sceneResults.get(s.id))
          .filter((r): r is SceneDialogueResult => r !== undefined);

        if (actResults.length === 0) continue;

        setState(prev => ({
          ...prev,
          currentAct: i + 1,
        }));

        const chapter = await chapterAssembler.assembleChapter(
          act,
          actResults,
          i + 1,
          (progress: AssemblyProgress) => {
            setState(prev => ({
              ...prev,
              progress: Math.round(((i + progress.percentage / 100) / acts.length) * 100),
            }));
          }
        );

        assembledChapters.push(chapter);
        setChapters([...assembledChapters]);
      }

      setState(prev => ({
        ...prev,
        phase: 'idle',
        progress: 100,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        phase: 'idle',
        error: error instanceof Error ? error.message : 'Assembly failed',
      }));
    }
  }, [acts, sceneResults, scenesByAct]);

  // Export audio
  const handleExport = useCallback(async () => {
    if (chapters.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'Assemble chapters first',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      phase: 'exporting',
      progress: 0,
      error: undefined,
    }));

    try {
      const settings = exportPipeline.getQualityPreset(selectedFormat, selectedQuality);
      const job = exportPipeline.createExportJob(chapters, settings, {
        album: acts[0]?.name || 'Audiobook',
        artist: 'Story Voice Production',
        year: new Date().getFullYear(),
      });

      await exportPipeline.executeExport(job.id, (progress: ExportProgress) => {
        setState(prev => ({
          ...prev,
          progress: progress.percentage,
        }));
      });

      // Download files
      await exportPipeline.downloadJobAsZip(job.id);

      setState(prev => ({
        ...prev,
        phase: 'completed',
        progress: 100,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        phase: 'idle',
        error: error instanceof Error ? error.message : 'Export failed',
      }));
    }
  }, [chapters, selectedFormat, selectedQuality, acts]);

  // Full pipeline
  const handleFullPipeline = useCallback(async () => {
    await handleGenerate();
    // Wait a bit before assembly
    await new Promise(resolve => setTimeout(resolve, 100));
    await handleAssemble();
  }, [handleGenerate, handleAssemble]);

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get scene result status
  const getSceneStatus = (sceneId: string) => {
    const result = sceneResults.get(sceneId);
    if (!result) return 'pending';
    return result.status;
  };

  return (
    <div className={`flex flex-col gap-6 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <FileAudio className="w-6 h-6 text-emerald-400" />
            Voice Production
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Generate audiobook content from your story
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
          >
            <Settings className="w-4 h-4 mr-1.5" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <List className="w-4 h-4" />
            <span className="text-xs">Acts</span>
          </div>
          <span className="text-lg font-semibold text-slate-100">{acts.length}</span>
        </div>
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <FileAudio className="w-4 h-4" />
            <span className="text-xs">Scenes</span>
          </div>
          <span className="text-lg font-semibold text-slate-100">{scenes.length}</span>
        </div>
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs">Voices</span>
          </div>
          <span className="text-lg font-semibold text-slate-100">{voices.length}</span>
        </div>
        <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Est. Duration</span>
          </div>
          <span className="text-lg font-semibold text-slate-100">
            {formatDuration(chapters.reduce((sum, c) => sum + c.totalDuration, 0))}
          </span>
        </div>
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800/50">
              <h3 className="text-sm font-medium text-slate-200 mb-4">Export Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Format</label>
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as AudioFormat)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200"
                  >
                    <option value="mp3">MP3 - Universal</option>
                    <option value="wav">WAV - Broadcast</option>
                    <option value="aac">AAC - High Quality</option>
                    <option value="m4a">M4A - Apple</option>
                    <option value="flac">FLAC - Lossless</option>
                    <option value="ogg">OGG - Open</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Quality</label>
                  <select
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-sm text-slate-200"
                  >
                    <option value="low">Low (128 kbps)</option>
                    <option value="medium">Medium (192 kbps)</option>
                    <option value="high">High (256 kbps)</option>
                    <option value="highest">Highest (320 kbps)</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress indicator */}
      {state.phase !== 'idle' && state.phase !== 'completed' && (
        <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-sm text-emerald-300">
                {state.phase === 'generating' && `Generating dialogue... Scene ${state.currentScene}/${state.totalScenes}`}
                {state.phase === 'assembling' && `Assembling chapter ${state.currentAct}/${state.totalActs}`}
                {state.phase === 'exporting' && 'Exporting audio...'}
              </span>
            </div>
            <span className="text-sm text-emerald-400">{state.progress}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${state.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {state.error && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300">{state.error}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          onClick={handleFullPipeline}
          disabled={state.phase !== 'idle' && state.phase !== 'completed'}
          className="flex-1"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Generate All
        </Button>

        <Button
          variant="secondary"
          onClick={handleGenerate}
          disabled={state.phase !== 'idle' && state.phase !== 'completed'}
        >
          <Play className="w-4 h-4 mr-1.5" />
          Dialogue
        </Button>

        <Button
          variant="secondary"
          onClick={handleAssemble}
          disabled={(state.phase !== 'idle' && state.phase !== 'completed') || sceneResults.size === 0}
        >
          <FileAudio className="w-4 h-4 mr-1.5" />
          Assemble
        </Button>

        <Button
          variant="secondary"
          onClick={handleExport}
          disabled={(state.phase !== 'idle' && state.phase !== 'completed') || chapters.length === 0}
        >
          <Download className="w-4 h-4 mr-1.5" />
          Export
        </Button>
      </div>

      {/* Timeline view */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <List className="w-4 h-4" />
          Production Timeline
        </h3>

        <div className="space-y-1">
          {acts.map((act, actIndex) => {
            const actScenes = scenesByAct.get(act.id) || [];
            const isExpanded = expandedActs.has(act.id);
            const chapter = chapters.find(c => c.actId === act.id);

            return (
              <div key={act.id} className="rounded-lg border border-slate-800/50 overflow-hidden">
                {/* Act header */}
                <button
                  onClick={() => toggleAct(act.id)}
                  className="w-full flex items-center justify-between p-3 bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-sm font-medium text-slate-200">
                      Chapter {actIndex + 1}: {act.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      {actScenes.length} scenes
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {chapter && (
                      <>
                        <span className="text-xs text-slate-400">
                          {formatDuration(chapter.totalDuration)}
                        </span>
                        {chapter.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                      </>
                    )}
                  </div>
                </button>

                {/* Scenes list */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-2 space-y-1 bg-slate-950/50">
                        {actScenes.map((scene, sceneIndex) => {
                          const result = sceneResults.get(scene.id);
                          const status = getSceneStatus(scene.id);

                          return (
                            <div
                              key={scene.id}
                              className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-900/30"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 w-6">
                                  {sceneIndex + 1}.
                                </span>
                                <span className="text-sm text-slate-300">{scene.name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {result && (
                                  <>
                                    <span className="text-xs text-slate-500">
                                      {result.dialogueLines.length} lines
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      {formatDuration(result.totalDuration)}
                                    </span>
                                  </>
                                )}
                                {status === 'completed' && (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                                {status === 'generating' && (
                                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                                )}
                                {status === 'failed' && (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Completed chapters */}
      {chapters.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <FileOutput className="w-4 h-4" />
            Ready for Export
          </h3>

          <div className="grid gap-2">
            {chapters.map((chapter, i) => (
              <div
                key={chapter.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-200">
                    Chapter {i + 1}: {chapter.actName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {chapter.scenes.length} scenes
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDuration(chapter.totalDuration)}
                  </span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
