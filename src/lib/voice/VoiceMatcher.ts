/**
 * VoiceMatcher - Character-to-voice matching system
 *
 * Analyzes character traits to suggest optimal voice matches,
 * manages auditions, and provides voice direction controls.
 */

import type { Character } from '@/app/types/Character';
import type { Voice, VoiceConfig } from '@/app/types/Voice';

/**
 * Character voice traits derived from analysis
 */
export interface CharacterVoiceTraits {
  characterId: string;
  // Demographics
  ageRange: 'child' | 'young' | 'adult' | 'middle-aged' | 'elderly';
  gender: 'male' | 'female' | 'neutral';
  // Voice characteristics
  pitch: 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
  tone: 'warm' | 'cold' | 'neutral' | 'rough' | 'smooth';
  energy: 'calm' | 'moderate' | 'energetic' | 'intense';
  // Personality
  personality: string[];
  archetype?: string;
  accent?: string;
}

/**
 * Voice profile for matching
 */
export interface VoiceProfile {
  voiceId: string;
  name: string;
  // Characteristics
  ageRange: CharacterVoiceTraits['ageRange'];
  gender: CharacterVoiceTraits['gender'];
  pitch: CharacterVoiceTraits['pitch'];
  tone: CharacterVoiceTraits['tone'];
  energy: CharacterVoiceTraits['energy'];
  // Capabilities
  accents: string[];
  styles: string[];
  specialties: string[];
  // Metadata
  sampleUrl?: string;
  description?: string;
}

/**
 * Voice match result with score
 */
export interface VoiceMatch {
  voice: Voice;
  profile: VoiceProfile;
  score: number; // 0-100
  matchDetails: {
    ageMatch: number;
    genderMatch: number;
    pitchMatch: number;
    toneMatch: number;
    energyMatch: number;
    personalityMatch: number;
  };
  reasons: string[];
}

/**
 * Audition configuration
 */
export interface AuditionConfig {
  characterId: string;
  voiceId: string;
  lines: AuditionLine[];
  direction?: VoiceDirection;
  status: 'pending' | 'generated' | 'reviewed';
  rating?: number;
  notes?: string;
}

/**
 * Audition line
 */
export interface AuditionLine {
  id: string;
  text: string;
  context: string;
  emotion?: string;
  audioUrl?: string;
  duration?: number;
}

/**
 * Voice direction parameters
 */
export interface VoiceDirection {
  // Tone adjustments
  warmth: number; // -1 to 1
  authority: number; // -1 to 1
  friendliness: number; // -1 to 1
  // Delivery style
  formality: number; // 0 (casual) to 1 (formal)
  intensity: number; // 0 to 1
  // Character notes
  characterNotes: string;
  doList: string[];
  dontList: string[];
}

/**
 * Casting comparison
 */
export interface CastingComparison {
  characterId: string;
  auditions: AuditionConfig[];
  selectedVoiceId?: string;
  comparisonNotes?: string;
}

/**
 * Voice library filter
 */
export interface VoiceLibraryFilter {
  gender?: CharacterVoiceTraits['gender'];
  ageRange?: CharacterVoiceTraits['ageRange'];
  pitch?: CharacterVoiceTraits['pitch'];
  tone?: CharacterVoiceTraits['tone'];
  accents?: string[];
  favorites?: boolean;
  shortlisted?: boolean;
}

/**
 * Default voice direction
 */
const DEFAULT_DIRECTION: VoiceDirection = {
  warmth: 0,
  authority: 0,
  friendliness: 0,
  formality: 0.5,
  intensity: 0.5,
  characterNotes: '',
  doList: [],
  dontList: [],
};

/**
 * Sample audition lines by archetype
 */
const AUDITION_LINES: Record<string, string[]> = {
  hero: [
    "I won't let them hurt anyone else. Not while I'm still standing.",
    "There's always another way. We just have to find it.",
    "I didn't ask for this responsibility, but I won't run from it.",
  ],
  villain: [
    "You think you can stop me? How delightfully naive.",
    "Everything is going according to plan. Everything.",
    "They'll understand eventually. Or they won't. Either way...",
  ],
  mentor: [
    "The path won't be easy, but nothing worth doing ever is.",
    "I've made mistakes too. That's how we learn who we really are.",
    "Trust your instincts. They've brought you this far.",
  ],
  sidekick: [
    "Wait, are you sure about this? Because it sounds really dangerous.",
    "I've got your back! ...From over here. Safely.",
    "Best friends stick together, right? That's the deal.",
  ],
  romantic: [
    "I never thought I'd feel this way about anyone.",
    "Every moment with you feels like coming home.",
    "You see me. The real me. That terrifies and thrills me.",
  ],
  comic: [
    "Oh great, another life-threatening situation. Just what I needed today.",
    "I'm not saying it's a bad plan, I'm saying it's THE worst plan.",
    "Did anyone else see that, or am I finally losing it?",
  ],
  mysterious: [
    "Some secrets are better left buried. Trust me on that.",
    "The truth? The truth is more complicated than you're ready for.",
    "I've seen things that would shatter your understanding of reality.",
  ],
  default: [
    "Hello, it's nice to meet you.",
    "I understand what you're saying, but I have my own perspective.",
    "Let me think about that for a moment.",
  ],
};

/**
 * VoiceMatcher singleton class
 */
class VoiceMatcher {
  private static instance: VoiceMatcher;
  private voiceProfiles: Map<string, VoiceProfile> = new Map();
  private favorites: Set<string> = new Set();
  private shortlist: Map<string, Set<string>> = new Map(); // characterId -> voiceIds
  private auditions: Map<string, AuditionConfig[]> = new Map(); // characterId -> auditions
  private directions: Map<string, VoiceDirection> = new Map(); // characterId -> direction
  private castings: Map<string, string> = new Map(); // characterId -> selectedVoiceId

  private constructor() {}

  static getInstance(): VoiceMatcher {
    if (!VoiceMatcher.instance) {
      VoiceMatcher.instance = new VoiceMatcher();
    }
    return VoiceMatcher.instance;
  }

  /**
   * Analyze character to extract voice traits
   */
  analyzeCharacter(character: Character): CharacterVoiceTraits {
    const traits: CharacterVoiceTraits = {
      characterId: character.id,
      ageRange: 'adult',
      gender: 'neutral',
      pitch: 'medium',
      tone: 'neutral',
      energy: 'moderate',
      personality: [],
    };

    // Infer from character type
    const typeLower = (character.type || '').toLowerCase();
    if (typeLower.includes('child') || typeLower.includes('young')) {
      traits.ageRange = 'young';
      traits.pitch = 'high';
    } else if (typeLower.includes('elder') || typeLower.includes('old') || typeLower.includes('ancient')) {
      traits.ageRange = 'elderly';
      traits.pitch = 'low';
    }

    // Infer archetype from type
    if (typeLower.includes('hero') || typeLower.includes('protagonist')) {
      traits.archetype = 'hero';
      traits.tone = 'warm';
      traits.energy = 'energetic';
    } else if (typeLower.includes('villain') || typeLower.includes('antagonist')) {
      traits.archetype = 'villain';
      traits.tone = 'cold';
      traits.energy = 'intense';
    } else if (typeLower.includes('mentor') || typeLower.includes('guide') || typeLower.includes('wise')) {
      traits.archetype = 'mentor';
      traits.tone = 'warm';
      traits.energy = 'calm';
    } else if (typeLower.includes('comic') || typeLower.includes('funny')) {
      traits.archetype = 'comic';
      traits.energy = 'energetic';
    } else if (typeLower.includes('mystery') || typeLower.includes('enigma')) {
      traits.archetype = 'mysterious';
      traits.tone = 'cold';
      traits.energy = 'calm';
    }

    return traits;
  }

  /**
   * Register a voice profile for matching
   */
  registerVoiceProfile(profile: VoiceProfile): void {
    this.voiceProfiles.set(profile.voiceId, profile);
  }

  /**
   * Create voice profile from Voice object
   */
  createProfileFromVoice(voice: Voice): VoiceProfile {
    // Try to infer characteristics from voice name and properties
    const nameLower = voice.name.toLowerCase();
    const descLower = (voice.description || '').toLowerCase();

    // Use voice.gender if available, otherwise infer
    let gender: VoiceProfile['gender'] = voice.gender || 'neutral';
    if (gender === 'neutral') {
      if (nameLower.includes('male') || descLower.includes('male')) gender = 'male';
      if (nameLower.includes('female') || descLower.includes('female')) gender = 'female';
    }

    // Use voice.age_range if available, otherwise infer
    let ageRange: VoiceProfile['ageRange'] = 'adult';
    if (voice.age_range) {
      const ageRangeLower = voice.age_range.toLowerCase();
      if (ageRangeLower.includes('young') || ageRangeLower.includes('child')) ageRange = 'young';
      else if (ageRangeLower.includes('elder') || ageRangeLower.includes('old')) ageRange = 'elderly';
      else if (ageRangeLower.includes('middle')) ageRange = 'middle-aged';
    }

    let pitch: VoiceProfile['pitch'] = 'medium';
    if (descLower.includes('deep') || descLower.includes('bass')) pitch = 'low';
    if (descLower.includes('high') || descLower.includes('soprano')) pitch = 'high';

    return {
      voiceId: voice.voice_id,
      name: voice.name,
      ageRange,
      gender,
      pitch,
      tone: 'neutral',
      energy: 'moderate',
      accents: [],
      styles: [],
      specialties: [],
      sampleUrl: voice.audio_sample_url || undefined,
      description: voice.description || undefined,
    };
  }

  /**
   * Find matching voices for a character
   */
  findMatches(
    character: Character,
    voices: Voice[],
    limit: number = 5
  ): VoiceMatch[] {
    const traits = this.analyzeCharacter(character);
    const matches: VoiceMatch[] = [];

    for (const voice of voices) {
      let profile = this.voiceProfiles.get(voice.voice_id);
      if (!profile) {
        profile = this.createProfileFromVoice(voice);
        this.registerVoiceProfile(profile);
      }

      const match = this.calculateMatch(traits, profile, voice);
      matches.push(match);
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, limit);
  }

  /**
   * Calculate match score between traits and profile
   */
  private calculateMatch(
    traits: CharacterVoiceTraits,
    profile: VoiceProfile,
    voice: Voice
  ): VoiceMatch {
    const details = {
      ageMatch: this.matchAge(traits.ageRange, profile.ageRange),
      genderMatch: this.matchGender(traits.gender, profile.gender),
      pitchMatch: this.matchPitch(traits.pitch, profile.pitch),
      toneMatch: this.matchTone(traits.tone, profile.tone),
      energyMatch: this.matchEnergy(traits.energy, profile.energy),
      personalityMatch: 50, // Default since we don't have personality data
    };

    // Calculate weighted score
    const weights = {
      ageMatch: 0.2,
      genderMatch: 0.25,
      pitchMatch: 0.2,
      toneMatch: 0.15,
      energyMatch: 0.1,
      personalityMatch: 0.1,
    };

    const score = Object.entries(details).reduce(
      (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
      0
    );

    // Generate reasons
    const reasons: string[] = [];
    if (details.genderMatch >= 80) reasons.push('Gender matches well');
    if (details.ageMatch >= 80) reasons.push('Age range is appropriate');
    if (details.pitchMatch >= 80) reasons.push('Pitch level aligns');
    if (details.toneMatch >= 80) reasons.push('Tone complements character');
    if (this.favorites.has(voice.voice_id)) reasons.push('Marked as favorite');

    if (reasons.length === 0) {
      reasons.push('General voice compatibility');
    }

    return {
      voice,
      profile,
      score: Math.round(score),
      matchDetails: details,
      reasons,
    };
  }

  private matchAge(
    traitAge: CharacterVoiceTraits['ageRange'],
    profileAge: VoiceProfile['ageRange']
  ): number {
    if (traitAge === profileAge) return 100;
    const ageOrder = ['child', 'young', 'adult', 'middle-aged', 'elderly'];
    const diff = Math.abs(ageOrder.indexOf(traitAge) - ageOrder.indexOf(profileAge));
    return Math.max(0, 100 - diff * 25);
  }

  private matchGender(
    traitGender: CharacterVoiceTraits['gender'],
    profileGender: VoiceProfile['gender']
  ): number {
    if (traitGender === profileGender) return 100;
    if (traitGender === 'neutral' || profileGender === 'neutral') return 70;
    return 30;
  }

  private matchPitch(
    traitPitch: CharacterVoiceTraits['pitch'],
    profilePitch: VoiceProfile['pitch']
  ): number {
    if (traitPitch === profilePitch) return 100;
    const pitchOrder = ['very-low', 'low', 'medium', 'high', 'very-high'];
    const diff = Math.abs(pitchOrder.indexOf(traitPitch) - pitchOrder.indexOf(profilePitch));
    return Math.max(0, 100 - diff * 20);
  }

  private matchTone(
    traitTone: CharacterVoiceTraits['tone'],
    profileTone: VoiceProfile['tone']
  ): number {
    if (traitTone === profileTone) return 100;
    if (traitTone === 'neutral' || profileTone === 'neutral') return 70;
    // Opposite tones
    const opposites: Record<string, string> = { warm: 'cold', cold: 'warm', rough: 'smooth', smooth: 'rough' };
    if (opposites[traitTone] === profileTone) return 30;
    return 60;
  }

  private matchEnergy(
    traitEnergy: CharacterVoiceTraits['energy'],
    profileEnergy: VoiceProfile['energy']
  ): number {
    if (traitEnergy === profileEnergy) return 100;
    const energyOrder = ['calm', 'moderate', 'energetic', 'intense'];
    const diff = Math.abs(energyOrder.indexOf(traitEnergy) - energyOrder.indexOf(profileEnergy));
    return Math.max(0, 100 - diff * 25);
  }

  /**
   * Generate audition lines for a character
   */
  generateAuditionLines(character: Character, count: number = 3): AuditionLine[] {
    const traits = this.analyzeCharacter(character);
    const archetype = traits.archetype || 'default';
    const lines = AUDITION_LINES[archetype] || AUDITION_LINES.default;

    return lines.slice(0, count).map((text, index) => ({
      id: `audition_${character.id}_${index}`,
      text,
      context: `${archetype} character audition`,
      emotion: this.inferEmotion(text),
    }));
  }

  private inferEmotion(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('!') && (lowerText.includes('won\'t') || lowerText.includes('stop'))) {
      return 'determined';
    }
    if (lowerText.includes('?')) return 'questioning';
    if (lowerText.includes('terrif') || lowerText.includes('thrill')) return 'excited';
    if (lowerText.includes('never thought')) return 'tender';
    if (lowerText.includes('great') || lowerText.includes('worst')) return 'sarcastic';
    return 'neutral';
  }

  /**
   * Create audition for a character with a voice
   */
  createAudition(
    character: Character,
    voice: Voice,
    customLines?: string[]
  ): AuditionConfig {
    const lines = customLines
      ? customLines.map((text, i) => ({
          id: `custom_${character.id}_${voice.voice_id}_${i}`,
          text,
          context: 'Custom audition line',
        }))
      : this.generateAuditionLines(character);

    const audition: AuditionConfig = {
      characterId: character.id,
      voiceId: voice.voice_id,
      lines,
      direction: this.getDirection(character.id),
      status: 'pending',
    };

    // Store audition
    const characterAuditions = this.auditions.get(character.id) || [];
    characterAuditions.push(audition);
    this.auditions.set(character.id, characterAuditions);

    return audition;
  }

  /**
   * Get auditions for a character
   */
  getAuditions(characterId: string): AuditionConfig[] {
    return this.auditions.get(characterId) || [];
  }

  /**
   * Rate an audition
   */
  rateAudition(
    characterId: string,
    voiceId: string,
    rating: number,
    notes?: string
  ): void {
    const auditions = this.auditions.get(characterId) || [];
    const audition = auditions.find(a => a.voiceId === voiceId);
    if (audition) {
      audition.rating = Math.max(1, Math.min(5, rating));
      audition.notes = notes;
      audition.status = 'reviewed';
    }
  }

  /**
   * Set voice direction for a character
   */
  setDirection(characterId: string, direction: Partial<VoiceDirection>): VoiceDirection {
    const current = this.directions.get(characterId) || { ...DEFAULT_DIRECTION };
    const updated = { ...current, ...direction };
    this.directions.set(characterId, updated);
    return updated;
  }

  /**
   * Get voice direction for a character
   */
  getDirection(characterId: string): VoiceDirection {
    return this.directions.get(characterId) || { ...DEFAULT_DIRECTION };
  }

  /**
   * Add voice to favorites
   */
  addFavorite(voiceId: string): void {
    this.favorites.add(voiceId);
  }

  /**
   * Remove voice from favorites
   */
  removeFavorite(voiceId: string): void {
    this.favorites.delete(voiceId);
  }

  /**
   * Check if voice is favorite
   */
  isFavorite(voiceId: string): boolean {
    return this.favorites.has(voiceId);
  }

  /**
   * Get all favorites
   */
  getFavorites(): string[] {
    return Array.from(this.favorites);
  }

  /**
   * Add voice to character shortlist
   */
  addToShortlist(characterId: string, voiceId: string): void {
    const list = this.shortlist.get(characterId) || new Set();
    list.add(voiceId);
    this.shortlist.set(characterId, list);
  }

  /**
   * Remove voice from character shortlist
   */
  removeFromShortlist(characterId: string, voiceId: string): void {
    const list = this.shortlist.get(characterId);
    if (list) {
      list.delete(voiceId);
    }
  }

  /**
   * Get shortlisted voices for character
   */
  getShortlist(characterId: string): string[] {
    return Array.from(this.shortlist.get(characterId) || []);
  }

  /**
   * Cast a voice for a character
   */
  castVoice(characterId: string, voiceId: string): void {
    this.castings.set(characterId, voiceId);
  }

  /**
   * Get cast voice for a character
   */
  getCasting(characterId: string): string | undefined {
    return this.castings.get(characterId);
  }

  /**
   * Remove casting for a character
   */
  removeCasting(characterId: string): void {
    this.castings.delete(characterId);
  }

  /**
   * Get all castings
   */
  getAllCastings(): Map<string, string> {
    return new Map(this.castings);
  }

  /**
   * Filter voices by criteria
   */
  filterVoices(voices: Voice[], filter: VoiceLibraryFilter): Voice[] {
    return voices.filter(voice => {
      const profile = this.voiceProfiles.get(voice.voice_id) || this.createProfileFromVoice(voice);

      if (filter.gender && profile.gender !== filter.gender) return false;
      if (filter.ageRange && profile.ageRange !== filter.ageRange) return false;
      if (filter.pitch && profile.pitch !== filter.pitch) return false;
      if (filter.tone && profile.tone !== filter.tone) return false;
      if (filter.favorites && !this.favorites.has(voice.voice_id)) return false;

      return true;
    });
  }

  /**
   * Get comparison for a character
   */
  getComparison(characterId: string): CastingComparison {
    return {
      characterId,
      auditions: this.getAuditions(characterId),
      selectedVoiceId: this.getCasting(characterId),
    };
  }
}

// Export singleton instance
export const voiceMatcher = VoiceMatcher.getInstance();

// Export class for testing
export { VoiceMatcher };

// Export default direction
export { DEFAULT_DIRECTION };
