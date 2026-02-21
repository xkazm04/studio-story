/**
 * DialogueGenerator - Scene voice production system
 *
 * Parses scenes for dialogue, assigns voices per character,
 * and generates audio for entire scenes.
 */

import type { Scene } from '@/app/types/Scene';
import type { Voice, VoiceConfig } from '@/app/types/Voice';
import type { Character } from '@/app/types/Character';

/**
 * Dialogue line extracted from scene content
 */
export interface DialogueLine {
  id: string;
  speakerId: string; // Character ID or 'narrator'
  speakerName: string;
  speakerType: 'character' | 'narrator' | 'system';
  text: string;
  emotion?: string;
  direction?: string; // Stage direction like "(whispered)" or "(shouting)"
  order: number;
}

/**
 * Generated audio segment
 */
export interface AudioSegment {
  id: string;
  dialogueLineId: string;
  voiceId: string;
  audioUrl: string;
  audioBlob?: Blob;
  duration: number; // in seconds
  startTime: number; // position in scene
  text: string;
  speakerName: string;
}

/**
 * Scene dialogue generation result
 */
export interface SceneDialogueResult {
  sceneId: string;
  sceneName: string;
  dialogueLines: DialogueLine[];
  audioSegments: AudioSegment[];
  totalDuration: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

/**
 * Voice assignment map
 */
export interface VoiceAssignment {
  characterId: string;
  characterName: string;
  voiceId: string;
  voiceName: string;
  voiceConfig?: VoiceConfig;
}

/**
 * Dialogue generation options
 */
export interface DialogueGeneratorOptions {
  defaultNarratorVoiceId?: string;
  silenceBetweenLines?: number; // ms
  silenceBetweenParagraphs?: number; // ms
  preserveEmotions?: boolean;
  parseDirections?: boolean;
}

const DEFAULT_OPTIONS: DialogueGeneratorOptions = {
  silenceBetweenLines: 500,
  silenceBetweenParagraphs: 1000,
  preserveEmotions: true,
  parseDirections: true,
};

/**
 * DialogueGenerator singleton class
 */
class DialogueGenerator {
  private static instance: DialogueGenerator;
  private voiceAssignments: Map<string, VoiceAssignment> = new Map();
  private options: DialogueGeneratorOptions = DEFAULT_OPTIONS;
  private generationQueue: Array<{
    scene: Scene;
    resolve: (result: SceneDialogueResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;

  private constructor() {}

  static getInstance(): DialogueGenerator {
    if (!DialogueGenerator.instance) {
      DialogueGenerator.instance = new DialogueGenerator();
    }
    return DialogueGenerator.instance;
  }

  /**
   * Configure generator options
   */
  configure(options: Partial<DialogueGeneratorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Assign voice to a character
   */
  assignVoice(
    character: Character,
    voice: Voice,
    config?: VoiceConfig
  ): VoiceAssignment {
    const assignment: VoiceAssignment = {
      characterId: character.id,
      characterName: character.name,
      voiceId: voice.voice_id,
      voiceName: voice.name,
      voiceConfig: config,
    };
    this.voiceAssignments.set(character.id, assignment);
    return assignment;
  }

  /**
   * Get voice assignment for a character
   */
  getVoiceAssignment(characterId: string): VoiceAssignment | undefined {
    return this.voiceAssignments.get(characterId);
  }

  /**
   * Clear all voice assignments
   */
  clearAssignments(): void {
    this.voiceAssignments.clear();
  }

  /**
   * Parse scene content to extract dialogue lines
   */
  parseSceneDialogue(scene: Scene, characters: Character[]): DialogueLine[] {
    const lines: DialogueLine[] = [];
    const content = scene.content || scene.script || scene.description || '';

    if (!content) return lines;

    // Build character name lookup
    const characterLookup = new Map<string, Character>();
    characters.forEach(c => {
      characterLookup.set(c.name.toLowerCase(), c);
      // Also add first name only
      const firstName = c.name.split(' ')[0].toLowerCase();
      if (!characterLookup.has(firstName)) {
        characterLookup.set(firstName, c);
      }
    });

    // Parse dialogue patterns:
    // 1. "Character Name: dialogue text"
    // 2. "CHARACTER NAME: dialogue text"
    // 3. Quoted text with speaker tags
    // 4. Narrator blocks

    const paragraphs = content.split(/\n\n+/);
    let order = 0;

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;

      // Pattern 1: "Name: dialogue" format
      const colonMatch = trimmed.match(/^([A-Za-z\s]+):\s*([\s\S]+)$/);
      if (colonMatch) {
        const [, speakerRaw, text] = colonMatch;
        const speakerName = speakerRaw.trim();
        const character = characterLookup.get(speakerName.toLowerCase());

        // Parse direction like "(whispered)"
        const { cleanText, direction, emotion } = this.parseDirection(text);

        lines.push({
          id: `line_${scene.id}_${order}`,
          speakerId: character?.id || speakerName.toLowerCase(),
          speakerName: character?.name || speakerName,
          speakerType: character ? 'character' : 'narrator',
          text: cleanText,
          direction,
          emotion,
          order: order++,
        });
        continue;
      }

      // Pattern 2: Quoted dialogue with attribution
      const quoteMatch = trimmed.match(/[""]([\s\S]+?)[""](?:\s*(?:said|asked|replied|whispered|shouted|exclaimed)\s+([A-Za-z\s]+))?/);
      if (quoteMatch) {
        const [, text, speakerRaw] = quoteMatch;
        const speakerName = speakerRaw?.trim() || 'Narrator';
        const character = speakerRaw ? characterLookup.get(speakerName.toLowerCase()) : undefined;

        const { cleanText, direction, emotion } = this.parseDirection(text);

        lines.push({
          id: `line_${scene.id}_${order}`,
          speakerId: character?.id || 'narrator',
          speakerName: character?.name || speakerName,
          speakerType: character ? 'character' : 'narrator',
          text: cleanText,
          direction,
          emotion,
          order: order++,
        });
        continue;
      }

      // Pattern 3: Use scene's speaker info if available
      if (scene.speaker && scene.message) {
        const character = characterLookup.get(scene.speaker.toLowerCase());
        const { cleanText, direction, emotion } = this.parseDirection(scene.message);

        lines.push({
          id: `line_${scene.id}_${order}`,
          speakerId: character?.id || scene.speaker.toLowerCase(),
          speakerName: character?.name || scene.speaker,
          speakerType: scene.speaker_type || (character ? 'character' : 'narrator'),
          text: cleanText,
          direction,
          emotion,
          order: order++,
        });
        continue;
      }

      // Default: Treat as narrator text
      const { cleanText, direction, emotion } = this.parseDirection(trimmed);
      lines.push({
        id: `line_${scene.id}_${order}`,
        speakerId: 'narrator',
        speakerName: 'Narrator',
        speakerType: 'narrator',
        text: cleanText,
        direction,
        emotion,
        order: order++,
      });
    }

    return lines;
  }

  /**
   * Parse stage directions from text
   */
  private parseDirection(text: string): {
    cleanText: string;
    direction?: string;
    emotion?: string;
  } {
    if (!this.options.parseDirections) {
      return { cleanText: text };
    }

    // Extract parenthetical directions like "(whispered)" or "(angrily)"
    const directionMatch = text.match(/\(([^)]+)\)/);
    const direction = directionMatch?.[1];
    const cleanText = text.replace(/\([^)]+\)/g, '').trim();

    // Infer emotion from direction
    let emotion: string | undefined;
    if (direction) {
      const emotionKeywords: Record<string, string> = {
        whispered: 'soft',
        shouted: 'angry',
        yelled: 'angry',
        laughed: 'happy',
        cried: 'sad',
        sighed: 'melancholy',
        angrily: 'angry',
        sadly: 'sad',
        happily: 'happy',
        nervously: 'anxious',
        excitedly: 'excited',
      };
      const lower = direction.toLowerCase();
      for (const [keyword, emo] of Object.entries(emotionKeywords)) {
        if (lower.includes(keyword)) {
          emotion = emo;
          break;
        }
      }
    }

    return { cleanText, direction, emotion };
  }

  /**
   * Generate audio for a dialogue line (mock implementation)
   */
  private async generateAudio(
    line: DialogueLine,
    voiceId: string,
    _config?: VoiceConfig
  ): Promise<AudioSegment> {
    // Simulate TTS API call
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Estimate duration based on word count (average ~150 words/minute)
    const wordCount = line.text.split(/\s+/).length;
    const duration = (wordCount / 150) * 60;

    return {
      id: `audio_${line.id}`,
      dialogueLineId: line.id,
      voiceId,
      audioUrl: `blob:audio/${line.id}`, // Would be real URL from TTS
      duration,
      startTime: 0, // Will be calculated during assembly
      text: line.text,
      speakerName: line.speakerName,
    };
  }

  /**
   * Generate dialogue for an entire scene
   */
  async generateSceneDialogue(
    scene: Scene,
    characters: Character[],
    voices: Voice[]
  ): Promise<SceneDialogueResult> {
    const result: SceneDialogueResult = {
      sceneId: scene.id,
      sceneName: scene.name,
      dialogueLines: [],
      audioSegments: [],
      totalDuration: 0,
      status: 'generating',
    };

    try {
      // Parse dialogue from scene
      result.dialogueLines = this.parseSceneDialogue(scene, characters);

      if (result.dialogueLines.length === 0) {
        result.status = 'completed';
        return result;
      }

      // Build voice lookup
      const voiceLookup = new Map<string, Voice>();
      voices.forEach(v => {
        if (v.character_id) {
          voiceLookup.set(v.character_id, v);
        }
      });

      // Find default narrator voice
      const narratorVoice = voices.find(v => !v.character_id) ||
        voices.find(v => v.name.toLowerCase().includes('narrator')) ||
        voices[0];

      // Generate audio for each line
      let currentTime = 0;
      for (const line of result.dialogueLines) {
        // Get appropriate voice
        let voice: Voice | undefined;
        if (line.speakerType === 'narrator') {
          voice = narratorVoice;
        } else {
          voice = voiceLookup.get(line.speakerId);
          // Fall back to assignment or narrator
          if (!voice) {
            const assignment = this.voiceAssignments.get(line.speakerId);
            if (assignment) {
              voice = voices.find(v => v.voice_id === assignment.voiceId);
            }
          }
          if (!voice) {
            voice = narratorVoice;
          }
        }

        if (!voice) {
          throw new Error(`No voice available for speaker: ${line.speakerName}`);
        }

        // Generate audio segment
        const assignment = this.voiceAssignments.get(line.speakerId);
        const segment = await this.generateAudio(
          line,
          voice.voice_id,
          assignment?.voiceConfig
        );

        segment.startTime = currentTime;
        result.audioSegments.push(segment);

        // Add duration plus silence
        currentTime += segment.duration;
        currentTime += (this.options.silenceBetweenLines || 500) / 1000;
      }

      result.totalDuration = currentTime;
      result.status = 'completed';
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : 'Generation failed';
    }

    return result;
  }

  /**
   * Add scene to generation queue
   */
  queueSceneGeneration(
    scene: Scene,
    characters: Character[],
    voices: Voice[]
  ): Promise<SceneDialogueResult> {
    return new Promise((resolve, reject) => {
      this.generationQueue.push({ scene, resolve, reject });

      // Store context for processing
      (this.generationQueue[this.generationQueue.length - 1] as any).characters = characters;
      (this.generationQueue[this.generationQueue.length - 1] as any).voices = voices;

      this.processQueue();
    });
  }

  /**
   * Process generation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.generationQueue.length === 0) return;

    this.isProcessing = true;

    while (this.generationQueue.length > 0) {
      const item = this.generationQueue.shift()!;
      const { scene, resolve, reject } = item;
      const characters = (item as any).characters;
      const voices = (item as any).voices;

      try {
        const result = await this.generateSceneDialogue(scene, characters, voices);
        resolve(result);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Generation failed'));
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { pending: number; isProcessing: boolean } {
    return {
      pending: this.generationQueue.length,
      isProcessing: this.isProcessing,
    };
  }
}

// Export singleton instance
export const dialogueGenerator = DialogueGenerator.getInstance();

// Export class for testing
export { DialogueGenerator };
