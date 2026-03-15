'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, SLOW, FAST } from '@/lib/animations';
import { Bot, Wifi, WifiOff, Send, Check, X, Loader2, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import PanelFrame from '../shared/PanelFrame';
import { useAdvisor } from '@/agents/useAdvisor';
import type { AgentMessage, AgentSuggestion } from '@/agents/types';
import type { PanelDensity } from '@/workspace/types';

// ─── Message Bubble ──────────────────────────────

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <motion.div
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={SLOW}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed',
          isUser && 'bg-blue-600/20 text-blue-200 border border-blue-500/20',
          !isUser && !isSystem && 'bg-slate-800/60 text-slate-300 border border-slate-700/40',
          isSystem && 'bg-slate-900/40 text-slate-400 italic text-sm border border-slate-800/30',
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ──────────────────────────

function PanelTypingIndicator() {
  return (
    <motion.div
      className="flex items-start"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={FAST}
    >
      <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/40 rounded-lg px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-400"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
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
      <p className="text-sm text-amber-200/80 leading-relaxed">{suggestion.content}</p>
      <div className="flex items-center gap-1.5">
        {suggestion.action && (
          <button
            onClick={() => onAccept(suggestion.id)}
            aria-label="Apply suggestion"
            className="flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded px-2 py-0.5 transition-colors"
          >
            <Check className="w-3 h-3" />
            Apply
          </button>
        )}
        <button
          onClick={() => onDismiss(suggestion.id)}
          aria-label="Dismiss suggestion"
          className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-400 bg-slate-800/40 hover:bg-slate-800/60 rounded px-2 py-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Rate Limit Countdown ────────────────────────

function useCountdown(targetMs: number | null): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!targetMs) { setRemaining(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) return;
      return requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [targetMs]);
  return remaining;
}

// ─── Rate Limit Banner ──────────────────────────

function PanelRateLimitBanner({ readyAt }: { readyAt: number | null }) {
  const seconds = useCountdown(readyAt);
  if (!readyAt || seconds <= 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-sm text-amber-300 flex items-center gap-2"
    >
      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="flex-1">Rate limited &mdash; ready in {seconds}s</span>
    </motion.div>
  );
}

// ─── Error Banner ───────────────────────────────

function PanelErrorBanner({
  error,
  onRetry,
  onDismiss,
}: {
  error: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCountdown(3);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          onRetry();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelAutoRetry = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20 text-sm text-red-300 flex items-center gap-2"
    >
      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
      <span className="flex-1 truncate">{error}</span>
      {countdown !== null && (
        <span className="text-xs text-red-400/70 shrink-0">
          retry in {countdown}s
        </span>
      )}
      <button
        onClick={() => { cancelAutoRetry(); onRetry(); }}
        aria-label="Retry now"
        className="text-red-400 hover:text-red-300 transition-colors shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => { cancelAutoRetry(); onDismiss(); }}
        aria-label="Dismiss error"
        className="text-red-400/60 hover:text-red-300 transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
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

export default function AdvisorPanel({ density }: { density?: PanelDensity }) {
  const {
    connectionState,
    isObserving,
    messages,
    suggestions,
    isProcessing,
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
  } = useAdvisor();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting' || connectionState === 'reconnecting';

  // Auto-scroll on new messages or typing indicator
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isProcessing]);

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
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <AnimatePresence>
            {isProcessing && <PanelTypingIndicator />}
          </AnimatePresence>
        </div>

        {/* Rate limit & error banners */}
        <AnimatePresence>
          {isThrottled && <PanelRateLimitBanner readyAt={rateLimitedUntil} />}
        </AnimatePresence>
        <AnimatePresence>
          {lastError && (
            <PanelErrorBanner
              error={lastError}
              onRetry={retryLastMessage}
              onDismiss={clearError}
            />
          )}
        </AnimatePresence>

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
              aria-label="Message to advisor"
              aria-describedby="advisor-panel-input-hint"
              className={cn(
                'flex-1 bg-slate-900/60 border border-slate-800/50 rounded px-2 py-1 text-sm text-slate-300 placeholder-slate-600',
                'outline-none focus:border-slate-700/60',
                !isConnected && 'opacity-50 cursor-not-allowed',
              )}
            />
            <span id="advisor-panel-input-hint" className="sr-only">
              Press Enter to send your message
            </span>
            <button
              onClick={handleSend}
              disabled={!isConnected || !input.trim()}
              aria-label="Send message"
              className={cn(
                'p-1 rounded transition-colors',
                isConnected && input.trim()
                  ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                  : 'text-slate-400 cursor-not-allowed',
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
