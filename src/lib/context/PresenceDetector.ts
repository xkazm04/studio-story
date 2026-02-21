'use strict';

import type { Character } from '@/app/types/Character';

/**
 * PresenceDetector - Detects character presence in scene content
 *
 * Analyzes scene text to determine which characters are mentioned,
 * present, or speaking in a scene.
 */

export interface CharacterPresence {
  characterId: string;
  characterName: string;
  confidence: number; // 0-1, how confident we are they're present
  mentionCount: number;
  firstMentionIndex: number;
  isSpeaking: boolean;
  roles: PresenceRole[];
}

export type PresenceRole =
  | 'mentioned' // Just name appears
  | 'speaking' // Has dialogue
  | 'acting' // Performing actions
  | 'observing' // Passive presence
  | 'entering' // Arrives in scene
  | 'leaving'; // Departs scene

export interface PresenceAnalysis {
  presentCharacters: CharacterPresence[];
  mentionedCharacters: CharacterPresence[];
  speakingCharacters: CharacterPresence[];
  totalMentions: number;
  dominantCharacter?: CharacterPresence;
}

export interface DialogueLine {
  speaker: string;
  content: string;
  position: number;
}

/**
 * Singleton class for detecting character presence in scene content
 */
class PresenceDetectorClass {
  private static instance: PresenceDetectorClass;

  // Common dialogue indicators
  private readonly dialoguePatterns = [
    /[""]([^""]+)[""],?\s*(?:said|asked|replied|exclaimed|whispered|muttered|shouted|yelled|called|answered)\s+(\w+)/gi,
    /(\w+)\s+(?:said|asked|replied|exclaimed|whispered|muttered|shouted|yelled|called|answered)[,:]?\s*[""]([^""]+)[""]*/gi,
    /[""]([^""]+)[""][\s\S]*?[-—]\s*(\w+)/g,
    /(\w+):\s*[""]?([^""]+)[""]?/g,
  ];

  // Action verbs that indicate character activity
  private readonly actionVerbs = [
    'walked', 'ran', 'stood', 'sat', 'looked', 'turned', 'moved',
    'grabbed', 'took', 'gave', 'held', 'dropped', 'picked',
    'opened', 'closed', 'pushed', 'pulled', 'knocked',
    'smiled', 'frowned', 'laughed', 'cried', 'sighed',
    'nodded', 'shook', 'waved', 'pointed', 'gestured',
  ];

  // Entry/exit verbs
  private readonly entryVerbs = ['entered', 'arrived', 'came', 'appeared', 'walked in', 'burst in'];
  private readonly exitVerbs = ['left', 'departed', 'exited', 'went', 'walked out', 'disappeared'];

  private constructor() {}

  static getInstance(): PresenceDetectorClass {
    if (!PresenceDetectorClass.instance) {
      PresenceDetectorClass.instance = new PresenceDetectorClass();
    }
    return PresenceDetectorClass.instance;
  }

  /**
   * Analyze scene content for character presence
   */
  analyzePresence(content: string, characters: Character[]): PresenceAnalysis {
    if (!content || characters.length === 0) {
      return {
        presentCharacters: [],
        mentionedCharacters: [],
        speakingCharacters: [],
        totalMentions: 0,
      };
    }

    const presenceMap = new Map<string, CharacterPresence>();
    const contentLower = content.toLowerCase();

    // Analyze each character
    for (const character of characters) {
      const presence = this.analyzeCharacterPresence(content, contentLower, character);
      if (presence.mentionCount > 0) {
        presenceMap.set(character.id, presence);
      }
    }

    const allPresences = Array.from(presenceMap.values());

    // Categorize by presence type
    const presentCharacters = allPresences.filter(p => p.confidence >= 0.5);
    const mentionedCharacters = allPresences.filter(p => p.roles.includes('mentioned'));
    const speakingCharacters = allPresences.filter(p => p.isSpeaking);

    // Find dominant character (most mentions or highest confidence)
    const dominantCharacter = presentCharacters.length > 0
      ? presentCharacters.reduce((a, b) =>
          a.mentionCount * a.confidence > b.mentionCount * b.confidence ? a : b
        )
      : undefined;

    return {
      presentCharacters,
      mentionedCharacters,
      speakingCharacters,
      totalMentions: allPresences.reduce((sum, p) => sum + p.mentionCount, 0),
      dominantCharacter,
    };
  }

  /**
   * Analyze a single character's presence in content
   */
  private analyzeCharacterPresence(
    content: string,
    contentLower: string,
    character: Character
  ): CharacterPresence {
    const nameLower = character.name.toLowerCase();
    const roles: PresenceRole[] = [];
    let mentionCount = 0;
    let firstMentionIndex = -1;
    let isSpeaking = false;

    // Count name mentions
    let searchIndex = 0;
    while (true) {
      const index = contentLower.indexOf(nameLower, searchIndex);
      if (index === -1) break;

      // Check if it's a whole word match
      const charBefore = index > 0 ? contentLower[index - 1] : ' ';
      const charAfter = index + nameLower.length < contentLower.length
        ? contentLower[index + nameLower.length]
        : ' ';

      if (/[\s.,!?"'\-—]/.test(charBefore) && /[\s.,!?"'\-—]/.test(charAfter)) {
        mentionCount++;
        if (firstMentionIndex === -1) {
          firstMentionIndex = index;
        }

        // Check for speaking
        if (this.isCharacterSpeaking(content, index, character.name)) {
          isSpeaking = true;
          if (!roles.includes('speaking')) {
            roles.push('speaking');
          }
        }

        // Check for actions
        if (this.isCharacterActing(content, index, character.name)) {
          if (!roles.includes('acting')) {
            roles.push('acting');
          }
        }

        // Check for entry/exit
        if (this.isCharacterEntering(content, index, character.name)) {
          if (!roles.includes('entering')) {
            roles.push('entering');
          }
        }
        if (this.isCharacterLeaving(content, index, character.name)) {
          if (!roles.includes('leaving')) {
            roles.push('leaving');
          }
        }
      }

      searchIndex = index + 1;
    }

    // If mentioned but no specific role, mark as mentioned
    if (mentionCount > 0 && roles.length === 0) {
      roles.push('mentioned');
    }

    // Calculate confidence
    const confidence = this.calculateConfidence(mentionCount, roles, content.length);

    return {
      characterId: character.id,
      characterName: character.name,
      confidence,
      mentionCount,
      firstMentionIndex,
      isSpeaking,
      roles,
    };
  }

  /**
   * Check if character is speaking at a given position
   */
  private isCharacterSpeaking(content: string, position: number, name: string): boolean {
    // Get surrounding context (200 chars each direction)
    const start = Math.max(0, position - 200);
    const end = Math.min(content.length, position + name.length + 200);
    const context = content.slice(start, end);

    // Look for dialogue patterns near the name
    const dialogueIndicators = ['said', 'asked', 'replied', 'exclaimed', 'whispered', 'muttered', 'shouted'];

    for (const indicator of dialogueIndicators) {
      const pattern = new RegExp(
        `(${name}\\s+${indicator}|${indicator}\\s+${name}|[""][^""]+[""].*${name}|${name}.*[""])`,
        'i'
      );
      if (pattern.test(context)) {
        return true;
      }
    }

    // Check for direct dialogue format: "Name: dialogue" or "Name said:"
    const colonPattern = new RegExp(`${name}\\s*:`, 'i');
    return colonPattern.test(context);
  }

  /**
   * Check if character is performing actions
   */
  private isCharacterActing(content: string, position: number, name: string): boolean {
    const start = Math.max(0, position - 50);
    const end = Math.min(content.length, position + name.length + 100);
    const context = content.slice(start, end).toLowerCase();

    for (const verb of this.actionVerbs) {
      const pattern = new RegExp(`${name.toLowerCase()}\\s+${verb}|${verb}.*${name.toLowerCase()}`, 'i');
      if (pattern.test(context)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if character is entering the scene
   */
  private isCharacterEntering(content: string, position: number, name: string): boolean {
    const start = Math.max(0, position - 50);
    const end = Math.min(content.length, position + name.length + 100);
    const context = content.slice(start, end).toLowerCase();

    for (const verb of this.entryVerbs) {
      if (context.includes(verb)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if character is leaving the scene
   */
  private isCharacterLeaving(content: string, position: number, name: string): boolean {
    const start = Math.max(0, position - 50);
    const end = Math.min(content.length, position + name.length + 100);
    const context = content.slice(start, end).toLowerCase();

    for (const verb of this.exitVerbs) {
      if (context.includes(verb)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate confidence score for character presence
   */
  private calculateConfidence(mentionCount: number, roles: PresenceRole[], contentLength: number): number {
    let confidence = 0;

    // Base confidence from mention count (normalized by content length)
    const mentionDensity = mentionCount / (contentLength / 500); // per 500 chars
    confidence += Math.min(0.4, mentionDensity * 0.2);

    // Boost for specific roles
    if (roles.includes('speaking')) confidence += 0.3;
    if (roles.includes('acting')) confidence += 0.2;
    if (roles.includes('entering') || roles.includes('leaving')) confidence += 0.15;

    // Minimum confidence if mentioned at all
    if (mentionCount > 0) {
      confidence = Math.max(0.1, confidence);
    }

    return Math.min(1, confidence);
  }

  /**
   * Extract dialogue lines from content
   */
  extractDialogue(content: string): DialogueLine[] {
    const lines: DialogueLine[] = [];

    // Pattern for "dialogue" said Character
    const pattern1 = /[""]([^""]+)[""],?\s*(?:said|asked|replied|exclaimed)\s+(\w+)/gi;
    let match;

    while ((match = pattern1.exec(content)) !== null) {
      lines.push({
        speaker: match[2],
        content: match[1],
        position: match.index,
      });
    }

    // Pattern for Character said "dialogue"
    const pattern2 = /(\w+)\s+(?:said|asked|replied|exclaimed)[,:]?\s*[""]([^""]+)[""]*/gi;
    while ((match = pattern2.exec(content)) !== null) {
      lines.push({
        speaker: match[1],
        content: match[2],
        position: match.index,
      });
    }

    // Sort by position
    lines.sort((a, b) => a.position - b.position);

    return lines;
  }

  /**
   * Get quick character suggestions based on partial name
   */
  suggestCharacters(partial: string, characters: Character[]): Character[] {
    if (!partial || partial.length < 2) return [];

    const partialLower = partial.toLowerCase();
    return characters
      .filter(c => c.name.toLowerCase().includes(partialLower))
      .sort((a, b) => {
        // Prioritize matches at the start of the name
        const aStarts = a.name.toLowerCase().startsWith(partialLower);
        const bStarts = b.name.toLowerCase().startsWith(partialLower);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }
}

export const presenceDetector = PresenceDetectorClass.getInstance();
export default presenceDetector;
