/**
 * WorkspaceObserver — Serializes workspace state and feeds it to Gemini Live.
 *
 * Subscribes to workspace and project stores, debounces changes,
 * and sends compact state snapshots to the Gemini Live client.
 */

import type { GeminiLiveClient } from '@dzin/voice';
import type { CLIToolEvent, WorkspaceStateSnapshot } from './types';
import type { SceneMetadata } from '@/app/types/Scene';
import { summarizeToolInput } from './types';

type StoreGetter<T> = {
  getState: () => T;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
};

interface ObserverDeps {
  client: GeminiLiveClient;
  workspaceStore: StoreGetter<{
    panels: Array<{ type: string; role: string; density?: string }>;
    layout: string;
    focusedPanelId: string | null;
    autoCompactedPanels: Set<string>;
  }>;
  projectStore: StoreGetter<{
    selectedProject: { id: string; title?: string; name?: string } | null;
    selectedScene: { id: string; name?: string; metadata?: SceneMetadata } | null;
    selectedAct: { id: string; name?: string } | null;
  }>;
}

const DEBOUNCE_MS = 800;
const MIN_CHANGE_INTERVAL_MS = 3000;
const TOOL_EVENT_DEBOUNCE_MS = 500;

export class WorkspaceObserver {
  private unsubscribers: Array<() => void> = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSnapshot: string = '';
  private lastSendTimestamp = 0;
  private isObserving = false;
  private recentToolEvents: CLIToolEvent[] = [];
  private toolEventTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private deps: ObserverDeps) {}

  start(): void {
    if (this.isObserving) return;
    this.isObserving = true;

    // Subscribe to workspace store
    this.unsubscribers.push(
      this.deps.workspaceStore.subscribe(() => {
        this.scheduleSnapshot();
      })
    );

    // Subscribe to project store
    this.unsubscribers.push(
      this.deps.projectStore.subscribe(() => {
        this.scheduleSnapshot();
      })
    );

    // Send initial snapshot
    this.sendSnapshot();
  }

  stop(): void {
    this.isObserving = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.toolEventTimer) {
      clearTimeout(this.toolEventTimer);
      this.toolEventTimer = null;
    }
    this.recentToolEvents = [];
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
  }

  /** Force send a snapshot now (e.g., on initial connect) */
  sendNow(): void {
    this.sendSnapshot();
  }

  /** Record a CLI tool event for forwarding to Gemini */
  recordToolEvent(toolName: string, toolInput: Record<string, unknown>): void {
    if (!this.isObserving || !this.deps.client.isConnected) return;

    this.recentToolEvents.push({
      toolName,
      summary: summarizeToolInput(toolName, toolInput),
    });

    // Debounce: batch rapid tool events into a single message
    if (this.toolEventTimer) clearTimeout(this.toolEventTimer);
    this.toolEventTimer = setTimeout(() => {
      this.sendToolEvents();
    }, TOOL_EVENT_DEBOUNCE_MS);
  }

  private sendToolEvents(): void {
    if (!this.deps.client.isConnected || this.recentToolEvents.length === 0) return;

    const events = this.recentToolEvents.splice(0);
    const lines = ['[CLI Tool Activity]'];

    for (const event of events) {
      lines.push(`- ${event.toolName}: ${event.summary}`);
    }

    lines.push('');
    lines.push('Based on this CLI activity, consider if the workspace panels should be updated to show relevant content (e.g., show image gallery after image generation, show character detail after character update).');

    this.deps.client.send(lines.join('\n'));
  }

  private scheduleSnapshot(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.sendSnapshot();
    }, DEBOUNCE_MS);
  }

  private sendSnapshot(): void {
    if (!this.deps.client.isConnected) return;

    // Rate limit
    const now = Date.now();
    if (now - this.lastSendTimestamp < MIN_CHANGE_INTERVAL_MS) return;

    const snapshot = this.buildSnapshot();
    const serialized = JSON.stringify(snapshot);

    // Skip if nothing changed
    if (serialized === this.lastSnapshot) return;

    this.lastSnapshot = serialized;
    this.lastSendTimestamp = now;

    const message = this.formatSnapshotMessage(snapshot);
    this.deps.client.send(message);
  }

  private buildSnapshot(): WorkspaceStateSnapshot {
    const ws = this.deps.workspaceStore.getState();
    const ps = this.deps.projectStore.getState();

    // Resolve focused panel type from ID
    const focusedId = ws.focusedPanelId;
    const focusedPanel = focusedId
      ? ws.panels.find(p => `panel-${p.type}` === focusedId || p.type === focusedId)
      : null;

    // Build scene atmosphere string from metadata
    const meta = ps.selectedScene?.metadata;
    let sceneAtmosphere: string | undefined;
    if (meta) {
      const parts: string[] = [];
      if (meta.timeOfDay) parts.push(meta.timeOfDay);
      if (meta.weather) parts.push(meta.weather);
      if (meta.season) parts.push(meta.season);
      if (meta.mood) parts.push(`mood: ${meta.mood}`);
      if (meta.lighting) parts.push(`lighting: ${meta.lighting}`);
      if (parts.length > 0) sceneAtmosphere = parts.join(', ');
    }

    const autoCompactedCount = ws.autoCompactedPanels.size;

    return {
      panels: ws.panels.map(p => ({ type: p.type, role: p.role, density: p.density })),
      layout: ws.layout,
      selectedProject: ps.selectedProject?.id ?? null,
      selectedScene: ps.selectedScene?.id ?? null,
      selectedAct: ps.selectedAct?.id ?? null,
      terminalTabCount: 1,
      timestamp: Date.now(),
      viewport: typeof window !== 'undefined'
        ? { width: window.innerWidth, height: window.innerHeight }
        : undefined,
      focusedPanelType: focusedPanel?.type ?? undefined,
      sceneAtmosphere,
      autoCompactedCount: autoCompactedCount > 0 ? autoCompactedCount : undefined,
    };
  }

  private formatSnapshotMessage(snapshot: WorkspaceStateSnapshot): string {
    const panels = snapshot.panels.map(p => {
      const density = p.density && p.density !== 'full' ? `:${p.density}` : '';
      return `${p.type}(${p.role}${density})`;
    }).join(', ');
    const parts: string[] = [
      `[Workspace Update]`,
      `Layout: ${snapshot.layout}`,
      `Panels: ${panels || 'empty'}`,
    ];

    if (snapshot.viewport) {
      parts.push(`Viewport: ${snapshot.viewport.width}x${snapshot.viewport.height}px`);
    }

    if (snapshot.focusedPanelType) {
      parts.push(`Focused: ${snapshot.focusedPanelType}`);
    }

    if (snapshot.autoCompactedCount) {
      parts.push(`Auto-compacted: ${snapshot.autoCompactedCount} panel(s)`);
    }

    if (snapshot.selectedProject) parts.push(`Project: ${snapshot.selectedProject}`);
    if (snapshot.selectedScene) parts.push(`Scene: ${snapshot.selectedScene}`);
    if (snapshot.sceneAtmosphere) parts.push(`Scene atmosphere: ${snapshot.sceneAtmosphere}`);
    if (snapshot.selectedAct) parts.push(`Act: ${snapshot.selectedAct}`);
    parts.push(`Terminal tabs: ${snapshot.terminalTabCount}`);

    return parts.join('\n');
  }
}
