/**
 * WorkspaceObserver — Serializes workspace state and feeds it to Gemini Live.
 *
 * Subscribes to workspace and project stores, debounces changes,
 * and sends compact state snapshots to the Gemini Live client.
 */

import type { GeminiLiveClient } from './GeminiLiveClient';
import type { WorkspaceStateSnapshot } from './types';

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
  }>;
  projectStore: StoreGetter<{
    selectedProject: { id: string; title?: string; name?: string } | null;
    selectedScene: { id: string; name?: string } | null;
    selectedAct: { id: string; name?: string } | null;
  }>;
}

const DEBOUNCE_MS = 800;
const MIN_CHANGE_INTERVAL_MS = 3000;
const TOOL_EVENT_DEBOUNCE_MS = 500;

export interface CLIToolEvent {
  toolName: string;
  toolInput: Record<string, unknown>;
  timestamp: number;
}

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
      toolInput,
      timestamp: Date.now(),
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
      const inputSummary = this.summarizeToolInput(event.toolName, event.toolInput);
      lines.push(`- ${event.toolName}: ${inputSummary}`);
    }

    lines.push('');
    lines.push('Based on this CLI activity, consider if the workspace panels should be updated to show relevant content (e.g., show image gallery after image generation, show character detail after character update).');

    this.deps.client.send(lines.join('\n'));
  }

  private summarizeToolInput(toolName: string, input: Record<string, unknown>): string {
    // Extract key info without sending full payloads
    const parts: string[] = [];
    if (input.characterId) parts.push(`character=${input.characterId}`);
    if (input.sceneId) parts.push(`scene=${input.sceneId}`);
    if (input.actId) parts.push(`act=${input.actId}`);
    if (input.name) parts.push(`name="${input.name}"`);
    if (input.type) parts.push(`type=${input.type}`);
    if (input.prompt && typeof input.prompt === 'string') {
      parts.push(`prompt="${(input.prompt as string).slice(0, 80)}..."`);
    }
    if (input.sourceImageUrl) parts.push('has_source_image');
    if (input.imageUrl) parts.push('has_image');
    if (input.updates) parts.push(`updates=${typeof input.updates === 'string' ? input.updates.slice(0, 100) : 'object'}`);
    return parts.length > 0 ? parts.join(', ') : 'no params';
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

    if (snapshot.selectedProject) parts.push(`Project: ${snapshot.selectedProject}`);
    if (snapshot.selectedScene) parts.push(`Scene: ${snapshot.selectedScene}`);
    if (snapshot.selectedAct) parts.push(`Act: ${snapshot.selectedAct}`);
    parts.push(`Terminal tabs: ${snapshot.terminalTabCount}`);

    return parts.join('\n');
  }
}
