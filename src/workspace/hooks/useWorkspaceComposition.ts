/**
 * Workspace Composition Hook — LLM-driven dynamic panel composition.
 *
 * Replaces the old hardcoded useIntentDetection (75 regex patterns) and
 * usePanelConfig (32 static skill-panel mappings) with a dynamic system
 * where the LLM reads panel manifests and calls compose_workspace to
 * arrange panels.
 *
 * This hook intercepts compose_workspace and update_workspace tool_use
 * events from the CLI SSE stream and applies them to the workspace store.
 */

import { useCallback } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { WorkspacePanelType, PanelRole, WorkspaceLayout } from '../types';

interface CompositionPanel {
  type: string;
  role?: string;
  props?: Record<string, unknown>;
}

interface CompositionDirective {
  action: 'show' | 'hide' | 'replace' | 'clear';
  layout?: string;
  panels?: CompositionPanel[];
  reasoning?: string;
}

export function useWorkspaceComposition() {
  const showPanels = useWorkspaceStore((s) => s.showPanels);
  const hidePanels = useWorkspaceStore((s) => s.hidePanels);
  const replaceAllPanels = useWorkspaceStore((s) => s.replaceAllPanels);
  const clearPanels = useWorkspaceStore((s) => s.clearPanels);

  /**
   * Handle a tool_use event from the CLI SSE stream.
   * Returns true if the tool was handled (workspace composition tool).
   */
  const handleToolUse = useCallback(
    (toolName: string, toolInput: Record<string, unknown>): boolean => {
      if (toolName !== 'compose_workspace' && toolName !== 'update_workspace') {
        return false;
      }

      const directive = toolInput as unknown as CompositionDirective;
      const { action, panels, layout } = directive;

      const directives = (panels ?? []).map((p) => ({
        type: p.type as WorkspacePanelType,
        role: (p.role as PanelRole) ?? undefined,
        props: p.props,
      }));

      switch (action) {
        case 'replace':
          replaceAllPanels(directives, layout as WorkspaceLayout | undefined);
          break;
        case 'show':
          showPanels(directives);
          break;
        case 'hide':
          hidePanels(directives.map((d) => d.type));
          break;
        case 'clear':
          clearPanels();
          break;
        default:
          // Unknown action — don't handle
          return false;
      }

      // Log reasoning for debugging
      if (directive.reasoning) {
        console.log('[workspace-composition]', directive.reasoning);
      }

      return true;
    },
    [showPanels, hidePanels, replaceAllPanels, clearPanels]
  );

  return { handleToolUse };
}
