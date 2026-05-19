'use client';

import React from 'react';
import { Bot, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { useAdvisor } from '@/agents/useAdvisor';
import { AdvisorConversation } from '@/agents/components';
import type { PanelDensity } from '@/workspace/types';

// ─── Connection Dot ──────────────────────────────

function ConnectionDot({ state }: { state: string }) {
  const colors: Record<string, string> = {
    connected: 'bg-emerald-500',
    connecting: 'bg-amber-500 animate-pulse',
    reconnecting: 'bg-amber-500 animate-pulse',
    disconnected: 'bg-slate-600',
  };
  return <div className={cn('w-1.5 h-1.5 rounded-full', colors[state] ?? 'bg-slate-600')} />;
}

// ─── Main Panel ──────────────────────────────────

export default function AdvisorPanel({ density }: { density?: PanelDensity }) {
  const {
    connectionState,
    messages,
    suggestions,
    isProcessing,
    processingStatus,
    rateLimitedUntil,
    isThrottled,
    lastError,
    connect,
    disconnect,
    sendMessage,
    retryLastMessage,
    clearError,
    acceptSuggestion,
    dismissSuggestion,
    rateMessage,
    regenerateResponse,
  } = useAdvisor();

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting' || connectionState === 'reconnecting';

  return (
    <PanelFrame
      title="Advisor"
      icon={Bot}
      headerAccent="emerald"
      density={density}
      actions={
        <div className="flex items-center gap-1.5">
          <ConnectionDot state={connectionState} />

          {/* Connect / Disconnect */}
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className={cn(
              'p-0.5 rounded transition-colors',
              isConnected ? 'text-slate-400 hover:text-red-400' : 'text-slate-400 hover:text-emerald-400',
              isConnecting && 'opacity-50 cursor-not-allowed',
            )}
            title={isConnected ? 'Disconnect' : 'Connect to advisor'}
            aria-label={isConnecting ? 'Connecting to advisor' : isConnected ? 'Disconnect from advisor' : 'Connect to advisor'}
          >
            {isConnecting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isConnected ? (
              <WifiOff className="w-3 h-3" />
            ) : (
              <Wifi className="w-3 h-3" />
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        <AdvisorConversation
          variant="panel"
          messages={messages}
          suggestions={suggestions}
          isProcessing={isProcessing}
          processingStatus={processingStatus}
          rateLimitedUntil={rateLimitedUntil}
          isThrottled={isThrottled}
          lastError={lastError}
          isConnected={isConnected}
          onSendMessage={sendMessage}
          onRetryLastMessage={retryLastMessage}
          onClearError={clearError}
          onAcceptSuggestion={acceptSuggestion}
          onDismissSuggestion={dismissSuggestion}
          onRateMessage={rateMessage}
          onRegenerateMessage={regenerateResponse}
          inputDisabled={!isConnected}
          emptyState={
            !isConnected ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <Bot className="w-8 h-8 text-slate-400" />
                <p className="text-sm text-slate-400">
                  Connect to the AI advisor for workspace suggestions and creative guidance.
                </p>
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded px-3 py-1 transition-colors"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              </div>
            ) : undefined
          }
        />
      </div>
    </PanelFrame>
  );
}
