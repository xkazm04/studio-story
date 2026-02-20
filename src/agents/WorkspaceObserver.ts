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
    panels: Array<{ type: string; role: string }>;
    layout: string;
  }>;
  projectStore: StoreGetter<{
    selectedProject: { id: string; title?: string; name?: string } | null;
    selectedScene: { id: string; name?: string } | null;
    selectedAct: { id: string; name?: string } | null;
  }>;
  terminalDockStore: StoreGetter<{
    tabs: Array<unknown>;
  }>;
}

const DEBOUNCE_MS = 800;
const MIN_CHANGE_INTERVAL_MS = 3000;

export class WorkspaceObserver {
  private unsubscribers: Array<() => void> = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSnapshot: string = '';
  private lastSendTimestamp = 0;
  private isObserving = false;

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
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
  }

  /** Force send a snapshot now (e.g., on initial connect) */
  sendNow(): void {
    this.sendSnapshot();
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
    const ts = this.deps.terminalDockStore.getState();

    return {
      panels: ws.panels.map(p => ({ type: p.type, role: p.role })),
      layout: ws.layout,
      selectedProject: ps.selectedProject?.id ?? null,
      selectedScene: ps.selectedScene?.id ?? null,
      selectedAct: ps.selectedAct?.id ?? null,
      terminalTabCount: ts.tabs.length,
      timestamp: Date.now(),
    };
  }

  private formatSnapshotMessage(snapshot: WorkspaceStateSnapshot): string {
    const panels = snapshot.panels.map(p => `${p.type}(${p.role})`).join(', ');
    const parts: string[] = [
      `[Workspace Update]`,
      `Layout: ${snapshot.layout}`,
      `Panels: ${panels || 'empty'}`,
    ];

    if (snapshot.selectedProject) parts.push(`Project: ${snapshot.selectedProject}`);
    if (snapshot.selectedScene) parts.push(`Scene: ${snapshot.selectedScene}`);
    if (snapshot.selectedAct) parts.push(`Act: ${snapshot.selectedAct}`);
    parts.push(`Terminal tabs: ${snapshot.terminalTabCount}`);

    return parts.join('\n');
  }
}
