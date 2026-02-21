'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Wifi, WifiOff, Eye, EyeOff, Send, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { useAdvisor } from '@/agents/useAdvisor';
import type { AgentMessage, AgentSuggestion } from '@/agents/types';

// ─── Message Bubble ──────────────────────────────

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed',
          isUser && 'bg-blue-600/20 text-blue-200 border border-blue-500/20',
          !isUser && !isSystem && 'bg-slate-800/60 text-slate-300 border border-slate-700/40',
          isSystem && 'bg-slate-900/40 text-slate-500 italic text-[10px] border border-slate-800/30',
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

// ─── Suggestion Card ─────────────────────────────

function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
}: {
  suggestion: AgentSuggestion;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="bg-amber-500/6 border border-amber-500/20 rounded-lg p-2.5 space-y-2">
      <p className="text-xs text-amber-200/80 leading-relaxed">{suggestion.content}</p>
      <div className="flex items-center gap-1.5">
        {suggestion.action && (
          <button
            onClick={() => onAccept(suggestion.id)}
            className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded px-2 py-0.5 transition-colors"
          >
            <Check className="w-3 h-3" />
            Apply
          </button>
        )}
        <button
          onClick={() => onDismiss(suggestion.id)}
          className="flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-slate-400 bg-slate-800/40 hover:bg-slate-800/60 rounded px-2 py-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
          Dismiss
        </button>
      </div>
    </div>
  );
}

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

export default function AdvisorPanel() {
  const {
    connectionState,
    isObserving,
    messages,
    suggestions,
    connect,
    disconnect,
    sendMessage,
    toggleObservation,
    acceptSuggestion,
    dismissSuggestion,
  } = useAdvisor();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting' || connectionState === 'reconnecting';

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !isConnected) return;
    sendMessage(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PanelFrame
      title="Advisor"
      icon={Bot}
      headerAccent="emerald"
      actions={
        <div className="flex items-center gap-1.5">
          <ConnectionDot state={connectionState} />

          {/* Observation toggle */}
          {isConnected && (
            <button
              onClick={toggleObservation}
              className={cn(
                'p-0.5 rounded transition-colors',
                isObserving ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'
              )}
              title={isObserving ? 'Observing workspace' : 'Observation paused'}
            >
              {isObserving ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          )}

          {/* Connect / Disconnect */}
          <button
            onClick={isConnected ? disconnect : connect}
            disabled={isConnecting}
            className={cn(
              'p-0.5 rounded transition-colors',
              isConnected ? 'text-slate-500 hover:text-red-400' : 'text-slate-600 hover:text-emerald-400',
              isConnecting && 'opacity-50 cursor-not-allowed',
            )}
            title={isConnected ? 'Disconnect' : 'Connect to advisor'}
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
        {/* Message area + suggestions */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Suggestions at top */}
          {suggestions.length > 0 && (
            <div className="space-y-1.5 pb-2 border-b border-slate-800/40">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  onAccept={acceptSuggestion}
                  onDismiss={dismissSuggestion}
                />
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.length === 0 && !isConnected && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <Bot className="w-8 h-8 text-slate-700" />
              <p className="text-xs text-slate-600">
                Connect to the AI advisor for workspace suggestions and creative guidance.
              </p>
              <button
                onClick={connect}
                disabled={isConnecting}
                className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded px-3 py-1 transition-colors"
              >
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-slate-800/50 p-2">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Ask the advisor...' : 'Connect to chat'}
              disabled={!isConnected}
              className={cn(
                'flex-1 bg-slate-900/60 border border-slate-800/50 rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-600',
                'outline-none focus:border-slate-700/60',
                !isConnected && 'opacity-50 cursor-not-allowed',
              )}
            />
            <button
              onClick={handleSend}
              disabled={!isConnected || !input.trim()}
              className={cn(
                'p-1 rounded transition-colors',
                isConnected && input.trim()
                  ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                  : 'text-slate-700 cursor-not-allowed',
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </PanelFrame>
  );
}
