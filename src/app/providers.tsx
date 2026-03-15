'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/app/components/UI/ToastContainer';
import { IntentProvider } from '@dzin/core';
import type { IntentBus, StateEngine, WorkspaceState, LLMTransport, LLMTransportStatus } from '@dzin/core';
import { useIntentDispatch } from '@/workspace/hooks/useIntentDispatch';
import { useSuggestionState } from '@/workspace/hooks/useSuggestionState';
import type { ActiveSuggestion } from '@/agents/ambient-observer';

// ---------------------------------------------------------------------------
// SuggestionContext
// ---------------------------------------------------------------------------

interface SuggestionContextValue {
  suggestions: ActiveSuggestion[];
  addSuggestion: (s: ActiveSuggestion) => void;
  dismissSuggestion: (id: string) => void;
  llmStatus: LLMTransportStatus;
  bus: IntentBus;
  stateEngine: StateEngine<WorkspaceState>;
  getTransport: () => LLMTransport | null;
}

const SuggestionContext = createContext<SuggestionContextValue | null>(null);

/**
 * Access suggestion state and intent system references from any descendant.
 * Must be rendered inside IntentSetup.
 */
export function useSuggestionContext(): SuggestionContextValue {
  const ctx = useContext(SuggestionContext);
  if (!ctx) throw new Error('useSuggestionContext must be used inside <Providers>');
  return ctx;
}

// ---------------------------------------------------------------------------
// IntentSetup (inner component)
// ---------------------------------------------------------------------------

/**
 * Inner component that initializes the intent system and wires suggestion state.
 * Creates the SuggestionContext that V2Layout and other descendants consume.
 */
function IntentSetup({ children }: { children: React.ReactNode }) {
  const { bus, stateEngine, getTransport, setAddSuggestion } = useIntentDispatch();
  const { suggestions, addSuggestion, dismissSuggestion, llmStatus } = useSuggestionState();

  // Wire late-binding addSuggestion callback so useIntentDispatch can surface LLM results
  useEffect(() => {
    setAddSuggestion(addSuggestion);
  }, [setAddSuggestion, addSuggestion]);

  const contextValue: SuggestionContextValue = {
    suggestions,
    addSuggestion,
    dismissSuggestion,
    llmStatus,
    bus,
    stateEngine,
    getTransport,
  };

  return (
    <IntentProvider bus={bus}>
      <SuggestionContext.Provider value={contextValue}>
        {children}
      </SuggestionContext.Provider>
    </IntentProvider>
  );
}

// ---------------------------------------------------------------------------
// Root Providers
// ---------------------------------------------------------------------------

/**
 * Root providers for studio-story.
 * Wraps the app with QueryClientProvider, IntentProvider, SuggestionContext, and ToastProvider.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <IntentSetup>
        <ToastProvider>
          {children}
        </ToastProvider>
      </IntentSetup>
    </QueryClientProvider>
  );
}
