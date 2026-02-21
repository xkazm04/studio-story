/**
 * NarrationGenerator - TTS Production System
 *
 * Comprehensive audio narration system with:
 * - Voice configuration and character-voice assignment
 * - SSML generation for precise voice control
 * - Timing marker management for text-audio synchronization
 * - Integration with TTS APIs (ElevenLabs, etc.)
 * - Chapter-based audio export management
 */

// ============================================================================
// Types
// ============================================================================

export type VoiceProvider = 'elevenlabs' | 'amazon-polly' | 'google-tts' | 'azure';

export interface VoiceConfig {
  id: string;
  name: string;
  provider: VoiceProvider;
  providerId: string;
  settings: VoiceSettings;
  sampleUrl?: string;
  metadata?: {
    gender?: 'male' | 'female' | 'neutral';
    age?: 'child' | 'young' | 'adult' | 'elderly';
    accent?: string;
    style?: string[];
  };
}

export interface VoiceSettings {
  stability: number;        // 0-1, voice consistency
  similarityBoost: number;  // 0-1, voice clarity
  style: number;            // 0-1, expressiveness
  speakerBoost: boolean;    // Enhanced speaker clarity
  speed: number;            // 0.5-2.0, playback speed
  pitch: number;            // -20 to 20, pitch adjustment
}

export interface CharacterVoiceAssignment {
  characterId: string;
  characterName: string;
  voiceId: string;
  voiceConfig: VoiceConfig;
  emotionOverrides?: EmotionVoiceOverride[];
}

export interface EmotionVoiceOverride {
  emotion: string;
  settingsAdjustments: Partial<VoiceSettings>;
}

export interface NarratorConfig {
  voiceId: string;
  voiceConfig: VoiceConfig;
  style: 'neutral' | 'warm' | 'dramatic' | 'mysterious' | 'energetic';
}

export interface TimingMarker {
  id: string;
  type: 'word' | 'sentence' | 'paragraph' | 'chapter' | 'pause' | 'emphasis';
  textStart: number;      // Character offset in text
  textEnd: number;        // Character offset end
  audioStart: number;     // Milliseconds in audio
  audioEnd: number;       // Milliseconds in audio
  text: string;           // The actual text content
  metadata?: {
    speaker?: string;
    emotion?: string;
    emphasis?: number;
  };
}

export interface NarrationBlock {
  id: string;
  sceneId: string;
  blockType: 'narration' | 'dialogue' | 'description' | 'direction';
  text: string;
  ssml?: string;
  speaker?: string;
  speakerType: 'narrator' | 'character' | 'system';
  voiceId?: string;
  order: number;
  timingMarkers?: TimingMarker[];
  audioData?: AudioData;
}

export interface AudioData {
  url: string;
  duration: number;       // Milliseconds
  format: 'mp3' | 'wav' | 'ogg';
  sampleRate: number;
  bitRate: number;
  waveformData?: number[]; // Normalized amplitude values for visualization
  generatedAt: number;
  provider: VoiceProvider;
}

export interface ChapterAudio {
  chapterId: string;
  chapterName: string;
  blocks: NarrationBlock[];
  totalDuration: number;
  combinedAudioUrl?: string;
  metadata: {
    wordCount: number;
    blockCount: number;
    createdAt: number;
    updatedAt: number;
  };
}

export interface SSMLOptions {
  addPauses: boolean;
  pauseDuration: 'short' | 'medium' | 'long';
  emphasisLevel: 'none' | 'moderate' | 'strong';
  prosodyRate: 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast';
  prosodyPitch: 'x-low' | 'low' | 'medium' | 'high' | 'x-high';
  prosodyVolume: 'silent' | 'x-soft' | 'soft' | 'medium' | 'loud' | 'x-loud';
}

export interface GenerationOptions {
  provider: VoiceProvider;
  outputFormat: 'mp3' | 'wav' | 'ogg';
  sampleRate: 11025 | 22050 | 44100;
  generateTimingMarkers: boolean;
  generateWaveform: boolean;
  ssmlOptions?: Partial<SSMLOptions>;
}

export interface NarrationProject {
  id: string;
  projectId: string;
  narratorConfig: NarratorConfig;
  characterAssignments: CharacterVoiceAssignment[];
  chapters: ChapterAudio[];
  defaultSettings: GenerationOptions;
  metadata: {
    totalDuration: number;
    totalWords: number;
    createdAt: number;
    updatedAt: number;
  };
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.5,
  speakerBoost: true,
  speed: 1.0,
  pitch: 0,
};

const DEFAULT_SSML_OPTIONS: SSMLOptions = {
  addPauses: true,
  pauseDuration: 'medium',
  emphasisLevel: 'moderate',
  prosodyRate: 'medium',
  prosodyPitch: 'medium',
  prosodyVolume: 'medium',
};

const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  provider: 'elevenlabs',
  outputFormat: 'mp3',
  sampleRate: 44100,
  generateTimingMarkers: true,
  generateWaveform: true,
  ssmlOptions: DEFAULT_SSML_OPTIONS,
};

const PAUSE_DURATIONS: Record<string, number> = {
  short: 250,
  medium: 500,
  long: 1000,
  paragraph: 750,
  chapter: 1500,
};

// Preset voices for quick setup
export const PRESET_VOICES: VoiceConfig[] = [
  {
    id: 'narrator-male-1',
    name: 'Classic Narrator',
    provider: 'elevenlabs',
    providerId: '21m00Tcm4TlvDq8ikWAM', // Rachel - example ID
    settings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.7 },
    metadata: { gender: 'male', age: 'adult', style: ['narrative', 'calm'] },
  },
  {
    id: 'narrator-female-1',
    name: 'Warm Storyteller',
    provider: 'elevenlabs',
    providerId: 'EXAVITQu4vr4xnSDxMaL', // Bella - example ID
    settings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.6, style: 0.6 },
    metadata: { gender: 'female', age: 'adult', style: ['warm', 'engaging'] },
  },
  {
    id: 'character-male-young',
    name: 'Young Hero',
    provider: 'elevenlabs',
    providerId: 'TxGEqnHWrfWFTfGW9XjX', // Josh - example ID
    settings: { ...DEFAULT_VOICE_SETTINGS, style: 0.7 },
    metadata: { gender: 'male', age: 'young', style: ['energetic', 'heroic'] },
  },
  {
    id: 'character-female-young',
    name: 'Young Heroine',
    provider: 'elevenlabs',
    providerId: 'MF3mGyEYCl7XYWbV9V6O', // Elli - example ID
    settings: { ...DEFAULT_VOICE_SETTINGS, style: 0.65 },
    metadata: { gender: 'female', age: 'young', style: ['bright', 'adventurous'] },
  },
  {
    id: 'character-villain',
    name: 'Dark Antagonist',
    provider: 'elevenlabs',
    providerId: 'VR6AewLTigWG4xSOukaG', // Arnold - example ID
    settings: { ...DEFAULT_VOICE_SETTINGS, stability: 0.8, pitch: -5 },
    metadata: { gender: 'male', age: 'adult', style: ['menacing', 'deep'] },
  },
];

// ============================================================================
// SSML Generator
// ============================================================================

export class SSMLGenerator {
  private options: SSMLOptions;

  constructor(options: Partial<SSMLOptions> = {}) {
    this.options = { ...DEFAULT_SSML_OPTIONS, ...options };
  }

  /**
   * Generate SSML from plain text
   */
  generate(text: string, speaker?: string, emotion?: string): string {
    let ssml = this.escapeXml(text);

    // Add prosody wrapper
    ssml = this.wrapWithProsody(ssml);

    // Process dialogue indicators
    ssml = this.processDialogue(ssml, emotion);

    // Add pauses
    if (this.options.addPauses) {
      ssml = this.addPauses(ssml);
    }

    // Add emphasis
    if (this.options.emphasisLevel !== 'none') {
      ssml = this.addEmphasis(ssml);
    }

    // Wrap in speak tag
    return `<speak>${ssml}</speak>`;
  }

  /**
   * Generate SSML for a dialogue line with character emotion
   */
  generateDialogue(text: string, emotion?: string, intensity: number = 0.5): string {
    let ssml = this.escapeXml(text);

    // Apply emotion-based prosody
    if (emotion) {
      ssml = this.applyEmotion(ssml, emotion, intensity);
    }

    // Wrap in speak tag
    return `<speak>${ssml}</speak>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private wrapWithProsody(text: string): string {
    const { prosodyRate, prosodyPitch, prosodyVolume } = this.options;
    return `<prosody rate="${prosodyRate}" pitch="${prosodyPitch}" volume="${prosodyVolume}">${text}</prosody>`;
  }

  private processDialogue(text: string, emotion?: string): string {
    // Detect dialogue patterns (text in quotes)
    return text.replace(/"([^"]+)"/g, (match, dialogue) => {
      if (emotion) {
        return `<emphasis level="moderate">${this.applyEmotion(dialogue, emotion, 0.5)}</emphasis>`;
      }
      return `<emphasis level="moderate">${dialogue}</emphasis>`;
    });
  }

  private addPauses(text: string): string {
    const duration = PAUSE_DURATIONS[this.options.pauseDuration];

    // Add pauses after sentences
    text = text.replace(/([.!?])\s+/g, `$1<break time="${duration}ms"/> `);

    // Add longer pauses after paragraphs
    text = text.replace(/\n\n/g, `<break time="${PAUSE_DURATIONS.paragraph}ms"/>\n\n`);

    // Add pauses after commas and semicolons
    text = text.replace(/([,;])\s+/g, `$1<break time="${duration / 2}ms"/> `);

    return text;
  }

  private addEmphasis(text: string): string {
    const level = this.options.emphasisLevel;

    // Emphasize words in caps (intentional emphasis)
    text = text.replace(/\b([A-Z]{2,})\b/g, `<emphasis level="${level}">$1</emphasis>`);

    // Emphasize words with asterisks
    text = text.replace(/\*([^*]+)\*/g, `<emphasis level="${level}">$1</emphasis>`);

    return text;
  }

  private applyEmotion(text: string, emotion: string, intensity: number): string {
    const emotionProsody = this.getEmotionProsody(emotion, intensity);
    return `<prosody ${emotionProsody}>${text}</prosody>`;
  }

  private getEmotionProsody(emotion: string, intensity: number): string {
    const prosodyMap: Record<string, { rate: string; pitch: string; volume: string }> = {
      happy: { rate: intensity > 0.5 ? 'fast' : 'medium', pitch: 'high', volume: 'loud' },
      sad: { rate: 'slow', pitch: 'low', volume: 'soft' },
      angry: { rate: 'fast', pitch: 'high', volume: 'x-loud' },
      fearful: { rate: 'fast', pitch: 'high', volume: 'soft' },
      surprised: { rate: 'fast', pitch: 'x-high', volume: 'loud' },
      disgusted: { rate: 'slow', pitch: 'low', volume: 'medium' },
      neutral: { rate: 'medium', pitch: 'medium', volume: 'medium' },
      excited: { rate: 'x-fast', pitch: 'high', volume: 'x-loud' },
      calm: { rate: 'slow', pitch: 'low', volume: 'soft' },
      mysterious: { rate: 'slow', pitch: 'low', volume: 'soft' },
      dramatic: { rate: 'slow', pitch: 'medium', volume: 'loud' },
    };

    const prosody = prosodyMap[emotion] || prosodyMap.neutral;
    return `rate="${prosody.rate}" pitch="${prosody.pitch}" volume="${prosody.volume}"`;
  }

  /**
   * Update SSML options
   */
  setOptions(options: Partial<SSMLOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

// ============================================================================
// Timing Marker Manager
// ============================================================================

export class TimingMarkerManager {
  private markers: TimingMarker[] = [];

  /**
   * Parse timing data from TTS API response
   */
  parseTimingResponse(
    text: string,
    timingData: Array<{ word: string; start: number; end: number }>
  ): TimingMarker[] {
    this.markers = [];
    let textOffset = 0;

    for (let i = 0; i < timingData.length; i++) {
      const { word, start, end } = timingData[i];
      const textStart = text.indexOf(word, textOffset);
      const textEnd = textStart + word.length;

      this.markers.push({
        id: `marker-${i}`,
        type: 'word',
        textStart,
        textEnd,
        audioStart: start,
        audioEnd: end,
        text: word,
      });

      textOffset = textEnd;
    }

    // Generate sentence markers
    this.generateSentenceMarkers(text);

    return this.markers;
  }

  /**
   * Generate sentence-level markers from word markers
   */
  private generateSentenceMarkers(text: string): void {
    const sentenceEnders = /[.!?]+/g;
    let match;
    let lastEnd = 0;
    let sentenceIndex = 0;

    while ((match = sentenceEnders.exec(text)) !== null) {
      const sentenceEnd = match.index + match[0].length;
      const sentenceText = text.slice(lastEnd, sentenceEnd).trim();

      if (sentenceText.length > 0) {
        const wordsInSentence = this.markers.filter(
          m => m.type === 'word' && m.textStart >= lastEnd && m.textEnd <= sentenceEnd
        );

        if (wordsInSentence.length > 0) {
          this.markers.push({
            id: `sentence-${sentenceIndex}`,
            type: 'sentence',
            textStart: lastEnd,
            textEnd: sentenceEnd,
            audioStart: wordsInSentence[0].audioStart,
            audioEnd: wordsInSentence[wordsInSentence.length - 1].audioEnd,
            text: sentenceText,
          });
          sentenceIndex++;
        }
      }

      lastEnd = sentenceEnd;
    }
  }

  /**
   * Find marker at specific audio time
   */
  getMarkerAtTime(audioTime: number): TimingMarker | undefined {
    return this.markers.find(
      m => audioTime >= m.audioStart && audioTime <= m.audioEnd
    );
  }

  /**
   * Find marker at specific text position
   */
  getMarkerAtTextPosition(textPosition: number): TimingMarker | undefined {
    return this.markers.find(
      m => textPosition >= m.textStart && textPosition <= m.textEnd
    );
  }

  /**
   * Get audio time for text position
   */
  getAudioTimeForText(textPosition: number): number | undefined {
    const marker = this.getMarkerAtTextPosition(textPosition);
    if (!marker) return undefined;

    // Interpolate within the marker
    const textProgress = (textPosition - marker.textStart) / (marker.textEnd - marker.textStart);
    return marker.audioStart + textProgress * (marker.audioEnd - marker.audioStart);
  }

  /**
   * Get text position for audio time
   */
  getTextPositionForAudio(audioTime: number): number | undefined {
    const marker = this.getMarkerAtTime(audioTime);
    if (!marker) return undefined;

    // Interpolate within the marker
    const audioProgress = (audioTime - marker.audioStart) / (marker.audioEnd - marker.audioStart);
    return Math.floor(marker.textStart + audioProgress * (marker.textEnd - marker.textStart));
  }

  /**
   * Get all markers of a specific type
   */
  getMarkersByType(type: TimingMarker['type']): TimingMarker[] {
    return this.markers.filter(m => m.type === type);
  }

  /**
   * Get all markers
   */
  getAllMarkers(): TimingMarker[] {
    return [...this.markers];
  }

  /**
   * Clear all markers
   */
  clear(): void {
    this.markers = [];
  }
}

// ============================================================================
// Voice Manager
// ============================================================================

export class VoiceManager {
  private voices: Map<string, VoiceConfig> = new Map();
  private characterAssignments: Map<string, CharacterVoiceAssignment> = new Map();
  private narratorConfig: NarratorConfig | null = null;

  constructor() {
    // Load preset voices
    PRESET_VOICES.forEach(voice => this.voices.set(voice.id, voice));
  }

  /**
   * Register a custom voice
   */
  registerVoice(voice: VoiceConfig): void {
    this.voices.set(voice.id, voice);
  }

  /**
   * Get voice by ID
   */
  getVoice(voiceId: string): VoiceConfig | undefined {
    return this.voices.get(voiceId);
  }

  /**
   * Get all available voices
   */
  getAllVoices(): VoiceConfig[] {
    return Array.from(this.voices.values());
  }

  /**
   * Get voices by metadata filter
   */
  getVoicesByFilter(filter: Partial<NonNullable<VoiceConfig['metadata']>>): VoiceConfig[] {
    if (!filter) return [];
    return Array.from(this.voices.values()).filter(voice => {
      if (!voice.metadata) return false;
      return Object.entries(filter).every(
        ([key, value]) => voice.metadata?.[key as keyof typeof voice.metadata] === value
      );
    });
  }

  /**
   * Assign voice to character
   */
  assignVoiceToCharacter(
    characterId: string,
    characterName: string,
    voiceId: string,
    emotionOverrides?: EmotionVoiceOverride[]
  ): CharacterVoiceAssignment | undefined {
    const voice = this.voices.get(voiceId);
    if (!voice) return undefined;

    const assignment: CharacterVoiceAssignment = {
      characterId,
      characterName,
      voiceId,
      voiceConfig: voice,
      emotionOverrides,
    };

    this.characterAssignments.set(characterId, assignment);
    return assignment;
  }

  /**
   * Get voice assignment for character
   */
  getCharacterVoice(characterId: string): CharacterVoiceAssignment | undefined {
    return this.characterAssignments.get(characterId);
  }

  /**
   * Get all character assignments
   */
  getAllCharacterAssignments(): CharacterVoiceAssignment[] {
    return Array.from(this.characterAssignments.values());
  }

  /**
   * Remove character voice assignment
   */
  removeCharacterAssignment(characterId: string): boolean {
    return this.characterAssignments.delete(characterId);
  }

  /**
   * Set narrator configuration
   */
  setNarratorConfig(voiceId: string, style: NarratorConfig['style']): NarratorConfig | undefined {
    const voice = this.voices.get(voiceId);
    if (!voice) return undefined;

    this.narratorConfig = {
      voiceId,
      voiceConfig: voice,
      style,
    };

    return this.narratorConfig;
  }

  /**
   * Get narrator configuration
   */
  getNarratorConfig(): NarratorConfig | null {
    return this.narratorConfig;
  }

  /**
   * Get voice settings adjusted for emotion
   */
  getEmotionAdjustedSettings(
    characterId: string,
    emotion: string
  ): VoiceSettings {
    const assignment = this.characterAssignments.get(characterId);
    if (!assignment) return DEFAULT_VOICE_SETTINGS;

    const baseSettings = assignment.voiceConfig.settings;
    const override = assignment.emotionOverrides?.find(o => o.emotion === emotion);

    if (override) {
      return { ...baseSettings, ...override.settingsAdjustments };
    }

    return baseSettings;
  }

  /**
   * Export configuration for serialization
   */
  exportConfig(): {
    voices: VoiceConfig[];
    assignments: CharacterVoiceAssignment[];
    narrator: NarratorConfig | null;
  } {
    return {
      voices: Array.from(this.voices.values()),
      assignments: Array.from(this.characterAssignments.values()),
      narrator: this.narratorConfig,
    };
  }

  /**
   * Import configuration
   */
  importConfig(config: {
    voices?: VoiceConfig[];
    assignments?: CharacterVoiceAssignment[];
    narrator?: NarratorConfig | null;
  }): void {
    if (config.voices) {
      config.voices.forEach(voice => this.voices.set(voice.id, voice));
    }
    if (config.assignments) {
      config.assignments.forEach(assignment =>
        this.characterAssignments.set(assignment.characterId, assignment)
      );
    }
    if (config.narrator !== undefined) {
      this.narratorConfig = config.narrator;
    }
  }
}

// ============================================================================
// Narration Generator
// ============================================================================

export class NarrationGenerator {
  private static instance: NarrationGenerator;
  private voiceManager: VoiceManager;
  private ssmlGenerator: SSMLGenerator;
  private timingManager: TimingMarkerManager;
  private options: GenerationOptions;

  private constructor() {
    this.voiceManager = new VoiceManager();
    this.ssmlGenerator = new SSMLGenerator();
    this.timingManager = new TimingMarkerManager();
    this.options = DEFAULT_GENERATION_OPTIONS;
  }

  static getInstance(): NarrationGenerator {
    if (!NarrationGenerator.instance) {
      NarrationGenerator.instance = new NarrationGenerator();
    }
    return NarrationGenerator.instance;
  }

  // -------------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------------

  setOptions(options: Partial<GenerationOptions>): void {
    this.options = { ...this.options, ...options };
    if (options.ssmlOptions) {
      this.ssmlGenerator.setOptions(options.ssmlOptions);
    }
  }

  getOptions(): GenerationOptions {
    return { ...this.options };
  }

  getVoiceManager(): VoiceManager {
    return this.voiceManager;
  }

  getSSMLGenerator(): SSMLGenerator {
    return this.ssmlGenerator;
  }

  getTimingManager(): TimingMarkerManager {
    return this.timingManager;
  }

  // -------------------------------------------------------------------------
  // Audio Generation
  // -------------------------------------------------------------------------

  /**
   * Generate audio for a narration block
   */
  async generateBlockAudio(
    block: Omit<NarrationBlock, 'audioData' | 'timingMarkers'>,
    emotion?: string
  ): Promise<NarrationBlock> {
    // Determine voice to use
    const voiceId = this.resolveVoiceForBlock(block);
    const voice = this.voiceManager.getVoice(voiceId);

    if (!voice) {
      throw new Error(`Voice not found: ${voiceId}`);
    }

    // Generate SSML
    const ssml = block.speakerType === 'character'
      ? this.ssmlGenerator.generateDialogue(block.text, emotion)
      : this.ssmlGenerator.generate(block.text, block.speaker, emotion);

    // Call TTS API
    const audioData = await this.callTTSAPI(block.text, voice, emotion);

    // Parse timing markers if available
    let timingMarkers: TimingMarker[] | undefined;
    if (this.options.generateTimingMarkers && audioData.timingData) {
      timingMarkers = this.timingManager.parseTimingResponse(block.text, audioData.timingData);
    }

    return {
      ...block,
      ssml,
      voiceId,
      audioData: {
        url: audioData.url,
        duration: audioData.duration,
        format: this.options.outputFormat,
        sampleRate: this.options.sampleRate,
        bitRate: audioData.bitRate || 128000,
        waveformData: audioData.waveformData,
        generatedAt: Date.now(),
        provider: this.options.provider,
      },
      timingMarkers,
    };
  }

  /**
   * Generate audio for multiple blocks
   */
  async generateChapterAudio(
    chapterId: string,
    chapterName: string,
    blocks: Array<Omit<NarrationBlock, 'audioData' | 'timingMarkers'>>
  ): Promise<ChapterAudio> {
    const generatedBlocks: NarrationBlock[] = [];
    let totalDuration = 0;
    let wordCount = 0;

    for (const block of blocks) {
      const generated = await this.generateBlockAudio(block);
      generatedBlocks.push(generated);
      totalDuration += generated.audioData?.duration || 0;
      wordCount += block.text.split(/\s+/).length;
    }

    return {
      chapterId,
      chapterName,
      blocks: generatedBlocks,
      totalDuration,
      metadata: {
        wordCount,
        blockCount: blocks.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };
  }

  /**
   * Estimate generation cost/time for blocks
   */
  estimateGeneration(blocks: Array<{ text: string }>): {
    characterCount: number;
    wordCount: number;
    estimatedDuration: number; // ms
    estimatedCost: number; // cents
  } {
    const characterCount = blocks.reduce((sum, b) => sum + b.text.length, 0);
    const wordCount = blocks.reduce((sum, b) => sum + b.text.split(/\s+/).length, 0);

    // Average speaking rate: ~150 words per minute
    const estimatedDuration = (wordCount / 150) * 60 * 1000;

    // ElevenLabs pricing: ~$0.30 per 1000 characters (approximate)
    const estimatedCost = (characterCount / 1000) * 30;

    return {
      characterCount,
      wordCount,
      estimatedDuration,
      estimatedCost,
    };
  }

  // -------------------------------------------------------------------------
  // Private Methods
  // -------------------------------------------------------------------------

  private resolveVoiceForBlock(block: Omit<NarrationBlock, 'audioData' | 'timingMarkers'>): string {
    // If voice explicitly set, use it
    if (block.voiceId) {
      return block.voiceId;
    }

    // For character dialogue, look up character assignment
    if (block.speakerType === 'character' && block.speaker) {
      // Try to find by character ID or name
      const assignments = this.voiceManager.getAllCharacterAssignments();
      const assignment = assignments.find(
        a => a.characterId === block.speaker || a.characterName === block.speaker
      );
      if (assignment) {
        return assignment.voiceId;
      }
    }

    // For narrator, use narrator config
    if (block.speakerType === 'narrator') {
      const narratorConfig = this.voiceManager.getNarratorConfig();
      if (narratorConfig) {
        return narratorConfig.voiceId;
      }
    }

    // Default to first narrator preset
    return PRESET_VOICES[0].id;
  }

  private async callTTSAPI(
    text: string,
    voice: VoiceConfig,
    emotion?: string
  ): Promise<{
    url: string;
    duration: number;
    bitRate?: number;
    timingData?: Array<{ word: string; start: number; end: number }>;
    waveformData?: number[];
  }> {
    // Get emotion-adjusted settings if applicable
    const settings = emotion
      ? this.adjustSettingsForEmotion(voice.settings, emotion)
      : voice.settings;

    // Build API request
    const requestBody = {
      text,
      voice_id: voice.providerId,
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarityBoost,
        style: settings.style,
        use_speaker_boost: settings.speakerBoost,
      },
      model_id: 'eleven_multilingual_v2',
      output_format: `${this.options.outputFormat}_${this.options.sampleRate}`,
    };

    // Call API (this should be adjusted based on actual API endpoint)
    const response = await fetch('/api/ai/elevenlabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      url: data.audioUrl,
      duration: data.duration || this.estimateDuration(text),
      timingData: data.alignment?.characters,
      waveformData: this.options.generateWaveform ? data.waveform : undefined,
    };
  }

  private adjustSettingsForEmotion(settings: VoiceSettings, emotion: string): VoiceSettings {
    const emotionAdjustments: Record<string, Partial<VoiceSettings>> = {
      happy: { style: Math.min(1, settings.style + 0.2), speed: 1.1 },
      sad: { style: Math.max(0, settings.style - 0.1), speed: 0.9 },
      angry: { style: Math.min(1, settings.style + 0.3), stability: Math.max(0, settings.stability - 0.1) },
      fearful: { stability: Math.max(0, settings.stability - 0.2), speed: 1.2 },
      excited: { style: Math.min(1, settings.style + 0.3), speed: 1.15 },
      calm: { stability: Math.min(1, settings.stability + 0.1), speed: 0.95 },
    };

    const adjustments = emotionAdjustments[emotion];
    if (adjustments) {
      return { ...settings, ...adjustments };
    }

    return settings;
  }

  private estimateDuration(text: string): number {
    // Average speaking rate: ~150 words per minute
    const words = text.split(/\s+/).length;
    return (words / 150) * 60 * 1000;
  }

  // -------------------------------------------------------------------------
  // Export Methods
  // -------------------------------------------------------------------------

  /**
   * Export chapter audio as combined file (placeholder for actual implementation)
   */
  async exportChapterAudio(
    chapter: ChapterAudio,
    format: 'mp3' | 'wav' | 'm4b' = 'mp3'
  ): Promise<{ url: string; filename: string }> {
    // This would combine all block audio into a single file
    // For now, return a placeholder
    return {
      url: chapter.combinedAudioUrl || '',
      filename: `${chapter.chapterName.replace(/\s+/g, '_')}.${format}`,
    };
  }

  /**
   * Export full audiobook (all chapters)
   */
  async exportAudiobook(
    project: NarrationProject,
    format: 'mp3' | 'wav' | 'm4b' = 'm4b',
    includeChapters: boolean = true
  ): Promise<{ url: string; filename: string; chapters?: Array<{ name: string; startTime: number }> }> {
    // This would combine all chapters with chapter markers
    // For now, return a placeholder
    const chapters = includeChapters
      ? project.chapters.map((ch, i) => ({
          name: ch.chapterName,
          startTime: project.chapters.slice(0, i).reduce((sum, c) => sum + c.totalDuration, 0),
        }))
      : undefined;

    return {
      url: '',
      filename: `audiobook_${project.id}.${format}`,
      chapters,
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

// Export singleton instance
export const narrationGenerator = NarrationGenerator.getInstance();

// Export default voice settings
export { DEFAULT_VOICE_SETTINGS, DEFAULT_SSML_OPTIONS, DEFAULT_GENERATION_OPTIONS };
