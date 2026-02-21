/**
 * Collapsed Nodes State Hook
 * Manages collapsed state for graph visualization with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react';

const getStorageKey = (projectId: string) => `story_collapsed_nodes_${projectId}`;

export function useCollapsedNodesState(projectId: string | null) {
  const [collapsedNodes, setCollapsedNodesInternal] = useState<Set<string>>(new Set());

  // Load from localStorage when projectId changes
  useEffect(() => {
    if (typeof window !== 'undefined' && projectId) {
      try {
        const stored = localStorage.getItem(getStorageKey(projectId));
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCollapsedNodesInternal(new Set(parsed));
          }
        } else {
          setCollapsedNodesInternal(new Set());
        }
      } catch {
        setCollapsedNodesInternal(new Set());
      }
    }
  }, [projectId]);

  // Persist to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && projectId && collapsedNodes.size > 0) {
      try {
        localStorage.setItem(
          getStorageKey(projectId),
          JSON.stringify(Array.from(collapsedNodes))
        );
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [collapsedNodes, projectId]);

  const toggleNodeCollapsed = useCallback((nodeId: string) => {
    setCollapsedNodesInternal(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const isNodeCollapsed = useCallback((nodeId: string) => {
    return collapsedNodes.has(nodeId);
  }, [collapsedNodes]);

  const setCollapsedNodes = useCallback((nodes: Set<string>) => {
    setCollapsedNodesInternal(nodes);
  }, []);

  return {
    collapsedNodes,
    toggleNodeCollapsed,
    isNodeCollapsed,
    setCollapsedNodes,
    setCollapsedNodesInternal,
  };
}
