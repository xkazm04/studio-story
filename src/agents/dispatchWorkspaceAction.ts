/**
 * Shared workspace dispatch helper.
 *
 * Centralizes the "parse panels → build directives → switch on action" logic
 * that was previously duplicated in useAdvisor, useAdvisorVoice, and AdvisorOverlay.
 */

import { useWorkspaceStore } from '@/workspace/store/workspaceStore';
import type {
  PanelDirective,
  WorkspacePanelType,
  WorkspaceLayout,
} from '@/workspace/types';
import type { EffectWorkspaceSnapshot, EffectAction } from './types';

export interface WorkspaceActionPayload {
  action?: string;
  layout?: string;
  panels?: string | Array<{
    type: string;
    role?: string;
    props?: Record<string, unknown>;
    density?: string;
    dataSlice?: { entityId?: string; filter?: string; view?: string; highlight?: string[]; sort?: string };
  }>;
}

/** Capture current workspace state as a lightweight snapshot for effect attribution. */
export function captureWorkspaceSnapshot(): EffectWorkspaceSnapshot {
  const store = useWorkspaceStore.getState();
  return {
    panels: store.panels.map((p) => ({
      type: p.type,
      role: p.role,
      density: p.density,
      dataSlice: p.dataSlice as Record<string, unknown> | undefined,
    })),
    layout: store.layout,
  };
}

/**
 * Parse a panels value (JSON string or array) into a typed array.
 */
function parsePanels(
  panelsJson: WorkspaceActionPayload['panels'],
): Array<{
  type: string;
  role?: string;
  props?: Record<string, unknown>;
  density?: string;
  dataSlice?: { entityId?: string; filter?: string; view?: string; highlight?: string[]; sort?: string };
}> {
  if (!panelsJson) return [];
  try {
    return typeof panelsJson === 'string' ? JSON.parse(panelsJson) : panelsJson;
  } catch {
    return [];
  }
}

export interface DispatchResult {
  panels: ReturnType<typeof parsePanels>;
  layout: string | undefined;
  action: EffectAction;
  before: EffectWorkspaceSnapshot;
  after: EffectWorkspaceSnapshot;
}

/**
 * Dispatch a workspace action (replace / show / hide / clear) against the workspace store.
 *
 * @returns The parsed panels, layout, action type, and before/after workspace snapshots.
 */
export function dispatchWorkspaceAction(payload: WorkspaceActionPayload): DispatchResult {
  const before = captureWorkspaceSnapshot();

  const store = useWorkspaceStore.getState();
  const action = (payload.action ?? 'replace') as EffectAction;
  const panels = parsePanels(payload.panels);
  const layout = payload.layout;

  const directives: PanelDirective[] = panels.map((p) => ({
    type: p.type as WorkspacePanelType,
    role: p.role as PanelDirective['role'],
    props: p.props,
    density: p.density as PanelDirective['density'],
    dataSlice: p.dataSlice,
  }));

  switch (action) {
    case 'replace':
      store.replaceAllPanels(directives, layout as WorkspaceLayout | undefined);
      break;
    case 'show':
      store.showPanels(directives);
      break;
    case 'hide':
      store.hidePanels(panels.map((p) => p.type) as WorkspacePanelType[]);
      break;
    case 'clear':
      store.clearPanels();
      break;
  }

  const after = captureWorkspaceSnapshot();

  return { panels, layout, action, before, after };
}
