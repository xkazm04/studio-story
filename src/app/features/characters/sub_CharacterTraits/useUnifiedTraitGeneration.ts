/**
 * Unified Trait Generation Hook
 *
 * Generates comprehensive character traits via CLI skill execution.
 * Parses the response into structured trait sections.
 */

import { useState } from 'react';
import { traitApi } from '@/app/api/traits';
import { Character } from '@/app/types/Character';
import { useCLIFeature } from '@/app/hooks/useCLIFeature';
import { logger } from '@/app/utils/logger';

interface ParsedTraits {
  background: string;
  personality: string;
  motivations: string;
  strengths: string;
  weaknesses: string;
  relationships: string;
}

interface UseUnifiedTraitGenerationReturn {
  generateAllTraits: () => void;
  isGenerating: boolean;
  error: string | null;
  saveTraits: (characterId: string, traits: ParsedTraits) => Promise<void>;
  /** Pass to InlineTerminal onInsert to capture CLI result */
  handleInsertResult: (text: string) => ParsedTraits | null;
  /** CLI terminal props for rendering InlineTerminal */
  terminalProps: ReturnType<typeof useCLIFeature>['terminalProps'];
}

// Section patterns for parsing AI responses
const SECTION_PATTERNS = {
  background: /\*\*BACKGROUND\*\*\s*\n([\s\S]*?)(?=\*\*[A-Z]+\*\*|$)/i,
  personality: /\*\*PERSONALITY\*\*\s*\n([\s\S]*?)(?=\*\*[A-Z]+\*\*|$)/i,
  motivations: /\*\*MOTIVATIONS?\*\*\s*\n([\s\S]*?)(?=\*\*[A-Z]+\*\*|$)/i,
  strengths: /\*\*STRENGTHS?\*\*\s*\n([\s\S]*?)(?=\*\*[A-Z]+\*\*|$)/i,
  weaknesses: /\*\*WEAKNESSES?\*\*\s*\n([\s\S]*?)(?=\*\*[A-Z]+\*\*|$)/i,
  relationships: /\*\*RELATIONSHIPS?\*\*\s*\n([\s\S]*?)(?=\*\*[A-Z]+\*\*|$)/i,
};

// Keywords for fallback section detection
const SECTION_KEYWORDS: Record<string, keyof ParsedTraits> = {
  background: 'background',
  history: 'background',
  origin: 'background',
  personality: 'personality',
  trait: 'personality',
  behavior: 'personality',
  motivation: 'motivations',
  goal: 'motivations',
  desire: 'motivations',
  strength: 'strengths',
  ability: 'strengths',
  skill: 'strengths',
  weakness: 'weaknesses',
  flaw: 'weaknesses',
  limitation: 'weaknesses',
  relationship: 'relationships',
  connection: 'relationships',
  social: 'relationships',
};

function createEmptyTraits(): ParsedTraits {
  return {
    background: '',
    personality: '',
    motivations: '',
    strengths: '',
    weaknesses: '',
    relationships: '',
  };
}

function cleanSectionText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/^#+\s/gm, '')
    .replace(/^[-*]\s/gm, '')
    .replace(/^\d+\.\s/gm, '')
    .trim();
}

function parseWithPatterns(content: string): ParsedTraits | null {
  const sections = createEmptyTraits();
  let hasAnySection = false;

  for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
    const match = content.match(pattern);
    if (match && match[1]) {
      sections[key as keyof ParsedTraits] = cleanSectionText(match[1]);
      hasAnySection = true;
    }
  }

  return hasAnySection ? sections : null;
}

function parseFallback(content: string): ParsedTraits | null {
  const lines = content.split('\n');
  const sections = createEmptyTraits();

  let currentSection: keyof ParsedTraits | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    let foundSection: keyof ParsedTraits | null = null;
    for (const [keyword, section] of Object.entries(SECTION_KEYWORDS)) {
      if (lowerLine.includes(keyword)) {
        foundSection = section;
        break;
      }
    }

    if (foundSection) {
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = cleanSectionText(currentContent.join('\n'));
      }
      currentSection = foundSection;
      currentContent = [];
    } else if (currentSection && line.trim()) {
      currentContent.push(line);
    }
  }

  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = cleanSectionText(currentContent.join('\n'));
  }

  const hasContent = Object.values(sections).some((v) => v.trim() !== '');
  return hasContent ? sections : null;
}

function parseTraitsFromResponse(content: string): ParsedTraits | null {
  const patternResult = parseWithPatterns(content);
  if (patternResult) return patternResult;
  return parseFallback(content);
}

export function useUnifiedTraitGeneration(
  characterId: string,
  projectId: string,
  allCharacters: Character[]
): UseUnifiedTraitGenerationReturn {
  const [error, setError] = useState<string | null>(null);

  const cli = useCLIFeature({
    featureId: 'char-unified-traits',
    projectId,
    projectPath: typeof window !== 'undefined' ? window.location.origin : '',
    defaultSkills: ['character-traits', 'character-backstory'],
  });

  const generateAllTraits = () => {
    const currentCharacter = allCharacters.find((c) => c.id === characterId);
    if (!currentCharacter) {
      setError('Character not found');
      return;
    }

    setError(null);
    cli.executePrompt(
      `Generate a complete, detailed character profile for ${currentCharacter.name} (${currentCharacter.type || 'character'}).

Use the available MCP tools to read the character's existing data, project context, and other characters.

Return the profile in this EXACT format with clear section markers:

**BACKGROUND**
[Detailed background: history, origins, upbringing, formative experiences, key life events]

**PERSONALITY**
[Detailed personality: core traits, behaviors, mannerisms, speech patterns, how they interact with others, quirks]

**MOTIVATIONS**
[Detailed motivations: goals, desires, ambitions, fears, what drives them, internal conflicts]

**STRENGTHS**
[Detailed strengths: abilities, skills, talents, positive attributes, what they excel at]

**WEAKNESSES**
[Detailed weaknesses: flaws, limitations, vulnerabilities, struggles, what holds them back]

**RELATIONSHIPS**
[Detailed relationships: important connections, how they relate to others, social dynamics]

Each section should be 2-3 paragraphs of narrative prose. Be specific and detailed.`,
      'Generate All Traits'
    );
  };

  const handleInsertResult = (text: string): ParsedTraits | null => {
    try {
      const parsed = parseTraitsFromResponse(text);
      if (!parsed) {
        setError('Failed to parse response into sections');
        return null;
      }
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse traits';
      setError(message);
      logger.error('Error parsing traits', err);
      return null;
    }
  };

  const saveTraits = async (charId: string, traits: ParsedTraits): Promise<void> => {
    const traitPromises = Object.entries(traits).map(([type, description]) => {
      if (!description || description.trim() === '') return Promise.resolve();

      return traitApi.createTrait({
        character_id: charId,
        type,
        description,
      });
    });

    await Promise.all(traitPromises);
  };

  return {
    generateAllTraits,
    isGenerating: cli.isRunning,
    error,
    saveTraits,
    handleInsertResult,
    terminalProps: cli.terminalProps,
  };
}
