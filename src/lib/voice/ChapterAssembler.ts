/**
 * ChapterAssembler - Audio compilation system
 *
 * Assembles scene audio into chapter-length content,
 * handles transitions, and manages chapter ordering.
 */

import type { AudioSegment, SceneDialogueResult } from './DialogueGenerator';
import type { Act } from '@/app/types/Act';
import type { Scene } from '@/app/types/Scene';

/**
 * Chapter audio compilation
 */
export interface ChapterAudio {
  id: string;
  actId: string;
  actName: string;
  chapterNumber: number;
  scenes: ChapterScene[];
  totalDuration: number;
  audioUrl?: string;
  audioBlob?: Blob;
  status: 'pending' | 'assembling' | 'completed' | 'failed';
  error?: string;
  metadata: ChapterMetadata;
}

/**
 * Scene within a chapter
 */
export interface ChapterScene {
  sceneId: string;
  sceneName: string;
  order: number;
  startTime: number;
  endTime: number;
  duration: number;
  audioSegments: AudioSegment[];
}

/**
 * Chapter metadata for exports
 */
export interface ChapterMetadata {
  title: string;
  number: number;
  duration: number;
  sceneCount: number;
  characterCount: number;
  wordCount: number;
  createdAt: string;
  projectId?: string;
  projectName?: string;
}

/**
 * Transition configuration
 */
export interface TransitionConfig {
  type: 'silence' | 'fade' | 'crossfade';
  duration: number; // ms
  fadeIn?: number; // ms for fade-in
  fadeOut?: number; // ms for fade-out
}

/**
 * Assembly options
 */
export interface AssemblyOptions {
  transitionBetweenScenes?: TransitionConfig;
  silenceAtStart?: number; // ms
  silenceAtEnd?: number; // ms
  normalizeVolume?: boolean;
  targetLoudness?: number; // LUFS
}

const DEFAULT_OPTIONS: AssemblyOptions = {
  transitionBetweenScenes: {
    type: 'silence',
    duration: 1500,
  },
  silenceAtStart: 500,
  silenceAtEnd: 1000,
  normalizeVolume: true,
  targetLoudness: -16,
};

/**
 * Assembly progress event
 */
export interface AssemblyProgress {
  chapterId: string;
  phase: 'preparing' | 'assembling' | 'processing' | 'finalizing';
  current: number;
  total: number;
  percentage: number;
  currentScene?: string;
}

type ProgressCallback = (progress: AssemblyProgress) => void;

/**
 * ChapterAssembler singleton class
 */
class ChapterAssembler {
  private static instance: ChapterAssembler;
  private options: AssemblyOptions = DEFAULT_OPTIONS;
  private assemblyQueue: Array<{
    act: Act;
    sceneResults: SceneDialogueResult[];
    resolve: (result: ChapterAudio) => void;
    reject: (error: Error) => void;
    onProgress?: ProgressCallback;
  }> = [];
  private isProcessing = false;
  private progressListeners: Map<string, ProgressCallback> = new Map();

  private constructor() {}

  static getInstance(): ChapterAssembler {
    if (!ChapterAssembler.instance) {
      ChapterAssembler.instance = new ChapterAssembler();
    }
    return ChapterAssembler.instance;
  }

  /**
   * Configure assembly options
   */
  configure(options: Partial<AssemblyOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Set transition configuration
   */
  setTransition(config: TransitionConfig): void {
    this.options.transitionBetweenScenes = config;
  }

  /**
   * Assemble scenes into a chapter
   */
  async assembleChapter(
    act: Act,
    sceneResults: SceneDialogueResult[],
    chapterNumber: number,
    onProgress?: ProgressCallback
  ): Promise<ChapterAudio> {
    const chapterId = `chapter_${act.id}_${chapterNumber}`;

    const chapter: ChapterAudio = {
      id: chapterId,
      actId: act.id,
      actName: act.name,
      chapterNumber,
      scenes: [],
      totalDuration: 0,
      status: 'assembling',
      metadata: {
        title: act.name,
        number: chapterNumber,
        duration: 0,
        sceneCount: sceneResults.length,
        characterCount: 0,
        wordCount: 0,
        createdAt: new Date().toISOString(),
        projectId: act.project_id,
      },
    };

    try {
      // Report progress: preparing
      this.reportProgress(chapterId, {
        chapterId,
        phase: 'preparing',
        current: 0,
        total: sceneResults.length,
        percentage: 0,
      }, onProgress);

      // Sort scene results by order
      const sortedResults = [...sceneResults].sort((a, b) => {
        // Try to find order from scene data if available
        return 0; // Maintain input order
      });

      // Track unique characters and word count
      const characters = new Set<string>();
      let wordCount = 0;

      // Current time position
      let currentTime = (this.options.silenceAtStart || 0) / 1000;

      // Process each scene
      for (let i = 0; i < sortedResults.length; i++) {
        const sceneResult = sortedResults[i];

        // Report progress: assembling
        this.reportProgress(chapterId, {
          chapterId,
          phase: 'assembling',
          current: i + 1,
          total: sortedResults.length,
          percentage: Math.round(((i + 1) / sortedResults.length) * 50),
          currentScene: sceneResult.sceneName,
        }, onProgress);

        // Calculate scene timing
        const sceneStartTime = currentTime;
        const adjustedSegments: AudioSegment[] = [];

        for (const segment of sceneResult.audioSegments) {
          // Track characters
          if (segment.speakerName !== 'Narrator') {
            characters.add(segment.speakerName);
          }

          // Count words
          wordCount += segment.text.split(/\s+/).length;

          // Adjust segment timing relative to chapter
          adjustedSegments.push({
            ...segment,
            startTime: currentTime,
          });

          currentTime += segment.duration;
        }

        const sceneEndTime = currentTime;
        const sceneDuration = sceneEndTime - sceneStartTime;

        // Add scene to chapter
        chapter.scenes.push({
          sceneId: sceneResult.sceneId,
          sceneName: sceneResult.sceneName,
          order: i,
          startTime: sceneStartTime,
          endTime: sceneEndTime,
          duration: sceneDuration,
          audioSegments: adjustedSegments,
        });

        // Add transition between scenes (except after last scene)
        if (i < sortedResults.length - 1 && this.options.transitionBetweenScenes) {
          currentTime += this.options.transitionBetweenScenes.duration / 1000;
        }

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Add end silence
      currentTime += (this.options.silenceAtEnd || 0) / 1000;

      // Report progress: processing
      this.reportProgress(chapterId, {
        chapterId,
        phase: 'processing',
        current: sortedResults.length,
        total: sortedResults.length,
        percentage: 75,
      }, onProgress);

      // Update chapter metadata
      chapter.totalDuration = currentTime;
      chapter.metadata.duration = currentTime;
      chapter.metadata.characterCount = characters.size;
      chapter.metadata.wordCount = wordCount;

      // Simulate audio concatenation
      await this.concatenateAudio(chapter);

      // Report progress: finalizing
      this.reportProgress(chapterId, {
        chapterId,
        phase: 'finalizing',
        current: sortedResults.length,
        total: sortedResults.length,
        percentage: 100,
      }, onProgress);

      chapter.status = 'completed';
    } catch (error) {
      chapter.status = 'failed';
      chapter.error = error instanceof Error ? error.message : 'Assembly failed';
    }

    return chapter;
  }

  /**
   * Concatenate audio segments (mock implementation)
   */
  private async concatenateAudio(chapter: ChapterAudio): Promise<void> {
    // Simulate concatenation time based on duration
    const processingTime = Math.min(chapter.totalDuration * 10, 500);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Would generate actual combined audio here
    chapter.audioUrl = `blob:chapter/${chapter.id}`;
  }

  /**
   * Report progress to listeners
   */
  private reportProgress(
    chapterId: string,
    progress: AssemblyProgress,
    callback?: ProgressCallback
  ): void {
    // Call direct callback
    if (callback) {
      callback(progress);
    }

    // Call registered listeners
    const listener = this.progressListeners.get(chapterId);
    if (listener) {
      listener(progress);
    }
  }

  /**
   * Register progress listener for a chapter
   */
  onProgress(chapterId: string, callback: ProgressCallback): () => void {
    this.progressListeners.set(chapterId, callback);
    return () => this.progressListeners.delete(chapterId);
  }

  /**
   * Queue chapter for assembly
   */
  queueChapterAssembly(
    act: Act,
    sceneResults: SceneDialogueResult[],
    chapterNumber: number,
    onProgress?: ProgressCallback
  ): Promise<ChapterAudio> {
    return new Promise((resolve, reject) => {
      this.assemblyQueue.push({
        act,
        sceneResults,
        resolve,
        reject,
        onProgress,
      });

      // Store chapter number
      (this.assemblyQueue[this.assemblyQueue.length - 1] as any).chapterNumber = chapterNumber;

      this.processQueue();
    });
  }

  /**
   * Process assembly queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.assemblyQueue.length === 0) return;

    this.isProcessing = true;

    while (this.assemblyQueue.length > 0) {
      const item = this.assemblyQueue.shift()!;
      const { act, sceneResults, resolve, reject, onProgress } = item;
      const chapterNumber = (item as any).chapterNumber;

      try {
        const result = await this.assembleChapter(act, sceneResults, chapterNumber, onProgress);
        resolve(result);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Assembly failed'));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Assemble multiple acts into a book
   */
  async assembleBook(
    acts: Act[],
    sceneResultsByAct: Map<string, SceneDialogueResult[]>,
    onProgress?: (actIndex: number, chapterProgress: AssemblyProgress) => void
  ): Promise<ChapterAudio[]> {
    const chapters: ChapterAudio[] = [];

    for (let i = 0; i < acts.length; i++) {
      const act = acts[i];
      const sceneResults = sceneResultsByAct.get(act.id) || [];

      if (sceneResults.length === 0) continue;

      const chapter = await this.assembleChapter(
        act,
        sceneResults,
        i + 1,
        (progress) => onProgress?.(i, progress)
      );

      chapters.push(chapter);
    }

    return chapters;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { pending: number; isProcessing: boolean } {
    return {
      pending: this.assemblyQueue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Calculate estimated duration for scenes
   */
  estimateDuration(sceneResults: SceneDialogueResult[]): number {
    let duration = (this.options.silenceAtStart || 0) / 1000;

    for (let i = 0; i < sceneResults.length; i++) {
      duration += sceneResults[i].totalDuration;

      if (i < sceneResults.length - 1 && this.options.transitionBetweenScenes) {
        duration += this.options.transitionBetweenScenes.duration / 1000;
      }
    }

    duration += (this.options.silenceAtEnd || 0) / 1000;

    return duration;
  }

  /**
   * Format duration as string (HH:MM:SS)
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Export singleton instance
export const chapterAssembler = ChapterAssembler.getInstance();

// Export class for testing
export { ChapterAssembler };
