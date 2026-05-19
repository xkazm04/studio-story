/**
 * useScreenplayParser — React hook wrapping screenplay parser for UI
 *
 * Fetches scene content (TipTap JSON), character voice assignments, and
 * narrator voice ID. Parses screenplay into ScriptLines with correct
 * character-to-voice mapping. Detects unassigned voices.
 */

import { useState, useEffect, useCallback } from 'react';
import { parseScreenplayToScriptLines, detectUnassignedVoices } from '../lib/screenplayParser';
import { extractData } from '@/app/utils/api';
import type { ScriptLine } from '../types';
import type { JSONContent } from '../lib/screenplayParser';

interface UseScreenplayParserOptions {
  /** Characters with voice assignments */
  characters?: Array<{ id: string; name: string; voice_id?: string | null }>;
  /** Scene content as TipTap JSON (if already available) */
  sceneContent?: JSONContent | null;
  /** Narrator voice ID (fallback for action/unassigned characters) */
  narratorVoiceId?: string;
}

interface UseScreenplayParserReturn {
  scriptLines: ScriptLine[];
  unassignedCharacters: string[];
  isLoading: boolean;
  refetch: () => void;
}

/** Default narrator voice ID (ElevenLabs "Rachel" premade voice) */
const DEFAULT_NARRATOR_VOICE = '21m00Tcm4TlvDq8ikWAM';

export function useScreenplayParser(
  sceneId: string,
  options: UseScreenplayParserOptions = {},
): UseScreenplayParserReturn {
  const {
    characters = [],
    sceneContent = null,
    narratorVoiceId = DEFAULT_NARRATOR_VOICE,
  } = options;

  const [scriptLines, setScriptLines] = useState<ScriptLine[]>([]);
  const [unassignedCharacters, setUnassignedCharacters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<JSONContent | null>(sceneContent);
  const [refreshKey, setRefreshKey] = useState(0);

  // Build character -> voice_id map
  const characterVoiceMap: Record<string, string> = {};
  for (const char of characters) {
    if (char.voice_id) {
      characterVoiceMap[char.name.toUpperCase()] = char.voice_id;
    }
  }

  // Fetch scene content if not provided
  useEffect(() => {
    if (sceneContent) {
      setContent(sceneContent);
      return;
    }

    if (!sceneId) return;

    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/scenes/${sceneId}`)
      .then((res) => res.json())
      .then((raw) => extractData<Record<string, unknown>>(raw))
      .then((data) => {
        if (cancelled) return;
        // Scene content is stored as TipTap JSON in the script field
        const json = data.script
          ? (typeof data.script === 'string' ? JSON.parse(data.script) : data.script)
          : null;
        setContent(json);
      })
      .catch(() => {
        if (!cancelled) setContent(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [sceneId, sceneContent, refreshKey]);

  // Parse content when available
  useEffect(() => {
    if (!content) {
      setScriptLines([]);
      setUnassignedCharacters([]);
      return;
    }

    const lines = parseScreenplayToScriptLines(content, characterVoiceMap, narratorVoiceId);
    const unassigned = detectUnassignedVoices(content, characterVoiceMap);

    setScriptLines(lines);
    setUnassignedCharacters(unassigned);
  }, [content, narratorVoiceId, JSON.stringify(characterVoiceMap)]);

  const refetch = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    scriptLines,
    unassignedCharacters,
    isLoading,
    refetch,
  };
}
