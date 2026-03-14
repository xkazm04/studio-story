'use client';

import { useMemo } from 'react';
import {
  createDirector,
  createIntentBus,
  createComposeHandler,
  createManipulateHandler,
  createNavigateHandler,
  createSystemHandler,
  createStateEngine,
  createIntentQueue,
  type IntentBus,
  type IntentQueue,
  type StateEngine,
  type WorkspaceState,
} from '@dzin/core';
import { PANEL_REGISTRY } from '../engine/panelRegistry';
import { TOOL_PANEL_HINTS } from '../config/workflowHints';

// ---------------------------------------------------------------------------
// Default initial state for the workspace state engine
// ---------------------------------------------------------------------------

const INITIAL_STATE: WorkspaceState = {
  layout: {
    template: 'single',
    gridTemplateRows: '1fr',
    gridTemplateColumns: '1fr',
  },
  panels: [],
  streaming: null,
};

// ---------------------------------------------------------------------------
// useIntentDispatch
// ---------------------------------------------------------------------------

/**
 * Host-app hook that initializes the full @dzin/core intent system.
 *
 * Creates a Director with all 4 built-in handlers wired to the app's
 * panel registry and workflow hints, a StateEngine, an IntentBus, and
 * an IntentQueue for buffering LLM intents during user manipulation.
 *
 * Memoized so the intent system is created once per app lifetime.
 *
 * @returns bus (for IntentProvider), queue (for resize hooks), and stateEngine
 */
export function useIntentDispatch(): {
  bus: IntentBus;
  queue: IntentQueue;
  stateEngine: StateEngine<WorkspaceState>;
} {
  return useMemo(() => {
    const stateEngine = createStateEngine<WorkspaceState>(INITIAL_STATE);

    // Registry presence check -- matches app's panel registry
    const registryHas = (type: string): boolean => type in PANEL_REGISTRY;

    // State accessor
    const getState = () => stateEngine.getState();

    // Build Director with all 4 built-in handlers
    // Cast TOOL_PANEL_HINTS: app's PanelDirective uses string role, core expects PanelRole union
    const director = createDirector({
      compose: createComposeHandler(
        registryHas,
        TOOL_PANEL_HINTS as Parameters<typeof createComposeHandler>[1],
        getState,
      ),
      manipulate: createManipulateHandler(getState),
      navigate: createNavigateHandler(),
      system: createSystemHandler(),
    });

    // Create the bus that wires Director to StateEngine
    const bus = createIntentBus(director, stateEngine);

    // Create the queue for buffering LLM intents during user resize
    const queue = createIntentQueue();

    return { bus, queue, stateEngine };
  }, []);
}
