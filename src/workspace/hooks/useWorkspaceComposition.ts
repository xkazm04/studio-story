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

import { useCallback, useRef } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { WorkspacePanelType, PanelRole, WorkspaceLayout } from '../types';
import { PANEL_REGISTRY } from '../engine/panelRegistry';
import { LAYOUT_ORDER, resolvePreferredLayout } from '../engine/layoutEngine';

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

const VALID_ROLES: PanelRole[] = ['primary', 'secondary', 'tertiary', 'sidebar'];
const VALID_LAYOUTS = new Set<WorkspaceLayout>(LAYOUT_ORDER);

function isWorkspacePanelType(type: string): type is WorkspacePanelType {
  return type in PANEL_REGISTRY;
}

function toLayout(layout?: string): WorkspaceLayout | undefined {
  if (!layout) return undefined;
  return VALID_LAYOUTS.has(layout as WorkspaceLayout) ? (layout as WorkspaceLayout) : undefined;
}

function toRole(role?: string): PanelRole | undefined {
  if (!role) return undefined;
  return VALID_ROLES.includes(role as PanelRole) ? (role as PanelRole) : undefined;
}

function buildFingerprint(
  action: CompositionDirective['action'],
  layout: WorkspaceLayout | undefined,
  directives: Array<{ type: WorkspacePanelType; role?: PanelRole; props?: Record<string, unknown> }>,
): string {
  return JSON.stringify({
    action,
    layout: layout ?? null,
    directives: directives.map((d) => ({
      type: d.type,
      role: d.role ?? null,
      props: d.props ?? null,
    })),
  });
}

export function useWorkspaceComposition() {
  const showPanels = useWorkspaceStore((s) => s.showPanels);
  const hidePanels = useWorkspaceStore((s) => s.hidePanels);
  const replaceAllPanels = useWorkspaceStore((s) => s.replaceAllPanels);
  const clearPanels = useWorkspaceStore((s) => s.clearPanels);
  const getVisiblePanels = useWorkspaceStore((s) => s.getVisiblePanels);
  const lastFingerprintRef = useRef<string | null>(null);
  const lastAppliedAtRef = useRef(0);

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
      const normalizedLayout = toLayout(layout);

      const deduped = new Map<WorkspacePanelType, { role?: PanelRole; props?: Record<string, unknown> }>();
      for (const panel of panels ?? []) {
        if (!isWorkspacePanelType(panel.type)) continue;
        deduped.set(panel.type, {
          role: toRole(panel.role),
          props: panel.props,
        });
      }

      const directives = Array.from(deduped.entries()).map(([type, value]) => ({
        type,
        role: value.role,
        props: value.props,
      }));

      const fingerprint = buildFingerprint(action, normalizedLayout, directives);
      const now = Date.now();
      if (
        lastFingerprintRef.current === fingerprint &&
        now - lastAppliedAtRef.current < 1400
      ) {
        return true;
      }

      const visibleTypes = new Set(getVisiblePanels().map((panel) => panel.type));

      switch (action) {
        case 'replace':
          if (directives.length === 0) {
            clearPanels();
            break;
          }
          replaceAllPanels(
            directives,
            resolvePreferredLayout(
              directives.map((d, i) => ({
                id: `preview-${d.type}-${i}`,
                type: d.type,
                role: d.role ?? PANEL_REGISTRY[d.type].defaultRole,
                props: d.props ?? {},
                slotIndex: i,
              })),
              normalizedLayout,
              20,
            )
          );
          break;
        case 'show':
          if (directives.length === 0) return false;
          if (directives.every((d) => visibleTypes.has(d.type) && !d.props)) return true;
          showPanels(directives);
          break;
        case 'hide':
          if (directives.length === 0) return false;
          if (directives.every((d) => !visibleTypes.has(d.type))) return true;
          hidePanels(directives.map((d) => d.type));
          break;
        case 'clear':
          if (visibleTypes.size === 0) return true;
          clearPanels();
          break;
        default:
          // Unknown action — don't handle
          return false;
      }

      lastFingerprintRef.current = fingerprint;
      lastAppliedAtRef.current = now;

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
