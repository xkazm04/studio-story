/**
 * EmotionController - Dialogue performance and emotion system
 *
 * Provides fine-grained emotion control, pacing adjustment,
 * emphasis marking, and dramatic delivery presets.
 */

/**
 * Emotion types supported by the system
 */
export type EmotionType =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'fearful'
  | 'surprised'
  | 'disgusted'
  | 'contemptuous'
  | 'excited'
  | 'tender'
  | 'anxious'
  | 'melancholy'
  | 'confident'
  | 'sarcastic'
  | 'whispered'
  | 'shouted';

/**
 * Emotion configuration with intensity
 */
export interface EmotionConfig {
  type: EmotionType;
  intensity: number; // 0.0 - 1.0
  blend?: EmotionType; // Optional secondary emotion
  blendRatio?: number; // 0.0 - 1.0 ratio of secondary emotion
}

/**
 * Pacing configuration
 */
export interface PacingConfig {
  speed: number; // 0.5 - 2.0 (1.0 = normal)
  pauseBetweenSentences: number; // ms
  pauseBetweenClauses: number; // ms
  breathPauses: boolean;
  naturalVariation: number; // 0.0 - 1.0 (randomness in pacing)
}

/**
 * Emphasis marker for stress placement
 */
export interface EmphasisMarker {
  wordIndex: number;
  level: 'strong' | 'moderate' | 'reduced';
  duration?: number; // How much longer to hold (1.0 = normal, 1.5 = 50% longer)
  pitch?: number; // Pitch shift (-1.0 to 1.0)
}

/**
 * Delivery preset configuration
 */
export interface DeliveryPreset {
  id: string;
  name: string;
  description: string;
  emotion: EmotionConfig;
  pacing: PacingConfig;
  emphasis: 'auto' | 'minimal' | 'dramatic';
  pitch: number; // -1.0 to 1.0 baseline shift
  volume: number; // 0.0 to 1.0
  breathiness: number; // 0.0 to 1.0
  vibrato: number; // 0.0 to 1.0
}

/**
 * Performance version (take)
 */
export interface PerformanceVersion {
  id: string;
  lineId: string;
  version: number;
  createdAt: string;
  config: PerformanceConfig;
  audioUrl?: string;
  duration?: number;
  notes?: string;
  rating?: number; // 1-5 stars
  selected?: boolean;
}

/**
 * Complete performance configuration
 */
export interface PerformanceConfig {
  emotion: EmotionConfig;
  pacing: PacingConfig;
  emphasis: EmphasisMarker[];
  preset?: string;
  pitch: number;
  volume: number;
  breathiness: number;
  vibrato: number;
}

/**
 * SSML parameters for TTS systems
 */
export interface SSMLParameters {
  rate: string; // x-slow, slow, medium, fast, x-fast, or percentage
  pitch: string; // x-low, low, medium, high, x-high, or percentage
  volume: string; // silent, x-soft, soft, medium, loud, x-loud, or dB
  emphasis: 'strong' | 'moderate' | 'reduced' | 'none';
  breakTime: number; // ms
  prosody?: string;
}

/**
 * Default configurations
 */
const DEFAULT_EMOTION: EmotionConfig = {
  type: 'neutral',
  intensity: 0.5,
};

const DEFAULT_PACING: PacingConfig = {
  speed: 1.0,
  pauseBetweenSentences: 500,
  pauseBetweenClauses: 200,
  breathPauses: true,
  naturalVariation: 0.1,
};

const DEFAULT_PERFORMANCE: PerformanceConfig = {
  emotion: DEFAULT_EMOTION,
  pacing: DEFAULT_PACING,
  emphasis: [],
  pitch: 0,
  volume: 0.8,
  breathiness: 0,
  vibrato: 0,
};

/**
 * Built-in delivery presets
 */
const BUILTIN_PRESETS: DeliveryPreset[] = [
  {
    id: 'narration',
    name: 'Narration',
    description: 'Clear, measured delivery for storytelling',
    emotion: { type: 'neutral', intensity: 0.3 },
    pacing: { speed: 0.95, pauseBetweenSentences: 600, pauseBetweenClauses: 250, breathPauses: true, naturalVariation: 0.05 },
    emphasis: 'minimal',
    pitch: 0,
    volume: 0.75,
    breathiness: 0.1,
    vibrato: 0,
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'Intense, emotionally charged delivery',
    emotion: { type: 'excited', intensity: 0.8 },
    pacing: { speed: 1.1, pauseBetweenSentences: 400, pauseBetweenClauses: 150, breathPauses: true, naturalVariation: 0.2 },
    emphasis: 'dramatic',
    pitch: 0.1,
    volume: 0.9,
    breathiness: 0.05,
    vibrato: 0.1,
  },
  {
    id: 'intimate',
    name: 'Intimate',
    description: 'Soft, close, personal delivery',
    emotion: { type: 'tender', intensity: 0.6 },
    pacing: { speed: 0.85, pauseBetweenSentences: 700, pauseBetweenClauses: 300, breathPauses: true, naturalVariation: 0.1 },
    emphasis: 'minimal',
    pitch: -0.1,
    volume: 0.6,
    breathiness: 0.3,
    vibrato: 0,
  },
  {
    id: 'urgent',
    name: 'Urgent',
    description: 'Fast-paced, tense delivery',
    emotion: { type: 'anxious', intensity: 0.7 },
    pacing: { speed: 1.3, pauseBetweenSentences: 250, pauseBetweenClauses: 100, breathPauses: false, naturalVariation: 0.15 },
    emphasis: 'dramatic',
    pitch: 0.15,
    volume: 0.85,
    breathiness: 0.15,
    vibrato: 0.05,
  },
  {
    id: 'melancholic',
    name: 'Melancholic',
    description: 'Slow, sorrowful delivery',
    emotion: { type: 'melancholy', intensity: 0.7 },
    pacing: { speed: 0.8, pauseBetweenSentences: 800, pauseBetweenClauses: 350, breathPauses: true, naturalVariation: 0.05 },
    emphasis: 'minimal',
    pitch: -0.15,
    volume: 0.65,
    breathiness: 0.2,
    vibrato: 0.15,
  },
  {
    id: 'comedic',
    name: 'Comedic',
    description: 'Upbeat, playful delivery',
    emotion: { type: 'happy', intensity: 0.7 },
    pacing: { speed: 1.15, pauseBetweenSentences: 350, pauseBetweenClauses: 150, breathPauses: true, naturalVariation: 0.25 },
    emphasis: 'dramatic',
    pitch: 0.1,
    volume: 0.85,
    breathiness: 0,
    vibrato: 0,
  },
  {
    id: 'authoritative',
    name: 'Authoritative',
    description: 'Commanding, confident delivery',
    emotion: { type: 'confident', intensity: 0.8 },
    pacing: { speed: 0.9, pauseBetweenSentences: 550, pauseBetweenClauses: 200, breathPauses: true, naturalVariation: 0.05 },
    emphasis: 'auto',
    pitch: -0.1,
    volume: 0.9,
    breathiness: 0,
    vibrato: 0,
  },
  {
    id: 'whisper',
    name: 'Whisper',
    description: 'Quiet, secretive delivery',
    emotion: { type: 'whispered', intensity: 0.9 },
    pacing: { speed: 0.85, pauseBetweenSentences: 600, pauseBetweenClauses: 250, breathPauses: true, naturalVariation: 0.1 },
    emphasis: 'minimal',
    pitch: 0,
    volume: 0.4,
    breathiness: 0.5,
    vibrato: 0,
  },
];

/**
 * Emotion to SSML parameter mapping
 */
const EMOTION_SSML_MAP: Record<EmotionType, Partial<SSMLParameters>> = {
  neutral: { rate: 'medium', pitch: 'medium', volume: 'medium' },
  happy: { rate: '+10%', pitch: '+10%', volume: 'loud' },
  sad: { rate: '-15%', pitch: '-10%', volume: 'soft' },
  angry: { rate: '+5%', pitch: '+15%', volume: 'x-loud' },
  fearful: { rate: '+20%', pitch: '+20%', volume: 'soft' },
  surprised: { rate: '+15%', pitch: '+25%', volume: 'loud' },
  disgusted: { rate: '-5%', pitch: '-5%', volume: 'medium' },
  contemptuous: { rate: '-10%', pitch: '-5%', volume: 'medium' },
  excited: { rate: '+20%', pitch: '+15%', volume: 'loud' },
  tender: { rate: '-10%', pitch: '-5%', volume: 'soft' },
  anxious: { rate: '+15%', pitch: '+10%', volume: 'medium' },
  melancholy: { rate: '-20%', pitch: '-15%', volume: 'soft' },
  confident: { rate: 'medium', pitch: '-5%', volume: 'loud' },
  sarcastic: { rate: '-5%', pitch: '+5%', volume: 'medium' },
  whispered: { rate: '-15%', pitch: '-10%', volume: 'x-soft' },
  shouted: { rate: '+10%', pitch: '+20%', volume: 'x-loud' },
};

/**
 * EmotionController singleton class
 */
class EmotionController {
  private static instance: EmotionController;
  private customPresets: Map<string, DeliveryPreset> = new Map();
  private performanceVersions: Map<string, PerformanceVersion[]> = new Map();

  private constructor() {}

  static getInstance(): EmotionController {
    if (!EmotionController.instance) {
      EmotionController.instance = new EmotionController();
    }
    return EmotionController.instance;
  }

  /**
   * Get all available emotion types
   */
  getEmotionTypes(): EmotionType[] {
    return Object.keys(EMOTION_SSML_MAP) as EmotionType[];
  }

  /**
   * Get all delivery presets (built-in + custom)
   */
  getPresets(): DeliveryPreset[] {
    return [...BUILTIN_PRESETS, ...Array.from(this.customPresets.values())];
  }

  /**
   * Get preset by ID
   */
  getPreset(id: string): DeliveryPreset | undefined {
    return BUILTIN_PRESETS.find(p => p.id === id) || this.customPresets.get(id);
  }

  /**
   * Create custom preset
   */
  createPreset(preset: Omit<DeliveryPreset, 'id'>): DeliveryPreset {
    const id = `custom_${Date.now()}`;
    const newPreset: DeliveryPreset = { ...preset, id };
    this.customPresets.set(id, newPreset);
    return newPreset;
  }

  /**
   * Update custom preset
   */
  updatePreset(id: string, updates: Partial<DeliveryPreset>): DeliveryPreset | undefined {
    const preset = this.customPresets.get(id);
    if (!preset) return undefined;

    const updated = { ...preset, ...updates, id };
    this.customPresets.set(id, updated);
    return updated;
  }

  /**
   * Delete custom preset
   */
  deletePreset(id: string): boolean {
    return this.customPresets.delete(id);
  }

  /**
   * Apply preset to create performance config
   */
  applyPreset(presetId: string): PerformanceConfig {
    const preset = this.getPreset(presetId);
    if (!preset) {
      return { ...DEFAULT_PERFORMANCE };
    }

    return {
      emotion: preset.emotion,
      pacing: preset.pacing,
      emphasis: [],
      preset: presetId,
      pitch: preset.pitch,
      volume: preset.volume,
      breathiness: preset.breathiness,
      vibrato: preset.vibrato,
    };
  }

  /**
   * Convert emotion config to SSML parameters
   */
  emotionToSSML(emotion: EmotionConfig): SSMLParameters {
    const base = EMOTION_SSML_MAP[emotion.type] || EMOTION_SSML_MAP.neutral;

    // Apply intensity modifier
    const intensityModifier = emotion.intensity;

    // Blend with secondary emotion if specified
    let blended = { ...base };
    if (emotion.blend && emotion.blendRatio) {
      const secondary = EMOTION_SSML_MAP[emotion.blend] || {};
      // Simple blending logic - would be more sophisticated in production
      blended = { ...base, ...secondary };
    }

    return {
      rate: blended.rate || 'medium',
      pitch: blended.pitch || 'medium',
      volume: blended.volume || 'medium',
      emphasis: intensityModifier > 0.7 ? 'strong' : intensityModifier > 0.4 ? 'moderate' : 'reduced',
      breakTime: 500,
    };
  }

  /**
   * Convert pacing config to SSML rate
   */
  pacingToSSMLRate(pacing: PacingConfig): string {
    const speed = pacing.speed;
    if (speed <= 0.6) return 'x-slow';
    if (speed <= 0.8) return 'slow';
    if (speed <= 1.2) return 'medium';
    if (speed <= 1.5) return 'fast';
    return 'x-fast';
  }

  /**
   * Generate SSML markup for text with performance config
   */
  generateSSML(text: string, config: PerformanceConfig): string {
    const ssmlParams = this.emotionToSSML(config.emotion);
    const rate = this.pacingToSSMLRate(config.pacing);

    // Apply pitch adjustment
    const pitchPercent = Math.round(config.pitch * 20);
    const pitchStr = pitchPercent >= 0 ? `+${pitchPercent}%` : `${pitchPercent}%`;

    // Apply volume
    const volumePercent = Math.round(config.volume * 100);

    // Process emphasis markers
    let processedText = text;
    if (config.emphasis.length > 0) {
      const words = text.split(/\s+/);
      config.emphasis.forEach(marker => {
        if (marker.wordIndex < words.length) {
          const word = words[marker.wordIndex];
          words[marker.wordIndex] = `<emphasis level="${marker.level}">${word}</emphasis>`;
        }
      });
      processedText = words.join(' ');
    }

    // Build SSML
    const ssml = `<speak>
  <prosody rate="${rate}" pitch="${pitchStr}" volume="${volumePercent}%">
    ${processedText}
  </prosody>
</speak>`;

    return ssml;
  }

  /**
   * Auto-detect emphasis points in text
   */
  autoEmphasis(text: string, style: 'auto' | 'minimal' | 'dramatic' = 'auto'): EmphasisMarker[] {
    const markers: EmphasisMarker[] = [];
    const words = text.split(/\s+/);

    // Words that typically deserve emphasis
    const strongWords = new Set(['never', 'always', 'must', 'absolutely', 'definitely', 'only', 'everything', 'nothing']);
    const moderateWords = new Set(['important', 'critical', 'urgent', 'now', 'today', 'finally', 'suddenly']);

    if (style === 'minimal') {
      // Only emphasize obviously important words
      words.forEach((word, index) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, '');
        if (strongWords.has(clean)) {
          markers.push({ wordIndex: index, level: 'moderate' });
        }
      });
    } else if (style === 'dramatic') {
      // More aggressive emphasis
      words.forEach((word, index) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, '');
        if (strongWords.has(clean)) {
          markers.push({ wordIndex: index, level: 'strong', duration: 1.3 });
        } else if (moderateWords.has(clean)) {
          markers.push({ wordIndex: index, level: 'moderate' });
        } else if (word.endsWith('!') || word.endsWith('?')) {
          // Emphasize words before punctuation
          if (index > 0) {
            markers.push({ wordIndex: index - 1, level: 'moderate' });
          }
        }
      });
    } else {
      // Auto: balanced approach
      words.forEach((word, index) => {
        const clean = word.toLowerCase().replace(/[^a-z]/g, '');
        if (strongWords.has(clean)) {
          markers.push({ wordIndex: index, level: 'strong' });
        } else if (moderateWords.has(clean)) {
          markers.push({ wordIndex: index, level: 'moderate' });
        }
      });
    }

    return markers;
  }

  /**
   * Store performance version
   */
  savePerformanceVersion(
    lineId: string,
    config: PerformanceConfig,
    audioUrl?: string,
    duration?: number,
    notes?: string
  ): PerformanceVersion {
    const versions = this.performanceVersions.get(lineId) || [];
    const version: PerformanceVersion = {
      id: `perf_${Date.now()}`,
      lineId,
      version: versions.length + 1,
      createdAt: new Date().toISOString(),
      config,
      audioUrl,
      duration,
      notes,
    };

    versions.push(version);
    this.performanceVersions.set(lineId, versions);
    return version;
  }

  /**
   * Get all versions for a line
   */
  getPerformanceVersions(lineId: string): PerformanceVersion[] {
    return this.performanceVersions.get(lineId) || [];
  }

  /**
   * Select a performance version
   */
  selectVersion(lineId: string, versionId: string): void {
    const versions = this.performanceVersions.get(lineId);
    if (!versions) return;

    versions.forEach(v => {
      v.selected = v.id === versionId;
    });
  }

  /**
   * Rate a performance version
   */
  rateVersion(lineId: string, versionId: string, rating: number): void {
    const versions = this.performanceVersions.get(lineId);
    if (!versions) return;

    const version = versions.find(v => v.id === versionId);
    if (version) {
      version.rating = Math.max(1, Math.min(5, rating));
    }
  }

  /**
   * Delete a performance version
   */
  deleteVersion(lineId: string, versionId: string): boolean {
    const versions = this.performanceVersions.get(lineId);
    if (!versions) return false;

    const index = versions.findIndex(v => v.id === versionId);
    if (index === -1) return false;

    versions.splice(index, 1);
    return true;
  }

  /**
   * Get the selected version for a line
   */
  getSelectedVersion(lineId: string): PerformanceVersion | undefined {
    const versions = this.performanceVersions.get(lineId);
    return versions?.find(v => v.selected);
  }

  /**
   * Compare two performance configs
   */
  compareConfigs(a: PerformanceConfig, b: PerformanceConfig): {
    emotionDiff: boolean;
    pacingDiff: boolean;
    emphasisDiff: boolean;
    paramsDiff: boolean;
  } {
    return {
      emotionDiff: a.emotion.type !== b.emotion.type || a.emotion.intensity !== b.emotion.intensity,
      pacingDiff: a.pacing.speed !== b.pacing.speed,
      emphasisDiff: a.emphasis.length !== b.emphasis.length,
      paramsDiff: a.pitch !== b.pitch || a.volume !== b.volume,
    };
  }

  /**
   * Get default performance config
   */
  getDefaultConfig(): PerformanceConfig {
    return { ...DEFAULT_PERFORMANCE };
  }

  /**
   * Interpolate between two emotion configs
   */
  blendEmotions(from: EmotionConfig, to: EmotionConfig, ratio: number): EmotionConfig {
    return {
      type: ratio < 0.5 ? from.type : to.type,
      intensity: from.intensity + (to.intensity - from.intensity) * ratio,
      blend: to.type,
      blendRatio: ratio,
    };
  }

  /**
   * Get emotion color for UI display
   */
  getEmotionColor(emotion: EmotionType): string {
    const colors: Record<EmotionType, string> = {
      neutral: '#94a3b8',
      happy: '#fbbf24',
      sad: '#60a5fa',
      angry: '#ef4444',
      fearful: '#a855f7',
      surprised: '#f472b6',
      disgusted: '#84cc16',
      contemptuous: '#78716c',
      excited: '#fb923c',
      tender: '#f9a8d4',
      anxious: '#c084fc',
      melancholy: '#6366f1',
      confident: '#22c55e',
      sarcastic: '#eab308',
      whispered: '#cbd5e1',
      shouted: '#dc2626',
    };
    return colors[emotion] || colors.neutral;
  }

  /**
   * Get emotion icon name for UI display
   */
  getEmotionIcon(emotion: EmotionType): string {
    const icons: Record<EmotionType, string> = {
      neutral: 'minus',
      happy: 'smile',
      sad: 'frown',
      angry: 'angry',
      fearful: 'alert-triangle',
      surprised: 'zap',
      disgusted: 'thumbs-down',
      contemptuous: 'eye-off',
      excited: 'star',
      tender: 'heart',
      anxious: 'activity',
      melancholy: 'cloud-rain',
      confident: 'shield',
      sarcastic: 'message-circle',
      whispered: 'volume',
      shouted: 'volume-2',
    };
    return icons[emotion] || icons.neutral;
  }
}

// Export singleton instance
export const emotionController = EmotionController.getInstance();

// Export class for testing
export { EmotionController };

// Export defaults
export { DEFAULT_EMOTION, DEFAULT_PACING, DEFAULT_PERFORMANCE, BUILTIN_PRESETS };
