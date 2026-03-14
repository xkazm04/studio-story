'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@/app/components/UI/ToastContainer';
import { IntentProvider } from '@dzin/core';
import { useIntentDispatch } from '@/workspace/hooks/useIntentDispatch';

/**
 * Inner component that initializes the intent system and wraps children
 * with IntentProvider. Must be rendered inside a React tree (needs hooks).
 */
function IntentSetup({ children }: { children: React.ReactNode }) {
  const { bus } = useIntentDispatch();
  return <IntentProvider bus={bus}>{children}</IntentProvider>;
}

/**
 * Root providers for studio-story.
 * Wraps the app with QueryClientProvider, IntentProvider, and ToastProvider.
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
