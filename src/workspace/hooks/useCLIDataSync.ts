'use client';

/**
 * useCLIDataSync — Bridges CLI MCP tool calls to TanStack Query cache invalidation.
 *
 * Tracks which MCP tools the CLI calls during an execution, maps them to
 * TanStack Query key prefixes, and invalidates matching caches on completion
 * so workspace panels refresh immediately.
 */

import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// MCP tool name → TanStack Query key prefixes to invalidate
// Only write/mutate operations — reads don't dirty the cache.
const TOOL_INVALIDATION_MAP: Record<string, string[]> = {
  create_character: ['characters'],
  update_character: ['characters'],
  create_act: ['acts'],
  create_scene: ['scenes'],
  update_scene: ['scenes'],
  create_beat: ['mock-beats', 'beats'],
  update_beat: ['mock-beats', 'beats'],
  update_faction: ['factions'],
  create_faction: ['factions'],
  create_trait: ['traits', 'characters'],
  update_trait: ['traits', 'characters'],
};

/**
 * Extract the base MCP tool name from Claude Code's prefixed format.
 * Claude Code names MCP tools as `mcp__<server>__<tool>` (e.g. `mcp__story__create_character`).
 * If no prefix, returns the name as-is.
 */
function extractBaseName(toolName: string): string {
  // Handle mcp__server__tool pattern
  const mcpMatch = toolName.match(/^mcp__[^_]+__(.+)$/);
  if (mcpMatch) return mcpMatch[1];

  // Handle mcp_server_tool single-underscore variant
  const mcpSingleMatch = toolName.match(/^mcp_[^_]+_(.+)$/);
  if (mcpSingleMatch) return mcpSingleMatch[1];

  return toolName;
}

export function useCLIDataSync() {
  const queryClient = useQueryClient();
  const pendingKeysRef = useRef<Set<string>>(new Set());
  const [changedResources, setChangedResources] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Track an MCP tool call. Call this from onToolUse for every tool event.
   * Only write operations accumulate invalidation keys.
   */
  const trackToolUse = useCallback((toolName: string) => {
    const baseName = extractBaseName(toolName);
    const keys = TOOL_INVALIDATION_MAP[baseName];
    if (keys) {
      for (const key of keys) {
        pendingKeysRef.current.add(key);
      }
    }
  }, []);

  /**
   * Flush accumulated invalidations. Call this when CLI execution completes.
   * Invalidates all dirty query key prefixes and sets changedResources for animation hints.
   */
  const flush = useCallback(() => {
    const pending = pendingKeysRef.current;
    if (pending.size === 0) return;

    // Invalidate each accumulated query key prefix
    const changed = new Set<string>();
    for (const prefix of pending) {
      // Standard prefix invalidation (works for createMockableQuery keys like ['characters', 'project', id])
      queryClient.invalidateQueries({ queryKey: [prefix] });
      // Also invalidate URL-based keys from useApiGet (beats/acts use URL-as-key pattern)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.includes(`/api/${prefix}`);
        },
      });
      changed.add(prefix);
    }

    // Reset pending
    pendingKeysRef.current = new Set();

    // Set changed resources (panels can use this for animation hints)
    setChangedResources(changed);

    // Clear after 3 seconds
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setChangedResources(new Set());
    }, 3000);
  }, [queryClient]);

  return { trackToolUse, flush, changedResources };
}
