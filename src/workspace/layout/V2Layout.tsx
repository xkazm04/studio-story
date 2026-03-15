'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import V2Provider from '../V2Provider';
import WorkspaceHeader from './header/WorkspaceHeader';
import WorkspaceArea from './WorkspaceArea';
import CommandBar from './CommandBar/CommandBar';
import { ConversationShell } from '../chat/ConversationShell';
import { SuggestionStack } from '../panels/shared/SuggestionCard';
import { useSuggestionContext } from '@/app/providers';
import { createAmbientObserver, type AmbientObserver, type ActiveSuggestion } from '@/agents/ambient-observer';
import { DEFAULT_PATTERNS } from '@/agents/workflow-patterns';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { Intent, LLMTransportStatus } from '@dzin/core';

/**
 * V2Layout — Main container for the dynamic workspace.
 *
 * Simple flex column: header (shrink) + workspace (grow) + command bar (shrink).
 * Command bar is 36px collapsed, expands to ~40vh on demand.
 * Panels get ~93% of viewport height when command bar is collapsed.
 *
 * Instantiates the ambient observer on mount, wires SuggestionStack,
 * and pipes real LLM transport status to WorkspaceHeader.
 */
export default function V2Layout() {
  const { suggestions, addSuggestion, dismissSuggestion, llmStatus, bus, getTransport } =
    useSuggestionContext();

  const observerRef = useRef<AmbientObserver | null>(null);

  // -------------------------------------------------------------------------
  // Ambient observer lifecycle + transport status subscription
  // -------------------------------------------------------------------------

  useEffect(() => {
    const observer = createAmbientObserver(bus, DEFAULT_PATTERNS, addSuggestion, {
      getPanelCount: () => useWorkspaceStore.getState().panels.length,
    });
    observerRef.current = observer;

    // Subscribe to transport status changes for pause/resume
    const transport = getTransport();
    let unsubTransport: (() => void) | null = null;

    function syncPauseState(status: LLMTransportStatus) {
      if (status === 'error' || status === 'disconnected') {
        observer.pause();
      } else {
        observer.resume();
      }
    }

    if (transport) {
      // Check initial status
      syncPauseState(transport.getStatus());

      unsubTransport = transport.subscribe(() => {
        const snapshot = JSON.parse(transport.getSnapshot()) as { status: LLMTransportStatus };
        syncPauseState(snapshot.status);
      });
    }

    return () => {
      observer.destroy();
      observerRef.current = null;
      unsubTransport?.();
    };
  }, [bus, addSuggestion, getTransport]);

  // -------------------------------------------------------------------------
  // Handle apply on suggestion cards
  // -------------------------------------------------------------------------

  const handleApply = useCallback(
    (suggestion: ActiveSuggestion) => {
      const intent: Intent = {
        id: crypto.randomUUID(),
        type: suggestion.intentToDispatch.type,
        payload: suggestion.intentToDispatch.payload,
        source: 'click',
        timestamp: Date.now(),
      } as Intent;
      bus.dispatch(intent);
      dismissSuggestion(suggestion.id);
    },
    [bus, dismissSuggestion],
  );

  return (
    <V2Provider>
      <div className="flex h-full min-h-0 flex-col bg-slate-950">
        <WorkspaceHeader llmStatus={llmStatus} />
        <div className="flex-1 min-h-0">
          <WorkspaceArea />
        </div>
        <CommandBar />
        <SuggestionStack
          suggestions={suggestions}
          onApply={handleApply}
          onDismiss={dismissSuggestion}
        />
        <ConversationShell />
      </div>
    </V2Provider>
  );
}
