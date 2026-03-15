/**
 * StoryboardEngine — Scene-to-Canvas Automation
 *
 * Transforms story structure data (scenes, beats, characters, relationships)
 * into storyboard-ready image prompts with automatic composition.
 *
 * Beat type → lighting/mood mapping:
 *   setup     → soft, warm, inviting
 *   conflict  → high-contrast, harsh shadows
 *   climax    → dramatic, chiaroscuro, cinematic
 *   resolution→ golden hour, gentle, balanced
 *   transition→ muted, atmospheric, contemplative
 *   reveal    → spotlight, rim lighting, mysterious
 *   action    → dynamic, motion blur, high energy
 */

import type { Scene } from '@/app/types/Scene';
import type { Beat } from '@/app/types/Beat';
import type { Character } from '@/app/types/Character';
import type { Act } from '@/app/types/Act';
import type { PromptComponents } from '@/app/types/Image';
import type { ParsedSceneContext, CharacterPresence } from './SceneParser';
import type { GeneratedPrompt, ShotType } from './PromptGenerator';
import { sceneParser } from './SceneParser';
import { promptGenerator } from './PromptGenerator';

// ============================================================================
// Types
// ============================================================================

export interface StoryboardFrame {
  id: string;
  sceneId: string;
  sceneName: string;
  actId: string;
  actName?: string;
  order: number;
  /** The beat type driving visual mood (if scene is linked to a beat) */
  beatType?: string;
  beatName?: string;
  /** Parsed visual context from the scene */
  context: ParsedSceneContext;
  /** Multiple shot prompts for this frame */
  prompts: GeneratedPrompt[];
  /** Which prompt index is currently selected */
  selectedPromptIndex: number;
  /** Existing image on the scene (if already generated) */
  existingImageUrl?: string;
  existingImagePrompt?: string;
  /** Camera/composition metadata derived from beat type */
  moodPreset: MoodPreset;
}

export interface MoodPreset {
  beatType: string;
  lighting: string;
  colorPalette: string;
  contrast: string;
  atmosphere: string;
  cameraHint: string;
}

export interface StoryboardActGroup {
  actId: string;
  actName: string;
  actOrder: number;
  frames: StoryboardFrame[];
}

// ============================================================================
// Beat Type → Visual Mood Mapping
// ============================================================================

const BEAT_MOOD_PRESETS: Record<string, MoodPreset> = {
  setup: {
    beatType: 'setup',
    lighting: 'soft warm lighting, gentle fill light',
    colorPalette: 'warm earth tones, inviting colors',
    contrast: 'low contrast, soft shadows',
    atmosphere: 'calm, inviting, establishing tone',
    cameraHint: 'wide establishing shot, steady composition',
  },
  conflict: {
    beatType: 'conflict',
    lighting: 'high-contrast side lighting, harsh shadows',
    colorPalette: 'desaturated with red/orange accents',
    contrast: 'high contrast, deep blacks',
    atmosphere: 'tense, uneasy, charged',
    cameraHint: 'tight framing, dutch angle optional',
  },
  climax: {
    beatType: 'climax',
    lighting: 'dramatic chiaroscuro, cinematic rim lighting',
    colorPalette: 'bold saturated colors, high impact',
    contrast: 'extreme contrast, dramatic shadows',
    atmosphere: 'epic, intense, climactic',
    cameraHint: 'dynamic low angle, dramatic composition',
  },
  resolution: {
    beatType: 'resolution',
    lighting: 'golden hour light, gentle backlighting',
    colorPalette: 'warm golden tones, soft palette',
    contrast: 'medium contrast, balanced',
    atmosphere: 'peaceful, relieved, hopeful',
    cameraHint: 'wide shot pulling back, breathing room',
  },
  transition: {
    beatType: 'transition',
    lighting: 'muted diffused light, atmospheric haze',
    colorPalette: 'muted desaturated tones',
    contrast: 'low contrast, soft gradients',
    atmosphere: 'contemplative, transitional, quiet',
    cameraHint: 'medium shot, neutral angle',
  },
  reveal: {
    beatType: 'reveal',
    lighting: 'spotlight effect, rim lighting, volumetric light',
    colorPalette: 'cool tones with warm accent on reveal subject',
    contrast: 'selective contrast, focused illumination',
    atmosphere: 'mysterious, suspenseful, anticipatory',
    cameraHint: 'push-in close-up, shallow depth of field',
  },
  action: {
    beatType: 'action',
    lighting: 'dynamic mixed lighting, motion-implied',
    colorPalette: 'vivid saturated, high energy',
    contrast: 'high contrast, sharp detail',
    atmosphere: 'energetic, urgent, kinetic',
    cameraHint: 'dynamic angle, motion blur, action frozen',
  },
};

const DEFAULT_MOOD_PRESET: MoodPreset = {
  beatType: 'neutral',
  lighting: 'natural cinematic lighting',
  colorPalette: 'balanced natural colors',
  contrast: 'medium contrast',
  atmosphere: 'neutral, grounded',
  cameraHint: 'standard medium shot',
};

// ============================================================================
// StoryboardEngine
// ============================================================================

class StoryboardEngine {
  private static instance: StoryboardEngine;

  private constructor() {}

  static getInstance(): StoryboardEngine {
    if (!StoryboardEngine.instance) {
      StoryboardEngine.instance = new StoryboardEngine();
    }
    return StoryboardEngine.instance;
  }

  /**
   * Generate a full act storyboard from scenes, beats, and characters.
   */
  generateActStoryboard(
    scenes: Scene[],
    beats: Beat[],
    characters: Character[],
    act: Act
  ): StoryboardActGroup {
    const sortedScenes = [...scenes]
      .filter((s) => s.act_id === act.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const frames = sortedScenes.map((scene, index) =>
      this.generateFrame(scene, beats, characters, act, index)
    );

    return {
      actId: act.id,
      actName: act.name,
      actOrder: act.order ?? 0,
      frames,
    };
  }

  /**
   * Generate a single storyboard frame from a scene.
   */
  generateFrame(
    scene: Scene,
    beats: Beat[],
    characters: Character[],
    act?: Act,
    orderOverride?: number
  ): StoryboardFrame {
    // Find the closest beat for this scene (by order proximity within the act)
    const sceneBeat = this.findSceneBeat(scene, beats);
    const moodPreset = this.getMoodPreset(sceneBeat?.type);

    // Parse scene context using existing SceneParser
    const context = sceneParser.parseScene(scene, characters, act);

    // Generate prompts with beat-aware mood injection
    const prompts = this.generateBeatAwarePrompts(context, moodPreset);

    return {
      id: `frame_${scene.id}`,
      sceneId: scene.id,
      sceneName: scene.name,
      actId: scene.act_id,
      actName: act?.name,
      order: orderOverride ?? scene.order ?? 0,
      beatType: sceneBeat?.type,
      beatName: sceneBeat?.name,
      context,
      prompts,
      selectedPromptIndex: 0,
      existingImageUrl: scene.image_url,
      existingImagePrompt: scene.image_prompt,
      moodPreset,
    };
  }

  /**
   * Get the mood preset for a beat type.
   */
  getMoodPreset(beatType?: string): MoodPreset {
    if (!beatType) return DEFAULT_MOOD_PRESET;
    const normalized = beatType.toLowerCase().trim();

    // Direct match
    if (BEAT_MOOD_PRESETS[normalized]) {
      return BEAT_MOOD_PRESETS[normalized];
    }

    // Fuzzy match — beat names often contain the type keyword
    for (const [key, preset] of Object.entries(BEAT_MOOD_PRESETS)) {
      if (normalized.includes(key)) return preset;
    }

    return DEFAULT_MOOD_PRESET;
  }

  /**
   * Generate prompts that incorporate beat-type mood information.
   */
  private generateBeatAwarePrompts(
    context: ParsedSceneContext,
    moodPreset: MoodPreset
  ): GeneratedPrompt[] {
    // Use existing multi-shot generation
    const characterAppearances = new Map();
    const baseResult = promptGenerator.generateMultiShot(context, characterAppearances, {
      includeCharacterDetails: true,
    });

    // Enhance each prompt with the beat mood preset
    return baseResult.prompts.map((prompt) => ({
      ...prompt,
      main: this.injectMoodIntoPrompt(prompt.main, moodPreset),
      components: this.injectMoodIntoComponents(prompt.components, moodPreset),
    }));
  }

  /**
   * Inject beat-type mood modifiers into a prompt string.
   */
  private injectMoodIntoPrompt(prompt: string, mood: MoodPreset): string {
    const moodSuffix = [mood.lighting, mood.colorPalette, mood.atmosphere].join(', ');
    return `${prompt}, ${moodSuffix}`;
  }

  /**
   * Inject beat-type mood modifiers into prompt components.
   */
  private injectMoodIntoComponents(
    components: PromptComponents,
    mood: MoodPreset
  ): PromptComponents {
    return {
      ...components,
      artstyle: `${components.artstyle}, ${mood.lighting}, ${mood.colorPalette}`,
      scenery: `${components.scenery}, ${mood.atmosphere}`,
      camera: `${components.camera}, ${mood.cameraHint}`,
    };
  }

  /**
   * Find the beat most closely associated with a scene.
   * Uses order proximity within the same act.
   */
  private findSceneBeat(scene: Scene, beats: Beat[]): Beat | undefined {
    // Filter beats to same act
    const actBeats = beats.filter((b) => b.act_id === scene.act_id);
    if (actBeats.length === 0) {
      // Fall back to project-level beats and use order proximity
      const sortedBeats = [...beats].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      if (sortedBeats.length === 0) return undefined;

      // Map scene order to beat space
      const sceneOrder = scene.order ?? 0;
      return sortedBeats.reduce((closest, beat) => {
        const beatDist = Math.abs((beat.order ?? 0) - sceneOrder);
        const closestDist = Math.abs((closest.order ?? 0) - sceneOrder);
        return beatDist < closestDist ? beat : closest;
      });
    }

    // Within act: match by order ratio
    const sortedActBeats = actBeats.sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const sceneOrder = scene.order ?? 0;
    return sortedActBeats.reduce((closest, beat) => {
      const beatDist = Math.abs((beat.order ?? 0) - sceneOrder);
      const closestDist = Math.abs((closest.order ?? 0) - sceneOrder);
      return beatDist < closestDist ? beat : closest;
    });
  }

  /**
   * Build the final combined prompt string from a frame for image generation.
   */
  getFramePrompt(frame: StoryboardFrame): string {
    const prompt = frame.prompts[frame.selectedPromptIndex];
    if (!prompt) return '';
    return prompt.main;
  }

  /**
   * Get the negative prompt for a frame.
   */
  getFrameNegativePrompt(frame: StoryboardFrame): string {
    const prompt = frame.prompts[frame.selectedPromptIndex];
    if (!prompt) return '';
    return prompt.negative;
  }
}

export const storyboardEngine = StoryboardEngine.getInstance();
