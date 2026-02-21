/**
 * TimingController - Animatic Timing and Transition Management
 *
 * Manages panel durations, transitions, and audio synchronization
 * for animatic preview playback.
 */

// ============================================================================
// Types
// ============================================================================

export type TransitionType =
  | 'cut'
  | 'fade'
  | 'dissolve'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'push-left'
  | 'push-right'
  | 'zoom-in'
  | 'zoom-out';

export type EasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic';

export interface KenBurnsEffect {
  enabled: boolean;
  startScale: number;
  endScale: number;
  startX: number;  // -1 to 1 (center = 0)
  startY: number;
  endX: number;
  endY: number;
  easing: EasingType;
}

export interface PanelTiming {
  panelId: string;
  duration: number;  // in milliseconds
  holdTime: number;  // time before transition starts
  transition: {
    type: TransitionType;
    duration: number;
    easing: EasingType;
  };
  kenBurns: KenBurnsEffect;
  audioMarkers: AudioMarker[];
}

export interface AudioMarker {
  id: string;
  time: number;  // relative to panel start
  type: 'cue' | 'sync' | 'note';
  label: string;
}

export interface AudioTrack {
  id: string;
  name: string;
  type: 'dialogue' | 'music' | 'sfx' | 'voiceover';
  url: string;
  startTime: number;  // global timeline position
  duration: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  muted: boolean;
}

export interface TimelineState {
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  playbackRate: number;
  loop: boolean;
  currentPanelIndex: number;
}

export interface TimingControllerConfig {
  defaultDuration: number;
  defaultTransition: TransitionType;
  defaultTransitionDuration: number;
  frameRate: number;
  snapToFrames: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_CONFIG: TimingControllerConfig = {
  defaultDuration: 3000,  // 3 seconds
  defaultTransition: 'cut',
  defaultTransitionDuration: 500,
  frameRate: 24,
  snapToFrames: true,
};

export const DEFAULT_KEN_BURNS: KenBurnsEffect = {
  enabled: false,
  startScale: 1,
  endScale: 1.1,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
  easing: 'ease-in-out',
};

export const DEFAULT_TIMING: Omit<PanelTiming, 'panelId'> = {
  duration: 3000,
  holdTime: 2500,
  transition: {
    type: 'cut',
    duration: 500,
    easing: 'ease-in-out',
  },
  kenBurns: { ...DEFAULT_KEN_BURNS },
  audioMarkers: [],
};

export const TRANSITION_PRESETS: Record<TransitionType, { name: string; description: string }> = {
  'cut': { name: 'Cut', description: 'Instant switch between panels' },
  'fade': { name: 'Fade', description: 'Fade to black then to next panel' },
  'dissolve': { name: 'Dissolve', description: 'Cross-fade between panels' },
  'wipe-left': { name: 'Wipe Left', description: 'New panel wipes in from right' },
  'wipe-right': { name: 'Wipe Right', description: 'New panel wipes in from left' },
  'wipe-up': { name: 'Wipe Up', description: 'New panel wipes in from bottom' },
  'wipe-down': { name: 'Wipe Down', description: 'New panel wipes in from top' },
  'push-left': { name: 'Push Left', description: 'New panel pushes old to left' },
  'push-right': { name: 'Push Right', description: 'New panel pushes old to right' },
  'zoom-in': { name: 'Zoom In', description: 'Zoom into next panel' },
  'zoom-out': { name: 'Zoom Out', description: 'Zoom out to reveal next panel' },
};

export const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
  'linear': (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  'ease-in-cubic': (t) => t * t * t,
  'ease-out-cubic': (t) => (--t) * t * t + 1,
  'ease-in-out-cubic': (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

// ============================================================================
// TimingController Class
// ============================================================================

export class TimingController {
  private config: TimingControllerConfig;
  private panelTimings: Map<string, PanelTiming> = new Map();
  private panelOrder: string[] = [];
  private audioTracks: Map<string, AudioTrack> = new Map();
  private timelineState: TimelineState;
  private animationFrame: number | null = null;
  private lastFrameTime: number = 0;
  private listeners: Set<(state: TimelineState) => void> = new Set();

  constructor(config: Partial<TimingControllerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.timelineState = {
      currentTime: 0,
      totalDuration: 0,
      isPlaying: false,
      playbackRate: 1,
      loop: false,
      currentPanelIndex: 0,
    };
  }

  // --------------------------------------------------------------------------
  // Panel Timing Management
  // --------------------------------------------------------------------------

  initializePanels(panelIds: string[]): void {
    this.panelOrder = [...panelIds];

    // Create default timings for new panels
    for (const panelId of panelIds) {
      if (!this.panelTimings.has(panelId)) {
        this.panelTimings.set(panelId, {
          panelId,
          ...DEFAULT_TIMING,
        });
      }
    }

    // Remove timings for panels that no longer exist
    for (const panelId of this.panelTimings.keys()) {
      if (!panelIds.includes(panelId)) {
        this.panelTimings.delete(panelId);
      }
    }

    this.recalculateTotalDuration();
  }

  getPanelTiming(panelId: string): PanelTiming | undefined {
    return this.panelTimings.get(panelId);
  }

  updatePanelTiming(panelId: string, updates: Partial<Omit<PanelTiming, 'panelId'>>): void {
    const existing = this.panelTimings.get(panelId);
    if (!existing) return;

    this.panelTimings.set(panelId, {
      ...existing,
      ...updates,
      transition: {
        ...existing.transition,
        ...(updates.transition || {}),
      },
      kenBurns: {
        ...existing.kenBurns,
        ...(updates.kenBurns || {}),
      },
    });

    this.recalculateTotalDuration();
  }

  setPanelDuration(panelId: string, duration: number): void {
    const snapped = this.snapToFrame(duration);
    this.updatePanelTiming(panelId, {
      duration: snapped,
      holdTime: Math.max(0, snapped - (this.panelTimings.get(panelId)?.transition.duration || 500)),
    });
  }

  setPanelTransition(panelId: string, type: TransitionType, duration?: number): void {
    const timing = this.panelTimings.get(panelId);
    if (!timing) return;

    const transitionDuration = duration ?? this.config.defaultTransitionDuration;
    this.updatePanelTiming(panelId, {
      transition: {
        ...timing.transition,
        type,
        duration: this.snapToFrame(transitionDuration),
      },
    });
  }

  setKenBurnsEffect(panelId: string, effect: Partial<KenBurnsEffect>): void {
    const timing = this.panelTimings.get(panelId);
    if (!timing) return;

    this.updatePanelTiming(panelId, {
      kenBurns: {
        ...timing.kenBurns,
        ...effect,
      },
    });
  }

  // --------------------------------------------------------------------------
  // Audio Track Management
  // --------------------------------------------------------------------------

  addAudioTrack(track: Omit<AudioTrack, 'id'>): string {
    const id = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.audioTracks.set(id, { ...track, id });
    return id;
  }

  updateAudioTrack(trackId: string, updates: Partial<Omit<AudioTrack, 'id'>>): void {
    const existing = this.audioTracks.get(trackId);
    if (!existing) return;

    this.audioTracks.set(trackId, { ...existing, ...updates });
  }

  removeAudioTrack(trackId: string): void {
    this.audioTracks.delete(trackId);
  }

  getAudioTracks(): AudioTrack[] {
    return Array.from(this.audioTracks.values());
  }

  // --------------------------------------------------------------------------
  // Audio Markers
  // --------------------------------------------------------------------------

  addAudioMarker(panelId: string, marker: Omit<AudioMarker, 'id'>): string {
    const timing = this.panelTimings.get(panelId);
    if (!timing) return '';

    const id = `marker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMarker = { ...marker, id };

    this.updatePanelTiming(panelId, {
      audioMarkers: [...timing.audioMarkers, newMarker],
    });

    return id;
  }

  removeAudioMarker(panelId: string, markerId: string): void {
    const timing = this.panelTimings.get(panelId);
    if (!timing) return;

    this.updatePanelTiming(panelId, {
      audioMarkers: timing.audioMarkers.filter(m => m.id !== markerId),
    });
  }

  // --------------------------------------------------------------------------
  // Timeline Calculations
  // --------------------------------------------------------------------------

  private recalculateTotalDuration(): void {
    let total = 0;
    for (const panelId of this.panelOrder) {
      const timing = this.panelTimings.get(panelId);
      if (timing) {
        total += timing.duration;
      }
    }
    this.timelineState.totalDuration = total;
    this.notifyListeners();
  }

  getPanelStartTime(panelId: string): number {
    let startTime = 0;
    for (const id of this.panelOrder) {
      if (id === panelId) break;
      const timing = this.panelTimings.get(id);
      if (timing) {
        startTime += timing.duration;
      }
    }
    return startTime;
  }

  getPanelAtTime(time: number): { panelId: string; localTime: number; progress: number } | null {
    let currentTime = 0;

    for (let i = 0; i < this.panelOrder.length; i++) {
      const panelId = this.panelOrder[i];
      const timing = this.panelTimings.get(panelId);
      if (!timing) continue;

      const panelEnd = currentTime + timing.duration;

      if (time >= currentTime && time < panelEnd) {
        const localTime = time - currentTime;
        const progress = localTime / timing.duration;
        return { panelId, localTime, progress };
      }

      currentTime = panelEnd;
    }

    // Return last panel if past end
    if (this.panelOrder.length > 0) {
      const lastPanelId = this.panelOrder[this.panelOrder.length - 1];
      const timing = this.panelTimings.get(lastPanelId);
      if (timing) {
        return { panelId: lastPanelId, localTime: timing.duration, progress: 1 };
      }
    }

    return null;
  }

  getTransitionState(time: number): {
    inTransition: boolean;
    fromPanelId: string | null;
    toPanelId: string | null;
    transitionProgress: number;
    transitionType: TransitionType;
    easing: EasingType;
  } | null {
    let currentTime = 0;

    for (let i = 0; i < this.panelOrder.length - 1; i++) {
      const panelId = this.panelOrder[i];
      const nextPanelId = this.panelOrder[i + 1];
      const timing = this.panelTimings.get(panelId);
      if (!timing) continue;

      const transitionStart = currentTime + timing.holdTime;
      const transitionEnd = currentTime + timing.duration;

      if (time >= transitionStart && time < transitionEnd) {
        const transitionTime = time - transitionStart;
        const rawProgress = transitionTime / timing.transition.duration;
        const easedProgress = EASING_FUNCTIONS[timing.transition.easing](
          Math.min(1, rawProgress)
        );

        return {
          inTransition: true,
          fromPanelId: panelId,
          toPanelId: nextPanelId,
          transitionProgress: easedProgress,
          transitionType: timing.transition.type,
          easing: timing.transition.easing,
        };
      }

      currentTime += timing.duration;
    }

    return {
      inTransition: false,
      fromPanelId: null,
      toPanelId: null,
      transitionProgress: 0,
      transitionType: 'cut',
      easing: 'linear',
    };
  }

  getKenBurnsTransform(panelId: string, progress: number): {
    scale: number;
    translateX: number;
    translateY: number;
  } {
    const timing = this.panelTimings.get(panelId);
    if (!timing || !timing.kenBurns.enabled) {
      return { scale: 1, translateX: 0, translateY: 0 };
    }

    const kb = timing.kenBurns;
    const easedProgress = EASING_FUNCTIONS[kb.easing](progress);

    return {
      scale: kb.startScale + (kb.endScale - kb.startScale) * easedProgress,
      translateX: kb.startX + (kb.endX - kb.startX) * easedProgress,
      translateY: kb.startY + (kb.endY - kb.startY) * easedProgress,
    };
  }

  // --------------------------------------------------------------------------
  // Playback Control
  // --------------------------------------------------------------------------

  play(): void {
    if (this.timelineState.isPlaying) return;

    this.timelineState.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.tick();
    this.notifyListeners();
  }

  pause(): void {
    if (!this.timelineState.isPlaying) return;

    this.timelineState.isPlaying = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.notifyListeners();
  }

  stop(): void {
    this.pause();
    this.timelineState.currentTime = 0;
    this.timelineState.currentPanelIndex = 0;
    this.notifyListeners();
  }

  seek(time: number): void {
    this.timelineState.currentTime = Math.max(
      0,
      Math.min(this.timelineState.totalDuration, time)
    );

    // Update current panel index
    const panelInfo = this.getPanelAtTime(this.timelineState.currentTime);
    if (panelInfo) {
      this.timelineState.currentPanelIndex = this.panelOrder.indexOf(panelInfo.panelId);
    }

    this.notifyListeners();
  }

  seekToPanel(panelId: string): void {
    const startTime = this.getPanelStartTime(panelId);
    this.seek(startTime);
  }

  setPlaybackRate(rate: number): void {
    this.timelineState.playbackRate = Math.max(0.25, Math.min(4, rate));
    this.notifyListeners();
  }

  setLoop(loop: boolean): void {
    this.timelineState.loop = loop;
    this.notifyListeners();
  }

  private tick = (): void => {
    if (!this.timelineState.isPlaying) return;

    const now = performance.now();
    const delta = (now - this.lastFrameTime) * this.timelineState.playbackRate;
    this.lastFrameTime = now;

    this.timelineState.currentTime += delta;

    // Handle end of timeline
    if (this.timelineState.currentTime >= this.timelineState.totalDuration) {
      if (this.timelineState.loop) {
        this.timelineState.currentTime = 0;
      } else {
        this.timelineState.currentTime = this.timelineState.totalDuration;
        this.pause();
        return;
      }
    }

    // Update current panel index
    const panelInfo = this.getPanelAtTime(this.timelineState.currentTime);
    if (panelInfo) {
      const newIndex = this.panelOrder.indexOf(panelInfo.panelId);
      if (newIndex !== this.timelineState.currentPanelIndex) {
        this.timelineState.currentPanelIndex = newIndex;
      }
    }

    this.notifyListeners();
    this.animationFrame = requestAnimationFrame(this.tick);
  };

  // --------------------------------------------------------------------------
  // State and Listeners
  // --------------------------------------------------------------------------

  getState(): TimelineState {
    return { ...this.timelineState };
  }

  getAllTimings(): PanelTiming[] {
    return this.panelOrder.map(id => this.panelTimings.get(id)!).filter(Boolean);
  }

  subscribe(listener: (state: TimelineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  private snapToFrame(time: number): number {
    if (!this.config.snapToFrames) return time;
    const frameTime = 1000 / this.config.frameRate;
    return Math.round(time / frameTime) * frameTime;
  }

  formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const frames = Math.floor((ms % 1000) / (1000 / this.config.frameRate));

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }

  parseTime(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      const [minutes, seconds, frames] = parts;
      return (minutes * 60 + seconds) * 1000 + frames * (1000 / this.config.frameRate);
    }
    return 0;
  }

  // --------------------------------------------------------------------------
  // Import/Export
  // --------------------------------------------------------------------------

  exportTimingData(): {
    panelTimings: PanelTiming[];
    audioTracks: AudioTrack[];
    config: TimingControllerConfig;
  } {
    return {
      panelTimings: this.getAllTimings(),
      audioTracks: this.getAudioTracks(),
      config: { ...this.config },
    };
  }

  importTimingData(data: {
    panelTimings?: PanelTiming[];
    audioTracks?: AudioTrack[];
    config?: Partial<TimingControllerConfig>;
  }): void {
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }

    if (data.panelTimings) {
      this.panelTimings.clear();
      this.panelOrder = [];
      for (const timing of data.panelTimings) {
        this.panelTimings.set(timing.panelId, timing);
        this.panelOrder.push(timing.panelId);
      }
    }

    if (data.audioTracks) {
      this.audioTracks.clear();
      for (const track of data.audioTracks) {
        this.audioTracks.set(track.id, track);
      }
    }

    this.recalculateTotalDuration();
  }

  dispose(): void {
    this.pause();
    this.listeners.clear();
    this.panelTimings.clear();
    this.audioTracks.clear();
    this.panelOrder = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const timingController = new TimingController();
